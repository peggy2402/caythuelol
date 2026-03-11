// src/components/orders/PromotionOrderView.tsx
'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Trophy, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface PromotionOrderViewProps {
  order: any;
}

export default function PromotionOrderView({ order }: PromotionOrderViewProps) {
  const { details, match_history } = order;
  const { promo_from, promo_to } = details || {};

  // Tính toán số trận thắng/thua từ lịch sử đấu
  const seriesState = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    return { wins, losses, matches };
  }, [match_history]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" /> 
                    Tiến độ Chuỗi Thăng Hạng
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

            {/* Visual Series Display (O O O O O) */}
            <div className="flex justify-center items-center gap-4 mb-8">
                {/* Render Matches (Win/Loss) */}
                {seriesState.matches.map((match: any, idx: number) => (
                    <motion.div 
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${
                            match.result === 'WIN' 
                                ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20' 
                                : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20'
                        }`}
                        title={`Trận ${idx + 1}: ${match.result}`}
                    >
                        {match.result === 'WIN' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </motion.div>
                ))}
                
                {/* Render Empty Slots (Placeholder - tối đa 5 trận cho chuỗi Bo5) */}
                {[...Array(Math.max(0, 5 - seriesState.matches.length))].map((_, i) => (
                    <div key={`empty-`} className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-zinc-800 bg-zinc-900/50 text-zinc-700">
                        <MinusCircle size={24} />
                    </div>
                ))}
            </div>

            {/* From -> To Info */}
            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                <div className="flex flex-col items-center w-1/3">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hiện tại</span>
                    <div className="text-lg font-bold text-zinc-300 mt-1 text-center">{promo_from || 'N/A'}</div>
                </div>
                
                <div className="flex-1 flex justify-center">
                    <div className="h-0.5 w-full bg-zinc-800 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 p-2 rounded-full border border-zinc-700">
                            <Target className="w-4 h-4 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center w-1/3">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mục tiêu</span>
                    <div className="text-lg font-black text-yellow-400 mt-1 text-center">{promo_to || 'N/A'}</div>
                </div>
            </div>
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-blue-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
            <p className="text-sm">
                Dịch vụ Chuỗi Thăng Hạng đảm bảo Booster sẽ thi đấu hết mình để bạn vượt qua chuỗi. Nếu thất bại, Booster sẽ cày lại miễn phí.
            </p>
        </div>
    </div>
  );
}
