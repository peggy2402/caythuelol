'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const times = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, '0')}:00`
);

export default function TimeRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition"
      >
        <Clock className="w-4 h-4 text-zinc-500" />
        <span className="font-semibold text-white">{value}</span>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-[320px]">

              <h3 className="text-white font-bold mb-4">
                Chọn giờ
              </h3>

              <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-y-auto">

                {times.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      onChange(t);
                      setOpen(false);
                    }}
                    className={`py-2 rounded-lg text-sm font-semibold transition
                    ${
                      value === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}

              </div>

              <button
                onClick={() => setOpen(false)}
                className="mt-4 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm"
              >
                Đóng
              </button>

            </div>
          </div>,
          document.body
        )}
    </>
  );
}