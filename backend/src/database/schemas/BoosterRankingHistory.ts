import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBoosterRankingHistory extends Document {
  boosterId: mongoose.Types.ObjectId;
  previousScore: number;
  newScore: number;
  scoreBreakdown: {
    efficiencyScore: number;   // 0 - 100
    qualityScore: number;      // 0 - 100
    reliabilityScore: number;  // 0 - 100
    experienceScore: number;   // 0 - 100
    activityScore: number;     // 0 - 100
  };
  previousTier: string;
  newTier: string;
  previousRank?: number;
  newRank?: number;
  reason: string; // 'ORDER_COMPLETED', 'REVIEW_RECEIVED', 'PENALTY', 'DISPUTE_LOST', 'CRON_RECALC'
  orderId?: mongoose.Types.ObjectId;
  calculatedAt: Date;
}

const BoosterRankingHistorySchema = new Schema<IBoosterRankingHistory>(
  {
    boosterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    previousScore: { type: Number, default: 0 },
    newScore: { type: Number, required: true },
    scoreBreakdown: {
      efficiencyScore: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 0 },
      reliabilityScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      activityScore: { type: Number, default: 0 },
    },
    previousTier: { type: String, default: 'BRONZE' },
    newTier: { type: String, required: true },
    previousRank: { type: Number },
    newRank: { type: Number },
    reason: { type: String, default: 'CRON_RECALC' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BoosterRankingHistorySchema.index({ boosterId: 1, calculatedAt: -1 });

const BoosterRankingHistory: Model<IBoosterRankingHistory> =
  mongoose.models.BoosterRankingHistory || mongoose.model<IBoosterRankingHistory>('BoosterRankingHistory', BoosterRankingHistorySchema);

export default BoosterRankingHistory;
