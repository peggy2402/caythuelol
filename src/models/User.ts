import mongoose, { Schema, Document, Model } from 'mongoose';

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
  wallet_balance: number;
  pending_balance: number;
  profile: {
    avatar?: string;
    discord_id?: string;
    bank_info?: {
      bank_name: string;
      account_number: string;
      account_holder: string;
    };
  };
  booster_info?: {
    ranks: string[];
    services: string[];
    team_id?: mongoose.Types.ObjectId;
    rating: number;
  };
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
    wallet_balance: { type: Number, default: 0 },
    pending_balance: { type: Number, default: 0 },
    profile: {
      avatar: String,
      discord_id: String,
      bank_info: {
        bank_name: String,
        account_number: String,
        account_holder: String,
      },
    },
    booster_info: {
      ranks: [String],
      services: [String],
      team_id: { type: Schema.Types.ObjectId, ref: 'Team' },
      rating: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;