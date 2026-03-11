'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';

export interface TimeWindow {
  day: string;
  start: string;
  end: string;
}

interface CoachingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (windows: TimeWindow[]) => void;
  initialWindows?: TimeWindow[];
  duration: number; // Nhận thời lượng (giờ) từ trang cha
}

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    options.push(`${hour}:00`);
  }
  return options;
};

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export default function CoachingScheduleModal({
  isOpen,
  onClose,
  onSave,
  initialWindows = [],
  duration,
}: CoachingScheduleModalProps) {
  const [windows, setWindows] = useState<TimeWindow[]>(initialWindows);
  const [day, setDay] = useState(DAYS[0]);
  const [start, setStart] = useState('09:00');
  // State ảo cho 'end' vì nó được tính toán từ start + duration,
  // nhưng chúng ta cần biến này để hiển thị UI
  
  // Tự động tính giờ kết thúc dựa trên giờ bắt đầu và thời lượng
  const end = useMemo(() => {
    const startHour = parseInt(start.split(':')[0]);
    const endHour = startHour + duration;
    return `${endHour.toString().padStart(2, '0')}:00`;
  }, [start, duration]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWindows(initialWindows);
      setError('');
    }
  }, [isOpen, initialWindows]);
  const timeOptions = generateTimeOptions();

  if (!isOpen) return null;

  const addWindow = () => {
    // Reset error
    setError('');

    // Cho phép tối đa 7 khung giờ (1 tuần)
    if (windows.length < 7) {
      setWindows(prev => {
        const newList = [...prev, { day, start, end }];
        // Sắp xếp theo Thứ (index trong mảng DAYS) -> Giờ bắt đầu
        return newList.sort((a, b) => {
            const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
            if (dayDiff !== 0) return dayDiff;
            return a.start.localeCompare(b.start);
        });
      });
    } else {
      setError('Bạn chỉ có thể thêm tối đa 7 khung giờ.');
    }
  };

  const removeWindow = (index: number) => {
    setWindows(prev => prev.filter((_, i) => i !== index));
  };

  const updateWindow = (index: number, field: 'day' | 'start', value: string) => {
    const newWindows = [...windows];
    
    if (field === 'start') {
        // Nếu sửa giờ bắt đầu, tự động tính lại giờ kết thúc 
        // @ts-ignore
        newWindows[index].start = value;
        const sHour = parseInt(value.split(':')[0]);
        const eHour = sHour + duration;
        newWindows[index].end = `${eHour.toString().padStart(2, '0')}:00`;
    } else {
        // @ts-ignore
        newWindows[index][field] = value;
    }
    
    // Sắp xếp lại sau khi sửa
    setWindows(newWindows.sort((a, b) => {
        const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.start.localeCompare(b.start);
    }));
  };

  const handleSave = () => {
    onSave(windows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Chọn khung giờ học
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-zinc-400">Chọn các khung giờ bạn rảnh để Booster có thể sắp xếp lịch học.</p>
          
          {/* Input để thêm khung giờ mới */}
          <div className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
            <select value={start} onChange={(e) => setStart(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full">
              {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
            </select>
            <span className="text-zinc-500 text-sm whitespace-nowrap">đến <span className="text-white font-mono font-bold">{end}</span></span>
            
            <button onClick={addWindow} disabled={windows.length >= 7} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto flex justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          {/* Danh sách các khung giờ đã chọn */}
          {windows.map((win: TimeWindow, index: number) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <select value={win.day} onChange={(e) => updateWindow(index, 'day', e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-bold text-xs w-full sm:w-24">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex items-center gap-2 flex-1 w-full justify-center sm:justify-start">
                  <select value={win.start} onChange={(e) => updateWindow(index, 'start', e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-sm">
                    {timeOptions.map(t => <option key={`start-${index}-${t}`} value={t}>{t}</option>)}
                  </select>
                  <span className="text-zinc-600">-</span>
                  <span className="text-zinc-400 font-mono text-sm bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{win.end}</span>
              </div>
              
              <button onClick={() => removeWindow(index)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium transition-colors">
            Hủy
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">
            Lưu lịch
          </button>
        </div>
      </div>
    </div>
  );
}
