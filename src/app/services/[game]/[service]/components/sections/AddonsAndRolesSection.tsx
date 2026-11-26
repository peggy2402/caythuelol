import React from 'react';
import Image from 'next/image';
import { Info, Sparkles, Check, Plus, X, Star } from 'lucide-react';
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
  onOpenChampionModal?: () => void;
  championsList?: any[];
  boosterChampions?: string[];
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
  onOpenChampionModal,
  championsList = [],
  boosterChampions = [],
}: AddonsAndRolesSectionProps) {
  const hasRandom = mobaLanes.some((l) => l.id === 'random');
  const defaultFirstRole = hasRandom ? 'random' : (mobaLanes[0]?.id || 'jungle');

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
              const currentValid = (addons.selectedRoles || []).filter((r) =>
                mobaLanes.some((l) => l.id === r)
              );
              setAddons({
                ...addons,
                specificRole: checked,
                selectedRoles:
                  checked && currentValid.length === 0
                    ? [defaultFirstRole]
                    : currentValid.length > 0
                    ? currentValid
                    : [defaultFirstRole],
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
                (Chọn tối đa 2 vị trí ưu tiên)
              </span>
            </div>

            <div
              className={`grid gap-2 ${
                mobaLanes.length === 5
                  ? 'grid-cols-5'
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
              }`}
            >
              {mobaLanes.map((lane) => {
                const isSelected = (addons.selectedRoles || []).includes(lane.id);
                const isRandomActive = hasRandom && (addons.selectedRoles || []).includes('random');
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
                    className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl border text-center transition-all relative ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400'
                        : isDisabled
                        ? 'bg-zinc-950/40 border-zinc-900 opacity-30 cursor-not-allowed grayscale pointer-events-none'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 cursor-pointer active:scale-95'
                    }`}
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 p-1 mb-1 shadow-inner">
                      <Image
                        src={lane.image}
                        alt={lane.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-contain drop-shadow"
                      />
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold truncate max-w-full">
                      {lane.shortName}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Thanh trạng thái chỉ dẫn */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              {hasRandom && (addons.selectedRoles || []).includes('random') ? (
                <span className="text-purple-300 font-medium">
                  ✓ Đã chọn <strong>Đường Bất Kỳ</strong> (Tuyển thủ sẽ chọn vị trí tối ưu).
                </span>
              ) : (addons.selectedRoles || []).length === 2 ? (
                <span className="text-emerald-400 font-medium">
                  ✓ Đã chọn 2 vị trí (Bấm vào vị trí đã chọn để bỏ chọn nếu muốn đổi).
                </span>
              ) : (addons.selectedRoles || []).length === 1 ? (
                <span className="text-emerald-400 font-medium">
                  ✓ Đã chọn: <strong>{mobaLanes.find((l) => l.id === addons.selectedRoles?.[0])?.name || addons.selectedRoles?.[0]}</strong> (Có thể chọn thêm vị trí thứ 2).
                </span>
              ) : (
                <span className="text-zinc-400">
                  👉 Vui lòng chọn 1-2 vị trí ưu tiên.
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
            onChange={(e) => {
              const checked = e.target.checked;
              setAddons({ ...addons, specificChamps: checked });
              if (checked && (!addons.selectedChampions || addons.selectedChampions.length === 0)) {
                onOpenChampionModal?.();
              }
            }}
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 disabled:opacity-40 cursor-pointer"
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

        {/* KHỐI HIỂN THỊ DANH SÁCH TƯỚNG ĐÃ CHỈ ĐỊNH */}
        {addons.specificChamps && specificChampsCfg.enabled && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-950/90 border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/20 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-400" />
                <span>Chỉ định tướng muốn tuyển thủ đánh (1 – 3 tướng)</span>
              </span>

              <button
                type="button"
                onClick={onOpenChampionModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Plus size={13} />
                <span>
                  {addons.selectedChampions && addons.selectedChampions.length > 0
                    ? 'Đổi danh sách tướng'
                    : 'Mở bảng chọn tướng'}
                </span>
              </button>
            </div>

            {/* Danh sách tướng đã chọn */}
            {addons.selectedChampions && addons.selectedChampions.length > 0 ? (
              <div className="flex items-center gap-2.5 flex-wrap">
                {addons.selectedChampions.map((champName, idx) => {
                  const champObj = championsList.find(
                    (c) =>
                      c.name?.toLowerCase() === champName?.toLowerCase() ||
                      c.id?.toLowerCase() === champName?.toLowerCase()
                  );
                  return (
                    <div
                      key={champName}
                      className="inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-zinc-900 border border-cyan-500/40 text-white text-xs shadow-md group"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-cyan-400/50 shrink-0 bg-zinc-800 shadow-inner">
                        {champObj?.imageUrl ? (
                          <img
                            src={champObj.imageUrl}
                            alt={champName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-zinc-800 text-cyan-400">
                            #{idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-cyan-400 font-extrabold uppercase">
                          Ưu tiên {idx + 1}
                        </span>
                        <span className="font-extrabold text-xs text-white">
                          {champObj?.name || champName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddons((prev) => ({
                            ...prev,
                            selectedChampions: (prev.selectedChampions || []).filter(
                              (c) => c !== champName
                            ),
                          }));
                        }}
                        className="ml-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Bỏ tướng này"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenChampionModal}
                className="w-full py-4 px-3 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-xl text-center text-xs text-zinc-400 hover:text-cyan-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-zinc-900/40 group"
              >
                <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={18} />
                </div>
                <span className="font-bold text-white group-hover:text-cyan-300">
                  Bấm vào đây để chọn 1 – 3 tướng yêu thích của bạn
                </span>
                <span className="text-[10px] text-zinc-500">
                  Hệ thống hỗ trợ tìm kiếm theo tên và lọc theo đặc tính (Sát thủ, Đấu sĩ, Pháp sư...)
                </span>
              </button>
            )}

            {/* Gợi ý tướng tủ của Tuyển thủ nếu có */}
            {boosterChampions && boosterChampions.length > 0 && (
              <div className="pt-2.5 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
                <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
                  <Star size={12} className="fill-amber-400" />
                  <span>
                    Tướng tủ {assignedBooster?.displayName || assignedBooster?.username || 'Tuyển thủ'}:
                  </span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {boosterChampions.map((bChamp) => {
                    const isSelected = (addons.selectedChampions || []).includes(bChamp);
                    return (
                      <button
                        key={bChamp}
                        type="button"
                        onClick={() => {
                          setAddons((prev) => {
                            const current = prev.selectedChampions || [];
                            if (current.includes(bChamp)) {
                              return {
                                ...prev,
                                selectedChampions: current.filter((c) => c !== bChamp),
                              };
                            }
                            if (current.length >= 3) {
                              return prev;
                            }
                            return {
                              ...prev,
                              selectedChampions: [...current, bChamp],
                            };
                          });
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {bChamp}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
