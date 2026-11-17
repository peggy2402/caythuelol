import mongoose, { Schema, Document, Model } from 'mongoose';

export enum VoucherType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export interface IVoucher extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  rewardId: string;
  title: string;
  type: VoucherType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  pointsCost: number;
  status: VoucherStatus;
  usedOrderId?: mongoose.Types.ObjectId;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    rewardId: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(VoucherType), required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    pointsCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(VoucherStatus),
      default: VoucherStatus.ACTIVE,
    },
    usedOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Voucher: Model<IVoucher> =
  mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);

export default Voucher;
