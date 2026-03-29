import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AccessActor, AccessControlService } from 'src/auth/authorization/access-control.service';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { User } from 'src/users/entities/user.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

type RolePermissionRef = { _id?: string; nombre?: string } | string;

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    private readonly notificationsService: NotificationsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(createRoleDto: CreateRoleDto, actorContext: AccessActor): Promise<Role> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const organizationId = await this.resolveOrganizationId(actor, createRoleDto.organization);

    const existingRole = await this.roleModel.findOne({
      nombre: createRoleDto.nombre,
      organization: organizationId ? new Types.ObjectId(organizationId) : null,
    });
    if (existingRole) {
      throw new ConflictException(
        `Conflicto: El rol con el nombre "${createRoleDto.nombre}" ya existe en esta organización`,
      );
    }

    const permissionIds = createRoleDto.permisos ?? [];
    if (permissionIds.length > 0) {
      await this.accessControlService.validatePermissionSubset(actor, permissionIds);
      for (const permisoId of permissionIds) {
        await this.findOnePermission(permisoId);
      }
    }

    const ownerAdminId = await this.resolveOwnerAdminId(actor, organizationId);
    const role = new this.roleModel({
      nombre: createRoleDto.nombre,
      descripcion: createRoleDto.descripcion,
      permisos: permissionIds,
      organization: organizationId ? new Types.ObjectId(organizationId) : null,
      createdBy: new Types.ObjectId(actor._id),
      ownerAdmin: ownerAdminId ? new Types.ObjectId(ownerAdminId) : null,
      ancestryPath: actor.esSuperAdmin ? [] : this.accessControlService.buildAncestryPath(actor),
    });
    const savedRole = await role.save();

    await this.notificationsService.notificarNuevoRol(
      createRoleDto.nombre,
      actor.nombre ?? 'Sistema',
    );

    return this.findOne(savedRole._id.toString(), actorContext);
  }

  async findAll(actorContext: AccessActor): Promise<Role[]> {
    const actor = await this.accessControlService.getActor(actorContext.sub);

    return this.roleModel
      .find(this.buildScopeQuery(actor, true))
      .select('-__v')
      .populate(this.rolePopulation())
      .sort({ nombre: 1 })
      .exec();
  }

  async findOne(id: string, actorContext?: AccessActor): Promise<Role> {
    const role = await this.findRole(id, true);

    if (actorContext) {
      const actor = await this.accessControlService.getActor(actorContext.sub);
      this.assertCanAccessRole(actor, role);
    }

    return role;
  }

  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    actorContext: AccessActor,
  ): Promise<Role> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const currentRole = await this.findOne(id, actorContext);

    this.assertCanManageRole(actor, currentRole);
    const currentPermissionMap = this.buildPermissionMap(
      currentRole.permisos as RolePermissionRef[],
    );

    const incomingAdditions = updateRoleDto.permisos ?? [];
    if (incomingAdditions.length > 0) {
      await this.accessControlService.validatePermissionSubset(actor, incomingAdditions);
      for (const permissionId of incomingAdditions) {
        await this.findOnePermission(permissionId);
      }
    }

    const { permisos, permisosEliminar, organization, ...otrosCampos } = updateRoleDto as UpdateRoleDto & {
      organization?: string;
    };
    void organization;

    const updateData: Record<string, unknown> = { ...otrosCampos };

    if (
      (permisos && permisos.length > 0) ||
      (permisosEliminar && permisosEliminar.length > 0)
    ) {
      const currentPermissionIds = [...currentPermissionMap.keys()];
      const finalPermissions = new Set(currentPermissionIds);

      if (permisosEliminar && permisosEliminar.length > 0) {
        for (const permissionId of permisosEliminar) {
          finalPermissions.delete(permissionId);
        }
      }

      if (permisos && permisos.length > 0) {
        for (const permissionId of permisos) {
          finalPermissions.add(permissionId);
        }
      }

      await this.accessControlService.validatePermissionSubset(actor, [...finalPermissions]);
      updateData.permisos = [...finalPermissions];
    }

    await this.roleModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    const updatedRole = await this.findOne(id, actorContext);
    const updatedPermissionMap = this.buildPermissionMap(
      updatedRole.permisos as RolePermissionRef[],
    );

    const permisosAgregados = [...updatedPermissionMap.entries()]
      .filter(([permissionId]) => !currentPermissionMap.has(permissionId))
      .map(([, permissionName]) => permissionName);

    const permisosEliminados = [...currentPermissionMap.entries()]
      .filter(([permissionId]) => !updatedPermissionMap.has(permissionId))
      .map(([, permissionName]) => permissionName);

    await this.notificationsService.emitirActualizacionPermisosRol(
      updatedRole._id.toString(),
      updatedRole.nombre,
      permisosAgregados,
      permisosEliminados,
      actor.nombre ?? 'Sistema',
    );

    return updatedRole;
  }

  async remove(id: string, actorContext: AccessActor): Promise<Role> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const role = await this.findOne(id, actorContext);
    this.assertCanManageRole(actor, role);

    await this.roleModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return this.findOneInactive(id, actorContext);
  }

  async findAllInactive(actorContext: AccessActor): Promise<Role[]> {
    const actor = await this.accessControlService.getActor(actorContext.sub);

    return this.roleModel
      .find(this.buildScopeQuery(actor, false))
      .select('-__v')
      .populate(this.rolePopulation())
      .sort({ nombre: 1 })
      .exec();
  }

  async restore(id: string, actorContext: AccessActor): Promise<Role> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const role = await this.findOneInactive(id, actorContext);
    this.assertCanManageRole(actor, role);

    await this.roleModel
      .findByIdAndUpdate(id, { estado: true }, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return this.findOne(id, actorContext);
  }

  async findOneInactive(id: string, actorContext?: AccessActor): Promise<Role> {
    const role = await this.findRole(id, false);

    if (actorContext) {
      const actor = await this.accessControlService.getActor(actorContext.sub);
      this.assertCanAccessRole(actor, role);
    }

    return role;
  }

  async findOnePermission(id: string): Promise<Permission> {
    const permission = await this.permissionModel
      .findById(id)
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();

    if (!permission)
      throw new NotFoundException('Permiso de referencia no encontrado');
    if (!permission.estado)
      throw new ConflictException(
        'Operacion denegada: El permiso asociado esta inactivo',
      );

    return permission;
  }

  private async findRole(id: string, estado: boolean): Promise<Role> {
    const role = await this.roleModel
      .findById(id)
      .select('-__v')
      .populate(this.rolePopulation())
      .exec();

    if (!role) throw new NotFoundException(`Rol con ID "${id}" no encontrado`);
    if (role.estado !== estado) {
      throw new NotFoundException(
        `El rol solicitado se encuentra ${estado ? 'inactivo' : 'activo'}`,
      );
    }

    return role;
  }

  private buildPermissionMap(
    permissions: RolePermissionRef[],
  ): Map<string, string> {
    return new Map(
      permissions
        .map((permission) => {
          if (typeof permission === 'string') {
            return [permission, permission] as const;
          }

          const permissionId = permission._id?.toString() ?? '';
          const permissionName = permission.nombre ?? permissionId;
          return [permissionId, permissionName] as const;
        })
        .filter(([permissionId]) => !!permissionId),
    );
  }

  private buildScopeQuery(actor: User, estado: boolean) {
    const query: Record<string, any> = { estado };

    if (actor.esSuperAdmin) {
      return query;
    }

    query.organization = actor.organization;

    if (!this.accessControlService.canManageWholeOrganization(actor)) {
      query.$or = [
        { createdBy: actor._id },
        { ancestryPath: actor._id },
      ];
    }

    return query;
  }

  private rolePopulation() {
    return [
      {
        path: 'permisos',
        select: 'nombre descripcion estado modulo _id',
        populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
      },
      {
        path: 'organization',
        select: 'nombre slug estado _id',
      },
      {
        path: 'createdBy',
        select: 'nombre email _id',
      },
      {
        path: 'ownerAdmin',
        select: 'nombre email _id',
      },
    ];
  }

  private assertCanAccessRole(actor: User, role: Role): void {
    if (actor.esSuperAdmin) {
      return;
    }

    this.accessControlService.ensureSameOrganization(actor, role.organization);
    if (!this.accessControlService.canManageWholeOrganization(actor) &&
        !this.accessControlService.canManageDescendant(actor, role)) {
      throw new ForbiddenException(
        'No puedes ver roles fuera de tu alcance jerárquico',
      );
    }
  }

  private assertCanManageRole(actor: User, role: Role): void {
    this.assertCanAccessRole(actor, role);

    if (!actor.esSuperAdmin && role.ownerAdmin?.toString() === role.createdBy?.toString() && role.createdBy?.toString() === role.ownerAdmin?.toString() && role.ownerAdmin?.toString() === actor.ownerAdmin?.toString() && !this.accessControlService.canManageWholeOrganization(actor)) {
      throw new ForbiddenException(
        'No puedes modificar roles fuera de tu subárbol',
      );
    }
  }

  private async resolveOrganizationId(
    actor: User,
    requestedOrganizationId?: string,
  ): Promise<string> {
    if (actor.esSuperAdmin) {
      if (!requestedOrganizationId) {
        throw new BadRequestException(
          'Debes indicar la organización para crear el rol',
        );
      }

      const organization = await this.organizationModel
        .findOne({ _id: requestedOrganizationId, estado: true })
        .select('_id')
        .exec();

      if (!organization) {
        throw new NotFoundException('Organización no encontrada');
      }

      return organization._id.toString();
    }

    if (!actor.organization) {
      throw new ForbiddenException(
        'Tu usuario no tiene una organización asignada',
      );
    }

    return actor.organization.toString();
  }

  private async resolveOwnerAdminId(
    actor: User,
    organizationId: string,
  ): Promise<string | null> {
    if (!actor.esSuperAdmin) {
      return actor.ownerAdmin?.toString() ?? actor._id.toString();
    }

    const ownerAdmin = await this.userModel
      .findOne({
        organization: new Types.ObjectId(organizationId),
        estado: true,
        $expr: { $eq: ['$_id', '$ownerAdmin'] },
      })
      .select('_id')
      .exec();

    return ownerAdmin?._id?.toString?.() ?? null;
  }
}
