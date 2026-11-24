// src/lib/aov.ts
// Module cấu hình chuẩn Liên Quân Mobile (Arena of Valor - AOV)
// Hỗ trợ 2 hình thức tính giá mặc định (Booster có thể tự tùy chỉnh):
// 1. Theo Bậc Rank (Đồng -> Cao Thủ và từ Cao Thủ trở lên Booster tùy chỉnh)
// 2. Theo Số Sao (Đồng-Kim Cương: 5k/sao -> Chiến Tướng 50-99*: 30k/sao -> 100*+)

export interface AovRankStep {
  id: string;
  tier:
    | 'BRONZE'
    | 'SILVER'
    | 'GOLD'
    | 'PLATINUM'
    | 'DIAMOND'
    | 'VETERAN'
    | 'MASTER'
    | 'GRANDMASTER'
    | 'CONQUEROR'
    | 'LEGEND';
  division?: string;
  label: string;
  stepPrice: number; // Giá nhảy lên bậc kế tiếp (VNĐ)
  starsPerDivision?: number;
  image: string;
  isHighRank?: boolean; // Từ Cao Thủ trở lên
}

export interface AovTierPackage {
  id: string;
  fromTier: string;
  toTier: string;
  label: string;
  shortLabel: string;
  fromImage: string;
  toImage: string;
  stepIds: string[];
  defaultTotalPrice: number;
  isHighRank?: boolean;
  desc: string;
}

export interface AovStarTier {
  id: string;
  label: string;
  shortLabel: string;
  defaultPrice: number;
  unit: 'Sao';
  desc: string;
  image: string;
  badgeColor: string;
  /** Nếu là phân khúc sao liên tục từ Cao Thủ trở lên (0* -> 100*+) */
  isHighEloRange?: boolean;
  minStar?: number;
  maxStar?: number | null; // null = không giới hạn (100*+)
}

export const AOV_RANK_IMAGES = {
  BRONZE: '/images/aov/Bronze.png',
  SILVER: '/images/aov/Silver.png',
  GOLD: '/images/aov/Gold.png',
  PLATINUM: '/images/aov/Platium.png',
  DIAMOND: '/images/aov/Diamond.png',
  VETERAN: '/images/aov/Veteran.png',
  MASTER: '/images/aov/Master.png',
  GRANDMASTER_IV: '/images/aov/Grandmaster_IV.png',
  GRANDMASTER_III: '/images/aov/Grandmaster_III.png',
  GRANDMASTER_II: '/images/aov/Grandmaster_II.png',
  GRANDMASTER_I: '/images/aov/Grandmaster_I.png',
  CONQUEROR: '/images/aov/Conqueror.png',
  LEGEND: '/images/aov/Legend.png',
} as const;

/**
 * Chuẩn bậc rank Liên Quân Mobile (Garena VN):
 * - Đồng III -> Đồng I -> Bạc III: tổng 25.000đ (8k + 8k + 9k)
 * - Bạc III -> Bạc I -> Vàng IV: tổng 45.000đ (15k x 3)
 * - Vàng IV -> Vàng I -> Bạch Kim V: tổng 55.000đ (13k + 14k + 14k + 14k)
 * - Bạch Kim V -> Bạch Kim I -> Kim Cương V: tổng 65.000đ (13k x 5)
 * - Kim Cương V -> Kim Cương I -> Tinh Anh V: tổng 95.000đ (19k x 5)
 * - Tinh Anh V -> Tinh Anh I -> Cao Thủ: tổng 160.000đ (32k x 5)
 * - Từ Cao Thủ trở lên (Booster tùy chỉnh cấu hình):
 *   + Cao Thủ (0★) -> Đại Cao Thủ (20★): 260.000đ (20★ x 13k)
 *   + Đại Cao Thủ (20★) -> Chiến Tướng (50★): 600.000đ (30★ x 20k)
 *   + Chiến Tướng (50★) -> Huyền Thoại (100★): 1.500.000đ (50★ x 30k)
 */
