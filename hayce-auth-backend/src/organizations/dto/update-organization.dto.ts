import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsOptional, Matches } from 'class-validator';

@InputType()
export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  @Field({ nullable: true })
  declare slug?: string;
}
