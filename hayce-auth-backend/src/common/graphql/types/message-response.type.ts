import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MessageResponse {
  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  mensaje?: string;
}
