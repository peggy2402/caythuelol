import React from 'react';
import Image from 'next/image';
import { Info, Sparkles, Check } from 'lucide-react';
import { AddonSelections, ScheduleDetails } from '@/lib/rank-calculator';
import { LaneMeta } from '@/lib/lanes';
import { getLocalDateString } from '@/lib/booster-helpers';
import { ScheduleConfigPanel } from './ScheduleConfigPanel';

interface AddonsAndRolesSectionProps {
  addons: AddonSelections;
  setAddons: React.Dispatch<React.SetStateAction<AddonSelections>>;
  scheduleCfg: { enabled: boolean; percent: number };
  specificRoleCfg: { enabled: boolean; percent: number };
  specificChampsCfg: { enabled: boolean; percent: number };
  livestreamCfg: { enabled: boolean; fee: number };
  flashCfg: { enabled: boolean; percent: number };
  duoCfg: { enabled: boolean; percent: number };
  mobaLanes: LaneMeta[];
  handleToggleLane: (laneId: string) => void;
  assignedBooster?: any;
  onRerollBooster?: () => void;
}

export function AddonsAndRolesSection({
  addons,
  setAddons,
  scheduleCfg,
  specificRoleCfg,
  specificChampsCfg,
  livestreamCfg,
  flashCfg,
  duoCfg,
  mobaLanes,
  handleToggleLane,
  assignedBooster,
  onRerollBooster,
}: AddonsAndRolesSectionProps) {
  return (
    <div className="pt-2 border-t border-zinc-800/80">
      <span className="text-xs font-bold text-zinc-300 block mb-3 uppercase tracking-wider">
        Tùy chọn mở rộng
      </span>

      <div className="space-y-2.5">
        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            scheduleCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!scheduleCfg.enabled}
            checked={addons.schedule && scheduleCfg.enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              setAddons({
                ...addons,
                schedule: checked,
                scheduleDetails: checked
                  ? addons.scheduleDetails || {
                      mode: 'TIME_WINDOW',
                      startDate: getLocalDateString(),
                      timeWindow: '19:00 - 23:00',
                      customStartTime: '19:00',
                      customEndTime: '23:00',
                      timezone: 'GMT+7 (Việt Nam)',
                      customerNote: '',
                    }
                  : addons.scheduleDetails,
              });
            }}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Đặt lịch cày</span>
            {scheduleCfg.enabled ? (
              <span className="text-blue-400 font-bold">
                +{Math.round(scheduleCfg.percent)}%
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>

        {/* Khối Cấu Hình Đặt Lịch Cày Chi Tiết (SLA Cam Kết) */}
        {addons.schedule && scheduleCfg.enabled && (
          <ScheduleConfigPanel
            scheduleDetails={
              addons.scheduleDetails || {
                mode: 'TIME_WINDOW',
                startDate: getLocalDateString(),
                timeWindow: '19:00 - 23:00',
                customStartTime: '19:00',
                customEndTime: '23:00',
                timezone: 'GMT+7 (Việt Nam)',
                customerNote: '',
              }
            }
            onChangeSchedule={(updated: ScheduleDetails) =>
              setAddons((prev) => ({
                ...prev,
                scheduleDetails: updated,
              }))
            }
            percent={Math.round(scheduleCfg.percent)}
            assignedBooster={assignedBooster}
            onRerollBooster={onRerollBooster}
          />
        )}

        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            specificRoleCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!specificRoleCfg.enabled}
            checked={addons.specificRole && specificRoleCfg.enabled}
            onChange={(e) => {
              const checked = e.target.checked;
              setAddons({
                ...addons,
                specificRole: checked,
                selectedRoles:
                  checked && (!addons.selectedRoles || addons.selectedRoles.length === 0)
                    ? ['random']
                    : addons.selectedRoles,
              });
            }}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Tùy chọn vị trí / đường</span>
            {specificRoleCfg.enabled ? (
              <span className="text-blue-400 font-bold">
                +{Math.round(specificRoleCfg.percent)}%
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>

        {/* Khối chọn Vị trí / Đường chi tiết */}
        {addons.specificRole && specificRoleCfg.enabled && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/90 border border-blue-500/30 space-y-3 shadow-lg shadow-blue-500/5 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-white">
                  Chỉ định vị trí bạn muốn cày
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                (Chọn tối đa 2 đường hoặc Bất kỳ)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mobaLanes.map((lane) => {
                const isSelected = (addons.selectedRoles || []).includes(lane.id);
                const isRandomActive = (addons.selectedRoles || []).includes('random');
                const specificCount = (addons.selectedRoles || []).filter((id) => id !== 'random').length;
                const isMax2Reached = !isRandomActive && specificCount >= 2;

                const isDisabled =
                  (!isSelected && isRandomActive && lane.id !== 'random') ||
                  (!isSelected && isMax2Reached && lane.id !== 'random') ||
                  (lane.id === 'random' && specificCount > 0);

                return (
                  <button
                    key={lane.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleToggleLane(lane.id)}
                    className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                        : isDisabled
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-30 cursor-not-allowed grayscale pointer-events-none'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 cursor-pointer active:scale-95'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 p-1">
                      <Image
                        src={lane.image}
                        alt={lane.name}
                        width={26}
                        height={26}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">
                        {lane.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {lane.shortName}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Thanh trạng thái chỉ dẫn */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              {(addons.selectedRoles || []).includes('random') ? (
                <span className="text-purple-300 font-medium">
                  ✓ Đã chọn <strong>Đường Bất Kỳ</strong> (Tuyển thủ sẽ chọn vị trí tối ưu).
                </span>
              ) : (addons.selectedRoles || []).length === 2 ? (
                <span className="text-emerald-400 font-medium">
                  ✓ Đã chọn đủ 2 vị trí (Bấm vào đường đã chọn để bỏ chọn nếu muốn đổi).
                </span>
              ) : (addons.selectedRoles || []).length === 1 ? (
                <span className="text-amber-400 font-medium">
                  ⚠️ Bạn đã chọn 1 đường. Có thể chọn thêm 1 đường hoặc bấm Đường Bất Kỳ.
                </span>
              ) : (
                <span className="text-zinc-400">
                  👉 Vui lòng chọn 1-2 vị trí ưu tiên hoặc chọn Đường Bất Kỳ.
                </span>
              )}
            </div>
          </div>
        )}

        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            specificChampsCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!specificChampsCfg.enabled}
            checked={addons.specificChamps && specificChampsCfg.enabled}
            onChange={(e) => setAddons({ ...addons, specificChamps: e.target.checked })}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Tùy chọn tướng</span>
            {specificChampsCfg.enabled ? (
              <span className="text-blue-400 font-bold">
                +{Math.round(specificChampsCfg.percent)}%
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            livestreamCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!livestreamCfg.enabled}
            checked={addons.livestream && livestreamCfg.enabled}
            onChange={(e) => setAddons({ ...addons, livestream: e.target.checked })}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Xem trực tiếp</span>
            {livestreamCfg.enabled ? (
              <span className="text-amber-400 font-bold">
                +{livestreamCfg.fee.toLocaleString('vi-VN')}đ
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            flashCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!flashCfg.enabled}
            checked={addons.flash && flashCfg.enabled}
            onChange={(e) => setAddons({ ...addons, flash: e.target.checked })}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Cày siêu tốc</span>
            {flashCfg.enabled ? (
              <span className="text-emerald-400 font-bold">
                +{Math.round(flashCfg.percent)}%
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-2.5 rounded-xl border select-none transition-colors ${
            duoCfg.enabled
              ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 cursor-pointer'
              : 'bg-zinc-950/20 border-zinc-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            disabled={!duoCfg.enabled}
            checked={addons.duo && duoCfg.enabled}
            onChange={(e) => setAddons({ ...addons, duo: e.target.checked })}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40"
          />
          <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-medium">
            <span>Chơi cùng Booster (Duo)</span>
            {duoCfg.enabled ? (
              <span className="text-purple-400 font-bold">
                +{Math.round(duoCfg.percent)}%
              </span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-semibold">(Tuyển thủ không nhận)</span>
            )}
            <Info size={13} className="text-blue-400" />
          </div>
        </label>
      </div>
    </div>
  );
}

export default AddonsAndRolesSection;
