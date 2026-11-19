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
  ASCENDANT: 'Tinh Anh',
  IMMORTAL: 'Bất Tử',
  RADIANT: 'Thần Thoại',
  UNRANKED: 'Chưa xếp hạng',
  UNRATED: 'Chưa xếp hạng',
};

export const getTierVi = (tier: string): string => {
  if (!tier) return '';
  return TIER_VI_MAP[tier.toUpperCase()] || tier;
};

export const formatRankDisplayVi = (rankStr?: string): string => {
  if (!rankStr) return 'Khởi điểm';
  let str = rankStr.trim();
  // Xóa số La Mã I ở các bậc Cao Thủ, Đại Cao Thủ, Thách Đấu, Radiant
  str = str.replace(/^(MASTER|GRANDMASTER|CHALLENGER|RADIANT|Cao Thủ|Đại Cao Thủ|Thách Đấu|Thần Thoại)\s+I$/i, '$1');

  for (const [en, vi] of Object.entries(TIER_VI_MAP)) {
    const reg = new RegExp(`\\b${en}\\b`, 'i');
    if (reg.test(str)) {
      str = str.replace(reg, vi);
      break;
    }
  }

  return str;
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

