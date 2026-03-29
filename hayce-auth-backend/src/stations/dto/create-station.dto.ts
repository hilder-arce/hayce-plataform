import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Field()
  descripcion: string;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length === 0 ? undefined : value,
  )
  @Field({ nullable: true })
  organization?: string;
}
