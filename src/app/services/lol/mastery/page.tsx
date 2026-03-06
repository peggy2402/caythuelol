// src/app/services/lol/mastery/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Info, ChevronRight, Crosshair, Search, X, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import ScheduleModal, { TimeWindow } from '@/components/ScheduleModal';
import AccountInfo from '@/components/services/lol/AccountInfo';
import ExtraOptions from '@/components/services/lol/ExtraOptions';
import PaymentSummary from '@/components/services/lol/PaymentSummary';
import { is } from 'zod/v4/locales';

const MASTERY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ROLE_FILTERS = [
  { id: 'Fighter', label: 'Đấu sĩ' },
  { id: 'Tank', label: 'Đỡ đòn' },
  { id: 'Mage', label: 'Pháp sư' },
  { id: 'Assassin', label: 'Sát thủ' },
  { id: 'Marksman', label: 'Xạ thủ' },
  { id: 'Support', label: 'Hỗ trợ' },
];

function MasteryContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [currentLevel, setCurrentLevel] = useState(1);
  const [desiredLevel, setDesiredLevel] = useState(7);
  
  // Champion State
  const [allChampions, setAllChampions] = useState<any[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<any>(null);
  const [championQuery, setChampionQuery] = useState('');
  const [isChampModalOpen, setIsChampModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Account Info State
  const [accountType, setAccountType] = useState('RIOT');
  const [gameUsername, setGameUsername] = useState('');
  const [gamePassword, setGamePassword] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [scheduleWindows, setScheduleWindows] = useState<TimeWindow[]>([]);
  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, boolean>>({
    express: false,
    streaming: false,
    specificChamps: false, // Mặc định là true vì Mastery luôn cần chọn tướng, nhưng ở đây để toggle cho logic giá
    duo: false,
    schedule: false,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // 1. Fetch Platform Fee
  useEffect(() => {
    const fetchFee = async () => {
      const res = await fetch('/api/settings/platform-fee');
      const data = await res.json();
      setPlatformFee(data.fee || 0);
    };
    fetchFee().catch(console.error);
  }, []);

  // Fetch Champions
  useEffect(() => {
    fetch('/api/champions')
      .then(res => res.json())
      .then(data => setAllChampions(data || []))
      .catch(err => console.error('Failed to load champions', err));
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
    if (!boosterConfig?.booster_info?.service_settings || currentLevel >= desiredLevel) return null;
    const settings = boosterConfig.booster_info.service_settings;
    const priceMap = settings.masteryPrices || {};

    let base = 0;
    for (let i = currentLevel; i < desiredLevel; i++) {
        const key = `M${i}_M${i + 1}`;
        base += priceMap[key] || 0;
    }

    // Options
    const boosterOptions = settings.options || {};
    const optionDetails: { label: string; percent?: number; value: number }[] = [];
    let optionsTotalValue = 0;

    if (extraOptions.express && boosterOptions.express > 0) {
        const val = base * (boosterOptions.express / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Cày siêu tốc', percent: boosterOptions.express, value: val });
    }
    if (extraOptions.streaming && boosterOptions.streaming > 0) {
        const val = boosterOptions.streaming;
        optionsTotalValue += val;
        optionDetails.push({ label: 'Streaming', value: val });
    }
    // Mastery luôn là Specific Champ, nhưng nếu Booster có tính phí thêm thì cộng vào
    if (extraOptions.specificChamps && boosterOptions.specificChamps > 0) {
        const val = base * (boosterOptions.specificChamps / 100);
        optionsTotalValue += val;
        optionDetails.push({ label: 'Tướng chỉ định', percent: boosterOptions.specificChamps, value: val });
    }
    // Role-specific fee (nếu có)
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

    // Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // Total
    const total = base + optionsTotalValue + platformFeeValue;

    return {
        basePrice: base,
        totalPrice: Math.max(0, Math.round(total)),
        optionDetails,
        platformFeeValue
    };
  }, [boosterConfig, currentLevel, desiredLevel, extraOptions, platformFee]);

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
    if (optionKey === 'schedule') {
        if (extraOptions.schedule) {
            // Nếu đang bật -> Tắt và xóa lịch
            setExtraOptions(prev => ({ ...prev, schedule: false }));
            setScheduleWindows([]);
        } else {
            // Nếu đang tắt -> Mở Modal để cấu hình
            setIsScheduleModalOpen(true);
        }
    } else {
        setExtraOptions(prev => ({ ...prev, [optionKey]: !prev[optionKey] }));
    }
  };
  
  const handleSaveSchedule = (windows: TimeWindow[]) => {
      if (windows.length > 0) {
          setScheduleWindows(windows);
          setExtraOptions(prev => ({ ...prev, schedule: true }));
      } else {
          setExtraOptions(prev => ({ ...prev, schedule: false }));
      }
  };
  // Filtered Champions for Modal
  const filteredChampions = useMemo(() => {
    let result = allChampions;
    if (selectedRole) {
        result = result.filter(c => c.tags && c.tags.includes(selectedRole));
    }
    if (championQuery) {
        result = result.filter(c => c.name.toLowerCase().includes(championQuery.toLowerCase()));
    }
    // OPTIMIZATION: Chỉ lấy 50 tướng đầu tiên để tránh lag khi render modal
    return result.slice(0, 50);
  }, [allChampions, championQuery, selectedRole]);

  // Booster's Signature Champions
  const boosterChampions = useMemo(() => {
    if (!boosterConfig?.booster_info?.service_settings?.playingChampions || !allChampions.length) return [];
    const ids = boosterConfig.booster_info.service_settings.playingChampions;
    // Map IDs to full champion objects
    return allChampions.filter(c => ids.includes(c.id));
  }, [boosterConfig, allChampions]);

  const isAccountValid = useMemo(() => {
    return gameUsername.trim().length >= 3 && gamePassword.trim().length >= 3;
  }, [gameUsername, gamePassword]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Service Config */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                    <span>Thông tin dịch vụ</span>
                    {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Cấp độ hiện tại</label>
                        <div className="relative">
                            <select 
                                value={currentLevel} 
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setCurrentLevel(val);
                                    if (val >= desiredLevel) setDesiredLevel(val + 1);
                                }}
                                className="w-full appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                            >
                                {MASTERY_LEVELS.slice(0, 9).map(lvl => (
                                    <option key={lvl} value={lvl}>Cấp {lvl}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Cấp độ mong muốn</label>
                        <div className="relative">
                            <select 
                                value={desiredLevel} 
                                onChange={(e) => setDesiredLevel(Number(e.target.value))}
                                className="w-full appearance-none bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                            >
                                {MASTERY_LEVELS.map(lvl => (
                                    <option key={lvl} value={lvl} disabled={lvl <= currentLevel}>Cấp {lvl}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                        </div>
                    </div>
                </div>

                {/* Champion Selection */}
                <div>
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Tướng cần cày</label>
                    
                    {/* Selected Champion Display */}
                    {selectedChampion ? (
                        <div className="flex items-center justify-between p-3 bg-blue-600/10 border border-blue-500/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <img src={selectedChampion.imageUrl} alt={selectedChampion.name} className="w-10 h-10 rounded-lg object-cover border border-blue-500/30" />
                                <div>
                                    <div className="text-sm font-bold text-white">{selectedChampion.name}</div>
                                    <div className="text-xs text-blue-400">Đã chọn</div>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedChampion(null); setChampionQuery(''); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsChampModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900 transition-all"
                        >
                            <Search className="w-5 h-5" />
                            <span>Bấm vào đây để chọn tướng</span>
                        </button>
                    )}

                    {/* Booster's Signature Champions */}
                    {!selectedChampion && boosterChampions.length > 0 && (
                        <div className="mt-3">
                            <div className="text-[10px] uppercase font-bold text-zinc-500 mb-2 flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Tướng sở trường của Booster</div>
                            <div className="flex flex-wrap gap-2">
                                {boosterChampions.map(champ => (
                                    <button 
                                        key={champ.id} 
                                        onClick={() => setSelectedChampion(champ)}
                                        className="group relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 hover:border-orange-500 transition-all"
                                        title={champ.name}
                                    >
                                        <img src={champ.imageUrl} alt={champ.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200/80 leading-relaxed flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                        <strong>Lưu ý về Thông Thạo:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-400">
                            <li>Cấp 1-4: Chỉ cần cày điểm.</li>
                            <li>Cấp 5-9: Cần điểm + 1 Dấu Ấn (Rank A- trở lên).</li>
                            <li>Cấp 10: Cần điểm + 3 Dấu Ấn (Rank S- trở lên).</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Account Info Component */}
            <AccountInfo 
                accountType={accountType} setAccountType={setAccountType}
                server={selectedServer} setServer={setSelectedServer}
                username={gameUsername} setUsername={setGameUsername}
                password={gamePassword} setPassword={setGamePassword}
                servers={boosterConfig?.booster_info?.service_settings?.servers}
                disabled={!boosterId}
            />

            {/* Extra Options Component */}
            <ExtraOptions 
                boosterConfig={boosterConfig}
                options={extraOptions} setOptions={setExtraOptions}
                selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles}
                scheduleWindows={scheduleWindows} setScheduleWindows={setScheduleWindows}
            />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
            <PaymentSummary
                boosterConfig={boosterConfig}
                boosterId={boosterId}
                priceDetails={priceDetails}
                platformFee={platformFee}
                isValid={!!selectedChampion && isAccountValid}
                validationMessage={!isAccountValid && (gameUsername || gamePassword) ? "Vui lòng nhập đầy đủ thông tin tài khoản (tối thiểu 3 ký tự)." : undefined}
                onPayment={() => {
                    // Handle payment logic here
                    toast.info('Tính năng thanh toán đang được phát triển');
                }}
            >
                {/* Service Specific Breakdown Content */}
                <>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Dịch vụ:</span>
                                <span className="text-white font-medium">Cày Thông Thạo</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Cấp độ:</span>
                                <span className="text-white font-medium">{currentLevel} ➜ {desiredLevel}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Tướng:</span>
                                <span className="text-white font-medium">{selectedChampion ? selectedChampion.name : 'Chưa chọn'}</span>
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

        {/* Champion Selection Modal */}
        {isChampModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Crosshair className="w-5 h-5 text-blue-500" />
                            Chọn tướng
                        </h3>
                        <button onClick={() => setIsChampModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                    </div>
                    {/* Filters */}
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text" 
                                value={championQuery}
                                onChange={(e) => setChampionQuery(e.target.value)}
                                placeholder="Tìm kiếm tướng..." 
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            <button onClick={() => setSelectedRole(null)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${!selectedRole ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>Tất cả</button>
                            {ROLE_FILTERS.map(role => (
                                <button key={role.id} onClick={() => setSelectedRole(role.id === selectedRole ? null : role.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${selectedRole === role.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>{role.label}</button>
                            ))}
                        </div>
                    </div>
                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50">
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {filteredChampions.map(champ => (
                                <button key={champ.id} onClick={() => { setSelectedChampion(champ); setIsChampModalOpen(false); }} className={`group relative aspect-square rounded-xl overflow-hidden border transition-all ${selectedChampion?.id === champ.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-zinc-800 hover:border-zinc-600'}`}>
                                    <img src={champ.imageUrl} alt={champ.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6">
                                        <div className="text-[10px] sm:text-xs font-bold text-white text-center truncate">{champ.name}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {filteredChampions.length === 0 && <div className="text-center py-10 text-zinc-500">Không tìm thấy tướng phù hợp</div>}
                    </div>
                </div>
            </div>
        )}

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={handleSaveSchedule}
        initialWindows={scheduleWindows}
      />
    </div>
  );
}

export default function MasteryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <MasteryContent />
    </Suspense>
  );
}