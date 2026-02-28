import mongoose, { Schema, Document, Model } from 'mongoose';

export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  APPROVED = 'APPROVED', // Booster accepted
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export enum ServiceType {
  RANK_BOOST = 'RANK_BOOST',
  PLACEMENT = 'PLACEMENT',
  MASTERY = 'MASTERY',
  LEVELING = 'LEVELING',
  NET_WINS = 'NET_WINS',
}

export interface IOrder extends Document {
  customer_id: mongoose.Types.ObjectId;
  booster_id?: mongoose.Types.ObjectId;
  service_type: ServiceType;
  status: OrderStatus;
  details: {
    current_rank?: string;
    desired_rank?: string;
    current_lp?: number;
    lp_gain?: number;
    queue_type?: string;
    current_level?: number;
    current_mastery?: number;
    desired_mastery?: number;
    previous_rank?: string;
    server: string;
    account_username: string; // Encrypted
    account_password: string; // Encrypted
  };
  options: {
    flash_boost: boolean;
    specific_champs: string[];
    schedule?: string;
    streaming: boolean;
    duo_queue: boolean;
    priority_lane?: string;
  };
  pricing: {
    base_price: number;
    option_fees: number;
    total_amount: number;
    platform_fee: number; // Calculated at creation
    booster_earnings: number; // Calculated at creation
  };
  match_history: Array<{
    match_id: string;
    champion: string;
    result: 'WIN' | 'LOSS';
    kda: string;
    timestamp: Date;
  }>;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booster_id: { type: Schema.Types.ObjectId, ref: 'User' },
    service_type: { type: String, enum: Object.values(ServiceType), required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING_PAYMENT,
    },
    details: {
      current_rank: String,
      desired_rank: String,
      current_lp: Number,
      lp_gain: Number,
      queue_type: String,
      current_level: Number,
      current_mastery: Number,
      desired_mastery: Number,
      previous_rank: String,
      server: { type: String, required: true },
      account_username: { type: String, required: true }, // Should be encrypted in service layer
      account_password: { type: String, required: true }, // Should be encrypted in service layer
    },
    options: {
      flash_boost: { type: Boolean, default: false },
      specific_champs: [{ type: String }],
      schedule: String,
      streaming: { type: Boolean, default: false },
      duo_queue: { type: Boolean, default: false },
      priority_lane: String,
    },
    pricing: {
      base_price: { type: Number, required: true },
      option_fees: { type: Number, default: 0 },
      total_amount: { type: Number, required: true },
      platform_fee: { type: Number, required: true },
      booster_earnings: { type: Number, required: true },
    },
    match_history: [
      {
        match_id: String,
        champion: String,
        result: { type: String, enum: ['WIN', 'LOSS'] },
        kda: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes for faster queries
OrderSchema.index({ customer_id: 1 });
OrderSchema.index({ booster_id: 1 });
OrderSchema.index({ status: 1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;