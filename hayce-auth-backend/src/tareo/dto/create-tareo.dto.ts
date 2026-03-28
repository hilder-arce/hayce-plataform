import { Field, InputType } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EstadoTareo } from "../entities/tareo.entity";

@InputType()
export class CreateTareoDto {

    @IsMongoId()
    @IsNotEmpty()
    @Field()
    trabajador: string;

    @IsMongoId()
    @IsNotEmpty()
    @Field()
    actividad: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    estacion: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    numero_operacion: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    chasis: string;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    @Field()
    fecha: Date;

    @IsDate()
    @IsNotEmpty()
    @Type(() => Date)
    @Field()
    hora_ini: Date;

    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @Field({ nullable: true })
    hora_fin?: Date;

    @IsString()
    @IsOptional()
    @Field({ nullable: true })
    observacion?: string;

    @IsEnum(EstadoTareo)
    @IsOptional()
    @Field(() => EstadoTareo, { nullable: true })
    estado_tareo?: EstadoTareo;
}
