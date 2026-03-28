import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class ForgotPasswordDto {
  @IsEmail()
  @Field()
  email: string;
}
