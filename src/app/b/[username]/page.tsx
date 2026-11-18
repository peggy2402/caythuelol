import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Shield,
  TrendingUp,
  Trophy,
  Target,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flame,
  Lock,
  MessageSquare,
  Clock,
  Zap,
  Tag,
} from 'lucide-react';
import SparklineChart from '@/components/SparklineChart';
import BoosterReviewList from '@/components/BoosterReviewList';
import RelatedBoosters from '@/components/RelatedBoosters';
import BackButton from '@/components/BackButton';
import ShareProfileButton from '@/components/ShareProfileButton';
import BoosterServicesList, { ServiceItem } from '@/components/BoosterServicesList';
import BoosterGameSelectorModal from '@/components/BoosterGameSelectorModal';
import BoosterProfileHeaderActions from '@/components/BoosterProfileHeaderActions';
import BoosterProfileRightSection from '@/components/BoosterProfileRightSection';
import BoosterRankShowcase from '@/components/BoosterRankShowcase';
import BoosterAvatar from '@/components/BoosterAvatar';
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
  const rating = typeof boosterData?.rating === 'number' && boosterData.rating > 0 ? boosterData.rating : 0;
  const completedOrders = boosterData?.completed_orders || 0;

  const statsText = rating > 0
    ? `⭐ ${rating.toFixed(1)} (${completedOrders} đơn)`
    : `⭐ 0/0 (${completedOrders} đơn)`;

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
interface ServiceRegistryEntry {
  name: string;
  gameTag: string;
  category: 'RANK' | 'OTHER';
  desc: string;
  href: (username: string) => string;
  iconName: string;
  badgeBg: string;
  cardBg: string;
}

