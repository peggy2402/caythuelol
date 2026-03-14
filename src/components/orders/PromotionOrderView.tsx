// src/components/orders/PromotionOrderView.tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, TrendingUp, Target, ShieldCheck, PartyPopper, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import SparklineChart from '@/components/SparklineChart';

interface PromotionOrderViewProps {
  order: any;
}

export default function PromotionOrderView({ order }: PromotionOrderViewProps) {
  const { details, match_history } = order;
  const { promo_from, promo_to, current_rank } = details || {};

  // --- HELPER: Rank Comparison Logic ---
  const getRankValue = (rankStr: string) => {
    if (!rankStr) return -1;
    const normalized = rankStr.toUpperCase();
    
    const TIERS_EN = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const TIERS_VN = ['SẮT', 'ĐỒNG', 'BẠC', 'VÀNG', 'BẠCH KIM', 'LỤC BẢO', 'KIM CƯƠNG', 'CAO THỦ', 'ĐẠI CAO THỦ', 'THÁCH ĐẤU'];
    
    let tierIndex = TIERS_EN.findIndex(t => normalized.includes(t));
    if (tierIndex === -1) tierIndex = TIERS_VN.findIndex(t => normalized.includes(t));
    if (tierIndex === -1) return -1;

    // Divisions: I > II > III > IV (Value: 4 > 3 > 2 > 1)
    // Master+ treated as having division 0 (value 0) but base tier value is high
    let div = 0;
    if (normalized.includes(' I') || normalized.endsWith(' 1')) div = 4;
    else if (normalized.includes(' II') || normalized.endsWith(' 2')) div = 3;
    else if (normalized.includes(' III') || normalized.endsWith(' 3')) div = 2;
    else if (normalized.includes(' IV') || normalized.endsWith(' 4')) div = 1;

    return tierIndex * 10 + div;
  };

  const promoStatus = useMemo(() => {
    const currentVal = getRankValue(current_rank);
    const targetVal = getRankValue(promo_to);
    const startVal = getRankValue(promo_from);

    if (currentVal >= targetVal && targetVal > 0) return 'PROMOTED';
    if (currentVal < startVal && startVal > 0 && currentVal > 0) return 'DEMOTED';
    return 'IN_PROGRESS';
  }, [current_rank, promo_to, promo_from]);

  // Confetti Effect on Promotion
  useEffect(() => {
    if (promoStatus === 'PROMOTED') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [promoStatus]);

  // Tính toán số trận thắng/thua từ lịch sử đấu
  const seriesState = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    return { wins, losses, matches };
  }, [match_history]);

  // --- Dữ liệu Momentum (Net Wins Trend) ---
  // Thắng +1, Thua -1. Để xem đà tâm lý.
  const momentumData = useMemo(() => {
      if (!match_history || match_history.length === 0) return [];
      let score = 0;
      return match_history.map((m: any) => {
          score += (m.result === 'WIN' ? 1 : -1);
          return score;
      });
  }, [match_history]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* STATUS BANNER */}
            {promoStatus === 'PROMOTED' && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4"
                >
                    <div className="p-3 bg-green-500/20 rounded-full text-green-500">
                        <PartyPopper size={24} />
                    </div>
                    <div>
                        <h4 className="text-green-400 font-bold text-lg">Thăng Hạng Thành Công!</h4>
                        <p className="text-green-500/80 text-sm">Chúc mừng bạn đã đạt được mục tiêu <strong>{promo_to}</strong>.</p>
                    </div>
                </motion.div>
            )}

            {promoStatus === 'DEMOTED' && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4"
                >
                    <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="text-red-400 font-bold text-lg">Cảnh báo Rớt Hạng</h4>
                        <p className="text-red-500/80 text-sm">Tài khoản đã bị tụt xuống dưới mức Rank ban đầu (<strong>{current_rank}</strong>).</p>
                    </div>
                </motion.div>
            )}
            
            <div className="flex flex-col justify-between items-start mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-yellow-500" /> 
                    Tiến độ Thăng Hạng
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

            {/* Visual Matches List (Infinite scroll basically) */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
                {/* Render Matches (Win/Loss) */}
                {seriesState.matches.length > 0 ? (
                    seriesState.matches.map((match: any, idx: number) => (
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
                    ))
                ) : (
                    <div className="text-zinc-500 text-sm italic">Chưa có trận đấu nào</div>
                )}
            </div>

            {/* From -> To Info */}
            <div className="flex items-center justify-between p-3 sm:p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                <div className="flex flex-col items-center w-1/3 min-w-0 px-1">
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate w-full text-center">Hiện tại</span>
                    <div className="text-sm sm:text-lg font-bold text-zinc-300 mt-1 text-center w-full leading-tight">{promo_from || 'N/A'}</div>
                </div>
                
                <div className="flex-1 flex justify-center px-2">
                    <div className="h-0.5 w-full bg-zinc-800 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 p-1.5 sm:p-2 rounded-full border border-zinc-700">
                            {promoStatus === 'PROMOTED' 
                                ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                                : <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                            }
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center w-1/3 min-w-0 px-1">
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate w-full text-center">Mục tiêu</span>
                    <div className="text-sm sm:text-lg font-black text-yellow-400 mt-1 text-center w-full leading-tight">{promo_to || 'N/A'}</div>
                </div>
            </div>

            {/* Momentum Chart */}
            {momentumData.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phong độ (Momentum)</span>
                    </div>
                    <SparklineChart data={momentumData} color="#eab308" height={40} />
                </div>
            )}
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-blue-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
            <p className="text-sm">
                Dịch vụ Thăng Hạng đảm bảo Booster sẽ cày đủ điểm (100 LP) để bạn lên bậc rank mới. Nếu rớt hạng, Booster sẽ cày lại miễn phí.
            </p>
        </div>
    </div>
  );
}
