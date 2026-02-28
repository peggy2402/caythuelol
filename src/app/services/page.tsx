'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { 
  Trophy, TrendingUp, Medal, Zap, Target, Swords,
  CheckCircle2, AlertCircle, Loader2, Search,
  ShieldCheck, Clock, Star, ChevronRight, Flame, Wallet,
  Video, Users, Map, User, ArrowLeft, Lock, LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import ChampionModal from '@/components/champion/ChampionModal';

// --- CONSTANTS & DATA ---
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];
const SERVERS = ['VN', 'KR', 'JP', 'EUW', 'NA'];
const ACCOUNT_TYPES = ['Riot', 'Facebook', 'Google', 'Apple', 'Xbox', 'PlayStation'];

// Base Prices (Example)
const RANK_BASE_PRICES: Record<string, number> = {
  'Iron': 50000, 'Bronze': 80000, 'Silver': 120000, 'Gold': 200000,
  'Platinum': 350000, 'Emerald': 550000, 'Diamond': 900000, 'Master': 2000000,
  'Grandmaster': 4000000, 'Challenger': 8000000
};

const MASTERY_PRICE_PER_LEVEL = 50000;
const LEVELING_PRICE_PER_LEVEL = 30000;
const PLACEMENT_PRICE_PER_GAME = 60000;

type ServiceType = 'RANK_BOOST' | 'PROMOTION' | 'MASTERY' | 'LEVELING' | 'NET_WINS' | 'PLACEMENTS';

interface Champion {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
  info: { attack: number; defense: number; magic: number; difficulty: number };
  partype: string;
  stats: any;
}

