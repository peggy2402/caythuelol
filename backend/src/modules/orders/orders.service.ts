import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';

import { IOrder, OrderStatus, SettlementStatus, IOrderSnapshot } from '../../database/schemas/Order';
import { IUser } from '../../database/schemas/User';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
} from '../../database/schemas/Transaction';
import { MailService } from '../../common/mail.service';
import { PricingEngineService } from '../pricing/pricing-engine.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('User') private userModel: Model<IUser>,
    @InjectModel('Transaction') private transactionModel: Model<ITransaction>,
    @InjectModel('BoosterProfile') private boosterProfileModel: Model<IBoosterProfile>,
    @InjectConnection() private readonly connection: Connection,
    private mailService: MailService,
    private pricingEngine: PricingEngineService,
    private loyaltyService: LoyaltyService,
  ) {}

  async checkout(userId: string, body: any) {
    const serviceType = body.serviceType;
    const boosterId = body.boosterId || body.booster_id || undefined;
    const details =
      body.details ||
      (body.service_data
        ? {
            ...body.service_data,
            game: body.game || body.service_data?.game || 'LOL',
            account_info: body.account_credentials,
            note: body.note,
          }
        : undefined);
    const options = body.options || body.service_data?.addons || {};

    const rawPricing = body.pricing || {};
    const totalAmount = Number(
      rawPricing.total_amount ??
        rawPricing.final_price ??
        rawPricing.original_price ??
        body.total_amount ??
        0,
    );
    const depositAmount = Number(rawPricing.deposit_amount ?? totalAmount);
    const pricing = {
      ...rawPricing,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      deposit_percent:
        rawPricing.deposit_percent ??
        (totalAmount > 0 && depositAmount < totalAmount
          ? Math.round((depositAmount / totalAmount) * 100)
          : 100),
      coupon_code: rawPricing.coupon_code || body.coupon_applied || undefined,
    };

    if (!serviceType || !details || totalAmount <= 0) {
      throw new BadRequestException('Vui lòng cung cấp đầy đủ thông tin đơn hàng');
    }

    if (boosterId && boosterId === userId) {
      throw new BadRequestException('Bạn không thể tự thuê chính mình!');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');

      const amountToDeduct = pricing.deposit_amount || pricing.total_amount;
      if (user.wallet_balance < amountToDeduct) {
        throw new BadRequestException('Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.');
      }

      const customCode = 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const orderSnapshot: IOrderSnapshot = {
        gameCode: (details?.game || 'LOL').toUpperCase(),
        serviceSlug: serviceType,
        pricingModel: details?.pricingModel || (serviceType === 'net-wins' ? 'UNIT_BASED' : 'FIXED_TRANSITION'),
        initialState: {
          rankId: details?.current_rank_id || details?.current_rank,
          rankLabel: details?.current_rank,
          lp: parseInt(details?.current_lp || details?.start_lp) || 0,
        },
        targetState: {
          rankId: details?.desired_rank_id || details?.desired_rank,
          rankLabel: details?.desired_rank,
          lp: parseInt(details?.target_lp) || 0,
        },
        unitPrice: details?.unitPrice || 1000,
        depositPercent: pricing.deposit_percent || (amountToDeduct >= pricing.total_amount ? 100 : 30),
        estimatedAmount: pricing.total_amount,
        depositAmount: amountToDeduct,
        overTargetPolicySnapshot: {
          allowOverTarget: Boolean(details?.allowOverTarget),
          maxOverTargetUnits: parseInt(details?.maxOverTargetUnits) || 0,
          chargeOverTarget: Boolean(details?.chargeOverTarget),
        },
        createdAt: new Date(),
      };

      const validBoosterId =
        boosterId && Types.ObjectId.isValid(boosterId)
          ? new Types.ObjectId(boosterId)
          : undefined;

      const newOrder = new this.orderModel({
        orderCode: customCode,
        customerId: user._id,
        boosterId: validBoosterId,
        serviceType,
        status: OrderStatus.PAID,
        pricing: {
          ...pricing,
          base_price: pricing.basePrice || pricing.base_price,
          option_fees: pricing.optionFees || pricing.option_fees,
          booster_earnings:
            pricing.booster_earnings ?? Math.round(pricing.total_amount * 0.85),
          settlement_status: SettlementStatus.DEPOSIT_HELD,
        },
        payment: {
          is_locked: true,
          deposit_paid: true,
          final_paid: false,
          booster_received_pending: false,
        },
        snapshot: orderSnapshot,
        details,
        options,
        timeline: [
          {
            status: OrderStatus.PAID,
            timestamp: new Date(),
            actor: user._id,
            note: 'Khách hàng thanh toán đặt cọc đơn hàng thành công qua Escrow Hold',
          },
        ],
      });

      await newOrder.save({ session });

      if (pricing.coupon_code && String(pricing.coupon_code).toUpperCase().startsWith('LRV-')) {
        await this.loyaltyService.markVoucherUsed(
          userId,
          pricing.coupon_code,
          newOrder._id as Types.ObjectId,
          session,
        );
      }

      user.wallet_balance -= amountToDeduct;
      await user.save({ session });

      await this.transactionModel.create(
        [
          {
            userId: user._id,
            orderId: newOrder._id,
            type: TransactionType.PAYMENT_HOLD,
            amount: -amountToDeduct,
            balanceAfter: user.wallet_balance,
            status: TransactionStatus.SUCCESS,
            description: `Tạm giữ tiền cọc đơn hàng #${newOrder.orderCode || newOrder._id.toString().slice(-6)}`,
          },
        ],
        { session },
      );

      await session.commitTransaction();

      // Notify Booster via Email if directed order
      if (validBoosterId) {
        this.userModel.findById(validBoosterId).then((booster) => {
          if (booster && booster.email) {
            this.mailService.sendNewOrderNotification(
              booster.email,
              booster.username,
              newOrder._id.toString(),
              serviceType,
              newOrder.pricing.booster_earnings || 0,
            );
          }
        });
      }

      return {
        success: true,
        message: 'Đặt đơn hàng thành công!',
        order: newOrder,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async listCustomerOrders(userId: string) {
    const orders = await this.orderModel
      .find({ customerId: new Types.ObjectId(userId) })
      .populate('boosterId', 'username profile')
      .sort({ createdAt: -1 })
      .lean();

    return { success: true, orders };
  }

  async getOrderDetails(orderId: string, userId: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel
      .findOne(filter)
      .populate('customerId', 'username profile email')
      .populate('boosterId', 'username profile email phoneNumber booster_info')
      .lean();

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    let boosterProfile = null;
    if (order.boosterId && (order.boosterId as any)._id) {
      boosterProfile = await this.boosterProfileModel
        .findOne({ userId: (order.boosterId as any)._id })
        .lean();
    }

    return { success: true, order, boosterProfile };
  }

  async cancelOrder(orderId: string, userId: string, reason?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    if (!['PENDING_PAYMENT', 'PAID'].includes(order.status)) {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng khi chưa có Tuyển thủ nhận việc');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const refundAmount = Number(order.pricing?.deposit_amount ?? order.pricing?.total_amount ?? 0);

    // Hoàn lại tiền vào ví khách hàng
    if (refundAmount > 0 && order.status === OrderStatus.PAID) {
      user.wallet_balance = (user.wallet_balance || 0) + refundAmount;
      await user.save();

      await this.transactionModel.create({
        userId: user._id,
        type: TransactionType.REFUND,
        amount: refundAmount,
        balanceAfter: user.wallet_balance,
        status: TransactionStatus.SUCCESS,
        description: `Hoàn tiền 100% đơn hàng ${order.orderCode || order._id} do khách hủy trước khi nhận việc`,
        metadata: {
          orderId: order._id,
          orderCode: order.orderCode,
          reason: reason || 'Khách hàng tự hủy đơn',
        },
      });
    }

    order.status = OrderStatus.CANCELLED;
    if (order.pricing) {
      order.pricing.settlement_status = SettlementStatus.REFUNDED;
    }
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      actor: new Types.ObjectId(userId),
      note: reason ? `Khách hàng hủy đơn: ${reason}` : 'Khách hàng đã hủy đơn và nhận lại 100% tiền cọc vào ví',
    });

    await order.save();

    return {
      success: true,
      message: 'Hủy đơn hàng thành công. Toàn bộ tiền cọc đã được hoàn về ví của bạn.',
      balance: user.wallet_balance,
    };
  }

  async updateOrderAccount(orderId: string, userId: string, accountData: any) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.customerId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền sửa thông tin đơn hàng này');
    }

    if (!['PENDING_PAYMENT', 'PAID'].includes(order.status)) {
      throw new BadRequestException('Không thể cập nhật thông tin tài khoản khi đơn hàng đã có Tuyển thủ xử lý');
    }

    order.details = order.details || {};
    order.details.account_info = {
      platform: accountData.platform || order.details.account_info?.platform || 'Riot',
      username: accountData.username !== undefined ? accountData.username : order.details.account_info?.username,
      password: accountData.password !== undefined ? accountData.password : order.details.account_info?.password,
    };
    if (accountData.server) order.details.server = accountData.server;
    if (accountData.note !== undefined) order.details.note = accountData.note;

    order.markModified('details');
    await order.save();

    return {
      success: true,
      message: 'Cập nhật thông tin tài khoản game thành công!',
      account_info: order.details.account_info,
    };
  }

  async confirmOrder(orderId: string, boosterId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng này không ở trạng thái chờ nhận');
    }

    if (order.boosterId && order.boosterId.toString() !== boosterId) {
      throw new BadRequestException('Đơn hàng này đã được chỉ định hoặc đã có Booster khác nhận');
    }

    order.boosterId = new Types.ObjectId(boosterId);
    order.status = OrderStatus.APPROVED;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.APPROVED,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: 'Booster đã nhận đơn',
    });

    await order.save();
    return { success: true, message: 'Nhận đơn thành công!', order };
  }

  async respondOrder(orderId: string, boosterId: string, action: 'approve' | 'reject', reason?: string) {
    if (action === 'approve') {
      return this.confirmOrder(orderId, boosterId);
    }

    if (action === 'reject') {
      const order = await this.orderModel.findById(orderId);
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      if (order.boosterId && order.boosterId.toString() === boosterId) {
        order.boosterId = undefined;
        order.status = OrderStatus.PAID;
        if (!order.timeline) order.timeline = [];
        order.timeline.push({
          status: OrderStatus.PAID,
          timestamp: new Date(),
          actor: new Types.ObjectId(boosterId),
          note: `Booster từ chối nhận đơn (Lý do: ${reason || 'Bận việc cá nhân'}). Đơn được tự động chuyển giao về Sàn việc làm công khai để các Tuyển thủ khác tiếp nhận.`,
        });
        await order.save();
      }
      return { 
        success: true, 
        message: 'Đã từ chối đơn hàng thành công. Đơn đã được tự động chuyển giao lên Sàn việc làm công khai cho các Tuyển thủ khác tiếp nhận!' 
      };
    }

    throw new BadRequestException('Hành động không hợp lệ');
  }

  async handoverOrder(orderId: string, boosterId: string, reason: string, currentProgress?: string) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      boosterId: new Types.ObjectId(boosterId),
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng đang thực hiện');

    if (!['APPROVED', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException('Chỉ có thể chuyển giao đơn hàng khi đang trong tiến trình nhận cày');
    }

    // Chuyển giao đơn: gỡ boosterId hiện tại, đưa đơn trở lại Sàn việc làm với ghi chú tiến độ
    order.boosterId = undefined;
    order.status = OrderStatus.PAID; // Chuyển về trạng thái chờ tuyển thủ mới
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.PAID,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: `Tuyển thủ yêu cầu bàn giao lại đơn (Lý do: ${reason}). Tiến độ hiện tại: ${currentProgress || 'Giữ nguyên'}. Đơn đã được chuyển giao lên Sàn để tuyển thủ khác cày tiếp.`,
    });

    await order.save();

    return {
      success: true,
      message: 'Đã bàn giao đơn hàng thành công! Đơn đã được đưa trở lại Sàn việc làm cho tuyển thủ khác nhận tiếp.',
      order,
    };
  }

  async updateOrderStatus(orderId: string, boosterId: string, status: OrderStatus) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      boosterId: new Types.ObjectId(boosterId),
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');

    order.status = status;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: `Booster chuyển trạng thái sang ${status}`,
    });

    await order.save();
    return { success: true, order };
  }

  async completeOrder(orderId: string, boosterId: string, resultData?: any) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel
        .findOne({ _id: orderId, boosterId: new Types.ObjectId(boosterId) })
        .session(session);

      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.APPROVED) {
        throw new BadRequestException('Đơn hàng chưa ở trạng thái có thể báo cáo hoàn thành');
      }

      let actualTotal = order.pricing.total_amount;

      // 1. Áp dụng Pricing Engine tính toán Settlement chính xác theo Snapshot
      if (order.snapshot) {
        const actualState = {
          rankId: resultData?.actualRank || order.details?.current_rank,
          lp: resultData?.actualLP !== undefined ? parseInt(resultData.actualLP) : parseInt(order.details?.current_lp || order.details?.target_lp),
          reportedAt: new Date(),
          note: resultData?.note,
        };

        const settlement = this.pricingEngine.calculateSettlement({
          snapshot: order.snapshot,
          actualState,
          customerApprovedOverTarget: Boolean(order.details?.allowOverTarget),
        });

        order.snapshot.actualState = actualState;
        order.snapshot.actualAmount = settlement.actualAmount;
        order.snapshot.refundAmount = settlement.refundAmount;
        order.snapshot.additionalPayment = settlement.additionalPayment;

        order.pricing.final_amount = settlement.actualAmount;
        order.pricing.settlement_status = settlement.settlementStatus;
        actualTotal = settlement.actualAmount;
      } else if (order.serviceType === 'NET_WINS' && order.details) {
        // Fallback tương thích ngược
        const { start_lp, current_lp, unit_price_per_lp, calc_mode } = order.details;
        let actualBasePrice = order.pricing.base_price;

        if (calc_mode === 'BY_LP') {
          const start = parseInt(start_lp) || 0;
          const current = parseInt(current_lp) || 0;
          const gained = Math.max(0, current - start);
          actualBasePrice = gained * (unit_price_per_lp || 0);
        }

        const originalBase = order.pricing.base_price;
        const originalTotal = order.pricing.total_amount;
        if (originalBase > 0) {
          actualTotal = Math.round((actualBasePrice / originalBase) * originalTotal);
        }

        order.pricing.final_amount = actualTotal;
        const paid = order.pricing.deposit_amount;
        const diff = actualTotal - paid;

        if (diff > 0) {
          order.pricing.settlement_status = SettlementStatus.CUSTOMER_OWES;
          order.payment.final_paid = false;
        } else if (diff < 0) {
          order.pricing.settlement_status = SettlementStatus.REFUND_NEEDED;
        } else {
          order.pricing.settlement_status = SettlementStatus.SETTLED;
          order.payment.final_paid = true;
        }
      }

      let boosterEarnings = order.pricing.booster_earnings || Math.round(actualTotal * 0.85);
      if (order.pricing.total_amount > 0) {
        boosterEarnings = Math.round((actualTotal / order.pricing.total_amount) * (order.pricing.booster_earnings || actualTotal * 0.85));
      }

      // Xử lý tự động hoàn tiền nếu cày tụt hoặc cày thiếu (Refund dư cọc)
      const refundAmount = order.snapshot?.refundAmount || 0;
      if (refundAmount > 0) {
        const customer = await this.userModel.findById(order.customerId).session(session);
        if (customer) {
          customer.wallet_balance += refundAmount;
          await customer.save({ session });

          await this.transactionModel.create(
            [
              {
                userId: customer._id,
                orderId: order._id,
                type: TransactionType.REFUND,
                amount: refundAmount,
                balanceAfter: customer.wallet_balance,
                status: TransactionStatus.SUCCESS,
                description: `Hoàn tiền cọc đơn cày thuê #${order.orderCode || order._id.toString().slice(-6)}`,
              },
            ],
            { session },
          );
        }
      }

      // Giải phóng tiền công cho Booster an toàn (Idempotency check: chỉ 1 lần duy nhất)
      if (!order.payment.booster_received_pending && boosterEarnings > 0) {
        order.payment.booster_received_pending = true;

        const booster = await this.userModel.findByIdAndUpdate(
          order.boosterId,
          { $inc: { wallet_balance: boosterEarnings } },
          { new: true, session },
        );

        await this.transactionModel.create(
          [
            {
              userId: order.boosterId,
              orderId: order._id,
              type: TransactionType.PAYMENT_RELEASE,
              amount: boosterEarnings,
              balanceAfter: booster!.wallet_balance,
              status: TransactionStatus.SUCCESS,
              description: `Nhận tiền công cày thuê đơn #${order.orderCode || order._id.toString().slice(-6)}`,
            },
          ],
          { session },
        );
      }

      order.status = OrderStatus.COMPLETED;
      order.timeline = order.timeline || [];
      order.timeline.push({
        status: OrderStatus.COMPLETED,
        timestamp: new Date(),
        actor: new Types.ObjectId(boosterId),
        note: `Tuyển thủ báo cáo hoàn thành đơn hàng. Đã quyết toán: ${actualTotal.toLocaleString('vi-VN')} đ`,
      });

      await order.save({ session });

      // Cộng điểm tích lũy cho Customer khi đơn hàng hoàn thành (1.000đ = 1 điểm)
      await this.loyaltyService.awardOrderPoints(
        order.customerId.toString(),
        order._id as Types.ObjectId,
        order.orderCode || order._id.toString().slice(-6),
        actualTotal,
        session,
      );

      await session.commitTransaction();

      return { success: true, order };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async rateBooster(orderId: string, customerId: string, rating: { stars: number; comment?: string }) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      customerId: new Types.ObjectId(customerId),
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');

    (order as any).rating = {
      stars: rating.stars,
      comment: rating.comment || '',
      createdAt: new Date(),
    };
    await order.save();

    // Recalculate booster rating
    if (order.boosterId) {
      const allRatings = await this.orderModel.aggregate([
        { $match: { boosterId: order.boosterId, 'rating.stars': { $exists: true } } },
        { $group: { _id: null, avgStars: { $avg: '$rating.stars' }, count: { $sum: 1 } } },
      ]);

      if (allRatings.length > 0) {
        const avg = Math.round(allRatings[0].avgStars * 10) / 10;
        await this.userModel.collection.updateOne(
          { _id: order.boosterId },
          { $set: { 'booster_info.rating': avg, 'booster_info.completed_orders': allRatings[0].count } },
        );
      }
    }

    return { success: true, message: 'Đánh giá Booster thành công!' };
  }

  async createDispute(orderId: string, userId: string, reason: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    order.status = OrderStatus.DISPUTED;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.DISPUTED,
      timestamp: new Date(),
      actor: new Types.ObjectId(userId),
      note: `Báo cáo khiếu nại: ${reason}`,
    });

    await order.save();
    return { success: true, message: 'Đã gửi khiếu nại đến Admin. Admin sẽ can thiệp xử lý.' };
  }
}
