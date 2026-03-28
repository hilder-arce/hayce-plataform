import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/entities/role.entity';

@Schema({
  timestamps: true,
})
@ObjectType()
export class User extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ required: true })
  @Field()
  nombre: string;

  @Prop({ required: true, unique: true })
  @Field()
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Types.ObjectId, ref: Role.name, required: true })
  @Field(() => Role, { nullable: true })
  rol: Types.ObjectId;

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
