import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';

import { IUser } from '../../database/schemas/User';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password_hash');
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const userObj: any = user.toObject();
    if (user.role === 'BOOSTER') {
      const boosterProfile = await this.boosterProfileModel.findOne({ userId: user._id });
      if (boosterProfile) {
        userObj.booster_profile = boosterProfile;
      }
    }
    return userObj;
  }

  async updateProfile(userId: string, data: { username?: string; avatar?: string; bio?: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (data.username && data.username !== user.username) {
      const existing = await this.userModel.findOne({ username: data.username });
      if (existing) {
        throw new BadRequestException('Tên người dùng đã được sử dụng');
      }
      user.username = data.username;
    }

    if (data.avatar !== undefined) {
      user.profile.avatar = data.avatar;
    }

    await user.save();

    if (user.role === 'BOOSTER' && data.bio !== undefined) {
      await this.boosterProfileModel.findOneAndUpdate(
        { userId: user._id },
        { $set: { bio: data.bio } },
        { upsert: true, new: true },
      );
    }

    return this.getProfile(userId);
  }

  async updateBankInfo(userId: string, bankInfo: { bankName: string; accountNumber: string; accountHolder: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.profile.bank_info = bankInfo;
    await user.save();
    return { success: true, bank_info: user.profile.bank_info };
  }

  async toggleBookmark(userId: string, boosterId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const bookmarks: any = (user as any).bookmarks || [];
    const index = bookmarks.findIndex((b: any) => b.toString() === boosterId);

    if (index > -1) {
      bookmarks.splice(index, 1);
    } else {
      bookmarks.push(boosterId);
    }
    (user as any).bookmarks = bookmarks;
    await user.save();
    return { success: true, bookmarks };
  }

  async getBookmarks(userId: string) {
    const user = await this.userModel.findById(userId).populate('bookmarks', 'username profile booster_info');
    return (user as any)?.bookmarks || [];
  }

  async sendFeedback(userId: string | null, feedback: { type: string; content: string; imageUrl?: string }) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return { success: true };

    let userText = 'Ẩn danh';
    if (userId) {
      const user = await this.userModel.findById(userId);
      if (user) userText = `${user.username} (${user.email})`;
    }

    const payload = {
      embeds: [
        {
          title: `📣 Phản hồi mới [${feedback.type}]`,
          color: feedback.type === 'BUG' ? 0xff0000 : 0x00ff00,
          fields: [
            { name: 'Người gửi', value: userText, inline: true },
            { name: 'Loại', value: feedback.type, inline: true },
            { name: 'Nội dung', value: feedback.content },
          ],
          image: feedback.imageUrl ? { url: feedback.imageUrl } : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await axios.post(webhookUrl, payload);
    } catch (e) {
      // Ignore webhook failure
    }
    return { success: true, message: 'Cảm ơn bạn đã đóng góp phản hồi!' };
  }
}

