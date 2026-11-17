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
      'Chiến Tướng',
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
  name: string;
  desc: string;
  pricingType: 'FIXED' | 'PER_UNIT' | 'TIER_MATRIX';
  defaultPrice: number;
  unitName?: string;
  depositPercent: number;
  iconName: string;
}

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
      slug: 'placements',
      name: 'Phân Hạng Đầu Mùa (5 Trận)',
      desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải thuận lợi.',
      pricingType: 'FIXED',
      defaultPrice: 150000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'promotion',
      name: 'Chuỗi Thăng Hạng',
      desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn mà không lo rớt bậc.',
      pricingType: 'FIXED',
      defaultPrice: 80000,
      depositPercent: 100,
      iconName: 'Zap',
    },
    {
      slug: 'leveling',
      name: 'Cày Cấp Độ 1-30',
      desc: 'Cày cấp tài khoản lên cấp 30 nhanh nhất, tối đa Tinh Hoa Lam để mở xếp hạng.',
      pricingType: 'FIXED',
      defaultPrice: 120000,
      depositPercent: 100,
      iconName: 'Users',
    },
    {
      slug: 'coaching',
      name: 'Huấn Luyện Coaching',
      desc: 'Dạy kèm 1-1, phân tích replay, duo cùng tuyển thủ.',
      pricingType: 'PER_UNIT',
      defaultPrice: 100000,
      unitName: 'Giờ học',
      depositPercent: 100,
      iconName: 'Target',
    },
    {
      slug: 'mastery',
      name: 'Cày Thông Thạo Tướng',
      desc: 'Cày điểm thông thạo & nâng cấp mốc biểu cảm cho vị tướng bạn yêu thích.',
      pricingType: 'PER_UNIT',
      defaultPrice: 60000,
      unitName: 'Mốc cấp',
      depositPercent: 100,
      iconName: 'Swords',
    },
  ],
  TFT: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank ĐTCL Siêu Tốc',
      desc: 'Leo rank Đấu Trường Chân Lý top 4 đều đặn từ Sắt đến Thách Đấu.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng ĐTCL (5 Trận)',
      desc: 'Đảm bảo kết quả 5 trận phân hạng đầu mùa ĐTCL.',
      pricingType: 'FIXED',
      defaultPrice: 120000,
      depositPercent: 100,
      iconName: 'Medal',
    },
    {
      slug: 'coaching',
      name: 'Coaching ĐTCL 1-1',
      desc: 'Hướng dẫn đọc meta, xoay bài, quản lý vàng và giữ máu hiệu quả.',
      pricingType: 'PER_UNIT',
      defaultPrice: 80000,
      unitName: 'Giờ học',
      depositPercent: 100,
      iconName: 'Target',
    },
  ],
  VALORANT: [
    {
      slug: 'rank-boost',
      name: 'Cày Rank Valorant Siêu Tốc',
      desc: 'Leo rank từ Iron đến Radiant với aim sắc bén và tỷ lệ thắng ấn tượng.',
      pricingType: 'TIER_MATRIX',
      defaultPrice: 0,
      depositPercent: 100,
      iconName: 'Trophy',
    },
    {
      slug: 'net-wins',
      name: 'Cày Trận Thắng RR',
      desc: 'Cày điểm xếp hạng RR hoặc thắng ròng theo số trận.',
      pricingType: 'PER_UNIT',
      defaultPrice: 35000,
      unitName: 'Trận thắng',
      depositPercent: 50,
      iconName: 'TrendingUp',
    },
    {
      slug: 'placements',
      name: 'Phân Hạng Valorant (5 Trận)',
      desc: 'Bắn 5 trận phân hạng đạt Rank khởi đầu cao nhất.',
      pricingType: 'FIXED',
      defaultPrice: 180000,
      depositPercent: 100,
      iconName: 'Medal',
    },
  ],
};

export function getServiceMeta(gameCode: string, slug: string): ServiceTemplate | undefined {
  const code = (gameCode || 'LOL').toUpperCase();
  const list = STANDARD_SERVICE_TEMPLATES[code] || STANDARD_SERVICE_TEMPLATES['LOL'];
  return list.find((s) => s.slug === slug);
}

