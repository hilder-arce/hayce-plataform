import {
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccessActor } from 'src/auth/authorization/access-control.service';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

import { Permission } from './entities/permission.entity';
import { Module } from 'src/modules/entities/module.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(Module.name) private readonly moduleModel: Model<Module>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVOS PERMISOS EN EL SISTEMA
  // ======================================================
  async create(
    createPermissionDto: CreatePermissionDto,
    creadoPor: AccessActor,
  ): Promise<Permission> {
    if (!creadoPor?.esSuperAdmin) {
      throw new ForbiddenException(
        'Solo el superadmin puede crear permisos globales',
      );
    }

    // 1. VALIDACIÓN DE EXISTENCIA Y ESTADO DEL MÓDULO ASOCIADO
    const module = await this.findOnemodule(createPermissionDto.modulo);

    try {
      // 2. PERSISTENCIA DEL PERMISO EN BASE DE DATOS
      const permission = new this.permissionModel(createPermissionDto);
      const savedPermission = await permission.save();

      // 3. NOTIFICACIÓN DE SEGURIDAD A ADMINISTRADORES
      await this.notificationsService.notificarNuevoPermiso(
        createPermissionDto.nombre,
        creadoPor?.nombre ?? 'Administrador',
      );

      return await this.findOne(savedPermission._id.toString());
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Conflicto: Ya existe un permiso con nombre "${createPermissionDto.nombre}" en el módulo "${module.nombre}"`,
        );
      }
      throw error;
    }
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO COMPLETO DE PERMISOS ACTIVOS
  // ======================================================
  async findAll(): Promise<Permission[]> {
    return await this.permissionModel
      .find({ estado: true })
      .select('-__v')
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();
  }

  // ======================================================
  // [ READ ] - BÚSQUEDA DE PERMISO ACTIVO POR ID
  // ======================================================
  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel
      .findById(id)
      .select('-__v')
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();

    if (!permission)
      throw new NotFoundException(`Permiso con ID "${id}" no encontrado`);
    if (!permission.estado)
      throw new NotFoundException(
        `El permiso solicitado se encuentra inactivo`,
      );

    return permission;
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACIÓN DE DATOS DE PERMISO
  // ======================================================
  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
    actor?: AccessActor,
  ): Promise<Permission> {
    if (!actor?.esSuperAdmin) {
      throw new ForbiddenException(
        'Solo el superadmin puede actualizar permisos globales',
      );
    }

    const permission = await this.findOne(id);
    const moduloId = this.extractModuleId(permission);

    // VALIDACIÓN DE INTEGRIDAD DEL MÓDULO
    await this.findOnemodule(moduloId);

    await this.permissionModel
      .findByIdAndUpdate(id, updatePermissionDto, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return await this.findOne(id);
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA DE PERMISO
  // ======================================================
  async remove(id: string): Promise<Permission> {
    throw new ForbiddenException('Debes enviar el contexto del usuario actual');
  }

  async removeWithActor(id: string, actor: AccessActor): Promise<Permission> {
    if (!actor?.esSuperAdmin) {
      throw new ForbiddenException(
        'Solo el superadmin puede desactivar permisos globales',
      );
    }

    const permission = await this.findOne(id);
    const moduloId = this.extractModuleId(permission);

    await this.findOnemodule(moduloId);

    await this.permissionModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return await this.findOneInactive(id);
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO DE PERMISOS INACTIVOS
  // ======================================================
  async findAllInactive(): Promise<Permission[]> {
    return await this.permissionModel
      .find({ estado: false })
      .select('-__v')
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACIÓN DE PERMISO ELIMINADO
  // ======================================================
  async restore(id: string): Promise<Permission> {
    throw new ForbiddenException('Debes enviar el contexto del usuario actual');
  }

  async restoreWithActor(id: string, actor: AccessActor): Promise<Permission> {
    if (!actor?.esSuperAdmin) {
      throw new ForbiddenException(
        'Solo el superadmin puede restaurar permisos globales',
      );
    }

    const permission = await this.permissionModel
      .findById(id)
      .select('-__v')
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();

    if (!permission)
      throw new NotFoundException(`Permiso no localizado para restauración`);
    if (permission.estado)
      throw new ConflictException(
        `El permiso ya se encuentra en estado activo`,
      );

    const moduloId = this.extractModuleId(permission);
    await this.findOnemodule(moduloId);

    permission.estado = true;
    await permission.save();
    return await this.findOne(id);
  }

  // ======================================================
  // [ READ ] - CONSULTA DE PERMISO INACTIVO POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Permission> {
    const permission = await this.permissionModel
      .findById(id)
      .select('-__v')
      .populate('modulo', 'nombre descripcion estado _id')
      .exec();

    if (!permission) throw new NotFoundException(`Permiso no encontrado`);
    if (permission.estado)
      throw new ConflictException(`El permiso consultado está activo`);

    return permission;
  }

  // ======================================================
  // [ HELPERS ] - VALIDACIÓN INTERNA DE MÓDULOS
  // ======================================================
  async findOnemodule(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).exec();

    if (!module)
      throw new NotFoundException(`Módulo de referencia no encontrado`);
    if (!module.estado)
      throw new ForbiddenException(
        `Operación denegada: El módulo asociado está inactivo`,
      );

    return module;
  }

  private extractModuleId(permission: Permission): string {
    const modulo = permission.modulo as any;

    if (modulo?._id) {
      return modulo._id.toString();
    }

    if (typeof modulo === 'string') {
      return modulo;
    }

    if (modulo?.toString) {
      return modulo.toString();
    }

    throw new NotFoundException(
      'No se pudo determinar el módulo asociado al permiso',
    );
  }

  // ======================================================
  // [ BATCH ] - OPERACIONES MASIVAS POR MÓDULO
  // ======================================================
  async removeByModuleId(id: string): Promise<void> {
    await this.permissionModel.updateMany({ modulo: id }, { estado: false });
  }

  async restoreByModuleId(id: string): Promise<void> {
    await this.permissionModel.updateMany({ modulo: id }, { estado: true });
  }
}
