'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Crown, Zap, Star, Search, Shuffle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import UserBadge from '@/components/UserBadge';
import { getBoosterConciseScheduleText } from '@/lib/booster-helpers';

interface BoosterSelectionSectionProps {
  assignedBooster: any;
  isManualSelectBooster: boolean;
  setIsManualSelectBooster: (val: boolean) => void;
  boosterList: any[];
  setAssignedBooster: (b: any) => void;
  setAppliedCoupon: (c: any) => void;
  setCouponCode: (code: string) => void;
  setIsBoosterModalOpen: (open: boolean) => void;
  handleRandomRerollBooster: () => void;
  boosterMultiplier: number;
}

function BoosterRadarScanner() {
  return (
    <div className="p-6 rounded-2xl border border-cyan-500/40 bg-zinc-950/90 shadow-2xl flex flex-col items-center justify-center min-h-[148px] relative overflow-hidden animate-in fade-in duration-200">
      {/* Background Radar Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

      {/* Tactical Radar Display */}
      <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
        {/* Radar Pulse Rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-30" />
        <div className="absolute inset-1 rounded-full border border-cyan-500/30" />
        <div className="absolute inset-4 rounded-full border border-cyan-500/40" />

        {/* Crosshairs */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/30 -translate-y-1/2" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/30 -translate-x-1/2" />

        {/* Rotating Radar Beam Sweep */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.45) 360deg)',
            animationDuration: '1s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />

        {/* Radar blip targets */}
        <div className="absolute top-2.5 right-3.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
        <div className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />

        {/* Radar Center Beacon */}
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] z-10" />
      </div>

      {/* Radar Text */}
      <div className="text-center relative z-10 space-y-1">
        <div className="text-xs sm:text-sm font-extrabold text-white flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Đang quét radar tuyển thủ trực tuyến...</span>
        </div>
        <p className="text-[11px] text-zinc-400 font-mono">
          Phân tích SLA • Tỷ lệ thắng • Lịch làm việc phù hợp
        </p>
      </div>
    </div>
  );
}

export function BoosterSelectionSection({
  assignedBooster,
  isManualSelectBooster,
  setIsManualSelectBooster,
  boosterList,
  setAssignedBooster,
  setAppliedCoupon,
  setCouponCode,
  setIsBoosterModalOpen,
  handleRandomRerollBooster,
  boosterMultiplier,
}: BoosterSelectionSectionProps) {
  const [isRadarScanning, setIsRadarScanning] = useState(false);

  const handleRerollWithRadar = () => {
    if (isRadarScanning) return;
    setIsRadarScanning(true);
    setTimeout(() => {
      handleRandomRerollBooster();
      setIsRadarScanning(false);
    }, 700);
  };

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
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              isManualSelectBooster
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
            }`}
          >
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

      {/* Card Tuyển Thủ Đang Chọn / Được Ghép (Model Ảnh 2) */}
      {assignedBooster ? (
        isRadarScanning ? (
          <BoosterRadarScanner />
        ) : (
          <div
            className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 relative overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
              isManualSelectBooster
                ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                : 'bg-zinc-950/80 border-zinc-800 shadow-xl'
            }`}
          >
            {/* Top row: Avatar + Info + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              {/* Left: Avatar + Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Avatar with glowing & blinking green border */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/25 animate-pulse blur-sm" />
                  <div className="absolute -inset-0.5 rounded-full border-2 border-emerald-400 animate-pulse" />
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] flex items-center justify-center text-white font-bold text-base bg-zinc-900">
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
                  {/* Status Indicator Dot */}
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950 shadow-[0_0_8px_#10b981]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base truncate">
                      {displayName}
                    </span>
                    <UserBadge role="BOOSTER" size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 flex-wrap">
                    <span className="font-mono text-zinc-300">@{username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star size={12} fill="currentColor" />
                      {rating > 0 ? rating.toFixed(1) : '5.0'}
                    </span>
                    <span>•</span>
                    <span className="text-zinc-300">{completedCount} đơn hoàn thành</span>
                    {username && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/b/${username}`}
                          target="_blank"
                          className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-0.5 hover:underline"
                        >
                          <span>Xem hồ sơ</span>
                          <span className="text-xs">➔</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleRerollWithRadar}
                  disabled={isRadarScanning}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/70 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Tìm và ghép tuyển thủ khác"
                >
                  <Shuffle size={13} className={isRadarScanning ? 'animate-spin text-cyan-400' : ''} />
                  <span>Đổi người khác</span>
                </button>
              </div>
            </div>

            {/* Bottom Bar: Schedule & Auto-match SLA status */}
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span>
                  {isManualSelectBooster
                    ? 'Tuyển thủ được chỉ định và giữ theo yêu cầu của bạn'
                    : 'Hệ thống đã tự động ghép tuyển thủ phù hợp nhất'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px] sm:text-xs">
                <Clock size={13} className="text-cyan-400 shrink-0" />
                <span>{getBoosterConciseScheduleText(assignedBooster)}</span>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3 text-xs text-zinc-400">
          <Users size={18} className="text-zinc-500 shrink-0" />
          <span>
            Chưa có tuyển thủ online cho dịch vụ này. Hệ thống sẽ áp dụng bảng giá tiêu chuẩn của sàn và đưa đơn lên bảng tin tuyển dụng.
          </span>
        </div>
      )}
    </div>
  );
}

export default BoosterSelectionSection;
