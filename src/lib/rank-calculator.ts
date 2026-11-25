// src/lib/rank-calculator.ts
import {
  AOV_RANK_LADDER,
  AOV_STAR_TIERS,
  getAovRankImageByInput,
} from './aov';

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

// 25 mốc rank chuẩn Valorant từ Iron 1 đến Radiant
export const VALORANT_RANK_STEPS: RankDivision[] = [
  // SẮT (IRON)
  { id: 'IRON_1', tier: 'IRON', division: '1', label: 'Iron 1', stepPrice: 25000 },
  { id: 'IRON_2', tier: 'IRON', division: '2', label: 'Iron 2', stepPrice: 25000 },
  { id: 'IRON_3', tier: 'IRON', division: '3', label: 'Iron 3', stepPrice: 30000 },

  // ĐỒNG (BRONZE)
  { id: 'BRONZE_1', tier: 'BRONZE', division: '1', label: 'Bronze 1', stepPrice: 30000 },
  { id: 'BRONZE_2', tier: 'BRONZE', division: '2', label: 'Bronze 2', stepPrice: 30000 },
  { id: 'BRONZE_3', tier: 'BRONZE', division: '3', label: 'Bronze 3', stepPrice: 35000 },

  // BẠC (SILVER)
  { id: 'SILVER_1', tier: 'SILVER', division: '1', label: 'Silver 1', stepPrice: 35000 },
  { id: 'SILVER_2', tier: 'SILVER', division: '2', label: 'Silver 2', stepPrice: 40000 },
  { id: 'SILVER_3', tier: 'SILVER', division: '3', label: 'Silver 3', stepPrice: 45000 },

  // VÀNG (GOLD)
  { id: 'GOLD_1', tier: 'GOLD', division: '1', label: 'Gold 1', stepPrice: 45000 },
  { id: 'GOLD_2', tier: 'GOLD', division: '2', label: 'Gold 2', stepPrice: 50000 },
  { id: 'GOLD_3', tier: 'GOLD', division: '3', label: 'Gold 3', stepPrice: 55000 },

  // BẠCH KIM (PLATINUM)
  { id: 'PLATINUM_1', tier: 'PLATINUM', division: '1', label: 'Platinum 1', stepPrice: 60000 },
  { id: 'PLATINUM_2', tier: 'PLATINUM', division: '2', label: 'Platinum 2', stepPrice: 65000 },
  { id: 'PLATINUM_3', tier: 'PLATINUM', division: '3', label: 'Platinum 3', stepPrice: 75000 },

  // KIM CƯƠNG (DIAMOND)
  { id: 'DIAMOND_1', tier: 'DIAMOND', division: '1', label: 'Diamond 1', stepPrice: 85000 },
  { id: 'DIAMOND_2', tier: 'DIAMOND', division: '2', label: 'Diamond 2', stepPrice: 95000 },
  { id: 'DIAMOND_3', tier: 'DIAMOND', division: '3', label: 'Diamond 3', stepPrice: 110000 },

  // HUYỀN THOẠI (ASCENDANT)
  { id: 'ASCENDANT_1', tier: 'ASCENDANT', division: '1', label: 'Ascendant 1', stepPrice: 130000 },
  { id: 'ASCENDANT_2', tier: 'ASCENDANT', division: '2', label: 'Ascendant 2', stepPrice: 150000 },
  { id: 'ASCENDANT_3', tier: 'ASCENDANT', division: '3', label: 'Ascendant 3', stepPrice: 180000 },

  // BẤT TỬ (IMMORTAL)
  { id: 'IMMORTAL_1', tier: 'IMMORTAL', division: '1', label: 'Immortal 1', stepPrice: 220000 },
  { id: 'IMMORTAL_2', tier: 'IMMORTAL', division: '2', label: 'Immortal 2', stepPrice: 280000 },
  { id: 'IMMORTAL_3', tier: 'IMMORTAL', division: '3', label: 'Immortal 3', stepPrice: 350000 },

  // RADIANT (Đỉnh cao Valorant)
  { id: 'RADIANT', tier: 'RADIANT', label: 'Radiant', stepPrice: 0 },
];

// 29 mốc rank chuẩn Liên Quân Mobile (AOV) từ Đồng III đến Huyền Thoại (100★)
// Đồng->Bạc: 25k | Bạc->Vàng: 45k | Vàng->Bạch Kim: 55k | Bạch Kim->Kim Cương: 65k | Kim Cương->Tinh Anh: 95k | Tinh Anh->Cao Thủ: 160k
// Từ Cao Thủ trở lên: Booster tùy chỉnh cấu hình
export const AOV_RANK_STEPS: RankDivision[] = AOV_RANK_LADDER.map((step) => ({
  id: step.id,
  tier: step.tier,
  division: step.division,
  label: step.label,
  stepPrice: step.stepPrice,
}));

export interface PointBoostTierSegment {
  id: string;
  label: string;
  shortLabel: string;
  defaultPrice: number;
  unit: string; // 'RR' | 'LP' | 'Sao'
  desc: string;
  badgeColor: string;
  image?: string;
}

