'use client';

import { useMemo } from 'react';
import { ArrowUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface LevelingOrderViewProps {
  order: any;
}

export default function LevelingOrderView({ order }: LevelingOrderViewProps) {
  const { details } = order;
  const { current_level, desired_level } = details || {};

  const startLevel = parseInt(current_level || '1');
  const endLevel = parseInt(desired_level || '30');
  const totalLevelsToGain = Math.max(1, endLevel - startLevel);
  
  // Giả sử Booster sẽ cập nhật `details.current_level_progress`
  const currentProgressLevel = parseInt(details.current_level_progress || current_level || '1');
  const levelsGained = Math.max(0, currentProgressLevel - startLevel);
  const progressPercent = Math.min(100, Math.round((levelsGained / totalLevelsToGain) * 100));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ArrowUp className="w-5 h-5 text-green-500" /> 
                        Tiến độ Cày Cấp Độ
                    </h3>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between text-sm font-medium mb-8">
                    <span className="text-zinc-400">Đã cày: <span className="text-white font-bold">{levelsGained} / {totalLevelsToGain} Cấp</span></span>
                    <span className="text-green-400 font-bold">{progressPercent}%</span>
                </div>

                {/* From -> To Info */}
                <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                    <div className="flex flex-col items-center w-1/3">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Bắt đầu</span>
                        <div className="text-2xl font-bold text-zinc-300 mt-1">Lv. {startLevel}</div>
                    </div>
                    
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full"></div>

                    <div className="flex flex-col items-center w-1/3">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Mục tiêu</span>
                        <div className="text-2xl font-black text-green-400 mt-1">Lv. {endLevel}</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-900/10 border border-green-500/20 text-green-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-green-400" />
            <p className="text-sm">
                Dịch vụ Cày Cấp Độ đảm bảo tài khoản của bạn sẽ đạt được cấp độ mong muốn trong thời gian nhanh nhất để sẵn sàng cho Xếp Hạng.
            </p>
        </div>
    </div>
  );
}