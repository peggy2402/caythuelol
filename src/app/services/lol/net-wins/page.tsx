'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Info, AlertCircle, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/net-wins/PaymentSummary';
import { detectUserServer } from '@/lib/geo';

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

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, any>>({
    express: false,
    duo: false,
    streaming: false,
    specificChamps: false,
    schedule: false,
  });

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
                
                // Auto-detect server
                const boosterServers = foundBooster.booster_info?.service_settings?.servers || [];
                detectUserServer().then(detected => {
                    if (detected && boosterServers.includes(detected)) {
                        setSelectedServer(detected);
                    } else {
                        setSelectedServer(boosterServers[0] || '');
                    }
                });
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
    // Schedule Fee
    if (extraOptions.schedule && Array.isArray(extraOptions.schedule) && extraOptions.schedule.length > 0 && boosterOptions.schedule && boosterOptions.scheduleFee > 0) {
        const val = base * (boosterOptions.scheduleFee / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Phí đặt lịch', percent: boosterOptions.scheduleFee, value: val });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
            {/* LEFT: Configuration Form */}
            <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
                
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
                />
            </div>

            {/* RIGHT: Summary & Checkout */}
            <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
                <PaymentSummary
                    boosterConfig={boosterConfig}
                    boosterId={boosterId}
                    priceDetails={priceDetails}
                    platformFee={platformFee}
                    isValid={isAccountValid && !isLpInvalid}
                    validationMessage={
                        !isAccountValid && (gameUsername || gamePassword) 
                            ? "Vui lòng nhập đầy đủ thông tin tài khoản (tối thiểu 3 ký tự)." 
                            : isLpInvalid 
                                ? "Điểm mong muốn phải lớn hơn điểm hiện tại." 
                                : undefined
                    }
                    serviceType="NET_WINS"
                    details={{
                        current_lp: currentLP,
                        target_lp: targetLP,
                        num_games: wins,
                        calc_mode: calcMode,
                        current_rank: RANKS.find(r => r.id === selectedRank)?.label, // Add this for checkout display
                        rank: selectedRank,
                        server: selectedServer,
                        account_username: gameUsername,
                        account_password: gamePassword // Note: Should encrypt in real app before URL
                    }}
                    options={extraOptions}
                    queueType={queueType}
                >
                    {/* Service Specific Breakdown Content */}
                    <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Dịch vụ:</span>
                                    <span className="text-white font-medium">Cày Net Wins</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Rank:</span>
                                    <span className="text-white font-medium">{RANKS.find(r => r.id === selectedRank)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Đơn giá:</span>
                                    <span className="text-white font-medium">{priceDetails?.pricePerWin.toLocaleString('vi-VN')} đ / {calcMode === 'BY_LP' ? 'LP' : 'trận'}</span>
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

                                {priceDetails?.modifierPct !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">Hệ số Elo ({priceDetails?.modifierPct && priceDetails.modifierPct > 0 ? '+' : ''}{priceDetails?.modifierPct}%):</span>
                                        <span className={`${(priceDetails?.eloFee || 0) > 0 ? 'text-red-400' : 'text-green-400'} font-medium`}>
                                            {(priceDetails?.eloFee || 0) > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.eloFee || 0)}
                                        </span>
                                    </div>
                                )}

                                {/* Deposit Info Highlight */}
                                <div className="mt-2 p-2 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-emerald-400 font-bold text-sm">Tiền cọc ({priceDetails?.depositPercent}%):</span>
                                        <span className="text-lg font-bold text-emerald-400">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.depositAmount || 0)}
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
                    </>
                </PaymentSummary>
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
