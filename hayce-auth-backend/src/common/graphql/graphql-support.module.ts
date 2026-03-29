import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphqlLoadersService } from './graphql-loaders.service';
import {
  Module as SystemModule,
  ModuleSchema,
} from 'src/modules/entities/module.entity';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/entities/permission.entity';
import {
  Organization,
  OrganizationSchema,
} from 'src/organizations/entities/organization.entity';
import { Role, RoleSchema } from 'src/roles/entities/role.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: SystemModule.name, schema: ModuleSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [GraphqlLoadersService],
  exports: [GraphqlLoadersService],
})
export class GraphqlSupportModule {}
