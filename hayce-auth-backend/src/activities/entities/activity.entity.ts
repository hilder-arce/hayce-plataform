import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Organization } from "src/organizations/entities/organization.entity";
import { Station } from "src/stations/entities/station.entity";
import { User } from "src/users/entities/user.entity";

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

    @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
    @Field(() => Organization, { nullable: true })
    organization: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    @Field(() => User, { nullable: true })
    createdBy: Types.ObjectId;

    @Field()
    createdAt: Date;

    @Field({ nullable: true })
    updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
ActivitySchema.index(
    { organization: 1, estacion: 1, nombre: 1 },
    { unique: true, partialFilterExpression: { organization: { $exists: true } } },
);
