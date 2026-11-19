import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

import { ISystemSetting } from '../../database/schemas/SystemSetting';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';

@Injectable()
export class PublicService {
  private systemConfigCache: { data: any; expiresAt: number } | null = null;
  private readonly SYSTEM_CONFIG_TTL_MS = 10_000;

  constructor(
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
    @InjectModel('GameServiceTemplate') private templateModel: Model<any>,
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

  async getServiceTemplates(gameCode: string = 'LOL') {
    const templates = await this.templateModel
      .find({ gameCode: gameCode.toUpperCase(), isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    return { success: true, templates };
  }

  async getServiceTemplateDetail(gameCode: string, slug: string) {
    const template = await this.templateModel
      .findOne({ gameCode: gameCode.toUpperCase(), slug: slug.toLowerCase(), isActive: true })
      .lean();
    if (!template) {
      throw new NotFoundException(`Không tìm thấy mẫu dịch vụ ${slug} cho game ${gameCode}`);
    }
    return { success: true, template };
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
      const raw = res.data;
      const dataObj = raw?.data || {};
      const version = raw?.version || '14.24.1';
      const list = Object.values(dataObj).map((c: any) => ({
        ...c,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image?.full || c.id + '.png'}`,
      }));
      return list;
    } catch {
      return [];
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
    const now = Date.now();
    if (this.systemConfigCache && now < this.systemConfigCache.expiresAt) {
      return this.systemConfigCache.data;
    }

    const keys = [
      'banner_config',
      'maintenance_mode',
      'ADMIN_BANK_INFO',
      'booster_registration_config',
    ];
    const docs = await this.settingModel.find({ key: { $in: keys } }).lean();
    const map = new Map<string, any>(docs.map((d) => [d.key, d.value]));

    const isMaintenance = Boolean(map.get('maintenance_mode') || false);

    const payload = {
      success: true,
      banner: map.get('banner_config') || null,
      maintenance: isMaintenance,
      maintenanceMode: isMaintenance,
      maintenance_mode: isMaintenance,
      adminBank: map.get('ADMIN_BANK_INFO') || null,
      boosterRegistration: map.get('booster_registration_config') || null,
    };

    this.systemConfigCache = {
      data: payload,
      expiresAt: now + this.SYSTEM_CONFIG_TTL_MS,
    };

    return payload;
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

  async getRiotPlayer(dto: any) {
    const server = dto.server || 'VN';
    let gameName = dto.gameName || '';
    let tagLine = dto.tagLine || '';

    if (dto.name) {
      const parts = String(dto.name).split('#');
      gameName = parts[0]?.trim() || '';
      tagLine = parts[1]?.trim() || '';
    }

    const SERVER_TO_PLATFORM: Record<string, string> = {
      VN: 'VN2', KR: 'KR', JP: 'JP1', NA: 'NA1', EUW: 'EUW1', EUNE: 'EUN1', OC: 'OC1',
      BR: 'BR1', LAS: 'LA2', LAN: 'LA1', RU: 'RU', TR: 'TR1', PH: 'PH2', SG: 'SG2',
      TH: 'TH2', TW: 'TW2',
    };

    const PLATFORM_TO_ACCOUNT_REGION: Record<string, string> = {
      VN2: 'asia', SG2: 'asia', PH2: 'asia', TH2: 'asia', TW2: 'asia', KR: 'asia', JP1: 'asia',
      NA1: 'americas', BR1: 'americas', LA1: 'americas', LA2: 'americas', OC1: 'americas',
      EUW1: 'europe', EUN1: 'europe', TR1: 'europe', RU: 'europe',
    };

    const platformId = SERVER_TO_PLATFORM[server.toUpperCase()] || 'VN2';
    const accountRegion = PLATFORM_TO_ACCOUNT_REGION[platformId] || 'asia';
    if (!tagLine) tagLine = platformId === 'VN2' ? 'VN2' : 'RIOT';

    const riotKeySettings = await this.settingModel.find({
      key: { $in: ['RIOT_API_KEY', 'riot_api_key'] },
    }).lean();

    let apiKey = '';
    for (const s of riotKeySettings) {
      const val = typeof s?.value === 'string' ? s.value.trim() : '';
      if (val) {
        apiKey = val;
        break;
      }
    }
    if (!apiKey) {
      apiKey = (process.env.RIOT_API_KEY || '').trim();
    }

    let mockReason = 'Chưa cấu hình RIOT_API_KEY trong hệ thống (cài đặt ở trang Admin > Cấu hình hệ thống)';

    if (apiKey) {
      try {
        const headers = { 'X-Riot-Token': apiKey };
        const accountUrl = `https://${accountRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
          gameName,
        )}/${encodeURIComponent(tagLine)}?api_key=${apiKey}`;
        const accountRes = await axios.get(accountUrl, { headers });
        const accountData = accountRes.data;

        if (accountData?.puuid) {
          const leagueUrl = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}?api_key=${apiKey}`;
          const leagueRes = await axios.get(leagueUrl, { headers });
          const rawLeagues = leagueRes.data || [];
          const leagues = rawLeagues.length > 0 ? rawLeagues : [
            {
              queueType: 'RANKED_SOLO_5x5',
              tier: 'UNRANKED',
              rank: '',
              leaguePoints: 0,
              wins: 0,
              losses: 0,
            },
          ];

          return {
            success: true,
            isMock: false,
            leagues,
            puuid: accountData.puuid,
            gameName: accountData.gameName,
            tagLine: accountData.tagLine,
          };
        }
      } catch (err: any) {
        const status = err.response?.status;
        console.error(`[Riot API Player Error]: HTTP ${status}`, err.response?.data || err.message);
        if (status === 401) {
          mockReason = 'RIOT_API_KEY không hợp lệ hoặc đã bị bấm Regenerate tạo mới trên developer.riotgames.com (HTTP 401: Unauthorized).';
        } else if (status === 403) {
          mockReason = 'RIOT_API_KEY đã hết hạn (Development key của Riot hết hạn sau 24h) hoặc bị từ chối truy cập (HTTP 403: Forbidden).';
        } else if (status === 404) {
          mockReason = `Không tìm thấy người chơi "${gameName}#${tagLine}" trên Riot Server ${server}.`;
        } else {
          mockReason = `Riot API lỗi (HTTP ${status || 'Unknown'}): ${err.response?.data?.status?.message || err.message}`;
        }

        return {
          success: false,
          isMock: false,
          error: mockReason,
          mockReason,
        };
      }
    }

    // Fallback thông minh: Giả lập dữ liệu rank hợp lệ để trải nghiệm người dùng không bị tắc nghẽn
    return {
      success: true,
      isMock: true,
      mockReason,
      puuid: 'mock_puuid_' + Date.now(),
      gameName: gameName || 'Mary Tái Lâm',
      tagLine: tagLine || '2003',
      leagues: [
        {
          queueType: 'RANKED_SOLO_5x5',
          tier: 'EMERALD',
          rank: 'II',
          leaguePoints: 45,
          wins: 38,
          losses: 22,
        },
        {
          queueType: 'RANKED_FLEX_SR',
          tier: 'PLATINUM',
          rank: 'I',
          leaguePoints: 65,
          wins: 25,
          losses: 15,
        },
      ],
    };
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

  detectGeoLocale(req: any) {
    const headers = req?.headers || {};

    // 1. Phân tích header Quốc gia từ Cloudflare, Vercel hoặc Reverse Proxy
    const rawCountry = (
      headers['cf-ipcountry'] ||
      headers['x-vercel-ip-country'] ||
      headers['x-country-code'] ||
      ''
    ).toString().toUpperCase().trim();

    // 2. Trích xuất Client IP thực tế
    const forwardedFor = headers['x-forwarded-for'];
    const clientIp = (
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : '') ||
      headers['x-real-ip'] ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '127.0.0.1'
    ).trim();

    // 3. Mapping Quốc gia -> Ngôn ngữ & Tiền tệ tương ứng
    let country = rawCountry;
    let suggestedLanguage: 'vi' | 'en' | 'kr' | 'jp' = 'vi';
    let currency: 'VND' | 'USD' | 'KRW' | 'JPY' = 'VND';

    if (country === 'KR') {
      suggestedLanguage = 'kr';
      currency = 'KRW';
    } else if (country === 'JP') {
      suggestedLanguage = 'jp';
      currency = 'JPY';
    } else if (country === 'VN') {
      suggestedLanguage = 'vi';
      currency = 'VND';
    } else if (country && country !== 'XX' && country !== 'T1') {
      // Các quốc gia quốc tế khác (US, UK, CA, AU, SG, v.v.)
      suggestedLanguage = 'en';
      currency = 'USD';
    } else {
      // Môi trường Localhost hoặc không nhận diện được
      country = 'VN';
      suggestedLanguage = 'vi';
      currency = 'VND';
    }

    return {
      success: true,
      ip: clientIp,
      country,
      suggestedLanguage,
      currency,
    };
  }
}

