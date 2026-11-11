export const TIER_VI_MAP: Record<string, string> = {
  IRON: 'Sắt',
  BRONZE: 'Đồng',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch Kim',
  EMERALD: 'Lục Bảo',
  DIAMOND: 'Kim Cương',
  MASTER: 'Cao Thủ',
  GRANDMASTER: 'Đại Cao Thủ',
  CHALLENGER: 'Thách Đấu',
};

export const getTierVi = (tier: string): string => {
  if (!tier) return '';
  return TIER_VI_MAP[tier.toUpperCase()] || tier;
};

export interface VerifiedRankInfo {
  tier: string;
  tierVi: string;
  rank: string;
  lp: number;
  queueName: string;
  gameName: string;
  tagLine: string;
}

