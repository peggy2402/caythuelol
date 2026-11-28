import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

import { ISystemSetting } from '../../database/schemas/SystemSetting';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { decryptSecret } from '../../common/utils/crypto.util';
import aovHeroesData from '../../common/data/aov_heroes.json';
import {
  RiotPlayerLookupDto,
  RiotMatchLookupDto,
  ValorantPlayerLookupDto,
  ValorantMatchLookupDto,
  GamePlayerLookupDto,
  GameMatchLookupDto,
} from './dto/riot.dto';

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

    const SENSITIVE_KEYS = new Set([
      'RIOT_API_KEY',
      'riot_api_key',
      'VALORANT_API_KEY',
      'HENRIKDEV_API_KEY',
      'valorant_api_key',
      'henrikdev_api_key',
      'JWT_SECRET',
      'DATABASE_URL',
      'CLOUDINARY_API_SECRET',
      'SMTP_PASS',
      'MAIL_PASS',
      'SEPAY_API_KEY',
      'SEPAY_WEBHOOK_SECRET',
      'SEPAY_API_SECRET',
      'NEXT_PUBLIC_SITE_URL',
      'JWT_SECRET',
      'MONGODB_URI',
      'MONGODB_URI_PROD',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_CLOUD_NAME',
      'SMTP_USER',
      'SMTP_PASS',
      'MAIL_USER',
      'MAIL_PASS',
    ]);

    const isSensitive = (key: string) => {
      if (SENSITIVE_KEYS.has(key)) return true;
      const lower = key.toLowerCase();
      if (
        lower.includes('api_key') ||
        lower.includes('apikey') ||
        lower.includes('secret') ||
        lower.includes('password') ||
        lower.includes('token')
      ) {
        return true;
      }
      return false;
    };

    settings.forEach((s) => {
      if (!isSensitive(s.key)) {
        map[s.key] = s.value;
      }
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

  private resolveUploadFolder(folder?: string): 'caythuelol/chat' | 'caythuelol/uploads' {
    const normalized = (folder || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    if (normalized === 'chat' || normalized === 'caythuelol/chat') {
      return 'caythuelol/chat';
    }
    return 'caythuelol/uploads';
  }

  async uploadFileBuffer(
    buffer: Buffer,
    fileName: string,
    resourceType: 'auto' | 'raw' | 'image' = 'auto',
    folder?: string,
    mimeType?: string,
  ) {
    const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Dung lượng file tối đa là 10MB');
    }

    const targetFolder = this.resolveUploadFolder(folder);
    const normalizedMime = (mimeType || '').toLowerCase();
    const isImageMime = normalizedMime.startsWith('image/');
    const isPdfMime =
      normalizedMime === 'application/pdf' ||
      (fileName || '').toLowerCase().endsWith('.pdf');

    // Phân tách chặt chẽ theo mục đích thư mục:
    // - caythuelol/chat: chỉ cho phép ảnh gửi trong phòng chat
    // - caythuelol/uploads: cho phép ảnh (bằng chứng rank, bill, góp ý) và PDF hợp đồng Booster
    if (targetFolder === 'caythuelol/chat') {
      if (normalizedMime && !isImageMime) {
        throw new BadRequestException('Thư mục chat chỉ hỗ trợ tải lên file ảnh');
      }
    } else if (normalizedMime && !isImageMime && !isPdfMime) {
      throw new BadRequestException('Chỉ hỗ trợ file ảnh hoặc PDF');
    }

    const effectiveResourceType: 'auto' | 'raw' | 'image' =
      targetFolder === 'caythuelol/chat' ? 'image' : resourceType;

    // Chuẩn hóa tên file và tạo public_id có đuôi mở rộng rõ ràng (đặc biệt là .pdf cho hợp đồng)
    const rawBaseName = (fileName || 'file')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = isPdfMime ? '.pdf' : '';
    const publicId = `${rawBaseName}_${Date.now()}${ext}`;

    const uploadOptions: any = {
      folder: targetFolder,
      resource_type: effectiveResourceType,
      public_id: publicId,
    };

    if (effectiveResourceType === 'raw') {
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

  private cachedDDragonVersion: string | null = null;
  private lastVersionFetchTime = 0;
  private championCache: Map<string, { data: any[]; timestamp: number }> = new Map();

  async getLatestDDragonVersion(): Promise<string> {
    const now = Date.now();
    // Cache version trong 6 giờ
    if (this.cachedDDragonVersion && now - this.lastVersionFetchTime < 6 * 3600 * 1000) {
      return this.cachedDDragonVersion;
    }

    try {
      const res = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json', {
        timeout: 5000,
      });
      if (Array.isArray(res.data) && res.data.length > 0 && typeof res.data[0] === 'string') {
        this.cachedDDragonVersion = res.data[0];
        this.lastVersionFetchTime = now;
        return this.cachedDDragonVersion;
      }
    } catch (err: any) {
      // Fallback nếu Riot DDragon API tạm thời không phản hồi
    }

    return this.cachedDDragonVersion || '16.23.1';
  }

  async getDDragonVersions(): Promise<string[]> {
    try {
      const res = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json', {
        timeout: 5000,
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        if (typeof res.data[0] === 'string') {
          this.cachedDDragonVersion = res.data[0];
          this.lastVersionFetchTime = Date.now();
        }
        return res.data;
      }
    } catch {
      // Fallback
    }
    return [this.cachedDDragonVersion || '16.23.1'];
  }

  async getChampions(lang?: string, customVersion?: string) {
    // Chuẩn hoá ngôn ngữ: hỗ trợ 'vi_VN', 'en_US', 'vi', 'en', mặc định ưu tiên 'vi_VN'
    let normalizedLang = 'vi_VN';
    if (lang) {
      const lower = lang.toLowerCase();
      if (lower.startsWith('en')) {
        normalizedLang = 'en_US';
      } else if (lower.startsWith('vi') || lower.startsWith('vn')) {
        normalizedLang = 'vi_VN';
      } else {
        normalizedLang = lang;
      }
    }

    const version = customVersion?.trim() || (await this.getLatestDDragonVersion());
    const cacheKey = `${version}_${normalizedLang}`;
    const now = Date.now();

    // Check in-memory cache (TTL: 6 giờ)
    const cached = this.championCache.get(cacheKey);
    if (cached && now - cached.timestamp < 6 * 3600 * 1000) {
      return cached.data;
    }

    try {
      // Tải danh sách tướng động theo phiên bản Riot mới nhất và ngôn ngữ
      const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/${normalizedLang}/champion.json`;
      let res;
      try {
        res = await axios.get(url, { timeout: 8000 });
      } catch (fetchErr) {
        // Nếu fetch bản tiếng Việt vi_VN lỗi (ví dụ patch mới chưa kịp có locale vi), tự động fallback sang en_US
        if (normalizedLang !== 'en_US') {
          const fallbackUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
          res = await axios.get(fallbackUrl, { timeout: 8000 });
        } else {
          throw fetchErr;
        }
      }

      const raw = res.data;
      const dataObj = raw?.data || {};
      const activeVersion = raw?.version || version;

      const list = Object.values(dataObj).map((c: any) => ({
        ...c,
        version: activeVersion,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${activeVersion}/img/champion/${c.image?.full || c.id + '.png'}`,
      }));

      // Lưu vào cache
      this.championCache.set(cacheKey, { data: list, timestamp: now });
      return list;
    } catch (err: any) {
      // Nếu có cache cũ thì trả về tránh gián đoạn UI
      const stale = this.championCache.get(cacheKey);
      if (stale) return stale.data;
      return [];
    }
  }

  getAovHeroes() {
    return Array.isArray(aovHeroesData) ? aovHeroesData : [];
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
    apiKey = decryptSecret(apiKey);

    let mockReason = 'Hệ thống đang bận. Vui lòng thử lại sau!';

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

          // 3. Lấy 20 trận gần nhất (Match IDs)
          let recentMatches: string[] = [];
          try {
            const PLATFORM_TO_MATCH_REGION: Record<string, string> = {
              VN2: 'sea', SG2: 'sea', PH2: 'sea', TH2: 'sea', TW2: 'sea', OC1: 'sea',
              KR: 'asia', JP1: 'asia',
              NA1: 'americas', BR1: 'americas', LA1: 'americas', LA2: 'americas',
              EUW1: 'europe', EUN1: 'europe', TR1: 'europe', RU: 'europe',
            };
            const matchRegion = PLATFORM_TO_MATCH_REGION[platformId] || 'sea';
            
            const targetQueue = (dto.queueType || dto.queue_type || '').toUpperCase();
            let queueQuery = '';
            if (['SOLO', 'SOLO_DUO', 'RANKED_SOLO_5X5', 'RANK_SOLO'].includes(targetQueue)) {
              queueQuery = '&queue=420';
            } else if (['FLEX', 'RANKED_FLEX_SR', 'RANK_FLEX'].includes(targetQueue)) {
              queueQuery = '&queue=440';
            } else {
              queueQuery = '&type=ranked';
            }

            const matchHistoryUrl = `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${accountData.puuid}/ids?start=0&count=20${queueQuery}&api_key=${apiKey}`;
            const matchHistoryRes = await axios.get(matchHistoryUrl, { headers });
            recentMatches = Array.isArray(matchHistoryRes.data) ? matchHistoryRes.data : [];
          } catch (mErr: any) {
            console.warn('[Riot Match History Error]:', mErr.message);
          }

          return {
            success: true,
            isMock: false,
            leagues,
            puuid: accountData.puuid,
            gameName: accountData.gameName,
            tagLine: accountData.tagLine,
            recentMatches,
          };
        }
      } catch (err: any) {
        const status = err.response?.status;
        console.error(`[Riot API Player Error]: HTTP ${status}`, err.response?.data || err.message);
        if (status === 401 || status === 403) {
          mockReason = 'Hệ thống đang bận. Vui lòng thử lại sau!';
        } else if (status === 404) {
          mockReason = `Không tìm thấy người chơi "${gameName}#${tagLine}" trên Riot Server ${server}.`;
        } else {
          mockReason = 'Hệ thống đang bận. Vui lòng thử lại sau!';
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
      recentMatches: [
        'VN2_1640656388',
        'VN2_1640608730',
        'VN2_1640571634',
        'VN2_1640492570',
        'VN2_1640449961',
      ],
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

  async getRiotMatch(dto: any) {
    const matchId = typeof dto === 'string' ? dto : dto?.matchId;
    const server = dto?.server;
    const targetName = dto?.targetName;

    if (!matchId) throw new BadRequestException('Vui lòng cung cấp ID trận đấu');

    const SERVER_TO_PLATFORM: Record<string, string> = {
      VN: 'VN2', KR: 'KR', JP: 'JP1', NA: 'NA1', EUW: 'EUW1', EUNE: 'EUN1', OC: 'OC1',
      BR: 'BR1', LAS: 'LA2', LAN: 'LA1', RU: 'RU', TR: 'TR1', PH: 'PH2', SG: 'SG2',
      TH: 'TH2', TW: 'TW2',
    };

    const PLATFORM_TO_MATCH_REGION: Record<string, string> = {
      VN2: 'sea', SG2: 'sea', PH2: 'sea', TH2: 'sea', TW2: 'sea', OC1: 'sea',
      KR: 'asia', JP1: 'asia',
      NA1: 'americas', BR1: 'americas', LA1: 'americas', LA2: 'americas',
      EUW1: 'europe', EUN1: 'europe', TR1: 'europe', RU: 'europe',
    };

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
    apiKey = decryptSecret(apiKey);

    let platformId = 'VN2';
    if (server && SERVER_TO_PLATFORM[server.toUpperCase()]) {
      platformId = SERVER_TO_PLATFORM[server.toUpperCase()];
    } else if (matchId.includes('_')) {
      platformId = matchId.split('_')[0].toUpperCase();
    }

    const matchRegion = PLATFORM_TO_MATCH_REGION[platformId] || 'sea';
    const formattedMatchId = matchId.includes('_') ? matchId.trim() : `${platformId}_${matchId.trim()}`;

    if (!apiKey) {
      // Mock fallback nếu chưa có Riot API Key
      return {
        success: true,
        isMock: true,
        match: {
          matchId: formattedMatchId,
          gameMode: 'CLASSIC',
          gameDuration: 1845,
          win: true,
        },
        participant: {
          championName: 'Lee Sin',
          win: true,
          kills: 7,
          deaths: 2,
          assists: 8,
          riotIdGameName: targetName || 'Player',
          riotIdTagline: 'VN2',
        },
        leagueInfo: {
          queueType: 'RANKED_SOLO_5x5',
          tier: 'PLATINUM',
          rank: 'I',
          leaguePoints: 85,
        },
      };
    }

    try {
      const headers = { 'X-Riot-Token': apiKey };
      const matchUrl = `https://${matchRegion}.api.riotgames.com/lol/match/v5/matches/${formattedMatchId}?api_key=${apiKey}`;
      const matchRes = await axios.get(matchUrl, { headers });
      const data = matchRes.data;

      let leagueInfo = null;
      let participant = null;

      if (data.info?.participants) {
        if (targetName) {
          const cleanTarget = targetName.toLowerCase().replace(/\s/g, '').replace('#', '');
          participant = data.info.participants.find((p: any) => {
            const pName = (p.riotIdGameName || p.summonerName || '').toLowerCase().replace(/\s/g, '');
            const pTag = (p.riotIdTagline || '').toLowerCase();
            const fullName = pName + pTag;
            return fullName.includes(cleanTarget) || cleanTarget.includes(pName);
          });
        }

        // Nếu không truyền targetName hoặc tìm không ra, nhưng có danh sách -> lấy người chơi đầu tiên hoặc giữ null
        if (participant && participant.puuid) {
          try {
            const leagueUrl = `https://${platformId.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${participant.puuid}?api_key=${apiKey}`;
            const leagueRes = await axios.get(leagueUrl, { headers });
            const leagues = leagueRes.data || [];

            const isFlex = data.info.queueId === 440;
            const primaryQueue = isFlex ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5';
            const fallbackQueue = isFlex ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';

            leagueInfo =
              leagues.find((l: any) => l.queueType === primaryQueue) ||
              leagues.find((l: any) => l.queueType === fallbackQueue);
          } catch (leagueErr: any) {
            console.warn('[Riot League V4 Error]:', leagueErr.message);
          }
        }
      }

      return {
        success: true,
        match: data,
        leagueInfo,
        participant: participant
          ? {
              championName: participant.championName,
              win: participant.win,
              kills: participant.kills,
              deaths: participant.deaths,
              assists: participant.assists,
              riotIdGameName: participant.riotIdGameName,
              riotIdTagline: participant.riotIdTagline,
            }
          : null,
      };
    } catch (err: any) {
      const status = err.response?.status;
      console.error(`[Riot Match Error]: HTTP ${status}`, err.response?.data || err.message);
      if (status === 404) {
        throw new NotFoundException(`Không tìm thấy trận đấu "${formattedMatchId}" trên máy chủ Riot ${matchRegion.toUpperCase()}.`);
      } else {
        throw new BadRequestException('Hệ thống đang bận. Vui lòng thử lại sau!');
      }
    }
  }

  // Helper lấy Valorant API Key từ DB hoặc .env
  private async getValorantApiKey(): Promise<string> {
    const valKeySettings = await this.settingModel.find({
      key: { $in: ['VALORANT_API_KEY', 'HENRIKDEV_API_KEY', 'valorant_api_key', 'henrikdev_api_key'] },
    }).lean();

    for (const s of valKeySettings) {
      const val = typeof s?.value === 'string' ? s.value.trim() : '';
      if (val) return decryptSecret(val);
    }
    const envKey = (process.env.HENRIKDEV_API_KEY || process.env.VALORANT_API_KEY || '').trim();
    return decryptSecret(envKey);
  }

  // Tra cứu thông tin Rank và Match History Valorant (qua HenrikDev)
  async lookupValorantPlayer(input: ValorantPlayerLookupDto) {
    let gameName = (input.gameName || '').trim();
    let tagLine = (input.tagLine || '').trim();

    if (input.name && input.name.includes('#')) {
      const parts = input.name.split('#');
      gameName = parts[0].trim();
      tagLine = parts.slice(1).join('#').trim();
    } else if (!gameName && input.name) {
      gameName = input.name.trim();
    }

    if (!tagLine) tagLine = 'RIOT';

    const s = (input.server || 'ap').toLowerCase();
    const region = ['ap', 'na', 'eu', 'kr', 'latam', 'br'].includes(s)
      ? s
      : (['vn', 'sea', 'jp', 'tw', 'sg', 'th', 'ph', 'oc'].includes(s) ? 'ap' : 'ap');

    const apiKey = await this.getValorantApiKey();
    if (!apiKey) {
      throw new BadRequestException('Chưa cấu hình HENRIKDEV_API_KEY / VALORANT_API_KEY trong hệ thống (.env hoặc Admin Settings)');
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': apiKey,
        'Accept': 'application/json',
      };

      // 1. Lấy thông tin MMR / Rank hiện tại
      const mmrUrl = `https://api.henrikdev.xyz/valorant/v2/mmr/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      const mmrRes = await axios.get(mmrUrl, { headers }).catch((err) => {
        if (err.response?.status === 404) return null;
        throw err;
      });

      const mmrData = mmrRes?.data?.data;
      const currentTierPatched = mmrData?.current_data?.currenttierpatched || 'Unrated';
      const currentLp = mmrData?.current_data?.ranking_in_tier ?? 0;
      const elo = mmrData?.current_data?.elo ?? 0;

      // 2. Lấy danh sách trận gần nhất (size=20)
      let recentMatches: string[] = [];
      try {
        const matchesUrl = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}?mode=competitive&size=20`;
        const matchesRes = await axios.get(matchesUrl, { headers });
        if (Array.isArray(matchesRes.data?.data)) {
          recentMatches = matchesRes.data.data.map((m: any) => m.metadata?.matchid).filter(Boolean);
        }
      } catch (err: any) {
        // Không block nếu lấy trận gần nhất gặp lỗi
      }

      return {
        success: true,
        game: 'VALORANT',
        gameName: mmrData?.name || gameName,
        tagLine: mmrData?.tag || tagLine,
        puuid: mmrData?.puuid || '',
        currentTier: currentTierPatched,
        currentLp,
        elo,
        tierImage: mmrData?.current_data?.images?.large || null,
        leagues: [
          {
            queueType: 'COMPETITIVE',
            tier: currentTierPatched.toUpperCase(),
            rank: '',
            leaguePoints: currentLp,
            wins: mmrData?.by_season ? Object.values(mmrData.by_season).reduce((acc: number, s: any) => acc + (s?.wins || 0), 0) : 0,
            losses: 0,
          },
        ],
        recentMatches,
      };
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        throw new NotFoundException(`Không tìm thấy người chơi Valorant: ${gameName}#${tagLine} trên khu vực ${region.toUpperCase()}`);
      }
      if (status === 401 || status === 403) {
        throw new BadRequestException('HENRIKDEV_API_KEY không hợp lệ hoặc đã hết hạn/hết quota (HTTP 401/403).');
      }
      throw new BadRequestException(`HenrikDev API lỗi (HTTP ${status || 'Unknown'}): ${err.response?.data?.message || err.message}`);
    }
  }

  // Tra cứu chi tiết 1 trận đấu Valorant (qua HenrikDev)
  async lookupValorantMatch(input: ValorantMatchLookupDto) {
    const rawMatchId = (input.matchId || '').trim();
    if (!rawMatchId) throw new BadRequestException('Vui lòng cung cấp matchId');

    const apiKey = await this.getValorantApiKey();
    if (!apiKey) {
      throw new BadRequestException('Chưa cấu hình HENRIKDEV_API_KEY / VALORANT_API_KEY trong hệ thống (.env hoặc Admin Settings)');
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': apiKey,
        'Accept': 'application/json',
      };

      const matchUrl = `https://api.henrikdev.xyz/valorant/v2/match/${rawMatchId}`;
      const res = await axios.get(matchUrl, { headers });
      const matchData = res.data?.data;

      if (!matchData) {
        throw new NotFoundException('Không tìm thấy dữ liệu trận đấu Valorant');
      }

      const allPlayers = matchData.players?.all_players || [];
      const cleanTarget = (input.targetName || '').toLowerCase().replace(/\s/g, '');
      const cleanTargetNameOnly = cleanTarget.includes('#') ? cleanTarget.split('#')[0] : cleanTarget;

      let participant = null;
      if (cleanTarget) {
        participant = allPlayers.find((p: any) => {
          const pFullName = `${p.name}#${p.tag}`.toLowerCase().replace(/\s/g, '');
          const pName = (p.name || '').toLowerCase().replace(/\s/g, '');
          return pFullName === cleanTarget || pName === cleanTargetNameOnly;
        });
      }

      if (!participant && allPlayers.length > 0) {
        participant = allPlayers[0];
      }

      const playerTeam = (participant?.team || '').toLowerCase(); // 'blue' or 'red'
      const isWin = playerTeam === 'blue' ? matchData.teams?.blue?.has_won : matchData.teams?.red?.has_won;

      return {
        success: true,
        game: 'VALORANT',
        match: {
          ...matchData,
          isValorant: true,
          matchId: matchData.metadata?.matchid || rawMatchId,
        },
        participant: participant ? {
          puuid: participant.puuid,
          gameName: participant.name,
          tagLine: participant.tag,
          championName: participant.character, // Agent name: e.g. Sova, Jett
          kills: participant.stats?.kills ?? 0,
          deaths: participant.stats?.deaths ?? 0,
          assists: participant.stats?.assists ?? 0,
          score: participant.stats?.score ?? 0,
          currentTier: participant.currenttier_patched || 'Unrated',
          win: !!isWin,
        } : null,
        leagueInfo: participant ? {
          queueType: 'COMPETITIVE',
          tier: (participant.currenttier_patched || 'Unrated').toUpperCase(),
          rank: '',
          leaguePoints: 0,
        } : null,
      };
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        throw new NotFoundException(`Không tìm thấy trận đấu Valorant với ID: ${rawMatchId}`);
      }
      if (status === 401 || status === 403) {
        throw new BadRequestException('HENRIKDEV_API_KEY không hợp lệ hoặc đã hết hạn/hết quota.');
      }
      throw new BadRequestException(`HenrikDev API lỗi (HTTP ${status || 'Unknown'}): ${err.response?.data?.message || err.message}`);
    }
  }

  // Tra cứu Đa Năng (Unified Game Lookup) cho mọi game
  async lookupUnifiedPlayer(input: GamePlayerLookupDto) {
    const game = (input.game || 'LOL').toUpperCase();
    if (game.includes('VAL')) {
      return this.lookupValorantPlayer(input);
    }
    return this.getRiotPlayer(input);
  }

  async lookupUnifiedMatch(input: GameMatchLookupDto) {
    const game = (input.game || 'LOL').toUpperCase();
    if (game.includes('VAL')) {
      return this.lookupValorantMatch(input);
    }
    return this.getRiotMatch(input);
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

