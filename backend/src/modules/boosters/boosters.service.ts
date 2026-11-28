import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

import { IUser, UserRole } from '../../database/schemas/User';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { IBoosterApplication } from '../../database/schemas/BoosterApplication';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { ITransaction, TransactionType, TransactionStatus } from '../../database/schemas/Transaction';
import { DEFAULT_AOV_STAR_RATES } from '../../common/aov.config';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

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
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
  ) { }

  getAvailableServiceTypes(gameCode?: string) {
    const rawCode = (gameCode || 'LOL').toUpperCase().trim();
    const code = ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(rawCode)
      ? 'AOV'
      : ['VAL', 'VALORANT'].includes(rawCode)
        ? 'VALORANT'
        : ['LMHT', 'LOL'].includes(rawCode)
          ? 'LOL'
          : ['DTCL', 'TFT'].includes(rawCode)
            ? 'TFT'
            : rawCode;
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
          serviceType: 'matches',
          name: 'Cày Theo Số Trận Thắng',
          desc: 'Cam kết hoàn thành đủ số trận Thắng theo yêu cầu — phát sinh trận thua sẽ được Booster đánh bù miễn phí.',
          pricingType: 'PER_UNIT',
          defaultPrice: 35000,
          unitName: 'Trận thắng',
          allowDeposit: false,
          depositPercent: 100,
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
          desc: 'Dạy kèm 1-1, phân tích replay, duo cùng Booster.',
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
          desc: 'Hướng dẫn kê tâm, setup góc bắn, lineup kỹ năng và đọc map cùng Booster Radiant.',
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
          desc: 'Leo điểm MMR từ Herald đến Immortal cùng Booster top bảng xếp hạng.',
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
      AOV: [
        {
          serviceType: 'rank-boost',
          name: 'Cày Rank Liên Quân (Theo Bậc)',
          desc: 'Leo rank từ Đồng đến Cao Thủ (25k–160k/bậc) & tùy chỉnh từ Cao Thủ lên Đại Cao Thủ, Chiến Tướng, Huyền Thoại.',
          pricingType: 'TIER_MATRIX',
          defaultPrice: 0,
          allowDeposit: false,
          depositPercent: 100,
          requiresRankSteps: true,
        },
        {
          serviceType: 'net-wins',
          name: 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)',
          desc: 'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.',
          pricingType: 'TIER_PER_POINT',
          defaultPrice: 5000,
          unitName: 'Sao',
          allowDeposit: true,
          depositPercent: 40,
          tierRates: { ...DEFAULT_AOV_STAR_RATES },
        },
        {
          serviceType: 'matches',
          name: 'Cày Theo Số Trận Thắng Liên Quân',
          desc: 'Cam kết hoàn thành đủ số trận Thắng xếp hạng / đấu thường — nếu thua Booster sẽ đánh bù miễn phí.',
          pricingType: 'PER_UNIT',
          defaultPrice: 15000,
          unitName: 'Trận thắng',
          allowDeposit: false,
          depositPercent: 100,
        },
        {
          serviceType: 'coaching',
          name: 'Huấn Luyện Coaching 1-1 Liên Quân',
          desc: 'Dạy kèm kỹ năng macro, di chuyển, chọn tướng & chiến thuật leo rank cùng Booster Chiến Tướng / Thách Đấu.',
          pricingType: 'PER_UNIT',
          defaultPrice: 100000,
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
          desc: 'Dạy kèm 1-1, phân tích replay, hướng dẫn kỹ năng nâng cao cùng Booster.',
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
        currentRank: booster.booster_info?.currentRank || (profile as any)?.currentRank || (app as any)?.currentRank || 'N/A',
        highestRank: booster.booster_info?.highestRank || (profile as any)?.highestRank || (app as any)?.highestRank || 'N/A',
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
          rating: {
            $cond: {
              if: { $gt: [{ $ifNull: ['$profileDoc.rating', 0] }, 0] },
              then: '$profileDoc.rating',
              else: { $ifNull: ['$booster_info.rating', 0] },
            },
          },
          completedOrders: {
            $max: [
              { $ifNull: ['$profileDoc.completedOrders', 0] },
              { $ifNull: ['$booster_info.completed_orders', 0] },
            ],
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

    const cleanService = (query.service || '').trim();
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

      const customServiceMatch: any = {
        $or: [
          { gameCode: { $regex: gameRegex } },
          ...(normalized === 'LOL' ? [{ gameCode: { $exists: false } }] : []),
        ],
        isActive: true,
      };

      // Nếu có yêu cầu dịch vụ cụ thể (VD: net-wins, rank-boost...)
      // Bắt buộc booster phải có chính xác gói dịch vụ đó và đang BẬT!
      if (cleanService) {
        const serviceRegex = new RegExp(`^${cleanService}$`, 'i');
        customServiceMatch.$and = [
          {
            $or: [
              { serviceType: { $regex: serviceRegex } },
              { slug: { $regex: serviceRegex } },
              { id: { $regex: serviceRegex } },
            ],
          },
        ];
      }

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
        // 2. Bắt buộc booster phải có dịch vụ tương ứng trong customServices đang BẬT (isActive: true)
        'booster_info.service_settings.customServices': {
          $elemMatch: customServiceMatch,
        },
      });
    } else if (cleanService) {
      const serviceRegex = new RegExp(`^${cleanService}$`, 'i');
      andConditions.push({
        'booster_info.service_settings.customServices': {
          $elemMatch: {
            $or: [
              { serviceType: { $regex: serviceRegex } },
              { slug: { $regex: serviceRegex } },
              { id: { $regex: serviceRegex } },
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
        user.booster_info?.currentRank ||
        (profile as any)?.currentRank ||
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 1 && g.ranks[1] && g.ranks[1] !== 'N/A')?.ranks?.[1] ||
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 0 && g.ranks[0] && g.ranks[0] !== 'N/A')?.ranks?.[0] ||
        (application as any)?.currentRank ||
        'Cao Thủ',
      highestRank:
        user.booster_info?.highestRank ||
        (profile as any)?.highestRank ||
        (profile as any)?.games?.find((g: any) => g.ranks?.length > 0 && g.ranks[0] && g.ranks[0] !== 'N/A')?.ranks?.[0] ||
        (application as any)?.highestRank ||
        'Thách Đấu',
      performanceScore: (profile as any)?.performanceScore || user.booster_info?.performanceScore || 85,
      tier: (profile as any)?.tier || user.booster_info?.tier || 'DIAMOND',
      tierName: (profile as any)?.tierName || user.booster_info?.tierName || 'Diamond',
      completed_orders: completedOrdersCount,
      rating: (() => {
        if (reviews && reviews.length > 0) {
          const validReviews = reviews.filter(
            (r: any) =>
              typeof r.rating?.stars === 'number' ||
              typeof r.rating?.rating === 'number' ||
              typeof r.rating === 'number',
          );
          if (validReviews.length > 0) {
            const sum = validReviews.reduce(
              (acc: number, r: any) => acc + (r.rating?.stars ?? r.rating?.rating ?? r.rating ?? 5),
              0,
            );
            return Math.round((sum / validReviews.length) * 10) / 10;
          }
        }
        if (typeof user.booster_info?.rating === 'number' && user.booster_info.rating > 0) {
          return user.booster_info.rating;
        }
        if (typeof (profile as any)?.rating === 'number' && (profile as any).rating > 0) {
          return (profile as any).rating;
        }
        return 5.0;
      })(),
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

  private isJobEligibleForBooster(job: any, serviceSettings: any): boolean {
    const normalizeGameCode = (c?: string) => {
      const code = (c || '').toUpperCase().trim();
      if (code === 'LMHT' || code === 'LOL') return 'LOL';
      if (code === 'DTCL' || code === 'TFT') return 'TFT';
      if (code === 'LIENQUAN' || code === 'AOV') return 'AOV';
      if (code === 'TOCCHIEN' || code === 'WILDRIFT') return 'WILDRIFT';
      if (code === 'FCO' || code === 'FCONLINE') return 'FCONLINE';
      if (code === 'VALORANT' || code === 'VAL') return 'VALORANT';
      return code;
    };

    const normalizeServiceType = (t?: string) => {
      return (t || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
    };

    const selectedGames: string[] = Array.isArray(serviceSettings?.selectedGames)
      ? serviceSettings.selectedGames.map((g: any) =>
        normalizeGameCode(typeof g === 'string' ? g : g.gameCode),
      )
      : [];

    const customServices: any[] = Array.isArray(serviceSettings?.customServices)
      ? serviceSettings.customServices
      : [];

    const jobGame = normalizeGameCode(
      job.snapshot?.gameCode || job.details?.game || 'LOL',
    );
    const jobService = normalizeServiceType(
      job.serviceType || job.snapshot?.serviceSlug || '',
    );

    // 1. Kiểm tra tựa game: Nếu booster đã có danh sách game được chọn, game đơn hàng phải thuộc danh sách đó
    if (selectedGames.length > 0 && !selectedGames.includes(jobGame)) {
      return false;
    }

    // 2. Kiểm tra dịch vụ cụ thể:
    if (customServices.length > 0) {
      const gameServices = customServices.filter(
        (s: any) => normalizeGameCode(s.gameCode) === jobGame,
      );

      // Nếu booster có cấu hình cho tựa game này:
      // Phải có ít nhất một dịch vụ tương ứng và đang được BẬT (isActive !== false)
      if (gameServices.length > 0) {
        const matchingActiveService = gameServices.find((s: any) => {
          if (s.isActive === false) return false;
          const sType = normalizeServiceType(s.serviceType || s.slug || s.name || s.id);
          return (
            sType === jobService ||
            jobService.includes(sType) ||
            sType.includes(jobService)
          );
        });
        return !!matchingActiveService;
      }

      // Nếu trong customServices không có dịch vụ nào cho tựa game này -> không đủ điều kiện
      return false;
    }

    // 3. Fallback cho enabledServices (nếu chưa dùng customServices)
    if (Array.isArray(serviceSettings?.enabledServices) && serviceSettings.enabledServices.length > 0) {
      const hasActive = serviceSettings.enabledServices.some((s: string) => {
        const sType = normalizeServiceType(s);
        return sType === jobService || jobService.includes(sType) || sType.includes(jobService);
      });
      return hasActive;
    }

    // Mặc định: Nếu chưa cấu hình hoặc đã tắt hết dịch vụ -> không nhận đơn công khai
    return false;
  }

  async getJobMarket(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    const serviceSettings = user?.booster_info?.service_settings || {};

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

    // Lọc đơn công khai: CHỈ hiển thị các đơn thuộc tựa game và dịch vụ mà booster đang BẬT (isActive = true)
    const eligiblePublicJobs = rawPublicJobs.filter((job) =>
      this.isJobEligibleForBooster(job, serviceSettings),
    );

    // Bảo mật: Ẩn thông tin tài khoản game (username, password) cho đến khi Booster thực sự nhận đơn
    const sanitizeJob = (job: any) => {
      const sanitized = { ...job };
      if (sanitized.pricing) {
        const total = Number(sanitized.pricing.total_amount || 0);
        let serviceFee = Number(sanitized.pricing.service_fee || 0);
        let netOrderValue = Number(sanitized.pricing.booster_order_value || 0);

        if (!netOrderValue) {
          if (serviceFee > 0) {
            netOrderValue = Math.max(0, total - serviceFee);
          } else if (sanitized.pricing.original_price && Number(sanitized.pricing.original_price) < total) {
            netOrderValue = Number(sanitized.pricing.original_price) - Number(sanitized.pricing.discount_amount || 0);
            serviceFee = total - netOrderValue;
          } else if (sanitized.pricing.booster_earnings && Number(sanitized.pricing.booster_earnings) > 0) {
            const candidateFromEarnings = Math.round(Number(sanitized.pricing.booster_earnings) / 0.85);
            if (candidateFromEarnings < total && Math.abs(Math.round(candidateFromEarnings * 0.85) - Number(sanitized.pricing.booster_earnings)) <= 5) {
              netOrderValue = candidateFromEarnings;
              serviceFee = total - netOrderValue;
            }
          }

          if (!netOrderValue) {
            const basePrice = Number(sanitized.pricing.base_price || 0);
            const optionFees = Number(sanitized.pricing.option_fees || sanitized.pricing.addons_cost || 0);
            if (basePrice > 0 && basePrice + optionFees > 0 && basePrice + optionFees < total) {
              netOrderValue = basePrice + optionFees;
              serviceFee = total - netOrderValue;
            }
          }

          if (!netOrderValue && sanitized.pricing.platform_fee_percent && sanitized.pricing.platform_fee_percent > 0) {
            netOrderValue = Math.round(total / (1 + Number(sanitized.pricing.platform_fee_percent) / 100));
            serviceFee = total - netOrderValue;
          }

          if (!netOrderValue && total > 0) {
            const candidate = Math.round(total / 1.02);
            if (Math.abs(total - Math.round(candidate * 1.02)) <= 2) {
              netOrderValue = candidate;
              serviceFee = total - candidate;
            } else {
              netOrderValue = total;
            }
          }
        }

        sanitized.pricing = {
          ...sanitized.pricing,
          service_fee: serviceFee,
          booster_order_value: netOrderValue,
          booster_earnings: Number(sanitized.pricing.booster_order_value || netOrderValue),
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
    const publicJobs = eligiblePublicJobs.map(sanitizeJob);

    return {
      success: true,
      directRequests,
      publicJobs,
      orders: publicJobs,
    };
  }

  async claimJob(orderId: string, boosterId: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng này không ở trạng thái chờ nhận');
    }

    if (order.boosterId && order.boosterId.toString() !== boosterId) {
      throw new BadRequestException('Đơn hàng này đã được chỉ định hoặc đã có Booster khác nhận');
    }

    // Nếu đơn hàng là đơn công khai, kiểm tra Booster có đang bật dịch vụ này hay không
    if (!order.boosterId) {
      const user = await this.userModel.findById(boosterId).lean();
      const serviceSettings = user?.booster_info?.service_settings || {};
      if (!this.isJobEligibleForBooster(order, serviceSettings)) {
        throw new BadRequestException(
          'Dịch vụ này đang bị tắt hoặc bạn chưa kích hoạt trong mục Quản lý Dịch vụ.',
        );
      }
    }

    order.boosterId = new Types.ObjectId(boosterId);
    order.status = OrderStatus.APPROVED;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.APPROVED,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: 'Booster đã nhận đơn thành công từ Sàn việc làm công khai',
    });

    await order.save();

    // Thông báo realtime cho Customer khi Booster đã nhận đơn từ Sàn việc làm + đồng bộ badge số đơn chờ
    const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
    this.userModel
      .findById(boosterId)
      .select('username')
      .lean()
      .then(async (booster) => {
        await this.notificationsService.notifyUser({
          userId: order.customerId,
          title: 'Đơn hàng của bạn đã được nhận!',
          message: `Booster @${booster?.username || 'Booster'} đã nhận đơn hàng #${orderCodeDisplay} của bạn từ Sàn Việc Làm và sẽ sớm tiến hành cày.`,
          type: 'ORDER_UPDATE',
          variant: 'success',
          link: `/orders/${order._id}`,
        });
      })
      .catch(() => {});
    this.chatGateway.broadcastBoosterJobsUpdated();

    return { success: true, message: 'Nhận đơn thành công!', order };
  }

  async getMyOrders(userId: string, status?: string) {
    const filter: any = { boosterId: new Types.ObjectId(userId) };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    const rawOrders = await this.orderModel
      .find(filter)
      .populate('customerId', 'username profile')
      .sort({ createdAt: -1 })
      .lean();

    const orders = rawOrders.map((o: any) => {
      const order = { ...o };
      if (order.pricing) {
        const total = Number(order.pricing.total_amount || 0);
        let serviceFee = Number(order.pricing.service_fee || 0);
        let netOrderValue = Number(order.pricing.booster_order_value || 0);
        if (!netOrderValue) {
          if (serviceFee > 0) {
            netOrderValue = Math.max(0, total - serviceFee);
          } else if (order.pricing.original_price && Number(order.pricing.original_price) < total) {
            netOrderValue = Number(order.pricing.original_price) - Number(order.pricing.discount_amount || 0);
            serviceFee = total - netOrderValue;
          } else if (order.pricing.booster_earnings && Number(order.pricing.booster_earnings) > 0) {
            const candidateFromEarnings = Math.round(Number(order.pricing.booster_earnings) / 0.85);
            if (candidateFromEarnings < total && Math.abs(Math.round(candidateFromEarnings * 0.85) - Number(order.pricing.booster_earnings)) <= 5) {
              netOrderValue = candidateFromEarnings;
              serviceFee = total - netOrderValue;
            }
          }
          if (!netOrderValue && total > 0) {
            const candidate = Math.round(total / 1.02);
            if (Math.abs(total - Math.round(candidate * 1.02)) <= 2) {
              netOrderValue = candidate;
              serviceFee = total - candidate;
            } else {
              netOrderValue = total;
            }
          }
        }
        order.pricing = {
          ...order.pricing,
          service_fee: serviceFee,
          booster_order_value: netOrderValue,
          booster_earnings: Number(order.pricing.booster_order_value || netOrderValue),
        };
      }
      return order;
    });

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

    // Ngăn chặn và loại bỏ các dịch vụ trùng lặp trong cùng 1 tựa game (deduplication)
    if (Array.isArray(settings.customServices)) {
      const seenServiceKeys = new Set<string>();
      const dedupedServices: any[] = [];
      for (const s of settings.customServices) {
        if (!s) continue;
        const sGame = normalizeGameCode(s.gameCode);
        const sType = (s.serviceType || s.slug || '').toLowerCase().trim();
        const sName = (s.name || '').toLowerCase().trim();
        const key = sType && sType !== 'custom'
          ? `${sGame}::TYPE::${sType}`
          : `${sGame}::NAME::${sName}`;
        if (!seenServiceKeys.has(key)) {
          seenServiceKeys.add(key);
          dedupedServices.push(s);
        }
      }
      settings.customServices = dedupedServices;
    }

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
        message: 'Bạn đã là Booster của LeoRank!',
        role: user.role,
      };
    }

    // Nâng cấp role lên BOOSTER
    user.role = UserRole.BOOSTER;
    user.booster_info = {
      bio: body.bio || user.booster_info?.bio || 'Booster cày thuê uy tín',
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
          bio: body.bio || 'Booster cày thuê uy tín',
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
      message: 'Chúc mừng bạn đã trở thành Booster của LeoRank!',
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

  async getMyApplication(userId: string) {
    const application = await this.boosterAppModel
      .findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, application };
  }

  async apply(userId: string, body: any) {
    let existing = await this.boosterAppModel.findOne({ userId });
    if (existing) {
      if (existing.status === 'approved') {
        throw new BadRequestException('Tài khoản của bạn đã được phê duyệt làm Booster chính thức rồi');
      }

      // Cập nhật lại thông tin hồ sơ (kể cả khi trước đó bị rejected hoặc đang pending)
      // Đồng thời bảo lưu trạng thái nộp phí depositStatus nếu đã thanh toán
      existing.fullName = body.fullName || existing.fullName;
      existing.phoneNumber = body.phoneNumber || existing.phoneNumber;
      existing.facebookUrl = body.facebookUrl || existing.facebookUrl;
      existing.discordTag = body.discordTag || existing.discordTag;
      existing.primaryGame = body.primaryGame || existing.primaryGame;
      existing.customGameName = body.customGameName || existing.customGameName;
      existing.currentRank = body.currentRank || existing.currentRank;
      existing.highestRank = body.highestRank || existing.highestRank;
      existing.opggLink = body.opggLink || existing.opggLink;
      if (body.rankImageUrl) existing.rankImageUrl = body.rankImageUrl;
      if (body.billImageUrl) existing.billImageUrl = body.billImageUrl;
      if (body.contractUrl) existing.contractUrl = body.contractUrl;
      existing.bankName = body.bankName || existing.bankName;
      existing.bankAccountName = body.bankAccountName || existing.bankAccountName;
      existing.bankAccountNumber = body.bankAccountNumber || existing.bankAccountNumber;
      existing.agreementSigned_name = body.agreementSigned_name || existing.agreementSigned_name;
      existing.agreementSigned_at = new Date();
      existing.status = 'pending'; // Đưa lại về trạng thái chờ duyệt
      existing.reviewedAt = undefined;
      existing.reviewedBy = undefined;
      existing.note = (existing.note ? existing.note + '\n' : '') + `[${new Date().toLocaleDateString('vi-VN')}] Ứng viên nộp/cập nhật lại hồ sơ.`;
      await existing.save();

      return {
        success: true,
        message: 'Hồ sơ ứng tuyển của bạn đã được nộp thành công! Vui lòng chờ Admin duyệt.',
      };
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

