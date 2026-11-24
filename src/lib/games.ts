// src/lib/games.ts

export type GameBadge = 'HOT' | 'Mới' | 'Phổ Biến' | 'Đề xuất' | 'Xu hướng';

export interface GameMetrics {
  totalOrders: number; // Tổng số đơn đã thực hiện
  recentOrders: number; // Số đơn đặt gần đây (7-30 ngày qua)
  activeBoosters: number; // Số lượng Booster đang sẵn sàng nhận kèo
  averageRating: number; // Điểm đánh giá trung bình (1.0 - 5.0)
  totalReviews: number; // Tổng lượt đánh giá từ khách hàng
  isNew?: boolean; // Đánh dấu game mới thêm
  createdAt?: string; // Ngày phát hành / ngày đưa lên hệ thống (ISO string)
}

export interface CalculatedBadgeResult {
  badge: GameBadge | null;
  reason: string;
  isAuto: boolean;
}

export interface GameDefinition {
  id: string;
  name: string;
  shortName: string;
  desc: string;
  iconName: string;
  gradient: string;
  accentColor: string;
  banner: string; // Fallback local image path (e.g. /images/games/lol-card.jpg)
  bannerUrl?: string; // Online image URL (CDN, Imgur, Cloudinary...)
  badge?: GameBadge; // Nhãn fallback hoặc gán thủ công: HOT, Mới, Phổ Biến, Đề xuất, Xu hướng
  badgeMode?: 'AUTO' | 'MANUAL'; // Chế độ tính nhãn: AUTO (tự động theo metrics) hoặc MANUAL (chỉ định cứng)
  metrics?: GameMetrics; // Số liệu thống kê vận hành thực tế
  active: boolean;
  standardRanks: string[];
  standardServers: { code: string; name: string }[];
  defaultServices: {
    slug: string;
    name: string;
    desc: string;
    iconName: string;
    pricingType: 'FIXED' | 'PER_UNIT' | 'TIER_MATRIX';
    defaultPrice: number;
    unitName?: string;
    depositPercent: number;
    requiredFields: string[];
  }[];
}

/**
 * Thuật toán tính toán "Badge" tự động dựa trên chất lượng & số liệu thực tế nền tảng LEORANK:
 * - "HOT": Nhiều đơn + Nhiều boosters + Nhiều đánh giá + Tỉ lệ vote cao
 * - "Xu hướng": Số lượng đơn tăng trưởng mạnh gần đây
 * - "Đề xuất": Chất lượng cao (uy tín), tỉ lệ vote cao vượt trội
 * - "Phổ biến": Nhiều đơn đặt liên tục
 * - "Mới": Tựa game mới ra mắt / mới thêm vào sàn
 * - Fallback: Nếu badgeMode === 'MANUAL', tôn trọng nhãn thủ công của Staff.
 */
export function resolveGameBadge(game: GameDefinition): CalculatedBadgeResult {
  // 1. Nếu Staff chủ động chọn MANUAL Override
  if (game.badgeMode === 'MANUAL' && game.badge) {
    return {
      badge: game.badge,
      reason: 'Gán thủ công bởi Staff (Manual Override)',
      isAuto: false,
    };
  }

  const m = game.metrics;
  if (!m) {
    return {
      badge: game.badge || null,
      reason: game.badge ? 'Cấu hình fallback mặc định' : 'Chưa có số liệu',
      isAuto: false,
    };
  }

  const isNewlyAdded =
    m.isNew ||
    (m.createdAt && Date.now() - new Date(m.createdAt).getTime() < 45 * 24 * 60 * 60 * 1000);

  // 2. "HOT": Nhiều đơn + Nhiều boosters + Nhiều đánh giá + Tỉ lệ vote cao
  if (
    m.totalOrders >= 25 &&
    m.activeBoosters >= 6 &&
    m.totalReviews >= 8 &&
    m.averageRating >= 4.8
  ) {
    return {
      badge: 'HOT',
      reason: `Nhiều đơn (${m.totalOrders}), ${m.activeBoosters} boosters, ${m.totalReviews} đánh giá (${m.averageRating.toFixed(1)}★)`,
      isAuto: true,
    };
  }

  // 3. "Đề xuất": Chất lượng cao (uy tín), tỉ lệ vote cao
  if (m.averageRating >= 4.85 && m.totalReviews >= 5) {
    return {
      badge: 'Đề xuất',
      reason: `Chất lượng cao (${m.averageRating.toFixed(1)}★), ${m.totalReviews} lượt đánh giá uy tín`,
      isAuto: true,
    };
  }

  // 4. "Phổ biến": Nhiều đơn đặt liên tục
  if (m.recentOrders >= 12 || m.totalOrders >= 20) {
    return {
      badge: 'Phổ Biến',
      reason: `Khách hàng đặt liên tục (${m.recentOrders} đơn gần đây / ${m.totalOrders} tổng đơn)`,
      isAuto: true,
    };
  }

  // 5. "Xu hướng": Nhiều đơn tăng trưởng nhanh
  if (m.recentOrders >= 6 || m.totalOrders >= 10) {
    return {
      badge: 'Xu hướng',
      reason: `Nhiều đơn tăng nhanh gần đây (${m.recentOrders} đơn)`,
      isAuto: true,
    };
  }

  // 6. "Mới": Game mới ra mắt
  if (isNewlyAdded) {
    return {
      badge: 'Mới',
      reason: 'Tựa game mới đưa lên hệ thống LEORANK',
      isAuto: true,
    };
  }

  // 7. Fallback về manual badge nếu có
  if (game.badge) {
    return {
      badge: game.badge,
      reason: 'Nhãn mặc định fallback',
      isAuto: false,
    };
  }

  return {
    badge: null,
    reason: 'Chưa đủ điều kiện xếp hạng nhãn',
    isAuto: true,
  };
}

