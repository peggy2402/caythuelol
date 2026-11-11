import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star, Swords, Shield, TrendingUp } from 'lucide-react';
import SparklineChart from '@/components/SparklineChart';
import Link from 'next/link';
import BoosterReviewList from '@/components/BoosterReviewList';
import RelatedBoosters from '@/components/RelatedBoosters';
import BackButton from '@/components/BackButton';
import { API_BASE_URL } from '@/lib/api';

type Props = {
  params: Promise<{ username: string }>;
};

async function getBooster(username: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/boosters/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getBooster(username);
  if (!data?.user) return { title: 'Booster Not Found' };

  const { user, boosterData } = data;
  const statsText = boosterData?.rating ? `⭐ ${boosterData.rating.toFixed(1)} (${boosterData.completed_orders || 0} đơn)` : '';

  return {
    title: `${user.username} ${statsText} - Professional Booster`,
    description: boosterData?.bio || `Thuê ${user.username} cày thuê LMHT uy tín, giá rẻ, tốc độ cao. Xem bảng giá và đánh giá chi tiết.`,
    openGraph: {
      title: `Thuê Booster ${user.username} ${statsText}`,
      description: boosterData?.bio || `Xem hồ sơ, bảng giá và đánh giá của ${user.username}.`,
      images: user.profile?.avatar ? [user.profile.avatar] : [],
      type: 'profile',
    },
  };
}

export default async function ShortProfilePage({ params }: Props) {
  const { username } = await params;
  const data = await getBooster(username);

  if (!data?.user || data.user.role !== 'BOOSTER') {
    notFound();
  }

  const { boosterData, reviews, relatedBoosters, stats } = data;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;
  const winRateTrendData = stats?.winRateTrendData || [];

  const championPool = boosterData?.service_settings?.playingChampions || [];
  const rawServices = boosterData?.services || [];
  const normalizedServices = rawServices.map((s: string) => s.replace(/S$/, '').toUpperCase());
  const services = [...new Set(normalizedServices)];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 z-[-1] opacity-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 via-zinc-950 to-purple-900 animate-gradient-xy"></div>
      </div>

      <div className="max-w-5xl mx-auto py-12 px-4 relative">
        <div className="absolute top-4 left-4 z-20">
          <BackButton />
        </div>

        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl shadow-black/20 mb-8">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>

          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-blue-500 shrink-0 shadow-lg shadow-blue-500/30">
            <Image src={boosterData?.profile?.avatar || '/default-avatar.png'} alt={boosterData?.username || ''} fill className="object-cover" />
          </div>
          <div className="text-center sm:text-left z-10">
            <h1 className="text-4xl font-black text-white tracking-tight">{boosterData?.displayName || boosterData?.username}</h1>
            <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                <Star size={16} className="fill-current" />
                <span>{boosterData?.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="text-zinc-600">|</div>
              <div className="text-zinc-300 font-medium">
                {boosterData?.completed_orders || 0} đơn hoàn thành
              </div>
            </div>
            <p className="text-zinc-400 mt-3 text-sm max-w-lg whitespace-pre-wrap">{boosterData?.bio || 'Chưa có giới thiệu.'}</p>
          </div>
          <Link href={`/services/lol/rank-boost?booster=@${boosterData?.username}`} className="w-full sm:w-auto sm:ml-auto px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105 z-10 text-center">
            Thuê ngay
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold">Rank Hiện Tại</div>
                <div className="text-white font-bold">{boosterData?.currentRank || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 uppercase font-bold">Rank Cao Nhất</div>
                <div className="text-yellow-400 font-bold">{boosterData?.highestRank || 'N/A'}</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-green-500" /> Tỉ lệ thắng (30 ngày)</h3>
              <div className="text-4xl font-bold text-green-400">{winRate}%</div>
              <div className="text-sm text-zinc-400">{wins} Thắng - {losses} Thua</div>
              <div className="mt-4">
                <SparklineChart data={winRateTrendData} color="#4ade80" height={60} />
              </div>
            </div>

            {championPool.length > 0 && (
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-blue-500" /> Tướng tủ</h3>
                <div className="flex flex-wrap gap-3">
                  {championPool.slice(0, 10).map((champ: string) => (
                    <div key={champ} className="flex flex-col items-center gap-1" title={champ}>
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 hover:border-blue-500 transition-all">
                        <Image src={`https://ddragon.leagueoflegends.com/cdn/${process.env.DDRAGON_VER || '14.5.1'}/img/champion/${champ}.png`} alt={champ} width={48} height={48} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Swords size={20} className="text-red-500" /> Dịch vụ cung cấp</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {services.map((svc: unknown) => (
                  <span key={svc as string} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-bold text-zinc-300">
                    {(svc as string).replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
            <BoosterReviewList reviews={reviews || []} />
          </div>
        </div>

        <RelatedBoosters currentBooster={boosterData} relatedBoosters={relatedBoosters || []} />
      </div>
    </div>
  );
}
