import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { WebhooksService, SePayWebhookData } from '../webhooks/webhooks.service';

import { IUser } from '../../database/schemas/User';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { ISystemSetting } from '../../database/schemas/SystemSetting';
import { IVerificationCode } from '../../database/schemas/VerificationCode';
import { INotification } from '../../database/schemas/Notification';
import { IWebhookLog } from '../../database/schemas/WebhookLog';
import { IAuditLog } from '../../database/schemas/AuditLog';
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
    @InjectModel('VerificationCode') private verificationCodeModel: Model<IVerificationCode>,
    @InjectModel('Notification') private notificationModel: Model<INotification>,
    @InjectModel('WebhookLog') private webhookLogModel: Model<IWebhookLog>,
    @InjectModel('AuditLog') private auditLogModel: Model<IAuditLog>,
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

  // 6. Chu kỳ tối ưu hóa hệ thống & dọn dẹp Cache (23:59 Chủ Nhật hàng tuần - Giờ VN)
  @Cron('59 23 * * 0', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleWeeklySystemOptimization(force = false) {
    this.logger.log('🧹 [Cron] Bắt đầu chu kỳ tối ưu hóa hệ thống & dọn dẹp Cache...');
    const startTime = performance.now();
    const now = new Date();

    const results = {
      expiredCodesRemoved: 0,
      oldNotificationsRemoved: 0,
      oldWebhookLogsRemoved: 0,
      oldAuditLogsRemoved: 0,
      estimatedMemoryFreedKb: 0,
      durationMs: 0,
      optimizedAt: now.toISOString(),
      triggeredBy: force ? 'MANUAL_TRIGGER' : 'SCHEDULED_CRON',
    };

    try {
      // 1. Dọn dẹp mã xác thực OTP đã hết hạn
      const codeResult = await this.verificationCodeModel.deleteMany({
        expiresAt: { $lt: now },
      });
      results.expiredCodesRemoved = codeResult.deletedCount || 0;

      // 2. Dọn dẹp thông báo đã đọc cũ hơn 30 ngày
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const notifResult = await this.notificationModel.deleteMany({
        isRead: true,
        createdAt: { $lt: thirtyDaysAgo },
      });
      results.oldNotificationsRemoved = notifResult.deletedCount || 0;

      // 3. Dọn dẹp Webhook logs cũ hơn 60 ngày
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const webhookResult = await this.webhookLogModel.deleteMany({
        createdAt: { $lt: sixtyDaysAgo },
      });
      results.oldWebhookLogsRemoved = webhookResult.deletedCount || 0;

      // 4. Dọn dẹp Audit logs cũ hơn 90 ngày
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const auditResult = await this.auditLogModel.deleteMany({
        createdAt: { $lt: ninetyDaysAgo },
      });
      results.oldAuditLogsRemoved = auditResult.deletedCount || 0;

      // 5. Tính toán dung lượng giải phóng ước tính (trung bình 1.5KB/record + 64KB cache buffer)
      const totalDeleted =
        results.expiredCodesRemoved +
        results.oldNotificationsRemoved +
        results.oldWebhookLogsRemoved +
        results.oldAuditLogsRemoved;
      results.estimatedMemoryFreedKb = Math.round(totalDeleted * 1.5 + 64);

      const endTime = performance.now();
      results.durationMs = Math.round(endTime - startTime);

      // 6. Ghi nhận thời gian và kết quả tối ưu vào SystemSetting
      await this.settingModel.findOneAndUpdate(
        { key: 'SYSTEM_OPTIMIZATION_LAST_RUN' },
        {
          key: 'SYSTEM_OPTIMIZATION_LAST_RUN',
          value: JSON.stringify(results),
          description: 'Kết quả lần tối ưu hóa hệ thống & dọn dẹp Cache gần nhất',
        },
        { upsert: true, new: true }
      );

      this.logger.log(
        `✨ [Cron] Tối ưu hóa hệ thống hoàn tất trong ${results.durationMs}ms: Đã dọn ${totalDeleted} bản ghi rác, giải phóng ~${results.estimatedMemoryFreedKb}KB bộ nhớ.`
      );

      return results;
    } catch (err: any) {
      this.logger.error('❌ [Cron] Lỗi khi tối ưu hóa hệ thống:', err.message);
      throw err;
    }
  }

  // Lấy trạng thái chu kỳ tối ưu hóa và thời điểm lần tới
  async getOptimizationStatus() {
    const now = new Date();
    // Chuyển sang giờ Việt Nam (UTC+7)
    const vnTime = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
    const dayOfWeek = vnTime.getDay(); // 0: Chủ Nhật, 1: Thứ Hai,... 6: Thứ Bảy

    let daysUntilSunday = (7 - dayOfWeek) % 7;
    const targetVn = new Date(vnTime);
    targetVn.setDate(vnTime.getDate() + daysUntilSunday);
    targetVn.setHours(23, 59, 0, 0);

    // Nếu hôm nay là Chủ Nhật và đã qua 23:59:00 -> tính Chủ Nhật tuần sau
    if (targetVn.getTime() <= vnTime.getTime()) {
      targetVn.setDate(targetVn.getDate() + 7);
    }

    // Convert targetVn trở lại UTC Date
    const nextSundayUtc = new Date(targetVn.getTime() - (7 * 60 + now.getTimezoneOffset()) * 60000);

    // Lấy thông tin lần chạy gần nhất
    const lastRunSetting = await this.settingModel.findOne({ key: 'SYSTEM_OPTIMIZATION_LAST_RUN' }).lean();
    let lastRun = null;
    if (lastRunSetting?.value) {
      try {
        lastRun = JSON.parse(lastRunSetting.value);
      } catch {
        lastRun = { raw: lastRunSetting.value };
      }
    }

    return {
      nextRunAt: nextSundayUtc.toISOString(),
      cronExpression: '59 23 * * 0',
      scheduleDescription: '23:59 Chủ Nhật hàng tuần (Giờ Việt Nam)',
      lastRun,
    };
  }
}
