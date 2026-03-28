import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
    timestamps: true 
})
@ObjectType()
export class Worker extends Document {
    @Field(() => ID)
    get id(): string {
        return this._id?.toString?.() ?? '';
    }

    @Prop({ required: true })
    @Field()
    nombres: string;

    @Prop({ required: true })
    @Field()
    apellidos: string;

    @Prop({ required: false })
    @Field({ nullable: true })
    numero_telefono?: string;

    @Prop({ required: false })
    @Field({ nullable: true })
    correo?: string;

    @Prop({ default: true })
    @Field()
    estado: boolean;

    @Field()
    createdAt: Date;

    @Field({ nullable: true })
    updatedAt?: Date;
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
