import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Station } from "src/stations/entities/station.entity";

@Schema({
    timestamps: true 
})
@ObjectType()
export class Activity extends Document {
    @Field(() => ID)
    get id(): string {
        return this._id?.toString?.() ?? '';
    }

    @Prop({ required: true })
    @Field()
    nombre: string;

    @Prop({ required: true })
    @Field({ nullable: true })
    descripcion?: string;

    @Prop({ type: Types.ObjectId, ref: Station.name, required: true })
    @Field(() => Station, { nullable: true })
    estacion: Types.ObjectId;

    @Prop({ default: true })
    @Field()
    estado: boolean;

    @Field()
    createdAt: Date;

    @Field({ nullable: true })
    updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
