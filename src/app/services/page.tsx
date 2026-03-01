'use client';

import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { 
  Trophy, TrendingUp, Medal, Zap, Target, Swords,
  CheckCircle2, AlertCircle, Loader2, Search,
  ShieldCheck, Clock, Star, ChevronRight, Flame, ChevronLeft,
  Video, Users, Map, User, Lock, LogIn, MousePointerClick
} from 'lucide-react';
import { toast } from 'sonner';
import ChampionModal from '@/components/champion/ChampionModal';
import Navbar from '@/components/Navbar';

// --- TYPES ---
type ServiceType = 'RANK_BOOST' | 'PROMOTION' | 'MASTERY' | 'LEVELING' | 'NET_WINS' | 'PLACEMENTS';

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
  };
  booster_config?: {
    services: { type: string; enabled: boolean; price: number; modifier: number }[];
    options: { key: string; enabled: boolean; price: number; modifier: number }[];
  };
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

// Base Prices (Example)
const RANK_BASE_PRICES: Record<string, number> = {
  'Iron': 50000, 'Bronze': 80000, 'Silver': 120000, 'Gold': 200000,
  'Platinum': 350000, 'Emerald': 550000, 'Diamond': 900000, 'Master': 2000000,
  'Grandmaster': 4000000, 'Challenger': 8000000
};
const MASTERY_PRICE_PER_LEVEL = 50000;
const LEVELING_PRICE_PER_LEVEL = 30000;
const PLACEMENT_PRICE_PER_GAME = 60000;

