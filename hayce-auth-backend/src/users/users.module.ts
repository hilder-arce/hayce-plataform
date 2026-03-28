import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UserSchema } from './entities/user.entity';

import { RolesModule } from 'src/roles/roles.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserResolver } from './user.resolver';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    RolesModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [UsersService, UsersResolver, UserResolver],
  exports: [UsersService],
})
export class UsersModule {}
