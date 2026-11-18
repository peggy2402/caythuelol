import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IRankingConfig } from '../../database/schemas/RankingConfig';
import { IBoosterRankingHistory } from '../../database/schemas/BoosterRankingHistory';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { IUser } from '../../database/schemas/User';
import { IOrder } from '../../database/schemas/Order';

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    @InjectModel('RankingConfig') private rankingConfigModel: Model<IRankingConfig>,
    @InjectModel('BoosterRankingHistory') private rankingHistoryModel: Model<IBoosterRankingHistory>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
  ) {}

  /**
   * Lấy cấu hình đánh giá & cấp bậc hiện tại (Tự tạo cấu hình mặc định nếu chưa có)
   */
  async getConfig(): Promise<IRankingConfig> {
    let config = await this.rankingConfigModel.findOne({ isActive: true }).sort({ version: -1 });
    if (!config) {
      config = await this.rankingConfigModel.create({
        version: 1,
        isActive: true,
        weights: {
          efficiency: 25,
          quality: 30,
          reliability: 20,
          experience: 15,
          activity: 10,
        },
        tiers: [
          { tierId: 1, code: 'BRONZE', name: 'Bronze', minScore: 0, maxScore: 49, minCompletedOrders: 0, minRating: 0, badgeIcon: 'Shield', badgeColor: '#cd7f32' },
          { tierId: 2, code: 'SILVER', name: 'Silver', minScore: 50, maxScore: 64, minCompletedOrders: 3, minRating: 4.0, badgeIcon: 'Shield', badgeColor: '#94a3b8' },
          { tierId: 3, code: 'GOLD', name: 'Gold', minScore: 65, maxScore: 74, minCompletedOrders: 10, minRating: 4.5, badgeIcon: 'Trophy', badgeColor: '#eab308' },
          { tierId: 4, code: 'PLATINUM', name: 'Platinum', minScore: 75, maxScore: 84, minCompletedOrders: 25, minRating: 4.7, badgeIcon: 'Trophy', badgeColor: '#06b6d4' },
          { tierId: 5, code: 'DIAMOND', name: 'Diamond', minScore: 85, maxScore: 91, minCompletedOrders: 50, minRating: 4.85, badgeIcon: 'Sparkles', badgeColor: '#38bdf8' },
          { tierId: 6, code: 'MASTER', name: 'Master', minScore: 92, maxScore: 96, minCompletedOrders: 100, minRating: 4.9, badgeIcon: 'Flame', badgeColor: '#c084fc' },
          { tierId: 7, code: 'GRANDMASTER', name: 'Grandmaster', minScore: 97, maxScore: 100, minCompletedOrders: 200, minRating: 4.95, badgeIcon: 'Flame', badgeColor: '#f43f5e' },
        ],
        leaderboardRules: {
          minOrdersForRank: 1,
          inactivityDaysLimit: 45,
        },
      });
    }
    return config;
  }

  /**
   * Admin cập nhật cấu hình xếp hạng
   */
  async updateConfig(adminId: string, dto: any): Promise<IRankingConfig> {
    const { weights, tiers, leaderboardRules } = dto;
    if (weights) {
      const sum = (weights.efficiency || 0) + (weights.quality || 0) + (weights.reliability || 0) + (weights.experience || 0) + (weights.activity || 0);
      if (sum !== 100) {
        throw new BadRequestException(`Tổng trọng số các tiêu chí phải bằng 100%. Hiện tại: ${sum}%`);
      }
    }

    const current = await this.getConfig();
    const updated = await this.rankingConfigModel.findByIdAndUpdate(
      current._id,
      {
        $set: {
          ...(weights ? { weights } : {}),
          ...(tiers ? { tiers } : {}),
          ...(leaderboardRules ? { leaderboardRules } : {}),
          updatedBy: adminId,
        },
      },
      { new: true }
    );
    return updated!;
  }

  /**
   * Tính toán điểm năng lực (Performance Score) và cấp bậc (Tier) cho Booster
   */
  async calculateBoosterPerformance(boosterId: string, reason = 'MANUAL_RECALC', orderId?: string): Promise<any> {
    const user = await this.userModel.findById(boosterId);
    if (!user) throw new NotFoundException('Không tìm thấy booster');

    let profile = await this.boosterProfileModel.findOne({ userId: user._id });
    if (!profile) {
      profile = await this.boosterProfileModel.create({
        userId: user._id,
        displayName: user.username,
        avatar: user.profile?.avatar,
        bio: user.booster_info?.bio || '',
        games: [],
        performanceScore: 50,
        tier: 'SILVER',
        tierName: 'Silver',
      });
    }

    const config = await this.getConfig();

    // Lấy tất cả đơn hàng đã giao cho Booster
    const orders = await this.orderModel.find({
      $or: [
        { boosterId: user._id },
        { 'assigned_booster.user_id': user._id },
        { assigned_booster_id: user._id },
      ],
    });

    const completedOrdersList = orders.filter((o: any) => o.status === 'COMPLETED');
    const cancelledByBoosterList = orders.filter((o: any) => o.status === 'CANCELLED' && o.cancelledBy === 'BOOSTER');
    const disputedOrdersList = orders.filter((o: any) => o.status === 'DISPUTED' || o.hasDispute);

    const totalOrdersCount = orders.length;
    const completedCount = completedOrdersList.length;

    // 1. Hiệu suất công việc (Efficiency Score: 0 - 100)
    let completionRate = totalOrdersCount > 0 ? (completedCount / totalOrdersCount) * 100 : 75;
    let onTimeRate = 95; // Mặc định 95%
    if (completedCount > 0) {
      const onTimeOrders = completedOrdersList.filter((o: any) => {
        if (!o.deadline || !o.completedAt) return true;
        return new Date(o.completedAt).getTime() <= new Date(o.deadline).getTime();
      });
      onTimeRate = Math.round((onTimeOrders.length / completedCount) * 100);
    }
    const efficiencyScore = Math.min(100, Math.round(completionRate * 0.5 + onTimeRate * 0.5));

    // 2. Chất lượng dịch vụ (Quality Score: 0 - 100)
    const currentRating = user.booster_info?.rating && user.booster_info.rating > 0 ? user.booster_info.rating : (profile.rating || 5.0);
    const ratingScore = Math.min(100, Math.round((currentRating / 5.0) * 100));
    const disputePenalty = disputedOrdersList.length > 0 ? Math.min(40, (disputedOrdersList.length / (totalOrdersCount || 1)) * 100) : 0;
    const qualityScore = Math.max(0, Math.min(100, Math.round(ratingScore - disputePenalty)));

    // 3. Độ tin cậy (Reliability Score: 0 - 100)
    const cancelPenalty = cancelledByBoosterList.length > 0 ? Math.min(50, (cancelledByBoosterList.length / (totalOrdersCount || 1)) * 100) : 0;
    const reliabilityScore = Math.max(0, Math.min(100, Math.round(100 - cancelPenalty)));

    // 4. Kinh nghiệm (Experience Score: 0 - 100)
    const orderVolumeScore = Math.min(50, completedCount * 1.5);
    const accountAgeDays = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
    const ageScore = Math.min(30, Math.floor(accountAgeDays / 5));
    const gamesCount = (profile.games || []).length;
    const gamesScore = Math.min(20, gamesCount * 5);
    const experienceScore = Math.min(100, Math.round(orderVolumeScore + ageScore + gamesScore));

    // 5. Hoạt động & Tương tác (Activity Score: 0 - 100)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = orders.filter((o: any) => new Date(o.createdAt || o.updatedAt).getTime() >= thirtyDaysAgo.getTime());
    const recentActivityScore = Math.min(60, recentOrders.length * 15);
    const isReadyBonus = (user as any).isReady !== false ? 40 : 10;
    const activityScore = Math.min(100, Math.round(recentActivityScore + isReadyBonus));

    // Tính Weighted Performance Score
    const w = config.weights;
    let finalScore = Math.round(
      (efficiencyScore * w.efficiency +
        qualityScore * w.quality +
        reliabilityScore * w.reliability +
        experienceScore * w.experience +
        activityScore * w.activity) /
        100
    );

    // Chống cày nick mới hack rank: Nếu chưa có đơn nào, giới hạn tối đa 60 điểm (Silver)
    if (completedCount === 0 && finalScore > 60) {
      finalScore = 60;
    }

    // Xác định Tier dựa theo tiers config và các điều kiện ràng buộc
    const sortedTiers = [...config.tiers].sort((a, b) => b.minScore - a.minScore);
    let assignedTier = sortedTiers[sortedTiers.length - 1]; // Bronze fallback

    for (const t of sortedTiers) {
      if (
        finalScore >= t.minScore &&
        completedCount >= (t.minCompletedOrders || 0) &&
        currentRating >= (t.minRating || 0)
      ) {
        assignedTier = t;
        break;
      }
    }

    const previousTier = profile.tier || 'BRONZE';
    const previousScore = profile.performanceScore || 50;

    // Cập nhật Profile
    profile.performanceScore = finalScore;
    profile.tier = assignedTier.code;
    profile.tierName = assignedTier.name;
    profile.completedOrders = completedCount;
    profile.rating = currentRating;
    profile.scoreBreakdown = {
      efficiencyScore,
      qualityScore,
      reliabilityScore,
      experienceScore,
      activityScore,
    };
    profile.lastCalculatedAt = new Date();

    // Tính toán năng lực từng Game (Game Proficiency)
    if (profile.games && profile.games.length > 0) {
      profile.games = profile.games.map((g: any) => {
        const gameOrders = completedOrdersList.filter((o: any) => 
          (o.gameCode && o.gameCode.toUpperCase() === g.gameCode.toUpperCase()) ||
          (o.game && o.game.toUpperCase() === g.gameCode.toUpperCase())
        );
        const gameCompleted = gameOrders.length;
        const gameScore = Math.min(100, Math.max(30, finalScore + (gameCompleted > 5 ? 5 : 0)));
        let gameTier = assignedTier.code;
        for (const t of sortedTiers) {
          if (gameScore >= t.minScore && gameCompleted >= Math.floor(t.minCompletedOrders / 2)) {
            gameTier = t.code;
            break;
          }
        }
        return {
          ...g,
          performanceScore: g.performanceScore || gameScore,
          tier: g.tier || gameTier,
          completedOrders: gameCompleted,
          successRate: 100,
        };
      });
    }

    await profile.save();

    // Ghi Audit Trail vào BoosterRankingHistory nếu có biến động
    if (previousScore !== finalScore || previousTier !== assignedTier.code || reason !== 'SILENT') {
      await this.rankingHistoryModel.create({
        boosterId: user._id,
        previousScore,
        newScore: finalScore,
        scoreBreakdown: profile.scoreBreakdown,
        previousTier,
        newTier: assignedTier.code,
        reason,
        ...(orderId ? { orderId } : {}),
        calculatedAt: new Date(),
      });
    }

    return {
      boosterId: user._id,
      username: user.username,
      performanceScore: finalScore,
      tier: assignedTier.code,
      tierName: assignedTier.name,
      scoreBreakdown: profile.scoreBreakdown,
      completedOrders: completedCount,
      rating: currentRating,
      games: profile.games,
    };
  }

  /**
   * Bảng xếp hạng tuyển thủ (Leaderboard) hỗ trợ lọc theo Game và Thời gian
   */
  async getLeaderboard(filters: { gameCode?: string; timeframe?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.gameCode && filters.gameCode !== 'ALL') {
      query['games.gameCode'] = filters.gameCode.toUpperCase();
    }

    const total = await this.boosterProfileModel.countDocuments(query);
    const profiles = await this.boosterProfileModel
      .find(query)
      .sort({ performanceScore: -1, rating: -1, completedOrders: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email profile isReady createdAt')
      .lean();

    const config = await this.getConfig();

    const items = profiles.map((p: any, idx: number) => {
      const u = p.userId || {};
      const gameInfo = filters.gameCode && filters.gameCode !== 'ALL'
        ? (p.games || []).find((g: any) => g.gameCode.toUpperCase() === filters.gameCode?.toUpperCase())
        : null;

      const tierDef = config.tiers.find(t => t.code === (gameInfo?.tier || p.tier)) || {
        name: p.tierName || 'Silver',
        badgeColor: '#94a3b8',
      };

      return {
        rank: skip + idx + 1,
        boosterId: u._id || p.userId,
        username: u.username || p.displayName || 'Booster',
        displayName: p.displayName || u.username,
        avatar: p.avatar || u.profile?.avatar || `https://ui-avatars.com/api/?name=${u.username || 'B'}`,
        tier: gameInfo?.tier || p.tier || 'SILVER',
        tierName: tierDef.name,
        badgeColor: tierDef.badgeColor,
        performanceScore: gameInfo?.performanceScore || p.performanceScore || 50,
        completedOrders: gameInfo?.completedOrders !== undefined ? gameInfo.completedOrders : (p.completedOrders || 0),
        successRate: gameInfo?.successRate || 100,
        rating: p.rating || 5.0,
        isReady: u.isReady !== false,
        scoreBreakdown: p.scoreBreakdown,
        games: (p.games || []).map((g: any) => ({
          gameCode: g.gameCode,
          ranks: g.ranks,
          tier: g.tier,
          performanceScore: g.performanceScore,
        })),
      };
    });

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Xem chi tiết điểm & lịch sử xếp hạng của 1 Booster
   */
  async getBoosterRankingDetail(boosterId: string) {
    const user = await this.userModel.findById(boosterId).select('-password_hash');
    if (!user) throw new NotFoundException('Không tìm thấy booster');

    const profile = await this.boosterProfileModel.findOne({ userId: user._id });
    const history = await this.rankingHistoryModel
      .find({ boosterId: user._id })
      .sort({ calculatedAt: -1 })
      .limit(20)
      .lean();

    const config = await this.getConfig();

    return {
      booster: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: profile?.avatar || user.profile?.avatar,
        bio: profile?.bio || user.booster_info?.bio,
      },
      ranking: {
        performanceScore: profile?.performanceScore || 50,
        tier: profile?.tier || 'SILVER',
        tierName: profile?.tierName || 'Silver',
        scoreBreakdown: profile?.scoreBreakdown || {
          efficiencyScore: 50,
          qualityScore: 50,
          reliabilityScore: 50,
          experienceScore: 50,
          activityScore: 50,
        },
        rating: profile?.rating || 5.0,
        completedOrders: profile?.completedOrders || 0,
        lastCalculatedAt: profile?.lastCalculatedAt,
        games: profile?.games || [],
      },
      config: {
        weights: config.weights,
        tiers: config.tiers,
      },
      history,
    };
  }
}