export const GAMES_CATALOG: GameDefinition[] = [
  // 1. LEAGUE OF LEGENDS
  {
    id: 'lol',
    name: 'League of Legends',
    shortName: 'LMHT',
    desc: 'Dịch vụ leo rank, cày điểm LP Cao Thủ/Thách Đấu, chuỗi thăng hạng và phân hạng đầu mùa.',
    iconName: 'Swords',
    gradient: 'from-blue-600 to-cyan-600',
    accentColor: 'text-blue-400',
    banner: '/images/games/lol-card.jpg',
    badge: 'HOT',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Iron',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Emerald',
      'Diamond',
      'Master',
      'Grandmaster',
      'Challenger',
    ],
    standardServers: [
      { code: 'VN', name: 'Việt Nam' },
      { code: 'KR', name: 'Hàn Quốc' },
      { code: 'JP', name: 'Nhật Bản' },
      { code: 'NA', name: 'Bắc Mỹ' },
      { code: 'EUW', name: 'Tây Âu' },
      { code: 'SEA', name: 'Đông Nam Á' },
    ],
    defaultServices: [],
  },

  // 2. TEAMFIGHT TACTICS
  {
    id: 'tft',
    name: 'Teamfight Tactics',
    shortName: 'ĐTCL',
    desc: 'Leo rank Đấu Trường Chân Lý, cày Top 4 bền vững, hướng dẫn giáo án meta chuyên sâu.',
    iconName: 'Gamepad2',
    gradient: 'from-amber-600 to-orange-600',
    accentColor: 'text-amber-400',
    banner: '/images/games/tft-card.jpg',
    badge: 'Đề xuất',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Iron',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Emerald',
      'Diamond',
      'Master',
      'Grandmaster',
      'Challenger',
    ],
    standardServers: [
      { code: 'VN', name: 'Việt Nam' },
      { code: 'KR', name: 'Hàn Quốc' },
      { code: 'NA', name: 'Bắc Mỹ' },
      { code: 'SEA', name: 'Đông Nam Á' },
    ],
    defaultServices: [],
  },

  // 3. VALORANT
  {
    id: 'valorant',
    name: 'Valorant',
    shortName: 'Valorant',
    desc: 'Cày Rank Valorant, Duo cùng tuyển thủ Immortal/Radiant, cày chuỗi thắng an toàn.',
    iconName: 'Crosshair',
    gradient: 'from-rose-600 to-red-600',
    accentColor: 'text-rose-400',
    banner: '/images/games/val-card.jpg',
    badge: 'Phổ Biến',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Iron',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Ascendant',
      'Immortal',
      'Radiant',
    ],
    standardServers: [
      { code: 'AP', name: 'Châu Á - TBD (Việt Nam)' },
      { code: 'NA', name: 'Bắc Mỹ' },
      { code: 'EU', name: 'Châu Âu' },
    ],
    defaultServices: [],
  },

  // 4. COUNTER-STRIKE 2 (CS2)
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    desc: 'Cày Elo Premier Rating, nâng bậc xếp hạng Competitive và Faceit Level 10.',
    iconName: 'Crosshair',
    gradient: 'from-amber-500 to-yellow-600',
    accentColor: 'text-amber-400',
    banner: '/images/games/cs2-card.jpg',
    badge: 'Xu hướng',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Silver I - Elite',
      'Gold Nova I - Master',
      'Master Guardian',
      'DMG',
      'LE / LEM',
      'Supreme',
      'Global Elite',
      'Premier 15k - 30k+',
    ],
    standardServers: [
      { code: 'VN', name: 'Việt Nam / SEA' },
      { code: 'ASIA', name: 'Châu Á' },
      { code: 'EU', name: 'Châu Âu' },
    ],
    defaultServices: [],
  },

  // 5. DOTA 2
  {
    id: 'dota2',
    name: 'Dota 2',
    shortName: 'Dota 2',
    desc: 'Dịch vụ kéo rank MMR Dota 2 từ Herald đến Immortal, cày chuỗi thắng Calibration.',
    iconName: 'Swords',
    gradient: 'from-red-600 to-rose-700',
    accentColor: 'text-red-400',
    banner: '/images/games/dota2-card.jpg',
    active: true,
    standardRanks: [
      'Herald',
      'Guardian',
      'Crusader',
      'Archon',
      'Legend',
      'Ancient',
      'Divine',
      'Immortal',
    ],
    standardServers: [
      { code: 'SEA', name: 'Đông Nam Á (SEA)' },
      { code: 'JP', name: 'Nhật Bản' },
      { code: 'EU', name: 'Châu Âu' },
    ],
    defaultServices: [],
  },

  // 6. ARENA OF VALOR (LIÊN QUÂN MOBILE)
  {
    id: 'aov',
    name: 'Arena of Valor',
    shortName: 'Liên Quân',
    desc: 'Leo rank Cao Thủ, Chiến Tướng, cày chuỗi thắng và điểm chiến lực tướng.',
    iconName: 'Shield',
    gradient: 'from-amber-600 to-red-600',
    accentColor: 'text-amber-400',
    banner: '/images/games/aov-card.jpg',
    active: true,
    standardRanks: [
      'Đồng',
      'Bạc',
      'Vàng',
      'Bạch Kim',
      'Kim Cương',
      'Tinh Anh',
      'Cao Thủ',
      'Đại Cao Thủ',
      'Chiến Tướng',
      'Huyền Thoại',
    ],
    standardServers: [
      { code: 'VN', name: 'Mặt Trời (Việt Nam)' },
      { code: 'TH', name: 'Thái Lan' },
      { code: 'TW', name: 'Đài Loan' },
    ],
    defaultServices: [],
  },

  // 7. WILD RIFT (TỐC CHIẾN)
  {
    id: 'wildrift',
    name: 'Wild Rift',
    shortName: 'Tốc Chiến',
    desc: 'Dịch vụ leo rank Tốc Chiến từ Sắt đến Thách Đấu, Đại Cao Thủ trên Mobile.',
    iconName: 'Flame',
    gradient: 'from-cyan-600 to-blue-700',
    accentColor: 'text-cyan-400',
    banner: '/images/games/wildrift-card.jpg',
    active: true,
    standardRanks: [
      'Iron',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Emerald',
      'Diamond',
      'Master',
      'Grandmaster',
      'Challenger',
    ],
    standardServers: [
      { code: 'VN', name: 'Việt Nam' },
      { code: 'SEA', name: 'Đông Nam Á' },
    ],
    defaultServices: [],
  },

  // 8. VALORANT MOBILE
  {
    id: 'valmobile',
    name: 'Valorant Mobile',
    shortName: 'Val Mobile',
    desc: 'Dịch vụ leo rank Valorant Mobile, tối ưu chuỗi thắng và thử nghiệm sớm.',
    iconName: 'Crosshair',
    gradient: 'from-rose-500 to-orange-500',
    accentColor: 'text-rose-400',
    banner: '/images/games/valmobile-card.jpg',
    active: true,
    standardRanks: [
      'Iron',
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Immortal',
    ],
    standardServers: [
      { code: 'ASIA', name: 'Châu Á' },
      { code: 'CN', name: 'Trung Quốc' },
    ],
    defaultServices: [],
  },

  // 9. DELTA FORCE
  {
    id: 'deltaforce',
    name: 'Delta Force',
    shortName: 'Delta Force',
    desc: 'Cày rank Warfare, Operation Hazard, nâng cấp vũ khí và kéo extraction an toàn.',
    iconName: 'Crosshair',
    gradient: 'from-emerald-600 to-teal-700',
    accentColor: 'text-emerald-400',
    banner: '/images/games/deltaforce-card.jpg',
    badge: 'Mới',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Pinnacle',
    ],
    standardServers: [
      { code: 'ASIA', name: 'Châu Á (SEA)' },
      { code: 'GLOBAL', name: 'Toàn Cầu' },
    ],
    defaultServices: [],
  },

  // 10. MARVEL RIVALS
  {
    id: 'marvelrivals',
    name: 'Marvel Rivals',
    shortName: 'Marvel Rivals',
    desc: 'Leo rank Competitive Siêu Anh Hùng 6v6, kéo bậc Eternity và One Above All.',
    iconName: 'Zap',
    gradient: 'from-purple-600 to-pink-600',
    accentColor: 'text-purple-400',
    banner: '/images/games/marvelrivals-card.jpg',
    badge: 'Xu hướng',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Grandmaster',
      'Eternity',
      'One Above All',
    ],
    standardServers: [
      { code: 'ASIA', name: 'Châu Á' },
      { code: 'NA', name: 'Bắc Mỹ' },
      { code: 'EU', name: 'Châu Âu' },
    ],
    defaultServices: [],
  },

  // 11. PATH OF EXILE 2 (POE 2)
  {
    id: 'poe2',
    name: 'Path of Exile 2',
    shortName: 'POE 2',
    desc: 'Cày cấp cốt truyện Campaign, cày Maps Endgame, Farm Boss và build đồ tối thượng.',
    iconName: 'Shield',
    gradient: 'from-stone-700 to-amber-900',
    accentColor: 'text-amber-500',
    banner: '/images/games/poe2-card.jpg',
    badge: 'Mới',
    badgeMode: 'MANUAL',
    active: true,
    standardRanks: [
      'Act 1-6 Campaign',
      'White Maps',
      'Yellow Maps',
      'Red Maps (T16)',
      'Pinnacle Bosses',
    ],
    standardServers: [
      { code: 'SG', name: 'Singapore (SEA)' },
      { code: 'JP', name: 'Nhật Bản' },
      { code: 'US', name: 'Bắc Mỹ' },
    ],
    defaultServices: [],
  },

  // 12. FREE FIRE
  {
    id: 'freefire',
    name: 'Free Fire',
    shortName: 'Free Fire',
    desc: 'Cày Rank Tử Chiến (CS), Sinh Tồn (BR) lên Huyền Thoại và Thách Đấu.',
    iconName: 'Flame',
    gradient: 'from-amber-500 to-red-600',
    accentColor: 'text-amber-400',
    banner: '/images/games/freefire-card.jpg',
    active: true,
    standardRanks: [
      'Đồng',
      'Bạc',
      'Vàng',
      'Bạch Kim',
      'Kim Cương',
      'Huyền Thoại',
      'Thách Đấu',
    ],
    standardServers: [{ code: 'VN', name: 'Việt Nam' }],
    defaultServices: [],
  },

  // 13. PUBG MOBILE
  {
    id: 'pubgmobile',
    name: 'PUBG Mobile',
    shortName: 'PUBG Mobile',
    desc: 'Cày rank Chí Tôn (Conqueror), Vương Giả (Ace), KD cao và chuỗi Top 1 an toàn.',
    iconName: 'Crosshair',
    gradient: 'from-yellow-600 to-amber-700',
    accentColor: 'text-yellow-400',
    banner: '/images/games/pubgmobile-card.jpg',
    active: true,
    standardRanks: [
      'Đồng',
      'Bạc',
      'Vàng',
      'Bạch Kim',
      'Kim Cương',
      'Cao Thủ (Crown)',
      'Vương Giả (Ace)',
      'Chí Tôn (Conqueror)',
    ],
    standardServers: [
      { code: 'VN', name: 'VNG (Việt Nam)' },
      { code: 'ASIA', name: 'Châu Á' },
    ],
    defaultServices: [],
  },

  // 14. PUBG PC (BATTLEGROUNDS)
  {
    id: 'pubg',
    name: 'PUBG: BATTLEGROUNDS',
    shortName: 'PUBG PC',
    desc: 'Cày Ranked RP PUBG PC từ Bronze lên Master, Duo cùng pro player có mic call.',
    iconName: 'Crosshair',
    gradient: 'from-orange-600 to-amber-600',
    accentColor: 'text-orange-400',
    banner: '/images/games/pubg-card.jpg',
    active: true,
    standardRanks: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Master',
    ],
    standardServers: [
      { code: 'SEA', name: 'Đông Nam Á (SEA)' },
      { code: 'KRJP', name: 'Hàn Quốc / Nhật Bản' },
    ],
    defaultServices: [],
  },

  // 15. CALL OF DUTY: MOBILE VN (CODM)
  {
    id: 'codm',
    name: 'Call of Duty: Mobile VN',
    shortName: 'CODM VN',
    desc: 'Cày Huyền Thoại MP & BR, mở camo Kim Cương/Damascus siêu tốc.',
    iconName: 'Crosshair',
    gradient: 'from-zinc-700 to-stone-900',
    accentColor: 'text-yellow-400',
    banner: '/images/games/codm-card.jpg',
    active: true,
    standardRanks: [
      'Tân Binh',
      'Tinh Anh',
      'Chuyên Nghiệp',
      'Bậc Thầy',
      'Đại Kiện Tướng',
      'Huyền Thoại (Legendary)',
    ],
    standardServers: [{ code: 'VN', name: 'VNG (Việt Nam)' }],
    defaultServices: [],
  },

  // 16. NARAKA: BLADEPOINT
  {
    id: 'naraka',
    name: 'NARAKA: BLADEPOINT',
    shortName: 'NARAKA',
    desc: 'Leo rank Asura, Unrivaled Asura, cày điểm chiến lực võ khí và tướng độc quyền.',
    iconName: 'Swords',
    gradient: 'from-red-700 to-amber-700',
    accentColor: 'text-red-400',
    banner: '/images/games/naraka-card.jpg',
    active: true,
    standardRanks: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Solar',
      'Empyrean',
      'Astral',
      'Asura',
    ],
    standardServers: [
      { code: 'SEA', name: 'Đông Nam Á (SEA)' },
      { code: 'AS', name: 'Châu Á' },
    ],
    defaultServices: [],
  },

  // 17. TRUY KÍCH 2 (BATTLE TEAMS 2)
  {
    id: 'truykich2',
    name: 'Truy Kích 2',
    shortName: 'Truy Kích 2',
    desc: 'Cày rank Đặt Bom, Sinh Tồn, nâng cấp vũ khí và hoàn thành Battle Pass nhanh.',
    iconName: 'Crosshair',
    gradient: 'from-blue-700 to-indigo-800',
    accentColor: 'text-blue-400',
    banner: '/images/games/truykich2-card.jpg',
    active: true,
    standardRanks: [
      'Học Viên',
      'Binh Nhì',
      'Hạ Sĩ',
      'Trung Sĩ',
      'Thượng Sĩ',
      'Thiếu Úy',
      'Đại Úy',
      'Tướng Quân',
    ],
    standardServers: [{ code: 'VN', name: 'VTC (Việt Nam)' }],
    defaultServices: [],
  },

  // 18. OVERWATCH 2
  {
    id: 'overwatch2',
    name: 'Overwatch 2',
    shortName: 'Overwatch 2',
    desc: 'Dịch vụ leo rank Competitive 2.0 Overwatch từ Bronze lên Champion.',
    iconName: 'Zap',
    gradient: 'from-orange-500 to-sky-600',
    accentColor: 'text-orange-400',
    banner: '/images/games/overwatch2-card.jpg',
    active: true,
    standardRanks: [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Diamond',
      'Master',
      'Grandmaster',
      'Champion',
    ],
    standardServers: [
      { code: 'ASIA', name: 'Châu Á' },
      { code: 'AMERICAS', name: 'Châu Mỹ' },
      { code: 'EU', name: 'Châu Âu' },
    ],
    defaultServices: [],
  },
];

