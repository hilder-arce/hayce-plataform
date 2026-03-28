import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphqlLoadersService } from 'src/common/graphql/graphql-loaders.service';
import {
  extractEntityId,
  isPopulatedReference,
} from 'src/common/graphql/utils/mongoose-ref.util';
import { User } from 'src/users/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly loaders: GraphqlLoadersService) {}

  @ResolveField(() => User, { nullable: true })
  async usuario(@Parent() notification: Notification) {
    if (isPopulatedReference<User>(notification.usuario, 'email')) {
      return notification.usuario;
    }

    const userId = extractEntityId(notification.usuario);
    return userId ? this.loaders.userById.load(userId) : null;
  }
}
