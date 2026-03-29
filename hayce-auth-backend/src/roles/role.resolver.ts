import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';
import { Role } from './entities/role.entity';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => [Permission], { defaultValue: [] })
  async permisos(@Parent() role: Role) {
    const refs = role.permisos ?? [];
    return Promise.all(
      refs.map((permission) => {
        if (isPopulatedReference<Permission>(permission, 'descripcion')) {
          return permission;
        }

        const permissionId = extractEntityId(permission);
        return permissionId
          ? this.loaders.permissionById.load(permissionId)
          : null;
      }),
    ).then((permissions) =>
      permissions.filter(
        (permission): permission is Permission => !!permission,
      ),
    );
  }

  @ResolveField(() => Organization, { nullable: true })
  async organization(@Parent() role: Role) {
    if (isPopulatedReference<Organization>(role.organization, 'nombre')) {
      return role.organization;
    }

    const organizationId = extractEntityId(role.organization);
    return organizationId
      ? this.loaders.organizationById.load(organizationId)
      : null;
  }

  @ResolveField(() => User, { nullable: true })
  async createdBy(@Parent() role: Role) {
    if (isPopulatedReference<User>(role.createdBy, 'nombre')) {
      return role.createdBy;
    }

    const userId = extractEntityId(role.createdBy);
    return userId ? this.loaders.userById.load(userId) : null;
  }

  @ResolveField(() => User, { nullable: true })
  async ownerAdmin(@Parent() role: Role) {
    if (isPopulatedReference<User>(role.ownerAdmin, 'nombre')) {
      return role.ownerAdmin;
    }

    const userId = extractEntityId(role.ownerAdmin);
    return userId ? this.loaders.userById.load(userId) : null;
  }
}
