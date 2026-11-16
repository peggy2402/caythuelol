import mongoose, { Schema, Document, Model } from 'mongoose';
import { PricingModel, AddonPricingType, CalculationBase } from './GameServiceTemplate';

export interface IBoosterAddonConfig {
  slug: string;
  name: string;
  isEnabled: boolean;
  pricingType: AddonPricingType;
  price: number; // % hoặc số tiền cố định
  calculationBase: CalculationBase;
}

export interface IBoosterService extends Document {
  userId: mongoose.Types.ObjectId;
  gameCode: string; // 'LOL', 'VALORANT'
  serviceSlug: string; // 'rank-boost', 'net-wins'
  isEnabled: boolean;
  pricingModel: PricingModel;

  // 1. Dành cho FIXED_TRANSITION
  multiplier: number; // Hệ số nhân giá tổng (VD: 0.9, 1.0, 1.2)
  tierPrices?: Record<string, number>; // Giá theo Tier lớn (IRON: 20000, GOLD: 40000...)
  stepOverrides?: Record<string, number>; // Override từng bước nhảy lẻ

  // 2. Dành cho UNIT_BASED (Cày LP, Trận thắng, Giờ học)
  unitPrice?: number; // Đơn giá mỗi đơn vị (VD: 1.000 VNĐ / LP)
  unitPricesByRank?: Record<string, number>; // Đơn giá theo rank nếu có (Cao Thủ: 1000, Thách Đấu: 2000)

  // 3. Dành cho PACKAGE_BASED
  packages?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;

  // 4. Addons riêng của Booster
  addons: IBoosterAddonConfig[];

  // 5. Chính sách cọc
  depositPercent: number; // 30, 50, 100

  // 6. Quy tắc cày vượt mục tiêu (Over-target Policy)
  overTargetPolicy: {
    allowOverTarget: boolean; // Có chấp nhận cày vượt không
    maxOverTargetUnits?: number; // Tối đa vượt bao nhiêu đơn vị (VD: 20 LP)
    chargeOverTarget: boolean; // Có tính phí phần vượt không (nếu khách đồng ý)
  };

  // 7. Quy tắc hoàn thành (Completion Policy)
  completionPolicy: {
    underTargetRefundMode: 'PRO_RATA' | 'FULL_REFUND'; // Trừ theo tỷ lệ thực đạt hay hoàn 100%
  };

  createdAt: Date;
  updatedAt: Date;
}

const BoosterAddonConfigSchema = new Schema<IBoosterAddonConfig>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
    pricingType: { type: String, enum: Object.values(AddonPricingType), required: true },
    price: { type: Number, required: true, min: 0 },
    calculationBase: { type: String, enum: Object.values(CalculationBase), default: CalculationBase.BASE_PRICE },
  },
  { _id: false }
);

const BoosterServiceSchema = new Schema<IBoosterService>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gameCode: { type: String, required: true, uppercase: true },
    serviceSlug: { type: String, required: true, lowercase: true },
    isEnabled: { type: Boolean, default: true },
    pricingModel: { type: String, enum: Object.values(PricingModel), required: true },

    multiplier: { type: Number, default: 1.0, min: 0.5, max: 3.0 },
    tierPrices: { type: Schema.Types.Mixed, default: {} },
    stepOverrides: { type: Schema.Types.Mixed, default: {} },

    unitPrice: { type: Number, min: 0 },
    unitPricesByRank: { type: Schema.Types.Mixed, default: {} },

    packages: [
      {
        id: String,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],

    addons: { type: [BoosterAddonConfigSchema], default: [] },
    depositPercent: { type: Number, default: 100, min: 10, max: 100 },

    overTargetPolicy: {
      allowOverTarget: { type: Boolean, default: false },
      maxOverTargetUnits: { type: Number, default: 0 },
      chargeOverTarget: { type: Boolean, default: false },
    },

    completionPolicy: {
      underTargetRefundMode: { type: String, enum: ['PRO_RATA', 'FULL_REFUND'], default: 'PRO_RATA' },
    },
  },
  { timestamps: true }
);

// Mỗi Booster chỉ có 1 cấu hình cho 1 serviceSlug của 1 tựa game
BoosterServiceSchema.index({ userId: 1, gameCode: 1, serviceSlug: 1 }, { unique: true });

const BoosterService: Model<IBoosterService> =
  mongoose.models.BoosterService ||
  mongoose.model<IBoosterService>('BoosterService', BoosterServiceSchema);

export default BoosterService;