export const GAMES_CATALOG_STORAGE_KEY = 'leorank_staff_games_catalog';

/**
 * Lấy danh sách Game Catalog (hỗ trợ đọc từ localStorage / cache được cấu hình bởi Staff)
 * Fallback về GAMES_CATALOG mặc định nếu chưa có cấu hình tùy chỉnh
 */
export function getStoredGamesCatalog(): GameDefinition[] {
  if (typeof window === 'undefined') {
    return GAMES_CATALOG;
  }
  try {
    const raw = localStorage.getItem(GAMES_CATALOG_STORAGE_KEY);
    if (!raw) return GAMES_CATALOG;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage parse error
  }
  return GAMES_CATALOG;
}

/**
 * Lưu danh sách Game Catalog tùy chỉnh vào localStorage
 */
export function saveStoredGamesCatalog(games: GameDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GAMES_CATALOG_STORAGE_KEY, JSON.stringify(games));
    // Phát event cho các component cùng tab hoặc khác tab cập nhật
    window.dispatchEvent(new Event('games-catalog-updated'));
  } catch (err) {
    console.error('Failed to save games catalog:', err);
  }
}

/**
 * Khôi phục lại danh sách Game Catalog mặc định
 */
export function resetStoredGamesCatalog(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GAMES_CATALOG_STORAGE_KEY);
    window.dispatchEvent(new Event('games-catalog-updated'));
  } catch (err) {
    console.error('Failed to reset games catalog:', err);
  }
}

