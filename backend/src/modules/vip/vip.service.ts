import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IUser } from '../../database/schemas/User';
import { ITransaction, TransactionType, TransactionStatus } from '../../database/schemas/Transaction';
import { ISystemSetting } from '../../database/schemas/SystemSetting';

export interface VipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  originalPrice?: number;
  discountPercent: number;
  periodLabel: string;
  badge?: string;
  popular?: boolean;
}

export const VIP_PLANS_CATALOG: VipPlan[] = [
  {
    id: '1_MONTH',
    name: 'LeoRank VIP Pass (1 Tháng)',
    durationDays: 30,
    price: 199000,
    originalPrice: 250000,
    discountPercent: 10,
    periodLabel: '30 ngày',
    badge: 'Khởi đầu',
  },
  {
    id: '3_MONTHS',
    name: 'LeoRank VIP Pro (3 Tháng)',
    durationDays: 90,
    price: 499000,
    originalPrice: 597000,
    discountPercent: 10,
    periodLabel: '90 ngày',
    popular: true,
    badge: 'Phổ biến nhất',
  },
  {
    id: '1_YEAR',
    name: 'LeoRank VIP Diamond (1 Năm)',
    durationDays: 365,
    price: 1590000,
    originalPrice: 2388000,
    discountPercent: 15,
    periodLabel: '365 ngày',
    badge: 'Tiết kiệm 35%',
  },
];

export const VIP_BENEFITS = [
  {
    id: 'discount',
    title: 'Chiết Khấu 10% - 15% Trọn Đời',
    desc: 'Tự động giảm giá trực tiếp cho mọi dịch vụ cày thuê LMHT, Valorant, ĐTCL, Liên Quân và tất cả game khác.',
  },
  {
    id: 'priority',
    title: 'Ưu Tiên Ghép Tuyển Thủ 3 Phút',
    desc: 'Đơn hàng VIP được ưu tiên đẩy lên đầu sàn việc làm, tự động chỉ định Booster Thách Đấu có tỷ lệ thắng trên 85%.',
  },
  {
    id: 'free_role',
    title: 'Miễn Phí Chọn Vị Trí & Tướng Tủ',
    desc: 'Miễn phí hoàn toàn phụ phí chọn tướng, chỉ định vị trí thi đấu (tiết kiệm thêm 20% - 30% trên mỗi đơn).',
  },
  {
    id: 'support',
    title: 'Chuyên Viên Chăm Sóc 1-1 Riêng Biệt',
    desc: 'Hỗ trợ VIP 24/7 qua Telegram/Zalo, giải quyết mọi yêu cầu phát sinh và điều phối tuyển thủ trong 5 phút.',
  },
  {
    id: 'insurance',
    title: 'Bảo Hiểm Tài Khoản 100% LeoRank Escrow',
    desc: 'Cam kết bồi thường 100% giá trị tài khoản và hoàn tiền nếu có sự cố kỷ luật do tuyển thủ gây ra.',
  },
  {
    id: 'leopoint',
    title: 'Nhân Đôi (x2) Điểm Thưởng LeoPoint',
    desc: 'Tích lũy x2 điểm thưởng khi hoàn thành đơn để đổi Skin, Thẻ cào và quà tặng hiện vật giá trị cao.',
  },
];

