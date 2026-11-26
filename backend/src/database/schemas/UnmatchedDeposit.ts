import mongoose, { Schema, Document } from 'mongoose';

export interface IUnmatchedDeposit extends Document {
  gateway: string;
  gatewayTransactionId: string;
  transferAmount: number;
  content: string;
  description?: string;
  accountNumber?: string;
  referenceCode?: string;
  transactionDate?: string;
  rawPayload: Record<string, any>;
  status: 'PENDING_REVIEW' | 'RESOLVED' | 'REJECTED';
  failReason?: string;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedUserId?: mongoose.Types.ObjectId;
  resolvedTransactionId?: mongoose.Types.ObjectId;
  resolutionNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UnmatchedDepositSchema = new Schema<IUnmatchedDeposit>(
  {
    gateway: { type: String, default: 'SePay', index: true },
    gatewayTransactionId: { type: String, required: true, unique: true, index: true },
    transferAmount: { type: Number, required: true },
    content: { type: String, default: '' },
    description: { type: String, default: '' },
    accountNumber: { type: String },
    referenceCode: { type: String },
    transactionDate: { type: String },
    rawPayload: { type: Object, required: true },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'RESOLVED', 'REJECTED'],
      default: 'PENDING_REVIEW',
      index: true,
    },
    failReason: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    resolutionNote: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

const UnmatchedDeposit =
  mongoose.models.UnmatchedDeposit ||
  mongoose.model<IUnmatchedDeposit>('UnmatchedDeposit', UnmatchedDepositSchema);
export default UnmatchedDeposit;
