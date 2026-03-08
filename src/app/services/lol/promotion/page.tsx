'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, Crosshair, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { TimeWindow } from '@/components/ScheduleModal';
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

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [selectedPromo, setSelectedPromo] = useState(PROMOTION_STEPS[2].id); // Default Silver -> Gold
  const [queueType, setQueueType] = useState<'SOLO' | 'FLEX'>('SOLO');

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, boolean>>({
    express: false,
    duo: false,
    streaming: false,
    specificChamps: false,
    schedule: false,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Schedule State
  const [scheduleWindows, setScheduleWindows] = useState<TimeWindow[]>([]);

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
    if (extraOptions.schedule && boosterOptions.schedule && boosterOptions.scheduleFee > 0) {
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
        platformFeeValue
    };
  }, [boosterConfig, selectedPromo, queueType, extraOptions, platformFee]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Service Selection */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span>Thông tin dịch vụ</span>
                        {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </h3>
                    
                    <div className="space-y-6">
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
                                            onClick={() => setSelectedPromo(step.id)}
                                            className={`relative p-3 sm:p-4 rounded-xl border transition-all flex items-center justify-between group ${
                                                isSelected 
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                                                    : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
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
                </div>

                {/* Account Info Section */}
                <AccountInfo 
                    accountType={accountType} setAccountType={setAccountType}
                    server={selectedServer} setServer={setSelectedServer}
                    username={gameUsername} setUsername={setGameUsername}
                    password={gamePassword} setPassword={setGamePassword}
                    servers={boosterConfig?.booster_info?.service_settings?.servers}
                    disabled={!boosterId}
                />

                {/* Options Section */}
                <ExtraOptions 
                    boosterConfig={boosterConfig}
                    options={extraOptions} setOptions={setExtraOptions}
                    selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles}
                    scheduleWindows={scheduleWindows} setScheduleWindows={setScheduleWindows}
                />
            </div>

            {/* RIGHT: Summary & Checkout */}
            <div className="lg:col-span-1">
                <PaymentSummary
                    boosterConfig={boosterConfig}
                    boosterId={boosterId}
                    priceDetails={priceDetails}
                    platformFee={platformFee}
                    isValid={isAccountValid}
                    validationMessage={!isAccountValid && (gameUsername || gamePassword) ? "Vui lòng nhập đầy đủ thông tin tài khoản (tối thiểu 3 ký tự)." : undefined}
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
                                {/* Hiển thị thông tin bổ sung (Roles/Schedule) nếu có */}
                                {(selectedRoles.length > 0 || (extraOptions.schedule && scheduleWindows.length > 0)) && (
                                    <div className="mt-2 pt-2 border-t border-zinc-800/50 text-xs text-zinc-500 space-y-1">
                                        {selectedRoles.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="flex items-center gap-1"><Crosshair className="w-3 h-3"/> Vị trí:</span>
                                                <span className="text-zinc-300 text-right max-w-[60%] truncate" title={selectedRoles.join(', ')}>{selectedRoles.join(', ')}</span>
                                            </div>
                                        )}
                                        {extraOptions.schedule && scheduleWindows.length > 0 && (
                                            <div className="flex justify-between items-start">
                                                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> Cấm chơi {boosterConfig.booster_info.service_settings.options.scheduleFee > 0 ? `(+${boosterConfig.booster_info.service_settings.options.scheduleFee}%)` : ''}:</span>
                                                <div className="text-right">
                                                    {scheduleWindows.map((w, i) => (
                                                        <div key={i} className="text-red-400 font-mono">{w.start}-{w.end}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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