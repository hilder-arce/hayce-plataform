import { InputType, PartialType } from '@nestjs/graphql';
import { CreateStationDto } from './create-station.dto';

@InputType()
export class UpdateStationDto extends PartialType(CreateStationDto) {}
