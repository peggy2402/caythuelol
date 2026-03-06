'use client';

import { useState, useEffect, use } from 'react';
import { Loader2, Star, Trophy, User, ShieldCheck, MessageSquare, Calendar, Quote } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function BoosterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/boosters/${id}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
  if (!data || !data.booster) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Booster not found</div>;

  const { booster, reviews } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      <Navbar />
      
      <div className="pt-32 pb-20 container mx-auto px-4 max-w-5xl">
        {/* Header Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center md:items-start shadow-2xl">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 shadow-xl shrink-0 bg-zinc-800">
                {booster.profile?.avatar ? (
                    <Image src={booster.profile.avatar} alt={booster.username} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-zinc-500" /></div>
                )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                        {booster.username}
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                    </h1>
                    <p className="text-zinc-400 italic">"{booster.booster_info?.bio || 'Chuyên cày thuê LMHT uy tín, tốc độ.'}"</p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">{booster.booster_info?.rating?.toFixed(1)}</span>
                        <span className="text-xs text-zinc-500">Đánh giá</span>
                    </div>
                    <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-lg">{booster.booster_info?.completed_orders}</span>
                        <span className="text-xs text-zinc-500">Đơn hoàn thành</span>
                    </div>
                    <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-zinc-500" />
                        <span className="text-xs text-zinc-400">Tham gia: {format(new Date(booster.createdAt), 'MM/yyyy')}</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {booster.booster_info?.services?.map((svc: string) => (
                        <span key={svc} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                            {svc}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
                <Link href={`/services?booster=${booster._id}`} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-center shadow-lg shadow-blue-600/20 transition-all">
                    Thuê Ngay
                </Link>
            </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-yellow-500" />
                Đánh giá từ khách hàng ({reviews.length})
            </h2>
            
            {reviews.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 border-dashed">
                    Chưa có đánh giá nào. Hãy là người đầu tiên thuê Booster này!
                </div>
            ) : (
                <div className="grid gap-4">
                    {reviews.map((review: any) => (
                        <div key={review._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                        {review.customerId?.profile?.avatar ? (
                                            <Image src={review.customerId.profile.avatar} alt="Avatar" width={40} height={40} className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-zinc-500" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{review.customerId?.username || 'Khách hàng ẩn danh'}</div>
                                        <div className="text-xs text-zinc-500">{format(new Date(review.createdAt), 'dd/MM/yyyy')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < review.rating.stars ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'}`} />
                                    ))}
                                </div>
                            </div>
                            
                            {review.rating.comment && (
                                <div className="bg-zinc-950 p-4 rounded-lg text-zinc-300 text-sm italic relative">
                                    <Quote className="w-4 h-4 text-zinc-700 absolute top-2 left-2 opacity-50" />
                                    <span className="pl-4">{review.rating.comment}</span>
                                </div>
                            )}
                            
                            <div className="mt-3 flex gap-2">
                                <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    {review.serviceType}
                                </span>
                                {review.details?.current_rank && review.details?.desired_rank && (
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                        {review.details.current_rank} ➔ {review.details.desired_rank}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}