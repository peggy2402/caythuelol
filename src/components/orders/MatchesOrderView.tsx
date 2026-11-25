'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Gamepad2,
  AlertTriangle,
  ShieldCheck,
  Swords,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MatchesOrderViewProps {
  order: any;
  isBooster?: boolean;
}

export default function MatchesOrderView({ order, isBooster = false }: MatchesOrderViewProps) {
  const { details, match_history } = order || {};
  const targetMatches = Math.max(
    1,
    Number(details?.match_count || details?.matches || details?.num_games || details?.steps_count || 1)
  );
  const queueType = details?.queue_type || 'SOLO_DUO';
  const queueLabel = queueType === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi (Solo/Duo)';

  const stats = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    const played = matches.length;
    const remaining = Math.max(0, targetMatches - played);
    const percent = Math.min(100, Math.round((played / targetMatches) * 100));
    return { matches, wins, losses, played, remaining, percent };
  }, [match_history, targetMatches]);

  const isTargetReached = stats.played >= targetMatches;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Progress Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Tiến độ Cày Theo Số Trận
              </h3>
              <p className="text-xs text-zinc-400">
                Tính theo tổng số trận đã thi đấu · Không phân biệt Thắng / Thua
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border tabular-nums ${
                isTargetReached
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              }`}
            >
              {stats.played} / {targetMatches} trận
            </span>
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold tabular-nums">
              Thắng: {stats.wins}
            </span>
            <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-bold tabular-nums">
              Thua: {stats.losses}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-400 font-medium">
              {isTargetReached
                ? 'Đã hoàn thành đủ số trận yêu cầu'
                : `Còn lại ${stats.remaining} trận cần hoàn thành`}
            </span>
            <span className="font-mono font-bold text-blue-400 tabular-nums">{stats.percent}%</span>
          </div>
          <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.percent}%` }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${
                isTargetReached
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-400'
              }`}
            />
          </div>
        </div>

        {/* Visual Match Slots */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-2 sm:gap-2.5 mb-6 relative z-10">
          {Array.from({ length: targetMatches }).map((_, idx) => {
            const match = stats.matches[idx];
            if (match) {
              const isWin = match.result === 'WIN';
              return (
                <motion.div
                  key={match._id || idx}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  title={`Trận ${idx + 1}: ${isWin ? 'Thắng' : 'Thua'} (Đã tính vào tiến độ)`}
                  className={`py-2.5 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 border shadow-sm ${
                    isWin
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/12 border-rose-500/35 text-rose-400'
                  }`}
                >
                  {isWin ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span className="text-[10px] font-bold leading-none">Trận {idx + 1}</span>
                </motion.div>
              );
            }

            return (
              <div
                key={`empty-${idx}`}
                className="py-2.5 px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 border border-dashed border-zinc-800 bg-zinc-950/60 text-zinc-600"
                title={`Trận ${idx + 1}: Chưa thi đấu`}
              >
                <span className="text-sm font-extrabold leading-none">{idx + 1}</span>
                <span className="text-[10px] font-medium leading-none">Chờ đấu</span>
              </div>
            );
          })}
        </div>

        {/* Summary Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
          <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                Số trận đặt cày
              </div>
              <div className="text-sm font-extrabold text-white truncate">
                {targetMatches} trận đấu
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Swords className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                Loại hàng chờ
              </div>
              <div className="text-sm font-bold text-zinc-200 truncate">{queueLabel}</div>
            </div>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-xl border border-white/5 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                isTargetReached
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}
            >
              {isTargetReached ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                Tiến độ hiện tại
              </div>
              <div
                className={`text-sm font-bold truncate ${
                  isTargetReached ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {isTargetReached ? 'Đủ số trận yêu cầu' : `Còn ${stats.remaining} trận`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Policy Banner (Tailored for Customer & Booster) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <div className="font-bold text-amber-300 text-sm">
            Quy định gói Cày Theo Số Trận (Không phân biệt Thắng / Thua)
          </div>
          {isBooster ? (
            <p className="text-zinc-300">
              Đơn hàng này chỉ yêu cầu hoàn thành đúng đủ{' '}
              <strong className="text-white">{targetMatches} trận đấu</strong>, kết quả được tính theo
              số trận đã thi đấu (<strong>không phân biệt Thắng / Thua và không phải cày bù trận thua</strong>).
              Tuy nhiên, hãy luôn thi đấu nghiêm túc hết mình để đạt chất lượng tốt nhất và nhận đánh giá 5★ từ khách hàng.
            </p>
          ) : (
            <p className="text-zinc-300">
              Tuyển thủ sẽ hoàn thành đúng đủ{' '}
              <strong className="text-white">{targetMatches} trận đấu</strong> theo gói bạn đã chọn và{' '}
              <strong>không tính theo kết quả Thắng hay Thua</strong> (không áp dụng cày bù trận thua).
              Mọi trận đấu đã hoàn thành đều được ghi nhận hợp lệ vào tiến độ đơn hàng.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
