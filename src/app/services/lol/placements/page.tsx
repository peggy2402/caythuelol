'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Swords, Flame, CheckCircle2, Loader2, ArrowRight, Shield, Zap, Wallet, Info, ChevronRight, Crosshair } from 'lucide-react';
import { toast } from 'sonner';

const ACCOUNT_TYPES = [
    { id: 'RIOT', name: 'Riot' },
    { id: 'GOOGLE', name: 'Google' },
    { id: 'FACEBOOK', name: 'Facebook' },
    { id: 'APPLE', name: 'Apple' },
    { id: 'XBOX', name: 'Xbox' },
    { id: 'PLAYSTATION', name: 'PlayStation' }
];

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

  const handleOptionChange = (optionKey: string) => {
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
                                <div className="border-t border-white/5 my-1"></div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-400">Giá gốc:</span>
                                    <span className="text-white font-medium">{priceDetails?.basePrice.toLocaleString('vi-VN')} đ</span>
                                </div>
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
                            <div className="flex justify-between items-end pt-4 border-t-2 border-white/10 mt-4">
                                <span className="text-zinc-400 font-medium">Tổng cộng:</span>
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceDetails?.totalPrice || 0)}
                                </span>
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
                        disabled={!boosterId || !priceDetails || priceDetails.totalPrice <= 0 || !agreedToTerms}
                        className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {priceDetails && priceDetails.totalPrice > 0 ? 'Tiến hành thuê' : 'Vui lòng cấu hình'} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
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
