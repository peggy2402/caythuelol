// src/lib/rank-calculator.ts

export interface RankDivision {
  id: string; // VD: 'IRON_4', 'GOLD_2', 'MASTER'
  tier: string; // 'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER'
  division?: string; // 'IV', 'III', 'II', 'I'
  label: string; // 'Sắt IV', 'Vàng II', 'Cao Thủ'
  stepPrice: number; // Giá để nhảy từ bậc này lên bậc kế tiếp (VNĐ)
}

// 29 mốc rank chuẩn từ Sắt IV đến Cao Thủ
export const LOL_RANK_STEPS: RankDivision[] = [
  // SẮT
  { id: 'IRON_4', tier: 'IRON', division: 'IV', label: 'Sắt IV', stepPrice: 20000 },
  { id: 'IRON_3', tier: 'IRON', division: 'III', label: 'Sắt III', stepPrice: 20000 },
  { id: 'IRON_2', tier: 'IRON', division: 'II', label: 'Sắt II', stepPrice: 20000 },
  { id: 'IRON_1', tier: 'IRON', division: 'I', label: 'Sắt I', stepPrice: 25000 },

  // ĐỒNG
  { id: 'BRONZE_4', tier: 'BRONZE', division: 'IV', label: 'Đồng IV', stepPrice: 25000 },
  { id: 'BRONZE_3', tier: 'BRONZE', division: 'III', label: 'Đồng III', stepPrice: 25000 },
  { id: 'BRONZE_2', tier: 'BRONZE', division: 'II', label: 'Đồng II', stepPrice: 25000 },
  { id: 'BRONZE_1', tier: 'BRONZE', division: 'I', label: 'Đồng I', stepPrice: 30000 },

  // BẠC
  { id: 'SILVER_4', tier: 'SILVER', division: 'IV', label: 'Bạc IV', stepPrice: 30000 },
  { id: 'SILVER_3', tier: 'SILVER', division: 'III', label: 'Bạc III', stepPrice: 30000 },
  { id: 'SILVER_2', tier: 'SILVER', division: 'II', label: 'Bạc II', stepPrice: 30000 },
  { id: 'SILVER_1', tier: 'SILVER', division: 'I', label: 'Bạc I', stepPrice: 35000 },

  // VÀNG
  { id: 'GOLD_4', tier: 'GOLD', division: 'IV', label: 'Vàng IV', stepPrice: 40000 },
  { id: 'GOLD_3', tier: 'GOLD', division: 'III', label: 'Vàng III', stepPrice: 40000 },
  { id: 'GOLD_2', tier: 'GOLD', division: 'II', label: 'Vàng II', stepPrice: 40000 },
  { id: 'GOLD_1', tier: 'GOLD', division: 'I', label: 'Vàng I', stepPrice: 50000 },

  // BẠCH KIM
  { id: 'PLATINUM_4', tier: 'PLATINUM', division: 'IV', label: 'Bạch Kim IV', stepPrice: 55000 },
  { id: 'PLATINUM_3', tier: 'PLATINUM', division: 'III', label: 'Bạch Kim III', stepPrice: 55000 },
  { id: 'PLATINUM_2', tier: 'PLATINUM', division: 'II', label: 'Bạch Kim II', stepPrice: 55000 },
  { id: 'PLATINUM_1', tier: 'PLATINUM', division: 'I', label: 'Bạch Kim I', stepPrice: 65000 },

  // LỤC BẢO
  { id: 'EMERALD_4', tier: 'EMERALD', division: 'IV', label: 'Lục Bảo IV', stepPrice: 75000 },
  { id: 'EMERALD_3', tier: 'EMERALD', division: 'III', label: 'Lục Bảo III', stepPrice: 75000 },
  { id: 'EMERALD_2', tier: 'EMERALD', division: 'II', label: 'Lục Bảo II', stepPrice: 75000 },
  { id: 'EMERALD_1', tier: 'EMERALD', division: 'I', label: 'Lục Bảo I', stepPrice: 95000 },

  // KIM CƯƠNG
  { id: 'DIAMOND_4', tier: 'DIAMOND', division: 'IV', label: 'Kim Cương IV', stepPrice: 120000 },
  { id: 'DIAMOND_3', tier: 'DIAMOND', division: 'III', label: 'Kim Cương III', stepPrice: 140000 },
  { id: 'DIAMOND_2', tier: 'DIAMOND', division: 'II', label: 'Kim Cương II', stepPrice: 170000 },
  { id: 'DIAMOND_1', tier: 'DIAMOND', division: 'I', label: 'Kim Cương I', stepPrice: 220000 },

  // CAO THỦ (Mốc đích cao nhất của cày bậc rank)
  { id: 'MASTER', tier: 'MASTER', label: 'Cao Thủ', stepPrice: 0 },
];

export interface AddonSelections {
  schedule?: boolean; // Đặt lịch cày
  specificRole?: boolean; // Tùy chọn vị trí / đường
  specificChamps?: boolean; // Tùy chọn tướng (+30%)
  livestream?: boolean; // Xem trực tiếp (+349.000đ)
  flash?: boolean; // Cày siêu tốc (+35%)
  duo?: boolean; // Chơi cùng Booster (+50%)
}