const SERVICE_KEYS: Record<string, string> = {
  RANK_BOOST: 'svcRankBoost',
  PROMOTION: 'svcPromotion',
  MASTERY: 'svcMastery',
  LEVELING: 'svcLeveling',
  NET_WINS: 'svcNetWins',
  PLACEMENTS: 'svcPlacements',
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
  
  // UI State
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [currentRank, setCurrentRank] = useState('Silver');
  const [currentDiv, setCurrentDiv] = useState('IV');
  const [desiredRank, setDesiredRank] = useState('Gold');
  const [desiredDiv, setDesiredDiv] = useState('IV');
  const [currentLP, setCurrentLP] = useState('0-20');
  const [lpGain, setLpGain] = useState('+20');
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

    // Fetch Boosters
    fetch('/api/boosters')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch boosters');
        return res.json();
      })
      .then(data => setBoosters(data.boosters || []))
      .catch(err => console.error(err));

    // Fetch Champions
    fetch('/api/champions')
      .then(res => res.json())
      .then(data => setChampions(data))
      .catch(err => console.error(err));
  }, []);

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
    
    return ['RANK_BOOST', 'PROMOTION', 'MASTERY', 'LEVELING', 'NET_WINS', 'PLACEMENTS'] as ServiceType[];
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
    let base = 0;
    if (activeTab === 'RANK_BOOST') {
      const startIdx = RANKS.indexOf(currentRank) * 4 + DIVISIONS.indexOf(currentDiv);
      const endIdx = RANKS.indexOf(desiredRank) * 4 + DIVISIONS.indexOf(desiredDiv);
      if (endIdx > startIdx) {
        const startPrice = RANK_BASE_PRICES[currentRank] || 0;
        const endPrice = RANK_BASE_PRICES[desiredRank] || 0;
        base = Math.max(0, endPrice - startPrice);
        base += (DIVISIONS.indexOf(desiredDiv) - DIVISIONS.indexOf(currentDiv)) * 20000;
      }
    } else if (activeTab === 'PROMOTION') {
      base = (RANK_BASE_PRICES[currentRank] || 100000) * 0.4;
    } else if (activeTab === 'MASTERY') {
      base = Math.max(0, (desiredMastery - currentMastery) * MASTERY_PRICE_PER_LEVEL);
    } else if (activeTab === 'LEVELING') {
      base = Math.max(0, (desiredLevel - currentLevel) * LEVELING_PRICE_PER_LEVEL);
    } else if (activeTab === 'NET_WINS') {
      const pricePerWin = (RANK_BASE_PRICES[currentRank] || 100000) / 10;
      base = numGames * pricePerWin;
    } else if (activeTab === 'PLACEMENTS') {
      base = numGames * PLACEMENT_PRICE_PER_GAME;
      if (['Master', 'Grandmaster', 'Challenger'].includes(prevRank)) base *= 1.5;
      else if (['Diamond', 'Emerald'].includes(prevRank)) base *= 1.2;
    }

    let multiplier = 1.0;
    if (optLane) multiplier += 0.05;
    if (optChamp) multiplier += 0.30;
    if (optSpeed) multiplier += 0.35;
    if (optDuo) multiplier += 0.50;

    let total = base * multiplier;
    if (optStream) total += 349000;

    return Math.max(0, Math.round(total));
  };

  const total = calculateTotal();

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
            current_rank: currentRank,
            desired_rank: desiredRank,
            current_lp: parseInt(currentLP),
            lp_gain: parseInt(lpGain),
            server,
            account_username: username,
            account_password: password,
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
  const renderRankSelector = (label: string, rank: string, setRank: any, div: string, setDiv: any) => (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select value={rank} onChange={e => setRank(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium">
            {RANKS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
        </div>
        <div className="relative w-24">
          <select value={div} onChange={e => setDiv(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-center">
            {DIVISIONS.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-3 h-3 rotate-90" /></div>
        </div>
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
                            { id: 'MASTERY', label: t('svcMastery'), icon: Medal },
                            { id: 'LEVELING', label: t('svcLeveling'), icon: Zap },
                            { id: 'NET_WINS', label: t('svcNetWins'), icon: Target },
                            { id: 'PLACEMENTS', label: t('svcPlacements'), icon: Swords },
                        ].map((svc) => (
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
                        {activeTab === 'RANK_BOOST' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
                                {renderRankSelector(t('servicesDesiredRank'), desiredRank, setDesiredRank, desiredDiv, setDesiredDiv)}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentLP')}</label>
                                    <div className="relative">
                                        <select value={currentLP} onChange={e => setCurrentLP(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
                                            {['0-20', '21-40', '41-60', '61-80', '81-100'].map(v => <option key={v} value={v} className="bg-zinc-900">{v}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('lpGain')}</label>
                                    <div className="relative">
                                        <select value={lpGain} onChange={e => setLpGain(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
                                            <option value="+15" className="bg-zinc-900">+15 trở xuống (Bad MMR)</option>
                                            <option value="+18" className="bg-zinc-900">+16 đến +19 (Normal)</option>
                                            <option value="+20" className="bg-zinc-900">+20 trở lên (Good MMR)</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-zinc-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'PROMOTION' && (
                            <div className="space-y-6">
                                {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
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
                                {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('numGames')} (Số trận thắng)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="1" max="10" value={numGames} onChange={e => setNumGames(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                        <div className="w-12 h-10 flex items-center justify-center bg-zinc-800 rounded border border-white/10 font-bold">{numGames}</div>
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
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Tùy chọn thêm</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <OptionCard label="Chọn Lane" price="+5%" checked={optLane} onChange={setOptLane} icon={Map} description="Đảm bảo vị trí sở trường" />
                            <OptionCard label="Chọn Tướng" price="+30%" checked={optChamp} onChange={setOptChamp} icon={User} description="Chỉ chơi tướng chỉ định" />
                            <OptionCard label="Siêu Tốc" price="+35%" checked={optSpeed} onChange={setOptSpeed} icon={Zap} description="Ưu tiên xử lý ngay lập tức" badge="Most Popular" />
                            <OptionCard label="Duo Queue" price="+50%" checked={optDuo} onChange={setOptDuo} icon={Users} description="Chơi cùng Booster" />
                            <OptionCard label="Streaming" price="+349k" checked={optStream} onChange={setOptStream} icon={Video} description="Xem trực tiếp quá trình" />
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
                                <span className="text-white font-medium text-right">{t(activeTab as any)}</span>
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
