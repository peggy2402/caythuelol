import mongoose, { Schema, Model, models } from "mongoose";

export interface ITransaction {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT_HOLD' | 'PAYMENT_RELEASE' | 'REFUND' | 'COMMISSION';
  amount: number;
  balanceAfter: number;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    type: { 
      type: String, 
      enum: ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT_HOLD', 'PAYMENT_RELEASE', 'REFUND', 'COMMISSION'], 
      required: true 
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, default: "" },
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED'], 
      default: 'SUCCESS' 
    },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;