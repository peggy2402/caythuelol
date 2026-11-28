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
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { getClientIp } from '../../common/utils/ip.util';
import { encryptSecret, decryptSecret } from '../../common/utils/crypto.util';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
    @InjectModel('BoosterApplication') private boosterAppModel: Model<IBoosterApplication>,
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
    @InjectModel('Blog') private blogModel: Model<IBlog>,
    @InjectModel('Withdrawal') private withdrawalModel: Model<IWithdrawal>,
    @InjectModel('AuditLog') private auditLogModel: Model<IAuditLog>,
    @InjectConnection() private readonly connection: Connection,
    private loyaltyService: LoyaltyService,
    private notificationsService: NotificationsService,
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

        let isBanned = user.isBanned;
        if (isBanned && user.banned_until && new Date() > new Date(user.banned_until)) {
          isBanned = false;
        }

        return {
          ...user,
          isBanned,
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

    const boosterUserIds = boosters.map((b) => b._id);
    const profiles = await this.boosterProfileModel
      .find({ userId: { $in: boosterUserIds } })
      .lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
    const boostersWithProfile = boosters.map((b) => ({
      ...b,
      boosterProfile: profileMap.get(b._id.toString()) || null,
    }));

    return {
      success: true,
      boosters: boostersWithProfile,
      total,
      totalPages,
      currentPage: page,
    };
  }

  async createBooster(body: {
    userId?: string;
    username?: string;
    email?: string;
    password?: string;
    displayName?: string;
    bio?: string;
    rating?: number;
    completedOrders?: number;
    gameCode?: string;
    ranks?: string[];
    servers?: string[];
  }): Promise<any> {
    let targetUser: any;

    if (body.userId) {
      targetUser = await this.userModel.findById(body.userId);
      if (!targetUser) {
        throw new NotFoundException('Không tìm thấy người dùng được chọn');
      }
      targetUser.role = UserRole.BOOSTER;
      if (body.displayName) {
        if (!targetUser.profile) targetUser.profile = {};
        targetUser.profile.full_name = body.displayName;
      }
      await targetUser.save();
    } else {
      if (!body.username || !body.email || !body.password) {
        throw new BadRequestException('Vui lòng cung cấp username, email và password');
      }
      const existing = await this.userModel.findOne({
        $or: [{ email: body.email.toLowerCase() }, { username: body.username }],
      });
      if (existing) {
        throw new BadRequestException('Email hoặc tên đăng nhập đã được sử dụng');
      }
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(body.password, salt);

      targetUser = await this.userModel.create({
        username: body.username,
        email: body.email.toLowerCase(),
        password_hash,
        role: UserRole.BOOSTER,
        isEmailVerified: true,
        profile: {
          full_name: body.displayName || body.username,
        },
      });
    }

    const defaultGame = {
      gameCode: body.gameCode || 'LOL',
      ranks: body.ranks && body.ranks.length > 0 ? body.ranks : ['CHALLENGER'],
      servers: body.servers && body.servers.length > 0 ? body.servers : ['VN'],
    };

    const profile = await this.boosterProfileModel.findOneAndUpdate(
      { userId: targetUser._id },
      {
        displayName: body.displayName || targetUser.profile?.full_name || targetUser.username,
        bio: body.bio || 'Booster LeoRank chuyên nghiệp',
        rating: body.rating ?? 5.0,
        completedOrders: body.completedOrders ?? 0,
        games: [defaultGame],
      },
      { upsert: true, new: true },
    );

    return {
      success: true,
      message: 'Tạo hoặc thăng cấp Booster thành công',
      user: targetUser,
      profile,
    };
  }

  async editBoosterProfile(
    userId: string,
    body: {
      displayName?: string;
      bio?: string;
      rating?: number;
      completedOrders?: number;
      games?: any[];
      isBanned?: boolean;
    },
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy Booster');

    if (body.isBanned !== undefined) {
      user.isBanned = body.isBanned;
      await user.save();
    }

    const updateData: any = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.completedOrders !== undefined) updateData.completedOrders = body.completedOrders;
    if (body.games !== undefined) updateData.games = body.games;

    const profile = await this.boosterProfileModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      updateData,
      { upsert: true, new: true },
    );

    return {
      success: true,
      message: 'Cập nhật hồ sơ Booster thành công',
      profile,
    };
  }

  // --- QUẢN LÝ NHÂN VIÊN (STAFF & PERMISSIONS) ---

  async listStaffs(search?: string): Promise<any> {
    const filter: any = {
      role: { $in: [UserRole.STAFF, UserRole.ADMIN] },
    };
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [{ username: searchRegex }, { email: searchRegex }];
    }

    const staffs = await this.userModel
      .find(filter)
      .select('-password_hash')
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, staffs };
  }

  async assignStaff(body: {
    userId?: string;
    username?: string;
    email?: string;
    password?: string;
    permissions?: string[];
  }): Promise<any> {
    const defaultPermissions = [
      'users',
      'disputes',
      'deposits',
      'cron',
      'settings',
      'blogs',
      'orders',
      'boosters',
    ];
    const permissions = body.permissions || defaultPermissions;

    if (body.userId) {
      const user = await this.userModel.findById(body.userId);
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');
      user.role = UserRole.STAFF;
      user.staff_permissions = permissions;
      await user.save();
      return { success: true, message: 'Đã phân quyền Nhân viên thành công', user };
    }

    if (!body.username || !body.email || !body.password) {
      throw new BadRequestException('Vui lòng cung cấp username, email và mật khẩu');
    }

    const existing = await this.userModel.findOne({
      $or: [{ email: body.email.toLowerCase() }, { username: body.username }],
    });
    if (existing) {
      throw new BadRequestException('Email hoặc tên đăng nhập đã tồn tại');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(body.password, salt);

    const newUser = await this.userModel.create({
      username: body.username,
      email: body.email.toLowerCase(),
      password_hash,
      role: UserRole.STAFF,
      isEmailVerified: true,
      staff_permissions: permissions,
      profile: { full_name: body.username },
    });

    return { success: true, message: 'Tạo tài khoản Nhân viên thành công', user: newUser };
  }

  async updateStaffPermissions(userId: string, permissions: string[]): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    if (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Tài khoản này không phải nhân viên');
    }

    user.staff_permissions = permissions;
    await user.save();

    return {
      success: true,
      message: 'Cập nhật quyền hạn nhân viên thành công',
      staff_permissions: user.staff_permissions,
    };
  }

  async removeStaff(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy nhân viên');
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Không thể thu hồi quyền của Quản trị viên tối cao');
    }

    user.role = UserRole.CUSTOMER;
    user.staff_permissions = [];
    await user.save();

    return { success: true, message: 'Đã thu hồi quyền nhân viên, tài khoản về vai trò Khách hàng' };
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

  async toggleBanUser(
    userId: string,
    isBanned: boolean,
    options?: { durationHours?: number; bannedUntil?: string; reason?: string },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (!isBanned) {
      user.isBanned = false;
      user.banned_until = null;
      user.ban_reason = null;
      user.banned_at = null;
      await user.save();
      return { success: true, message: 'Đã mở khóa tài khoản thành công', isBanned: false, user };
    }

    let banDeadline: Date | null = null;
    if (options?.bannedUntil) {
      banDeadline = new Date(options.bannedUntil);
    } else if (options?.durationHours && options.durationHours > 0) {
      banDeadline = new Date(Date.now() + options.durationHours * 60 * 60 * 1000);
    }

    user.isBanned = true;
    user.banned_until = banDeadline;
    user.ban_reason = options?.reason?.trim() || 'Vi phạm chính sách cộng đồng LeoRank';
    user.banned_at = new Date();
    await user.save();

    return {
      success: true,
      message: banDeadline
        ? `Đã khóa tài khoản đến ${banDeadline.toLocaleString('vi-VN')}`
        : 'Đã khóa tài khoản vĩnh viễn',
      isBanned: true,
      bannedUntil: banDeadline,
      user,
    };
  }

  async adjustBalance(
    userId: string,
    amount: number,
    type: 'ADD' | 'SUBTRACT' = 'ADD',
    reason?: string,
    adminId?: string,
    req?: any,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const numAmount = Math.abs(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new BadRequestException('Số tiền điều chỉnh không hợp lệ');
    }

    const isSubtract = type === 'SUBTRACT';
    if (isSubtract && user.wallet_balance < numAmount) {
      throw new BadRequestException(
        `Số dư hiện tại (${user.wallet_balance.toLocaleString()}đ) không đủ để trừ ${numAmount.toLocaleString()}đ`,
      );
    }

    const delta = isSubtract ? -numAmount : numAmount;
    user.wallet_balance = Math.max(0, user.wallet_balance + delta);
    await user.save();

    const txType = isSubtract ? TransactionType.DISPUTE_PENALTY : TransactionType.DEPOSIT;
    const desc = reason
      ? `Admin điều chỉnh ${isSubtract ? 'giảm' : 'tăng'} số dư: ${reason}`
      : `Admin điều chỉnh ${isSubtract ? 'giảm' : 'tăng'} số dư: ${isSubtract ? '-' : '+'}${numAmount.toLocaleString('vi-VN')} đ`;

    await this.transactionModel.create({
      userId: user._id,
      type: txType,
      amount: numAmount,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.SUCCESS,
      description: desc,
      metadata: {
        adjustedBy: adminId || 'admin',
        type,
        delta,
        reason,
        ip: req ? getClientIp(req) : '127.0.0.1',
      },
    });

    if (adminId) {
      this.createAuditLog({
        actorId: adminId,
        targetId: user._id,
        action: isSubtract ? 'SUBTRACT_BALANCE' : 'ADD_BALANCE',
        description: `Admin ${isSubtract ? 'trừ' : 'cộng'} ${numAmount.toLocaleString('vi-VN')} đ số dư của user ${user.username || user.email}${reason ? `: ${reason}` : ''}`,
        metadata: { userId, amount: numAmount, type, balanceAfter: user.wallet_balance },
        ipAddress: req ? getClientIp(req) : '127.0.0.1',
      });
    }

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

    // 1. Cập nhật User với đầy đủ thông tin từ đơn ứng tuyển
    await this.userModel.findByIdAndUpdate(app.userId, {
      role: UserRole.BOOSTER,
      'profile.fullName': app.fullName,
      'profile.phoneNumber': app.phoneNumber,
      'profile.facebookUrl': app.facebookUrl,
      'profile.discordTag': app.discordTag,
      'profile.bank_info': {
        bankName: app.bankName,
        accountNumber: app.bankAccountNumber,
        accountHolder: app.bankAccountName,
      },
      'booster_info.currentRank': app.currentRank,
      'booster_info.highestRank': app.highestRank,
      'booster_info.isReady': true,
    });

    // 2. Đồng bộ hoàn chỉnh sang BoosterProfile
    const existingProfile = await this.boosterProfileModel.findOne({ userId: app.userId });
    const gameLOLProfile = {
      gameCode: 'LOL',
      ranks: [app.highestRank, app.currentRank].filter(Boolean),
      servers: ['VN'],
      champions: [],
      roles: [],
      metadata: {
        opggLink: app.opggLink,
        rankImageUrl: app.rankImageUrl,
      },
    };

    if (existingProfile) {
      existingProfile.displayName = existingProfile.displayName || app.fullName;
      const lolIndex = existingProfile.games.findIndex((g) => g.gameCode.toUpperCase() === 'LOL');
      if (lolIndex >= 0) {
        existingProfile.games[lolIndex].ranks = [app.highestRank, app.currentRank].filter(Boolean);
        existingProfile.games[lolIndex].metadata = {
          ...(existingProfile.games[lolIndex].metadata || {}),
          opggLink: app.opggLink,
          rankImageUrl: app.rankImageUrl,
        };
      } else {
        existingProfile.games.push(gameLOLProfile);
      }
      await existingProfile.save();
    } else {
      await this.boosterProfileModel.create({
        userId: app.userId,
        displayName: app.fullName,
        bio: `Booster ${app.fullName} - Rank cao nhất: ${app.highestRank}. Tỉ lệ thắng cao, phục vụ chuyên nghiệp.`,
        games: [gameLOLProfile],
        services: ['rank-boost'],
        rating: 5.0,
        completedOrders: 0,
        performanceScore: 50,
        tier: 'SILVER',
        tierName: 'Silver',
      });
    }

    return { success: true, message: 'Đã duyệt Booster và đồng bộ hồ sơ năng lực thành công' };
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

  async resolveDispute(
    orderId: string,
    decision: 'REFUND_CUSTOMER' | 'PAY_BOOSTER' | 'RESUME' | 'REJECT_DISPUTE_REQUIRE_ACTION',
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session);
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      // Tìm tất cả các khoản PAYMENT_RELEASE đã từng giải ngân cho booster từ đơn này
      const boosterReleaseTxs = await this.transactionModel.find({
        orderId: order._id,
        type: TransactionType.PAYMENT_RELEASE,
        userId: order.boosterId,
      }).session(session);

      const totalPaidToBooster = boosterReleaseTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      const wasBoosterPaid = totalPaidToBooster > 0;

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
        order.dispute = {
          ...(order.dispute || { reason: '' }),
          status: 'RESOLVED',
          fundsDeducted: Boolean(wasBoosterPaid),
        };

        // Tự động thu hồi điểm tích lũy đã cộng từ đơn này khi hoàn tiền khiếu nại cho Customer
        await this.loyaltyService.revokeOrderPoints(
          order.customerId.toString(),
          order._id as Types.ObjectId,
          order.orderCode || order._id.toString().slice(-6),
          session,
        );

        // Penalty debt system if booster was paid (Chỉ thu hồi đúng số tiền thực tế đã giải ngân cho Booster)
        if (wasBoosterPaid && order.boosterId && totalPaidToBooster > 0) {
          const booster = await this.userModel.findById(order.boosterId).session(session);
          if (booster) {
            const amountToRevoke = totalPaidToBooster;
            if (order.dispute?.fundsDeducted) {
              // Tiền đã bị hold vào pending_balance lúc tạo khiếu nại, giờ chỉ cần hủy bỏ khỏi pending_balance
              booster.pending_balance = Math.max(0, (booster.pending_balance || 0) - amountToRevoke);
            } else {
              // Chưa bị hold trước đó: trừ wallet_balance
              booster.wallet_balance -= amountToRevoke;
              if (booster.wallet_balance < 0) {
                booster.debt_info = booster.debt_info || { is_in_debt: false, reminder_count: 0 };
                booster.debt_info.is_in_debt = true;
                booster.debt_info.reminder_count = 0;
                booster.debt_info.ban_deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              }
            }
            await booster.save({ session });

            const isDepositCompensation = amountToRevoke < (order.pricing?.booster_earnings || 0);
            await this.transactionModel.create(
              [
                {
                  userId: booster._id,
                  orderId: order._id,
                  type: TransactionType.DISPUTE_PENALTY,
                  amount: -amountToRevoke,
                  balanceAfter: booster.wallet_balance,
                  status: TransactionStatus.SUCCESS,
                  description: isDepositCompensation
                    ? `Thu hồi tiền bồi thường cọc do khiếu nại thành công đơn #${order.orderCode || order._id.toString().slice(-6)}`
                    : `Thu hồi tiền công do khiếu nại thành công đơn #${order.orderCode || order._id.toString().slice(-6)}`,
                },
              ],
              { session },
            );
          }
        }
      } else if (decision === 'PAY_BOOSTER') {
        if (order.dispute?.fundsDeducted && order.boosterId) {
          // Tiền công hoặc tiền bồi thường cọc đang bị hold ở pending_balance: giải phóng trở lại wallet_balance cho Booster
          const amountToRelease = (order.dispute as any)?.deductedAmount || totalPaidToBooster || order.pricing?.booster_earnings || 0;
          const booster = await this.userModel.findById(order.boosterId).session(session);
          if (booster && amountToRelease > 0) {
            booster.pending_balance = Math.max(0, (booster.pending_balance || 0) - amountToRelease);
            booster.wallet_balance += amountToRelease;
            await booster.save({ session });

            await this.transactionModel.create(
              [
                {
                  userId: booster._id,
                  orderId: order._id,
                  type: TransactionType.PAYMENT_RELEASE,
                  amount: amountToRelease,
                  balanceAfter: booster.wallet_balance,
                  status: TransactionStatus.SUCCESS,
                  description: `Giải tỏa tiền tạm giữ đơn hàng #${order.orderCode || order._id.toString().slice(-6)} sau khi khiếu nại được giải quyết`,
                },
              ],
              { session },
            );
          }
        } else if (!wasBoosterPaid && order.boosterId) {
          const booster = await this.userModel.findById(order.boosterId).session(session);
          if (booster) {
            // Sàn chỉ có thể chi trả tối đa trên số tiền thực tế khách đã đóng
            const totalCustomerPaid = order.pricing?.deposit_amount || 0;
            const platformFee = order.pricing?.platform_fee || Math.round(totalCustomerPaid * 0.02);
            const safeDepositEarnings = Math.max(0, totalCustomerPaid - platformFee);

            // Nếu đơn đã thanh toán toàn bộ: trả đúng booster_earnings
            // Nếu đơn mới cọc và khách bỏ đơn (mất cọc): trả tiền cọc sau khi trừ phí sàn an toàn
            const amount = order.payment?.final_paid
              ? (order.pricing.booster_earnings || safeDepositEarnings)
              : (order.pricing.booster_earnings && order.pricing.booster_earnings <= safeDepositEarnings
                  ? order.pricing.booster_earnings
                  : safeDepositEarnings);

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
                  description: `Giải ngân khiếu nại (Khách mất cọc) đơn #${order.orderCode || order._id.toString().slice(-6)}: +${amount.toLocaleString('vi-VN')} đ (Phí sàn: ${platformFee.toLocaleString('vi-VN')} đ)`,
                },
              ],
              { session },
            );
          }
        }
        order.status = OrderStatus.COMPLETED;
        order.dispute = {
          ...(order.dispute || { reason: '' }),
          status: 'REJECTED',
          fundsDeducted: false,
        };
        const paidTotal = order.pricing?.final_amount || order.pricing?.total_amount || 0;
        if (paidTotal > 0) {
          await this.loyaltyService.awardOrderPoints(
            order.customerId.toString(),
            order._id as Types.ObjectId,
            order.orderCode || order._id.toString().slice(-6),
            paidTotal,
            session,
          );
        }
      } else if (decision === 'RESUME') {
        order.status = OrderStatus.IN_PROGRESS;
        order.dispute = {
          ...(order.dispute || { reason: '' }),
          status: 'RESOLVED',
          adminNote: (order.dispute?.adminNote ? order.dispute.adminNote + ' | ' : '') + 'Admin phân xử: Tiếp tục cày',
        };
      } else if (decision === 'REJECT_DISPUTE_REQUIRE_ACTION') {
        // Bác khiếu nại của khách, yêu cầu khách tiếp tục xử lý sai lệch rank
        if (order.mismatch_info) {
          order.status = OrderStatus.RANK_MISMATCH;
        } else {
          order.status = OrderStatus.IN_PROGRESS;
        }
        order.dispute = {
          ...(order.dispute || { reason: '' }),
          status: 'REJECTED',
          adminNote: (order.dispute?.adminNote ? order.dispute.adminNote + ' | ' : '') + 'Admin đối soát xác nhận Booster đúng. Bác khiếu nại, chuyển về để Khách xử lý tiếp.',
        };
      }

      if (!order.timeline) order.timeline = [];
      order.timeline.push({
        status: order.status,
        timestamp: new Date(),
        note: `Admin phân xử khiếu nại [${decision}]: ${
          decision === 'REFUND_CUSTOMER'
            ? `Hoàn ${order.pricing.deposit_amount.toLocaleString('vi-VN')} đ cọc về ví khách.`
            : decision === 'PAY_BOOSTER'
            ? 'Khách hàng mất cọc. Giải ngân tiền cọc hợp lệ cho Booster.'
            : decision === 'REJECT_DISPUTE_REQUIRE_ACTION'
            ? 'Admin bác bỏ khiếu nại của khách. Giữ nguyên báo cáo lệch rank của Booster, chuyển về cho Khách xử lý tiếp.'
            : 'Admin phê duyệt tiếp tục cày.'
        }`,
      });

      await order.save({ session });
      await session.commitTransaction();

      // Thông báo cho khách hàng nếu Admin bác khiếu nại
      if (decision === 'REJECT_DISPUTE_REQUIRE_ACTION') {
        const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
        this.notificationsService
          .notifyUser({
            userId: order.customerId,
            title: `⚖️ Phán quyết khiếu nại - Đơn #${orderCodeDisplay}`,
            message: `Admin đã đối soát bằng chứng từ Booster và xác nhận báo cáo sai lệch Rank là chính xác. Khiếu nại đã đóng. Vui lòng vào đơn hàng để gửi lại tài khoản hoặc xác nhận bù cọc.`,
            type: 'ORDER_UPDATE',
            variant: 'warning',
            link: `/orders/${order._id}`,
          })
          .catch(() => {});
      }

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
  async createAuditLog(params: {
    actorId: string | Types.ObjectId;
    action: string;
    description: string;
    targetId?: string | Types.ObjectId;
    metadata?: any;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.auditLogModel.create({
        actorId: new Types.ObjectId(params.actorId),
        targetId: params.targetId ? new Types.ObjectId(params.targetId) : undefined,
        action: params.action,
        description: params.description,
        metadata: params.metadata,
        ipAddress: params.ipAddress || '127.0.0.1',
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }

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
        ipAddress: (tx.metadata as any)?.ip || (tx.metadata as any)?.ipAddress || '127.0.0.1',
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
      filter.status = { $in: [OrderStatus.REFUNDED, OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS] };
      filter.$or = [
        { 'dispute.status': { $in: ['RESOLVED', 'REJECTED'] } },
        { 'dispute.reason': { $exists: true } },
      ];
    } else if (status === 'ALL') {
      filter.$or = [
        { status: OrderStatus.DISPUTED },
        { 'dispute.status': { $exists: true } },
        { 'dispute.reason': { $exists: true } },
      ];
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
    if (order.dispute) {
      order.dispute.adminNote = note;
    }
    await order.save();

    return { success: true, message: 'Đã cập nhật ghi chú nội bộ' };
  }

  // 9. Cấu hình Riot API
  async getRiotKey(): Promise<any> {
    const setting = await this.settingModel.findOne({ key: 'RIOT_API_KEY' }).lean();
    const rawVal = setting?.value || '';
    const decrypted = decryptSecret(rawVal);
    return { apiKey: decrypted };
  }

  async saveRiotKey(apiKey: string): Promise<any> {
    const trimmed = (apiKey || '').trim();
    const encrypted = trimmed ? encryptSecret(trimmed) : '';
    await this.settingModel.findOneAndUpdate(
      { key: 'RIOT_API_KEY' },
      { $set: { value: encrypted, description: 'Riot Games API Key (Encrypted)' } },
      { upsert: true, new: true },
    );
    return { success: true, apiKey: trimmed };
  }

  // 9.1 Cấu hình Valorant API (HenrikDev)
  async getValorantKey(): Promise<any> {
    const setting = await this.settingModel.findOne({
      key: { $in: ['VALORANT_API_KEY', 'HENRIKDEV_API_KEY'] },
    }).lean();
    const rawVal = setting?.value || process.env.HENRIKDEV_API_KEY || '';
    return { apiKey: decryptSecret(rawVal) };
  }

  async saveValorantKey(apiKey: string): Promise<any> {
    const trimmed = (apiKey || '').trim();
    const encrypted = trimmed ? encryptSecret(trimmed) : '';
    await this.settingModel.findOneAndUpdate(
      { key: 'VALORANT_API_KEY' },
      { $set: { value: encrypted, description: 'Valorant HenrikDev API Key (Encrypted)' } },
      { upsert: true, new: true },
    );
    return { success: true, apiKey: trimmed };
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

  // 11. Thống kê chỉ số thực tế theo từng Tựa Game từ Database thực tế (Orders, Ratings, Boosters)
  async getGameMetrics(): Promise<Record<string, any>> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Thống kê đơn hàng và đánh giá thực tế từ Order collection
    const orderAgg = await this.orderModel.aggregate([
      {
        $project: {
          gameCode: {
            $toUpper: {
              $ifNull: [
                '$snapshot.gameCode',
                { $ifNull: ['$details.game', { $ifNull: ['$details.gameCode', '$serviceType'] }] },
              ],
            },
          },
          status: 1,
          rating: '$rating.stars',
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: '$gameCode',
          totalOrders: { $sum: 1 },
          recentOrders: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0],
            },
          },
          totalReviews: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$rating', null] }, { $gt: ['$rating', 0] }] }, 1, 0],
            },
          },
          ratingSum: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$rating', null] }, { $gt: ['$rating', 0] }] }, '$rating', 0],
            },
          },
        },
      },
    ]);

    // 2. Thống kê số lượng Booster đang hoạt động từ BoosterProfile
    const boosterAgg = await this.boosterProfileModel.aggregate([
      { $match: { is_active: true } },
      { $unwind: { path: '$games', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: { $toUpper: '$games.gameCode' },
          activeBoosters: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, any> = {};

    for (const item of orderAgg) {
      if (!item._id) continue;
      const code = String(item._id).toUpperCase();
      const avg = item.totalReviews > 0 ? Number((item.ratingSum / item.totalReviews).toFixed(1)) : 0;
      result[code] = {
        totalOrders: item.totalOrders || 0,
        recentOrders: item.recentOrders || 0,
        totalReviews: item.totalReviews || 0,
        averageRating: avg,
        activeBoosters: 0,
      };
    }

    for (const b of boosterAgg) {
      if (!b._id) continue;
      const code = String(b._id).toUpperCase();
      if (!result[code]) {
        result[code] = {
          totalOrders: 0,
          recentOrders: 0,
          totalReviews: 0,
          averageRating: 0,
          activeBoosters: b.activeBoosters || 0,
        };
      } else {
        result[code].activeBoosters = b.activeBoosters || 0;
      }
    }

    return result;
  }
}
