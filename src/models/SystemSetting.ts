import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  description?: string;
}

const SystemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
