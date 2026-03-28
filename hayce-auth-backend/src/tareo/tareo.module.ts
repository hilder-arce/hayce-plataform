import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tareo, TareoSchema } from './entities/tareo.entity';
import { TareoService } from './tareo.service';
import { TareoResolver } from './tareo.resolver';
import { ActivitiesModule } from 'src/activities/activities.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { WorkersModule } from 'src/workers/workers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tareo.name, schema: TareoSchema }]),
    ActivitiesModule,
    NotificationsModule,
    WorkersModule,
  ],
  providers: [TareoService, TareoResolver],
  exports: [TareoService],
})
export class TareoModule {}
