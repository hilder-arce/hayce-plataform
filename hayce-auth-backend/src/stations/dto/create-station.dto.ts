import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  descripcion: string;
}
