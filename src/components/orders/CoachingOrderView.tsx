'use client';

import { BrainCircuit, Clock, Video, ShieldCheck, Save, Loader2, MessageSquare, Gamepad2, FileText, CheckSquare, Square } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CoachingTimeline from '@/components/orders/CoachingTimeline';

interface CoachingOrderViewProps {
  order: any;
  isBooster?: boolean;
  vodLink?: string;
  setVodLink?: (link: string) => void;
  onUpdateVodLink?: () => void;
  isUpdatingVod?: boolean;
}

export default function CoachingOrderView({ 
  order, 
  isBooster,
  vodLink,
  setVodLink,
  onUpdateVodLink,
  isUpdatingVod
}: CoachingOrderViewProps) {
  const { details } = order;
  const { coaching_type, hours } = details || {};

  const [scheduleState, setScheduleState] = useState(details.schedule || []);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);

  const toggleSession = async (index: number) => {
    if (!isBooster) return;
    
    const newSchedule = [...scheduleState];
    newSchedule[index] = { ...newSchedule[index], isCompleted: !newSchedule[index].isCompleted };
    setScheduleState(newSchedule);
    
    setIsUpdatingSchedule(true);
    try {
        const res = await fetch(`/api/orders/${order._id}/schedule`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schedule: newSchedule })
        });
        if (!res.ok) throw new Error();
        toast.success('Cập nhật trạng thái buổi học thành công');
    } catch (e) {
        toast.error('Lỗi khi cập nhật trạng thái');
        setScheduleState(details.schedule || []); // Revert on error
    }
    setIsUpdatingSchedule(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-sky-500" /> 
                        Thông tin buổi Coaching
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Loại hình Coaching</div>
                        <div className="text-base font-bold text-white">
                            {coaching_type || 'Chưa xác định'}
                        </div>
                    </div>
                    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Thời lượng</div>
                        <div className="text-base font-bold text-white flex items-center gap-2">
                            <Clock size={16} className="text-sky-400" />
                            {hours || 'N/A'} Giờ
                        </div>
                    </div>
                </div>

                {/* Additional Info Section */}
                <div className="mt-6 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        Thông tin bổ sung
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {details.discord_id && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="p-2 bg-indigo-500/10 rounded-lg"><MessageSquare className="w-4 h-4 text-indigo-400" /></div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase">Discord ID</div>
                                    <div className="font-mono text-sm text-white select-all">{details.discord_id}</div>
                                </div>
                            </div>
                        )}
                        {details.riot_id && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="p-2 bg-red-500/10 rounded-lg"><Gamepad2 className="w-4 h-4 text-red-400" /></div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase">Riot ID</div>
                                    <div className="font-mono text-sm text-white select-all">{details.riot_id}</div>
                                </div>
                            </div>
                        )}
                        {details.note && (
                            <div className="col-span-1 md:col-span-2 flex gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="p-2 bg-zinc-700/10 rounded-lg h-fit"><FileText className="w-4 h-4 text-zinc-400" /></div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase">Ghi chú từ học viên</div>
                                    <div className="text-sm text-zinc-300 italic">{details.note}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Checklist Status */}
                {scheduleState.length > 0 && (
                    <div className="mt-6">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-zinc-400 uppercase">Trạng thái buổi học</h4>
                            {isUpdatingSchedule && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
                        </div>
                        <div className="space-y-2">
                            {scheduleState.map((session: any, idx: number) => (
                                <div 
                                    key={session.id || idx} 
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all gap-3 ${
                                        session.isCompleted 
                                            ? 'bg-green-900/10 border-green-500/20' 
                                            : 'bg-zinc-950 border-zinc-800'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <div className={`text-sm font-bold ${session.isCompleted ? 'text-green-400' : 'text-white'}`}>
                                            {session.displayDate}
                                        </div>
                                        <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 self-start sm:self-center">
                                            {session.start} - {session.end}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full sm:w-auto flex justify-end">
                                    {isBooster && (
                                        <button 
                                            onClick={() => toggleSession(idx)}
                                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                                                session.isCompleted 
                                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                            }`}
                                        >
                                            {session.isCompleted ? (
                                                <><CheckSquare className="w-4 h-4" /> Đã xong</>
                                            ) : (
                                                <><Square className="w-4 h-4" /> Đánh dấu xong</>
                                            )}
                                        </button>
                                    )}
                                    
                                    {!isBooster && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${session.isCompleted ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 bg-zinc-800'}`}>
                                            {session.isCompleted ? 'Đã hoàn thành' : 'Chưa diễn ra'}
                                        </span>
                                    )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline Visualization */}
                {details?.schedule && details.schedule.length > 0 && (
                    <div className="mt-6">
                        <CoachingTimeline schedule={details.schedule} />
                    </div>
                )}

                {/* VOD Link Section */}
                {details?.vod_link && (
                    <div className="mt-6">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">Video buổi học (VOD)</h4>
                        <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <Video className="w-5 h-5 text-red-500 shrink-0" />
                                <a 
                                    href={details.vod_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sky-400 hover:text-sky-300 hover:underline truncate"
                                >
                                    {details.vod_link}
                                </a>
                            </div>
                            <a 
                                href={details.vod_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                                Xem ngay
                            </a>
                        </div>
                    </div>
                )}

                {/* Booster VOD Update Form */}
                {isBooster && ['IN_PROGRESS', 'COMPLETED'].includes(order.status) && (
                    <div className="mt-6">
                        <h4 className="text-sm font-bold text-zinc-400 uppercase mb-2">Cập nhật Link VOD</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text" 
                                value={vodLink} 
                                onChange={(e) => setVodLink && setVodLink(e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                            />
                            <button onClick={onUpdateVodLink} disabled={isUpdatingVod} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                                {isUpdatingVod ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Commitment Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-sky-900/10 border border-sky-500/20 text-sky-200">
            <ShieldCheck className="w-5 h-5 shrink-0 text-sky-400" />
            <p className="text-sm">
                Buổi Coaching sẽ được thực hiện bởi Booster có kinh nghiệm, giúp bạn cải thiện kỹ năng và tư duy chiến thuật một cách hiệu quả.
            </p>
        </div>
    </div>
  );
}