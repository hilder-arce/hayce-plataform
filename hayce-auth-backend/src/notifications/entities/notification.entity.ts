import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true })
@ObjectType()
export class Notification extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  @Field(() => User, { nullable: true })
  usuario: Types.ObjectId; // a quien va dirigida

  @Prop({ required: true })
  @Field()
  tipo: string; // login, nuevo_usuario, nuevo_permiso, etc.

  @Prop({ required: true })
  @Field()
  titulo: string;

  @Prop({ required: true })
  @Field()
  mensaje: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>; // info extra

  @Prop({ default: false })
  @Field()
  leida: boolean;

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
