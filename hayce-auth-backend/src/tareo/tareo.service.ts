import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { ActivitiesService } from 'src/activities/activities.service';
import { Organization } from 'src/organizations/entities/organization.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { WorkersService } from 'src/workers/workers.service';
import { CreateTareoDto } from './dto/create-tareo.dto';
import { UpdateTareoDto } from './dto/update-tareo.dto';
import { EstadoTareo, Tareo } from './entities/tareo.entity';
import path from 'path';

type ActorContext = {
  sub: string;
  organizationId?: string | null;
  esSuperAdmin?: boolean;
};

@Injectable()
export class TareoService {
  constructor(
    @InjectModel(Tareo.name) private readonly tareoModel: Model<Tareo>,
    private readonly activitiesService: ActivitiesService,
    private readonly notificationsService: NotificationsService,
    private readonly workersService: WorkersService,
  ) {}

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
      throw new BadRequestException(
        'La hora de inicio no puede ser mayor que la hora final.',
      );
    }
  }

  private extractId(reference: unknown): string {
    if (!reference) {
      return '';
    }

    if (typeof reference === 'string') {
      return reference;
    }

    if (reference instanceof Types.ObjectId) {
      return reference.toString();
    }

    if (typeof reference === 'object' && reference !== null) {
      const maybeId = (reference as { id?: string; _id?: unknown }).id;
      if (typeof maybeId === 'string') {
        return maybeId;
      }

      const maybeMongoId = (reference as { _id?: unknown })._id;
      if (typeof maybeMongoId === 'string') {
        return maybeMongoId;
      }

      if (maybeMongoId instanceof Types.ObjectId) {
        return maybeMongoId.toString();
      }

      if (
        maybeMongoId &&
        typeof maybeMongoId === 'object' &&
        typeof (maybeMongoId as { toString?: () => string }).toString === 'function'
      ) {
        return (maybeMongoId as { toString: () => string }).toString();
      }
    }

    return '';
  }

  private async resolveStationName(
    activityId: string,
    requestedStationName: string,
    actor: ActorContext,
  ): Promise<{
    stationName: string;
    organizationId: string;
    activityOrganizationId: string;
  }> {
    const activity = await this.activitiesService.findOne(activityId, actor);
    const stationName = (activity.estacion as any)?.nombre;
    const organizationId = this.extractId(activity.organization);

    if (!stationName) {
      throw new BadRequestException(
        'La actividad seleccionada no tiene una estacion valida.',
      );
    }

    if (
      requestedStationName.trim().toLowerCase() !==
      stationName.trim().toLowerCase()
    ) {
      throw new BadRequestException(
        'La actividad seleccionada no pertenece a la estacion indicada.',
      );
    }

    return {
      stationName,
      organizationId,
      activityOrganizationId: organizationId,
    };
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
    const finProgramado = tareo.hora_fin
      ? this.buildScheduleDate(tareo.fecha, tareo.hora_fin)
      : null;
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

  private async populateTareo(id: string, actor: ActorContext): Promise<Tareo> {
    const tareo = await this.tareoModel
      .findById(id)
      .populate({
        path: 'trabajador',
        populate: { path: 'organization' },
      })
      .populate('creado_por')
      .populate('organization')
      .populate({
        path: 'actividad',
        populate: [
          {
            path: 'organization',
          },
          { path: 'estacion', populate: { path: 'organization' } }
        ],
      })
      .select('-__v')
      .exec();

    if (!tareo) {
      throw new NotFoundException(`Tareo con ID "${id}" no encontrado`);
    }

    this.ensureAccess(actor, tareo.organization);

    return this.applyLifecycleRules(tareo);
  }

  async create(
    createTareoDto: CreateTareoDto,
    actor: ActorContext,
  ): Promise<Tareo> {
    const worker = await this.workersService.findOne(
      createTareoDto.trabajador,
      actor,
    );
    this.validateTimeRange(
      createTareoDto.fecha,
      createTareoDto.hora_ini,
      createTareoDto.hora_fin,
    );

    const { stationName, organizationId } = await this.resolveStationName(
      createTareoDto.actividad,
      createTareoDto.estacion,
      actor,
    );

    const workerOrganizationId = this.extractId(worker.organization);
    if (workerOrganizationId !== organizationId) {
      throw new ForbiddenException(
        'El trabajador y la actividad deben pertenecer a la misma organizacion',
      );
    }

    const horas = this.calculateHours(
      createTareoDto.hora_ini,
      createTareoDto.hora_fin,
    );

    const newTareo = new this.tareoModel({
      ...createTareoDto,
      estacion: stationName,
      creado_por: new Types.ObjectId(actor.sub),
      organization: new Types.ObjectId(organizationId),
      horas,
    });

    const saved = await newTareo.save();
    return this.populateTareo(saved._id.toString(), actor);
  }

  async findAll(actor: ActorContext): Promise<Tareo[]> {
    if (!actor.esSuperAdmin && !actor.organizationId) {
      throw new ForbiddenException(
        'Tu usuario no tiene una organizacion asignada',
      );
    }

    const query = actor.esSuperAdmin
      ? { estado: true }
      : {
          estado: true,
          organization: new Types.ObjectId(actor.organizationId as string),
        };

    const tareos = await this.tareoModel
      .find(query)
      .populate({
        path: 'trabajador',
        populate: { path: 'organization' },
      })
      .populate('creado_por')
      .populate('organization')
      .populate({
        path: 'actividad',
          populate: [
            {
              path: 'organization',
            },
            { path: 'estacion', populate: { path: 'organization' } }
          ],
        })
      .select('-__v')
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(tareos.map((tareo) => this.applyLifecycleRules(tareo)));
  }

  async findOne(id: string, actor: ActorContext): Promise<Tareo> {
    return this.populateTareo(id, actor);
  }

  async update(
    id: string,
    updateTareoDto: UpdateTareoDto,
    actor: ActorContext,
  ): Promise<Tareo> {
    const current = await this.findOne(id, actor);

    const worker = updateTareoDto.trabajador
      ? await this.workersService.findOne(updateTareoDto.trabajador, actor)
      : current.trabajador;

    const fecha = updateTareoDto.fecha || current.fecha;
    const horaIni = updateTareoDto.hora_ini || current.hora_ini;
    const horaFin = updateTareoDto.hora_fin || current.hora_fin;

    this.validateTimeRange(fecha, horaIni, horaFin);

    let stationName = current.estacion;
    let organizationId = this.extractId(current.organization);

    if (updateTareoDto.actividad || updateTareoDto.estacion) {
      const resolved = await this.resolveStationName(
        updateTareoDto.actividad || this.extractId(current.actividad),
        updateTareoDto.estacion || current.estacion,
        actor,
      );
      stationName = resolved.stationName;
      organizationId = resolved.organizationId;
    }

    const workerOrganizationId = this.extractId(
      (worker as any)?.organization ?? current.organization,
    );
    if (workerOrganizationId !== organizationId) {
      throw new ForbiddenException(
        'El trabajador y la actividad deben pertenecer a la misma organizacion',
      );
    }

    const horas = this.calculateHours(horaIni, horaFin);
    const nextEstado = updateTareoDto.estado_tareo || current.estado_tareo;

    await this.tareoModel.findByIdAndUpdate(
      id,
      {
        ...updateTareoDto,
        estacion: stationName,
        organization: new Types.ObjectId(organizationId),
        horas,
        recordatorio_inicio_enviado:
          nextEstado === EstadoTareo.EN_DESARROLLO ||
          nextEstado === EstadoTareo.FINALIZADO
            ? true
            : current.recordatorio_inicio_enviado,
      },
      { returnDocument: 'after' },
    );

    return this.populateTareo(id, actor);
  }

  async remove(id: string, actor: ActorContext): Promise<Tareo> {
    await this.findOne(id, actor);
    await this.tareoModel.findByIdAndUpdate(
      id,
      { estado: false },
      { returnDocument: 'after' },
    );

    return this.populateTareo(id, actor);
  }

  async restore(id: string, actor: ActorContext): Promise<Tareo> {
    await this.findOne(id, actor);
    await this.tareoModel.findByIdAndUpdate(
      id,
      { estado: true },
      { returnDocument: 'after' },
    );

    return this.populateTareo(id, actor);
  }

  private ensureAccess(
    actor: ActorContext,
    organization?: Types.ObjectId | Organization | null,
  ): void {
    if (actor.esSuperAdmin) {
      return;
    }

    const organizationId = this.extractId(organization);
    if (!actor.organizationId || !organizationId || actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'No puedes operar sobre tareos de otra organizacion',
      );
    }
  }
}