export const AOV_RANK_LADDER: AovRankStep[] = [
  // ĐỒNG (3 đoàn: Đồng III -> Bạc III = 25.000đ)
  { id: 'BRONZE_3', tier: 'BRONZE', division: 'III', label: 'Đồng III', stepPrice: 8000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },
  { id: 'BRONZE_2', tier: 'BRONZE', division: 'II', label: 'Đồng II', stepPrice: 8000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },
  { id: 'BRONZE_1', tier: 'BRONZE', division: 'I', label: 'Đồng I', stepPrice: 9000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },

  // BẠC (3 đoàn: Bạc III -> Vàng IV = 45.000đ)
  { id: 'SILVER_3', tier: 'SILVER', division: 'III', label: 'Bạc III', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },
  { id: 'SILVER_2', tier: 'SILVER', division: 'II', label: 'Bạc II', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },
  { id: 'SILVER_1', tier: 'SILVER', division: 'I', label: 'Bạc I', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },

  // VÀNG (4 đoàn: Vàng IV -> Bạch Kim V = 55.000đ)
  { id: 'GOLD_4', tier: 'GOLD', division: 'IV', label: 'Vàng IV', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_3', tier: 'GOLD', division: 'III', label: 'Vàng III', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_2', tier: 'GOLD', division: 'II', label: 'Vàng II', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_1', tier: 'GOLD', division: 'I', label: 'Vàng I', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },

  // BẠCH KIM (5 đoàn: Bạch Kim V -> Kim Cương V = 65.000đ)
  { id: 'PLATINUM_5', tier: 'PLATINUM', division: 'V', label: 'Bạch Kim V', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_4', tier: 'PLATINUM', division: 'IV', label: 'Bạch Kim IV', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_3', tier: 'PLATINUM', division: 'III', label: 'Bạch Kim III', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_2', tier: 'PLATINUM', division: 'II', label: 'Bạch Kim II', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_1', tier: 'PLATINUM', division: 'I', label: 'Bạch Kim I', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },

  // KIM CƯƠNG (5 đoàn: Kim Cương V -> Tinh Anh V = 95.000đ)
  { id: 'DIAMOND_5', tier: 'DIAMOND', division: 'V', label: 'Kim Cương V', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_4', tier: 'DIAMOND', division: 'IV', label: 'Kim Cương IV', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_3', tier: 'DIAMOND', division: 'III', label: 'Kim Cương III', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_2', tier: 'DIAMOND', division: 'II', label: 'Kim Cương II', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_1', tier: 'DIAMOND', division: 'I', label: 'Kim Cương I', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },

  // TINH ANH (5 đoàn: Tinh Anh V -> Cao Thủ = 160.000đ)
  { id: 'VETERAN_5', tier: 'VETERAN', division: 'V', label: 'Tinh Anh V', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_4', tier: 'VETERAN', division: 'IV', label: 'Tinh Anh IV', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_3', tier: 'VETERAN', division: 'III', label: 'Tinh Anh III', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_2', tier: 'VETERAN', division: 'II', label: 'Tinh Anh II', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_1', tier: 'VETERAN', division: 'I', label: 'Tinh Anh I', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },

  // TỪ CAO THỦ TRỞ LÊN (Booster có thể tùy chỉnh cấu hình giá từng mốc)
  { id: 'MASTER', tier: 'MASTER', label: 'Cao Thủ (0★)', stepPrice: 260000, image: AOV_RANK_IMAGES.MASTER, isHighRank: true },
  { id: 'GRANDMASTER', tier: 'GRANDMASTER', label: 'Đại Cao Thủ (20★)', stepPrice: 600000, image: AOV_RANK_IMAGES.GRANDMASTER_I, isHighRank: true },
  { id: 'CONQUEROR', tier: 'CONQUEROR', label: 'Chiến Tướng (50★)', stepPrice: 1500000, image: AOV_RANK_IMAGES.CONQUEROR, isHighRank: true },
  { id: 'LEGEND', tier: 'LEGEND', label: 'Huyền Thoại (100★)', stepPrice: 0, image: AOV_RANK_IMAGES.LEGEND, isHighRank: true },
];

/**
 * Các gói cày theo bậc lớn (dùng cho cấu hình nhanh của Booster & bảng giá niêm yết)
 */
export const AOV_TIER_PACKAGES: AovTierPackage[] = [
  {
    id: 'bronze_to_silver',
    fromTier: 'BRONZE',
    toTier: 'SILVER',
    label: 'Đồng ➔ Bạc',
    shortLabel: 'Đồng → Bạc',
    fromImage: AOV_RANK_IMAGES.BRONZE,
    toImage: AOV_RANK_IMAGES.SILVER,
    stepIds: ['BRONZE_3', 'BRONZE_2', 'BRONZE_1'],
    defaultTotalPrice: 25000,
    desc: 'Trọn bậc Đồng III lên Bạc III (3 đoàn)',
  },
  {
    id: 'silver_to_gold',
    fromTier: 'SILVER',
    toTier: 'GOLD',
    label: 'Bạc ➔ Vàng',
    shortLabel: 'Bạc → Vàng',
    fromImage: AOV_RANK_IMAGES.SILVER,
    toImage: AOV_RANK_IMAGES.GOLD,
    stepIds: ['SILVER_3', 'SILVER_2', 'SILVER_1'],
    defaultTotalPrice: 45000,
    desc: 'Trọn bậc Bạc III lên Vàng IV (3 đoàn)',
  },
  {
    id: 'gold_to_platinum',
    fromTier: 'GOLD',
    toTier: 'PLATINUM',
    label: 'Vàng ➔ Bạch Kim',
    shortLabel: 'Vàng → Bạch Kim',
    fromImage: AOV_RANK_IMAGES.GOLD,
    toImage: AOV_RANK_IMAGES.PLATINUM,
    stepIds: ['GOLD_4', 'GOLD_3', 'GOLD_2', 'GOLD_1'],
    defaultTotalPrice: 55000,
    desc: 'Trọn bậc Vàng IV lên Bạch Kim V (4 đoàn)',
  },
  {
    id: 'platinum_to_diamond',
    fromTier: 'PLATINUM',
    toTier: 'DIAMOND',
    label: 'Bạch Kim ➔ Kim Cương',
    shortLabel: 'Bạch Kim → Kim Cương',
    fromImage: AOV_RANK_IMAGES.PLATINUM,
    toImage: AOV_RANK_IMAGES.DIAMOND,
    stepIds: ['PLATINUM_5', 'PLATINUM_4', 'PLATINUM_3', 'PLATINUM_2', 'PLATINUM_1'],
    defaultTotalPrice: 65000,
    desc: 'Trọn bậc Bạch Kim V lên Kim Cương V (5 đoàn)',
  },
  {
    id: 'diamond_to_veteran',
    fromTier: 'DIAMOND',
    toTier: 'VETERAN',
    label: 'Kim Cương ➔ Tinh Anh',
    shortLabel: 'Kim Cương → Tinh Anh',
    fromImage: AOV_RANK_IMAGES.DIAMOND,
    toImage: AOV_RANK_IMAGES.VETERAN,
    stepIds: ['DIAMOND_5', 'DIAMOND_4', 'DIAMOND_3', 'DIAMOND_2', 'DIAMOND_1'],
    defaultTotalPrice: 95000,
    desc: 'Trọn bậc Kim Cương V lên Tinh Anh V (5 đoàn)',
  },
  {
    id: 'veteran_to_master',
    fromTier: 'VETERAN',
    toTier: 'MASTER',
    label: 'Tinh Anh ➔ Cao Thủ',
    shortLabel: 'Tinh Anh → Cao Thủ',
    fromImage: AOV_RANK_IMAGES.VETERAN,
    toImage: AOV_RANK_IMAGES.MASTER,
    stepIds: ['VETERAN_5', 'VETERAN_4', 'VETERAN_3', 'VETERAN_2', 'VETERAN_1'],
    defaultTotalPrice: 160000,
    desc: 'Trọn bậc Tinh Anh V lên Cao Thủ (5 đoàn)',
  },
  {
    id: 'master_to_gm',
    fromTier: 'MASTER',
    toTier: 'GRANDMASTER',
    label: 'Cao Thủ (0★) ➔ Đại Cao Thủ (20★)',
    shortLabel: 'Cao Thủ → Đại Cao Thủ',
    fromImage: AOV_RANK_IMAGES.MASTER,
    toImage: AOV_RANK_IMAGES.GRANDMASTER_I,
    stepIds: ['MASTER'],
    defaultTotalPrice: 260000,
    isHighRank: true,
    desc: 'Tùy chỉnh từ Cao Thủ trở lên (mặc định 20★ × 13k/sao)',
  },
  {
    id: 'gm_to_conqueror',
    fromTier: 'GRANDMASTER',
    toTier: 'CONQUEROR',
    label: 'Đại Cao Thủ (20★) ➔ Chiến Tướng (50★)',
    shortLabel: 'Đại Cao Thủ → Chiến Tướng',
    fromImage: AOV_RANK_IMAGES.GRANDMASTER_I,
    toImage: AOV_RANK_IMAGES.CONQUEROR,
    stepIds: ['GRANDMASTER'],
    defaultTotalPrice: 600000,
    isHighRank: true,
    desc: 'Tùy chỉnh từ Cao Thủ trở lên (mặc định 30★ × 20k/sao)',
  },
  {
    id: 'conqueror_to_legend',
    fromTier: 'CONQUEROR',
    toTier: 'LEGEND',
    label: 'Chiến Tướng (50★) ➔ Huyền Thoại (100★)',
    shortLabel: 'Chiến Tướng → Huyền Thoại',
    fromImage: AOV_RANK_IMAGES.CONQUEROR,
    toImage: AOV_RANK_IMAGES.LEGEND,
    stepIds: ['CONQUEROR'],
    defaultTotalPrice: 1500000,
    isHighRank: true,
    desc: 'Tùy chỉnh từ Cao Thủ trở lên (mặc định 50★ × 30k/sao)',
  },
];

/**
 * Bảng giá cày theo SỐ SAO mặc định Liên Quân Mobile (Booster có thể tự tùy chỉnh):
 * - Đồng - Kim Cương: 5k/sao
 * - Kim Cương - Tinh Anh: 6k/sao
 * - Tinh Anh - Cao Thủ: 10k/sao
 * - Cao Thủ 0* - Đại Cao Thủ 19*: 13k/sao
 * - Đại Cao Thủ 20* - 49*: 20k/sao
 * - Chiến Tướng 50* - 99*: 30k/sao
 * - Huyền Thoại 100*+: 45k/sao (tùy chỉnh)
 */
export const AOV_STAR_TIERS: AovStarTier[] = [
  {
    id: 'bronze_diamond',
    label: 'Đồng – Kim Cương',
    shortLabel: 'Đồng ➔ Kim Cương',
    defaultPrice: 5000,
    unit: 'Sao',
    desc: 'Bậc Đồng, Bạc, Vàng, Bạch Kim',
    image: AOV_RANK_IMAGES.PLATINUM,
    badgeColor: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'diamond_veteran',
    label: 'Kim Cương – Tinh Anh',
    shortLabel: 'Kim Cương ➔ Tinh Anh',
    defaultPrice: 6000,
    unit: 'Sao',
    desc: 'Cày sao bậc Kim Cương V → I',
    image: AOV_RANK_IMAGES.DIAMOND,
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  },
  {
    id: 'veteran_master',
    label: 'Tinh Anh – Cao Thủ',
    shortLabel: 'Tinh Anh ➔ Cao Thủ',
    defaultPrice: 10000,
    unit: 'Sao',
    desc: 'Cày sao bậc Tinh Anh V → I',
    image: AOV_RANK_IMAGES.VETERAN,
    badgeColor: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'master_0_19',
    label: 'Cao Thủ 0★ – Đại Cao Thủ 19★',
    shortLabel: 'Cao Thủ (0 - 19★)',
    defaultPrice: 13000,
    unit: 'Sao',
    desc: 'Phân khúc Cao Thủ 0★ đến 19★',
    image: AOV_RANK_IMAGES.MASTER,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    isHighEloRange: true,
    minStar: 0,
    maxStar: 20,
  },
  {
    id: 'gm_20_49',
    label: 'Đại Cao Thủ 20★ – 49★',
    shortLabel: 'Đại Cao Thủ (20 - 49★)',
    defaultPrice: 20000,
    unit: 'Sao',
    desc: 'Phân khúc Đại Cao Thủ III, II, I (20★ – 49★)',
    image: AOV_RANK_IMAGES.GRANDMASTER_I,
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    isHighEloRange: true,
    minStar: 20,
    maxStar: 50,
  },
  {
    id: 'conqueror_50_99',
    label: 'Chiến Tướng 50★ – 99★',
    shortLabel: 'Chiến Tướng (50 - 99★)',
    defaultPrice: 30000,
    unit: 'Sao',
    desc: 'Phân khúc Chiến Tướng 50★ đến 99★',
    image: AOV_RANK_IMAGES.CONQUEROR,
    badgeColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
    isHighEloRange: true,
    minStar: 50,
    maxStar: 100,
  },
  {
    id: 'legend_100_plus',
    label: 'Huyền Thoại / Thách Đấu (100★+)',
    shortLabel: 'Huyền Thoại (100★+)',
    defaultPrice: 45000,
    unit: 'Sao',
    desc: 'Đỉnh cao 100★+ / Top 50 Server (Booster tùy chỉnh)',
    image: AOV_RANK_IMAGES.LEGEND,
    badgeColor: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
    isHighEloRange: true,
    minStar: 100,
    maxStar: null,
  },
];

export const DEFAULT_AOV_STAR_RATES: Record<string, number> = AOV_STAR_TIERS.reduce(
  (acc, tier) => {
    acc[tier.id] = tier.defaultPrice;
    return acc;
  },
  {} as Record<string, number>,
);

/**
 * Tra cứu đơn giá sao của một phân khúc (tương thích ngược với các key cũ của DB nếu Booster từng lưu trước đó)
 */
export function resolveAovStarRate(
  tierId: string,
  boosterTierRates?: Record<string, number | undefined>,
): number {
  const legacyAliasMap: Record<string, string[]> = {
    master_0_19: ['master_0_19', 'master_stars'],
    gm_20_49: ['gm_20_49', 'gm_iv_ii', 'gm_i'],
    conqueror_50_99: ['conqueror_50_99', 'conqueror_stars'],
    legend_100_plus: ['legend_100_plus', 'legend_stars'],
  };

  if (boosterTierRates) {
    const candidates = legacyAliasMap[tierId] || [tierId];
    for (const key of candidates) {
      const val = boosterTierRates[key];
      if (typeof val === 'number' && val > 0) {
        return Math.round(val);
      }
    }
  }

  const found = AOV_STAR_TIERS.find((t) => t.id === tierId);
  return found ? found.defaultPrice : 10000;
}

/**
 * Phân bổ giá trọn bậc lớn (VD: Tinh Anh -> Cao Thủ = 160.000đ) đều xuống từng đoàn nhỏ
 * Đảm bảo tổng stepOverrides của bậc lớn bằng chính xác 100% totalPrice.
 */
export function distributeAovTierPackageToSteps(
  pkg: AovTierPackage,
  totalPrice: number,
  currentOverrides: Record<string, number> = {},
): Record<string, number> {
  const next = { ...currentOverrides };
  const count = pkg.stepIds.length;
  if (count === 0) return next;

  if (!totalPrice || totalPrice <= 0) {
    for (const id of pkg.stepIds) {
      delete next[id];
    }
    return next;
  }

  const cleanTotal = Math.round(totalPrice);
  const basePerStep = Math.floor(cleanTotal / count);
  const remainder = cleanTotal - basePerStep * count;

  pkg.stepIds.forEach((id, idx) => {
    next[id] = idx === count - 1 ? basePerStep + remainder : basePerStep;
  });

  return next;
}

/**
 * Tính tổng giá hiện tại của 1 gói bậc lớn từ stepOverrides (fallback về giá mặc định chuẩn)
 */
export function getAovTierPackageCurrentTotal(
  pkg: AovTierPackage,
  stepOverrides?: Record<string, number>,
): number {
  return pkg.stepIds.reduce((sum, stepId) => {
    const override = stepOverrides?.[stepId];
    if (typeof override === 'number' && override > 0) {
      return sum + Math.round(override);
    }
    const step = AOV_RANK_LADDER.find((s) => s.id === stepId);
    return sum + (step?.stepPrice || 0);
  }, 0);
}

/**
 * Xác định Rank & Ảnh tương ứng theo số sao từ Cao Thủ trở lên (0★ -> 100★+)
 */
export function getAovHighRankByStars(stars: number): {
  label: string;
  tierKey: string;
  image: string;
  tierId: string;
} {
  const s = Math.max(0, Math.floor(stars));
  if (s >= 100) {
    return {
      label: `Huyền Thoại (${s}★)`,
      tierKey: 'LEGEND',
      image: AOV_RANK_IMAGES.LEGEND,
      tierId: 'legend_100_plus',
    };
  }
  if (s >= 50) {
    return {
      label: `Chiến Tướng (${s}★)`,
      tierKey: 'CONQUEROR',
      image: AOV_RANK_IMAGES.CONQUEROR,
      tierId: 'conqueror_50_99',
    };
  }
  if (s >= 40) {
    return {
      label: `Đại Cao Thủ I (${s}★)`,
      tierKey: 'GRANDMASTER_I',
      image: AOV_RANK_IMAGES.GRANDMASTER_I,
      tierId: 'gm_20_49',
    };
  }
  if (s >= 20) {
    const roman = s >= 30 ? 'II' : 'III';
    return {
      label: `Đại Cao Thủ ${roman} (${s}★)`,
      tierKey: s >= 30 ? 'GRANDMASTER_II' : 'GRANDMASTER_III',
      image: AOV_RANK_IMAGES.GRANDMASTER_IV,
      tierId: 'gm_20_49',
    };
  }
  if (s >= 10) {
    return {
      label: `Đại Cao Thủ IV (${s}★)`,
      tierKey: 'GRANDMASTER_IV',
      image: AOV_RANK_IMAGES.GRANDMASTER_IV,
      tierId: 'master_0_19',
    };
  }
  return {
    label: `Cao Thủ (${s}★)`,
    tierKey: 'MASTER',
    image: AOV_RANK_IMAGES.MASTER,
    tierId: 'master_0_19',
  };
}

/**
 * Lấy đường dẫn ảnh rank Liên Quân chuẩn xác từ tên tiếng Việt, tiếng Anh, hoặc ID bậc
 */
export function getAovRankImageByInput(input: string | { tier?: string; id?: string; label?: string }): string {
  const raw =
    typeof input === 'string'
      ? input
      : `${input?.id || ''} ${input?.tier || ''} ${input?.label || ''}`;

  const norm = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();

  if (!norm) return AOV_RANK_IMAGES.MASTER;

  if (
    norm.includes('legend') ||
    norm.includes('huyen thoai') ||
    norm.includes('chien than') ||
    norm.includes('thach dau') ||
    norm.includes('challenger') ||
    norm.includes('100')
  ) {
    return AOV_RANK_IMAGES.LEGEND;
  }
  if (norm.includes('conqueror') || norm.includes('chien tuong')) {
    return AOV_RANK_IMAGES.CONQUEROR;
  }
  if (
    norm.includes('grandmaster_i') ||
    norm.includes('gm_i') ||
    norm.includes('dai cao thu i') ||
    norm.includes('dai cao thu 1') ||
    norm.includes('gm_20_49')
  ) {
    return AOV_RANK_IMAGES.GRANDMASTER_I;
  }
  if (norm.includes('grandmaster_ii') || norm.includes('gm_ii') || norm.includes('dai cao thu ii')) {
    return AOV_RANK_IMAGES.GRANDMASTER_II;
  }
  if (norm.includes('grandmaster_iii') || norm.includes('gm_iii') || norm.includes('dai cao thu iii')) {
    return AOV_RANK_IMAGES.GRANDMASTER_III;
  }
  if (norm.includes('grandmaster') || norm.includes('dai cao thu') || norm.includes('gm_')) {
    return AOV_RANK_IMAGES.GRANDMASTER_IV;
  }
  if (norm.includes('master') || norm.includes('cao thu')) {
    return AOV_RANK_IMAGES.MASTER;
  }
  if (norm.includes('veteran') || norm.includes('tinh anh') || norm.includes('commander')) {
    return AOV_RANK_IMAGES.VETERAN;
  }
  if (norm.includes('diamond') || norm.includes('kim cuong')) {
    return AOV_RANK_IMAGES.DIAMOND;
  }
  if (norm.includes('platinum') || norm.includes('platium') || norm.includes('bach kim')) {
    return AOV_RANK_IMAGES.PLATINUM;
  }
  if (norm.includes('gold') || norm.includes('vang')) {
    return AOV_RANK_IMAGES.GOLD;
  }
  if (norm.includes('silver') || norm.includes('bac')) {
    return AOV_RANK_IMAGES.SILVER;
  }
  if (norm.includes('bronze') || norm.includes('dong')) {
    return AOV_RANK_IMAGES.BRONZE;
  }

  return AOV_RANK_IMAGES.MASTER;
}

export interface AovStarBreakdownItem {
  tierId: string;
  label: string;
  image: string;
  stars: number;
  ratePerStar: number;
  subtotal: number;
  fromStar?: number;
  toStar?: number;
}

/**
 * Tính tiền cày theo số Sao Liên Quân:
 * - Nếu chọn phân khúc thấp (Đồng-Kim Cương, Kim Cương-Tinh Anh, Tinh Anh-Cao Thủ):
 *   tính thẳng gainedStars * rate của phân khúc đó.
 * - Nếu chọn phân khúc cao từ Cao Thủ trở lên (master_0_19, gm_20_49, conqueror_50_99, legend_100_plus):
 *   TỰ ĐỘNG tính lũy tiến chính xác qua từng mốc sao:
 *   + 0★ -> 20★: rate(master_0_19) (mặc định 13k/sao)
 *   + 20★ -> 50★: rate(gm_20_49) (mặc định 20k/sao)
 *   + 50★ -> 100★: rate(conqueror_50_99) (mặc định 30k/sao)
 *   + 100★+: rate(legend_100_plus) (mặc định 45k/sao)
 */
export function calculateAovStarBoost({
  selectedSegmentId,
  currentStars,
  desiredStars,
  boosterTierRates,
}: {
  selectedSegmentId: string;
  currentStars: number;
  desiredStars: number;
  boosterTierRates?: Record<string, number | undefined>;
}): {
  totalStars: number;
  basePrice: number;
  effectiveUnitPrice: number;
  isProgressive: boolean;
  breakdown: AovStarBreakdownItem[];
} {
  const start = Math.max(0, Math.floor(currentStars || 0));
  const end = Math.max(0, Math.floor(desiredStars || 0));
  const totalStars = Math.max(0, end - start);

  if (totalStars <= 0) {
    return {
      totalStars: 0,
      basePrice: 0,
      effectiveUnitPrice: resolveAovStarRate(selectedSegmentId, boosterTierRates),
      isProgressive: false,
      breakdown: [],
    };
  }

  const selectedTier = AOV_STAR_TIERS.find((t) => t.id === selectedSegmentId);

  // Phân khúc bậc thấp (Đồng-KC, KC-TA, TA-CT): tính đơn giá cố định theo sao
  if (!selectedTier?.isHighEloRange) {
    const rate = resolveAovStarRate(selectedSegmentId, boosterTierRates);
    const subtotal = totalStars * rate;
    return {
      totalStars,
      basePrice: subtotal,
      effectiveUnitPrice: rate,
      isProgressive: false,
      breakdown: [
        {
          tierId: selectedSegmentId,
          label: selectedTier?.label || 'Cày theo Sao',
          image: selectedTier?.image || AOV_RANK_IMAGES.MASTER,
          stars: totalStars,
          ratePerStar: rate,
          subtotal,
        },
      ],
    };
  }

  // Phân khúc Cao Thủ 0* trở lên: tính lũy tiến tự động chính xác qua từng ngưỡng sao
  const highRanges = AOV_STAR_TIERS.filter((t) => t.isHighEloRange);
  const breakdown: AovStarBreakdownItem[] = [];
  let basePrice = 0;

  for (const seg of highRanges) {
    const segStart = seg.minStar ?? 0;
    const segEnd = seg.maxStar ?? Number.POSITIVE_INFINITY;
    const overlapStart = Math.max(start, segStart);
    const overlapEnd = Math.min(end, segEnd);

    if (overlapEnd > overlapStart) {
      const starsInRange = overlapEnd - overlapStart;
      const rate = resolveAovStarRate(seg.id, boosterTierRates);
      const subtotal = starsInRange * rate;
      basePrice += subtotal;
      breakdown.push({
        tierId: seg.id,
        label: seg.label,
        image: seg.image,
        stars: starsInRange,
        ratePerStar: rate,
        subtotal,
        fromStar: overlapStart,
        toStar: overlapEnd,
      });
    }
  }

  return {
    totalStars,
    basePrice,
    effectiveUnitPrice: totalStars > 0 ? Math.round(basePrice / totalStars) : 0,
    isProgressive: breakdown.length > 1,
    breakdown,
  };
}
