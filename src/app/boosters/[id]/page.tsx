'use client';

import { useState, useEffect, use } from 'react';
import { useLanguage } from '@/lib/i18n';
import { User, Star, Trophy, MapPin, MessageSquare, ShieldCheck, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

export function BoosterProfileView({ id }: { id: string }) {
  const { t } = useLanguage();
  const [booster, setBooster] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooster = async () => {
      try {
        // Handle encoded @ if present in URL params
        // The API handles @username or ID automatically
        const res = await fetch(`/api/boosters/${encodeURIComponent(id)}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load booster');
        
        setBooster(data.booster);
        setReviews(data.reviews || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBooster();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 pt-24 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error || !booster) return (
    <div className="min-h-screen bg-zinc-950 pt-24 text-center text-red-400">
      <Navbar />
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-2">Booster Not Found</h2>
        <p>{error || 'The booster you are looking for does not exist.'}</p>
        <Link href="/boosters" className="text-blue-500 hover:underline mt-4 inline-block">Back to Boosters</Link>
      </div>
    </div>
  );

  const info = booster.booster_info || {};
  // Ensure identifier has @ if it's a username based lookup, or just use username for display
  const identifier = `@${booster.username}`;
  const ratingStats = info.rating_stats || {};

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 pb-20">
      <Navbar />
      
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-zinc-950 z-10" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 z-10" />
        <div className="absolute inset-0 bg-zinc-900" />
      </div>

      <div className="container mx-auto px-4 relative z-20 -mt-32">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl sticky top-24">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-50" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-zinc-950 bg-zinc-800">
                  {booster.profile?.avatar ? (
                    <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                  ) : (
                    <User className="w-full h-full p-6 text-zinc-500" />
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-zinc-950" title="Online" />
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-white mb-1">{booster.username}</h1>
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                  <MapPin className="w-3 h-3" />
                  <span>Vietnam</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                <div className="bg-zinc-950/50 rounded-xl p-3 border border-white/5">
                  <div className="text-yellow-500 font-bold text-xl flex items-center justify-center gap-1">
                    {info.rating?.toFixed(1) || 5.0} <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-xs text-zinc-500">{t('rating')}</div>
                </div>
                <div className="bg-zinc-950/50 rounded-xl p-3 border border-white/5">
                  <div className="text-blue-400 font-bold text-xl">
                    {info.completed_orders || 0}
                  </div>
                  <div className="text-xs text-zinc-500">{t('completedOrders')}</div>
                </div>
              </div>

              <Link 
                href={`/services/lol/rank-boost?booster=${identifier}`}
                className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center shadow-lg shadow-blue-600/20 transition-all mb-4"
              >
                {t('hireBooster')}
              </Link>

              <div className="space-y-3 text-sm text-zinc-400">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Identity Verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Member since {new Date(booster.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="flex-1 space-y-8">
            
            {/* Bio & Ranks */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> About Me
              </h2>
              <p className="text-zinc-300 leading-relaxed mb-6 whitespace-pre-line">
                {info.bio || "This booster hasn't written a bio yet."}
              </p>

              <div className="border-t border-white/5 pt-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Current Ranks</h3>
                <div className="flex flex-wrap gap-3">
                  {info.ranks && info.ranks.length > 0 ? (
                    info.ranks.map((rank: string, i: number) => (
                      <span key={i} className="px-4 py-2 rounded-lg bg-zinc-800 border border-white/5 text-zinc-200 font-medium flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        {rank}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-500 italic">No rank info</span>
                  )}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" /> Services
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {info.services?.map((service: string) => (
                  <div key={service} className="flex items-center gap-3 p-4 rounded-xl bg-zinc-950/50 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-medium text-zinc-200">{t(service as any) || service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Breakdown */}
            {Object.keys(ratingStats).length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-green-500" /> Điểm mạnh (Rating theo dịch vụ)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(ratingStats).map(([service, stat]: [string, any]) => (
                    <div key={service} className="bg-zinc-950/50 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-zinc-300">{t(service as any) || service}</span>
                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                          {stat.avg.toFixed(1)} <Star className="w-3 h-3 fill-current" />
                          <span className="text-zinc-600 text-xs font-normal">({stat.count})</span>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(stat.avg / 5) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-yellow-500" /> Recent Reviews
              </h2>
              
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review: any, i: number) => (
                    <div key={i} className="border-b border-white/5 last:border-0 pb-6 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                            {review.customerId?.profile?.avatar ? (
                              <Image src={review.customerId.profile.avatar} alt="User" width={40} height={40} className="object-cover" />
                            ) : (
                              <User className="w-full h-full p-2 text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{review.customerId?.username || 'Hidden User'}</div>
                            <div className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, starI) => (
                            <Star 
                              key={starI} 
                              className={`w-4 h-4 ${starI < (review.rating?.stars || 5) ? 'text-yellow-500 fill-current' : 'text-zinc-700'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pl-13">
                        <div className="inline-block px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 mb-2">
                          {t(review.serviceType as any) || review.serviceType}
                        </div>
                        <p className="text-zinc-300 text-sm italic">"{review.rating?.comment || 'No comment'}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-zinc-500 py-8">
                    No reviews yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function BoosterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoosterProfileView id={id} />;
}