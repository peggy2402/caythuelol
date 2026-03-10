'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Zap, Loader2, Crosshair, Clock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { TimeWindow } from '@/components/ScheduleModal';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';

function LevelingContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [currentLevel, setCurrentLevel] = useState(1);
  const [desiredLevel, setDesiredLevel] = useState(30);

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, any>>({
    express: false,
    streaming: false,
    duo: false,
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
    if (!boosterConfig?.booster_info?.service_settings || currentLevel >= desiredLevel) return null;
    const settings = boosterConfig.booster_info.service_settings;
    const priceMap = settings.levelingPrices || {};

    let base = 0;
    for (let lvl = currentLevel; lvl < desiredLevel; lvl++) {
        let rangeId = '';
        if (lvl < 11) rangeId = '1-10';
        else if (lvl < 21) rangeId = '11-20';
        else rangeId = '21-30';
        
        base += priceMap[rangeId] || 0;
    }

    // Options
    const boosterOptions = settings.options || {};
    const optionDetails: { label: string; percent?: number; value: number }[] = [];
    let optionsTotalValue = 0;

    // Express Fee
    if (extraOptions.express && boosterOptions.express > 0) {
        const val = base * (boosterOptions.express / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Cày siêu tốc', percent: boosterOptions.express, value: val });
    }
    // Streaming Fee
    if (extraOptions.streaming && boosterOptions.streaming > 0) {
        const val = boosterOptions.streaming;
        optionsTotalValue += val;
        optionDetails.push({ label: 'Streaming', value: val });
    }
    // Duo Fee
    if (extraOptions.duo && boosterOptions.duo > 0) {
        const val = base * (boosterOptions.duo / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Duo với Booster', percent: boosterOptions.duo, value: val });
    }
    // Schedule Fee
    if (extraOptions.schedule && boosterOptions.schedule && boosterOptions.scheduleFee > 0) {
        const val = base * (boosterOptions.scheduleFee / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Phí đặt lịch', percent: boosterOptions.scheduleFee, value: val });
    }

    // Specific Champs Fee
    if (extraOptions.specificChamps && boosterOptions.specificChamps > 0) {
        const val = base * (boosterOptions.specificChamps / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Tướng chỉ định', percent: boosterOptions.specificChamps, value: val });
    }
    // Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // Total
    const total = base + optionsTotalValue + platformFeeValue;

    return {
        basePrice: base,
        totalPrice: Math.max(0, Math.round(total)),
        optionDetails,
        platformFeeValue,
        levelsToGrind: desiredLevel - currentLevel,
        depositAmount: 0 // Fix type error
    };
  }, [boosterConfig, currentLevel, desiredLevel, extraOptions, platformFee]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
            {/* Service Config */}
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
                                {/* Level Sliders */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Level hiện tại</label>
                                        <span className="px-3 py-1 text-sm font-bold bg-zinc-950 border border-zinc-800 rounded-lg text-white">{currentLevel}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="1"
                                        max="29"
                                        value={currentLevel}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setCurrentLevel(val);
                                            if (val >= desiredLevel) {
                                                setDesiredLevel(val + 1);
                                            }
                                        }}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer range-thumb:bg-blue-500"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Level mong muốn</label>
                                        <span className="px-3 py-1 text-sm font-bold bg-zinc-950 border border-zinc-800 rounded-lg text-white">{desiredLevel}</span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="2"
                                        max="30"
                                        value={desiredLevel}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setDesiredLevel(val);
                                            if (val <= currentLevel) {
                                                setCurrentLevel(val - 1);
                                            }
                                        }}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer range-thumb:bg-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Account Info */}
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

        {/* Right Column */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
            <PaymentSummary
                boosterConfig={boosterConfig}
                boosterId={boosterId}
                priceDetails={priceDetails}
                platformFee={platformFee}
                isValid={isAccountValid}
                validationMessage={!isAccountValid && (gameUsername || gamePassword) ? "Vui lòng nhập đầy đủ thông tin tài khoản (tối thiểu 3 ký tự)." : undefined}
                serviceType="LEVELING"
                details={{
                    current_level: currentLevel,
                    desired_level: desiredLevel,
                    server: selectedServer,
                    account_username: gameUsername,
                    account_password: gamePassword
                }}
                options={extraOptions}
            >
                {/* Service Specific Breakdown Content */}
                <>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Dịch vụ:</span>
                                <span className="text-white font-medium">Cày Level</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Số level cần cày:</span>
                                <span className="text-white font-medium">{priceDetails?.levelsToGrind || 0} levels</span>
                            </div>
                </>
            </PaymentSummary>
        </div>

    </div>
  );
}

export default function LevelingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <LevelingContent />
    </Suspense>
  );
}