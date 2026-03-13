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
                <div key={dateKey} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <div className="w-full sm:w-24 text-xs text-white flex justify-between sm:block">
                        {/* Split "Thứ X, DD/MM/YYYY" for nicer stack */}
                        <div className="font-bold">{displayLabel.split(',')[0]}</div>
                        <div className="text-[10px] opacity-60 font-mono">{displayLabel.split(',')[1]}</div>
                    </div>
                    
                    {/* Timeline Bar (0h - 24h) */}
                    <div className="flex-1 h-6 bg-zinc-900 rounded-md relative border border-zinc-800 w-full">
                        {/* Grid lines every 6 hours */}
                        {[0, 6, 12, 18].map(h => (
                            <div key={h} className="absolute top-0 bottom-0 w-px bg-zinc-800" style={{ left: `${(h / 24) * 100}%` }} />
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
                                    className="absolute top-1 bottom-1 bg-blue-600 rounded-sm text-[10px] text-white flex items-center justify-center font-bold z-10 group cursor-help"
                                    style={{ left: `${left}%`, width: `${width}%` }}
                                >
                                    <span className="whitespace-nowrap px-1 truncate">{width > 3 && `${w.start}`}</span>
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
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
                </div>
            );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2 pl-0 sm:pl-28">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
      </div>
    </div>
  );
}