import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoosterGameProfile {
  gameCode: string; // Ref tới Game.code (VD: 'LOL', 'VALORANT', 'AOV')
  ranks: string[]; // Ref tới Rank.tier (VD: ['CHALLENGER', 'MASTER'])
  servers: string[]; // VD: ['VN', 'KR', 'AP']
  champions?: string[]; // Tướng sở trường
  roles?: string[]; // Vị trí sở trường
  performanceScore?: number; // 0 - 100 riêng cho game này
  tier?: string; // Cấp bậc riêng cho game này (BRONZE -> GRANDMASTER)
  completedOrders?: number; // Số đơn hoàn thành của riêng game này
  successRate?: number; // Tỉ lệ thành công của game này
  metadata?: {
    opggLink?: string;
    rankImageUrl?: string;
    [key: string]: any;
  };
}

export interface IBoosterProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName?: string; // Tên hiển thị (nếu muốn khác username)
  avatar?: string; // Avatar Booster
  bio: string;
  currentRank?: string;
  highestRank?: string;
  
  // Hỗ trợ nhiều game với rank và năng lực độc lập
  games: IBoosterGameProfile[];
  
  services: string[]; // Danh sách các dịch vụ đang cung cấp (Cache để lọc nhanh)
  rating: number;
  completedOrders: number;

  // Hệ Thống Đánh Giá Năng Lực & Xếp Hạng Toàn Sàn
  performanceScore: number; // 0 - 100
  tier: string; // BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER
  tierName: string; // Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster
  globalRank?: number; // Thứ hạng trên bảng xếp hạng
  scoreBreakdown?: {
    efficiencyScore: number;   // 25%
    qualityScore: number;      // 30%
    reliabilityScore: number;  // 20%
    experienceScore: number;   // 15%
    activityScore: number;     // 10%
  };
  lastCalculatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BoosterGameProfileSchema = new Schema({
  gameCode: { type: String, required: true },
  ranks: { type: [String], default: [] },
  servers: { type: [String], default: [] },
  champions: { type: [String], default: [] },
  roles: { type: [String], default: [] },
  performanceScore: { type: Number, default: 50 },
  tier: { type: String, default: 'SILVER' },
  completedOrders: { type: Number, default: 0 },
  successRate: { type: Number, default: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const BoosterProfileSchema = new Schema<IBoosterProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String },
    avatar: { type: String },
    bio: { type: String, default: '' },
    currentRank: { type: String },
    highestRank: { type: String },
    
    // Cấu trúc mới hỗ trợ nhiều game
    games: { type: [BoosterGameProfileSchema], default: [] },
    
    services: { type: [String], default: [] }, // VD: ['RANK_BOOST', 'PLACEMENT']
    rating: { type: Number, default: 5.0 },
    completedOrders: { type: Number, default: 0 },

    // Hệ Thống Đánh Giá Năng Lực & Xếp Hạng
    performanceScore: { type: Number, default: 50 },
    tier: { type: String, default: 'SILVER' },
    tierName: { type: String, default: 'Silver' },
    globalRank: { type: Number },
    scoreBreakdown: {
      efficiencyScore: { type: Number, default: 50 },
      qualityScore: { type: Number, default: 50 },
      reliabilityScore: { type: Number, default: 50 },
      experienceScore: { type: Number, default: 50 },
      activityScore: { type: Number, default: 50 },
    },
    lastCalculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index hỗ trợ tìm kiếm theo Game và Rank
BoosterProfileSchema.index({ "games.gameCode": 1, "games.ranks": 1 });
BoosterProfileSchema.index({ "games.gameCode": 1, "games.servers": 1 });
BoosterProfileSchema.index({ performanceScore: -1, rating: -1 });

const BoosterProfile: Model<IBoosterProfile> = mongoose.models.BoosterProfile || mongoose.model<IBoosterProfile>('BoosterProfile', BoosterProfileSchema);

export default BoosterProfile;
