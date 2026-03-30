import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/common/graphql/decorators/current-user.decorator';
import { PaginationArgs } from 'src/common/graphql/types/pagination.args';
import { MessageResponse } from 'src/common/graphql/types/message-response.type';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import {
  NotificationsPage,
  UnreadNotificationsCount,
} from './graphql/notifications-page.type';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationsPage)
  myNotifications(
@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean },    @Args() args: PaginationArgs,
  ) {
    return this.notificationsService.findMyNotifications(
      user.sub,
      args.page,
      args.limit,
      args.search ?? '',
    );
  }

  @Query(() => UnreadNotificationsCount)
  unreadNotifications(@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }) {
    return this.notificationsService.countUnread(user.sub);
  }

  @Mutation(() => MessageResponse)
  markNotificationAsRead(@Args('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Mutation(() => MessageResponse)
  markAllNotificationsAsRead(@CurrentUser() user: { sub: string; nombre?: string; esSuperAdmin?: boolean }) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Mutation(() => MessageResponse)
  removeNotification(@Args('id') id: string) {
    return this.notificationsService.removeNotification(id);
  }
}
