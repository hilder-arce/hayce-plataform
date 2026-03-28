import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length } from 'class-validator';

@InputType()
export class VerifyCodeDto {
  @IsEmail()
  @Field()
  email: string;

  @IsString()
  @Length(6, 6)
  @Field()
  codigo: string;
}
