import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization } from 'src/organizations/entities/organization.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Activity } from './entities/activity.entity';
import { Station } from 'src/stations/entities/station.entity';

type ActorContext = {
  sub: string;
  organizationId?: string | null;
  esSuperAdmin?: boolean;
};

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
    @InjectModel(Station.name) private readonly stationModel: Model<Station>,
  ) {}

  async create(
    createActivityDto: CreateActivityDto,
    actor: ActorContext,
  ): Promise<Activity> {
    const station = await this.findOneStation(createActivityDto.estacion, actor);
    try {
      const newActivity = new this.activityModel({
        nombre: createActivityDto.nombre.trim(),
        descripcion: createActivityDto.descripcion.trim(),
        estacion: new Types.ObjectId(createActivityDto.estacion),
        organization: station.organization._id,
        createdBy: new Types.ObjectId(actor.sub),
      });

      const savedActivity = await newActivity.save();
      return this.findOne(savedActivity._id.toString(), actor);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe esta actividad en la estacion seleccionada para esta organizacion',
        );
      }
      throw error;
    }
  }

  async findAll(actor: ActorContext): Promise<Activity[]> {
    return this.activityModel
      .find({ ...this.buildScope(actor), estado: true })
      .select('-__v')
      .populate({
        path: 'estacion',
        populate: { path: 'organization' },
      })
      .populate('organization')
      .populate('createdBy')
      .sort({ createdAt: 1 })
      .exec();
  }

  async findOne(_id: string, actor: ActorContext): Promise<Activity> {
    const activity = await this.activityModel
      .findById(_id)
      .select('-__v')
      .populate({
        path: 'estacion',
        populate: { path: 'organization' },
      })
      .populate('organization')
      .populate('createdBy')
      .exec();

    if (!activity) {
      throw new NotFoundException(`Actividad con ID "${_id}" no encontrada`);
    }

    this.ensureAccess(actor, activity.organization);

    if (!activity.estado) {
      throw new NotFoundException('La actividad se encuentra inactiva');
    }

    return activity;
  }

  async findByStation(
    stationId: string,
    actor: ActorContext,
  ): Promise<Activity[]> {
    const station = await this.findOneStation(stationId, actor);

    return this.activityModel
      .find({
        estacion: new Types.ObjectId(this.extractId(station._id)),
        organization: new Types.ObjectId(this.extractId(station.organization)),
        estado: true,
      })
      .select('-__v')
      .populate('estacion')
      .populate('organization')
      .populate('createdBy')
      .sort({ nombre: 1 })
      .exec();
  }

  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
    actor: ActorContext,
  ): Promise<Activity> {
    const current = await this.findOne(id, actor);
    let organizationId = this.extractId(current.organization);

    if (updateActivityDto.estacion) {
      const station = await this.findOneStation(updateActivityDto.estacion, actor);
      organizationId = this.extractId(station.organization);
    }

    try {
      await this.activityModel.findByIdAndUpdate(
        id,
        {
          ...(updateActivityDto.nombre
            ? { nombre: updateActivityDto.nombre.trim() }
            : {}),
          ...(updateActivityDto.descripcion
            ? { descripcion: updateActivityDto.descripcion.trim() }
            : {}),
          ...(updateActivityDto.estacion
            ? { estacion: new Types.ObjectId(updateActivityDto.estacion) }
            : {}),
          organization: new Types.ObjectId(organizationId),
        },
        { returnDocument: 'after' },
      );

      return this.findOne(id, actor);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe esta actividad en la estacion seleccionada para esta organizacion',
        );
      }
      throw error;
    }
  }

  async remove(id: string, actor: ActorContext): Promise<Activity> {
    await this.findOne(id, actor);
    await this.activityModel.findByIdAndUpdate(
      id,
      { estado: false },
      { returnDocument: 'after' },
    );
    return this.findOneInactive(id, actor);
  }

  async findAllInactive(actor: ActorContext): Promise<Activity[]> {
    return this.activityModel
      .find({ ...this.buildScope(actor), estado: false })
      .select('-__v')
      .populate('estacion')
      .populate('organization')
      .populate('createdBy')
      .sort({ nombre: 1 })
      .exec();
  }

  async restore(id: string, actor: ActorContext): Promise<Activity> {
    const activity = await this.findOneInactive(id, actor);
    const stationId = this.extractId(activity.estacion);

    await this.findOneStation(stationId, actor);

    activity.estado = true;
    await activity.save();
    return this.findOne(id, actor);
  }

  async findOneInactive(id: string, actor: ActorContext): Promise<Activity> {
    const activity = await this.activityModel
      .findById(id)
      .select('-__v')
      .populate('estacion')
      .populate('organization')
      .populate('createdBy')
      .exec();

    if (!activity) {
      throw new NotFoundException('Actividad no localizada');
    }

    this.ensureAccess(actor, activity.organization);

    if (activity.estado) {
      throw new ConflictException('La actividad ya esta activa');
    }

    return activity;
  }

  async findOneStation(id: string, actor: ActorContext): Promise<Station> {
    const station = await this.stationModel
      .findById(id)
      .populate('organization')
      .populate('createdBy')
      .exec();

    if (!station) {
      throw new NotFoundException('Estacion de referencia no encontrada');
    }

    this.ensureAccess(actor, station.organization);

    if (!station.estado) {
      throw new ForbiddenException(
        'Operacion denegada: la estacion asociada esta inactiva',
      );
    }

    return station;
  }

  private buildScope(actor: ActorContext): Record<string, unknown> {
    if (actor.esSuperAdmin) {
      return {};
    }

    if (!actor.organizationId) {
      throw new ForbiddenException(
        'Tu usuario no tiene una organizacion asignada',
      );
    }

    return { organization: new Types.ObjectId(actor.organizationId) };
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
        'No puedes operar sobre actividades de otra organizacion',
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
}
