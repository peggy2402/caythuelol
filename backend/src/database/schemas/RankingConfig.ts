import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITierDefinition {
  tierId: number; // 1 -> 7
  code: string; // 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER'
  name: string; // 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'
  minScore: number;
  maxScore: number;
  minCompletedOrders: number; // Điều kiện số đơn tối thiểu để đạt Tier (chống hack rank bằng 1 đơn 5 sao)
  minRating: number; // Điểm đánh giá tối thiểu
  badgeIcon: string;
  badgeColor: string;
  benefits?: string[];
}

export interface IRankingConfig extends Document {
  version: number;
  isActive: boolean;
  
  // Trọng số 5 nhóm tiêu chí (Tổng = 100%)
  weights: {
    efficiency: number;   // 25% - Hiệu suất công việc
    quality: number;      // 30% - Chất lượng dịch vụ
    reliability: number;  // 20% - Độ tin cậy
    experience: number;   // 15% - Kinh nghiệm
    activity: number;     // 10% - Hoạt động & tương tác
  };

  // 7 Cấp bậc Tier
  tiers: ITierDefinition[];

  // Điều kiện tham gia Leaderboard
  leaderboardRules: {
    minOrdersForRank: number; // Tối thiểu bao nhiêu đơn mới lên BXH
    inactivityDaysLimit: number; // Sau bao nhiêu ngày không hoạt động thì ẩn khỏi BXH
  };

  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TierDefinitionSchema = new Schema({
  tierId: { type: Number, required: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  minScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  minCompletedOrders: { type: Number, default: 0 },
  minRating: { type: Number, default: 0 },
  badgeIcon: { type: String, default: 'Trophy' },
  badgeColor: { type: String, default: '#3b82f6' },
  benefits: { type: [String], default: [] },
}, { _id: false });

const RankingConfigSchema = new Schema<IRankingConfig>(
  {
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    weights: {
      efficiency: { type: Number, default: 25 },
      quality: { type: Number, default: 30 },
      reliability: { type: Number, default: 20 },
      experience: { type: Number, default: 15 },
      activity: { type: Number, default: 10 },
    },
    tiers: {
      type: [TierDefinitionSchema],
      default: [
        { tierId: 1, code: 'BRONZE', name: 'Bronze', minScore: 0, maxScore: 49, minCompletedOrders: 0, minRating: 0, badgeIcon: 'Shield', badgeColor: '#cd7f32' },
        { tierId: 2, code: 'SILVER', name: 'Silver', minScore: 50, maxScore: 64, minCompletedOrders: 3, minRating: 4.0, badgeIcon: 'Shield', badgeColor: '#c0c0c0' },
        { tierId: 3, code: 'GOLD', name: 'Gold', minScore: 65, maxScore: 74, minCompletedOrders: 10, minRating: 4.5, badgeIcon: 'Trophy', badgeColor: '#ffd700' },
        { tierId: 4, code: 'PLATINUM', name: 'Platinum', minScore: 75, maxScore: 84, minCompletedOrders: 25, minRating: 4.7, badgeIcon: 'Trophy', badgeColor: '#00e5ff' },
        { tierId: 5, code: 'DIAMOND', name: 'Diamond', minScore: 85, maxScore: 91, minCompletedOrders: 50, minRating: 4.85, badgeIcon: 'Sparkles', badgeColor: '#38bdf8' },
        { tierId: 6, code: 'MASTER', name: 'Master', minScore: 92, maxScore: 96, minCompletedOrders: 100, minRating: 4.9, badgeIcon: 'Flame', badgeColor: '#c084fc' },
        { tierId: 7, code: 'GRANDMASTER', name: 'Grandmaster', minScore: 97, maxScore: 100, minCompletedOrders: 200, minRating: 4.95, badgeIcon: 'Flame', badgeColor: '#f43f5e' },
      ],
    },
    leaderboardRules: {
      minOrdersForRank: { type: Number, default: 1 },
      inactivityDaysLimit: { type: Number, default: 45 },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const RankingConfig: Model<IRankingConfig> =
  mongoose.models.RankingConfig || mongoose.model<IRankingConfig>('RankingConfig', RankingConfigSchema);

export default RankingConfig;
