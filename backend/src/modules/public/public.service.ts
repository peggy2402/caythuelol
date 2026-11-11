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
}

