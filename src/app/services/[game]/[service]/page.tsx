// src/app/services/[game]/[service]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
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
  X,
  ArrowRightLeft,
  ChevronRight,
  Globe,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { getGameById, GAMES_CATALOG, getServiceMeta } from '@/lib/games';
import {
  LOL_RANK_STEPS,
  calculateRankBoost,
  RankDivision,
  AddonSelections,
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

// 3. Cấu hình Hệ số Điểm Cộng Mỗi Ván (LP Gain)
const LP_GAIN_OPTIONS = [
  {
    id: '25_PLUS',
    label: '+25 trở lên',
    multiplier: 0.9,
    discountLabel: '-10%',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    desc: 'MMR rất cao · Leo cực nhanh',
  },
  {
    id: '20_24',
    label: '20 - 24',
    multiplier: 1.0,
    discountLabel: 'Chuẩn 0%',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'MMR tiêu chuẩn',
  },
  {
    id: '15_19',
    label: '15 - 19',
    multiplier: 1.1,
    discountLabel: '+10%',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    desc: 'MMR trung bình · Cần thêm số trận',
  },
  {
    id: 'UNDER_15',
    label: 'Dưới 15',
    multiplier: 1.15,
    discountLabel: '+15%',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    desc: 'MMR thấp (Hell Elo) · Cần gánh nặng',
  },
];

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

const DIVISIONS = ['IV', 'III', 'II', 'I'];

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

  // 1. States cho Cày Rank (Rank Calculator)
  const [currentRankId, setCurrentRankId] = useState<string>('GOLD_4');
  const [desiredRankId, setDesiredRankId] = useState<string>('GOLD_3');
  const [lpGain, setLpGain] = useState<string>('25_PLUS');
  const [queueType, setQueueType] = useState<string>('SOLO_DUO');
  const [server, setServer] = useState<string>('VN');

  // Modals States
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankModalTarget, setRankModalTarget] = useState<'CURRENT' | 'DESIRED'>('CURRENT');
  const [tempTier, setTempTier] = useState<string>('GOLD');
  const [tempDivision, setTempDivision] = useState<string>('IV');

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [serverSearchTerm, setServerSearchTerm] = useState('');
  const [serverRegionFilter, setServerRegionFilter] = useState('ALL');

  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);

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

  // 5. States cho Mã giảm giá & Submit
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper lấy token
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch danh sách booster của game để khách chọn nếu muốn
  useEffect(() => {
    fetch(`/api/boosters?game=${encodeURIComponent(game.id.toUpperCase())}`)
      .then((res) => res.json())
      .then((data) => setBoosterList(data.boosters || []))
      .catch(() => {});
  }, [game.id]);

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

  // Hệ số LP Gain cấu hình chuẩn xác theo yêu cầu người dùng:
  // +25 trở lên -> -10% (-0.1)
  // 20 - 24 -> 0% (0.0)
  // 15 - 19 -> +10% (+0.1)
  // Dưới 15 -> +15% (+0.15)
  const lpMultiplier = useMemo(() => {
    const opt = LP_GAIN_OPTIONS.find((o) => o.id === lpGain);
    return opt ? opt.multiplier : 1.0;
  }, [lpGain]);

  // Cấu hình dịch vụ riêng của Booster nếu khách đã chỉ định
  const boosterSettings =
    assignedBooster?.service_settings ||
    assignedBooster?.booster_info?.service_settings ||
    assignedBooster?.boosterData?.service_settings ||
    assignedBooster?.boosterData?.booster_info?.service_settings;

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

  // Tính toán bảng giá theo thuật toán Ladder Steps (Áp dụng cấu hình riêng của Booster)
  const calculation = useMemo(() => {
    return calculateRankBoost({
      currentRankId,
      desiredRankId,
      lpGainMultiplier: lpMultiplier,
      addons,
      boosterPriceMultiplier: isManualSelectBooster && assignedBooster ? boosterMultiplier : 1.0,
      depositPercent: serviceDef.depositPercent || 100,
      stepOverrides: isManualSelectBooster && assignedBooster ? boosterStepOverrides : undefined,
      addonsConfig: isManualSelectBooster && assignedBooster ? boosterAddonsConfig : undefined,
    });
  }, [
    currentRankId,
    desiredRankId,
    lpMultiplier,
    addons,
    serviceDef.depositPercent,
    isManualSelectBooster,
    assignedBooster,
    boosterMultiplier,
    boosterStepOverrides,
    boosterAddonsConfig,
  ]);

  // Tính giá sau khi áp dụng coupon
  const finalPrice = useMemo(() => {
    if (appliedCoupon && appliedCoupon.discountPercent > 0) {
      const discount = Math.round((calculation.totalPrice * appliedCoupon.discountPercent) / 100);
      return Math.max(0, calculation.totalPrice - discount);
    }
    return calculation.totalPrice;
  }, [calculation.totalPrice, appliedCoupon]);

  const finalDeposit = useMemo(() => {
    const ratio = (serviceDef.depositPercent || 100) / 100;
    return Math.round(finalPrice * ratio);
  }, [finalPrice, serviceDef.depositPercent]);

  // Rank Objects
  const currentRankObj = useMemo(() => {
    return LOL_RANK_STEPS.find((r) => r.id === currentRankId) || LOL_RANK_STEPS[0];
  }, [currentRankId]);

  const desiredRankObj = useMemo(() => {
    return LOL_RANK_STEPS.find((r) => r.id === desiredRankId) || LOL_RANK_STEPS[1];
  }, [desiredRankId]);

  const currentRankIndex = useMemo(() => {
    return LOL_RANK_STEPS.findIndex((r) => r.id === currentRankId);
  }, [currentRankId]);

  const desiredRankIndex = useMemo(() => {
    return LOL_RANK_STEPS.findIndex((r) => r.id === desiredRankId);
  }, [desiredRankId]);

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
    setRankModalTarget(target);
    const targetObj = target === 'CURRENT' ? currentRankObj : desiredRankObj;
    setTempTier(targetObj.tier);
    setTempDivision(targetObj.division || 'IV');
    setIsRankModalOpen(true);
  };

  // Xử lý xác nhận chọn Rank từ Modal
  const handleConfirmRank = () => {
    const selectedRankId = tempTier === 'MASTER' ? 'MASTER' : `${tempTier}_${tempDivision}`;
    const newIdx = LOL_RANK_STEPS.findIndex((r) => r.id === selectedRankId);

    if (newIdx === -1) {
      setIsRankModalOpen(false);
      return;
    }

    if (rankModalTarget === 'CURRENT') {
      setCurrentRankId(selectedRankId);
      // Nếu rank hiện tại >= rank mong muốn, tự động đẩy rank mong muốn lên bậc kế tiếp
      if (newIdx >= desiredRankIndex) {
        const nextDesired = LOL_RANK_STEPS[Math.min(newIdx + 1, LOL_RANK_STEPS.length - 1)];
        setDesiredRankId(nextDesired.id);
        toast.info(`Đã tự động đặt Rank mong muốn thành ${nextDesired.label}`);
      }
    } else {
      // Rank mong muốn
      if (newIdx <= currentRankIndex) {
        toast.error('Rank mong muốn phải cao hơn Rank hiện tại!');
        return;
      }
      setDesiredRankId(selectedRankId);
    }

    setIsRankModalOpen(false);
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    const cleanCode = couponCode.trim().toUpperCase();
    const boosterCoupon = assignedBooster?.boosterData?.service_settings?.coupon;

    if (boosterCoupon && boosterCoupon.isActive && boosterCoupon.code.toUpperCase() === cleanCode) {
      setAppliedCoupon(boosterCoupon);
      toast.success(`Đã áp dụng mã giảm giá ${boosterCoupon.discountPercent}% của tuyển thủ!`);
    } else {
      toast.error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
      setAppliedCoupon(null);
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

    if (calculation.totalPrice <= 0) {
      toast.error('Vui lòng chọn rank mong muốn cao hơn rank hiện tại');
      return;
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
        pricing: {
          original_price: calculation.totalPrice,
          final_price: finalPrice,
          deposit_amount: finalDeposit,
          deposit_percent: serviceDef.depositPercent || 100,
        },
        service_data: {
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

  const currentTierMeta = TIER_CONFIG[currentRankObj.tier] || TIER_CONFIG.GOLD;
  const desiredTierMeta = TIER_CONFIG[desiredRankObj.tier] || TIER_CONFIG.GOLD;

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

        {/* Main Grid: Form Left (7 Cols), Summary Right (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM CẤU HÌNH DỊCH VỤ */}
          <div className="lg:col-span-7 space-y-6">
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
                {isManualSelectBooster && assignedBooster && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    Đang chỉ định
                  </span>
                )}
              </div>

              {/* 2 Lựa chọn: Ghép nhanh vs Chỉ định */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualSelectBooster(false);
                    setAssignedBooster(null);
                    setAppliedCoupon(null);
                    setCouponCode('');
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
                    Hệ thống tự ghép Tuyển thủ Thách Đấu có winrate cao nhất đang online &lt; 3 phút.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsManualSelectBooster(true);
                    if (!assignedBooster) {
                      setIsBoosterModalOpen(true);
                      if (boosterList.length > 0) {
                        const first = boosterList[0];
                        setAssignedBooster({
                          user: first,
                          boosterData: first.boosterProfile || first.booster_info || first,
                        });
                      }
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

              {/* Card Tuyển Thủ Đang Chọn */}
              {isManualSelectBooster && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-white font-bold text-base shadow-inner">
                        {assignedBooster?.user?.avatar ? (
                          <Image
                            src={assignedBooster.user.avatar}
                            alt=""
                            width={44}
                            height={44}
                            className="rounded-2xl object-cover"
                          />
                        ) : (
                          (assignedBooster?.user?.displayName || assignedBooster?.user?.username || 'B')
                            .slice(0, 1)
                            .toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm">
                            {assignedBooster?.user?.displayName || assignedBooster?.user?.username || 'Tuyển thủ'}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            @{assignedBooster?.user?.username || ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1 text-amber-400 font-bold">
                            <Star size={12} fill="currentColor" />
                            {assignedBooster?.user?.rating
                              ? assignedBooster.user.rating.toFixed(1)
                              : '5.0'}
                          </span>
                          <span>•</span>
                          <span className="text-zinc-300">
                            {assignedBooster?.user?.completedOrders || 0} đơn hoàn thành
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

                    <Link
                      href={`/boosters/@${assignedBooster?.user?.username || ''}`}
                      target="_blank"
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1 self-start sm:self-auto"
                    >
                      <span>Xem hồ sơ</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  {/* Nút Mở Modal Đổi Tuyển Thủ */}
                  <div className="pt-2.5 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-400">
                      Muốn tuyển thủ khác cày đơn này?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBoosterModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 self-start sm:self-auto"
                    >
                      <Search size={13} />
                      <span>Đổi sang tuyển thủ khác</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. KHỐI THIẾT KẾ MỚI: VISUAL RANK SELECTOR & CẤU HÌNH THÔNG SỐ */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
              {/* LỘ TRÌNH RANK TƯƠNG TÁC (THAY THẾ HOÀN TOÀN DROPDOWN CŨ) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-400" />
                    <span>Lộ trình Cày Rank (Sắt IV → Cao Thủ)</span>
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
                      <span className="text-[10px] font-semibold text-blue-400 group-hover:underline">
                        Thay đổi
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-inner">
                        <img
                          src={currentTierMeta.image}
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
                            {currentRankObj.tier === 'MASTER' ? 'Cao Thủ' : `Bậc ${currentRankObj.division}`}
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
                          src={desiredTierMeta.image}
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
                            {desiredRankObj.tier === 'MASTER' ? 'Cao Thủ' : `Bậc ${desiredRankObj.division}`}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-bold">
                            +{calculation.stepsCount} bậc nhảy
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ĐIỂM CỘNG MỖI VÁN (LP GAIN) - CẤU HÌNH HỆ SỐ TRỰC QUAN */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <span>Điểm cộng mỗi ván (LP Gain)</span>
                    <Info size={13} className="text-blue-400" />
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Ảnh hưởng trực tiếp đến tổng giá cày
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {LP_GAIN_OPTIONS.map((opt) => {
                    const isSelected = lpGain === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setLpGain(opt.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/50 shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs sm:text-sm text-white">
                            {opt.label}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${opt.badgeClass}`}>
                            {opt.discountLabel}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-1">
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LOẠI HÀNG ĐỢI & CHỌN SERVER */}
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
                      <span className="text-base shrink-0">{currentServerObj.flag}</span>
                      <span className="font-bold truncate text-white">{currentServerObj.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {currentServerObj.code} · {currentServerObj.platformId}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors" />
                  </button>
                </div>
              </div>

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

          {/* CỘT PHẢI: BẢNG GIÁ TỔNG, CHI TIẾT BƯỚC NHẢY & THANH TOÁN ESCROW */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-zinc-900/70 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
              <h3 className="text-base font-extrabold text-white flex items-center justify-between">
                <span>Tóm Tắt Đơn Cày Rank</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {calculation.stepsCount} bậc thăng hạng
                </span>
              </h3>

              {/* Chi tiết lộ trình */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Lộ trình:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className={currentTierMeta.textColor}>{currentRankObj.label}</span>
                    <span>→</span>
                    <span className={desiredTierMeta.textColor}>{desiredRankObj.label}</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Loại hàng đợi:</span>
                  <span className="text-zinc-200">
                    {queueType === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Máy chủ (Server):</span>
                  <span className="text-zinc-200 flex items-center gap-1">
                    <span>{currentServerObj.flag}</span>
                    <span>{currentServerObj.name} ({currentServerObj.code})</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Điểm cộng / ván:</span>
                  <span className="text-zinc-200 flex items-center gap-1">
                    <span>{LP_GAIN_OPTIONS.find((o) => o.id === lpGain)?.label}</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${LP_GAIN_OPTIONS.find((o) => o.id === lpGain)?.badgeClass}`}>
                      {LP_GAIN_OPTIONS.find((o) => o.id === lpGain)?.discountLabel}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Loại tài khoản:</span>
                  <span className="text-zinc-200 flex items-center gap-1.5">
                    <ProviderLogo provider={accountType} className="w-3.5 h-3.5" />
                    <span>{currentAccountTypeObj.name}</span>
                  </span>
                </div>
              </div>

              {/* Phụ phí Addons */}
              {calculation.addonsCost > 0 && (
                <div className="flex justify-between text-xs py-1 border-t border-zinc-800 text-zinc-400">
                  <span>Phụ phí tùy chọn mở rộng:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    +{calculation.addonsCost.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              )}

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
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 mt-2 font-medium">
                    <span>Mã {appliedCoupon.code} (Giảm {appliedCoupon.discountPercent}%):</span>
                    <span>
                      -
                      {Math.round(
                        (calculation.totalPrice * appliedCoupon.discountPercent) / 100
                      ).toLocaleString('vi-VN')}{' '}
                      đ
                    </span>
                  </div>
                )}
              </div>

              {/* TỔNG TIỀN VÀ TIỀN CỌC ESCROW */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-blue-500/20 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Tổng giá dịch vụ:</span>
                  <span className="text-base font-bold text-white font-mono">
                    {finalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      Tiền cọc giữ qua Escrow:
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Bảo chứng an toàn 100%, chỉ thanh toán khi hoàn thành
                    </span>
                  </div>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {finalDeposit.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Nút Đặt đơn */}
              <button
                type="button"
                disabled={isSubmitting || calculation.totalPrice <= 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Thanh Toán & Đặt Cày Ngay</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1.5">
                <Shield size={12} className="text-emerald-400" />
                <span>Hoàn tiền 100% nếu không hoàn thành đúng tiến độ.</span>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM CHECKOUT BAR (Mobile Only) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 sm:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] text-zinc-400">Tổng:</span>
                <span className="text-base font-extrabold text-white font-mono">
                  {finalPrice.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                Cọc giữ Escrow: {finalDeposit.toLocaleString('vi-VN')} đ
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || calculation.totalPrice <= 0}
              onClick={handlePlaceOrder}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Đặt Cày Ngay</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: VISUAL RANK PICKER MODAL (CHỌN TỪ SẮT IV ĐẾN CAO THỦ)           */}
        {/* ========================================================================= */}
        {isRankModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsRankModalOpen(false)}
          >
            <div
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[92vh] flex flex-col"
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
                      Phạm vi cày dịch vụ từ Sắt IV đến Cao Thủ
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

              {/* Scroll Content */}
              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* 1. Chọn Tier Lớn */}
                <div>
                  <span className="text-xs font-bold text-zinc-300 block mb-2">
                    1. Chọn Hạng (Tier):
                  </span>
                  <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                    {Object.entries(TIER_CONFIG).map(([tierKey, meta]) => {
                      // Nếu chọn rank hiện tại: Không cho chọn Master
                      if (rankModalTarget === 'CURRENT' && tierKey === 'MASTER') return null;

                      const isSelected = tempTier === tierKey;
                      return (
                        <button
                          key={tierKey}
                          type="button"
                          onClick={() => {
                            setTempTier(tierKey);
                            if (tierKey === 'MASTER') {
                              setTempDivision('');
                            } else if (!tempDivision) {
                              setTempDivision('IV');
                            }
                          }}
                          className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 relative ${
                            isSelected
                              ? `${meta.activeBorder} ${meta.bgGradient} ${meta.glowClass}`
                              : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                            <img
                              src={meta.image}
                              alt={meta.name}
                              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                            />
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? meta.textColor : 'text-zinc-300'}`}>
                            {meta.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Chọn Bậc (Division) */}
                {tempTier !== 'MASTER' ? (
                  <div>
                    <span className="text-xs font-bold text-zinc-300 block mb-2">
                      2. Chọn Phân Bậc (Division):
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {DIVISIONS.map((div) => {
                        const stepId = `${tempTier}_${div}`;
                        const stepIdx = LOL_RANK_STEPS.findIndex((r) => r.id === stepId);
                        // Nếu là rank mong muốn, không cho chọn bậc <= rank hiện tại
                        const isDisabled = rankModalTarget === 'DESIRED' && stepIdx <= currentRankIndex;
                        const isSelected = tempDivision === div;

                        return (
                          <button
                            key={div}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setTempDivision(div)}
                            className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isDisabled
                                ? 'bg-zinc-950/30 border-zinc-900 opacity-40 cursor-not-allowed text-zinc-600'
                                : isSelected
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}
                          >
                            <span className="text-sm font-extrabold font-mono tracking-wider">
                              Bậc {div}
                            </span>
                            {isDisabled && (
                              <span className="text-[9px] text-zinc-500">Thấp hơn</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2.5">
                    <Crown size={18} className="shrink-0 text-purple-400" />
                    <span>
                      <strong>Cao Thủ:</strong> Mốc rank đích cao nhất trong bảng giá leo rank theo bậc.
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Preview & Confirm */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Đang chọn:</span>
                  <span className="text-sm font-black text-white">
                    {tempTier === 'MASTER'
                      ? 'Cao Thủ'
                      : `${TIER_CONFIG[tempTier]?.name || tempTier} ${tempDivision}`}
                  </span>
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
                    onClick={handleConfirmRank}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
                  >
                    Xác Nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: CHỌN MÁY CHỦ (SERVER POPUP GIỮA MÀN HÌNH)                       */}
        {/* ========================================================================= */}
        {isServerModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => {
              setIsServerModalOpen(false);
              setServerSearchTerm('');
            }}
          >
            <div
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
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
              <div className="overflow-y-auto space-y-2 pr-1 flex-1 min-h-[220px] max-h-[360px]">
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
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{s.flag}</span>
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: CHỌN LOẠI TÀI KHOẢN (RIOT, FACEBOOK, GOOGLE, APPLE, XBOX, PS)  */}
        {/* ========================================================================= */}
        {isAccountTypeModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsAccountTypeModalOpen(false)}
          >
            <div
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: CHỌN BOOSTER                                                     */}
        {/* ========================================================================= */}
        {isBoosterModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => {
              setIsBoosterModalOpen(false);
              setBoosterSearchTerm('');
            }}
          >
            <div
              className="bg-[#0e1017] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col"
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
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                                {b.displayName || b.username}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono truncate">
                                @{b.username}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star size={11} fill="currentColor" />
                                {b.rating ? b.rating.toFixed(1) : '5.0'}
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
            </div>
          </div>
        )}
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
