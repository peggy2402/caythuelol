// src/app/(dashboard)/booster/services/components/AddonsConfigSection.tsx
'use client';

import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { formatWorkingDays, BoosterWorkingSchedule } from '@/lib/booster-helpers';
import { AddonsConfig } from './servicesTypes';

interface AddonsConfigSectionProps {
  addonsConfig: AddonsConfig;
  workingSchedule: BoosterWorkingSchedule;
  onChangeAddons: (updated: AddonsConfig) => void;
}

export const AddonsConfigSection: React.FC<AddonsConfigSectionProps> = ({
  addonsConfig,
  workingSchedule,
  onChangeAddons,
}) => {
  return (
    <div className="pt-6 border-t border-zinc-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Sparkles className="text-amber-400 w-4 h-4" />
            <span>4. Cấu hình mức phụ phí mở rộng (Addons)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bật / Tắt tiện ích bạn hỗ trợ và tùy chỉnh tỷ lệ % phụ phí khi khách đặt cày.
          </p>
        </div>
        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
          Tự động áp dụng cho khách hàng
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 1. Tùy chọn vị trí / đường */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Tùy chọn vị trí / đường</span>
              <span className="text-[10px] text-zinc-400">Top, Rừng, Mid, AD, SP</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.specificRole.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  specificRole: {
                    ...addonsConfig.specificRole,
                    enabled: !addonsConfig.specificRole.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.specificRole.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.specificRole.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phụ phí cộng thêm
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                disabled={!addonsConfig.specificRole.enabled}
                value={addonsConfig.specificRole.percent}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    specificRole: {
                      ...addonsConfig.specificRole,
                      percent: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-cyan-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* 2. Đặt lịch cày (Giờ chơi) */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Đặt lịch cày (Giờ chơi)</span>
              <span className="text-[10px] text-zinc-400">Khung giờ khách chỉ định</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.schedule.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  schedule: {
                    ...addonsConfig.schedule,
                    enabled: !addonsConfig.schedule.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.schedule.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phụ phí cộng thêm
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                disabled={!addonsConfig.schedule.enabled}
                value={addonsConfig.schedule.percent}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    schedule: {
                      ...addonsConfig.schedule,
                      percent: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-cyan-400 font-bold">%</span>
            </div>
          </div>

          {/* Thông tin lịch áp dụng từ Mục 3 */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Lịch áp dụng (từ Mục 3):
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-cyan-300 font-medium">
              <Clock size={12} className="text-cyan-400 shrink-0" />
              <span className="truncate">
                {workingSchedule.note ||
                  `${formatWorkingDays(workingSchedule.daysOfWeek)}: ${workingSchedule.fromTime} – ${workingSchedule.toTime}`}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Tùy chọn tướng */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Tùy chọn tướng</span>
              <span className="text-[10px] text-zinc-400">Chỉ chơi các tướng khách yêu cầu</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.specificChamps.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  specificChamps: {
                    ...addonsConfig.specificChamps,
                    enabled: !addonsConfig.specificChamps.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.specificChamps.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.specificChamps.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phụ phí cộng thêm
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                disabled={!addonsConfig.specificChamps.enabled}
                value={addonsConfig.specificChamps.percent}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    specificChamps: {
                      ...addonsConfig.specificChamps,
                      percent: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-cyan-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* 4. Xem trực tiếp (Livestream) */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Xem trực tiếp</span>
              <span className="text-[10px] text-zinc-400">Stream riêng tư qua Discord</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.livestream.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  livestream: {
                    ...addonsConfig.livestream,
                    enabled: !addonsConfig.livestream.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.livestream.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.livestream.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phí dịch vụ cố định (VNĐ)
            </label>
            <div className="relative">
              <input
                type="number"
                step="10000"
                min="0"
                disabled={!addonsConfig.livestream.enabled}
                value={addonsConfig.livestream.fee}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    livestream: {
                      ...addonsConfig.livestream,
                      fee: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[11px] font-bold">
                đ
              </span>
            </div>
          </div>
        </div>

        {/* 5. Cày siêu tốc */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Cày siêu tốc</span>
              <span className="text-[10px] text-zinc-400">Ưu tiên hàng đầu, hoàn thành gấp</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.flash.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  flash: {
                    ...addonsConfig.flash,
                    enabled: !addonsConfig.flash.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.flash.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.flash.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phụ phí cộng thêm
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                disabled={!addonsConfig.flash.enabled}
                value={addonsConfig.flash.percent}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    flash: {
                      ...addonsConfig.flash,
                      percent: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-cyan-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {/* 6. Chơi cùng Booster (Duo) */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Chơi cùng Booster</span>
              <span className="text-[10px] text-zinc-400">Duo trực tiếp, không đưa tài khoản</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={addonsConfig.duo.enabled}
              onClick={() => {
                onChangeAddons({
                  ...addonsConfig,
                  duo: {
                    ...addonsConfig.duo,
                    enabled: !addonsConfig.duo.enabled,
                  },
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                addonsConfig.duo.enabled
                  ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  addonsConfig.duo.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
              Phụ phí cộng thêm
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                disabled={!addonsConfig.duo.enabled}
                value={addonsConfig.duo.percent}
                onChange={(e) => {
                  onChangeAddons({
                    ...addonsConfig,
                    duo: {
                      ...addonsConfig.duo,
                      percent: Number(e.target.value) || 0,
                    },
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-700 disabled:opacity-40 rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-cyan-400 font-bold">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
