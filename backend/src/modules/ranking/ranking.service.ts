import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IRankingConfig } from '../../database/schemas/RankingConfig';
import { IBoosterRankingHistory } from '../../database/schemas/BoosterRankingHistory';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { IUser, UserRole } from '../../database/schemas/User';
import { IOrder, OrderStatus } from '../../database/schemas/Order';

export type RecentFormTrend = 'IMPROVING' | 'STABLE' | 'DECLINING';

export interface RecentFormKpiMetric {
  key: string;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  direction: 'UP' | 'DOWN' | 'FLAT';
  isPositiveChange: boolean | null;
  invertedPolarity: boolean;
  meaning: string;
}

@Injectable()
export class RankingService {
  private readonly logger = new Logger(RankingService.name);
  private recentFormCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly RECENT_FORM_TTL_MS = 30_000;

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
   * Bảng xếp hạng Booster (Leaderboard) hỗ trợ lọc theo Game và Thời gian
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

  // =========================================================================
  // PHONG ĐỘ GẦN ĐÂY (RECENT FORM: 7 / 30 / 90 NGÀY)
  // =========================================================================

  private readonly SYSTEM_TZ_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Ho_Chi_Minh (UTC+7)

  private getPeriodWindows(days: number) {
    const validDays = [7, 30, 90].includes(days) ? days : 30;
    const nowMs = Date.now();
    // Quy đổi sang mốc ngày hệ thống UTC+7
    const vnNow = new Date(nowMs + this.SYSTEM_TZ_OFFSET_MS);
    const vnEndOfTodayUtcMs =
      Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate(), 23, 59, 59, 999) -
      this.SYSTEM_TZ_OFFSET_MS;
    const dayMs = 24 * 60 * 60 * 1000;

