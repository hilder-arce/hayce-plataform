import { InputType, PartialType } from '@nestjs/graphql';
import { CreateModuleDto } from './create-module.dto';

@InputType()
export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
