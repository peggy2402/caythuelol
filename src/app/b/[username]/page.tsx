import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Swords,
  Shield,
  TrendingUp,
  Trophy,
  Target,
  Zap,
  Medal,
  Users,
  Banknote,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Gamepad2,
  type LucideIcon,
} from 'lucide-react';
import SparklineChart from '@/components/SparklineChart';
import BoosterReviewList from '@/components/BoosterReviewList';
import RelatedBoosters from '@/components/RelatedBoosters';
import BackButton from '@/components/BackButton';
import ShareProfileButton from '@/components/ShareProfileButton';
import { API_BASE_URL } from '@/lib/api';

type Props = {
  params: Promise<{ username: string }>;
};

// Helper fetch dynamic latest Riot Data Dragon patch version
async function getLatestDDragonVersion(): Promise<string> {
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', {
      next: { revalidate: 86400 }, // Cache 24 hours
    });
    if (res.ok) {
      const versions = await res.json();
      if (Array.isArray(versions) && versions.length > 0 && typeof versions[0] === 'string') {
        return versions[0];
      }
    }
  } catch {
    // Fallback if network or ddragon is unreachable
  }
  return '14.24.1';
}

async function getBooster(username: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/boosters/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getBooster(username);
  if (!data?.user) return { title: 'Booster Not Found' };

  const { user, boosterData } = data;
  const statsText = boosterData?.rating
    ? `⭐ ${boosterData.rating.toFixed(1)} (${boosterData.completed_orders || 0} đơn)`
    : '';

  return {
    title: `${user.username} ${statsText} - Booster Chuyên Nghiệp | LeoRank`,
    description:
      boosterData?.bio ||
      `Thuê ${user.username} cày thuê LMHT uy tín, giá rẻ, tốc độ cao. Xem bảng giá và đánh giá chi tiết trên LeoRank.`,
    openGraph: {
      title: `Thuê Booster ${user.username} ${statsText}`,
      description: boosterData?.bio || `Xem hồ sơ, bảng giá và đánh giá của ${user.username}.`,
      images: user.profile?.avatar ? [user.profile.avatar] : [],
      type: 'profile',
    },
  };
}

// Service Catalog Definition for LoL
interface ServiceInfo {
  name: string;
  gameTag: string;
  desc: string;
  href: (username: string) => string;
  icon: LucideIcon;
  gradient: string;
  badgeBg: string;
}

