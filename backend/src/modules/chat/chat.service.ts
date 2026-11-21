import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

import { IMessage } from '../../database/schemas/Message';
import { IOrder, OrderStatus } from '../../database/schemas/Order';
import { IUser, UserRole } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionStatus,
  TransactionType,
} from '../../database/schemas/Transaction';
import { INotification } from '../../database/schemas/Notification';
import { ChatGateway } from './chat.gateway';

export type OrderChatParticipantRole = 'CUSTOMER' | 'BOOSTER' | 'ADMIN';
export type BoosterChatStatusCode = 'PLAYING' | 'BREAK' | 'ALMOST_DONE' | 'NEED_LOGIN';

export interface ChatCapabilities {
  canSendImage: boolean;
  canViewOrderInfo: boolean;
  canSendTip: boolean;
  canSendBoosterStatus: boolean;
  canSendProgressReport: boolean;
}

const CLOSED_ORDER_STATUSES = new Set<string>([
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
  OrderStatus.REJECTED,
]);

const BOOSTER_STATUS_CATALOG: Record<
  BoosterChatStatusCode,
  { label: string; description: string }
> = {
  PLAYING: {
    label: 'Đang vào game / Đang cày',
    description:
      'Tuyển thủ đang thi đấu trên tài khoản. Vui lòng không đăng nhập để tránh văng trận.',
  },
  BREAK: {
    label: 'Tạm nghỉ ngắn',
    description:
      'Tuyển thủ đang nghỉ ngơi một chút và sẽ quay lại tiếp tục đơn hàng sớm.',
  },
  ALMOST_DONE: {
    label: 'Sắp hoàn thành mục tiêu',
    description:
      'Đơn hàng đã rất gần mốc yêu cầu, chuẩn bị hoàn tất và bàn giao tài khoản.',
  },
  NEED_LOGIN: {
    label: 'Cần hỗ trợ đăng nhập / OTP',
    description:
      'Tuyển thủ cần bạn cung cấp mã xác thực hoặc hỗ trợ đăng nhập tài khoản.',
  },
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PAID: 'Đã thanh toán - Chờ nhận',
  APPROVED: 'Booster đã nhận đơn',
  IN_PROGRESS: 'Đang cày',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Đã từ chối',
  REFUNDED: 'Đã hoàn tiền',
  DISPUTED: 'Đang tranh chấp',
  CANCELLED: 'Đã hủy',
};

