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
} from 'lucide-react';
import { toast } from 'sonner';
import { getGameById, GAMES_CATALOG, getServiceMeta } from '@/lib/games';
import {
  LOL_RANK_STEPS,
  calculateRankBoost,
  RankDivision,
  AddonSelections,
} from '@/lib/rank-calculator';

const ICON_MAP: Record<string, any> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
};

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
  const [accountType, setAccountType] = useState<'Riot' | 'Garena'>('Riot');
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

  // 5. States cho Mã giảm giá
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
          // Tự áp dụng coupon của booster nếu có
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

  // Hệ số LP Gain
  const lpMultiplier = useMemo(() => {
    switch (lpGain) {
      case '25_PLUS':
        return 1.0;
      case '20_24':
        return 1.05;
      case '15_19':
        return 1.15;
      case 'UNDER_15':
        return 1.25;
      default:
        return 1.0;
    }
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
      toast.error('Rank mong muốn phải cao hơn Rank hiện tại');
      return;
    }

    if (!ingameAccount.trim() || !ingamePassword.trim()) {
      toast.error('Vui lòng nhập đầy đủ tài khoản và mật khẩu tài khoản cày');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentRankObj = LOL_RANK_STEPS.find((r) => r.id === currentRankId);
      const desiredRankObj = LOL_RANK_STEPS.find((r) => r.id === desiredRankId);

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
          {/* CỘT TRÁI: FORM CẤU HÌNH DỊCH VỤ (Chuẩn y như ảnh minh họa) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. LỰA CHỌN TUYỂN THỦ THỰC HIỆN (BƯỚC ĐẦU TIÊN CỰC KỲ TRỰC QUAN) */}
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

                  {/* Nút Mở Modal Đổi Tuyển Thủ Chuẩn UI/UX */}
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

            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
              {/* 2. Rank Hiện Tại & Rank Mong Muốn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">
                    Rank hiện tại <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentRankId}
                    onChange={(e) => setCurrentRankId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-all shadow-inner"
                  >
                    {LOL_RANK_STEPS.slice(0, -1).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">
                    Rank mong muốn <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={desiredRankId}
                    onChange={(e) => setDesiredRankId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-all shadow-inner"
                  >
                    {LOL_RANK_STEPS.slice(1).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Điểm cộng mỗi ván & Loại xếp hạng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2 flex items-center gap-1.5">
                    <span>Điểm cộng mỗi ván</span>
                    <Info size={13} className="text-blue-400" />
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={lpGain}
                    onChange={(e) => setLpGain(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-all shadow-inner"
                  >
                    <option value="25_PLUS">25 trở lên</option>
                    <option value="20_24">20 - 24</option>
                    <option value="15_19">15 - 19</option>
                    <option value="UNDER_15">Dưới 15</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2">
                    Loại xếp hạng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={queueType}
                    onChange={(e) => setQueueType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-all shadow-inner"
                  >
                    <option value="SOLO_DUO">Đơn / Đôi</option>
                    <option value="FLEX">Linh Hoạt (Flex)</option>
                  </select>
                </div>
              </div>

              {/* 3. Chọn Server */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">
                  Chọn Server <span className="text-red-500">*</span>
                </label>
                <select
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-all shadow-inner"
                >
                  <option value="VN">Việt Nam</option>
                  <option value="KR">Hàn Quốc (KR)</option>
                  <option value="SEA">Đông Nam Á (SEA)</option>
                  <option value="EUW">Tây Âu (EUW)</option>
                  <option value="NA">Bắc Mỹ (NA)</option>
                </select>
              </div>

              {/* 4. Tùy chọn mở rộng (Addons Checkboxes y hệt mẫu) */}
              <div className="pt-2">
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

              {/* 5. Thông tin tài khoản cần cày */}
              <div className="pt-2">
                <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider">
                  Thông tin tài khoản cần cày
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Tài khoản <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                    >
                      <option value="Riot">Riot</option>
                      <option value="Garena">Garena</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Tài khoản cần cày <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Điền tên đăng nhập"
                      value={ingameAccount}
                      onChange={(e) => setIngameAccount(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">
                      Mật khẩu tài khoản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Điền mật khẩu"
                      value={ingamePassword}
                      onChange={(e) => setIngamePassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">
                    Ghi chú thêm cho tuyển thủ (tuỳ chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Chỉ cày vào buổi tối sau 20h, không dùng IP lạ..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
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
                  <span className="font-bold text-white">
                    {LOL_RANK_STEPS.find((r) => r.id === currentRankId)?.label} →{' '}
                    {LOL_RANK_STEPS.find((r) => r.id === desiredRankId)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Loại hàng đợi:</span>
                  <span className="text-zinc-200">
                    {queueType === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Máy chủ:</span>
                  <span className="text-zinc-200">{server}</span>
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

        {/* STICKY BOTTOM CHECKOUT BAR (Mobile Only - Giải quyết triệt để vấn đề cuộn mỏi tay trên điện thoại) */}
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

        {/* MODAL POPUP CHỌN BOOSTER GIỮA MÀN HÌNH CHUẨN UI/UX */}
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
