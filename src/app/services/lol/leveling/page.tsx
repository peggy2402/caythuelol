'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Flame, CheckCircle2, Loader2, ArrowRight, Shield, Wallet, Info, ChevronRight, Crosshair, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ScheduleModal, { TimeWindow } from '@/components/ScheduleModal';

const ACCOUNT_TYPES = [
    { id: 'RIOT', name: 'Riot' },
    { id: 'GOOGLE', name: 'Google' },
    { id: 'FACEBOOK', name: 'Facebook' },
    { id: 'APPLE', name: 'Apple' },
    { id: 'XBOX', name: 'Xbox' },
    { id: 'PLAYSTATION', name: 'PlayStation' }
];

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Extra Options State
  const [extraOptions, setExtraOptions] = useState<Record<string, boolean>>({
    express: false,
    streaming: false,
    duo: false,
    schedule: false,
  });

  // Schedule State
  const [scheduleWindows, setScheduleWindows] = useState<TimeWindow[]>([]);
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
        levelsToGrind: desiredLevel - currentLevel
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
  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSaveSchedule = (windows: TimeWindow[]) => {
      if (windows.length > 0) {
          setScheduleWindows(windows);
          setExtraOptions(prev => ({ ...prev, schedule: true }));
      } else {
          setExtraOptions(prev => ({ ...prev, schedule: false }));
      }
  };

  const OptionCheckbox = ({ id, label, priceInfo, checked, onChange, disabled = false, tooltip }: { id: string, label: string, priceInfo: string, checked: boolean, onChange: () => void, disabled?: boolean, tooltip?: string }) => (
    <label htmlFor={id} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${checked ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-white/20'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-zinc-600 bg-zinc-900 group-hover:border-zinc-500'}`}>
                {checked && <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />}
            </div>
            <div className="font-medium text-zinc-200 text-xs sm:text-sm flex items-center gap-2">
                {label}
                {tooltip && (
                    <div className="group/tooltip relative" onClick={(e) => e.preventDefault()}>
                        <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-blue-400 transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-300 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                            {tooltip}
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">{priceInfo}</span>
        <input id={id} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="hidden" />
    </label>
  );

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
                <div className="space-y-6">
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
            </div>

            {/* Account Info */}
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
                          <OptionCheckbox id="express" label="Cày siêu tốc" priceInfo={`+${boosterConfig.booster_info.service_settings.options.express}%`} checked={extraOptions.express} onChange={() => handleOptionChange('express')} tooltip="Booster sẽ cày liên tục để hoàn thành sớm nhất. Không thể dùng chung với Đặt lịch." />
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
                          <OptionCheckbox id="schedule" label="Đặt lịch cày mỗi ngày" priceInfo="Miễn phí" checked={extraOptions.schedule} onChange={() => handleOptionChange('schedule')} tooltip="Chọn khung giờ bạn muốn chơi game. Booster sẽ tạm dừng cày trong thời gian này. Không thể dùng chung với Cày siêu tốc." />
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

        {/* Right Column */}
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
                                <span className="text-white font-medium">Cày Level</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Số level cần cày:</span>
                                <span className="text-white font-medium">{priceDetails?.levelsToGrind || 0} levels</span>
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

      <ScheduleModal 
        isOpen={isScheduleModalOpen} 
        onClose={() => setIsScheduleModalOpen(false)} 
        onSave={handleSaveSchedule}
        initialWindows={scheduleWindows}
      />
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