import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Permission, PermissionSchema } from 'src/permissions/entities/permission.entity';
import { Role, RoleSchema } from 'src/roles/entities/role.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationsResolver } from './organizations.resolver';
import { Organization, OrganizationSchema } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  providers: [
    OrganizationsService,
    OrganizationsResolver,
    OrganizationResolver,
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
