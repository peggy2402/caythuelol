// src/components/orders/RankBoostOrderView.tsx
'use client';

import { useMemo } from 'react';
import { TrendingUp, Target, ShieldCheck, Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import SparklineChart from '@/components/SparklineChart';
import Image from 'next/image';

interface RankBoostOrderViewProps {
  order: any;
}

const getRankImage = (rankName: string) => {
    if (!rankName) return '/images/ranks/iron.png';
    // Xử lý tên rank (VD: "GOLD IV", "VÀNG IV") để lấy đúng ảnh
    const tier = rankName.split(' ')[0].toUpperCase();
    
    // Map tiếng Việt sang tên file ảnh tiếng Anh
    const mapVN: Record<string, string> = {
        'SẮT': 'iron', 'ĐỒNG': 'bronze', 'BẠC': 'silver', 'VÀNG': 'gold',
        'BẠCH': 'platinum', 'LỤC': 'emerald', 'KIM': 'diamond',
        'CAO': 'master', 'ĐẠI': 'grandmaster', 'THÁCH': 'challenger',
        'IRON': 'iron', 'BRONZE': 'bronze', 'SILVER': 'silver', 'GOLD': 'gold',
        'PLATINUM': 'platinum', 'EMERALD': 'emerald', 'DIAMOND': 'diamond',
        'MASTER': 'master', 'GRANDMASTER': 'grandmaster', 'CHALLENGER': 'challenger'
    };

    const key = mapVN[tier] || 'iron';
    return `/images/ranks/${key}.png`;
};

export default function RankBoostOrderView({ order }: RankBoostOrderViewProps) {
  const { details, match_history } = order;
  const { current_rank, desired_rank, current_lp } = details || {};

  // Tính toán thống kê từ lịch sử đấu
  const stats = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    const total = wins + losses;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, losses, total, winRate, matches };
  }, [match_history]);

  // Dữ liệu biểu đồ (Net Wins Trend: Thắng +1, Thua -1)
  const chartData = useMemo(() => {
      if (!stats.matches || stats.matches.length === 0) return [];
      let score = 0;
      return stats.matches.map((m: any) => {
          score += (m.result === 'WIN' ? 1 : -1);
          return score;
      });
  }, [stats.matches]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Progress Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="flex flex-col justify-between items-start mb-8 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-blue-500" /> 
                    Tiến độ Leo Rank
                </h3>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">
                        W: {stats.wins}
                    </span>
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
                        L: {stats.losses}
                    </span>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                        WR: {stats.winRate}%
                    </span>
                </div>
            </div>

            {/* Visual Rank Progress */}
            <div className="flex items-center justify-between relative z-10 mb-8 px-2 sm:px-8">
                {/* Current Rank */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                        <Image 
                            src={getRankImage(current_rank)} 
                            alt={current_rank || 'Unranked'} 
                            fill 
                            className="object-contain" 
                        />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hiện tại</div>
                        <div className="font-bold text-white text-sm sm:text-base">{current_rank || 'N/A'}</div>
                        <div className="text-xs text-blue-400 font-bold">{current_lp || 0} LP</div>
                    </div>
                </div>

                {/* Arrow / Progress Bar */}
                <div className="flex-1 px-4 sm:px-8 flex flex-col items-center gap-2">
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600"
                            initial={{ width: 0 }}
                            animate={{ width: '50%' }} // Rank Boost khó tính % chính xác tuyệt đối, để 50% hoặc logic phức tạp hơn nếu muốn
                            transition={{ duration: 1 }}
                        />
                    </div>
                    <ArrowRight className="w-5 h-5 text-zinc-600" />
                </div>

                {/* Target Rank */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        <Image 
                            src={getRankImage(desired_rank)} 
                            alt={desired_rank || 'Target'} 
                            fill 
                            className="object-contain" 
                        />
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mục tiêu</div>
                        <div className="font-bold text-yellow-400 text-sm sm:text-base">{desired_rank || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* Momentum Chart */}
            {chartData.length > 1 && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phong độ (Momentum)</span>
                    </div>
                    <SparklineChart data={chartData} color="#3b82f6" height={50} />
                </div>
            )}
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-blue-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
            <p className="text-sm">
                Booster sẽ cày liên tục cho đến khi đạt được mức Rank mong muốn. Mọi trận thua làm tụt điểm sẽ được cày bù miễn phí.
            </p>
        </div>
    </div>
  );
}
