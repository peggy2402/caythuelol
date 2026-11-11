import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'CHANGE_EMAIL';
  expiresAt: Date;
  attempts: number;
}

const VerificationCodeSchema: Schema = new Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    type: {
      type: String,
      enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'CHANGE_EMAIL'],
      default: 'EMAIL_VERIFICATION',
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL Index: Tự động xóa document sau khi field expiresAt trôi qua
// expireAfterSeconds: 0 nghĩa là xóa đúng lúc expiresAt
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);