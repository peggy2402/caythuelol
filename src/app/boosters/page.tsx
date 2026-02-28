'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Star, Trophy, Swords, User as UserIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Booster {
  _id: string;
  username: string;
  profile: {
    avatar?: string;
  };
  booster_info?: {
    ranks: string[];
    rating: number;
    completed_orders: number;
    bio: string;
  };
}

export default function BoostersPage() {
  const { t } = useLanguage();
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        const res = await fetch('/api/boosters');
        const data = await res.json();
        if (res.ok) {
          setBoosters(data.boosters);
        }
      } catch (error) {
        console.error('Failed to fetch boosters', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoosters();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500 mb-4">
            {t('boosterListTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t('boosterListDesc')}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          </div>
        ) : (
          /* Grid List */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boosters.length > 0 ? (
              boosters.map((booster) => (
                <div 
                  key={booster._id} 
                  className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.1)]"
                >
                  {/* Cover / Avatar Area */}
                  <div className="h-24 bg-gradient-to-r from-zinc-800 to-zinc-900 relative">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <div className="w-20 h-20 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden flex items-center justify-center">
                        {booster.profile.avatar ? (
                          <img src={booster.profile.avatar} alt={booster.username} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-zinc-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Area */}
                  <div className="pt-12 pb-6 px-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-1">{booster.username}</h3>
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mb-4">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{booster.booster_info?.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-zinc-500 text-sm ml-1">
                        ({booster.booster_info?.completed_orders || 0} {t('completedOrders')})
                      </span>
                    </div>

                    {/* Ranks / Tags */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {booster.booster_info?.ranks && booster.booster_info.ranks.length > 0 ? (
                        booster.booster_info.ranks.slice(0, 2).map((rank, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-700">
                            {rank}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-700">Challenger</span>
                      )}
                    </div>

                    <Link href={`/orders/create?booster=${booster._id}`} className="block w-full py-2.5 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                      {t('hireBooster')}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-zinc-500">
                Chưa có Booster nào trong hệ thống.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}