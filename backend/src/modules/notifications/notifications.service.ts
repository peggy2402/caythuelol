import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotification } from '../../database/schemas/Notification';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<INotification>,
  ) {}

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
