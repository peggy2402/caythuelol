import { Injectable, BadRequestException } from '@nestjs/common';
import { PricingModel, AddonPricingType, CalculationBase } from '../../database/schemas/GameServiceTemplate';
import { IOrderSnapshot, SettlementStatus } from '../../database/schemas/Order';
import {
  AOV_RANK_IMAGES,
  AOV_RANK_LADDER,
  AOV_STAR_TIERS,
  AOV_TIER_PACKAGES,
  DEFAULT_AOV_STAR_RATES,
  calculateAovStarPricing,
} from '../../common/aov.config';

export interface QuoteRequest {
  pricingModel: PricingModel | string;
  initialState: {
    rankId?: string;
    lp?: number;
    quantity?: number;
  };
  targetState: {
    rankId?: string;
    lp?: number;
    quantity?: number;
  };
  ladderSteps?: Array<{ id: string; tier: string; label: string; stepPrice: number }>;
  multiplier?: number;
  tierPrices?: Record<string, number>;
  stepOverrides?: Record<string, number>;
  unitPrice?: number;
  unitPricesByRank?: Record<string, number>;
  packagePrice?: number;
  lpGainMultiplier?: number;
  selectedAddons?: Array<{
    slug: string;
    name: string;
    pricingType: AddonPricingType | string;
    price: number;
    calculationBase?: CalculationBase | string;
    isEnabled?: boolean;
  }>;
  depositPercent?: number;
}

export interface QuoteResult {
  basePrice: number;
  addonsCost: number;
  addonsBreakdown: Array<{
    slug: string;
    name: string;
    pricingType: string;
    price: number;
    calculationBase: string;
    cost: number;
  }>;
  totalPrice: number;
  depositAmount: number;
  stepsCount: number;
  stepsBreakdown: Array<{ from: string; to: string; price: number }>;
}

export interface SettlementRequest {
  snapshot: IOrderSnapshot;
  actualState: {
    rankId?: string;
    lp?: number;
    reportedAt?: Date;
    note?: string;
  };
  customerApprovedOverTarget?: boolean;
}

export interface SettlementResult {
  actualAmount: number;
  depositAmount: number;
  additionalPayment: number;
  refundAmount: number;
  settlementStatus: SettlementStatus;
  explanation: string;
}

