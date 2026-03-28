import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Notification } from '../entities/notification.entity';

@ObjectType()
export class NotificationsPage {
  @Field(() => [Notification])
  items: Notification[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pages: number;
}

@ObjectType()
export class UnreadNotificationsCount {
  @Field(() => Int)
  total: number;
}
