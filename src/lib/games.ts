// src/lib/games.ts

export interface GameDefinition {
  id: string;
  name: string;
  shortName: string;
  desc: string;
  iconName: string;
  gradient: string;
  accentColor: string;
  banner: string;
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

export const GAMES_CATALOG: GameDefinition[] = [
  {
    id: 'lol',
    name: 'League of Legends',
    shortName: 'LMHT',
    desc: 'Dịch vụ leo rank, cày điểm LP Cao Thủ/Thách Đấu, chuỗi thăng hạng và phân hạng đầu mùa.',
    iconName: 'Swords',
    gradient: 'from-blue-600 to-cyan-600',
    accentColor: 'text-blue-400',
    banner: '/images/games/lol-card.jpg',
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
      { code: 'SEA', name: 'Đông Nam Á (SG/TH/PH/TW)' },
    ],
    defaultServices: [],
  },
  {
    id: 'tft',
    name: 'Teamfight Tactics',
    shortName: 'ĐTCL',
    desc: 'Leo rank Đấu Trường Chân Lý, cày Top 4 bền vững, hướng dẫn giáo án meta chuyên sâu.',
    iconName: 'Gamepad2',
    gradient: 'from-amber-600 to-orange-600',
    accentColor: 'text-amber-400',
    banner: '/images/games/tft-card.jpg',
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
  {
    id: 'valorant',
    name: 'Valorant',
    shortName: 'Valorant',
    desc: 'Cày Rank Valorant, Duo cùng tuyển thủ Immortal/Radiant, cày chuỗi thắng an toàn.',
    iconName: 'Crosshair',
    gradient: 'from-rose-600 to-red-600',
    accentColor: 'text-rose-400',
    banner: '/images/games/val-card.jpg',
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
  {
    id: 'fconline',
    name: 'FC Online',
    shortName: 'FC Online',
    desc: 'Cày xếp hạng 1vs1, GLXH, cày sự kiện và cày Star Point FC Online.',
    iconName: 'Trophy',
    gradient: 'from-emerald-600 to-teal-700',
    accentColor: 'text-emerald-400',
    banner: '/images/games/fconline-card.jpg',
    active: true,
    standardRanks: [
      'Nghiệp Dư',
      'Bán Chuyên',
      'Chuyên Nghiệp',
      'Thế Giới',
      'Tinh Anh',
      'Huyền Thoại',
      'Siêu Sao',
      'Thách Đấu',
    ],
    standardServers: [{ code: 'VN', name: 'Việt Nam' }],
    defaultServices: [],
  },
];

export function getGameById(gameId: string): GameDefinition | undefined {
  return GAMES_CATALOG.find(
    (g) => g.id.toLowerCase() === gameId.toLowerCase()
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

