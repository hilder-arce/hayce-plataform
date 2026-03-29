import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Organization } from 'src/organizations/entities/organization.entity';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { Worker } from './entities/worker.entity';

type ActorContext = {
  sub: string;
  organizationId?: string | null;
  esSuperAdmin?: boolean;
};

@Injectable()
export class WorkersService {
  constructor(
    @InjectModel(Worker.name) private readonly workerModel: Model<Worker>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
  ) {}

  async create(
    createWorkerDto: CreateWorkerDto,
    actor: ActorContext,
  ): Promise<Worker> {
    const organizationId = await this.resolveOrganizationId(
      actor,
      createWorkerDto.organization,
    );

    const newWorker = new this.workerModel({
      ...createWorkerDto,
      organization: new Types.ObjectId(organizationId),
      createdBy: new Types.ObjectId(actor.sub),
    });

    const saved = await newWorker.save();
    return this.findOne(saved._id.toString(), actor);
  }

  async findAll(actor: ActorContext): Promise<Worker[]> {
    return this.workerModel
      .find({ ...this.buildScope(actor), estado: true })
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .sort({ nombres: 1, apellidos: 1 })
      .exec();
  }

  async findOne(id: string, actor: ActorContext): Promise<Worker> {
    const worker = await this.workerModel
      .findById(id)
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .exec();

    if (!worker) {
      throw new NotFoundException(`Trabajador con ID "${id}" no encontrado`);
    }

    this.ensureAccess(actor, worker.organization);

    if (!worker.estado) {
      throw new NotFoundException('El trabajador se encuentra inactivo');
    }

    return worker;
  }

  async update(
    id: string,
    updateWorkerDto: UpdateWorkerDto,
    actor: ActorContext,
  ): Promise<Worker> {
    await this.findOne(id, actor);

    return (await this.workerModel
      .findByIdAndUpdate(
        id,
        {
          nombres: updateWorkerDto.nombres,
          apellidos: updateWorkerDto.apellidos,
          numero_telefono: updateWorkerDto.numero_telefono,
          correo: updateWorkerDto.correo,
        },
        { returnDocument: 'after' },
      )
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .exec()) as Worker;
  }

  async remove(id: string, actor: ActorContext): Promise<Worker> {
    await this.findOne(id, actor);
    await this.workerModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .exec();
    return this.findOneInactive(id, actor);
  }

  async findAllInactive(actor: ActorContext): Promise<Worker[]> {
    return this.workerModel
      .find({ ...this.buildScope(actor), estado: false })
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .sort({ nombres: 1, apellidos: 1 })
      .exec();
  }

  async restore(id: string, actor: ActorContext): Promise<Worker> {
    const worker = await this.findOneInactive(id, actor);
    worker.estado = true;
    await worker.save();
    return this.findOne(id, actor);
  }

  async findOneInactive(id: string, actor: ActorContext): Promise<Worker> {
    const worker = await this.workerModel
      .findById(id)
      .populate('organization')
      .populate('createdBy')
      .select('-__v')
      .exec();

    if (!worker) {
      throw new NotFoundException('Trabajador no localizado');
    }

    this.ensureAccess(actor, worker.organization);

    if (worker.estado) {
      throw new ConflictException('El trabajador ya esta activo');
    }

    return worker;
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
        'No puedes operar sobre trabajadores de otra organizacion',
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
      throw new ForbiddenException(
        'Debes seleccionar una organizacion valida para el trabajador',
      );
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