@Injectable()
export class PricingEngineService {
  /**
   * Tính toán báo giá dự kiến an toàn, không sử dụng eval, xác thực chặt chẽ đầu vào
   */
  calculateQuote(req: QuoteRequest): QuoteResult {
    const {
      pricingModel,
      initialState,
      targetState,
      ladderSteps = [],
      multiplier = 1.0,
      tierPrices = {},
      stepOverrides = {},
      unitPrice = 1000,
      packagePrice = 0,
      lpGainMultiplier = 1.0,
      selectedAddons = [],
      depositPercent = 100,
    } = req;

    let basePrice = 0;
    let stepsCount = 0;
    const stepsBreakdown: Array<{ from: string; to: string; price: number }> = [];

    // 1. TÍNH BASE PRICE THEO PRICING MODEL
    if (pricingModel === PricingModel.FIXED_TRANSITION) {
      if (!initialState.rankId || !targetState.rankId) {
        throw new BadRequestException('Vui lòng chọn Rank hiện tại và Rank mong muốn');
      }

      const currentIndex = ladderSteps.findIndex((s) => s.id === initialState.rankId);
      const desiredIndex = ladderSteps.findIndex((s) => s.id === targetState.rankId);

      if (currentIndex === -1 || desiredIndex === -1) {
        throw new BadRequestException('Mốc Rank không tồn tại trong hệ thống');
      }

      if (desiredIndex <= currentIndex) {
        throw new BadRequestException('Rank mong muốn phải cao hơn Rank hiện tại');
      }

      let rawStepTotal = 0;
      for (let i = currentIndex; i < desiredIndex; i++) {
        const fromStep = ladderSteps[i];
        const toStep = ladderSteps[i + 1];

        let stepCost: number;
        // 1.1. Ưu tiên giá override chi tiết theo từng nấc cụ thể
        if (typeof stepOverrides[fromStep.id] === 'number' && stepOverrides[fromStep.id] > 0) {
          stepCost = Math.round(stepOverrides[fromStep.id]);
        }
        // 1.2. Tiếp theo là giá theo Tier lớn
        else if (typeof tierPrices[fromStep.tier] === 'number' && tierPrices[fromStep.tier] > 0) {
          stepCost = Math.round(tierPrices[fromStep.tier]);
        }
        // 1.3. Mặc định: Giá gốc sàn nhân hệ số multiplier của booster
        else {
          stepCost = Math.round(fromStep.stepPrice * (multiplier || 1.0));
        }

        rawStepTotal += stepCost;
        stepsBreakdown.push({
          from: fromStep.label,
          to: toStep.label,
          price: stepCost,
        });
      }

      stepsCount = desiredIndex - currentIndex;
      // Áp dụng hệ số điểm cộng mỗi ván (LP Gain)
      basePrice = Math.round(rawStepTotal * (lpGainMultiplier || 1.0));
    } else if (pricingModel === PricingModel.UNIT_BASED) {
      const startLP = Math.max(0, initialState.lp || 0);
      const targetLP = Math.max(0, targetState.lp || 0);

      if (targetLP <= startLP) {
        throw new BadRequestException('Điểm mục tiêu phải lớn hơn điểm ban đầu');
      }

      const deltaLP = targetLP - startLP;
      basePrice = Math.round(deltaLP * (unitPrice || 1000));
      stepsCount = deltaLP;
    } else if (pricingModel === PricingModel.PACKAGE_BASED) {
      basePrice = Math.round(Math.max(0, packagePrice));
      stepsCount = 1;
    } else {
      basePrice = Math.round(Math.max(0, packagePrice));
      stepsCount = 1;
    }

    // 2. TÍNH PHÍ ADD-ONS
    let totalAddonsCost = 0;
    const addonsBreakdown: Array<{
      slug: string;
      name: string;
      pricingType: string;
      price: number;
      calculationBase: string;
      cost: number;
    }> = [];

    for (const addon of selectedAddons) {
      if (addon.isEnabled === false) continue;

      let cost = 0;
      const baseCalc = addon.calculationBase || CalculationBase.BASE_PRICE;

      if (addon.pricingType === AddonPricingType.PERCENTAGE) {
        // Tỷ lệ % tính trên Base Price
        const pct = Math.max(0, addon.price || 0) / 100;
        cost = Math.round(basePrice * pct);
      } else {
        // Số tiền cố định
        cost = Math.round(Math.max(0, addon.price || 0));
      }

      totalAddonsCost += cost;
      addonsBreakdown.push({
        slug: addon.slug,
        name: addon.name,
        pricingType: addon.pricingType,
        price: addon.price,
        calculationBase: baseCalc,
        cost,
      });
    }

    const totalPrice = basePrice + totalAddonsCost;
    const safeDepositPercent = Math.max(10, Math.min(100, depositPercent || 100));
    const depositAmount = Math.round(totalPrice * (safeDepositPercent / 100));

    return {
      basePrice,
      addonsCost: totalAddonsCost,
      addonsBreakdown,
      totalPrice,
      depositAmount,
      stepsCount,
      stepsBreakdown,
    };
  }

