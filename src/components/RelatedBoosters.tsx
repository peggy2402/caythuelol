'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, User } from 'lucide-react';

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
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-blue-500 transition-colors">
                {booster.profile?.avatar ? (
                  <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <User className="w-6 h-6 text-zinc-500" />
                  </div>
                )}
                {/* Status Dot */}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-800 ${isReady ? 'bg-green-500' : 'bg-zinc-500'}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{booster.displayName || booster.username}</h4>
                <div className="flex items-center gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={14} className="fill-current" />
                    <span>{booster.booster_info?.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <span>•</span>
                  <span>{booster.booster_info?.completed_orders || 0} đơn</span>
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