export const GAME_ALIASES: Record<string, string> = {
  // Valorant
  val: 'valorant',
  vlt: 'valorant',
  valorant: 'valorant',
  valmobile: 'valmobile',
  valorantmobile: 'valmobile',
  // League of Legends
  lol: 'lol',
  lmht: 'lol',
  league: 'lol',
  leagueoflegends: 'lol',
  // Teamfight Tactics
  tft: 'tft',
  dtcl: 'tft',
  dautruongchanly: 'tft',
  // Counter-Strike 2
  cs: 'cs2',
  csgo: 'cs2',
  cs2: 'cs2',
  // Dota 2
  dota: 'dota2',
  dota2: 'dota2',
  // Arena of Valor / Lien Quan
  aov: 'aov',
  lienquan: 'aov',
  lqm: 'aov',
  // Wild Rift
  wildrift: 'wildrift',
  tocchien: 'wildrift',
  wr: 'wildrift',
  // FC Online
  fco: 'fco',
  fconline: 'fco',
  fifa: 'fco',
  fifaonline4: 'fco',
  fo4: 'fco',
  // Apex Legends
  apex: 'apex',
  apexlegends: 'apex',
  // Overwatch 2
  ow: 'overwatch2',
  ow2: 'overwatch2',
  overwatch: 'overwatch2',
  overwatch2: 'overwatch2',
  // Naraka
  naraka: 'naraka',
  bladepoint: 'naraka',
  // PUBG
  pubg: 'pubg',
  pubgpc: 'pubg',
  pubgm: 'pubgm',
  pubgmobile: 'pubgm',
  // Free Fire
  ff: 'freefire',
  freefire: 'freefire',
  // Call of Duty Mobile
  codm: 'codm',
  codmobile: 'codm',
  callofduty: 'codm',
  // POE 2
  poe2: 'poe2',
  poe: 'poe2',
  // Delta Force
  deltaforce: 'deltaforce',
  df: 'deltaforce',
  // Marvel Rivals
  marvelrivals: 'marvelrivals',
  marvel: 'marvelrivals',
  // Truy Kich 2
  truykich2: 'truykich2',
  truykich: 'truykich2',
};

