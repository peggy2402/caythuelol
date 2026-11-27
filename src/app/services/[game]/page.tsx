// src/app/services/[game]/page.tsx
'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Loader2 } from 'lucide-react';
import { getGameById, GAMES_CATALOG, getServiceMeta, STANDARD_SERVICE_TEMPLATES } from '@/lib/games';

import {
  MarketplaceService,
  BoosterItem,
  GroupedService,
} from './components/types';
import { GameHeroBanner } from './components/GameHeroBanner';
import { GameTabsAndSearch } from './components/GameTabsAndSearch';
import { GameServicesTab } from './components/GameServicesTab';
import { GameBoostersTab } from './components/GameBoostersTab';
import { BoosterHireModal } from './components/BoosterHireModal';

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

  // Modal Thuê Booster: State Booster đang được chọn để mở danh sách dịch vụ
  const [selectedBoosterForHire, setSelectedBoosterForHire] = useState<BoosterItem | null>(null);

  // Lắng nghe phím ESC & Khóa cuộn trang khi mở Modal chọn dịch vụ Booster
  useEffect(() => {
    if (!selectedBoosterForHire) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBoosterForHire(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBoosterForHire]);

  // Đọc query param ?tab=boosters hoặc ?tab=services từ URL để auto switch tab
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'boosters' || tabParam === 'sellers') {
      setActiveTab('BOOSTERS');
    } else if (tabParam === 'services') {
      setActiveTab('SERVICES');
    }
  }, [searchParams]);

  // 1. Fetch Marketplace Services cho Game
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
        console.error('Lỗi tải danh sách Booster:', err);
        setBoosters([]);
      } finally {
        setLoadingBoosters(false);
      }
    };

    fetchBoosters();
  }, [game.id]);

  // 3. Gom nhóm dịch vụ theo serviceType dựa trên dữ liệu thật từ DB
  const groupedServices = useMemo(() => {
    const map = new Map<string, GroupedService>();
    const normGame = game.id.toUpperCase();

    const standardTemplates =
      STANDARD_SERVICE_TEMPLATES[normGame] ||
      STANDARD_SERVICE_TEMPLATES['UNIVERSAL'] ||
      STANDARD_SERVICE_TEMPLATES['LOL'] ||
      [];

    for (const t of standardTemplates) {
      if (t.slug === 'duo-boost' || (t as any).serviceType === 'duo-boost') continue;
      map.set(t.slug, {
        serviceType: t.slug,
        name: t.name,
        desc: t.desc,
        pricingType: t.pricingType,
        depositPercent: t.depositPercent,
        iconName: t.iconName,
        boosters: [],
        count: 0,
      });
    }

    for (const s of services) {
      if (s.isActive === false) continue;
      if (s.slug === 'duo-boost' || s.serviceType === 'duo-boost') continue;

      const sGame = (s.gameCode || 'LOL').toUpperCase();
      const matchGame =
        sGame === normGame ||
        (normGame === 'LOL' && sGame === 'LMHT') ||
        (normGame === 'AOV' && ['LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(sGame));
      if (!matchGame) continue;

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
      const meta = getServiceMeta(game.id, sType);

      if (!map.has(sType)) {
        map.set(sType, {
          serviceType: sType,
          name: meta?.name || s.name || 'Dịch vụ cày thuê',
          desc: meta?.desc || s.desc || 'Dịch vụ leo rank và cày thuê chuyên nghiệp.',
          pricingType: meta?.pricingType || s.pricingType || 'FIXED',
          depositPercent: meta?.depositPercent ?? s.depositPercent ?? 100,
          iconName: meta?.iconName || 'Trophy',
          boosters: [],
          count: 0,
        });
      } else {
        const group = map.get(sType)!;
        if (meta) {
          group.name = meta.name;
          group.desc = meta.desc;
          group.iconName = meta.iconName;
          group.pricingType = meta.pricingType;
          group.depositPercent = meta.depositPercent;
        }
      }

      const group = map.get(sType)!;
      group.count += 1;
      if (s.booster && !group.boosters.some((b) => b._id === s.booster._id)) {
        group.boosters.push(s.booster);
      }
    }

    const list = Array.from(map.values()).filter((g) => {
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

    return list.sort((a, b) => {
      const aHas = a.boosters.length > 0 ? 1 : 0;
      const bHas = b.boosters.length > 0 ? 1 : 0;
      return bHas - aHas;
    });
  }, [services, game.id, searchTerm]);

  // Helper: Lấy danh sách dịch vụ active của Booster
  const getBoosterActiveServices = (b: BoosterItem) => {
    const normGame = game.id.toUpperCase();

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
      if (!isGameSelected) return [];
    }

    const customInBooster = b.booster_info?.service_settings?.customServices;
    if (Array.isArray(customInBooster)) {
      const activeForGame = customInBooster.filter((s) => {
        const sGame = (s.gameCode || 'LOL').toUpperCase();
        const matchGame =
          sGame === normGame ||
          (normGame === 'LOL' && sGame === 'LMHT') ||
          (normGame === 'AOV' && ['LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(sGame));
        return matchGame && s.isActive !== false && s.serviceType !== 'duo-boost' && s.slug !== 'duo-boost';
      });

      return activeForGame.map((s) => {
        const meta = getServiceMeta(normGame, s.serviceType || s.slug || '');
        return {
          slug: s.serviceType || s.slug || 'rank-boost',
          name: meta?.name || s.name || 'Dịch vụ cày thuê',
          desc: meta?.desc || s.desc || 'Dịch vụ được cung cấp bởi Booster.',
          pricingType: meta?.pricingType || s.pricingType,
          depositPercent: s.depositPercent ?? meta?.depositPercent ?? 100,
          price: s.price,
          unitName: s.unitName,
          iconName: meta?.iconName || 'Trophy',
        };
      });
    }

    const marketplaceActive = services.filter((s) => {
      const matchBooster =
        s.booster?._id === b._id ||
        (s.booster?.username && s.booster.username.toLowerCase() === b.username.toLowerCase());
      const sGame = (s.gameCode || 'LOL').toUpperCase();
      const matchGame =
        sGame === normGame ||
        (normGame === 'LOL' && sGame === 'LMHT') ||
        (normGame === 'AOV' && ['LIENQUAN', 'LQM', 'ARENA_OF_VALOR'].includes(sGame));
      return matchBooster && matchGame && s.isActive !== false && s.serviceType !== 'duo-boost' && s.slug !== 'duo-boost';
    });

    if (marketplaceActive.length > 0) {
      return marketplaceActive.map((s) => {
        const meta = getServiceMeta(normGame, s.serviceType || s.slug || '');
        return {
          slug: s.serviceType || s.slug || 'rank-boost',
          name: meta?.name || s.name || 'Dịch vụ cày thuê',
          desc: meta?.desc || s.desc || 'Dịch vụ được cung cấp bởi Booster.',
          pricingType: meta?.pricingType || s.pricingType,
          depositPercent: s.depositPercent ?? meta?.depositPercent ?? 100,
          price: s.price,
          unitName: s.unitName,
          iconName: meta?.iconName || 'Trophy',
        };
      });
    }

    return [];
  };

  // 4. Lọc Boosters
  const filteredBoosters = useMemo(() => {
    return boosters.filter((b) => {
      const activeServices = getBoosterActiveServices(b);
      if (activeServices.length === 0) return false;

      if (selectedServer) {
        const hasServer = b.games?.some(
          (g) =>
            (g.gameCode === game.id.toUpperCase() ||
              (game.id.toUpperCase() === 'LOL' && g.gameCode === 'LMHT')) &&
            g.servers?.includes(selectedServer)
        );
        if (!hasServer) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName =
          b.username.toLowerCase().includes(term) ||
          (b.displayName && b.displayName.toLowerCase().includes(term));
        const matchService = activeServices.some((s) => s.name.toLowerCase().includes(term));
        if (!matchName && !matchService) return false;
      }

      return true;
    });
  }, [boosters, selectedServer, searchTerm, game.id, services]);

  const boosterHireServices = useMemo(() => {
    if (!selectedBoosterForHire) return [];
    return getBoosterActiveServices(selectedBoosterForHire);
  }, [selectedBoosterForHire, services, game.id]);

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* 1. Hero Banner Component */}
        <GameHeroBanner
          game={game}
          servicesCount={groupedServices.length}
          boostersCount={filteredBoosters.length}
        />

        {/* 2. Switcher & Search Component */}
        <GameTabsAndSearch
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          servicesCount={groupedServices.length}
          boostersCount={filteredBoosters.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          servicesList={groupedServices}
          boostersList={filteredBoosters}
        />

        {/* 3. Tab Gói Dịch Vụ */}
        {activeTab === 'SERVICES' && (
          <GameServicesTab
            game={game}
            groupedServices={groupedServices}
            loadingServices={loadingServices}
            onSwitchToBoosters={() => setActiveTab('BOOSTERS')}
          />
        )}

        {/* 4. Tab Danh Sách Booster */}
        {activeTab === 'BOOSTERS' && (
          <GameBoostersTab
            game={game}
            filteredBoosters={filteredBoosters}
            loadingBoosters={loadingBoosters}
            onSelectBoosterForHire={(b) => setSelectedBoosterForHire(b)}
          />
        )}

        {/* 5. Modal Chọn Dịch Vụ Của Booster */}
        <BoosterHireModal
          game={game}
          selectedBooster={selectedBoosterForHire}
          onClose={() => setSelectedBoosterForHire(null)}
          boosterHireServices={boosterHireServices}
        />
      </main>
    </div>
  );
}

export default function GameServicesPage() {
  return (
    <Suspense
      fallback={<BarLoader fullScreen className="bg-[#070709]" />}
    >
      <GameServicesContent />
    </Suspense>
  );
}
