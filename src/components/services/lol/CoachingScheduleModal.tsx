'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2 } from 'lucide-react';

export interface TimeWindow {
  start: string;
  end: string;
}

interface CoachingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (windows: TimeWindow[]) => void;
  initialWindows?: TimeWindow[];
}

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    options.push(`${hour}:00`);
  }
  return options;
};

export default function CoachingScheduleModal({
  isOpen,
  onClose,
  onSave,
  initialWindows = [],
}: CoachingScheduleModalProps) {
  const [windows, setWindows] = useState<TimeWindow[]>(initialWindows);
  const timeOptions = generateTimeOptions();

  useEffect(() => {
    setWindows(initialWindows);
  }, [initialWindows, isOpen]);

  if (!isOpen) return null;

  const addWindow = () => {
    if (windows.length < 5) {
      setWindows([...windows, { start: '09:00', end: '11:00' }]);
    }
  };

  const removeWindow = (index: number) => {
    setWindows(windows.filter((_, i) => i !== index));
  };

  const updateWindow = (index: number, field: 'start' | 'end', value: string) => {
    const newWindows = [...windows];
    newWindows[index][field] = value;
    setWindows(newWindows);
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
          {windows.map((win, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <select value={win.start} onChange={(e) => updateWindow(index, 'start', e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full">
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-zinc-500">-</span>
              <select value={win.end} onChange={(e) => updateWindow(index, 'end', e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full">
                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => removeWindow(index)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {windows.length < 5 && (
            <button onClick={addWindow} className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors">
              <Plus className="w-4 h-4" /> Thêm khung giờ
            </button>
          )}
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

