import { Module } from '@nestjs/common';
import { AccessControlService } from 'src/auth/authorization/access-control.service';
import { RolesService } from './roles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from './entities/role.entity';
import { Organization, OrganizationSchema } from 'src/organizations/entities/organization.entity';
import { PermissionSchema } from 'src/permissions/entities/permission.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { RoleResolver } from './role.resolver';
import { RolesResolver } from './roles.resolver';

@Module({
  imports: [
    //REGISTRAMOS EL ESQUEMA DE ROL EN MONGODB
    MongooseModule.forFeature([
      { name: 'Role', schema: RoleSchema },
      { name: 'Permission', schema: PermissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [],
  providers: [RolesService, RolesResolver, RoleResolver, AccessControlService],
  exports: [RolesService], //EXPORTAMOS EL SERVICIO PARA USARLO EN OTROS MODULOS (EJ: AUTH)
})
export class RolesModule {}
