import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Activity, ActivitySchema } from './entities/activity.entity';
import { Organization, OrganizationSchema } from 'src/organizations/entities/organization.entity';
import { Station, StationSchema } from 'src/stations/entities/station.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesResolver } from './activities.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: Activity.name, schema: ActivitySchema },
        { name: Station.name, schema: StationSchema },
        { name: Organization.name, schema: OrganizationSchema }
    ]),
  ],
  providers: [ActivitiesService, ActivitiesResolver],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
