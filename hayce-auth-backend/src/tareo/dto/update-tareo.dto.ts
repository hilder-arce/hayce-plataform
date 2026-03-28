import { InputType, PartialType } from '@nestjs/graphql';
import { CreateTareoDto } from './create-tareo.dto';

@InputType()
export class UpdateTareoDto extends PartialType(CreateTareoDto) {}
