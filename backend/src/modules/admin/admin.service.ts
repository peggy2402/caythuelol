import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';

import { IUser, UserRole } from '../../database/schemas/User';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';
import { IBoosterApplication } from '../../database/schemas/BoosterApplication';
import { ISystemSetting } from '../../database/schemas/SystemSetting';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('BoosterApplication') private boosterAppModel: Model<IBoosterApplication>,
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getStats(startDate?: string, endDate?: string): Promise<any> {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      dateFilter.$lt = end;
    }
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 1. Tổng Nợ Người Dùng (Liabilities - User Wallets)
    const users = await this.userModel.aggregate([
      {
        $group: {
          _id: null,
          totalWallet: { $sum: '$wallet_balance' },
          totalPending: { $sum: '$pending_balance' },
        },
      },
    ]);
    const totalUserBalance =
      (users[0]?.totalWallet || 0) + (users[0]?.totalPending || 0);

    // 2. Tổng Tiền Cọc (Liabilities - Escrow)
    const escrow = await this.orderModel.aggregate([
      { $match: { 'payment.is_locked': true } },
      { $group: { _id: null, total: { $sum: '$pricing.deposit_amount' } } },
    ]);
    const totalEscrow = escrow[0]?.total || 0;

    // 3. Dòng tiền thực tế (Cash Flow)
    const transactions = await this.transactionModel.aggregate([
      { $match: { status: TransactionStatus.SUCCESS } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const depositTx = transactions.find((t) => t._id === TransactionType.DEPOSIT);
    const totalDeposits = depositTx ? depositTx.total : 0;

    const withdrawTx = transactions.find((t) => t._id === TransactionType.WITHDRAWAL);
    const totalWithdrawals = withdrawTx ? Math.abs(withdrawTx.total) : 0;

    // 4. Doanh thu Admin (Revenue)
    const completedOrdersMatch: any = {
      status: { $in: [OrderStatus.COMPLETED, 'SETTLED'] },
    };
    if (hasDateFilter) {
      completedOrdersMatch.createdAt = dateFilter;
    }

    const completedOrders = await this.orderModel.aggregate([
      { $match: completedOrdersMatch },
      { $group: { _id: null, totalFee: { $sum: '$pricing.platform_fee' } } },
    ]);
    const totalPlatformFees = completedOrders[0]?.totalFee || 0;

    const withdrawalFees = await this.transactionModel.aggregate([
      { $match: { type: TransactionType.WITHDRAWAL, status: TransactionStatus.SUCCESS } },
      { $group: { _id: null, total: { $sum: '$metadata.fee' } } },
    ]);
    const totalWithdrawalFees = withdrawalFees[0]?.total || 0;

    const adminRevenue = totalPlatformFees + totalWithdrawalFees;

    // 5. Doanh thu theo tháng (Monthly Revenue)
    const monthlyRevenueMatch: any = {
      status: { $in: [OrderStatus.COMPLETED, 'SETTLED'] },
    };
    if (hasDateFilter) {
      monthlyRevenueMatch.createdAt = dateFilter;
    }

    const monthlyRevenue = await this.orderModel.aggregate([
      { $match: monthlyRevenueMatch },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$pricing.platform_fee' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 6. Thống kê theo loại dịch vụ
    const ordersByServiceMatch: any = {};
    if (hasDateFilter) {
      ordersByServiceMatch.createdAt = dateFilter;
    }
    const ordersByService = await this.orderModel.aggregate([
      { $match: ordersByServiceMatch },
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 7. Top Boosters by Earnings
    const topBoostersMatch: any = {
      status: { $in: [OrderStatus.COMPLETED, 'SETTLED'] },
      boosterId: { $exists: true, $ne: null },
    };
    if (hasDateFilter) {
      topBoostersMatch.createdAt = dateFilter;
    }
    const topBoosters = await this.orderModel.aggregate([
      { $match: topBoostersMatch },
      {
        $group: {
          _id: '$boosterId',
          totalEarnings: { $sum: '$pricing.booster_earnings' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'boosterInfo',
        },
      },
      { $unwind: '$boosterInfo' },
      {
        $project: {
          _id: 1,
          totalEarnings: 1,
          orderCount: 1,
          username: '$boosterInfo.username',
          avatar: '$boosterInfo.profile.avatar',
        },
      },
    ]);

    // 8. Top Users by Deposit
    const topDepositorsMatch: any = {
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.SUCCESS,
    };
    if (hasDateFilter) {
      topDepositorsMatch.createdAt = dateFilter;
    }
    const topDepositors = await this.transactionModel.aggregate([
      { $match: topDepositorsMatch },
      { $group: { _id: '$userId', totalDeposited: { $sum: '$amount' } } },
      { $sort: { totalDeposited: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          totalDeposited: 1,
          username: '$userInfo.username',
          avatar: '$userInfo.profile.avatar',
        },
      },
    ]);

    // 9. Top Users by Spending
    const topSpendersMatch: any = {
      status: { $in: [OrderStatus.COMPLETED, 'SETTLED'] },
    };
    if (hasDateFilter) {
      topSpendersMatch.createdAt = dateFilter;
    }
    const topSpenders = await this.orderModel.aggregate([
      { $match: topSpendersMatch },
      {
        $group: {
          _id: '$customerId',
          totalSpent: { $sum: '$pricing.total_amount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          orderCount: 1,
          username: '$userInfo.username',
          avatar: '$userInfo.profile.avatar',
        },
      },
    ]);

    // 10. Counts
    const activeOrders = await this.orderModel.countDocuments({
      status: {
        $in: [
          OrderStatus.PAID,
          OrderStatus.APPROVED,
          OrderStatus.IN_PROGRESS,
        ],
      },
    });
    const totalUsers = await this.userModel.countDocuments({ role: UserRole.CUSTOMER });
    const totalBoosters = await this.userModel.countDocuments({ role: UserRole.BOOSTER });

    return {
      success: true,
      stats: {
        totalUserBalance,
        totalEscrow,
        totalDeposits,
        totalWithdrawals,
        adminRevenue,
        totalPlatformFees,
        totalWithdrawalFees,
        activeOrders,
        totalUsers,
        totalBoosters,
        monthlyRevenue: monthlyRevenue || [],
        ordersByService: ordersByService || [],
        topBoosters: topBoosters || [],
        topDepositors: topDepositors || [],
        topSpenders: topSpenders || [],
      },
    };
  }

  async listUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).select('-password_hash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);

    return { success: true, users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleBanUser(userId: string, isBanned: boolean) {
    const user = await this.userModel.findByIdAndUpdate(userId, { isBanned }, { new: true });
    return { success: true, isBanned: user?.isBanned };
  }

  async adjustBalance(userId: string, amount: number, note: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    user.wallet_balance += amount;
    await user.save();

    await this.transactionModel.create({
      userId: user._id,
      type: TransactionType.DEPOSIT,
      amount,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: `Admin điều chỉnh số dư: ${note}`,
    });

    return { success: true, balance: user.wallet_balance };
  }

  async listBoosterApplications() {
    const apps = await this.boosterAppModel
      .find()
      .populate('userId', 'username email profile')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, applications: apps };
  }

  async approveBooster(appId: string) {
    const app = await this.boosterAppModel.findById(appId);
    if (!app) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

    app.status = 'approved';
    app.depositStatus = 'paid';
    await app.save();

    await this.userModel.findByIdAndUpdate(app.userId, {
      role: UserRole.BOOSTER,
      'profile.bank_info': {
        bankName: app.bankName,
        accountNumber: app.bankAccountNumber,
        accountHolder: app.bankAccountName,
      },
    });

    return { success: true, message: 'Đã duyệt Booster thành công' };
  }

  async rejectBooster(appId: string, note?: string) {
    const app = await this.boosterAppModel.findById(appId);
    if (!app) throw new NotFoundException('Không tìm thấy đơn ứng tuyển');

    app.status = 'rejected';
    app.note = note || '';
    await app.save();

    return { success: true, message: 'Đã từ chối đơn ứng tuyển' };
  }

  async listDisputes() {
    const disputes = await this.orderModel
      .find({ status: OrderStatus.DISPUTED })
      .populate('customerId', 'username email')
      .populate('boosterId', 'username email')
      .sort({ updatedAt: -1 })
      .lean();

    return { success: true, disputes };
  }

  async resolveDispute(orderId: string, decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME') {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session);
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      const wasBoosterPaid = await this.transactionModel.findOne({
        orderId: order._id,
        type: TransactionType.PAYMENT_RELEASE,
        userId: order.boosterId,
      }).session(session);

      if (decision === 'REFUND_CUSTOMER') {
        const customer = await this.userModel.findById(order.customerId).session(session);
        if (customer) {
          customer.wallet_balance += order.pricing.deposit_amount;
          await customer.save({ session });

          await this.transactionModel.create(
            [
              {
                userId: customer._id,
                orderId: order._id,
                type: TransactionType.REFUND,
                amount: order.pricing.deposit_amount,
                balanceAfter: customer.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền khiếu nại đơn #${order.orderCode || order._id.toString().slice(-6)}`,
              },
            ],
            { session },
          );
        }

        order.status = OrderStatus.REFUNDED;

        // Penalty debt system if booster was paid
        if (wasBoosterPaid && order.boosterId && order.pricing.booster_earnings > 0) {
          const booster = await this.userModel.findById(order.boosterId).session(session);
          if (booster) {
            booster.wallet_balance -= order.pricing.booster_earnings;
            if (booster.wallet_balance < 0) {
              booster.debt_info = booster.debt_info || { is_in_debt: false, reminder_count: 0 };
              booster.debt_info.is_in_debt = true;
              booster.debt_info.reminder_count = 0;
              booster.debt_info.ban_deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            }
            await booster.save({ session });

            await this.transactionModel.create(
              [
                {
                  userId: booster._id,
                  orderId: order._id,
                  type: TransactionType.DISPUTE_PENALTY,
                  amount: -order.pricing.booster_earnings,
                  balanceAfter: booster.wallet_balance,
                  status: TransactionStatus.SUCCESS,
                  description: `Truy thu tiền khiếu nại đơn #${order.orderCode || order._id.toString().slice(-6)}`,
                },
              ],
              { session },
            );
          }
        }
      } else if (decision === 'PAY_BOOSTER') {
        if (!wasBoosterPaid && order.boosterId) {
          const booster = await this.userModel.findById(order.boosterId).session(session);
          if (booster) {
            const amount = order.pricing.booster_earnings || order.pricing.deposit_amount;
            booster.wallet_balance += amount;
            await booster.save({ session });

            await this.transactionModel.create(
              [
                {
                  userId: booster._id,
                  orderId: order._id,
                  type: TransactionType.PAYMENT_RELEASE,
                  amount,
                  balanceAfter: booster.wallet_balance,
                  status: TransactionStatus.SUCCESS,
                  description: `Thanh toán khiếu nại đơn #${order.orderCode || order._id.toString().slice(-6)}`,
                },
              ],
              { session },
            );
          }
        }
        order.status = OrderStatus.COMPLETED;
      } else if (decision === 'RESUME') {
        order.status = OrderStatus.IN_PROGRESS;
      }

      await order.save({ session });
      await session.commitTransaction();

      return { success: true, message: `Phân xử khiếu nại thành công [${decision}]` };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getSettings() {
    const settings = await this.settingModel.find().lean();
    const map: Record<string, any> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    return { success: true, settings: map };
  }

  async updateSetting(key: string, value: any, description?: string) {
    await this.settingModel.findOneAndUpdate(
      { key },
      { $set: { value, description } },
      { upsert: true, new: true },
    );
    return { success: true, key, value };
  }
}