export function getGameById(gameId: string): GameDefinition | undefined {
  if (!gameId) return undefined;
  const raw = gameId.trim().toLowerCase();
  const resolvedId = GAME_ALIASES[raw] || raw;

  const catalog = typeof window !== 'undefined' ? getStoredGamesCatalog() : GAMES_CATALOG;
  return (
    catalog.find(
      (g) =>
        g.id.toLowerCase() === resolvedId ||
        g.id.toLowerCase() === raw ||
        g.shortName.toLowerCase() === raw ||
        g.shortName.toLowerCase() === resolvedId
    ) ||
    GAMES_CATALOG.find(
      (g) =>
        g.id.toLowerCase() === resolvedId ||
        g.id.toLowerCase() === raw ||
        g.shortName.toLowerCase() === raw ||
        g.shortName.toLowerCase() === resolvedId
    )
  );
}

export interface ServiceTemplate {
  slug: string;
  serviceType?: string;
  name: string;
  desc: string;
  pricingType: 'FIXED' | 'PER_UNIT' | 'TIER_MATRIX' | 'TIER_PER_POINT';
  defaultPrice: number;
  unitName?: string;
  depositPercent: number;
  iconName: string;
  requiresRankSteps?: boolean;
  tierRates?: Record<string, number>;
}

export interface MasteryStep {
  id: string;
  from: number;
  to: number;
  label: string;
  pointsReq: string;
  marksReq: string;
  defaultPrice: number;
}

export const LOL_MASTERY_STEPS: MasteryStep[] = [
  { id: 'm1_2', from: 1, to: 2, label: 'Cấp 1 ➔ Cấp 2', pointsReq: '1.800 Điểm', marksReq: 'Không có', defaultPrice: 20000 },
  { id: 'm2_3', from: 2, to: 3, label: 'Cấp 2 ➔ Cấp 3', pointsReq: '4.200 Điểm', marksReq: 'Không có', defaultPrice: 30000 },
  { id: 'm3_4', from: 3, to: 4, label: 'Cấp 3 ➔ Cấp 4', pointsReq: '6.600 Điểm', marksReq: 'Không có', defaultPrice: 40000 },
  { id: 'm4_5', from: 4, to: 5, label: 'Cấp 4 ➔ Cấp 5', pointsReq: '9.000 Điểm', marksReq: '1 Dấu Ấn', defaultPrice: 50000 },
  { id: 'm5_6', from: 5, to: 6, label: 'Cấp 5 ➔ Cấp 6', pointsReq: '10.000 Điểm', marksReq: '1 Dấu Ấn', defaultPrice: 60000 },
  { id: 'm6_7', from: 6, to: 7, label: 'Cấp 6 ➔ Cấp 7', pointsReq: '11.000 Điểm', marksReq: '1 Dấu Ấn', defaultPrice: 70000 },
  { id: 'm7_8', from: 7, to: 8, label: 'Cấp 7 ➔ Cấp 8', pointsReq: '11.000 Điểm', marksReq: '1 Dấu Ấn', defaultPrice: 80000 },
  { id: 'm8_9', from: 8, to: 9, label: 'Cấp 8 ➔ Cấp 9', pointsReq: '11.000 Điểm', marksReq: '1 Dấu Ấn', defaultPrice: 90000 },
  { id: 'm9_10', from: 9, to: 10, label: 'Cấp 9 ➔ Cấp 10+ (Danh Hiệu)', pointsReq: '11.000 Điểm', marksReq: '2 Dấu Ấn', defaultPrice: 120000 },
];