export interface BoosterAddonConfig {
  specificChamps?: { enabled: boolean; percent: number }; // mặc định { enabled: true, percent: 30 }
  livestream?: { enabled: boolean; fee: number }; // mặc định { enabled: true, fee: 349000 }
  flash?: { enabled: boolean; percent: number }; // mặc định { enabled: true, percent: 35 }
  duo?: { enabled: boolean; percent: number }; // mặc định { enabled: true, percent: 50 }
}

export interface BoosterTierPrices {
  IRON?: number;
  BRONZE?: number;
  SILVER?: number;
  GOLD?: number;
  PLATINUM?: number;
  EMERALD?: number;
  DIAMOND?: number;
}

export interface CalculationResult {
  basePrice: number;
  stepsCount: number;
  addonsCost: number;
  totalPrice: number;
  depositAmount: number; // Số tiền cọc cần trả trước
  stepsBreakdown: { from: string; to: string; price: number }[];
}

/**
 * Tính toán tổng chi phí cày rank bước nhảy từ Rank A đến Rank B
 */
export function calculateRankBoost({
  currentRankId,
  desiredRankId,
  lpGainMultiplier = 1.0,
  addons = {},
  boosterPriceMultiplier = 1.0,
  depositPercent = 100,
  tierPrices,
  stepOverrides,
  addonsConfig,
}: {
  currentRankId: string;
  desiredRankId: string;
  lpGainMultiplier?: number;
  addons?: AddonSelections;
  boosterPriceMultiplier?: number;
  depositPercent?: number;
  tierPrices?: BoosterTierPrices;
  stepOverrides?: Record<string, number>;
  addonsConfig?: BoosterAddonConfig;
}): CalculationResult {
  const currentIndex = LOL_RANK_STEPS.findIndex((r) => r.id === currentRankId);
  const desiredIndex = LOL_RANK_STEPS.findIndex((r) => r.id === desiredRankId);

  if (currentIndex === -1 || desiredIndex === -1 || desiredIndex <= currentIndex) {
    return {
      basePrice: 0,
      stepsCount: 0,
      addonsCost: 0,
      totalPrice: 0,
      depositAmount: 0,
      stepsBreakdown: [],
    };
  }

  let rawBasePrice = 0;
  const stepsBreakdown: { from: string; to: string; price: number }[] = [];

  for (let i = currentIndex; i < desiredIndex; i++) {
    const fromRank = LOL_RANK_STEPS[i];
    const toRank = LOL_RANK_STEPS[i + 1];

    let stepCost: number;
    // 1. Ưu tiên giá override chi tiết theo từng nấc cụ thể
    if (stepOverrides && typeof stepOverrides[fromRank.id] === 'number' && stepOverrides[fromRank.id] > 0) {
      stepCost = Math.round(stepOverrides[fromRank.id]);
    }
    // 2. Tiếp theo là giá theo Tier lớn nếu booster có cấu hình
    else if (tierPrices && typeof (tierPrices as any)[fromRank.tier] === 'number' && (tierPrices as any)[fromRank.tier] > 0) {
      stepCost = Math.round((tierPrices as any)[fromRank.tier]);
    }
    // 3. Mặc định: Giá gốc sàn nhân hệ số multiplier của booster
    else {
      stepCost = Math.round(fromRank.stepPrice * (boosterPriceMultiplier || 1.0));
    }

    rawBasePrice += stepCost;
    stepsBreakdown.push({
      from: fromRank.label,
      to: toRank.label,
      price: stepCost,
    });
  }

  // Áp dụng hệ số điểm cộng mỗi ván
  const adjustedBasePrice = Math.round(rawBasePrice * lpGainMultiplier);

  // Tính phí các tùy chọn mở rộng theo cấu hình riêng của booster
  let addonPercentage = 0;
  let addonFlatFee = 0;

  const duoCfg = addonsConfig?.duo ?? { enabled: true, percent: 50 };
  const flashCfg = addonsConfig?.flash ?? { enabled: true, percent: 35 };
  const champsCfg = addonsConfig?.specificChamps ?? { enabled: true, percent: 30 };
  const liveCfg = addonsConfig?.livestream ?? { enabled: true, fee: 349000 };

  if (addons.duo && duoCfg.enabled) {
    addonPercentage += (duoCfg.percent ?? 50) / 100;
  }
  if (addons.flash && flashCfg.enabled) {
    addonPercentage += (flashCfg.percent ?? 35) / 100;
  }
  if (addons.specificChamps && champsCfg.enabled) {
    addonPercentage += (champsCfg.percent ?? 30) / 100;
  }
  if (addons.livestream && liveCfg.enabled) {
    addonFlatFee += (liveCfg.fee ?? 349000);
  }

  const percentageAddonCost = Math.round(adjustedBasePrice * addonPercentage);
  const totalAddonsCost = percentageAddonCost + addonFlatFee;

  const totalPrice = adjustedBasePrice + totalAddonsCost;
  const depositRatio = Math.max(0.1, Math.min(1.0, (depositPercent || 100) / 100));
  const depositAmount = Math.round(totalPrice * depositRatio);

  return {
    basePrice: adjustedBasePrice,
    stepsCount: desiredIndex - currentIndex,
    addonsCost: totalAddonsCost,
    totalPrice,
    depositAmount,
    stepsBreakdown,
  };
}
