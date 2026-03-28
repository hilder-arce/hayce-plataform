import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

import { Module } from './entities/module.entity';
import { PermissionsService } from 'src/permissions/permissions.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectModel(Module.name) private readonly moduleModel: Model<Module>,
    private readonly permissionService: PermissionsService,
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVOS MÓDULOS EN EL SISTEMA
  // ======================================================
  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    try {
      // PERSISTENCIA DEL NUEVO MÓDULO EN BASE DE DATOS
      const newModule = new this.moduleModel(createModuleDto);
      return await newModule.save();
    } catch (error) {
      // VALIDACIÓN DE DUPLICIDAD POR NOMBRE DE MÓDULO
      if (error.code === 11000) {
        throw new ConflictException(
          `Conflicto: El módulo con el nombre "${createModuleDto.nombre}" ya existe en el sistema`,
        );
      }
      throw error;
    }
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO COMPLETO DE MÓDULOS ACTIVOS
  // ======================================================
  async findAll(): Promise<Module[]> {
    return await this.moduleModel.find({ estado: true }).select('-__v').exec();
  }

  // ======================================================
  // [ READ ] - BÚSQUEDA DE MÓDULO ACTIVO POR ID
  // ======================================================
  async findOne(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).select('-__v').exec();

    if (!module)
      throw new NotFoundException(`Módulo con ID "${id}" no encontrado`);
    if (!module.estado)
      throw new NotFoundException(`El módulo solicitado se encuentra inactivo`);

    return module;
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACIÓN DE DATOS DE MÓDULO
  // ======================================================
  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    // VALIDACIÓN PREVIA DE EXISTENCIA Y ESTADO
    await this.findOne(id);

    return (await this.moduleModel
      .findByIdAndUpdate(id, updateModuleDto, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Module;
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA DE MÓDULO Y PERMISOS
  // ======================================================
  async remove(id: string): Promise<Module> {
    await this.findOne(id);

    // DESACTIVACIÓN EN CASCADA DE PERMISOS ASOCIADOS
    await this.permissionService.removeByModuleId(id);

    return (await this.moduleModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Module;
  }

  // ======================================================
  // [ READ ] - OBTENER LISTADO DE MÓDULOS INACTIVOS
  // ======================================================
  async findAllInactive(): Promise<Module[]> {
    return await this.moduleModel.find({ estado: false }).select('-__v').exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACIÓN DE MÓDULO Y PERMISOS
  // ======================================================
  async restore(id: string): Promise<Module> {
    const module = await this.findOneInactive(id);

    module.estado = true;
    const restoredModule = await module.save();

    // REACTIVACIÓN EN CASCADA DE PERMISOS ASOCIADOS
    await this.permissionService.restoreByModuleId(id);

    return restoredModule;
  }

  // ======================================================
  // [ READ ] - CONSULTA DE MÓDULO INACTIVO POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).select('-__v').exec();

    if (!module) throw new NotFoundException(`Módulo no localizado`);
    if (module.estado)
      throw new ConflictException(`El módulo consultado ya está activo`);

    return module;
  }
}
