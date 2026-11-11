import mongoose, { Schema, Document } from 'mongoose';

export interface IRankHistory extends Document {
  date: string; // YYYY-MM-DD
  challengerCutoff: number;
  grandmasterCutoff: number;
}

const RankHistorySchema = new Schema(
  {
    date: { type: String, required: true, unique: true },
    challengerCutoff: { type: Number, required: true },
    grandmasterCutoff: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.RankHistory || mongoose.model<IRankHistory>('RankHistory', RankHistorySchema);
