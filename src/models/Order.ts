import mongoose, { Schema, Model, models } from "mongoose";

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export interface IOrder {
  customerId: mongoose.Types.ObjectId;
  boosterId?: mongoose.Types.ObjectId;
  serviceType: string;
  status: OrderStatus;
  pricing: {
    total_amount: number;
    deposit_amount: number; // Số tiền cọc
    final_amount?: number; // Số tiền thực tế sau khi hoàn thành
    base_price: number;
    option_fees: number;
    platform_fee: number;
    booster_earnings: number;
    settlement_status?: 'PENDING' | 'CUSTOMER_OWES' | 'REFUND_NEEDED' | 'SETTLED';
  };
  payment: {
    is_locked: boolean; // Tiền đang bị khóa?
    deposit_paid: boolean;
    final_paid: boolean;
    booster_received_pending?: boolean; // Booster đã nhận tiền vào ví chờ chưa?
  };
  details: any;
  options?: any;
  // Tracking cho Net Wins
  match_history?: Array<{
    match_id?: string;
    mode: string;
    champion: string;
    result: 'WIN' | 'LOSS';
    lp_change: number;
    reason?: string; // Lý do nếu thua
    timestamp: Date;
  }>;
  dispute?: {
    reason: string;
    evidence?: string; // URL ảnh/video
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
    adminNote?: string;
    fundsDeducted?: boolean;
  };
  rating?: {
    stars: number;
    comment?: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    boosterId: { type: Schema.Types.ObjectId, ref: "User" },
    serviceType: { type: String, required: true },
    status: { 
      type: String, 
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT
    },
    pricing: {
      total_amount: { type: Number, required: true },
      deposit_amount: { type: Number, required: true },
      final_amount: Number,
      base_price: Number,
      option_fees: Number,
      platform_fee: Number,
      booster_earnings: Number,
      settlement_status: { type: String, enum: ['PENDING', 'CUSTOMER_OWES', 'REFUND_NEEDED', 'SETTLED'], default: 'PENDING' }
    },
    payment: {
      is_locked: { type: Boolean, default: false },
      deposit_paid: { type: Boolean, default: false },
      final_paid: { type: Boolean, default: false },
      booster_received_pending: { type: Boolean, default: false }
    },
    details: { type: Schema.Types.Mixed },
    options: { type: Schema.Types.Mixed },
    match_history: [{
      match_id: String,
      mode: String,
      champion: String,
      result: { type: String, enum: ['WIN', 'LOSS'] },
      lp_change: Number,
      reason: String,
      timestamp: { type: Date, default: Date.now }
    }],
    dispute: {
      reason: String,
      evidence: String,
      status: { type: String, enum: ['PENDING', 'RESOLVED', 'REJECTED'], default: 'PENDING' },
      adminNote: String,
      fundsDeducted: { type: Boolean, default: false } // Đánh dấu đã trừ tiền Booster chưa
    },
    rating: {
      stars: Number,
      comment: String,
      createdAt: Date
    }
  },
  { timestamps: true }
);

const Order: Model<IOrder> = models.Order || mongoose.model("Order", OrderSchema);
export default Order;