import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  descripcion: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @Field(() => [String], { nullable: true })
  permisos?: string[]; //ARRAY DE IDS DE PERMISOS QUE PERTENECEN A ESTE ROL

  @IsMongoId()
  @IsOptional()
  @Field({ nullable: true })
  organization?: string;
}
