import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  order_id: mongoose.Types.ObjectId;
  sender_id: mongoose.Types.ObjectId;
  content: string;
  is_system_message: boolean; // Dùng cho thông báo hệ thống (VD: "Booster đã nhận đơn")
  type?: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT';
  metadata?: any; // Lưu kết quả của command (VD: thông tin trận đấu, tip amount)
  reactions?: {
    emoji: string;
    userId: mongoose.Types.ObjectId;
  }[];
  replyTo?: mongoose.Types.ObjectId; // ID tin nhắn được reply
  readBy?: mongoose.Types.ObjectId[]; // Danh sách người đã xem
  created_at: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    sender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    is_system_message: { type: Boolean, default: false },
    type: { type: String, enum: ['TEXT', 'IMAGE', 'COMMAND_RESULT'], default: 'TEXT' },
    metadata: { type: Schema.Types.Mixed },
    reactions: [{
      emoji: String,
      userId: { type: Schema.Types.ObjectId, ref: 'User' }
    }],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Index để query tin nhắn theo đơn hàng nhanh hơn
MessageSchema.index({ order_id: 1, created_at: 1 });

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
