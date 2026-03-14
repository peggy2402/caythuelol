'use client';

import { useMemo } from 'react';
import { Star, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

interface MasteryOrderViewProps {
  order: any;
}

// Helper to get mastery level info
const getMasteryInfo = (level: number) => {
    const info: Record<number, { color: string, name: string }> = {
        1: { color: 'text-zinc-400', name: 'M1' },
        2: { color: 'text-zinc-300', name: 'M2' },
        3: { color: 'text-zinc-200', name: 'M3' },
        4: { color: 'text-yellow-400', name: 'M4' },
        5: { color: 'text-red-400', name: 'M5' },
        6: { color: 'text-purple-400', name: 'M6' },
        7: { color: 'text-blue-400', name: 'M7' },
    };
    return info[level] || { color: 'text-zinc-500', name: `M${level}` };
};

export default function MasteryOrderView({ order }: MasteryOrderViewProps) {
  const { details } = order;
  const { champion, current_mastery, desired_mastery, current_points, desired_points } = details || {};

  const startLevel = parseInt(current_mastery || '0');
  const endLevel = parseInt(desired_mastery || '0');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            {/* Champion Splash Art Background */}
            {champion && (
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <Image 
                        src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_0.jpg`}
                        alt={champion}
                        fill
                        className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent"></div>
                </div>
            )}

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" /> 
                        Tiến độ Cày Thông Thạo
                    </h3>
                    <div className="text-xl sm:text-2xl font-black text-white mt-1 sm:mt-0">
                        {champion || 'N/A'}
                    </div>
                </div>

                {/* Mastery Level Progress Bar */}
                 <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                    <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 sm:border-4 bg-zinc-800 border-zinc-700`}>
                            <Star className={`w-6 h-6 sm:w-8 sm:h-8 ${getMasteryInfo(startLevel).color}`} />
                        </div>
                        <span className="text-xs sm:text-sm font-bold mt-1 sm:mt-2">{getMasteryInfo(startLevel).name}</span>
                        <span className="text-[10px] sm:text-xs text-zinc-500">Bắt đầu</span>
                    </div>

                    <div className="flex-1 h-1 bg-zinc-800 rounded-full"></div>

                    <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 sm:border-4 bg-yellow-500/10 border-yellow-500`}>
                            <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold mt-1 sm:mt-2">{getMasteryInfo(endLevel).name}</span>
                        <span className="text-[10px] sm:text-xs text-zinc-500">Mục tiêu</span>
                    </div>
                </div>

                {/* Points Info */}
                {(current_points || desired_points) && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="bg-zinc-950/50 p-2 sm:p-3 rounded-xl border border-zinc-800 text-center min-w-0">
                            <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Điểm hiện tại</div>
                            <div className="text-sm sm:text-lg font-bold text-zinc-400 mt-1 truncate">{parseInt(current_points || '0').toLocaleString()}</div>
                        </div>
                        <div className="bg-zinc-950/50 p-2 sm:p-3 rounded-xl border border-zinc-800 text-center min-w-0">
                            <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">Điểm mục tiêu</div>
                            <div className="text-sm sm:text-lg font-bold text-yellow-400 mt-1 truncate">{parseInt(desired_points || '0').toLocaleString()}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-900/10 border border-yellow-500/20 text-yellow-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-yellow-400" />
            <p className="text-sm">
                Dịch vụ Cày Thông Thạo sẽ được thực hiện nhanh chóng, giúp bạn sớm khoe biểu cảm với bạn bè.
            </p>
        </div>
    </div>
  );
}