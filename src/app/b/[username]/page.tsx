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
  Lock,
  MessageSquare,
  Clock,
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
  badgeBg: string;
  cardBg: string;
}

const SERVICE_REGISTRY: Record<string, ServiceInfo> = {
  RANK_BOOST: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    icon: Trophy,
    cardBg: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  RANK: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    icon: Trophy,
    cardBg: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  PLACEMENTS: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    icon: Swords,
    cardBg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PLACEMENT: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    icon: Swords,
    cardBg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PROMOTION: {
    name: 'Chuỗi Thăng Hạng',
    gameTag: 'LMHT / LoL',
    desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn mà không rớt bậc.',
    href: (u) => `/services/lol/promotion?booster=@${u}`,
    icon: TrendingUp,
    cardBg: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  NET_WINS: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    icon: Target,
    cardBg: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  NET_WIN: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    icon: Target,
    cardBg: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  MASTERY: {
    name: 'Cày Thông Thạo Tướng',
    gameTag: 'LMHT / LoL',
    desc: 'Cày điểm thông thạo & mở biểu cảm thông thạo cho tướng tủ yêu thích.',
    href: (u) => `/services/lol/mastery?booster=@${u}`,
    icon: Medal,
    cardBg: 'hover:border-yellow-500/50 hover:bg-yellow-500/5',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  LEVELING: {
    name: 'Cày Cấp Độ (Level 30)',
    gameTag: 'LMHT / LoL',
    desc: 'Cày cấp tài khoản từ 1 lên 30 nhanh nhất để mở khoá đấu xếp hạng.',
    href: (u) => `/services/lol/leveling?booster=@${u}`,
    icon: Zap,
    cardBg: 'hover:border-sky-500/50 hover:bg-sky-500/5',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  COACHING: {
    name: 'Huấn Luyện & Duo 1-1',
    gameTag: 'LMHT / LoL',
    desc: 'Phân tích replay, hướng dẫn tư duy macro/micro và sửa lỗi sai trực tiếp.',
    href: (u) => `/services/lol/coaching?booster=@${u}`,
    icon: Users,
    cardBg: 'hover:border-rose-500/50 hover:bg-rose-500/5',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  ONBET: {
    name: 'Cày Rank Sự Kiện / Onbet',
    gameTag: 'LMHT / LoL',
    desc: 'Cày vé sự kiện, nhiệm vụ Battle Pass để nhận toàn bộ phần thưởng.',
    href: (u) => `/services/lol/onbet?booster=@${u}`,
    icon: Banknote,
    cardBg: 'hover:border-violet-500/50 hover:bg-violet-500/5',
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
      // Fallback for custom service
      matchedServices.push({
        key,
        info: {
          name: key.replace(/_/g, ' '),
          gameTag: 'LMHT / LoL',
          desc: 'Dịch vụ chuyên nghiệp do Booster trực tiếp thực hiện.',
          href: (u) => `/services/lol/rank-boost?booster=@${u}`,
          icon: Swords,
          cardBg: 'hover:border-zinc-500 hover:bg-zinc-800/50',
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
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 relative">
        {/* Navigation bar with BackButton */}
        <div className="mb-6 flex items-center justify-between">
          <BackButton fallbackUrl="/boosters" />
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

        {/* Hero Card Banner */}
        <div className="relative p-6 sm:p-7 bg-zinc-900/70 border border-white/10 rounded-3xl shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-500/60 shadow-lg bg-zinc-900">
                  <Image
                    src={boosterData?.profile?.avatar || '/default-avatar.png'}
                    alt={boosterName}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
                <div
                  className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-md flex items-center gap-1 ${
                    isReady
                      ? 'bg-emerald-500 text-black border-emerald-300'
                      : 'bg-zinc-700 text-zinc-300 border-zinc-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-black' : 'bg-zinc-400'}`} />
                  {isReady ? 'ONLINE' : 'BUSY'}
                </div>
              </div>

              {/* Identity & Badges */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {boosterName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                    <Sparkles size={12} />
                    Verified Booster
                  </span>
                </div>
                <p className="text-zinc-500 text-xs sm:text-sm font-medium">@{boosterUsername}</p>

                {/* Key Metric Chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span>{boosterData?.rating ? boosterData.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-[10px] text-amber-400/70 font-normal">
                      ({reviews?.length || 0} đánh giá)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                    <CheckCircle2 size={14} />
                    <span>{boosterData?.completed_orders || 0} đơn hoàn thành</span>
                  </div>

                  {boosterData?.highestRank && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                      <Flame size={13} className="text-purple-400" />
                      <span>Peak: {boosterData.highestRank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row sm:flex-col gap-2.5 w-full sm:w-auto shrink-0 justify-center">
              <Link
                href={`/services/lol/rank-boost?booster=@${boosterUsername}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-blue-600/30 hover:scale-105 active:scale-95 text-sm"
              >
                <span>Thuê ngay</span>
                <ArrowRight size={15} />
              </Link>
              <ShareProfileButton
                username={boosterUsername}
                displayName={boosterName}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): Bio, Guarantees, Rank, Champions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Bio & Service Guarantees Card */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-400" />
                Giới thiệu về Booster
              </h3>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 italic">
                "{boosterData?.bio?.trim() || 'Booster chuyên nghiệp, cam kết tốc độ cày nhanh, bảo mật tài khoản và tỉ lệ thắng cao nhất.'}"
              </p>

              {/* 4 Guarantees */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Clock size={14} className="text-amber-400 shrink-0" />
                  <span>Xử lý trong 15p</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Lock size={14} className="text-emerald-400 shrink-0" />
                  <span>Bảo mật IP / VPN</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Shield size={14} className="text-blue-400 shrink-0" />
                  <span>Không dùng Tool</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Target size={14} className="text-purple-400 shrink-0" />
                  <span>Tỉ lệ thắng cao</span>
                </div>
              </div>
            </div>

            {/* Rank Box */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                Trình độ & Xếp hạng
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                  <div className="text-[11px] text-zinc-400 uppercase font-semibold">Rank Hiện Tại</div>
                  <div className="text-sm font-bold text-blue-400 mt-1">{boosterData?.currentRank || 'N/A'}</div>
                </div>
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                  <div className="text-[11px] text-zinc-400 uppercase font-semibold">Rank Cao Nhất</div>
                  <div className="text-sm font-bold text-amber-400 mt-1">{boosterData?.highestRank || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Winrate Stat Box */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Phong độ gần đây (30 ngày)
              </h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-emerald-400">{winRate}%</span>
                <span className="text-xs text-zinc-400">
                  ({wins} Thắng - {losses} Thua)
                </span>
              </div>
              {winRateTrendData.length > 0 && (
                <div className="pt-2">
                  <SparklineChart data={winRateTrendData} color="#34d399" height={50} />
                </div>
              )}
            </div>

            {/* Champion Pool */}
            {championPool.length > 0 && (
              <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    Tướng tủ ({championPool.length})
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Patch {ddragonVersion}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {championPool.slice(0, 10).map((champ: string) => (
                    <div
                      key={champ}
                      className="group relative flex flex-col items-center"
                      title={champ}
                    >
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-zinc-700 group-hover:border-blue-500 group-hover:scale-110 transition-all duration-200 bg-zinc-800 shadow-sm">
                        <Image
                          src={`https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champ}.png`}
                          alt={champ}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[9px] text-zinc-400 group-hover:text-white truncate max-w-full text-center mt-1">
                        {champ}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols): Provided Services & Reviews */}
          <div className="lg:col-span-7 space-y-6">
            {/* Services Section */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <Swords size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Dịch vụ cung cấp ({matchedServices.length})</h3>
                    <p className="text-xs text-zinc-400">Đặt dịch vụ trực tiếp với Booster {boosterName}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
                  <Gamepad2 size={13} className="text-blue-400" />
                  LMHT
                </span>
              </div>

              {matchedServices.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                  <p className="text-zinc-500 text-sm">Booster hiện chưa cập nhật danh sách dịch vụ.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchedServices.map(({ key, info }) => {
                    const ServiceIcon = info.icon;
                    return (
                      <Link
                        key={key}
                        href={info.href(boosterUsername)}
                        className={`group flex flex-col justify-between p-3.5 rounded-xl border border-white/10 bg-zinc-950/50 transition-all duration-200 ${info.cardBg} hover:-translate-y-0.5 shadow-sm`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${info.badgeBg}`}>
                              {info.gameTag}
                            </span>
                            <div className="p-1 rounded-lg bg-white/5 text-zinc-300 group-hover:text-white transition-colors">
                              <ServiceIcon size={15} />
                            </div>
                          </div>
                          <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors line-clamp-1">
                            {info.name}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {info.desc}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                          <span>Đặt dịch vụ ngay</span>
                          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
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
