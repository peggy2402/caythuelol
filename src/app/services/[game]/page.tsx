// src/app/services/[game]/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
  Star,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  User,
  Tag,
  Loader2,
  Sparkles,
  ChevronRight,
  X,
  type LucideIcon,
  AlertCircle,
} from 'lucide-react';
import { getGameById, GAMES_CATALOG, getServiceMeta } from '@/lib/games';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Target,
  Swords,
  TrendingUp,
  Zap,
  Medal,
  Users,
  Banknote,
  Gamepad2,
  Crosshair,
  Shield,
};

const AVATAR_BG_COLORS = [
  'bg-white text-zinc-950',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-black',
  'bg-cyan-500 text-black',
  'bg-purple-500 text-white',
  'bg-rose-500 text-white',
];

interface MarketplaceService {
  id: string;
  gameCode: string;
  serviceType?: string;
  slug?: string;
  name: string;
  desc?: string;
  pricingType: 'PER_UNIT' | 'FIXED' | 'TIER_MATRIX';
  price: number;
  multiplier?: number;
  unitName?: string;
  depositPercent: number;
  requiredFields?: string[];
  isActive?: boolean;
  booster: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
    completedOrders: number;
    coupon?: {
      code: string;
      discountPercent: number;
      isActive: boolean;
    } | null;
  };
}

interface BoosterItem {
  _id: string;
  username: string;
  avatar?: string;
  displayName?: string;
  rating: number;
  completedOrders?: number;
  services: string[];
  selectedGames?: string[];
  games: {
    gameCode: string;
    ranks: string[];
    servers: string[];
  }[];
  booster_info?: {
    isReady?: boolean;
    ranks?: string[];
    services?: string[];
    completed_orders?: number;
    rating?: number;
    service_settings?: {
      selectedGames?: string[];
      customServices?: Array<{
        id: string;
        gameCode?: string;
        serviceType?: string;
        slug?: string;
        name: string;
        desc?: string;
        pricingType: string;
        price?: number;
        unitName?: string;
        depositPercent?: number;
        isActive?: boolean;
      }>;
      enabledServices?: string[];
    };
  };
}

interface GroupedService {
  serviceType: string;
  name: string;
  desc: string;
  pricingType: string;
  depositPercent: number;
  iconName: string;
  boosters: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    rating: number;
  }[];
  count: number;
}

function GameServicesContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const gameId = (params?.game as string) || 'lol';
  const game = getGameById(gameId) || GAMES_CATALOG[0];

  // Active View Tab: 'SERVICES' or 'BOOSTERS'
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'BOOSTERS'>('SERVICES');

  // Services State từ Database
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Boosters State
  const [boosters, setBoosters] = useState<BoosterItem[]>([]);
  const [loadingBoosters, setLoadingBoosters] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  // Modal Thuê Tuyển Thủ: State tuyển thủ đang được chọn để mở danh sách dịch vụ
  const [selectedBoosterForHire, setSelectedBoosterForHire] = useState<BoosterItem | null>(null);

  // 1. Fetch Services cho Game từ backend API thực tế
  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const gameCode = game.id.toUpperCase();
        const res = await fetch(`/api/boosters/marketplace/services?gameCode=${encodeURIComponent(gameCode)}`);
        if (res.ok) {
          const data = await res.json();
          setServices(data.data || []);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách dịch vụ:', err);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [game.id]);

  // 2. Fetch Boosters cho Game
  useEffect(() => {
    const fetchBoosters = async () => {
      setLoadingBoosters(true);
      try {
        const query = new URLSearchParams({
          game: game.id.toUpperCase(),
        });
        const res = await fetch(`/api/boosters?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBoosters(data.boosters || []);
        } else {
          setBoosters([]);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách tuyển thủ:', err);
        setBoosters([]);
      } finally {
        setLoadingBoosters(false);
      }
    };

    fetchBoosters();
  }, [game.id]);

  // 3. Gom nhóm dịch vụ theo serviceType dựa trên dữ liệu thật từ DB (Chuẩn hóa hiển thị theo bản vẽ của User)
  const groupedServices = useMemo(() => {
    const map = new Map<string, GroupedService>();
    const normGame = game.id.toUpperCase();

    for (const s of services) {
      if (s.isActive === false) continue;

      const sGame = (s.gameCode || 'LOL').toUpperCase();
      const matchGame = sGame === normGame || (normGame === 'LOL' && sGame === 'LMHT');
      if (!matchGame) continue;

      // Kiểm tra booster của dịch vụ có chọn nhận cày tựa game này không
      if (s.booster) {
        const boosterSelectedGames =
          (s.booster as any).booster_info?.service_settings?.selectedGames ||
          (s.booster as any).selectedGames;
        if (Array.isArray(boosterSelectedGames) && boosterSelectedGames.length > 0) {
          const isSelected = boosterSelectedGames.some((g: string) => {
            const code = (g || '').toUpperCase();
            return (
              code === normGame ||
              (normGame === 'LOL' && (code === 'LMHT' || code === 'LEAGUE')) ||
              (normGame === 'TFT' && code === 'DTCL') ||
              (normGame === 'AOV' && code === 'LIENQUAN')
            );
          });
          if (!isSelected) continue;
        }
      }

      const sType = s.serviceType || s.slug || 'custom';
      if (!map.has(sType)) {
        const meta = getServiceMeta(game.id, sType);
        map.set(sType, {
          serviceType: sType,
          name: s.name || meta?.name || 'Dịch vụ cày thuê',
          desc: s.desc || meta?.desc || 'Dịch vụ leo rank và cày thuê chuyên nghiệp.',
          pricingType: s.pricingType || meta?.pricingType || 'FIXED',
          depositPercent: s.depositPercent ?? meta?.depositPercent ?? 100,
          iconName: meta?.iconName || 'Trophy',
          boosters: [],
          count: 0,
        });
      }

      const group = map.get(sType)!;
      group.count += 1;
      if (s.booster && !group.boosters.some((b) => b._id === s.booster._id)) {
        group.boosters.push(s.booster);
      }
    }

    // Lọc theo search term
    return Array.from(map.values()).filter((g) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q) ||
        g.boosters.some(
          (b) =>
            b.username.toLowerCase().includes(q) ||
            b.displayName.toLowerCase().includes(q)
        )
      );
    });
  }, [services, game.id, searchTerm]);

  // Helper: Lấy danh sách dịch vụ đang HOẠT ĐỘNG (Active) của Booster cho tựa game này
  const getBoosterActiveServices = (b: BoosterItem) => {
    const normGame = game.id.toUpperCase();

    // 0. BẮT BUỘC: Kiểm tra Booster có nhận cày tựa game này trong selectedGames không!
    const boosterSelectedGames =
      b.booster_info?.service_settings?.selectedGames ||
      b.selectedGames ||
      b.games?.map((g) => g.gameCode) ||
      [];

    if (Array.isArray(boosterSelectedGames) && boosterSelectedGames.length > 0) {
      const isGameSelected = boosterSelectedGames.some((g: string) => {
        const s = (g || '').toUpperCase();
        return (
          s === normGame ||
          (normGame === 'LOL' && (s === 'LMHT' || s === 'LEAGUE')) ||
          (normGame === 'TFT' && s === 'DTCL') ||
          (normGame === 'AOV' && s === 'LIENQUAN') ||
          (normGame === 'WILDRIFT' && (s === 'WR' || s === 'TOCCHIEN'))
        );
      });
      // Nếu booster không chọn nhận cày tựa game này -> trả về [] ngay lập tức
      if (!isGameSelected) {
        return [];
      }
    }

    // 1. Ưu tiên kiểm tra trong b.booster_info?.service_settings?.customServices (cấu hình studio của chính booster)
    const customInBooster = b.booster_info?.service_settings?.customServices;
    if (Array.isArray(customInBooster)) {
      const activeForGame = customInBooster.filter((s) => {
        const sGame = (s.gameCode || 'LOL').toUpperCase();
        const matchGame = sGame === normGame || (normGame === 'LOL' && sGame === 'LMHT');
        return matchGame && s.isActive !== false;
      });

      // Nếu booster có customServices: CHỈ TRẢ VỀ CÁC DỊCH VỤ ACTIVE CỦA HỌ
      // (Nếu booster tắt hết dịch vụ thì activeForGame rỗng -> trả về rỗng, TUYỆT ĐỐI KHÔNG FALLBACK TẤT CẢ GÓI SÀN)
      return activeForGame.map((s) => ({
        slug: s.serviceType || s.slug || 'rank-boost',
        name: s.name,
        desc: s.desc || 'Dịch vụ được cung cấp bởi tuyển thủ.',
        pricingType: s.pricingType,
        depositPercent: s.depositPercent ?? 100,
        price: s.price,
        unitName: s.unitName,
        iconName: getServiceMeta(normGame, s.serviceType || s.slug || '')?.iconName || 'Trophy',
      }));
    }

    // 2. Tìm trong danh sách marketplace services đã fetch từ backend cho game này
    const marketplaceActive = services.filter((s) => {
      const matchBooster =
        s.booster?._id === b._id ||
        (s.booster?.username && s.booster.username.toLowerCase() === b.username.toLowerCase());
      const sGame = (s.gameCode || 'LOL').toUpperCase();
      const matchGame = sGame === normGame || (normGame === 'LOL' && sGame === 'LMHT');
      return matchBooster && matchGame && s.isActive !== false;
    });

    if (marketplaceActive.length > 0) {
      return marketplaceActive.map((s) => ({
        slug: s.serviceType || s.slug || 'rank-boost',
        name: s.name,
        desc: s.desc || 'Dịch vụ được cung cấp bởi tuyển thủ.',
        pricingType: s.pricingType,
        depositPercent: s.depositPercent ?? 100,
        price: s.price,
        unitName: s.unitName,
        iconName: getServiceMeta(normGame, s.serviceType || s.slug || '')?.iconName || 'Trophy',
      }));
    }

    // TUYỆT ĐỐI KHÔNG DÙNG MOCKDATA / FALLBACK TẤT CẢ DỊCH VỤ SÀN!
    // Nếu booster không có dịch vụ nào trong DB cho game này -> trả về mảng rỗng []
    return [];
  };

  // 4. Lọc Boosters: CHỈ hiển thị những booster thực sự có dịch vụ ACTIVE cho game này
  const filteredBoosters = useMemo(() => {
    return boosters.filter((b) => {
      // Bắt buộc booster phải có ít nhất 1 dịch vụ đang kích hoạt (active) cho game này
      const activeServices = getBoosterActiveServices(b);
      if (activeServices.length === 0) {
        return false;
      }

      const q = searchTerm.toLowerCase().trim();
      const matchName =
        !q ||
        b.username.toLowerCase().includes(q) ||
        (b.displayName && b.displayName.toLowerCase().includes(q));

      const matchServer =
        !selectedServer ||
        b.games?.some((g) => g.servers?.includes(selectedServer));

      return matchName && matchServer;
    });
  }, [boosters, searchTerm, selectedServer, services, game.id]);

  // 5. Danh sách dịch vụ cụ thể của Tuyển thủ đang được chọn để hiển thị trong Modal Thuê
  const boosterHireServices = useMemo(() => {
    if (!selectedBoosterForHire) return [];
    return getBoosterActiveServices(selectedBoosterForHire);
  }, [selectedBoosterForHire, services, game.id]);

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-24 pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <BackButton />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap py-1 scrollbar-none max-w-full">
            <Link href="/services" className="hover:text-white transition-colors shrink-0">
              Tất cả Games
            </Link>
            <ChevronRight size={13} className="text-zinc-600 shrink-0" />
            <span className="text-white font-bold truncate shrink-0">{game.name}</span>
          </nav>
        </div>

        {/* Hero Header */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 bg-gradient-to-r ${game.gradient} overflow-hidden shadow-2xl`}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                <Gamepad2 size={13} />
                <span>{game.shortName} Marketplace</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md mb-2">
                Sàn Dịch Vụ {game.name}
              </h1>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                Khám phá các gói dịch vụ cày thuê do tuyển thủ tự niêm yết giá hoặc lựa chọn tuyển thủ hàng đầu để thuê trực tiếp.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-blue-400">
                  {groupedServices.length}
                </div>
                <div className="text-[11px] font-semibold text-zinc-400">
                  Gói Dịch Vụ
                </div>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-center min-w-[100px]">
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {filteredBoosters.length}
                </div>
                <div className="text-[11px] font-semibold text-zinc-400">
                  Tuyển Thủ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Tab Switcher: Services Marketplace vs Boosters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 bg-zinc-900/80 border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('SERVICES')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'SERVICES'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Swords size={16} />
              <span>Gói Dịch Vụ ({groupedServices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('BOOSTERS')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'BOOSTERS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              <span>Danh Sách Tuyển Thủ ({filteredBoosters.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'SERVICES'
                  ? 'Tìm theo tên gói hoặc tuyển thủ...'
                  : 'Tìm tuyển thủ theo tên...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* TAB 1: GÓI DỊCH VỤ MARKETPLACE (Khớp 100% bản vẽ tay của User) */}
        {activeTab === 'SERVICES' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Swords size={20} className="text-blue-400" />
                  <span>Chọn loại dịch vụ bạn cần</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Nhấn vào dịch vụ để xem danh sách tuyển thủ và bảng giá chi tiết của từng tuyển thủ.
                </p>
              </div>
            </div>

            {loadingServices ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-zinc-400 text-sm">Đang tải danh mục dịch vụ từ tuyển thủ...</p>
              </div>
            ) : groupedServices.length === 0 ? (
              /* EMPTY STATE: Chưa có tuyển thủ nào niêm yết dịch vụ */
              <div className="p-8 sm:p-14 rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                  <Gamepad2 size={32} />
                </div>
                <div className="max-w-md">
                  <h3 className="text-base font-bold text-white mb-1">
                    Hiện chưa có gói dịch vụ nào cho {game.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Các tuyển thủ hiện đang cập nhật bảng giá dịch vụ cho tựa game này. Bạn có thể xem danh sách tuyển thủ đang online để thuê trực tiếp hoặc gửi yêu cầu cày thuê!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('BOOSTERS')}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                >
                  <Users size={16} />
                  <span>Xem Danh Sách Tuyển Thủ Đang Online</span>
                </button>
              </div>
            ) : (
              /* HIỂN THỊ LƯỚI CARD KHỚP 100% BẢN VẼ TAY CỦA USER */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {groupedServices.map((group) => {
                  const IconComp = ICON_MAP[group.iconName] || Trophy;
                  const isDeposit = group.depositPercent < 100;
                  const displayBoosters = group.boosters.slice(0, 3);
                  const remainingCount = group.boosters.length > 3 ? group.boosters.length - 3 : 0;

                  return (
                    <Link
                      key={group.serviceType}
                      href={`/services/${game.id}/${group.serviceType}`}
                      className="group bg-[#0c101d] hover:bg-[#11172a] border border-blue-500/30 hover:border-blue-500 rounded-3xl p-5 shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Top: Icon + Badge */}
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                            <IconComp size={22} />
                          </div>
                          <span
                            className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                              isDeposit
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isDeposit ? `Cọc ${group.depositPercent}%` : 'Trọn gói'}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-extrabold text-white text-base tracking-tight group-hover:text-blue-400 transition-colors mb-1.5">
                            {group.name}
                          </h3>
                          <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed min-h-[34px]">
                            {group.desc}
                          </p>
                        </div>
                      </div>

                      {/* PHẦN ĐÁY: CHẤM TRÒN AVATAR BOOSTER + (+N) + MŨI TÊN (Khớp 100% bản vẽ tay) */}
                      <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-2 overflow-hidden">
                            {displayBoosters.map((b, idx) => {
                              const colorClass = AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length];
                              const initial = (b.displayName || b.username || 'B').slice(0, 1).toUpperCase();

                              return (
                                <div
                                  key={b._id || idx}
                                  title={b.displayName || b.username || `Tuyển thủ #${idx + 1}`}
                                  className="relative inline-block w-8 h-8 rounded-full ring-2 ring-[#0c101d] overflow-hidden shrink-0 shadow-md"
                                >
                                  {b.avatar ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={b.avatar}
                                      alt={b.displayName || b.username || ''}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = '/default-avatar.png';
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className={`w-full h-full flex items-center justify-center text-xs font-black ${colorClass}`}
                                    >
                                      {initial}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {remainingCount > 0 && (
                            <span className="text-xs font-black text-amber-400 pl-0.5">
                              +{remainingCount}
                            </span>
                          )}
                        </div>

                        <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-600 border border-white/10 group-hover:border-blue-500 flex items-center justify-center text-white transition-all duration-200 group-hover:translate-x-1 shadow-md">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DANH SÁCH TUYỂN THỦ (SELLERS) */}
        {activeTab === 'BOOSTERS' && (
          <div>
            {loadingBoosters ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-zinc-400 text-sm">Đang tải danh sách tuyển thủ...</p>
              </div>
            ) : filteredBoosters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBoosters.map((booster) => {
                  const isReady = booster.booster_info?.isReady ?? true;
                  const completedCount =
                    booster.completedOrders || booster.booster_info?.completed_orders || 0;

                  return (
                    <div
                      key={booster._id}
                      className="group bg-zinc-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Avatar & Online status */}
                        <div className="flex items-start gap-3.5 mb-4">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors bg-zinc-800 shrink-0">
                            {booster.avatar ? (
                              <img
                                src={booster.avatar}
                                alt={booster.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-full h-full p-2 text-zinc-500" />
                            )}
                            <div
                              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                                isReady ? 'bg-emerald-500' : 'bg-zinc-500'
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h3 className="font-extrabold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                                {booster.displayName || booster.username}
                              </h3>
                              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <div className={`flex items-center gap-1 font-bold ${booster.rating && booster.rating > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                <Star className={`w-3.5 h-3.5 ${booster.rating && booster.rating > 0 ? 'fill-amber-400' : 'fill-zinc-600 text-zinc-600'}`} />
                                <span>{booster.rating && booster.rating > 0 ? booster.rating.toFixed(1) : '0.0'}</span>
                              </div>
                              <span className="text-zinc-600">·</span>
                              <span className="text-zinc-400 font-medium">
                                {completedCount} đơn hoàn thành
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status pill */}
                        <div className="mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                              isReady
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                              }`}
                            />
                            {isReady ? 'Sẵn sàng nhận đơn' : 'Đang bận'}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                        <Link
                          href={`/b/${booster.username}`}
                          className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center transition-colors"
                        >
                          Hồ sơ chi tiết
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedBoosterForHire(booster)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
                        >
                          Thuê tuyển thủ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 rounded-3xl border border-dashed border-white/10 text-center">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  Không tìm thấy tuyển thủ nào
                </h3>
                <p className="text-xs text-zinc-400">
                  Thử thay đổi bộ lọc tìm kiếm hoặc quay lại sau.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal Chọn Dịch Vụ Tuyển Thủ Cung Cấp */}
        {selectedBoosterForHire && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#0f0f12] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 shrink-0">
                    <Image
                      src={selectedBoosterForHire.avatar || '/images/default-avatar.png'}
                      alt={selectedBoosterForHire.displayName || selectedBoosterForHire.username}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-white text-lg truncate">
                        {selectedBoosterForHire.displayName || selectedBoosterForHire.username}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    </div>
                    <p className="text-xs text-zinc-400">
                      Chọn dịch vụ <span className="text-blue-400 font-semibold">{game.name}</span> bạn muốn tuyển thủ này thực hiện:
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBoosterForHire(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Danh sách gói dịch vụ mà booster cung cấp */}
              <div className="overflow-y-auto py-4 space-y-3 pr-1">
                {boosterHireServices.length > 0 ? (
                  boosterHireServices.map((svc) => {
                    const SvcIcon = ICON_MAP[svc.iconName] || Trophy;
                    const hireUrl = `/services/${game.id}/${svc.slug}?booster=@${encodeURIComponent(selectedBoosterForHire.username)}`;

                    return (
                      <div
                        key={svc.slug}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-blue-500/30 transition-all group"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                            <SvcIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                                {svc.name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Cọc {svc.depositPercent}%
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2">
                              {svc.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          <Link
                            href={hireUrl}
                            onClick={() => setSelectedBoosterForHire(null)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
                          >
                            <span>Chọn cày gói này</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-zinc-950/40">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <h4 className="text-white font-bold text-sm mb-1">
                      Tuyển thủ hiện chưa mở dịch vụ nào
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Tuyển thủ này chưa kích hoạt hoặc đã tạm tắt toàn bộ gói dịch vụ cho tựa game {game.name}. Vui lòng quay lại sau hoặc chọn tuyển thủ khác!
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span className="text-[11px] sm:text-xs">Bảo chứng giao dịch an toàn 100% qua LeoRank</span>
                <button
                  type="button"
                  onClick={() => setSelectedBoosterForHire(null)}
                  className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GameServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] flex items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <GameServicesContent />
    </Suspense>
  );
}
