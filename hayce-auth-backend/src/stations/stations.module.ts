import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from 'src/organizations/entities/organization.entity';
import { Station, StationSchema } from './entities/station.entity';
import { StationsService } from './stations.service';
import { StationsResolver } from './stations.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Station.name, schema: StationSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  providers: [StationsService, StationsResolver],
  exports: [StationsService],
})
export class StationsModule {}
