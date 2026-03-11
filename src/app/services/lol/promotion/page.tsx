'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';
 

const PROMOTION_STEPS = [
  { id: 'Iron_I', label: 'Sắt I ➜ Đồng IV', from: 'Sắt I', to: 'Đồng IV', color: 'text-zinc-400', image: '/images/ranks/iron.png' },
  { id: 'Bronze_I', label: 'Đồng I ➜ Bạc IV', from: 'Đồng I', to: 'Bạc IV', color: 'text-orange-700', image: '/images/ranks/bronze.png' },
  { id: 'Silver_I', label: 'Bạc I ➜ Vàng IV', from: 'Bạc I', to: 'Vàng IV', color: 'text-zinc-300', image: '/images/ranks/silver.png' },
  { id: 'Gold_I', label: 'Vàng I ➜ Bạch Kim IV', from: 'Vàng I', to: 'Bạch Kim IV', color: 'text-yellow-400', image: '/images/ranks/gold.png' },
  { id: 'Platinum_I', label: 'Bạch Kim I ➜ Lục Bảo IV', from: 'Bạch Kim I', to: 'Lục Bảo IV', color: 'text-cyan-400', image: '/images/ranks/platinum.png' },
  { id: 'Emerald_I', label: 'Lục Bảo I ➜ Kim Cương IV', from: 'Lục Bảo I', to: 'Kim Cương IV', color: 'text-emerald-400', image: '/images/ranks/emerald.png' },
  { id: 'Diamond_I', label: 'Kim Cương I ➜ Cao Thủ', from: 'Kim Cương I', to: 'Cao Thủ', color: 'text-blue-400', image: '/images/ranks/diamond.png' },
];

function PromotionContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');
  const router = useRouter();

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [selectedPromo, setSelectedPromo] = useState(PROMOTION_STEPS[2].id); // Default Silver -> Gold
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
    let priceMap = settings.promotionPrices;
    if (queueType === 'FLEX') priceMap = settings.promotionPricesFlex || settings.promotionPrices;

    // 2. Get Base Price
    const base = priceMap?.[selectedPromo] ?? settings.promotionPrices?.[selectedPromo] ?? 0;

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
  }, [boosterConfig, selectedPromo, queueType, extraOptions, platformFee]);

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
              // Map Riot Tier to our Key (e.g. Gold_I)
              const key = `${league.tier}_${league.rank}`;
              const promoStep = PROMOTION_STEPS.find(p => p.id === key);
              
              if (promoStep) {
                  setSelectedPromo(key);
                  setIsRankVerified(true);
                  toast.success(`Đã xác thực: ${league.tier} ${league.rank}. Hệ thống đã tự động chọn chuỗi phù hợp.`);
                  if (!gameUsername) setGameUsername(checkIngame.trim());
              } else {
                  toast.error(`Rank hiện tại (${league.tier} ${league.rank}) không phải là bậc I. Dịch vụ này chỉ dành cho chuỗi thăng hạng từ bậc I.`);
                  setIsRankVerified(false);
              }
          } else {
              toast.warning(`Tài khoản chưa có rank ${queueType === 'SOLO' ? 'Đơn/Đôi' : 'Linh Hoạt'}. Không thể xác thực.`);
              setIsRankVerified(false);
          }
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
                                            <Search className="w-3 h-3" /> Kiểm tra Rank hiện tại (Bắt buộc)
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
                                            * Hệ thống sẽ tự động chọn chuỗi thăng hạng phù hợp với Rank của bạn.
                                        </p>
                                    </div>

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

                                    {/* Promotion Step Selection */}
                                    <div>
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Chọn chuỗi thăng hạng</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {PROMOTION_STEPS.map((step) => {
                                                const isSelected = selectedPromo === step.id;
                                                return (
                                                    <button
                                                        key={step.id}
                                                        onClick={() => { if(isRankVerified) setSelectedPromo(step.id) }}
                                                        disabled={!isRankVerified}
                                                        className={`relative p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between group ${
                                                            isSelected 
                                                                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                                                                : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60 disabled:opacity-50 disabled:cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 sm:gap-4">
                                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center p-1.5 border shrink-0 ${isSelected ? 'bg-blue-500/20 border-blue-500/50' : 'bg-zinc-900 border-zinc-800'}`}>
                                                                <img src={step.image} alt={step.from} className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{step.from}</div>
                                                                <div className="text-xs text-zinc-500">lên <span className={isSelected ? 'text-blue-400' : ''}>{step.to}</span></div>
                                                            </div>
                                                        </div>
                                                        <div className={`flex items-center gap-2 ${isSelected ? 'text-blue-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                                            <span className="text-xs font-medium hidden sm:block">Thăng hạng</span>
                                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </div>
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
            <div className="fixed bottom-0 left-0 right-0 z-[60] lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
                <PaymentSummary
                    boosterConfig={boosterConfig}
                    boosterId={boosterId}
                    priceDetails={priceDetails}
                    platformFee={platformFee}
                    isValid={isAccountValid && isRankVerified}
                    validationMessage={
                        !isRankVerified
                            ? "Vui lòng nhập Riot ID và bấm 'Check' để xác thực Rank."
                            : (!isAccountValid ? "Vui lòng nhập đầy đủ thông tin tài khoản." : undefined)
                    }
                    serviceType="PROMOTION"
                    details={{
                        promo_from: PROMOTION_STEPS.find(s => s.id === selectedPromo)?.from,
                        promo_to: PROMOTION_STEPS.find(s => s.id === selectedPromo)?.to,
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
                                    <span className="text-white font-medium">Chuỗi Thăng Hạng</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Chuỗi:</span>
                                    <span className="text-white font-medium">{PROMOTION_STEPS.find(s => s.id === selectedPromo)?.from} ➜ {PROMOTION_STEPS.find(s => s.id === selectedPromo)?.to}</span>
                                </div>
                    </>
                </PaymentSummary>
            </div>

    </div>
  );
}

export default function PromotionPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <PromotionContent />
    </Suspense>
  );
}