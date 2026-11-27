import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { WebhooksService, SePayWebhookData } from '../webhooks/webhooks.service';

import { IUser } from '../../database/schemas/User';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { ISystemSetting } from '../../database/schemas/SystemSetting';
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
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    private readonly webhooksService: WebhooksService,
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

  // 3. Gửi email nhắc nhở đơn Coaching sắp diễn ra trong 1 giờ tới
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCoachingReminders() {
    this.logger.log('🔔 [Cron] Checking for upcoming coaching sessions...');
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingOrders = await this.orderModel.find({
      service_type: 'COACHING',
      status: OrderStatus.IN_PROGRESS,
      createdAt: { $lte: oneHourLater },
    });

    this.logger.log(`🔔 [Cron] Scanned ${upcomingOrders.length} coaching sessions.`);
    return { success: true, processed: upcomingOrders.length };
  }

  // 4. Tự động chuyển giao đơn chỉ định quá hạn nhận việc về Sàn việc làm công khai
  @Cron(CronExpression.EVERY_MINUTE)
  async handleHandoverTimeoutOrders() {
    try {
      // 1. Lấy cấu hình thời gian chuyển giao từ SystemSetting (Mặc định: 15 phút)
      const setting = await this.settingModel.findOne({ key: 'HANDOVER_TIMEOUT_MINUTES' }).lean();
      const timeoutMinutes = setting?.value ? Number(setting.value) : 15;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const deadline = new Date(Date.now() - timeoutMs);

      // 2. Tìm các đơn PAID có boosterId (đơn chỉ định) chưa nhận (vẫn là PAID), tạo trước deadline
      const timeoutOrders = await this.orderModel.find({
        status: OrderStatus.PAID,
        boosterId: { $ne: null },
        createdAt: { $lt: deadline },
      });

      if (!timeoutOrders || timeoutOrders.length === 0) return;

      this.logger.log(`⏳ [Cron] Tìm thấy ${timeoutOrders.length} đơn chỉ định quá hạn ${timeoutMinutes} phút không nhận. Đang chuyển giao...`);

      for (const order of timeoutOrders) {
        const oldBoosterId = order.boosterId;

        // Cập nhật: $unset boosterId, ghi timeline
        await this.orderModel.findByIdAndUpdate(order._id, {
          $unset: { boosterId: 1 },
          $set: { status: OrderStatus.PAID },
          $push: {
            timeline: {
              status: OrderStatus.PAID,
              timestamp: new Date(),
              note: `Hết thời gian chờ (${timeoutMinutes} phút). Hệ thống tự động chuyển giao đơn hàng về Sàn việc làm công khai để các Booster khác tiếp nhận.`,
            },
          },
        });

        this.logger.log(`🔄 [Cron] Đã tự động chuyển giao đơn #${order.orderCode || order._id} (Booster cũ: ${oldBoosterId}) về Sàn công khai`);
      }
    } catch (err: any) {
      this.logger.error('❌ [Cron] Lỗi khi xử lý chuyển giao đơn quá hạn:', err.message);
    }
  }

  // 5. Job đối soát SePay dự phòng (chạy mỗi 30 giây): tự động kéo các giao dịch nạp tiền nếu webhook bị trễ
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleSepayReconciliation() {
    const accessToken = process.env.SEPAY_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return;
    }

    try {
      this.logger.log('🔄 [Cron Reconcile] Checking recent SePay transactions...');
      const response = await axios.get('https://my.sepay.vn/userapi/transactions/list?limit=20', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });

      const transactions = response.data?.messages || response.data?.transactions || [];
      if (!Array.isArray(transactions) || transactions.length === 0) return;

      for (const item of transactions) {
        const transferType = item.transfer_type === 'in' || item.amount_in > 0 ? 'in' : 'out';
        const transferAmount = Number(item.amount_in || item.transfer_amount || item.transferAmount || 0);

        if (transferType === 'in' && transferAmount > 0) {
          const normalizedData: SePayWebhookData = {
            id: Number(item.id),
            gateway: item.gateway || 'Bank',
            transactionDate: item.transaction_date || item.transactionDate || new Date().toISOString(),
            accountNumber: item.account_number || item.accountNumber || '',
            subAccount: item.sub_account || item.subAccount || null,
            code: item.code || null,
            transferType: 'in',
            transferAmount,
            content: item.transaction_content || item.content || item.transferContent || '',
            referenceCode: item.reference_number || item.referenceCode || '',
            description: item.description || '',
          };

          await this.webhooksService.processDepositTransaction(normalizedData, {
            ip: '127.0.0.1 (Cron Reconcile)',
          });
        }
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ [Cron Reconcile] Failed to reconcile with SePay API: ${err.message}`);
    }
  }
}