  /**
   * Tính toán Settlement (Quyết toán thực tế) dựa trên OrderSnapshot và kết quả thực tế
   * Tuân thủ 100% mục 8 của Prompt đặc tả nghiệp vụ:
   * 8.1: Đạt đúng mục tiêu
   * 8.2: Chưa đạt mục tiêu (Pro-rata)
   * 8.3: Cày vượt mục tiêu (Kiểm tra Over-target Policy)
   * 8.4: Cày tụt điểm (Delta <= 0 -> Actual = 0, hoàn tiền cọc, không ghi nhận tiền công âm)
   */
  calculateSettlement(req: SettlementRequest): SettlementResult {
    const { snapshot, actualState, customerApprovedOverTarget = false } = req;
    const depositAmount = snapshot.depositAmount;
    const addonsCost = snapshot.addonsSnapshot?.reduce((sum, a) => sum + (a.cost || 0), 0) || 0;

    let actualBaseAmount = 0;
    let explanation = '';

    // ==========================================
    // 1. settlement CHO UNIT_BASED (Ví dụ: Cày LP)
    // ==========================================
    if (snapshot.pricingModel === PricingModel.UNIT_BASED) {
      const initialLP = snapshot.initialState.lp ?? 0;
      const targetLP = snapshot.targetState.lp ?? 0;
      const actualLP = actualState.lp ?? initialLP;
      const unitPrice = snapshot.unitPrice || 1000;

      const deltaLP = actualLP - initialLP;
      const targetDelta = targetLP - initialLP;

      // 8.4: Cày tụt điểm (Delta LP <= 0)
      if (deltaLP <= 0) {
        actualBaseAmount = 0;
        explanation = `Booster cày tụt điểm (${initialLP} LP -> ${actualLP} LP). Hoàn lại 100% tiền cọc cho khách hàng.`;
        return {
          actualAmount: 0,
          depositAmount,
          additionalPayment: 0,
          refundAmount: depositAmount,
          settlementStatus: SettlementStatus.REFUND_NEEDED,
          explanation,
        };
      }

      // 8.3: Cày vượt mục tiêu (actualLP > targetLP)
      if (actualLP > targetLP) {
        const overTargetPolicy = snapshot.overTargetPolicySnapshot || {
          allowOverTarget: false,
          maxOverTargetUnits: 0,
          chargeOverTarget: false,
        };

        if (customerApprovedOverTarget && overTargetPolicy.chargeOverTarget) {
          const maxAllowed = overTargetPolicy.maxOverTargetUnits
            ? targetLP + overTargetPolicy.maxOverTargetUnits
            : actualLP;
          const billedLP = Math.min(actualLP, maxAllowed);
          actualBaseAmount = (billedLP - initialLP) * unitPrice;
          explanation = `Hoàn thành vượt mục tiêu (${actualLP}/${targetLP} LP) với sự đồng ý của khách hàng. Tính tiền tối đa ${billedLP} LP.`;
        } else {
          // Khách chưa đồng ý tính thêm tiền vượt: chỉ tính tối đa đến targetLP
          actualBaseAmount = targetDelta * unitPrice;
          explanation = `Cày vượt mục tiêu (${actualLP} LP so với mốc ${targetLP} LP). Chỉ tính tiền đúng mốc thỏa thuận theo quy định sàn.`;
        }
      }
      // 8.1 & 8.2: Đạt đúng hoặc chưa đạt mục tiêu
      else {
        actualBaseAmount = deltaLP * unitPrice;
        if (actualLP === targetLP) {
          explanation = `Hoàn thành chính xác 100% mục tiêu (${actualLP}/${targetLP} LP).`;
        } else {
          explanation = `Hoàn thành một phần (${deltaLP}/${targetDelta} LP). Quyết toán theo tỷ lệ thực tế.`;
        }
      }
    }
    // ==========================================
    // 2. settlement CHO FIXED_TRANSITION / KHÁC
    // ==========================================
    else {
      // Mặc định hoàn thành trọn gói
      actualBaseAmount = snapshot.estimatedAmount - addonsCost;
      explanation = `Hoàn thành dịch vụ cày theo bậc rank thỏa thuận.`;
    }

    const actualTotalAmount = Math.max(0, actualBaseAmount + addonsCost);
    const diff = actualTotalAmount - depositAmount;

    let additionalPayment = 0;
    let refundAmount = 0;
    let settlementStatus: SettlementStatus;

    if (diff > 0) {
      additionalPayment = diff;
      refundAmount = 0;
      settlementStatus = SettlementStatus.CUSTOMER_OWES;
      explanation += ` Khách hàng cần thanh toán thêm ${additionalPayment.toLocaleString('vi-VN')} đ phần còn lại.`;
    } else if (diff < 0) {
      additionalPayment = 0;
      refundAmount = Math.abs(diff);
      settlementStatus = SettlementStatus.REFUND_NEEDED;
      explanation += ` Hoàn lại ${refundAmount.toLocaleString('vi-VN')} đ tiền cọc dư cho khách hàng.`;
    } else {
      additionalPayment = 0;
      refundAmount = 0;
      settlementStatus = SettlementStatus.SETTLED;
      explanation += ` Đã khớp 100% số tiền cọc. Đơn hàng hoàn tất quyết toán.`;
    }

    return {
      actualAmount: actualTotalAmount,
      depositAmount,
      additionalPayment,
      refundAmount,
      settlementStatus,
      explanation,
    };
  }

