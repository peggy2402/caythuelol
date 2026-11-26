import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatGateway } from '../chat/chat.gateway';

import { IUser } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';

interface SePayWebhookData {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  transferContent?: string;
  content?: string;
  referenceCode: string;
  description: string;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async handleSepayWebhook(authHeader: string | undefined, data: SePayWebhookData) {
    const sepayKey = process.env.SEPAY_API_KEY?.trim();
    if (sepayKey) {
      const cleanAuth = authHeader?.trim() || '';
      const isValidAuth =
        cleanAuth === `Apikey ${sepayKey}` ||
        cleanAuth.toLowerCase() === `apikey ${sepayKey.toLowerCase()}` ||
        cleanAuth === `Bearer ${sepayKey}` ||
        cleanAuth === sepayKey ||
        cleanAuth.includes(sepayKey);

      if (!isValidAuth) {
        this.logger.error(`🔴 [SePay Webhook] Unauthorized. Received header: "${authHeader}"`);
        throw new UnauthorizedException('Unauthorized SePay API Key');
      }
    }

    if (data.transferType !== 'in') {
      return { success: true, message: 'Ignored outgoing transaction' };
    }

    // Idempotency check: kiểm tra theo metadata.id hoặc description chứa ID giao dịch (hỗ trợ cả SePay cũ và Mã GD mới)
    const existing = await this.transactionModel.findOne({
      $or: [
        { 'metadata.id': data.id },
        { description: { $regex: `#${data.id}`, $options: 'i' } },
      ],
    });
    if (existing) {
      this.logger.log(`🟡 [Webhook] Skipped duplicate transaction ID ${data.id}`);
      return { success: true, message: 'Transaction already processed', id: existing._id };
    }

    const content = data.content || data.transferContent || '';
    const regex = /(?:ZT|LR)\s*([a-zA-Z0-9_\-\.]+)(?:\s+([a-zA-Z0-9]+))?/i;
    const match = content.match(regex);

    if (!match) {
      this.logger.warn(`🔴 [SePay Webhook] Syntax regex mismatch for content: "${content}"`);
      return { success: true, message: 'Syntax error, queued for manual review' };
    }

    const username = match[1].trim();
    let txCode = match[2];

    if (txCode && (txCode.toUpperCase().includes('TRACE') || !/^[0-9A-Fa-f]+$/.test(txCode))) {
      txCode = undefined;
    }

    // 1. Thử tìm chính xác theo username
    let user = await this.userModel.findOne({
      username: new RegExp(`^${username}$`, 'i'),
    });

    // 2. Nếu không ra và có số ở đuôi do ngân hàng ghép mã giao dịch
    if (!user && /\d+$/.test(username)) {
      const usernameNoDigits = username.replace(/\d+$/, '');
      user = await this.userModel.findOne({
        username: new RegExp(`^${usernameNoDigits}$`, 'i'),
      });
    }

    // 3. Xử lý trường hợp app ngân hàng strip ký tự đặc biệt (ví dụ: booster_chovy -> BOOSTERCHOVY)
    // hoặc người dùng gõ có/không có dấu gạch dưới, gạch ngang, chấm
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
    if (!user && cleanUsername && cleanUsername.length >= 2) {
      // Tạo regex linh hoạt cho phép các ký tự [_\-\.\s]* xuất hiện tùy ý giữa các chữ cái
      // Ví dụ: BOOSTERCHOVY -> ^B[_\-\.\s]*O[_\-\.\s]*O...$ sẽ khớp với booster_chovy trong DB
      const flexiblePattern = cleanUsername
        .split('')
        .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[_\\-\\.\\s]*');

      user = await this.userModel.findOne({
        username: new RegExp(`^${flexiblePattern}$`, 'i'),
      });

      // Nếu username bị ngân hàng đính kèm thêm số ở cuối
      if (!user && /\d+$/.test(cleanUsername)) {
        const cleanNoDigits = cleanUsername.replace(/\d+$/, '');
        if (cleanNoDigits.length >= 3) {
          const flexPatternNoDigits = cleanNoDigits
            .split('')
            .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[_\\-\\.\\s]*');
          user = await this.userModel.findOne({
            username: new RegExp(`^${flexPatternNoDigits}$`, 'i'),
          });
        }
      }
    }

    // 4. Fallback tìm user qua pending deposit transactions của đúng số tiền đó
    if (!user) {
      const potentialTxs = await this.transactionModel
        .find({
          amount: data.transferAmount,
          status: TransactionStatus.PENDING,
          type: TransactionType.DEPOSIT,
        })
        .populate('userId');

      const normalizedContent = content.toUpperCase().replace(/[^A-Z0-9]/g, '');

      for (const tx of potentialTxs) {
        const u = tx.userId as any;
        if (u && u.username) {
          const uClean = u.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const isDirectMatch =
            uClean &&
            (normalizedContent.includes(`ZT${uClean}`) || normalizedContent.includes(`LR${uClean}`));
          // Trường hợp nội dung chuyển khoản bị app ngân hàng cắt ngắn do quá dài
          const isTruncatedMatch =
            cleanUsername &&
            cleanUsername.length >= 6 &&
            (uClean.startsWith(cleanUsername) || cleanUsername.startsWith(uClean));

          if (isDirectMatch || isTruncatedMatch) {
            user = u;
            break;
          }
        }
      }
    }

    // 5. Fallback cuối: quét nhanh các user active nếu SePay gửi trước hoặc không có pending tx
    if (!user) {
      const normalizedContent = content.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const candidates = await this.userModel.find({}, 'username _id wallet_balance').lean();
      for (const c of candidates) {
        if (!c.username) continue;
        const cClean = c.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (cClean && cClean.length >= 3 && (normalizedContent.includes(`ZT${cClean}`) || normalizedContent.includes(`LR${cClean}`))) {
          user = c as any;
          break;
        }
      }
    }

    if (!user) {
      this.logger.error(`🔴 [SePay Webhook] User not found for username "${username}"`);
      return { success: true, message: 'User not found in system' };
    }

    // Match pending transaction
    let transaction = await this.transactionModel
      .findOne({
        userId: user._id,
        status: TransactionStatus.PENDING,
        amount: data.transferAmount,
        type: TransactionType.DEPOSIT,
      })
      .sort({ createdAt: -1 });

    if (transaction && txCode) {
      const txId = transaction._id.toString().toUpperCase();
      if (txCode.length >= 4 && !txId.endsWith(txCode.toUpperCase())) {
        transaction = null;
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      user._id,
      { $inc: { wallet_balance: data.transferAmount } },
      { new: true },
    );

    if (!updatedUser) throw new Error('Failed to update balance');

    if (transaction) {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.description = `${transaction.description} - Mã GD #${data.id}`;
      transaction.balanceAfter = updatedUser.wallet_balance;
      transaction.metadata = { ...data, gateway: 'BANK_TRANSFER' };
      await transaction.save();
    } else {
      transaction = await this.transactionModel.create({
        userId: user._id,
        type: TransactionType.DEPOSIT,
        amount: data.transferAmount,
        status: TransactionStatus.SUCCESS,
        balanceAfter: updatedUser.wallet_balance,
        metadata: { ...data, gateway: 'BANK_TRANSFER' },
        description: `Nạp tiền tự động (Mã GD #${data.id})`,
      });
    }

    this.logger.log(`✅ [Webhook] Credited ${data.transferAmount} to ${user.username}`);

    try {
      this.chatGateway.broadcastBalanceUpdate(
        user._id.toString(),
        updatedUser.wallet_balance,
        `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')} đ`,
      );
    } catch (socketErr: any) {
      this.logger.warn(`Failed to broadcast socket update: ${socketErr.message}`);
    }

    return {
      success: true,
      message: 'Transaction processed successfully',
      user: user.username,
      amount: data.transferAmount,
    };
  }
}

