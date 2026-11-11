import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

import { ISystemSetting } from '../../database/schemas/SystemSetting';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';

@Injectable()
export class PublicService {
  constructor(
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getPublicSettings() {
    const settings = await this.settingModel.find().lean();
    const map: Record<string, any> = {
      platform_fee_percent: 15,
      bank_id: process.env.BANK_ID || 'MB',
      bank_account_no: process.env.BANK_ACCOUNT_NO || '',
      bank_account_name: process.env.BANK_ACCOUNT_NAME || '',
    };
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    return { success: true, settings: map };
  }

  async validateCoupon(code: string, boosterId: string) {
    if (!code || !boosterId) {
      throw new BadRequestException('Mã giảm giá và Booster ID không được để trống');
    }

    const profile = await this.boosterProfileModel.findOne({ userId: boosterId }).lean();
    if (!profile) {
      throw new NotFoundException('Booster chưa cấu hình dịch vụ');
    }

    const lolProfile = profile.games?.find((g) => g.gameCode === 'LOL');
    const coupons = lolProfile?.metadata?.coupons || [];
    const coupon = coupons.find(
      (c: any) => c.code.toUpperCase() === code.toUpperCase() && c.isActive,
    );

    if (!coupon) {
      throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }

    return {
      success: true,
      coupon: { code: coupon.code, value: coupon.value, type: coupon.type },
    };
  }

  async uploadFileBuffer(buffer: Buffer, fileName: string, resourceType: 'auto' | 'raw' | 'image' = 'auto') {
    const uploadOptions: any = {
      folder: 'caythuelol/uploads',
      resource_type: resourceType,
    };

    if (resourceType === 'raw') {
      uploadOptions.use_filename = true;
      uploadOptions.unique_filename = false;
      uploadOptions.overwrite = true;
    }

    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, res) => {
          if (error) reject(error);
          else resolve(res);
        },
      );
      uploadStream.end(buffer);
    });

    return { success: true, url: result.secure_url };
  }

  async getChampions() {
    try {
      const res = await axios.get(
        'https://ddragon.leagueoflegends.com/cdn/14.24.1/data/en_US/champion.json',
      );
      return res.data;
    } catch {
      return { data: {} };
    }
  }

  async getWithdrawFee() {
    const setting = await this.settingModel.findOne({ key: 'withdraw_fee' }).lean();
    return { fee: Number(setting?.value || 0) };
  }

  async updateWithdrawFee(fee: number) {
    await this.settingModel.findOneAndUpdate(
      { key: 'withdraw_fee' },
      { $set: { value: Number(fee), description: 'Phí rút tiền cố định (VND)' } },
      { upsert: true, new: true },
    );
    return { success: true, fee: Number(fee) };
  }

  async getPlatformFee() {
    const setting = await this.settingModel.findOne({ key: 'PLATFORM_FEE' }).lean();
    return { fee: Number(setting?.value || 10) };
  }

  async getSystemConfig() {
    const [banner, maintenance, adminBank, boosterReg] = await Promise.all([
      this.settingModel.findOne({ key: 'banner_config' }).lean(),
      this.settingModel.findOne({ key: 'maintenance_mode' }).lean(),
      this.settingModel.findOne({ key: 'ADMIN_BANK_INFO' }).lean(),
      this.settingModel.findOne({ key: 'booster_registration_config' }).lean(),
    ]);

    return {
      success: true,
      banner: banner?.value || null,
      maintenance: Boolean(maintenance?.value || false),
      adminBank: adminBank?.value || null,
      boosterRegistration: boosterReg?.value || null,
    };
  }

  async submitContact(dto: any) {
    return { success: true, message: 'Cảm ơn bạn đã gửi liên hệ, chúng tôi sẽ phản hồi sớm nhất!' };
  }

  async submitFeedback(dto: any) {
    return { success: true, message: 'Cảm ơn đánh giá quý giá của bạn!' };
  }

  async getRankStats() {
    return {
      success: true,
      stats: {
        IRON: { winRate: 52, averagePrice: 30000 },
        BRONZE: { winRate: 54, averagePrice: 40000 },
        SILVER: { winRate: 55, averagePrice: 50000 },
        GOLD: { winRate: 58, averagePrice: 70000 },
        PLATINUM: { winRate: 60, averagePrice: 100000 },
        EMERALD: { winRate: 62, averagePrice: 140000 },
        DIAMOND: { winRate: 65, averagePrice: 200000 },
        MASTER: { winRate: 68, averagePrice: 350000 },
      },
    };
  }

  async getRiotPlayer(gameName: string, tagLine: string) {
    const riotKeySetting = await this.settingModel.findOne({ key: 'RIOT_API_KEY' }).lean();
    const apiKey = riotKeySetting?.value || process.env.RIOT_API_KEY;

    if (!apiKey) {
      return {
        success: true,
        account: {
          gameName: gameName || 'Player',
          tagLine: tagLine || 'VN2',
          level: 150,
          tier: 'EMERALD',
          rank: 'II',
          lp: 45,
          winRate: 64,
        },
      };
    }

    try {
      const accountRes = await axios.get(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
          gameName,
        )}/${encodeURIComponent(tagLine)}`,
        { headers: { 'X-Riot-Token': apiKey } },
      );
      return { success: true, account: accountRes.data };
    } catch {
      return {
        success: true,
        account: {
          gameName,
          tagLine,
          level: 100,
          tier: 'PLATINUM',
          rank: 'I',
          lp: 75,
        },
      };
    }
  }

  async getRiotMatch(matchId: string) {
    return {
      success: true,
      match: {
        matchId,
        gameMode: 'CLASSIC',
        gameDuration: 1845,
        win: true,
      },
    };
  }
}

