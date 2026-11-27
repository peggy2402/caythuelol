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
  RANK_MISMATCH = 'RANK_MISMATCH',
  CANCELLED = 'CANCELLED',
}

export enum SettlementStatus {
  NOT_SETTLED = 'NOT_SETTLED',
  DEPOSIT_HELD = 'DEPOSIT_HELD',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  SETTLED = 'SETTLED',
  CUSTOMER_OWES = 'CUSTOMER_OWES',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUND_NEEDED = 'REFUND_NEEDED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

export interface IOrderSnapshot {
  gameCode: string;
  serviceSlug: string;
  pricingModel: string;
  initialState: {
    rankId?: string;
    rankLabel?: string;
    lp?: number;
    level?: number;
  };
  targetState: {
    rankId?: string;
    rankLabel?: string;
    lp?: number;
    level?: number;
  };
  actualState?: {
    rankId?: string;
    rankLabel?: string;
    lp?: number;
    level?: number;
    reportedAt?: Date;
    note?: string;
  };
  unitPrice?: number;
  priceRulesSnapshot?: any;
  addonsSnapshot?: Array<{
    slug: string;
    name: string;
    pricingType: string;
    price: number;
    calculationBase: string;
    cost: number;
  }>;
  depositPercent: number;
  estimatedAmount: number;
  depositAmount: number;
  actualAmount?: number;
  refundAmount?: number;
  additionalPayment?: number;
  overTargetPolicySnapshot?: {
    allowOverTarget: boolean;
    maxOverTargetUnits?: number;
    chargeOverTarget: boolean;
  };
  createdAt: Date;
}

export interface IOrder {
  orderCode?: string; // Mã đơn hàng custom (VD: CTL-X8A9B2)
  customerId: mongoose.Types.ObjectId;
  boosterId?: mongoose.Types.ObjectId;
  serviceType: string;
  status: OrderStatus;
  pricing: {
    total_amount: number;
    deposit_amount: number; // Số tiền cọc
    remaining_amount?: number; // Số tiền còn lại sau cọc
    service_amount?: number; // Giá trị thuần dịch vụ
    final_amount?: number; // Số tiền thực tế sau khi hoàn thành
    base_price: number;
    option_fees: number;
    platform_fee: number;
    service_fee?: number;
    platform_fee_percent?: number;
    original_price?: number;
    addons_cost?: number;
    booster_order_value?: number;
    booster_earnings: number;
    funding_source?: 'PLATFORM' | 'BOOSTER' | 'SHARED' | string;
    platform_subsidy?: number; // Số tiền sàn tài trợ bù cho voucher (Booster được nhận nguyên vẹn)
    booster_discount?: number; // Số tiền giảm do Booster tự chịu (nếu là coupon riêng của booster)
    coupon_code?: string;
    discount_amount?: number;
    listed_price?: number; // Giá niêm yết ban đầu
    settlement_status?: SettlementStatus | string;
  };
  payment: {
    is_locked: boolean; // Tiền đang bị khóa?
    deposit_paid: boolean;
    final_paid: boolean;
    booster_received_pending?: boolean; // Booster đã nhận tiền vào ví chờ chưa?
  };
  snapshot?: IOrderSnapshot; // Bất biến lưu toàn bộ giá & chính sách tại thời điểm đặt đơn
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
    riotMatchId?: string;
    detail?: any;
  }>;
  dispute?: {
    reason: string;
    evidence?: string; // URL ảnh/video
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
    adminNote?: string;
    fundsDeducted?: boolean;
  };
  mismatch_info?: {
    declaredRank?: string;
    verifiedRank?: string;
    proofImage?: string;
    note?: string;
    recalculatedPrice?: number;
    extraAmountNeeded?: number;
    reportedBy?: mongoose.Types.ObjectId;
    reportedAt?: Date;
    resolvedAt?: Date;
    resolutionAction?: 'CONFIRMED' | 'CANCELLED';
  };
  rating?: {
    stars: number;
    comment?: string;
    createdAt: Date;
  };
  admin_note?: string;
  timeline?: Array<{
    status: OrderStatus;
    timestamp: Date;
    actor?: mongoose.Types.ObjectId;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, unique: true, sparse: true },
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
      remaining_amount: { type: Number, default: 0 },
      service_amount: { type: Number, default: 0 },
      final_amount: Number,
      base_price: Number,
      option_fees: Number,
      platform_fee: Number,
      service_fee: { type: Number, default: 0 },
      platform_fee_percent: { type: Number, default: 0 },
      original_price: Number,
      addons_cost: Number,
      booster_order_value: Number,
      booster_earnings: Number,
      funding_source: { type: String, enum: ['PLATFORM', 'BOOSTER', 'SHARED', null], default: null },
      platform_subsidy: { type: Number, default: 0 },
      booster_discount: { type: Number, default: 0 },
      coupon_code: String,
      discount_amount: { type: Number, default: 0 },
      listed_price: Number,
      settlement_status: {
        type: String,
        enum: [...Object.values(SettlementStatus), 'PENDING'],
        default: SettlementStatus.DEPOSIT_HELD,
      },
    },
    payment: {
      is_locked: { type: Boolean, default: false },
      deposit_paid: { type: Boolean, default: false },
      final_paid: { type: Boolean, default: false },
      booster_received_pending: { type: Boolean, default: false }
    },
    snapshot: { type: Schema.Types.Mixed },
    details: { type: Schema.Types.Mixed },
    options: { type: Schema.Types.Mixed },
    match_history: [{
      match_id: String,
      mode: String,
      champion: String,
      result: { type: String, enum: ['WIN', 'LOSS'] },
      lp_change: Number,
      reason: String,
      timestamp: { type: Date, default: Date.now },
      riotMatchId: String, // ✅ Thêm trường này
      detail: Schema.Types.Mixed // ✅ Thêm trường này để lưu full JSON từ Riot
    }],
    dispute: {
      reason: String,
      evidence: String,
      status: { type: String, enum: ['PENDING', 'RESOLVED', 'REJECTED'], default: 'PENDING' },
      adminNote: String,
      fundsDeducted: { type: Boolean, default: false } // Đánh dấu đã trừ tiền Booster chưa
    },
    mismatch_info: {
      declaredRank: String,
      verifiedRank: String,
      proofImage: String,
      note: String,
      recalculatedPrice: Number,
      extraAmountNeeded: Number,
      reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date, default: Date.now },
      resolvedAt: Date,
      resolutionAction: { type: String, enum: ['CONFIRMED', 'CANCELLED'] },
    },
    rating: {
      stars: Number,
      comment: String,
      createdAt: Date
    },
    admin_note: { type: String },
    timeline: [{
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      actor: { type: Schema.Types.ObjectId, ref: 'User' },
      note: String
    }]
  },
  { timestamps: true }
);

const Order: Model<IOrder> = models.Order || mongoose.model("Order", OrderSchema);
export default Order;