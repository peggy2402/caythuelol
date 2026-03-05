'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Trophy, Flame, Info, CheckCircle2, AlertCircle, ArrowRight, Shield, Swords, Zap, Wallet, Loader2, ChevronRight, Crosshair, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BoosterPicker from '@/components/BoosterPicker';
// import ScheduleModal, { TimeWindow } from '@/components/ScheduleModal';

const ACCOUNT_TYPES = [
    { id: 'RIOT', name: 'Riot' },
    { id: 'GOOGLE', name: 'Google' },
    { id: 'FACEBOOK', name: 'Facebook' },
    { id: 'APPLE', name: 'Apple' },
    { id: 'XBOX', name: 'Xbox' },
    { id: 'PLAYSTATION', name: 'PlayStation' }
];

// Default settings fallback (System defaults)
const DEFAULT_SETTINGS = {
  netWinPrices: { 'Master': 100000, 'Grandmaster': 150000, 'Challenger': 250000 },
  netWinPricesFlex: { 'Master': 100000, 'Grandmaster': 150000, 'Challenger': 250000 },
  netWinPricesDuo: { 'Master': 120000, 'Grandmaster': 180000, 'Challenger': 300000 },
  lpModifiers: { low: 20, medium: 0, high: -20 }
};

const RANKS = [
  { id: 'Master', label: 'Cao Thủ', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', image: '/images/ranks/master.png' },
  { id: 'Grandmaster', label: 'Đại Cao Thủ', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10', image: '/images/ranks/grandmaster.png' },
  { id: 'Challenger', label: 'Thách Đấu', color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', image: '/images/ranks/challenger.png' },
];

function TrendingUp(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}

function TrendingDown(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
}

function NetWinsContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [calcMode, setCalcMode] = useState<'BY_LP' | 'BY_GAMES'>('BY_LP');
  const [selectedRank, setSelectedRank] = useState('Master');
  const [currentLP, setCurrentLP] = useState<string>('');
  const [targetLP, setTargetLP] = useState<string>('');
  const [lpGain, setLpGain] = useState<string>('19');
  const [wins, setWins] = useState<string>('1');
  const [queueType, setQueueType] = useState<'SOLO' | 'FLEX'>('SOLO');

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, boolean>>({
    express: false,
    duo: false,
    streaming: false,
    specificChamps: false,
    schedule: false,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

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
            const res = await fetch(`/api/boosters`);
            const data = await res.json();
            const foundBooster = data.boosters?.find((b: any) => b._id === boosterId);
            
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
    let priceMap = settings.netWinPrices;
    if (queueType === 'FLEX') priceMap = settings.netWinPricesFlex || settings.netWinPrices;

    // 2. Get Base Price
    const unitPrice = priceMap?.[selectedRank] ?? settings.netWinPrices?.[selectedRank] ?? 0;
    
    let base = 0;
    const lpVal = parseInt(lpGain) || 0;

    if (calcMode === 'BY_LP') {
        const current = parseInt(currentLP) || 0;
        const target = parseInt(targetLP) || 0;
        const diff = Math.max(0, target - current);
        base = diff * unitPrice;
    } else {
        // BY_GAMES: Giá = Số trận * LP mỗi trận * Giá mỗi LP
        base = (parseInt(wins) || 0) * lpVal * unitPrice;
    }

    // 3. Calculate LP Modifier
    let modifierPct = 0;
    const lpGainVal = parseInt(lpGain) || 0;
    if (settings.lpModifiers && lpGainVal > 0) {
        if (lpGainVal < 19) modifierPct = settings.lpModifiers.low || 0;
        else if (lpGainVal > 21) modifierPct = settings.lpModifiers.high || 0;
        else modifierPct = settings.lpModifiers.medium || 0;
    }
    const eloFee = base * (modifierPct / 100);

    // 4. Options
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

    // 5. Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // 6. Total
    const total = base + eloFee + optionsTotalValue + platformFeeValue;

    // 7. Deposit Calculation
    const depositPercent = settings.netWinDepositPercent ?? 50; // Default 50% if not configured
    const depositAmount = Math.round(total * (depositPercent / 100));

    return {
        basePrice: base,
        eloFee: eloFee,
        totalPrice: Math.max(0, Math.round(total)),
        modifierPct,
        pricePerWin: unitPrice,
        optionDetails,
        platformFeeValue,
        depositPercent,
        depositAmount
    };
  }, [boosterConfig, selectedRank, wins, lpGain, queueType, extraOptions, platformFee, calcMode, currentLP, targetLP]);

  const handleOptionChange = (optionKey: string) => {
    if (optionKey === 'express' && !extraOptions.express && extraOptions.schedule) {
        toast.warning('Đã tắt "Đặt lịch" vì xung đột với "Cày siêu tốc".');
        setExtraOptions(prev => ({ ...prev, express: true, schedule: false }));
        return;
    }
    if (optionKey === 'schedule' && !extraOptions.schedule && extraOptions.express) {
        toast.error('Không thể chọn "Đặt lịch" khi đang dùng "Cày siêu tốc".');
        return;
    }
    setExtraOptions(prev => ({ ...prev, [optionKey]: !prev[optionKey] }));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const OptionCheckbox = ({ id, label, priceInfo, checked, onChange, disabled = false }: { id: string, label: string, priceInfo: string, checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <label htmlFor={id} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-white/20'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 bg-zinc-900 group-hover:border-zinc-500'}`}>
                {checked && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
            </div>
            <div className="font-medium text-zinc-200 text-xs sm:text-sm">{label}</div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">{priceInfo}</span>
        <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="hidden" />
    </label>
  );

  const isLpInvalid = useMemo(() => {
    if (calcMode !== 'BY_LP') return false;
    const current = parseInt(currentLP);
    const target = parseInt(targetLP);
    if (!isNaN(current) && !isNaN(target)) {
        return current >= target;
    }
    return false;
  }, [calcMode, currentLP, targetLP]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Rank Selection */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                        <span>Thông tin dịch vụ</span>
                        {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {RANKS.map((rank) => {
                            const isSelected = selectedRank === rank.id;
                            const Image = rank.image;
                            return (
                                <button
                                    key={rank.id}
                                    onClick={() => setSelectedRank(rank.id)}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        isSelected 
                                            ? `${rank.bg} ${rank.border} shadow-lg` 
                                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <img src={Image} alt={rank.label} width={40} height={40} />
                                    <span className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                        {rank.label}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-3 right-3">
                                            <CheckCircle2 className={`w-5 h-5 ${rank.color}`} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Mode Selection */}
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Chế độ cày</label>
                            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/10">
                                <button onClick={() => setCalcMode('BY_LP')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${calcMode === 'BY_LP' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>
                                    Cày theo số điểm (LP)
                                </button>
                                <button onClick={() => setCalcMode('BY_GAMES')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${calcMode === 'BY_GAMES' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>
                                    Cày theo số trận (Net Wins)
                                </button>
                            </div>
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
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {type === 'SOLO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* LP Gain */}
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">
                                Điểm cộng mỗi trận (LP Gain)
                            </label>
                            <div className="relative">
                                <select
                                    value={lpGain}
                                    onChange={(e) => setLpGain(e.target.value)}
                                    className="w-full appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                                >
                                    <option value="18">Dưới 19 LP (Elo Thấp)</option>
                                    <option value="19">19 - 21 LP (Elo Thường)</option>
                                    <option value="22">Trên 21 LP (Elo Cao)</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                            </div>
                            {priceDetails?.modifierPct !== 0 && (
                                <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${(priceDetails?.modifierPct || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {(priceDetails?.modifierPct || 0) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {(priceDetails?.modifierPct || 0) > 0 ? 'Tăng giá' : 'Giảm giá'} {Math.abs(priceDetails?.modifierPct || 0)}%
                                </div>
                            )}
                        </div>

                        {calcMode === 'BY_LP' ? (
                            <>
                                <div>
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Điểm hiện tại (LP)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={currentLP}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || parseInt(val) >= 0) {
                                                    setCurrentLP(val);
                                                }
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            placeholder="VD: 45"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">LP</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Điểm mong muốn (LP)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={targetLP}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || parseInt(val) >= 0) {
                                                    setTargetLP(val);
                                                }
                                            }}
                                            className={`w-full bg-zinc-900 border ${isLpInvalid ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-blue-500'} rounded-lg px-3 py-2 text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                            placeholder="VD: 100"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">LP</span>
                                    </div>
                                    {isLpInvalid && (
                                        <div className="text-red-500 text-xs mt-2 flex items-center gap-1 font-medium animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Điểm mong muốn phải lớn hơn điểm hiện tại
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Số trận mong muốn</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={wins}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || parseInt(val) > 0) {
                                                setWins(val);
                                            }
                                        }}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="VD: 5"
                                        min="1"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">Trận</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Info Section */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Thông tin tài khoản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Loại tài khoản</label>
                            <div className="relative">
                                <select value={accountType} onChange={e => setAccountType(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
                                    {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Server</label>
                            <div className="relative">
                                <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)} disabled={!boosterId} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium disabled:opacity-50">
                                    <option value="" disabled>-- Chọn server --</option>
                                    {boosterConfig?.booster_info?.service_settings?.servers?.map((s: string) => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Tài khoản</label>
                            <input type="text" value={gameUsername} onChange={e => setGameUsername(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none" placeholder="Tên đăng nhập" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Mật khẩu</label>
                            <input type="password" value={gamePassword} onChange={e => setGamePassword(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none" placeholder="Mật khẩu game" />
                        </div>
                    </div>
                </div>

                {/* Options Section */}
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Tùy chọn thêm</h3>
                    {boosterId && boosterConfig ? (
                        <div className="space-y-4">
                            {/* Role Selection */}
                            {boosterConfig.booster_info.service_settings.options?.roles?.length > 0 && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Tùy chọn vị trí / đường</label>
                                    <div className="flex flex-wrap gap-2">
                                        {boosterConfig.booster_info.service_settings.options.roles.map((role: string) => (
                                            <button
                                                key={role}
                                                onClick={() => toggleRole(role)}
                                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 ${
                                                    selectedRoles.includes(role) 
                                                        ? 'bg-blue-600 border-blue-500 text-white' 
                                                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                }`}
                                            >
                                                <Crosshair className="w-3 h-3" /> {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {boosterConfig.booster_info.service_settings.options?.express > 0 && (
                                <OptionCheckbox id="express" label="Cày siêu tốc" priceInfo={`+${boosterConfig.booster_info.service_settings.options.express}%`} checked={extraOptions.express} onChange={() => handleOptionChange('express')} />
                            )}
                            {boosterConfig.booster_info.service_settings.options?.duo > 0 && (
                                <OptionCheckbox id="duo" label="Chơi cùng Booster (Duo)" priceInfo={`+${boosterConfig.booster_info.service_settings.options.duo}%`} checked={extraOptions.duo} onChange={() => handleOptionChange('duo')} />
                            )}
                            {boosterConfig.booster_info.service_settings.options?.streaming > 0 && (
                                <OptionCheckbox id="streaming" label="Xem trực tiếp (Streaming)" priceInfo={`+${new Intl.NumberFormat('vi-VN').format(boosterConfig.booster_info.service_settings.options.streaming)} VNĐ`} checked={extraOptions.streaming} onChange={() => handleOptionChange('streaming')} />
                            )}
                            {boosterConfig.booster_info.service_settings.options?.specificChamps > 0 && (
                                <OptionCheckbox id="specificChamps" label="Chơi tướng chỉ định" priceInfo={`+${boosterConfig.booster_info.service_settings.options.specificChamps}%`} checked={extraOptions.specificChamps} onChange={() => handleOptionChange('specificChamps')} />
                            )}
                            {boosterConfig.booster_info.service_settings.options?.schedule && (
                                <OptionCheckbox id="schedule" label="Đặt lịch cày mỗi ngày" priceInfo="Miễn phí" checked={extraOptions.schedule} onChange={() => handleOptionChange('schedule')} />
                            )}
                        </div>
                    ) : (
                        <div className="p-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-center">
                            <p className="text-zinc-500 text-sm">
                                Vui lòng chọn Booster để xem các tùy chọn thêm.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Summary & Checkout */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-4">Thanh toán</h3>
                    
                    {!boosterId ? (
                        <div className="text-yellow-500 text-sm mb-4 flex items-start gap-2 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                            <Flame className="w-4 h-4 mt-0.5 shrink-0" /> 
                            <span>Vui lòng chọn <b>Booster</b> ở phía trên để xem giá chính xác.</span>
                        </div>
                    ) : (
                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                    {boosterConfig?.profile?.avatar && <img src={boosterConfig.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-400">Booster đang chọn</div>
                                    <div className="font-bold text-white text-sm">{boosterConfig?.username || 'Loading...'}</div>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Đơn giá ({selectedRank}):</span>
                                    <span className="text-white font-medium">{priceDetails?.pricePerWin.toLocaleString('vi-VN')} đ / trận</span>
                                </div>
                                {calcMode === 'BY_GAMES' ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Số lượng:</span>
                                        <span className="text-white font-medium">x {wins} trận</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Chênh lệch:</span>
                                        <span className="text-white font-medium">{Math.max(0, (parseInt(targetLP) || 0) - (parseInt(currentLP) || 0))} LP</span>
                                    </div>
                                )}
                                <div className="border-t border-white/5 my-1"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Giá gốc:</span>
                                    <span className="text-white font-medium">{priceDetails?.basePrice.toLocaleString('vi-VN')} đ</span>
                                </div>
                                {priceDetails?.modifierPct !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Hệ số Elo ({priceDetails?.modifierPct && priceDetails.modifierPct > 0 ? '+' : ''}{priceDetails?.modifierPct}%):</span>
                                        <span className={`${(priceDetails?.eloFee || 0) > 0 ? 'text-red-400' : 'text-green-400'} font-medium`}>
                                            {(priceDetails?.eloFee || 0) > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.eloFee || 0)}
                                        </span>
                                    </div>
                                )}
                                {priceDetails?.optionDetails.map((opt, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-zinc-400">{opt.label} {opt.percent ? `(${opt.percent}%)` : ''}:</span>
                                        <span className="text-white font-medium">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(opt.value)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Phí dịch vụ ({platformFee}%):</span>
                                    <span className="text-white font-medium">+{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.platformFeeValue || 0)}</span>
                                </div>
                            </div>
                            
                            {/* Total */}
                            <div className="pt-4 border-t-2 border-white/10 mt-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-zinc-400 font-medium">Tiền cọc ({priceDetails?.depositPercent}%):</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.depositAmount || 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-zinc-500">Tổng tiền dự kiến:</span>
                                    <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.totalPrice || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200/80 leading-relaxed">
                              <div className="flex gap-2">
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <span>
                                  <strong className="text-blue-300">Cách thanh toán:</strong><br/>
                                  • Bạn thanh toán trước <strong className="text-blue-300">{priceDetails?.depositPercent || 50}%</strong> để bắt đầu đơn.<br/>
                                  • Sau khi hoàn thành, <strong>Booster sẽ báo giá cuối cùng</strong> dựa trên LP/MMR thực tế.<br/>
                                  • Nếu giá cao hơn bạn chỉ cần <strong>trả thêm phần thiếu</strong><br/>
                                  • Nếu thấp hơn bạn sẽ <strong>được hoàn lại tiền thừa</strong>.
                                </span>
                              </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4 px-1">
                        <button 
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all shrink-0 ${agreedToTerms ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 hover:border-zinc-500'}`}
                        >
                            {agreedToTerms && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
                        </button>
                        <span className="text-xs sm:text-sm text-zinc-400 select-none cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                            Tôi đồng ý với <span className="text-blue-400 hover:underline">Điều khoản & Chính sách</span>
                        </span>
                    </div>

                    <button
                        disabled={!boosterId || !priceDetails || priceDetails.totalPrice <= 0 || !agreedToTerms || isLpInvalid}
                        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {priceDetails && priceDetails.totalPrice > 0 ? 'Tiến hành thuê' : 'Vui lòng cấu hình'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
    </div>
  );
}

export default function NetWinsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <NetWinsContent />
    </Suspense>
  );
}
