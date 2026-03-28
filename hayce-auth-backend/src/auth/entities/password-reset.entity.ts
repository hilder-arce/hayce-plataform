// auth/entities/password-reset.entity.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true })
export class PasswordReset extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true })
  codigo: string;

  @Prop({ required: true, type: Date, expires: 0 })
  expiraEn: Date;

  @Prop({ default: false })
  usado: boolean;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
