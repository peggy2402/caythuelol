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

  async updateProfile(
    userId: string,
    data: { username?: string; avatar?: string; bio?: string; booster_info?: { bio?: string } },
  ) {
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

    if (!user.profile) {
      user.profile = {};
    }

    if (data.avatar !== undefined) {
      user.profile.avatar = data.avatar;
    }

    const bio = data.bio !== undefined ? data.bio : data.booster_info?.bio;
    if (bio !== undefined) {
      if (!user.booster_info) {
        user.booster_info = {};
      }
      user.booster_info.bio = bio;
    }

    await user.save();

    if (user.role === 'BOOSTER' && bio !== undefined) {
      await this.boosterProfileModel.findOneAndUpdate(
        { userId: user._id },
        { $set: { bio: bio } },
        { upsert: true, new: true },
      );
    }

    const updatedProfile = await this.getProfile(userId);
    return {
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      user: updatedProfile.user || updatedProfile,
      ...updatedProfile,
    };
  }

  async updateBoosterProfile(
    userId: string,
    data: { bio?: string; displayName?: string; games?: any[]; currentRank?: string; highestRank?: string },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (!user.booster_info) user.booster_info = {};
    if (data.bio !== undefined) user.booster_info.bio = data.bio;

    // Cho phép thay đổi trực tiếp currentRank & highestRank tổng
    if (data.currentRank !== undefined) user.booster_info.currentRank = data.currentRank;
    if (data.highestRank !== undefined) user.booster_info.highestRank = data.highestRank;

    let boosterProfile = await this.boosterProfileModel.findOne({ userId: user._id });
    if (!boosterProfile) {
      boosterProfile = new this.boosterProfileModel({
        userId: user._id,
        displayName: data.displayName || user.username,
        avatar: user.profile?.avatar,
        bio: data.bio || '',
        games: data.games || [],
      });
    } else {
      if (data.bio !== undefined) boosterProfile.bio = data.bio;
      if (data.displayName !== undefined) boosterProfile.displayName = data.displayName;
      if (data.games !== undefined) boosterProfile.games = data.games;
    }

    // Tự động sync rank game chính vào booster_info nếu chưa truyền cụ thể
    if (data.games && data.games.length > 0) {
      const activeGame = data.games.find((g: any) => g.ranks && g.ranks.length > 0 && g.ranks.some((r: any) => r && r !== 'N/A' && r.trim() !== '')) || data.games[0];
      if (activeGame && activeGame.ranks && activeGame.ranks.length > 0) {
        if (!data.highestRank && activeGame.ranks[0] && activeGame.ranks[0] !== 'N/A') {
          user.booster_info.highestRank = activeGame.ranks[0];
        }
        if (!data.currentRank && activeGame.ranks[1] && activeGame.ranks[1] !== 'N/A') {
          user.booster_info.currentRank = activeGame.ranks[1];
        } else if (!data.currentRank && activeGame.ranks[0] && activeGame.ranks[0] !== 'N/A') {
          user.booster_info.currentRank = activeGame.ranks[0];
        }
      }
    }

    await user.save();
    await boosterProfile.save();

    return {
      success: true,
      message: 'Cập nhật thông tin tuyển thủ thành công',
      booster_info: user.booster_info,
      booster_profile: boosterProfile,
    };
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
    const user = await this.userModel.findById(userId).populate({
      path: 'bookmarks',
      select: 'username avatar profile booster_info role isBanned',
    });
    const rawBookmarks = (user as any)?.bookmarks || [];
    const boosterUserIds = rawBookmarks.map((b: any) => b._id).filter(Boolean);

    let profileMap = new Map<string, any>();
    if (boosterUserIds.length > 0) {
      const profiles = await this.boosterProfileModel.find({ userId: { $in: boosterUserIds } }).lean();
      for (const p of profiles) {
        profileMap.set(p.userId.toString(), p);
      }
    }

    const bookmarks = rawBookmarks.map((b: any) => {
      const bObj = b.toObject ? b.toObject() : b;
      const p = profileMap.get(bObj._id.toString());
      return {
        ...bObj,
        displayName: p?.displayName || bObj.profile?.displayName || bObj.username,
        avatar: bObj.profile?.avatar || bObj.avatar || p?.avatar || '',
        rating: p?.rating || bObj.booster_info?.rating || 0,
        completedOrders: p?.completedOrders || bObj.booster_info?.completed_orders || 0,
        bio: p?.bio || bObj.booster_info?.bio || '',
        games: p?.games || [],
      };
    });

    return {
      success: true,
      bookmarks,
    };
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