@Injectable()
export class VipService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('SystemSetting') private systemSettingModel: Model<ISystemSetting>,
  ) {}

  /**
   * Lấy danh sách các gói VIP và danh sách đặc quyền
   */
  async getPlans() {
    let customConfig: any = null;
    try {
      const setting = await this.systemSettingModel.findOne({ key: 'VIP_CONFIG' });
      if (setting && setting.value) {
        customConfig = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      }
    } catch {}

    const plans = VIP_PLANS_CATALOG.map((p) => {
      if (customConfig && p.id === '1_MONTH') {
        return {
          ...p,
          name: customConfig.name || p.name,
          price: customConfig.price || p.price,
          discountPercent: customConfig.discountPercent || p.discountPercent,
        };
      }
      return p;
    });

    const benefits = customConfig?.benefits || VIP_BENEFITS;

    return {
      success: true,
      plans,
      benefits,
    };
  }

  /**
   * Lấy trạng thái VIP hiện tại của User
   */
  async getMyStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('username email wallet_balance vip_info');
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng');
    }

    const now = new Date();
    const vipInfo = user.vip_info;
    const isVip = Boolean(vipInfo?.is_vip && vipInfo.end_date && new Date(vipInfo.end_date) > now);

    let daysRemaining = 0;
    if (isVip && vipInfo?.end_date) {
      const diffTime = new Date(vipInfo.end_date).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        walletBalance: user.wallet_balance || 0,
      },
      vip: {
        isVip,
        packageType: vipInfo?.package_type || null,
        discountPercent: isVip ? (vipInfo?.discount_percent || 10) : 0,
        startDate: vipInfo?.start_date || null,
        endDate: vipInfo?.end_date || null,
        daysRemaining,
      },
    };
  }

  /**
   * Đăng ký hoặc Gia hạn gói VIP bằng số dư ví LeoRank
   */
  async subscribe(userId: string, planId: string) {
    const plan = VIP_PLANS_CATALOG.find((p) => p.id === planId);
    if (!plan) {
      throw new BadRequestException('Gói hội viên không hợp lệ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const currentBalance = user.wallet_balance || 0;
    if (currentBalance < plan.price) {
      throw new BadRequestException(
        `Số dư ví không đủ để thanh toán gói ${plan.name}. Bạn có ${currentBalance.toLocaleString('vi-VN')} đ, cần ${plan.price.toLocaleString('vi-VN')} đ. Vui lòng nạp thêm tiền.`,
      );
    }

    const now = new Date();
    let startDate = now;
    let endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Nếu user đang có VIP còn hạn, cộng dồn tiếp thời gian
    if (user.vip_info?.is_vip && user.vip_info?.end_date && new Date(user.vip_info.end_date) > now) {
      startDate = new Date(user.vip_info.start_date || now);
      const currentEnd = new Date(user.vip_info.end_date).getTime();
      endDate = new Date(currentEnd + plan.durationDays * 24 * 60 * 60 * 1000);
    }

    // 1. Trừ tiền ví
    user.wallet_balance = currentBalance - plan.price;

    // 2. Cập nhật thông tin VIP
    user.vip_info = {
      is_vip: true,
      package_type: plan.name,
      discount_percent: plan.discountPercent,
      start_date: startDate,
      end_date: endDate,
      note: `Đăng ký ${plan.name} qua ví`,
    };
    await user.save();

    // 3. Tạo Transaction ghi nhận lịch sử
    await this.transactionModel.create({
      userId: user._id,
      type: TransactionType.VIP_PURCHASE,
      amount: -plan.price,
      balanceAfter: user.wallet_balance,
      description: `Thanh toán đăng ký ${plan.name}`,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        discountPercent: plan.discountPercent,
        endDate: endDate.toISOString(),
      },
      status: TransactionStatus.SUCCESS,
    });

    // 4. Cập nhật đồng bộ vào bảng VIP Members của Admin nếu có
    try {
      const setting = await this.systemSettingModel.findOne({ key: 'VIP_MEMBERS_DATA' });
      let members: any[] = [];
      if (setting && setting.value) {
        members = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      }
      if (!Array.isArray(members)) members = [];

      const memberIndex = members.findIndex((m: any) => m.userId === String(user._id));
      const memberData = {
        id: `vip-${Date.now()}`,
        userId: String(user._id),
        username: user.username,
        email: user.email,
        avatar: user.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=10b981&color=fff`,
        packageType: plan.name,
        discountPercent: plan.discountPercent,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'ACTIVE',
        note: `Tự kích hoạt qua số dư ví`,
      };

      if (memberIndex >= 0) {
        members[memberIndex] = { ...members[memberIndex], ...memberData };
      } else {
        members.unshift(memberData);
      }

      await this.systemSettingModel.findOneAndUpdate(
        { key: 'VIP_MEMBERS_DATA' },
        { value: members, description: 'Danh sách thành viên sở hữu gói Hội Viên VIP' },
        { upsert: true, new: true },
      );
    } catch (e) {
      console.warn('Lỗi đồng bộ VIP Members Data:', e);
    }

    const diffTime = endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      success: true,
      message: `Chúc mừng bạn đã kích hoạt thành công ${plan.name}!`,
      vip: {
        isVip: true,
        packageType: plan.name,
        discountPercent: plan.discountPercent,
        startDate,
        endDate,
        daysRemaining,
      },
      newBalance: user.wallet_balance,
    };
  }
}
