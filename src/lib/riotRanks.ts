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
  // Xóa số La Mã I ở các bậc đơn nhánh: Cao Thủ, Đại Cao Thủ, Thách Đấu, Radiant
  str = str.replace(/\b(MASTER|GRANDMASTER|CHALLENGER|RADIANT|Cao Thủ|Đại Cao Thủ|Thách Đấu|Thần Thoại)\s+I\b/gi, '$1');

  // Chuẩn hóa và chuyển đổi các thuật ngữ tiếng Anh sang tiếng Việt, xử lý trường hợp cặp song ngữ
  for (const [en, vi] of Object.entries(TIER_VI_MAP)) {
    const pairRegex = new RegExp(`${vi}\\s*\\(${en}\\)|${en}\\s*\\(${vi}\\)`, 'gi');
    if (pairRegex.test(str)) {
      str = str.replace(pairRegex, vi);
    } else {
      const reg = new RegExp(`\\b${en}\\b`, 'i');
      if (reg.test(str)) {
        str = str.replace(reg, vi);
      }
    }
  }

  // Dọn dẹp hoàn toàn hiện tượng lặp lại như "Cao Thủ (Cao Thủ)" -> "Cao Thủ"
  str = str.replace(/(Cao Thủ|Đại Cao Thủ|Thách Đấu|Kim Cương|Bạch Kim|Lục Bảo|Vàng|Bạc|Đồng|Sắt|Thần Thoại|Bất Tử|Tinh Anh)\s*\(\1\)/gi, '$1');

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

export const LOL_QUEUE_NAMES: Record<number, string> = {
  420: 'Chế độ Đơn / Đôi',
  440: 'Chế độ Linh hoạt (Flex)',
  400: 'Chế độ Đấu thường (Cấm/Chọn)',
  430: 'Chế độ Đấu thường (Chọn ẩn)',
  450: 'Chế độ ARAM',
  490: 'Chế độ Đấu nhanh (Quickplay)',
  700: 'Chế độ Clash',
  1700: 'Chế độ Võ Đài (Arena)',
};

export const getLolQueueName = (queueId?: number | string): string => {
  if (!queueId) return 'Không xác định';
  const id = Number(queueId);
  return LOL_QUEUE_NAMES[id] || `Queue ID: ${id}`;
};

