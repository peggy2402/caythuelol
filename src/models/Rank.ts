// src/models/Rank.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRank extends Document {
  gameCode: string;
  tier: string;
  division: string | null;
  order: number;
}

const RankSchema = new Schema({
  gameCode: { type: String, required: true },
  tier: { type: String, required: true },
  division: { type: String, default: null },
  order: { type: Number, required: true },
});

export default mongoose.models.Rank || mongoose.model<IRank>('Rank', RankSchema);
