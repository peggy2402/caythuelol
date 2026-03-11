import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
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
    services?: string[];
    rating?: number;
    completed_orders?: number;
    service_settings?: any;
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
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);