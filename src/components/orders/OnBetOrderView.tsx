'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle, Gamepad2, ShieldCheck, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnBetOrderViewProps {
  order: any;
}

export default function OnBetOrderView({ order }: OnBetOrderViewProps) {
  const { details, match_history } = order;
  const { rank_label, game_count, reward_value } = details || {};
  const targetGames = parseInt(game_count || '0');

  const seriesState = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    return { wins, losses, matches };
  }, [match_history]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="flex flex-col justify-between items-start mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-yellow-500" />
                    Tiến độ Sự kiện ONBET
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
                
                {[...Array(Math.max(0, targetGames - seriesState.matches.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="w-14 h-14 rounded-xl flex items-center justify-center border-2 border-zinc-800 bg-zinc-900/50 text-zinc-700 border-dashed">
                        <span className="font-bold text-lg">{seriesState.matches.length + i + 1}</span>
                    </div>
                ))}
            </div>

            {/* Info Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Rank tham gia</div>
                    <div className="text-lg font-bold text-zinc-400 mt-1">{rank_label || 'N/A'}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Số trận</div>
                    <div className="text-lg font-bold text-white mt-1">{game_count || 'N/A'}</div>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20 text-center">
                    <div className="text-[10px] text-yellow-300/80 uppercase font-bold tracking-wider">Phần thưởng</div>
                    <div className="text-lg font-bold text-yellow-400 mt-1">{(reward_value || 0).toLocaleString()} đ</div>
                </div>
            </div>
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-900/10 border border-yellow-500/20 text-yellow-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-yellow-400" />
            <p className="text-sm">
                Dịch vụ cày sự kiện ONBET. Hoàn thành đủ số trận để nhận phần thưởng từ nhà tài trợ.
            </p>
        </div>
    </div>
  );
}