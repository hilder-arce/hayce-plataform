import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity } from './entities/activity.entity';
import { Station } from 'src/stations/entities/station.entity';

@Injectable()
export class ActivitiesService {

  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    @InjectModel(Station.name) private readonly stationModel: Model<Station>
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVAS ACTIVIDADES
  // ======================================================
  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    // 1. VALIDACIÓN DE EXISTENCIA Y ESTADO DE LA ESTACIÓN ASOCIADA
    await this.findOneStation(createActivityDto.estacion);

    try {
      // 2. PERSISTENCIA DE LA ACTIVIDAD
      const newActivity = new this.activityModel(createActivityDto);
      const savedActivity = await newActivity.save();
      return await this.findOne(savedActivity._id.toString());
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(`Conflicto: Ya existe esta actividad en la estación seleccionada`);
      }
      throw error;
    }
  }

  // ======================================================
  // [ READ ] - LISTADO DE ACTIVIDADES ACTIVAS
  // ======================================================
  async findAll(): Promise<Activity[]> {
    return await this.activityModel.find({ estado: true })
      .select('-__v')
      .populate('estacion')
      .exec();
  }

  // ======================================================
  // [ READ ] - BÚSQUEDA DE ACTIVIDAD ACTIVA POR ID
  // ======================================================
  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id)
      .select('-__v')
      .populate('estacion')
      .exec();

    if (!activity) throw new NotFoundException(`Actividad con ID "${id}" no encontrada`);
    if (!activity.estado) throw new NotFoundException(`La actividad se encuentra inactiva`);

    return activity;
  }

  // ======================================================
  // [ READ ] - ACTIVIDADES POR ESTACIÓN
  // ======================================================
  async findByStation(stationId: string): Promise<Activity[]> {
    await this.findOneStation(stationId);
    return await this.activityModel.find({ estacion: stationId, estado: true })
      .select('-__v')
      .populate('estacion')
      .exec();
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACIÓN DE ACTIVIDAD
  // ======================================================
  async update(id: string, updateActivityDto: any): Promise<Activity> {
    const activity = await this.findOne(id);
    
    if (updateActivityDto.estacion) {
        await this.findOneStation(updateActivityDto.estacion);
    }

    await this.activityModel.findByIdAndUpdate(id, updateActivityDto, { returnDocument: 'after' })
      .select('-__v')
      .exec();

    return await this.findOne(id);
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA
  // ======================================================
  async remove(id: string): Promise<Activity> {
    await this.findOne(id);
    await this.activityModel.findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec();
    return await this.findOneInactive(id);
  }
  
  // ======================================================
  // [ READ ] - LISTADO DE ACTIVIDADES INACTIVAS
  // ======================================================
  async findAllInactive(): Promise<Activity[]> {
    return await this.activityModel.find({ estado: false })
      .select('-__v')
      .populate('estacion')
      .exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACIÓN DE ACTIVIDAD
  // ======================================================
  async restore(id: string): Promise<Activity> {
    const activity = await this.findOneInactive(id); 
    
    // Validar que la estación esté activa antes de restaurar la actividad
    const stationId = (activity.estacion as any)._id || activity.estacion;
    await this.findOneStation(stationId.toString());

    activity.estado = true;
    await activity.save();
    return await this.findOne(id);
  }

  // ======================================================
  // [ READ ] - CONSULTA DE ACTIVIDAD INACTIVA POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id)
      .select('-__v')
      .populate('estacion')
      .exec();

    if (!activity) throw new NotFoundException(`Actividad no localizada`);
    if (activity.estado) throw new ConflictException(`La actividad ya está activa`);

    return activity;
  }

  // ======================================================
  // [ HELPERS ] - VALIDACIÓN INTERNA DE ESTACIONES
  // ======================================================
  async findOneStation(id: string): Promise<Station> {
    const station = await this.stationModel.findById(id).exec();

    if (!station) throw new NotFoundException(`Estación de referencia no encontrada`);
    if (!station.estado) throw new ForbiddenException(`Operación denegada: La estación asociada está inactiva`);

    return station;
  }
}
