// src/app/services/lol/rank-boost/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Loader2, ChevronDown, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';
import { detectUserServer } from '@/lib/geo';

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
  
  // Validation State
  const [checkIngame, setCheckIngame] = useState('');
  const [verifiedRankIndex, setVerifiedRankIndex] = useState(-1);
  const [isChecking, setIsChecking] = useState(false);
  
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

  // Config State
  const [platformFee, setPlatformFee] = useState(0);
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    service: true, account: true, options: true
  });
  const toggleSection = (section: keyof typeof openSections) => { setOpenSections(prev => ({ ...prev, [section]: !prev[section] })); };

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
    const optionDetails: { label: string; percent?: number; value: number }[] = [];
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

    if (extraOptions.schedule && Array.isArray(extraOptions.schedule) && extraOptions.schedule.length > 0 && boosterOptions.scheduleFee > 0) {
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
        total: Math.max(0, Math.round(total)),
        depositAmount: 0 // Rank Boost thanh toán 100% nên cọc = 0 (hoặc xử lý logic khác nếu muốn)
    };
  }, [currentTier, desiredTier, lpGain, queueType, boosterConfig, platformFee, extraOptions]);

  // Validation Logic: Account + Rank Check
  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  const isRankVerified = verifiedRankIndex > -1; // Bắt buộc phải Check Rank thành công (index >= 0)

  const currentTierIndex = FLAT_TIERS.findIndex(t => t.key === currentTier);

  // Hàm Check Rank
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

          const qType = queueType === 'SOLO_DUO' ? 'RANKED_SOLO_5x5' : 'RANKED_FLEX_SR';
          const league = data.leagues.find((l: any) => l.queueType === qType);

          if (league) {
              // Map Riot Tier to our Key (e.g. GOLD_IV)
              let key = `${league.tier}_${league.rank}`;
              if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(league.tier)) key = 'MASTER';
              
              const idx = FLAT_TIERS.findIndex(t => t.key === key);
              
              if (idx !== -1) {
                  setCurrentTier(key);
                  setVerifiedRankIndex(idx); // Khóa các rank thấp hơn
                  toast.success(`Đã xác thực: ${league.tier} ${league.rank} (${league.leaguePoints} LP)`);
                  
                  // Tự động điền vào Account Info nếu chưa có
                  if (!gameUsername) setGameUsername(checkIngame.trim());
              } else {
                  toast.error(`Không hỗ trợ rank này: ${league.tier}`);
              }
          } else {
              toast.warning(`Tài khoản chưa có rank ${queueType === 'SOLO_DUO' ? 'Đơn/Đôi' : 'Linh Hoạt'}.`);
              setVerifiedRankIndex(-1); // Reset
          }
      } catch (e: any) {
          toast.error(e.message || 'Không tìm thấy người chơi');
      } finally {
          setIsChecking(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
      <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Thông tin dịch vụ Cày Rank/Elo</span>
            {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Check Rank */}
            <div className="md:col-span-2 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
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
                    * Hệ thống sẽ tự động chọn Rank hiện tại chuẩn xác nhất để tránh sai sót.
                </p>
            </div>

            <VisualRankSelector 
                label="Rank Hiện Tại" 
                value={currentTier} 
                onChange={setCurrentTier} 
                minRankIndex={verifiedRankIndex - 1} // Khóa các rank thấp hơn rank đã check
            />
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
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
        <PaymentSummary
            boosterConfig={boosterConfig}
            boosterId={boosterId}
            priceDetails={priceDetails ? { 
                basePrice: priceDetails.basePrice, 
                totalPrice: priceDetails.total, 
                optionDetails: priceDetails.optionDetails, 
                platformFeeValue: priceDetails.platformFeeValue,
                depositAmount: priceDetails.depositAmount
            } : null}
            platformFee={platformFee}
            isValid={isAccountValid && isRankVerified}
            validationMessage={
                !isRankVerified 
                    ? "Vui lòng nhập Riot ID và bấm 'Check' để xác thực Rank hiện tại trước khi thuê."
                    : (!isAccountValid ? "Vui lòng nhập đầy đủ thông tin tài khoản." : undefined)
            }
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
            </div>

        </PaymentSummary>
      </div>
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