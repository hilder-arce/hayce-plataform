import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { User } from 'src/users/entities/user.entity';
import { Session } from './entities/session.entity';

@Resolver(() => Session)
export class SessionResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => User, { nullable: true })
  async usuario(@Parent() session: Session) {
    if (isPopulatedReference<User>(session.usuario, 'email')) {
      return session.usuario;
    }

    const userId = extractEntityId(session.usuario);
    return userId ? this.loaders.userById.load(userId) : null;
  }
}
