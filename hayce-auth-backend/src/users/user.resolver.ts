import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Role } from 'src/roles/entities/role.entity';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => Role, { nullable: true })
  async rol(@Parent() user: User) {
    if (isPopulatedReference<Role>(user.rol, 'nombre')) {
      return user.rol;
    }

    const roleId = extractEntityId(user.rol);
    return roleId ? this.loaders.roleById.load(roleId) : null;
  }

  @ResolveField(() => Organization, { nullable: true })
  async organization(@Parent() user: User) {
    if (isPopulatedReference<Organization>(user.organization, 'nombre')) {
      return user.organization;
    }

    const organizationId = extractEntityId(user.organization);
    return organizationId ? this.loaders.organizationById.load(organizationId) : null;
  }

  @ResolveField(() => User, { nullable: true })
  async createdBy(@Parent() user: User) {
    if (isPopulatedReference<User>(user.createdBy, 'nombre')) {
      return user.createdBy;
    }

    const creatorId = extractEntityId(user.createdBy);
    return creatorId ? this.loaders.userById.load(creatorId) : null;
  }

  @ResolveField(() => User, { nullable: true })
  async ownerAdmin(@Parent() user: User) {
    if (isPopulatedReference<User>(user.ownerAdmin, 'nombre')) {
      return user.ownerAdmin;
    }

    const ownerAdminId = extractEntityId(user.ownerAdmin);
    return ownerAdminId ? this.loaders.userById.load(ownerAdminId) : null;
  }
}
