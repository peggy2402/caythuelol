import mongoose, { Schema, Model, models } from "mongoose";

export interface IAuditLog {
  actorId: mongoose.Types.ObjectId; // Người thực hiện hành động
  targetId?: mongoose.Types.ObjectId; // Người bị tác động (thường là chính user đó)
  action: string; // Ví dụ: UPDATE_BANK_INFO, CHANGE_PASSWORD
  description: string; // Mô tả chi tiết
  metadata?: any; // Lưu dữ liệu cũ/mới để đối chiếu
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AuditLog: Model<IAuditLog> = models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
export default AuditLog;
