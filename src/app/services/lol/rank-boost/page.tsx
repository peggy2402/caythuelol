// src/app/services/lol/rank-boost/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronRight, Flame, CheckCircle2, Loader2, AlertCircle, Rocket, Users, Video, ShieldCheck, Clock, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

// --- CONSTANTS & TYPES ---
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];

const ACCOUNT_TYPES = [
    { id: 'RIOT', name: 'Riot' },
    { id: 'GOOGLE', name: 'Google' },
    { id: 'FACEBOOK', name: 'Facebook' },
    { id: 'APPLE', name: 'Apple' },
    { id: 'XBOX', name: 'Xbox' },
];

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

function RankBoostContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // State
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

  // Platform Fee State
  const [platformFee, setPlatformFee] = useState(0);

  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [price, setPrice] = useState(0);

  // 1. Fetch Platform Fee
  useEffect(() => {
    const fetchFee = async () => {
      const res = await fetch('/api/settings/platform-fee');
      const data = await res.json();
      setPlatformFee(data.fee || 0);
    };
    fetchFee().catch(console.error);
  }, []);

  // 2. Fetch Booster Config khi boosterId thay đổi
  useEffect(() => {
    if (!boosterId) {
        setBoosterConfig(null);
        return;
    }
    
    const fetchBoosterData = async () => {
        setLoadingConfig(true);
        try {
            // TODO: Should be /api/boosters/${boosterId} for efficiency
            const res = await fetch(`/api/boosters`);
            const data = await res.json();
            
            // Tìm booster đang chọn trong danh sách trả về
            const boosters = data.boosters || [];
            const foundBooster = boosters.find((b: any) => b._id === boosterId);
            
            if (foundBooster) {
                setBoosterConfig(foundBooster);
                // Auto-select first available server of the booster
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

  // Auto-adjust Desired Rank if Current Rank >= Desired Rank
  useEffect(() => {
    const currentIdx = FLAT_TIERS.findIndex(t => t.key === currentTier);
    const desiredIdx = FLAT_TIERS.findIndex(t => t.key === desiredTier);

    if (currentIdx >= 0 && desiredIdx <= currentIdx) {
      // Find the next available tier
      if (currentIdx < FLAT_TIERS.length - 1) {
        setDesiredTier(FLAT_TIERS[currentIdx + 1].key);
      }
    }
  }, [currentTier, desiredTier]);

  // 3. Tính giá (Logic chi tiết)
  useEffect(() => {
    // Nếu chưa có config hoặc chưa chọn booster -> Giá = 0
    if (!boosterConfig?.booster_info?.service_settings) {
        setPrice(0);
        return;
    }

    const settings = boosterConfig.booster_info.service_settings;
    const rankKeys = FLAT_TIERS.map(t => t.key);
    
    const startIdx = rankKeys.indexOf(currentTier);
    const endIdx = rankKeys.indexOf(desiredTier);

    // Validate: Rank mong muốn phải cao hơn Rank hiện tại
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
        setPrice(0);
        return;
    }

    // A. Tính giá dịch vụ gốc (Base Price)
    let totalBase = 0;
    // Chọn bảng giá dựa trên hàng chờ (nếu Flex có bảng giá riêng thì dùng, không thì dùng bảng chung)
    const priceTable = (queueType === 'FLEX' && settings.rankPricesFlex && Object.keys(settings.rankPricesFlex).length > 0)
        ? settings.rankPricesFlex
        : settings.rankPrices;

    for (let i = startIdx; i < endIdx; i++) {
        const rankKey = rankKeys[i];
        // Cộng dồn giá của từng bậc rank cần vượt qua
        // Nếu bảng giá Flex thiếu key này, fallback về bảng giá thường
        const rankPrice = priceTable[rankKey] ?? settings.rankPrices?.[rankKey] ?? 0;
        totalBase += rankPrice;
    }

    // B. Áp dụng Hệ số Elo (LP Modifier)
    let lpModPercent = 0;
    const lp = parseInt(lpGain) || 0;
    
    if (settings.lpModifiers) {
        if (lp < 19) {
            lpModPercent = settings.lpModifiers.low || 0;
        } else if (lp >= 19 && lp <= 21) {
            lpModPercent = settings.lpModifiers.medium || 0;
        } else {
            lpModPercent = settings.lpModifiers.high || 0;
        }
    }
    const eloModifier = (1 + lpModPercent / 100);

    // C. Áp dụng Tùy chọn thêm (Options)
    let optionsPercentModifier = 1;
    let optionsFixedPrice = 0;
    const boosterOptions = settings.options || {};

    if (extraOptions.express && boosterOptions.express > 0) {
        optionsPercentModifier *= (1 + boosterOptions.express / 100);
    }
    if (extraOptions.duo && boosterOptions.duo > 0) {
        optionsPercentModifier *= (1 + boosterOptions.duo / 100);
    }
    if (extraOptions.specificChamps && boosterOptions.specificChamps > 0) {
        optionsPercentModifier *= (1 + boosterOptions.specificChamps / 100);
    }
    if (extraOptions.streaming && boosterOptions.streaming > 0) {
        optionsFixedPrice += boosterOptions.streaming;
    }

    // D. Tính giá cuối cùng
    // 1. Áp dụng các modifier % vào giá gốc, sau đó cộng giá cố định
    const priceWithMods = (totalBase * eloModifier * optionsPercentModifier) + optionsFixedPrice;
    // 2. Áp dụng phí nền tảng
    const finalPrice = priceWithMods * (1 + platformFee / 100);
    
    setPrice(Math.max(0, Math.round(finalPrice)));

  }, [currentTier, desiredTier, lpGain, queueType, boosterConfig, platformFee, extraOptions]);

  const renderTierSelector = (label: string, value: string, onChange: (val: string) => void, options: typeof FLAT_TIERS) => (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className="w-full appearance-none bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none transition-all font-medium">
          {options.map(t => <option key={t.key} value={t.key} className="bg-zinc-900">{t.label}</option>)}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
      </div>
    </div>
  );

  const handleOptionChange = (optionKey: string) => {
    setExtraOptions(prev => ({ ...prev, [optionKey]: !prev[optionKey] }));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const OptionCheckbox = ({ id, label, priceInfo, checked, onChange, disabled = false }: { id: string, label: string, priceInfo: string, checked: boolean, onChange: () => void, disabled?: boolean }) => (
    <label htmlFor={id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
        <div>
            <div className="font-bold text-white">{label}</div>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-green-400">{priceInfo}</span>
            <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="w-5 h-5 accent-blue-600 rounded-md bg-zinc-700 border-zinc-600 focus:ring-blue-500" />
        </div>
    </label>
  );

  // Helper to get LP Feedback Text
  const getLpFeedback = () => {
    if (!boosterConfig?.booster_info?.service_settings?.lpModifiers) return null;
    const lp = parseInt(lpGain);
    if (isNaN(lp)) return null;

    const mods = boosterConfig.booster_info.service_settings.lpModifiers;
    let percent = 0;
    
    if (lp < 19) percent = mods.low;
    else if (lp >= 19 && lp <= 21) percent = mods.medium;
    else percent = mods.high;

    if (percent === 0) return null;

    const isIncrease = percent > 0;
    return (
        <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${isIncrease ? 'text-red-400' : 'text-green-400'}`}>
            {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isIncrease ? 'Tăng giá' : 'Giảm giá'} {Math.abs(percent)}%
        </div>
    );
  };

  // Filter Desired Ranks (Must be > Current Rank)
  const currentTierIndex = FLAT_TIERS.findIndex(t => t.key === currentTier);
  const desiredTierOptions = FLAT_TIERS.filter((_, index) => index > currentTierIndex);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Thông tin Rank Boost</span>
            {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderTierSelector("Rank Hiện Tại", currentTier, setCurrentTier, FLAT_TIERS)}
            {renderTierSelector("Rank Mong Muốn", desiredTier, setDesiredTier, desiredTierOptions)}
            
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
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Điểm cộng (LP Gain)</label>
                <div className="relative">
                    <input 
                        type="number" 
                        value={lpGain} 
                        onChange={e => setLpGain(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                        placeholder="VD: 19"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">LP/Win</span>
                </div>
                {getLpFeedback()}
            </div>
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

      {/* Right Column: Summary & Payment */}
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

                    <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                        <span className="text-zinc-400">Dịch vụ:</span>
                        <span className="text-white font-bold">Rank Boost</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Từ:</span>
                        <span className="text-zinc-300 font-medium">{FLAT_TIERS.find(t => t.key === currentTier)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Đến:</span>
                        <span className="text-blue-400 font-bold">{FLAT_TIERS.find(t => t.key === desiredTier)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Phí nền tảng:</span>
                        <span className="text-white font-medium">{platformFee}%</span>
                    </div>
                    
                    {/* Total Price */}
                    <div className="flex justify-between items-end pt-4 border-t-2 border-white/10 mt-4">
                        <span className="text-zinc-400 font-medium">Tổng cộng:</span>
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                        </span>
                    </div>
                </div>
            )}

            <button 
                disabled={!boosterId || price <= 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
                <ShieldCheck className="w-5 h-5" />
                {price > 0 ? 'Tiến hành thuê' : 'Vui lòng cấu hình'}
            </button>
        </div>
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

// Helper icons for LP feedback
function TrendingUp(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
}

function TrendingDown(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
}
