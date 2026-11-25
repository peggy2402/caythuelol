import React from 'react';
import { Calendar, Clock, Sun, Sunset, Moon, Sparkles, ShieldCheck, AlertTriangle, ThumbsUp } from 'lucide-react';
import { ScheduleDetails } from '@/lib/rank-calculator';

interface ScheduleConfigPanelProps {
  scheduleDetails: ScheduleDetails;
  onChangeSchedule: (updated: ScheduleDetails) => void;
  percent: number;
}

export const TIME_SHIFTS = [
  {
    id: '08:00 - 12:00',
    name: 'Ca Sáng',
    time: '08:00 – 12:00',
    icon: Sun,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  {
    id: '13:00 - 17:00',
    name: 'Ca Chiều',
    time: '13:00 – 17:00',
    icon: Sunset,
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
  },
  {
    id: '19:00 - 23:00',
    name: 'Ca Tối',
    time: '19:00 – 23:00',
    icon: Moon,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    recommended: true,
  },
  {
    id: '23:00 - 04:00',
    name: 'Ca Đêm',
    time: '23:00 – 04:00',
    icon: Moon,
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
  },
];

export function ScheduleConfigPanel({
  scheduleDetails,
  onChangeSchedule,
  percent,
}: ScheduleConfigPanelProps) {
  // Format dates for quick selection
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const currentWindow = scheduleDetails.timeWindow || '19:00 - 23:00';
  const isCustomTime = currentWindow === 'CUSTOM';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/90 border border-blue-500/40 shadow-xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Clock size={15} />
          </div>
          <div>
            <span className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5">
              <span>Cấu Hình Lịch Cày & Khung Giờ (SLA Cam Kết)</span>
              <span className="text-blue-400 font-mono">(+{percent}%)</span>
            </span>
            <p className="text-[11px] text-zinc-400">
              Booster cam kết online và cày đúng khung giờ bạn đã thiết lập
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[10px] font-bold">
          {scheduleDetails.timezone || 'GMT+7 (Giờ VN)'}
        </div>
      </div>

      {/* 1. Chọn Ngày Bắt Đầu */}
      <div className="space-y-1.5">
        <label className="font-bold text-zinc-300 flex items-center gap-1.5">
          <Calendar size={13} className="text-blue-400" />
          <span>1. Ngày bắt đầu cày mong muốn:</span>
          <span className="text-red-500">*</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeSchedule({ ...scheduleDetails, startDate: todayStr })}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              scheduleDetails.startDate === todayStr
                ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Hôm nay ({formatDateDisplay(todayStr)})
          </button>

          <button
            type="button"
            onClick={() => onChangeSchedule({ ...scheduleDetails, startDate: tomorrowStr })}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              scheduleDetails.startDate === tomorrowStr
                ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Ngày mai ({formatDateDisplay(tomorrowStr)})
          </button>

          <button
            type="button"
            onClick={() => onChangeSchedule({ ...scheduleDetails, startDate: dayAfterStr })}
            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              scheduleDetails.startDate === dayAfterStr
                ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Ngày kia ({formatDateDisplay(dayAfterStr)})
          </button>

          <div className="relative">
            <input
              type="date"
              min={todayStr}
              value={scheduleDetails.startDate || todayStr}
              onChange={(e) => onChangeSchedule({ ...scheduleDetails, startDate: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. Chọn Khung Giờ (Ca Trực) */}
      <div className="space-y-1.5">
        <label className="font-bold text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-cyan-400" />
            <span>2. Khung giờ thực hiện (Time Window):</span>
            <span className="text-red-500">*</span>
          </span>
          <span className="text-[10px] text-zinc-400">
            Đang chọn:{' '}
            <strong className="text-cyan-300">
              {isCustomTime
                ? `${scheduleDetails.customStartTime || '20:00'} – ${scheduleDetails.customEndTime || '23:00'}`
                : currentWindow}
            </strong>
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIME_SHIFTS.map((shift) => {
            const isSelected = !isCustomTime && currentWindow === shift.id;
            const ShiftIcon = shift.icon;

            return (
              <button
                key={shift.id}
                type="button"
                onClick={() =>
                  onChangeSchedule({
                    ...scheduleDetails,
                    mode: 'TIME_WINDOW',
                    timeWindow: shift.id,
                  })
                }
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-gradient-to-b from-blue-900/30 to-blue-950/60 border-blue-400 ring-1 ring-blue-400/50 shadow-md shadow-blue-500/20 text-white'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1 gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShiftIcon size={14} className={`${shift.color} shrink-0`} />
                    <span className="font-bold text-xs truncate">{shift.name}</span>
                  </div>
                  {shift.recommended && (
                    <span
                      title="Khuyên dùng / Giờ vàng cày rank"
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_12px_rgba(251,191,36,0.45)] shrink-0"
                    >
                      <ThumbsUp size={11} className="fill-amber-400 text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
                    </span>
                  )}
                </div>
                <div className="font-mono text-[11px] font-black text-cyan-300 truncate">
                  {shift.time}
                </div>
              </button>
            );
          })}
        </div>

        {/* Nút bật Khung giờ tùy chỉnh */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() =>
              onChangeSchedule({
                ...scheduleDetails,
                mode: 'TIME_WINDOW',
                timeWindow: 'CUSTOM',
                customStartTime: scheduleDetails.customStartTime || '20:00',
                customEndTime: scheduleDetails.customEndTime || '23:00',
              })
            }
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isCustomTime
                ? 'bg-purple-950/30 border-purple-400 text-purple-200 ring-1 ring-purple-400/40'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>Tùy chỉnh giờ bắt đầu – kết thúc riêng</span>
          </button>

          {isCustomTime && (
            <div className="mt-2 p-3 rounded-xl bg-zinc-900 border border-purple-500/30 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-medium">Từ:</span>
                <input
                  type="time"
                  value={scheduleDetails.customStartTime || '20:00'}
                  onChange={(e) =>
                    onChangeSchedule({
                      ...scheduleDetails,
                      customStartTime: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400 font-medium">Đến:</span>
                <input
                  type="time"
                  value={scheduleDetails.customEndTime || '23:00'}
                  onChange={(e) =>
                    onChangeSchedule({
                      ...scheduleDetails,
                      customEndTime: e.target.value,
                    })
                  }
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none focus:border-purple-400"
                />
              </div>

              <span className="text-[11px] text-purple-300 font-mono">
                (Khung giờ tùy chọn: {scheduleDetails.customStartTime || '20:00'} – {scheduleDetails.customEndTime || '23:00'})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Ghi Chú Riêng Về Lịch Cho Booster */}
      <div className="space-y-1">
        <label className="font-bold text-zinc-300 block">
          3. Ghi chú lịch cho Booster (Ví dụ: Giờ rảnh, thời điểm không được vào tài khoản):
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Chỉ cày vào buổi tối từ 20h đến 23h. Ban ngày tôi tự vào chơi..."
          value={scheduleDetails.customerNote || ''}
          onChange={(e) => onChangeSchedule({ ...scheduleDetails, customerNote: e.target.value })}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Cam Kết SLA Hai Chiều */}
      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1.5 text-[11px] text-zinc-300">
        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
          <ShieldCheck size={14} />
          <span>Chính sách SLA & Cam kết lịch cày:</span>
        </div>
        <p className="leading-relaxed">
          • <strong className="text-white">Booster cam kết:</strong> Đăng nhập và hoàn thành tiến độ đúng khung giờ đã thống nhất. Nếu trễ quá 30 phút mà không thông báo, khách có quyền yêu cầu hủy đơn hoặc đổi tuyển thủ.
        </p>
        <p className="leading-relaxed text-amber-300/90 flex items-start gap-1">
          <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-white">Khách hàng lưu ý:</strong> Tuyệt đối không đăng nhập vào game trong khung giờ đã đặt để tránh trùng phiên hoặc làm gián đoạn trận đấu của Booster.
          </span>
        </p>
      </div>
    </div>
  );
}

export default ScheduleConfigPanel;
