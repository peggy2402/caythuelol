'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Clock, Plus, Trash2, Calendar as CalendarIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface TimeWindow {
  id: string;
  dateStr: string; // Format: YYYY-MM-DD (để check trùng/sort)
  displayDate: string; // Format: Thứ 2, 13/03/2026 (để hiển thị)
  start: string;
  end: string;
  timestamp: number; // Để sort timeline
}

interface CoachingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (windows: TimeWindow[]) => void;
  initialWindows?: TimeWindow[];
  duration: number;
}

// --- HELPERS ---

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    options.push(`${hour}:00`);
    options.push(`${hour}:30`); // Thêm mốc 30p cho linh hoạt
  }
  return options;
};

// Tạo danh sách 14 ngày tới
const generateNext14Days = () => {
  const dates = [];
  const today = new Date();
  
  // Format option: Thứ x, dd/mm/yyyy
  const formatter = new Intl.DateTimeFormat('vi-VN', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    let label = formatter.format(d);
    // Viết hoa chữ cái đầu (thứ -> Thứ)
    label = label.charAt(0).toUpperCase() + label.slice(1);

    dates.push({ value: dateStr, label, originalDate: d });
  }
  return dates;
};

// Helper chuyển đổi giờ "HH:mm" -> phút để so sánh
const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Helper chuyển đổi phút -> "HH:mm"
const minutesToTime = (totalMinutes: number) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export default function CoachingScheduleModal({
  isOpen,
  onClose,
  onSave,
  initialWindows = [],
  duration,
}: CoachingScheduleModalProps) {
  // --- STATE ---
  const [windows, setWindows] = useState<TimeWindow[]>(initialWindows);
  const dateOptions = useMemo(() => generateNext14Days(), []);
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const [selectedDateStr, setSelectedDateStr] = useState(dateOptions[0].value);
  const [start, setStart] = useState('09:00');
  const [error, setError] = useState('');

  // Reset state khi mở modal
  useEffect(() => {
    if (isOpen) {
      setWindows(initialWindows);
      setError('');
      setSelectedDateStr(dateOptions[0].value);
      setStart('09:00');
    }
  }, [isOpen, initialWindows, dateOptions]);

  // Tự động tính giờ kết thúc
  const end = useMemo(() => {
    const startMin = timeToMinutes(start);
    const endMin = startMin + (duration * 60);
    return minutesToTime(endMin);
  }, [start, duration]);

  // --- VALIDATION ---
  const validateSchedule = (newDateStr: string, newStart: string, newEnd: string) => {
    const newStartMins = timeToMinutes(newStart);
    const newEndMins = timeToMinutes(newEnd);

    // 1. Logic cơ bản (Start < End) - Đã được handle bởi duration dương nhưng check thêm
    if (newEndMins <= newStartMins) return "Giờ kết thúc không hợp lệ (qua ngày hôm sau).";

    // 2. Check overlap với lịch đã có
    for (const win of windows) {
      if (win.dateStr === newDateStr) {
        const existStart = timeToMinutes(win.start);
        const existEnd = timeToMinutes(win.end);

        // Công thức check overlap: (StartA < EndB) && (EndA > StartB)
        if (newStartMins < existEnd && newEndMins > existStart) {
          return `Trùng lịch với khung giờ đã chọn: ${win.start} - ${win.end}`;
        }
      }
    }
    return null;
  };

  // --- ACTIONS ---
  const addWindow = () => {
    setError('');
    
    // Validation
    const validationError = validateSchedule(selectedDateStr, start, end);
    if (validationError) {
      setError(validationError);
      return;
    }

    const dateObj = dateOptions.find(d => d.value === selectedDateStr);
    if (!dateObj) return;

    const newWindow: TimeWindow = {
      id: crypto.randomUUID(),
      dateStr: selectedDateStr,
      displayDate: dateObj.label,
      start,
      end,
      timestamp: new Date(`${selectedDateStr}T${start}`).getTime(),
    };

    setWindows(prev => {
      const newList = [...prev, newWindow];
      // Sort theo thời gian thực
      return newList.sort((a, b) => a.timestamp - b.timestamp);
    });
  };

  const removeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const handleSave = () => {
    onSave(windows);
    onClose();
  };

  if (!isOpen) return null;

  // Get label for preview
  const selectedDateLabel = dateOptions.find(d => d.value === selectedDateStr)?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Sắp xếp lịch học
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          
          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">Thời lượng buổi học: {duration} giờ</p>
              <p className="opacity-80">Vui lòng chọn ngày và giờ bắt đầu. Hệ thống sẽ tự động tính giờ kết thúc.</p>
            </div>
          </div>
          
          {/* Add Form */}
          <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Select */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ngày học</label>
                    <select 
                        value={selectedDateStr} 
                        onChange={(e) => setSelectedDateStr(e.target.value)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    >
                        {dateOptions.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>

                {/* Time Select */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Giờ bắt đầu</label>
                    <select 
                        value={start} 
                        onChange={(e) => setStart(e.target.value)} 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                    >
                        {timeOptions.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Preview & Add Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/50">
                <div className="text-sm">
                    <span className="text-zinc-500">Bạn chọn: </span>
                    <span className="text-white font-medium block sm:inline">{selectedDateLabel}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-mono font-bold border border-blue-500/30">
                            {start}
                        </span>
                        <span className="text-zinc-600">➔</span>
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono font-bold border border-zinc-700">
                            {end}
                        </span>
                    </div>
                </div>
                
                <button 
                    onClick={addWindow} 
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Thêm lịch
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20 animate-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
          </div>

          {/* LIST */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-zinc-400 flex justify-between items-center">
                Danh sách đã chọn ({windows.length})
            </h4>
            
            {windows.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800">
                    Chưa có lịch nào được chọn
                </div>
            ) : (
                <div className="space-y-2">
                    {windows.map((win) => (
                        <div key={win.id} className="group flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-white font-medium text-sm">{win.displayDate}</span>
                                </div>
                                <div className="flex items-center gap-2 pl-6">
                                    <span className="font-mono text-sm text-blue-400">{win.start}</span>
                                    <span className="text-zinc-600 text-xs">đến</span>
                                    <span className="font-mono text-sm text-zinc-400">{win.end}</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => removeWindow(win.id)} 
                                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Xóa"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors text-sm">
             Hủy
          </button>
          <button 
            onClick={handleSave} 
            disabled={windows.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors text-sm shadow-lg shadow-blue-900/20"
          >
            Lưu lịch ({windows.length})
          </button>
        </div>
      </div>
    </div>
  );
}
