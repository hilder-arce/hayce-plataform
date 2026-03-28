import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import {
  Notification,
  NotificationSchema,
} from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationResolver } from './notification.resolver';
import { NotificationsResolver } from './notifications.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    JwtModule,
  ],
  controllers: [],
  providers: [
    NotificationsService,
    NotificationsGateway,
    NotificationsResolver,
    NotificationResolver,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
