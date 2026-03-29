import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization } from 'src/organizations/entities/organization.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { Station } from './entities/station.entity';

type ActorContext = {
  sub: string;
  organizationId?: string | null;
  esSuperAdmin?: boolean;
};

@Injectable()
export class StationsService {
  constructor(
    @InjectModel(Station.name) private readonly stationModel: Model<Station>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
  ) {}

  async create(
    createStationDto: CreateStationDto,
    actor: ActorContext,
  ): Promise<Station> {
    const organizationId = await this.resolveOrganizationId(
      actor,
      createStationDto.organization,
    );

    try {
      const newStation = new this.stationModel({
        nombre: createStationDto.nombre.trim(),
        descripcion: createStationDto.descripcion.trim(),
        organization: new Types.ObjectId(organizationId),
        createdBy: new Types.ObjectId(actor.sub),
      });

      const saved = await newStation.save();
      return this.findOne(saved._id.toString(), actor);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `Ya existe una estacion con el nombre "${createStationDto.nombre}" en esta organizacion`,
        );
      }
      throw error;
    }
  }

  async findAll(actor: ActorContext): Promise<Station[]> {
    return this.stationModel
      .find({ ...this.buildScope(actor), estado: true })
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .sort({ nombre: 1 })
      .exec();
  }

  async findOne(id: string, actor: ActorContext): Promise<Station> {
    const station = await this.stationModel
      .findById(id)
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .exec();

    if (!station) {
      throw new NotFoundException(`Estacion con ID "${id}" no encontrada`);
    }

    this.ensureAccess(actor, station.organization);

    if (!station.estado) {
      throw new NotFoundException('La estacion se encuentra inactiva');
    }

    return station;
  }

  async update(
    id: string,
    updateStationDto: UpdateStationDto,
    actor: ActorContext,
  ): Promise<Station> {
    await this.findOne(id, actor);

    try {
      await this.stationModel
        .findByIdAndUpdate(
          id,
          {
            ...(updateStationDto.nombre
              ? { nombre: updateStationDto.nombre.trim() }
              : {}),
            ...(updateStationDto.descripcion
              ? { descripcion: updateStationDto.descripcion.trim() }
              : {}),
          },
          { returnDocument: 'after' },
        )
        .exec();

      return this.findOne(id, actor);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          `Ya existe una estacion con el nombre "${updateStationDto.nombre}" en esta organizacion`,
        );
      }
      throw error;
    }
  }

  async remove(id: string, actor: ActorContext): Promise<Station> {
    await this.findOne(id, actor);
    await this.stationModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .exec();

    return this.findOneInactive(id, actor);
  }

  async findAllInactive(actor: ActorContext): Promise<Station[]> {
    return this.stationModel
      .find({ ...this.buildScope(actor), estado: false })
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .sort({ nombre: 1 })
      .exec();
  }

  async restore(id: string, actor: ActorContext): Promise<Station> {
    const station = await this.findOneInactive(id, actor);
    station.estado = true;
    await station.save();
    return this.findOne(id, actor);
  }

  async findOneInactive(id: string, actor: ActorContext): Promise<Station> {
    const station = await this.stationModel
      .findById(id)
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .exec();

    if (!station) {
      throw new NotFoundException('Estacion no localizada');
    }

    this.ensureAccess(actor, station.organization);

    if (station.estado) {
      throw new ConflictException('La estacion ya esta activa');
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

    const organizationId =
      (organization as Organization | undefined)?.id?.toString?.() ||
      (organization as Types.ObjectId | undefined)?.toString?.() ||
      null;

    if (!actor.organizationId || !organizationId || actor.organizationId !== organizationId) {
      throw new ForbiddenException(
        'No puedes operar sobre estaciones de otra organizacion',
      );
    }
  }

  private async resolveOrganizationId(
    actor: ActorContext,
    requestedOrganizationId?: string,
  ): Promise<string> {
    if (!actor.esSuperAdmin) {
      if (!actor.organizationId) {
        throw new ForbiddenException(
          'Tu usuario no tiene una organizacion asignada',
        );
      }

      return actor.organizationId;
    }

    if (!requestedOrganizationId) {
      throw new BadRequestOrganizationException();
    }

    const organization = await this.organizationModel
      .findById(requestedOrganizationId)
      .select('_id estado')
      .exec();

    if (!organization || !organization.estado) {
      throw new NotFoundException('Organizacion no encontrada o inactiva');
    }

    return organization._id.toString();
  }
}

class BadRequestOrganizationException extends ForbiddenException {
  constructor() {
    super('Debes seleccionar una organizacion valida para la estacion');
  }
}
