'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Clock, Video, Users, MonitorPlay, CalendarDays, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import CoachingScheduleModal, { TimeWindow } from '@/components/services/lol/CoachingScheduleModal';
import CoachingAdditionalInfo from '@/components/services/lol/CoachingAdditionalInfo';
import PaymentSummary from '@/components/services/lol/PaymentSummary';

const COACHING_TYPES = [
  { 
    id: 'VOD_REVIEW', 
    label: 'Phân tích Replay (VOD)', 
    desc: 'Gửi video trận đấu, Booster sẽ phân tích lỗi sai và cách cải thiện.',
    icon: Video,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50'
  },
  { 
    id: 'LIVE_COACHING', 
    label: 'Coaching Trực tiếp', 
    desc: 'Booster xem bạn chơi (Stream) và hướng dẫn thời gian thực.',
    icon: MonitorPlay,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50'
  },
  { 
    id: 'DUO_COACHING', 
    label: 'Duo Coaching', 
    desc: 'Chơi cùng Booster ở Bot Lane hoặc Rừng/Mid để học cách phối hợp.',
    icon: Users,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/50'
  },
];

// Giá mặc định nếu Booster chưa cấu hình
const DEFAULT_PRICES = {
  'VOD_REVIEW': 100000,
  'LIVE_COACHING': 150000,
  'DUO_COACHING': 200000
};

// --- HELPERS CHO VIỆC TÍNH TOÁN LẠI GIỜ ---
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

