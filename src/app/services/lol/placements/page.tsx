'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';

const PLACEMENT_RANKS = [
  { id: 'Iron', label: 'Sắt', image: '/images/ranks/iron.png', color: 'text-zinc-400' },
  { id: 'Bronze', label: 'Đồng', image: '/images/ranks/bronze.png', color: 'text-orange-700' },
  { id: 'Silver', label: 'Bạc', image: '/images/ranks/silver.png', color: 'text-zinc-300' },
  { id: 'Gold', label: 'Vàng', image: '/images/ranks/gold.png', color: 'text-yellow-400' },
  { id: 'Platinum', label: 'Bạch Kim', image: '/images/ranks/platinum.png', color: 'text-cyan-400' },
  { id: 'Emerald', label: 'Lục Bảo', image: '/images/ranks/emerald.png', color: 'text-emerald-400' },
  { id: 'Diamond', label: 'Kim Cương', image: '/images/ranks/diamond.png', color: 'text-blue-400' },
  { id: 'Master', label: 'Cao Thủ', image: '/images/ranks/master.png', color: 'text-purple-400' },
  { id: 'Grandmaster', label: 'Đại Cao Thủ', image: '/images/ranks/grandmaster.png', color: 'text-red-400' },
  { id: 'Challenger', label: 'Thách Đấu', image: '/images/ranks/challenger.png', color: 'text-yellow-500' },
];

function PlacementsContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');
  const router = useRouter();

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [prevRank, setPrevRank] = useState('Silver');
  const [numGames, setNumGames] = useState(5);
  const [queueType, setQueueType] = useState<'SOLO' | 'FLEX'>('SOLO');

  // Validation State
  const [checkIngame, setCheckIngame] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isRankVerified, setIsRankVerified] = useState(false);

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, any>>({
    express: false,
    duo: false,
    streaming: false,
    specificChamps: false,
    schedule: false,
  });

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    service: true, account: true, options: true
  });
  const toggleSection = (section: keyof typeof openSections) => { setOpenSections(prev => ({ ...prev, [section]: !prev[section] })); };

  // 1. Fetch Platform Fee
  useEffect(() => {
    const fetchFee = async () => {
      const res = await fetch('/api/settings/platform-fee');
      const data = await res.json();
      setPlatformFee(data.fee || 0);
    };
    fetchFee().catch(console.error);
  }, []);

  // 2. Fetch Booster Config
  useEffect(() => {
    if (!boosterId) {
        setBoosterConfig(null);
        return;
    }
    
    const fetchBoosterData = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch(`/api/boosters/${boosterId}`);
            const data = await res.json();
            const foundBooster = data.booster;
            
            if (foundBooster) {
                setBoosterConfig(foundBooster);
                setSelectedServer(foundBooster.booster_info?.service_settings?.servers?.[0] || '');
            } else {
                toast.error('Không tìm thấy thông tin Booster này');
            }
        } catch (error) {
            console.error("Failed to fetch booster config:", error);
            toast.error('Lỗi khi tải thông tin Booster');
        } finally {
            setLoadingConfig(false);
        }
    };

    fetchBoosterData();
  }, [boosterId]);

  // --- PRICING LOGIC ---
  const priceDetails = useMemo(() => {
    if (!boosterConfig?.booster_info?.service_settings) return null;
    const settings = boosterConfig.booster_info.service_settings;

    // 1. Determine Price Map based on Queue Type
    let priceMap = settings.placementPrices;
    if (queueType === 'FLEX') priceMap = settings.placementPricesFlex || settings.placementPrices;

    // 2. Get Base Price (Giá mỗi trận dựa trên Rank mùa trước)
    const pricePerGame = priceMap?.[prevRank] ?? settings.placementPrices?.[prevRank] ?? 0;
    const base = pricePerGame * numGames;

    // 3. Options
    const boosterOptions = settings.options || {};
    const optionDetails: { label: string; percent?: number; value: number }[] = [];
    let optionsTotalValue = 0;

    if (extraOptions.express && boosterOptions.express > 0) {
        const val = base * (boosterOptions.express / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Cày siêu tốc', percent: boosterOptions.express, value: val });
    }
    if (extraOptions.duo && boosterOptions.duo > 0) {
        const val = base * (boosterOptions.duo / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Duo với Booster', percent: boosterOptions.duo, value: val });
    }
    if (extraOptions.specificChamps && boosterOptions.specificChamps > 0) {
        const val = base * (boosterOptions.specificChamps / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Tướng chỉ định', percent: boosterOptions.specificChamps, value: val });
    }
    if (extraOptions.streaming && boosterOptions.streaming > 0) {
        const val = boosterOptions.streaming;
        optionsTotalValue += val;
        optionDetails.push({ label: 'Streaming', value: val });
    }
    // Schedule Fee
    if (extraOptions.schedule && Array.isArray(extraOptions.schedule) && extraOptions.schedule.length > 0 && boosterOptions.schedule && boosterOptions.scheduleFee > 0) {
        const val = base * (boosterOptions.scheduleFee / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Phí đặt lịch', percent: boosterOptions.scheduleFee, value: val });
    }

    // 4. Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // 5. Total
    const total = base + optionsTotalValue + platformFeeValue;

    return {
        basePrice: base,
        totalPrice: Math.max(0, Math.round(total)),
        optionDetails,
        platformFeeValue,
        depositAmount: 0 // Fix type error
    };
  }, [boosterConfig, prevRank, numGames, queueType, extraOptions, platformFee]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  const handleCheckRank = async () => {
      if (!checkIngame.trim()) return toast.error('Vui lòng nhập Riot ID (VD: Hide on bush#KR1)');
      if (!selectedServer) return toast.error('Vui lòng chọn Server trước khi check');
      
      setIsChecking(true);
      try {
          const res = await fetch('/api/riot/player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ server: selectedServer, name: checkIngame.trim() })
          });
          const data = await res.json();
          
          if (!res.ok) throw new Error(data.error);

          const qType = queueType === 'SOLO' ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';
          const league = data.leagues.find((l: any) => l.queueType === qType);

          if (league) {
              // Nếu có rank, tự động chọn rank đó làm "Rank mùa trước"
              const tierKey = league.tier.charAt(0).toUpperCase() + league.tier.slice(1).toLowerCase();
              const rankExists = PLACEMENT_RANKS.some(r => r.id === tierKey);
              if (rankExists) {
                  setPrevRank(tierKey);
                  toast.success(`Đã xác thực: ${league.tier} ${league.rank}. Hệ thống đã tự động chọn Rank mùa trước.`);
              } else {
                  toast.info(`Rank hiện tại là ${league.tier}, chọn Unranked làm mặc định.`);
                  setPrevRank('Unranked');
              }
          } else {
              // Nếu chưa có rank -> Đây là tài khoản mới, hoàn hảo cho placements
              toast.success('Tài khoản hợp lệ để cày phân hạng (Chưa có rank).');
              setPrevRank('Unranked');
          }

          setIsRankVerified(true);
          if (!gameUsername) setGameUsername(checkIngame.trim());

      } catch (e: any) {
          toast.error(e.message || 'Không tìm thấy người chơi');
      } finally {
          setIsChecking(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
            {/* LEFT: Configuration Form */}
            <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
                
                {/* Service Selection */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleSection('service')}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 font-bold">1</span>
                            <span>Thông tin dịch vụ</span>
                        </h3>
                        <div className="flex items-center gap-4">
                            {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                            <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openSections.service ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                    <AnimatePresence>
                        {openSections.service && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6 pt-0 space-y-6">
                                    {/* Input Check Rank */}
                                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                                        <label className="text-xs font-bold uppercase text-blue-400 tracking-wider mb-2 block flex items-center gap-2">
                                            <Search className="w-3 h-3" /> Kiểm tra tài khoản (Bắt buộc)
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Nhập Riot ID (VD: Faker#KR1)..." 
                                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                                value={checkIngame}
                                                onChange={(e) => setCheckIngame(e.target.value)}
                                            />
                                            <button 
                                                onClick={handleCheckRank}
                                                disabled={isChecking}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-zinc-500 mt-2 italic">
                                            * Hệ thống sẽ tự động chọn Rank mùa trước dựa trên thông tin tài khoản của bạn.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Queue Type */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Loại hàng chờ</label>
                                        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/10">
                                            {['SOLO', 'FLEX'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setQueueType(type as any)}
                                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                                        queueType === type 
                                                            ? 'bg-blue-600 text-white shadow-md' 
                                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                                    }`}
                                                >
                                                    {type === 'SOLO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Số trận muốn cày</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    onClick={() => setNumGames(num)}
                                                    className={`flex-1 py-3 rounded-xl font-bold border transition-all ${
                                                        numGames === num 
                                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                                    }`}
                                                >
                                                    {num} Trận
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </div>

                                    {/* Rank Selection */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Rank mùa trước</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                            {PLACEMENT_RANKS.map((rank) => {
                                                const isSelected = prevRank === rank.id;
                                                return (
                                                    <button
                                                        key={rank.id}
                                                        onClick={() => { if(isRankVerified) setPrevRank(rank.id) }}
                                                        disabled={!isRankVerified}
                                                        className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                                            isSelected 
                                                                ? 'bg-blue-600/10 border-blue-500 shadow-lg' 
                                                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <img src={rank.image} alt={rank.label} className="w-10 h-10 object-contain" />
                                                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{rank.label}</span>
                                                        {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Account Info Section */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleSection('account')}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 font-bold">2</span>
                            <span>Thông tin tài khoản</span>
                        </h3>
                        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openSections.account ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                        {openSections.account && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6 pt-0">
                                    <AccountInfo 
                                        accountType={accountType} setAccountType={setAccountType}
                                        server={selectedServer} setServer={setSelectedServer}
                                        username={gameUsername} setUsername={setGameUsername}
                                        password={gamePassword} setPassword={setGamePassword}
                                        servers={boosterConfig?.booster_info?.service_settings?.servers}
                                        disabled={!boosterId}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Options Section */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => toggleSection('options')}>
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 flex items-center justify-center bg-blue-500/10 rounded-lg text-blue-400 font-bold">3</span>
                            <span>Tùy chọn thêm</span>
                        </h3>
                        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${openSections.options ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                        {openSections.options && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-6 pb-6 pt-0">
                                    <ExtraOptions 
                                        boosterConfig={boosterConfig}
                                        options={extraOptions} setOptions={setExtraOptions}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT: Summary & Checkout */}
            <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
                <PaymentSummary
                    boosterConfig={boosterConfig}
                    boosterId={boosterId}
                    priceDetails={priceDetails}
                    platformFee={platformFee}
                    isValid={isAccountValid && isRankVerified}
                    validationMessage={
                        !isRankVerified
                            ? "Vui lòng nhập Riot ID và bấm 'Check' để xác thực tài khoản."
                            : (!isAccountValid ? "Vui lòng nhập đầy đủ thông tin tài khoản." : undefined)
                    }
                    serviceType="PLACEMENTS"
                    details={{
                        prev_rank: PLACEMENT_RANKS.find(r => r.id === prevRank)?.label,
                        num_games: numGames,
                        server: selectedServer,
                        account_username: gameUsername,
                        account_password: gamePassword
                    }}
                    options={extraOptions}
                    queueType={queueType}
                >
                    {/* Service Specific Breakdown Content */}
                    <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Dịch vụ:</span>
                                    <span className="text-white font-medium">Phân Hạng Đầu Mùa</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Rank mùa trước:</span>
                                    <span className="text-white font-medium">{PLACEMENT_RANKS.find(r => r.id === prevRank)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Số trận:</span>
                                    <span className="text-white font-medium">{numGames} trận</span>
                                </div>
                    </>
                </PaymentSummary>
            </div>

    </div>
  );
}

export default function PlacementsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <PlacementsContent />
    </Suspense>
  );
}
