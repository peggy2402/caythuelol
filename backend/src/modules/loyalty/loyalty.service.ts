import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection, ClientSession } from 'mongoose';

import { IUser, UserRole } from '../../database/schemas/User';
import { IVoucher, VoucherStatus, VoucherType } from '../../database/schemas/Voucher';
import {
  IPointTransaction,
  PointTransactionType,
} from '../../database/schemas/PointTransaction';

export const LOYALTY_TARGET_POINTS = 2000;
export const VND_PER_POINT = 1000;

export interface VoucherRewardDefinition {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: VoucherType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  validDays: number;
  isTargetReward?: boolean;
}

export const VOUCHER_CATALOG: VoucherRewardDefinition[] = [
  {
    id: 'REWARD_500',
    title: 'Voucher Giảm 25.000đ',
    description: 'Áp dụng cho đơn hàng từ 100.000đ trở lên',
    pointsCost: 500,
    type: VoucherType.FIXED,
    value: 25000,
    minOrderAmount: 100000,
    validDays: 30,
  },
  {
    id: 'REWARD_1000',
    title: 'Voucher Giảm 60.000đ',
    description: 'Áp dụng cho đơn hàng từ 200.000đ trở lên',
    pointsCost: 1000,
    type: VoucherType.FIXED,
    value: 60000,
    minOrderAmount: 200000,
    validDays: 30,
  },
  {
    id: 'REWARD_1500',
    title: 'Voucher Giảm 10%',
    description: 'Giảm 10% (tối đa 120.000đ) cho đơn từ 300.000đ',
    pointsCost: 1500,
    type: VoucherType.PERCENTAGE,
    value: 10,
    maxDiscount: 120000,
    minOrderAmount: 300000,
    validDays: 30,
  },
  {
    id: 'REWARD_2000',
    title: 'Siêu Voucher Target 20%',
    description: 'Mốc mục tiêu 2.000 điểm: Giảm 20% (tối đa 250.000đ) cho đơn từ 300.000đ',
    pointsCost: 2000,
    type: VoucherType.PERCENTAGE,
    value: 20,
    maxDiscount: 250000,
    minOrderAmount: 300000,
    validDays: 45,
    isTargetReward: true,
  },
];

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Voucher') private voucherModel: Model<IVoucher>,
    @InjectModel('PointTransaction') private pointTxModel: Model<IPointTransaction>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private ensureCustomer(user: { role: UserRole | string }) {
    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Chương trình tích điểm đổi voucher chỉ áp dụng cho tài khoản Khách hàng (Customer)');
    }
  }

  async getMyLoyalty(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    this.ensureCustomer(user);

    const now = new Date();
    // Tự động cập nhật trạng thái EXPIRED cho các voucher quá hạn
    await this.voucherModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        status: VoucherStatus.ACTIVE,
        expiresAt: { $lt: now },
      },
      { $set: { status: VoucherStatus.EXPIRED } },
    );

    const [myVouchers, pointHistory] = await Promise.all([
      this.voucherModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean(),
      this.pointTxModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const currentPoints = user.loyalty_points || 0;
    const totalEarned = user.total_points_earned || 0;
    const progressPercent = Math.min(
      100,
      Math.round((currentPoints / LOYALTY_TARGET_POINTS) * 100),
    );
    const remainingToTarget = Math.max(0, LOYALTY_TARGET_POINTS - currentPoints);

    return {
      success: true,
      loyalty: {
        currentPoints,
        totalPointsEarned: totalEarned,
        targetPoints: LOYALTY_TARGET_POINTS,
        progressPercent,
        remainingToTarget,
        hasReachedTarget: currentPoints >= LOYALTY_TARGET_POINTS,
        earnRateDescription: '1.000 VNĐ chi tiêu (đơn hoàn thành 100%) = 1 điểm tích lũy',
      },
      catalog: VOUCHER_CATALOG,
      myVouchers,
      pointHistory,
    };
  }

  async redeemVoucher(userId: string, rewardId: string) {
    const reward = VOUCHER_CATALOG.find((r) => r.id === rewardId);
    if (!reward) {
      throw new BadRequestException('Gói voucher không tồn tại');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');
      this.ensureCustomer(user);

      const currentPoints = user.loyalty_points || 0;
      if (currentPoints < reward.pointsCost) {
        throw new BadRequestException(
          `Bạn chưa đủ điểm (cần ${reward.pointsCost.toLocaleString('vi-VN')} điểm, hiện có ${currentPoints.toLocaleString('vi-VN')} điểm)`,
        );
      }

      user.loyalty_points = currentPoints - reward.pointsCost;
      await user.save({ session });

      const code = `LRV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const expiresAt = new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000);

      const [createdVoucher] = await this.voucherModel.create(
        [
          {
            userId: user._id,
            code,
            rewardId: reward.id,
            title: reward.title,
            type: reward.type,
            value: reward.value,
            maxDiscount: reward.maxDiscount,
            minOrderAmount: reward.minOrderAmount,
            pointsCost: reward.pointsCost,
            status: VoucherStatus.ACTIVE,
            expiresAt,
          },
        ],
        { session },
      );

      const [createdTx] = await this.pointTxModel.create(
        [
          {
            userId: user._id,
            voucherId: createdVoucher._id,
            type: PointTransactionType.REDEEM_VOUCHER,
            points: -reward.pointsCost,
            balanceAfter: user.loyalty_points,
            description: `Đổi ${reward.title} (${code})`,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      return {
        success: true,
        message: `Đổi ${reward.title} thành công!`,
        voucher: createdVoucher,
        transaction: createdTx,
        currentPoints: user.loyalty_points,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async validateCustomerVoucher(userId: string, code: string, orderAmount: number = 0) {
    if (!code) {
      throw new BadRequestException('Vui lòng nhập mã voucher');
    }

    const voucher = await this.voucherModel
      .findOne({
        userId: new Types.ObjectId(userId),
        code: code.trim().toUpperCase(),
      })
      .lean();

    if (!voucher) {
      throw new NotFoundException('Không tìm thấy voucher này trong tài khoản của bạn');
    }

    if (voucher.status === VoucherStatus.USED) {
      throw new BadRequestException('Voucher này đã được sử dụng');
    }

    if (voucher.status === VoucherStatus.EXPIRED || new Date(voucher.expiresAt) < new Date()) {
      throw new BadRequestException('Voucher này đã hết hạn sử dụng');
    }

    if (orderAmount > 0 && voucher.minOrderAmount > orderAmount) {
      throw new BadRequestException(
        `Voucher áp dụng cho đơn từ ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ trở lên`,
      );
    }

    let discountAmount = 0;
    if (voucher.type === VoucherType.PERCENTAGE) {
      discountAmount = Math.round((orderAmount * voucher.value) / 100);
      if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount;
      }
    } else {
      discountAmount = voucher.value;
    }

    return {
      success: true,
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        title: voucher.title,
        type: voucher.type,
        value: voucher.value,
        maxDiscount: voucher.maxDiscount,
        minOrderAmount: voucher.minOrderAmount,
        discountAmount,
      },
    };
  }

  async markVoucherUsed(
    userId: string,
    code: string,
    orderId: Types.ObjectId,
    session?: ClientSession,
  ) {
    const voucher = await this.voucherModel
      .findOne({
        userId: new Types.ObjectId(userId),
        code: code.trim().toUpperCase(),
        status: VoucherStatus.ACTIVE,
      })
      .session(session || null);

    if (!voucher) return null;

    if (new Date(voucher.expiresAt) < new Date()) {
      voucher.status = VoucherStatus.EXPIRED;
      await voucher.save({ session });
      throw new BadRequestException('Voucher đã hết hạn sử dụng');
    }

    voucher.status = VoucherStatus.USED;
    voucher.usedOrderId = orderId;
    voucher.usedAt = new Date();
    await voucher.save({ session });

    return voucher;
  }

  async awardOrderPoints(
    customerId: string,
    orderId: Types.ObjectId,
    orderCode: string,
    paidAmount: number,
    session?: ClientSession,
  ) {
    const pointsToAdd = Math.floor(Math.max(0, paidAmount) / VND_PER_POINT);
    if (pointsToAdd <= 0) return 0;

    // Idempotency: tránh cộng điểm trùng cho cùng 1 đơn hàng
    const existing = await this.pointTxModel
      .findOne({
        orderId,
        type: PointTransactionType.EARN_ORDER,
      })
      .session(session || null);
    if (existing) return 0;

    const customer = await this.userModel.findById(customerId).session(session || null);
    if (!customer || customer.role !== UserRole.CUSTOMER) return 0;

    customer.loyalty_points = (customer.loyalty_points || 0) + pointsToAdd;
    customer.total_points_earned = (customer.total_points_earned || 0) + pointsToAdd;
    await customer.save({ session });

    await this.pointTxModel.create(
      [
        {
          userId: customer._id,
          orderId,
          type: PointTransactionType.EARN_ORDER,
          points: pointsToAdd,
          balanceAfter: customer.loyalty_points,
          description: `Tích điểm hoàn thành đơn hàng #${orderCode}`,
        },
      ],
      { session },
    );

    return pointsToAdd;
  }

  async revokeOrderPoints(
    customerId: string,
    orderId: Types.ObjectId,
    orderCode: string,
    session?: ClientSession,
  ) {
    // Idempotency: tránh trừ trùng điểm cho cùng 1 đơn hoàn tiền
    const alreadyRevoked = await this.pointTxModel
      .findOne({
        orderId,
        type: PointTransactionType.REVOKE_REFUND,
      })
      .session(session || null);
    if (alreadyRevoked) return 0;

    // Tìm giao dịch đã cộng điểm cho đơn hàng này
    const earnedTx = await this.pointTxModel
      .findOne({
        orderId,
        type: PointTransactionType.EARN_ORDER,
      })
      .session(session || null);
    if (!earnedTx || earnedTx.points <= 0) return 0;

    const pointsToRevoke = earnedTx.points;
    const customer = await this.userModel.findById(customerId).session(session || null);
    if (!customer || customer.role !== UserRole.CUSTOMER) return 0;

    customer.loyalty_points = Math.max(0, (customer.loyalty_points || 0) - pointsToRevoke);
    customer.total_points_earned = Math.max(0, (customer.total_points_earned || 0) - pointsToRevoke);
    await customer.save({ session });

    await this.pointTxModel.create(
      [
        {
          userId: customer._id,
          orderId,
          type: PointTransactionType.REVOKE_REFUND,
          points: -pointsToRevoke,
          balanceAfter: customer.loyalty_points,
          description: `Thu hồi điểm đơn #${orderCode} do hoàn tiền khiếu nại`,
        },
      ],
      { session },
    );

    return pointsToRevoke;
  }
}
