import React from 'react';
import { Gamepad2, Shield, Swords, Users, ChevronDown } from 'lucide-react';
import ServerFlag from '@/components/ServerFlag';
import { LolServer } from '../../constants/bookingConfig';

interface MatchesBoostSectionProps {
  isMatches: boolean;
  matchCount: number;
  setMatchCount: (count: number) => void;
  unitPrice: number;
  queueType: string;
  setQueueType: (q: string) => void;
  isValorant: boolean;
  isAov: boolean;
  currentServerObj: LolServer;
  setIsServerModalOpen: (open: boolean) => void;
}

export function MatchesBoostSection({
  isMatches,
  matchCount,
  setMatchCount,
  unitPrice,
  queueType,
  setQueueType,
  isValorant,
  isAov,
  currentServerObj,
  setIsServerModalOpen,
}: MatchesBoostSectionProps) {
  if (!isMatches) return null;

  return (
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
          • Booster cam kết cày đủ đúng <strong className="text-white">{matchCount} trận Thắng</strong> bạn đã đặt — chỉ những trận{' '}
          <strong className="text-emerald-300">Thắng</strong> mới được tính vào tiến độ hoàn thành đơn hàng.
        </p>
        <p className="text-zinc-300">
          • Trường hợp phát sinh trận thua, Booster sẽ <strong className="text-white">chủ động đánh bù miễn phí</strong> cho đến khi đủ đúng {matchCount} trận Thắng, hoàn toàn{' '}
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

      {/* Chọn Server cho LOL */}
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

export default MatchesBoostSection;
