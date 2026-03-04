'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { 
  Trophy, TrendingUp, Medal, Zap, Target, Swords,
  CheckCircle2, AlertCircle, Loader2, Search,
  ShieldCheck, Clock, Star, ChevronRight, Flame, ChevronLeft, Calendar,
  Video, Users, Map, User, Lock, LogIn, MousePointerClick, Filter, Gamepad2
} from 'lucide-react';
import { toast } from 'sonner';
import ChampionModal from '@/components/champion/ChampionModal';
import Navbar from '@/components/Navbar';

// --- TYPES ---
type ServiceType = 'RANK_BOOST' | 'PROMOTION' | 'MASTERY' | 'LEVELING' | 'NET_WINS' | 'PLACEMENTS';

type BoosterConfig = {
    servers: string[];
    rankPrices: Record<string, number>;
    rankPricesFlex?: Record<string, number>;
    promotionPrices: Record<string, number>;
    promotionPricesFlex?: Record<string, number>;
    placementPrices: Record<string, number>;
    placementPricesFlex?: Record<string, number>;
    playingChampions: string[];
    levelingPrices: Record<string, number>;
    netWinPrices: Record<string, number>;
    netWinPricesFlex?: Record<string, number>;
    masteryPrices: Record<string, number>;
    lpModifiers: {
      low: number;
      medium: number;
      high: number;
    };
    queueModifiers?: Record<string, number>;
    options: {
      schedule: boolean;
      roles: string[];
      specificChamps: number;
      streaming: number;
      express: number;
      duo: number;
    };
};

interface Booster {
  _id: string;
  username: string;
  profile: { avatar?: string };
  booster_info?: { 
    ranks: string[]; 
    rating: number; 
    completed_orders: number; 
    bio: string;
    services?: string[]; // List of supported services
    service_settings?: BoosterConfig;
  };
  booster_config?: BoosterConfig;
}

interface Champion {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
  info: { attack: number; defense: number; magic: number; difficulty: number };
  partype: string;
  stats: any;
}

// --- CONSTANTS ---
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];
const SERVERS = ['VN', 'KR', 'JP', 'EUW', 'NA'];
const ACCOUNT_TYPES = ['Riot', 'Facebook', 'Google', 'Apple', 'Xbox', 'PlayStation'];
const PROMOTION_RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond'];

// Generate Flat Tiers List (Iron IV -> Challenger)
const FLAT_TIERS = (() => {
  const list: { key: string; label: string }[] = [];
  RANKS.forEach(rank => {
    if (['Master', 'Grandmaster', 'Challenger'].includes(rank)) {
      list.push({ key: rank.toUpperCase(), label: rank });
    } else {
      DIVISIONS.forEach(div => {
        list.push({ key: `${rank.toUpperCase()}_${div}`, label: `${rank} ${div}` });
      });
    }
  });
  return list;
})();

// Filter for RANK_BOOST (Iron IV -> Master only)
const RANK_BOOST_TIERS = FLAT_TIERS.filter(t => !['GRANDMASTER', 'CHALLENGER'].includes(t.key.split('_')[0]));

const SERVICE_KEYS: Record<string, string> = {
  RANK_BOOST: 'svcRankBoost',
  PROMOTION: 'svcPromotion',
  MASTERY: 'svcMastery',
  LEVELING: 'svcLeveling',
  NET_WINS: 'svcNetWins',
  PLACEMENTS: 'svcPlacements',
};

const SERVICE_ICONS: Record<string, any> = {
  RANK_BOOST: Trophy,
  PROMOTION: TrendingUp,
  MASTERY: Medal,
  LEVELING: Zap,
  NET_WINS: Target,
  PLACEMENTS: Swords,
};

// --- SUB-COMPONENTS ---

