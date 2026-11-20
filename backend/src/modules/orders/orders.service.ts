import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';

import { IOrder, OrderStatus, SettlementStatus, IOrderSnapshot } from '../../database/schemas/Order';
import { IUser, UserRole } from '../../database/schemas/User';
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

      const basePrice = Number(pricing.basePrice || pricing.base_price || 0);
      const optionFees = Number(pricing.optionFees || pricing.option_fees || pricing.addons_cost || 0);
      let serviceFee = Number(pricing.service_fee || 0);
      let boosterOrderValue = 0;
      if (serviceFee > 0) {
        boosterOrderValue = Math.max(0, totalAmount - serviceFee);
      } else if (pricing.original_price && Number(pricing.original_price) < totalAmount) {
        boosterOrderValue = Number(pricing.original_price) - Number(pricing.discount_amount || 0);
        serviceFee = Math.max(0, totalAmount - boosterOrderValue);
      } else if (basePrice + optionFees > 0 && basePrice + optionFees < totalAmount) {
        boosterOrderValue = basePrice + optionFees;
        serviceFee = Math.max(0, totalAmount - boosterOrderValue);
      } else {
        const candidate = Math.round(totalAmount / 1.02);
        if (Math.abs(totalAmount - Math.round(candidate * 1.02)) <= 2) {
          boosterOrderValue = candidate;
          serviceFee = totalAmount - candidate;
        } else {
          boosterOrderValue = totalAmount;
        }
      }

      const newOrder = new this.orderModel({
        orderCode: customCode,
        customerId: user._id,
        boosterId: validBoosterId,
        serviceType,
        status: OrderStatus.PAID,
        pricing: {
          ...pricing,
          base_price: basePrice,
          option_fees: optionFees,
          addons_cost: optionFees,
          service_fee: serviceFee,
          platform_fee_percent: pricing.platform_fee_percent || (serviceFee > 0 ? 2 : 0),
          original_price: pricing.original_price || boosterOrderValue,
          booster_order_value: boosterOrderValue,
          booster_earnings:
            pricing.booster_earnings ?? boosterOrderValue,
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

    // Nếu nhận đơn công khai, kiểm tra Booster có đang bật dịch vụ này hay không
    if (!order.boosterId) {
      const boosterUser = await this.userModel.findById(boosterId).lean();
      const serviceSettings = boosterUser?.booster_info?.service_settings || {};
      const customServices: any[] = Array.isArray(serviceSettings.customServices)
        ? serviceSettings.customServices
        : [];
      const selectedGames: string[] = Array.isArray(serviceSettings.selectedGames)
        ? serviceSettings.selectedGames.map((g: any) => {
            const c = (typeof g === 'string' ? g : g.gameCode || '').toUpperCase().trim();
            return (c === 'LMHT' || c === 'LOL') ? 'LOL' : c;
          })
        : [];

      const normalizeService = (t?: string) => (t || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
      const normalizeGame = (c?: string) => {
        const code = (c || '').toUpperCase().trim();
        return (code === 'LMHT' || code === 'LOL') ? 'LOL' : code;
      };

      const jobGame = normalizeGame(order.snapshot?.gameCode || order.details?.game || 'LOL');
      const jobService = normalizeService(order.serviceType || order.snapshot?.serviceSlug || '');

      if (selectedGames.length > 0 && !selectedGames.includes(jobGame)) {
        throw new BadRequestException('Bạn chưa đăng ký tựa game này trong mục Quản lý Dịch vụ.');
      }

      if (customServices.length > 0) {
        const gameServices = customServices.filter(
          (s: any) => normalizeGame(s.gameCode) === jobGame,
        );
        const matchingActiveService = gameServices.find((s: any) => {
          if (s.isActive === false) return false;
          const sType = normalizeService(s.serviceType || s.slug || s.name || s.id);
          return sType === jobService || jobService.includes(sType) || sType.includes(jobService);
        });
        if (!matchingActiveService) {
          throw new BadRequestException(
            'Dịch vụ này đang bị tắt hoặc chưa được kích hoạt trong mục Quản lý Dịch vụ của bạn.',
          );
        }
      }
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
        await this.orderModel.findByIdAndUpdate(orderId, {
          $unset: { boosterId: 1 },
          $set: { status: OrderStatus.PAID },
          $push: {
            timeline: {
              status: OrderStatus.PAID,
              timestamp: new Date(),
              actor: new Types.ObjectId(boosterId),
              note: `Booster từ chối nhận đơn (Lý do: ${reason || 'Bận việc cá nhân'}). Đơn được tự động chuyển giao về Sàn việc làm công khai để các Tuyển thủ khác tiếp nhận.`,
            },
          },
        });
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

      // Thu nhập thực tế của Booster (toàn bộ 100% giá trị đơn hàng sau trừ phí dịch vụ sàn, không trừ 15%)
      const baseBoosterValue = Number(order.pricing.booster_order_value)
        || (order.pricing.service_fee > 0 ? Math.max(0, order.pricing.total_amount - order.pricing.service_fee) : 0)
        || (order.pricing.total_amount > 0 ? Math.round(order.pricing.total_amount / 1.02) : 0)
        || order.pricing.booster_earnings
        || actualTotal;

      let boosterEarnings = baseBoosterValue;
      if (order.pricing.total_amount > 0 && actualTotal < order.pricing.total_amount) {
        boosterEarnings = Math.round((actualTotal / order.pricing.total_amount) * baseBoosterValue);
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

      // Đồng bộ số đơn hoàn thành cho Booster
      try {
        if (order.boosterId) {
          const completedCount = await this.orderModel.countDocuments({
            boosterId: order.boosterId,
            status: OrderStatus.COMPLETED,
          });
          await this.userModel.collection.updateOne(
            { _id: order.boosterId },
            { $set: { 'booster_info.completed_orders': completedCount } },
          );
          await this.boosterProfileModel.updateOne(
            { userId: order.boosterId },
            { $set: { completedOrders: completedCount } },
            { upsert: true },
          );
        }
      } catch (countErr) {
        // Non-blocking
      }

      return { success: true, order };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async rateBooster(orderId: string, customerId: string, rating: { stars?: number; rating?: number; comment?: string }) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      customerId: new Types.ObjectId(customerId),
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng của bạn');

    const stars = Number(rating.stars ?? rating.rating ?? (rating as any).score) || 5;

    (order as any).rating = {
      stars,
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

      const completedOrdersCount = await this.orderModel.countDocuments({
        boosterId: order.boosterId,
        status: OrderStatus.COMPLETED,
      });

      if (allRatings.length > 0) {
        const avg = Math.round(allRatings[0].avgStars * 10) / 10;
        await this.userModel.collection.updateOne(
          { _id: order.boosterId },
          { $set: { 'booster_info.rating': avg, 'booster_info.completed_orders': completedOrdersCount } },
        );
        await this.boosterProfileModel.updateOne(
          { userId: order.boosterId },
          { $set: { rating: avg, completedOrders: completedOrdersCount } },
          { upsert: true },
        );
      }
    }

    return { success: true, message: 'Đánh giá Booster thành công!' };
  }

  async createDispute(orderId: string, userId: string, reason: string, userRole?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Cơ chế 24h: Customer chỉ được khiếu nại trong vòng 24 giờ kể từ khi đơn hoàn thành
    if (order.status === OrderStatus.COMPLETED && userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      const completedEntry = Array.isArray(order.timeline)
        ? [...order.timeline].reverse().find((t: any) => t.status === OrderStatus.COMPLETED)
        : null;
      const completedAt = new Date(
        (order as any).completedAt || completedEntry?.timestamp || order.updatedAt,
      );
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
      if (Date.now() - completedAt.getTime() > TWENTY_FOUR_HOURS_MS) {
        throw new BadRequestException(
          'Đã quá thời hạn 24 giờ khiếu nại kể từ khi đơn hàng hoàn thành. Toàn bộ số tiền đã thuộc về Booster.',
        );
      }
    }

    order.status = OrderStatus.DISPUTED;
    order.dispute = {
      reason,
      status: 'PENDING',
      fundsDeducted: false,
    };
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

  async updateOrderDetails(
    orderId: string,
    userId: string,
    updateData: any,
    userRole?: string,
  ) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isCustomer = String(order.customerId) === String(userId);
    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;

    if (!isCustomer && !isBooster && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền cập nhật chi tiết đơn hàng này');
    }

    const currentDetails = order.details || {};
    order.details = {
      ...currentDetails,
      ...updateData,
    };
    order.markModified('details');
    await order.save();

    return {
      success: true,
      details: order.details,
      order,
    };
  }

  async addOrderMatch(orderId: string, userId: string, body: any, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isBooster && !isAdmin) {
      throw new ForbiddenException('Chỉ Tuyển thủ phụ trách hoặc Quản trị viên mới được thêm trận đấu');
    }

    const orderQueue = (order.details?.queue_type || order.details?.queueType || 'SOLO_DUO').toUpperCase();
    const isSoloDuo = ['SOLO', 'SOLO_DUO', 'RANKED_SOLO_5X5', 'RANK_SOLO'].includes(orderQueue);
    const isFlex = ['FLEX', 'RANKED_FLEX_SR', 'RANK_FLEX'].includes(orderQueue);

    if (body.detail?.info?.queueId) {
      const qId = Number(body.detail.info.queueId);
      if (isSoloDuo && qId !== 420) {
        throw new BadRequestException('Vui lòng điền đúng ID trận đấu thuộc Chế độ Đơn / Đôi (Trận đấu này thuộc Chế độ Linh hoạt hoặc Đấu thường)');
      }
      if (isFlex && qId !== 440) {
        throw new BadRequestException('Vui lòng điền đúng ID trận đấu thuộc Chế độ Linh hoạt (Trận đấu này không phải Chế độ Linh hoạt)');
      }
    }

    if (!Array.isArray(order.match_history)) {
      order.match_history = [];
    }

    const newMatch: any = {
      match_id: new Types.ObjectId().toString(),
      mode: body.mode || 'Rank Đơn/Đôi',
      champion: body.champion || '',
      result: body.result || 'WIN',
      lp_change: Number(body.lp_change) || 0,
      reason: body.reason || '',
      riotMatchId: body.riotMatchId || '',
      detail: this.sanitizeMatchDetail(body.detail),
      timestamp: new Date(),
    };

    order.match_history.unshift(newMatch);

    if (body.leagueInfo) {
      const details = order.details || {};
      order.details = {
        ...details,
        current_rank: `${body.leagueInfo.tier} ${body.leagueInfo.rank}`,
        current_lp: body.leagueInfo.leaguePoints,
      };
      order.markModified('details');
    }

    order.markModified('match_history');
    await order.save();

    return {
      success: true,
      match_history: order.match_history,
      details: order.details,
    };
  }

  async addOrderMatchesBatch(orderId: string, userId: string, matches: any[], userRole?: string) {
    if (!Array.isArray(matches) || matches.length === 0) {
      throw new BadRequestException('Danh sách trận đấu không hợp lệ hoặc đang trống');
    }

    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isBooster && !isAdmin) {
      throw new ForbiddenException('Chỉ Tuyển thủ phụ trách hoặc Quản trị viên mới được thêm trận đấu');
    }

    const orderQueue = (order.details?.queue_type || order.details?.queueType || 'SOLO_DUO').toUpperCase();
    const isSoloDuo = ['SOLO', 'SOLO_DUO', 'RANKED_SOLO_5X5', 'RANK_SOLO'].includes(orderQueue);
    const isFlex = ['FLEX', 'RANKED_FLEX_SR', 'RANK_FLEX'].includes(orderQueue);

    if (!Array.isArray(order.match_history)) {
      order.match_history = [];
    }

    const existingRiotIds = new Set(
      order.match_history
        .map((m: any) => m.riotMatchId)
        .filter(Boolean),
    );

    const newMatchesToAdd: any[] = [];
    const seenBatchRiotIds = new Set<string>();
    let netLpChange = 0;

    for (const m of matches) {
      const riotId = (m.riotMatchId || m.matchId || '').trim();
      if (riotId) {
        if (existingRiotIds.has(riotId) || seenBatchRiotIds.has(riotId)) {
          continue; // Bỏ qua nếu đã có trong đơn hàng hoặc lặp trong batch
        }
        seenBatchRiotIds.add(riotId);
      }

      if (m.detail?.info?.queueId) {
        const qId = Number(m.detail.info.queueId);
        if (isSoloDuo && qId !== 420) {
          throw new BadRequestException(`Trận đấu ${riotId} không thuộc Chế độ Đơn / Đôi. Vui lòng chỉ thêm các trận Đơn / Đôi.`);
        }
        if (isFlex && qId !== 440) {
          throw new BadRequestException(`Trận đấu ${riotId} không thuộc Chế độ Linh hoạt. Vui lòng chỉ thêm các trận Linh hoạt.`);
        }
      }

      const lp = Number(m.lp_change) || 0;
      netLpChange += lp;

      const newMatch: any = {
        match_id: new Types.ObjectId().toString(),
        mode: m.mode || 'Rank Đơn/Đôi',
        champion: m.champion || 'League Champion',
        result: m.result === 'LOSS' || lp < 0 ? 'LOSS' : 'WIN',
        lp_change: lp,
        reason: m.reason || (riotId ? `Match: ${riotId}` : ''),
        riotMatchId: riotId,
        detail: this.sanitizeMatchDetail(m.detail),
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      };

      newMatchesToAdd.push(newMatch);
    }

    if (newMatchesToAdd.length === 0) {
      return {
        success: true,
        message: 'Các trận đấu này đã có sẵn trong lịch sử đơn hàng',
        match_history: order.match_history,
        addedCount: 0,
      };
    }

    order.match_history.unshift(...newMatchesToAdd);

    if (order.details && typeof order.details === 'object') {
      const currentLp = parseInt(order.details.current_lp || '0', 10);
      if (!isNaN(currentLp)) {
        order.details.current_lp = Math.max(0, currentLp + netLpChange);
        order.markModified('details');
      }
    }

    order.markModified('match_history');
    await order.save();

    return {
      success: true,
      message: `Đã thêm thành công ${newMatchesToAdd.length} trận đấu`,
      match_history: order.match_history,
      addedCount: newMatchesToAdd.length,
      details: order.details,
    };
  }

  async updateOrderMatch(orderId: string, userId: string, body: any, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isBooster && !isAdmin) {
      throw new ForbiddenException('Chỉ Tuyển thủ phụ trách hoặc Quản trị viên mới được sửa trận đấu');
    }

    if (Array.isArray(order.match_history)) {
      const targetId = String(body.matchId);
      const match = order.match_history.find(
        (m: any) => String((m as any)._id) === targetId || m.match_id === targetId,
      );
      if (match) {
        if (body.mode) match.mode = body.mode;
        if (body.champion) match.champion = body.champion;
        if (body.result) match.result = body.result;
        if (body.lp_change !== undefined) match.lp_change = Number(body.lp_change) || 0;
        if (body.reason !== undefined) match.reason = body.reason;
        if (body.riotMatchId !== undefined) match.riotMatchId = body.riotMatchId;
        if (body.detail !== undefined) match.detail = body.detail;

        order.markModified('match_history');
        await order.save();
      }
    }

    return {
      success: true,
      match_history: order.match_history,
      details: order.details,
    };
  }

  async deleteOrderMatch(orderId: string, userId: string, matchId: string, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isBooster && !isAdmin) {
      throw new ForbiddenException('Chỉ Tuyển thủ phụ trách hoặc Quản trị viên mới được xóa trận đấu');
    }

    if (Array.isArray(order.match_history)) {
      order.match_history = order.match_history.filter(
        (m: any) => String((m as any)._id) !== String(matchId) && m.match_id !== String(matchId),
      );
      order.markModified('match_history');
      await order.save();
    }

    return {
      success: true,
      match_history: order.match_history,
    };
  }

  async updateOrderSchedule(orderId: string, userId: string, schedule: any[], userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isCustomer = String(order.customerId) === String(userId);
    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isCustomer && !isBooster && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền cập nhật lịch buổi học');
    }

    const details = order.details || {};
    order.details = { ...details, schedule };
    order.markModified('details');
    await order.save();

    return {
      success: true,
      schedule,
      details: order.details,
    };
  }

  async settleOrder(orderId: string, userId: string, body?: any, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    const isCustomer = String(order.customerId) === String(userId);
    const isBooster = order.boosterId && String(order.boosterId) === String(userId);
    if (!isAdmin && !isCustomer && !isBooster) {
      throw new ForbiddenException('Bạn không có quyền quyết toán đơn hàng này');
    }

    order.pricing.settlement_status = SettlementStatus.SETTLED;
    order.payment.final_paid = true;
    order.status = OrderStatus.COMPLETED;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.COMPLETED,
      timestamp: new Date(),
      actor: new Types.ObjectId(userId),
      note: 'Quyết toán đơn hàng thành công',
    });
    order.markModified('pricing');
    order.markModified('payment');
    await order.save();

    return { success: true, message: 'Quyết toán đơn hàng thành công', order };
  }

  async refundOrder(orderId: string, userId: string, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isAdmin) {
      throw new ForbiddenException('Chỉ Quản trị viên mới có quyền hoàn tiền đơn hàng');
    }

    order.pricing.settlement_status = SettlementStatus.REFUNDED;
    order.status = OrderStatus.REFUNDED;
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.REFUNDED,
      timestamp: new Date(),
      actor: new Types.ObjectId(userId),
      note: 'Hoàn tiền đơn hàng',
    });
    order.markModified('pricing');
    await order.save();

    return { success: true, message: 'Hoàn tiền đơn hàng thành công', order };
  }

  private sanitizeMatchDetail(detail: any): any {
    if (!detail || typeof detail !== 'object') return null;
    try {
      // League of Legends Riot Match v5: Loại bỏ challenges và các trường đồ sộ không dùng đến
      if (detail.info && Array.isArray(detail.info.participants)) {
        return {
          metadata: detail.metadata || null,
          info: {
            gameCreation: detail.info.gameCreation,
            gameDuration: detail.info.gameDuration,
            gameEndTimestamp: detail.info.gameEndTimestamp,
            gameId: detail.info.gameId,
            gameMode: detail.info.gameMode,
            gameType: detail.info.gameType,
            gameVersion: detail.info.gameVersion,
            mapId: detail.info.mapId,
            queueId: detail.info.queueId,
            teams: detail.info.teams,
            participants: detail.info.participants.map((p: any) => {
              const { challenges, PlayerBehavior, ...cleanP } = p;
              delete cleanP.missions;
              delete cleanP.PlayerScore0;
              delete cleanP.PlayerScore1;
              delete cleanP.PlayerScore2;
              delete cleanP.PlayerScore3;
              delete cleanP.PlayerScore4;
              delete cleanP.PlayerScore5;
              delete cleanP.PlayerScore6;
              delete cleanP.PlayerScore7;
              delete cleanP.PlayerScore8;
              delete cleanP.PlayerScore9;
              delete cleanP.PlayerScore10;
              delete cleanP.PlayerScore11;
              return cleanP;
            }),
          },
        };
      }
      return detail;
    } catch {
      return detail;
    }
  }
}
