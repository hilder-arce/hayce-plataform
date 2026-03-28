import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
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
}
