'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, X, Sparkles, Clock, Check, Loader2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getMobaLanes, getLaneMeta } from '@/lib/lanes';

interface EditOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess?: (updatedData: any) => void;
}

const PRESET_TIME_WINDOWS = [
  { id: '08:00 - 17:30', label: '08:00 – 17:30 (Giờ hành chính)' },
  { id: '13:00 - 22:00', label: '13:00 – 22:00 (Chiều & Tối)' },
  { id: '19:00 - 23:00', label: '19:00 – 23:00 (Ca Tối)' },
  { id: 'CUSTOM', label: 'Tự đặt khung giờ riêng' },
];

export default function EditOptionsModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: EditOptionsModalProps) {
  const gameCode = (
    order?.game ||
    order?.snapshot?.gameCode ||
    order?.details?.game ||
    order?.service_data?.game ||
    'LOL'
  ).toUpperCase();

  const availableLanes = getMobaLanes(gameCode);

  // Trích xuất các option đã thanh toán
  const hasSpecificRole = Boolean(
    order?.options?.specificRole ||
      order?.details?.addons?.specificRole ||
      order?.details?.specificRole ||
      (order?.options?.selectedRoles && order.options.selectedRoles.length > 0) ||
      (order?.details?.selectedRoles && order.details.selectedRoles.length > 0)
  );

  const hasSpecificChamps = Boolean(
    order?.options?.specificChamps ||
      order?.details?.addons?.specificChamps ||
      order?.details?.specificChamps ||
      (order?.options?.selectedChampions && order.options.selectedChampions.length > 0) ||
      (order?.details?.selectedChampions && order.details.selectedChampions.length > 0)
  );

  const scheduleDetails =
    order?.options?.scheduleDetails ||
    order?.details?.scheduleDetails ||
    order?.details?.addons?.scheduleDetails;

  const hasSchedule = Boolean(
    order?.options?.schedule ||
      order?.details?.addons?.schedule ||
      order?.details?.schedule ||
      scheduleDetails
  );

  // State form
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [champions, setChampions] = useState<string[]>([]);
  const [champInput, setChampInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('08:00 - 17:30');
  const [customStartTime, setCustomStartTime] = useState('08:00');
  const [customEndTime, setCustomEndTime] = useState('17:30');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!order) return;

    // Khởi tạo roles
    const rawRoles =
      order.options?.roles ||
      order.options?.selectedRoles ||
      order.details?.roles ||
      order.details?.selectedRoles ||
      [];
    setSelectedRoles(Array.isArray(rawRoles) ? rawRoles.map(String) : []);

    // Khởi tạo champions
    const rawChamps =
      order.options?.champions ||
      order.options?.selectedChampions ||
      order.details?.champions ||
      order.details?.selectedChampions ||
      [];
    setChampions(Array.isArray(rawChamps) ? rawChamps.map(String) : []);

    // Khởi tạo schedule
    const sched =
      order.options?.scheduleDetails ||
      order.details?.scheduleDetails ||
      order.details?.addons?.scheduleDetails;
    if (sched) {
      setStartDate(sched.startDate || '');
      setTimeWindow(sched.timeWindow || '08:00 - 17:30');
      setCustomStartTime(sched.customStartTime || '08:00');
      setCustomEndTime(sched.customEndTime || '17:30');
      setCustomerNote(sched.customerNote || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  const toggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      if (selectedRoles.length >= 2) {
        toast.error('Bạn chỉ có thể chọn tối đa 2 vị trí ưu tiên');
        return;
      }
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleAddChamp = () => {
    const trimmed = champInput.trim();
    if (!trimmed) return;
    if (champions.includes(trimmed)) {
      toast.error('Tướng này đã có trong danh sách');
      return;
    }
    if (champions.length >= 3) {
      toast.error('Bạn chỉ được chọn tối đa 3 tướng ưu tiên');
      return;
    }
    setChampions([...champions, trimmed]);
    setChampInput('');
  };

  const handleRemoveChamp = (champ: string) => {
    setChampions(champions.filter((c) => c !== champ));
  };

  const handleSubmit = async () => {
    if (hasSpecificRole && selectedRoles.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 vị trí / đường');
      return;
    }
    if (hasSpecificChamps && champions.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 tướng chỉ định');
      return;
    }
    if (hasSchedule && !startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu cày');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = order._id || order.orderCode;
      const updatedSchedule = hasSchedule
        ? {
            mode: timeWindow === 'CUSTOM' ? 'CUSTOM' : 'TIME_WINDOW',
            startDate,
            timeWindow,
            customStartTime: timeWindow === 'CUSTOM' ? customStartTime : undefined,
            customEndTime: timeWindow === 'CUSTOM' ? customEndTime : undefined,
            timezone: 'GMT+7 (Việt Nam)',
            customerNote: customerNote.trim(),
          }
        : undefined;

      const rolesDisplay = selectedRoles.map((r) => getLaneMeta(r, gameCode).name);

      const payload: any = {};
      if (hasSpecificRole) {
        payload.roles = selectedRoles;
        payload.selectedRoles = selectedRoles;
        payload.rolesDisplay = rolesDisplay;
      }
      if (hasSpecificChamps) {
        payload.champions = champions;
        payload.selectedChampions = champions;
      }
      if (hasSchedule && updatedSchedule) {
        payload.scheduleDetails = updatedSchedule;
      }

      // Gửi options lồng nhau để đồng bộ triệt để
      payload.options = {
        ...(order.options || {}),
        ...payload,
      };

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Không thể cập nhật tùy chọn');
      }

      toast.success('Đã cập nhật tùy chọn đơn hàng thành công!');
      if (onSuccess) {
        onSuccess(payload);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi lưu tùy chọn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Điều chỉnh Tùy chọn Mở rộng</h3>
              <p className="text-xs text-zinc-400">
                Thay đổi vị trí, tướng hoặc lịch cày của các tùy chọn bạn đã thanh toán
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Thông báo điều kiện */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Bạn chỉ có thể thay đổi giá trị của các tùy chọn đã thanh toán trước khi Booster bấm{' '}
              <strong className="text-white">"Bắt đầu cày"</strong>.
            </span>
          </div>

          {/* 1. Vị trí / Đường chỉ định */}
          {hasSpecificRole && (
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Vị trí / Đường ưu tiên (Chọn tối đa 2)
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Đã chọn: {selectedRoles.length}/2
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {availableLanes.map((lane) => {
                  const isSelected = selectedRoles.includes(lane.id);
                  return (
                    <button
                      key={lane.id}
                      type="button"
                      onClick={() => toggleRole(lane.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {lane.image && (
                        <img
                          src={lane.image}
                          alt={lane.name}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      )}
                      <span className="truncate">{lane.shortName || lane.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-blue-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Tùy chọn tướng tủ */}
          {hasSpecificChamps && (
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tướng chỉ định (Chọn tối đa 3 tướng)
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Đã chọn: {champions.length}/3
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={champInput}
                  onChange={(e) => setChampInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChamp();
                    }
                  }}
                  placeholder="Nhập tên tướng (VD: Ahri, Yasuo...)"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddChamp}
                  disabled={champions.length >= 3 || !champInput.trim()}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm
                </button>
              </div>

              {champions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {champions.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs"
                    >
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveChamp(c)}
                        className="text-amber-400 hover:text-white ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Lịch Cày Đặt Trước (SLA Cam Kết) */}
          {hasSchedule && (
            <div className="space-y-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Lịch Cày Đặt Trước (SLA Cam Kết)
                </span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                  GMT+7 (Việt Nam)
                </span>
              </div>

              <div>
                <label className="text-zinc-400 text-[11px] block mb-1">Ngày bắt đầu cày:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[11px] block mb-1">Khung giờ thực hiện:</label>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                >
                  {PRESET_TIME_WINDOWS.map((pw) => (
                    <option key={pw.id} value={pw.id}>
                      {pw.label}
                    </option>
                  ))}
                </select>
              </div>

              {timeWindow === 'CUSTOM' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-zinc-400 text-[10px] block mb-1">Từ giờ:</label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-[10px] block mb-1">Đến giờ:</label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-zinc-400 text-[11px] block mb-1">Ghi chú cho Booster:</label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Ghi chú thêm về lịch chơi..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
}
