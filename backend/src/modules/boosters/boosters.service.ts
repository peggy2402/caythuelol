import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

import { IUser, UserRole } from '../../database/schemas/User';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { IBoosterApplication } from '../../database/schemas/BoosterApplication';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { ITransaction, TransactionType, TransactionStatus } from '../../database/schemas/Transaction';

export const DEFAULT_SERVICE_SETTINGS = {
  enabledServices: ['RANK_BOOST', 'PROMOTION', 'NET_WINS', 'LEVELING', 'PLACEMENTS', 'MASTERY', 'COACHING'],
  servers: ['VN', 'KR', 'JP', 'NA', 'EUW'],
  rankPrices: {
    IRON_IV: 15000, IRON_III: 15000, IRON_II: 15000, IRON_I: 15000,
    BRONZE_IV: 20000, BRONZE_III: 20000, BRONZE_II: 20000, BRONZE_I: 20000,
    SILVER_IV: 25000, SILVER_III: 25000, SILVER_II: 25000, SILVER_I: 25000,
    GOLD_IV: 35000, GOLD_III: 35000, GOLD_II: 35000, GOLD_I: 35000,
    PLATINUM_IV: 50000, PLATINUM_III: 50000, PLATINUM_II: 50000, PLATINUM_I: 50000,
    EMERALD_IV: 70000, EMERALD_III: 75000, EMERALD_II: 80000, EMERALD_I: 90000,
    DIAMOND_IV: 120000, DIAMOND_III: 140000, DIAMOND_II: 180000, DIAMOND_I: 250000,
    MASTER: 400000, GRANDMASTER: 600000, CHALLENGER: 900000,
  },
  rankPricesFlex: {},
  rankPricesDuo: {},
  promotionPrices: {
    IRON: 20000, BRONZE: 30000, SILVER: 45000, GOLD: 65000,
    PLATINUM: 95000, EMERALD: 150000, DIAMOND: 250000,
  },
  promotionPricesFlex: {},
  promotionPricesDuo: {},
  placementPrices: {
    UNRANKED: 25000, IRON: 20000, BRONZE: 25000, SILVER: 30000,
    GOLD: 40000, PLATINUM: 60000, EMERALD: 85000, DIAMOND: 130000,
  },
  placementPricesFlex: {},
  placementPricesDuo: {},
  netWinPrices: {
    IRON: 15000, BRONZE: 20000, SILVER: 25000, GOLD: 35000,
    PLATINUM: 50000, EMERALD: 75000, DIAMOND: 120000, MASTER: 180000,
  },
  netWinPricesFlex: {},
  netWinPricesDuo: {},
  netWinDepositPercent: 50,
  levelingPrices: { perLevel: 8000 },
  masteryPrices: { perPoint: 5 },
  lpModifiers: { low: 20, medium: 0, high: -20 },
  options: {
    schedule: true,
    scheduleFee: 0,
    roles: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'],
    specificChamps: 30,
    streaming: 349000,
    express: 35,
    duo: 50,
  },
  queueModifiers: { SOLO_DUO: 0, FLEX: 0, TFT: 0 },
};

