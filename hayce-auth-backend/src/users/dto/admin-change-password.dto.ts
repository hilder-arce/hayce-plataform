import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class AdminChangePasswordDto {
  @IsString()
  @MinLength(6)
  @Field()
  passwordNuevo: string;
}
