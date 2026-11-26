import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookLog extends Document {
  gateway: string;
  gatewayTransactionId?: string;
  endpoint: string;
  ip?: string;
  headers?: Record<string, any>;
  rawPayload: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'IGNORED' | 'UNMATCHED';
  reason?: string;
  matchedUserId?: mongoose.Types.ObjectId;
  transactionId?: mongoose.Types.ObjectId;
  processingTimeMs: number;
  createdAt: Date;
}

const WebhookLogSchema = new Schema<IWebhookLog>(
  {
    gateway: { type: String, default: 'SePay', index: true },
    gatewayTransactionId: { type: String, index: true },
    endpoint: { type: String, default: '/api/webhooks/sepay' },
    ip: { type: String },
    headers: { type: Object, default: {} },
    rawPayload: { type: Object, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'IGNORED', 'UNMATCHED'],
      required: true,
      index: true,
    },
    reason: { type: String },
    matchedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    processingTimeMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL Index: tự động dọn dẹp log sau 60 ngày để tránh phình dung lượng DB
WebhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const WebhookLog = mongoose.models.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);
export default WebhookLog;
