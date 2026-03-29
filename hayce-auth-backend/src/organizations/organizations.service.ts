import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';

type ActorContext = {
  sub: string;
  esSuperAdmin?: boolean;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
  ) {}

  async create(
    input: CreateOrganizationDto,
    actor: ActorContext,
  ): Promise<Organization> {
    this.assertSuperAdmin(actor);

    const organization = new this.organizationModel({
      ...input,
      slug: input.slug.toLowerCase().trim(),
      createdBy: new Types.ObjectId(actor.sub),
    });

    try {
      const savedOrganization = await organization.save();
      await this.createBaseAdministratorRole(savedOrganization, actor.sub);
      return savedOrganization;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe una organización con ese nombre o slug',
        );
      }

      throw error;
    }
  }

  async findAll(actor: ActorContext): Promise<Organization[]> {
    this.assertSuperAdmin(actor);

    return this.organizationModel
      .find({ estado: true })
      .select('-__v')
      .sort({ nombre: 1 })
      .exec();
  }

  async findAllInactive(actor: ActorContext): Promise<Organization[]> {
    this.assertSuperAdmin(actor);

    return this.organizationModel
      .find({ estado: false })
      .select('-__v')
      .sort({ nombre: 1 })
      .exec();
  }

  async findOne(id: string, actor?: ActorContext): Promise<Organization> {
    if (actor) {
      this.assertSuperAdmin(actor);
    }

    const organization = await this.organizationModel
      .findById(id)
      .select('-__v')
      .exec();

    if (!organization || !organization.estado) {
      throw new NotFoundException('Organización no encontrada');
    }

    return organization;
  }

  async findOneInactive(id: string, actor: ActorContext): Promise<Organization> {
    this.assertSuperAdmin(actor);

    const organization = await this.organizationModel
      .findById(id)
      .select('-__v')
      .exec();

    if (!organization || organization.estado) {
      throw new NotFoundException('Organización inactiva no encontrada');
    }

    return organization;
  }

  async update(
    id: string,
    input: UpdateOrganizationDto,
    actor: ActorContext,
  ): Promise<Organization> {
    this.assertSuperAdmin(actor);
    await this.findOne(id, actor);

    try {
      return (await this.organizationModel
        .findByIdAndUpdate(
          id,
          {
            ...input,
            ...(input.slug ? { slug: input.slug.toLowerCase().trim() } : {}),
          },
          { returnDocument: 'after' },
        )
        .select('-__v')
        .exec()) as Organization;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe una organización con ese nombre o slug',
        );
      }

      throw error;
    }
  }

  async remove(id: string, actor: ActorContext): Promise<Organization> {
    this.assertSuperAdmin(actor);
    await this.findOne(id, actor);

    return (await this.organizationModel
      .findByIdAndUpdate(id, { estado: false }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Organization;
  }

  async restore(id: string, actor: ActorContext): Promise<Organization> {
    this.assertSuperAdmin(actor);
    await this.findOneInactive(id, actor);

    return (await this.organizationModel
      .findByIdAndUpdate(id, { estado: true }, { returnDocument: 'after' })
      .select('-__v')
      .exec()) as Organization;
  }

  private assertSuperAdmin(actor: ActorContext): void {
    if (!actor.esSuperAdmin) {
      throw new ForbiddenException(
        'Solo el superadmin puede administrar organizaciones',
      );
    }
  }

  private async createBaseAdministratorRole(
    organization: Organization,
    actorId: string,
  ): Promise<void> {
    const existingAdminRole = await this.roleModel.findOne({
      organization: organization._id,
      nombre: 'Administrador',
    });

    if (existingAdminRole) {
      return;
    }

    const blockedPermissions = new Set([
      'crear_modulo',
      'actualizar_modulo',
      'eliminar_modulo',
      'crear_permiso',
      'actualizar_permisos',
      'eliminar_permiso',
    ]);

    const permissions = await this.permissionModel
      .find({ estado: true, nombre: { $nin: [...blockedPermissions] } })
      .select('_id')
      .exec();

    await this.roleModel.create({
      nombre: 'Administrador',
      descripcion:
        'Rol base de administración interna para la organización',
      permisos: permissions.map((permission) => permission._id.toString()),
      organization: organization._id,
      createdBy: new Types.ObjectId(actorId),
      ownerAdmin: null,
      ancestryPath: [],
      estado: true,
    });
  }
}