const SERVICE_REGISTRY: Record<string, ServiceRegistryEntry> = {
  RANK_BOOST: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    iconName: 'Trophy',
    cardBg: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  RANK: {
    name: 'Cày Rank / Elo Siêu Tốc',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Leo rank Sắt đến Cao Thủ, Thách Đấu với tỉ lệ thắng cao & nhanh chóng.',
    href: (u) => `/services/lol/rank-boost?booster=@${u}`,
    iconName: 'Trophy',
    cardBg: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  PLACEMENTS: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    iconName: 'Swords',
    cardBg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PLACEMENT: {
    name: 'Phân Hạng Đầu Mùa (5 Trận)',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Đảm bảo kết quả 5 trận phân hạng cao nhất để khởi đầu mùa giải tối ưu.',
    href: (u) => `/services/lol/placements?booster=@${u}`,
    iconName: 'Swords',
    cardBg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PROMOTION: {
    name: 'Chuỗi Thăng Hạng',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Vượt chuỗi thăng hạng BO3/BO5 an toàn và nhanh gọn mà không rớt bậc.',
    href: (u) => `/services/lol/promotion?booster=@${u}`,
    iconName: 'TrendingUp',
    cardBg: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  NET_WINS: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    iconName: 'Target',
    cardBg: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  NET_WIN: {
    name: 'Cày Trận Thắng (Net Wins)',
    gameTag: 'LMHT / LoL',
    category: 'RANK',
    desc: 'Đảm bảo số trận thắng ròng, tăng điểm LP và cải thiện hệ số MMR.',
    href: (u) => `/services/lol/net-wins?booster=@${u}`,
    iconName: 'Target',
    cardBg: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  MASTERY: {
    name: 'Cày Thông Thạo Tướng',
    gameTag: 'LMHT / LoL',
    category: 'OTHER',
    desc: 'Cày điểm thông thạo & mở biểu cảm thông thạo cho tướng tủ yêu thích.',
    href: (u) => `/services/lol/mastery?booster=@${u}`,
    iconName: 'Medal',
    cardBg: 'hover:border-yellow-500/50 hover:bg-yellow-500/5',
    badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  LEVELING: {
    name: 'Cày Cấp Độ (Level 30)',
    gameTag: 'LMHT / LoL',
    category: 'OTHER',
    desc: 'Cày cấp tài khoản từ 1 lên 30 nhanh nhất để mở khoá đấu xếp hạng.',
    href: (u) => `/services/lol/leveling?booster=@${u}`,
    iconName: 'Zap',
    cardBg: 'hover:border-sky-500/50 hover:bg-sky-500/5',
    badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  COACHING: {
    name: 'Huấn Luyện & Duo 1-1',
    gameTag: 'LMHT / LoL',
    category: 'OTHER',
    desc: 'Phân tích replay, hướng dẫn tư duy macro/micro và sửa lỗi sai trực tiếp.',
    href: (u) => `/services/lol/coaching?booster=@${u}`,
    iconName: 'Users',
    cardBg: 'hover:border-rose-500/50 hover:bg-rose-500/5',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  ONBET: {
    name: 'Cày Rank Sự Kiện / Onbet',
    gameTag: 'LMHT / LoL',
    category: 'OTHER',
    desc: 'Cày vé sự kiện, nhiệm vụ Battle Pass để nhận toàn bộ phần thưởng.',
    href: (u) => `/services/lol/onbet?booster=@${u}`,
    iconName: 'Banknote',
    cardBg: 'hover:border-violet-500/50 hover:bg-violet-500/5',
    badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
};

function getRankIcon(rankName: string, isHighest: boolean = false): string {
  const r = (rankName || '').toLowerCase();
  if (r.includes('radiant')) return '/images/valorant/Radiant_Rank.png';
  if (r.includes('immortal')) return '/images/valorant/Immortal_3_Rank.png';
  if (r.includes('challenger') || r.includes('thách đấu')) return '/images/ranks/challenger.png';
  if (r.includes('grandmaster') || r.includes('đại cao thủ')) return '/images/ranks/grandmaster.png';
  if (r.includes('master') || r.includes('cao thủ')) return '/images/ranks/master.png';
  if (r.includes('diamond') || r.includes('kim cương')) return '/images/ranks/diamond.png';
  if (r.includes('emerald') || r.includes('lục bảo')) return '/images/ranks/emerald.png';
  if (r.includes('platinum') || r.includes('bạch kim')) return '/images/ranks/platinum.png';
  if (r.includes('gold') || r.includes('vàng')) return '/images/ranks/gold.png';
  if (r.includes('silver') || r.includes('bạc')) return '/images/ranks/silver.png';
  if (r.includes('bronze') || r.includes('đồng')) return '/images/ranks/bronze.png';
  if (r.includes('iron') || r.includes('sắt')) return '/images/ranks/iron.png';
  return isHighest ? '/images/valorant/Radiant_Rank.png' : '/images/ranks/diamond.png';
}

export default async function ShortProfilePage({ params }: Props) {
  const { username } = await params;
  const [data, ddragonVersion] = await Promise.all([
    getBooster(username),
    getLatestDDragonVersion(),
  ]);

  if (!data?.user || data.user.role !== 'BOOSTER') {
    notFound();
  }

  const { user, boosterData, reviews, relatedBoosters, stats } = data;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;
  const winRateTrendData = stats?.winRateTrendData || [];

  const championPool = boosterData?.service_settings?.playingChampions || [];
  const boosterName = boosterData?.displayName || boosterData?.username || data.user.username;
  const boosterUsername = boosterData?.username || data.user.username;

  // 1. Ưu tiên lấy các dịch vụ động do chính Booster này tự tạo trong Studio
  const customServicesList: any[] =
    boosterData?.service_settings?.customServices ||
    data.user?.booster_info?.service_settings?.customServices ||
    [];

  const coupon =
    boosterData?.service_settings?.coupon ||
    data.user?.booster_info?.service_settings?.coupon;

  const matchedServices: ServiceItem[] = [];

  if (Array.isArray(customServicesList) && customServicesList.length > 0) {
    customServicesList.forEach((s) => {
      if (s.isActive === false) return;
      matchedServices.push({
        key: s.id,
        name: s.name,
        gameTag: s.gameCode || 'Game',
        category: s.pricingType === 'PER_UNIT' ? 'OTHER' : 'RANK',
        desc:
          s.desc ||
          (s.pricingType === 'PER_UNIT'
            ? `${Number(s.price || 0).toLocaleString('vi-VN')} đ / ${s.unitName || 'điểm'}`
            : `${Number(s.price || 0).toLocaleString('vi-VN')} đ`),
        href: `/services/book/${s.id}`,
        iconName: 'Trophy',
        badgeBg:
          s.depositPercent < 100
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cardBg: 'hover:border-blue-500/50 hover:bg-blue-500/5',
      });
    });
  } else {
    // Fallback nếu booster chưa tạo custom service
    const rawServices: string[] = boosterData?.services || [];
    const normalizedKeys = Array.from(
      new Set(
        rawServices.map((s) =>
          s.trim().toUpperCase().replace(/\s+/g, '_')
        )
      )
    );

    const addedNames = new Set<string>();
    for (const key of normalizedKeys) {
      const entry =
        SERVICE_REGISTRY[key] ||
        SERVICE_REGISTRY[key.replace(/S$/, '')] ||
        SERVICE_REGISTRY[`${key}S`];

      if (entry && !addedNames.has(entry.name)) {
        matchedServices.push({
          key,
          name: entry.name,
          gameTag: entry.gameTag,
          category: entry.category,
          desc: entry.desc,
          href: `/services/book/${key.toLowerCase()}?booster=@${boosterUsername}`,
          iconName: entry.iconName,
          badgeBg: entry.badgeBg,
          cardBg: entry.cardBg,
        });
        addedNames.add(entry.name);
      }
    }
  }

  const isReady = boosterData?.isReady ?? true;

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
      {/* Background ambient lighting theo Ảnh 4 */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-6 left-10 w-[550px] h-[380px] bg-cyan-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-10 right-10 w-[550px] h-[400px] bg-rose-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/3 w-[450px] h-[350px] bg-indigo-600/15 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 relative">
        {/* Navigation bar with BackButton */}
        <div className="mb-6 flex items-center justify-between">
          <BackButton fallbackUrl="/boosters" />
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border ${
                isReady
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
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
        <div className="relative p-6 sm:p-7 bg-[#0d1017]/85 border border-white/10 rounded-3xl shadow-2xl mb-8 backdrop-blur-xl overflow-hidden">
          {/* Subtle Ambient Behind Avatar */}
          <div className="absolute -top-10 -left-10 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left flex-1 min-w-0">
              {/* Avatar Y Hệt Ảnh Mẫu với viền phát sáng gradient */}
              <div className="relative shrink-0">
                <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-rose-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-950">
                    <BoosterAvatar
                      src={boosterData?.profile?.avatar || '/default-avatar.png'}
                      alt={boosterName}
                    />
                  </div>
                </div>
                <div
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-lg flex items-center gap-1.5 whitespace-nowrap ${
                    isReady
                      ? 'bg-[#090b10] text-emerald-400 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                  {isReady ? 'ONLINE' : 'BUSY'}
                </div>
              </div>

              {/* Identity & Header Interactive Actions */}
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {boosterName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                    <Sparkles size={12} className="text-amber-400" />
                    Verified Booster
                  </span>
                </div>
                <p className="text-zinc-500 text-xs sm:text-sm font-medium">@{boosterUsername}</p>

                {/* Header Interactive: Metric Chips + Nút Thuê ngay + Nút Tim + Nút Share */}
                <BoosterProfileHeaderActions
                  boosterId={user._id.toString()}
                  boosterUsername={boosterUsername}
                  boosterName={boosterName}
                  initialLikesCount={boosterData?.likes_count || boosterData?.favoritesCount || 0}
                  rating={boosterData?.rating || 0}
                  reviewsCount={reviews?.length || 0}
                  completedOrders={boosterData?.completed_orders || 0}
                  highestRank={boosterData?.highestRank || 'N/A'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Booster Active Coupon Banner */}
        {coupon?.isActive && coupon?.code && (
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-blue-900/20 border border-blue-500/30 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Ưu đãi độc quyền từ {boosterName}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                    Giảm {coupon.discountPercent}%
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Áp dụng cho mọi dịch vụ khi thanh toán với mã: <span className="font-mono font-bold text-blue-400">{coupon.code}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 font-mono font-bold text-sm text-center shrink-0">
              {coupon.code}
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols) - Sticky on desktop to eliminate blank voids */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            {/* Bio & Service Guarantees Card */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
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

            {/* Trình độ & Xếp hạng: Hỗ trợ đa tựa game động */}
            <BoosterRankShowcase
              boosterGames={
                boosterData?.games && boosterData.games.length > 0
                  ? boosterData.games
                  : [{ gameCode: 'LOL', ranks: [], servers: ['VN'] }]
              }
              defaultCurrentRank={boosterData?.currentRank}
              defaultHighestRank={boosterData?.highestRank}
            />

            {/* Winrate Stat Box: Phong độ gần đây (30 ngày) */}
            <div className="bg-[#0d1017]/90 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Phong độ gần đây (30 ngày)
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Match History
                </span>
              </div>

              {wins + losses > 0 ? (
                <>
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
                </>
              ) : (
                <div className="py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-emerald-400">100%</span>
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      Cam kết chất lượng
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    Chưa phát sinh trận đấu nào trong 30 ngày qua (0 Thắng - 0 Thua). Tuyển thủ sẵn sàng nhận đơn mới và cam kết tỉ lệ thắng cao nhất!
                  </p>
                </div>
              )}
            </div>

            {/* Champion Pool (or Fallback Lane Mastery Card) */}
            {championPool.length > 0 ? (
              <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
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
            ) : (
              <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    Vị trí sở trường
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    Mọi vị trí
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Booster thành thạo tất cả các lane và hỗ trợ chỉ định tướng theo yêu cầu của bạn.
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {['Top', 'Rừng', 'Mid', 'AD', 'SP'].map((lane) => (
                    <div key={lane} className="py-1.5 rounded-lg bg-zinc-950/60 border border-white/5 text-[11px] font-bold text-zinc-300">
                      {lane}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (7 Cols): Tựa Game Showcase & Reviews */}
          <div className="lg:col-span-7">
            <BoosterProfileRightSection
              boosterId={user._id.toString()}
              boosterUsername={boosterUsername}
              boosterName={boosterName}
              boosterAvatar={boosterData?.profile?.avatar}
              boosterGames={
                boosterData?.games && boosterData.games.length > 0
                  ? boosterData.games
                  : [
                      {
                        gameCode: 'LOL',
                        ranks: [boosterData?.highestRank || 'Thách Đấu'],
                        servers: ['VN'],
                      },
                    ]
              }
              customServices={customServicesList}
              reviews={reviews || []}
            />
          </div>
        </div>

        {/* Related Boosters Section */}
        <div className="mt-10">
          <RelatedBoosters currentBooster={boosterData} relatedBoosters={relatedBoosters || []} />
        </div>

        {/* Footer Y Hệt Ảnh Mẫu */}
        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">FAQ</span>
            <span className="hover:text-zinc-300 transition-colors cursor-pointer">Liên hệ</span>
          </div>
          <div>
            © Copyright All Reserved
          </div>
        </div>
      </div>
    </div>
  );
}
