import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  @Field()
  email: string;

  @IsString()
  @MinLength(6)
  @Field()
  password: string;

  @IsMongoId()
  @IsNotEmpty()
  @Field()
  rol: string;
}
