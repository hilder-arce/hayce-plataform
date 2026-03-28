import { InputType, PartialType } from '@nestjs/graphql';
import { CreateActivityDto } from './create-activity.dto';

@InputType()
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
