import mongoose, { Schema, Model, models } from "mongoose";

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT_HOLD = 'PAYMENT_HOLD',
  PAYMENT_RELEASE = 'PAYMENT_RELEASE',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    type: { 
      type: String, 
      enum: Object.values(TransactionType), 
      required: true 
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" },
    status: { 
      type: String, 
      enum: Object.values(TransactionStatus), 
      default: TransactionStatus.SUCCESS 
    },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;