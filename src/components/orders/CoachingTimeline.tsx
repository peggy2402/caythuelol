'use client';

import { useMemo } from 'react';
import { TimeWindow } from '@/components/services/lol/CoachingScheduleModal';

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export default function CoachingTimeline({ schedule }: { schedule: TimeWindow[] }) {
  if (!schedule || schedule.length === 0) return null;

  // Group schedule by unique Date String
  const { uniqueDates, scheduleByDate } = useMemo(() => {
    const map: Record<string, TimeWindow[]> = {};
    const dates: string[] = [];

    // Sort schedule first
    const sorted = [...schedule].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    sorted.forEach(w => {
        const key = w.dateStr || (w as any).day; // Fallback to 'day' if dateStr missing
        if (!map[key]) {
            map[key] = [];
            dates.push(key);
        }
        map[key].push(w);
    });

    return { uniqueDates: dates, scheduleByDate: map };
  }, [schedule]);

  return (
    <div className="bg-zinc-950/50 p-3 sm:p-4 rounded-xl border border-zinc-800">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Thời khóa biểu trực quan</h4>
      
      <div className="space-y-3">
        {uniqueDates.map(dateKey => {
            const daySchedule = scheduleByDate[dateKey];
            // Use displayDate from the first item of this day group
            const displayLabel = daySchedule[0]?.displayDate || dateKey; 

            return (
                <div key={dateKey} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-zinc-900/30 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-zinc-800/50 sm:border-none">
                    <div className="w-full sm:w-24 shrink-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-start mb-1 sm:mb-0">
                        <div className="text-sm font-bold text-white truncate">{displayLabel.split(',')[0]}</div>
                        <div className="text-xs sm:text-[10px] text-zinc-500 font-mono truncate">{displayLabel.split(',')[1]?.trim()}</div>
                    </div>
                    
                    {/* Timeline Bar (Chỉ hiển thị trên Máy tính) */}
                    <div className="hidden sm:block flex-1 h-10 bg-zinc-900/80 rounded-md relative border border-zinc-800 w-full">
                        {/* Grid lines every 3 hours */}
                        {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                            <div key={h} className={`absolute top-0 bottom-0 w-px ${h % 6 === 0 ? 'bg-zinc-700' : 'bg-zinc-800'}`} style={{ left: `${(h / 24) * 100}%` }} />
                        ))}

                        {daySchedule.map((w, idx) => {
                            const startMins = timeToMinutes(w.start);
                            const endMins = timeToMinutes(w.end);
                            const totalDayMins = 24 * 60;

                            const left = (startMins / totalDayMins) * 100;
                            const width = ((endMins - startMins) / totalDayMins) * 100;

                            return (
                                <div 
                                    key={idx}
                                    className="absolute top-1 bottom-1 bg-blue-600 rounded-sm text-[10px] sm:text-xs text-white flex items-center justify-center font-bold z-10 group cursor-help shadow-sm shadow-blue-900/50"
                                    style={{ left: `${left}%`, width: `${width}%` }}
                                >
                                    {/* Chỉ hiện giờ nếu thanh đủ dài (> 6% tương đương khoảng > 1h30p) để không bị chữ đè chữ */}
                                    <span className="whitespace-nowrap px-1 truncate pointer-events-none">{width > 6 && `${w.start}`}</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 sm:mb-2 hidden group-hover:block z-50">
                                        <div className="relative bg-zinc-800 text-white text-xs rounded-lg py-1.5 px-3 border border-zinc-700 shadow-xl whitespace-nowrap flex flex-col items-center">
                                            <span className="font-bold mb-0.5">{w.displayDate}</span>
                                            <span className="font-mono text-[10px] text-blue-300 bg-blue-900/30 px-1.5 rounded border border-blue-500/20">{w.start} - {w.end}</span>
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Danh sách giờ học rõ ràng (Chỉ hiển thị trên Điện thoại) */}
                    <div className="flex sm:hidden flex-col gap-2 w-full">
                        {daySchedule.map((w, idx) => (
                            <div key={`mob-${idx}`} className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg">
                                <span className="text-blue-400 font-mono font-bold text-sm tracking-wide">{w.start} - {w.end}</span>
                                <span className="text-[10px] font-bold text-blue-300/80 bg-blue-900/40 px-2 py-1 rounded">
                                    {((timeToMinutes(w.end) - timeToMinutes(w.start)) / 60)} GIỜ
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
      
      {/* Bottom Time Scale aligned properly (Chỉ hiển thị trên Máy tính) */}
      <div className="hidden sm:flex flex-row items-center gap-3 mt-2">
          <div className="w-24 shrink-0"></div>
          <div className="flex-1 flex justify-between text-xs font-bold text-zinc-500 px-0.5">
              <span>0h</span>
              <span className="text-zinc-700 font-bold">3h</span>
              <span>6h</span>
              <span className="text-zinc-700 font-bold">9h</span>
              <span>12h</span>
              <span className="text-zinc-700 font-bold">15h</span>
              <span>18h</span>
              <span className="text-zinc-700 font-bold">21h</span>
              <span>24h</span>
          </div>
      </div>
    </div>
  );
}