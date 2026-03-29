import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AccessControlService } from 'src/auth/authorization/access-control.service';
import { Permission, PermissionSchema } from 'src/permissions/entities/permission.entity';
import { Role, RoleSchema } from 'src/roles/entities/role.entity';
import { UsersService } from './users.service';
import { UserSchema } from './entities/user.entity';

import { Organization, OrganizationSchema } from 'src/organizations/entities/organization.entity';
import { RolesModule } from 'src/roles/roles.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserResolver } from './user.resolver';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
    RolesModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [UsersService, UsersResolver, UserResolver, AccessControlService],
  exports: [UsersService],
})
export class UsersModule {}
