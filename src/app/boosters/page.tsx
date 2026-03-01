'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Star, Trophy, User as UserIcon, Loader2, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

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
          setBoosters(data.boosters || []);
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
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 px-4 relative overflow-hidden selection:bg-blue-500/30 font-sans" suppressHydrationWarning>
      <Navbar />
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" suppressHydrationWarning />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3 h-3" /> Trusted by 10,000+ Players
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            {t('boosterListTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            {t('boosterListDesc')}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          /* Grid List */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boosters.length > 0 ? (
              boosters.map((booster) => (
                <div 
                  key={booster._id} 
                  className="group relative bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Cover / Avatar Area */}
                  <div className="h-28 bg-gradient-to-r from-zinc-800 to-zinc-900 relative">
                    <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <div className="w-20 h-20 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
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
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{booster.username}</h3>
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
                          <span key={idx} className="px-3 py-1 rounded-full bg-zinc-800/50 border border-white/5 text-xs font-medium text-zinc-300">
                            {rank}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-zinc-800/50 border border-white/5 text-xs font-medium text-zinc-300">Challenger</span>
                      )}
                    </div>

                    <Link 
                      href={`/services?booster=${booster._id}`} 
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-white/10 hover:shadow-blue-500/30 group/btn"
                    >
                      {t('hireBooster')}
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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