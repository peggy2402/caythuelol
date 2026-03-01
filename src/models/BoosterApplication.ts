// src/models/BoosterApplication.ts
import mongoose, { Schema, Model, models } from "mongoose";

export interface IBoosterApplication {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  facebookUrl: string;
  discordTag: string;
  currentRank: string;
  highestRank: string;
  opggLink: string;
  rankImageUrl: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  qrImageUrl?: string;
  depositAmount: number;
  depositStatus: "unpaid" | "paid" | "refunded" | "forfeited";
  status: "pending" | "testing" | "approved" | "rejected";
  boosterLevel: "new" | "verified" | "trusted" | "warned";
  validReportsCount: number;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  agreementSigned_name: string;
  agreementSigned_at: Date;
  agreementVersion: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BoosterApplicationSchema = new Schema<IBoosterApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Mỗi user chỉ 1 đơn active
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    facebookUrl: { type: String, required: true },
    discordTag: { type: String, required: true },
    
    currentRank: { type: String, required: true },
    highestRank: { type: String, required: true },
    opggLink: { type: String, required: true },
    rankImageUrl: { type: String, required: true },

    bankName: { type: String, required: true },
    bankAccountName: { type: String, required: true },
    bankAccountNumber: { type: String, required: true },
    qrImageUrl: { type: String },

    depositAmount: { type: Number, default: 200000 },
    depositStatus: { 
      type: String, 
      enum: ["unpaid", "paid", "refunded", "forfeited"], 
      default: "unpaid" 
    },

    status: { 
      type: String, 
      enum: ["pending", "testing", "approved", "rejected"], 
      default: "pending" 
    },
    boosterLevel: { 
      type: String, 
      enum: ["new", "verified", "trusted", "warned"], 
      default: "new" 
    },

    validReportsCount: { type: Number, default: 0 },

    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    
    agreementSigned_name: { type: String, required: true },
    agreementSigned_at: { type: Date, default: Date.now },
    agreementVersion: { type: String, default: "v1.0" },
    
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

const BoosterApplication: Model<IBoosterApplication> =
  models.BoosterApplication || mongoose.model("BoosterApplication", BoosterApplicationSchema);

export default BoosterApplication;
