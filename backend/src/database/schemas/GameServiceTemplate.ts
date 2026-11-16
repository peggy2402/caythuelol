import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PricingModel {
  FIXED_TRANSITION = 'FIXED_TRANSITION',
  UNIT_BASED = 'UNIT_BASED',
  PACKAGE_BASED = 'PACKAGE_BASED',
  CUSTOM_FORMULA = 'CUSTOM_FORMULA',
}

export enum AddonPricingType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CalculationBase {
  BASE_PRICE = 'BASE_PRICE',
  ACTUAL_PRICE = 'ACTUAL_PRICE',
  TOTAL_PRICE = 'TOTAL_PRICE',
}

export interface IAddonTemplate {
  slug: string;
  name: string;
  desc?: string;
  pricingType: AddonPricingType;
  defaultPrice: number; // % nếu PERCENTAGE, VNĐ nếu FIXED_AMOUNT
  calculationBase: CalculationBase;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface ILadderStepTemplate {
  id: string; // VD: 'IRON_4', 'GOLD_2', 'MASTER'
  tier: string;
  division?: string;
  label: string;
  stepPrice: number; // Giá nhảy lên bậc kế tiếp
}

export interface IGameServiceTemplate extends Document {
  gameCode: string; // 'LOL', 'VALORANT', 'TFT'
  slug: string; // 'rank-boost', 'net-wins', 'placements'
  name: string;
  desc: string;
  iconName: string;
  pricingModel: PricingModel;
  unitName?: string; // 'Điểm LP', 'Trận', 'Giờ học'
  defaultPrice: number; // Giá khởi điểm
  depositPercent: number; // 30, 50, 100
  allowedAddons: IAddonTemplate[];
  defaultLadderSteps?: ILadderStepTemplate[];
  requiredFields: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddonTemplateSchema = new Schema<IAddonTemplate>(
  {
    slug: { type: String, required: true },
    name: { type: String, required: true },
    desc: { type: String },
    pricingType: { type: String, enum: Object.values(AddonPricingType), required: true },
    defaultPrice: { type: Number, required: true, min: 0 },
    calculationBase: { type: String, enum: Object.values(CalculationBase), default: CalculationBase.BASE_PRICE },
    isRequired: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const LadderStepTemplateSchema = new Schema<ILadderStepTemplate>(
  {
    id: { type: String, required: true },
    tier: { type: String, required: true },
    division: { type: String },
    label: { type: String, required: true },
    stepPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const GameServiceTemplateSchema = new Schema<IGameServiceTemplate>(
  {
    gameCode: { type: String, required: true, uppercase: true, index: true },
    slug: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    desc: { type: String, default: '' },
    iconName: { type: String, default: 'Trophy' },
    pricingModel: { type: String, enum: Object.values(PricingModel), required: true },
    unitName: { type: String },
    defaultPrice: { type: Number, required: true, min: 0 },
    depositPercent: { type: Number, required: true, default: 100, min: 10, max: 100 },
    allowedAddons: { type: [AddonTemplateSchema], default: [] },
    defaultLadderSteps: { type: [LadderStepTemplateSchema], default: [] },
    requiredFields: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique compound index: Mỗi tựa game chỉ có 1 template cho 1 slug
GameServiceTemplateSchema.index({ gameCode: 1, slug: 1 }, { unique: true });

const GameServiceTemplate: Model<IGameServiceTemplate> =
  mongoose.models.GameServiceTemplate ||
  mongoose.model<IGameServiceTemplate>('GameServiceTemplate', GameServiceTemplateSchema);

export default GameServiceTemplate;
