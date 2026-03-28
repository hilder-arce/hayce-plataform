import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

import { Role } from './entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

type RolePermissionRef = { _id?: string; nombre?: string } | string;

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVOS ROLES EN EL SISTEMA
  // ======================================================
  async create(createRoleDto: CreateRoleDto, creadoPor: string): Promise<Role> {
    const existingRole = await this.roleModel.findOne({
      nombre: createRoleDto.nombre,
    });
    if (existingRole) {
      throw new ConflictException(
        `Conflicto: El rol con el nombre "${createRoleDto.nombre}" ya existe`,
      );
    }

    if (createRoleDto.permisos && createRoleDto.permisos.length > 0) {
      for (const permisoId of createRoleDto.permisos) {
        await this.findOnePermission(permisoId);
      }
    }

    const role = new this.roleModel(createRoleDto);
    const savedRole = await role.save();

    await this.notificationsService.notificarNuevoRol(
      createRoleDto.nombre,
      creadoPor,
    );

    return savedRole;
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO COMPLETO DE ROLES ACTIVOS
  // ======================================================
  async findAll(): Promise<Role[]> {
    return await this.roleModel
      .find({ estado: true })
      .select('-__v')
      .populate({
        path: 'permisos',
        select: 'nombre descripcion estado modulo _id',
        populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
      })
      .exec();
  }

  // ======================================================
  // [ READ ] - BUSQUEDA DE ROL ACTIVO POR ID
  // ======================================================
  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel
      .findById(id)
      .select('-__v')
      .populate({
        path: 'permisos',
        select: 'nombre descripcion estado modulo _id',
        populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
      })
      .exec();

    if (!role) throw new NotFoundException(`Rol con ID "${id}" no encontrado`);
    if (!role.estado)
      throw new NotFoundException('El rol solicitado se encuentra inactivo');

    return role;
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACION DE DATOS Y PERMISOS DE ROL
  // ======================================================
  async update(
    id: string,
    updateRoleDto: UpdateRoleDto,
    actualizadoPor = 'Sistema',
  ): Promise<Role> {
    const currentRole = await this.findOne(id);
    const currentPermissionMap = this.buildPermissionMap(
      currentRole.permisos as RolePermissionRef[],
    );

    if (updateRoleDto.permisos && updateRoleDto.permisos.length > 0) {
      for (const permissionId of updateRoleDto.permisos) {
        await this.findOnePermission(permissionId);
      }
    }

    const { permisos, permisosEliminar, ...otrosCampos } = updateRoleDto;
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

      updateData.permisos = [...finalPermissions];
    }

    await this.roleModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    const updatedRole = await this.findOne(id);
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
      actualizadoPor,
    );

    return updatedRole;
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACION LOGICA DE ROL
  // ======================================================
  async remove(id: string): Promise<Role> {
    const role = await this.findOne(id);
    role.estado = false;
    return await role.save();
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO DE ROLES INACTIVOS
  // ======================================================
  async findAllInactive(): Promise<Role[]> {
    return await this.roleModel
      .find({ estado: false })
      .select('-__v')
      .populate({
        path: 'permisos',
        select: 'nombre descripcion estado modulo _id',
        populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
      })
      .exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACION DE ROL ELIMINADO
  // ======================================================
  async restore(id: string): Promise<Role> {
    await this.findOneInactive(id);
    return (await this.roleModel
      .findByIdAndUpdate(id, { estado: true }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Role;
  }

  // ======================================================
  // [ READ ] - CONSULTA DE ROL INACTIVO POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Role> {
    const role = await this.roleModel
      .findById(id)
      .select('-__v')
      .populate({
        path: 'permisos',
        select: 'nombre descripcion estado modulo _id',
        populate: { path: 'modulo', select: 'nombre descripcion estado _id' },
      })
      .exec();

    if (!role) throw new NotFoundException('Rol no localizado');
    if (role.estado)
      throw new ConflictException('El rol consultado ya esta activo');

    return role;
  }

  // ======================================================
  // [ HELPERS ] - VALIDACION INTERNA DE PERMISOS
  // ======================================================
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
}
