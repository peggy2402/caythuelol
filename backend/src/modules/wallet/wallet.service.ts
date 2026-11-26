import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import { IUser } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';
import { IWithdrawal } from '../../database/schemas/Withdrawal';
import { ISystemSetting } from '../../database/schemas/SystemSetting';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Withdrawal') private withdrawalModel: Model<IWithdrawal>,
    @InjectModel('SystemSetting') private settingModel: Model<ISystemSetting>,
  ) {}

  async getWallet(userId: string, page = 1, limit = 10, type?: string, status?: string, search?: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const skip = (page - 1) * limit;
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (type && type !== 'ALL') {
      filter.type = type;
    }
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    const [transactions, total, adminBankSetting] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.transactionModel.countDocuments(filter),
      this.settingModel.findOne({ key: 'ADMIN_BANK_INFO' }).lean(),
    ]);

    const rawBank = adminBankSetting?.value || null;
    const normalizedBankInfo = rawBank
      ? {
          bankId: rawBank.bankId || rawBank.bankName || 'MB',
          bankName: rawBank.bankName || rawBank.bankId || 'MB Bank',
          accountNo: rawBank.accountNo || rawBank.accountNumber || '',
          accountNumber: rawBank.accountNumber || rawBank.accountNo || '',
          accountName: rawBank.accountName || rawBank.accountHolder || '',
          accountHolder: rawBank.accountHolder || rawBank.accountName || '',
        }
      : null;

    return {
      success: true,
      balance: user.wallet_balance || 0,
      availableBalance: Math.max(0, user.wallet_balance || 0),
      pendingBalance: user.pending_balance || 0,
      userBankInfo: user.profile?.bank_info || null,
      bankInfo: normalizedBankInfo,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserTransactions(userId: string, role?: string, orderId?: string) {
    const filter: any = {};
    const isAdminOrStaff = role === 'ADMIN' || role === 'STAFF';

    if (!isAdminOrStaff) {
      filter.userId = new Types.ObjectId(userId);
    }

    if (orderId) {
      if (!Types.ObjectId.isValid(orderId)) {
        return { success: true, transactions: [] };
      }
      filter.orderId = new Types.ObjectId(orderId);
    }

    const transactions = await this.transactionModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return { success: true, transactions };
  }

  async confirmDeposit(userId: string, amount: number) {
    if (!amount || amount < 10000) {
      throw new BadRequestException('Số tiền nạp tối thiểu là 10.000 VNĐ');
    }

    const pendingCount = await this.transactionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
    });

    if (pendingCount >= 3) {
      throw new BadRequestException('Bạn đang có 3 đơn nạp tiền đang chờ. Vui lòng thanh toán hoặc hủy đơn cũ.');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Kiểm tra xem đã có giao dịch nạp PENDING nào cùng số tiền chưa để tái sử dụng, tránh spam bản ghi trùng lặp
    const existingPending = await this.transactionModel.findOne({
      userId: user._id,
      type: TransactionType.DEPOSIT,
      status: TransactionStatus.PENDING,
      amount,
    }).sort({ createdAt: -1 });

    const cleanUser = user.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const depositCode = `ZT${randomSuffix}`;

    if (existingPending) {
      if (!existingPending.depositCode) {
        existingPending.depositCode = depositCode;
        await existingPending.save();
      }
      return {
        success: true,
        transaction: existingPending,
        isExisting: true,
        transferContent: `ZT${cleanUser}`,
        depositCode: existingPending.depositCode,
      };
    }

    const transaction = new this.transactionModel({
      userId: user._id,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      balanceAfter: user.wallet_balance,
      description: `Nạp tiền vào tài khoản (${amount.toLocaleString('vi-VN')} đ)`,
      depositCode,
      metadata: { gateway: 'BANK_TRANSFER' },
    });

    await transaction.save();

    return {
      success: true,
      transaction,
      depositCode,
      transferContent: `ZT${cleanUser}`,
    };
  }

  async cancelDeposit(userId: string, transactionId: string) {
    const transaction = await this.transactionModel.findOne({
      _id: new Types.ObjectId(transactionId),
      userId: new Types.ObjectId(userId),
      status: TransactionStatus.PENDING,
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch chờ duyệt');
    }

    transaction.status = TransactionStatus.FAILED;
    transaction.description = `${transaction.description} (Đã hủy bởi người dùng)`;
    await transaction.save();

    return { success: true, message: 'Đã hủy đơn nạp tiền thành công' };
  }

  async requestWithdrawal(userId: string, amount: number, clientBankInfo?: any) {
    if (!amount || amount < 50000) {
      throw new BadRequestException('Số tiền rút tối thiểu là 50.000 VNĐ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const bankInfo = clientBankInfo || user.profile?.bank_info;
    if (!bankInfo || !bankInfo.accountNumber || !bankInfo.bankName) {
      throw new BadRequestException('Vui lòng cập nhật thông tin tài khoản ngân hàng trước khi thực hiện rút tiền');
    }

    if (user.wallet_balance < amount) {
      throw new BadRequestException('Số dư ví không đủ để thực hiện yêu cầu rút tiền');
    }

    // Lấy phí rút tiền từ SystemSetting (mặc định 5.000đ)
    const feeSetting = await this.settingModel.findOne({ key: 'withdraw_fee' }).lean();
    const fee = Number(feeSetting?.value || 5000);
    const netAmount = Math.max(0, amount - fee);

    // Trừ số dư khả dụng
    user.wallet_balance -= amount;
    await user.save();

    // 1. Tạo đơn rút tiền trong bảng Withdrawal để Admin quản lý và duyệt trên dashboard
    const withdrawal = await this.withdrawalModel.create({
      userId: user._id,
      amount,
      fee,
      netAmount,
      bankInfo: {
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountHolder: bankInfo.accountHolder || user.username,
      },
      status: 'PENDING',
      note: 'Yêu cầu rút tiền qua hệ thống',
    });

    // 2. Tạo transaction để hiển thị trong lịch sử ví của người dùng
    await this.transactionModel.create({
      userId: user._id,
      type: TransactionType.WITHDRAWAL,
      amount: -amount,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.PENDING,
      description: `Yêu cầu rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber}`,
      metadata: {
        withdrawalId: withdrawal._id,
        fee,
        netAmount,
        bankInfo,
      },
    });

    return {
      success: true,
      message: 'Gửi yêu cầu rút tiền thành công. Admin sẽ duyệt trong 24h.',
      balance: user.wallet_balance,
      withdrawalId: withdrawal._id,
    };
  }
}

