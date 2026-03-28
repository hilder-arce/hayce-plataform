import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

@InputType()
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @Field()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Field()
  password: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  dispositivo?: string;

  @IsString()
  @IsOptional()
  @Field({ nullable: true })
  ubicacion?: string;
}
