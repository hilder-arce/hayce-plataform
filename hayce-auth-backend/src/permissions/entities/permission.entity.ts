import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Module } from 'src/modules/entities/module.entity';

@Schema({
  timestamps: true, //AGREGA CAMPOS DE CREATED_AT Y UPDATED_AT AUTOMATICAMENTE
})
@ObjectType()
export class Permission extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ required: true, unique: true })
  @Field()
  nombre: string;

  @Prop({ required: true })
  @Field({ nullable: true })
  descripcion?: string;

  @Prop({ type: Types.ObjectId, ref: Module.name, required: true })
  @Field(() => Module, { nullable: true })
  modulo: Types.ObjectId; //REFERENCIA AL MODULO AL QUE PERTENECE EL PERMISO (RELACION CON LA COLECCION DE MODULOS)

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
