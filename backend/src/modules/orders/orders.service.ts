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
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';
import { IBoosterProfile } from '../../database/schemas/BoosterProfile';
import { AOV_RANK_LADDER } from '../../common/aov.config';

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
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
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
        throw new BadRequestException({
          statusCode: 400,
          message: 'Số dư ví không đủ để thanh toán. Vui lòng nạp thêm tiền.',
          insufficientBalance: true,
          requiredAmount: amountToDeduct,
          currentBalance: user.wallet_balance,
          missingAmount: amountToDeduct - user.wallet_balance,
        });
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
      const listedPrice = Number(pricing.listed_price || pricing.original_price || (basePrice + optionFees) || totalAmount);
      const discountAmount = Number(pricing.discount_amount || 0);
      let serviceFee = Number(pricing.service_fee || 0);

      // Phân bổ tài chính và nguồn tài trợ Voucher
      const rawCoupon = String(pricing.coupon_code || body.coupon_applied || '').trim().toUpperCase();
      let fundingSource: 'PLATFORM' | 'BOOSTER' | 'SHARED' | null = pricing.funding_source || null;
      let platformSubsidy = Number(pricing.platform_subsidy || 0);
      let boosterDiscount = Number(pricing.booster_discount || 0);
      let boosterEarnings = 0;

      if (discountAmount > 0 || rawCoupon) {
        if (!fundingSource) {
          if (rawCoupon.startsWith('LRV-')) {
            fundingSource = 'PLATFORM';
          } else if (pricing.is_booster_coupon || body.is_booster_coupon) {
            fundingSource = 'BOOSTER';
          } else {
            fundingSource = 'PLATFORM'; // Mặc định voucher hệ thống do Sàn tài trợ
          }
        }

        if (fundingSource === 'PLATFORM') {
          platformSubsidy = discountAmount;
          boosterDiscount = 0;
          // Sàn tài trợ 100% -> Thu nhập Booster được bảo toàn nguyên vẹn theo giá niêm yết!
          boosterEarnings = listedPrice > 0 ? listedPrice : Math.max(0, totalAmount - serviceFee + discountAmount);
        } else if (fundingSource === 'BOOSTER') {
          platformSubsidy = 0;
          boosterDiscount = discountAmount;
          // Booster tự tài trợ -> Khấu trừ vào thu nhập của Booster
          boosterEarnings = Math.max(0, (listedPrice > 0 ? listedPrice : totalAmount) - boosterDiscount);
        } else {
          // SHARED
          platformSubsidy = Number(pricing.platform_subsidy || 0);
          boosterDiscount = Number(pricing.booster_discount || Math.max(0, discountAmount - platformSubsidy));
          boosterEarnings = Math.max(0, (listedPrice > 0 ? listedPrice : totalAmount) - boosterDiscount);
        }
      } else {
        // Đơn không áp voucher
        fundingSource = null;
        platformSubsidy = 0;
        boosterDiscount = 0;
        if (serviceFee > 0) {
          boosterEarnings = Math.max(0, totalAmount - serviceFee);
        } else {
          boosterEarnings = listedPrice > 0 ? listedPrice : totalAmount;
        }
      }

      const boosterOrderValue = boosterEarnings;

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
          original_price: listedPrice,
          listed_price: listedPrice,
          discount_amount: discountAmount,
          funding_source: fundingSource,
          platform_subsidy: platformSubsidy,
          booster_discount: boosterDiscount,
          booster_order_value: boosterOrderValue,
          booster_earnings: boosterEarnings,
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

      // Gửi thông báo In-App + Realtime cho cả Booster & Customer khi có đơn mới cần cày
      const orderCodeDisplay = newOrder.orderCode || newOrder._id.toString().slice(-6).toUpperCase();
      const gameCodeUpper = (orderSnapshot.gameCode || 'LOL').toUpperCase();
      const gameNameMap: Record<string, string> = {
        LOL: 'LMHT',
        AOV: 'Liên Quân Mobile',
        LIENQUAN: 'Liên Quân Mobile',
        VALORANT: 'Valorant',
        TFT: 'ĐTCL',
        CS2: 'CS2',
      };
      const gameDisplay = gameNameMap[gameCodeUpper] || gameCodeUpper;
      const routeText =
        details?.current_rank && details?.desired_rank
          ? ` (${details.current_rank} → ${details.desired_rank})`
          : '';

      if (validBoosterId) {
        this.userModel
          .findById(validBoosterId)
          .select('username email')
          .lean()
          .then(async (booster) => {
            if (booster?.email) {
              this.mailService.sendNewOrderNotification(
                booster.email,
                booster.username,
                newOrder._id.toString(),
                serviceType,
                newOrder.pricing.booster_earnings || 0,
              );
            }

            // 1. Thông báo cho Booster được chỉ định / ghép
            await this.notificationsService.notifyUser({
              userId: validBoosterId,
              title: 'Bạn có đơn hàng mới cần cày!',
              message: `Khách hàng @${user.username} vừa đặt đơn #${orderCodeDisplay} - ${gameDisplay}${routeText}. Vào Sàn Việc Làm để xác nhận nhận đơn ngay!`,
              type: 'ORDER_UPDATE',
              variant: 'info',
              link: '/booster/jobs',
            });
            this.chatGateway.broadcastBoosterJobsUpdated(validBoosterId.toString());

            // 2. Thông báo xác nhận cho Customer
            await this.notificationsService.notifyUser({
              userId: user._id,
              title: 'Đặt đơn cày thuê thành công!',
              message: `Đơn hàng #${orderCodeDisplay} - ${gameDisplay}${routeText} đã được gửi tới Booster @${booster?.username || 'Booster'} và đang chờ xác nhận nhận đơn.`,
              type: 'ORDER_UPDATE',
              variant: 'success',
              link: `/orders/${newOrder._id}`,
            });
          })
          .catch(() => {});
      } else {
        // Đơn công khai lên Sàn việc làm: thông báo cho Customer và các Booster sẵn sàng nhận tựa game này
        this.notificationsService
          .notifyUser({
            userId: user._id,
            title: 'Đặt đơn cày thuê thành công!',
            message: `Đơn hàng #${orderCodeDisplay} - ${gameDisplay}${routeText} đã được đưa lên Sàn Việc Làm. Hệ thống sẽ báo ngay khi có Booster nhận đơn!`,
            type: 'ORDER_UPDATE',
            variant: 'success',
            link: `/orders/${newOrder._id}`,
          })
          .catch(() => {});

        this.userModel
          .find({
            role: UserRole.BOOSTER,
            _id: { $ne: user._id },
            'booster_info.isReady': { $ne: false },
          })
          .select('_id booster_info.service_settings.selectedGames')
          .lean()
          .then(async (boosters) => {
            const normTarget = gameCodeUpper === 'LMHT' ? 'LOL' : gameCodeUpper === 'LIENQUAN' ? 'AOV' : gameCodeUpper;
            const eligibleIds = boosters
              .filter((b: any) => {
                const selected: string[] = b.booster_info?.service_settings?.selectedGames || [];
                if (!Array.isArray(selected) || selected.length === 0) return true;
                return selected.some((g: any) => {
                  const c = (typeof g === 'string' ? g : g?.gameCode || '').toUpperCase().trim();
                  const nc = c === 'LMHT' ? 'LOL' : c === 'LIENQUAN' ? 'AOV' : c;
                  return nc === normTarget;
                });
              })
              .map((b: any) => b._id);

            if (eligibleIds.length > 0) {
              await this.notificationsService.notifyUsers(eligibleIds, {
                title: 'Có đơn hàng mới đang chờ nhận!',
                message: `Đơn #${orderCodeDisplay} - ${gameDisplay}${routeText} đang chờ trên Sàn Việc Làm. Vào nhận đơn ngay!`,
                type: 'ORDER_UPDATE',
                variant: 'info',
                link: '/booster/jobs',
              });
            }
            this.chatGateway.broadcastBoosterJobsUpdated();
          })
          .catch(() => {});
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

  async getOrderDetails(orderId: string, userId: string, userRole?: string) {
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

    const customerIdStr = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
    const boosterIdStr = (order.boosterId as any)?._id?.toString() || order.boosterId?.toString();
    const uid = userId?.toString();

    const isCustomer = Boolean(customerIdStr && uid && customerIdStr === uid);
    const isBooster = Boolean(boosterIdStr && uid && boosterIdStr === uid);
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;

    // KIỂM TRA PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL):
    if (!isCustomer && !isBooster && !isAdmin) {
      // Nếu là đơn hàng ở trạng thái mở trong Chợ đơn hàng (chưa có booster nhận) và user là BOOSTER
      const isAvailableInMarket = !boosterIdStr && ['PAID', 'PENDING_CONFIRM'].includes(order.status);
      if (isAvailableInMarket && userRole === UserRole.BOOSTER) {
        // Booster vãng lai xem đơn trong chợ: Ẩn thông tin tài khoản đăng nhập
        if (order.details?.account_credentials) {
          order.details.account_credentials = {
            ...order.details.account_credentials,
            password: '******',
          };
        }
        if (order.details?.account_info) {
          order.details.account_info = {
            ...order.details.account_info,
            password: '******',
          };
        }
      } else {
        throw new ForbiddenException(
          'Bạn không có quyền truy cập đơn hàng này. Đơn hàng này thuộc về Khách hàng và Booster khác!'
        );
      }
    }

    let boosterProfile = null;
    if (order.boosterId && (order.boosterId as any)._id) {
      boosterProfile = await this.boosterProfileModel
        .findOne({ userId: (order.boosterId as any)._id })
        .lean();
    }

    return { 
      success: true, 
      order, 
      boosterProfile,
      viewerPermissions: {
        isCustomer,
        isBooster,
        isAdmin,
      }
    };
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
      throw new BadRequestException('Chỉ có thể hủy đơn hàng khi chưa có Booster nhận việc');
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
      throw new BadRequestException('Không thể cập nhật thông tin tài khoản khi đơn hàng đã có Booster xử lý');
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

    // Thông báo realtime cho Customer khi Booster đã nhận đơn + đồng bộ badge số đơn chờ
    const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
    this.userModel
      .findById(boosterId)
      .select('username')
      .lean()
      .then(async (booster) => {
        await this.notificationsService.notifyUser({
          userId: order.customerId,
          title: 'Đơn hàng của bạn đã được nhận!',
          message: `Booster @${booster?.username || 'Booster'} đã xác nhận nhận đơn hàng #${orderCodeDisplay} của bạn và sẽ sớm tiến hành cày.`,
          type: 'ORDER_UPDATE',
          variant: 'success',
          link: `/orders/${order._id}`,
        });
      })
      .catch(() => {});
    this.chatGateway.broadcastBoosterJobsUpdated();

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
              note: `Booster từ chối nhận đơn (Lý do: ${reason || 'Bận việc cá nhân'}). Đơn được tự động chuyển giao về Sàn việc làm công khai để các Booster khác tiếp nhận.`,
            },
          },
        });
      }
      return { 
        success: true, 
        message: 'Đã từ chối đơn hàng thành công. Đơn đã được tự động chuyển giao lên Sàn việc làm công khai cho các Booster khác tiếp nhận!' 
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
    order.status = OrderStatus.PAID; // Chuyển về trạng thái chờ Booster mới
    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.PAID,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: `Booster yêu cầu bàn giao lại đơn (Lý do: ${reason}). Tiến độ hiện tại: ${currentProgress || 'Giữ nguyên'}. Đơn đã được chuyển giao lên Sàn để Booster khác cày tiếp.`,
    });

    await order.save();

    return {
      success: true,
      message: 'Đã bàn giao đơn hàng thành công! Đơn đã được đưa trở lại Sàn việc làm cho Booster khác nhận tiếp.',
      order,
    };
  }

  async updateOrderStatus(orderId: string, boosterId: string, status: OrderStatus, userRole?: string) {
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const assignedBoosterId = order.boosterId?._id?.toString() || order.boosterId?.toString();
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    if (!isAdmin && (!assignedBoosterId || assignedBoosterId !== boosterId.toString())) {
      throw new ForbiddenException('Bạn không phải là Booster phụ trách đơn hàng này');
    }

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

  async completeOrder(orderId: string, boosterId: string, resultData?: any, userRole?: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      let filter: any;
      if (Types.ObjectId.isValid(orderId)) {
        filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
      } else {
        filter = { orderCode: orderId.trim().toUpperCase() };
      }

      const order = await this.orderModel.findOne(filter).session(session);
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      const assignedBoosterId = order.boosterId?._id?.toString() || order.boosterId?.toString();
      const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
      if (!isAdmin && (!assignedBoosterId || assignedBoosterId !== boosterId.toString())) {
        throw new ForbiddenException('Bạn không phải là Booster phụ trách đơn hàng này');
      }

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
        note: `Booster báo cáo hoàn thành đơn hàng. Đã quyết toán: ${actualTotal.toLocaleString('vi-VN')} đ`,
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

      // Thông báo cho Customer khi đơn hàng hoàn thành
      const completedCode = order.orderCode || order._id.toString().slice(-6).toUpperCase();
      this.notificationsService
        .notifyUser({
          userId: order.customerId,
          title: 'Đơn hàng của bạn đã hoàn thành!',
          message: `Booster đã báo cáo hoàn thành đơn hàng #${completedCode}. Vui lòng kiểm tra kết quả và đánh giá Booster!`,
          type: 'ORDER_UPDATE',
          variant: 'success',
          link: `/orders/${order._id}`,
        })
        .catch(() => {});

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
    let filter: any;
    if (Types.ObjectId.isValid(orderId)) {
      filter = { $or: [{ _id: new Types.ObjectId(orderId) }, { orderCode: orderId }] };
    } else {
      filter = { orderCode: orderId.trim().toUpperCase() };
    }

    const order = await this.orderModel.findOne(filter);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const customerIdStr = (order.customerId as any)?._id?.toString() || order.customerId?.toString();
    const boosterIdStr = (order.boosterId as any)?._id?.toString() || order.boosterId?.toString();
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    const uid = userId?.toString();

    if (uid !== customerIdStr && uid !== boosterIdStr && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền báo lỗi hoặc khiếu nại đơn hàng này');
    }

    // Cơ chế 24h & Nghiệm thu: Customer không được khiếu nại nếu đã đánh giá nghiệm thu hoặc quá 24 giờ
    if (order.status === OrderStatus.COMPLETED && userRole !== UserRole.ADMIN && userRole !== UserRole.STAFF) {
      if ((order as any).rating) {
        throw new BadRequestException(
          'Đơn hàng đã được nghiệm thu và đánh giá hoàn tất. Cổng khiếu nại đã chính thức đóng.',
        );
      }
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

    // Đồng bộ sang order.options nếu có chỉnh sửa tùy chọn mở rộng (roles, champions, schedule)
    if (updateData.options) {
      order.options = {
        ...(order.options || {}),
        ...updateData.options,
      };
      order.markModified('options');
    }
    if (
      updateData.roles ||
      updateData.selectedRoles ||
      updateData.champions ||
      updateData.selectedChampions ||
      updateData.scheduleDetails
    ) {
      if (!order.options) order.options = {};
      if (updateData.roles || updateData.selectedRoles) {
        order.options.roles = updateData.roles || updateData.selectedRoles;
        order.options.selectedRoles = updateData.selectedRoles || updateData.roles;
        if (updateData.rolesDisplay) order.options.rolesDisplay = updateData.rolesDisplay;
      }
      if (updateData.champions || updateData.selectedChampions) {
        order.options.champions = updateData.champions || updateData.selectedChampions;
        order.options.selectedChampions = updateData.selectedChampions || updateData.champions;
      }
      if (updateData.scheduleDetails) {
        order.options.scheduleDetails = updateData.scheduleDetails;
      }
      order.markModified('options');
    }

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
      throw new ForbiddenException('Chỉ Booster phụ trách hoặc Quản trị viên mới được thêm trận đấu');
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

    // Giới hạn số trận đấu đối với Cày Theo Số Trận Thắng (tính theo trận Thắng) hoặc Phân Hạng Đầu Mùa (tính tổng trận)
    const isMatchesService = order.serviceType === 'MATCHES' || order.details?.is_matches;
    const isPlacementsService = order.serviceType === 'PLACEMENTS' || order.details?.is_placements;
    if (isMatchesService || isPlacementsService) {
      const maxAllowed = Number(
        order.details?.match_count ||
        order.details?.placement_matches ||
        order.details?.matches ||
        order.details?.steps_count ||
        order.details?.num_games ||
        (isMatchesService ? 10 : 5)
      );
      if (isMatchesService) {
        const currentWins = order.match_history.filter((m: any) => m.result === 'WIN').length;
        if (currentWins >= maxAllowed) {
          throw new BadRequestException(`Đơn hàng đã đạt đủ ${currentWins}/${maxAllowed} trận thắng theo cam kết. Bạn có thể báo cáo hoàn thành!`);
        }
      } else if (order.match_history.length >= maxAllowed) {
        throw new BadRequestException(`Đơn hàng đã cập nhật đủ ${order.match_history.length}/${maxAllowed} trận theo yêu cầu. Không thể thêm trận vượt quá số lượng!`);
      }
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
      throw new ForbiddenException('Chỉ Booster phụ trách hoặc Quản trị viên mới được thêm trận đấu');
    }

    const orderQueue = (order.details?.queue_type || order.details?.queueType || 'SOLO_DUO').toUpperCase();
    const isSoloDuo = ['SOLO', 'SOLO_DUO', 'RANKED_SOLO_5X5', 'RANK_SOLO'].includes(orderQueue);
    const isFlex = ['FLEX', 'RANKED_FLEX_SR', 'RANK_FLEX'].includes(orderQueue);

    if (!Array.isArray(order.match_history)) {
      order.match_history = [];
    }

    // Giới hạn số trận đấu đối với Cày Theo Số Trận Thắng (tính theo trận Thắng) hoặc Phân Hạng Đầu Mùa (tính tổng trận)
    const isMatchesService = order.serviceType === 'MATCHES' || order.details?.is_matches;
    const isPlacementsService = order.serviceType === 'PLACEMENTS' || order.details?.is_placements;
    if (isMatchesService || isPlacementsService) {
      const maxAllowed = Number(
        order.details?.match_count ||
        order.details?.placement_matches ||
        order.details?.matches ||
        order.details?.steps_count ||
        order.details?.num_games ||
        (isMatchesService ? 10 : 5)
      );
      if (isMatchesService) {
        const currentWins = order.match_history.filter((m: any) => m.result === 'WIN').length;
        if (currentWins >= maxAllowed) {
          throw new BadRequestException(`Đơn hàng đã đạt đủ ${currentWins}/${maxAllowed} trận thắng theo cam kết. Bạn có thể báo cáo hoàn thành!`);
        }
      } else if (order.match_history.length >= maxAllowed) {
        throw new BadRequestException(`Đơn hàng đã cập nhật đủ ${order.match_history.length}/${maxAllowed} trận theo yêu cầu. Không thể thêm trận vượt quá số lượng!`);
      }
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

    if (isMatchesService || isPlacementsService) {
      const maxAllowed = Number(
        order.details?.match_count ||
        order.details?.placement_matches ||
        order.details?.matches ||
        order.details?.steps_count ||
        order.details?.num_games ||
        (isMatchesService ? 10 : 5)
      );
      const remainingAllowed = maxAllowed - order.match_history.length;
      if (newMatchesToAdd.length > remainingAllowed) {
        throw new BadRequestException(
          `Đơn hàng chỉ còn thiếu ${remainingAllowed} trận nữa là hoàn thành ${maxAllowed} trận theo yêu cầu. Bạn đang chọn thêm ${newMatchesToAdd.length} trận.`
        );
      }
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
      throw new ForbiddenException('Chỉ Booster phụ trách hoặc Quản trị viên mới được sửa trận đấu');
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
      throw new ForbiddenException('Chỉ Booster phụ trách hoặc Quản trị viên mới được xóa trận đấu');
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

    const amount = Number(body?.amount || 0);
    if (isCustomer && !isAdmin && amount > 0) {
      const customer = await this.userModel.findById(userId);
      if (!customer) throw new NotFoundException('Không tìm thấy tài khoản khách hàng');
      if (Number(customer.wallet_balance || 0) < amount) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Số dư ví của bạn không đủ để thanh toán phần quyết toán còn lại. Vui lòng nạp thêm tiền!',
          insufficientBalance: true,
          requiredAmount: amount,
          currentBalance: Number(customer.wallet_balance || 0),
          missingAmount: amount - Number(customer.wallet_balance || 0),
        });
      }
      customer.wallet_balance -= amount;
      await customer.save();

      await this.transactionModel.create({
        userId: customer._id,
        orderId: order._id,
        type: TransactionType.PAYMENT_HOLD,
        amount: -amount,
        balanceAfter: customer.wallet_balance,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán quyết toán đơn hàng #${order.orderCode || order._id.toString().slice(-6)}`,
      });

      if (!order.pricing) order.pricing = {} as any;
      order.pricing.deposit_amount = (Number(order.pricing.deposit_amount) || 0) + amount;
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

  /**
   * Booster kiểm tra tài khoản thực tế và báo cáo sai lệch Rank (Khai khống rank)
   */
  async verifyRankMismatch(
    orderId: string,
    boosterId: string,
    payload: {
      verifiedRank: string;
      proofImage: string;
      note?: string;
      proposedPrice?: number;
    },
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // Kiểm tra quyền: Booster được gán hoặc Admin
    if (order.boosterId?.toString() !== boosterId) {
      const user = await this.userModel.findById(boosterId).select('role').lean();
      if (user?.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Bạn không có quyền báo sai lệch rank cho đơn hàng này');
      }
    }

    const allowedMismatchStatuses = [
      OrderStatus.PAID,
      OrderStatus.APPROVED,
      OrderStatus.IN_PROGRESS,
    ];
    if (!allowedMismatchStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Chỉ có thể báo sai lệch rank khi đơn đang ở trạng thái PAID, APPROVED hoặc IN_PROGRESS',
      );
    }

    const declaredRank =
      order.details?.current_rank ||
      order.details?.currentRank ||
      order.snapshot?.initialState?.rankId ||
      order.details?.rank_start ||
      'Không rõ';

    const targetRank =
      order.details?.desired_rank ||
      order.details?.desiredRank ||
      order.snapshot?.targetState?.rankId ||
      order.details?.rank_target ||
      '';

    let recalculatedPrice = 0;

    // 1. Nếu Booster/Admin truyền proposedPrice hợp lệ (> 0)
    if (payload.proposedPrice && payload.proposedPrice > 0) {
      recalculatedPrice = Math.round(payload.proposedPrice);
    } else {
      // 2. Tự động tính theo AOV_RANK_LADDER nếu là Liên Quân
      const game = (order.details?.game || '').toUpperCase();
      const isAov =
        game === 'AOV' ||
        game === 'LIENQUAN' ||
        game.includes('LIÊN QUÂN') ||
        (order.serviceType || '').toLowerCase().includes('lienquan');

      if (isAov) {
        const matchLadderIndex = (str: string) => {
          if (!str) return -1;
          const s = str.toLowerCase().trim();
          let idx = AOV_RANK_LADDER.findIndex(
            (step) =>
              step.id.toLowerCase() === s ||
              step.label.toLowerCase() === s ||
              step.tier.toLowerCase() === s,
          );
          if (idx !== -1) return idx;

          if (s.includes('chiến thần') || s.includes('legend')) return AOV_RANK_LADDER.findIndex((x) => x.id === 'LEGEND');
          if (s.includes('chiến tướng') || s.includes('conqueror')) return AOV_RANK_LADDER.findIndex((x) => x.id === 'CONQUEROR');
          if (s.includes('đại cao thủ') || s.includes('grandmaster')) return AOV_RANK_LADDER.findIndex((x) => x.id === 'GRANDMASTER');
          if (s.includes('cao thủ') || s.includes('master')) return AOV_RANK_LADDER.findIndex((x) => x.id === 'MASTER');

          const tiers = [
            { key: 'tinh anh', code: 'VETERAN' },
            { key: 'kim cương', code: 'DIAMOND' },
            { key: 'bạch kim', code: 'PLATINUM' },
            { key: 'vàng', code: 'GOLD' },
            { key: 'bạc', code: 'SILVER' },
            { key: 'đồng', code: 'BRONZE' },
          ];
          for (const t of tiers) {
            if (s.includes(t.key)) {
              if (s.includes(' v ') || s.includes(' v(') || s.endsWith(' v') || s.includes(' 5')) {
                const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code && (x.division === 'V' || x.id.endsWith('_5')));
                if (found !== -1) return found;
              }
              if (s.includes(' iv ') || s.includes(' iv(') || s.endsWith(' iv') || s.includes(' 4')) {
                const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code && (x.division === 'IV' || x.id.endsWith('_4')));
                if (found !== -1) return found;
              }
              if (s.includes(' iii ') || s.includes(' iii(') || s.endsWith(' iii') || s.includes(' 3')) {
                const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code && (x.division === 'III' || x.id.endsWith('_3')));
                if (found !== -1) return found;
              }
              if (s.includes(' ii ') || s.includes(' ii(') || s.endsWith(' ii') || s.includes(' 2')) {
                const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code && (x.division === 'II' || x.id.endsWith('_2')));
                if (found !== -1) return found;
              }
              if (s.includes(' i ') || s.includes(' i(') || s.endsWith(' i') || s.includes(' 1')) {
                const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code && (x.division === 'I' || x.id.endsWith('_1')));
                if (found !== -1) return found;
              }
              const found = AOV_RANK_LADDER.findIndex((x) => x.tier === t.code);
              if (found !== -1) return found;
            }
          }
          return -1;
        };

        const fromIdx = matchLadderIndex(payload.verifiedRank);
        const toIdx = matchLadderIndex(targetRank);

        if (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) {
          let ladderTotal = 0;
          for (let i = fromIdx; i < toIdx; i++) {
            ladderTotal += AOV_RANK_LADDER[i].stepPrice;
          }
          const optionFees = order.pricing?.option_fees || 0;
          recalculatedPrice = ladderTotal + optionFees;
        }
      }

      // Fallback: nếu không map được nấc tự động
      if (!recalculatedPrice || recalculatedPrice <= 0) {
        recalculatedPrice = Math.round((order.pricing?.total_amount || 0) * 1.3);
      }
    }

    const currentTotal = order.pricing?.total_amount || 0;
    const extraAmountNeeded = Math.max(0, recalculatedPrice - currentTotal);

    order.status = OrderStatus.RANK_MISMATCH;
    order.mismatch_info = {
      declaredRank,
      verifiedRank: payload.verifiedRank,
      proofImage: payload.proofImage,
      note: payload.note,
      recalculatedPrice,
      extraAmountNeeded,
      reportedBy: new Types.ObjectId(boosterId),
      reportedAt: new Date(),
    };

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.RANK_MISMATCH,
      timestamp: new Date(),
      actor: new Types.ObjectId(boosterId),
      note: `Booster phát hiện Rank thực tế (${payload.verifiedRank}) khác với Rank khai (${declaredRank}). Báo giá mới: ${recalculatedPrice.toLocaleString('vi-VN')} đ (cần bù thêm ${extraAmountNeeded.toLocaleString('vi-VN')} đ).`,
    });

    await order.save();

    // Bắn thông báo đến khách hàng
    const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
    this.notificationsService
      .notifyUser({
        userId: order.customerId,
        title: `⚠️ Phát hiện sai lệch Rank - Đơn #${orderCodeDisplay}`,
        message: `Tài khoản của bạn có Rank thực tế là "${payload.verifiedRank}" (khác với "${declaredRank}" đã khai). Vui lòng xác nhận bù ${extraAmountNeeded.toLocaleString('vi-VN')} đ hoặc yêu cầu hủy đơn.`,
        type: 'ORDER_UPDATE',
        variant: 'warning',
        link: `/orders/${order._id}`,
      })
      .catch(() => {});

    this.chatGateway.broadcastBoosterJobsUpdated();

    return {
      success: true,
      message: 'Đã báo cáo sai lệch Rank và gửi báo giá mới cho khách hàng',
      order,
    };
  }

  /**
   * Khách hàng chấp nhận báo giá mới do sai lệch rank, thanh toán phần tiền chênh lệch
   * và xác nhận / gửi lại thông tin tài khoản game đúng mức rank cho Booster
   */
  async confirmRequote(
    orderId: string,
    customerId: string,
    payload?: {
      account_info?: {
        username?: string;
        password?: string;
        platform?: string;
      };
      server?: string;
      note?: string;
    },
  ) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.customerId?.toString() !== customerId) {
      throw new ForbiddenException('Bạn không phải là chủ sở hữu đơn hàng này');
    }

    if (order.status !== OrderStatus.RANK_MISMATCH) {
      throw new BadRequestException('Đơn hàng không ở trạng thái sai lệch rank (RANK_MISMATCH)');
    }

    const extraAmount = order.mismatch_info?.extraAmountNeeded || 0;
    const customer = await this.userModel.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Khách hàng không tồn tại');
    }

    if (extraAmount > 0) {
      if (customer.wallet_balance < extraAmount) {
        throw new BadRequestException(
          `Số dư ví (${customer.wallet_balance.toLocaleString('vi-VN')} đ) không đủ để thanh toán phần chênh lệch (${extraAmount.toLocaleString('vi-VN')} đ). Vui lòng nạp thêm tiền vào ví.`,
        );
      }

      // Trừ tiền ví khách
      customer.wallet_balance -= extraAmount;
      await customer.save();

      // Ghi nhận transaction trừ tiền
      await this.transactionModel.create({
        userId: customer._id,
        orderId: order._id,
        type: TransactionType.PAYMENT_HOLD,
        amount: extraAmount,
        balanceAfter: customer.wallet_balance,
        status: TransactionStatus.SUCCESS,
        description: `Thanh toán chênh lệch sai lệch Rank cho đơn hàng #${order.orderCode || order._id.toString().slice(-6)}`,
      });

      this.chatGateway.broadcastBalanceUpdate(
        customer._id.toString(),
        customer.wallet_balance,
        `Trừ ${extraAmount.toLocaleString('vi-VN')} đ bù sai lệch rank đơn #${order.orderCode || order._id.toString().slice(-6)}`,
      );
    }

    // Cập nhật giá mới cho đơn hàng
    order.pricing.total_amount = (order.pricing.total_amount || 0) + extraAmount;
    order.pricing.deposit_amount = (order.pricing.deposit_amount || 0) + extraAmount;
    order.pricing.base_price = (order.pricing.base_price || 0) + extraAmount;
    // Tăng thù lao Booster theo tỷ lệ sàn 85%
    order.pricing.booster_earnings =
      (order.pricing.booster_earnings || 0) + Math.round(extraAmount * 0.85);

    // Cập nhật Rank thực tế & thông tin tài khoản game (nếu khách gửi lại) vào order.details
    if (!order.details) order.details = {};
    if (order.mismatch_info?.verifiedRank) {
      order.details.current_rank = order.mismatch_info.verifiedRank;
      order.details.currentRank = order.mismatch_info.verifiedRank;
    }

    let accountUpdated = false;
    if (payload?.account_info) {
      const prevAcc = order.details.account_info || {};
      const nextUsername =
        payload.account_info.username !== undefined
          ? payload.account_info.username.trim()
          : prevAcc.username;
      const nextPassword =
        payload.account_info.password !== undefined
          ? payload.account_info.password.trim()
          : prevAcc.password;
      const nextPlatform =
        payload.account_info.platform !== undefined && payload.account_info.platform.trim()
          ? payload.account_info.platform.trim()
          : prevAcc.platform || 'Riot';

      if (
        nextUsername !== prevAcc.username ||
        nextPassword !== prevAcc.password ||
        nextPlatform !== prevAcc.platform
      ) {
        accountUpdated = true;
      }

      order.details.account_info = {
        ...prevAcc,
        platform: nextPlatform,
        username: nextUsername,
        password: nextPassword,
      };
    }

    if (payload?.server !== undefined && payload.server.trim()) {
      order.details.server = payload.server.trim();
    }
    if (payload?.note !== undefined && payload.note.trim()) {
      order.details.note = payload.note.trim();
    }

    order.markModified('details');

    order.status = OrderStatus.IN_PROGRESS;
    if (order.mismatch_info) {
      order.mismatch_info.resolvedAt = new Date();
      order.mismatch_info.resolutionAction = 'CONFIRMED';
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.IN_PROGRESS,
      timestamp: new Date(),
      actor: new Types.ObjectId(customerId),
      note: `Khách hàng đã chấp thuận báo giá mới, thanh toán phần chênh lệch ${extraAmount.toLocaleString('vi-VN')} đ${
        accountUpdated ? ' và gửi lại thông tin tài khoản game đúng mức Rank' : ''
      }. Đơn hàng tiếp tục cày.`,
    });

    await order.save();

    // Thông báo cho Booster
    if (order.boosterId) {
      const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
      this.notificationsService
        .notifyUser({
          userId: order.boosterId,
          title: accountUpdated
            ? '🎉 Khách đã bù phí & gửi lại tài khoản game!'
            : '🎉 Khách hàng đã thanh toán chênh lệch Rank!',
          message: accountUpdated
            ? `Khách hàng đơn #${orderCodeDisplay} đã bù ${extraAmount.toLocaleString('vi-VN')} đ và cập nhật lại thông tin đăng nhập tài khoản đúng Rank. Vui lòng kiểm tra thông tin mới và tiến hành cày ngay!`
            : `Khách hàng đơn #${orderCodeDisplay} đã bù ${extraAmount.toLocaleString('vi-VN')} đ cho Rank thực tế. Bạn có thể tiếp tục tiến hành cày ngay!`,
          type: 'ORDER_UPDATE',
          variant: 'success',
          link: `/orders/${order._id}`,
        })
        .catch(() => {});
    }

    this.chatGateway.broadcastBoosterJobsUpdated();

    return {
      success: true,
      message: accountUpdated
        ? 'Đã thanh toán chênh lệch và cập nhật lại tài khoản game cho Booster!'
        : 'Đã xác nhận báo giá mới và thanh toán phần chênh lệch thành công!',
      order,
    };
  }

  /**
   * Khách hàng hoặc Admin hủy đơn do sai lệch rank
   */
  async cancelMismatchOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    const user = await this.userModel.findById(userId).select('role').lean();
    const isCustomer = order.customerId?.toString() === userId;
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isCustomer && !isAdmin) {
      throw new ForbiddenException('Chỉ khách hàng hoặc Quản trị viên mới có thể hủy đơn sai lệch rank');
    }

    if (order.status !== OrderStatus.RANK_MISMATCH) {
      throw new BadRequestException('Đơn hàng không ở trạng thái sai lệch rank');
    }

    // Hoàn tiền cọc về ví cho khách
    const refundAmount = order.pricing?.deposit_amount || order.pricing?.total_amount || 0;
    if (refundAmount > 0) {
      const customer = await this.userModel.findById(order.customerId);
      if (customer) {
        customer.wallet_balance += refundAmount;
        await customer.save();

        await this.transactionModel.create({
          userId: customer._id,
          orderId: order._id,
          type: TransactionType.REFUND,
          amount: refundAmount,
          balanceAfter: customer.wallet_balance,
          status: TransactionStatus.SUCCESS,
          description: `Hoàn tiền cọc hủy đơn do sai lệch rank #${order.orderCode || order._id.toString().slice(-6)}: ${reason || 'Khách từ chối giá mới'}`,
        });
      }
    }

    order.status = OrderStatus.CANCELLED;
    if (order.mismatch_info) {
      order.mismatch_info.resolvedAt = new Date();
      order.mismatch_info.resolutionAction = 'CANCELLED';
      if (reason) {
        order.mismatch_info.note =
          (order.mismatch_info.note ? order.mismatch_info.note + ' | ' : '') + `Lý do hủy: ${reason}`;
      }
    }

    if (!order.timeline) order.timeline = [];
    order.timeline.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      actor: new Types.ObjectId(userId),
      note: `Hủy đơn do sai lệch rank: ${reason || 'Khách hàng không đồng ý báo giá mới'}. Đã hoàn ${refundAmount.toLocaleString('vi-VN')} đ về ví khách.`,
    });

    await order.save();

    // Thông báo cho Booster
    if (order.boosterId) {
      const orderCodeDisplay = order.orderCode || order._id.toString().slice(-6).toUpperCase();
      this.notificationsService
        .notifyUser({
          userId: order.boosterId,
          title: 'Đơn hàng đã bị hủy do sai lệch rank',
          message: `Đơn hàng #${orderCodeDisplay} đã được hủy và hoàn tiền lại cho khách hàng.`,
          type: 'ORDER_UPDATE',
          variant: 'info',
          link: `/orders/${order._id}`,
        })
        .catch(() => {});
    }

    this.chatGateway.broadcastBoosterJobsUpdated();

    return {
      success: true,
      message: 'Đã hủy đơn hàng và hoàn lại tiền cọc về ví',
      order,
    };
  }
}
