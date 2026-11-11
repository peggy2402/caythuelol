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
import { IBlog } from '../../database/schemas/Blog';
import { IWithdrawal } from '../../database/schemas/Withdrawal';
import { IAuditLog } from '../../database/schemas/AuditLog';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('BoosterApplication') private boosterAppModel: Model<IBoosterApplication>,
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    @InjectModel('Blog') private blogModel: Model<IBlog>,
    @InjectModel('Withdrawal') private withdrawalModel: Model<IWithdrawal>,
    @InjectModel('AuditLog') private auditLogModel: Model<IAuditLog>,
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

  async listUsers(page = 1, limit = 20, search?: string): Promise<any> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password_hash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const [totalOrders, completedOrders, totalSpentAgg] = await Promise.all([
          this.orderModel.countDocuments({ customerId: user._id }),
          this.orderModel.countDocuments({
            customerId: user._id,
            status: OrderStatus.COMPLETED,
          }),
          this.orderModel.aggregate([
            {
              $match: {
                customerId: user._id,
                status: { $in: [OrderStatus.COMPLETED, 'SETTLED'] },
              },
            },
            { $group: { _id: null, total: { $sum: '$pricing.total_amount' } } },
          ]),
        ]);

        return {
          ...user,
          stats: {
            totalOrders: totalOrders || 0,
            completedOrders: completedOrders || 0,
            totalSpent: totalSpentAgg[0]?.total || 0,
          },
        };
      }),
    );

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      success: true,
      users: usersWithStats,
      pagination: { page, totalPages, totalUsers },
      total: totalUsers,
      totalPages,
      currentPage: page,
    };
  }

  async getBoosters(query: {
    tab?: string;
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
  }): Promise<any> {
    if (query.tab === 'applications') {
      const apps = await this.boosterAppModel
        .find()
        .populate('userId', 'username email profile')
        .sort({ createdAt: -1 })
        .lean();
      return { success: true, applications: apps };
    }

    const page = parseInt(String(query.page || '1'));
    const limit = parseInt(String(query.limit || '10'));
    const search = query.search || '';
    const sort = query.sort || 'newest';

    const filter: any = { role: UserRole.BOOSTER };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { 'booster_info.ingame_name': searchRegex },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'rating') sortOption = { 'booster_info.rating': -1 };
    if (sort === 'orders') sortOption = { 'booster_info.completed_orders': -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const skip = (page - 1) * limit;

    const [boosters, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password_hash')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { success: true, boosters, total, totalPages, currentPage: page };
  }

  async demoteBooster(userId: string, reason?: string): Promise<any> {
    await this.userModel.findByIdAndUpdate(userId, { role: UserRole.CUSTOMER });
    await this.boosterAppModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), status: 'approved' },
      {
        status: 'rejected',
        depositStatus: 'refunded',
        note: reason ? `Admin hủy tư cách: ${reason}` : 'Admin hủy tư cách Booster',
      },
    );
    return { success: true, message: 'Đã hủy tư cách Booster thành công' };
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
    return settings;
  }

  async updateSetting(key: string, value: any, description?: string): Promise<any> {
    await this.settingModel.findOneAndUpdate(
      { key },
      { $set: { value, description } },
      { upsert: true, new: true },
    );
    return { success: true, key, value };
  }

  // 1. Quản lý Đơn hàng
  async getOrders(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<any> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 15);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.search) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [
        { orderCode: searchRegex },
        { service_type: searchRegex },
        { 'game_account.ingame_name': searchRegex },
      ];
    }

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customerId', 'username email profile')
        .populate('boosterId', 'username email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }

  // 2. Quản lý Bài viết (Blogs CMS)
  async getBlogs(): Promise<any> {
    const blogs = await this.blogModel
      .find()
      .populate('author', 'username email')
      .sort({ createdAt: -1 })
      .lean();
    return { success: true, blogs };
  }

  async createBlog(dto: any, authorId: string): Promise<any> {
    const slug =
      dto.slug ||
      dto.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') +
        '-' +
        Date.now().toString().slice(-4);

    const blog = await this.blogModel.create({
      ...dto,
      slug,
      author: new Types.ObjectId(authorId),
    });
    return { success: true, blog };
  }

  async updateBlog(id: string, dto: any): Promise<any> {
    const blog = await this.blogModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!blog) throw new NotFoundException('Không tìm thấy bài viết');
    return { success: true, blog };
  }

  async deleteBlog(id: string): Promise<any> {
    const res = await this.blogModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Không tìm thấy bài viết');
    return { success: true, message: 'Đã xóa bài viết thành công' };
  }

  // 3. Quản lý Rút tiền (Withdrawals)
  async getWithdrawals(query: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const [withdrawals, total] = await Promise.all([
      this.withdrawalModel
        .find(filter)
        .populate('userId', 'username email role wallet_balance profile createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.withdrawalModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      withdrawals,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }

  async handleWithdrawalAction(dto: {
    withdrawalId: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
  }): Promise<any> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const withdrawal = await this.withdrawalModel.findById(dto.withdrawalId).session(session);
      if (!withdrawal) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');

      if (dto.action === 'APPROVE') {
        withdrawal.status = 'COMPLETED';
        withdrawal.note = dto.reason || 'Admin đã duyệt chuyển khoản thành công';
        await withdrawal.save({ session });

        await this.transactionModel.findOneAndUpdate(
          {
            userId: withdrawal.userId,
            type: TransactionType.WITHDRAWAL,
            amount: -withdrawal.amount,
            status: TransactionStatus.PENDING,
          },
          { status: TransactionStatus.SUCCESS },
          { session },
        );
      } else {
        // REJECT -> Hoàn lại tiền cho ví người dùng
        withdrawal.status = 'REJECTED';
        withdrawal.note = dto.reason || 'Admin từ chối yêu cầu rút tiền';
        await withdrawal.save({ session });

        const user = await this.userModel.findById(withdrawal.userId).session(session);
        if (user) {
          user.wallet_balance += withdrawal.amount;
          await user.save({ session });

          await this.transactionModel.create(
            [
              {
                userId: user._id,
                type: TransactionType.REFUND,
                amount: withdrawal.amount,
                balanceAfter: user.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền yêu cầu rút tiền bị từ chối: ${dto.reason || 'Không hợp lệ'}`,
              },
            ],
            { session },
          );
        }
      }

      await session.commitTransaction();
      return { success: true, message: 'Xử lý yêu cầu rút tiền thành công' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // 4. Quản lý Tiền cọc (Escrow Deposits)
  async getDeposits(): Promise<any> {
    const orders = await this.orderModel
      .find({
        $or: [
          { 'payment.is_locked': true },
          { status: { $in: [OrderStatus.PAID, OrderStatus.APPROVED, OrderStatus.IN_PROGRESS] } },
        ],
      })
      .populate('customerId', 'username email profile')
      .populate('boosterId', 'username email profile')
      .sort({ createdAt: -1 })
      .lean();

    const totalHeld = orders.reduce(
      (sum, o) => sum + (o.pricing?.deposit_amount || o.pricing?.total_amount || 0),
      0,
    );

    return {
      success: true,
      orders,
      totalHeld,
    };
  }

  // 5. Quản lý Giao dịch (Transactions)
  async getTransactions(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<any> {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'ALL') filter.status = query.status;
    if (query.type && query.type !== 'ALL') filter.type = query.type;

    if (query.search) {
      const searchRegex = { $regex: query.search.trim(), $options: 'i' };
      filter.$or = [
        { description: searchRegex },
        { gateway_ref: searchRegex },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('userId', 'username email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.transactionModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      transactions,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }

  async getTransactionById(id: string): Promise<any> {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('userId', 'username email wallet_balance profile')
      .populate('orderId')
      .lean();

    if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch');
    return { success: true, transaction };
  }

  async rejectTransaction(transactionId: string, reason?: string): Promise<any> {
    const tx = await this.transactionModel.findById(transactionId);
    if (!tx) throw new NotFoundException('Không tìm thấy giao dịch');

    tx.status = TransactionStatus.FAILED;
    tx.description = tx.description + ` [Từ chối: ${reason || 'Không hợp lệ'}]`;
    await tx.save();

    return { success: true, message: 'Đã từ chối giao dịch' };
  }

  // 6. Nhật ký hệ thống (Audit Logs)
  async getAuditLogs(page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .populate('actorId', 'username email')
        .populate('targetId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.auditLogModel.countDocuments(),
    ]);

    // Fallback: nếu audit log trống, tự động sinh từ các transactions mới nhất
    if (logs.length === 0) {
      const txLogs = await this.transactionModel
        .find()
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const fallbackLogs = txLogs.map((tx) => ({
        _id: tx._id,
        action: tx.type,
        description: tx.description || `Giao dịch ${tx.type}: ${tx.amount.toLocaleString()} đ`,
        actorId: tx.userId,
        createdAt: (tx as any).createdAt || new Date(),
      }));

      return {
        logs: fallbackLogs,
        pagination: {
          total: fallbackLogs.length,
          page: 1,
          totalPages: 1,
          limit,
        },
      };
    }

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      logs,
      pagination: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }

  // 7. Chi tiết & Thống kê Người dùng
  async getUserById(id: string): Promise<any> {
    const user = await this.userModel.findById(id).select('-password_hash').lean();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return { success: true, user };
  }

  async getUserStats(id: string): Promise<any> {
    const userObjId = new Types.ObjectId(id);

    const [orderStats, txStats, recentTransactions] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { customerId: userObjId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            completedOrders: {
              $sum: {
                $cond: [{ $in: ['$status', [OrderStatus.COMPLETED, 'SETTLED']] }, 1, 0],
              },
            },
            totalSpent: {
              $sum: {
                $cond: [
                  { $in: ['$status', [OrderStatus.COMPLETED, 'SETTLED']] },
                  '$pricing.total_amount',
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: { userId: userObjId, status: TransactionStatus.SUCCESS } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      this.transactionModel
        .find({ userId: userObjId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalDeposits = txStats.find((t) => t._id === TransactionType.DEPOSIT)?.total || 0;
    const totalWithdrawals = Math.abs(
      txStats.find((t) => t._id === TransactionType.WITHDRAWAL)?.total || 0,
    );

    return {
      success: true,
      stats: {
        totalOrders: orderStats[0]?.totalOrders || 0,
        completedOrders: orderStats[0]?.completedOrders || 0,
        totalSpent: orderStats[0]?.totalSpent || 0,
        totalDeposits,
        totalWithdrawals,
      },
      recentTransactions,
    };
  }

  // 8. Quản lý Khiếu nại
  async getDisputes(status?: string): Promise<any> {
    const filter: any = {};
    if (!status || status === 'PENDING') {
      filter.status = OrderStatus.DISPUTED;
    } else if (status === 'RESOLVED') {
      filter.status = { $in: [OrderStatus.REFUNDED, OrderStatus.COMPLETED] };
      filter['dispute_info'] = { $exists: true };
    }

    const disputes = await this.orderModel
      .find(filter)
      .populate('customerId', 'username email profile')
      .populate('boosterId', 'username email profile')
      .sort({ updatedAt: -1 })
      .lean();

    return { success: true, disputes };
  }

  async updateDisputeNote(orderId: string, note: string): Promise<any> {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    order.admin_note = note;
    await order.save();

    return { success: true, message: 'Đã cập nhật ghi chú nội bộ' };
  }

  // 9. Cấu hình Riot API
  async getRiotKey(): Promise<any> {
    const setting = await this.settingModel.findOne({ key: 'RIOT_API_KEY' }).lean();
    return { apiKey: setting?.value || '' };
  }

  async saveRiotKey(apiKey: string): Promise<any> {
    await this.settingModel.findOneAndUpdate(
      { key: 'RIOT_API_KEY' },
      { $set: { value: apiKey, description: 'Riot Games API Key' } },
      { upsert: true, new: true },
    );
    return { success: true, apiKey };
  }

  // 10. Phí rút tiền & Phí sàn
  async getWithdrawFee(): Promise<any> {
    const setting = await this.settingModel.findOne({ key: 'withdraw_fee' }).lean();
    return { fee: Number(setting?.value || 0) };
  }

  async updateWithdrawFee(fee: number): Promise<any> {
    await this.settingModel.findOneAndUpdate(
      { key: 'withdraw_fee' },
      { $set: { value: Number(fee), description: 'Phí rút tiền cố định (VND)' } },
      { upsert: true, new: true },
    );
    return { success: true, fee: Number(fee) };
  }

  async getPlatformFee(): Promise<any> {
    const setting = await this.settingModel.findOne({ key: 'PLATFORM_FEE' }).lean();
    return { fee: Number(setting?.value || 10) };
  }
}