// --- UI COMPONENTS ---
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
  const boosterId = searchParams.get('booster');

  const [activeTab, setActiveTab] = useState<ServiceType>('RANK_BOOST');
  const [champions, setChampions] = useState<Champion[]>([]);
  const [champSearch, setChampSearch] = useState('');
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [booster, setBooster] = useState<any>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  // --- FORM STATE ---
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
  const [optLane, setOptLane] = useState(false); // +5%
  const [optChamp, setOptChamp] = useState(false); // +30%
  const [optStream, setOptStream] = useState(false); // +349k
  const [optSpeed, setOptSpeed] = useState(false); // +35%
  const [optDuo, setOptDuo] = useState(false); // +50%

  // --- FETCH CHAMPIONS ---
  useEffect(() => {
    // Gọi API nội bộ đã được tối ưu hóa (nhanh hơn và nhẹ hơn)
    fetch('/api/champions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch champions');
        return res.json();
      })
      .then((data: Champion[]) => {
        setChampions(data);
      })
      .catch(err => console.error(err));
  }, []);

  // --- FETCH USER ---
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  // --- FETCH BOOSTER ---
  useEffect(() => {
    if (boosterId) {
      fetch('/api/boosters')
        .then(res => res.json())
        .then(data => {
          const found = data.boosters.find((b: any) => b._id === boosterId);
          if (found) setBooster(found);
        });
    }
  }, [boosterId]);

  // --- PRICING LOGIC ---
  const calculateTotal = () => {
    let base = 0;

    if (activeTab === 'RANK_BOOST') {
      const startIdx = RANKS.indexOf(currentRank) * 4 + DIVISIONS.indexOf(currentDiv);
      const endIdx = RANKS.indexOf(desiredRank) * 4 + DIVISIONS.indexOf(desiredDiv);
      
      if (endIdx > startIdx) {
        // Simplified logic: Price difference between ranks
        // In real app, calculate per division step
        const startPrice = RANK_BASE_PRICES[currentRank] || 0;
        const endPrice = RANK_BASE_PRICES[desiredRank] || 0;
        base = Math.max(0, endPrice - startPrice);
        // Adjust for division roughly
        base += (DIVISIONS.indexOf(desiredDiv) - DIVISIONS.indexOf(currentDiv)) * 20000;
      }
    } 
    else if (activeTab === 'PROMOTION') {
      // Price based on target rank tier
      base = (RANK_BASE_PRICES[currentRank] || 100000) * 0.4; // 40% of tier price
    }
    else if (activeTab === 'MASTERY') {
      base = Math.max(0, (desiredMastery - currentMastery) * MASTERY_PRICE_PER_LEVEL);
    }
    else if (activeTab === 'LEVELING') {
      base = Math.max(0, (desiredLevel - currentLevel) * LEVELING_PRICE_PER_LEVEL);
    }
    else if (activeTab === 'NET_WINS') {
      // Price per win based on rank
      const pricePerWin = (RANK_BASE_PRICES[currentRank] || 100000) / 10;
      base = numGames * pricePerWin;
    }
    else if (activeTab === 'PLACEMENTS') {
      base = numGames * PLACEMENT_PRICE_PER_GAME;
      // Multiplier for high previous rank
      if (['Master', 'Grandmaster', 'Challenger'].includes(prevRank)) base *= 1.5;
      else if (['Diamond', 'Emerald'].includes(prevRank)) base *= 1.2;
    }

    // Apply Options
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

  const handleSubmit = () => {
    if (!username || !password) return toast.error(t('fillAllFields'));
    if (!agreed) return toast.error('Vui lòng đồng ý điều khoản');
    
    toast.success('Đã thêm vào giỏ hàng (Demo)');
    // Redirect to checkout or create order API
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

  // --- VIEW: LOGIN REQUIRED ---
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full bg-zinc-900/50 border border-white/10 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Lock className="w-8 h-8 text-zinc-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Yêu cầu đăng nhập</h2>
          <p className="text-zinc-400 mb-8">Vui lòng đăng nhập hoặc đăng ký tài khoản để sử dụng dịch vụ cày thuê.</p>
          
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" /> Đăng nhập
            </Link>
            <Link href="/register" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all">
              Đăng ký tài khoản mới
            </Link>
          </div>
          <div className="mt-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">Quay về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: BOOSTER REQUIRED ---
  if (!boosterId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[800px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-lg w-full bg-zinc-900/50 border border-white/10 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Users className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Chọn Booster trước</h2>
          <p className="text-zinc-400 mb-8">Mỗi Booster có bảng giá và dịch vụ khác nhau. Vui lòng chọn một chuyên gia từ danh sách để tiếp tục.</p>
          
          <Link 
            href="/boosters" 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group"
          >
            Xem danh sách Booster
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">Quay về trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-32 px-4 relative overflow-hidden selection:bg-blue-500/30 font-sans" suppressHydrationWarning>
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('/noise.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Modal Portal - Placed at root to avoid z-index/overflow issues */}
      <ChampionModal 
        isOpen={isChampModalOpen}
        onClose={() => setIsChampModalOpen(false)}
        champions={champions}
        onSelect={setSelectedChamp}
        selectedId={selectedChamp?.id}
      />

      {/* Top Navigation */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 rounded-full bg-zinc-900/50 border border-white/10 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-md group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToHome')}
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        {/* User Info (If Logged In) */}
        {user && (
          <div className="hidden sm:flex items-center gap-3 rounded-full bg-zinc-900/50 border border-white/10 pl-2 pr-4 py-1.5 backdrop-blur-md hover:bg-zinc-900/80 transition-colors">
            <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-[1px]">
              <div className="h-full w-full bg-zinc-950 rounded-full flex items-center justify-center overflow-hidden">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white leading-none mb-1">{user.username}</div>
              <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {user.wallet_balance?.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>
        )}

        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900/50 border border-white/10 backdrop-blur-md hover:bg-zinc-800 transition-all"
          >
            <Image 
              src="/language.svg" 
              alt="Language" 
              width={20} 
              height={20} 
              className="invert opacity-80 hover:opacity-100 transition-opacity"
            />
          </button>

          {isLangMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-36 rounded-xl border border-white/10 bg-zinc-900 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                {(['vi', 'en', 'kr', 'jp'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setIsLangMenuOpen(false); }}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${language === lang ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {lang === 'vi' ? 'Tiếng Việt' : lang === 'en' ? 'English' : lang === 'kr' ? '한국어' : '日本語'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12">
          {booster && (
            <div className="mb-6 inline-flex items-center gap-3 p-2 pr-6 bg-zinc-900/80 border border-white/10 rounded-full backdrop-blur-md animate-in fade-in slide-in-from-top-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500">
                {booster.profile?.avatar ? <img src={booster.profile.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 bg-zinc-800" />}
              </div>
              <div className="text-left">
                <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Đang thuê</div>
                <div className="text-sm font-bold text-white">{booster.username}</div>
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3 h-3" /> Trusted by 10,000+ Players
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            {t('servicePageTitle')}
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">{t('servicePageDesc')}</p>
        </div>

        {/* Service Tabs */}
        <div 
          className="sticky top-20 z-30 -mx-4 px-4 md:mx-0 mb-10 overflow-x-auto pb-4 md:pb-0"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex md:justify-center gap-2 min-w-max">
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
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === svc.id 
                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105 z-10' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <svc.icon className={`w-4 h-4 ${activeTab === svc.id ? 'text-blue-600' : ''}`} />
                {svc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: INPUTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Service Inputs */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Thông tin dịch vụ</h2>
              </div>

              {/* A) RANK BOOST */}
              {activeTab === 'RANK_BOOST' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
                  {renderRankSelector(t('servicesDesiredRank'), desiredRank, setDesiredRank, desiredDiv, setDesiredDiv)}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentLP')}</label>
                    <div className="relative">
                      <select value={currentLP} onChange={e => setCurrentLP(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                        <option className="bg-zinc-900">0-20</option>
                        <option className="bg-zinc-900">21-40</option>
                        <option className="bg-zinc-900">41-60</option>
                        <option className="bg-zinc-900">61-80</option>
                        <option className="bg-zinc-900">81-100</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('lpGain')}</label>
                    <div className="relative">
                      <select value={lpGain} onChange={e => setLpGain(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                        <option className="bg-zinc-900">+15 trở xuống (Bad MMR)</option>
                        <option className="bg-zinc-900">+16 đến +19 (Normal)</option>
                        <option className="bg-zinc-900">+20 trở lên (Good MMR)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* B) PROMOTION */}
              {activeTab === 'PROMOTION' && (
                <div className="space-y-4">
                  {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200">
                    <Star className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm">* Chúng tôi sẽ đảm bảo bạn thắng chuỗi thăng hạng để lên bậc tiếp theo.</p>
                  </div>
                </div>
              )}

              {/* C) MASTERY */}
              {activeTab === 'MASTERY' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('selectChamp')}</label>
                    
                    {/* Selected Champion Preview or Select Button */}
                    {selectedChamp ? (
                      <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-blue-500/50 rounded-xl relative group transition-all hover:bg-zinc-900">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                          <img src={selectedChamp.imageUrl} alt={selectedChamp.name} className="object-cover w-full h-full" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{selectedChamp.name}</h3>
                          <div className="flex gap-2 text-xs text-zinc-400 mt-1">
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{selectedChamp.tags[0]}</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Diff: {selectedChamp.info.difficulty}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsChampModalOpen(true)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Thay đổi
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsChampModalOpen(true)}
                        className="w-full py-8 border border-dashed border-zinc-700 bg-zinc-900/30 rounded-xl flex flex-col items-center justify-center text-zinc-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                          <Search className="w-6 h-6" />
                        </div>
                        <span className="font-medium">Bấm để chọn tướng</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentMastery')} (0-10)</label>
                      <input type="number" min="0" max="10" value={currentMastery} onChange={e => setCurrentMastery(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('desiredMastery')} (1-10)</label>
                      <input type="number" min="1" max="10" value={desiredMastery} onChange={e => setDesiredMastery(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}

              {/* D) LEVELING */}
              {activeTab === 'LEVELING' && (
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('currentLevel')}</label>
                      <input type="number" min="1" max="30" value={currentLevel} onChange={e => setCurrentLevel(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('desiredLevel')}</label>
                      <input type="number" min="30" value={desiredLevel} disabled className="w-full rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3 text-zinc-500 cursor-not-allowed" />
                    </div>
                </div>
              )}

              {/* E) NET WINS */}
              {activeTab === 'NET_WINS' && (
                <div className="space-y-6">
                   {renderRankSelector(t('servicesCurrentRank'), currentRank, setCurrentRank, currentDiv, setCurrentDiv)}
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('numGames')} (Số trận thắng ròng)</label>
                      <div className="flex items-center gap-4">
                        <input type="range" min="1" max="20" value={numGames} onChange={e => setNumGames(Number(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        <div className="w-16 h-10 flex items-center justify-center bg-blue-600 rounded-lg font-bold text-white shadow-lg shadow-blue-500/20">{numGames}</div>
                      </div>
                   </div>
                </div>
              )}

              {/* F) PLACEMENTS */}
              {activeTab === 'PLACEMENTS' && (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('prevRank')}</label>
                      <div className="relative">
                        <select value={prevRank} onChange={e => setPrevRank(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                          {RANKS.map(r => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('numGames')} (1-5)</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(n => (
                          <button 
                            key={n} 
                            onClick={() => setNumGames(n)}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${numGames === n ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900/50 border-white/10 text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Account Info Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Thông tin tài khoản</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('server')}</label>
                  <div className="relative">
                    <select value={server} onChange={e => setServer(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                      {SERVERS.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('accountType')}</label>
                  <div className="relative">
                    <select value={accType} onChange={e => setAccType(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all">
                      {ACCOUNT_TYPES.map(a => <option key={a} value={a} className="bg-zinc-900">{a}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('serviceUsername')}</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="Riot ID / Username" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{t('servicePassword')}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white">Tùy chọn thêm</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OptionCard label="Chọn Lane" price="+5%" checked={optLane} onChange={setOptLane} icon={Map} description="Đảm bảo vị trí sở trường" />
                <OptionCard label="Chọn Tướng" price="+30%" checked={optChamp} onChange={setOptChamp} icon={User} description="Chỉ chơi tướng chỉ định" />
                <OptionCard label="Siêu Tốc" price="+35%" checked={optSpeed} onChange={setOptSpeed} icon={Zap} description="Ưu tiên xử lý ngay lập tức" badge="Most Popular" />
                <OptionCard label="Duo Queue" price="+50%" checked={optDuo} onChange={setOptDuo} icon={Users} description="Chơi cùng Booster" />
                <OptionCard label="Streaming" price="+349k" checked={optStream} onChange={setOptStream} icon={Video} description="Xem trực tiếp quá trình" />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-zinc-900/30">
              <div className="relative flex items-center">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-600 bg-zinc-800 transition-all checked:border-blue-500 checked:bg-blue-500" />
                <CheckCircle2 className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" />
              </div>
              <span className="text-sm text-zinc-400 select-none cursor-pointer" onClick={() => setAgreed(!agreed)}>{t('agreeTerms')}</span>
            </div>

          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">{t('totalPayment')}</h3>
                <div className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold">Secure Checkout</div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Dịch vụ:</span>
                  <span className="text-white font-medium text-right">
                    {activeTab === 'RANK_BOOST' && t('svcRankBoost')}
                    {activeTab === 'PROMOTION' && t('svcPromotion')}
                    {activeTab === 'MASTERY' && t('svcMastery')}
                    {activeTab === 'LEVELING' && t('svcLeveling')}
                    {activeTab === 'NET_WINS' && t('svcNetWins')}
                    {activeTab === 'PLACEMENTS' && t('svcPlacements')}
                  </span>
                </div>

                {/* Dynamic Details based on Tab */}
                {activeTab === 'RANK_BOOST' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Mục tiêu:</span>
                    <span className="text-white font-medium">{currentRank} {currentDiv} ➔ {desiredRank} {desiredDiv}</span>
                  </div>
                )}
                {activeTab === 'MASTERY' && selectedChamp && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Tướng:</span>
                    <span className="text-white font-medium">{selectedChamp.name}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Server:</span>
                  <span className="text-white font-medium">{server}</span>
                </div>

                {/* Options Summary */}
                {(optLane || optChamp || optStream || optSpeed || optDuo) && (
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Add-ons</p>
                    {optLane && <div className="flex justify-between text-xs text-zinc-400"><span>Chọn Lane</span><span>+5%</span></div>}
                    {optChamp && <div className="flex justify-between text-xs text-zinc-400"><span>Chọn Tướng</span><span>+30%</span></div>}
                    {optSpeed && <div className="flex justify-between text-xs text-zinc-400"><span>Siêu Tốc</span><span>+35%</span></div>}
                    {optDuo && <div className="flex justify-between text-xs text-zinc-400"><span>Duo Queue</span><span>+50%</span></div>}
                    {optStream && <div className="flex justify-between text-xs text-zinc-400"><span>Streaming</span><span>+349k</span></div>}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-6 pt-4 border-t border-white/10">
                <span className="text-zinc-400 font-medium pb-1">Tổng cộng:</span>
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                </span>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 group"
              >
                Thanh toán ngay
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                <span>Hoàn thành dự kiến: 1-2 ngày</span>
              </div>
              
              <div className="mt-2 text-center">
                <p className="text-[10px] text-zinc-600">Cam kết hoàn tiền 100% nếu không hoàn thành đúng hạn.</p>
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
