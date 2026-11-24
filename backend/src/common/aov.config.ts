// backend/src/common/aov.config.ts
// Cấu hình chuẩn Liên Quân Mobile (AOV) trên Backend:
// Đồng bộ 100% với Frontend src/lib/aov.ts cho báo giá, khởi tạo dịch vụ & kiểm chứng đơn hàng.

export interface AovRankStepConfig {
  id: string;
  tier: string;
  division?: string;
  label: string;
  stepPrice: number;
  starsPerDivision?: number;
  image: string;
  isHighRank?: boolean;
}

export interface AovTierPackageConfig {
  id: string;
  fromTier: string;
  toTier: string;
  label: string;
  fromImage: string;
  toImage: string;
  stepIds: string[];
  defaultTotalPrice: number;
  isHighRank?: boolean;
}

export interface AovStarTierConfig {
  id: string;
  label: string;
  shortLabel: string;
  defaultPrice: number;
  unit: 'Sao';
  desc: string;
  image: string;
  isHighEloRange?: boolean;
  minStar?: number;
  maxStar?: number | null;
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

export const AOV_RANK_LADDER: AovRankStepConfig[] = [
  // Đồng -> Bạc: 25.000đ
  { id: 'BRONZE_3', tier: 'BRONZE', division: 'III', label: 'Đồng III', stepPrice: 8000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },
  { id: 'BRONZE_2', tier: 'BRONZE', division: 'II', label: 'Đồng II', stepPrice: 8000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },
  { id: 'BRONZE_1', tier: 'BRONZE', division: 'I', label: 'Đồng I', stepPrice: 9000, starsPerDivision: 3, image: AOV_RANK_IMAGES.BRONZE },

  // Bạc -> Vàng: 45.000đ
  { id: 'SILVER_3', tier: 'SILVER', division: 'III', label: 'Bạc III', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },
  { id: 'SILVER_2', tier: 'SILVER', division: 'II', label: 'Bạc II', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },
  { id: 'SILVER_1', tier: 'SILVER', division: 'I', label: 'Bạc I', stepPrice: 15000, starsPerDivision: 4, image: AOV_RANK_IMAGES.SILVER },

  // Vàng -> Bạch Kim: 55.000đ
  { id: 'GOLD_4', tier: 'GOLD', division: 'IV', label: 'Vàng IV', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_3', tier: 'GOLD', division: 'III', label: 'Vàng III', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_2', tier: 'GOLD', division: 'II', label: 'Vàng II', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },
  { id: 'GOLD_1', tier: 'GOLD', division: 'I', label: 'Vàng I', stepPrice: 14000, starsPerDivision: 4, image: AOV_RANK_IMAGES.GOLD },

  // Bạch Kim -> Kim Cương: 65.000đ
  { id: 'PLATINUM_5', tier: 'PLATINUM', division: 'V', label: 'Bạch Kim V', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_4', tier: 'PLATINUM', division: 'IV', label: 'Bạch Kim IV', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_3', tier: 'PLATINUM', division: 'III', label: 'Bạch Kim III', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_2', tier: 'PLATINUM', division: 'II', label: 'Bạch Kim II', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },
  { id: 'PLATINUM_1', tier: 'PLATINUM', division: 'I', label: 'Bạch Kim I', stepPrice: 13000, starsPerDivision: 4, image: AOV_RANK_IMAGES.PLATINUM },

  // Kim Cương -> Tinh Anh: 95.000đ
  { id: 'DIAMOND_5', tier: 'DIAMOND', division: 'V', label: 'Kim Cương V', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_4', tier: 'DIAMOND', division: 'IV', label: 'Kim Cương IV', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_3', tier: 'DIAMOND', division: 'III', label: 'Kim Cương III', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_2', tier: 'DIAMOND', division: 'II', label: 'Kim Cương II', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },
  { id: 'DIAMOND_1', tier: 'DIAMOND', division: 'I', label: 'Kim Cương I', stepPrice: 19000, starsPerDivision: 5, image: AOV_RANK_IMAGES.DIAMOND },

  // Tinh Anh -> Cao Thủ: 160.000đ
  { id: 'VETERAN_5', tier: 'VETERAN', division: 'V', label: 'Tinh Anh V', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_4', tier: 'VETERAN', division: 'IV', label: 'Tinh Anh IV', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_3', tier: 'VETERAN', division: 'III', label: 'Tinh Anh III', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_2', tier: 'VETERAN', division: 'II', label: 'Tinh Anh II', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },
  { id: 'VETERAN_1', tier: 'VETERAN', division: 'I', label: 'Tinh Anh I', stepPrice: 32000, starsPerDivision: 5, image: AOV_RANK_IMAGES.VETERAN },

  // Từ Cao Thủ trở lên (Booster tùy chỉnh cấu hình)
  { id: 'MASTER', tier: 'MASTER', label: 'Cao Thủ (0★)', stepPrice: 260000, image: AOV_RANK_IMAGES.MASTER, isHighRank: true },
  { id: 'GRANDMASTER', tier: 'GRANDMASTER', label: 'Đại Cao Thủ (20★)', stepPrice: 600000, image: AOV_RANK_IMAGES.GRANDMASTER_I, isHighRank: true },
  { id: 'CONQUEROR', tier: 'CONQUEROR', label: 'Chiến Tướng (50★)', stepPrice: 1500000, image: AOV_RANK_IMAGES.CONQUEROR, isHighRank: true },
  { id: 'LEGEND', tier: 'LEGEND', label: 'Huyền Thoại (100★)', stepPrice: 0, image: AOV_RANK_IMAGES.LEGEND, isHighRank: true },
];

export const AOV_TIER_PACKAGES: AovTierPackageConfig[] = [
  {
    id: 'bronze_to_silver',
    fromTier: 'BRONZE',
    toTier: 'SILVER',
    label: 'Đồng ➔ Bạc',
    fromImage: AOV_RANK_IMAGES.BRONZE,
    toImage: AOV_RANK_IMAGES.SILVER,
    stepIds: ['BRONZE_3', 'BRONZE_2', 'BRONZE_1'],
    defaultTotalPrice: 25000,
  },
  {
    id: 'silver_to_gold',
    fromTier: 'SILVER',
    toTier: 'GOLD',
    label: 'Bạc ➔ Vàng',
    fromImage: AOV_RANK_IMAGES.SILVER,
    toImage: AOV_RANK_IMAGES.GOLD,
    stepIds: ['SILVER_3', 'SILVER_2', 'SILVER_1'],
    defaultTotalPrice: 45000,
  },
  {
    id: 'gold_to_platinum',
    fromTier: 'GOLD',
    toTier: 'PLATINUM',
    label: 'Vàng ➔ Bạch Kim',
    fromImage: AOV_RANK_IMAGES.GOLD,
    toImage: AOV_RANK_IMAGES.PLATINUM,
    stepIds: ['GOLD_4', 'GOLD_3', 'GOLD_2', 'GOLD_1'],
    defaultTotalPrice: 55000,
  },
  {
    id: 'platinum_to_diamond',
    fromTier: 'PLATINUM',
    toTier: 'DIAMOND',
    label: 'Bạch Kim ➔ Kim Cương',
    fromImage: AOV_RANK_IMAGES.PLATINUM,
    toImage: AOV_RANK_IMAGES.DIAMOND,
    stepIds: ['PLATINUM_5', 'PLATINUM_4', 'PLATINUM_3', 'PLATINUM_2', 'PLATINUM_1'],
    defaultTotalPrice: 65000,
  },
  {
    id: 'diamond_to_veteran',
    fromTier: 'DIAMOND',
    toTier: 'VETERAN',
    label: 'Kim Cương ➔ Tinh Anh',
    fromImage: AOV_RANK_IMAGES.DIAMOND,
    toImage: AOV_RANK_IMAGES.VETERAN,
    stepIds: ['DIAMOND_5', 'DIAMOND_4', 'DIAMOND_3', 'DIAMOND_2', 'DIAMOND_1'],
    defaultTotalPrice: 95000,
  },
  {
    id: 'veteran_to_master',
    fromTier: 'VETERAN',
    toTier: 'MASTER',
    label: 'Tinh Anh ➔ Cao Thủ',
    fromImage: AOV_RANK_IMAGES.VETERAN,
    toImage: AOV_RANK_IMAGES.MASTER,
    stepIds: ['VETERAN_5', 'VETERAN_4', 'VETERAN_3', 'VETERAN_2', 'VETERAN_1'],
    defaultTotalPrice: 160000,
  },
  {
    id: 'master_to_gm',
    fromTier: 'MASTER',
    toTier: 'GRANDMASTER',
    label: 'Cao Thủ (0★) ➔ Đại Cao Thủ (20★)',
    fromImage: AOV_RANK_IMAGES.MASTER,
    toImage: AOV_RANK_IMAGES.GRANDMASTER_I,
    stepIds: ['MASTER'],
    defaultTotalPrice: 260000,
    isHighRank: true,
  },
  {
    id: 'gm_to_conqueror',
    fromTier: 'GRANDMASTER',
    toTier: 'CONQUEROR',
    label: 'Đại Cao Thủ (20★) ➔ Chiến Tướng (50★)',
    fromImage: AOV_RANK_IMAGES.GRANDMASTER_I,
    toImage: AOV_RANK_IMAGES.CONQUEROR,
    stepIds: ['GRANDMASTER'],
    defaultTotalPrice: 600000,
    isHighRank: true,
  },
  {
    id: 'conqueror_to_legend',
    fromTier: 'CONQUEROR',
    toTier: 'LEGEND',
    label: 'Chiến Tướng (50★) ➔ Huyền Thoại (100★)',
    fromImage: AOV_RANK_IMAGES.CONQUEROR,
    toImage: AOV_RANK_IMAGES.LEGEND,
    stepIds: ['CONQUEROR'],
    defaultTotalPrice: 1500000,
    isHighRank: true,
  },
];

export const AOV_STAR_TIERS: AovStarTierConfig[] = [
  {
    id: 'bronze_diamond',
    label: 'Đồng – Kim Cương',
    shortLabel: 'Đồng ➔ Kim Cương',
    defaultPrice: 5000,
    unit: 'Sao',
    desc: 'Bậc Đồng, Bạc, Vàng, Bạch Kim',
    image: AOV_RANK_IMAGES.PLATINUM,
  },
  {
    id: 'diamond_veteran',
    label: 'Kim Cương – Tinh Anh',
    shortLabel: 'Kim Cương ➔ Tinh Anh',
    defaultPrice: 6000,
    unit: 'Sao',
    desc: 'Cày sao bậc Kim Cương V → I',
    image: AOV_RANK_IMAGES.DIAMOND,
  },
  {
    id: 'veteran_master',
    label: 'Tinh Anh – Cao Thủ',
    shortLabel: 'Tinh Anh ➔ Cao Thủ',
    defaultPrice: 10000,
    unit: 'Sao',
    desc: 'Cày sao bậc Tinh Anh V → I',
    image: AOV_RANK_IMAGES.VETERAN,
  },
  {
    id: 'master_0_19',
    label: 'Cao Thủ 0★ – Đại Cao Thủ 19★',
    shortLabel: 'Cao Thủ (0 - 19★)',
    defaultPrice: 13000,
    unit: 'Sao',
    desc: 'Phân khúc Cao Thủ 0★ đến 19★',
    image: AOV_RANK_IMAGES.MASTER,
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
    isHighEloRange: true,
    minStar: 100,
    maxStar: null,
  },
];

export const DEFAULT_AOV_STAR_RATES: Record<string, number> = AOV_STAR_TIERS.reduce(
  (acc, t) => {
    acc[t.id] = t.defaultPrice;
    return acc;
  },
  {} as Record<string, number>,
);

export function resolveAovStarRate(
  tierId: string,
  tierRates?: Record<string, number>,
): number {
  const aliasMap: Record<string, string[]> = {
    master_0_19: ['master_0_19', 'master_stars'],
    gm_20_49: ['gm_20_49', 'gm_iv_ii', 'gm_i'],
    conqueror_50_99: ['conqueror_50_99', 'conqueror_stars'],
    legend_100_plus: ['legend_100_plus', 'legend_stars'],
  };

  if (tierRates) {
    const keys = aliasMap[tierId] || [tierId];
    for (const k of keys) {
      const val = tierRates[k];
      if (typeof val === 'number' && val > 0) return Math.round(val);
    }
  }

  return AOV_STAR_TIERS.find((t) => t.id === tierId)?.defaultPrice ?? 10000;
}

export function calculateAovStarPricing(
  segmentId: string,
  currentStars: number,
  desiredStars: number,
  tierRates?: Record<string, number>,
) {
  const start = Math.max(0, Math.floor(currentStars || 0));
  const end = Math.max(0, Math.floor(desiredStars || 0));
  const totalStars = Math.max(0, end - start);

  if (totalStars <= 0) {
    return {
      totalStars: 0,
      basePrice: 0,
      effectiveUnitPrice: resolveAovStarRate(segmentId, tierRates),
      isProgressive: false,
      breakdown: [] as Array<{
        tierId: string;
        label: string;
        stars: number;
        ratePerStar: number;
        subtotal: number;
      }>,
    };
  }

  const selected = AOV_STAR_TIERS.find((t) => t.id === segmentId);
  if (!selected?.isHighEloRange) {
    const rate = resolveAovStarRate(segmentId, tierRates);
    const subtotal = totalStars * rate;
    return {
      totalStars,
      basePrice: subtotal,
      effectiveUnitPrice: rate,
      isProgressive: false,
      breakdown: [
        {
          tierId: segmentId,
          label: selected?.label || 'Cày theo Sao',
          stars: totalStars,
          ratePerStar: rate,
          subtotal,
        },
      ],
    };
  }

  const highTiers = AOV_STAR_TIERS.filter((t) => t.isHighEloRange);
  const breakdown: Array<{
    tierId: string;
    label: string;
    stars: number;
    ratePerStar: number;
    subtotal: number;
  }> = [];
  let basePrice = 0;

  for (const seg of highTiers) {
    const segStart = seg.minStar ?? 0;
    const segEnd = seg.maxStar ?? Number.POSITIVE_INFINITY;
    const overlapStart = Math.max(start, segStart);
    const overlapEnd = Math.min(end, segEnd);
    if (overlapEnd > overlapStart) {
      const stars = overlapEnd - overlapStart;
      const ratePerStar = resolveAovStarRate(seg.id, tierRates);
      const subtotal = stars * ratePerStar;
      basePrice += subtotal;
      breakdown.push({
        tierId: seg.id,
        label: seg.label,
        stars,
        ratePerStar,
        subtotal,
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