export interface PromotionTierItem {
  id: string;
  fromTier: string;
  fromDivision: string;
  fromLabel: string;
  toTier: string;
  toDivision: string;
  toLabel: string;
  icon: string;
  targetIcon: string;
  defaultPrice: number;
}

export const LOL_PROMOTION_SERIES: PromotionTierItem[] = [
  {
    id: 'promo_iron_1',
    fromTier: 'IRON',
    fromDivision: 'I',
    fromLabel: 'Sắt I',
    toTier: 'BRONZE',
    toDivision: 'IV',
    toLabel: 'Đồng IV',
    icon: '/images/ranks/iron.png',
    targetIcon: '/images/ranks/bronze.png',
    defaultPrice: 40000,
  },
  {
    id: 'promo_bronze_1',
    fromTier: 'BRONZE',
    fromDivision: 'I',
    fromLabel: 'Đồng I',
    toTier: 'SILVER',
    toDivision: 'IV',
    toLabel: 'Bạc IV',
    icon: '/images/ranks/bronze.png',
    targetIcon: '/images/ranks/silver.png',
    defaultPrice: 50000,
  },
  {
    id: 'promo_silver_1',
    fromTier: 'SILVER',
    fromDivision: 'I',
    fromLabel: 'Bạc I',
    toTier: 'GOLD',
    toDivision: 'IV',
    toLabel: 'Vàng IV',
    icon: '/images/ranks/silver.png',
    targetIcon: '/images/ranks/gold.png',
    defaultPrice: 60000,
  },
  {
    id: 'promo_gold_1',
    fromTier: 'GOLD',
    fromDivision: 'I',
    fromLabel: 'Vàng I',
    toTier: 'PLATINUM',
    toDivision: 'IV',
    toLabel: 'Bạch Kim IV',
    icon: '/images/ranks/gold.png',
    targetIcon: '/images/ranks/platinum.png',
    defaultPrice: 80000,
  },
  {
    id: 'promo_platinum_1',
    fromTier: 'PLATINUM',
    fromDivision: 'I',
    fromLabel: 'Bạch Kim I',
    toTier: 'EMERALD',
    toDivision: 'IV',
    toLabel: 'Lục Bảo IV',
    icon: '/images/ranks/platinum.png',
    targetIcon: '/images/ranks/emerald.png',
    defaultPrice: 110000,
  },
  {
    id: 'promo_emerald_1',
    fromTier: 'EMERALD',
    fromDivision: 'I',
    fromLabel: 'Lục Bảo I',
    toTier: 'DIAMOND',
    toDivision: 'IV',
    toLabel: 'Kim Cương IV',
    icon: '/images/ranks/emerald.png',
    targetIcon: '/images/ranks/diamond.png',
    defaultPrice: 150000,
  },
  {
    id: 'promo_diamond_1',
    fromTier: 'DIAMOND',
    fromDivision: 'I',
    fromLabel: 'Kim Cương I',
    toTier: 'MASTER',
    toDivision: '',
    toLabel: 'Cao Thủ',
    icon: '/images/ranks/diamond.png',
    targetIcon: '/images/ranks/master.png',
    defaultPrice: 220000,
  },
];

