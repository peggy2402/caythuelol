// src/app/(dashboard)/booster/services/components/BoosterScheduleSection.tsx
'use client';

import React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  ALL_WEEKDAYS,
  generateWorkingScheduleNote,
  BoosterWorkingSchedule,
} from '@/lib/booster-helpers';

interface BoosterScheduleSectionProps {
  workingSchedule: BoosterWorkingSchedule;
  onUpdateWorkingSchedule: (partial: Partial<BoosterWorkingSchedule>) => void;
}

export const BoosterScheduleSection: React.FC<BoosterScheduleSectionProps> = ({
  workingSchedule,
  onUpdateWorkingSchedule,
}) => {
  return (
    <div className="pt-6 border-t border-zinc-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-800">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Clock className="text-cyan-400 w-4 h-4" />
            <span>3. Lịch trực & Thời gian làm việc (Working Hours)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Thiết lập khung giờ và các ngày trong tuần bạn sẵn sàng cày rank để hiển thị công khai cho khách hàng.
          </p>
        </div>
        <span className="text-[11px] text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 w-fit">
          Hiển thị trên Thẻ Booster & Hồ sơ
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cột trái: Chọn ngày & Khung giờ (8 cột) */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Chọn các ngày làm việc trong tuần */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-400" />
                <span>Các ngày nhận cày trong tuần:</span>
              </label>
              {/* Phím chọn nhanh */}
              {(() => {
                const cDays = workingSchedule.daysOfWeek || [];
                const isAllWeek = cDays.length === 7;
                const isWeekdaysNoSunday =
                  cDays.length === 6 &&
                  !cDays.includes('CN') &&
                  ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'].every((d) => cDays.includes(d));
                const isWeekendOnly =
                  cDays.length === 2 && cDays.includes('T7') && cDays.includes('CN');

                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                        onUpdateWorkingSchedule({ daysOfWeek: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isAllWeek
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      Cả tuần (T2-CN)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                        onUpdateWorkingSchedule({ daysOfWeek: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isWeekdaysNoSunday
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      T2 - T7 (Trừ CN)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newDays = ['T7', 'CN'];
                        onUpdateWorkingSchedule({ daysOfWeek: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isWeekendOnly
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      Chỉ cuối tuần
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Nút bấm 7 ngày */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {ALL_WEEKDAYS.map((day) => {
                const isSelected = (workingSchedule.daysOfWeek || []).includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      const currentDays = workingSchedule.daysOfWeek || [];
                      const newDays = isSelected
                        ? currentDays.filter((d) => d !== day.id)
                        : [...currentDays, day.id];
                      if (newDays.length === 0) {
                        toast.warning('Bạn cần chọn ít nhất 1 ngày làm việc');
                        return;
                      }
                      onUpdateWorkingSchedule({ daysOfWeek: newDays });
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khung giờ hàng ngày */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock size={14} className="text-cyan-400" />
                <span>Khung giờ làm việc hàng ngày:</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-cyan-400">
                {workingSchedule.fromTime} → {workingSchedule.toTime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={workingSchedule.fromTime || '08:00'}
                  onChange={(e) => onUpdateWorkingSchedule({ fromTime: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-cyan-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={workingSchedule.toTime || '17:30'}
                  onChange={(e) => onUpdateWorkingSchedule({ toTime: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Phím chọn nhanh ca */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Chọn nhanh khung giờ phổ biến:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Hành chính (08:00 – 17:30)', from: '08:00', to: '17:30' },
                  { label: 'Ca Sáng (08:00 – 12:00)', from: '08:00', to: '12:00' },
                  { label: 'Ca Chiều (13:30 – 17:30)', from: '13:30', to: '17:30' },
                  { label: 'Ca Tối (19:00 – 23:00)', from: '19:00', to: '23:00' },
                  { label: 'Ca Đêm (23:00 – 04:00)', from: '23:00', to: '04:00' },
                ].map((item, idx) => {
                  const isActive =
                    workingSchedule.fromTime === item.from &&
                    workingSchedule.toTime === item.to;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        onUpdateWorkingSchedule({ fromTime: item.from, toTime: item.to })
                      }
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Ghi chú hiển thị công khai & Xem trước Huy hiệu (4 cột) */}
        <div className="lg:col-span-4 space-y-3.5">
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white block">
                  Ghi chú hiển thị công khai:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const autoNote = generateWorkingScheduleNote(
                      workingSchedule.fromTime,
                      workingSchedule.toTime,
                      workingSchedule.daysOfWeek
                    );
                    onUpdateWorkingSchedule({ note: autoNote });
                    toast.success('Đã cập nhật câu ghi chú theo lịch hiện tại!');
                  }}
                  className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  Tự tạo ghi chú
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="VD: Làm từ 8:00 -> 17:30 các ngày trong tuần trừ CN..."
                value={workingSchedule.note || ''}
                onChange={(e) => onUpdateWorkingSchedule({ note: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 resize-none font-medium"
              />

              {/* Thẻ xem trước Preview */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-cyan-500/20 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                  Khách hàng sẽ nhìn thấy:
                </span>
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg">
                  <Clock size={13} className="text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {workingSchedule.note ||
                      generateWorkingScheduleNote(
                        workingSchedule.fromTime,
                        workingSchedule.toTime,
                        workingSchedule.daysOfWeek
                      )}
                  </span>
                </div>
              </div>
            </div>

            {/* Trạng thái Bật/Tắt nhận đơn theo lịch */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Nhận đơn đặt lịch</span>
                <span className="text-[10px] text-zinc-400">Cho phép khách hẹn giờ</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={workingSchedule.allowScheduledBoost}
                onClick={() =>
                  onUpdateWorkingSchedule({
                    allowScheduledBoost: !workingSchedule.allowScheduledBoost,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  workingSchedule.allowScheduledBoost
                    ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                    workingSchedule.allowScheduledBoost ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