  /**
   * Trả cấu hình mặc định chuẩn của module Liên Quân Mobile (AOV):
   * - Bảng bậc rank (Đồng -> Cao Thủ & mốc Cao Thủ trở lên cho Booster tùy chỉnh)
   * - Các gói trọn bậc (Đồng-Bạc 25k, Bạc-Vàng 45k, Vàng-Bạch Kim 55k, Bạch Kim-Kim Cương 65k, Kim Cương-Tinh Anh 95k, Tinh Anh-Cao Thủ 160k)
   * - Các mốc giá theo Sao (Đồng-KC 5k/sao -> Chiến Tướng 50-99* 30k/sao -> 100*+)
   */
  getAovDefaults() {
    return {
      rankImages: AOV_RANK_IMAGES,
      rankLadder: AOV_RANK_LADDER,
      tierPackages: AOV_TIER_PACKAGES,
      starTiers: AOV_STAR_TIERS,
      defaultStarRates: DEFAULT_AOV_STAR_RATES,
    };
  }

  /**
   * Báo giá chuyên biệt cho Liên Quân Mobile (AOV) theo 2 chế độ:
   * - mode = 'RANK': tính theo bậc Rank (có hỗ trợ stepOverrides & tierPrices của Booster)
   * - mode = 'STAR': tính theo số Sao (hỗ trợ cả bậc thấp lẫn tự động lũy tiến Cao Thủ 0* -> 100*+)
   */
  calculateAovQuote(input: {
    mode: 'RANK' | 'STAR';
    currentRankId?: string;
    desiredRankId?: string;
    stepOverrides?: Record<string, number>;
    tierPrices?: Record<string, number>;
    multiplier?: number;
    segmentId?: string;
    currentStars?: number;
    desiredStars?: number;
    tierRates?: Record<string, number>;
    selectedAddons?: QuoteRequest['selectedAddons'];
    depositPercent?: number;
  }) {
    if (input.mode === 'STAR') {
      const starCalc = calculateAovStarPricing(
        input.segmentId || 'bronze_diamond',
        input.currentStars ?? 0,
        input.desiredStars ?? 0,
        input.tierRates,
      );

      if (starCalc.totalStars <= 0) {
        throw new BadRequestException('Số sao mong muốn phải lớn hơn số sao hiện tại');
      }

      const quote = this.calculateQuote({
        pricingModel: PricingModel.PACKAGE_BASED,
        initialState: { lp: input.currentStars ?? 0 },
        targetState: { lp: input.desiredStars ?? 0 },
        packagePrice: starCalc.basePrice,
        selectedAddons: input.selectedAddons || [],
        depositPercent: input.depositPercent ?? 40,
      });

      return {
        ...quote,
        mode: 'STAR',
        totalStars: starCalc.totalStars,
        effectiveUnitPrice: starCalc.effectiveUnitPrice,
        isProgressive: starCalc.isProgressive,
        starBreakdown: starCalc.breakdown,
      };
    }

    const quote = this.calculateQuote({
      pricingModel: PricingModel.FIXED_TRANSITION,
      initialState: { rankId: input.currentRankId },
      targetState: { rankId: input.desiredRankId },
      ladderSteps: AOV_RANK_LADDER,
      stepOverrides: input.stepOverrides || {},
      tierPrices: input.tierPrices || {},
      multiplier: input.multiplier || 1.0,
      lpGainMultiplier: 1.0,
      selectedAddons: input.selectedAddons || [],
      depositPercent: input.depositPercent ?? 100,
    });

    return {
      ...quote,
      mode: 'RANK',
    };
  }
}
