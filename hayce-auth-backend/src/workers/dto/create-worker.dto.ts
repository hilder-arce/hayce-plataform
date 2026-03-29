import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";

@InputType()
export class CreateWorkerDto {

    @IsString()
    @IsNotEmpty()
    @Field()
    nombres: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    apellidos: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.numero_telefono !== '' && o.numero_telefono !== null)
    @Field({ nullable: true })
    numero_telefono?: string;

    @IsEmail()
    @IsOptional()
    @ValidateIf((o) => o.correo !== '' && o.correo !== null)
    @Field({ nullable: true })
    correo?: string;

    @IsMongoId()
    @IsOptional()
    @Field({ nullable: true })
    organization?: string;
}
