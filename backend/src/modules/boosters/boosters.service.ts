import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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
  ) {}

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
          rating: { $ifNull: ['$profileDoc.rating', '$booster_info.rating', 5.0] },
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
      profile: user.profile || profile,
      currentRank: (application as any)?.currentRank || 'N/A',
      highestRank: (application as any)?.highestRank || 'N/A',
      completed_orders: completedOrdersCount,
      rating: user.booster_info?.rating || (profile as any)?.rating || 5.0,
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

    if (settings.enabledServices) {
      await this.boosterProfileModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { services: settings.enabledServices } },
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

    return {
      success: true,
      stats: {
        totalEarnings,
        completedOrders: stats[OrderStatus.COMPLETED] || 0,
        inProgressOrders: stats[OrderStatus.IN_PROGRESS] || 0,
        approvedOrders: stats[OrderStatus.APPROVED] || 0,
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

