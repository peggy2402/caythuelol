import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { IUser } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
  ) {}

  async getWallet(userId: string, page = 1, limit = 10) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const skip = (page - 1) * limit;
    const filter = { userId: new Types.ObjectId(userId) };

    const [transactions, total] = await Promise.all([
      this.transactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.transactionModel.countDocuments(filter),
    ]);

    return {
      success: true,
      balance: user.wallet_balance || 0,
      pendingBalance: user.pending_balance || 0,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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

    const transaction = new this.transactionModel({
      userId: user._id,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      balanceAfter: user.wallet_balance,
      description: `Nạp tiền vào tài khoản (${amount.toLocaleString('vi-VN')} đ)`,
      metadata: { gateway: 'SePay' },
    });

    await transaction.save();

    return {
      success: true,
      transaction,
      transferContent: `ZT ${user.username} ${transaction._id.toString().slice(-6).toUpperCase()}`,
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

  async requestWithdrawal(userId: string, amount: number, bankInfo: any) {
    if (!amount || amount < 50000) {
      throw new BadRequestException('Số tiền rút tối thiểu là 50.000 VNĐ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    if (user.wallet_balance < amount) {
      throw new BadRequestException('Số dư ví không đủ để thực hiện yêu cầu rút tiền');
    }

    // Deduct balance and create withdrawal transaction
    user.wallet_balance -= amount;
    await user.save();

    const transaction = new this.transactionModel({
      userId: user._id,
      type: TransactionType.WITHDRAWAL,
      amount: -amount,
      balanceAfter: user.wallet_balance,
      status: TransactionStatus.PENDING,
      description: `Yêu cầu rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber}`,
      metadata: { bankInfo },
    });

    await transaction.save();

    return {
      success: true,
      message: 'Gửi yêu cầu rút tiền thành công. Admin sẽ duyệt trong 24h.',
      balance: user.wallet_balance,
    };
  }
}
