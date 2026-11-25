// src/app/services/[game]/[service]/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
  AlertTriangle,
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
import { getGameById, GAMES_CATALOG, getServiceMeta, LOL_PROMOTION_SERIES, PromotionTierItem, LOL_PLACEMENT_TIERS, PlacementTierItem } from '@/lib/games';
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
import {
  AOV_RANK_IMAGES,
  AOV_STAR_TIERS,
  AOV_TIER_PACKAGES,
  calculateAovStarBoost,
  calculateAovOddStarBoost,
  calculateAovOddStarTargetRank,
  getAovHighRankByStars,
  getAovOddStarStepsForSegment,
  getAovTierPackageCurrentTotal,
  resolveAovStarRate,
} from '@/lib/aov';

function StarIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/images/icons/star.png"
      alt="★"
      style={{ width: size, height: size }}
      className={`inline-block object-contain shrink-0 align-middle ${className}`}
    />
  );
}
import { getMobaLanes, getLaneMeta, isMobaGame, LaneMeta } from '@/lib/lanes';
import { ProviderLogo } from './components/ProviderLogo';
import {
  LolServer,
  LOL_SERVERS,
  ACCOUNT_TYPES,
  AOV_ACCOUNT_TYPES,
  LP_GAIN_OPTIONS,
  RR_GAIN_OPTIONS,
  VALORANT_TIER_CONFIG,
  TIER_CONFIG,
  AOV_TIER_CONFIG,
  AOV_SINGLE_STEP_TIERS,
  DIVISIONS,
  DIVISION_TO_NUM,
  NUM_TO_DIVISION,
  VALORANT_DIVISIONS,
  getRankStepId,
  getDivisionsForTier,
  findRankStepIndex,
  PLACEMENT_TIER_MULTIPLIERS,
  PLACEMENT_AVAILABLE_TIERS,
} from './constants/bookingConfig';
import { RankSelectModal } from './components/modals/RankSelectModal';
import { ServerSelectModal } from './components/modals/ServerSelectModal';
import { AccountTypeModal } from './components/modals/AccountTypeModal';
import { BoosterSelectModal } from './components/modals/BoosterSelectModal';
import { BoosterSelectionSection } from './components/sections/BoosterSelectionSection';
import { RiotAccountCheckerSection } from './components/sections/RiotAccountCheckerSection';
import { PointAndStarBoostSection } from './components/sections/PointAndStarBoostSection';
import { PromotionSeriesSection } from './components/sections/PromotionSeriesSection';
import { MatchesBoostSection } from './components/sections/MatchesBoostSection';
import { PlacementsBoostSection } from './components/sections/PlacementsBoostSection';
import { RankLadderSection } from './components/sections/RankLadderSection';
import { LpGainSection } from './components/sections/LpGainSection';
import { QueueAndServerSection } from './components/sections/QueueAndServerSection';
import { AddonsAndRolesSection } from './components/sections/AddonsAndRolesSection';
import { AccountCredentialsSection } from './components/sections/AccountCredentialsSection';
import { OrderSummarySidebar } from './components/sections/OrderSummarySidebar';
import { getLocalDateString, validateScheduleWithBooster } from '@/lib/booster-helpers';

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
  const isAov = ['AOV', 'LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes((game.id || '').toUpperCase());
  const isMatches = serviceSlug === 'matches';
  const isPlacements = serviceSlug === 'placements';
  const isPromotion = serviceSlug === 'promotion';
  const isBasePointBoost =
    !isMatches &&
    !isPlacements &&
    (serviceSlug === 'net-wins' ||
      serviceDef.pricingType === 'PER_UNIT' ||
      (serviceDef.pricingType as string) === 'TIER_PER_POINT');
  const isAovRankOrStar = isAov && (serviceSlug === 'rank-boost' || serviceSlug === 'net-wins');
  const isPointBoost = isAovRankOrStar ? serviceSlug === 'net-wins' : isBasePointBoost;
  const activeServiceSlug = serviceSlug;
  const activeRankSteps = isValorant ? VALORANT_RANK_STEPS : isAov ? AOV_RANK_STEPS : LOL_RANK_STEPS;
  const activeTierConfig = isValorant ? VALORANT_TIER_CONFIG : isAov ? AOV_TIER_CONFIG : TIER_CONFIG;
  const activeDivisions = isValorant ? VALORANT_DIVISIONS : DIVISIONS;
  const activeGainOptions = isValorant ? RR_GAIN_OPTIONS : LP_GAIN_OPTIONS;
  const activeAccountTypes = isAov ? AOV_ACCOUNT_TYPES : ACCOUNT_TYPES;

  // 1. States cho Cày Rank (Rank Calculator)
  const [currentRankId, setCurrentRankId] = useState<string>(
    isValorant ? 'GOLD_1' : isAov ? 'DIAMOND_5' : 'GOLD_4'
  );
  const [desiredRankId, setDesiredRankId] = useState<string>(
    isValorant ? 'GOLD_2' : isAov ? 'VETERAN_5' : 'GOLD_3'
  );
  const [lpGain, setLpGain] = useState<string>('25_PLUS');
  const [queueType, setQueueType] = useState<string>(searchParams.get('queueType') || 'SOLO_DUO');
  const [server, setServer] = useState<string>('VN');

  // States cho Cày Theo Số Trận (Matches: 1 - 10 trận)
  const [matchCount, setMatchCount] = useState<number>(() => {
    const qMatches = Number(searchParams.get('matches'));
    return qMatches >= 1 && qMatches <= 10 ? qMatches : 3;
  });

  // States cho Phân Hạng Đầu Mùa (Placements: 1 - 5 trận, Rank mùa trước từ Sắt đến Cao Thủ)
  const [previousSeasonRank, setPreviousSeasonRank] = useState<string>('GOLD');
  const [placementMatches, setPlacementMatches] = useState<number>(() => {
    const q = Number(searchParams.get('matches'));
    return q >= 1 && q <= 5 ? q : 5;
  });

  // Point Boost States (Cày Điểm RR / LP / Sao)
  const pointTiers = useMemo(() => getPointBoostTiers(game.id), [game.id]);
  const [selectedPointSegment, setSelectedPointSegment] = useState<string>(
    isValorant ? 'immortal1_2' : isAov ? 'diamond_veteran' : 'master'
  );
  const [currentPoints, setCurrentPoints] = useState<number>(isValorant ? 40 : 0);
  const [desiredPoints, setDesiredPoints] = useState<number>(isValorant ? 80 : isAov ? 10 : 100);

  // Trạng thái cày sao lẻ cho Liên Quân Mobile (Dưới Cao Thủ: Đồng -> Tinh Anh)
  const [aovOddStartStepId, setAovOddStartStepId] = useState<string>('DIAMOND_2'); // Mặc định Kim Cương II
  const [aovOddCurrentStarsInDiv, setAovOddCurrentStarsInDiv] = useState<number>(3); // Đang có 3 sao
  const [aovOddStarsToAdd, setAovOddStarsToAdd] = useState<number>(2); // Muốn cày thêm +2 sao

  const isSelectedAovHighStar = useMemo(() => {
    if (!isAov) return false;
    return Boolean(AOV_STAR_TIERS.find((t) => t.id === selectedPointSegment)?.isHighEloRange);
  }, [isAov, selectedPointSegment]);

  const gainedPoints = useMemo(() => {
    if (isAov && !isSelectedAovHighStar) {
      return Math.max(1, aovOddStarsToAdd);
    }
    return Math.max(0, desiredPoints - currentPoints);
  }, [isAov, isSelectedAovHighStar, aovOddStarsToAdd, desiredPoints, currentPoints]);

  const isPointInvalid = useMemo(() => {
    if (!isPointBoost) return false;
    if (isAov && !isSelectedAovHighStar) {
      return aovOddStarsToAdd < 1;
    }
    return currentPoints >= desiredPoints || currentPoints < 0 || desiredPoints < 0;
  }, [isPointBoost, isAov, isSelectedAovHighStar, aovOddStarsToAdd, currentPoints, desiredPoints]);

  // States cho Chuỗi Thăng Hạng & Cày Rank
  const isRankBoost = !isPointBoost && !isPromotion && !isMatches && !isPlacements;
  const isRiotGame = ['lol', 'valorant', 'tft'].includes((game.id || '').toLowerCase());

  // Tra cứu / Kiểm tra thông tin tài khoản Riot (Rank & LP)
  const [accountCheckInput, setAccountCheckInput] = useState(searchParams.get('ingame') || '');
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
    allLeagues?: any[];
  } | null>(null);

  const [selectedPromoId, setSelectedPromoId] = useState<string>('promo_platinum_1');
  const selectedPromo = useMemo(() => {
    return LOL_PROMOTION_SERIES.find((p) => p.id === selectedPromoId) || LOL_PROMOTION_SERIES[4];
  }, [selectedPromoId]);

  // Modals States
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [rankModalTarget, setRankModalTarget] = useState<'CURRENT' | 'DESIRED'>('CURRENT');
  const [tempTier, setTempTier] = useState<string>(isAov ? 'DIAMOND' : 'GOLD');
  const [tempDivision, setTempDivision] = useState<string>(isValorant ? '1' : isAov ? 'V' : 'IV');

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);
  const [showGainTooltip, setShowGainTooltip] = useState(false);

  // 2. States cho Tùy chọn mở rộng (Addons)
  const isMoba = useMemo(() => isMobaGame(game.id), [game.id]);
  const mobaLanes = useMemo(() => getMobaLanes(game.id), [game.id]);

  const [addons, setAddons] = useState<AddonSelections>({
    schedule: false,
    specificRole: false,
    selectedRoles: ['jungle'],
    specificChamps: false,
    livestream: false,
    flash: false,
    duo: false,
  });

  // Tự động đồng bộ selectedRoles phù hợp với tựa game (LMHT mặc định Jungle, Liên Quân có Bất Kỳ)
  useEffect(() => {
    const hasRandom = mobaLanes.some((l) => l.id === 'random');
    setAddons((prev) => {
      const current = prev.selectedRoles || [];
      const hasInvalid = current.some((r) => !mobaLanes.some((l) => l.id === r));
      if (current.length === 0 || hasInvalid) {
        const defaultRole = hasRandom ? 'random' : (mobaLanes[0]?.id || 'jungle');
        return {
          ...prev,
          selectedRoles: [defaultRole],
        };
      }
      return prev;
    });
  }, [mobaLanes]);

  const handleToggleLane = useCallback((laneId: string) => {
    setAddons((prev) => {
      const current = prev.selectedRoles || [];

      if (laneId === 'random') {
        if (current.includes('random')) {
          return { ...prev, selectedRoles: [] };
        }
        return { ...prev, selectedRoles: ['random'] };
      }

      let updated = current.filter((id) => id !== 'random');
      if (updated.includes(laneId)) {
        updated = updated.filter((id) => id !== laneId);
      } else {
        if (updated.length >= 2) {
          toast.info('Bạn chỉ được chọn tối đa 2 vị trí đường. Bấm vào đường đã chọn nếu muốn đổi vị trí!');
          return prev;
        }
        updated.push(laneId);
      }
      return { ...prev, selectedRoles: updated };
    });
  }, []);

  // 3. States cho Thông tin tài khoản cần cày
  const [accountType, setAccountType] = useState<string>(isAov ? 'Garena' : 'Riot');
  const [ingameAccount, setIngameAccount] = useState('');
  const [ingamePassword, setIngamePassword] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // 4. States cho Booster được chỉ định
  const [assignedBooster, setAssignedBooster] = useState<any>(null);
  const [loadingBooster, setLoadingBooster] = useState(false);
  const [boosterList, setBoosterList] = useState<any[]>([]);
  const [isManualSelectBooster, setIsManualSelectBooster] = useState(Boolean(cleanBoosterUsername));
  const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);

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

  // Chuyển hướng nếu khách truy cập gói cũ "duo-boost" sang "rank-boost" (đã gộp thành Add-on Duo)
  useEffect(() => {
    if (serviceSlug === 'duo-boost') {
      router.replace(`/services/${gameId}/rank-boost${boosterQuery ? `?booster=${boosterQuery}` : ''}`);
    }
  }, [serviceSlug, gameId, boosterQuery, router]);

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
        }
        if (isRankModalOpen) {
          setIsRankModalOpen(false);
        }
        if (isServerModalOpen) {
          setIsServerModalOpen(false);
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
      .catch(() => { });
  }, []);

  // Fetch danh sách booster của game để khách chọn nếu muốn (lọc theo service)
  useEffect(() => {
    fetch(`/api/boosters?game=${encodeURIComponent(game.id.toUpperCase())}&service=${encodeURIComponent(activeServiceSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.boosters || [];
        setBoosterList(list);

        // Nếu khách hàng vào trang tự nhiên (không chỉ định qua query URL)
        // và đang ở chế độ Ghép Nhanh Tự Động, tự động random chọn 1 booster phù hợp
        if (!cleanBoosterUsername && !isManualSelectBooster && list.length > 0) {
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
      .catch(() => { });
  }, [game.id, activeServiceSlug, cleanBoosterUsername]);

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
      .catch(() => { })
      .finally(() => setLoadingBooster(false));
  }, [cleanBoosterUsername]);

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
  };

  // Hệ số Gain cấu hình chuẩn xác theo yêu cầu người dùng (Liên Quân tính theo bậc/sao, không dùng LP Gain)
  const lpMultiplier = useMemo(() => {
    if (isAov) return 1.0;
    const opt = activeGainOptions.find((o) => o.id === lpGain);
    return opt ? opt.multiplier : 1.0;
  }, [isAov, activeGainOptions, lpGain]);

  // Point Boost Calculation Helpers
  const pointUnit = isValorant ? 'RR' : isAov ? 'Sao' : 'LP';
  const selectedPointTierObj = useMemo(() => {
    return pointTiers.find((t) => t.id === selectedPointSegment) || pointTiers[0];
  }, [pointTiers, selectedPointSegment]);

  // Helper chọn phân khúc sao/điểm (tự động set mốc sao hợp lý cho phân khúc Cao Thủ+ Liên Quân hoặc chọn rank lẻ)
  const handleSelectPointSegment = (tier: PointBoostTierSegment) => {
    setSelectedPointSegment(tier.id);
    if (!isAov) return;
    const aovTier = AOV_STAR_TIERS.find((t) => t.id === tier.id);
    if (!aovTier) return;
    if (aovTier.isHighEloRange) {
      const minS = aovTier.minStar ?? 0;
      const maxS = aovTier.maxStar != null ? aovTier.maxStar : minS + 10;
      setCurrentPoints(minS);
      setDesiredPoints(maxS === minS ? minS + 10 : maxS);
    } else {
      const steps = getAovOddStarStepsForSegment(tier.id);
      if (steps.length > 0 && !steps.some((s) => s.id === aovOddStartStepId)) {
        const defaultStep = steps[Math.floor(steps.length / 2)] || steps[0];
        setAovOddStartStepId(defaultStep.id);
        const maxStars = defaultStep.starsPerDivision || 5;
        setAovOddCurrentStarsInDiv(Math.min(3, maxStars - 1));
      }
    }
  };

  const aovOddAvailableSteps = useMemo(() => {
    if (!isAov || isSelectedAovHighStar) return [];
    return getAovOddStarStepsForSegment(selectedPointSegment);
  }, [isAov, isSelectedAovHighStar, selectedPointSegment]);

  const aovOddStartStep = useMemo(() => {
    return (
      aovOddAvailableSteps.find((s) => s.id === aovOddStartStepId) ||
      aovOddAvailableSteps[0] ||
      activeRankSteps[0]
    );
  }, [aovOddAvailableSteps, aovOddStartStepId, activeRankSteps]);

  const aovOddTiersInSegment = useMemo(() => {
    const tiers: { tier: string; name: string; icon: string; image: string }[] = [];
    const tierMeta: Record<string, { name: string; icon: string; image: string }> = {
      BRONZE: { name: 'Đồng', icon: '🥉', image: AOV_RANK_IMAGES.BRONZE },
      SILVER: { name: 'Bạc', icon: '🥈', image: AOV_RANK_IMAGES.SILVER },
      GOLD: { name: 'Vàng', icon: '🥇', image: AOV_RANK_IMAGES.GOLD },
      PLATINUM: { name: 'Bạch Kim', icon: '💎', image: AOV_RANK_IMAGES.PLATINUM },
      DIAMOND: { name: 'Kim Cương', icon: '🔷', image: AOV_RANK_IMAGES.DIAMOND },
      VETERAN: { name: 'Tinh Anh', icon: '🔮', image: AOV_RANK_IMAGES.VETERAN },
    };

    for (const s of aovOddAvailableSteps) {
      if (!tiers.some((t) => t.tier === s.tier)) {
        tiers.push({
          tier: s.tier,
          ...(tierMeta[s.tier] || { name: s.tier, icon: '🛡️', image: s.image }),
        });
      }
    }
    return tiers;
  }, [aovOddAvailableSteps]);

  const aovOddDivisionsForCurrentTier = useMemo(() => {
    return aovOddAvailableSteps.filter((s) => s.tier === aovOddStartStep.tier);
  }, [aovOddAvailableSteps, aovOddStartStep.tier]);

  const aovOddTargetRank = useMemo(() => {
    if (!isAov || isSelectedAovHighStar || !aovOddStartStep) return null;
    return calculateAovOddStarTargetRank(
      aovOddStartStep.id,
      aovOddCurrentStarsInDiv,
      aovOddStarsToAdd
    );
  }, [isAov, isSelectedAovHighStar, aovOddStartStep, aovOddCurrentStarsInDiv, aovOddStarsToAdd]);

  // Cấu hình dịch vụ riêng của Booster nếu khách đã chỉ định
  const boosterSettings =
    assignedBooster?.service_settings ||
    assignedBooster?.booster_info?.service_settings ||
    assignedBooster?.boosterData?.service_settings ||
    assignedBooster?.boosterData?.booster_info?.service_settings;

  const isSameGameCode = (code?: string) => {
    const c = (code || '').toUpperCase();
    const g = (game.id || '').toUpperCase();
    if (c === g) return true;
    if (g === 'LOL' && (c === 'LMHT' || c === 'LEAGUE')) return true;
    if (g === 'AOV' && ['LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(c)) return true;
    if (g === 'TFT' && c === 'DTCL') return true;
    return false;
  };

  const matchingBoosterRankService = useMemo(() => {
    if (!assignedBooster) return null;
    const customList = boosterSettings?.customServices || [];
    return (
      customList.find(
        (s: any) =>
          isSameGameCode(s.gameCode) &&
          (s.serviceType === 'rank-boost' || s.slug === 'rank-boost')
      ) || null
    );
  }, [assignedBooster, boosterSettings, game.id]);

  const matchingBoosterStarService = useMemo(() => {
    if (!assignedBooster) return null;
    const customList = boosterSettings?.customServices || [];
    return (
      customList.find(
        (s: any) =>
          isSameGameCode(s.gameCode) &&
          (s.serviceType === 'net-wins' || s.slug === 'net-wins')
      ) || null
    );
  }, [assignedBooster, boosterSettings, game.id]);

  const matchingBoosterService = useMemo(() => {
    if (!assignedBooster) return null;
    if (isPointBoost) return matchingBoosterStarService;
    if (activeServiceSlug === 'rank-boost') return matchingBoosterRankService;
    const customList = boosterSettings?.customServices || [];
    return (
      customList.find(
        (s: any) =>
          isSameGameCode(s.gameCode) &&
          (s.serviceType === activeServiceSlug || s.slug === activeServiceSlug)
      ) || null
    );
  }, [
    assignedBooster,
    boosterSettings,
    game.id,
    activeServiceSlug,
    isPointBoost,
    matchingBoosterRankService,
    matchingBoosterStarService,
  ]);

  // Tính toán cày theo Sao Liên Quân (hỗ trợ cả Sao lẻ dưới Cao Thủ và lũy tiến Cao Thủ+)
  const aovStarCalc = useMemo(() => {
    if (!isAov) return null;
    if (!isSelectedAovHighStar) {
      return calculateAovOddStarBoost({
        startStepId: aovOddStartStep.id,
        currentStarsInDiv: aovOddCurrentStarsInDiv,
        starsToAdd: aovOddStarsToAdd,
        boosterTierRates: matchingBoosterStarService?.tierRates,
      });
    }
    return calculateAovStarBoost({
      selectedSegmentId: selectedPointSegment,
      currentStars: currentPoints,
      desiredStars: desiredPoints,
      boosterTierRates: matchingBoosterStarService?.tierRates,
    });
  }, [
    isAov,
    isSelectedAovHighStar,
    selectedPointSegment,
    aovOddStartStep.id,
    aovOddCurrentStarsInDiv,
    aovOddStarsToAdd,
    currentPoints,
    desiredPoints,
    matchingBoosterStarService,
  ]);

  const segmentRate = useMemo(() => {
    if (isAov) {
      return resolveAovStarRate(selectedPointSegment, matchingBoosterStarService?.tierRates);
    }
    if (matchingBoosterService?.tierRates?.[selectedPointSegment]) {
      return Number(matchingBoosterService.tierRates[selectedPointSegment]);
    }
    if (matchingBoosterService?.price && matchingBoosterService.price > 0) {
      return Number(matchingBoosterService.price);
    }
    return selectedPointTierObj?.defaultPrice || (isValorant ? 5000 : 1000);
  }, [isAov, matchingBoosterStarService, matchingBoosterService, selectedPointSegment, selectedPointTierObj, isValorant]);

  const boosterStandardConfig = boosterSettings?.standardConfig;
  const boosterMultiplier = boosterStandardConfig?.rankPriceMultiplier || 1.0;
  const effectiveRankMultiplier = isAov
    ? Number(matchingBoosterRankService?.multiplier || 1.0)
    : assignedBooster
      ? boosterMultiplier
      : 1.0;
  const boosterAddonsConfig =
    assignedBooster?.addonsConfig ||
    boosterSettings?.addonsConfig ||
    boosterStandardConfig?.addonsConfig;

  // Ưu tiên stepOverrides gắn riêng với dịch vụ của game đó (tránh ghi đè chéo bảng giá LOL sang AOV/Valorant)
  const boosterStepOverrides = useMemo(() => {
    const serviceOverrides = matchingBoosterRankService?.stepOverrides;
    if (isAov || isValorant) {
      return serviceOverrides && Object.keys(serviceOverrides).length > 0 ? serviceOverrides : undefined;
    }
    const globalOverrides =
      boosterSettings?.stepOverrides || boosterStandardConfig?.stepOverrides;
    if (serviceOverrides && Object.keys(serviceOverrides).length > 0) {
      return { ...(globalOverrides || {}), ...serviceOverrides };
    }
    return globalOverrides;
  }, [isAov, isValorant, matchingBoosterRankService, boosterSettings, boosterStandardConfig]);

  // Cấu hình chi tiết từng addon (Ưu tiên cấu hình thực tế từ Booster)
  const scheduleCfg = boosterAddonsConfig?.schedule || { enabled: true, percent: 20 };
  const specificRoleCfg = boosterAddonsConfig?.specificRole || { enabled: true, percent: 25 };
  const specificChampsCfg = boosterAddonsConfig?.specificChamps || { enabled: true, percent: 30 };
  const livestreamCfg = boosterAddonsConfig?.livestream || { enabled: true, fee: 349000 };
  const flashCfg = boosterAddonsConfig?.flash || { enabled: true, percent: 35 };
  const duoCfg = boosterAddonsConfig?.duo || { enabled: true, percent: 50 };

  // Đơn giá mỗi trận cho Cày Theo Số Trận (Matches)
  const unitPrice = useMemo(() => {
    if (assignedBooster && typeof matchingBoosterService?.price === 'number' && matchingBoosterService.price > 0) {
      return matchingBoosterService.price;
    }
    return serviceDef.defaultPrice || 35000;
  }, [assignedBooster, matchingBoosterService?.price, serviceDef.defaultPrice]);

  // Đơn giá mỗi trận cơ bản cho Phân Hạng Đầu Mùa (Placements)
  const placementUnitPrice = useMemo(() => {
    if (assignedBooster && typeof matchingBoosterService?.price === 'number' && matchingBoosterService.price > 0) {
      return matchingBoosterService.price;
    }
    return serviceDef.defaultPrice || 30000;
  }, [assignedBooster, matchingBoosterService?.price, serviceDef.defaultPrice]);

  // Lấy đơn giá / 1 trận phân hạng theo mức Rank mùa trước (hỗ trợ Booster override từng rank chi tiết)
  const getPlacementTierPrice = useCallback(
    (tierKey: string) => {
      // 1. Kiểm tra Booster có cấu hình giá riêng cho bậc rank này trong stepOverrides không
      const boosterOverride =
        matchingBoosterService?.stepOverrides?.[tierKey] ??
        boosterStepOverrides?.[tierKey];
      if (assignedBooster && typeof boosterOverride === 'number' && boosterOverride > 0) {
        return boosterOverride;
      }

      // 2. Nếu Booster có đơn giá cơ bản và áp hệ số
      const tierDef = LOL_PLACEMENT_TIERS.find((t) => t.id === tierKey);
      const mult = tierDef?.multiplier ?? PLACEMENT_TIER_MULTIPLIERS[tierKey] ?? 1.0;
      if (assignedBooster && typeof matchingBoosterService?.price === 'number' && matchingBoosterService.price > 0) {
        return Math.round(matchingBoosterService.price * mult);
      }

      // 3. Mặc định theo hệ thống
      return tierDef?.defaultPrice ?? Math.round((serviceDef.defaultPrice || 30000) * mult);
    },
    [assignedBooster, matchingBoosterService, boosterStepOverrides, serviceDef.defaultPrice]
  );

  // Đơn giá thực tế theo mức Rank mùa trước đã chọn
  const placementEffectivePricePerMatch = useMemo(() => {
    return getPlacementTierPrice(previousSeasonRank);
  }, [getPlacementTierPrice, previousSeasonRank]);

  // Tỷ lệ cọc giữ chỗ: Ưu tiên tỷ lệ booster cấu hình riêng cho gói này, nếu không thì lấy mặc định theo dịch vụ
  const effectiveDepositPercent = useMemo(() => {
    if (assignedBooster && typeof matchingBoosterService?.depositPercent === 'number' && matchingBoosterService.depositPercent > 0) {
      return Number(matchingBoosterService.depositPercent);
    }
    if (isMatches || isPlacements) {
      return serviceDef.depositPercent || 100;
    }
    return serviceDef.depositPercent || (isPointBoost ? 30 : 100);
  }, [assignedBooster, matchingBoosterService?.depositPercent, serviceDef.depositPercent, isMatches, isPlacements, isPointBoost]);

  // Tính toán bảng giá (Hỗ trợ Cày Theo Số Trận, Phân Hạng Đầu Mùa, Cày Điểm RR/LP/Sao, Chuỗi Thăng Hạng và Cày Bậc Rank)
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

    if (isMatches) {
      const baseMatchesPrice = matchCount * unitPrice;

      let addonPercentage = 0;
      let addonFlatFee = 0;
      if (addons.duo && duoCfg.enabled) addonPercentage += (duoCfg.percent ?? 50) / 100;
      if (addons.flash && flashCfg.enabled) addonPercentage += (flashCfg.percent ?? 35) / 100;
      if (addons.specificChamps && specificChampsCfg.enabled) addonPercentage += (specificChampsCfg.percent ?? 30) / 100;
      if (addons.specificRole && specificRoleCfg.enabled) addonPercentage += (specificRoleCfg.percent ?? 25) / 100;
      if (addons.schedule && scheduleCfg.enabled) addonPercentage += (scheduleCfg.percent ?? 20) / 100;
      if (addons.livestream && livestreamCfg.enabled) addonFlatFee += livestreamCfg.fee ?? 349000;

      const percentageAddons = Math.round(baseMatchesPrice * addonPercentage);
      const totalAddons = percentageAddons + addonFlatFee;
      const total = baseMatchesPrice + totalAddons;
      const ratio = effectiveDepositPercent / 100;

      return {
        basePrice: baseMatchesPrice,
        stepsCount: matchCount,
        addonsCost: totalAddons,
        totalPrice: total,
        depositAmount: Math.round(total * ratio),
        stepsBreakdown: [],
      };
    }

    if (isPlacements) {
      const basePlacementPrice = placementMatches * placementEffectivePricePerMatch;

      let addonPercentage = 0;
      let addonFlatFee = 0;
      if (addons.duo && duoCfg.enabled) addonPercentage += (duoCfg.percent ?? 50) / 100;
      if (addons.flash && flashCfg.enabled) addonPercentage += (flashCfg.percent ?? 35) / 100;
      if (addons.specificChamps && specificChampsCfg.enabled) addonPercentage += (specificChampsCfg.percent ?? 30) / 100;
      if (addons.specificRole && specificRoleCfg.enabled) addonPercentage += (specificRoleCfg.percent ?? 25) / 100;
      if (addons.schedule && scheduleCfg.enabled) addonPercentage += (scheduleCfg.percent ?? 20) / 100;
      if (addons.livestream && livestreamCfg.enabled) addonFlatFee += livestreamCfg.fee ?? 349000;

      const percentageAddons = Math.round(basePlacementPrice * addonPercentage);
      const totalAddons = percentageAddons + addonFlatFee;
      const total = basePlacementPrice + totalAddons;
      const ratio = effectiveDepositPercent / 100;

      return {
        basePrice: basePlacementPrice,
        stepsCount: placementMatches,
        addonsCost: totalAddons,
        totalPrice: total,
        depositAmount: Math.round(total * ratio),
        stepsBreakdown: [],
      };
    }

    if (isPointBoost) {
      const rawPointPrice =
        isAov && aovStarCalc
          ? aovStarCalc.basePrice
          : Math.round(gainedPoints * segmentRate * lpMultiplier);
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
      boosterPriceMultiplier: effectiveRankMultiplier,
      depositPercent: effectiveDepositPercent,
      stepOverrides: assignedBooster ? boosterStepOverrides : undefined,
      addonsConfig: assignedBooster ? boosterAddonsConfig : undefined,
    });
  }, [
    isMatches,
    matchCount,
    unitPrice,
    isPlacements,
    placementMatches,
    placementEffectivePricePerMatch,
    isPointBoost,
    isAov,
    aovStarCalc,
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
    effectiveRankMultiplier,
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

  // Account Type Object
  const currentAccountTypeObj = useMemo(() => {
    return activeAccountTypes.find((a) => a.id === accountType) || activeAccountTypes[0];
  }, [activeAccountTypes, accountType]);

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

  // Áp dụng thông tin rank/điểm của tài khoản vào form booking theo đúng dịch vụ
  const applyAccountRankToService = (
    accountInfo: {
      tier: string;
      tierVi: string;
      rank: string;
      lp: number;
      cleanRankDisplay: string;
      fullName: string;
      queueName: string;
    },
    isSilent = false
  ) => {
    const { tier: rawTier, tierVi, rank: rawRank, lp: rawLp, cleanRankDisplay, fullName, queueName } = accountInfo;

    // 1. DỊCH VỤ RANK BOOST: Áp dụng cho Rank <= Cao Thủ
    if (isRankBoost) {
      const isAboveMaster = ['GRANDMASTER', 'CHALLENGER'].includes(rawTier);
      if (isAboveMaster) {
        const errMsg = 'Vui lòng nhập ingame có mức Rank Cao Thủ trở xuống';
        setAccountCheckError(`${errMsg} (Tài khoản hiện đang là ${tierVi} ở chế độ ${queueName})`);
        if (!isSilent) toast.error(errMsg);
        return;
      }

      setAccountCheckError('');
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

      if (!isSilent) {
        toast.success(`Đã nhận diện hàng chờ ${queueName}: ${fullName} (${cleanRankDisplay} - ${rawLp} LP)!`);
      }
    }

    // 2. DỊCH VỤ CÀY ĐIỂM LP (NET WINS): Phân khúc Cao Thủ, Đại Cao Thủ, Thách Đấu
    if (isPointBoost || serviceSlug === 'net-wins') {
      const isLolGame = (game.id || '').toLowerCase() === 'lol';

      if (isLolGame) {
        const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rawTier);
        if (isApex) {
          setAccountCheckError('');
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

          if (!isSilent) {
            toast.success(`Đã nhận diện hàng chờ ${queueName}: ${fullName} (${cleanRankDisplay} - ${rawLp} LP)!`);
          }
        } else {
          // Rank < Cao Thủ (Ví dụ Kim Cương I) ở LMHT
          setSelectedPointSegment('master');
          setCurrentPoints(0);
          setDesiredPoints(100);
          setAccountCheckError(
            `Tài khoản ở chế độ ${queueName} hiện là ${cleanRankDisplay} (${rawLp} LP). Dịch vụ Cày Điểm LP chỉ áp dụng cho bậc Cao Thủ trở lên. Vui lòng chuyển sang gói Cày Cấp Bậc Rank hoặc chọn chế độ khác!`
          );
        }
      } else {
        setAccountCheckError('');
        setCurrentPoints(rawLp);
        if (desiredPoints <= rawLp) {
          setDesiredPoints(rawLp + 100);
        }
        if (!isSilent) {
          toast.success(`Đã nhận diện tài khoản: ${fullName} (${cleanRankDisplay}). Đã cập nhật Điểm hiện tại!`);
        }
      }
    }
  };

  // Tra cứu & Kiểm tra Rank & Điểm LP từ Riot Games API (Hỗ trợ gọi tự động hoặc nút bấm)
  const handleCheckAccountRank = async (targetOrEvent?: string | React.FormEvent, isSilent = false) => {
    if (targetOrEvent && typeof targetOrEvent !== 'string' && 'preventDefault' in targetOrEvent) {
      targetOrEvent.preventDefault();
    }
    const nameToCheck = (typeof targetOrEvent === 'string' ? targetOrEvent : accountCheckInput).trim();
    if (!nameToCheck) {
      if (!isSilent) toast.error('Vui lòng nhập tên in-game và tagline (Ví dụ: Mary Tái Lâm #2003)');
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
        setCheckedAccount(null);
        if (!isSilent) toast.error(errMsg);
        return;
      }

      if (data.isMock && !isSilent) {
        const mockMsg =
          data.mockReason?.includes('RIOT_API_KEY') || data.mockReason?.includes('developer.riotgames.com')
            ? 'Hệ thống đang bận. Vui lòng thử lại sau!'
            : data.mockReason || 'Dữ liệu thử nghiệm';
        toast.warning(`Chế độ giả lập (Mock): ${mockMsg}`);
      }

      const matchedLeague =
        Array.isArray(data.leagues)
          ? data.leagues.find((l: any) => l.queueType === targetQueue) || null
          : null;

      const rawTier = (matchedLeague?.tier || 'UNRANKED').toUpperCase();
      const rawRank = (matchedLeague?.rank || '').toUpperCase();
      const rawLp = Number(matchedLeague?.leaguePoints ?? 0);
      const wins = Number(matchedLeague?.wins ?? 0);
      const losses = Number(matchedLeague?.losses ?? 0);
      const tierVi = formatRankDisplayVi(rawTier);
      const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(rawTier);
      const cleanRankDisplay = isApex ? tierVi : `${tierVi}${rawRank ? ' ' + rawRank : ''}`;
      const fullName = data.gameName ? `${data.gameName}#${data.tagLine}` : nameToCheck;
      const currentQueueTitle = queueType === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi';

      // Lưu thông tin tài khoản Riot đã xác thực
      setCheckedAccount({
        gameName: data.gameName || fullName,
        tagLine: data.tagLine || '',
        riotId: fullName,
        tier: rawTier,
        tierVi,
        rank: isApex ? '' : rawRank,
        lp: rawLp,
        wins,
        losses,
        queueName: currentQueueTitle,
        isMock: data.isMock,
        allLeagues: data.leagues || [],
      });

      // Áp dụng rank/điểm vào dịch vụ
      applyAccountRankToService(
        {
          tier: rawTier,
          tierVi,
          rank: isApex ? '' : rawRank,
          lp: rawLp,
          cleanRankDisplay,
          fullName,
          queueName: currentQueueTitle,
        },
        isSilent
      );
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi kiểm tra thông tin tài khoản';
      setAccountCheckError(msg);
      setCheckedAccount(null);
      if (!isSilent) toast.error(msg);
    } finally {
      setIsCheckingAccount(false);
    }
  };

  // Tự động chuyển đổi và nhận diện lại Rank khi người dùng đổi hàng chờ (Đơn/Đôi <-> Linh Hoạt)
  useEffect(() => {
    if (!isRiotGame || !checkedAccount) return;

    const targetQueue = isValorant
      ? 'COMPETITIVE'
      : queueType === 'FLEX'
        ? 'RANKED_FLEX_SR'
        : 'RANKED_SOLO_5x5';

    const currentQueueTitle = queueType === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi';

    if (Array.isArray(checkedAccount.allLeagues) && checkedAccount.allLeagues.length > 0) {
      const matchedLeague = checkedAccount.allLeagues.find((l: any) => l.queueType === targetQueue) || null;
      const rawTier = (matchedLeague?.tier || 'UNRANKED').toUpperCase();
      const rawRank = (matchedLeague?.rank || '').toUpperCase();
      const rawLp = Number(matchedLeague?.leaguePoints ?? 0);
      const wins = Number(matchedLeague?.wins ?? 0);
      const losses = Number(matchedLeague?.losses ?? 0);
      const tierVi = formatRankDisplayVi(rawTier);
      const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(rawTier);
      const cleanRankDisplay = isApex ? tierVi : `${tierVi}${rawRank ? ' ' + rawRank : ''}`;

      setCheckedAccount((prev) =>
        prev
          ? {
            ...prev,
            tier: rawTier,
            tierVi,
            rank: isApex ? '' : rawRank,
            lp: rawLp,
            wins,
            losses,
            queueName: currentQueueTitle,
          }
          : null
      );

      applyAccountRankToService(
        {
          tier: rawTier,
          tierVi,
          rank: isApex ? '' : rawRank,
          lp: rawLp,
          cleanRankDisplay,
          fullName: checkedAccount.riotId,
          queueName: currentQueueTitle,
        },
        true
      );
    } else if (accountCheckInput.trim()) {
      handleCheckAccountRank(accountCheckInput.trim(), true);
    }
  }, [queueType]);

  // Tự động kiểm tra thông tin tài khoản Riot khi người dùng gõ (Debounce 600ms) - Tiện lợi tối đa
  useEffect(() => {
    if (!isRiotGame || !(isRankBoost || isPointBoost || serviceSlug === 'net-wins')) return;

    const trimmed = accountCheckInput.trim();
    // Điều kiện auto-check: có dấu # và có cả tên lẫn tag
    if (!trimmed.includes('#')) {
      if (checkedAccount) setCheckedAccount(null);
      return;
    }

    const parts = trimmed.split('#');
    if (!parts[0]?.trim() || !parts[1]?.trim()) {
      return;
    }

    const currentQueueTitle = queueType === 'FLEX' ? 'Linh Hoạt' : 'Đơn / Đôi';
    // Nếu đã xác thực đúng Riot ID này và cùng hàng chờ thì không check lại
    if (
      checkedAccount &&
      checkedAccount.riotId.toLowerCase() === trimmed.toLowerCase() &&
      checkedAccount.queueName === currentQueueTitle
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleCheckAccountRank(trimmed, true);
    }, 600);

    return () => clearTimeout(timer);
  }, [accountCheckInput, server, isRiotGame, isRankBoost, isPointBoost, serviceSlug]);

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

      // Chặn đặt đơn Cày Điểm LP nếu tài khoản trong LMHT chưa đạt bậc Cao Thủ
      if (isPointBoost && (game.id || '').toLowerCase() === 'lol') {
        if (!['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier)) {
          toast.error(
            `Tài khoản ở chế độ ${checkedAccount.queueName} hiện là ${checkedAccount.tierVi} ${checkedAccount.rank}. Dịch vụ Cày Điểm LP chỉ áp dụng cho bậc Cao Thủ trở lên. Vui lòng chuyển sang gói Cày Cấp Bậc Rank!`
          );
          const checkEl = document.getElementById('riot-account-check-box');
          if (checkEl) checkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      // Chặn đặt đơn Cày Rank nếu tài khoản > Cao Thủ
      if (isRankBoost && (game.id || '').toLowerCase() === 'lol') {
        if (['GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier)) {
          toast.error('Vui lòng chọn tài khoản có mức rank Cao Thủ trở xuống để cày rank!');
          const checkEl = document.getElementById('riot-account-check-box');
          if (checkEl) checkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    if (calculation.totalPrice <= 0) {
      toast.error(
        isMatches
          ? 'Vui lòng chọn số lượng trận cần cày hợp lệ'
          : isPlacements
            ? 'Vui lòng chọn số lượng trận phân hạng từ 1 đến 5'
            : isPointBoost
              ? 'Vui lòng chọn số điểm cần cày hợp lệ'
              : 'Vui lòng chọn rank mong muốn cao hơn rank hiện tại'
      );
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

    if (isMatches) {
      if (matchCount < 1 || matchCount > 10) {
        toast.error('Số lượng trận đấu phải từ 1 đến 10 trận');
        return;
      }
    }

    if (isPlacements) {
      if (placementMatches < 1 || placementMatches > 5) {
        toast.error('Số lượng trận phân hạng phải từ 1 đến 5 trận');
        return;
      }
    }

    if (!ingameAccount.trim() || !ingamePassword.trim()) {
      toast.error('Vui lòng điền đầy đủ tài khoản và mật khẩu in-game');
      return;
    }

    if (addons.specificRole) {
      const selected = addons.selectedRoles || [];
      if (selected.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 vị trí đường hoặc chọn Đường Bất Kỳ');
        return;
      }
    }

    if (addons.schedule) {
      if (!addons.scheduleDetails?.startDate) {
        toast.error('Vui lòng chọn ngày bắt đầu cày mong muốn');
        return;
      }
      const todayStr = getLocalDateString();
      if (addons.scheduleDetails.startDate < todayStr) {
        toast.error('Ngày bắt đầu cày không thể ở quá khứ. Vui lòng chọn từ hôm nay trở đi.');
        return;
      }

      if (assignedBooster) {
        const scheduleVal = validateScheduleWithBooster(addons.scheduleDetails, assignedBooster);
        if (scheduleVal.hasConflict) {
          toast.error(
            `Xung đột lịch với Tuyển thủ: ${scheduleVal.message || 'Lịch đã chọn nằm ngoài thời gian làm việc của Booster.'} Vui lòng căn chỉnh lại hoặc đổi tuyển thủ!`,
            { duration: 6000 }
          );
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const aovStartRankInfo = isAov && isPointBoost && isSelectedAovHighStar ? getAovHighRankByStars(currentPoints) : null;
      const aovTargetRankInfo = isAov && isPointBoost && isSelectedAovHighStar ? getAovHighRankByStars(desiredPoints) : null;
      const resolvedOrderServiceType = serviceSlug.toUpperCase().replace(/-/g, '_');

      const resolvedRoles = addons.specificRole ? (addons.selectedRoles || []) : [];
      const resolvedSchedule = addons.schedule ? addons.scheduleDetails : undefined;
      const resolvedAddons = {
        ...addons,
        schedule: Boolean(addons.schedule),
        scheduleDetails: resolvedSchedule,
        roles: resolvedRoles,
        selectedRoles: resolvedRoles,
      };

      const orderPayload = {
        game: game.id.toUpperCase(),
        serviceType: resolvedOrderServiceType,
        boosterId: assignedBooster?.user?._id || null,
        is_auto_matched: !isManualSelectBooster && Boolean(assignedBooster),
        options: {
          ...resolvedAddons,
          roles: resolvedRoles,
          selectedRoles: resolvedRoles,
          rolesDisplay: resolvedRoles.map((r) => getLaneMeta(r, game.id).name),
        },
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
            addons: resolvedAddons,
            roles: resolvedRoles,
            selectedRoles: resolvedRoles,
            steps_count: 1,
          }
          : isMatches
            ? {
              is_matches: true,
              service_name: 'Cày Theo Số Trận Thắng',
              match_count: matchCount,
              matches: matchCount,
              queue_type: queueType,
              server,
              addons: resolvedAddons,
              roles: resolvedRoles,
              selectedRoles: resolvedRoles,
              unit_price: unitPrice,
              steps_count: matchCount,
              ingame_name: checkedAccount?.riotId || null,
            }
          : isPlacements
            ? {
              is_placements: true,
              service_name: 'Phân Hạng Đầu Mùa',
              previous_season_rank: previousSeasonRank,
              previous_rank_label: TIER_CONFIG[previousSeasonRank]?.name || previousSeasonRank,
              placement_matches: placementMatches,
              matches: placementMatches,
              steps_count: placementMatches,
              queue_type: queueType,
              server,
              addons: resolvedAddons,
              roles: resolvedRoles,
              selectedRoles: resolvedRoles,
              unit_price: placementEffectivePricePerMatch,
              ingame_name: checkedAccount?.riotId || null,
            }
          : isPointBoost
            ? {
              is_point_boost: true,
              calc_mode: isAov ? 'BY_STAR' : 'BY_LP',
              game: game.id.toUpperCase(),
              segment: selectedPointSegment,
              segment_label: selectedPointTierObj.label,
              current_rank: isAov && !isSelectedAovHighStar
                ? `${aovOddStartStep.label} (${aovOddCurrentStarsInDiv} sao)`
                : aovStartRankInfo ? aovStartRankInfo.label : selectedPointTierObj.label,
              desired_rank: isAov && !isSelectedAovHighStar
                ? aovOddTargetRank?.targetStepLabel || `${selectedPointTierObj.label} (+${aovOddStarsToAdd} sao)`
                : aovTargetRankInfo
                  ? aovTargetRankInfo.label
                  : `${selectedPointTierObj.label} (${desiredPoints} ${pointUnit})`,
              start_lp: isAov && !isSelectedAovHighStar ? aovOddCurrentStarsInDiv : currentPoints,
              target_lp: isAov && !isSelectedAovHighStar ? aovOddCurrentStarsInDiv + aovOddStarsToAdd : desiredPoints,
              current_lp: isAov && !isSelectedAovHighStar ? aovOddCurrentStarsInDiv : currentPoints,
              current_points: isAov && !isSelectedAovHighStar ? aovOddCurrentStarsInDiv : currentPoints,
              desired_points: isAov && !isSelectedAovHighStar ? aovOddCurrentStarsInDiv + aovOddStarsToAdd : desiredPoints,
              gained_points: gainedPoints,
              target_points: gainedPoints,
              num_games: gainedPoints,
              unit_price_per_lp: isAov && aovStarCalc ? aovStarCalc.effectiveUnitPrice : segmentRate,
              unit: pointUnit,
              rate: isAov && aovStarCalc ? aovStarCalc.effectiveUnitPrice : segmentRate,
              star_breakdown: isAov && aovStarCalc ? aovStarCalc.breakdown : undefined,
              is_progressive_star: isAov && aovStarCalc ? aovStarCalc.isProgressive : false,
              is_odd_star: isAov && !isSelectedAovHighStar,
              odd_star_details: isAov && !isSelectedAovHighStar && aovOddTargetRank ? {
                startStepId: aovOddStartStep.id,
                startStepLabel: aovOddStartStep.label,
                currentStarsInDiv: aovOddCurrentStarsInDiv,
                starsToAdd: aovOddStarsToAdd,
                targetStepId: aovOddTargetRank.targetStepId,
                targetStepLabel: aovOddTargetRank.targetStepLabel,
                summaryText: aovOddTargetRank.summaryText,
              } : undefined,
              lp_gain: isAov ? null : lpGain,
              queue_type: queueType,
              server,
              addons: resolvedAddons,
              roles: resolvedRoles,
              selectedRoles: resolvedRoles,
              ingame_name: checkedAccount?.riotId || null,
            }
            : {
              game: game.id.toUpperCase(),
              current_rank: currentRankObj?.label,
              desired_rank: desiredRankObj?.label,
              current_rank_id: currentRankId,
              desired_rank_id: desiredRankId,
              lp_gain: isAov ? null : lpGain,
              queue_type: queueType,
              server,
              addons: resolvedAddons,
              roles: resolvedRoles,
              selectedRoles: resolvedRoles,
              ingame_name: checkedAccount?.riotId || null,
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
            <BoosterSelectionSection
              assignedBooster={assignedBooster}
              isManualSelectBooster={isManualSelectBooster}
              setIsManualSelectBooster={setIsManualSelectBooster}
              boosterList={boosterList}
              setAssignedBooster={setAssignedBooster}
              setAppliedCoupon={setAppliedCoupon}
              setCouponCode={setCouponCode}
              setIsBoosterModalOpen={setIsBoosterModalOpen}
              handleRandomRerollBooster={handleRandomRerollBooster}
              boosterMultiplier={boosterMultiplier}
            />

            {/* 2. KHỐI CẤU HÌNH DỊCH VỤ: VISUAL RANK / POINT / MATCHES / PLACEMENTS */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-6">
              <RiotAccountCheckerSection
                isRiotGame={isRiotGame}
                isRankBoost={isRankBoost}
                isPointBoost={isPointBoost}
                serviceSlug={serviceSlug}
                accountCheckInput={accountCheckInput}
                setAccountCheckInput={setAccountCheckInput}
                isCheckingAccount={isCheckingAccount}
                accountCheckError={accountCheckError}
                setAccountCheckError={setAccountCheckError}
                checkedAccount={checkedAccount}
                game={game}
                server={server}
                queueType={queueType}
                setQueueType={setQueueType}
                handleCheckAccountRank={handleCheckAccountRank}
              />

              {isPointBoost ? (
                <PointAndStarBoostSection
                  isPointBoost={isPointBoost}
                  isAov={isAov}
                  pointUnit={pointUnit}
                  pointTiers={pointTiers}
                  selectedPointSegment={selectedPointSegment}
                  matchingBoosterStarService={matchingBoosterStarService}
                  matchingBoosterService={matchingBoosterService}
                  aovStarCalc={aovStarCalc}
                  handleSelectPointSegment={handleSelectPointSegment}
                  isSelectedAovHighStar={isSelectedAovHighStar}
                  selectedPointTierObj={selectedPointTierObj}
                  aovOddStartStep={aovOddStartStep}
                  aovOddCurrentStarsInDiv={aovOddCurrentStarsInDiv}
                  setAovOddCurrentStarsInDiv={setAovOddCurrentStarsInDiv}
                  aovOddStarsToAdd={aovOddStarsToAdd}
                  setAovOddStarsToAdd={setAovOddStarsToAdd}
                  aovOddTiersInSegment={aovOddTiersInSegment}
                  aovOddAvailableSteps={aovOddAvailableSteps}
                  setAovOddStartStepId={setAovOddStartStepId}
                  aovOddDivisionsForCurrentTier={aovOddDivisionsForCurrentTier}
                  segmentRate={segmentRate}
                  aovOddTargetRank={aovOddTargetRank}
                  gainedPoints={gainedPoints}
                  currentPoints={currentPoints}
                  setCurrentPoints={setCurrentPoints}
                  desiredPoints={desiredPoints}
                  setDesiredPoints={setDesiredPoints}
                  isRiotGame={isRiotGame}
                  checkedAccount={checkedAccount}
                />
              ) : isPromotion ? (
                <PromotionSeriesSection
                  isPromotion={isPromotion}
                  selectedPromoId={selectedPromoId}
                  setSelectedPromoId={setSelectedPromoId}
                  selectedPromo={selectedPromo}
                  assignedBooster={assignedBooster}
                  matchingBoosterService={matchingBoosterService}
                />
              ) : isMatches ? (
                <MatchesBoostSection
                  isMatches={isMatches}
                  matchCount={matchCount}
                  setMatchCount={setMatchCount}
                  unitPrice={unitPrice}
                  queueType={queueType}
                  setQueueType={setQueueType}
                  isValorant={isValorant}
                  isAov={isAov}
                  currentServerObj={currentServerObj}
                  setIsServerModalOpen={setIsServerModalOpen}
                />
              ) : isPlacements ? (
                <PlacementsBoostSection
                  isPlacements={isPlacements}
                  placementMatches={placementMatches}
                  setPlacementMatches={setPlacementMatches}
                  previousSeasonRank={previousSeasonRank}
                  setPreviousSeasonRank={setPreviousSeasonRank}
                  getPlacementTierPrice={getPlacementTierPrice}
                  placementEffectivePricePerMatch={placementEffectivePricePerMatch}
                  queueType={queueType}
                  setQueueType={setQueueType}
                  isValorant={isValorant}
                  isAov={isAov}
                  currentServerObj={currentServerObj}
                  setIsServerModalOpen={setIsServerModalOpen}
                />
              ) : (
                <RankLadderSection
                  isValorant={isValorant}
                  isAov={isAov}
                  isRiotGame={isRiotGame}
                  checkedAccount={checkedAccount}
                  currentRankObj={currentRankObj}
                  desiredRankObj={desiredRankObj}
                  currentTierMeta={currentTierMeta}
                  desiredTierMeta={desiredTierMeta}
                  currentRankImg={currentRankImg}
                  desiredRankImg={desiredRankImg}
                  currentRankIndex={currentRankIndex}
                  desiredRankIndex={desiredRankIndex}
                  calculation={calculation}
                  handleOpenRankModal={handleOpenRankModal}
                  activeRankSteps={activeRankSteps}
                  currentRankId={currentRankId}
                  desiredRankId={desiredRankId}
                  setCurrentRankId={setCurrentRankId}
                  setDesiredRankId={setDesiredRankId}
                  assignedBooster={assignedBooster}
                  boosterStepOverrides={boosterStepOverrides}
                  effectiveRankMultiplier={effectiveRankMultiplier}
                />
              )}

              <LpGainSection
                isPromotion={isPromotion}
                isAov={isAov}
                isMatches={isMatches}
                isPlacements={isPlacements}
                isValorant={isValorant}
                showGainTooltip={showGainTooltip}
                setShowGainTooltip={setShowGainTooltip}
                activeGainOptions={activeGainOptions}
                lpGain={lpGain}
                setLpGain={setLpGain}
              />

              <QueueAndServerSection
                isValorant={isValorant}
                isAov={isAov}
                isMatches={isMatches}
                isPlacements={isPlacements}
                queueType={queueType}
                setQueueType={setQueueType}
                currentServerObj={currentServerObj}
                setIsServerModalOpen={setIsServerModalOpen}
              />

              <AddonsAndRolesSection
                addons={addons}
                setAddons={setAddons}
                scheduleCfg={scheduleCfg}
                specificRoleCfg={specificRoleCfg}
                specificChampsCfg={specificChampsCfg}
                livestreamCfg={livestreamCfg}
                flashCfg={flashCfg}
                duoCfg={duoCfg}
                mobaLanes={mobaLanes}
                handleToggleLane={handleToggleLane}
                assignedBooster={assignedBooster}
                onRerollBooster={handleRandomRerollBooster}
              />

              <AccountCredentialsSection
                setIsAccountTypeModalOpen={setIsAccountTypeModalOpen}
                accountType={accountType}
                currentAccountTypeObj={currentAccountTypeObj}
                isAov={isAov}
                ingameAccount={ingameAccount}
                setIngameAccount={setIngameAccount}
                ingamePassword={ingamePassword}
                setIngamePassword={setIngamePassword}
                orderNote={orderNote}
                setOrderNote={setOrderNote}
              />
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG, VOUCHER, ESCROW & SUBMIT */}
          <OrderSummarySidebar
            isPromotion={isPromotion}
            isMatches={isMatches}
            isPlacements={isPlacements}
            isPointBoost={isPointBoost}
            isAov={isAov}
            isValorant={isValorant}
            isRankBoost={isRankBoost}
            isRiotGame={isRiotGame}
            serviceSlug={serviceSlug}
            pointUnit={pointUnit}
            matchCount={matchCount}
            placementMatches={placementMatches}
            gainedPoints={gainedPoints}
            calculation={calculation}
            selectedPromo={selectedPromo}
            queueType={queueType}
            unitPrice={unitPrice}
            currentServerObj={currentServerObj}
            previousSeasonRank={previousSeasonRank}
            placementEffectivePricePerMatch={placementEffectivePricePerMatch}
            isSelectedAovHighStar={isSelectedAovHighStar}
            selectedPointTierObj={selectedPointTierObj}
            aovOddStartStep={aovOddStartStep}
            aovOddCurrentStarsInDiv={aovOddCurrentStarsInDiv}
            aovOddStarsToAdd={aovOddStarsToAdd}
            aovOddTargetRank={aovOddTargetRank}
            currentPoints={currentPoints}
            desiredPoints={desiredPoints}
            aovStarCalc={aovStarCalc}
            segmentRate={segmentRate}
            currentTierMeta={currentTierMeta}
            currentRankObj={currentRankObj}
            desiredTierMeta={desiredTierMeta}
            desiredRankObj={desiredRankObj}
            activeGainOptions={activeGainOptions}
            lpGain={lpGain}
            accountType={accountType}
            currentAccountTypeObj={currentAccountTypeObj}
            addons={addons}
            game={game}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            handleApplyCoupon={handleApplyCoupon}
            isApplyingCoupon={isApplyingCoupon}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            discountAmount={discountAmount}
            platformFeePercent={platformFeePercent}
            serviceFee={serviceFee}
            finalPrice={finalPrice}
            finalDeposit={finalDeposit}
            effectiveDepositPercent={effectiveDepositPercent}
            isSubmitting={isSubmitting}
            isPointInvalid={isPointInvalid}
            checkedAccount={checkedAccount}
            handlePlaceOrder={handlePlaceOrder}
          />
        </div>

        {/* ========================================================================= */}
        {/* MODALS: CHỌN RANK, SERVER, LOẠI TÀI KHOẢN, TUYỂN THỦ                     */}
        {/* ========================================================================= */}
        <RankSelectModal
          isOpen={isRankModalOpen}
          onClose={() => setIsRankModalOpen(false)}
          rankModalTarget={rankModalTarget}
          gameId={game.id}
          isValorant={isValorant}
          isAov={isAov}
          activeTierConfig={activeTierConfig}
          activeRankSteps={activeRankSteps}
          currentRankObj={currentRankObj}
          desiredRankObj={desiredRankObj}
          currentRankIndex={currentRankIndex}
          desiredRankIndex={desiredRankIndex}
          tempTier={tempTier}
          setTempTier={setTempTier}
          tempDivision={tempDivision}
          setTempDivision={setTempDivision}
          handleConfirmRank={handleConfirmRank}
          getDivisionsForTier={getDivisionsForTier}
          findRankStepIndex={findRankStepIndex}
        />

        <ServerSelectModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
          server={server}
          onSelectServer={(code) => setServer(code)}
          servers={LOL_SERVERS}
        />

        <AccountTypeModal
          isOpen={isAccountTypeModalOpen}
          onClose={() => setIsAccountTypeModalOpen(false)}
          accountType={accountType}
          onSelectAccountType={(typeId) => setAccountType(typeId)}
          activeAccountTypes={activeAccountTypes}
        />

        <BoosterSelectModal
          isOpen={isBoosterModalOpen}
          onClose={() => setIsBoosterModalOpen(false)}
          boosters={boosterList}
          assignedBooster={assignedBooster}
          onSelectBooster={handleSelectBooster}
        />
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