const MIN_TIP_AMOUNT = 10_000;
const MAX_TIP_AMOUNT = 50_000_000;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Message') private messageModel: Model<IMessage>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('Notification') private notificationModel: Model<INotification>,
    @InjectConnection() private connection: Connection,
    private chatGateway: ChatGateway,
  ) {
    cloudinary.config({
      cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private extractId(ref: any): string | null {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    if (ref._id) return ref._id.toString();
    return ref.toString();
  }

  private async resolveOrder(orderIdOrCode: string) {
    let order: any = null;
    if (Types.ObjectId.isValid(orderIdOrCode)) {
      order = await this.orderModel
        .findById(orderIdOrCode)
        .populate('customerId', 'username profile.avatar role')
        .populate('boosterId', 'username profile.avatar role')
        .lean();
    }
    if (!order) {
      order = await this.orderModel
        .findOne({ orderCode: orderIdOrCode })
        .populate('customerId', 'username profile.avatar role')
        .populate('boosterId', 'username profile.avatar role')
        .lean();
    }
    return order;
  }

  /**
   * Xác thực quyền tham gia phòng chat và phân tách rõ vai trò trên đơn hàng:
   * - CUSTOMER: chủ đơn (order.customerId)
   * - BOOSTER: tuyển thủ nhận đơn (order.boosterId)
   * - ADMIN: quản trị viên / nhân viên hỗ trợ
   */
  private async resolveOrderAndParticipant(
    orderIdOrCode: string,
    userId: string,
    userRole?: string,
  ): Promise<{
    order: any;
    participantRole: OrderChatParticipantRole;
    isCustomer: boolean;
    isBooster: boolean;
    isAdmin: boolean;
    capabilities: ChatCapabilities;
  }> {
    const order = await this.resolveOrder(orderIdOrCode);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng tương ứng');
    }

    const customerId = this.extractId(order.customerId);
    const boosterId = this.extractId(order.boosterId);
    const uid = userId?.toString();

    const isCustomer = Boolean(customerId && uid && customerId === uid);
    const isBooster = Boolean(boosterId && uid && boosterId === uid);
    const isAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.STAFF;

    if (!isCustomer && !isBooster && !isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập phòng chat của đơn hàng này',
      );
    }

    const participantRole: OrderChatParticipantRole = isCustomer
      ? 'CUSTOMER'
      : isBooster
        ? 'BOOSTER'
        : 'ADMIN';

    const isOrderActive = !CLOSED_ORDER_STATUSES.has(order.status);

    const capabilities: ChatCapabilities = {
      canSendImage: Boolean(boosterId),
      canViewOrderInfo: Boolean(boosterId),
      // Chỉ Customer chủ đơn mới có quyền gửi tiền Tip cho Booster
      canSendTip: isCustomer && Boolean(boosterId) && isOrderActive,
      // Chỉ Booster nhận đơn mới có quyền cập nhật trạng thái cày & báo cáo tiến độ
      canSendBoosterStatus: isBooster && isOrderActive,
      canSendProgressReport: isBooster && isOrderActive,
    };

    return {
      order,
      participantRole,
      isCustomer,
      isBooster,
      isAdmin,
      capabilities,
    };
  }

  private broadcastToOrderRooms(
    order: any,
    event: 'message' | 'deleted' | 'reacted' | 'read',
    payload: any,
  ) {
    const orderIdStr = order._id.toString();
    const orderCode = order.orderCode;

    const emit = (roomKey: string) => {
      if (event === 'message') {
        this.chatGateway.broadcastMessageToOrder(roomKey, payload);
      } else if (event === 'deleted') {
        this.chatGateway.broadcastMessageDeleted(roomKey, payload);
      } else if (event === 'reacted') {
        this.chatGateway.broadcastMessageReacted(roomKey, payload);
      } else if (event === 'read') {
        this.chatGateway.broadcastMessageRead(roomKey, payload);
      }
    };

    emit(orderIdStr);
    if (orderCode && orderCode !== orderIdStr) {
      emit(orderCode);
    }
  }

  private async saveAndBroadcastMessage(
    order: any,
    senderId: string,
    payload: {
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT';
      metadata?: any;
      replyToId?: string;
      isSystemMessage?: boolean;
    },
  ) {
    const targetObjectId = order._id as Types.ObjectId;
    const senderObjectId = new Types.ObjectId(senderId);

    let validReplyTo: Types.ObjectId | undefined;
    if (payload.replyToId && Types.ObjectId.isValid(payload.replyToId)) {
      const replyExists = await this.messageModel
        .exists({
          _id: new Types.ObjectId(payload.replyToId),
          order_id: targetObjectId,
        });
      if (replyExists) {
        validReplyTo = new Types.ObjectId(payload.replyToId);
      }
    }

    const message = new this.messageModel({
      order_id: targetObjectId,
      sender_id: senderObjectId,
      content: payload.content,
      type: payload.type || 'TEXT',
      metadata: payload.metadata,
      replyTo: validReplyTo,
      is_system_message: Boolean(payload.isSystemMessage),
      readBy: [senderObjectId],
    });

    await message.save();
    const populated = await message.populate([
      { path: 'sender_id', select: 'username profile.avatar role' },
      { path: 'replyTo' },
    ]);

    this.broadcastToOrderRooms(order, 'message', populated);
    return populated;
  }

  // ===========================================================================
  // 1. COMMON FEATURES (Customer & Booster & Admin)
  // ===========================================================================

  async getMessages(orderId: string, userId: string, userRole?: string) {
    const { order, participantRole, capabilities } =
      await this.resolveOrderAndParticipant(orderId, userId, userRole);

    const messages = await this.messageModel
      .find({ order_id: order._id })
      .populate('sender_id', 'username profile.avatar role')
      .populate('replyTo')
      .sort({ created_at: 1 })
      .lean();

    return {
      success: true,
      messages,
      participantRole,
      capabilities,
    };
  }

  async sendMessage(
    orderId: string,
    senderId: string,
    userRole: string | undefined,
    content: string,
    type: 'TEXT' | 'IMAGE' | 'COMMAND_RESULT' = 'TEXT',
    replyToId?: string,
    metadata?: any,
  ) {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống');
    }

    // Xử lý slash commands nếu user gõ trực tiếp trong ô chat
    if (type === 'TEXT' && trimmed.startsWith('/')) {
      const parts = trimmed.split(/\s+/);
      const command = parts[0].toLowerCase();

      if (command === '/tip') {
        const rawAmount = parts[1]?.replace(/[.,_]/g, '');
        const parsedAmount = Number(rawAmount);
        const note = parts.slice(2).join(' ').trim() || undefined;
        return this.sendTip(orderId, senderId, userRole, parsedAmount, note);
      }

      if (command === '/order') {
        return this.sendOrderInfoCard(orderId, senderId, userRole);
      }

      if (command === '/live' || command === '/status') {
        const candidateCode = (parts[1] || '').toUpperCase();
        const isKnownCode = candidateCode in BOOSTER_STATUS_CATALOG;
        const statusCode: BoosterChatStatusCode = isKnownCode
          ? (candidateCode as BoosterChatStatusCode)
          : 'PLAYING';
        const note = (isKnownCode ? parts.slice(2) : parts.slice(1))
          .join(' ')
          .trim() || undefined;
        return this.sendBoosterStatus(
          orderId,
          senderId,
          userRole,
          statusCode,
          note,
        );
      }

      if (command === '/progress' || command === '/match') {
        const note = parts.slice(1).join(' ').trim() || undefined;
        return this.sendProgressReport(orderId, senderId, userRole, note);
      }
    }

    const { order } = await this.resolveOrderAndParticipant(
      orderId,
      senderId,
      userRole,
    );

    if (!order.boosterId) {
      throw new BadRequestException(
        'Kênh chat sẽ tự động mở khi có Tuyển thủ nhận đơn của bạn.',
      );
    }

    // Chỉ cho phép client gửi trực tiếp loại TEXT hoặc IMAGE; COMMAND_RESULT do server tự sinh
    const safeType: 'TEXT' | 'IMAGE' = type === 'IMAGE' ? 'IMAGE' : 'TEXT';

    const populated = await this.saveAndBroadcastMessage(order, senderId, {
      content: trimmed,
      type: safeType,
      metadata: safeType === 'IMAGE' ? metadata : undefined,
      replyToId,
    });

    return { success: true, message: populated };
  }

  async sendOrderInfoCard(orderId: string, userId: string, userRole?: string) {
    const { order } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!order.boosterId) {
      throw new BadRequestException(
        'Kênh chat sẽ tự động mở khi có Tuyển thủ nhận đơn của bạn.',
      );
    }

    const matches = Array.isArray(order.match_history) ? order.match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    const code = order.orderCode || order._id.toString().slice(-6).toUpperCase();
    const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;

    const currentRank =
      order.details?.current_rank ||
      order.snapshot?.initialState?.rankLabel ||
      '—';
    const desiredRank =
      order.details?.desired_rank ||
      order.snapshot?.targetState?.rankLabel ||
      '—';
    const game = (
      order.details?.game ||
      order.snapshot?.gameCode ||
      'LOL'
    ).toUpperCase();
    const server = order.details?.server || 'VN';

    const summaryLines = [
      `Đơn hàng #${code} (${game} - ${server})`,
      `Dịch vụ: ${order.serviceType}`,
      `Trạng thái: ${statusLabel}`,
      `Mục tiêu: ${currentRank} → ${desiredRank}`,
      `Trận đã đấu: ${wins}W / ${losses}L (${matches.length} trận)`,
    ];

    const populated = await this.saveAndBroadcastMessage(order, userId, {
      content: summaryLines.join('\n'),
      type: 'COMMAND_RESULT',
      metadata: {
        command: 'ORDER_INFO',
        orderCode: code,
        serviceType: order.serviceType,
        status: order.status,
        statusLabel,
        game,
        server,
        currentRank,
        desiredRank,
        wins,
        losses,
        totalMatches: matches.length,
        boosterUsername: order.boosterId?.username || 'Booster',
        customerUsername: order.customerId?.username || 'Khách hàng',
      },
    });

    return { success: true, message: populated };
  }

  async markAsRead(orderId: string, userId: string, userRole?: string) {
    const { order } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    const targetObjectId = order._id as Types.ObjectId;
    const userObjectId = new Types.ObjectId(userId);

    await this.messageModel.updateMany(
      {
        order_id: targetObjectId,
        sender_id: { $ne: userObjectId },
        readBy: { $ne: userObjectId },
      },
      {
        $addToSet: { readBy: userObjectId },
      },
    );

    const payload = {
      orderId: order.orderCode || targetObjectId.toString(),
      userId,
    };
    this.broadcastToOrderRooms(order, 'read', payload);

    return { success: true };
  }

  async reactMessage(
    orderId: string,
    messageId: string,
    userId: string,
    userRole: string | undefined,
    emoji: string,
  ) {
    const { order } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!emoji || typeof emoji !== 'string' || emoji.trim().length > 16) {
      throw new BadRequestException('Biểu cảm không hợp lệ');
    }

    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(messageId),
      order_id: order._id,
    });
    if (!message) throw new NotFoundException('Tin nhắn không tồn tại');

    const cleanEmoji = emoji.trim();
    const uId = new Types.ObjectId(userId);
    const existingIndex = message.reactions?.findIndex(
      (r) => r.userId.toString() === userId && r.emoji === cleanEmoji,
    );

    if (existingIndex !== undefined && existingIndex > -1) {
      message.reactions?.splice(existingIndex, 1);
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ emoji: cleanEmoji, userId: uId });
    }

    await message.save();

    this.broadcastToOrderRooms(order, 'reacted', {
      messageId: message._id.toString(),
      reactions: message.reactions || [],
    });

    return { success: true, reactions: message.reactions };
  }

  private extractChatCloudinaryPublicId(url: string): string | null {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
    const publicId = match?.[1];
    if (publicId && publicId.startsWith('caythuelol/chat/')) {
      return publicId;
    }
    return null;
  }

  async deleteMessage(
    orderId: string,
    messageId: string,
    userId: string,
    userRole?: string,
  ) {
    const { order, isAdmin } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(messageId),
      order_id: order._id,
    });

    if (!message) {
      throw new NotFoundException('Tin nhắn không tồn tại');
    }

    if (message.sender_id.toString() !== userId.toString() && !isAdmin) {
      throw new ForbiddenException(
        'Bạn chỉ có thể thu hồi tin nhắn của chính mình',
      );
    }

    // Không cho phép thu hồi biên lai giao dịch tiền Tip nhằm đảm bảo minh bạch đối soát
    if (message.metadata?.command === 'TIP') {
      throw new BadRequestException(
        'Không thể thu hồi biên lai giao dịch tiền Tip',
      );
    }

    // Tự động dọn ảnh thuộc thư mục caythuelol/chat trên Cloudinary (best-effort)
    if (message.type === 'IMAGE' && message.content) {
      const publicId = this.extractChatCloudinaryPublicId(message.content);
      if (publicId) {
        cloudinary.uploader.destroy(publicId).catch(() => {});
      }
    }

    await this.messageModel.deleteOne({ _id: message._id });

    const payload = {
      messageId: message._id.toString(),
      orderId: order.orderCode || order._id.toString(),
    };
    this.broadcastToOrderRooms(order, 'deleted', payload);

    return { success: true, messageId: message._id.toString() };
  }

  // ===========================================================================
  // 2. CUSTOMER-ONLY FEATURES (Chỉ khách hàng chủ đơn)
  // ===========================================================================

  async sendTip(
    orderId: string,
    userId: string,
    userRole: string | undefined,
    rawAmount: number,
    note?: string,
  ) {
    const { order, isCustomer } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!isCustomer) {
      throw new ForbiddenException(
        'Chỉ khách hàng đặt đơn mới có thể gửi tiền Tip cho Tuyển thủ',
      );
    }

    const boosterId = this.extractId(order.boosterId);
    if (!boosterId) {
      throw new BadRequestException(
        'Đơn hàng chưa có Tuyển thủ nhận nên chưa thể gửi Tip',
      );
    }

    if (CLOSED_ORDER_STATUSES.has(order.status)) {
      throw new BadRequestException(
        'Không thể gửi tiền Tip cho đơn hàng đã hủy hoặc đã hoàn tiền',
      );
    }

    const amount = Math.floor(Number(rawAmount));
    if (!Number.isFinite(amount) || amount < MIN_TIP_AMOUNT) {
      throw new BadRequestException(
        `Số tiền Tip tối thiểu là ${MIN_TIP_AMOUNT.toLocaleString('vi-VN')}đ`,
      );
    }
    if (amount > MAX_TIP_AMOUNT) {
      throw new BadRequestException(
        `Số tiền Tip tối đa mỗi lần là ${MAX_TIP_AMOUNT.toLocaleString('vi-VN')}đ`,
      );
    }

    const cleanNote = (note || '').trim().slice(0, 200);
    const orderCode =
      order.orderCode || order._id.toString().slice(-6).toUpperCase();
    const customerUsername = order.customerId?.username || 'Khách hàng';
    const boosterUsername = order.boosterId?.username || 'Booster';

    const session = await this.connection.startSession();
    session.startTransaction();

    let updatedCustomerBalance = 0;
    let updatedBoosterBalance = 0;
    let savedMessageId: Types.ObjectId;

    try {
      // 1. Trừ tiền atomic trên ví Customer (chống double-spend / âm ví)
      const updatedCustomer = await this.userModel.findOneAndUpdate(
        {
          _id: new Types.ObjectId(userId),
          wallet_balance: { $gte: amount },
        },
        { $inc: { wallet_balance: -amount } },
        { new: true, session },
      );

      if (!updatedCustomer) {
        throw new BadRequestException(
          'Số dư ví không đủ để gửi tiền Tip. Vui lòng nạp thêm tiền vào ví.',
        );
      }

      // 2. Cộng 100% tiền Tip vào ví Booster
      const updatedBooster = await this.userModel.findOneAndUpdate(
        { _id: new Types.ObjectId(boosterId) },
        { $inc: { wallet_balance: amount } },
        { new: true, session },
      );

      if (!updatedBooster) {
        throw new NotFoundException('Không tìm thấy tài khoản Tuyển thủ nhận Tip');
      }

      updatedCustomerBalance = updatedCustomer.wallet_balance;
      updatedBoosterBalance = updatedBooster.wallet_balance;

      const customerDesc = `Gửi tiền Tip cho Booster ${boosterUsername} - Đơn #${orderCode}${
        cleanNote ? ` (${cleanNote})` : ''
      }`;
      const boosterDesc = `Nhận tiền Tip từ khách hàng ${customerUsername} - Đơn #${orderCode}${
        cleanNote ? ` (${cleanNote})` : ''
      }`;

      // 3. Lưu lịch sử giao dịch cho cả Customer và Booster
      await this.transactionModel.create(
        [
          {
            userId: new Types.ObjectId(userId),
            orderId: order._id,
            type: TransactionType.TIP_SENT,
            amount: -amount,
            balanceAfter: updatedCustomerBalance,
            description: customerDesc,
            metadata: {
              orderCode,
              boosterId,
              boosterUsername,
              note: cleanNote,
              description: customerDesc,
            },
            status: TransactionStatus.SUCCESS,
          },
          {
            userId: new Types.ObjectId(boosterId),
            orderId: order._id,
            type: TransactionType.TIP_RECEIVED,
            amount,
            balanceAfter: updatedBoosterBalance,
            description: boosterDesc,
            metadata: {
              orderCode,
              customerId: userId,
              customerUsername,
              note: cleanNote,
              description: boosterDesc,
            },
            status: TransactionStatus.SUCCESS,
          },
        ],
        { session, ordered: true },
      );

      // 4. Lưu tin nhắn biên lai Tip vào phòng chat
      const tipMessageText = cleanNote
        ? `Đã gửi tiền Tip ${amount.toLocaleString('vi-VN')}đ cho ${boosterUsername}: "${cleanNote}"`
        : `Đã gửi tiền Tip ${amount.toLocaleString('vi-VN')}đ cho ${boosterUsername}`;

      const [tipMessage] = await this.messageModel.create(
        [
          {
            order_id: order._id,
            sender_id: new Types.ObjectId(userId),
            content: tipMessageText,
            type: 'COMMAND_RESULT',
            metadata: {
              command: 'TIP',
              amount,
              note: cleanNote || undefined,
              orderCode,
              customerId: userId,
              customerUsername,
              boosterId,
              boosterUsername,
            },
            readBy: [new Types.ObjectId(userId)],
          },
        ],
        { session },
      );

      savedMessageId = tipMessage._id as Types.ObjectId;
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    const populated = await this.messageModel
      .findById(savedMessageId)
      .populate('sender_id', 'username profile.avatar role')
      .lean();

    // Post-commit realtime broadcasts & notification
    this.broadcastToOrderRooms(order, 'message', populated);
    this.chatGateway.broadcastBalanceUpdate(
      userId,
      updatedCustomerBalance,
      `Đã gửi tiền Tip ${amount.toLocaleString('vi-VN')}đ cho ${boosterUsername}`,
    );
    this.chatGateway.broadcastBalanceUpdate(
      boosterId,
      updatedBoosterBalance,
      `Bạn vừa nhận ${amount.toLocaleString('vi-VN')}đ tiền Tip từ ${customerUsername}!`,
    );

    this.notificationModel
      .create({
        userId: new Types.ObjectId(boosterId),
        title: 'Bạn vừa nhận được tiền Tip!',
        message: `${customerUsername} đã gửi tặng bạn ${amount.toLocaleString('vi-VN')}đ cho đơn #${orderCode}${
          cleanNote ? `: "${cleanNote}"` : ''
        }`,
        type: 'PAYMENT',
        link: `/orders/${orderCode}`,
      })
      .catch(() => {});

    return {
      success: true,
      message: populated,
      newBalance: updatedCustomerBalance,
    };
  }

  // ===========================================================================
  // 3. BOOSTER-ONLY FEATURES (Chỉ tuyển thủ phụ trách đơn)
  // ===========================================================================

  async sendBoosterStatus(
    orderId: string,
    userId: string,
    userRole: string | undefined,
    statusCode: BoosterChatStatusCode,
    note?: string,
  ) {
    const { order, isBooster } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!isBooster) {
      throw new ForbiddenException(
        'Chỉ Tuyển thủ phụ trách đơn hàng mới có thể cập nhật trạng thái cày',
      );
    }

    if (CLOSED_ORDER_STATUSES.has(order.status)) {
      throw new BadRequestException(
        'Không thể cập nhật trạng thái cho đơn hàng đã đóng',
      );
    }

    const normalizedCode = (statusCode || 'PLAYING').toUpperCase() as BoosterChatStatusCode;
    const statusMeta = BOOSTER_STATUS_CATALOG[normalizedCode];
    if (!statusMeta) {
      throw new BadRequestException(
        'Trạng thái không hợp lệ (hỗ trợ: PLAYING, BREAK, ALMOST_DONE, NEED_LOGIN)',
      );
    }

    const cleanNote = (note || '').trim().slice(0, 250);
    const orderCode =
      order.orderCode || order._id.toString().slice(-6).toUpperCase();

    const content = cleanNote
      ? `[Trạng thái Booster] ${statusMeta.label} — ${cleanNote}`
      : `[Trạng thái Booster] ${statusMeta.label}`;

    const populated = await this.saveAndBroadcastMessage(order, userId, {
      content,
      type: 'COMMAND_RESULT',
      metadata: {
        command: 'BOOSTER_STATUS',
        statusCode: normalizedCode,
        label: statusMeta.label,
        description: statusMeta.description,
        note: cleanNote || undefined,
        orderCode,
      },
    });

    // Gửi thông báo cho khách hàng (đặc biệt hữu ích khi Booster đang vào trận hoặc cần mã OTP)
    const customerId = this.extractId(order.customerId);
    if (customerId) {
      this.notificationModel
        .create({
          userId: new Types.ObjectId(customerId),
          title: `Cập nhật đơn #${orderCode}: ${statusMeta.label}`,
          message: cleanNote || statusMeta.description,
          type: 'ORDER_UPDATE',
          link: `/orders/${orderCode}`,
        })
        .catch(() => {});
    }

    return { success: true, message: populated };
  }

  async sendProgressReport(
    orderId: string,
    userId: string,
    userRole: string | undefined,
    note?: string,
  ) {
    const { order, isBooster } = await this.resolveOrderAndParticipant(
      orderId,
      userId,
      userRole,
    );

    if (!isBooster) {
      throw new ForbiddenException(
        'Chỉ Tuyển thủ phụ trách đơn hàng mới có thể gửi báo cáo tiến độ',
      );
    }

    if (CLOSED_ORDER_STATUSES.has(order.status)) {
      throw new BadRequestException(
        'Không thể gửi báo cáo cho đơn hàng đã đóng',
      );
    }

    const matches = Array.isArray(order.match_history) ? order.match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    const totalMatches = matches.length;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const currentRank =
      order.details?.current_rank ||
      order.snapshot?.initialState?.rankLabel ||
      '—';
    const currentLp = Number(order.details?.current_lp ?? 0);
    const desiredRank =
      order.details?.desired_rank ||
      order.snapshot?.targetState?.rankLabel ||
      '—';
    const orderCode =
      order.orderCode || order._id.toString().slice(-6).toUpperCase();
    const cleanNote = (note || '').trim().slice(0, 250);

    const recentMatches = matches.slice(-3).reverse().map((m: any) => ({
      champion: m.champion || 'N/A',
      result: m.result,
      lpChange: Number(m.lp_change ?? 0),
    }));

    const summaryLines = [
      `Báo cáo tiến độ đơn #${orderCode}`,
      `Rank hiện tại: ${currentRank} (${currentLp} LP) → Mục tiêu: ${desiredRank}`,
      `Thành tích: ${wins} Thắng / ${losses} Thua (${winRate}% WR)`,
      ...(cleanNote ? [`Ghi chú: ${cleanNote}`] : []),
    ];

    const populated = await this.saveAndBroadcastMessage(order, userId, {
      content: summaryLines.join('\n'),
      type: 'COMMAND_RESULT',
      metadata: {
        command: 'PROGRESS_REPORT',
        orderCode,
        currentRank,
        currentLp,
        desiredRank,
        wins,
        losses,
        totalMatches,
        winRate,
        recentMatches,
        note: cleanNote || undefined,
      },
    });

    return { success: true, message: populated };
  }

  async uploadImage(fileBase64: string, folder = 'caythuelol/chat') {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder,
      resource_type: 'auto',
    });
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
