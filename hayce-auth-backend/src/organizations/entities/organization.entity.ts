import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({
  timestamps: true,
})
@ObjectType()
export class Organization extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ required: true, unique: true, trim: true })
  @Field()
  nombre: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  @Field()
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  @Field(() => User, { nullable: true })
  createdBy?: Types.ObjectId | null;

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => Int, { defaultValue: 0 })
  userCount?: number;

  @Field(() => Int, { defaultValue: 0 })
  roleCount?: number;

  @Field(() => User, { nullable: true })
  principalAdmin?: User | null;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
