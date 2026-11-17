import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PointTransactionType {
  EARN_ORDER = 'EARN_ORDER',
  REDEEM_VOUCHER = 'REDEEM_VOUCHER',
  BONUS = 'BONUS',
  ADJUST = 'ADJUST',
}

export interface IPointTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  voucherId?: mongoose.Types.ObjectId;
  type: PointTransactionType;
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    type: {
      type: String,
      enum: Object.values(PointTransactionType),
      required: true,
    },
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const PointTransaction: Model<IPointTransaction> =
  mongoose.models.PointTransaction ||
  mongoose.model<IPointTransaction>('PointTransaction', PointTransactionSchema);

export default PointTransaction;
