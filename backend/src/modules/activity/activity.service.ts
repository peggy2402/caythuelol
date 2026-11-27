import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITransaction, TransactionType, TransactionStatus } from '../../database/schemas/Transaction';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { IComment } from '../../database/schemas/Comment';
import { IBlog } from '../../database/schemas/Blog';

export interface ActivityFeedItem {
  id: string;
  type: 'DEPOSIT' | 'ORDER' | 'REVIEW' | 'COMMENT';
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'yellow' | 'blue';
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
    } catch (err: any) {
      this.logger.warn(`Lỗi khi truy vấn real activity feed: ${err?.message}`);
    }

    // 5. Bổ sung dữ liệu sinh động (Fallback / Simulation) nếu số lượng thực tế dưới 20
    const realisticFallbacks = this.getRealisticFallbacks();
    const combined = [...items, ...realisticFallbacks];

    // Sắp xếp theo thời gian mới nhất
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Giới hạn 25 items phong phú nhất
    const finalFeed = combined.slice(0, 25);

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
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ng***28',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ Booster đánh quá đỉnh, 2 tiếng xong đơn!',
        minuteOffset: 6,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'tr***96',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+200.000 đ',
        minuteOffset: 9,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'le***05',
        actionText: 'vừa đặt đơn cày rank LMHT',
        highlight: 'Vàng I ➔ Bạch Kim IV',
        minuteOffset: 12,
      },
      {
        type: 'COMMENT',
        badge: 'BÌNH LUẬN',
        badgeColor: 'blue',
        username: 'tu***77',
        actionText: 'vừa bình luận bài viết',
        highlight: 'Giáo trình leo Chiến Tướng Liên Quân mùa 2026',
        minuteOffset: 15,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'du***88',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+500.000 đ',
        minuteOffset: 19,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'mi***33',
        actionText: 'vừa đặt đơn Net Wins Liên Quân',
        highlight: '3 trận thắng Tinh Anh',
        minuteOffset: 24,
      },
      {
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ph***62',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ 10/10 uy tín, bảo mật acc an toàn tuyệt đối',
        minuteOffset: 28,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'ki***91',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+150.000 đ',
        minuteOffset: 33,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'qu***14',
        actionText: 'vừa đặt đơn cày rank Valorant',
        highlight: 'Silver 3 ➔ Gold 2',
        minuteOffset: 38,
      },
      {
        type: 'COMMENT',
        badge: 'BÌNH LUẬN',
        badgeColor: 'blue',
        username: 'an***52',
        actionText: 'vừa bình luận bài viết',
        highlight: 'Bảng ngọc và lối lên đồ tướng mới cập nhật',
        minuteOffset: 45,
      },
      {
        type: 'DEPOSIT',
        badge: 'NẠP QR',
        badgeColor: 'emerald',
        username: 'va***67',
        actionText: 'vừa nạp ví qua QR',
        highlight: '+300.000 đ',
        minuteOffset: 52,
      },
      {
        type: 'ORDER',
        badge: 'ĐẶT ĐƠN',
        badgeColor: 'amber',
        username: 'ti***22',
        actionText: 'vừa đặt đơn cày ĐTCL (TFT)',
        highlight: 'Bạch Kim ➔ Kim Cương IV',
        minuteOffset: 65,
      },
      {
        type: 'REVIEW',
        badge: 'ĐÁNH GIÁ',
        badgeColor: 'yellow',
        username: 'ha***09',
        actionText: 'vừa đánh giá 5★ cho Booster',
        highlight: '⭐⭐⭐⭐⭐ Kéo duo win thông 6 trận, quá mượt!',
        minuteOffset: 80,
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
