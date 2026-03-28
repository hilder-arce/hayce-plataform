import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Permission } from 'src/permissions/entities/permission.entity';

@Schema({
  timestamps: true, //AGREGA CAMPOS DE CREATED_AT Y UPDATED_AT AUTOMATICAMENTE
})
@ObjectType()
export class Role extends Document {
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

  @Prop({ type: [Types.ObjectId], ref: Permission.name, default: [] })
  @Field(() => [Permission], { defaultValue: [] })
  permisos: string[];

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
