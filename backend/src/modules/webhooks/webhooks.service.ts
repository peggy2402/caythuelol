import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { ChatGateway } from '../chat/chat.gateway';
import { DiscordService } from '../../common/discord.service';

import { IUser } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';
import { IWebhookLog } from '../../database/schemas/WebhookLog';
import { IUnmatchedDeposit } from '../../database/schemas/UnmatchedDeposit';

export interface SePayWebhookData {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  code?: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  transferContent?: string;
  content?: string;
  referenceCode?: string;
  description?: string;
  accumulated?: number;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('WebhookLog') private webhookLogModel: Model<IWebhookLog>,
    @InjectModel('UnmatchedDeposit') private unmatchedDepositModel: Model<IUnmatchedDeposit>,
    private readonly chatGateway: ChatGateway,
    private readonly discordService: DiscordService,
  ) {}

  /**
   * Xác thực Webhook bằng HMAC-SHA256 (Khuyến nghị của SePay) hoặc API Key (Dual-Mode)
   * Ở môi trường Production: bắt buộc cấu hình secret/key (fail-closed)
   */
  public verifyHmac(
    signatureHeader: string | undefined,
    timestampHeader: string | undefined,
    rawBody: Buffer | string | undefined,
  ): { valid: boolean; reason?: string } {
    const secretKey =
      process.env.SEPAY_WEBHOOK_SECRET?.trim() ||
      process.env.SEPAY_API_KEY?.trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!secretKey) {
      if (isProd) {
        this.logger.error('🔴 [HMAC Auth] Missing SEPAY_WEBHOOK_SECRET in production (fail-closed)');
        return { valid: false, reason: 'Missing webhook secret in production' };
      }
      return { valid: true };
    }

    if (!signatureHeader || !timestampHeader || !rawBody) {
      return { valid: false, reason: 'Missing signature, timestamp, or body buffer' };
    }

    const timestamp = Number(timestampHeader);
    const now = Math.floor(Date.now() / 1000);

    // Chống Replay Attack: Chặn request lệch quá 5 phút (300 giây)
    if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
      const diff = Math.abs(now - timestamp);
      this.logger.error(`🔴 [HMAC Auth] Timestamp expired/skewed: diff=${diff}s (allowed max 300s)`);
      return { valid: false, reason: `Timestamp skewed by ${diff}s` };
    }

    const expectedHash = signatureHeader.replace(/^sha256=/i, '').trim();

    // Ghép {timestamp}.{raw_body}
    const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
    const prefixBuf = Buffer.from(`${timestamp}.`, 'utf-8');
    const dataToSign = Buffer.concat([prefixBuf, bodyBuf]);

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign)
      .digest('hex');

    const computedBuf = Buffer.from(computedHash, 'utf-8');
    const expectedBuf = Buffer.from(expectedHash, 'utf-8');

    if (computedBuf.length !== expectedBuf.length) {
      return { valid: false, reason: 'Signature hash length mismatch' };
    }

    const isMatch = crypto.timingSafeEqual(computedBuf, expectedBuf);
    return { valid: isMatch, reason: isMatch ? undefined : 'Signature hash mismatch' };
  }

  public verifyApiKey(authHeader: string | undefined): boolean {
    const sepayKey = process.env.SEPAY_API_KEY?.trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (!sepayKey) {
      if (isProd) {
        this.logger.error('🔴 [Webhook Auth] SEPAY_API_KEY is not configured in production (fail-closed)');
        return false;
      }
      this.logger.warn('⚠️ [Webhook Auth] SEPAY_API_KEY is missing in non-production. Allowing request.');
      return true;
    }

    if (!authHeader) {
      return false;
    }

    const cleanAuth = authHeader.trim();
    const match = cleanAuth.match(/^apikey\s+(.+)$/i);
    if (!match) {
      return false;
    }

    const receivedKey = match[1].trim();
    const expectedKeyBuf = Buffer.from(sepayKey, 'utf-8');
    const receivedKeyBuf = Buffer.from(receivedKey, 'utf-8');

    if (expectedKeyBuf.length !== receivedKeyBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedKeyBuf, receivedKeyBuf);
  }

  public verifyAuth(params: {
    authHeader?: string;
    signatureHeader?: string;
    timestampHeader?: string;
    rawBody?: Buffer | string;
  }): { valid: boolean; method: 'HMAC-SHA256' | 'API_KEY' | 'NONE'; reason?: string } {
    const isProd = process.env.NODE_ENV === 'production';

    // 1. Nếu có chữ ký HMAC-SHA256 (Khuyến nghị chuẩn của SePay)
    if (params.signatureHeader && params.timestampHeader) {
      const hmacResult = this.verifyHmac(params.signatureHeader, params.timestampHeader, params.rawBody);
      return {
        valid: hmacResult.valid,
        method: 'HMAC-SHA256',
        reason: hmacResult.reason,
      };
    }

    // 2. Chế độ tương thích ngược (Dual-mode): API Key qua header Authorization
    if (params.authHeader) {
      const apiKeyResult = this.verifyApiKey(params.authHeader);
      return {
        valid: apiKeyResult,
        method: 'API_KEY',
        reason: apiKeyResult ? undefined : 'Invalid API Key',
      };
    }

    // 3. Thiếu cả hai phương thức xác thực
    if (isProd) {
      this.logger.error('🔴 [Webhook Auth] Request has neither HMAC signature nor Authorization header (fail-closed)');
      return { valid: false, method: 'NONE', reason: 'Missing authentication headers' };
    }

    this.logger.warn('⚠️ [Webhook Auth] No auth headers in non-production. Allowing request.');
    return { valid: true, method: 'NONE' };
  }

  /**
   * Xử lý webhook từ SePay
   */
  async handleSepayWebhook(
    auth: {
      authHeader?: string;
      signatureHeader?: string;
      timestampHeader?: string;
      rawBody?: Buffer | string;
    },
    data: SePayWebhookData,
    context?: { ip?: string; userAgent?: string },
  ) {
    const startTime = Date.now();

    // 1. Xác thực bảo mật chặt chẽ (HMAC-SHA256 hoặc API Key)
    const authCheck = this.verifyAuth(auth);
    if (!authCheck.valid) {
      await this.safeRecordWebhookLog({
        gateway: 'SePay',
        gatewayTransactionId: data?.id ? String(data.id) : undefined,
        ip: context?.ip,
        headers: { userAgent: context?.userAgent, authMethod: authCheck.method },
        rawPayload: data || {},
        status: 'FAILED',
        reason: `Unauthorized: ${authCheck.reason || 'Authentication failed'}`,
        processingTimeMs: Date.now() - startTime,
      });
      throw new UnauthorizedException(`Unauthorized: ${authCheck.reason || 'Invalid webhook authentication'}`);
    }

    this.logger.log(`🔐 [Webhook Auth] Verified successfully using method: ${authCheck.method}`);
    return this.processDepositTransaction(data, context, startTime);
  }

  /**
   * Hàm cốt lõi xử lý giao dịch nạp tiền (dùng chung cho Webhook và Job đối soát)
   */
  async processDepositTransaction(
    data: SePayWebhookData,
    context?: { ip?: string; userAgent?: string },
    startTime: number = Date.now(),
  ) {
    try {
      // 2. Chỉ xử lý tiền vào (transferType === 'in')
      if (data.transferType !== 'in') {
        await this.safeRecordWebhookLog({
          gateway: 'SePay',
          gatewayTransactionId: data?.id ? String(data.id) : undefined,
          ip: context?.ip,
          headers: { userAgent: context?.userAgent },
          rawPayload: data,
          status: 'IGNORED',
          reason: 'Ignored outgoing transaction (transferType !== in)',
          processingTimeMs: Date.now() - startTime,
        });
        return { success: true, message: 'Ignored outgoing transaction' };
      }

      if (!data.id || !data.transferAmount || data.transferAmount <= 0) {
        await this.safeRecordWebhookLog({
          gateway: 'SePay',
          gatewayTransactionId: data?.id ? String(data.id) : undefined,
          ip: context?.ip,
          headers: { userAgent: context?.userAgent },
          rawPayload: data,
          status: 'FAILED',
          reason: 'Invalid transaction payload: missing id or transferAmount',
          processingTimeMs: Date.now() - startTime,
        });
        return { success: true, message: 'Invalid payload, skipped' };
      }

      // 3. Idempotency Check bằng gatewayTransactionId (Unique sparse index)
      const existing = await this.transactionModel.findOne({
        $or: [
          { gatewayTransactionId: String(data.id) },
          { 'metadata.id': data.id },
          { description: { $regex: `#${data.id}`, $options: 'i' } },
        ],
      });

      if (existing) {
        this.logger.log(`🟡 [Webhook] Skipped duplicate transaction ID ${data.id}`);
        await this.safeRecordWebhookLog({
          gateway: 'SePay',
          gatewayTransactionId: String(data.id),
          ip: context?.ip,
          headers: { userAgent: context?.userAgent },
          rawPayload: data,
          status: 'IGNORED',
          reason: `Duplicate transaction ID ${data.id}`,
          transactionId: existing._id as Types.ObjectId,
          matchedUserId: existing.userId as Types.ObjectId,
          processingTimeMs: Date.now() - startTime,
        });
        return { success: true, message: 'Transaction already processed', id: existing._id };
      }

      const rawContent = data.content || data.transferContent || data.description || '';

      // 4. Tìm kiếm User qua nhiều chiến lược đối soát chính xác
      const matchResult = await this.resolveUserAndPendingTx(data, rawContent);

      // Nếu không tìm thấy hoặc kết quả mơ hồ (>1 user) -> Lưu vào hàng đợi duyệt tay UnmatchedDeposit
      if (!matchResult.user) {
        this.logger.error(`🔴 [Webhook] Unmatched deposit for SePay ID ${data.id}: "${rawContent}". Reason: ${matchResult.reason}`);
        
        await this.unmatchedDepositModel.findOneAndUpdate(
          { gatewayTransactionId: String(data.id) },
          {
            gateway: 'SePay',
            gatewayTransactionId: String(data.id),
            transferAmount: data.transferAmount,
            content: rawContent,
            description: data.description || '',
            accountNumber: data.accountNumber,
            referenceCode: data.referenceCode,
            transactionDate: data.transactionDate,
            rawPayload: data,
            status: 'PENDING_REVIEW',
            failReason: matchResult.reason,
          },
          { upsert: true, new: true }
        );

        await this.safeRecordWebhookLog({
          gateway: 'SePay',
          gatewayTransactionId: String(data.id),
          ip: context?.ip,
          headers: { userAgent: context?.userAgent },
          rawPayload: data,
          status: 'UNMATCHED',
          reason: matchResult.reason,
          processingTimeMs: Date.now() - startTime,
        });

        // Trả 200 kèm cờ unmatched để SePay không retry dồn dập, tiền được an toàn đưa vào hàng đợi Admin
        return {
          success: true,
          unmatched: true,
          message: 'Queued for manual admin review',
          reason: matchResult.reason,
        };
      }

      const matchedUser = matchResult.user;
      let pendingTx = matchResult.pendingTx;

      // 5. Cộng tiền nguyên tử vào ví người dùng (Atomically increment wallet balance)
      const updatedUser = await this.userModel.findByIdAndUpdate(
        matchedUser._id,
        { $inc: { wallet_balance: data.transferAmount } },
        { new: true }
      );

      if (!updatedUser) {
        throw new InternalServerErrorException('Failed to update user wallet balance');
      }

      // 6. Cập nhật hoặc tạo mới bản ghi Transaction
      let finalTransaction: ITransaction;

      if (pendingTx) {
        // Cập nhật giao dịch PENDING đã tìm thấy
        pendingTx.status = TransactionStatus.SUCCESS;
        pendingTx.gatewayTransactionId = String(data.id);
        pendingTx.balanceAfter = updatedUser.wallet_balance;

        // Nếu số tiền chuyển khác với số tiền tạo lệnh ban đầu, ghi nhận đúng số tiền thực nhận
        if (pendingTx.amount !== data.transferAmount) {
          pendingTx.description = `Nạp tiền vào tài khoản (${data.transferAmount.toLocaleString('vi-VN')} đ, dự kiến ${pendingTx.amount.toLocaleString('vi-VN')} đ) - Mã GD #${data.id}`;
          pendingTx.amount = data.transferAmount;
        } else {
          pendingTx.description = `${pendingTx.description} - Mã GD #${data.id}`;
        }

        pendingTx.metadata = {
          ...data,
          gateway: 'BANK_TRANSFER',
          originalExpectedAmount: pendingTx.amount !== data.transferAmount ? pendingTx.amount : undefined,
        };
        await pendingTx.save();
        finalTransaction = pendingTx;
      } else {
        // Tạo giao dịch mới nếu user chuyển tiền trực tiếp (không qua nút xác nhận lệnh nạp)
        finalTransaction = await this.transactionModel.create({
          userId: matchedUser._id,
          type: TransactionType.DEPOSIT,
          amount: data.transferAmount,
          status: TransactionStatus.SUCCESS,
          balanceAfter: updatedUser.wallet_balance,
          gatewayTransactionId: String(data.id),
          depositCode: matchResult.matchedCode || undefined,
          metadata: { ...data, gateway: 'BANK_TRANSFER' },
          description: `Nạp tiền tự động (Mã GD #${data.id})`,
        });
      }

      const processingDuration = Date.now() - startTime;
      this.logger.log(`✅ [Webhook] Credited ${data.transferAmount} VND to ${matchedUser.username} in ${processingDuration}ms (Tx: ${finalTransaction._id})`);

      // 7. Ghi WebhookLog thành công
      await this.safeRecordWebhookLog({
        gateway: 'SePay',
        gatewayTransactionId: String(data.id),
        ip: context?.ip,
        headers: { userAgent: context?.userAgent },
        rawPayload: data,
        status: 'SUCCESS',
        matchedUserId: matchedUser._id as Types.ObjectId,
        transactionId: finalTransaction._id as Types.ObjectId,
        processingTimeMs: processingDuration,
      });

      // 8. Bắn thông báo realtime qua Socket.io
      try {
        this.chatGateway.broadcastBalanceUpdate(
          matchedUser._id.toString(),
          updatedUser.wallet_balance,
          `Nạp thành công ${data.transferAmount.toLocaleString('vi-VN')} đ`,
        );
      } catch (socketErr: any) {
        this.logger.warn(`Failed to broadcast balance update: ${socketErr.message}`);
      }

      // 9. Bắn thông báo về kênh Discord Admin
      this.discordService.notifyDepositSuccess({
        username: matchedUser.username,
        amount: data.transferAmount,
        transactionCode: String(data.id || finalTransaction._id),
        newBalance: updatedUser.wallet_balance,
      }).catch((err) => this.logger.warn(`Failed to send Discord deposit alert: ${err.message}`));

      return {
        success: true,
        message: 'Deposit processed successfully',
        user: matchedUser.username,
        amount: data.transferAmount,
        transactionId: finalTransaction._id,
      };
    } catch (err: any) {
      this.logger.error(`💥 [Webhook Exception] Error processing deposit for SePay ID ${data?.id}: ${err.message}`, err.stack);
      
      await this.safeRecordWebhookLog({
        gateway: 'SePay',
        gatewayTransactionId: data?.id ? String(data.id) : undefined,
        ip: context?.ip,
        headers: { userAgent: context?.userAgent },
        rawPayload: data,
        status: 'FAILED',
        reason: err.message,
        processingTimeMs: Date.now() - startTime,
      });

      // Trả 500 để SePay tự động retry theo cơ chế webhook retry của họ
      throw new InternalServerErrorException(err.message || 'Error processing payment webhook');
    }
  }

  /**
   * Giải mã và tìm kiếm người dùng phù hợp theo thứ tự ưu tiên chặt chẽ
   */
  public async resolveUserAndPendingTx(
    data: SePayWebhookData,
    content: string,
  ): Promise<{ user?: IUser; pendingTx?: ITransaction; matchedCode?: string; reason?: string }> {
    // ƯU TIÊN 1: Kiểm tra trường "code" mà SePay trả về (khi dùng tính năng cấu hình Prefix mã thanh toán)
    if (data.code && data.code.trim()) {
      const cleanCode = data.code.trim().toUpperCase();
      
      // 1.1 Khớp theo depositCode trong Transaction
      const txByCode = await this.transactionModel
        .findOne({ depositCode: cleanCode, status: TransactionStatus.PENDING })
        .sort({ createdAt: -1 });

      if (txByCode) {
        const user = await this.userModel.findById(txByCode.userId);
        if (user) {
          return { user, pendingTx: txByCode, matchedCode: cleanCode };
        }
      }

      // 1.2 Khớp code dạng ZT<username> hoặc LR<username>
      const prefixMatch = cleanCode.match(/^(?:ZT|LR)(.+)$/i);
      if (prefixMatch) {
        const usernameCand = prefixMatch[1].trim();
        const user = await this.findUserByUsernameCandidate(usernameCand);
        if (user) {
          const pendingTx = await this.findPendingTxForUser(user._id, data.transferAmount);
          return { user, pendingTx, matchedCode: cleanCode };
        }
      }
    }

    // ƯU TIÊN 2: Tìm mã depositCode riêng dạng ZT[A-Z0-9]{6,8} trong nội dung chuyển khoản
    const depositCodeMatch = content.match(/\b(ZT[A-Z0-9]{6,8})\b/i);
    if (depositCodeMatch) {
      const code = depositCodeMatch[1].toUpperCase();
      const txByDepositCode = await this.transactionModel
        .findOne({ depositCode: code, status: TransactionStatus.PENDING })
        .sort({ createdAt: -1 });

      if (txByDepositCode) {
        const user = await this.userModel.findById(txByDepositCode.userId);
        if (user) {
          return { user, pendingTx: txByDepositCode, matchedCode: code };
        }
      }
    }

    // ƯU TIÊN 3: Trích xuất username bằng regex token ZT/LR an toàn
    // Không đưa dấu '.' vào nhóm bắt để tránh nuốt định dạng ngân hàng (ví dụ: .CT tu...)
    const tokenRegex = /(?:^|[^a-zA-Z0-9])(?:ZT|LR)\s*([a-zA-Z0-9_\-]+)(?=[^a-zA-Z0-9_\-]|$)/gi;
    const candidates: string[] = [];
    let m: RegExpExecArray | null;

    while ((m = tokenRegex.exec(content)) !== null) {
      const candidate = m[1].trim();
      if (candidate && !candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    }

    if (candidates.length === 0) {
      return { reason: `No ZT/LR syntax found in transfer content: "${content}"` };
    }

    // Tìm kiếm các ứng viên khớp trong DB
    const matchedUsers: IUser[] = [];

    for (const cand of candidates) {
      const user = await this.findUserByUsernameCandidate(cand);
      if (user && !matchedUsers.some((u) => u._id.toString() === user._id.toString())) {
        matchedUsers.push(user);
      }
    }

    if (matchedUsers.length === 0) {
      return { reason: `User not found for candidates: [${candidates.join(', ')}] in content: "${content}"` };
    }

    // TUYỆT ĐỐI KHÔNG CỘNG KHI MƠ HỒ (nhiều ứng viên khác nhau cùng khớp)
    if (matchedUsers.length > 1) {
      const names = matchedUsers.map((u) => u.username).join(', ');
      return { reason: `Ambiguous match: multiple distinct users matched (${names})` };
    }

    const singleUser = matchedUsers[0];
    const pendingTx = await this.findPendingTxForUser(singleUser._id, data.transferAmount);

    return { user: singleUser, pendingTx };
  }

  /**
   * Tìm người dùng theo tên ứng viên: thử chính xác -> cắt số đuôi ngân hàng -> chuẩn hóa ký tự đặc biệt
   */
  private async findUserByUsernameCandidate(candidate: string): Promise<IUser | null> {
    if (!candidate || candidate.length < 2) return null;

    // 1. Thử khớp chính xác theo username (có index unique)
    let user = await this.userModel.findOne({
      username: new RegExp(`^${this.escapeRegex(candidate)}$`, 'i'),
    });
    if (user) return user;

    // 2. Nếu ngân hàng ghép mã giao dịch số vào đuôi (ví dụ: vewad59246102844931)
    if (/\d+$/.test(candidate) && candidate.length >= 8) {
      // Thử bóc tách các tiền tố giả định ngân hàng chèn mã GD từ 6 đến 12 chữ số
      const prefixCandidates: string[] = [];
      for (let numDigits = 6; numDigits <= 12; numDigits++) {
        if (candidate.length - numDigits >= 3) {
          prefixCandidates.push(candidate.slice(0, -numDigits));
        }
      }
      // Thêm cả trường hợp cắt toàn bộ số đuôi
      const withoutAllDigits = candidate.replace(/\d+$/, '');
      if (withoutAllDigits && withoutAllDigits.length >= 3 && !prefixCandidates.includes(withoutAllDigits)) {
        prefixCandidates.push(withoutAllDigits);
      }

      for (const prefix of prefixCandidates) {
        user = await this.userModel.findOne({
          username: new RegExp(`^${this.escapeRegex(prefix)}$`, 'i'),
        });
        if (user) return user;
      }
    }

    // 3. Xử lý trường hợp app ngân hàng loại bỏ dấu gạch dưới (ví dụ: booster_chovy -> BOOSTERCHOVY)
    const cleanCand = candidate.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanCand && cleanCand.length >= 3) {
      const flexiblePattern = cleanCand
        .split('')
        .map((c) => this.escapeRegex(c))
        .join('[_\\-\\.\\s]*');

      user = await this.userModel.findOne({
        username: new RegExp(`^${flexiblePattern}$`, 'i'),
      });
      if (user) return user;

      // Thử tiếp trường hợp vừa bỏ ký tự đặc biệt vừa bị gắn số đuôi
      if (/\d+$/.test(cleanCand)) {
        const cleanNoDigits = cleanCand.replace(/\d+$/, '');
        if (cleanNoDigits.length >= 3) {
          const flexPatternNoDigits = cleanNoDigits
            .split('')
            .map((c) => this.escapeRegex(c))
            .join('[_\\-\\.\\s]*');

          user = await this.userModel.findOne({
            username: new RegExp(`^${flexPatternNoDigits}$`, 'i'),
          });
          if (user) return user;
        }
      }
    }

    return null;
  }

  /**
   * Tìm pending transaction ưu tiên khớp số tiền trước, nếu không khớp số tiền thì lấy pending gần nhất
   */
  private async findPendingTxForUser(
    userId: Types.ObjectId,
    amount: number,
  ): Promise<ITransaction | undefined> {
    // 1. Ưu tiên tìm đúng số tiền
    const exactTx = await this.transactionModel
      .findOne({
        userId,
        status: TransactionStatus.PENDING,
        amount,
        type: TransactionType.DEPOSIT,
      })
      .sort({ createdAt: -1 });

    if (exactTx) return exactTx;

    // 2. Nếu không khớp đúng số tiền, tìm giao dịch pending gần nhất (trong vòng 24h)
    const recentTx = await this.transactionModel
      .findOne({
        userId,
        status: TransactionStatus.PENDING,
        type: TransactionType.DEPOSIT,
      })
      .sort({ createdAt: -1 });

    return recentTx || undefined;
  }

  /**
   * Ghi log RAW an toàn không throw lỗi làm gián đoạn luồng chính
   */
  private async safeRecordWebhookLog(params: {
    gateway: string;
    gatewayTransactionId?: string;
    ip?: string;
    headers?: Record<string, any>;
    rawPayload: Record<string, any>;
    status: 'SUCCESS' | 'FAILED' | 'IGNORED' | 'UNMATCHED';
    reason?: string;
    matchedUserId?: Types.ObjectId;
    transactionId?: Types.ObjectId;
    processingTimeMs: number;
  }) {
    try {
      await this.webhookLogModel.create({
        gateway: params.gateway,
        gatewayTransactionId: params.gatewayTransactionId,
        endpoint: '/api/webhooks/sepay',
        ip: params.ip,
        headers: params.headers || {},
        rawPayload: params.rawPayload,
        status: params.status,
        reason: params.reason,
        matchedUserId: params.matchedUserId,
        transactionId: params.transactionId,
        processingTimeMs: params.processingTimeMs,
      });
    } catch (e: any) {
      this.logger.warn(`Failed to write WebhookLog: ${e.message}`);
    }
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
