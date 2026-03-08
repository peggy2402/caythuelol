import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoosterGameProfile {
  gameCode: string; // Ref tới Game.code (VD: 'LOL')
  ranks: string[]; // Ref tới Rank.tier (VD: ['CHALLENGER'])
  servers: string[]; // VD: ['VN', 'KR']
  champions?: string[]; // Tướng sở trường
  roles?: string[]; // Vị trí sở trường
  metadata?: {
    opggLink?: string;
    rankImageUrl?: string;
    [key: string]: any;
  };
}

export interface IBoosterProfile extends Document {
  userId: mongoose.Types.ObjectId;
  displayName?: string; // Tên hiển thị (nếu muốn khác username)
  bio: string;
  
  // Thay thế các trường flat cũ bằng mảng games để hỗ trợ nhiều game
  games: IBoosterGameProfile[];
  
  services: string[]; // Danh sách các dịch vụ đang cung cấp (Cache để lọc nhanh)
  rating: number;
  completedOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

const BoosterGameProfileSchema = new Schema({
  gameCode: { type: String, required: true },
  ranks: { type: [String], default: [] },
  servers: { type: [String], default: [] },
  champions: { type: [String], default: [] },
  roles: { type: [String], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { _id: false });

const BoosterProfileSchema = new Schema<IBoosterProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    displayName: { type: String },
    bio: { type: String, default: '' },
    
    // Cấu trúc mới hỗ trợ nhiều game
    games: { type: [BoosterGameProfileSchema], default: [] },
    
    services: { type: [String], default: [] }, // VD: ['RANK_BOOST', 'PLACEMENT']
    rating: { type: Number, default: 5.0 },
    completedOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index hỗ trợ tìm kiếm theo Game và Rank
BoosterProfileSchema.index({ "games.gameCode": 1, "games.ranks": 1 });
BoosterProfileSchema.index({ "games.gameCode": 1, "games.servers": 1 });

const BoosterProfile: Model<IBoosterProfile> = mongoose.models.BoosterProfile || mongoose.model<IBoosterProfile>('BoosterProfile', BoosterProfileSchema);

export default BoosterProfile;
