import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRoleDto } from './create-role.dto';
import { IsArray, IsMongoId, IsOptional } from 'class-validator';

@InputType()
export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @Field(() => [String], { nullable: true })
  permisosEliminar?: string[];
}
