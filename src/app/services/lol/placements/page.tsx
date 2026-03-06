'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Crosshair, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { TimeWindow } from '@/components/ScheduleModal';
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

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [selectedRank, setSelectedRank] = useState('Silver');
  const [numGames, setNumGames] = useState(5);
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
    let priceMap = settings.placementPrices;
    if (queueType === 'FLEX') priceMap = settings.placementPricesFlex || settings.placementPrices;

    // 2. Get Base Price
    // Key format: P_{RANK}_{GAMES} (e.g., P_SILVER_5)
    const key = `P_${selectedRank.toUpperCase()}_${numGames}`;
    const base = priceMap?.[key] ?? settings.placementPrices?.[key] ?? 0;

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
  }, [boosterConfig, selectedRank, numGames, queueType, extraOptions, platformFee]);

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

                        {/* Rank Selection */}
                        <div>
                            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Rank mùa trước</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {PLACEMENT_RANKS.map((rank) => {
                                    const isSelected = selectedRank === rank.id;
                                    return (
                                        <button
                                            key={rank.id}
                                            onClick={() => setSelectedRank(rank.id)}
                                            className={`relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                                isSelected 
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-lg' 
                                                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
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

                        {/* Number of Games */}
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
                    serviceType="PLACEMENTS"
                    details={{
                        prev_rank: PLACEMENT_RANKS.find(r => r.id === selectedRank)?.label,
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
                                    <span className="text-white font-medium">{PLACEMENT_RANKS.find(r => r.id === selectedRank)?.label}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Số trận:</span>
                                    <span className="text-white font-medium">{numGames} trận</span>
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

export default function PlacementsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <PlacementsContent />
    </Suspense>
  );
}
