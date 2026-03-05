// src/components/ScheduleModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, AlertCircle, CalendarClock } from 'lucide-react';

export interface TimeWindow {
  start: string; // "18:00"
  end: string;   // "22:00"
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (windows: TimeWindow[]) => void;
  initialWindows?: TimeWindow[];
}

export default function ScheduleModal({ isOpen, onClose, onSave, initialWindows = [] }: ScheduleModalProps) {
  const [windows, setWindows] = useState<TimeWindow[]>(initialWindows);
  const [newStart, setNewStart] = useState('18:00');
  const [newEnd, setNewEnd] = useState('22:00');
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
        setWindows(initialWindows);
        setError('');
    }
  }, [isOpen, initialWindows]);

  if (!isOpen) return null;

  const addWindow = () => {
    setError('');
    
    // 1. Validate Logic
    if (newStart >= newEnd) {
      setError('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    // 2. Check Overlap
    const hasOverlap = windows.some(w => 
      (newStart >= w.start && newStart < w.end) || 
      (newEnd > w.start && newEnd <= w.end) ||
      (newStart <= w.start && newEnd >= w.end)
    );

    if (hasOverlap) {
      setError('Khung giờ bị trùng với lịch đã có');
      return;
    }

    // 3. Add & Sort
    const updated = [...windows, { start: newStart, end: newEnd }].sort((a, b) => a.start.localeCompare(b.start));
    setWindows(updated);
  };

  const removeWindow = (index: number) => {
    setWindows(windows.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(windows);
    onClose();
  };

  // Generate time options (00:00 to 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, '0');
    return `${h}:00`;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-2xl shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-500" />
            Đặt lịch cấm chơi (Blackout)
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-200 flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Hãy chọn khung giờ <strong>BẠN SẼ CHƠI GAME</strong>. Booster sẽ <span className="text-red-400 font-bold">TẠM DỪNG</span> cày trong khoảng thời gian này để tránh xung đột (đăng nhập đè).
            </p>
          </div>

          {/* Add New Window */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Thêm khung giờ bạn chơi</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className="flex-1 relative">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-zinc-500 text-xs">Từ</span>
                        <select 
                        value={newStart} 
                        onChange={(e) => setNewStart(e.target.value)}
                        className="bg-transparent text-white font-bold outline-none w-full appearance-none cursor-pointer"
                        >
                        {timeOptions.map(t => <option key={t} value={t} className="bg-zinc-900 text-white py-1">{t}</option>)}
                        </select>
                    </div>
                </div>
              </div>
              <span className="text-zinc-600 font-bold">-</span>
              <div className="flex-1 relative">
                <div className="flex-1 relative">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-zinc-500 text-xs">Đến</span>
                        <select 
                        value={newEnd} 
                        onChange={(e) => setNewEnd(e.target.value)}
                        className="bg-transparent text-white font-bold outline-none w-full appearance-none cursor-pointer"
                        >
                        {timeOptions.map(t => <option key={t} value={t} className="bg-zinc-900 text-white py-1">{t}</option>)}
                        </select>
                    </div>
                </div>
              </div>
              <button 
                onClick={addWindow}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error}</p>}
          </div>

          {/* List Windows */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Danh sách giờ cấm ({windows.length})</label>
                {windows.length > 0 && <span className="text-[10px] text-zinc-500">Lặp lại hàng ngày</span>}
            </div>
            
            {windows.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Chưa có lịch. Booster sẽ cày 24/7.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {windows.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span className="font-bold text-white font-mono text-lg">{w.start} <span className="text-zinc-600 mx-1">-</span> {w.end}</span>
                    </div>
                    <button onClick={() => removeWindow(idx)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            Hủy bỏ
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20">
            Xác nhận {windows.length > 0 ? `(${windows.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
