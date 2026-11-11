import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoosterService extends Document {
  userId: mongoose.Types.ObjectId;
  serviceType: string; // VD: 'RANK_BOOST', 'PLACEMENT', 'NET_WINS'
  isEnabled: boolean;
  prices: any; // Bảng giá chi tiết (Mixed type vì cấu trúc khác nhau tùy service)
  settings: any; // Các tùy chọn khác (hệ số, options...)
  createdAt: Date;
  updatedAt: Date;
}

const BoosterServiceSchema = new Schema<IBoosterService>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceType: { type: String, required: true },
    isEnabled: { type: Boolean, default: false },
    prices: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Đảm bảo mỗi Booster chỉ có 1 document cho mỗi loại dịch vụ
BoosterServiceSchema.index({ userId: 1, serviceType: 1 }, { unique: true });

const BoosterService: Model<IBoosterService> = mongoose.models.BoosterService || mongoose.model<IBoosterService>('BoosterService', BoosterServiceSchema);

export default BoosterService;