function CoachingContent() {
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  // --- STATE ---
  const [boosterConfig, setBoosterConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [platformFee, setPlatformFee] = useState(0);
  
  // Service State
  const [coachingType, setCoachingType] = useState('LIVE_COACHING');
  const [hours, setHours] = useState(1);

  // Additional Info State
  const [riotId, setRiotId] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [vodLink, setVodLink] = useState('');
  const [note, setNote] = useState('');
  const [selectedServer, setSelectedServer] = useState(''); // Vẫn giữ server để Booster biết khu vực

  // Schedule State
  const [scheduleWindows, setScheduleWindows] = useState<TimeWindow[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // 1. Fetch Platform Fee
  useEffect(() => {
    fetch('/api/settings/platform-fee')
      .then(res => res.json())
      .then(data => setPlatformFee(data.fee || 0))
      .catch(console.error);
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

  // 3. Auto-update schedule end times when duration (hours) changes
  // Khi khách hàng kéo thanh thời lượng, tự động cập nhật lại giờ kết thúc của các lịch đã chọn
  useEffect(() => {
    if (scheduleWindows.length === 0) return;

    setScheduleWindows(prev => prev.map(w => {
        const startMins = timeToMinutes(w.start);
        const endMins = startMins + (hours * 60);
        return {
            ...w,
            end: minutesToTime(endMins)
        };
    }));
  }, [hours]);

  // --- PRICING LOGIC ---
  const priceDetails = useMemo(() => {
    const settings = boosterConfig?.booster_info?.service_settings;
    const priceMap = settings?.coachingPrices || DEFAULT_PRICES;

    // Get Base Price per Hour
    const unitPrice = priceMap[coachingType] || DEFAULT_PRICES[coachingType as keyof typeof DEFAULT_PRICES];
    const base = unitPrice * hours;

    // Platform Fee
    const platformFeeValue = base * (platformFee / 100);

    // Total
    const total = base + platformFeeValue;

    return {
        basePrice: base,
        totalPrice: Math.max(0, Math.round(total)),
        platformFeeValue,
        unitPrice,
        optionDetails: [], // Fix: Thêm mảng rỗng vì Coaching hiện tại chưa có options phụ tính phí
        depositAmount: 0
    };
  }, [boosterConfig, coachingType, hours, platformFee]);

  // --- VALIDATION LOGIC ---
  const isInfoValid = useMemo(() => {
    if (!discordId || discordId.trim().length < 3) return false;

    if (coachingType === 'VOD_REVIEW') return vodLink.trim().length > 5;
    if (['LIVE_COACHING', 'DUO_COACHING'].includes(coachingType)) return riotId.trim().length > 3;
    
    return true;
  }, [coachingType, riotId, discordId, vodLink]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6 pb-48 lg:pb-0">
            {/* Service Config */}
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                    <span>Thông tin khóa học</span>
                    {loadingConfig && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </h3>
                
                <div className="space-y-6">
                    {/* Coaching Type */}
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Hình thức học</label>
                        <div className="grid grid-cols-1 gap-3">
                            {COACHING_TYPES.map((type) => {
                                const isSelected = coachingType === type.id;
                                const Icon = type.icon;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setCoachingType(type.id)}
                                        className={`relative p-4 rounded-xl border transition-all flex items-start gap-4 text-left group ${
                                            isSelected 
                                                ? `${type.bg} ${type.border} shadow-lg` 
                                                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                                            <Icon className={`w-6 h-6 ${isSelected ? type.color : 'text-zinc-400'}`} />
                                        </div>
                                        <div>
                                            <div className={`font-bold text-base mb-1 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{type.label}</div>
                                            <div className="text-xs text-zinc-500 leading-relaxed">{type.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Thời lượng (Giờ)</label>
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                            <Clock className="w-6 h-6 text-blue-500" />
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                step="1" 
                                value={hours} 
                                onChange={(e) => setHours(Number(e.target.value))}
                                className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer range-thumb:bg-blue-500"
                            />
                            <div className="w-20 text-center">
                                <span className="text-2xl font-bold text-white">{hours}</span>
                                <span className="text-xs text-zinc-500 block">Giờ</span>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider mb-3 block">Lịch học mong muốn</label>
                        {scheduleWindows.length > 0 ? (
                            <div className="space-y-2">
                                {scheduleWindows.map((w, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <CalendarDays className="w-5 h-5 text-blue-400" />
                                            <span className="text-white font-medium text-sm">
                                                {w.displayDate} <span className="text-zinc-500 mx-1">|</span> <span className="text-blue-300 font-mono">{w.start} - {w.end}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setIsScheduleModalOpen(true)}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-2 flex items-center gap-1"
                                >
                                    <Pencil className="w-3 h-3" /> Chỉnh sửa lịch
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="w-full p-4 border border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex flex-col items-center gap-2"
                            >
                                <CalendarDays className="w-6 h-6" />
                                <span>Bấm để chọn khung giờ bạn rảnh</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Info (Thay thế AccountInfo) */}
            <CoachingAdditionalInfo
                coachingType={coachingType}
                riotId={riotId} setRiotId={setRiotId}
                discordId={discordId} setDiscordId={setDiscordId}
                vodLink={vodLink} setVodLink={setVodLink}
                note={note} setNote={setNote}
            />
        </div>

        {/* Right Column */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:sticky lg:top-24 lg:col-span-1 lg:h-fit">
            <PaymentSummary
                boosterConfig={boosterConfig}
                boosterId={boosterId}
                priceDetails={priceDetails}
                platformFee={platformFee}
                isValid={isInfoValid && scheduleWindows.length > 0}
                validationMessage={
                    !isInfoValid 
                        ? "Vui lòng nhập đầy đủ thông tin bổ sung." 
                        : scheduleWindows.length === 0 
                            ? "Vui lòng chọn lịch học mong muốn." 
                            : undefined
                }
                serviceType="COACHING"
                details={{
                    coaching_type: COACHING_TYPES.find(t => t.id === coachingType)?.label,
                    hours: hours,
                    schedule: scheduleWindows,
                    server: selectedServer,
                    // Mapping các trường mới vào details đơn hàng
                    riot_id: riotId,
                    discord_id: discordId,
                    vod_link: vodLink,
                    note: note
                }}
                options={{}} // Coaching không có extra options phức tạp
            >
                {/* Service Specific Breakdown Content */}
                <>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Dịch vụ:</span>
                        <span className="text-white font-medium">Coaching 1-1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Hình thức:</span>
                        <span className="text-white font-medium text-right">{COACHING_TYPES.find(t => t.id === coachingType)?.label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Đơn giá:</span>
                        <span className="text-white font-medium">{priceDetails?.unitPrice.toLocaleString('vi-VN')} đ/giờ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Thời lượng:</span>
                        <span className="text-white font-medium">{hours} giờ</span>
                    </div>
                    
                    {scheduleWindows.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/50 text-xs text-zinc-500 space-y-1">
                            <div className="flex justify-between items-start">
                                <span className="flex items-center gap-1 shrink-0"><CalendarDays className="w-3 h-3"/> Lịch học:</span>
                                <div className="text-right text-blue-400 font-mono">
                                    {scheduleWindows.map((w, i) => (
                                        <div key={i} className="truncate max-w-[200px]" title={w.displayDate}>
                                            {w.displayDate.split(',')[0]}, {w.dateStr.split('-').slice(1).reverse().join('/')}: {w.start}-{w.end}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            </PaymentSummary>
        </div>

        <CoachingScheduleModal 
            isOpen={isScheduleModalOpen} 
            onClose={() => setIsScheduleModalOpen(false)} 
            onSave={setScheduleWindows}
            initialWindows={scheduleWindows}
            duration={hours} // Truyền thời lượng để tính giờ kết thúc
        />
    </div>
  );
}

export default function CoachingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <CoachingContent />
    </Suspense>
  );
}
