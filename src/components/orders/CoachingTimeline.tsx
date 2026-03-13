'use client';

import { useMemo } from 'react';
import { TimeWindow } from '@/components/services/lol/CoachingScheduleModal';

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
    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Thời khóa biểu trực quan</h4>
      
      <div className="space-y-3">
        {uniqueDates.map(dateKey => {
            const daySchedule = scheduleByDate[dateKey];
            // Use displayDate from the first item of this day group
            const displayLabel = daySchedule[0]?.displayDate || dateKey; 

            return (
                <div key={dateKey} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-white">
                        {/* Split "Thứ X, DD/MM/YYYY" for nicer stack */}
                        <div className="font-bold">{displayLabel.split(',')[0]}</div>
                        <div className="text-[10px] opacity-60 font-mono">{displayLabel.split(',')[1]}</div>
                    </div>
                    
                    {/* Timeline Bar (0h - 24h) */}
                    <div className="flex-1 h-6 bg-zinc-900 rounded-md relative overflow-hidden border border-zinc-800">
                        {/* Grid lines every 6 hours */}
                        {[0, 6, 12, 18].map(h => (
                            <div key={h} className="absolute top-0 bottom-0 w-px bg-zinc-800" style={{ left: `${(h / 24) * 100}%` }} />
                        ))}

                        {daySchedule.map((w, idx) => {
                            const startH = parseInt(w.start.split(':')[0]);
                            const endH = parseInt(w.end.split(':')[0]);
                            const left = (startH / 24) * 100;
                            const width = ((endH - startH) / 24) * 100;

                            return (
                                <div 
                                    key={idx}
                                    className="absolute top-1 bottom-1 bg-blue-600 rounded-sm text-[10px] text-white flex items-center justify-center font-bold z-10"
                                    style={{ left: `${left}%`, width: `${width}%` }}
                                    title={`${w.start} - ${w.end}`}
                                >
                                    {width > 10 && `${w.start}`}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2 pl-28">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
      </div>
    </div>
  );
}