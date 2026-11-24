import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotification } from '../../database/schemas/Notification';
import { ChatGateway } from '../chat/chat.gateway';

export interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  title: string;
  message: string;
  type?: INotification['type'];
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<INotification>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async notifyUser(input: CreateNotificationInput) {
    try {
      const targetId = input.userId?.toString();
      if (!targetId || !Types.ObjectId.isValid(targetId)) return null;

      const created = await this.notificationModel.create({
        userId: new Types.ObjectId(targetId),
        title: input.title,
        message: input.message,
        type: input.type || 'ORDER_UPDATE',
        link: input.link,
        isRead: false,
      });

      const payload = created.toObject ? created.toObject() : created;
      this.chatGateway.broadcastNotification(targetId, payload);
      return payload;
    } catch {
      return null;
    }
  }

  async notifyUsers(
    userIds: Array<string | Types.ObjectId>,
    payload: Omit<CreateNotificationInput, 'userId'>,
  ) {
    const uniqueIds = Array.from(
      new Set(
        userIds
          .map((id) => id?.toString())
          .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id))),
      ),
    );
    if (uniqueIds.length === 0) return [];

    try {
      const docs = await this.notificationModel.insertMany(
        uniqueIds.map((id) => ({
          userId: new Types.ObjectId(id),
          title: payload.title,
          message: payload.message,
          type: payload.type || 'ORDER_UPDATE',
          link: payload.link,
          isRead: false,
        })),
      );

      for (const doc of docs) {
        const plain = doc.toObject ? doc.toObject() : doc;
        this.chatGateway.broadcastNotification(doc.userId.toString(), plain);
      }
      return docs;
    } catch {
      return [];
    }
  }

  async getUserNotifications(userId: string) {
    const objectId = new Types.ObjectId(userId);
    const notifications = await this.notificationModel
      .find({ userId: objectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await this.notificationModel.countDocuments({
      userId: objectId,
      isRead: false,
    });

    return {
      notifications,
      unreadCount,
    };
  }

  async markAllAsRead(userId: string) {
    const objectId = new Types.ObjectId(userId);
    await this.notificationModel.updateMany(
      { userId: objectId, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async markOneAsRead(userId: string, notificationId: string) {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { isRead: true },
    );
    return { success: true };
  }
}