export const VALORANT_POINT_TIERS: PointBoostTierSegment[] = [
  {
    id: 'immortal1_2',
    label: 'Immortal 1 → Immortal 2',
    shortLabel: 'Immortal 1 ➔ 2',
    defaultPrice: 5000,
    unit: 'RR',
    desc: 'Phân khúc leo điểm Immortal 1',
    badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  },
  {
    id: 'immortal2_3',
    label: 'Immortal 2 → Immortal 3',
    shortLabel: 'Immortal 2 ➔ 3',
    defaultPrice: 7000,
    unit: 'RR',
    desc: 'Phân khúc leo điểm Immortal 2',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 'immortal3_radiant',
    label: 'Immortal 3 → Radiant',
    shortLabel: 'Immortal 3 ➔ Radiant',
    defaultPrice: 10000,
    unit: 'RR',
    desc: 'Bứt phá đỉnh cao Radiant',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'radiant_top100',
    label: 'Radiant → Top 100',
    shortLabel: 'Radiant Top 100',
    defaultPrice: 20000,
    unit: 'RR',
    desc: 'Top 100 Leaderboard Vùng',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
];

export const LOL_POINT_TIERS: PointBoostTierSegment[] = [
  {
    id: 'master',
    label: 'Cao Thủ (Master)',
    shortLabel: 'Cao Thủ',
    defaultPrice: 1000,
    unit: 'LP',
    desc: 'Cày điểm Cao Thủ tích lũy',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'grandmaster',
    label: 'Đại Cao Thủ (Grandmaster)',
    shortLabel: 'Đại Cao Thủ',
    defaultPrice: 1500,
    unit: 'LP',
    desc: 'Duy trì & tăng điểm Đại Cao Thủ',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
  },
  {
    id: 'challenger',
    label: 'Thách Đấu (Challenger)',
    shortLabel: 'Thách Đấu',
    defaultPrice: 2000,
    unit: 'LP',
    desc: 'Chinh phục đỉnh cao Thách Đấu',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  },
];

export const AOV_POINT_TIERS: PointBoostTierSegment[] = AOV_STAR_TIERS.map((tier) => ({
  id: tier.id,
  label: tier.label,
  shortLabel: tier.shortLabel,
  defaultPrice: tier.defaultPrice,
  unit: tier.unit,
  desc: tier.desc,
  badgeColor: tier.badgeColor,
  image: tier.image,
}));

export function getPointBoostTiers(gameCode: string): PointBoostTierSegment[] {
  const code = (gameCode || 'LOL').toUpperCase();
  if (code === 'VALORANT') return VALORANT_POINT_TIERS;
  if (code === 'AOV' || code === 'LIENQUAN' || code === 'ARENA_OF_VALOR') return AOV_POINT_TIERS;
  return LOL_POINT_TIERS;
}

export function getRankSteps(gameCode: string): RankDivision[] {
  const code = (gameCode || 'LOL').toUpperCase();
  if (code === 'VALORANT') return VALORANT_RANK_STEPS;
  if (code === 'AOV' || code === 'LIENQUAN' || code === 'ARENA_OF_VALOR') return AOV_RANK_STEPS;
  return LOL_RANK_STEPS;
}

export function getRankImage(gameCode: string, step: RankDivision | any): string {
  const code = (gameCode || 'LOL').toUpperCase();
  if (code === 'VALORANT') {
    if (step.tier === 'RADIANT') return '/images/valorant/Radiant_Rank.png';
    const capTier = step.tier.charAt(0).toUpperCase() + step.tier.slice(1).toLowerCase();
    return `/images/valorant/${capTier}_${step.division || '1'}_Rank.png`;
  }
  if (code === 'AOV' || code === 'LIENQUAN' || code === 'ARENA_OF_VALOR') {
    return getAovRankImageByInput(step);
  }
  const tierLower = (step.tier || '').toLowerCase();
  return `/images/ranks/${tierLower || 'master'}.png`;
}

export interface AddonSelections {
  schedule?: boolean; // Đặt lịch cày
  specificRole?: boolean; // Tùy chọn vị trí / đường
  selectedRoles?: string[]; // Danh sách vị trí/đường đã chọn (VD: ['top', 'jungle'] hoặc ['random'])
  specificChamps?: boolean; // Tùy chọn tướng (+30%)
  livestream?: boolean; // Xem trực tiếp (+349.000đ)
  flash?: boolean; // Cày siêu tốc (+35%)
  duo?: boolean; // Chơi cùng Booster (+50%)
}

export interface BoosterAddonConfig {
  specificRole?: { enabled: boolean; percent: number }; // mặc định { enabled: true, percent: 25 }
  schedule?: { enabled: boolean; percent: number }; // mặc định { enabled: true, percent: 20 }
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
  rankSteps,
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
  rankSteps?: RankDivision[];
  lpGainMultiplier?: number;
  addons?: AddonSelections;
  boosterPriceMultiplier?: number;
  depositPercent?: number;
  tierPrices?: BoosterTierPrices;
  stepOverrides?: Record<string, number>;
  addonsConfig?: BoosterAddonConfig;
}): CalculationResult {
  const steps = rankSteps && rankSteps.length > 0 ? rankSteps : LOL_RANK_STEPS;
  const currentIndex = steps.findIndex((r) => r.id === currentRankId);
  const desiredIndex = steps.findIndex((r) => r.id === desiredRankId);

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
    const fromRank = steps[i];
    const toRank = steps[i + 1];

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
  const roleCfg = addonsConfig?.specificRole ?? { enabled: true, percent: 25 };
  const scheduleCfg = addonsConfig?.schedule ?? { enabled: true, percent: 20 };
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
  if (addons.specificRole && roleCfg.enabled) {
    addonPercentage += (roleCfg.percent ?? 25) / 100;
  }
  if (addons.schedule && scheduleCfg.enabled) {
    addonPercentage += (scheduleCfg.percent ?? 20) / 100;
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
