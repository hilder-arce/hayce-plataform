import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length } from 'class-validator';

@InputType()
export class ResetPasswordDto {
  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @Length(6, 6)
  @Field()
  codigo: string;

  @IsString()
  @Length(6, 50)
  @Field()
  password: string;
}
