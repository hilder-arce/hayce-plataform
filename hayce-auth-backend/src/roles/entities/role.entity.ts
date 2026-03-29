import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Organization } from 'src/organizations/entities/organization.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { User } from 'src/users/entities/user.entity';

@Schema({
  timestamps: true, //AGREGA CAMPOS DE CREATED_AT Y UPDATED_AT AUTOMATICAMENTE
})
@ObjectType()
export class Role extends Document {
  @Field(() => ID)
  get id(): string {
    return this._id?.toString?.() ?? '';
  }

  @Prop({ required: true, trim: true })
  @Field()
  nombre: string;

  @Prop({ required: true })
  @Field({ nullable: true })
  descripcion?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Permission', default: [] })
  @Field(() => [Permission], { defaultValue: [] })
  permisos: string[];

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  @Field(() => Organization, { nullable: true })
  organization?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  @Field(() => User, { nullable: true })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  @Field(() => User, { nullable: true })
  ownerAdmin?: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  @Field(() => [User], { defaultValue: [] })
  ancestryPath: Types.ObjectId[];

  @Prop({ default: true })
  @Field()
  estado: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index(
  { organization: 1, nombre: 1 },
  { unique: true, partialFilterExpression: { organization: { $exists: true } } },
);
