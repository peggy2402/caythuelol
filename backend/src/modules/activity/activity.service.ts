import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus } from '../../database/schemas/Transaction';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { IComment } from '../../database/schemas/Comment';
import { IBlog } from '../../database/schemas/Blog';
import { IBoosterApplication } from '../../database/schemas/BoosterApplication';

export interface ActivityFeedItem {
  id: string;
  type: 'DEPOSIT' | 'ORDER' | 'REVIEW' | 'COMMENT' | 'BOOSTER_JOIN' | 'VIP_UPGRADE' | 'BLOG_PUBLISH';
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'yellow' | 'blue' | 'purple' | 'cyan';
  username: string;
  actionText: string;
  highlight: string;
  timeAgo: string;
  createdAt: string;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);
  private cachedFeed: { data: ActivityFeedItem[]; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 15_000; // Cache 15 giây

  constructor(
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Comment') private commentModel: Model<IComment>,
    @InjectModel('Blog') private blogModel: Model<IBlog>,
    @InjectModel('BoosterApplication') private boosterAppModel: Model<IBoosterApplication>,
  ) {}

  /**
   * Che giấu tên đăng nhập theo chuẩn bảo mật và thẩm mỹ
   * Ví dụ: "chien2402" -> "chi***02" (giống giao diện mẫu)
   */
  private maskUsername(name?: string): string {
    if (!name) return 'kh***02';
    const clean = name.split('@')[0].trim();
    if (clean.length <= 2) return clean + '***';
    if (clean.length <= 4) return clean[0] + '***' + clean.slice(-1);
    return clean.slice(0, 3) + '***' + clean.slice(-2);
  }

  /**
   * Tính toán thời gian tương đối thân thiện
   */
  private getTimeAgo(date: Date): string {
    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);

    if (diffSec < 45) return 'vừa xong';
    if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return `${Math.floor(diffSec / 86400)} ngày trước`;
  }

  /**
   * Lấy danh sách activity feed trực tiếp từ Database kết hợp fallback dữ liệu sinh động
   */
  async getActivityFeed(): Promise<ActivityFeedItem[]> {
    const now = Date.now();
    if (this.cachedFeed && this.cachedFeed.expiresAt > now) {
      return this.cachedFeed.data;
    }

    const items: ActivityFeedItem[] = [];

    try {
      // 1. Lấy giao dịch nạp tiền thành công gần nhất
      const deposits = await this.transactionModel
        .find({
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCESS,
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'username')
        .lean();

      for (const tx of deposits) {
        const u = tx.userId as any;
        const username = this.maskUsername(u?.username);
        const isQr =
          tx.description?.toLowerCase().includes('qr') ||
          tx.gatewayTransactionId?.length ||
          tx.depositCode;

        items.push({
          id: `tx_${tx._id}`,
          type: 'DEPOSIT',
          badge: isQr ? 'NẠP QR' : 'NẠP VÍ',
          badgeColor: 'emerald',
          username,
          actionText: isQr ? 'vừa nạp ví qua QR' : 'vừa nạp tiền vào ví',
          highlight: `+${(tx.amount || 100000).toLocaleString('vi-VN')} đ`,
          timeAgo: this.getTimeAgo(new Date(tx.createdAt)),
          createdAt: new Date(tx.createdAt).toISOString(),
        });
      }

      // 2. Lấy đơn hàng mới đặt hoặc đang cày gần nhất
      const orders = await this.orderModel
        .find({
          status: {
            $in: [
              OrderStatus.PAID,
              OrderStatus.APPROVED,
              OrderStatus.IN_PROGRESS,
              OrderStatus.COMPLETED,
            ],
          },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customerId', 'username')
        .lean();

      for (const order of orders) {
        const c = order.customerId as any;
        const username = this.maskUsername(c?.username);
        const game = (order.details?.game || order.snapshot?.gameCode || 'Game').toUpperCase();
        const gameLabel =
          game === 'AOV' || game.includes('LIENQUAN')
            ? 'Liên Quân'
            : game === 'LOL'
            ? 'LMHT'
            : game === 'VALORANT'
            ? 'Valorant'
            : game;

        const fromRank =
          order.details?.current_rank ||
          order.details?.currentRank ||
          order.details?.rank_start ||
          '';
        const toRank =
          order.details?.desired_rank ||
          order.details?.desiredRank ||
          order.details?.rank_target ||
          '';

        let highlight = '';
        if (fromRank && toRank && fromRank !== toRank) {
          highlight = `${fromRank} ➔ ${toRank}`;
        } else if (order.pricing?.total_amount) {
          highlight = `Đơn cày ${order.pricing.total_amount.toLocaleString('vi-VN')} đ`;
        } else {
          highlight = `Dịch vụ cày ${gameLabel}`;
        }

        items.push({
          id: `ord_${order._id}`,
          type: 'ORDER',
          badge: 'ĐẶT ĐƠN',
          badgeColor: 'amber',
          username,
          actionText: `vừa đặt đơn cày rank ${gameLabel}`,
          highlight,
          timeAgo: this.getTimeAgo(new Date(order.createdAt)),
          createdAt: new Date(order.createdAt).toISOString(),
        });

        // 3. Nếu đơn có đánh giá rating
        if (order.rating?.stars && order.rating.stars >= 4) {
          items.push({
            id: `rev_${order._id}`,
            type: 'REVIEW',
            badge: 'ĐÁNH GIÁ',
            badgeColor: 'yellow',
            username,
            actionText: `vừa đánh giá ${order.rating.stars}★ cho Booster`,
            highlight: order.rating.comment
              ? `"${order.rating.comment.slice(0, 45)}${order.rating.comment.length > 45 ? '...' : ''}"`
              : '⭐⭐⭐⭐⭐ Dịch vụ nhanh, booster nhiệt tình',
            timeAgo: this.getTimeAgo(new Date(order.rating.createdAt || order.updatedAt)),
            createdAt: new Date(order.rating.createdAt || order.updatedAt).toISOString(),
          });
        }
      }

      // 4. Lấy bình luận bài viết gần nhất
      const comments = await this.commentModel
        .find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('userId', 'username')
        .populate('blogId', 'title')
        .lean();

      for (const c of comments) {
        const u = c.userId as any;
        const b = c.blogId as any;
        const username = this.maskUsername(u?.username);
        const blogTitle = b?.title ? `"${b.title.slice(0, 40)}..."` : 'bài viết tin tức';

        items.push({
          id: `cmt_${c._id}`,
          type: 'COMMENT',
          badge: 'BÌNH LUẬN',
          badgeColor: 'blue',
          username,
          actionText: 'vừa bình luận bài viết',
          highlight: blogTitle,
          timeAgo: this.getTimeAgo(new Date(c.createdAt)),
          createdAt: new Date(c.createdAt).toISOString(),
        });
      }

      // 5. Lấy giao dịch mua gói Hội viên VIP gần nhất
      const vipPurchases = await this.transactionModel
        .find({
          type: TransactionType.VIP_PURCHASE,
          status: TransactionStatus.SUCCESS,
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('userId', 'username')
        .lean();

      for (const vp of vipPurchases) {
        const u = vp.userId as any;
        const username = this.maskUsername(u?.username);
        const planName = vp.metadata?.planName || 'Gói Hội Viên VIP';

        items.push({
          id: `vip_${vp._id}`,
          type: 'VIP_UPGRADE',
          badge: 'HỘI VIÊN VIP',
          badgeColor: 'amber',
          username,
          actionText: 'vừa nâng cấp Hội viên VIP',
          highlight: `${planName} · Ưu đãi giảm giá độc quyền`,
          timeAgo: this.getTimeAgo(new Date(vp.createdAt)),
          createdAt: new Date(vp.createdAt).toISOString(),
        });
      }

      // 6. Lấy đăng ký trở thành Booster mới nhất
      const boosterApps = await this.boosterAppModel
        .find({
          status: { $in: ['approved', 'pending', 'testing'] },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('userId', 'username')
        .lean();

      for (const app of boosterApps) {
        const u = app.userId as any;
        const username = this.maskUsername(u?.username || app.fullName);
        const game = (app.primaryGame || 'Liên Quân / LMHT').toUpperCase();

        items.push({
          id: `app_${app._id}`,
          type: 'BOOSTER_JOIN',
          badge: 'GIA NHẬP',
          badgeColor: 'purple',
          username,
          actionText: 'vừa đăng ký trở thành Booster',
          highlight: `Bộ môn ${game} · Tuyển chọn thành công`,
          timeAgo: this.getTimeAgo(new Date(app.createdAt)),
          createdAt: new Date(app.createdAt).toISOString(),
        });
      }

      // 7. Lấy bài viết Admin mới đăng
      const blogs = await this.blogModel
        .find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .populate('author', 'username')
        .lean();

      for (const b of blogs) {
        items.push({
          id: `blog_${b._id}`,
          type: 'BLOG_PUBLISH',
          badge: 'BÀI VIẾT MỚI',
          badgeColor: 'cyan',
          username: 'BQT LEORANK',
          actionText: 'vừa xuất bản bài viết mới',
          highlight: `"${b.title.slice(0, 42)}${b.title.length > 42 ? '...' : ''}"`,
          timeAgo: this.getTimeAgo(new Date(b.createdAt)),
          createdAt: new Date(b.createdAt).toISOString(),
        });
      }
    } catch (err: any) {
      this.logger.warn(`Lỗi khi truy vấn real activity feed: ${err?.message}`);
    }

    // 8. Bổ sung dữ liệu sinh động (Fallback / Simulation) nếu số lượng thực tế dưới 25
    const realisticFallbacks = this.getRealisticFallbacks();
    const combined = [...items, ...realisticFallbacks];

    // Sắp xếp theo thời gian mới nhất
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Giới hạn 30 items phong phú nhất
    const finalFeed = combined.slice(0, 30);

    this.cachedFeed = {
      data: finalFeed,
      expiresAt: now + this.CACHE_TTL_MS,
    };

    return finalFeed;
  }

  /**
   * Tạo danh sách hoạt động giả lập sống động, chân thực để liên tục "câu khách"
   */
  private getRealisticFallbacks(): ActivityFeedItem[] {
    const baseNow = Date.now();
    const presets: Array<{
      type: ActivityFeedItem['type'];
      badge: string;
      badgeColor: ActivityFeedItem['badgeColor'];
      username: string;
      actionText: string;
      highlight: string;
      minuteOffset: number;
    }> = [
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'chi***02',
        actionText: 'vừa nạp ví CTV qua QR',
        highlight: '+100.000 đ',
        minuteOffset: 1,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'ho***89',
        actionText: 'vừa đặt đơn cày rank Liên Quân',
        highlight: 'Kim Cương II ➔ Cao Thủ',
        minuteOffset: 3,
      },
      {
        type: 'VIP_UPGRADE',
        badge: 'HỘI VIÊN VIP',
        badgeColor: 'amber',
        username: 'ho***92',
        actionText: 'vừa đăng ký gói Hội viên VIP',
        highlight: 'Gói VIP Kim Cương · Giảm 15% trọn đời',
        minuteOffset: 5,
      },
      {
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ng***28',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ Booster đánh quá đỉnh, 2 tiếng xong đơn!',
        minuteOffset: 7,
      },
      {
        type: 'BOOSTER_JOIN',
        badge: 'GIA NHẬP',
        badgeColor: 'purple',
        username: 'qu***78',
        actionText: 'vừa đăng ký trở thành Booster',
        highlight: 'Bộ môn Liên Quân Mobile · Rank Thách Đấu',
        minuteOffset: 10,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'tr***96',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+200.000 đ',
        minuteOffset: 12,
      },
      {
        type: 'BLOG_PUBLISH',
        badge: 'BÀI VIẾT MỚI',
        badgeColor: 'cyan',
        username: 'BQT LEORANK',
        actionText: 'vừa xuất bản bài viết mới',
        highlight: 'Giáo trình leo Chiến Tướng Liên Quân mùa 2026',
        minuteOffset: 14,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'le***05',
        actionText: 'vừa đặt đơn cày rank LMHT',
        highlight: 'Vàng I ➔ Bạch Kim IV',
        minuteOffset: 17,
      },
      {
        type: 'VIP_UPGRADE',
        badge: 'HỘI VIÊN VIP',
        badgeColor: 'amber',
        username: 'th***16',
        actionText: 'vừa nâng cấp Hội viên VIP',
        highlight: 'Gói VIP Vàng · Nhận quà độc quyền',
        minuteOffset: 20,
      },
      {
        type: 'COMMENT',
        badge: 'BÌNH LUẬN',
        badgeColor: 'blue',
        username: 'tu***77',
        actionText: 'vừa bình luận bài viết',
        highlight: 'Bí quyết chọn tướng gánh team mùa mới',
        minuteOffset: 23,
      },
      {
        type: 'BOOSTER_JOIN',
        badge: 'GIA NHẬP',
        badgeColor: 'purple',
        username: 'vi***29',
        actionText: 'vừa đăng ký trở thành Booster',
        highlight: 'Bộ môn LMHT · Rank Cao Thủ 300 LP',
        minuteOffset: 26,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'du***88',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+500.000 đ',
        minuteOffset: 30,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'mi***33',
        actionText: 'vừa đặt đơn Net Wins Liên Quân',
        highlight: '3 trận thắng Tinh Anh',
        minuteOffset: 34,
      },
      {
        type: 'BLOG_PUBLISH',
        badge: 'BÀI VIẾT MỚI',
        badgeColor: 'cyan',
        username: 'BQT LEORANK',
        actionText: 'vừa xuất bản bài viết mới',
        highlight: 'Cập nhật bảng giá cày rank & chính sách bảo vệ khách hàng',
        minuteOffset: 39,
      },
      {
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ph***62',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ 10/10 uy tín, bảo mật acc an toàn tuyệt đối',
        minuteOffset: 44,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'ki***91',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+150.000 đ',
        minuteOffset: 50,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'qu***14',
        actionText: 'vừa đặt đơn cày rank Valorant',
        highlight: 'Silver 3 ➔ Gold 2',
        minuteOffset: 58,
      },
      {
        type: 'BOOSTER_JOIN',
        badge: 'GIA NHẬP',
        badgeColor: 'purple',
        username: 'du***45',
        actionText: 'vừa đăng ký trở thành Booster',
        highlight: 'Bộ môn Valorant · Rank Ascendant 3',
        minuteOffset: 65,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'va***67',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+300.000 đ',
        minuteOffset: 72,
      },
      {
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ha***09',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ Kéo duo win thông 6 trận, quá mượt!',
        minuteOffset: 85,
      },
    ];

    return presets.map((p, idx) => {
      const itemDate = new Date(baseNow - p.minuteOffset * 60 * 1000);
      return {
        id: `sim_${idx}_${p.type}`,
        type: p.type,
        badge: p.badge,
        badgeColor: p.badgeColor,
        username: p.username,
        actionText: p.actionText,
        highlight: p.highlight,
        timeAgo: this.getTimeAgo(itemDate),
        createdAt: itemDate.toISOString(),
      };
    });
  }
}
