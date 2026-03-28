import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPermissionGroup {
  @Field()
  modulo: string;

  @Field(() => [String])
  permisos: string[];
}

@ObjectType()
export class AuthUserProfile {
  @Field()
  id: string;

  @Field()
  nombre: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  rol?: string;

  @Field(() => [AuthPermissionGroup], { defaultValue: [] })
  permisos: AuthPermissionGroup[];

  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AuthResponseData {
  @Field(() => AuthUserProfile)
  usuario: AuthUserProfile;
}

@ObjectType()
export class AuthResponse {
  @Field()
  status: string;

  @Field()
  message: string;

  @Field(() => AuthResponseData)
  data: AuthResponseData;
}
