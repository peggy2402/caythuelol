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
  calculateAovOddStarTargetRank,
  getAovHighRankByStars,
  getAovOddStarStepsForSegment,
  getAovTierPackageCurrentTotal,
  resolveAovStarRate,
} from '@/lib/aov';
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
    selectedRoles: ['random'],
    specificChamps: false,
    livestream: false,
    flash: false,
    duo: false,
  });

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
      const maxS = aovTier.maxStar ?? Number.POSITIVE_INFINITY;
      if (currentPoints < minS || currentPoints >= maxS) {
        setCurrentPoints(minS);
        setDesiredPoints(minS + 10);
      } else if (desiredPoints <= currentPoints) {
        setDesiredPoints(currentPoints + 10);
      }
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
      const rate = resolveAovStarRate(selectedPointSegment, matchingBoosterStarService?.tierRates);
      const totalStars = Math.max(1, aovOddStarsToAdd);
      const subtotal = totalStars * rate;
      return {
        totalStars,
        basePrice: subtotal,
        effectiveUnitPrice: rate,
        isProgressive: false,
        breakdown: [
          {
            tierId: selectedPointSegment,
            label: selectedPointTierObj.label,
            image: selectedPointTierObj.image || AOV_RANK_IMAGES.MASTER,
            stars: totalStars,
            ratePerStar: rate,
            subtotal,
          },
        ],
      };
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
    aovOddStarsToAdd,
    currentPoints,
    desiredPoints,
    matchingBoosterStarService,
    selectedPointTierObj,
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

    try {
      setIsSubmitting(true);

      const aovStartRankInfo = isAov && isPointBoost && isSelectedAovHighStar ? getAovHighRankByStars(currentPoints) : null;
      const aovTargetRankInfo = isAov && isPointBoost && isSelectedAovHighStar ? getAovHighRankByStars(desiredPoints) : null;
      const resolvedOrderServiceType = serviceSlug.toUpperCase().replace(/-/g, '_');

      const resolvedRoles = addons.specificRole ? (addons.selectedRoles || []) : [];
      const resolvedAddons = {
        ...addons,
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
                ? `${aovOddStartStep.label} (${aovOddCurrentStarsInDiv}★)`
                : aovStartRankInfo ? aovStartRankInfo.label : selectedPointTierObj.label,
              desired_rank: isAov && !isSelectedAovHighStar
                ? aovOddTargetRank?.targetStepLabel || `${selectedPointTierObj.label} (+${aovOddStarsToAdd}★)`
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
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isManualSelectBooster
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
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${!isManualSelectBooster
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
                  className={`p-3.5 rounded-2xl border text-left transition-all relative ${isManualSelectBooster
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
                <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${isManualSelectBooster
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
                          <div className={`w-12 h-12 rounded-2xl overflow-hidden border flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0 ${isManualSelectBooster
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

                  {/* Input & Button Tra cứu (Tự động nhận diện khi gõ) */}
                  <form onSubmit={(e) => handleCheckAccountRank(e, false)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
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
                        placeholder="Nhập Ingame # Tagline (Ví dụ: Mary Tái Lâm #2003)"
                        className="w-full h-11 bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-28 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-medium"
                      />
                      {/* Trạng thái Inline bên trong ô nhập */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
                        {isCheckingAccount ? (
                          <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold animate-pulse">
                            <Loader2 size={14} className="animate-spin shrink-0" />
                            <span className="hidden sm:inline text-[11px]">Đang tìm...</span>
                          </div>
                        ) : checkedAccount && accountCheckInput.trim().toLowerCase() === checkedAccount.riotId.toLowerCase() ? (
                          <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 size={15} className="shrink-0" />
                            <span className="hidden sm:inline text-[11px]">Hợp lệ</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isCheckingAccount || !accountCheckInput.trim()}
                      className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
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

                  {/* Thông báo lỗi validation nếu không có checkedAccount */}
                  {accountCheckError && !checkedAccount && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle size={16} className="text-rose-400 shrink-0" />
                      <span className="font-semibold">{accountCheckError}</span>
                    </div>
                  )}

                  {/* Card hiển thị kết quả kiểm tra thành công */}
                  {checkedAccount && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
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
                                {['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(checkedAccount.tier)
                                  ? checkedAccount.tierVi
                                  : `${checkedAccount.tierVi}${checkedAccount.rank ? ' ' + checkedAccount.rank : ''}`}
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
                          {(() => {
                            const isLol = (game.id || '').toLowerCase() === 'lol';
                            const isPointEligible = !isLol || ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier);
                            const isRankEligible = !isLol || !['GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier);

                            if (isPointBoost ? isPointEligible : isRankEligible) {
                              return (
                                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-sm">
                                  <CheckCircle2 size={14} className="shrink-0" />
                                  <span>
                                    {isPointBoost ? 'Đã tự động điền Điểm hiện tại' : 'Đã tự động chọn Rank hiện tại'}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 shadow-sm">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{isPointBoost ? 'Chưa đủ điều kiện Cày Điểm LP' : 'Vượt quá mức Rank tối đa'}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* BANNER ĐIỀU HƯỚNG UX 1: Khách chọn Cày Điểm LP nhưng Rank ở chế độ này < Cao Thủ (Ví dụ Kim Cương I) */}
                      {isPointBoost && (game.id || '').toLowerCase() === 'lol' && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier) && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-zinc-950 border border-amber-500/40 text-amber-200 text-xs space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <div className="font-bold text-amber-300 text-sm">
                                Tài khoản ở chế độ {checkedAccount.queueName} hiện là {checkedAccount.tierVi} {checkedAccount.rank} ({checkedAccount.lp} LP)
                              </div>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                Gói dịch vụ <strong className="text-white">Cày Điểm LP (Net Wins)</strong> trong LMHT chỉ áp dụng cho bậc <strong className="text-amber-400">Cao Thủ (Master) trở lên</strong> vì điểm LP tích lũy vô hạn.
                                Nếu bạn muốn cày từ <strong className="text-white">{checkedAccount.tierVi} {checkedAccount.rank}</strong> lên Cao Thủ, vui lòng chuyển sang gói <strong className="text-cyan-400">Cày Cấp Bậc Rank</strong>!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                            <Link
                              href={`/services/lol/rank-boost?queueType=${queueType}&ingame=${encodeURIComponent(checkedAccount.riotId)}`}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                            >
                              <Zap size={14} />
                              <span>Chuyển sang gói Cày Cấp Bậc Rank</span>
                              <ArrowRight size={13} />
                            </Link>

                            {/* Nếu hàng chờ còn lại có Rank Cao Thủ trở lên, gợi ý nút đổi ngay */}
                            {checkedAccount.allLeagues?.some(
                              (l: any) =>
                                ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes((l.tier || '').toUpperCase()) &&
                                l.queueType !== (queueType === 'FLEX' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5')
                            ) && (
                                <button
                                  type="button"
                                  onClick={() => setQueueType(queueType === 'FLEX' ? 'SOLO_DUO' : 'FLEX')}
                                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                                >
                                  <Swords size={13} className="text-cyan-400" />
                                  <span>Chuyển sang {queueType === 'FLEX' ? 'Đơn / Đôi' : 'Linh Hoạt'} (Có bậc Cao Thủ+)</span>
                                </button>
                              )}
                          </div>
                        </div>
                      )}

                      {/* BANNER ĐIỀU HƯỚNG UX 2: Khách chọn Cày Cấp Bậc Rank nhưng Rank ở chế độ này > Cao Thủ (Đại Cao Thủ / Thách Đấu) */}
                      {isRankBoost && (game.id || '').toLowerCase() === 'lol' && ['GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier) && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-900/20 to-zinc-950 border border-cyan-500/40 text-cyan-200 text-xs space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <div className="font-bold text-cyan-300 text-sm">
                                Tài khoản ở chế độ {checkedAccount.queueName} hiện là {checkedAccount.tierVi} ({checkedAccount.lp} LP)
                              </div>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                Gói <strong className="text-white">Cày Cấp Bậc Rank</strong> chỉ áp dụng từ bậc <strong className="text-cyan-400">Cao Thủ trở xuống</strong>.
                                Tài khoản của bạn đã đạt <strong className="text-amber-400">{checkedAccount.tierVi}</strong>, vui lòng chuyển sang gói <strong className="text-cyan-400">Cày Điểm LP (Net Wins)</strong> để cày thêm điểm!
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyan-500/20">
                            <Link
                              href={`/services/lol/net-wins?queueType=${queueType}&ingame=${encodeURIComponent(checkedAccount.riotId)}`}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                            >
                              <Zap size={14} />
                              <span>Chuyển sang gói Cày Điểm LP</span>
                              <ArrowRight size={13} />
                            </Link>

                            {/* Nếu hàng chờ còn lại có Rank <= Cao Thủ (như Flex Kim Cương I), gợi ý nút đổi */}
                            {checkedAccount.allLeagues?.some(
                              (l: any) =>
                                !['GRANDMASTER', 'CHALLENGER'].includes((l.tier || '').toUpperCase()) &&
                                l.queueType !== (queueType === 'FLEX' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5')
                            ) && (
                                <button
                                  type="button"
                                  onClick={() => setQueueType(queueType === 'FLEX' ? 'SOLO_DUO' : 'FLEX')}
                                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                                >
                                  <Swords size={13} className="text-cyan-400" />
                                  <span>Chuyển sang {queueType === 'FLEX' ? 'Đơn / Đôi' : 'Linh Hoạt'} (&le; Cao Thủ)</span>
                                </button>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* HIỂN THỊ ĐÚNG HÌNH THỨC DỊCH VỤ LIÊN QUÂN MOBILE ĐÃ CHỌN (THEO BẬC RANK HOẶC THEO SỐ SAO) */}
              {isAovRankOrStar && (
                <div className="p-2 rounded-2xl bg-zinc-950/90 border border-white/10">
                  {!isPointBoost ? (
                    <div className="p-3 rounded-xl border text-left flex items-center gap-3 bg-gradient-to-r from-amber-600/20 to-orange-600/15 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-amber-500/20 border-amber-500/40 text-amber-400">
                        <Trophy size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                          <span>Cày theo Bậc Rank</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Trọn bậc
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Đồng → Cao Thủ · Từ Cao Thủ+ tùy chỉnh
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border text-left flex items-center gap-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/15 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-cyan-500/20 border-cyan-500/40 text-cyan-400">
                        <Star size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5 flex-wrap">
                          <span>Tính tiền theo Số Sao</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            5k – 30k+/sao
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Cày lẻ từng sao · Tự động tính lũy tiến 0★–100★+
                        </p>
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
                          ? 'Chọn Phân Khúc & Đơn Giá Cày Theo Sao Liên Quân'
                          : `Chọn Phân Khúc & Mức Giá Theo Điểm ${pointUnit}`}
                      </span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-cyan-400 font-semibold">
                      {isAov ? 'Đơn vị tính: Sao (★)' : `Đơn vị tính: Điểm ${pointUnit}`}
                    </span>
                  </div>

                  {/* Grid các Phân Khúc Rank */}
                  {(() => {
                    const renderTierCard = (tier: PointBoostTierSegment) => {
                      const isHighElo = isAov && tier.isHighEloRange;
                      const isSelected = isAov && isSelectedAovHighStar && isHighElo
                        ? currentPoints >= (tier.minStar ?? 0) && (tier.maxStar == null || currentPoints < tier.maxStar)
                        : selectedPointSegment === tier.id;
                      const customPrice = isAov
                        ? resolveAovStarRate(tier.id, matchingBoosterStarService?.tierRates)
                        : matchingBoosterService?.tierRates?.[tier.id] ?? tier.defaultPrice;

                      // Signature active styles per high-elo rank
                      let activeStyle = isSelected
                        ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-2 ring-cyan-400/50 scale-[1.01]'
                        : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60';

                      if (isSelected && isHighElo) {
                        if (tier.id === 'master_0_19') {
                          activeStyle = 'bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/60 scale-[1.01]';
                        } else if (tier.id === 'gm_20_49') {
                          activeStyle = 'bg-gradient-to-br from-sky-950/40 via-zinc-900 to-zinc-950 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.25)] ring-2 ring-sky-400/60 scale-[1.01]';
                        } else if (tier.id === 'conqueror_50_99') {
                          activeStyle = 'bg-gradient-to-br from-fuchsia-950/40 via-zinc-900 to-zinc-950 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.25)] ring-2 ring-fuchsia-400/60 scale-[1.01]';
                        } else if (tier.id === 'legend_100_plus') {
                          activeStyle = 'bg-gradient-to-br from-yellow-950/40 via-zinc-900 to-zinc-950 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.3)] ring-2 ring-yellow-400/60 scale-[1.01]';
                        }
                      }

                      return (
                        <div
                          key={tier.id}
                          onClick={() => handleSelectPointSegment(tier)}
                          className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between h-full ${activeStyle}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                {tier.image && (
                                  <div className={`w-9 h-9 rounded-xl bg-black/60 border p-1 flex items-center justify-center shrink-0 ${
                                    tier.id === 'master_0_19'
                                      ? 'border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                      : tier.id === 'gm_20_49'
                                      ? 'border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                                      : tier.id === 'conqueror_50_99'
                                      ? 'border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.2)]'
                                      : tier.id === 'legend_100_plus'
                                      ? 'border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                      : 'border-white/10'
                                  }`}>
                                    <img
                                      src={tier.image}
                                      alt={tier.label}
                                      className="w-full h-full object-contain drop-shadow"
                                    />
                                  </div>
                                )}
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border whitespace-nowrap font-mono tracking-tight ${tier.badgeColor}`}>
                                  {tier.shortLabel}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md shrink-0">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>

                            <div className="text-xs sm:text-sm font-black text-white mb-0.5 leading-snug">
                              {tier.label}
                            </div>
                            <div className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                              {tier.desc}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-zinc-800/80 flex items-baseline justify-between mt-auto">
                            <span className="text-[11px] text-zinc-400">Đơn giá:</span>
                            <div className="text-right">
                              <span className="text-sm sm:text-base font-black font-mono text-cyan-400">
                                {customPrice.toLocaleString('vi-VN')}
                              </span>
                              <span className="text-[10px] font-sans text-zinc-500 ml-1">đ/{tier.unit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    };

                    if (isAov) {
                      const oddTiers = pointTiers.filter((t) => t.category === 'ODD_STAR' || !t.isHighEloRange);
                      const highTiers = pointTiers.filter((t) => t.category === 'HIGH_ELO' || t.isHighEloRange);
                      return (
                        <div className="space-y-4">
                          {/* NHÓM 1: CÀY SAO LẺ (DƯỚI CAO THỦ) */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/70">
                              <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-cyan-400" />
                                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide">
                                  1. Cày Sao Lẻ (Bậc Dưới Cao Thủ)
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-300/80 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                Mua 1 – 5 sao lẻ/đoàn
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
                              {oddTiers.map(renderTierCard)}
                            </div>
                          </div>

                          {/* NHÓM 2: CÀY SAO TÍCH LŨY (CAO THỦ TRỞ LÊN) */}
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-zinc-800/70">
                              <div className="flex items-center gap-2">
                                <Crown size={15} className="text-amber-400 shrink-0" />
                                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                                  2. Cày Sao Tích Lũy (Cao Thủ Trở Lên)
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300/90 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 self-start sm:self-auto">
                                Tích lũy 0★ ➔ 100★+ (Tự tính lũy tiến)
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              Bấm vào phân khúc để chọn nhanh mốc xuất phát, hoặc nhập trực tiếp số sao hiện tại &amp; mục tiêu ở bảng bên dưới.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-stretch">
                              {highTiers.map(renderTierCard)}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className={`grid grid-cols-1 ${pointTiers.length === 4 ? 'sm:grid-cols-2' : pointTiers.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3'} gap-3 items-stretch`}>
                        {pointTiers.map(renderTierCard)}
                      </div>
                    );
                  })()}

                  {/* TRƯỜNG HỢP A: CÀY SAO LẺ DƯỚI CAO THỦ CHO LIÊN QUÂN MOBILE */}
                  {isAov && !isSelectedAovHighStar ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-cyan-500/30 shadow-xl space-y-5 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <Sparkles size={16} className="text-cyan-400 shrink-0" />
                            <span>Thiết Lập Rank Hiện Tại & Số Sao Cần Cày Thêm</span>
                            <span className="text-red-500">*</span>
                          </span>
                          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                            Chọn đoàn hiện tại của bạn trong phân khúc <strong>{selectedPointTierObj.label}</strong> và số sao muốn Booster cày thêm (+1 đến +5 sao lẻ).
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                          <span className="text-xs text-cyan-300 font-medium">Cần cày:</span>
                          <span className="text-base sm:text-lg font-black font-mono text-cyan-400 leading-none">
                            +{aovOddStarsToAdd} Sao
                          </span>
                        </div>
                      </div>

                      {/* Banner tổng quan Bậc & Đoàn đang chọn */}
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-zinc-900 via-cyan-950/20 to-zinc-900 border border-cyan-500/40 shadow-inner flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-black/60 border border-cyan-500/30 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                            <img src={aovOddStartStep.image} alt={aovOddStartStep.label} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                              Bậc & Đoàn Hiện Tại Bạn Đang Chọn:
                            </span>
                            <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 flex-wrap">
                              <span>{aovOddStartStep.label}</span>
                              <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                                {aovOddCurrentStarsInDiv} / {aovOddStartStep.starsPerDivision || 5} ★
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:flex flex-col items-end shrink-0">
                          <span className="text-[10px] text-zinc-400 font-medium">Phân khúc:</span>
                          <span className="text-xs font-black text-cyan-300">
                            {selectedPointTierObj.label}
                          </span>
                        </div>
                      </div>

                      {/* 1A. Nếu phân khúc có nhiều bậc (Đồng -> Bạch Kim), hiển thị hàng chọn Bậc rõ ràng */}
                      {aovOddTiersInSegment.length > 1 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                            <span>1A. Chọn Bậc Rank Hiện Tại:</span>
                            <span className="text-[11px] text-zinc-500">Đồng, Bạc, Vàng hoặc Bạch Kim</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {aovOddTiersInSegment.map((t) => {
                              const isCurrentTier = aovOddStartStep.tier === t.tier;
                              return (
                                <button
                                  key={t.tier}
                                  type="button"
                                  onClick={() => {
                                    const tierSteps = aovOddAvailableSteps.filter((s) => s.tier === t.tier);
                                    if (tierSteps.length > 0) {
                                      const targetStep = tierSteps[Math.floor(tierSteps.length / 2)] || tierSteps[0];
                                      setAovOddStartStepId(targetStep.id);
                                      const maxS = (targetStep.starsPerDivision || 5) - 1;
                                      if (aovOddCurrentStarsInDiv > maxS) setAovOddCurrentStarsInDiv(maxS);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                                    isCurrentTier
                                      ? 'bg-cyan-500/20 border-cyan-400 ring-1 ring-cyan-400/50 shadow-sm text-cyan-200'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                  }`}
                                >
                                  <img src={t.image} alt={t.name} className="w-6 h-6 object-contain shrink-0" />
                                  <div className="min-w-0 text-left">
                                    <span className="text-xs font-black block truncate">{t.name}</span>
                                  </div>
                                  {isCurrentTier && <Check size={14} className="text-cyan-400 ml-auto shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 1B. Chọn Đoàn (Division: V -> I) - Hiển thị to rõ, không bao giờ bị cắt chữ */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                            <span>{aovOddTiersInSegment.length > 1 ? '1B.' : '1.'} Chọn Đoàn Rank Hiện Tại:</span>
                            <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[11px] text-zinc-400">
                            Đang chọn: <strong className="text-cyan-300 font-bold">{aovOddStartStep.label}</strong>
                          </span>
                        </div>

                        <div className={`grid ${
                          aovOddDivisionsForCurrentTier.length === 3
                            ? 'grid-cols-3'
                            : aovOddDivisionsForCurrentTier.length === 4
                            ? 'grid-cols-4'
                            : 'grid-cols-5'
                        } gap-2 sm:gap-3`}>
                          {aovOddDivisionsForCurrentTier.map((step) => {
                            const isCurrentStep = aovOddStartStep.id === step.id;
                            return (
                              <button
                                key={step.id}
                                type="button"
                                onClick={() => {
                                  setAovOddStartStepId(step.id);
                                  const maxS = (step.starsPerDivision || 5) - 1;
                                  if (aovOddCurrentStarsInDiv > maxS) setAovOddCurrentStarsInDiv(maxS);
                                }}
                                className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                                  isCurrentStep
                                    ? 'bg-gradient-to-b from-cyan-500/25 to-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]'
                                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {/* Icon Rank */}
                                <div className="w-8 h-8 sm:w-10 sm:h-10 mb-1 flex items-center justify-center">
                                  <img
                                    src={step.image}
                                    alt={step.label}
                                    className="w-full h-full object-contain drop-shadow"
                                  />
                                </div>

                                {/* Đoàn La Mã to rõ */}
                                <span className={`text-xs sm:text-sm font-black whitespace-nowrap uppercase tracking-tight ${
                                  isCurrentStep ? 'text-white' : 'text-zinc-200'
                                }`}>
                                  Đoàn {step.division}
                                </span>

                                {/* Số sao mỗi đoàn */}
                                <span className="text-[10px] text-zinc-400 whitespace-nowrap mt-0.5">
                                  {step.starsPerDivision || 5} sao
                                </span>

                                {isCurrentStep && (
                                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md">
                                    <Check size={10} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Số sao hiện đang có trong đoàn */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-300">
                            2. Số sao hiện đang có trong đoàn ({aovOddStartStep.label}):
                          </label>
                          <span className="text-[11px] text-amber-400 font-bold font-mono">
                            {aovOddCurrentStarsInDiv} / {aovOddStartStep.starsPerDivision || 5} ★
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: aovOddStartStep.starsPerDivision || 5 }).map((_, starNum) => {
                            const isSelected = aovOddCurrentStarsInDiv === starNum;
                            return (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => setAovOddCurrentStarsInDiv(starNum)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                }`}
                              >
                                <Star size={13} className={isSelected ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'} />
                                <span>{starNum} sao</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Số lượng sao muốn cày thêm */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-300">
                            3. Số lượng sao muốn cày thêm:
                          </label>
                          <span className="text-[11px] text-cyan-400 font-mono font-bold">
                            Đơn giá: {segmentRate.toLocaleString('vi-VN')} đ/Sao
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => setAovOddStarsToAdd((s) => Math.max(1, s - 1))}
                              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 text-base font-black font-mono text-cyan-400 min-w-[3rem] text-center">
                              +{aovOddStarsToAdd}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAovOddStarsToAdd((s) => Math.min(10, s + 1))}
                              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setAovOddStarsToAdd(num)}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                  aovOddStarsToAdd === num
                                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm'
                                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                                }`}
                              >
                                +{num} Sao
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. Live Preview Rank Đích */}
                      {aovOddTargetRank && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/70 to-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center shrink-0">
                              <img src={aovOddStartStep.image} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Xuất phát</span>
                              <span className="text-xs sm:text-sm font-extrabold text-white">
                                {aovOddStartStep.label} ({aovOddCurrentStarsInDiv}★)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-center sm:self-auto text-emerald-400">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-black font-mono">
                              <span>+{aovOddStarsToAdd} Sao</span>
                              <ArrowRight size={13} />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-black/50 border border-emerald-500/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                              <img src={aovOddTargetRank.targetImage} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Dự kiến đạt được</span>
                              <span className="text-xs sm:text-sm font-extrabold text-emerald-300">
                                {aovOddTargetRank.targetStepLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TRƯỜNG HỢP B: CAO THỦ+ LIÊN QUÂN HOẶC CÁC TỰA GAME KHÁC (DUAL INPUTS) */
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-xl space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <Target size={16} className="text-amber-400 shrink-0" />
                            <span>
                              {isAov
                                ? 'Thiết Lập Mốc Sao Cao Thủ+ (Tự Động Tính Lũy Tiến)'
                                : `Thiết Lập Điểm ${pointUnit} (Hiện Tại → Mong Muốn)`}
                            </span>
                            <span className="text-red-500">*</span>
                          </span>
                          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                            {isAov
                              ? 'Nhập số sao hiện tại và mục tiêu (0★ → 100★+). Nếu vượt ngưỡng Đại Cao Thủ (20★) hoặc Chiến Tướng (50★), hệ thống tự tính đúng đơn giá từng mốc.'
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

                      {/* Preview Huy hiệu Rank Cao Thủ -> Chiến Tướng -> Huyền Thoại theo số sao */}
                      {isAov && isSelectedAovHighStar && (() => {
                        const startInfo = getAovHighRankByStars(currentPoints);
                        const targetInfo = getAovHighRankByStars(desiredPoints);
                        return (
                          <div className="p-3 rounded-xl bg-zinc-900/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center shrink-0">
                                <img src={startInfo.image} alt={startInfo.label} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Xuất phát</span>
                                <span className="text-xs sm:text-sm font-extrabold text-white">{startInfo.label}</span>
                              </div>
                            </div>
                            <ArrowRight size={16} className="text-amber-400 hidden sm:block shrink-0" />
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-black/50 border border-emerald-500/30 p-1 flex items-center justify-center shrink-0">
                                <img src={targetInfo.image} alt={targetInfo.label} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Mục tiêu đạt được</span>
                                <span className="text-xs sm:text-sm font-extrabold text-emerald-300">{targetInfo.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Dual Inputs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Điểm Hiện Tại */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              {isAov ? 'Số Sao Hiện Tại' : 'Điểm Hiện Tại'}
                            </label>
                            <span className="text-[10px] text-zinc-500 font-mono">Bắt đầu từ</span>
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
                                setCurrentPoints((p) => Math.max(0, p - (isAov ? 1 : 10)));
                              }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
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
                                className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-white outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${isRiotGame && checkedAccount
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
                                setCurrentPoints((p) => Math.max(0, p + (isAov ? 1 : 10)));
                              }}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 active:scale-95 text-zinc-200 hover:text-white font-bold text-base flex items-center justify-center shrink-0 border border-white/5 transition-all select-none ${isRiotGame && checkedAccount ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
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
                              onClick={() => setDesiredPoints((p) => Math.max(0, p - (isAov ? 1 : 10)))}
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
                                className={`w-full h-9 sm:h-10 bg-zinc-950 border rounded-xl pl-3 pr-10 text-center text-base sm:text-lg font-black font-mono text-emerald-400 outline-none focus:ring-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${desiredPoints < currentPoints
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
                              onClick={() => setDesiredPoints((p) => Math.max(0, p + (isAov ? 1 : 10)))}
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

                      {/* Bảng phân tích lũy tiến theo mốc sao Liên Quân */}
                      {isAov && aovStarCalc && aovStarCalc.breakdown.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-cyan-500/20 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-cyan-400 uppercase tracking-wider">
                              {aovStarCalc.isProgressive
                                ? 'Chi tiết tính lũy tiến theo từng mốc sao'
                                : 'Chi tiết tạm tính theo sao'}
                            </span>
                            <span className="text-zinc-400 font-mono">
                              TB {aovStarCalc.effectiveUnitPrice.toLocaleString('vi-VN')} đ/sao
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {aovStarCalc.breakdown.map((seg) => (
                              <div
                                key={seg.tierId}
                                className="flex items-center justify-between gap-2 text-xs py-1 border-b border-zinc-800/70 last:border-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={seg.image}
                                    alt={seg.label}
                                    className="w-5 h-5 object-contain shrink-0"
                                  />
                                  <span className="text-zinc-300 truncate">
                                    {seg.label}
                                    {typeof seg.fromStar === 'number' && typeof seg.toStar === 'number'
                                      ? ` (${seg.fromStar}★ → ${seg.toStar}★)`
                                      : ''}
                                  </span>
                                </div>
                                <span className="font-mono text-white font-bold whitespace-nowrap">
                                  {seg.stars}★ × {seg.ratePerStar.toLocaleString('vi-VN')}đ ={' '}
                                  <span className="text-cyan-400">{seg.subtotal.toLocaleString('vi-VN')}đ</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick presets */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                        <span className="text-[11px] text-zinc-500 shrink-0 font-medium">Cộng thêm nhanh:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(isAov ? [1, 5, 10, 20, 30, 50] : [20, 40, 60, 80, 100]).map((pts) => (
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
                  )}
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
                                className={`relative w-12 h-14 sm:w-16 sm:h-18 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${isSelected
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
              ) : isMatches ? (
                /* TRƯỜNG HỢP: CÀY THEO SỐ TRẬN (MATCHES BOOST) */
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                          <span>Số Lượng Trận Thắng Cần Cày</span>
                          <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Kéo thanh trượt hoặc chọn nhanh số trận thắng bạn muốn cày (1 đến 10 trận thắng)
                        </p>
                      </div>
                    </div>

                    {/* Badge hiển thị số trận thắng hiện tại */}
                    <div className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl shadow-sm">
                      <span className="text-xs text-zinc-400 font-medium">Đã chọn:</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {matchCount} trận thắng
                      </span>
                    </div>
                  </div>

                  {/* Khối Thanh Kéo Slider */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">1 trận thắng</span>
                      <div className="text-center">
                        <span className="text-2xl font-black text-white tracking-tight">
                          {matchCount} <span className="text-sm font-bold text-emerald-400">TRẬN THẮNG</span>
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                          {unitPrice.toLocaleString('vi-VN')} đ / trận thắng
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-400">10 trận thắng</span>
                    </div>

                    {/* Range Input Slider */}
                    <div className="relative px-1">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={1}
                        value={matchCount}
                        onChange={(e) => setMatchCount(Number(e.target.value))}
                        className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none transition-all"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #6366f1 ${((matchCount - 1) / 9) * 100}%, #27272a ${((matchCount - 1) / 9) * 100}%, #27272a 100%)`,
                        }}
                      />
                    </div>

                    {/* 10 Nút Chọn Nhanh 1..10 */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = matchCount === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setMatchCount(num)}
                            className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border border-blue-400'
                                : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                            }`}
                          >
                            <span>{num}</span>
                            <span className="text-[9px] opacity-70">thắng</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cam kết chất lượng dịch vụ Cày Theo Số Trận Thắng */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5 text-xs leading-relaxed shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                      <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>Cam kết hoàn thành đủ số trận Thắng — An tâm tuyệt đối</span>
                    </div>
                    <p className="text-zinc-200">
                      • Booster cam kết cày đủ đúng{' '}
                      <strong className="text-white">{matchCount} trận Thắng</strong> bạn đã đặt — chỉ những trận{' '}
                      <strong className="text-emerald-300">Thắng</strong> mới được tính vào tiến độ hoàn thành đơn hàng.
                    </p>
                    <p className="text-zinc-300">
                      • Trường hợp phát sinh trận thua, Booster sẽ{' '}
                      <strong className="text-white">chủ động đánh bù miễn phí</strong> cho đến khi đủ đúng {matchCount} trận Thắng, hoàn toàn{' '}
                      <strong className="text-emerald-300">không phát sinh thêm chi phí</strong>.
                    </p>
                    <p className="text-zinc-400 text-[11px] pt-1 border-t border-emerald-500/15">
                      ✓ Lịch sử từng trận đấu được cập nhật minh bạch theo thời gian thực và bảo chứng thanh toán Escrow 100% bởi LeoRank.
                    </p>
                  </div>

                  {/* Khối Chọn Hàng Đợi (Đơn/Đôi vs Linh Hoạt) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Swords size={14} className="text-blue-400" />
                      <span>Chọn Loại Xếp Hạng</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQueueType('SOLO_DUO')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                          queueType === 'SOLO_DUO'
                            ? 'bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-zinc-950 border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          queueType === 'SOLO_DUO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border border-white/5'
                        }`}>
                          <Swords size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-extrabold ${queueType === 'SOLO_DUO' ? 'text-white' : 'text-zinc-300'}`}>
                              Đơn / Đôi
                            </h4>
                            {queueType === 'SOLO_DUO' && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng Solo / Duo 5v5</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQueueType('FLEX')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                          queueType === 'FLEX'
                            ? 'bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-zinc-950 border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          queueType === 'FLEX' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border border-white/5'
                        }`}>
                          <Users size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-extrabold ${queueType === 'FLEX' ? 'text-white' : 'text-zinc-300'}`}>
                              Linh Hoạt (Flex)
                            </h4>
                            {queueType === 'FLEX' && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng Linh Hoạt 5v5</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Chọn Server cho LOL */}
                  {!isValorant && !isAov && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-300 block flex items-center justify-between">
                        <span>Chọn Máy Chủ (Server) <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-blue-400 cursor-pointer font-semibold" onClick={() => setIsServerModalOpen(true)}>
                          16 máy chủ
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsServerModalOpen(true)}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium flex items-center justify-between transition-all group shadow-inner cursor-pointer"
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
                  )}
                </div>
              ) : isPlacements ? (
                /* TRƯỜNG HỢP: PHÂN HẠNG ĐẦU MÙA (PLACEMENTS: 1 ĐẾN 5 TRẬN & RANK MÙA TRƯỚC SẮT -> CAO THỦ) */
                <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/80 border border-white/10 shadow-2xl backdrop-blur-md space-y-6">
                  {/* Header Cấu hình Phân Hạng Đầu Mùa */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <Medal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                          <span>Cấu Hình Phân Hạng Đầu Mùa</span>
                          <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Chọn mức Rank mùa trước và số trận phân hạng bạn muốn cày (1 đến 5 trận)
                        </p>
                      </div>
                    </div>

                    <div className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border border-amber-500/30 px-3.5 py-1.5 rounded-2xl shadow-sm">
                      <span className="text-xs text-zinc-400 font-medium">Đã chọn:</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {placementMatches} trận
                      </span>
                    </div>
                  </div>

                  {/* 1. Chọn Rank Mùa Trước (Chỉ hiển thị 8 Tier từ Sắt đến Cao Thủ - KHÔNG CÓ BẬC I-IV) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                        <Crown size={14} className="text-amber-400" />
                        <span>Mức Rank Mùa Trước Của Bạn</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Chỉ hiển thị từ Sắt đến Cao Thủ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {PLACEMENT_AVAILABLE_TIERS.map((tierKey) => {
                        const tierMeta = TIER_CONFIG[tierKey];
                        const isSelected = previousSeasonRank === tierKey;
                        const matchPriceForTier = getPlacementTierPrice(tierKey);

                        return (
                          <button
                            key={tierKey}
                            type="button"
                            onClick={() => setPreviousSeasonRank(tierKey)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2.5 group ${
                              isSelected
                                ? `bg-gradient-to-br ${tierMeta.bgGradient} ${tierMeta.activeBorder} ${tierMeta.glowClass}`
                                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 w-full">
                              <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center p-1 shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                <img
                                  src={tierMeta.image}
                                  alt={tierMeta.name}
                                  className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                                />
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <div className={`text-sm font-black ${isSelected ? tierMeta.textColor : 'text-zinc-200'}`}>
                                {tierMeta.name}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-400">
                                {matchPriceForTier.toLocaleString('vi-VN')} đ/trận
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Chọn Số Trận Phân Hạng (1 đến 5 Trận) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Gamepad2 size={14} className="text-blue-400" />
                      <span>Số Trận Phân Hạng Cần Cày (1 đến 5 Trận)</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="p-5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400">1 trận (Tối thiểu)</span>
                        <div className="text-center">
                          <span className="text-2xl font-black text-white tracking-tight">
                            {placementMatches} <span className="text-sm font-bold text-amber-400">TRẬN</span>
                          </span>
                          <div className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                            {placementEffectivePricePerMatch.toLocaleString('vi-VN')} đ / trận ({TIER_CONFIG[previousSeasonRank]?.name})
                          </div>
                        </div>
                        <span className="text-xs font-bold text-zinc-400">5 trận (Tối đa)</span>
                      </div>

                      {/* Range Input Slider (1 -> 5) */}
                      <div className="relative px-1">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          step={1}
                          value={placementMatches}
                          onChange={(e) => setPlacementMatches(Number(e.target.value))}
                          className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none transition-all"
                          style={{
                            background: `linear-gradient(to right, #f59e0b 0%, #eab308 ${((placementMatches - 1) / 4) * 100}%, #27272a ${((placementMatches - 1) / 4) * 100}%, #27272a 100%)`,
                          }}
                        />
                      </div>

                      {/* 5 Nút Chọn Nhanh 1..5 */}
                      <div className="grid grid-cols-5 gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((num) => {
                          const isSelected = placementMatches === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setPlacementMatches(num)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30 scale-105 border border-amber-400'
                                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                              }`}
                            >
                              <span>{num}</span>
                              <span className="text-[9px] opacity-75">{num === 5 ? 'Đầy đủ' : 'trận'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. Khối Chọn Hàng Đợi (Đơn/Đôi vs Linh Hoạt) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <Swords size={14} className="text-blue-400" />
                      <span>Chọn Loại Xếp Hạng</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setQueueType('SOLO_DUO')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                          queueType === 'SOLO_DUO'
                            ? 'bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-zinc-950 border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          queueType === 'SOLO_DUO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border border-white/5'
                        }`}>
                          <Swords size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-extrabold ${queueType === 'SOLO_DUO' ? 'text-white' : 'text-zinc-300'}`}>
                              Đơn / Đôi
                            </h4>
                            {queueType === 'SOLO_DUO' && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng Solo / Duo 5v5</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQueueType('FLEX')}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                          queueType === 'FLEX'
                            ? 'bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-zinc-950 border-blue-500 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          queueType === 'FLEX' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-900 text-zinc-500 border border-white/5'
                        }`}>
                          <Users size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-extrabold ${queueType === 'FLEX' ? 'text-white' : 'text-zinc-300'}`}>
                              Linh Hoạt (Flex)
                            </h4>
                            {queueType === 'FLEX' && (
                              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng Linh Hoạt 5v5</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 4. Chọn Server cho LOL */}
                  {!isValorant && !isAov && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-300 block flex items-center justify-between">
                        <span>Chọn Máy Chủ (Server) <span className="text-red-500">*</span></span>
                        <span className="text-[11px] text-blue-400 cursor-pointer font-semibold" onClick={() => setIsServerModalOpen(true)}>
                          16 máy chủ
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsServerModalOpen(true)}
                        className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium flex items-center justify-between transition-all group shadow-inner cursor-pointer"
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
                  )}
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
                            ? 'Lộ trình Cày Rank Liên Quân (Đồng III → Huyền Thoại 100★)'
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
                        <span className={`text-[10px] font-bold ${isRiotGame && checkedAccount
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
                                : isAov && AOV_SINGLE_STEP_TIERS.includes(currentRankObj.tier)
                                  ? currentTierMeta.name
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
                                : isAov && AOV_SINGLE_STEP_TIERS.includes(desiredRankObj.tier)
                                  ? desiredTierMeta.name
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

                  {/* Bảng giá trọn bậc Liên Quân (Chọn nhanh 1 chạm + hiển thị giá Booster đang áp dụng) */}
                  {isAov && (
                    <div className="mt-4 p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/20 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-400" />
                          <span>Chọn Nhanh Theo Bậc Lớn Liên Quân</span>
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Nhấn vào gói để chọn lộ trình ngay
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {AOV_TIER_PACKAGES.map((pkg) => {
                          const fromStepId = pkg.stepIds[0];
                          const lastStepIdx = activeRankSteps.findIndex(
                            (s) => s.id === pkg.stepIds[pkg.stepIds.length - 1]
                          );
                          const toStep = activeRankSteps[lastStepIdx + 1];
                          const pkgTotal = Math.round(
                            getAovTierPackageCurrentTotal(pkg, assignedBooster ? boosterStepOverrides : undefined) *
                            effectiveRankMultiplier
                          );
                          const isCurrentPkg =
                            currentRankId === fromStepId && toStep && desiredRankId === toStep.id;

                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => {
                                if (!toStep) return;
                                setCurrentRankId(fromStepId);
                                setDesiredRankId(toStep.id);
                                toast.success(`Đã chọn lộ trình ${pkg.shortLabel}`);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${isCurrentPkg
                                  ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50'
                                  : pkg.isHighRank
                                    ? 'bg-zinc-900/70 border-purple-500/25 hover:border-purple-400/60'
                                    : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  <img src={pkg.fromImage} alt="" className="w-5 h-5 object-contain" />
                                  <ArrowRight size={10} className="text-zinc-500" />
                                  <img src={pkg.toImage} alt="" className="w-5 h-5 object-contain" />
                                </div>
                                {pkg.isHighRank && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    Cao Thủ+
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-bold text-white leading-tight truncate">
                                {pkg.shortLabel}
                              </div>
                              <div className="text-xs font-black font-mono text-amber-400">
                                {pkgTotal.toLocaleString('vi-VN')} đ
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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

              {/* ĐIỂM CỘNG MỖI VÁN (LP/RR GAIN) - KHÔNG HIỂN THỊ CHO LIÊN QUÂN MOBILE & CÀY THEO SỐ TRẬN & PHÂN HẠNG ĐẦU MÙA */}
              {!isPromotion && !isAov && !isMatches && !isPlacements && (
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
                          className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-full min-h-[82px] cursor-pointer group ${isSelected
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

              {/* LOẠI HÀNG ĐỢI & CHỌN SERVER (CHỈ DÀNH CHO LMHT, VALORANT VÀ LIÊN QUÂN KHÔNG CẦN CHỌN SERVER/FLEX, CÀY THEO TRẬN VÀ PHÂN HẠNG ĐÃ CHỌN Ở TRÊN) */}
              {!isValorant && !isAov && !isMatches && !isPlacements && (
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
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${queueType === 'SOLO_DUO'
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
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${queueType === 'FLEX'
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
                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${scheduleCfg.enabled
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

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${specificRoleCfg.enabled
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
                      : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
                    }`}>
                    <input
                      type="checkbox"
                      disabled={!specificRoleCfg.enabled}
                      checked={addons.specificRole && specificRoleCfg.enabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAddons({
                          ...addons,
                          specificRole: checked,
                          selectedRoles: checked && (!addons.selectedRoles || addons.selectedRoles.length === 0)
                            ? ['random']
                            : addons.selectedRoles,
                        });
                      }}
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

                  {/* Khối chọn Vị trí / Đường chi tiết */}
                  {addons.specificRole && specificRoleCfg.enabled && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/90 border border-blue-500/30 space-y-3 shadow-lg shadow-blue-500/5 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-400" />
                          <span className="text-xs font-bold text-white">
                            Chỉ định vị trí bạn muốn cày
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          (Chọn tối đa 2 đường hoặc Bất kỳ)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {mobaLanes.map((lane) => {
                          const isSelected = (addons.selectedRoles || []).includes(lane.id);
                          const isRandomActive = (addons.selectedRoles || []).includes('random');
                          const specificCount = (addons.selectedRoles || []).filter((id) => id !== 'random').length;
                          const isMax2Reached = !isRandomActive && specificCount >= 2;

                          // Quy tắc vô hiệu hoá:
                          // 1. Khi chọn 'Đường Bất Kỳ' -> 5 đường còn lại bị xám
                          // 2. Khi chọn 2 đường cụ thể (VD Caesar & Rừng) -> các đường khác và nút Bất kỳ bị xám
                          const isDisabled =
                            (!isSelected && isRandomActive && lane.id !== 'random') ||
                            (!isSelected && isMax2Reached && lane.id !== 'random') ||
                            (lane.id === 'random' && specificCount > 0);

                          return (
                            <button
                              key={lane.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleToggleLane(lane.id)}
                              className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition-all relative ${
                                isSelected
                                  ? 'bg-blue-500/20 border-blue-400 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                                  : isDisabled
                                  ? 'bg-zinc-950/40 border-zinc-900 opacity-30 cursor-not-allowed grayscale pointer-events-none'
                                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 cursor-pointer active:scale-95'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 p-1">
                                <Image
                                  src={lane.image}
                                  alt={lane.name}
                                  width={26}
                                  height={26}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold truncate">
                                  {lane.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 truncate">
                                  {lane.shortName}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                                  <Check size={10} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Thanh trạng thái chỉ dẫn */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                        {(addons.selectedRoles || []).includes('random') ? (
                          <span className="text-purple-300 font-medium">
                            ✓ Đã chọn <strong>Đường Bất Kỳ</strong> (Tuyển thủ sẽ chọn vị trí tối ưu).
                          </span>
                        ) : (addons.selectedRoles || []).length === 2 ? (
                          <span className="text-emerald-400 font-medium">
                            ✓ Đã chọn đủ 2 vị trí (Bấm vào đường đã chọn để bỏ chọn nếu muốn đổi).
                          </span>
                        ) : (addons.selectedRoles || []).length === 1 ? (
                          <span className="text-amber-400 font-medium">
                            ⚠️ Bạn đã chọn 1 đường. Có thể chọn thêm 1 đường hoặc bấm Đường Bất Kỳ.
                          </span>
                        ) : (
                          <span className="text-zinc-400">
                            👉 Vui lòng chọn 1-2 vị trí ưu tiên hoặc chọn Đường Bất Kỳ.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${specificChampsCfg.enabled
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

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${livestreamCfg.enabled
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

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${flashCfg.enabled
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

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${duoCfg.enabled
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
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                          <ProviderLogo provider={accountType} className="w-4 h-4 object-contain" />
                        </div>
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
                      placeholder={
                        isAov
                          ? accountType === 'Garena'
                            ? 'Tài khoản Garena (Tên đăng nhập / Email / SĐT)'
                            : accountType === 'Facebook'
                            ? 'Tài khoản Facebook (Email / SĐT đăng nhập)'
                            : accountType === 'Apple'
                            ? 'Apple ID / Email iCloud'
                            : accountType === 'Google'
                            ? 'Tài khoản Google (Email / Gmail)'
                            : 'Tài khoản Liên Quân cần cày'
                          : 'Tên đăng nhập / Riot ID'
                      }
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
                    : isMatches
                      ? 'Tóm Tắt Đơn Cày Trận Thắng'
                      : isPlacements
                        ? 'Tóm Tắt Phân Hạng Đầu Mùa'
                        : isPointBoost
                          ? isAov
                            ? 'Tóm Tắt Đơn Cày Rank Cao Cấp'
                            : `Tóm Tắt Đơn Cày Điểm ${pointUnit}`
                          : 'Tóm Tắt Đơn Cày Rank'}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {isPromotion
                    ? 'Chuỗi Thăng Hạng'
                    : isMatches
                      ? `${matchCount} trận thắng`
                      : isPlacements
                        ? `${placementMatches} trận phân hạng`
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
                ) : isMatches ? (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Dịch vụ:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Gamepad2 size={13} className="text-emerald-400" />
                        <span>Cày Theo Số Trận Thắng</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Số lượng:</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {matchCount} trận thắng
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Hàng chờ:</span>
                      <span className="font-semibold text-zinc-200">
                        {queueType === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Đơn giá:</span>
                      <span className="font-mono text-zinc-300">
                        {unitPrice.toLocaleString('vi-VN')} đ / trận thắng
                      </span>
                    </div>
                    {!isValorant && !isAov && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Máy chủ (Server):</span>
                        <span className="text-zinc-200 flex items-center gap-1.5">
                          <ServerFlag code={currentServerObj.code} size="sm" />
                          <span>{currentServerObj.name} ({currentServerObj.code})</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-400">
                      <span>Cam kết:</span>
                      <span className="text-emerald-400 font-semibold text-xs">
                        Đủ {matchCount} trận thắng (Đánh bù nếu thua)
                      </span>
                    </div>
                  </>
                ) : isPlacements ? (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Dịch vụ:</span>
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Medal size={13} className="text-amber-400" />
                        <span>Phân Hạng Đầu Mùa</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Rank mùa trước:</span>
                      <span className="font-bold text-amber-400">
                        {TIER_CONFIG[previousSeasonRank]?.name || previousSeasonRank}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Số trận phân hạng:</span>
                      <span className="font-extrabold text-blue-400 text-sm">
                        {placementMatches} trận
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Hàng chờ:</span>
                      <span className="font-semibold text-zinc-200">
                        {queueType === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Đơn giá:</span>
                      <span className="font-mono text-zinc-300">
                        {placementEffectivePricePerMatch.toLocaleString('vi-VN')} đ / trận
                      </span>
                    </div>
                    {!isValorant && !isAov && (
                      <div className="flex justify-between text-zinc-400">
                        <span>Máy chủ (Server):</span>
                        <span className="text-zinc-200 flex items-center gap-1.5">
                          <ServerFlag code={currentServerObj.code} size="sm" />
                          <span>{currentServerObj.name} ({currentServerObj.code})</span>
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-zinc-400">
                      <span>Quy cách cày:</span>
                      <span className="text-amber-400 font-semibold text-xs">
                        Đủ {placementMatches} trận phân hạng
                      </span>
                    </div>
                  </>
                ) : isPointBoost ? (
                  <>
                    {isAov && !isSelectedAovHighStar ? (
                      <>
                        <div className="flex justify-between text-zinc-300">
                          <span>Hình thức:</span>
                          <span className="font-bold text-cyan-400">Cày Sao Lẻ ({selectedPointTierObj.label})</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Xuất phát:</span>
                          <span className="font-bold text-white">
                            {aovOddStartStep.label} ({aovOddCurrentStarsInDiv}★)
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Dự kiến đạt được:</span>
                          <span className="font-bold text-emerald-400">
                            {aovOddTargetRank?.targetStepLabel}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Số sao cần cày:</span>
                          <span className="font-bold font-mono text-amber-400">
                            +{aovOddStarsToAdd} Sao
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-zinc-300">
                          <span>Phân khúc:</span>
                          <span className="font-bold text-cyan-400 text-right">
                            {isAov && isSelectedAovHighStar
                              ? `${getAovHighRankByStars(currentPoints).label} → ${getAovHighRankByStars(desiredPoints).label}`
                              : selectedPointTierObj.label}
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
                      </>
                    )}
                    {isAov && aovStarCalc && aovStarCalc.isProgressive ? (
                      <div className="pt-1.5 mt-1 border-t border-zinc-800/80 space-y-1">
                        {aovStarCalc.breakdown.map((seg) => (
                          <div key={seg.tierId} className="flex justify-between text-[11px] text-zinc-400 gap-2">
                            <span className="truncate">
                              {seg.fromStar}★→{seg.toStar}★ ({seg.stars}★ × {seg.ratePerStar.toLocaleString('vi-VN')}đ)
                            </span>
                            <span className="font-mono text-cyan-400 font-bold shrink-0">
                              {seg.subtotal.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between text-zinc-400">
                        <span>Đơn giá / {pointUnit}:</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(isAov && aovStarCalc ? aovStarCalc.effectiveUnitPrice : segmentRate).toLocaleString('vi-VN')} đ / {pointUnit}
                        </span>
                      </div>
                    )}
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

                {!isValorant && !isAov && !isMatches && !isPlacements && (
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
                {!isPromotion && !isAov && !isMatches && !isPlacements && (
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
                    <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 overflow-hidden">
                      <ProviderLogo provider={accountType} className="w-4 h-4 object-contain" />
                    </span>
                    <span>{currentAccountTypeObj.name}</span>
                  </span>
                </div>

                {addons.specificRole && (
                  <div className="flex justify-between items-start text-zinc-400 pt-2 border-t border-zinc-800/80">
                    <span className="shrink-0">Vị trí / Đường:</span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {(addons.selectedRoles && addons.selectedRoles.length > 0) ? (
                        addons.selectedRoles.map((roleId) => {
                          const meta = getLaneMeta(roleId, game.id);
                          return (
                            <span
                              key={roleId}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold text-xs"
                            >
                              <Image
                                src={meta.image}
                                alt={meta.name}
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 object-contain"
                              />
                              <span>{meta.name}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-zinc-300 font-medium text-xs">Đường Bất Kỳ</span>
                      )}
                    </div>
                  </div>
                )}
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
                disabled={isSubmitting || calculation.totalPrice <= 0 || isPointInvalid || (isMatches && (matchCount < 1 || matchCount > 10)) || (isPlacements && (placementMatches < 1 || placementMatches > 5))}
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
              disabled={isSubmitting || calculation.totalPrice <= 0 || isPointInvalid || (isMatches && (matchCount < 1 || matchCount > 10)) || (isPlacements && (placementMatches < 1 || placementMatches > 5))}
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
