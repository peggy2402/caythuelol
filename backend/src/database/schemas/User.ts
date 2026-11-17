import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  BOOSTER = 'BOOSTER',
  CUSTOMER = 'CUSTOMER',
}

export interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phoneNumber?: string;
  isEmailVerified: boolean;
  wallet_balance: number;
  pending_balance: number;
  loyalty_points?: number;
  total_points_earned?: number;
  isBanned?: boolean;
  debt_info?: {
    is_in_debt: boolean;
    reminder_count: number;
    last_reminded_at?: Date;
    ban_deadline?: Date;
  };
  profile: {
    avatar?: string;
    discord_id?: string;
    bank_info?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  };
  booster_info?: {
    bio?: string;
    ingame_name?: string;
    main_games?: string[];
    services?: string[];
    rating?: number;
    completed_orders?: number;
    service_settings?: any;
    isReady?: boolean;
  };
  staff_permissions?: string[];
  vip_info?: {
    is_vip: boolean;
    package_type?: string;
    discount_percent?: number;
    start_date?: Date;
    end_date?: Date;
    note?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true, // Tự động xóa khoảng trắng đầu/cuối
      // Chỉ cho phép chữ, số, gạch dưới, gạch ngang, chấm. Không cho phép khoảng trắng.
      match: [/^[a-zA-Z0-9_\-\.]+$/, 'Username không được chứa khoảng trắng hoặc ký tự đặc biệt']
    },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    phoneNumber: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    platform: {
      type: String,
      enum: ['EMAIL', 'GOOGLE', 'FACEBOOK'],
      default: 'EMAIL',
    },
    wallet_balance: { type: Number, default: 0 },
    pending_balance: { type: Number, default: 0 },
    loyalty_points: { type: Number, default: 0 },
    total_points_earned: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    staff_permissions: {
      type: [String],
      default: ['users', 'disputes', 'deposits', 'cron', 'settings', 'blogs'],
    },
    debt_info: {
      is_in_debt: { type: Boolean, default: false },
      reminder_count: { type: Number, default: 0 },
      last_reminded_at: { type: Date },
      ban_deadline: { type: Date }
    },
    profile: {
      avatar: { type: String, default: '' },
      discord_id: { type: String },
      bank_info: {
        bankName: { type: String },
        accountNumber: { type: String },
        accountHolder: { type: String },
      }
    },
    booster_info: { type: Schema.Types.Mixed },
    vip_info: {
      is_vip: { type: Boolean, default: false },
      package_type: { type: String },
      discount_percent: { type: Number, default: 0 },
      start_date: { type: Date },
      end_date: { type: Date },
      note: { type: String },
    },
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);