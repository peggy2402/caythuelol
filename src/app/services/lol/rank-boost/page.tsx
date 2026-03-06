// src/app/services/lol/rank-boost/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Loader2, Crosshair, Clock, CheckCircle2, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { TimeWindow } from '@/components/ScheduleModal';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';
import ScheduleModal from '@/components/ScheduleModal';

const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];

const FLAT_TIERS = (() => {
  const list: { key: string; label: string }[] = [];
  RANKS.forEach(rank => {
    if (rank === 'Master') {
      list.push({ key: 'MASTER', label: 'Master' });
    } else {
      DIVISIONS.forEach(div => {
        list.push({ key: `${rank.toUpperCase()}_${div}`, label: `${rank} ${div}` });
      });
    }
  });
  return list;
})();

// --- Sub-components ---

const VisualRankSelector = ({ 
    label, 
    value, 
    onChange, 
    minRankIndex = -1 
  }: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    minRankIndex?: number 
  }) => {
    const { tier: selectedTier, division: selectedDiv } = useMemo(() => {
        if (value === 'MASTER') return { tier: 'Master', division: '' };
        const parts = value.split('_');
        const t = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        return { tier: t, division: parts[1] };
    }, [value]);

    const handleTierClick = (tier: string) => {
        if (tier === 'Master') {
            onChange('MASTER');
            return;
        }
        
        let bestDiv = 'IV';
        for (const div of DIVISIONS) { 
             const testKey = `${tier.toUpperCase()}_${div}`;
             const idx = FLAT_TIERS.findIndex(t => t.key === testKey);
             if (idx > minRankIndex) {
                 bestDiv = div;
                 break; 
             }
        }
        onChange(`${tier.toUpperCase()}_${bestDiv}`);
    };

    return (
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{label}</label>
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4">
            <div className="grid grid-cols-4 gap-2 mb-4">
                {RANKS.map(rank => {
                    const isMaster = rank === 'Master';
                    const checkKey = isMaster ? 'MASTER' : `${rank.toUpperCase()}_I`;
                    const idx = FLAT_TIERS.findIndex(t => t.key === checkKey);
                    const disabled = idx <= minRankIndex;
                    const active = selectedTier === rank;

                    return (
                        <button 
                            key={rank}
                            type="button"
                            onClick={() => !disabled && handleTierClick(rank)}
                            disabled={disabled}
                            className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                                active 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                                : disabled 
                                    ? 'opacity-20 cursor-not-allowed border-transparent text-zinc-600'
                                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                        >
                            {rank}
                        </button>
                    );
                })}
            </div>

            {selectedTier !== 'Master' && (
                <div className="flex gap-2 p-1 bg-zinc-950/50 rounded-lg border border-white/5">
                    {DIVISIONS.map(div => {
                        const key = `${selectedTier.toUpperCase()}_${div}`;
                        const idx = FLAT_TIERS.findIndex(t => t.key === key);
                        const disabled = idx <= minRankIndex;
                        const active = selectedDiv === div;
                        
                        return (
                            <button
                                key={div}
                                type="button"
                                onClick={() => !disabled && onChange(key)}
                                disabled={disabled}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    active
                                    ? 'bg-zinc-700 text-white shadow'
                                    : disabled
                                        ? 'opacity-20 cursor-not-allowed text-zinc-600'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                            >
                                {div}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
      </div>
    );
};

// --- Main Content ---

function RankBoostContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // Basic State
  const [currentTier, setCurrentTier] = useState('SILVER_IV');
  const [desiredTier, setDesiredTier] = useState('GOLD_IV');
  const [lpGain, setLpGain] = useState('19');
  const [queueType, setQueueType] = useState('SOLO_DUO');
  
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
  const [scheduleWindows, setScheduleWindows] = useState<TimeWindow[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Config State
  const [platformFee, setPlatformFee] = useState(0);
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Effects
  useEffect(() => {
    fetch('/api/settings/platform-fee')
      .then(res => res.json())
      .then(data => setPlatformFee(data.fee || 0))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!boosterId) return;
    
    const fetchBoosterData = async () => {
        setLoadingConfig(true);
        try {
            const res = await fetch(`/api/boosters`);
            const data = await res.json();
            const boosters = data.boosters || [];
            const foundBooster = boosters.find((b: any) => b._id === boosterId);
            
            if (foundBooster) {
                setBoosterConfig(foundBooster);
                setSelectedServer(foundBooster.booster_info?.service_settings?.servers?.[0] || '');
            } else {
                toast.error('Không tìm thấy thông tin Booster này');
            }
        } catch (error) {
            toast.error('Lỗi khi tải thông tin Booster');
        } finally {
            setLoadingConfig(false);
        }
    };
    fetchBoosterData();
  }, [boosterId]);

  // Auto-adjust Desired Rank
  useEffect(() => {
    const currentIdx = FLAT_TIERS.findIndex(t => t.key === currentTier);
    const desiredIdx = FLAT_TIERS.findIndex(t => t.key === desiredTier);

    if (currentIdx >= 0 && desiredIdx <= currentIdx) {
      if (currentIdx < FLAT_TIERS.length - 1) {
        setDesiredTier(FLAT_TIERS[currentIdx + 1].key);
      }
    }
  }, [currentTier, desiredTier]);

  // Pricing Logic
  const priceDetails = useMemo(() => {
    if (!boosterConfig?.booster_info?.service_settings) return null;

    const settings = boosterConfig.booster_info.service_settings;
    const rankKeys = FLAT_TIERS.map(t => t.key);
    const startIdx = rankKeys.indexOf(currentTier);
    const endIdx = rankKeys.indexOf(desiredTier);

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return null;

    let totalBase = 0;
    const priceTable = (queueType === 'FLEX' && settings.rankPricesFlex && Object.keys(settings.rankPricesFlex).length > 0)
        ? settings.rankPricesFlex
        : settings.rankPrices;

    for (let i = startIdx; i < endIdx; i++) {
        const rankKey = rankKeys[i];
        totalBase += priceTable[rankKey] ?? settings.rankPrices?.[rankKey] ?? 0;
    }

    // LP Modifier
    let lpModPercent = 0;
    const lp = parseInt(lpGain);
    if (settings.lpModifiers) {
        if (lp < 19) lpModPercent = settings.lpModifiers.low || 0;
        else if (lp >= 19 && lp <= 21) lpModPercent = settings.lpModifiers.medium || 0;
        else lpModPercent = settings.lpModifiers.high || 0;
    }
    const lpModValue = totalBase * (lpModPercent / 100);

    // Options
    const boosterOptions = settings.options || {};
    const optionDetails: any[] = [];
    let optionsTotalValue = 0;

    const addOption = (key: string, label: string) => {
        if (extraOptions[key] && boosterOptions[key] > 0) {
            const val = totalBase * (boosterOptions[key] / 100);
            optionsTotalValue += val;
            optionDetails.push({ label, percent: boosterOptions[key], value: val });
        }
    };

    addOption('express', 'Cày siêu tốc');
    addOption('duo', 'Duo với Booster');
    addOption('specificChamps', 'Tướng chỉ định');
    
    if (extraOptions.streaming && boosterOptions.streaming > 0) {
        optionsTotalValue += boosterOptions.streaming;
        optionDetails.push({ label: 'Streaming', value: boosterOptions.streaming });
    }

    if (extraOptions.schedule && boosterOptions.scheduleFee > 0) {
        const val = totalBase * (boosterOptions.scheduleFee / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Phí đặt lịch', percent: boosterOptions.scheduleFee, value: val });
    }

    const platformFeeValue = totalBase * (platformFee / 100);
    const total = totalBase + lpModValue + optionsTotalValue + platformFeeValue;

    return {
        basePrice: totalBase,
        lpModPercent,
        lpModValue,
        optionDetails,
        platformFeeValue,
        total: Math.max(0, Math.round(total))
    };
  }, [currentTier, desiredTier, lpGain, queueType, boosterConfig, platformFee, extraOptions]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  const currentTierIndex = FLAT_TIERS.findIndex(t => t.key === currentTier);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Thông tin dịch vụ Cày Rank/Elo</span>
            {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VisualRankSelector label="Rank Hiện Tại" value={currentTier} onChange={setCurrentTier} />
            <VisualRankSelector label="Rank Mong Muốn" value={desiredTier} onChange={setDesiredTier} minRankIndex={currentTierIndex} />
            
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Loại hàng chờ</label>
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
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Điểm cộng mỗi trận (LP Gain)</label>
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
            </div>
          </div>
        </div>
        
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

      <div className="lg:col-span-1">
        <PaymentSummary
            boosterConfig={boosterConfig}
            boosterId={boosterId}
            priceDetails={priceDetails ? { 
                basePrice: priceDetails.basePrice, 
                totalPrice: priceDetails.total, 
                optionDetails: priceDetails.optionDetails, 
                platformFeeValue: priceDetails.platformFeeValue 
            } : null}
            platformFee={platformFee}
            isValid={isAccountValid}
            validationMessage={!isAccountValid && (gameUsername || gamePassword) ? "Vui lòng nhập đầy đủ thông tin tài khoản." : undefined}
            serviceType="RANK_BOOST"
            details={{
                current_rank: FLAT_TIERS.find(t => t.key === currentTier)?.label,
                desired_rank: FLAT_TIERS.find(t => t.key === desiredTier)?.label,
                lp_gain: lpGain,
                server: selectedServer,
                account_username: gameUsername,
                account_password: gamePassword
            }}
            options={extraOptions}
            queueType={queueType}
        >
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Giá Rank:</span>
                    <span className="text-white font-medium">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.basePrice || 0)}</span>
                </div>

                {priceDetails?.lpModPercent !== 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Hệ số Elo ({priceDetails?.lpModPercent}%):</span>
                        <span className={`${(priceDetails?.lpModValue || 0) > 0 ? 'text-red-400' : 'text-green-400'} font-medium`}>
                            {priceDetails?.lpModValue && priceDetails.lpModValue > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.lpModValue || 0)}
                        </span>
                    </div>
                )}

                {(selectedRoles.length > 0 || (extraOptions.schedule && scheduleWindows.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/50 text-xs text-zinc-500 space-y-1">
                        {selectedRoles.length > 0 && (
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1"><Crosshair className="w-3 h-3"/> Vị trí:</span>
                                <span className="text-zinc-300 truncate max-w-[60%]">{selectedRoles.join(', ')}</span>
                            </div>
                        )}
                        {extraOptions.schedule && scheduleWindows.length > 0 && (
                            <div className="flex justify-between items-start">
                                <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> Khung giờ nghỉ:</span>
                                <div className="text-right text-red-400 font-mono">
                                    {scheduleWindows.map((w, i) => <div key={i}>{w.start}-{w.end}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
            </div>

        </PaymentSummary>
      </div>

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={(windows) => setScheduleWindows(windows)}
        initialWindows={scheduleWindows}
      />
    </div>
  );
}

export default function RankBoostPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <RankBoostContent />
    </Suspense>
  );
}