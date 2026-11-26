import mongoose, { Schema, Model, models, Document } from "mongoose";

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT_HOLD = 'PAYMENT_HOLD',
  PAYMENT_RELEASE = 'PAYMENT_RELEASE',
  REFUND = 'REFUND',
  COMMISSION = 'COMMISSION',
  DISPUTE_PENALTY = 'DISPUTE_PENALTY',
  VIP_PURCHASE = 'VIP_PURCHASE',
  TIP_SENT = 'TIP_SENT',
  TIP_RECEIVED = 'TIP_RECEIVED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  gatewayTransactionId?: string; // ID giao dịch từ SePay/Ngân hàng để idempotency tuyệt đối
  depositCode?: string; // Mã nạp tiền định danh (vd: ZT7K9A2P)
  metadata: Record<string, any>; // Lưu trữ dữ liệu bổ sung từ SePay/Payment Gateway
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
    gatewayTransactionId: { type: String, sparse: true, index: true },
    depositCode: { type: String, sparse: true, index: true },
    metadata: {
        type: Object, // Lưu toàn bộ JSON từ SePay/Payment Gateway
        default: {}
    },
    status: { 
      type: String, 
      enum: Object.values(TransactionStatus), 
      default: TransactionStatus.SUCCESS 
    },
  },
  { timestamps: true }
);

// Unique index trên gatewayTransactionId để chống duplicate ở tầng CSDL
TransactionSchema.index({ gatewayTransactionId: 1 }, { unique: true, sparse: true });
TransactionSchema.index({ userId: 1, type: 1, status: 1 });

const Transaction: Model<ITransaction> = models.Transaction || mongoose.model("Transaction", TransactionSchema);
export default Transaction;