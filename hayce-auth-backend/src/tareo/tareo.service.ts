import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ActivitiesService } from 'src/activities/activities.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { WorkersService } from 'src/workers/workers.service';
import { CreateTareoDto } from './dto/create-tareo.dto';
import { UpdateTareoDto } from './dto/update-tareo.dto';
import { EstadoTareo, Tareo } from './entities/tareo.entity';

@Injectable()
export class TareoService {
  constructor(
    @InjectModel(Tareo.name) private readonly tareoModel: Model<Tareo>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
    private readonly workersService: WorkersService,
  ) {}

  // ======================================================
  // [ HELPERS ] - CALCULO, VALIDACION Y CICLO DE VIDA
  // ======================================================
  private calculateHours(horaIni: Date, horaFin?: Date): number {
    if (!horaFin) return 0;

    const diffMs = new Date(horaFin).getTime() - new Date(horaIni).getTime();
    if (diffMs < 0) return 0;

    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  private buildScheduleDate(baseDate: Date, timeDate: Date): Date {
    const fecha = new Date(baseDate);
    const hora = new Date(timeDate);

    return new Date(
      fecha.getUTCFullYear(),
      fecha.getUTCMonth(),
      fecha.getUTCDate(),
      hora.getUTCHours(),
      hora.getUTCMinutes(),
      hora.getUTCSeconds(),
      hora.getUTCMilliseconds(),
    );
  }

  private validateTimeRange(fecha: Date, horaIni: Date, horaFin?: Date): void {
    if (!horaFin) {
      return;
    }

    const inicio = this.buildScheduleDate(fecha, horaIni);
    const fin = this.buildScheduleDate(fecha, horaFin);

    if (inicio.getTime() > fin.getTime()) {
      throw new BadRequestException('La hora de inicio no puede ser mayor que la hora final.');
    }
  }

  private async resolveStationName(activityId: string, requestedStationName: string): Promise<string> {
    const activity = await this.activitiesService.findOne(activityId);
    const stationName = (activity.estacion as any)?.nombre;

    if (!stationName) {
      throw new BadRequestException('La actividad seleccionada no tiene una estacion valida.');
    }

    if (requestedStationName.trim().toLowerCase() !== stationName.trim().toLowerCase()) {
      throw new BadRequestException('La actividad seleccionada no pertenece a la estacion indicada.');
    }

    return stationName;
  }

  private extractId(reference: unknown): string {
    if (!reference) {
      return '';
    }

    if (typeof reference === 'string') {
      return reference;
    }

    if (typeof reference === 'object' && reference !== null) {
      const maybeId = (reference as { id?: string; _id?: { toString?: () => string } | string }).id;
      if (typeof maybeId === 'string') {
        return maybeId;
      }

      const maybeMongoId = (reference as { _id?: { toString?: () => string } | string })._id;
      if (typeof maybeMongoId === 'string') {
        return maybeMongoId;
      }

      if (maybeMongoId && typeof maybeMongoId === 'object' && typeof maybeMongoId.toString === 'function') {
        return maybeMongoId.toString();
      }
    }

    return '';
  }

  private async notifyStartReminder(tareo: Tareo): Promise<void> {
    const creatorId = this.extractId(tareo.creado_por);
    if (!creatorId) {
      return;
    }

    await this.notificationsService.createSystemNotification(creatorId, {
      tipo: 'recordatorio_tareo',
      titulo: 'Tareo pendiente por iniciar',
      mensaje: `El tareo ${tareo.numero_operacion} ya alcanzo su hora de inicio programada.`,
      data: {
        tareoId: tareo.id,
        numero_operacion: tareo.numero_operacion,
        estacion: tareo.estacion,
        fecha: tareo.fecha,
        hora_ini: tareo.hora_ini,
      },
    });
  }

  private async applyLifecycleRules(tareo: Tareo): Promise<Tareo> {
    const now = new Date();
    const inicioProgramado = this.buildScheduleDate(tareo.fecha, tareo.hora_ini);
    const finProgramado = tareo.hora_fin ? this.buildScheduleDate(tareo.fecha, tareo.hora_fin) : null;
    let changed = false;

    if (
      tareo.estado_tareo === EstadoTareo.POR_INICIAR &&
      now.getTime() >= inicioProgramado.getTime() &&
      !tareo.recordatorio_inicio_enviado
    ) {
      await this.notifyStartReminder(tareo);
      tareo.recordatorio_inicio_enviado = true;
      changed = true;
    }

    if (
      tareo.estado_tareo === EstadoTareo.EN_DESARROLLO &&
      finProgramado &&
      now.getTime() >= finProgramado.getTime()
    ) {
      tareo.estado_tareo = EstadoTareo.FINALIZADO;
      changed = true;
    }

    if (changed) {
      await tareo.save();
    }

    return tareo;
  }

  private async populateTareo(id: string): Promise<Tareo> {
    const tareo = await this.tareoModel.findById(id)
      .populate('trabajador')
      .populate('creado_por')
      .populate({
        path: 'actividad',
        populate: { path: 'estacion' },
      })
      .select('-__v')
      .exec();

    if (!tareo) {
      throw new NotFoundException(`Tareo con ID "${id}" no encontrado`);
    }

    return this.applyLifecycleRules(tareo);
  }

  // ======================================================
  // [ CREATE ] - REGISTRO DE NUEVO TAREO
  // ======================================================
  async create(createTareoDto: CreateTareoDto, creadoPorId: string): Promise<Tareo> {
    await this.workersService.findOne(createTareoDto.trabajador);
    this.validateTimeRange(createTareoDto.fecha, createTareoDto.hora_ini, createTareoDto.hora_fin);

    const stationName = await this.resolveStationName(createTareoDto.actividad, createTareoDto.estacion);
    const horas = this.calculateHours(createTareoDto.hora_ini, createTareoDto.hora_fin);

    const newTareo = new this.tareoModel({
      ...createTareoDto,
      estacion: stationName,
      creado_por: new Types.ObjectId(creadoPorId),
      horas,
    });

    const saved = await newTareo.save();
    return this.populateTareo(saved._id.toString());
  }

  // ======================================================
  // [ READ ] - LISTADO DE TAREOS ACTIVOS
  // ======================================================
  async findAll(): Promise<Tareo[]> {
    const tareos = await this.tareoModel.find({ estado: true })
      .populate('trabajador')
      .populate('creado_por')
      .populate({
        path: 'actividad',
        populate: { path: 'estacion' },
      })
      .select('-__v')
      .exec();

    return Promise.all(tareos.map((tareo) => this.applyLifecycleRules(tareo)));
  }

  // ======================================================
  // [ READ ] - BUSQUEDA DE TAREO POR ID
  // ======================================================
  async findOne(id: string): Promise<Tareo> {
    return this.populateTareo(id);
  }

  // ======================================================
  // [ UPDATE ] - ACTUALIZACION DE TAREO
  // ======================================================
  async update(id: string, updateTareoDto: UpdateTareoDto): Promise<Tareo> {
    const current = await this.findOne(id);

    if (updateTareoDto.trabajador) {
      await this.workersService.findOne(updateTareoDto.trabajador);
    }

    const fecha = updateTareoDto.fecha || current.fecha;
    const horaIni = updateTareoDto.hora_ini || current.hora_ini;
    const horaFin = updateTareoDto.hora_fin || current.hora_fin;

    this.validateTimeRange(fecha, horaIni, horaFin);

    let stationName = current.estacion;
    if (updateTareoDto.actividad || updateTareoDto.estacion) {
      stationName = await this.resolveStationName(
        updateTareoDto.actividad || this.extractId(current.actividad),
        updateTareoDto.estacion || current.estacion,
      );
    }

    const horas = this.calculateHours(horaIni, horaFin);
    const nextEstado = updateTareoDto.estado_tareo || current.estado_tareo;

    await this.tareoModel.findByIdAndUpdate(
      id,
      {
        ...updateTareoDto,
        estacion: stationName,
        horas,
        recordatorio_inicio_enviado:
          nextEstado === EstadoTareo.EN_DESARROLLO || nextEstado === EstadoTareo.FINALIZADO
            ? true
            : current.recordatorio_inicio_enviado,
      },
      { returnDocument: 'after' },
    ).exec();

    return this.populateTareo(id);
  }

  // ======================================================
  // [ DELETE ] - DESACTIVACION LOGICA
  // ======================================================
  async remove(id: string): Promise<Tareo> {
    await this.tareoModel.findByIdAndUpdate(
      id,
      { estado: false },
      { returnDocument: 'after' },
    ).exec();

    return this.populateTareo(id);
  }

  // ======================================================
  // [ RESTORE ] - REACTIVACION
  // ======================================================
  async restore(id: string): Promise<Tareo> {
    await this.tareoModel.findByIdAndUpdate(
      id,
      { estado: true },
      { returnDocument: 'after' },
    ).exec();

    return this.populateTareo(id);
  }
}
