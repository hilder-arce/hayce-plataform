import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
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

  @IsMongoId()
  @IsOptional()
  @Field({ nullable: true })
  organization?: string;
}
