import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  nombre?: string;

  @IsOptional()
  @IsString()
  @Field({ nullable: true })
  descripcion?: string;
}
