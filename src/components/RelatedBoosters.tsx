'use client';

import Link from 'next/link';
import { Star, User } from 'lucide-react';
import BoosterAvatar from '@/components/BoosterAvatar';

export default function RelatedBoosters({ currentBooster, relatedBoosters }: { currentBooster: any, relatedBoosters: any[] }) {
  if (!relatedBoosters || relatedBoosters.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-white mb-6">Booster tương tự</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {relatedBoosters.map((booster) => {
          const isReady = booster.booster_info?.isReady ?? true;
          
          return (
          <Link
            href={`/b/${booster.username}`}
            key={booster._id}
            className="group block bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              {/* Avatar với Status Dot đặt ở lớp ngoài cùng, không bị overflow-hidden cắt góc */}
              <div className="relative w-14 h-14 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-blue-500 transition-colors bg-zinc-900 shadow-md">
                  <BoosterAvatar
                    src={booster.profile?.avatar}
                    alt={booster.displayName || booster.username}
                  />
                </div>
                {/* Chấm xanh trạng thái hoạt động hiển thị trọn vẹn, có viền tương phản sắc nét */}
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0e121a] z-10 ${
                    isReady
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                      : 'bg-zinc-500'
                  }`}
                  title={isReady ? 'Đang sẵn sàng nhận đơn' : 'Tạm nghỉ'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                  {booster.displayName || booster.username}
                </h4>
                <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={13} className="fill-amber-400" />
                    <span>{booster.booster_info?.rating ? booster.booster_info.rating.toFixed(1) : '5.0'}</span>
                  </div>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400">{booster.booster_info?.completed_orders || 0} đơn đã cày</span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Giá từ: <span className="font-bold text-green-400">50.000 đ</span>
            </div>
          </Link>
        )})}
      </div>
    </div>
  );
}