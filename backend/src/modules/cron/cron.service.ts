import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IUser } from '../../database/schemas/User';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
  ) {}

  // 1. Quét nợ và tự động khóa tài khoản mỗi ngày lúc nửa đêm
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDebtCollection() {
    this.logger.log('🕛 [Cron] Running debt collection check...');
    const now = new Date();

    // Tìm các tài khoản âm ví
    const indebtedUsers = await this.userModel.find({
      'debt_info.is_in_debt': true,
      wallet_balance: { $lt: 0 },
    });

    for (const user of indebtedUsers) {
      if (user.debt_info?.ban_deadline && now > user.debt_info.ban_deadline) {
        user.isBanned = true;
        this.logger.warn(`🚫 [Cron] Auto-banning user ${user.username} due to expired debt deadline.`);
      } else {
        user.debt_info!.reminder_count = (user.debt_info!.reminder_count || 0) + 1;
        user.debt_info!.last_reminded_at = now;
      }
      await user.save();
    }
  }

  // 2. Tự động hủy đơn hàng quá 3 ngày không có Booster nhận
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleExpireOrders() {
    this.logger.log('⏳ [Cron] Checking for expired unclaimed orders (> 3 days)...');
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const expiredOrders = await this.orderModel.find({
      status: OrderStatus.PAID,
      boosterId: { $in: [null, undefined] },
      createdAt: { $lt: threeDaysAgo },
    });

    for (const order of expiredOrders) {
      order.status = OrderStatus.CANCELLED;
      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: OrderStatus.CANCELLED,
        timestamp: new Date(),
        actor: order.customerId,
        note: 'Hệ thống tự động hủy đơn sau 3 ngày không có Booster nhận và hoàn tiền cho khách',
      });
      await order.save();

      // Refund customer
      const customer = await this.userModel.findById(order.customerId);
      if (customer) {
        const refundAmount = order.pricing.deposit_amount || order.pricing.total_amount;
        customer.wallet_balance += refundAmount;
        await customer.save();

        await this.transactionModel.create({
          userId: customer._id,
          orderId: order._id,
          type: TransactionType.REFUND,
          amount: refundAmount,
          balanceAfter: customer.wallet_balance,
          status: TransactionStatus.SUCCESS,
          description: `Hoàn tiền tự động cho đơn hàng quá hạn #${order.orderCode || order._id.toString().slice(-6)}`,
        });
      }

      this.logger.log(`✅ [Cron] Expired & refunded order #${order.orderCode || order._id}`);
    }
  }
}
