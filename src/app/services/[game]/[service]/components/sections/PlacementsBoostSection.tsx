import React from 'react';
import { Medal, Crown, Gamepad2, Swords, Users, ChevronDown, Check } from 'lucide-react';
import ServerFlag from '@/components/ServerFlag';
import {
  LolServer,
  PLACEMENT_AVAILABLE_TIERS,
  TIER_CONFIG,
} from '../../constants/bookingConfig';

interface PlacementsBoostSectionProps {
  isPlacements: boolean;
  placementMatches: number;
  setPlacementMatches: (m: number) => void;
  previousSeasonRank: string;
  setPreviousSeasonRank: (rank: string) => void;
  getPlacementTierPrice: (tier: string) => number;
  placementEffectivePricePerMatch: number;
  queueType: string;
  setQueueType: (q: string) => void;
  isValorant: boolean;
  isAov: boolean;
  currentServerObj: LolServer;
  setIsServerModalOpen: (open: boolean) => void;
}

export function PlacementsBoostSection({
  isPlacements,
  placementMatches,
  setPlacementMatches,
  previousSeasonRank,
  setPreviousSeasonRank,
  getPlacementTierPrice,
  placementEffectivePricePerMatch,
  queueType,
  setQueueType,
  isValorant,
  isAov,
  currentServerObj,
  setIsServerModalOpen,
}: PlacementsBoostSectionProps) {
  if (!isPlacements) return null;

  return (
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
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                queueType === 'SOLO_DUO'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-white/5'
              }`}
            >
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
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                queueType === 'FLEX'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-zinc-900 text-zinc-500 border border-white/5'
              }`}
            >
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
          <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span>
              Chọn Máy Chủ (Server) <span className="text-red-500">*</span>
            </span>
            <span
              className="text-[11px] text-blue-400 cursor-pointer font-semibold"
              onClick={() => setIsServerModalOpen(true)}
            >
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
            <ChevronDown
              size={14}
              className="text-zinc-500 group-hover:text-white shrink-0 ml-1 transition-colors"
            />
          </button>
        </div>
      )}
    </div>
  );
}

export default PlacementsBoostSection;