@Injectable()
export class BoostersService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
    @InjectModel('BoosterApplication') private boosterAppModel: Model<IBoosterApplication>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    private jwtService: JwtService,
  ) { }

  getAvailableServiceTypes(gameCode?: string) {
    const code = (gameCode || 'LOL').toUpperCase();
    const map: Record<string, any[]> = {
      LOL: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank / Elo Siêu Tốc',
          desc: 'Leo rank bước nhảy từ Sắt IV đến Cao Thủ với tỷ lệ thắng cao.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Điểm Cao Thủ / Thách Đấu',
          desc: 'Cày điểm LP Cao Thủ, Đại Cao Thủ, Thách Đấu tính theo điểm.',
          pricingType: 'TIER_PER_POINT',
          defaultPrice: 1500,
          allowDeposit: true,
          depositPercent: 30,
          unitName: 'Điểm LP',
          tierRates: {
            master: 1000,
            grandmaster: 1500,
            challenger: 2000,
          },
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Đầu Mùa (5 Trận)',
          desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải thuận lợi.',
          pricingType: 'FIXED',
          defaultPrice: 150000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'promotion',
          name: 'Chuỗi Thăng Hạng',
          desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn.',
          pricingType: 'FIXED',
          defaultPrice: 80000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'leveling',
          name: 'Cày Cấp Độ 1-30',
          desc: 'Cày cấp tài khoản lên cấp 30 nhanh nhất, tối đa Tinh Hoa Lam.',
          pricingType: 'FIXED',
          defaultPrice: 120000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Coaching',
          desc: 'Dạy kèm 1-1, phân tích replay, duo cùng tuyển thủ.',
          pricingType: 'PER_UNIT',
          defaultPrice: 100000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
        {
          serviceType: 'mastery',
          name: 'Cày Thông Thạo Tướng',
          desc: 'Cày điểm thông thạo & nâng cấp mốc biểu cảm cho vị tướng yêu thích.',
          pricingType: 'PER_UNIT',
          defaultPrice: 60000,
          unitName: 'Mốc cấp',
          allowDeposit: false,
          depositPercent: 100,
        },
      ],
      VALORANT: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank Valorant (Iron ➔ Radiant)',
          desc: 'Leo rank từ Iron đến Radiant với aim sắc bén, tỷ lệ thắng cao và hoàn thành siêu tốc.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Điểm RR (Immortal / Radiant)',
          desc: 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số hoặc chuỗi trận.',
          pricingType: 'TIER_PER_POINT',
          defaultPrice: 5000,
          unitName: 'Điểm RR',
          allowDeposit: true,
          depositPercent: 40,
          tierRates: {
            immortal1_2: 5000,
            immortal2_3: 7000,
            immortal3_radiant: 10000,
            radiant_top100: 20000,
          },
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Valorant (5 Trận)',
          desc: 'Đảm bảo kết quả 5 trận phân hạng đạt Rank khởi đầu cao nhất trong Episode/Act mới.',
          pricingType: 'FIXED',
          defaultPrice: 180000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'leveling',
          name: 'Cày Cấp 20 Mở Khóa Đấu Xếp Hạng',
          desc: 'Cày cấp tài khoản lên Level 20 để mở khóa chế độ Competitive (Đấu Xếp Hạng) nhanh chóng.',
          pricingType: 'FIXED',
          defaultPrice: 150000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Coaching 1-1 (Aim & Lineup)',
          desc: 'Hướng dẫn kê tâm, setup góc bắn, lineup kỹ năng và đọc map cùng tuyển thủ Radiant.',
          pricingType: 'PER_UNIT',
          defaultPrice: 120000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
        {
          serviceType: 'battle-pass',
          name: 'Cày Battle Pass / Hợp Đồng Đặc Vụ',
          desc: 'Cày kinh nghiệm hoàn thành Battle Pass mùa giải hoặc mở khóa đặc vụ (Agent Contract).',
          pricingType: 'FIXED',
          defaultPrice: 140000,
          allowDeposit: false,
          depositPercent: 100,
        },
      ],
      TFT: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank ĐTCL (Sắt ➔ Thách Đấu)',
          desc: 'Leo rank cờ ĐTCL chuẩn meta, tối ưu kinh tế và bài đấu.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Top 1-4 & LP Thách Đấu',
          desc: 'Đảm bảo tỷ lệ vào Top 4 và cày điểm LP bậc Cao Thủ / Thách Đấu ĐTCL.',
          pricingType: 'PER_UNIT',
          defaultPrice: 2000,
          unitName: 'Điểm LP',
          allowDeposit: true,
          depositPercent: 30,
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Đầu Mùa ĐTCL (5 Trận)',
          desc: 'Bắn chuỗi phân hạng khởi đầu mùa giải đạt vị trí cao nhất.',
          pricingType: 'FIXED',
          defaultPrice: 140000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Xoay Bài & Eco 1-1',
          desc: 'Kèm 1-1 trực tiếp trong trận, hướng dẫn quản lý vàng, xoay bài linh hoạt theo roll.',
          pricingType: 'PER_UNIT',
          defaultPrice: 100000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
      ],
      CS2: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Điểm CS Rating Premier',
          desc: 'Tăng điểm CS Rating từ 5.000 đến 25.000+ điểm Premier chuyên nghiệp.',
          pricingType: 'PER_UNIT',
          defaultPrice: 25000,
          unitName: '1.000 Điểm',
          allowDeposit: true,
          depositPercent: 40,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Trận Thắng Premier',
          desc: 'Bắn đảm bảo trận thắng ròng, tăng tỷ lệ winrate tài khoản.',
          pricingType: 'PER_UNIT',
          defaultPrice: 35000,
          unitName: 'Trận thắng',
          allowDeposit: true,
          depositPercent: 50,
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Đầu Mùa (10 Trận)',
          desc: 'Bắn 10 trận mở điểm CS Rating với winrate 80%+.',
          pricingType: 'FIXED',
          defaultPrice: 200000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Aim & Nades 1-1',
          desc: 'Dạy line-up smoke, flash, molly và chỉnh crosshair placement.',
          pricingType: 'PER_UNIT',
          defaultPrice: 120000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
      ],
      DOTA2: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Điểm MMR Dota 2',
          desc: 'Leo điểm MMR từ Herald đến Immortal cùng tuyển thủ top bảng xếp hạng.',
          pricingType: 'PER_UNIT',
          defaultPrice: 30000,
          unitName: '100 MMR',
          allowDeposit: true,
          depositPercent: 40,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Trận Thắng Dota 2',
          desc: 'Đảm bảo thắng ròng các trận đấu xếp hạng.',
          pricingType: 'PER_UNIT',
          defaultPrice: 40000,
          unitName: 'Trận thắng',
          allowDeposit: true,
          depositPercent: 50,
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Calibration (10 Trận)',
          desc: 'Phân hạng điểm khởi đầu mùa giải cao nhất có thể.',
          pricingType: 'FIXED',
          defaultPrice: 220000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Coaching 1-1 Dota 2',
          desc: 'Phân tích replay, kiểm soát laning phase, macro game.',
          pricingType: 'PER_UNIT',
          defaultPrice: 120000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
      ],
      OVERWATCH2: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank Overwatch 2 (Bronze ➔ Grandmaster)',
          desc: 'Leo rank theo bậc từ Bronze đến Grandmaster / Top 500.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Trận Thắng Overwatch 2',
          desc: 'Đảm bảo chuỗi trận thắng ròng các vị trí Tank / Damage / Support.',
          pricingType: 'PER_UNIT',
          defaultPrice: 35000,
          unitName: 'Trận thắng',
          allowDeposit: true,
          depositPercent: 50,
        },
        {
          serviceType: 'placements',
          name: 'Phân Hạng Mùa Giải (5 Trận)',
          desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất.',
          pricingType: 'FIXED',
          defaultPrice: 180000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Coaching 1-1',
          desc: 'Hướng dẫn định vị trí, phối hợp combo chiêu cuối và aim.',
          pricingType: 'PER_UNIT',
          defaultPrice: 120000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
      ],
      UNIVERSAL: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank Xếp Hạng Siêu Tốc',
          desc: 'Leo rank thăng hạng nhanh chóng với tỷ lệ thắng vượt trội.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Trận Thắng Đảm Bảo',
          desc: 'Đảm bảo số trận thắng ròng xếp hạng theo yêu cầu.',
          pricingType: 'PER_UNIT',
          defaultPrice: 30000,
          unitName: 'Trận thắng',
          allowDeposit: true,
          depositPercent: 40,
        },
        {
          serviceType: 'placements',
          name: 'Cày Trận Phân Hạng Đầu Mùa',
          desc: 'Đảm bảo kết quả tối đa các trận phân hạng mở màn mùa giải mới.',
          pricingType: 'FIXED',
          defaultPrice: 150000,
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Coaching 1-1',
          desc: 'Dạy kèm 1-1, phân tích replay, hướng dẫn kỹ năng nâng cao cùng tuyển thủ.',
          pricingType: 'PER_UNIT',
          defaultPrice: 100000,
          unitName: 'Giờ học',
          allowDeposit: true,
          depositPercent: 50,
        },
      ],
    };

    return {
      success: true,
      data: map[code] || map['LOL'],
    };
  }

  async listMarketplaceServices(query: {
    gameCode?: string;
    search?: string;
    boosterId?: string;
    pricingType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(50, Number(query.limit || 20)));

    const matchQuery: any = { role: UserRole.BOOSTER };
    if (query.boosterId && Types.ObjectId.isValid(query.boosterId)) {
      matchQuery._id = new Types.ObjectId(query.boosterId);
    }

    const boosters = await this.userModel
      .find(matchQuery)
      .select('username profile booster_info')
      .lean();

    const boosterIds = boosters.map((b) => b._id);
    const profiles = await this.boosterProfileModel
      .find({ userId: { $in: boosterIds } })
      .lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    let allServices: any[] = [];

    // Helper chuẩn hóa mã game để match cả LOL/LMHT, TFT/DTCL, AOV/LIENQUAN
    const normalizeGameCode = (c?: string) => {
      const code = (c || '').toUpperCase().trim();
      if (code === 'LMHT' || code === 'LOL') return 'LOL';
      if (code === 'DTCL' || code === 'TFT') return 'TFT';
      if (code === 'LIENQUAN' || code === 'AOV') return 'AOV';
      if (code === 'TOCCHIEN' || code === 'WILDRIFT') return 'WILDRIFT';
      if (code === 'FCO' || code === 'FCONLINE') return 'FCONLINE';
      return code;
    };

    const targetGameCode = query.gameCode ? normalizeGameCode(query.gameCode) : null;

    for (const b of boosters) {
      const customServices = b.booster_info?.service_settings?.customServices;
      const coupon = b.booster_info?.service_settings?.coupon || null;
      const profile = profileMap.get(b._id.toString());

      // Lấy danh sách tựa game booster thực tế nhận cày (selectedGames)
      const rawSelectedGames = b.booster_info?.service_settings?.selectedGames;
      const selectedGamesList: string[] | null = Array.isArray(rawSelectedGames) && rawSelectedGames.length > 0
        ? rawSelectedGames.map((g: any) => normalizeGameCode(typeof g === 'string' ? g : g.gameCode))
        : null;

      // NẾU BOOSTER KHÔNG NHẬN CÀY TỰA GAME ĐANG TÌM KIẾM -> BỎ QUA HOÀN TOÀN!
      if (selectedGamesList && targetGameCode && !selectedGamesList.includes(targetGameCode)) {
        continue;
      }

      if (Array.isArray(customServices) && customServices.length > 0) {
        for (const s of customServices) {
          if (s.isActive === false) continue;

          const serviceGameCode = normalizeGameCode(s.gameCode);

          // Bắt buộc: Tựa game của dịch vụ phải nằm trong selectedGames của booster!
          if (selectedGamesList && !selectedGamesList.includes(serviceGameCode)) {
            continue;
          }

          // Filter by gameCode
          if (targetGameCode) {
            if (serviceGameCode && serviceGameCode !== targetGameCode) {
              continue;
            }
          }

          // Filter by pricingType
          if (query.pricingType && s.pricingType !== query.pricingType) {
            continue;
          }

          // Filter by search keyword
          if (query.search) {
            const q = query.search.toLowerCase().trim();
            const matchName = (s.name || '').toLowerCase().includes(q);
            const matchDesc = (s.desc || '').toLowerCase().includes(q);
            const matchBooster = (b.username || '').toLowerCase().includes(q);
            if (!matchName && !matchDesc && !matchBooster) continue;
          }

          allServices.push({
            ...s,
            booster: {
              _id: b._id,
              username: b.username,
              displayName: profile?.displayName || b.username,
              avatar: b.profile?.avatar || '',
              rating: profile?.rating || b.booster_info?.rating || 0,
              completedOrders: profile?.completedOrders || b.booster_info?.completed_orders || 0,
              coupon: coupon && coupon.isActive ? coupon : null,
            },
          });
        }
      }
    }

    const total = allServices.length;
    const startIndex = (page - 1) * limit;
    const paginated = allServices.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getServiceDetail(serviceId: string) {
    if (!serviceId) throw new BadRequestException('Mã dịch vụ không được để trống');

    const cleanId = serviceId.trim();

    // Tìm booster sở hữu dịch vụ này
    const booster = await this.userModel
      .findOne({
        role: UserRole.BOOSTER,
        'booster_info.service_settings.customServices.id': cleanId,
      })
      .select('-password_hash')
      .lean();

    if (!booster) {
      throw new NotFoundException('Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động');
    }

    const services = booster.booster_info?.service_settings?.customServices || [];
    const service = services.find((s: any) => s.id === cleanId);

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const [profile, app] = await Promise.all([
      this.boosterProfileModel.findOne({ userId: booster._id }).lean(),
      this.boosterAppModel.findOne({ userId: booster._id }).lean(),
    ]);

    const coupon = booster.booster_info?.service_settings?.coupon;

    return {
      success: true,
      service,
      booster: {
        _id: booster._id,
        username: booster.username,
        displayName: profile?.displayName || booster.username,
        avatar: booster.profile?.avatar || '',
        bio: profile?.bio || booster.booster_info?.bio || '',
        rating: profile?.rating || booster.booster_info?.rating || 0,
        completedOrders: profile?.completedOrders || booster.booster_info?.completed_orders || 0,
        currentRank: (app as any)?.currentRank || 'N/A',
        highestRank: (app as any)?.highestRank || 'N/A',
        coupon: coupon && coupon.isActive ? coupon : null,
      },
    };
  }

  async listBoosters(query: {
    search?: string;
    server?: string;
    service?: string;
    game?: string;
    gameCode?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 12);
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: { role: UserRole.BOOSTER } },
      {
        $lookup: {
          from: 'boosterprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profileDoc',
        },
      },
      { $unwind: { path: '$profileDoc', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          displayName: { $ifNull: ['$profileDoc.displayName', '$username'] },
          avatar: '$profile.avatar',
          services: {
            $setUnion: [
              { $ifNull: ['$profileDoc.services', []] },
              { $ifNull: ['$booster_info.services', []] },
              { $ifNull: ['$booster_info.service_settings.enabledServices', []] },
            ],
          },
          selectedGames: {
            $cond: {
              if: {
                $and: [
                  { $isArray: '$booster_info.service_settings.selectedGames' },
                  { $gt: [{ $size: '$booster_info.service_settings.selectedGames' }, 0] },
                ],
              },
              then: '$booster_info.service_settings.selectedGames',
              else: {
                $setUnion: [
                  {
                    $map: {
                      input: { $ifNull: ['$profileDoc.games', []] },
                      as: 'g',
                      in: '$$g.gameCode',
                    },
                  },
                  { $ifNull: ['$booster_info.main_games', []] },
                ],
              },
            },
          },
          rating: { $ifNull: ['$profileDoc.rating', '$booster_info.rating', 0] },
          completedOrders: {
            $ifNull: ['$profileDoc.completedOrders', '$booster_info.completed_orders', 0],
          },
          games: { $ifNull: ['$profileDoc.games', []] },
          bio: { $ifNull: ['$profileDoc.bio', '$booster_info.bio', ''] },
          booster_info: '$booster_info',
        },
      },
    ];

    const andConditions: any[] = [];
    if (query.server) {
      andConditions.push({ 'games.servers': query.server });
    }
    if (query.service) {
      andConditions.push({
        $or: [
          { services: query.service },
          { 'booster_info.services': query.service },
          { 'profileDoc.services': query.service },
        ],
      });
    }

    const targetGame = (query.game || query.gameCode || '').trim();
    if (targetGame) {
      let normalized = targetGame.toUpperCase();
      if (['VAL', 'VALORANT'].includes(normalized)) normalized = 'VALORANT';
      else if (['LOL', 'LMHT', 'LEAGUE'].includes(normalized)) normalized = 'LOL';
      else if (['TFT', 'DTCL'].includes(normalized)) normalized = 'TFT';
      else if (['CS', 'CS2', 'CSGO'].includes(normalized)) normalized = 'CS2';
      else if (['AOV', 'LQM', 'LIENQUAN'].includes(normalized)) normalized = 'AOV';
      else if (['WILDRIFT', 'WR', 'TOCCHIEN'].includes(normalized)) normalized = 'WILDRIFT';

      const gameRegex = new RegExp(`^(${normalized}|${targetGame})$`, 'i');
      andConditions.push({
        // 1. Tựa game bắt buộc phải nằm trong selectedGames của booster
        $or: [
          {
            'booster_info.service_settings.selectedGames': {
              $elemMatch: { $regex: gameRegex },
            },
          },
          // Fallback nếu booster chưa từng cấu hình studio selectedGames
          {
            'booster_info.service_settings.selectedGames': { $exists: false },
            $or: [
              { 'booster_info.main_games': { $in: [normalized.toLowerCase(), targetGame.toLowerCase(), normalized, targetGame] } },
              { 'profileDoc.games.gameCode': { $regex: gameRegex } },
            ],
          },
        ],
        // 2. Bắt buộc booster phải có ít nhất 1 dịch vụ thực tế trong customServices thuộc tựa game này và đang bật (isActive === true)
        'booster_info.service_settings.customServices': {
          $elemMatch: {
            $or: [
              { gameCode: { $regex: gameRegex } },
              ...(normalized === 'LOL' ? [{ gameCode: { $exists: false } }] : []),
            ],
            isActive: true,
          },
        },
      });
    }

    if (query.search) {
      andConditions.push({
        $or: [
          { username: { $regex: query.search, $options: 'i' } },
          { displayName: { $regex: query.search, $options: 'i' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      pipeline.push({ $match: { $and: andConditions } });
    }

    let sortStage: any = { rating: -1, completedOrders: -1, _id: 1 };
    if (query.sort === 'orders_desc') {
      sortStage = { completedOrders: -1, rating: -1, _id: 1 };
    }
    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
              displayName: 1,
              bio: 1,
              games: 1,
              services: 1,
              rating: 1,
              completedOrders: 1,
              booster_info: 1,
            },
          },
        ],
      },
    });

    const result = await this.userModel.aggregate(pipeline);
    const boosters = result[0]?.data || [];
    const total = result[0]?.metadata[0]?.total || 0;

    return {
      success: true,
      boosters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBoosterById(idOrUsername: string): Promise<any> {
    const raw = decodeURIComponent(idOrUsername || '').trim();
    const cleanUsername = raw.replace(/^@+/, '');

    const orConditions: any[] = [
      { username: { $regex: new RegExp(`^@?${cleanUsername}$`, 'i') } },
      { 'booster_info.ingame_name': { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
    ];

    if (Types.ObjectId.isValid(raw)) {
      orConditions.push({ _id: new Types.ObjectId(raw) });
    }
    if (Types.ObjectId.isValid(cleanUsername)) {
      orConditions.push({ _id: new Types.ObjectId(cleanUsername) });
    }

    const query = { $or: orConditions };

    const user = await this.userModel.findOne(query).select('-password_hash').lean();
    if (!user) throw new NotFoundException('Không tìm thấy Booster');

    const [profile, application, completedOrdersCount, reviews, relatedBoosters, ordersLast30Days, likesCount] =
      await Promise.all([
        this.boosterProfileModel.findOne({ userId: user._id }).lean(),
        this.boosterAppModel.findOne({ userId: user._id }).lean(),
        this.orderModel.countDocuments({ boosterId: user._id, status: OrderStatus.COMPLETED }),
        this.orderModel
          .find({ boosterId: user._id, status: OrderStatus.COMPLETED, rating: { $exists: true } })
          .populate('customerId', 'username profile.avatar')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        this.userModel
          .find({ role: UserRole.BOOSTER, _id: { $ne: user._id } })
          .select('username profile booster_info')
          .limit(6)
          .lean(),
        this.orderModel
          .find({
            boosterId: user._id,
            status: OrderStatus.COMPLETED,
            updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          })
          .select('match_history')
          .lean(),
        this.userModel.countDocuments({ bookmarks: user._id }),
      ]);

    const rawBoosterInfo = user.booster_info || (profile as any)?.booster_info || {};
    const existingSettings = rawBoosterInfo.service_settings || {};

    // Đảm bảo luôn có service_settings và options hợp lệ để frontend hiển thị mượt mà
    const mergedSettings = {
      ...DEFAULT_SERVICE_SETTINGS,
      ...existingSettings,
      options: {
        ...DEFAULT_SERVICE_SETTINGS.options,
        ...(existingSettings.options || {}),
      },
      rankPrices: {
        ...DEFAULT_SERVICE_SETTINGS.rankPrices,
        ...(existingSettings.rankPrices || {}),
      },
    };

    const boosterInfo = {
      ...rawBoosterInfo,
      service_settings: mergedSettings,
    };

    const realAvatar = user.profile?.avatar || (profile as any)?.avatar || user.avatar || '';
    const realDisplayName = (profile as any)?.displayName || (user as any)?.displayName || user.username;

    const booster = {
      ...user,
      ...profile,
      avatar: realAvatar,
      displayName: realDisplayName,
      booster_info: boosterInfo,
      service_settings: mergedSettings,
      addonsConfig: existingSettings.addonsConfig || existingSettings.standardConfig?.addonsConfig,
      profile: user.profile || profile,
      currentRank:
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 1 && g.ranks[1] && g.ranks[1] !== 'N/A')?.ranks?.[1] ||
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 0 && g.ranks[0] && g.ranks[0] !== 'N/A')?.ranks?.[0] ||
        user.booster_info?.currentRank ||
        (application as any)?.currentRank ||
        'Cao Thủ',
      highestRank:
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 0 && g.ranks[0] && g.ranks[0] !== 'N/A')?.ranks?.[0] ||
        user.booster_info?.highestRank ||
        (application as any)?.highestRank ||
        'Thách Đấu',
      performanceScore: (profile as any)?.performanceScore || user.booster_info?.performanceScore || 85,
      tier: (profile as any)?.tier || user.booster_info?.tier || 'DIAMOND',
      tierName: (profile as any)?.tierName || user.booster_info?.tierName || 'Diamond',
      completed_orders: completedOrdersCount,
      rating: user.booster_info?.rating || (profile as any)?.rating || 0,
      bio: user.booster_info?.bio || (profile as any)?.bio || '',
      likes_count: likesCount || 0,
      favoritesCount: likesCount || 0,
    };

    let wins = 0;
    let losses = 0;
    const winRateTrendData: number[] = [];
    let cumulativeWins = 0;
    let cumulativeTotal = 0;

    if (ordersLast30Days) {
      for (const order of ordersLast30Days as any[]) {
        if (order.match_history && Array.isArray(order.match_history)) {
          for (const match of order.match_history) {
            cumulativeTotal++;
            if (match.result === 'WIN') {
              wins++;
              cumulativeWins++;
            }
            if (match.result === 'LOSS') losses++;
            winRateTrendData.push(Math.round((cumulativeWins / cumulativeTotal) * 100));
          }
        }
      }
    }

    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      success: true,
      booster,
      boosterData: booster,
      user: {
        ...user,
        avatar: realAvatar,
        displayName: realDisplayName,
      },
      profile,
      reviews: reviews || [],
      relatedBoosters: relatedBoosters || [],
      stats: {
        wins,
        losses,
        winRate,
        winRateTrendData,
      },
    };
  }

  async toggleAvailability(userId: string, isReady: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (!user.booster_info) user.booster_info = {};
    user.booster_info.isReady = isReady;
    await this.userModel.collection.updateOne(
      { _id: user._id },
      { $set: { 'booster_info.isReady': isReady } },
    );

    return { success: true, isReady };
  }

  async getJobMarket(userId: string) {
    const [rawDirectRequests, rawPublicJobs] = await Promise.all([
      this.orderModel
        .find({
          status: OrderStatus.PAID,
          boosterId: new Types.ObjectId(userId),
        })
        .populate('customerId', 'username profile')
        .sort({ createdAt: -1 })
        .lean(),
      this.orderModel
        .find({
          status: OrderStatus.PAID,
          $or: [{ boosterId: null }, { boosterId: { $exists: false } }],
        })
        .populate('customerId', 'username profile')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Bảo mật: Ẩn thông tin tài khoản game (username, password) cho đến khi Booster thực sự nhận đơn
    const sanitizeJob = (job: any) => {
      const sanitized = { ...job };
      if (sanitized.pricing) {
        const total = Number(sanitized.pricing.total_amount || 0);
        const serviceFee = Number(sanitized.pricing.service_fee || 0);
        let netOrderValue = serviceFee > 0 ? Math.max(0, total - serviceFee) : 0;

        if (!netOrderValue && sanitized.pricing.original_price) {
          netOrderValue = Math.max(
            0,
            Number(sanitized.pricing.original_price) - Number(sanitized.pricing.discount_amount || 0),
          );
        }

        if (!netOrderValue && sanitized.pricing.platform_fee_percent && sanitized.pricing.platform_fee_percent > 0) {
          netOrderValue = Math.round(total / (1 + Number(sanitized.pricing.platform_fee_percent) / 100));
        }

        if (!netOrderValue) {
          netOrderValue = total;
        }

        sanitized.pricing = {
          ...sanitized.pricing,
          booster_order_value: netOrderValue,
        };
      }
      if (sanitized.details) {
        sanitized.details = { ...sanitized.details };
        if (sanitized.details.account_info) {
          sanitized.details.account_info = {
            platform: sanitized.details.account_info.platform || 'Riot',
            username: '*** (Nhận đơn để xem)',
            password: '••••••••',
          };
        }
        delete sanitized.details.account_username;
        delete sanitized.details.account_password;
      }
      delete sanitized.account_credentials;
      return sanitized;
    };

    const directRequests = rawDirectRequests.map(sanitizeJob);
    const publicJobs = rawPublicJobs.map(sanitizeJob);

    return {
      success: true,
      directRequests,
      publicJobs,
      orders: publicJobs,
    };
  }

  async getMyOrders(userId: string, status?: string) {
    const filter: any = { boosterId: new Types.ObjectId(userId) };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    const orders = await this.orderModel
      .find(filter)
      .populate('customerId', 'username profile')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, orders };
  }

  async getServiceSettings(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const profile = await this.boosterProfileModel.findOne({ userId });
    return {
      success: true,
      settings: user.booster_info?.service_settings || {},
      profile: profile || null,
    };
  }

  async saveServiceSettings(userId: string, settings: any) {
    const normalizeGameCode = (c?: string) => {
      const code = (c || '').toUpperCase().trim();
      if (code === 'LMHT' || code === 'LOL') return 'LOL';
      if (code === 'DTCL' || code === 'TFT') return 'TFT';
      if (code === 'LIENQUAN' || code === 'AOV') return 'AOV';
      if (code === 'TOCCHIEN' || code === 'WILDRIFT') return 'WILDRIFT';
      if (code === 'FCO' || code === 'FCONLINE') return 'FCONLINE';
      return code;
    };

    const normalizedSelectedGames = Array.isArray(settings.selectedGames)
      ? settings.selectedGames.map((g: any) => normalizeGameCode(typeof g === 'string' ? g : g.gameCode))
      : [];

    // Tự động vô hiệu hóa (isActive = false) các dịch vụ thuộc tựa game mà booster đã bỏ chọn
    if (Array.isArray(settings.customServices) && normalizedSelectedGames.length > 0) {
      settings.customServices = settings.customServices.map((s: any) => {
        const sGame = normalizeGameCode(s.gameCode);
        const isGameSelected = normalizedSelectedGames.includes(sGame);
        return {
          ...s,
          isActive: isGameSelected ? s.isActive !== false : false,
        };
      });
    }

    // Cập nhật enabledServices chỉ bao gồm các dịch vụ active của tựa game được chọn
    if (Array.isArray(settings.customServices)) {
      settings.enabledServices = settings.customServices
        .filter((s: any) => s.isActive === true)
        .map((s: any) => s.slug || s.serviceType || s.id);
    }

    const userUpdate: any = {
      'booster_info.service_settings': settings,
    };
    if (normalizedSelectedGames.length > 0) {
      userUpdate['booster_info.main_games'] = normalizedSelectedGames.map((g) => g.toLowerCase());
    }

    await this.userModel.collection.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: userUpdate },
    );

    const updateDoc: any = {};
    if (settings.enabledServices) {
      updateDoc.services = settings.enabledServices;
    } else if (Array.isArray(settings.customServices)) {
      updateDoc.services = settings.customServices
        .filter((s: any) => s.isActive !== false)
        .map((s: any) => s.slug || s.name || s.id);
    }

    if (Array.isArray(settings.selectedGames)) {
      updateDoc.games = settings.selectedGames.map((g: string) => ({
        gameCode: typeof g === 'string' ? g.toUpperCase() : (g as any).gameCode || 'LOL',
        ranks: [],
        servers: settings.servers || ['VN'],
      }));
    }

    if (Object.keys(updateDoc).length > 0) {
      await this.boosterProfileModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateDoc },
        { upsert: true },
      );
    }

    return { success: true, message: 'Đã lưu cấu hình dịch vụ thành công' };
  }

  async generateCouponCode(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy thông tin booster');

    const rawUsername = (user.username || 'PRO').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const prefix = rawUsername.length >= 3 ? rawUsername.slice(0, 4) : 'LEO';

    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let generatedCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 25) {
      attempts++;
      let randomStr = '';
      for (let i = 0; i < 4; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      generatedCode = `${prefix}${randomStr}`;

      const existingUser = await this.userModel.findOne({
        'booster_info.service_settings.coupon.code': generatedCode,
      });

      const existingProfile = await this.boosterProfileModel.findOne({
        'games.metadata.coupons.code': generatedCode,
      });

      if (!existingUser && !existingProfile) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      generatedCode = `${prefix}${Date.now().toString().slice(-4)}`;
    }

    return {
      success: true,
      code: generatedCode,
    };
  }

  async getStats(userId: string) {
    const objId = new Types.ObjectId(userId);

    const [earningsResult, ordersStats] = await Promise.all([
      this.transactionModel.aggregate([
        {
          $match: {
            userId: objId,
            type: TransactionType.PAYMENT_RELEASE,
            status: TransactionStatus.SUCCESS,
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.orderModel.aggregate([
        { $match: { boosterId: objId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalEarnings = earningsResult[0]?.total || 0;
    const stats: Record<string, number> = {};
    ordersStats.forEach((s) => {
      stats[s._id] = s.count;
    });

    const userDoc = await this.userModel.findById(objId).select('booster_info');
    const rating = userDoc?.booster_info?.rating || 0;

    return {
      success: true,
      stats: {
        totalEarnings,
        completedOrders: stats[OrderStatus.COMPLETED] || 0,
        inProgressOrders: stats[OrderStatus.IN_PROGRESS] || 0,
        approvedOrders: stats[OrderStatus.APPROVED] || 0,
        rating,
      },
    };
  }

  async becomeBooster(userId: string, body: any) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    if (user.role === UserRole.BOOSTER) {
      return {
        success: true,
        message: 'Bạn đã là Tuyển thủ (Booster) của LeoRank!',
        role: user.role,
      };
    }

    // Nâng cấp role lên BOOSTER
    user.role = UserRole.BOOSTER;
    user.booster_info = {
      bio: body.bio || user.booster_info?.bio || 'Tuyển thủ cày thuê uy tín',
      ingame_name: body.ingameName || user.username,
      main_games: body.mainGames && body.mainGames.length > 0 ? body.mainGames : ['lol'],
      rating: 0,
      completed_orders: 0,
      isReady: true,
      service_settings: user.booster_info?.service_settings || DEFAULT_SERVICE_SETTINGS,
    };

    await user.save();

    await this.boosterProfileModel.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          fullName: body.fullName || user.username,
          bio: body.bio || 'Tuyển thủ cày thuê uy tín',
          isReady: true,
        },
      },
      { upsert: true },
    );

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: UserRole.BOOSTER,
      isEmailVerified: user.isEmailVerified,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Chúc mừng bạn đã trở thành Tuyển thủ (Booster) của LeoRank!',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        wallet_balance: user.wallet_balance,
        profile: user.profile,
        booster_info: user.booster_info,
      },
    };
  }

  async apply(userId: string, body: any) {
    const existing = await this.boosterAppModel.findOne({
      userId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã gửi đơn ứng tuyển rồi');
    }

    const application = new this.boosterAppModel({
      userId,
      ...body,
      status: 'pending',
    });
    await application.save();
    return { success: true, message: 'Nộp đơn ứng tuyển thành công. Vui lòng chờ duyệt.' };
  }

  async resign(userId: string) {
    const activeOrders = await this.orderModel.countDocuments({
      boosterId: new Types.ObjectId(userId),
      status: { $in: [OrderStatus.APPROVED, OrderStatus.IN_PROGRESS] },
    });

    if (activeOrders > 0) {
      throw new BadRequestException(`Bạn còn ${activeOrders} đơn hàng đang thực hiện. Không thể từ chức!`);
    }

    await this.userModel.findByIdAndUpdate(userId, { role: UserRole.CUSTOMER });
    await this.boosterAppModel.updateMany({ userId }, { status: 'resigned' });

    return { success: true, message: 'Đã từ chức Booster thành công' };
  }
}