export const STANDARD_SERVICE_TEMPLATES: Record<string, ServiceTemplate[]> = {
  LOL: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank / Elo Siêu Tốc',
      desc: 'Leo rank bước nhảy từ Sắt IV đến Cao Thủ với tỷ lệ thắng cao và hoàn thành nhanh chóng.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Trận Thắng & LP Cao Thủ',
      desc: 'Đảm bảo số trận thắng ròng hoặc cày điểm LP Cao Thủ/Thách Đấu tính theo điểm.',
      pricingType: 'PER_UNIT',
      defaultPrice: 1500,
      unitName: 'Điểm LP',
      depositPercent: 30,
      iconName: 'TrendingUp',
    },
    {
      slug: 'matches',
      name: 'Cày Theo Số Trận',
      desc: 'Cày số lượng trận đấu theo yêu cầu với tỷ lệ thắng cam kết cao nhất.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Gamepad2',
    },
    {
      slug: 'duo-boost',
      name: 'Duo Cùng Tuyển Thủ',
      desc: 'Leo rank đánh đôi cùng tuyển thủ từ Sắt IV đến Cao Thủ. Hướng dẫn trực tiếp, bảo mật danh tính.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Users',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Đầu Mùa (Tối đa 5 Trận)',
      desc: 'Đảm bảo kết quả các trận phân hạng mở màn mùa giải thuận lợi nhất (Tối đa 5 trận).',
      pricingType: 'PER_UNIT',
      defaultPrice: 30000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'promotion',
      name: 'Chuỗi Thăng Hạng',
      desc: 'Vượt chuỗi thăng hạng từ Bậc I lên Bậc tiếp theo an toàn, tỷ lệ thắng cao.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 80000,
      depositPercent: 100,
      iconName: 'Zap',
    },
    {
      slug: 'leveling',
      name: 'Cày Cấp Độ 1-30',
      desc: 'Cày cấp tài khoản theo số cấp độ mong muốn (Từ cấp này sang cấp khác), tối đa Tinh Hoa Lam.',
      pricingType: 'PER_UNIT',
      defaultPrice: 10000,
      unitName: 'Cấp độ',
      depositPercent: 100,
      iconName: 'Users',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Coaching',
      desc: 'Dạy kèm 1-1, phân tích replay, hướng dẫn meta và nâng cao kỹ năng tư duy.',
      pricingType: 'PER_UNIT',
      defaultPrice: 100000,
      unitName: 'Giờ',
      depositPercent: 100,
      iconName: 'Target',
    },
    {
      slug: 'mastery',
      name: 'Cày Thông Thạo Tướng (Cấp 1-10+)',
      desc: 'Cày điểm thông thạo & dấu ấn nâng cấp từ Cấp 1 đến Cấp 10+ mở khóa vĩnh viễn Danh hiệu tướng.',
      pricingType: 'PER_UNIT',
      defaultPrice: 50000,
      unitName: 'Cấp thông thạo',
      depositPercent: 100,
      iconName: 'Swords',
    },
  ],
  VALORANT: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank Valorant (Iron ➔ Radiant)',
      desc: 'Leo rank từ Iron đến Radiant với aim sắc bén, tỷ lệ thắng cao và hoàn thành siêu tốc.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Điểm RR (Immortal / Radiant)',
      desc: 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số hoặc chuỗi trận.',
      pricingType: 'TIER_PER_POINT',
      defaultPrice: 5000,
      unitName: 'Điểm RR',
      depositPercent: 40,
      iconName: 'TrendingUp',
    },
    {
      slug: 'matches',
      name: 'Cày Theo Số Trận',
      desc: 'Cày số lượng trận đấu theo yêu cầu với tỷ lệ thắng cam kết cao nhất.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Gamepad2',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Valorant (Tối đa 5 Trận)',
      desc: 'Đảm bảo kết quả các trận phân hạng đạt Rank khởi đầu cao nhất trong Episode/Act mới (Tối đa 5 trận).',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'leveling',
      name: 'Cày Cấp 20 Mở Khóa Đấu Xếp Hạng',
      desc: 'Cày cấp tài khoản lên Level 20 để mở khóa chế độ Competitive (Đấu Xếp Hạng) nhanh chóng.',
      pricingType: 'PER_UNIT',
      defaultPrice: 15000,
      unitName: 'Cấp độ',
      depositPercent: 100,
      iconName: 'Users',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Coaching 1-1 (Aim & Lineup)',
      desc: 'Hướng dẫn kê tâm, setup góc bắn, lineup kỹ năng và đọc map cùng tuyển thủ Radiant.',
      pricingType: 'PER_UNIT',
      defaultPrice: 120000,
      unitName: 'Giờ',
      depositPercent: 100,
      iconName: 'Target',
    },
    {
      slug: 'battle-pass',
      name: 'Cày Battle Pass / Hợp Đồng Đặc Vụ',
      desc: 'Cày kinh nghiệm hoàn thành Battle Pass mùa giải hoặc mở khóa đặc vụ (Agent Contract).',
      pricingType: 'FIXED',
      defaultPrice: 140000,
      depositPercent: 100,
      iconName: 'Zap',
    },
  ],
  TFT: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank ĐTCL (Sắt ➔ Thách Đấu)',
      desc: 'Leo rank cờ ĐTCL chuẩn meta, tối ưu kinh tế và bài đấu lên Thách Đấu.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Top 1-4 & LP Thách Đấu',
      desc: 'Đảm bảo tỷ lệ vào Top 4 và cày điểm LP bậc Cao Thủ / Thách Đấu ĐTCL.',
      pricingType: 'PER_UNIT',
      defaultPrice: 2000,
      unitName: 'Điểm LP',
      depositPercent: 30,
      iconName: 'TrendingUp',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Đầu Mùa ĐTCL (5 Trận)',
      desc: 'Bắn chuỗi phân hạng khởi đầu mùa giải đạt vị trí cao nhất.',
      pricingType: 'FIXED',
      defaultPrice: 140000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Xoay Bài & Eco 1-1',
      desc: 'Kèm 1-1 trực tiếp trong trận, hướng dẫn quản lý vàng, xoay bài linh hoạt theo roll.',
      pricingType: 'PER_UNIT',
      defaultPrice: 100000,
      unitName: 'Giờ học',
      depositPercent: 50,
      iconName: 'Target',
    },
  ],
  CS2: [
    {
      slug: 'rank-boost',
      name: 'Cày Điểm CS Rating Premier',
      desc: 'Tăng điểm CS Rating từ 5.000 đến 25.000+ điểm Premier chuyên nghiệp.',
      pricingType: 'PER_UNIT',
      defaultPrice: 25000,
      unitName: '1.000 Điểm',
      depositPercent: 30,
      iconName: 'TrendingUp',
    },
    {
      slug: 'net-wins',
      name: 'Cày Thắng Trận Competitive',
      desc: 'Cày số trận thắng đảm bảo từng bản đồ (Dust II, Mirage, Inferno...).',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận thắng',
      depositPercent: 50,
      iconName: 'Trophy',
    },
    {
      slug: 'placements',
      name: 'Bắn 10 Trận Mở Xếp Hạng Premier',
      desc: 'Đảm bảo 10 trận thắng đầu tiên để mở mốc xếp hạng CS Rating cao nhất.',
      pricingType: 'FIXED',
      defaultPrice: 200000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Aim & Nades 1-1',
      desc: 'Dạy line-up smoke, flash, molly và chỉnh crosshair placement.',
      pricingType: 'PER_UNIT',
      defaultPrice: 120000,
      unitName: 'Giờ học',
      depositPercent: 50,
      iconName: 'Target',
    },
  ],
  DOTA2: [
    {
      slug: 'rank-boost',
      name: 'Cày Điểm MMR Dota 2',
      desc: 'Leo điểm MMR từ Herald đến Immortal cùng tuyển thủ top bảng xếp hạng.',
      pricingType: 'PER_UNIT',
      defaultPrice: 30000,
      unitName: '100 MMR',
      depositPercent: 40,
      iconName: 'TrendingUp',
    },
    {
      slug: 'net-wins',
      name: 'Cày Trận Thắng Dota 2',
      desc: 'Đảm bảo thắng ròng các trận đấu xếp hạng.',
      pricingType: 'PER_UNIT',
      defaultPrice: 40000,
      unitName: 'Trận thắng',
      depositPercent: 50,
      iconName: 'Trophy',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Calibration (10 Trận)',
      desc: 'Phân hạng điểm khởi đầu mùa giải cao nhất có thể.',
      pricingType: 'FIXED',
      defaultPrice: 220000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Coaching 1-1 Dota 2',
      desc: 'Phân tích replay, kiểm soát laning phase, macro game.',
      pricingType: 'PER_UNIT',
      defaultPrice: 120000,
      unitName: 'Giờ học',
      depositPercent: 50,
      iconName: 'Target',
    },
  ],
  OVERWATCH2: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank Overwatch 2 (Bronze ➔ Grandmaster)',
      desc: 'Leo rank theo bậc từ Bronze đến Grandmaster / Top 500.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Trận Thắng Overwatch 2',
      desc: 'Đảm bảo chuỗi trận thắng ròng các vị trí Tank / Damage / Support.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận thắng',
      depositPercent: 50,
      iconName: 'TrendingUp',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Mùa Giải (5 Trận)',
      desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất.',
      pricingType: 'FIXED',
      defaultPrice: 180000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Coaching 1-1',
      desc: 'Hướng dẫn định vị trí, phối hợp combo chiêu cuối và aim.',
      pricingType: 'PER_UNIT',
      defaultPrice: 120000,
      unitName: 'Giờ học',
      depositPercent: 50,
      iconName: 'Target',
    },
  ],
  AOV: [
    {
      slug: 'rank-boost',
      serviceType: 'rank-boost',
      name: 'Cày Rank Liên Quân (Theo Bậc)',
      desc: 'Leo rank từ Đồng đến Cao Thủ (25k–160k/bậc) & tùy chỉnh từ Cao Thủ lên Đại Cao Thủ, Chiến Tướng, Huyền Thoại.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
      requiresRankSteps: true,
    },
    {
      slug: 'net-wins',
      serviceType: 'net-wins',
      name: 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)',
      desc: 'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.',
      pricingType: 'TIER_PER_POINT',
      defaultPrice: 5000,
      unitName: 'Sao',
      depositPercent: 40,
      iconName: 'Flame',
      tierRates: {
        bronze_diamond: 5000,
        diamond_veteran: 6000,
        veteran_master: 10000,
        master_0_19: 13000,
        gm_20_49: 20000,
        conqueror_50_99: 30000,
        legend_100_plus: 45000,
      },
    },
    {
      slug: 'matches',
      serviceType: 'matches',
      name: 'Cày Theo Số Trận Liên Quân',
      desc: 'Cày số lượng trận đấu xếp hạng / đấu thường theo yêu cầu với tỷ lệ thắng vượt trội.',
      pricingType: 'PER_UNIT',
      defaultPrice: 15000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Gamepad2',
    },
    {
      slug: 'coaching',
      serviceType: 'coaching',
      name: 'Huấn Luyện Coaching 1-1 Liên Quân',
      desc: 'Dạy kèm kỹ năng macro, di chuyển, chọn tướng & chiến thuật leo rank cùng tuyển thủ Chiến Tướng / Thách Đấu.',
      pricingType: 'PER_UNIT',
      defaultPrice: 100000,
      unitName: 'Giờ học',
      depositPercent: 50,
      iconName: 'Target',
    },
  ],
  UNIVERSAL: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank Xếp Hạng Siêu Tốc',
      desc: 'Leo rank thăng hạng nhanh chóng với tỷ lệ thắng vượt trội.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Rank Cao Cấp',
      desc: 'Đảm bảo kết quả cày rank hoặc cày điểm/sao cao cấp theo yêu cầu.',
      pricingType: 'PER_UNIT',
      defaultPrice: 30000,
      unitName: 'Trận thắng',
      depositPercent: 40,
      iconName: 'TrendingUp',
    },
    {
      slug: 'matches',
      name: 'Cày Theo Số Trận',
      desc: 'Cày số lượng trận đấu theo yêu cầu với tỷ lệ thắng cam kết cao nhất.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Gamepad2',
    },
    {
      slug: 'placements',
      name: 'Cày Trận Phân Hạng Đầu Mùa (Tối đa 5 Trận)',
      desc: 'Đảm bảo kết quả tối đa các trận phân hạng mở màn mùa giải mới.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận',
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Coaching 1-1',
      desc: 'Dạy kèm 1-1, phân tích replay, hướng dẫn kỹ năng nâng cao cùng tuyển thủ.',
      pricingType: 'PER_UNIT',
      defaultPrice: 100000,
      unitName: 'Giờ',
      depositPercent: 100,
      iconName: 'Target',
    },
  ],
};

export function getServiceMeta(gameCode: string, slug: string): ServiceTemplate | undefined {
  const code = (gameCode || 'LOL').toUpperCase();
  const list = STANDARD_SERVICE_TEMPLATES[code] || STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] || STANDARD_SERVICE_TEMPLATES['LOL'];
  return list.find((s) => s.slug === slug);
}

