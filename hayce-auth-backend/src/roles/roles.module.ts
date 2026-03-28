import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from './entities/role.entity';
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
    ]),
    NotificationsModule,
  ],
  controllers: [],
  providers: [RolesService, RolesResolver, RoleResolver],
  exports: [RolesService], //EXPORTAMOS EL SERVICIO PARA USARLO EN OTROS MODULOS (EJ: AUTH)
})
export class RolesModule {}
