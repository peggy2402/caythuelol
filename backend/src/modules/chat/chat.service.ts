import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

import { IMessage } from '../../database/schemas/Message';
import { IOrder } from '../../database/schemas/Order';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<IMessage>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    private chatGateway: ChatGateway,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private async resolveOrder(orderIdOrCode: string) {
    let order: any = null;
    if (Types.ObjectId.isValid(orderIdOrCode)) {
      order = await this.orderModel.findById(orderIdOrCode).lean();
    }
    if (!order) {
      order = await this.orderModel.findOne({ orderCode: orderIdOrCode }).lean();
    }
    return order;
  }

  async getMessages(orderId: string) {
    let targetObjectId: Types.ObjectId;
    if (Types.ObjectId.isValid(orderId)) {
      targetObjectId = new Types.ObjectId(orderId);
    } else {
      const order = await this.resolveOrder(orderId);
      if (!order) return { success: true, messages: [] };
      targetObjectId = order._id as Types.ObjectId;
    }

    const messages = await this.messageModel
      .find({ order_id: targetObjectId })
      .populate('sender_id', 'username profile.avatar role')
      .populate('replyTo')
      .sort({ created_at: 1 })
      .lean();

    return { success: true, messages };
  }

  async sendMessage(
    orderId: string,
    senderId: string,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT' = 'TEXT',
    replyToId?: string,
  ) {
    const order = await this.resolveOrder(orderId);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng tương ứng');
    }

    if (!order.boosterId) {
      throw new BadRequestException('Kênh chat sẽ tự động mở khi có Tuyển thủ nhận đơn của bạn.');
    }

    const targetObjectId = order._id as Types.ObjectId;

    const message = new this.messageModel({
      order_id: targetObjectId,
      sender_id: new Types.ObjectId(senderId),
      content,
      type,
      replyTo: replyToId ? new Types.ObjectId(replyToId) : undefined,
    });

    await message.save();
    const populated = await message.populate('sender_id', 'username profile.avatar role');

    // Broadcast to room via Gateway (broadcast theo cả orderId và orderCode)
    this.chatGateway.broadcastMessageToOrder(targetObjectId.toString(), populated);
    if (order.orderCode && order.orderCode !== targetObjectId.toString()) {
      this.chatGateway.broadcastMessageToOrder(order.orderCode, populated);
    }

    return { success: true, message: populated };
  }

  async reactMessage(messageId: string, userId: string, emoji: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Tin nhắn không tồn tại');

    const uId = new Types.ObjectId(userId);
    const existingIndex = message.reactions?.findIndex(
      (r) => r.userId.toString() === userId && r.emoji === emoji,
    );

    if (existingIndex !== undefined && existingIndex > -1) {
      message.reactions?.splice(existingIndex, 1);
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ emoji, userId: uId });
    }

    await message.save();
    return { success: true, reactions: message.reactions };
  }

  async uploadImage(fileBase64: string, folder = 'chat') {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder,
      resource_type: 'auto',
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}

