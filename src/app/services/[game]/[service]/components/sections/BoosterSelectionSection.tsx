import React from 'react';
import Link from 'next/link';
import { Users, Crown, Zap, Star, ArrowRight, Search, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import UserBadge from '@/components/UserBadge';

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

      {/* Card Tuyển Thủ Đang Chọn / Được Ghép */}
      {assignedBooster ? (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
            isManualSelectBooster
              ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
              : 'bg-blue-950/20 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
          }`}
        >
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
                  <div
                    className={`w-12 h-12 rounded-2xl overflow-hidden border flex items-center justify-center text-white font-bold text-base shadow-inner shrink-0 ${
                      isManualSelectBooster
                        ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/40'
                        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/40'
                    }`}
                  >
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
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          rating > 0 ? 'text-amber-400' : 'text-zinc-500'
                        }`}
                      >
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
  );
}

export default BoosterSelectionSection;
