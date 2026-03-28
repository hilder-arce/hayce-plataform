import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({
  timestamps: true, //AGREGA LOS CAMPOS createdAt Y updatedAt AUTOMATICAMENTE
})
@ObjectType()
export class Session extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  @Field(() => User, { nullable: true })
  usuario: Types.ObjectId;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ required: true })
  @Field()
  dispositivo: string; //user agent

  @Prop({ required: true })
  @Field()
  ip: string;

  @Prop({ default: false })
  @Field()
  bloqueado: boolean; //look de concurrencias

  @Prop({ default: null })
  @Field({ nullable: true })
  bloqueadoEn: Date; //cuando se adqirioel look

  @Prop({ required: true })
  @Field()
  expiraEn: Date; //cuando vence el refresh token

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