    const currentStart = new Date(vnEndOfTodayUtcMs - validDays * dayMs + 1);
    const currentEnd = new Date(vnEndOfTodayUtcMs);
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - validDays * dayMs + 1);

    return {
      days: validDays,
      timezone: 'Asia/Ho_Chi_Minh',
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    };
  }

  private toVnDateKey(date: Date): string {
    const d = new Date(date.getTime() + this.SYSTEM_TZ_OFFSET_MS);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getOrderCompletedTime(order: any): Date | null {
    if (order.status !== OrderStatus.COMPLETED) return null;
    if (order.completedAt) return new Date(order.completedAt);
    const timelineEntry = Array.isArray(order.timeline)
      ? [...order.timeline].reverse().find((t: any) => t.status === OrderStatus.COMPLETED)
      : null;
    if (timelineEntry?.timestamp) return new Date(timelineEntry.timestamp);
    return new Date(order.updatedAt || order.createdAt);
  }

  private getOrderStartTime(order: any): Date {
    const startEntry = Array.isArray(order.timeline)
      ? order.timeline.find(
          (t: any) => t.status === OrderStatus.IN_PROGRESS || t.status === OrderStatus.APPROVED,
        )
      : null;
    return new Date(startEntry?.timestamp || order.createdAt);
  }

  private isExcludedTestOrInternalOrder(order: any): boolean {
    if (order.details?.isTest || order.details?.isInternal || order.details?.is_test) return true;
    const code = String(order.orderCode || '').toUpperCase();
    return code.startsWith('TEST-') || code.startsWith('INTERNAL-');
  }

  private isConfirmedComplaint(order: any): boolean {
    // Chỉ tính khiếu nại ĐÃ ĐƯỢC XÁC NHẬN (không tính PENDING hoặc REJECTED)
    if (order.dispute?.status === 'RESOLVED') return true;
    if (order.dispute?.fundsDeducted === true) return true;
    if (order.dispute && order.status === OrderStatus.REFUNDED) return true;
    return false;
  }

  private computePeriodMetrics(orders: any[], start: Date, end: Date) {
    const startMs = start.getTime();
    const endMs = end.getTime();
    const seenIds = new Set<string>();

    let completedOrders = 0;
    let cancelledOrders = 0;
    let confirmedComplaints = 0;
    let onTimeCompleted = 0;
    let ratingSum = 0;
    let ratedCount = 0;
    let completionHoursSum = 0;
    let completionTimeCount = 0;
    let terminalOrders = 0;

    const completedList: Array<{ date: Date; rating?: number }> = [];

    for (const order of orders) {
      const idStr = String(order._id);
      if (seenIds.has(idStr) || this.isExcludedTestOrInternalOrder(order)) continue;

      const completedTime = this.getOrderCompletedTime(order);
      const eventTime = completedTime || new Date(order.updatedAt || order.createdAt);
      const eventMs = eventTime.getTime();
      if (eventMs < startMs || eventMs > endMs) continue;

      seenIds.add(idStr);

      if (order.status === OrderStatus.COMPLETED && completedTime) {
        completedOrders++;
        terminalOrders++;

        const startTime = this.getOrderStartTime(order);
        const hours = Math.max(0.1, (completedTime.getTime() - startTime.getTime()) / 3_600_000);
        completionHoursSum += hours;
        completionTimeCount++;

        const isOnTime = !order.deadline || completedTime.getTime() <= new Date(order.deadline).getTime();
        if (isOnTime) onTimeCompleted++;

        const stars = Number(order.rating?.stars);
        if (stars >= 1 && stars <= 5) {
          ratingSum += stars;
          ratedCount++;
        }

        completedList.push({
          date: completedTime,
          rating: stars >= 1 && stars <= 5 ? stars : undefined,
        });
      } else if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.REJECTED ||
        order.status === OrderStatus.REFUNDED
      ) {
        cancelledOrders++;
        terminalOrders++;
        if (this.isConfirmedComplaint(order)) {
          confirmedComplaints++;
        }
      } else if (order.status === OrderStatus.DISPUTED && this.isConfirmedComplaint(order)) {
        terminalOrders++;
        confirmedComplaints++;
      }
    }

    const round1 = (n: number) => Math.round(n * 10) / 10;
    const successRate = terminalOrders > 0 ? round1((completedOrders / terminalOrders) * 100) : null;
    const customerRating = ratedCount > 0 ? round1(ratingSum / ratedCount) : null;
    const onTimeRate = completedOrders > 0 ? round1((onTimeCompleted / completedOrders) * 100) : null;
    const cancellationRate = terminalOrders > 0 ? round1((cancelledOrders / terminalOrders) * 100) : null;
    const complaintRate = terminalOrders > 0 ? round1((confirmedComplaints / terminalOrders) * 100) : null;
    const avgCompletionTimeHours =
      completionTimeCount > 0 ? round1(completionHoursSum / completionTimeCount) : null;

    return {
      completedOrders,
      terminalOrders,
      cancelledOrders,
      confirmedComplaints,
      ratedCount,
      successRate,
      customerRating,
      onTimeRate,
      cancellationRate,
      complaintRate,
      avgCompletionTimeHours,
      completedList,
    };
  }

  private buildKpiMetric(params: {
    key: string;
    label: string;
    unit: string;
    current: number | null;
    previous: number | null;
    invertedPolarity?: boolean;
    positiveMeaning: string;
    negativeMeaning: string;
    flatMeaning: string;
  }): RecentFormKpiMetric {
    const {
      key,
      label,
      unit,
      current,
      previous,
      invertedPolarity = false,
      positiveMeaning,
      negativeMeaning,
      flatMeaning,
    } = params;

    const delta =
      current !== null && previous !== null ? Math.round((current - previous) * 10) / 10 : null;
    let direction: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    if (delta !== null && delta > 0) direction = 'UP';
    if (delta !== null && delta < 0) direction = 'DOWN';

    let isPositiveChange: boolean | null = null;
    let meaning = flatMeaning;
    if (delta !== null && delta !== 0) {
      const improved = invertedPolarity ? delta < 0 : delta > 0;
      isPositiveChange = improved;
      meaning = improved ? positiveMeaning : negativeMeaning;
    } else if (current === null && previous === null) {
      meaning = 'Chưa có dữ liệu phát sinh trong 2 kỳ gần nhất.';
    } else if (current !== null && previous === null) {
      meaning = 'Kỳ trước chưa có dữ liệu để đối chiếu.';
    }

    return {
      key,
      label,
      unit,
      current,
      previous,
      delta,
      direction,
      isPositiveChange,
      invertedPolarity,
      meaning,
    };
  }

  private evaluateTrend(cur: any, prev: any): {
    trend: RecentFormTrend;
    trendLabel: string;
    trendScore: number;
    highlights: string[];
  } {
    if (cur.terminalOrders === 0 && prev.terminalOrders === 0) {
      return {
        trend: 'STABLE',
        trendLabel: 'Chưa đủ dữ liệu',
        trendScore: 0,
        highlights: ['Chưa có đơn hàng hoàn thành hoặc kết thúc trong khoảng thời gian này.'],
      };
    }

    if (cur.terminalOrders > 0 && prev.terminalOrders === 0) {
      const baseHealth =
        (cur.successRate ?? 100) * 0.4 +
        ((cur.customerRating ?? 5) / 5) * 100 * 0.3 +
        (cur.onTimeRate ?? 100) * 0.3 -
        (cur.complaintRate ?? 0) * 0.5;
      const trend: RecentFormTrend = baseHealth >= 80 ? 'IMPROVING' : baseHealth >= 60 ? 'STABLE' : 'DECLINING';
      return {
        trend,
        trendLabel:
          trend === 'IMPROVING'
            ? 'Phong độ khởi sắc'
            : trend === 'DECLINING'
              ? 'Cần cải thiện'
              : 'Phong độ ổn định',
        trendScore: Math.round(baseHealth - 75),
        highlights: [
          `Kỳ trước chưa ghi nhận đơn kết thúc; kỳ hiện tại hoàn thành ${cur.completedOrders} đơn với tỷ lệ thành công ${cur.successRate ?? 0}%.`,
        ],
      };
    }

    const successDelta = (cur.successRate ?? 0) - (prev.successRate ?? 0);
    const ratingDeltaNorm =
      cur.customerRating !== null && prev.customerRating !== null
        ? ((cur.customerRating - prev.customerRating) / 5) * 100
        : 0;
    const onTimeDelta = (cur.onTimeRate ?? 0) - (prev.onTimeRate ?? 0);
    // Đảo chiều chỉ số tiêu cực
    const complaintDeltaInv = -((cur.complaintRate ?? 0) - (prev.complaintRate ?? 0));
    const cancelDeltaInv = -((cur.cancellationRate ?? 0) - (prev.cancellationRate ?? 0));
    const volumeDeltaNorm =
      prev.completedOrders > 0
        ? Math.max(-30, Math.min(30, ((cur.completedOrders - prev.completedOrders) / prev.completedOrders) * 30))
        : 0;

    const trendScore = Math.round(
      successDelta * 0.25 +
        ratingDeltaNorm * 0.25 +
        onTimeDelta * 0.2 +
        complaintDeltaInv * 0.15 +
        cancelDeltaInv * 0.1 +
        volumeDeltaNorm * 0.05,
    );

    let trend: RecentFormTrend = 'STABLE';
    let trendLabel = 'Phong độ ổn định';
    if (trendScore >= 3) {
      trend = 'IMPROVING';
      trendLabel = 'Phong độ cải thiện';
    } else if (trendScore <= -3) {
      trend = 'DECLINING';
      trendLabel = 'Phong độ suy giảm';
    }

    const highlights: string[] = [];
    if (successDelta >= 5) {
      highlights.push(`Tỷ lệ thành công tăng +${successDelta.toFixed(1)}% so với kỳ trước.`);
    } else if (successDelta <= -5) {
      highlights.push(`Tỷ lệ thành công giảm ${successDelta.toFixed(1)}% so với kỳ trước.`);
    }

    if (cur.customerRating !== null && prev.customerRating !== null) {
      const rDiff = cur.customerRating - prev.customerRating;
      if (rDiff >= 0.2) highlights.push(`Điểm đánh giá khách hàng tăng lên ${cur.customerRating}★ (+${rDiff.toFixed(1)}).`);
      else if (rDiff <= -0.2) highlights.push(`Điểm đánh giá khách hàng giảm xuống ${cur.customerRating}★ (${rDiff.toFixed(1)}).`);
    }

    if ((cur.complaintRate ?? 0) > (prev.complaintRate ?? 0)) {
      highlights.push(`Tỷ lệ khiếu nại xác nhận tăng lên ${cur.complaintRate}% cần chú ý xử lý.`);
    } else if ((cur.complaintRate ?? 0) < (prev.complaintRate ?? 0)) {
      highlights.push(`Tỷ lệ khiếu nại xác nhận giảm còn ${cur.complaintRate}% (tích cực).`);
    }

    if ((cur.cancellationRate ?? 0) > (prev.cancellationRate ?? 0)) {
      highlights.push(`Tỷ lệ hủy đơn tăng từ ${prev.cancellationRate ?? 0}% lên ${cur.cancellationRate ?? 0}%.`);
    }

    if (cur.completedOrders !== prev.completedOrders) {
      const diff = cur.completedOrders - prev.completedOrders;
      highlights.push(
        diff > 0
          ? `Hoàn thành ${cur.completedOrders} đơn (+${diff} đơn so với kỳ trước).`
          : `Hoàn thành ${cur.completedOrders} đơn (${diff} đơn so với kỳ trước).`,
      );
    }

    if (highlights.length === 0) {
      highlights.push('Các chỉ số hiệu suất và chất lượng duy trì ổn định so với kỳ trước.');
    }

    return { trend, trendLabel, trendScore, highlights };
  }

  private buildTimelineChart(
    curList: Array<{ date: Date; rating?: number }>,
    prevList: Array<{ date: Date; rating?: number }>,
    windows: ReturnType<RankingService['getPeriodWindows']>,
    granularity: 'day' | 'week',
  ) {
    const dayMs = 24 * 60 * 60 * 1000;
    const curCounts = new Map<string, number>();
    for (const item of curList) {
      const key = this.toVnDateKey(item.date);
      curCounts.set(key, (curCounts.get(key) || 0) + 1);
    }

    // Map đơn kỳ trước sang ngày tương ứng của kỳ hiện tại để so sánh trực tiếp
    const shiftMs = windows.currentStart.getTime() - windows.previousStart.getTime();
    const prevCounts = new Map<string, number>();
    for (const item of prevList) {
      const shiftedDate = new Date(item.date.getTime() + shiftMs);
      const key = this.toVnDateKey(shiftedDate);
      prevCounts.set(key, (prevCounts.get(key) || 0) + 1);
    }

    const dailyPoints: Array<{ dateKey: string; label: string; current: number; previous: number }> = [];
    for (let i = 0; i < windows.days; i++) {
      const d = new Date(windows.currentStart.getTime() + i * dayMs);
      const dateKey = this.toVnDateKey(d);
      const [, mm, dd] = dateKey.split('-');
      dailyPoints.push({
        dateKey,
        label: `${dd}/${mm}`,
        current: curCounts.get(dateKey) || 0,
        previous: prevCounts.get(dateKey) || 0,
      });
    }

    if (granularity === 'day') {
      return dailyPoints;
    }

    // Gom theo tuần (mỗi cụm 7 ngày)
    const weeklyPoints: Array<{ dateKey: string; label: string; current: number; previous: number }> = [];
    for (let i = 0; i < dailyPoints.length; i += 7) {
      const slice = dailyPoints.slice(i, i + 7);
      const first = slice[0];
      const last = slice[slice.length - 1];
      weeklyPoints.push({
        dateKey: `${first.dateKey}_${last.dateKey}`,
        label: `${first.label}-${last.label}`,
        current: slice.reduce((s, x) => s + x.current, 0),
        previous: slice.reduce((s, x) => s + x.previous, 0),
      });
    }
    return weeklyPoints;
  }

  async getBoosterRecentForm(
    boosterId: string,
    days = 30,
    granularity: 'day' | 'week' = 'day',
  ) {
    const windows = this.getPeriodWindows(days);
    const cacheKey = `${boosterId}:${windows.days}:${granularity}`;
    const cached = this.recentFormCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    if (!Types.ObjectId.isValid(boosterId)) {
      throw new BadRequestException('Booster ID không hợp lệ');
    }

    const boosterObjId = new Types.ObjectId(boosterId);
    const [user, profile, orders] = await Promise.all([
      this.userModel.findById(boosterObjId).select('username role profile booster_info').lean(),
      this.boosterProfileModel.findOne({ userId: boosterObjId }).select('displayName tier tierName performanceScore').lean(),
      this.orderModel
        .find({
          $or: [
            { boosterId: boosterObjId },
            { 'assigned_booster.user_id': boosterObjId },
            { assigned_booster_id: boosterObjId },
          ],
          $and: [
            {
              $or: [
                { completedAt: { $gte: windows.previousStart, $lte: windows.currentEnd } },
                { updatedAt: { $gte: windows.previousStart, $lte: windows.currentEnd } },
                { createdAt: { $gte: windows.previousStart, $lte: windows.currentEnd } },
              ],
            },
          ],
        })
        .select('_id orderCode status rating dispute timeline details createdAt updatedAt completedAt deadline')
        .lean(),
    ]);

    if (!user) throw new NotFoundException('Không tìm thấy Booster');

    const cur = this.computePeriodMetrics(orders, windows.currentStart, windows.currentEnd);
    const prev = this.computePeriodMetrics(orders, windows.previousStart, windows.previousEnd);
    const trendEval = this.evaluateTrend(cur, prev);
    const timelineChart = this.buildTimelineChart(cur.completedList, prev.completedList, windows, granularity);

    const kpis: RecentFormKpiMetric[] = [
      this.buildKpiMetric({
        key: 'completedOrders',
        label: 'Đơn hoàn thành',
        unit: 'đơn',
        current: cur.completedOrders,
        previous: prev.completedOrders,
        positiveMeaning: 'Số lượng đơn hoàn thành hợp lệ tăng so với kỳ trước.',
        negativeMeaning: 'Số lượng đơn hoàn thành giảm so với kỳ trước.',
        flatMeaning: 'Sản lượng đơn hoàn thành giữ nguyên so với kỳ trước.',
      }),
      this.buildKpiMetric({
        key: 'successRate',
        label: 'Tỷ lệ thành công',
        unit: '%',
        current: cur.successRate,
        previous: prev.successRate,
        positiveMeaning: 'Tỷ lệ giao đơn hoàn thành thành công cải thiện.',
        negativeMeaning: 'Tỷ lệ thành công giảm do phát sinh đơn hủy hoặc hoàn tiền.',
        flatMeaning: 'Tỷ lệ thành công ổn định.',
      }),
      this.buildKpiMetric({
        key: 'customerRating',
        label: 'Đánh giá khách hàng',
        unit: '★',
        current: cur.customerRating,
        previous: prev.customerRating,
        positiveMeaning: 'Mức độ hài lòng từ đánh giá đơn hợp lệ tăng.',
        negativeMeaning: 'Điểm đánh giá trung bình giảm nhẹ, cần chú ý trải nghiệm khách.',
        flatMeaning: 'Điểm đánh giá khách hàng duy trì ổn định.',
      }),
      this.buildKpiMetric({
        key: 'onTimeRate',
        label: 'Tỷ lệ đúng hạn',
        unit: '%',
        current: cur.onTimeRate,
        previous: prev.onTimeRate,
        positiveMeaning: 'Tiến độ bàn giao đơn đúng hạn cải thiện.',
        negativeMeaning: 'Có đơn hoàn thành trễ hạn so với kỳ trước.',
        flatMeaning: 'Tỷ lệ hoàn thành đúng hạn ổn định.',
      }),
      this.buildKpiMetric({
        key: 'cancellationRate',
        label: 'Tỷ lệ hủy đơn',
        unit: '%',
        current: cur.cancellationRate,
        previous: prev.cancellationRate,
        invertedPolarity: true,
        positiveMeaning: 'Tỷ lệ hủy đơn giảm xuống (tín hiệu tích cực).',
        negativeMeaning: 'Tỷ lệ hủy đơn tăng lên, ảnh hưởng độ tin cậy.',
        flatMeaning: 'Tỷ lệ hủy đơn không đổi.',
      }),
      this.buildKpiMetric({
        key: 'complaintRate',
        label: 'Khiếu nại xác nhận',
        unit: '%',
        current: cur.complaintRate,
        previous: prev.complaintRate,
        invertedPolarity: true,
        positiveMeaning: 'Tỷ lệ khiếu nại đã xác nhận giảm (chất lượng tốt hơn).',
        negativeMeaning: 'Phát sinh khiếu nại đã được xác nhận cao hơn kỳ trước.',
        flatMeaning: 'Không có biến động khiếu nại xác nhận.',
      }),
      this.buildKpiMetric({
        key: 'avgCompletionTimeHours',
        label: 'Thời gian TB / đơn',
        unit: 'giờ',
        current: cur.avgCompletionTimeHours,
        previous: prev.avgCompletionTimeHours,
        invertedPolarity: true,
        positiveMeaning: 'Tốc độ hoàn thành trung bình mỗi đơn nhanh hơn.',
        negativeMeaning: 'Thời gian xử lý trung bình mỗi đơn kéo dài hơn kỳ trước.',
        flatMeaning: 'Tốc độ xử lý trung bình ổn định.',
      }),
    ];

    const result = {
      success: true,
      note: 'Chỉ số theo dõi phong độ ngắn hạn, không thay thế Performance Score tổng thể và Booster Tier.',
      booster: {
        _id: user._id,
        username: user.username,
        displayName: profile?.displayName || user.username,
        avatar: user.profile?.avatar,
        overallScore: profile?.performanceScore ?? null,
        overallTier: profile?.tier ?? null,
        overallTierName: profile?.tierName ?? null,
      },
      period: {
        days: windows.days,
        granularity,
        timezone: windows.timezone,
        current: { start: windows.currentStart, end: windows.currentEnd },
        previous: { start: windows.previousStart, end: windows.previousEnd },
      },
      trend: {
        status: trendEval.trend,
        label: trendEval.trendLabel,
        score: trendEval.trendScore,
        highlights: trendEval.highlights,
      },
      kpis,
      timelineChart,
    };

    this.recentFormCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + this.RECENT_FORM_TTL_MS,
    });

    return result;
  }

  async getAdminRecentFormOverview(days = 30) {
    const validDays = [7, 30, 90].includes(days) ? days : 30;
    const boosters = await this.userModel
      .find({ role: UserRole.BOOSTER })
      .select('_id username profile booster_info')
      .limit(100)
      .lean();

    const items = await Promise.all(
      boosters.map(async (b: any) => {
        const form = await this.getBoosterRecentForm(String(b._id), validDays, 'week');
        const kpiMap = Object.fromEntries(form.kpis.map((k: RecentFormKpiMetric) => [k.key, k]));
        return {
          boosterId: b._id,
          username: b.username,
          displayName: form.booster.displayName,
          avatar: b.profile?.avatar,
          overallTier: form.booster.overallTier,
          overallScore: form.booster.overallScore,
          trend: form.trend.status,
          trendLabel: form.trend.label,
          trendScore: form.trend.score,
          completedOrders: kpiMap.completedOrders?.current ?? 0,
          prevCompletedOrders: kpiMap.completedOrders?.previous ?? 0,
          successRate: kpiMap.successRate?.current,
          customerRating: kpiMap.customerRating?.current,
          onTimeRate: kpiMap.onTimeRate?.current,
          complaintRate: kpiMap.complaintRate?.current,
          cancellationRate: kpiMap.cancellationRate?.current,
        };
      }),
    );

    const summary = {
      total: items.length,
      improving: items.filter((i) => i.trend === 'IMPROVING').length,
      stable: items.filter((i) => i.trend === 'STABLE').length,
      declining: items.filter((i) => i.trend === 'DECLINING').length,
    };

    return {
      success: true,
      days: validDays,
      summary,
      items: items.sort((a, b) => b.trendScore - a.trendScore),
    };
  }
}
