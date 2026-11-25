import { AOV_RANK_IMAGES } from '@/lib/aov';
import { getRankSteps } from '@/lib/rank-calculator';

// 1. Danh sách 16 Máy chủ chuẩn
export interface LolServer {
  name: string;
  code: string;
  platformId: string;
  region: string;
  flag: string;
}

export const LOL_SERVERS: LolServer[] = [
  { name: 'Vietnam', code: 'VN', platformId: 'VN2', region: 'Vietnam', flag: '🇻🇳' },
  { name: 'Southeast Asia', code: 'SEA', platformId: 'SG2', region: 'Southeast Asia', flag: '🌏' },
  { name: 'North America', code: 'NA', platformId: 'NA1', region: 'North America', flag: '🇺🇸' },
  { name: 'Europe West', code: 'EUW', platformId: 'EUW1', region: 'Europe', flag: '🇪🇺' },
  { name: 'Europe Nordic & East', code: 'EUNE', platformId: 'EUN1', region: 'Europe', flag: '🇪🇺' },
  { name: 'Japan', code: 'JP', platformId: 'JP1', region: 'Asia', flag: '🇯🇵' },
  { name: 'Korea', code: 'KR', platformId: 'KR', region: 'Asia', flag: '🇰🇷' },
  { name: 'Taiwan', code: 'TW', platformId: 'TW2', region: 'Asia', flag: '🇹🇼' },
  { name: 'Brazil', code: 'BR', platformId: 'BR1', region: 'Americas', flag: '🇧🇷' },
  { name: 'Türkiye', code: 'TR', platformId: 'TR1', region: 'Europe', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', platformId: 'RU', region: 'Europe', flag: '🇷🇺' },
  { name: 'Oceania', code: 'OCE', platformId: 'OC1', region: 'Oceania', flag: '🇦🇺' },
  { name: 'Latin America North', code: 'LAN', platformId: 'LA1', region: 'Americas', flag: '🇲🇽' },
  { name: 'Latin America South', code: 'LAS', platformId: 'LA2', region: 'Americas', flag: '🇨🇱' },
  { name: 'Middle East', code: 'ME', platformId: 'ME1', region: 'Middle East', flag: '🇦🇪' },
  { name: 'Public Beta Environment', code: 'PBE', platformId: 'PBE', region: 'Americas', flag: '🧪' },
];

// 2. Danh sách Loại Tài Khoản
export const ACCOUNT_TYPES = [
  {
    id: 'Riot',
    name: 'Riot Games',
    desc: 'Tài khoản Riot ID chính thức (Client VNG / Riot)',
    badge: 'Khuyên dùng',
  },
  {
    id: 'Facebook',
    name: 'Facebook',
    desc: 'Đăng nhập liên kết tài khoản Facebook',
  },
  {
    id: 'Google',
    name: 'Google',
    desc: 'Đăng nhập qua Google Account / Gmail',
  },
  {
    id: 'Apple',
    name: 'Apple',
    desc: 'Đăng nhập thông qua Apple ID / iCloud',
  },
  {
    id: 'Xbox',
    name: 'Xbox',
    desc: 'Tài khoản liên kết Xbox Network / Game Pass',
  },
  {
    id: 'PlayStation',
    name: 'PlayStation',
    desc: 'Tài khoản liên kết PlayStation Network (PSN)',
  },
];

// 2b. Danh sách Loại Tài Khoản Liên Quân Mobile (Garena VN)
export const AOV_ACCOUNT_TYPES = [
  {
    id: 'Garena',
    name: 'Garena',
    desc: 'Tài khoản Garena chính thức Liên Quân Mobile VN',
    badge: 'Khuyên dùng',
    logo: '/images/logo-aov/logo-garena.png',
  },
  {
    id: 'Facebook',
    name: 'Facebook',
    desc: 'Đăng nhập liên kết tài khoản Facebook',
    logo: '/images/logo-aov/logo-facebook.png',
  },
  {
    id: 'Apple',
    name: 'Apple',
    desc: 'Đăng nhập thông qua Apple ID / iCloud (iOS)',
    logo: '/images/logo-aov/logo-apple.png',
  },
  {
    id: 'Google',
    name: 'Google',
    desc: 'Đăng nhập thông qua tài khoản Google (Android / iOS)',
    logo: '/images/logo-aov/logo-google.png',
  },
];

// 3. Cấu hình Hệ số Điểm Cộng Mỗi Ván (LP / RR Gain)
export const LP_GAIN_OPTIONS = [
  {
    id: '25_PLUS',
    label: '≥ 25 LP',
    subLabel: '+25 đến +35 LP',
    multiplier: 0.9,
    discountLabel: '-10%',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'MMR rất cao · Leo nhanh',
  },
  {
    id: '20_24',
    label: '20 - 24 LP',
    subLabel: 'Mức phổ thông',
    multiplier: 1.0,
    discountLabel: 'Chuẩn 0%',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'MMR tiêu chuẩn',
  },
  {
    id: '15_19',
    label: '15 - 19 LP',
    subLabel: 'Cần nhiều trận hơn',
    multiplier: 1.1,
    discountLabel: '+10%',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    desc: 'MMR trung bình',
  },
  {
    id: 'UNDER_15',
    label: '< 15 LP',
    subLabel: 'Kẹt chuỗi thua (Hell Elo)',
    multiplier: 1.15,
    discountLabel: '+15%',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    desc: 'MMR thấp · Cần gánh nặng',
  },
];

export const RR_GAIN_OPTIONS = [
  {
    id: '25_PLUS',
    label: '≥ 25 RR',
    subLabel: '+25 đến +35 RR',
    multiplier: 0.9,
    discountLabel: '-10%',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'MMR rất cao · Leo nhanh',
  },
  {
    id: '20_24',
    label: '20 - 24 RR',
    subLabel: 'Mức phổ thông',
    multiplier: 1.0,
    discountLabel: 'Chuẩn 0%',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'MMR tiêu chuẩn',
  },
  {
    id: '15_19',
    label: '15 - 19 RR',
    subLabel: 'Cần nhiều trận hơn',
    multiplier: 1.1,
    discountLabel: '+10%',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    desc: 'MMR trung bình',
  },
  {
    id: 'UNDER_15',
    label: '< 15 RR',
    subLabel: 'Kẹt chuỗi thua (Hell Elo)',
    multiplier: 1.15,
    discountLabel: '+15%',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    desc: 'MMR thấp · Cần gánh nặng',
  },
];

// 4. Cấu hình Tier Ranks Valorant (Iron 1 đến Radiant)
export const VALORANT_TIER_CONFIG: Record<
  string,
  {
    name: string;
    image: string;
    textColor: string;
    borderColor: string;
    activeBorder: string;
    bgGradient: string;
    glowClass: string;
    badgeBg: string;
  }
> = {
  IRON: {
    name: 'Sắt (Iron)',
    image: '/images/valorant/Iron_1_Rank.png',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-800',
    activeBorder: 'border-zinc-400 ring-2 ring-zinc-400/40',
    bgGradient: 'from-zinc-900/90 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(161,161,170,0.15)]',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
  BRONZE: {
    name: 'Đồng (Bronze)',
    image: '/images/valorant/Bronze_1_Rank.png',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-600 ring-2 ring-amber-600/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(217,119,6,0.15)]',
    badgeBg: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  },
  SILVER: {
    name: 'Bạc (Silver)',
    image: '/images/valorant/Silver_1_Rank.png',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-800',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400/40',
    bgGradient: 'from-slate-900/40 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(203,213,225,0.15)]',
    badgeBg: 'bg-slate-800/50 text-slate-300 border-slate-700',
  },
  GOLD: {
    name: 'Vàng (Gold)',
    image: '/images/valorant/Gold_1_Rank.png',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-900/40',
    activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40',
    bgGradient: 'from-yellow-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  PLATINUM: {
    name: 'Bạch Kim (Plat)',
    image: '/images/valorant/Platinum_1_Rank.png',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-900/40',
    activeBorder: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgGradient: 'from-cyan-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  DIAMOND: {
    name: 'Kim Cương (Dia)',
    image: '/images/valorant/Diamond_1_Rank.png',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-900/40',
    activeBorder: 'border-purple-400 ring-2 ring-purple-400/40',
    bgGradient: 'from-purple-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  ASCENDANT: {
    name: 'Huyền Thoại (Asc)',
    image: '/images/valorant/Ascendant_1_Rank.png',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-900/40',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40',
    bgGradient: 'from-emerald-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  IMMORTAL: {
    name: 'Bất Tử (Immortal)',
    image: '/images/valorant/Immortal_1_Rank.png',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-900/40',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/40',
    bgGradient: 'from-rose-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  RADIANT: {
    name: 'Radiant',
    image: '/images/valorant/Radiant_Rank.png',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-400 ring-2 ring-amber-400/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
};

// 4b. Cấu hình Tier Ranks LMHT (Chỉ từ Sắt IV đến Cao Thủ)
export const TIER_CONFIG: Record<
  string,
  {
    name: string;
    image: string;
    textColor: string;
    borderColor: string;
    activeBorder: string;
    bgGradient: string;
    glowClass: string;
    badgeBg: string;
  }
> = {
  IRON: {
    name: 'Sắt',
    image: '/images/ranks/iron.png',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-800',
    activeBorder: 'border-zinc-400 ring-2 ring-zinc-400/40',
    bgGradient: 'from-zinc-900/90 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(161,161,170,0.15)]',
    badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  },
  BRONZE: {
    name: 'Đồng',
    image: '/images/ranks/bronze.png',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-600 ring-2 ring-amber-600/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(217,119,6,0.15)]',
    badgeBg: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  },
  SILVER: {
    name: 'Bạc',
    image: '/images/ranks/silver.png',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-800',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400/40',
    bgGradient: 'from-slate-900/40 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(203,213,225,0.15)]',
    badgeBg: 'bg-slate-800/50 text-slate-300 border-slate-700',
  },
  GOLD: {
    name: 'Vàng',
    image: '/images/ranks/gold.png',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-900/40',
    activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40',
    bgGradient: 'from-yellow-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  PLATINUM: {
    name: 'Bạch Kim',
    image: '/images/ranks/platinum.png',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-900/40',
    activeBorder: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgGradient: 'from-cyan-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  EMERALD: {
    name: 'Lục Bảo',
    image: '/images/ranks/emerald.png',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-900/40',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40',
    bgGradient: 'from-emerald-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  DIAMOND: {
    name: 'Kim Cương',
    image: '/images/ranks/diamond.png',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-900/40',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/40',
    bgGradient: 'from-blue-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  MASTER: {
    name: 'Cao Thủ',
    image: '/images/ranks/master.png',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-900/40',
    activeBorder: 'border-purple-500 ring-2 ring-purple-500/40',
    bgGradient: 'from-purple-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
};

// 5. Cấu hình Tier Ranks Liên Quân Mobile (Đồng III đến Huyền Thoại 100★)
export const AOV_TIER_CONFIG: Record<
  string,
  {
    name: string;
    image: string;
    textColor: string;
    borderColor: string;
    activeBorder: string;
    bgGradient: string;
    glowClass: string;
    badgeBg: string;
  }
> = {
  BRONZE: {
    name: 'Đồng',
    image: AOV_RANK_IMAGES.BRONZE,
    textColor: 'text-amber-500',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-600 ring-2 ring-amber-600/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(217,119,6,0.15)]',
    badgeBg: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  },
  SILVER: {
    name: 'Bạc',
    image: AOV_RANK_IMAGES.SILVER,
    textColor: 'text-slate-300',
    borderColor: 'border-slate-800',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400/40',
    bgGradient: 'from-slate-900/40 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(203,213,225,0.15)]',
    badgeBg: 'bg-slate-800/50 text-slate-300 border-slate-700',
  },
  GOLD: {
    name: 'Vàng',
    image: AOV_RANK_IMAGES.GOLD,
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-900/40',
    activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40',
    bgGradient: 'from-yellow-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  PLATINUM: {
    name: 'Bạch Kim',
    image: AOV_RANK_IMAGES.PLATINUM,
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-900/40',
    activeBorder: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgGradient: 'from-cyan-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  DIAMOND: {
    name: 'Kim Cương',
    image: AOV_RANK_IMAGES.DIAMOND,
    textColor: 'text-blue-400',
    borderColor: 'border-blue-900/40',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/40',
    bgGradient: 'from-blue-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  VETERAN: {
    name: 'Tinh Anh',
    image: AOV_RANK_IMAGES.VETERAN,
    textColor: 'text-purple-300',
    borderColor: 'border-purple-900/40',
    activeBorder: 'border-purple-400 ring-2 ring-purple-400/40',
    bgGradient: 'from-purple-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  MASTER: {
    name: 'Cao Thủ',
    image: AOV_RANK_IMAGES.MASTER,
    textColor: 'text-amber-400',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  GRANDMASTER: {
    name: 'Đại Cao Thủ',
    image: AOV_RANK_IMAGES.GRANDMASTER_I,
    textColor: 'text-sky-400',
    borderColor: 'border-sky-900/40',
    activeBorder: 'border-sky-400 ring-2 ring-sky-400/40',
    bgGradient: 'from-sky-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(56,189,248,0.25)]',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  },
  CONQUEROR: {
    name: 'Chiến Tướng',
    image: AOV_RANK_IMAGES.CONQUEROR,
    textColor: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-900/40',
    activeBorder: 'border-fuchsia-500 ring-2 ring-fuchsia-500/40',
    bgGradient: 'from-fuchsia-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(217,70,239,0.25)]',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
  },
  LEGEND: {
    name: 'Huyền Thoại',
    image: AOV_RANK_IMAGES.LEGEND,
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-700/40',
    activeBorder: 'border-yellow-400 ring-2 ring-yellow-400/40',
    bgGradient: 'from-yellow-950/40 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(250,204,21,0.28)]',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/40',
  },
};

export const AOV_SINGLE_STEP_TIERS = ['MASTER', 'GRANDMASTER', 'CONQUEROR', 'LEGEND'];

export const DIVISIONS = ['IV', 'III', 'II', 'I'];

// Chuyển đổi hai chiều giữa số La Mã (V, IV, III, II, I) và số Ả Rập (5, 4, 3, 2, 1) trong ID của RANK_STEPS
export const DIVISION_TO_NUM: Record<string, string> = {
  V: '5',
  IV: '4',
  III: '3',
  II: '2',
  I: '1',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
  '1': '1',
};

export const NUM_TO_DIVISION: Record<string, string> = {
  '5': 'V',
  '4': 'IV',
  '3': 'III',
  '2': 'II',
  '1': 'I',
  V: 'V',
  IV: 'IV',
  III: 'III',
  II: 'II',
  I: 'I',
};

export const VALORANT_DIVISIONS = ['1', '2', '3'];

// Helper: Lấy chuẩn ID trong RANK_STEPS (VD: 'IRON_1', 'MASTER', 'GRANDMASTER', 'RADIANT')
export const getRankStepId = (gameCode: string, tier: string, div?: string): string => {
  const upperGame = (gameCode || '').toUpperCase();
  const isVal = upperGame === 'VALORANT';
  if (isVal) {
    if (tier === 'RADIANT') return 'RADIANT';
    return `${tier}_${div || '1'}`;
  }
  const isAovGame = ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(upperGame);
  if (isAovGame) {
    if (AOV_SINGLE_STEP_TIERS.includes(tier)) return tier;
    const fallbackDiv = ['BRONZE', 'SILVER'].includes(tier)
      ? '3'
      : tier === 'GOLD'
        ? '4'
        : '5';
    const num = DIVISION_TO_NUM[div || fallbackDiv] || div || fallbackDiv;
    return `${tier}_${num}`;
  }
  if (tier === 'MASTER') return 'MASTER';
  const num = DIVISION_TO_NUM[div || '4'] || div || '4';
  return `${tier}_${num}`;
};

// Helper: Lấy danh sách Divisions hợp lệ cho từng Tier của từng game
export const getDivisionsForTier = (gameCode: string, tier: string): string[] => {
  const upperGame = (gameCode || '').toUpperCase();
  const isVal = upperGame === 'VALORANT';
  if (isVal) {
    if (tier === 'RADIANT') return [];
    return VALORANT_DIVISIONS;
  }
  const isAovGame = ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(upperGame);
  if (isAovGame) {
    if (AOV_SINGLE_STEP_TIERS.includes(tier)) return [];
    if (['BRONZE', 'SILVER'].includes(tier)) {
      return ['III', 'II', 'I'];
    }
    if (tier === 'GOLD') {
      return ['IV', 'III', 'II', 'I'];
    }
    if (['PLATINUM', 'DIAMOND', 'VETERAN'].includes(tier)) {
      return ['V', 'IV', 'III', 'II', 'I'];
    }
    return ['IV', 'III', 'II', 'I'];
  }
  if (tier === 'MASTER') return [];
  return DIVISIONS;
};

// Helper: Tìm index trong RANK_STEPS chính xác 100%
export const findRankStepIndex = (gameCode: string, tier: string, div?: string): number => {
  const steps = getRankSteps(gameCode);
  const targetId = getRankStepId(gameCode, tier, div);
  return steps.findIndex((r) => r.id === targetId || (r.tier === tier && (!div || r.division === div)));
};

// Hệ số giá cho Phân Hạng Đầu Mùa theo mức Rank mùa trước (Sắt đến Cao Thủ)
export const PLACEMENT_TIER_MULTIPLIERS: Record<string, number> = {
  IRON: 1.0,
  BRONZE: 1.0,
  SILVER: 1.05,
  GOLD: 1.15,
  PLATINUM: 1.3,
  EMERALD: 1.5,
  DIAMOND: 1.8,
  MASTER: 2.2,
};

// Danh sách Rank mùa trước cho Phân Hạng Đầu Mùa (Chỉ hiển thị 8 Tier từ Sắt đến Cao Thủ, không có Bậc I-IV)
export const PLACEMENT_AVAILABLE_TIERS = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
] as const;
