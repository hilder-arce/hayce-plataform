import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Activity } from "src/activities/entities/activity.entity";
import { Organization } from "src/organizations/entities/organization.entity";
import { Worker } from "src/workers/entities/worker.entity";
import { User } from "src/users/entities/user.entity";

export enum EstadoTareo {
    POR_INICIAR = 'por iniciar',
    EN_DESARROLLO = 'en desarrollo',
    FINALIZADO = 'finalizado'
}

registerEnumType(EstadoTareo, {
    name: 'EstadoTareo',
    description: 'Estados posibles de un tareo'
});

@Schema({
    timestamps: true 
})
@ObjectType()
export class Tareo extends Document {
    @Field(() => ID)
    get id(): string {
        return this._id?.toString?.() ?? '';
    }

    @Prop({ type: Types.ObjectId, ref: 'Worker', required: true })
    @Field(() => Worker)
    trabajador: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
    @Field(() => Activity)
    actividad: Types.ObjectId;

    @Prop({ required: true, trim: true })
    @Field()
    estacion: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    @Field(() => User)
    creado_por: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
    @Field(() => Organization, { nullable: true })
    organization: Types.ObjectId;

    @Prop({ required: true })
    @Field()
    numero_operacion: string;

    @Prop({ required: true })
    @Field()
    chasis: string;

    @Prop({ required: true })
    @Field()
    fecha: Date;

    @Prop({ required: true })
    @Field()
    hora_ini: Date;

    @Prop({ required: false })
    @Field({ nullable: true })
    hora_fin?: Date;

    @Prop({ required: false, default: 0 })
    @Field()
    horas: number;

    @Prop({ required: false })
    @Field({ nullable: true })
    observacion?: string;

    @Prop({ 
        type: String, 
        enum: EstadoTareo, 
        default: EstadoTareo.POR_INICIAR 
    })
    @Field(() => EstadoTareo)
    estado_tareo: EstadoTareo;

    @Prop({ default: true })
    @Field()
    estado: boolean;

    @Prop({ default: false })
    recordatorio_inicio_enviado: boolean;

    @Field()
    createdAt: Date;

    @Field({ nullable: true })
    updatedAt?: Date;
}

export const TareoSchema = SchemaFactory.createForClass(Tareo);
