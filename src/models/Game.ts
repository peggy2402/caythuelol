// src/models/Game.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGame extends Document {
  code: string;
  name: string;
  slug: string;
  active: boolean;
}

const GameSchema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  active: { type: Boolean, default: true },
});

export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);
