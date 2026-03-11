'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle, Gamepad2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import SparklineChart from '@/components/SparklineChart';

interface PlacementsOrderViewProps {
  order: any;
}

export default function PlacementsOrderView({ order }: PlacementsOrderViewProps) {
  const { details, match_history } = order;
  const { num_games, prev_rank, current_rank } = details || {};
  const targetGames = parseInt(num_games || '5');

  const seriesState = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    return { wins, losses, matches };
  }, [match_history]);

  // --- Dữ liệu cho biểu đồ Win Rate ---
  const winRateTrend = useMemo(() => {
      if (!match_history || match_history.length === 0) return [];
      let wins = 0;
      return match_history.map((m: any, idx: number) => {
          if (m.result === 'WIN') wins++;
          const total = idx + 1;
          return Math.round((wins / total) * 100);
      });
  }, [match_history]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-purple-500" />
                    Tiến độ Phân Hạng
                </h3>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">
                        W: {seriesState.wins}
                    </span>
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
                        L: {seriesState.losses}
                    </span>
                </div>
            </div>

            {/* Visual Slots Display */}
            <div className="flex flex-wrap justify-center items-center gap-4 mb-8">
                {/* Played Matches */}
                {seriesState.matches.map((match: any, idx: number) => (
                    <motion.div 
                        key={match._id || idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                            match.result === 'WIN' 
                                ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20' 
                                : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20'
                        }`}
                        title={`Trận ${idx + 1}: ${match.result}`}
                    >
                        {match.result === 'WIN' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                    </motion.div>
                ))}
                
                {/* Empty Slots */}
                {[...Array(Math.max(0, targetGames - seriesState.matches.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-zinc-800 bg-zinc-900/50 text-zinc-700 border-dashed">
                        <span className="font-bold text-lg">{seriesState.matches.length + i + 1}</span>
                    </div>
                ))}
            </div>

            {/* Info Bar */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Rank Mùa Trước</div>
                    <div className="text-lg font-bold text-zinc-400 mt-1">
                        {prev_rank || 'N/A'}
                    </div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-purple-500/5"></div>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider relative z-10">Rank Tạm Tính</div>
                    <div className="text-lg font-bold text-purple-400 mt-1 relative z-10">
                        {current_rank || 'Đang cập nhật...'}
                    </div>
                </div>
            </div>

            {/* Win Rate Sparkline */}
            {winRateTrend.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tỉ lệ thắng (Win Rate)</span>
                        <span className="text-xs font-bold text-purple-400">{winRateTrend[winRateTrend.length - 1]}%</span>
                    </div>
                    <SparklineChart data={winRateTrend} color="#a855f7" height={40} />
                </div>
            )}
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-purple-400" />
            <p className="text-sm">
                Dịch vụ Phân Hạng đảm bảo tỷ lệ thắng cao nhất để bạn có khởi đầu mùa giải thuận lợi.
            </p>
        </div>
    </div>
  );
}