const SERVICE_REGISTRY: Record<string, ServiceInfo> = {
  RANK_BOOST: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & hoàn thành nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    icon: Trophy,
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/60',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  RANK: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & hoàn thành nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    icon: Trophy,
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 hover:border-amber-500/60',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  PLACEMENTS: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải thuận lợi, MMR tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    icon: Swords,
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30 hover:border-blue-500/60',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PLACEMENT: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải thuận lợi, MMR tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    icon: Swords,
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/30 hover:border-blue-500/60',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PROMOTION: {
    name: 'Chuỗi Thăng Hạng',
    gameTag: 'LMHT / LoL',
    desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn mà không lo rớt bậc.',
    href: (u) => `/services/lol/promotion?booster=@${u}`,
    icon: TrendingUp,
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 hover:border-emerald-500/60',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  NET_WINS: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR tài khoản.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    icon: Target,
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/30 hover:border-purple-500/60',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  NET_WIN: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR tài khoản.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    icon: Target,
    gradient: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/30 hover:border-purple-500/60',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  MASTERY: {
    name: 'Cày Thông Thạo Tướng',
    gameTag: 'LMHT / LoL',
    desc: 'Cày điểm thông thạo & nâng cấp mốc biểu cảm thông thạo cho vị tướng bạn yêu thích.',
    href: (u) => `/services/lol/mastery?booster=@${u}`,
    icon: Medal,
    gradient: 'from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/30 hover:border-yellow-500/60',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  LEVELING: {
    name: 'Cày Cấp Độ (Level 30)',
    gameTag: 'LMHT / LoL',
    desc: 'Cày cấp tài khoản từ 1 lên 30 nhanh nhất, tối đa Tinh Hoa Lam để mở khoá đấu xếp hạng.',
    href: (u) => `/services/lol/leveling?booster=@${u}`,
    icon: Zap,
    gradient: 'from-sky-500/10 via-sky-500/5 to-transparent border-sky-500/30 hover:border-sky-500/60',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  COACHING: {
    name: 'Huấn Luyện & Duo Coaching 1-1',
    gameTag: 'LMHT / LoL',
    desc: 'Phân tích replay, hướng dẫn tư duy macro/micro và sửa lỗi sai trực tiếp qua Discord.',
    href: (u) => `/services/lol/coaching?booster=@${u}`,
    icon: Users,
    gradient: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30 hover:border-rose-500/60',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  ONBET: {
    name: 'Cày Rank Sự Kiện / Onbet',
    gameTag: 'LMHT / LoL',
    desc: 'Cày số trận và hoàn thành nhiệm vụ sự kiện, Battle Pass để nhận toàn bộ phần thưởng.',
    href: (u) => `/services/lol/onbet?booster=@${u}`,
    icon: Banknote,
    gradient: 'from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/30 hover:border-violet-500/60',
    badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
};

export default async function ShortProfilePage({ params }: Props) {
  const { username } = await params;
  const [data, ddragonVersion] = await Promise.all([
    getBooster(username),
    getLatestDDragonVersion(),
  ]);

  if (!data?.user || data.user.role !== 'BOOSTER') {
    notFound();
  }

  const { boosterData, reviews, relatedBoosters, stats } = data;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;
  const winRateTrendData = stats?.winRateTrendData || [];

  const championPool = boosterData?.service_settings?.playingChampions || [];
  const rawServices: string[] = boosterData?.services || [];

  // Normalize services
  const normalizedKeys = Array.from(
    new Set(
      rawServices.map((s) =>
        s.trim().toUpperCase().replace(/\s+/g, '_')
      )
    )
  );

  // Map to distinct service catalog entries
  const matchedServices: { key: string; info: ServiceInfo }[] = [];
  const addedNames = new Set<string>();

  for (const key of normalizedKeys) {
    const info =
      SERVICE_REGISTRY[key] ||
      SERVICE_REGISTRY[key.replace(/S$/, '')] ||
      SERVICE_REGISTRY[`${key}S`];

    if (info && !addedNames.has(info.name)) {
      matchedServices.push({ key, info });
      addedNames.add(info.name);
    } else if (!info && !addedNames.has(key)) {
      // Fallback for unknown service
      matchedServices.push({
        key,
        info: {
          name: key.replace(/_/g, ' '),
          gameTag: 'LMHT / LoL',
          desc: 'Dịch vụ chuyên nghiệp được cung cấp bởi Booster.',
          href: (u) => `/services/lol/rank-boost?booster=@${u}`,
          icon: Swords,
          gradient: 'from-zinc-800 to-zinc-900 border-zinc-700 hover:border-zinc-500',
          badgeBg: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        },
      });
      addedNames.add(key);
    }
  }

  const isReady = boosterData?.isReady ?? true;
  const boosterName = boosterData?.displayName || boosterData?.username || data.user.username;
  const boosterUsername = boosterData?.username || data.user.username;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-25">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 relative">
        {/* Navigation bar with back button */}
        <div className="mb-6 flex items-center justify-between">
          <BackButton />
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isReady
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                }`}
              />
              {isReady ? 'Sẵn sàng nhận đơn' : 'Tạm nghỉ / Đang bận'}
            </span>
          </div>
        </div>

        {/* Profile Hero Header Card */}
        <div className="relative p-6 sm:p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl mb-8 overflow-hidden">
          {/* Decorative glow highlights */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with dynamic ring */}
            <div className="relative shrink-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-blue-500/60 shadow-xl shadow-blue-500/20 bg-zinc-900">
                <Image
                  src={boosterData?.profile?.avatar || '/default-avatar.png'}
                  alt={boosterName}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
              <div
                className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-md flex items-center gap-1 ${
                  isReady
                    ? 'bg-emerald-500 text-black border-emerald-300'
                    : 'bg-zinc-700 text-zinc-300 border-zinc-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-black' : 'bg-zinc-400'}`} />
                {isReady ? 'ONLINE' : 'BUSY'}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {boosterName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                    <Sparkles size={12} />
                    Verified Booster
                  </span>
                </div>
                <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5">@{boosterUsername}</p>
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                  <Star size={15} className="fill-amber-400 text-amber-400" />
                  <span>{boosterData?.rating ? boosterData.rating.toFixed(1) : '5.0'}</span>
                  <span className="text-xs text-amber-400/70 font-normal">
                    ({reviews?.length || 0} đánh giá)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  <CheckCircle2 size={15} />
                  <span>{boosterData?.completed_orders || 0} đơn hoàn thành</span>
                </div>

                {boosterData?.highestRank && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium text-xs">
                    <Flame size={14} className="text-purple-400" />
                    <span>Peak: {boosterData.highestRank}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl whitespace-pre-line bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
                {boosterData?.bio || 'Chưa cập nhật phần giới thiệu cá nhân.'}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0 md:self-center">
              <Link
                href={`/services/lol/rank-boost?booster=@${boosterUsername}`}
                className="flex items-center justify-center gap-2 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 text-center text-sm"
              >
                <span>Thuê ngay</span>
                <ArrowRight size={16} />
              </Link>

              <ShareProfileButton
                username={boosterUsername}
                displayName={boosterName}
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Stats & Champions */}
          <div className="md:col-span-1 space-y-6">
            {/* Rank Box */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Rank Hiện Tại</span>
                <span className="text-sm font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                  {boosterData?.currentRank || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Rank Cao Nhất</span>
                <span className="text-sm font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  {boosterData?.highestRank || 'N/A'}
                </span>
              </div>
            </div>

            {/* Winrate Stat Box */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-400" />
                Tỉ lệ thắng (30 ngày gần nhất)
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 tracking-tight">{winRate}%</span>
                <span className="text-xs text-zinc-400">
                  ({wins} Thắng - {losses} Thua)
                </span>
              </div>
              {winRateTrendData.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <SparklineChart data={winRateTrendData} color="#34d399" height={55} />
                </div>
              )}
            </div>

            {/* Playing Champions (Champion Pool) */}
            {championPool.length > 0 && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Shield size={18} className="text-blue-400" />
                    Tướng tủ ({championPool.length})
                  </h3>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                    Patch {ddragonVersion}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {championPool.map((champ: string) => (
                    <div
                      key={champ}
                      className="group relative flex flex-col items-center"
                      title={champ}
                    >
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-zinc-700/80 group-hover:border-blue-500 group-hover:scale-105 transition-all duration-200 bg-zinc-800 shadow-sm">
                        <Image
                          src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ}.png`}
                          alt={champ}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-white truncate max-w-full text-center mt-1">
                        {champ}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Provided Services & Reviews */}
          <div className="md:col-span-2 space-y-6">
            {/* Services Overhaul Section */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <Swords size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Dịch vụ cung cấp
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Chọn dịch vụ để đặt hàng trực tiếp cùng Booster {boosterName}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
                  <Gamepad2 size={14} className="text-blue-400" />
                  LMHT (LoL)
                </span>
              </div>

              {matchedServices.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-sm">Booster hiện chưa kích hoạt dịch vụ nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {matchedServices.map(({ key, info }) => {
                    const ServiceIcon = info.icon;
                    return (
                      <Link
                        key={key}
                        href={info.href(boosterUsername)}
                        className={`group relative flex flex-col justify-between p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 ${info.gradient}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${info.badgeBg}`}>
                              {info.gameTag}
                            </span>
                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white group-hover:scale-110 group-hover:bg-white/10 transition-all">
                              <ServiceIcon size={16} />
                            </div>
                          </div>
                          <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                            {info.name}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {info.desc}
                          </p>
                        </div>

                        <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                          <span>Đặt dịch vụ ngay</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Customer Reviews Section */}
            <BoosterReviewList reviews={reviews || []} />
          </div>
        </div>

        {/* Related Boosters Section */}
        <div className="mt-10">
          <RelatedBoosters currentBooster={boosterData} relatedBoosters={relatedBoosters || []} />
        </div>
      </div>
    </div>
  );
}
