import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/entities/role.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AuthBootstrapService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const existingSuperAdmin = await this.userModel
      .findOne({ esSuperAdmin: true })
      .select('_id')
      .lean();

    if (existingSuperAdmin) {
      return;
    }

    let role = await this.roleModel.findOne({
      nombre: 'SuperAdmin',
      organization: null,
    });

    if (!role) {
      role = await this.roleModel.create({
        nombre: 'SuperAdmin',
        descripcion: 'Rol raíz del sistema',
        permisos: [],
        organization: null,
        createdBy: null,
        ownerAdmin: null,
        ancestryPath: [],
        estado: true,
      });
    }

    const nombre =
      this.configService.get<string>('SUPERADMIN_NAME') ?? 'Super Admin';
    const email =
      this.configService.get<string>('SUPERADMIN_EMAIL') ??
      'superadmin@hayce.local';
    const password =
      this.configService.get<string>('SUPERADMIN_PASSWORD') ??
      'ChangeMe123!';

    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = await this.userModel.create({
      nombre,
      email: email.trim().toLowerCase(),
      password: passwordHash,
      rol: role._id,
      organization: null,
      createdBy: null,
      ownerAdmin: null,
      ancestryPath: [],
      esSuperAdmin: true,
      estado: true,
    });

    this.logger.warn(
      `Superadmin inicial creado: ${superAdmin.email}. Actualiza SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en producción.`,
    );
  }
}
