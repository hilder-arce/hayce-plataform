import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { Worker } from './entities/worker.entity';

@Injectable()
export class WorkersService {

  constructor(
    @InjectModel(Worker.name) private readonly workerModel: Model<Worker>
  ) {}

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVOS TRABAJADORES
  // ======================================================
  async create(createWorkerDto: CreateWorkerDto): Promise<Worker> {
    const newWorker = new this.workerModel(createWorkerDto);
    return await newWorker.save();
  }

  // ======================================================
  // [ READ ] - LISTADO DE TRABAJADORES ACTIVOS
  // ======================================================
  async findAll(): Promise<Worker[]> {
    return await this.workerModel.find({ estado: true })
      .select('-__v')
      .exec();
  }

  // ======================================================
  // [ READ ] - BÚSQUEDA DE TRABAJADOR ACTIVO POR ID
  // ======================================================
  async findOne(id: string): Promise<Worker> {
    const worker = await this.workerModel.findById(id)
      .select('-__v')
      .exec();

    if (!worker) throw new NotFoundException(`Trabajador con ID "${id}" no encontrado`);
    if (!worker.estado) throw new NotFoundException(`El trabajador se encuentra inactivo`);

    return worker;
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACIÓN DE TRABAJADOR
  // ======================================================
  async update(id: string, updateWorkerDto: UpdateWorkerDto): Promise<Worker> {
    await this.findOne(id);
    return await this.workerModel.findByIdAndUpdate(id, updateWorkerDto, { returnDocument: 'after' })
      .select('-__v')
      .exec() as Worker;
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACIÓN LÓGICA
  // ======================================================
  async remove(id: string): Promise<Worker> {
    await this.findOne(id);
    return await this.workerModel.findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec() as Worker;
  }
  
  // ======================================================
  // [ READ ] - LISTADO DE TRABAJADORES INACTIVOS
  // ======================================================
  async findAllInactive(): Promise<Worker[]> {
    return await this.workerModel.find({ estado: false })
      .select('-__v')
      .exec();
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACIÓN DE TRABAJADOR
  // ======================================================
  async restore(id: string): Promise<Worker> {
    const worker = await this.findOneInactive(id); 
    worker.estado = true;
    return await worker.save();
  }

  // ======================================================
  // [ READ ] - CONSULTA DE TRABAJADOR INACTIVO POR ID
  // ======================================================
  async findOneInactive(id: string): Promise<Worker> {
    const worker = await this.workerModel.findById(id)
      .select('-__v')
      .exec();

    if (!worker) throw new NotFoundException(`Trabajador no localizado`);
    if (worker.estado) throw new ConflictException(`El trabajador ya está activo`);

    return worker;
  }
}
