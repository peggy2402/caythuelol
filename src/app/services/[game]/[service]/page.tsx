// src/app/services/[game]/[service]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import ServerFlag from '@/components/ServerFlag';
import { AnimatePresence, motion } from 'framer-motion';
import UserBadge from '@/components/UserBadge';
import {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Shield,
  ShieldCheck,
  Star,
  CheckCircle2,
  Info,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Tag,
  Gamepad2,
  Sparkles,
  AlertCircle,
  Crown,
  Check,
  Search,
  Shuffle,
  X,
  ArrowRightLeft,
  ChevronRight,
  Globe,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { getGameById, GAMES_CATALOG, getServiceMeta, LOL_PROMOTION_SERIES, PromotionTierItem } from '@/lib/games';
import {
  LOL_RANK_STEPS,
  VALORANT_RANK_STEPS,
  AOV_RANK_STEPS,
  calculateRankBoost,
  RankDivision,
  AddonSelections,
  getRankSteps,
  getRankImage,
  getPointBoostTiers,
  PointBoostTierSegment,
} from '@/lib/rank-calculator';

// 1. Danh sách 16 Máy chủ chuẩn
interface LolServer {
  name: string;
  code: string;
  platformId: string;
  region: string;
  flag: string;
}

const LOL_SERVERS: LolServer[] = [
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
const ACCOUNT_TYPES = [
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

// 3. Cấu hình Hệ số Điểm Cộng Mỗi Ván (LP / RR Gain)
const LP_GAIN_OPTIONS = [
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

const RR_GAIN_OPTIONS = [
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
const VALORANT_TIER_CONFIG: Record<
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

// 4. Cấu hình Tier Ranks (Chỉ từ Sắt IV đến Cao Thủ)
const TIER_CONFIG: Record<
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

// 5. Cấu hình Tier Ranks Liên Quân Mobile (Đồng IV đến Cao Thủ)
const AOV_TIER_CONFIG: Record<
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
    image: '/images/aov/Bronze.png',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-900/40',
    activeBorder: 'border-amber-600 ring-2 ring-amber-600/40',
    bgGradient: 'from-amber-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(217,119,6,0.15)]',
    badgeBg: 'bg-amber-900/30 text-amber-400 border-amber-800/40',
  },
  SILVER: {
    name: 'Bạc',
    image: '/images/aov/Silver.png',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-800',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400/40',
    bgGradient: 'from-slate-900/40 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(203,213,225,0.15)]',
    badgeBg: 'bg-slate-800/50 text-slate-300 border-slate-700',
  },
  GOLD: {
    name: 'Vàng',
    image: '/images/aov/Gold.png',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-900/40',
    activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40',
    bgGradient: 'from-yellow-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  PLATINUM: {
    name: 'Bạch Kim',
    image: '/images/aov/Platium.png',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-900/40',
    activeBorder: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgGradient: 'from-cyan-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  DIAMOND: {
    name: 'Kim Cương',
    image: '/images/aov/Diamond.png',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-900/40',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/40',
    bgGradient: 'from-blue-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  VETERAN: {
    name: 'Tinh Anh',
    image: '/images/aov/Veteran.png',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-900/40',
    activeBorder: 'border-purple-400 ring-2 ring-purple-400/40',
    bgGradient: 'from-purple-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  MASTER: {
    name: 'Cao Thủ',
    image: '/images/aov/Master.png',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-900/40',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/40',
    bgGradient: 'from-rose-950/30 to-zinc-950/90',
    glowClass: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
};

const DIVISIONS = ['IV', 'III', 'II', 'I'];

// Chuyển đổi hai chiều giữa số La Mã (V, IV, III, II, I) và số Ả Rập (5, 4, 3, 2, 1) trong ID của RANK_STEPS
const DIVISION_TO_NUM: Record<string, string> = {
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

const NUM_TO_DIVISION: Record<string, string> = {
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

const VALORANT_DIVISIONS = ['1', '2', '3'];

// Helper: Lấy chuẩn ID trong RANK_STEPS (VD: 'IRON_1', 'MASTER', 'RADIANT')
const getRankStepId = (gameCode: string, tier: string, div?: string): string => {
  const isVal = (gameCode || '').toUpperCase() === 'VALORANT';
  if (isVal) {
    if (tier === 'RADIANT') return 'RADIANT';
    return `${tier}_${div || '1'}`;
  }
  if (tier === 'MASTER') return 'MASTER';
  const num = DIVISION_TO_NUM[div || '4'] || div || '4';
  return `${tier}_${num}`;
};

// Helper: Lấy danh sách Divisions hợp lệ cho từng Tier của từng game
const getDivisionsForTier = (gameCode: string, tier: string): string[] => {
  const isVal = (gameCode || '').toUpperCase() === 'VALORANT';
  if (isVal) {
    if (tier === 'RADIANT') return [];
    return VALORANT_DIVISIONS;
  }
  const isAovGame = (gameCode || '').toUpperCase() === 'AOV' || (gameCode || '').toUpperCase() === 'LIENQUAN';
  if (isAovGame) {
    if (tier === 'MASTER') return [];
    if (['PLATINUM', 'DIAMOND', 'VETERAN'].includes(tier)) {
      return ['V', 'IV', 'III', 'II', 'I'];
    }
    return ['IV', 'III', 'II', 'I'];
  }
  if (tier === 'MASTER') return [];
  return DIVISIONS;
};

// Helper: Tìm index trong RANK_STEPS chính xác 100%
const findRankStepIndex = (gameCode: string, tier: string, div?: string): number => {
  const steps = getRankSteps(gameCode);
  const targetId = getRankStepId(gameCode, tier, div);
  return steps.findIndex((r) => r.id === targetId || (r.tier === tier && (!div || r.division === div)));
};

// Component hiển thị Logo các nhà cung cấp tài khoản
function ProviderLogo({ provider, className = 'w-5 h-5' }: { provider: string; className?: string }) {
  switch (provider) {
    case 'Riot':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#EF4444">
          <path d="M13.43 2.18L2.09 7.64l3.19 11.75 4.67-1.3-1.63-6 1.7-.47 1.25 4.61 2.55-.71-1.25-4.61 1.7-.47 1.25 4.61 2.55-.71-1.6-5.89 2.45-.68.84 3.09 2.5-.7L21.91 2.6l-8.48-.42zM3.48 20.37l4.9-1.36.95 3.49-4.9 1.36-.95-3.49z" />
        </svg>
      );
    case 'Facebook':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'Google':
      return (
        <svg className={className} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.36 7.31 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      );
    case 'Apple':
      return (
        <svg className={className} viewBox="0 0 170 170" fill="currentColor">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.98-6.19-9.56-11.02-20.91-14.48-34.05-3.47-13.14-5.2-25.17-5.2-36.1 0-13.59 3.39-25.04 10.18-34.36 6.78-9.31 15.35-14.07 25.7-14.28 4.7 0 9.87 1.25 15.52 3.75 5.65 2.5 9.4 3.8 11.25 3.92 1.48-.12 5.56-1.5 12.24-4.14 6.68-2.63 12.08-3.83 16.2-3.6 12.08.74 21.57 5.17 28.48 13.3-10.74 6.53-16.01 15.44-15.82 26.74.19 8.92 3.52 16.48 10 22.68 6.47 6.2 14.16 9.68 23.07 10.45-2.12 6.54-4.87 13.14-8.24 19.8zM119.22 31.84c0-7.39 2.65-14.44 7.95-21.14 5.3-6.7 11.85-10.7 19.64-12-0.21 2.22-.21 3.92-.21 5.08 0 7.39-2.76 14.54-8.27 21.46-5.51 6.91-12.19 10.7-20.04 11.36-.11-1.48-.17-3.08-.17-4.76z"/>
        </svg>
      );
    case 'Xbox':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#107C10">
          <path d="M4.64 3.58C6.67 1.84 9.22.8 12 .8c2.78 0 5.33 1.04 7.36 2.78-1.53 1.57-3.8 3.8-5.32 5.37-.36.38-.72.76-1.07 1.14-.38-.41-.75-.8-1.12-1.2-1.53-1.63-3.69-3.79-5.21-5.31zm-2.8 3.65C.66 9.17 0 11.49 0 14c0 3.89 1.63 7.38 4.22 9.87C3.2 21.2 2.3 17.5 2.8 14c.3-2.1.8-4.5 1.9-6.6l-2.86-.17zm20.32 0l-2.86.17c1.1 2.1 1.6 4.5 1.9 6.6.5 3.5-.4 7.2-1.42 9.87 2.59-2.49 4.22-5.98 4.22-9.87 0-2.51-.66-4.83-1.84-6.77zM12 12.3c.6 0 1.2.3 1.5.8 1.4 2.1 3.5 5.5 4.6 8.8C16.3 23.2 14.2 24 12 24s-4.3-.8-6.1-2.1c1.1-3.3 3.2-6.7 4.6-8.8.3-.5.9-.8 1.5-.8z"/>
        </svg>
      );
    case 'PlayStation':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#003791">
          <path d="M8.07 4.62c0-.55.45-1 .99-1h3.76c2.72 0 4.93 2.21 4.93 4.93 0 2.22-1.47 4.1-3.5 4.72v-2.09c1-.48 1.69-1.49 1.69-2.67 0-1.62-1.32-2.94-2.94-2.94H10.9v10.5h-2.83V4.62zm-6.2 12.51c-.69-.47-1.1-1.25-1.1-2.08 0-1.21.87-2.22 2.05-2.43 1.83-.33 5.48-.96 5.48-.96l-1.07 1.88-3.48.58c-.51.08-.88.52-.88 1.04 0 .39.21.75.55.94l6.09 3.52-2.61.94-5.03-3.43zm11.97.94l6.09-3.52c.34-.19.55-.55.55-.94 0-.52-.37-.96-.88-1.04l-3.48-.58-1.07-1.88s3.65.63 5.48.96c1.18.21 2.05 1.22 2.05 2.43 0 .83-.41 1.61-1.1 2.08l-5.03 3.43-2.61-.94z"/>
        </svg>
      );
    default:
      return <Lock className={className} />;
  }
}

function ServiceBookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = (params?.game as string) || 'lol';
  const serviceSlug = (params?.service as string) || 'rank-boost';
  const boosterQuery = searchParams.get('booster') || '';
  const cleanBoosterUsername = boosterQuery.replace(/^@+/, '');

  const game = getGameById(gameId) || GAMES_CATALOG[0];
  const serviceMeta = getServiceMeta(game.id, serviceSlug);
  const serviceDef =
    game.defaultServices.find((s) => s.slug === serviceSlug) ||
    serviceMeta || {
      slug: serviceSlug,
      name: serviceSlug === 'rank-boost' ? 'Cày Rank / Elo Siêu Tốc' : 'Dịch Vụ Cày Thuê',
      desc: 'Dịch vụ cày thuê chuyên nghiệp cam kết tốc độ và bảo mật.',
      iconName: 'Trophy',
      pricingType: (serviceSlug === 'rank-boost' ? 'TIER_MATRIX' : 'FIXED') as any,
      defaultPrice: 100000,
      depositPercent: 100,
      requiredFields: ['account_credentials'],
    };

  const isValorant = (game.id || '').toUpperCase() === 'VALORANT';
  const isAov = (game.id || '').toUpperCase() === 'AOV' || (game.id || '').toUpperCase() === 'LIENQUAN';
  const isPointBoost = serviceSlug === 'net-wins' || serviceDef.pricingType === 'PER_UNIT';
  const activeRankSteps = isValorant ? VALORANT_RANK_STEPS : isAov ? AOV_RANK_STEPS : LOL_RANK_STEPS;
  const activeTierConfig = isValorant ? VALORANT_TIER_CONFIG : isAov ? AOV_TIER_CONFIG : TIER_CONFIG;
  const activeDivisions = isValorant ? VALORANT_DIVISIONS : DIVISIONS;
  const activeGainOptions = isValorant ? RR_GAIN_OPTIONS : LP_GAIN_OPTIONS;

  // 1. States cho Cày Rank (Rank Calculator)
  const [currentRankId, setCurrentRankId] = useState<string>(isValorant ? 'GOLD_1' : 'GOLD_4');
  const [desiredRankId, setDesiredRankId] = useState<string>(isValorant ? 'GOLD_2' : 'GOLD_3');
  const [lpGain, setLpGain] = useState<string>('25_PLUS');
  const [queueType, setQueueType] = useState<string>('SOLO_DUO');
  const [server, setServer] = useState<string>('VN');

  // Point Boost States (Cày Điểm RR / LP / Sao)
  const pointTiers = useMemo(() => getPointBoostTiers(game.id), [game.id]);
  const [selectedPointSegment, setSelectedPointSegment] = useState<string>(
    isValorant ? 'immortal1_2' : isAov ? 'master_stars' : 'master'
  );
  const [currentPoints, setCurrentPoints] = useState<number>(isValorant ? 40 : isAov ? 0 : 0);
  const [desiredPoints, setDesiredPoints] = useState<number>(isValorant ? 80 : isAov ? 10 : 100);
  const gainedPoints = useMemo(() => Math.max(0, desiredPoints - currentPoints), [desiredPoints, currentPoints]);

  // States cho Chuỗi Thăng Hạng (Promotion Series)
  const isPromotion = serviceSlug === 'promotion';
  const isRankBoost = serviceSlug === 'rank-boost' || (!isPointBoost && !isPromotion);
  const isRiotGame = ['lol', 'valorant', 'tft'].includes((game.id || '').toLowerCase());

  // Tra cứu / Kiểm tra thông tin tài khoản Riot (Rank & LP)
  const [accountCheckInput, setAccountCheckInput] = useState('');
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [accountCheckError, setAccountCheckError] = useState('');
  const [checkedAccount, setCheckedAccount] = useState<{
    gameName: string;
    tagLine: string;
    riotId: string;
    tier: string;
    tierVi: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    queueName: string;
    isMock?: boolean;
  } | null>(null);

  const [selectedPromoId, setSelectedPromoId] = useState<string>('promo_platinum_1');
  const selectedPromo = useMemo(() => {
    return LOL_PROMOTION_SERIES.find((p) => p.id === selectedPromoId) || LOL_PROMOTION_SERIES[4];
  }, [selectedPromoId]);

  // Modals States
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankModalTarget, setRankModalTarget] = useState<'CURRENT' | 'DESIRED'>('CURRENT');
  const [tempTier, setTempTier] = useState<string>('GOLD');
  const [tempDivision, setTempDivision] = useState<string>(isValorant ? '1' : 'IV');

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverSearchTerm, setServerSearchTerm] = useState('');
  const [serverRegionFilter, setServerRegionFilter] = useState('ALL');

  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);
  const [showGainTooltip, setShowGainTooltip] = useState(false);

  // 2. States cho Tùy chọn mở rộng (Addons)
  const [addons, setAddons] = useState<AddonSelections>({
    schedule: false,
    specificRole: false,
    specificChamps: false,
    livestream: false,
    flash: false,
    duo: false,
  });

  // 3. States cho Thông tin tài khoản cần cày
  const [accountType, setAccountType] = useState<string>('Riot');
  const [ingameAccount, setIngameAccount] = useState('');
  const [ingamePassword, setIngamePassword] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // 4. States cho Booster được chỉ định
  const [assignedBooster, setAssignedBooster] = useState<any>(null);
  const [loadingBooster, setLoadingBooster] = useState(false);
  const [boosterList, setBoosterList] = useState<any[]>([]);
  const [isManualSelectBooster, setIsManualSelectBooster] = useState(Boolean(cleanBoosterUsername));
  const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);
  const [boosterSearchTerm, setBoosterSearchTerm] = useState('');

  // 5. States cho Mã giảm giá, Phí sàn & Submit
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper lấy token
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Lắng nghe phím ESC & Khóa cuộn trang khi mở bất kỳ Modal nào trên PC
  useEffect(() => {
    const isAnyModalOpen = isRankModalOpen || isServerModalOpen || isAccountTypeModalOpen || isBoosterModalOpen;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isBoosterModalOpen) {
          setIsBoosterModalOpen(false);
          setBoosterSearchTerm('');
        }
        if (isRankModalOpen) {
          setIsRankModalOpen(false);
        }
        if (isServerModalOpen) {
          setIsServerModalOpen(false);
          setServerSearchTerm('');
        }
        if (isAccountTypeModalOpen) {
          setIsAccountTypeModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRankModalOpen, isServerModalOpen, isAccountTypeModalOpen, isBoosterModalOpen]);

  // Fetch phí sàn từ cấu hình hệ thống
  useEffect(() => {
    fetch('/api/settings/platform-fee')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.fee === 'number') {
          setPlatformFeePercent(data.fee);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch danh sách booster của game để khách chọn nếu muốn (lọc theo service)
  useEffect(() => {
    fetch(`/api/boosters?game=${encodeURIComponent(game.id.toUpperCase())}&service=${encodeURIComponent(serviceSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.boosters || [];
        setBoosterList(list);

        // Nếu khách hàng vào trang tự nhiên (không chỉ định qua query URL)
        // và đang ở chế độ Ghép Nhanh Tự Động, tự động random chọn 1 booster phù hợp
        if (!cleanBoosterUsername && list.length > 0) {
          const randomIndex = Math.floor(Math.random() * list.length);
          const picked = list[randomIndex];
          setAssignedBooster({
            user: picked,
            boosterData: picked.boosterProfile || picked.booster_info || picked,
          });
          setIsManualSelectBooster(false);

          const boosterCoupon = picked.boosterProfile?.service_settings?.coupon || picked.service_settings?.coupon;
          if (boosterCoupon?.isActive && boosterCoupon?.code) {
            setAppliedCoupon(boosterCoupon);
            setCouponCode(boosterCoupon.code);
          }
        }
      })
      .catch(() => {});
  }, [game.id, serviceSlug, cleanBoosterUsername]);

  // Nếu có query booster, fetch thông tin booster đó
  useEffect(() => {
    if (!cleanBoosterUsername) return;
    setLoadingBooster(true);
    fetch(`/api/boosters/${encodeURIComponent(cleanBoosterUsername)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setAssignedBooster(data);
          setIsManualSelectBooster(true);
          const boosterCoupon = data.boosterData?.service_settings?.coupon;
          if (boosterCoupon?.isActive && boosterCoupon?.code) {
            setAppliedCoupon(boosterCoupon);
            setCouponCode(boosterCoupon.code);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingBooster(false));
  }, [cleanBoosterUsername]);

  // Lọc danh sách Booster trong Modal tìm kiếm
  const filteredBoosters = useMemo(() => {
    const q = boosterSearchTerm.toLowerCase().trim();
    if (!q) return boosterList;
    return boosterList.filter((b) => {
      const name = (b.displayName || '').toLowerCase();
      const username = (b.username || '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [boosterList, boosterSearchTerm]);

  // Đổi ngẫu nhiên booster khác trong chế độ Ghép Nhanh Tự Động
  const handleRandomRerollBooster = () => {
    if (boosterList.length === 0) {
      toast.info('Hiện chưa có tuyển thủ nào sẵn sàng cho dịch vụ này.');
      return;
    }
    if (boosterList.length === 1) {
      toast.info('Hiện tại chỉ có 1 tuyển thủ sẵn sàng cho dịch vụ này.');
      return;
    }

    const currentId = assignedBooster?.user?._id || assignedBooster?._id;
    const others = boosterList.filter((b) => b._id !== currentId);
    const pool = others.length > 0 ? others : boosterList;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const picked = pool[randomIndex];

    setAssignedBooster({
      user: picked,
      boosterData: picked.boosterProfile || picked.booster_info || picked,
    });
    setIsManualSelectBooster(false);

    const bCoupon = picked.boosterProfile?.service_settings?.coupon || picked.service_settings?.coupon;
    if (bCoupon?.isActive && bCoupon?.code) {
      setAppliedCoupon(bCoupon);
      setCouponCode(bCoupon.code);
      toast.success(`Đã tự động ghép: @${picked.username} (Áp dụng mã giảm ${bCoupon.discountPercent}%)`);
    } else {
      setAppliedCoupon(null);
      setCouponCode('');
      toast.success(`Đã tự động ghép: @${picked.username}!`);
    }
  };

  // Xử lý chọn Booster từ Modal
  const handleSelectBooster = (booster: any) => {
    setAssignedBooster({
      user: booster,
      boosterData: booster.boosterProfile || booster.booster_info || booster,
    });
    setIsManualSelectBooster(true);
    const boosterCoupon = booster.boosterProfile?.service_settings?.coupon || booster.service_settings?.coupon;
    if (boosterCoupon?.isActive && boosterCoupon?.code) {
      setAppliedCoupon(boosterCoupon);
      setCouponCode(boosterCoupon.code);
      toast.success(`Đã chọn tuyển thủ @${booster.username} & áp dụng mã giảm ${boosterCoupon.discountPercent}%!`);
    } else {
      setAppliedCoupon(null);
      setCouponCode('');
      toast.success(`Đã chọn tuyển thủ @${booster.username}!`);
    }
    setIsBoosterModalOpen(false);
    setBoosterSearchTerm('');
  };

  // Hệ số Gain cấu hình chuẩn xác theo yêu cầu người dùng
  const lpMultiplier = useMemo(() => {
    const opt = activeGainOptions.find((o) => o.id === lpGain);
    return opt ? opt.multiplier : 1.0;
  }, [activeGainOptions, lpGain]);

  // Point Boost Calculation Helpers
  const pointUnit = isValorant ? 'RR' : isAov ? 'Sao' : 'LP';
  const selectedPointTierObj = useMemo(() => {
    return pointTiers.find((t) => t.id === selectedPointSegment) || pointTiers[0];
  }, [pointTiers, selectedPointSegment]);

  // Cấu hình dịch vụ riêng của Booster nếu khách đã chỉ định
  const boosterSettings =
    assignedBooster?.service_settings ||
    assignedBooster?.booster_info?.service_settings ||
    assignedBooster?.boosterData?.service_settings ||
    assignedBooster?.boosterData?.booster_info?.service_settings;

  const matchingBoosterService = useMemo(() => {
    if (!assignedBooster) return null;
    const customList = boosterSettings?.customServices || [];
    return customList.find(
      (s: any) =>
        (s.gameCode || '').toUpperCase() === game.id.toUpperCase() &&
        (s.serviceType === 'net-wins' || s.slug === 'net-wins' || s.serviceType === serviceSlug)
    );
  }, [assignedBooster, boosterSettings, game.id, serviceSlug]);

  const segmentRate = useMemo(() => {
    if (matchingBoosterService?.tierRates?.[selectedPointSegment]) {
      return Number(matchingBoosterService.tierRates[selectedPointSegment]);
    }
    if (matchingBoosterService?.price && matchingBoosterService.price > 0) {
      return Number(matchingBoosterService.price);
    }
    return selectedPointTierObj?.defaultPrice || (isValorant ? 5000 : isAov ? 15000 : 1000);
  }, [matchingBoosterService, selectedPointSegment, selectedPointTierObj, isValorant, isAov]);

  const boosterStandardConfig = boosterSettings?.standardConfig;
  const boosterMultiplier = boosterStandardConfig?.rankPriceMultiplier || 1.0;
  const boosterAddonsConfig =
    assignedBooster?.addonsConfig ||
    boosterSettings?.addonsConfig ||
    boosterStandardConfig?.addonsConfig;
  const boosterStepOverrides =
    boosterSettings?.stepOverrides ||
    boosterStandardConfig?.stepOverrides;

  // Cấu hình chi tiết từng addon (Ưu tiên cấu hình thực tế từ Booster)
  const scheduleCfg = boosterAddonsConfig?.schedule || { enabled: true, percent: 20 };
  const specificRoleCfg = boosterAddonsConfig?.specificRole || { enabled: true, percent: 25 };
  const specificChampsCfg = boosterAddonsConfig?.specificChamps || { enabled: true, percent: 30 };
  const livestreamCfg = boosterAddonsConfig?.livestream || { enabled: true, fee: 349000 };
  const flashCfg = boosterAddonsConfig?.flash || { enabled: true, percent: 35 };
  const duoCfg = boosterAddonsConfig?.duo || { enabled: true, percent: 50 };

  // Tỷ lệ cọc giữ chỗ: Ưu tiên tỷ lệ booster cấu hình riêng cho gói này, nếu không thì lấy mặc định theo dịch vụ
  const effectiveDepositPercent = useMemo(() => {
    if (assignedBooster && typeof matchingBoosterService?.depositPercent === 'number' && matchingBoosterService.depositPercent > 0) {
      return Number(matchingBoosterService.depositPercent);
    }
    return serviceDef.depositPercent || (isPointBoost ? 30 : 100);
  }, [assignedBooster, matchingBoosterService?.depositPercent, serviceDef.depositPercent, isPointBoost]);

  // Tính toán bảng giá (Hỗ trợ Cày Điểm RR/LP, Chuỗi Thăng Hạng và Cày Bậc Rank)
  const calculation = useMemo(() => {
    if (isPromotion) {
      const basePromoPrice =
        assignedBooster?.stepOverrides?.[selectedPromo.id] ??
        matchingBoosterService?.stepOverrides?.[selectedPromo.id] ??
        selectedPromo.defaultPrice;

      let addonPercentage = 0;
      let addonFlatFee = 0;
      if (addons.duo && duoCfg.enabled) addonPercentage += (duoCfg.percent ?? 50) / 100;
      if (addons.flash && flashCfg.enabled) addonPercentage += (flashCfg.percent ?? 35) / 100;
      if (addons.specificChamps && specificChampsCfg.enabled) addonPercentage += (specificChampsCfg.percent ?? 30) / 100;
      if (addons.specificRole && specificRoleCfg.enabled) addonPercentage += (specificRoleCfg.percent ?? 25) / 100;
      if (addons.schedule && scheduleCfg.enabled) addonPercentage += (scheduleCfg.percent ?? 20) / 100;
      if (addons.livestream && livestreamCfg.enabled) addonFlatFee += livestreamCfg.fee ?? 349000;

      const percentageAddons = Math.round(basePromoPrice * addonPercentage);
      const totalAddons = percentageAddons + addonFlatFee;
      const total = basePromoPrice + totalAddons;

      return {
        basePrice: basePromoPrice,
        stepsCount: 1,
        addonsCost: totalAddons,
        totalPrice: total,
        depositAmount: total,
        stepsBreakdown: [],
      };
    }

    if (isPointBoost) {
      const rawPointPrice = Math.round(gainedPoints * segmentRate * lpMultiplier);
      let addonPercentage = 0;
      let addonFlatFee = 0;
      if (addons.duo && duoCfg.enabled) addonPercentage += (duoCfg.percent ?? 50) / 100;
      if (addons.flash && flashCfg.enabled) addonPercentage += (flashCfg.percent ?? 35) / 100;
      if (addons.specificChamps && specificChampsCfg.enabled) addonPercentage += (specificChampsCfg.percent ?? 30) / 100;
      if (addons.specificRole && specificRoleCfg.enabled) addonPercentage += (specificRoleCfg.percent ?? 25) / 100;
      if (addons.schedule && scheduleCfg.enabled) addonPercentage += (scheduleCfg.percent ?? 20) / 100;
      if (addons.livestream && livestreamCfg.enabled) addonFlatFee += livestreamCfg.fee ?? 349000;

      const percentageAddons = Math.round(rawPointPrice * addonPercentage);
      const totalAddons = percentageAddons + addonFlatFee;
      const total = rawPointPrice + totalAddons;
      const ratio = effectiveDepositPercent / 100;

      return {
        basePrice: rawPointPrice,
        stepsCount: gainedPoints,
        addonsCost: totalAddons,
        totalPrice: total,
        depositAmount: Math.round(total * ratio),
        stepsBreakdown: [],
      };
    }

    return calculateRankBoost({
      currentRankId,
      desiredRankId,
      rankSteps: activeRankSteps,
      lpGainMultiplier: lpMultiplier,
      addons,
      boosterPriceMultiplier: assignedBooster ? boosterMultiplier : 1.0,
      depositPercent: effectiveDepositPercent,
      stepOverrides: assignedBooster ? boosterStepOverrides : undefined,
      addonsConfig: assignedBooster ? boosterAddonsConfig : undefined,
    });
  }, [
    isPointBoost,
    gainedPoints,
    segmentRate,
    currentRankId,
    desiredRankId,
    activeRankSteps,
    lpMultiplier,
    addons,
    duoCfg,
    flashCfg,
    specificChampsCfg,
    specificRoleCfg,
    scheduleCfg,
    livestreamCfg,
    effectiveDepositPercent,
    isManualSelectBooster,
    assignedBooster,
    boosterMultiplier,
    boosterStepOverrides,
    boosterAddonsConfig,
    isPromotion,
    selectedPromo,
    matchingBoosterService,
  ]);

  // Tính giá sau khi áp dụng coupon và cộng phí dịch vụ hệ thống
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;

    // 1. Nếu là Loyalty Voucher hoặc voucher có số tiền giảm cố định (VND)
    if (typeof appliedCoupon.discountAmount === 'number' && appliedCoupon.discountAmount > 0) {
      return Math.min(calculation.totalPrice, appliedCoupon.discountAmount);
    }
    if (appliedCoupon.type === 'FIXED' && typeof appliedCoupon.value === 'number') {
      return Math.min(calculation.totalPrice, appliedCoupon.value);
    }

    // 2. Nếu là voucher theo % (Booster coupon hoặc coupon hệ thống)
    const percent = appliedCoupon.discountPercent || (appliedCoupon.type === 'PERCENTAGE' ? appliedCoupon.value : 0);
    if (percent > 0) {
      const calcDiscount = Math.round((calculation.totalPrice * percent) / 100);
      if (appliedCoupon.maxDiscount && calcDiscount > appliedCoupon.maxDiscount) {
        return appliedCoupon.maxDiscount;
      }
      return calcDiscount;
    }

    return 0;
  }, [calculation.totalPrice, appliedCoupon]);

  const subtotalAfterDiscount = useMemo(() => {
    return Math.max(0, calculation.totalPrice - discountAmount);
  }, [calculation.totalPrice, discountAmount]);

  const serviceFee = useMemo(() => {
    if (platformFeePercent <= 0) return 0;
    return Math.round((subtotalAfterDiscount * platformFeePercent) / 100);
  }, [subtotalAfterDiscount, platformFeePercent]);

  const finalPrice = useMemo(() => {
    return subtotalAfterDiscount + serviceFee;
  }, [subtotalAfterDiscount, serviceFee]);

  const finalDeposit = useMemo(() => {
    const ratio = effectiveDepositPercent / 100;
    return Math.round(finalPrice * ratio);
  }, [finalPrice, effectiveDepositPercent]);

  // Rank Objects
  const currentRankObj = useMemo(() => {
    return activeRankSteps.find((r) => r.id === currentRankId) || activeRankSteps[0];
  }, [activeRankSteps, currentRankId]);

  const desiredRankObj = useMemo(() => {
    return activeRankSteps.find((r) => r.id === desiredRankId) || activeRankSteps[1] || activeRankSteps[0];
  }, [activeRankSteps, desiredRankId]);

  const currentRankIndex = useMemo(() => {
    return activeRankSteps.findIndex((r) => r.id === currentRankId);
  }, [activeRankSteps, currentRankId]);

  const desiredRankIndex = useMemo(() => {
    return activeRankSteps.findIndex((r) => r.id === desiredRankId);
  }, [activeRankSteps, desiredRankId]);

  // Server Object
  const currentServerObj = useMemo(() => {
    return LOL_SERVERS.find((s) => s.code === server) || LOL_SERVERS[0];
  }, [server]);

  // Lọc Server theo Search & Region
  const filteredServers = useMemo(() => {
    return LOL_SERVERS.filter((s) => {
      const matchesRegion = serverRegionFilter === 'ALL' || s.region === serverRegionFilter;
      if (!matchesRegion) return false;
      if (!serverSearchTerm.trim()) return true;
      const q = serverSearchTerm.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.platformId.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
      );
    });
  }, [serverSearchTerm, serverRegionFilter]);

  // Regions list
  const serverRegions = useMemo(() => {
    const set = new Set<string>();
    LOL_SERVERS.forEach((s) => set.add(s.region));
    return ['ALL', ...Array.from(set)];
  }, []);

  // Account Type Object
  const currentAccountTypeObj = useMemo(() => {
    return ACCOUNT_TYPES.find((a) => a.id === accountType) || ACCOUNT_TYPES[0];
  }, [accountType]);

  // Xử lý mở Modal chọn Rank
  const handleOpenRankModal = (target: 'CURRENT' | 'DESIRED') => {
    if (target === 'CURRENT' && isRiotGame && (isRankBoost || serviceSlug === 'rank-boost')) {
      if (!checkedAccount) {
        toast.info('Vui lòng nhập và kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Rank hiện tại!');
        const el = document.getElementById('riot-account-check-box');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setRankModalTarget(target);
    if (target === 'CURRENT') {
      // Nếu rank hiện tại >= rank mong muốn, tự động đưa temp về bậc thấp hơn rank mong muốn 1 nấc
      if (currentRankIndex >= desiredRankIndex) {
        const fallback = activeRankSteps[Math.max(0, desiredRankIndex - 1)];
        setTempTier(fallback.tier);
        setTempDivision(fallback.division || (isValorant ? '1' : 'IV'));
      } else {
        setTempTier(currentRankObj.tier);
        setTempDivision(currentRankObj.division || (isValorant ? '1' : 'IV'));
      }
    } else {
      // Nếu rank mong muốn <= rank hiện tại, tự động đưa temp về bậc cao hơn rank hiện tại 1 nấc
      if (desiredRankIndex <= currentRankIndex) {
        const fallback = activeRankSteps[Math.min(activeRankSteps.length - 1, currentRankIndex + 1)];
        setTempTier(fallback.tier);
        setTempDivision(fallback.division || (isValorant ? '1' : 'IV'));
      } else {
        setTempTier(desiredRankObj.tier);
        setTempDivision(desiredRankObj.division || (isValorant ? '1' : 'IV'));
      }
    }
    setIsRankModalOpen(true);
  };

  // Xử lý xác nhận chọn Rank từ Modal
  const handleConfirmRank = () => {
    const selectedRankId = getRankStepId(game.id, tempTier, tempDivision);
    const newIdx = findRankStepIndex(game.id, tempTier, tempDivision);

    if (newIdx === -1) {
      setIsRankModalOpen(false);
      return;
    }

    if (rankModalTarget === 'CURRENT') {
      // Validate: Rank hiện tại BẮT BUỘC phải thấp hơn Rank mong muốn
      if (newIdx >= desiredRankIndex) {
        toast.error(`Rank hiện tại (${activeRankSteps[newIdx].label}) phải thấp hơn Rank mong muốn (${desiredRankObj.label})!`);
        return;
      }
      setCurrentRankId(selectedRankId);
      toast.success(`Đã chọn Rank hiện tại: ${activeRankSteps[newIdx].label}`);
    } else {
      // Validate: Rank mong muốn BẮT BUỘC phải cao hơn Rank hiện tại
      if (newIdx <= currentRankIndex) {
        toast.error(`Rank mong muốn (${activeRankSteps[newIdx].label}) phải cao hơn Rank hiện tại (${currentRankObj.label})!`);
        return;
      }
      setDesiredRankId(selectedRankId);
      toast.success(`Đã chọn Rank mong muốn: ${activeRankSteps[newIdx].label}`);
    }

    setIsRankModalOpen(false);
  };

  // Tra cứu & Kiểm tra Rank & Điểm LP từ Riot Games API
  const handleCheckAccountRank = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameToCheck = accountCheckInput.trim();
    if (!nameToCheck) {
      toast.error('Vui lòng nhập tên in-game và tagline (Ví dụ: Mary Tái Lâm #2003)');
      return;
    }

    setIsCheckingAccount(true);
    setAccountCheckError('');

    const targetQueue = isValorant
      ? 'COMPETITIVE'
      : queueType === 'FLEX'
      ? 'RANKED_FLEX_SR'
      : 'RANKED_SOLO_5x5';

    try {
      const res = await fetch('/api/games/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: (game.id || 'LOL').toUpperCase(),
          server: server || 'VN',
          name: nameToCheck,
          queueType: queueType || 'SOLO_DUO',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        let errMsg = data.error || data.message || data.mockReason || 'Lỗi kiểm tra thông tin người chơi';
        if (
          errMsg.includes('RIOT_API_KEY') ||
          errMsg.includes('developer.riotgames.com') ||
          errMsg.includes('401') ||
          errMsg.includes('403') ||
          errMsg.includes('Unauthorized')
        ) {
          errMsg = 'Hệ thống đang bận. Vui lòng thử lại sau!';
        }
        setAccountCheckError(errMsg);
        toast.error(errMsg);
        return;
      }

      if (data.isMock) {
        const mockMsg =
          data.mockReason?.includes('RIOT_API_KEY') || data.mockReason?.includes('developer.riotgames.com')
            ? 'Hệ thống đang bận. Vui lòng thử lại sau!'
            : data.mockReason || 'Dữ liệu thử nghiệm';
        toast.warning(`Chế độ giả lập (Mock): ${mockMsg}`);
      }

      const matchedLeague =
        Array.isArray(data.leagues)
          ? data.leagues.find((l: any) => l.queueType === targetQueue) || data.leagues[0]
          : null;

      const rawTier = (matchedLeague?.tier || 'UNRANKED').toUpperCase();
      const rawRank = (matchedLeague?.rank || '').toUpperCase();
      const rawLp = Number(matchedLeague?.leaguePoints ?? 0);
      const wins = Number(matchedLeague?.wins ?? 0);
      const losses = Number(matchedLeague?.losses ?? 0);
      const tierVi = formatRankDisplayVi(rawTier);
      const fullName = data.gameName ? `${data.gameName}#${data.tagLine}` : nameToCheck;

      // 1. DỊCH VỤ RANK BOOST: Nếu mức rank > Cao Thủ (Master) -> Validate & Báo lỗi
      if (isRankBoost) {
        const isAboveMaster = ['GRANDMASTER', 'CHALLENGER'].includes(rawTier);
        if (isAboveMaster) {
          const errMsg = 'Vui lòng nhập ingame có mức Rank Cao Thủ trở xuống';
          setAccountCheckError(`${errMsg} (Tài khoản hiện đang là ${tierVi})`);
          toast.error(errMsg);
          return;
        }

        // Rank <= Cao Thủ: Tự động cập nhật Bậc Rank hiện tại
        const romanToNum: Record<string, string> = {
          I: '1',
          II: '2',
          III: '3',
          IV: '4',
          '1': '1',
          '2': '2',
          '3': '3',
          '4': '4',
        };

        let stepId = '';
        if (rawTier === 'MASTER') {
          stepId = 'MASTER';
        } else if (rawTier !== 'UNRANKED') {
          const divNumber = romanToNum[rawRank] || '4';
          stepId = `${rawTier}_${divNumber}`;
        }

        const foundStep = activeRankSteps.find((s) => s.id === stepId);
        if (foundStep) {
          setCurrentRankId(foundStep.id);
          const curIdx = activeRankSteps.findIndex((s) => s.id === foundStep.id);
          const desIdx = activeRankSteps.findIndex((s) => s.id === desiredRankId);
          if (desIdx <= curIdx) {
            const nextIdx = Math.min(curIdx + 1, activeRankSteps.length - 1);
            setDesiredRankId(activeRankSteps[nextIdx].id);
          }
        }

        toast.success(
          `Đã xác thực tài khoản: ${fullName} (${tierVi} ${rawRank} - ${rawLp} LP). Đã tự động cập nhật Rank hiện tại!`
        );
      }

      // 2. DỊCH VỤ NET WINS / CÀY ĐIỂM (isPointBoost): Tự động điền điểm hiện tại & chọn phân khúc
      if (isPointBoost || serviceSlug === 'net-wins') {
        setCurrentPoints(rawLp);
        if (desiredPoints <= rawLp) {
          setDesiredPoints(rawLp + 100);
        }

        if (rawTier === 'MASTER') {
          setSelectedPointSegment('master');
        } else if (rawTier === 'GRANDMASTER') {
          setSelectedPointSegment('grandmaster');
        } else if (rawTier === 'CHALLENGER') {
          setSelectedPointSegment('challenger');
        }

        toast.success(
          `Đã xác thực tài khoản: ${fullName} (${tierVi} - ${rawLp} LP). Đã tự động điền vào Điểm hiện tại!`
        );
      }

      // Đồng bộ vào thông tin tài khoản cần cày
      setIngameAccount(fullName);
      setCheckedAccount({
        gameName: data.gameName || fullName,
        tagLine: data.tagLine || '',
        riotId: fullName,
        tier: rawTier,
        tierVi,
        rank: rawRank,
        lp: rawLp,
        wins,
        losses,
        queueName: queueType === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi',
        isMock: data.isMock,
      });
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi kiểm tra thông tin tài khoản';
      setAccountCheckError(msg);
      toast.error(msg);
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    const cleanCode = couponCode.trim().toUpperCase();
    setIsApplyingCoupon(true);

    try {
      // 1. Nếu là mã Voucher đổi từ Tích Điểm Loyalty (bắt đầu bằng LRV-)
      if (cleanCode.startsWith('LRV-')) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          toast.error('Vui lòng đăng nhập để áp dụng voucher tích điểm của bạn');
          return;
        }

        const res = await fetch('/api/loyalty/vouchers/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: cleanCode,
            orderAmount: calculation.totalPrice,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Voucher không hợp lệ hoặc đã hết hạn');
        }

        setAppliedCoupon(data.voucher);
        toast.success(`Đã áp dụng voucher ${data.voucher.title || cleanCode} thành công!`);
        return;
      }

      // 2. Nếu là coupon riêng của tuyển thủ được chỉ định
      const boosterCoupon = assignedBooster?.boosterData?.service_settings?.coupon;
      if (boosterCoupon && boosterCoupon.isActive && boosterCoupon.code.toUpperCase() === cleanCode) {
        setAppliedCoupon(boosterCoupon);
        toast.success(`Đã áp dụng mã giảm giá ${boosterCoupon.discountPercent}% của tuyển thủ!`);
        return;
      }

      // 3. Kiểm tra qua API coupon hệ thống
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          orderValue: calculation.totalPrice,
          boosterId: assignedBooster?.user?._id || assignedBooster?._id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
      }

      setAppliedCoupon(data.coupon);
      toast.success('Áp dụng mã giảm giá thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Xử lý Đặt hàng & Escrow Hold
  const handlePlaceOrder = async () => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!userStr || !token) {
      toast.error('Vui lòng đăng nhập để tiến hành đặt dịch vụ');
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    // BẮT BUỘC: Kiểm tra & xác thực thông tin tài khoản Riot trước khi đặt hàng
    if (isRiotGame && (isRankBoost || isPointBoost || serviceSlug === 'net-wins')) {
      if (!checkedAccount) {
        toast.error('Vui lòng kiểm tra và xác thực thông tin tài khoản Riot (Ingame # Tagline) trước khi đặt hàng!');
        const checkEl = document.getElementById('riot-account-check-box');
        if (checkEl) {
          checkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    if (calculation.totalPrice <= 0) {
      toast.error(isPointBoost ? 'Vui lòng chọn số điểm cần cày hợp lệ' : 'Vui lòng chọn rank mong muốn cao hơn rank hiện tại');
      return;
    }

    if (isPointBoost) {
      if (currentPoints < 0 || desiredPoints < 0) {
        toast.error('Điểm hiện tại và điểm mong muốn không được nhỏ hơn 0');
        return;
      }
      if (currentPoints >= desiredPoints) {
        toast.error('Điểm mong muốn phải lớn hơn điểm hiện tại (Điểm hiện tại không được lớn hơn điểm mong muốn)');
        return;
      }
    }

    if (!ingameAccount.trim() || !ingamePassword.trim()) {
      toast.error('Vui lòng điền đầy đủ tài khoản và mật khẩu in-game');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderPayload = {
        game: game.id.toUpperCase(),
        serviceType: serviceSlug.toUpperCase().replace(/-/g, '_'),
        boosterId: assignedBooster?.user?._id || null,
        is_auto_matched: !isManualSelectBooster && Boolean(assignedBooster),
        pricing: {
          original_price: calculation.totalPrice,
          listed_price: calculation.totalPrice,
          base_price: calculation.basePrice,
          addons_cost: calculation.addonsCost,
          service_fee: serviceFee,
          platform_fee_percent: platformFeePercent,
          discount_amount: discountAmount,
          funding_source: appliedCoupon?.code?.toUpperCase().startsWith('LRV-')
            ? 'PLATFORM'
            : appliedCoupon?.isBooster
            ? 'BOOSTER'
            : appliedCoupon
            ? 'PLATFORM'
            : null,
          platform_subsidy: appliedCoupon?.code?.toUpperCase().startsWith('LRV-') ? discountAmount : 0,
          booster_discount: !appliedCoupon?.code?.toUpperCase().startsWith('LRV-') && appliedCoupon?.isBooster ? discountAmount : 0,
          final_price: finalPrice,
          total_amount: finalPrice,
          deposit_amount: finalDeposit,
          deposit_percent: effectiveDepositPercent,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
        },
        service_data: isPromotion
          ? {
              is_promotion: true,
              promo_from: selectedPromo.fromLabel,
              promo_to: selectedPromo.toLabel,
              current_rank: selectedPromo.fromLabel,
              desired_rank: selectedPromo.toLabel,
              tier: selectedPromo.fromTier,
              target_tier: selectedPromo.toTier,
              division: selectedPromo.fromDivision,
              target_division: selectedPromo.toDivision,
              queue_type: queueType,
              server,
              addons,
              steps_count: 1,
            }
          : isPointBoost
          ? {
              is_point_boost: true,
              calc_mode: 'BY_LP',
              segment: selectedPointSegment,
              segment_label: selectedPointTierObj.label,
              current_rank: selectedPointTierObj.label,
              desired_rank: `${selectedPointTierObj.label} (${desiredPoints} ${pointUnit})`,
              start_lp: currentPoints,
              target_lp: desiredPoints,
              current_lp: currentPoints,
              current_points: currentPoints,
              desired_points: desiredPoints,
              gained_points: gainedPoints,
              target_points: gainedPoints,
              num_games: gainedPoints,
              unit_price_per_lp: segmentRate,
              unit: pointUnit,
              rate: segmentRate,
              lp_gain: lpGain,
              queue_type: queueType,
              server,
              addons,
            }
          : {
              current_rank: currentRankObj?.label,
              desired_rank: desiredRankObj?.label,
              lp_gain: lpGain,
              queue_type: queueType,
              server,
              addons,
              steps_count: calculation.stepsCount,
            },
        account_credentials: {
          platform: accountType,
          username: ingameAccount.trim(),
          password: ingamePassword.trim(),
        },
        coupon_applied: appliedCoupon ? appliedCoupon.code : null,
        note: orderNote.trim(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Đặt đơn thành công! Hệ thống đang kết nối tuyển thủ.');
        router.push(`/orders/${data.order?._id || data.orderId || ''}`);
      } else {
        toast.error(data.message || 'Số dư ví không đủ để giữ cọc hoặc lỗi hệ thống');
        if (data.insufficientBalance) {
          router.push('/wallet?tab=deposit');
        }
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTierMeta = activeTierConfig[currentRankObj.tier] || activeTierConfig.GOLD || activeTierConfig.IRON;
  const desiredTierMeta = activeTierConfig[desiredRankObj.tier] || activeTierConfig.GOLD || activeTierConfig.IRON;
  const currentRankImg = getRankImage(game.id, currentRankObj);
  const desiredRankImg = getRankImage(game.id, desiredRankObj);

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-24 pb-36 lg:pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Navigation & Breadcrumbs - Thoáng đãng, không bị bóp nghẹt trên mobile */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 mb-6">
          <BackButton fallbackUrl={`/services/${game.id}`} />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap py-1 scrollbar-none max-w-full">
            <Link href="/services" className="hover:text-white transition-colors shrink-0">
              Sàn Dịch Vụ
            </Link>
            <ChevronRight size={13} className="text-zinc-600 shrink-0" />
            <Link href={`/services/${game.id}`} className="hover:text-white transition-colors shrink-0">
              {game.name}
            </Link>
            <ChevronRight size={13} className="text-zinc-600 shrink-0" />
            <span className="text-white font-bold truncate shrink-0">{serviceDef.name}</span>
          </nav>
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy size={14} />
            <span>{game.shortName} · {serviceDef.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Bảng Tính Giá & Đặt Dịch Vụ Cày Rank
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Hệ thống tự động cộng dồn chi phí theo từng bậc rank. Chọn tuyển thủ yêu thích hoặc để hệ thống tự động ghép tuyển thủ uy tín nhất.
          </p>
        </div>

        {/* CẤU HÌNH CHI TIẾT & BẢNG TÍNH GIÁ */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Cấu hình chi tiết gói dịch vụ
            </h2>
            <p className="text-xs text-zinc-400">
              Tùy chỉnh thông số cày rank, chọn tuyển thủ và tính toán chi phí theo thời gian thực
            </p>
          </div>
        </div>

        {/* Main Grid: Form Left (7 Cols), Summary Right (5 Cols) on Desktop (xl+) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM CẤU HÌNH DỊCH VỤ */}
          <div className="xl:col-span-7 space-y-6">
            {/* 1. LỰA CHỌN TUYỂN THỦ THỰC HIỆN */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <Users className="text-blue-400 w-4 h-4" />
                    <span>Lựa Chọn Tuyển Thủ (Booster)</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Chọn ghép nhanh tự động hoặc chỉ định tuyển thủ bạn tin tưởng
                  </p>
                </div>
                {assignedBooster && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    isManualSelectBooster
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                  }`}>
                    {isManualSelectBooster ? <Crown size={12} /> : <Zap size={12} />}
                    <span>{isManualSelectBooster ? 'Đang chỉ định' : 'Ghép nhanh'}</span>
                  </span>
                )}
              </div>

              {/* 2 Lựa chọn: Ghép nhanh vs Chỉ định */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualSelectBooster(false);
                    if (boosterList.length > 0) {
                      const currentId = assignedBooster?.user?._id || assignedBooster?._id;
                      const others = boosterList.filter((b) => b._id !== currentId);
                      const pool = others.length > 0 ? others : boosterList;
                      const randomIndex = Math.floor(Math.random() * pool.length);
                      const picked = pool[randomIndex];
                      setAssignedBooster({
                        user: picked,
                        boosterData: picked.boosterProfile || picked.booster_info || picked,
                      });
                      const bCoupon = picked.boosterProfile?.service_settings?.coupon || picked.service_settings?.coupon;
                      if (bCoupon?.isActive && bCoupon?.code) {
                        setAppliedCoupon(bCoupon);
                        setCouponCode(bCoupon.code);
                      } else {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }
                      toast.info(`Hệ thống ghép tự động tuyển thủ: @${picked.username}`);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    !isManualSelectBooster
                      ? 'bg-blue-600/10 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Zap size={16} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Khuyên dùng
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">Ghép Nhanh Tự Động</div>
                  <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Hệ thống tự động ghép ngẫu nhiên tuyển thủ đủ điều kiện với mức giá minh bạch.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsManualSelectBooster(true);
                    setIsBoosterModalOpen(true);
                    if (!assignedBooster && boosterList.length > 0) {
                      const first = boosterList[0];
                      setAssignedBooster({
                        user: first,
                        boosterData: first.boosterProfile || first.booster_info || first,
                      });
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                    isManualSelectBooster
                      ? 'bg-purple-600/10 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Crown size={16} />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Theo yêu cầu
                    </span>
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">Chỉ Định Tuyển Thủ</div>
                  <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Tùy chọn tuyển thủ cụ thể bạn yêu thích, xem đánh giá và áp dụng ưu đãi riêng.
                  </div>
                </button>
              </div>

              {/* Card Tuyển Thủ Đang Chọn / Được Ghép */}
              {assignedBooster ? (
                <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                  isManualSelectBooster
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {(() => {
                      const avatarUrl =
                        assignedBooster?.user?.profile?.avatar ||
                        assignedBooster?.user?.avatar ||
                        assignedBooster?.boosterData?.avatar ||
                        assignedBooster?.booster?.avatar ||
                        assignedBooster?.avatar ||
                        '';

                      const displayName =
                        assignedBooster?.boosterData?.displayName ||
                        assignedBooster?.booster?.displayName ||
                        assignedBooster?.user?.displayName ||
                        assignedBooster?.user?.username ||
                        'Tuyển thủ';

                      const username =
                        assignedBooster?.user?.username ||
                        assignedBooster?.boosterData?.username ||
                        assignedBooster?.booster?.username ||
                        '';

                      const rating =
                        assignedBooster?.boosterData?.rating ||
                        assignedBooster?.booster?.rating ||
                        assignedBooster?.user?.rating ||
                        assignedBooster?.user?.booster_info?.rating ||
                        5.0;

                      const completedCount =
                        assignedBooster?.boosterData?.completedOrders ||
                        assignedBooster?.boosterData?.completed_orders ||
                        assignedBooster?.booster?.completed_orders ||
                        assignedBooster?.user?.completedOrders ||
                        assignedBooster?.user?.booster_info?.completed_orders ||
                        0;

                      return (
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden border flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0 ${
                            isManualSelectBooster
                              ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/40'
                              : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40'
                          }`}>
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/default-avatar.png';
                                }}
                              />
                            ) : (
                              (displayName || username || 'B').slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-extrabold text-white text-sm truncate">
                                  {displayName}
                                </span>
                                <UserBadge role="BOOSTER" size="sm" />
                              </div>
                              <div className="text-xs text-zinc-400 font-mono truncate">
                                @{username}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                              <span className={`flex items-center gap-1 font-bold ${rating > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                <Star size={12} fill="currentColor" />
                                {rating > 0 ? rating.toFixed(1) : '5.0'}
                              </span>
                              <span>•</span>
                              <span className="text-zinc-300">
                                {completedCount} đơn hoàn thành
                              </span>
                              {boosterMultiplier !== 1.0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-400 font-bold">
                                    Hệ số giá: {(boosterMultiplier * 100).toFixed(0)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {isManualSelectBooster ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center gap-1">
                          <Crown size={12} />
                          Chỉ định
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center gap-1">
                          <Zap size={12} />
                          Ghép tự động
                        </span>
                      )}
                      <Link
                        href={`/b/${assignedBooster?.user?.username || ''}`}
                        target="_blank"
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Hồ sơ</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* Nút Đổi Tuyển Thủ */}
                  <div className="pt-2.5 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400">
                      {isManualSelectBooster
                        ? 'Tuyển thủ theo yêu cầu của bạn'
                        : 'Hệ thống đã tự động ghép tuyển thủ phù hợp nhất'}
                    </span>
                    {isManualSelectBooster ? (
                      <button
                        type="button"
                        onClick={() => setIsBoosterModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 self-start sm:self-auto"
                      >
                        <Search size={13} />
                        <span>Đổi sang tuyển thủ khác</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRandomRerollBooster}
                        className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 self-start sm:self-auto"
                      >
                        <Shuffle size={13} />
                        <span>Ghép tuyển thủ khác (ngẫu nhiên)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-400">
                  <Users size={18} className="text-zinc-500 shrink-0" />
                  <span>
                    Chưa có tuyển thủ online cho dịch vụ này. Hệ thống sẽ áp dụng bảng giá tiêu chuẩn của sàn và đưa đơn lên bảng tin tuyển dụng.
                  </span>
                </div>
              )}
            </div>

            {/* 2. KHỐI THIẾT KẾ MỚI: VISUAL RANK SELECTOR / POINT BOOSTER SELECTOR */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
              {/* KHỐI KIỂM TRA THÔNG TIN TÀI KHOẢN (RIOT GAMES: LOL / VALORANT / TFT CHO RANK BOOST & NET WINS) */}
              {isRiotGame && (isRankBoost || isPointBoost || serviceSlug === 'net-wins') && (
                <div id="riot-account-check-box" className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.08)] space-y-4 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent pointer-events-none" />

                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-white">
                            Kiểm Tra Thông Tin Tài Khoản Riot
                          </span>
                          <span className="text-red-500 font-black text-sm">*</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">
                            Bắt buộc
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Nhập Ingame # Tagline để tự động nhận diện bậc Rank & Điểm LP chính xác từ Riot Games (Bắt buộc để tránh nhập sai)
                        </p>
                      </div>
                    </div>

                    {checkedAccount ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto">
                        <CheckCircle2 size={12} /> Đã đồng bộ thông tin
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto">
                        <AlertCircle size={12} /> Chưa xác thực
                      </span>
                    )}
                  </div>

                  {/* Input & Button Tra cứu */}
                  <form onSubmit={handleCheckAccountRank} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        value={accountCheckInput}
                        onChange={(e) => {
                          setAccountCheckInput(e.target.value);
                          if (accountCheckError) setAccountCheckError('');
                        }}
                        placeholder="Ví dụ: Mary Tái Lâm #2003"
                        className="w-full h-11 bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isCheckingAccount || !accountCheckInput.trim()}
                      className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      {isCheckingAccount ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang kiểm tra...</span>
                        </>
                      ) : (
                        <>
                          <Search size={15} />
                          <span>Kiểm tra</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Thông báo lỗi validation nếu có */}
                  {accountCheckError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle size={16} className="text-rose-400 shrink-0" />
                      <span className="font-semibold">{accountCheckError}</span>
                    </div>
                  )}

                  {/* Card hiển thị kết quả kiểm tra thành công */}
                  {checkedAccount && !accountCheckError && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1 relative shadow-inner shrink-0">
                          <img
                            src={getRankImage(game.id, { tier: checkedAccount.tier, division: checkedAccount.rank })}
                            alt={checkedAccount.tierVi}
                            className="w-10 h-10 object-contain drop-shadow"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">{checkedAccount.riotId}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {server || 'VN'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              {checkedAccount.queueName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                            <span className="font-bold text-amber-400">
                              {checkedAccount.tierVi} {checkedAccount.rank || ''}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-cyan-400 font-bold">{checkedAccount.lp} LP</span>
                            {checkedAccount.wins + checkedAccount.losses > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400">
                                  {checkedAccount.wins}W / {checkedAccount.losses}L (
                                  {Math.round((checkedAccount.wins / (checkedAccount.wins + checkedAccount.losses)) * 100)}%)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                        <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>
                            {isPointBoost ? 'Đã tự động điền Điểm hiện tại' : 'Đã tự động chọn Rank hiện tại'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckedAccount(null);
                            setAccountCheckInput('');
                          }}
                          className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer ml-1"
                        >
                          Đổi ingame
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TRƯỜNG HỢP 1: CÀY ĐIỂM (LP HOẶC RR THEO TỪNG PHÂN KHÚC HOẶC SAO CHO AOV) */}
              {isPointBoost ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <TrendingUp size={15} className="text-cyan-400" />
                      <span>
                        {isAov
                          ? 'Chọn Phân Khúc & Mức Giá Cày Rank Cao Cấp (Theo Sao)'
                          : `Chọn Phân Khúc & Mức Giá Theo Điểm ${pointUnit}`}
                      </span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-cyan-400 font-semibold">
                      {isAov ? 'Đơn vị tính: Sao' : `Đơn vị tính: Điểm ${pointUnit}`}
                    </span>
                  </div>

                  {/* Grid các Phân Khúc Rank */}
                  <div className={`grid grid-cols-1 ${pointTiers.length === 4 ? 'sm:grid-cols-2' : pointTiers.length >= 5 ? 'sm:grid-cols-3' : 'sm:grid-cols-3'} gap-3 items-stretch`}>
                    {pointTiers.map((tier) => {
                      const isSelected = selectedPointSegment === tier.id;
                      const customPrice = matchingBoosterService?.tierRates?.[tier.id] ?? tier.defaultPrice;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setSelectedPointSegment(tier.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between h-full ${
                            isSelected
                              ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-950 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/60'
                              : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${tier.badgeColor}`}>
                                {tier.shortLabel}
                              </span>
                              {isSelected && (
                                <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                              )}
                            </div>

                            <div className="text-sm font-bold text-white mb-1">
                              {tier.label}
                            </div>
                            <div className="text-[11px] text-zinc-400 mb-3 line-clamp-1">
                              {tier.desc}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-zinc-800/80 flex items-baseline justify-between mt-auto">
                            <span className="text-[11px] text-zinc-400">Đơn giá:</span>
                            <span className="text-sm font-black font-mono text-cyan-400">
                              {customPrice.toLocaleString('vi-VN')} <span className="text-[10px] font-sans text-zinc-500">đ/{tier.unit}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nhập Điểm Hiện Tại & Điểm Mong Muốn (Dual Point Inputs) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <Target size={16} className="text-amber-400 shrink-0" />
                          <span>
                            {isAov
                              ? 'Thiết Lập Số Sao (Hiện Tại → Mong Muốn)'
                              : `Thiết Lập Điểm ${pointUnit} (Hiện Tại → Mong Muốn)`}
                          </span>
                          <span className="text-red-500">*</span>
                        </span>
                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                          {isAov
                            ? 'Nhập số sao hiện tại và số sao bạn mong muốn đạt. Hệ thống sẽ tính số sao chênh lệch cần cày.'
                            : 'Nhập số điểm thực tế hiện tại và mốc điểm bạn muốn đạt. Hệ thống sẽ tính số điểm chênh lệch cần cày.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <span className="text-xs text-amber-300/80 font-medium">Cần cày:</span>
                        <span className="text-base sm:text-lg font-black font-mono text-amber-400 leading-none">
                          {gainedPoints} {pointUnit}
                        </span>
                      </div>
                    </div>

                    {/* Dual Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. Điểm Hiện Tại */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <span>{isAov ? 'Số Sao Hiện Tại' : 'Điểm Hiện Tại'}</span>
                            {isRiotGame && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                {checkedAccount ? 'Khóa theo Riot' : 'Cần kiểm tra *'}
                              </span>
                            )}
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {isRiotGame ? (checkedAccount ? '✓ Đã đồng bộ Riot' : 'Chưa xác thực') : 'Bắt đầu từ'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={Boolean(isRiotGame && checkedAccount)}
                            onClick={() => {
                              if (isRiotGame && !checkedAccount) {
                                toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                                const el = document.getElementById('riot-account-check-box');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return;
                              }
                              setCurrentPoints((p) => Math.max(0, p - (isAov ? 5 : 10)));
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${
                              isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            -
                          </button>
                          <div className="flex-1 relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              readOnly={Boolean(isRiotGame && checkedAccount)}
                              value={currentPoints === 0 ? '' : currentPoints}
                              placeholder="0"
                              onClick={() => {
                                if (isRiotGame && !checkedAccount) {
                                  toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                                  const el = document.getElementById('riot-account-check-box');
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              onChange={(e) => {
                                if (isRiotGame && checkedAccount) return;
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                if (!clean) {
                                  setCurrentPoints(0);
                                  return;
                                }
                                const val = parseInt(clean, 10);
                                setCurrentPoints(isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-white outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${
                                isRiotGame && checkedAccount
                                  ? 'border-cyan-500/40 bg-zinc-900/60 cursor-not-allowed text-cyan-300'
                                  : currentPoints > desiredPoints
                                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                  : 'border-zinc-700/80 focus:border-cyan-500 focus:ring-cyan-500/20'
                              }`}
                            />
                            <span className="text-xs text-zinc-500 font-bold font-mono absolute right-3 pointer-events-none select-none uppercase">
                              {pointUnit}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={Boolean(isRiotGame && checkedAccount)}
                            onClick={() => {
                              if (isRiotGame && !checkedAccount) {
                                toast.info('Vui lòng kiểm tra thông tin tài khoản Riot ở ô bắt buộc trên để nhận diện Điểm LP chính xác!');
                                const el = document.getElementById('riot-account-check-box');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                return;
                              }
                              setCurrentPoints((p) => Math.max(0, p + (isAov ? 5 : 10)));
                            }}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${
                              isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* 2. Điểm Mong Muốn */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            {isAov ? 'Số Sao Mong Muốn' : 'Điểm Mong Muốn'}
                          </label>
                          <span className="text-[10px] text-zinc-500 font-mono">Mục tiêu</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDesiredPoints((p) => Math.max(0, p - (isAov ? 5 : 10)))}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none cursor-pointer"
                          >
                            -
                          </button>
                          <div className="flex-1 relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={desiredPoints === 0 ? '' : desiredPoints}
                              placeholder="0"
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                                if (!clean) {
                                  setDesiredPoints(0);
                                  return;
                                }
                                const val = parseInt(clean, 10);
                                setDesiredPoints(isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-emerald-400 outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${
                                desiredPoints < currentPoints
                                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                  : 'border-zinc-700/80 focus:border-emerald-500 focus:ring-emerald-500/20'
                              }`}
                            />
                            <span className="text-xs text-zinc-500 font-bold font-mono absolute right-3 pointer-events-none select-none uppercase">
                              {pointUnit}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDesiredPoints((p) => Math.max(0, p + (isAov ? 5 : 10)))}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cảnh báo validate: Không được < 0, và Điểm Mong Muốn phải lớn hơn Điểm Hiện Tại */}
                    {desiredPoints <= currentPoints && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle size={15} className="text-rose-400 shrink-0" />
                        <span>
                          {desiredPoints < currentPoints
                            ? `${isAov ? 'Số sao mong muốn' : 'Điểm mong muốn'} không được nhỏ hơn ${isAov ? 'số sao hiện tại' : 'điểm hiện tại'} (${isAov ? 'Số sao hiện tại' : 'Điểm hiện tại'} không được lớn hơn ${isAov ? 'số sao mong muốn' : 'điểm mong muốn'}).`
                            : `${isAov ? 'Số sao mong muốn' : 'Điểm mong muốn'} phải lớn hơn ${isAov ? 'số sao hiện tại' : 'điểm hiện tại'} ít nhất 1 ${pointUnit}.`}
                        </span>
                      </div>
                    )}

                    {/* Quick presets */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                      <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Cộng thêm nhanh:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(isAov ? [5, 10, 20, 30, 50] : [20, 40, 60, 80, 100]).map((pts) => (
                          <button
                            key={pts}
                            type="button"
                            onClick={() => setDesiredPoints(currentPoints + pts)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-cyan-500/50 text-xs font-bold font-mono text-zinc-300 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all active:scale-95 cursor-pointer"
                          >
                            +{pts} {pointUnit}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isPromotion ? (
                /* TRƯỜNG HỢP: CHUỖI THĂNG HẠNG (PROMOTION SERIES) */
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                        <Zap size={14} className="text-amber-400" />
                        <span>Rank hiện tại</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Chọn bậc hiện tại để cày thăng hạng lên bậc kế tiếp
                      </span>
                    </div>

                    {/* Dãy 7 Huy Hiệu Rank Nằm Ngang (Sắt I -> Kim Cương I) */}
                    <div className="relative pt-8 pb-3">
                      <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-none px-1">
                        {LOL_PROMOTION_SERIES.map((promo) => {
                          const isSelected = selectedPromoId === promo.id;
                          return (
                            <div key={promo.id} className="relative flex flex-col items-center shrink-0">
                              {/* Tooltip Bong Bóng Nói (Speech Bubble) trên Badge Đang Chọn */}
                              {isSelected && (
                                <div className="absolute -top-9 z-20 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                                  <div className="bg-white text-zinc-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded shadow-lg border border-zinc-200 relative">
                                    {promo.fromLabel}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedPromoId(promo.id)}
                                className={`relative w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'border-2 border-red-500 bg-red-500/10 shadow-[0_0_18px_rgba(239,68,68,0.35)] scale-110 z-10'
                                    : 'border border-transparent hover:border-zinc-700 bg-transparent hover:bg-zinc-800/40 opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                                title={promo.fromLabel}
                              >
                                <img
                                  src={promo.icon}
                                  alt={promo.fromLabel}
                                  className="w-10 h-10 sm:w-13 sm:h-13 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Thẻ Lộ Trình Thăng Hạng & Cam Kết */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Bắt đầu */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center p-1 shadow-inner">
                            <img
                              src={selectedPromo.icon}
                              alt={selectedPromo.fromLabel}
                              className="w-9 h-9 object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                              Rank bắt đầu
                            </span>
                            <span className="text-base font-extrabold text-white">
                              {selectedPromo.fromLabel}
                            </span>
                          </div>
                        </div>

                        {/* Mũi tên */}
                        <div className="flex items-center justify-center text-amber-400 px-1">
                          <ArrowRight size={20} />
                        </div>

                        {/* Đích đến */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-black/50 border border-emerald-500/30 flex items-center justify-center p-1 shadow-inner shadow-emerald-500/10">
                            <img
                              src={selectedPromo.targetIcon}
                              alt={selectedPromo.toLabel}
                              className="w-9 h-9 object-contain"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                              Mục tiêu thăng hạng
                            </span>
                            <span className="text-base font-extrabold text-emerald-400">
                              {selectedPromo.toLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Giá & Cam kết */}
                      <div className="text-left sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                          Đơn Giá Chuỗi
                        </div>
                        <div className="text-xl font-black font-mono text-cyan-400">
                          {(
                            (assignedBooster?.stepOverrides?.[selectedPromo.id]) ??
                            matchingBoosterService?.stepOverrides?.[selectedPromo.id] ??
                            selectedPromo.defaultPrice
                          ).toLocaleString('vi-VN')}{' '}
                          <span className="text-xs font-sans text-zinc-500">đ</span>
                        </div>
                        <div className="text-[11px] text-emerald-400/90 font-medium mt-0.5 flex items-center sm:justify-end gap-1">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>Cam kết vượt chuỗi 100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TRƯỜNG HỢP 2: LỘ TRÌNH RANK TƯƠNG TÁC (TỪ BẬC A ĐẾN BẬC B) */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Trophy size={14} className="text-amber-400" />
                      <span>
                        {isValorant
                          ? 'Lộ trình Cày Rank Valorant (Iron 1 → Radiant)'
                          : isAov
                          ? 'Lộ trình Cày Rank Liên Quân (Đồng IV → Cao Thủ)'
                          : 'Lộ trình Cày Rank (Sắt IV → Cao Thủ)'}
                      </span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-blue-400 font-semibold">
                      Nhấn vào thẻ để đổi rank
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
                    {/* Card Rank Hiện Tại */}
                    <div
                      onClick={() => handleOpenRankModal('CURRENT')}
                      className={`md:col-span-5 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${currentTierMeta.bgGradient} ${currentTierMeta.borderColor} hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99]`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                          <span>Rank Hiện Tại</span>
                          <span className="text-red-500">*</span>
                        </span>
                        <span className={`text-[10px] font-bold ${
                          isRiotGame && checkedAccount
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded'
                            : isRiotGame
                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded group-hover:underline'
                            : 'text-blue-400 group-hover:underline'
                        }`}>
                          {isRiotGame && checkedAccount ? '✓ Đã đồng bộ Riot' : isRiotGame ? 'Cần kiểm tra Riot *' : 'Thay đổi'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-inner">
                          <img
                            src={currentRankImg}
                            alt={currentRankObj.label}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-base sm:text-lg font-black tracking-tight ${currentTierMeta.textColor}`}>
                            {currentRankObj.label}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentTierMeta.badgeBg}`}>
                              {isValorant
                                ? (currentRankObj.tier === 'RADIANT' ? 'Radiant' : `Bậc ${currentRankObj.division}`)
                                : (currentRankObj.tier === 'MASTER' ? 'Cao Thủ' : `Bậc ${currentRankObj.division}`)}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Mốc #{currentRankIndex + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Icon Chuyển Giao Mũi Tên */}
                    <div className="md:col-span-1 flex items-center justify-center py-1 md:py-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-md">
                        <ArrowRight size={15} className="rotate-90 md:rotate-0" />
                      </div>
                    </div>

                    {/* Card Rank Mong Muốn */}
                    <div
                      onClick={() => handleOpenRankModal('DESIRED')}
                      className={`md:col-span-5 p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${desiredTierMeta.bgGradient} ${desiredTierMeta.borderColor} hover:border-emerald-400/80 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99]`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
                          <span>Rank Mong Muốn</span>
                          <span className="text-red-500">*</span>
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 group-hover:underline">
                          Thay đổi
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-inner">
                          <img
                            src={desiredRankImg}
                            alt={desiredRankObj.label}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-base sm:text-lg font-black tracking-tight ${desiredTierMeta.textColor}`}>
                            {desiredRankObj.label}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${desiredTierMeta.badgeBg}`}>
                              {isValorant
                                ? (desiredRankObj.tier === 'RADIANT' ? 'Radiant' : `Bậc ${desiredRankObj.division}`)
                                : (desiredRankObj.tier === 'MASTER' ? 'Cao Thủ' : `Bậc ${desiredRankObj.division}`)}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-bold">
                              +{calculation.stepsCount} bậc nhảy
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cảnh báo nếu rank không hợp lệ */}
                  {currentRankIndex >= desiredRankIndex && (
                    <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>
                        Lộ trình chưa hợp lệ: <strong>Rank hiện tại ({currentRankObj.label})</strong> phải thấp hơn <strong>Rank mong muốn ({desiredRankObj.label})</strong>. Vui lòng bấm vào thẻ để chọn lại.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ĐIỂM CỘNG MỖI VÁN (LP/RR GAIN) - CẤU HÌNH HỆ SỐ TRỰC QUAN & TOOLTIP GIẢI THÍCH */}
              {!isPromotion && (
                <div className="relative">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="relative inline-flex items-center gap-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <span>Điểm cộng mỗi ván ({isValorant ? 'RR Gain' : 'LP Gain'})</span>
                      <span className="text-red-500">*</span>
                    </label>

                    {/* Nút bật/tắt Tooltip giải thích trên cả Desktop & Mobile */}
                    <button
                      type="button"
                      onClick={() => setShowGainTooltip((prev) => !prev)}
                      onMouseEnter={() => setShowGainTooltip(true)}
                      className="p-1 rounded-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                      title="Bấm để xem giải thích chi tiết"
                      aria-label="Xem giải thích điểm cộng mỗi ván"
                    >
                      <Info size={14} />
                    </button>

                    {/* Popover Tooltip Floating Card */}
                    {showGainTooltip && (
                      <div
                        onMouseLeave={() => setShowGainTooltip(false)}
                        className="absolute left-0 top-7 z-50 w-72 sm:w-84 p-4 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-xs space-y-2.5 animate-in fade-in zoom-in-95"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                          <span className="font-extrabold text-white flex items-center gap-1.5">
                            <Info size={14} className="text-cyan-400" />
                            <span>Điểm cộng ({isValorant ? 'RR' : 'LP'}) là gì?</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowGainTooltip(false)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          Là số điểm <strong>{isValorant ? 'Rank Rating (RR)' : 'League Points (LP)'}</strong> mà tài khoản của bạn nhận được sau một trận thắng xếp hạng gần nhất.
                        </p>

                        <div className="space-y-1.5 text-[11px] pt-1 border-t border-zinc-800/80">
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-emerald-400 shrink-0">≥ 25 điểm (-10%):</span>
                            <span className="text-zinc-400">MMR ẩn rất cao, tuyển thủ leo cực nhanh nên bạn được chiết khấu giá.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-blue-400 shrink-0">20-24 điểm (0%):</span>
                            <span className="text-zinc-400">Mức điểm chuẩn thông thường của hệ thống Riot Games.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-amber-400 shrink-0">15-19 điểm (+10%):</span>
                            <span className="text-zinc-400">MMR trung bình, cần thêm số trận thắng để hoàn thành mốc rank.</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-rose-400 shrink-0">&lt; 15 điểm (+15%):</span>
                            <span className="text-zinc-400">Tài khoản bị kẹt điểm (Hell Elo), tuyển thủ phải gánh thêm nhiều trận đấu hơn.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    Ảnh hưởng trực tiếp đến tổng giá cày
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {activeGainOptions.map((opt) => {
                    const isSelected = lpGain === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLpGain(opt.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-full min-h-[82px] cursor-pointer group ${
                          isSelected
                            ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/50'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full mb-1.5">
                          <span className={`font-black text-sm tracking-tight ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                            {opt.label}
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border font-mono shrink-0 ${opt.badgeClass}`}>
                            {opt.discountLabel}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[11px] text-zinc-300 font-medium leading-tight">
                            {opt.desc}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {opt.subLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              {/* LOẠI HÀNG ĐỢI & CHỌN SERVER (CHỈ DÀNH CHO LMHT, VALORANT VÀ LIÊN QUÂN KHÔNG CẦN CHỌN SERVER/FLEX) */}
              {!isValorant && !isAov && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Loại Hàng Đợi */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2">
                      Loại xếp hạng <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQueueType('SOLO_DUO')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          queueType === 'SOLO_DUO'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Swords size={13} />
                        <span>Đơn / Đôi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQueueType('FLEX')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          queueType === 'FLEX'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Users size={13} />
                        <span>Linh Hoạt (Flex)</span>
                      </button>
                    </div>
                  </div>

                  {/* Chọn Server (Modal Popup giữa màn hình) */}
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-2 flex items-center justify-between">
                      <span>Chọn Máy Chủ (Server) <span className="text-red-500">*</span></span>
                      <span className="text-[11px] text-blue-400 cursor-pointer font-semibold" onClick={() => setIsServerModalOpen(true)}>
                        16 máy chủ
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsServerModalOpen(true)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium flex items-center justify-between transition-all group shadow-inner"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ServerFlag code={currentServerObj.code} size="sm" />
                        <span className="font-bold truncate text-white">{currentServerObj.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                          {currentServerObj.code} · {currentServerObj.platformId}
                        </span>
                      </div>
                      <ChevronDown size={14} className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. TÙY CHỌN MỞ RỘNG (ADDONS) */}
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider">
                  Tùy chọn mở rộng
                </span>

                <div className="space-y-2.5">
                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    scheduleCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!scheduleCfg.enabled}
                      checked={addons.schedule && scheduleCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, schedule: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Đặt lịch cày</span>
                      {scheduleCfg.enabled ? (
                        <span className="text-blue-400 font-bold">
                          +{Math.round(scheduleCfg.percent)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    specificRoleCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!specificRoleCfg.enabled}
                      checked={addons.specificRole && specificRoleCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, specificRole: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Tùy chọn vị trí / đường</span>
                      {specificRoleCfg.enabled ? (
                        <span className="text-blue-400 font-bold">
                          +{Math.round(specificRoleCfg.percent)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    specificChampsCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!specificChampsCfg.enabled}
                      checked={addons.specificChamps && specificChampsCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, specificChamps: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Tùy chọn tướng</span>
                      {specificChampsCfg.enabled ? (
                        <span className="text-blue-400 font-bold">
                          +{Math.round(specificChampsCfg.percent)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    livestreamCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!livestreamCfg.enabled}
                      checked={addons.livestream && livestreamCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, livestream: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Xem trực tiếp</span>
                      {livestreamCfg.enabled ? (
                        <span className="text-amber-400 font-bold">
                          +{livestreamCfg.fee.toLocaleString('vi-VN')}đ
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    flashCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!flashCfg.enabled}
                      checked={addons.flash && flashCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, flash: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Cày siêu tốc</span>
                      {flashCfg.enabled ? (
                        <span className="text-emerald-400 font-bold">
                          +{Math.round(flashCfg.percent)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
                    duoCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!duoCfg.enabled}
                      checked={addons.duo && duoCfg.enabled}
                      onChange={(e) => setAddons({ ...addons, duo: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Chơi cùng Booster (Duo)</span>
                      {duoCfg.enabled ? (
                        <span className="text-purple-400 font-bold">
                          +{Math.round(duoCfg.percent)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>
                </div>
              </div>

              {/* 4. THÔNG TIN TÀI KHOẢN CẦN CÀY (MODAL POPUP LOẠI TÀI KHOẢN) */}
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider">
                  Thông tin tài khoản cần cày
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Nút Chọn Loại Tài Khoản (Modal Popup) */}
                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Loại Tài Khoản <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAccountTypeModalOpen(true)}
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white flex items-center justify-between transition-colors shadow-inner group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <ProviderLogo provider={accountType} className="w-4 h-4 shrink-0" />
                        <span className="font-bold truncate text-white">{currentAccountTypeObj.name}</span>
                      </div>
                      <ChevronDown size={13} className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors" />
                    </button>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Tài khoản cần cày <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Tên đăng nhập / Riot ID"
                      value={ingameAccount}
                      onChange={(e) => setIngameAccount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Mật khẩu tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Điền mật khẩu"
                      value={ingamePassword}
                      onChange={(e) => setIngamePassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Ghi chú thêm cho tuyển thủ (tuỳ chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Chỉ cày vào buổi tối sau 20h, không dùng IP lạ, chat với bạn bè..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BẢNG GIÁ TỔNG, CHI TIẾT BƯỚC NHẢY & THANH TOÁN ESCROW (Fixed / Sticky trên Desktop xl+) */}
          <div className="xl:col-span-5 xl:sticky xl:top-24 self-start space-y-6 z-20">
            <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5 max-h-[calc(100vh-7.5rem)] overflow-y-auto scrollbar-none">
              <h3 className="text-base font-extrabold text-white flex items-center justify-between">
                <span>
                  {isPromotion
                    ? 'Tóm Tắt Chuỗi Thăng Hạng'
                    : isPointBoost
                    ? isAov
                      ? 'Tóm Tắt Đơn Cày Rank Cao Cấp'
                      : `Tóm Tắt Đơn Cày Điểm ${pointUnit}`
                    : 'Tóm Tắt Đơn Cày Rank'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {isPromotion
                    ? 'Chuỗi Thăng Hạng'
                    : isPointBoost
                    ? `${gainedPoints} ${pointUnit} (+${gainedPoints})`
                    : `${calculation.stepsCount} bậc thăng hạng`}
                </span>
              </h3>

              {/* Chi tiết lộ trình */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2 text-xs">
                {isPromotion ? (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Chuỗi thăng hạng:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="text-amber-400">{selectedPromo.fromLabel}</span>
                        <span>➔</span>
                        <span className="text-emerald-400">{selectedPromo.toLabel}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Loại hình:</span>
                      <span className="font-bold text-zinc-200">Chuỗi BO3/BO5 Bậc I</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Cam kết:</span>
                      <span className="font-medium text-emerald-400">Đạt {selectedPromo.toLabel} an toàn</span>
                    </div>
                  </>
                ) : isPointBoost ? (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Phân khúc:</span>
                      <span className="font-bold text-cyan-400">
                        {selectedPointTierObj.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao hiện tại:' : 'Điểm hiện tại:'}</span>
                      <span className="font-bold font-mono text-zinc-300">
                        {currentPoints} {pointUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao mong muốn:' : 'Điểm mong muốn:'}</span>
                      <span className="font-bold font-mono text-emerald-400">
                        {desiredPoints} {pointUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao cần cày:' : 'Số điểm cần cày:'}</span>
                      <span className="font-bold font-mono text-amber-400">
                        {gainedPoints} {pointUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Đơn giá / {pointUnit}:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {segmentRate.toLocaleString('vi-VN')} đ / {pointUnit}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-zinc-300">
                    <span>Lộ trình:</span>
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className={currentTierMeta.textColor}>{currentRankObj.label}</span>
                      <span>→</span>
                      <span className={desiredTierMeta.textColor}>{desiredRankObj.label}</span>
                    </span>
                  </div>
                )}

                {!isValorant && !isAov && (
                  <>
                    <div className="flex justify-between text-zinc-400">
                      <span>Loại hàng đợi:</span>
                      <span className="text-zinc-200">
                        {queueType === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Máy chủ (Server):</span>
                      <span className="text-zinc-200 flex items-center gap-1.5">
                        <ServerFlag code={currentServerObj.code} size="sm" />
                        <span>{currentServerObj.name} ({currentServerObj.code})</span>
                      </span>
                    </div>
                  </>
                )}
                {!isPromotion && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Điểm cộng / ván:</span>
                    <span className="text-zinc-200 flex items-center gap-1">
                      <span>{activeGainOptions.find((o) => o.id === lpGain)?.label}</span>
                      <span className={`text-[10px] font-bold px-1 rounded ${activeGainOptions.find((o) => o.id === lpGain)?.badgeClass}`}>
                        {activeGainOptions.find((o) => o.id === lpGain)?.discountLabel}
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Loại tài khoản:</span>
                  <span className="text-zinc-200 flex items-center gap-1.5">
                    <ProviderLogo provider={accountType} className="w-3.5 h-3.5" />
                    <span>{currentAccountTypeObj.name}</span>
                  </span>
                </div>
              </div>

              {/* Voucher Input */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá (nếu có)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:opacity-60 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                  >
                    {isApplyingCoupon ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      'Áp dụng'
                    )}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 mt-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-medium">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Tag size={13} className="text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {appliedCoupon.title || `Mã ${appliedCoupon.code}`}
                        {appliedCoupon.discountPercent ? ` (-${appliedCoupon.discountPercent}%)` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-mono font-bold">
                        -{discountAmount.toLocaleString('vi-VN')} đ
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode('');
                          toast.info('Đã hủy áp dụng mã giảm giá');
                        }}
                        className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors"
                        title="Gỡ mã giảm giá"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TỔNG TIỀN VÀ TIỀN CỌC ESCROW */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-blue-500/20 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Tạm tính gói cày:</span>
                  <span className="font-bold text-white font-mono">
                    {calculation.basePrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {calculation.addonsCost > 0 && (
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span>Phụ phí tùy chọn:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      +{calculation.addonsCost.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                {appliedCoupon && discountAmount > 0 && (() => {
                  const percent = appliedCoupon.discountPercent || (appliedCoupon.type === 'PERCENTAGE' ? appliedCoupon.value : 0);
                  const fixed = appliedCoupon.discountAmount || (appliedCoupon.type === 'FIXED' ? appliedCoupon.value : 0);
                  const discountTag = percent > 0 ? ` -${percent}%` : fixed > 0 ? ` -${fixed.toLocaleString('vi-VN')} đ` : '';
                  return (
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                      <span>Mã giảm giá ({appliedCoupon.code}{discountTag}):</span>
                      <span className="font-mono font-bold">
                        -{discountAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  );
                })()}

                {/* Phí dịch vụ */}
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Phí dịch vụ ({platformFeePercent}%):</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    +{serviceFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
                  <span className="font-bold text-zinc-300">Tổng giá dịch vụ:</span>
                  <span className="text-base font-bold text-white font-mono">
                    {finalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="pt-2.5 border-t border-zinc-800 space-y-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap">
                      {finalDeposit < finalPrice ? `Thanh toán tiền cọc (${effectiveDepositPercent}%):` : 'Số tiền thanh toán ngay:'}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono whitespace-nowrap tracking-tight">
                      {finalDeposit.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1.5 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="leading-tight">
                      {finalDeposit < finalPrice
                        ? 'Tạm giữ an toàn • Số tiền còn lại chỉ trả khi hoàn thành'
                        : 'Tạm giữ Escrow an toàn • Chỉ chuyển tiền khi bạn hài lòng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Đặt đơn (Desktop - Trên Mobile & Tablet dùng thanh Sticky Footer ở đáy để tránh lặp nút) */}
              <button
                type="button"
                disabled={isSubmitting || calculation.totalPrice <= 0 || (isPointBoost && (currentPoints >= desiredPoints || currentPoints < 0 || desiredPoints < 0))}
                onClick={handlePlaceOrder}
                className="hidden xl:flex w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {isRiotGame && (isRankBoost || isPointBoost || serviceSlug === 'net-wins') && !checkedAccount
                        ? 'Cần Kiểm Tra Riot *'
                        : 'Đặt Cày Ngay'}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="hidden xl:flex text-[11px] text-zinc-500 text-center items-center justify-center gap-1.5">
                <Shield size={12} className="text-emerald-400" />
                <span>Hoàn tiền 100% nếu không hoàn thành đúng tiến độ.</span>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM CHECKOUT BAR (Mobile & Tablet - Dưới màn hình Desktop xl) */}
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 sm:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-zinc-400">Tổng:</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {finalPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                {finalDeposit < finalPrice ? `Tiền cọc (${effectiveDepositPercent}%): ` : 'Thanh toán: '}
                {finalDeposit.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || calculation.totalPrice <= 0 || (isPointBoost && (currentPoints >= desiredPoints || currentPoints < 0 || desiredPoints < 0))}
              onClick={handlePlaceOrder}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {isRiotGame && (isRankBoost || isPointBoost || serviceSlug === 'net-wins') && !checkedAccount
                      ? 'Cần Kiểm Tra Riot *'
                      : 'Đặt Cày Ngay'}
                  </span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: VISUAL RANK PICKER MODAL (CHỌN TỪ SẮT IV ĐẾN CAO THỦ)           */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isRankModalOpen && (
            <motion.div
              key="rank-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setIsRankModalOpen(false);
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsRankModalOpen(false);
              }}
            >
              <motion.div
                key="rank-modal-panel"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 relative max-h-[92vh] flex flex-col will-change-transform cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {rankModalTarget === 'CURRENT' ? 'Chọn Rank Hiện Tại' : 'Chọn Rank Mong Muốn'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {rankModalTarget === 'CURRENT'
                        ? `Rank hiện tại phải thấp hơn Rank mong muốn (${desiredRankObj.label})`
                        : `Rank mong muốn phải cao hơn Rank hiện tại (${currentRankObj.label})`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRankModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Context Banner */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs shrink-0 ${
                rankModalTarget === 'CURRENT'
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Info size={14} className="shrink-0 text-blue-400" />
                  <span className="truncate">
                    {rankModalTarget === 'CURRENT' ? (
                      <>
                        Đang chọn rank xuất phát để cày lên: <strong className="text-white">{desiredRankObj.label}</strong>
                      </>
                    ) : (
                      <>
                        Đang chọn mốc rank đích cần đạt từ: <strong className="text-white">{currentRankObj.label}</strong>
                      </>
                    )}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white shrink-0 ml-2">
                  {rankModalTarget === 'CURRENT' ? `Yêu cầu: < ${desiredRankObj.label}` : `Yêu cầu: > ${currentRankObj.label}`}
                </span>
              </div>

              {/* Scroll Content */}
              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* 1. Chọn Tier Lớn */}
                <div>
                  <span className="text-xs font-bold text-zinc-300 block mb-2">
                    1. Chọn Hạng (Tier):
                  </span>
                  <div className={`grid ${isValorant ? 'grid-cols-3 sm:grid-cols-5' : isAov ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-4'} gap-2 sm:gap-2.5`}>
                    {Object.entries(activeTierConfig).map(([tierKey, meta]) => {
                      // Validate Tier:
                      const tierSteps = activeRankSteps.filter((r) => r.tier === tierKey);
                      const lowestInTierIdx = tierSteps.length > 0 ? activeRankSteps.findIndex((r) => r.id === tierSteps[0].id) : -1;
                      const highestInTierIdx = tierSteps.length > 0 ? activeRankSteps.findIndex((r) => r.id === tierSteps[tierSteps.length - 1].id) : -1;

                      const isMaxTierKey = isValorant ? 'RADIANT' : 'MASTER';
                      const isTierDisabled = rankModalTarget === 'CURRENT'
                        ? (tierKey === isMaxTierKey || lowestInTierIdx >= desiredRankIndex)
                        : (highestInTierIdx <= currentRankIndex);

                      const isSelected = tempTier === tierKey;

                      return (
                        <button
                          key={tierKey}
                          type="button"
                          disabled={isTierDisabled}
                          onClick={() => {
                            if (isTierDisabled) return;
                            setTempTier(tierKey);
                            if (tierKey === isMaxTierKey) {
                              setTempDivision('');
                            } else {
                              // Tự động tìm division hợp lệ nhất trong tier này
                              const tierDivs = getDivisionsForTier(game.id, tierKey);
                              if (rankModalTarget === 'CURRENT') {
                                const validDivs = tierDivs.filter((d) => {
                                  const idx = findRankStepIndex(game.id, tierKey, d);
                                  return idx !== -1 && idx < desiredRankIndex;
                                });
                                if (validDivs.includes(tempDivision)) {
                                  // giữ nguyên
                                } else if (validDivs.length > 0) {
                                  setTempDivision(validDivs[validDivs.length - 1]);
                                }
                              } else {
                                const validDivs = tierDivs.filter((d) => {
                                  const idx = findRankStepIndex(game.id, tierKey, d);
                                  return idx !== -1 && idx > currentRankIndex;
                                });
                                if (validDivs.includes(tempDivision)) {
                                  // giữ nguyên
                                } else if (validDivs.length > 0) {
                                  setTempDivision(validDivs[0]);
                                }
                              }
                            }
                          }}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                            isTierDisabled
                              ? 'bg-zinc-950/20 border-zinc-900/60 opacity-25 cursor-not-allowed select-none'
                              : isSelected
                              ? `${meta.activeBorder} ${meta.bgGradient} ${meta.glowClass}`
                              : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                            <img
                              src={meta.image}
                              alt={meta.name}
                              className={`w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] ${
                                isTierDisabled ? 'grayscale' : ''
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-bold truncate max-w-full ${isTierDisabled ? 'text-zinc-600' : isSelected ? meta.textColor : 'text-zinc-300'}`}>
                            {meta.name}
                          </span>
                          {isTierDisabled && (
                            <span className="text-[9px] text-zinc-600 font-medium -mt-0.5">
                              {rankModalTarget === 'CURRENT' ? 'Quá cao' : 'Quá thấp'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chọn Bậc (Division) */}
                {tempTier !== (isValorant ? 'RADIANT' : 'MASTER') ? (
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block mb-2">
                      2. Chọn Phân Bậc (Division):
                    </span>
                    {(() => {
                      const tierDivisions = getDivisionsForTier(game.id, tempTier);
                      return (
                        <div className={`grid ${isValorant ? 'grid-cols-3' : tierDivisions.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} gap-2`}>
                          {tierDivisions.map((div) => {
                            const stepIdx = findRankStepIndex(game.id, tempTier, div);
                            
                            // Validate:
                            // - Rank hiện tại: Phải < desiredRankIndex
                            // - Rank mong muốn: Phải > currentRankIndex
                            const isDivisionDisabled = rankModalTarget === 'CURRENT'
                              ? stepIdx >= desiredRankIndex
                              : stepIdx <= currentRankIndex;

                            const isSelected = tempDivision === div;

                            return (
                              <button
                                key={div}
                                type="button"
                                disabled={isDivisionDisabled}
                                onClick={() => setTempDivision(div)}
                                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                                  isDivisionDisabled
                                    ? 'bg-zinc-950/30 border-zinc-900 opacity-25 cursor-not-allowed text-zinc-600 select-none'
                                    : isSelected
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-300'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                                }`}
                              >
                                <span className="text-sm font-extrabold font-mono tracking-wider">
                                  Bậc {div}
                                </span>
                                {isDivisionDisabled && (
                                  <span className="text-[9px] text-zinc-500">
                                    {rankModalTarget === 'CURRENT'
                                      ? stepIdx === desiredRankIndex ? 'Bằng rank đích' : 'Cao hơn'
                                      : stepIdx === currentRankIndex ? 'Bằng rank hiện tại' : 'Thấp hơn'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
                    <Crown size={18} className="shrink-0 text-amber-400" />
                    <span>
                      <strong>{isValorant ? 'Radiant' : 'Cao Thủ'}:</strong> Mốc rank đích cao nhất trong bảng giá leo rank theo bậc.
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Preview & Confirm */}
              {(() => {
                const isMaxTierKey = isValorant ? 'RADIANT' : 'MASTER';
                const tempSelectedRankId = getRankStepId(game.id, tempTier, tempDivision);
                const tempRankIdx = findRankStepIndex(game.id, tempTier, tempDivision);
                const isSelectionValid = tempRankIdx !== -1 && (
                  rankModalTarget === 'CURRENT'
                    ? tempRankIdx < desiredRankIndex
                    : tempRankIdx > currentRankIndex
                );
                const selectedLabel = tempTier === isMaxTierKey
                  ? (isValorant ? 'Radiant' : 'Cao Thủ')
                  : `${activeTierConfig[tempTier]?.name || tempTier} ${tempDivision}`;

                return (
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Đang chọn:</span>
                      <span className={`text-sm font-black ${isSelectionValid ? 'text-white' : 'text-red-400'}`}>
                        {selectedLabel}
                      </span>
                      {!isSelectionValid && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                          {rankModalTarget === 'CURRENT' ? `Phải < ${desiredRankObj.label}` : `Phải > ${currentRankObj.label}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRankModalOpen(false)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={!isSelectionValid}
                        onClick={handleConfirmRank}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelectionValid
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        Xác Nhận
                      </button>
                    </div>
                  </div>
                );
              })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 2: CHỌN MÁY CHỦ (SERVER POPUP GIỮA MÀN HÌNH)                       */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isServerModalOpen && (
            <motion.div
              key="server-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setIsServerModalOpen(false);
                  setServerSearchTerm('');
                }
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsServerModalOpen(false);
                  setServerSearchTerm('');
                }
              }}
            >
              <motion.div
                key="server-modal-panel"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Chọn Máy Chủ (Server)</h3>
                    <p className="text-xs text-zinc-400">
                      Mặc định là Vietnam (VN) · Hỗ trợ toàn bộ 16 máy chủ toàn cầu
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsServerModalOpen(false);
                    setServerSearchTerm('');
                  }}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm theo tên máy chủ (Vietnam, Korea, NA...) hoặc mã VN, KR, EUW..."
                  value={serverSearchTerm}
                  onChange={(e) => setServerSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Region Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
                {serverRegions.map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setServerRegionFilter(reg)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      serverRegionFilter === reg
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {reg === 'ALL' ? 'Tất cả khu vực' : reg}
                  </button>
                ))}
              </div>

              {/* Server Grid Scrollable */}
              <div className="overflow-y-auto custom-dark-scrollbar space-y-2 pr-1 flex-1 min-h-[220px] max-h-[360px]">
                {filteredServers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredServers.map((s) => {
                      const isSelected = server === s.code;
                      return (
                        <div
                          key={s.code}
                          onClick={() => {
                            setServer(s.code);
                            setIsServerModalOpen(false);
                            setServerSearchTerm('');
                            toast.success(`Đã chọn máy chủ ${s.name} (${s.code})`);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                              : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ServerFlag code={s.code} size="md" />
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs sm:text-sm text-white truncate">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate">
                                {s.code} · {s.platformId} ({s.region})
                              </div>
                            </div>
                          </div>

                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                              <Check size={14} />
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500 hover:text-blue-400 font-semibold shrink-0">
                              Chọn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-xs">Không tìm thấy máy chủ nào khớp với "{serverSearchTerm}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
                <span>{filteredServers.length} máy chủ sẵn sàng</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsServerModalOpen(false);
                    setServerSearchTerm('');
                  }}
                  className="text-xs text-zinc-400 hover:text-white font-medium"
                >
                  Đóng
                </button>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 3: CHỌN LOẠI TÀI KHOẢN (RIOT, FACEBOOK, GOOGLE, APPLE, XBOX, PS)  */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isAccountTypeModalOpen && (
            <motion.div
              key="account-type-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setIsAccountTypeModalOpen(false);
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsAccountTypeModalOpen(false);
              }}
            >
              <motion.div
                key="account-type-modal-panel"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Chọn Loại Tài Khoản</h3>
                    <p className="text-xs text-zinc-400">
                      Chọn nền tảng tài khoản bạn dùng để đăng nhập vào game
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountTypeModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Provider Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto py-1">
                {ACCOUNT_TYPES.map((acc) => {
                  const isSelected = accountType === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setAccountType(acc.id);
                        setIsAccountTypeModalOpen(false);
                        toast.success(`Đã chọn loại tài khoản ${acc.name}`);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/50 shadow-md'
                          : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <ProviderLogo provider={acc.id} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-xs sm:text-sm">
                              {acc.name}
                            </span>
                            {acc.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                {acc.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                            {acc.desc}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Shield size={12} className="text-emerald-400" />
                  <span>Bảo mật thông tin đăng nhập tuyệt đối</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAccountTypeModalOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white font-medium"
                >
                  Đóng
                </button>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL 4: CHỌN BOOSTER                                                     */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {isBoosterModalOpen && (
            <motion.div
              key="booster-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setIsBoosterModalOpen(false);
                  setBoosterSearchTerm('');
                }
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsBoosterModalOpen(false);
                  setBoosterSearchTerm('');
                }
              }}
            >
              <motion.div
                key="booster-modal-panel"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 relative max-h-[90vh] flex flex-col will-change-transform cursor-default"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Crown size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Chọn Tuyển Thủ Cày Thuê</h3>
                    <p className="text-xs text-zinc-400">
                      Chọn tuyển thủ uy tín để đảm bảo tiến độ và tỷ lệ thắng
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBoosterModalOpen(false);
                    setBoosterSearchTerm('');
                  }}
                  className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Input Search Box */}
              <div className="relative shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hiển thị hoặc username..."
                  value={boosterSearchTerm}
                  onChange={(e) => setBoosterSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Booster List Scrollable */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 min-h-[240px] max-h-[380px]">
                {filteredBoosters.length > 0 ? (
                  filteredBoosters.map((b) => {
                    const isSelected = assignedBooster?.user?._id === b._id;
                    const bProfile = b.boosterProfile || b.booster_info || b;
                    const bCoupon = bProfile?.service_settings?.coupon;
                    const bMultiplier = bProfile?.service_settings?.standardConfig?.rankPriceMultiplier;

                    return (
                      <div
                        key={b._id}
                        onClick={() => handleSelectBooster(b)}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-500/80 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/50'
                            : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-white font-bold text-base shrink-0">
                            {b.avatar ? (
                              <Image
                                src={b.avatar}
                                alt=""
                                width={44}
                                height={44}
                                className="rounded-2xl object-cover"
                              />
                            ) : (
                              (b.displayName || b.username || 'B').slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                                  {b.displayName || b.username}
                                </span>
                                <UserBadge role="BOOSTER" size="sm" />
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono truncate">
                                @{b.username}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                              <span className={`flex items-center gap-1 font-bold ${b.rating && b.rating > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                <Star size={11} fill="currentColor" />
                                {b.rating && b.rating > 0 ? b.rating.toFixed(1) : '0.0'}
                              </span>
                              <span>•</span>
                              <span className="text-zinc-300">
                                {b.completedOrders || 0} đơn thành công
                              </span>
                              {bMultiplier && bMultiplier !== 1.0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-cyan-400 font-semibold">
                                    Giá: {(bMultiplier * 100).toFixed(0)}%
                                  </span>
                                </>
                              )}
                              {bCoupon?.isActive && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                  Voucher -{bCoupon.discountPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="px-2.5 py-1 rounded-xl bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1">
                              <Check size={13} />
                              <span>Đang chọn</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
                            >
                              Chọn
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <Search className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-xs">Không tìm thấy tuyển thủ nào khớp với "{boosterSearchTerm}"</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
                <span>Có {filteredBoosters.length} tuyển thủ sẵn sàng</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsBoosterModalOpen(false);
                    setBoosterSearchTerm('');
                  }}
                  className="text-xs text-zinc-400 hover:text-white font-medium"
                >
                  Đóng
                </button>
              </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function ServiceBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <ServiceBookingContent />
    </Suspense>
  );
}
