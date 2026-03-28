import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @Field()
  passwordActual: string;

  @IsString()
  @MinLength(6)
  @Field()
  passwordNuevo: string;
}
