'use client';

import { BrainCircuit, Clock, Video, ShieldCheck, Save, Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
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
                        <div className="flex gap-2">
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