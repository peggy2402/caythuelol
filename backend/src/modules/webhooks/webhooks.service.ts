import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
  ) {}

  async handleSepayWebhook(authHeader: string | undefined, data: SePayWebhookData) {
    const sepayKey = process.env.SEPAY_API_KEY;
    if (sepayKey && authHeader !== `Apikey ${sepayKey}`) {
      this.logger.error('🔴 [SePay Webhook] Unauthorized');
      throw new UnauthorizedException('Unauthorized SePay API Key');
    }

    if (data.transferType !== 'in') {
      return { success: true, message: 'Ignored outgoing transaction' };
    }

    // Idempotency check
    const existing = await this.transactionModel.findOne({
      description: { $regex: `SePay #${data.id}`, $options: 'i' },
    });
    if (existing) {
      this.logger.log(`🟡 [SePay Webhook] Skipped duplicate SePay ID ${data.id}`);
      return { success: true, message: 'Transaction already processed', id: existing._id };
    }

    const content = data.content || data.transferContent || '';
    const regex = /ZT\s*([a-zA-Z0-9_\-\.]+)(?:\s+([a-zA-Z0-9]+))?/i;
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

    let user = await this.userModel.findOne({
      username: new RegExp(`^${username}$`, 'i'),
    });

    if (!user && /\d+$/.test(username)) {
      const usernameNoDigits = username.replace(/\d+$/, '');
      user = await this.userModel.findOne({
        username: new RegExp(`^${usernameNoDigits}$`, 'i'),
      });
    }

    if (!user) {
      const potentialTxs = await this.transactionModel
        .find({
          amount: data.transferAmount,
          status: TransactionStatus.PENDING,
          type: TransactionType.DEPOSIT,
        })
        .populate('userId');

      for (const tx of potentialTxs) {
        const u = tx.userId as any;
        if (u && u.username) {
          const dbClean = u.username.toUpperCase().replace(/\s/g, '');
          if (content.toUpperCase().includes(`ZT${dbClean}`)) {
            user = u;
            break;
          }
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
      transaction.description = `${transaction.description} - SePay #${data.id}`;
      transaction.balanceAfter = updatedUser.wallet_balance;
      transaction.metadata = data;
      await transaction.save();
    } else {
      transaction = await this.transactionModel.create({
        userId: user._id,
        type: TransactionType.DEPOSIT,
        amount: data.transferAmount,
        status: TransactionStatus.SUCCESS,
        balanceAfter: updatedUser.wallet_balance,
        metadata: data,
        description: `Nạp tiền tự động (SePay #${data.id})`,
      });
    }

    this.logger.log(`✅ [SePay Webhook] Credited ${data.transferAmount} to ${user.username}`);
    return {
      success: true,
      message: 'Transaction processed successfully',
      user: user.username,
      amount: data.transferAmount,
    };
  }
}