const OptionCard = ({ label, price, checked, onChange, icon: Icon, badge, description }: any) => (
  <div
    onClick={() => onChange(!checked)}
    className={`relative group cursor-pointer rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 ${
      checked
        ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
        : 'border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60'
    }`}
  >
    {badge && (
      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
        <Flame className="w-3 h-3" /> {badge}
      </span>
    )}
    <div className="flex items-start gap-4">
      <div className={`p-2.5 rounded-lg transition-colors ${checked ? 'bg-blue-500 text-white' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className={`font-bold text-sm transition-colors ${checked ? 'text-white' : 'text-zinc-300'}`}>{label}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        <p className={`text-xs font-medium mt-1.5 ${checked ? 'text-blue-400' : 'text-zinc-500'}`}>{price}</p>
      </div>
    </div>
    {checked && (
      <div className="absolute top-3 right-3 text-blue-500">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    )}
  </div>
);

const ModifierDisplay = ({ label, value }: { label: string, value: number }) => {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className={isPositive ? 'text-red-400' : 'text-green-400'}>
        {isPositive ? 'Tăng giá' : 'Giảm giá'} {isPositive ? '+' : ''}{value}%
      </span>
    </div>
  );
};

function ServicesContent() {
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Refs for scrolling
  const serviceSectionRef = useRef<HTMLDivElement>(null);

  // Data State
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Selection State
  const [selectedBooster, setSelectedBooster] = useState<Booster | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceType | null>(null);
  
  // Filter State
  const [filterServer, setFilterServer] = useState('VN');
  const [filterService, setFilterService] = useState<string>('');

  // UI State
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [currentTier, setCurrentTier] = useState('SILVER_IV');
  const [desiredTier, setDesiredTier] = useState('GOLD_IV');
  const [currentLP, setCurrentLP] = useState('0-20');
  const [lpGain, setLpGain] = useState('19');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [desiredLevel, setDesiredLevel] = useState(30);
  const [currentMastery, setCurrentMastery] = useState(1);
  const [desiredMastery, setDesiredMastery] = useState(10);
  const [selectedChamp, setSelectedChamp] = useState<Champion | null>(null);
  const [numGames, setNumGames] = useState(5);
  const [prevRank, setPrevRank] = useState('Gold');
  const [server, setServer] = useState('VN');
  const [accType, setAccType] = useState('Riot');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [queueType, setQueueType] = useState('SOLO_DUO');
  const [scheduleTime, setScheduleTime] = useState({ start: '08:00', end: '22:00' });

  // Net Wins Specific State
  const [nwCurrentRank, setNwCurrentRank] = useState('Master');
  const [nwCurrentLP, setNwCurrentLP] = useState(0);
  const [nwDesiredLP, setNwDesiredLP] = useState(100);

  // Options
  const [optLane, setOptLane] = useState(false);
  const [optChamp, setOptChamp] = useState(false);
  const [optStream, setOptStream] = useState(false);
  const [optSpeed, setOptSpeed] = useState(false);
  const [optDuo, setOptDuo] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Fetch User
    const userData = localStorage.getItem('user');
    if (userData) {
      try { setUser(JSON.parse(userData)); } catch (e) {}
    }

    // Fetch Champions
    fetch('/api/champions')
      .then(res => res.json())
      .then(data => setChampions(data))
      .catch(err => console.error(err));
  }, []);

  // Fetch Boosters when filters change
  useEffect(() => {
    const fetchBoosters = async () => {
      try {
        const params = new URLSearchParams();
        if (filterServer) params.append('server', filterServer);
        if (filterService) params.append('service', filterService);
        const res = await fetch(`/api/boosters?${params.toString()}`);
        const data = await res.json();
        setBoosters(data.boosters || []);
      } catch (err) { console.error(err); }
    };
    fetchBoosters();
  }, [filterServer, filterService]);

  // Handle URL param for booster
  useEffect(() => {
    const boosterId = searchParams.get('booster');
    if (boosterId && boosters.length > 0) {
      const found = boosters.find(b => b._id === boosterId);
      if (found) {
        setSelectedBooster(found);
        // Default to first available service or RANK_BOOST
        const availableServices = found.booster_info?.services || [];
        if (availableServices.length > 0) {
             // Map string to ServiceType if needed, assuming direct match for now
             setActiveTab(availableServices[0] as ServiceType);
        } else {
             setActiveTab('RANK_BOOST');
        }

        // Scroll to service section if booster is pre-selected
        setTimeout(() => {
            serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, [searchParams, boosters]);

  // Filter services based on selected booster
  const availableServiceTypes = useMemo(() => {
    if (!selectedBooster) return [];
    // If booster has specific services defined, use them. Otherwise default to all.
    // In a real app, this would come from the API. For now, we simulate all services are available or filter if data exists.
    const services = selectedBooster.booster_info?.services;
    if (services && services.length > 0) {
        return services as ServiceType[];
    }
    
    return Object.keys(SERVICE_ICONS) as ServiceType[];
  }, [selectedBooster]);

  // Update server selection when booster changes
  useEffect(() => {
    if (selectedBooster?.booster_config?.servers?.length) {
        setServer(selectedBooster.booster_config.servers[0]);
    }
  }, [selectedBooster]);

  // --- LOGIC ---
  const handleSelectBooster = (booster: Booster) => {
    setSelectedBooster(booster);
    
    // Reset or set default service tab
    const services = booster.booster_info?.services;
    if (services && services.length > 0) {
        if (!activeTab || !services.includes(activeTab)) {
            setActiveTab(services[0] as ServiceType);
        }
    } else {
        if (!activeTab) setActiveTab('RANK_BOOST');
    }

    // Smooth scroll to service section
    setTimeout(() => {
        serviceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const calculateTotal = () => {
    const config = selectedBooster?.booster_config || selectedBooster?.booster_info?.service_settings;
    // Nếu chưa chọn Booster hoặc Booster chưa có config, trả về 0
    if (!config) return 0;

    // Helper: Tra cứu giá an toàn (Case-insensitive)
    // Giúp tìm được giá dù key trong DB là "SILVER", "Silver" hay "silver"
    const getPrice = (prices: Record<string, number> | undefined, key: string): number => {
        if (!prices) return 0;
        if (prices[key] !== undefined) return prices[key];
        if (prices[key.toUpperCase()] !== undefined) return prices[key.toUpperCase()];
        if (prices[key.toLowerCase()] !== undefined) return prices[key.toLowerCase()];
        const titleCase = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        if (prices[titleCase] !== undefined) return prices[titleCase];
        return 0;
    };

    let base = 0;

    // Select Price Tables based on Queue Type
    const prices = {
        rank: queueType === 'FLEX' ? (config.rankPricesFlex || config.rankPrices) : config.rankPrices,
        promotion: queueType === 'FLEX' ? (config.promotionPricesFlex || config.promotionPrices) : config.promotionPrices,
        netWin: queueType === 'FLEX' ? (config.netWinPricesFlex || config.netWinPrices) : config.netWinPrices,
        placement: queueType === 'FLEX' ? (config.placementPricesFlex || config.placementPrices) : config.placementPrices,
    };

    if (activeTab === 'RANK_BOOST') {
      // Logic tính giá Rank Boost
      // FIX: Sử dụng FLAT_TIERS để tìm index chính xác
      const startIdx = RANK_BOOST_TIERS.findIndex(t => t.key === currentTier);
      const endIdx = RANK_BOOST_TIERS.findIndex(t => t.key === desiredTier);

      if (prices.rank && Object.keys(prices.rank).length > 0) {
          if (endIdx > startIdx) {
              for (let i = startIdx; i < endIdx; i++) {
                  const key = RANK_BOOST_TIERS[i].key;
                  // Lấy giá của Booster cho Rank tương ứng. Nếu không có giá -> 0
                  const pricePerStep = getPrice(prices.rank, key);
                  base += pricePerStep;
              }
          }
      }

    } else if (activeTab === 'PROMOTION') {
      // Extract Rank name from Tier key (e.g. SILVER_IV -> Silver)
      const rankName = currentTier.split('_')[0];
      // Promotion prices usually keyed by Rank (e.g. Silver_I -> Gold_IV promotion)
      // Assuming config uses keys like "Silver_I" or just "Silver"
      base = getPrice(prices.promotion, currentTier) || getPrice(prices.promotion, rankName);
    } else if (activeTab === 'MASTERY') {
      // Lấy giá Mastery từ Config Booster
      const pricePerLevel = config?.masteryPrices?.[currentMastery.toString()] || config?.masteryPrices?.['default'] || 0;
      base = Math.max(0, (desiredMastery - currentMastery) * pricePerLevel);
    } else if (activeTab === 'LEVELING') {
      // Lấy giá Leveling từ Config Booster
      const pricePerLevel = config?.levelingPrices?.['default'] || 0;
      base = Math.max(0, (desiredLevel - currentLevel) * pricePerLevel);
    } else if (activeTab === 'NET_WINS') {
      // Logic Net Wins: Dùng giá Booster cấu hình (Price per LP) -> Quy đổi ra Game (~20LP/win)
      // Sử dụng nwCurrentRank (Master, Grandmaster, Challenger)
      const pricePerLP = getPrice(prices.netWin, nwCurrentRank);
      console.log('Price per LP based on current rank:', pricePerLP);
      const lpDiff = Math.max(0, nwDesiredLP - nwCurrentLP);
      console.log('LP Difference:', lpDiff);
      base = lpDiff * pricePerLP;

    } else if (activeTab === 'PLACEMENTS') {
      // Lấy giá Placements từ Config Booster theo Rank mùa trước
      const pricePerGame = getPrice(prices.placement, prevRank);
      base = numGames * pricePerGame;
    }
    
    // --- ÁP DỤNG CÁC HỆ SỐ ĐIỀU CHỈNH (MODIFIERS) ---

    // 1. Áp dụng Phí sàn -2% vào giá gốc (Theo yêu cầu: 50.000 -> 49.000)
    base = base * 0.98;

    // 2. Áp dụng hệ số LP (LP Modifiers) - Chỉ cho RANK_BOOST và NET_WINS
    if (activeTab && ['RANK_BOOST', 'NET_WINS'].includes(activeTab) && config?.lpModifiers && lpGain) {
        const lp = parseInt(lpGain);
        if (!isNaN(lp)) {
            let mod = 0;
            if (lp < 19) mod = config.lpModifiers.low;
            else if (lp > 21) mod = config.lpModifiers.high;
            else mod = config.lpModifiers.medium;
            
            if (mod !== 0) base = base * (1 + mod / 100);
        }
    }

    // Helper lấy giá trị option từ config hoặc mặc định
    const getOptPercent = (key: keyof BoosterConfig['options'], defaultVal: number): number => {
        const val = config?.options?.[key];
        return typeof val === 'number' ? val : defaultVal;
    };

    // Apply Options Multiplicatively (Sequential Multiplication)
    // Formula: CurrentTotal * (1 + Option%)
    if (optLane && config?.options?.roles?.length) base = base * 1.05;
    if (optChamp && config?.options?.specificChamps) base = base * (1 + getOptPercent('specificChamps', 30) / 100);
    if (optSpeed && config?.options?.express) base = base * (1 + getOptPercent('express', 35) / 100);
    if (optDuo && config?.options?.duo) base = base * (1 + getOptPercent('duo', 50) / 100);

    let total = base;
    
    if (optStream) {
        const streamPrice = config?.options ? config.options.streaming : 349000;
        total += streamPrice;
    }

    return Math.max(0, Math.round(total));
  };

  const total = calculateTotal();
  const config = selectedBooster?.booster_config || selectedBooster?.booster_info?.service_settings;

  // Helper to get current LP Modifier for display
  const currentLPMod = useMemo(() => {
    if (!config?.lpModifiers || !lpGain) return 0;
    const lp = parseInt(lpGain);
    if (isNaN(lp)) return 0;
    if (lp < 19) return config.lpModifiers.low;
    if (lp > 21) return config.lpModifiers.high;
    return config.lpModifiers.medium;
  }, [lpGain, config]);

  // Helper to get current Option Modifiers
  const getOptionMod = (key: keyof BoosterConfig['options'], defaultVal: number) => {
      if (!config?.options) return defaultVal;
      return typeof config.options[key] === 'number' ? config.options[key] : defaultVal;
  };

  const handleSubmit = async () => {
    if (!user) {
        toast.error('Vui lòng đăng nhập để thanh toán');
        router.push('/login');
        return;
    }
    if (!selectedBooster) {
        toast.error('Vui lòng chọn Booster trước');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (!username || !password || total <= 0) {
      toast.error(t('fillAllFields'));
      return;
    }
    if (!agreed) {
      toast.error('Vui lòng đồng ý điều khoản');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user._id, // In real app, this is handled by session/token
          booster_id: selectedBooster._id,
          serviceType: activeTab === 'PLACEMENTS' ? 'PLACEMENT' : activeTab,
          details: {
            current_rank: activeTab === 'NET_WINS' ? nwCurrentRank : currentTier, 
            desired_rank: activeTab === 'NET_WINS' ? nwCurrentRank : desiredTier,
            current_lp: activeTab === 'NET_WINS' ? nwCurrentLP : parseInt(currentLP),
            desired_lp: activeTab === 'NET_WINS' ? nwDesiredLP : undefined,
            lp_gain: parseInt(lpGain),
            server: server, // Use selected server state
            account_username: username,
            account_password: password,
            account_type: accType,
            schedule: config?.options?.schedule ? `${scheduleTime.start} - ${scheduleTime.end}` : undefined
          },
          options: {
            flash_boost: optSpeed,
            specific_champs: optChamp && selectedChamp ? [selectedChamp.name] : [],
            streaming: optStream,
            duo_queue: optDuo,
            priority_lane: optLane ? 'Yes' : undefined
          },
          gamesCount: numGames
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
            toast.error(t('insufficientBalance'));
            setTimeout(() => router.push('/dashboard/wallet'), 2000);
        } else {
            throw new Error(data.error);
        }
        return;
      }

      toast.success(t('orderSuccess'));
      router.push('/dashboard/orders');

    } catch (error: any) {
      toast.error(error.message || t('serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderTierSelector = (label: string, value: string, onChange: (val: string) => void, tiers = FLAT_TIERS) => (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium">
          {tiers.map(t => <option key={t.key} value={t.key} className="bg-zinc-900">{t.label}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 px-4 relative overflow-hidden selection:bg-blue-500/30 font-sans" suppressHydrationWarning>
      <Navbar />
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Dịch vụ Cày Thuê Liên Minh Huyền Thoại",
            "provider": {
              "@type": "Organization",
              "name": "CAYTHUELOL",
              "url": "https://caythuelol.com"
            },
            "description": "Dịch vụ leo rank, cày thông thạo, placement chuyên nghiệp.",
            "areaServed": "VN",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Các gói dịch vụ",
              "itemListElement": Object.keys(SERVICE_KEYS).map(key => ({ "@type": "Offer", "itemOffered": { "@type": "Service", "name": key } }))
            }
          })
        }}
      />
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" suppressHydrationWarning />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Modal Portal */}
      <ChampionModal 
        isOpen={isChampModalOpen}
        onClose={() => setIsChampModalOpen(false)}
        champions={champions}
        onSelect={setSelectedChamp}
        selectedId={selectedChamp?.id}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3 h-3" /> Trusted by 10,000+ Players
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            {t('servicePageTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">{t('servicePageDesc')}</p>
        </div>

        {/* SECTION 1: BOOSTER SELECTION */}
        <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-sm">1</span>
                Chọn Booster
            </h2>
            
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative">
                <select 
                  value={filterServer} 
                  onChange={(e) => setFilterServer(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-white focus:border-blue-500 outline-none"
                >
                  {SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select 
                  value={filterService} 
                  onChange={(e) => setFilterService(e.target.value)}
                  className="appearance-none bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-10 py-2 text-sm font-medium text-white focus:border-blue-500 outline-none"
                >
                  <option value="">Tất cả dịch vụ</option>
                  <option value="RANK_BOOST">Cày Rank</option>
                  <option value="NET_WINS">Net Wins</option>
                  <option value="PLACEMENTS">Phân hạng</option>
                  <option value="LEVELING">Cày Level</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {boosters.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-white/5">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Đang tải danh sách Booster...
                </div>
            ) : (
                <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
                    {boosters.map((booster) => (
                        <div 
                            key={booster._id}
                            onClick={() => handleSelectBooster(booster)}
                            className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 min-w-[260px] w-[80vw] md:w-auto snap-center ${
                                selectedBooster?._id === booster._id
                                    ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                                    : 'border-white/10 bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-900/80'
                            }`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                                    {booster.profile.avatar ? (
                                        <img src={booster.profile.avatar} alt={booster.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-3 bg-zinc-800 text-zinc-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{booster.username}</h3>
                                    <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {booster.booster_info?.rating.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {booster.booster_info?.ranks.slice(0, 2).map((rank, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-white/5 text-[10px] font-medium text-zinc-400 border border-white/5">{rank}</span>
                                ))}
                            </div>
                            {/* Supported Services Icons */}
                            <div className="flex gap-1.5 pt-3 border-t border-white/5">
                                {booster.booster_info?.services?.slice(0, 5).map((svc) => {
                                    const SvcIcon = SERVICE_ICONS[svc] || Trophy;
                                    return (
                                        <div key={svc} className="p-1 rounded bg-zinc-800 text-zinc-400" title={svc}><SvcIcon className="w-3 h-3" /></div>
                                    );
                                })}
                            </div>
                            {selectedBooster?._id === booster._id && (
                                <div className="absolute top-4 right-4 text-blue-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* SECTION 2 & 3: SERVICE & PAYMENT */}
        <div ref={serviceSectionRef} className={`transition-opacity duration-500 ${selectedBooster ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm border border-white/10">2</span>
                    Cấu hình dịch vụ
                </h2>
                {!selectedBooster && (
                    <div className="flex items-center gap-2 text-yellow-500 text-sm font-medium animate-pulse">
                        <MousePointerClick className="w-4 h-4" />
                        Vui lòng chọn Booster ở trên
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Service Tabs */}
                    <div className="mb-2">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
                        {[
                            { id: 'RANK_BOOST', label: t('svcRankBoost'), icon: Trophy },
                            { id: 'PROMOTION', label: t('svcPromotion'), icon: TrendingUp },
                            { id: 'LEVELING', label: t('svcLeveling'), icon: Zap },
                            { id: 'NET_WINS', label: t('svcNetWins'), icon: Target },
                            { id: 'PLACEMENTS', label: t('svcPlacements'), icon: Swords },
                            { id: 'MASTERY', label: t('svcMastery'), icon: Medal },
                        ].filter(svc => availableServiceTypes.includes(svc.id as ServiceType))
                        .map((svc) => (
                            <button
                            key={svc.id}
                            onClick={() => setActiveTab(svc.id as ServiceType)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                activeTab === svc.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-white/5'
                            }`}
                            >
                            <svc.icon className="w-4 h-4" />
                            {svc.label}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* Service Details Form */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Thông tin dịch vụ</h3>
                        {activeTab === 'RANK_BOOST' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderTierSelector(t('servicesCurrentRank'), currentTier, setCurrentTier, RANK_BOOST_TIERS)}
                                {renderTierSelector(t('servicesDesiredRank'), desiredTier, setDesiredTier, RANK_BOOST_TIERS)}
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('queueType')}</label>
                                    <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/10">
                                        {['SOLO_DUO', 'FLEX'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setQueueType(type)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${queueType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                            >
                                                {type === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('lpGain')}</label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={lpGain}
                                        onChange={e => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            setLpGain('');
                                            return;
                                          }
                                          if (val.includes('-') || Number(val) < 0) {
                                            toast.error('Vui lòng nhập số nguyên dương');
                                            return;
                                          }
                                          setLpGain(val);
                                        }}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="VD: 19"
                                      />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                      
                                      {currentLPMod !== 0 && (
                                        <div
                                          className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1
                                            ${currentLPMod > 0 
                                              ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                                              : 'bg-green-500/10 text-green-400 border border-green-500/30'
                                            }`}
                                          title={
                                            currentLPMod > 0
                                              ? `LP thấp → Tăng giá ${Math.abs(currentLPMod)}%`
                                              : `LP cao → Giảm giá ${Math.abs(currentLPMod)}%`
                                          }
                                        >
                                          {currentLPMod > 0 ? 'Tăng giá +' : 'Giảm giá -'}
                                          {Math.abs(currentLPMod)}%
                                        </div>
                                      )}

                                      <span className="text-zinc-400 text-sm font-medium">
                                        LP mỗi trận
                                      </span>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'PROMOTION' && (
                            <div className="space-y-6">
                                {renderTierSelector(t('servicesCurrentRank'), currentTier, setCurrentTier)}
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                                    <TrendingUp className="w-5 h-5 text-yellow-500 shrink-0" />
                                    <p className="text-sm text-yellow-200">
                                        Dịch vụ này giúp bạn vượt qua chuỗi thăng hạng (BO3/BO5) để lên bậc tiếp theo.
                                        <br/>Ví dụ: Từ Bạc I lên Vàng IV.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'LEVELING' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentLevel')}</label>
                                    <input type="number" min="1" max="29" value={currentLevel} onChange={e => setCurrentLevel(Number(e.target.value))} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('desiredLevel')}</label>
                                    <input type="number" min="30" value={desiredLevel} onChange={e => setDesiredLevel(Number(e.target.value))} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'NET_WINS' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('servicesCurrentRank')}</label>
                                        <div className="relative">
                                            <select 
                                                value={nwCurrentRank} 
                                                onChange={e => setNwCurrentRank(e.target.value)} 
                                                className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium"
                                            >
                                                {['Master', 'Grandmaster', 'Challenger'].map(r => (
                                                    <option key={r} value={r} className="bg-zinc-900">{r}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('queueType')}</label>
                                        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/10">
                                            {['SOLO_DUO', 'FLEX'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setQueueType(type)}
                                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${queueType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                                                >
                                                    {type === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentLP')}</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={nwCurrentLP} 
                                            onChange={e => setNwCurrentLP(Math.max(0, Number(e.target.value)))}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('desiredLP')}</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={nwDesiredLP} 
                                            onChange={e => setNwDesiredLP(Math.max(0, Number(e.target.value)))}
                                            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('lpGain')}</label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={lpGain}
                                        onChange={e => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            setLpGain('');
                                            return;
                                          }
                                          if (val.includes('-') || Number(val) < 0) {
                                            toast.error('Vui lòng nhập số nguyên dương');
                                            return;
                                          }
                                          setLpGain(val);
                                        }}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="VD: 19"
                                      />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                      {currentLPMod !== 0 && (
                                        <div className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${currentLPMod > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'}`}>
                                          {currentLPMod > 0 ? 'Tăng giá +' : 'Giảm giá -'}{Math.abs(currentLPMod)}%
                                        </div>
                                      )}
                                      <span className="text-zinc-400 text-sm font-medium">LP mỗi trận</span>
                                    </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'PLACEMENTS' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('prevRank')}</label>
                                    <div className="relative">
                                        <select value={prevRank} onChange={e => setPrevRank(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
                                            {RANKS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('numGames')} (Số trận)</label>
                                    <div className="flex gap-2">
                                        {[1,2,3,4,5].map(n => (
                                            <button key={n} onClick={() => setNumGames(n)} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${numGames === n ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900/50 border-white/10 text-zinc-500'}`}>{n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'MASTERY' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('selectChamp')}</label>
                                {selectedChamp ? (
                                    <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-blue-500/50 rounded-xl relative group transition-all hover:bg-zinc-900">
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <img src={selectedChamp.imageUrl} alt={selectedChamp.name} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-white">{selectedChamp.name}</h3>
                                        <div className="flex gap-2 text-xs text-zinc-400 mt-1">
                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{selectedChamp.tags[0]}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsChampModalOpen(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors">Thay đổi</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsChampModalOpen(true)} className="w-full py-8 border border-dashed border-zinc-700 bg-zinc-900/30 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all group">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg"><Search className="w-6 h-6" /></div>
                                    <span className="font-medium">Bấm để chọn tướng</span>
                                    </button>
                                )}
                                </div>
                                {/* ... Mastery inputs ... */}
                            </div>
                        )}
                    </div>

                    {/* Account Info & Options (Giữ nguyên từ code cũ) */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Thông tin tài khoản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('serviceUsername')}</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all" placeholder="Riot ID" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('servicePassword')}</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all" placeholder="••••••••" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Server</label>
                                <select value={server} onChange={e => setServer(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all">
                                    {(config?.servers || SERVERS).map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Boosting (If Enabled) */}
                    {config?.options?.schedule && (
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-500" />
                                Đặt lịch cày
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Giờ bắt đầu</label>
                                    <input type="time" value={scheduleTime.start} onChange={e => setScheduleTime({...scheduleTime, start: e.target.value})} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Giờ kết thúc</label>
                                    <input type="time" value={scheduleTime.end} onChange={e => setScheduleTime({...scheduleTime, end: e.target.value})} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none" />
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-3">* Booster sẽ ưu tiên cày trong khung giờ này.</p>
                        </div>
                    )}

                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Tùy chọn thêm</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {config?.options?.roles && config.options.roles.length > 0 && (
                                <OptionCard 
                                    label="Chọn Lane" 
                                    price="+5%" 
                                    checked={optLane} onChange={setOptLane} icon={Map} description="Đảm bảo vị trí sở trường" 
                                />
                            )}
                            {config?.options?.specificChamps && config.options.specificChamps > 0 && (
                                <OptionCard 
                                    label="Chọn Tướng" 
                                    price={`+${config.options.specificChamps}%`} 
                                    checked={optChamp} onChange={setOptChamp} icon={User} description="Chỉ chơi tướng chỉ định" 
                                />
                            )}
                            {config?.options?.express && config.options.express > 0 && (
                                <OptionCard 
                                    label="Siêu Tốc" 
                                    price={`+${config.options.express}%`} 
                                    checked={optSpeed} onChange={setOptSpeed} icon={Zap} description="Ưu tiên xử lý ngay lập tức" badge="Most Popular" 
                                />
                            )}
                            {config?.options?.duo && config.options.duo > 0 && (
                                <OptionCard 
                                    label="Duo Queue" 
                                    price={`+${config.options.duo}%`} 
                                    checked={optDuo} onChange={setOptDuo} icon={Users} description="Chơi cùng Booster" 
                                />
                            )}
                            {config?.options?.streaming && config.options.streaming > 0 && (
                                <OptionCard 
                                    label="Streaming" 
                                    price={`+${config.options.streaming.toLocaleString('vi-VN')}đ`} 
                                    checked={optStream} onChange={setOptStream} icon={Video} description="Xem trực tiếp quá trình" 
                                />
                            )}
                        </div>
                        <div className="flex items-center gap-3 p-4 mt-6 rounded-xl border border-white/5 bg-zinc-900/30">
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-5 h-5 accent-blue-500" />
                            <span className="text-sm text-zinc-400">{t('agreeTerms')}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary & Payment */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white">{t('totalPayment')}</h3>
                            <div className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold">Secure Checkout</div>
                        </div>

                        {/* Summary Details */}
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Booster:</span>
                                <span className="text-white font-bold">{selectedBooster?.username || 'Chưa chọn'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Dịch vụ:</span>
                                <span className="text-white font-medium text-right">{activeTab ? t(activeTab as any) : ''}</span>
                            </div>
                            {/* ... More summary details ... */}
                        </div>

                        <div className="flex justify-between items-end mb-6 pt-4 border-t border-white/10">
                            <span className="text-zinc-400 font-medium pb-1">Tổng cộng:</span>
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                            </span>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={submitting || total <= 0 || !selectedBooster}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Thuê ngay
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>Hoàn thành dự kiến: 1-2 ngày</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <ServicesContent />
    </Suspense>
  );
}
