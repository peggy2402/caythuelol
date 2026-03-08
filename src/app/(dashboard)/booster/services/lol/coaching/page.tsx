// src/app/(dashboard)/booster/services/lol/coaching/page.tsx
'use client';

import { useServiceContext } from '@/components/ServiceContext';
import { useState } from 'react';
import { GraduationCap, Video, MonitorPlay, Users, Info } from 'lucide-react';

const COACHING_TYPES = [
  { 
    id: 'VOD_REVIEW', 
    label: 'Phân tích Replay (VOD)', 
    desc: 'Xem lại video trận đấu của khách và chỉ ra lỗi sai.',
    icon: Video,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30'
  },
  { 
    id: 'LIVE_COACHING', 
    label: 'Coaching Trực tiếp', 
    desc: 'Xem khách chơi (Stream) và hướng dẫn thời gian thực.',
    icon: MonitorPlay,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30'
  },
  { 
    id: 'DUO_COACHING', 
    label: 'Duo Coaching', 
    desc: 'Vừa chơi cùng (Duo) vừa hướng dẫn thực chiến.',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/30'
  },
];

export default function CoachingConfigPage() {
  const { settings, setSettings, MAX_PRICE_PER_STEP } = useServiceContext();
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Sync state from context to local inputs
  useState(() => {
    const newInputs: Record<string, string> = {};
    COACHING_TYPES.forEach(type => {
      const price = settings.coachingPrices?.[type.id] || 0;
      newInputs[type.id] = price > 0 ? price.toLocaleString('en-US') : '';
    });
    setInputs(newInputs);
  });

  const handlePriceChange = (typeId: string, value: string) => {
    // Update local input for display
    setInputs(prev => ({ ...prev, [typeId]: value }));

    // Update context
    const numValue = parseInt(value.replace(/,/g, '')) || 0;
    setSettings(prev => ({
      ...prev,
      coachingPrices: {
        ...prev.coachingPrices,
        [typeId]: numValue
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <GraduationCap className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Cấu hình giá Coaching 1-1</h2>
            <p className="text-sm text-zinc-400">Đặt giá theo giờ cho từng hình thức huấn luyện.</p>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200/80">
            <p className="font-bold text-blue-400 mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Giá được tính theo <strong>1 Giờ (60 phút)</strong>.</li>
              <li>Nếu bạn không muốn cung cấp loại hình nào, hãy để giá là <strong>0</strong> hoặc bỏ trống.</li>
              <li>Khách hàng có thể đặt nhiều giờ cùng lúc.</li>
            </ul>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COACHING_TYPES.map((type) => {
            const Icon = type.icon;
            const currentPrice = settings.coachingPrices?.[type.id] || 0;
            const isTooHigh = currentPrice > MAX_PRICE_PER_STEP;

            return (
              <div key={type.id} className={`p-5 rounded-2xl border transition-all hover:-translate-y-1 ${type.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <h3 className="font-bold text-white">{type.label}</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-4 h-8">{type.desc}</p>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="0"
                    value={inputs[type.id] || ''}
                    onChange={(e) => handlePriceChange(type.id, e.target.value)}
                    className={`w-full bg-zinc-950/50 border rounded-xl pl-4 pr-16 py-3 text-right text-lg font-bold outline-none transition-all ${
                      isTooHigh
                        ? 'border-red-500 text-red-500'
                        : 'border-white/10 text-white focus:border-green-500 focus:text-green-400'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase">VNĐ</span>
                    <span className="text-[10px] text-zinc-600">/ 1 Giờ</span>
                  </div>
                </div>
                {isTooHigh && <p className="text-xs text-red-500 mt-2 text-right">Giá quá cao</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
