import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from './entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(Station.name) private readonly stationModel: Model<Station>,
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVAS ESTACIONES
  // ======================================================
  async create(createStationDto: CreateStationDto): Promise<Station> {
    try {
      const newStation = new this.stationModel(createStationDto);
      return await newStation.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException(
          `Conflicto: La estación con el nombre "${createStationDto.nombre}" ya existe`,
        );
      }
      throw error;
    }
  }

  // ======================================================
  // [ READ ] - LISTADO DE ESTACIONES ACTIVAS
  // ======================================================
  async findAll(): Promise<Station[]> {
    return await this.stationModel.find({ estado: true }).select('-__v').exec();
  }

  // ======================================================
  // [ READ ] - BÚSQUEDA DE ESTACIÓN ACTIVA POR ID
  // ======================================================
  async findOne(id: string): Promise<Station> {
    const station = await this.stationModel.findById(id).select('-__v').exec();

    if (!station)
      throw new NotFoundException(`Estación con ID "${id}" no encontrada`);
    if (!station.estado)
      throw new NotFoundException(`La estación se encuentra inactiva`);

    return station;
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACIÓN DE ESTACIÓN
  // ======================================================
  async update(
    id: string,
    updateStationDto: UpdateStationDto,
  ): Promise<Station> {
    await this.findOne(id);
    return (await this.stationModel
      .findByIdAndUpdate(id, updateStationDto, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Station;
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA
  // ======================================================
  async remove(id: string): Promise<Station> {
    await this.findOne(id);
    return (await this.stationModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Station;
  }

  // ======================================================
  // [ READ ] - LISTADO DE ESTACIONES INACTIVAS
  // ======================================================
  async findAllInactive(): Promise<Station[]> {
    return await this.stationModel
      .find({ estado: false })
      .select('-__v')
      .exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACIÓN DE ESTACIÓN
  // ======================================================
  async restore(id: string): Promise<Station> {
    const station = await this.findOneInactive(id);
    station.estado = true;
    return await station.save();
  }

  // ======================================================
  // [ READ ] - CONSULTA DE ESTACIÓN INACTIVA POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Station> {
    const station = await this.stationModel.findById(id).select('-__v').exec();

    if (!station) throw new NotFoundException(`Estación no localizada`);
    if (station.estado)
      throw new ConflictException(`La estación ya está activa`);

    return station;
  }
}
