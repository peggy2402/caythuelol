import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT_HOLD = 'PAYMENT_HOLD',
  PAYMENT_RELEASE = 'PAYMENT_RELEASE',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface ITransaction extends Document {
  user_id: mongoose.Types.ObjectId;
  order_id?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balance_after: number;
  status: TransactionStatus;
  description?: string;
  created_at: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    balance_after: { type: Number, required: true },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PENDING },
    description: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;