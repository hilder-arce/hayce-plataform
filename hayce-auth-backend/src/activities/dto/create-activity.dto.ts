import { Field, InputType } from "@nestjs/graphql";
import { IsMongoId, IsNotEmpty, IsString } from "class-validator";

@InputType()
export class CreateActivityDto {

    @IsString()
    @IsNotEmpty()
    @Field()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    @Field()
    descripcion: string;

    @IsMongoId()
    @IsNotEmpty()
    @Field()
    estacion: string;
}
