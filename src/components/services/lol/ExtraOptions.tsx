// src/components/services/lol/ExtraOptions.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, Info, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import ScheduleModal, { TimeWindow } from '@/components/ScheduleModal';

interface ExtraOptionsProps {
  boosterConfig: any;
  options: Record<string, boolean>;
  setOptions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedRoles?: string[];
  setSelectedRoles?: React.Dispatch<React.SetStateAction<string[]>>;
  scheduleWindows: TimeWindow[];
  setScheduleWindows: (windows: TimeWindow[]) => void;
}

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

export default function ExtraOptions({
  boosterConfig,
  options,
  setOptions,
  selectedRoles,
  setSelectedRoles,
  scheduleWindows,
  setScheduleWindows
}: ExtraOptionsProps) {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleOptionChange = (optionKey: string) => {
    if (optionKey === 'express' && !options.express && options.schedule) {
        toast.warning('Đã tắt "Đặt lịch" vì xung đột với "Cày siêu tốc".');
        setOptions(prev => ({ ...prev, express: true, schedule: false }));
        return;
    }
    if (optionKey === 'schedule' && !options.schedule && options.express) {
        toast.error('Không thể chọn "Đặt lịch" khi đang dùng "Cày siêu tốc".');
        return;
    }
    if (optionKey === 'schedule') {
        if (options.schedule) {
            setOptions(prev => ({ ...prev, schedule: false }));
            setScheduleWindows([]);
        } else {
            setIsScheduleModalOpen(true);
        }
    } else {
        setOptions(prev => ({ ...prev, [optionKey]: !prev[optionKey] }));
    }
  };

  const handleSaveSchedule = (windows: TimeWindow[]) => {
      if (windows.length > 0) {
          setScheduleWindows(windows);
          setOptions(prev => ({ ...prev, schedule: true }));
      } else {
          setOptions(prev => ({ ...prev, schedule: false }));
      }
  };

  const toggleRole = (role: string) => {
    if (setSelectedRoles) {
        setSelectedRoles(prev => 
          prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    }
  };

  if (!boosterConfig) {
      return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">Tùy chọn thêm</h3>
            <div className="p-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-center">
                <p className="text-zinc-500 text-sm">Vui lòng chọn Booster để xem các tùy chọn thêm.</p>
            </div>
        </div>
      );
  }

  const settings = boosterConfig.booster_info?.service_settings?.options || {};

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4">Tùy chọn thêm</h3>
        <div className="space-y-4">
            {/* Role Selection */}
            {settings.roles?.length > 0 && setSelectedRoles && selectedRoles && (
                <div className="mb-4">
                    <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2 block">Tùy chọn vị trí / đường</label>
                    <div className="flex flex-wrap gap-2">
                        {settings.roles.map((role: string) => (
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

            {settings.express > 0 && (
                <OptionCheckbox id="express" label="Cày siêu tốc" priceInfo={`+${settings.express}%`} checked={options.express ?? false} onChange={() => handleOptionChange('express')} tooltip="Booster sẽ cày liên tục để hoàn thành sớm nhất. Không thể dùng chung với Đặt lịch." />
            )}
            {settings.duo > 0 && (
                <OptionCheckbox id="duo" label="Chơi cùng Booster (Duo)" priceInfo={`+${settings.duo}%`} checked={options.duo ?? false} onChange={() => handleOptionChange('duo')} />
            )}
            {settings.streaming > 0 && (
                <OptionCheckbox id="streaming" label="Xem trực tiếp (Streaming)" priceInfo={`+${new Intl.NumberFormat('vi-VN').format(settings.streaming)} VNĐ`} checked={options.streaming ?? false} onChange={() => handleOptionChange('streaming')} />
            )}
            {settings.specificChamps > 0 && (
                <OptionCheckbox id="specificChamps" label="Chơi tướng chỉ định" priceInfo={`+${settings.specificChamps}%`} checked={options.specificChamps ?? false} onChange={() => handleOptionChange('specificChamps')} />
            )}
            {settings.schedule && (
                <OptionCheckbox id="schedule" label="Đặt lịch cày mỗi ngày" priceInfo={settings.scheduleFee > 0 ? `+${settings.scheduleFee}%` : "Miễn phí"} checked={options.schedule ?? false} onChange={() => handleOptionChange('schedule')} tooltip="Chọn khung giờ bạn muốn chơi game. Booster sẽ tạm dừng cày trong thời gian này. Không thể dùng chung với Cày siêu tốc." />
            )}
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
