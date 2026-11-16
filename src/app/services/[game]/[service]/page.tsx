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
} from 'lucide-react';
import { toast } from 'sonner';
import { getGameById, GAMES_CATALOG } from '@/lib/games';
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
  const serviceDef =
    game.defaultServices.find((s) => s.slug === serviceSlug) || game.defaultServices[0];

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

  // 5. States cho Mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);

  // Helper lấy token
  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch Service Templates từ Database
  useEffect(() => {
    fetch(`/api/templates/services?gameCode=${encodeURIComponent((game.shortName || game.id).toUpperCase())}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setDbTemplates(data.templates);
        }
      })
      .catch(() => {});
  }, [game.id, game.shortName]);

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
  const boosterSettings = assignedBooster?.boosterData?.service_settings || assignedBooster?.service_settings;
  const boosterStandardConfig = boosterSettings?.standardConfig;
  const boosterMultiplier = boosterStandardConfig?.rankPriceMultiplier || 1.0;
  const boosterAddonsConfig = boosterStandardConfig?.addonsConfig;
  const boosterStepOverrides = boosterStandardConfig?.stepOverrides;

  // Cấu hình chi tiết từng addon
  const specificChampsCfg = isManualSelectBooster && boosterAddonsConfig?.specificChamps
    ? boosterAddonsConfig.specificChamps
    : { enabled: true, percent: 30 };

  const livestreamCfg = isManualSelectBooster && boosterAddonsConfig?.livestream
    ? boosterAddonsConfig.livestream
    : { enabled: true, fee: 349000 };

  const flashCfg = isManualSelectBooster && boosterAddonsConfig?.flash
    ? boosterAddonsConfig.flash
    : { enabled: true, percent: 35 };

  const duoCfg = isManualSelectBooster && boosterAddonsConfig?.duo
    ? boosterAddonsConfig.duo
    : { enabled: true, percent: 50 };

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

      <main className="relative pt-24 pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between mb-6">
          <BackButton fallbackUrl={`/services/${game.id}`} />
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/services" className="hover:text-white transition-colors">
              Sàn Dịch Vụ
            </Link>
            <span>/</span>
            <Link href={`/services/${game.id}`} className="hover:text-white transition-colors">
              {game.name}
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">{serviceDef.name}</span>
          </div>
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

        {/* 2. CHỌN LOẠI DỊCH VỤ BẠN CẦN (Khớp 100% Ảnh 1) */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
              2
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Chọn loại dịch vụ bạn cần
            </h2>
          </div>
          <p className="text-xs text-zinc-400 ml-8 mb-5">
            Nhấn vào dịch vụ để xem danh sách tuyển thủ và bảng giá chi tiết
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(dbTemplates.length > 0 ? dbTemplates : game.defaultServices).map((svc) => {
              const isSelected = svc.slug === serviceSlug;
              const IconComp = ICON_MAP[svc.iconName] || Trophy;
              const isDeposit = svc.depositPercent < 100;
              const svcUrl = `/services/${game.id}/${svc.slug}${
                cleanBoosterUsername ? `?booster=@${cleanBoosterUsername}` : ''
              }`;

              return (
                <Link
                  key={svc.slug}
                  href={svcUrl}
                  className={`p-4 rounded-2xl transition-all flex flex-col justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0e1220] border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.2)] ring-1 ring-blue-500'
                      : 'bg-[#0f1118]/90 hover:bg-[#141724] border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50'
                        }`}
                      >
                        <IconComp size={18} />
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                          isDeposit
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isDeposit ? `Cọc ${svc.depositPercent}%` : 'Trọn gói'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight mb-1">
                        {svc.name}
                      </h3>
                      <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed min-h-[34px]">
                        {svc.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">
                      {svc.pricingType === 'PER_UNIT'
                        ? `${svc.defaultPrice.toLocaleString('vi-VN')} đ / ${svc.unitName || 'Điểm LP'}`
                        : `Từ ${svc.defaultPrice.toLocaleString('vi-VN')} đ`}
                    </span>

                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Đang chọn' : 'Chọn dịch vụ'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. CẤU HÌNH CHI TIẾT & BẢNG TÍNH GIÁ */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-xs font-bold shrink-0">
            3
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Cấu hình chi tiết gói dịch vụ
          </h2>
        </div>

        {/* Main Grid: Form Left (7 Cols), Summary Right (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM CẤU HÌNH DỊCH VỤ (Chuẩn y như ảnh minh họa) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-md space-y-5">
              {/* 1. Rank Hiện Tại & Rank Mong Muốn */}
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
                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={addons.schedule}
                      onChange={(e) => setAddons({ ...addons, schedule: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Đặt lịch cày</span>
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={addons.specificRole}
                      onChange={(e) => setAddons({ ...addons, specificRole: e.target.checked })}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Tùy chọn vị trí / đường</span>
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
                          +{specificChampsCfg.percent.toFixed(2)}%
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
                          +{flashCfg.percent.toFixed(2)}%
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
                          +{duoCfg.percent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
                      )}
                      <Info size={13} className="text-blue-400" />
                    </div>
                  </label>

                  {/* Mục Chọn Booster */}
                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={isManualSelectBooster}
                      onChange={(e) => {
                        setIsManualSelectBooster(e.target.checked);
                        if (!e.target.checked) setAssignedBooster(null);
                      }}
                      className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
                      <span>Chọn Booster</span>
                      {assignedBooster && (
                        <span className="text-blue-400 font-bold">
                          (Đã chọn: @{assignedBooster.user?.username})
                        </span>
                      )}
                    </div>
                  </label>
                </div>

                {/* Dropdown danh sách booster khi tích chọn */}
                {isManualSelectBooster && (
                  <div className="mt-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 animate-in fade-in duration-200">
                    <span className="text-xs text-zinc-400 block font-semibold">
                      Chọn tuyển thủ từ danh sách:
                    </span>
                    <select
                      value={assignedBooster?.user?._id || ''}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const found = boosterList.find((b) => b._id === bId);
                        if (found) {
                          setAssignedBooster({
                            user: found,
                            boosterData: found.boosterProfile || found.booster_info || found,
                          });
                        } else {
                          setAssignedBooster(null);
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    >
                      <option value="">-- Hệ thống tự động ghép tuyển thủ uy tín nhất --</option>
                      {boosterList.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.displayName || b.username} (Đánh giá: {b.rating ? b.rating.toFixed(1) : '5.0'} ⭐)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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

              {/* Chi tiết giá từng bậc */}
              {calculation.stepsBreakdown.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase block mb-1">
                    Chi tiết từng bậc thăng hạng:
                  </span>
                  {calculation.stepsBreakdown.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-1 border-b border-zinc-800/50 text-zinc-300"
                    >
                      <span>
                        {step.from} → {step.to}
                      </span>
                      <span className="font-mono text-zinc-400">
                        +{step.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}

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
