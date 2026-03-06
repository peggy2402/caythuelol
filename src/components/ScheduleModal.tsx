'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import TimeRangePicker from './TimeRangePicker';

export interface TimeWindow {
  start: string;
  end: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (windows: TimeWindow[]) => void;
  initialWindows?: TimeWindow[];
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  initialWindows = [],
}: Props) {

  const [windows, setWindows] = useState<TimeWindow[]>([]);
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('22:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWindows(initialWindows);
      setError('');
    }
  }, [isOpen, initialWindows]);

  if (!isOpen) return null;

  const addWindow = () => {

    if (start >= end) {
      setError('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }

    const overlap = windows.some(
      (w) =>
        (start >= w.start && start < w.end) ||
        (end > w.start && end <= w.end)
    );

    if (overlap) {
      setError('Khung giờ bị trùng');
      return;
    }

    setWindows([...windows, { start, end }].sort((a, b) =>
      a.start.localeCompare(b.start)
    ));

    setError('');
  };

  const removeWindow = (i: number) => {
    setWindows(windows.filter((_, index) => index !== i));
  };

  const save = () => {
    onSave(windows);
    onClose();
  };

  return createPortal(

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md flex flex-col">

        {/* header */}

        <div className="flex justify-between items-center p-4 border-b border-zinc-800">

          <h2 className="text-white font-bold">
            Đặt lịch cấm chơi
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-zinc-400" />
          </button>

        </div>

        {/* body */}

        <div className="p-5 space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">

            <AlertCircle className="mt-[2px] h-5 w-5 shrink-0 text-blue-400" />

            <p className="flex-1 leading-relaxed">
              Hãy chọn khung giờ{" "}
              <span className="font-semibold text-blue-100">
                BẠN SẼ CHƠI GAME
              </span>. Booster sẽ{" "}
              <span className="font-bold text-red-400">
                TẠM DỪNG
              </span>{" "}
              cày trong khoảng thời gian này để tránh xung đột
              <span className="text-blue-300"> (đăng nhập đè)</span>.
            </p>

          </div>
          <div className="flex items-center gap-2">

            <TimeRangePicker
              value={start}
              onChange={setStart}
            />

            <span className="text-zinc-500">-</span>

            <TimeRangePicker
              value={end}
              onChange={setEnd}
            />

            <button
              onClick={addWindow}
              className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>

          </div>

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {/* list */}

          {windows.length === 0 ? (

            <div className="text-center text-zinc-500 text-sm py-6 border border-dashed border-zinc-800 rounded-xl">
              Chưa có lịch
            </div>

          ) : (

            <div className="space-y-2">

              {windows.map((w, i) => (

                <div
                  key={i}
                  className="flex justify-between items-center bg-zinc-800 px-4 py-3 rounded-xl"
                >

                  <span className="text-white font-semibold">
                    {w.start} - {w.end}
                  </span>

                  <button
                    onClick={() => removeWindow(i)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* footer */}

        <div className="flex justify-end gap-3 p-4 border-t border-zinc-800">

          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white"
          >
            Hủy
          </button>

          <button
            onClick={save}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
          >
            Xác nhận
          </button>

        </div>

      </div>

    </div>,

    document.body
  );
}