import { Field, InputType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  descripcion: string;

  @IsMongoId()
  @IsNotEmpty()
  @Field()
  modulo: string;
}
