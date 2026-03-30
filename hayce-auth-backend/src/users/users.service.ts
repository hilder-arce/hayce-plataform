import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AccessControlService, AccessActor } from 'src/auth/authorization/access-control.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Role } from 'src/roles/entities/role.entity';
import { RolesService } from 'src/roles/roles.service';
import { Organization } from 'src/organizations/entities/organization.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    private readonly notificationsService: NotificationsService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(createUserDto: CreateUserDto, actorContext: AccessActor): Promise<User> {
    if (createUserDto.email) {
      const existingUser = await this.userModel
        .findOne({ email: createUserDto.email.trim().toLowerCase() })
        .exec();
      if (existingUser) {
        throw new ConflictException(
          `El correo "${createUserDto.email}" ya se encuentra registrado`,
        );
      }
    }

    const actor = await this.accessControlService.getActor(actorContext.sub);
    const organizationId = await this.resolveOrganizationId(actor, createUserDto.organization);
    const ownerAdminId = await this.resolveOwnerAdminId(actor, organizationId);
    const role = await this.accessControlService.validateRoleAssignment(actor, createUserDto.rol);

    if (role.organization?.toString() !== organizationId?.toString()) {
      throw new BadRequestException(
        'El rol seleccionado no pertenece a la organización destino',
      );
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const isRootOrgAdmin =
      actor.esSuperAdmin && !(await this.organizationHasOwnerAdmin(organizationId));

    try {
      const newUser = new this.userModel({
        nombre: createUserDto.nombre,
        email: createUserDto.email.trim().toLowerCase(),
        password: passwordHash,
        rol: new Types.ObjectId(createUserDto.rol),
        organization: organizationId ? new Types.ObjectId(organizationId) : null,
        createdBy: new Types.ObjectId(actor._id),
        ownerAdmin: isRootOrgAdmin
          ? undefined
          : ownerAdminId
            ? new Types.ObjectId(ownerAdminId)
            : null,
        ancestryPath: isRootOrgAdmin ? [] : this.accessControlService.buildAncestryPath(actor),
        esSuperAdmin: false,
      });

      const savedUser = await newUser.save();

      if (isRootOrgAdmin) {
        savedUser.ownerAdmin = new Types.ObjectId(savedUser._id);
        await savedUser.save();
      }

      await this.notificationsService.notificarNuevoUsuario(
        savedUser._id.toString(),
        createUserDto.nombre,
        (role as any)?.nombre ?? 'Sin rol',
        actor.nombre ?? 'Sistema',
      );

      return this.findOne(savedUser._id.toString(), actorContext);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Conflicto de duplicidad: El correo ya existe en el sistema',
        );
      }
      throw error;
    }
  }

  async findAll(
    page: number,
    limit: number,
    search: string,
    actorContext: AccessActor,
  ): Promise<{ items: User[]; total: number }> {
    return this.findByState(page, limit, search, true, actorContext);
  }

  async findAllInactive(
    page: number,
    limit: number,
    search: string,
    actorContext: AccessActor,
  ): Promise<{ items: User[]; total: number }> {
    return this.findByState(page, limit, search, false, actorContext);
  }

  async findOne(id: string, actorContext: AccessActor): Promise<User> {
    return this.findScopedUser(id, true, actorContext);
  }

  async findOneInactive(id: string, actorContext: AccessActor): Promise<User> {
    return this.findScopedUser(id, false, actorContext);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actorContext: AccessActor,
  ): Promise<User> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const currentUser = await this.findScopedUser(id, true, actorContext);

    this.assertCanManageUser(actor, currentUser);

    const { rol, organization, ...otrosCampos } = updateUserDto as UpdateUserDto & {
      organization?: string;
    };
    const updateData: Record<string, unknown> = { ...otrosCampos };
    let nuevoRolNombre: string | null = null;
    const rolAnteriorNombre = (currentUser.rol as any)?.nombre ?? 'Sin rol';

    if (rol) {
      const nuevoRol = await this.accessControlService.validateRoleAssignment(actor, rol);
      if (nuevoRol.organization?.toString() !== currentUser.organization?._id.toString()) {
        throw new BadRequestException(
          'No puedes asignar un rol de otra organización',
        );
      }

      updateData.rol = rol;
      nuevoRolNombre = (nuevoRol as any)?.nombre ?? 'Sin rol';
    }

    if (organization && actor.esSuperAdmin) {
      throw new BadRequestException(
        'La organización de un usuario no se cambia desde esta operación',
      );
    }

    await this.userModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .select('-__v -password')
      .exec();

    const updatedUser = await this.findOne(id, actorContext);

    if (nuevoRolNombre && nuevoRolNombre !== rolAnteriorNombre) {
      await this.notificationsService.notificarCambioRol(
        id,
        currentUser.nombre,
        rolAnteriorNombre,
        nuevoRolNombre,
        actor.nombre ?? 'Administrador',
      );
    }

    return updatedUser;
  }

  async remove(id: string, actorContext: AccessActor): Promise<User> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const user = await this.findScopedUser(id, true, actorContext);
    this.assertCanManageUser(actor, user);

    if (user.ownerAdmin?.toString() === user._id.toString() && !actor.esSuperAdmin) {
      throw new ForbiddenException(
        'No puedes desactivar al administrador principal de la organización',
      );
    }

    await this.userModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return this.findOneInactive(id, actorContext);
  }

  async reactivate(id: string, actorContext: AccessActor): Promise<User> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const user = await this.findScopedUser(id, false, actorContext);
    this.assertCanManageUser(actor, user);

    await this.userModel
      .findByIdAndUpdate(id, { estado: true }, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return this.findOne(id, actorContext);
  }

  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ mensaje: string }> {
    const user = await this.userModel
      .findOne({ _id: id, estado: true })
      .select('+password')
      .exec();

    if (!user)
      throw new NotFoundException(
        'Usuario no encontrado para actualización de seguridad',
      );

    const isMatch = await bcrypt.compare(dto.passwordActual, user.password);
    if (!isMatch)
      throw new BadRequestException(
        'La validación de identidad falló: Contraseña actual incorrecta',
      );

    user.password = await bcrypt.hash(dto.passwordNuevo, 10);
    await user.save();

    await this.notificationsService.notificarCambioPassword(id, user.nombre);

    return { mensaje: 'La contraseña ha sido actualizada exitosamente' };
  }

  async adminChangePassword(
    id: string,
    dto: AdminChangePasswordDto,
    actorContext: AccessActor,
  ): Promise<{ mensaje: string }> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const user = await this.findScopedUser(id, true, actorContext);
    this.assertCanManageUser(actor, user);

    const passwordHash = await bcrypt.hash(dto.passwordNuevo, 10);
    await this.userModel.findByIdAndUpdate(id, { password: passwordHash }).exec();

    await this.notificationsService.notificarCambioPassword(id, user.nombre);

    return {
      mensaje: 'Reseteo de contraseña administrativa completado exitosamente',
    };
  }

  async updateOwnProfile(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const { rol, organization, ...safeUpdateData } = updateUserDto as UpdateUserDto & {
      organization?: string;
    };
    void rol;
    void organization;

    await this.userModel
      .findByIdAndUpdate(id, safeUpdateData, { returnDocument: 'after' })
      .select('-__v -password')
      .exec();

    return (await this.userModel
      .findOne({ _id: id, estado: true })
      .select('-__v -password')
      .populate(this.userPopulation())
      .exec()) as User;
  }

  private async findByState(
    page: number,
    limit: number,
    search: string,
    estado: boolean,
    actorContext: AccessActor,
  ): Promise<{ items: User[]; total: number }> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const query = this.buildScopeQuery(actor, estado, search);

    const [items, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-__v -password')
        .populate(this.userPopulation())
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ nombre: 1 })
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return { items, total };
  }

  private async findScopedUser(
    id: string,
    estado: boolean,
    actorContext: AccessActor,
  ): Promise<User> {
    const actor = await this.accessControlService.getActor(actorContext.sub);
    const user = (await this.userModel
      .findOne({ _id: id, estado })
      .select('-__v -password')
      .populate(this.userPopulation())
      .exec()) as User;

    if (!user) {
      throw new NotFoundException(
        `Usuario ${estado ? 'activo' : 'inactivo'} con ID "${id}" no encontrado`,
      );
    }

    if (!actor.esSuperAdmin) {
      this.accessControlService.ensureSameOrganization(actor, user.organization);
      if (
        actor._id.toString() !== user._id.toString() &&
        !this.accessControlService.canManageDescendant(actor, user)
      ) {
        throw new ForbiddenException(
          'No puedes gestionar usuarios fuera de tu alcance jerárquico',
        );
      }
    }

    return user;
  }

  private assertCanManageUser(actor: User, target: User): void {
    if (actor.esSuperAdmin) {
      return;
    }

    this.accessControlService.ensureSameOrganization(actor, target.organization);

    if (actor._id.toString() === target._id.toString()) {
      return;
    }

    if (!this.accessControlService.canManageDescendant(actor, target)) {
      throw new ForbiddenException(
        'No puedes gestionar usuarios fuera de tu subárbol',
      );
    }
  }

  private buildScopeQuery(actor: User, estado: boolean, search: string) {
    const query: Record<string, any> = { estado };

    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (actor.esSuperAdmin) {
      return query;
    }

    query.organization = actor.organization;

    if (!this.accessControlService.canManageWholeOrganization(actor)) {
      query.$and = [
        ...(query.$and ?? []),
        {
          $or: [
            { _id: actor._id },
            { createdBy: actor._id },
            { ancestryPath: actor._id },
          ],
        },
      ];
    }

    return query;
  }

  private userPopulation() {
    return [
      {
        path: 'rol',
        select: 'nombre descripcion estado permisos organization createdBy ownerAdmin ancestryPath _id',
        populate: {
          path: 'permisos',
          select: 'nombre descripcion estado modulo _id',
          populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
        },
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

  private async resolveOrganizationId(
    actor: User,
    requestedOrganizationId?: string,
  ): Promise<string> {
    if (actor.esSuperAdmin) {
      if (!requestedOrganizationId) {
        throw new BadRequestException(
          'Debes indicar la organización para crear el usuario',
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

  private async organizationHasOwnerAdmin(organizationId: string): Promise<boolean> {
    const ownerAdmin = await this.userModel
      .exists({
        organization: new Types.ObjectId(organizationId),
        estado: true,
        $expr: { $eq: ['$_id', '$ownerAdmin'] },
      });

    return !!ownerAdmin;
  }
}
