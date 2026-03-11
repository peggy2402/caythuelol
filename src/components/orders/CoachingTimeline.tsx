'use client';

import { useMemo } from 'react';

interface TimeWindow {
  day: string;
  start: string;
  end: string;
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

// Helper: Tính ngày cụ thể cho từng thứ trong tuần tới
const getNextDate = (dayName: string) => {
    const dayIndex = DAYS.indexOf(dayName); // 0 = Thứ 2, 6 = CN
    if (dayIndex === -1) return '';
    
    const today = new Date();
    const currentDay = today.getDay(); // 0 = CN, 1 = T2
    // Chuyển đổi getDay() về hệ quy chiếu (0 = T2, 6 = CN)
    const normalizedCurrentDay = currentDay === 0 ? 6 : currentDay - 1;
    
    let daysUntil = dayIndex - normalizedCurrentDay;
    if (daysUntil <= 0) daysUntil += 7; // Luôn tìm ngày trong tương lai gần nhất
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return targetDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export default function CoachingTimeline({ schedule }: { schedule: TimeWindow[] }) {
  if (!schedule || schedule.length === 0) return null;

  // Group schedule by day
  const scheduleByDay = useMemo(() => {
    const map: Record<string, TimeWindow[]> = {};
    DAYS.forEach(d => map[d] = []);
    schedule.forEach(w => {
        if (map[w.day]) map[w.day].push(w);
    });
    return map;
  }, [schedule]);

  return (
    <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Thời khóa biểu trực quan</h4>
      
      <div className="space-y-3">
        {DAYS.map(day => {
            const daySchedule = scheduleByDay[day];
            const hasSchedule = daySchedule.length > 0;

            return (
                <div key={day} className="flex items-center gap-3">
                    <div className={`w-20 text-xs ${hasSchedule ? 'text-white' : 'text-zinc-600'}`}>
                        <div className="font-bold">{day}</div>
                        <div className="text-[10px] opacity-60">{getNextDate(day)}</div>
                    </div>
                    
                    {/* Timeline Bar (0h - 24h) */}
                    <div className="flex-1 h-6 bg-zinc-900 rounded-md relative overflow-hidden border border-zinc-800">
                        {/* Grid lines every 6 hours */}
                        {[0, 6, 12, 18].map(h => (
                            <div key={h} className="absolute top-0 bottom-0 w-px bg-zinc-800" style={{ left: `${(h / 24) * 100}%` }} />
                        ))}

                        {hasSchedule && daySchedule.map((w, idx) => {
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
      
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2 pl-24">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
      </div>
    </div>
  );
}