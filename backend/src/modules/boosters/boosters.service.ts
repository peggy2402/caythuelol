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
  ) {}

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

      if (Array.isArray(customServices) && customServices.length > 0) {
        for (const s of customServices) {
          if (s.isActive === false) continue;

          // Filter by gameCode
          if (targetGameCode) {
            const serviceGameCode = normalizeGameCode(s.gameCode);
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

    const [profile, application, completedOrdersCount, reviews, relatedBoosters, ordersLast30Days] =
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

    const booster = {
      ...user,
      ...profile,
      booster_info: boosterInfo,
      service_settings: mergedSettings,
      addonsConfig: existingSettings.addonsConfig || existingSettings.standardConfig?.addonsConfig,
      profile: user.profile || profile,
      currentRank: (application as any)?.currentRank || 'N/A',
      highestRank: (application as any)?.highestRank || 'N/A',
      completed_orders: completedOrdersCount,
      rating: user.booster_info?.rating || (profile as any)?.rating || 0,
      bio: user.booster_info?.bio || (profile as any)?.bio || '',
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
      user,
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
    const orders = await this.orderModel
      .find({
        status: OrderStatus.PAID,
        boosterId: { $in: [null, undefined] },
      })
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, orders };
  }

  async getMyOrders(userId: string, status?: string) {
    const filter: any = { boosterId: new Types.ObjectId(userId) };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    const orders = await this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
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
    await this.userModel.collection.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { 'booster_info.service_settings': settings } },
    );

    const updateDoc: any = {};
    if (settings.enabledServices) {
      updateDoc.services = settings.enabledServices;
    } else if (Array.isArray(settings.customServices)) {
      updateDoc.services = settings.customServices.map((s: any) => s.slug || s.name || s.id);
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
      rating: 5.0,
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

