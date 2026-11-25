'use client';

import React from 'react';
import Image from 'next/image';
import { Trophy, Clock } from 'lucide-react';
import { getLaneMeta } from '@/lib/lanes';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { formatServiceName } from './orderHelpers';
import NetWinsOrderView from '@/components/orders/NetWinsOrderView';
import RankBoostOrderView from '@/components/orders/RankBoostOrderView';
import PromotionOrderView from '@/components/orders/PromotionOrderView';
import PlacementsOrderView from '@/components/orders/PlacementsOrderView';
import MatchesOrderView from '@/components/orders/MatchesOrderView';
import MasteryOrderView from '@/components/orders/MasteryOrderView';
import LevelingOrderView from '@/components/orders/LevelingOrderView';
import OnBetOrderView from '@/components/orders/OnBetOrderView';
import CoachingOrderView from '@/components/orders/CoachingOrderView';

interface OrderServiceCardProps {
  order: any;
  isBooster: boolean;
  isCustomer: boolean;
  onPayRemaining?: () => void;
  onRefund?: () => void;
  vodLink?: string;
  setVodLink?: (val: string) => void;
  onUpdateVodLink?: () => void;
  isUpdatingVod?: boolean;
}

const optionLabels: Record<string, string> = {
  specificRole: 'Tùy chọn vị trí / đường',
  roles: 'Tùy chọn vị trí / đường',
  specificChamps: 'Tùy chọn tướng tủ',
  champions: 'Tướng chỉ định',
  schedule: 'Khung giờ chơi / cấm chơi',
  livestream: 'Phát trực tiếp (Livestream)',
  streaming: 'Phát trực tiếp (Livestream)',
  flash: 'Vị trí Tốc Biến (Flash)',
  flashPosition: 'Vị trí Tốc Biến (Flash)',
  duo: 'Duo cùng Tuyển thủ',
  express: 'Cày siêu tốc (Ưu tiên)',
  priority: 'Cày ưu tiên hoàn thành',
  coaching: 'Kèm riêng 1-1',
};

export default function OrderServiceCard({
  order,
  isBooster,
  isCustomer,
  onPayRemaining,
  onRefund,
  vodLink,
  setVodLink,
  onUpdateVodLink,
  isUpdatingVod,
}: OrderServiceCardProps) {
  // Trích xuất các tùy chọn addons
  const activeOptions = Object.entries(
    order.details?.addons ||
      order.options ||
      order.details?.service_data?.addons ||
      {}
  ).filter(([, val]) => val === true || (Array.isArray(val) && val.length > 0));

  const extractedRoles: string[] = (() => {
    const raw =
      order.options?.roles ||
      order.options?.selectedRoles ||
      order.details?.roles ||
      order.details?.selectedRoles ||
      order.details?.addons?.roles ||
      order.details?.addons?.selectedRoles ||
      order.details?.service_data?.roles;
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
    if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
    return [];
  })();

  const hasSpecificRole = Boolean(
    order.options?.specificRole ||
      order.details?.addons?.specificRole ||
      order.details?.specificRole ||
      extractedRoles.length > 0
  );

  const scheduleOption = activeOptions.find(([k]) => k === 'schedule');
  const simpleOptions = activeOptions.filter(([k, v]) => {
    if (k === 'schedule' && Array.isArray(v)) return false;
    if (k === 'roles' || k === 'selectedRoles' || k === 'specificRole' || k === 'rolesDisplay') return false;
    return true;
  });

  return (
    <>
      {/* Service Info */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Dịch vụ
        </h3>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Loại dịch vụ:</span>
            <span className="text-white font-bold">
              {formatServiceName(order.serviceType || order.snapshot?.serviceSlug, order.details)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Mục tiêu:</span>
            <span className="text-blue-400 font-bold text-right">
              {(() => {
                if (order.serviceType === 'MATCHES' || order.details?.is_matches) {
                  const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                  const count =
                    order.details?.match_count ||
                    order.details?.matches ||
                    order.details?.steps_count ||
                    order.details?.num_games ||
                    1;
                  return `Cày ${count} trận (${queue})`;
                }
                if (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) {
                  const queue = order.details?.queue_type === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                  const count =
                    order.details?.placement_matches ||
                    order.details?.matches ||
                    order.details?.steps_count ||
                    order.details?.num_games ||
                    5;
                  const prevRank =
                    order.details?.previous_rank_label ||
                    formatRankDisplayVi(order.details?.previous_season_rank || order.details?.prev_rank) ||
                    'Chưa có';
                  return `Cày ${count} trận (${queue} • Mùa trước: ${prevRank})`;
                }
                if (order.serviceType === 'NET_WINS') {
                  const isPointBoost = Boolean(
                    order.details?.is_point_boost ||
                      order.details?.calc_mode === 'BY_LP' ||
                      order.details?.segment
                  );
                  const unit = order.details?.unit || 'LP';
                  const segmentLabel =
                    order.details?.segment_label ||
                    (order.details?.segment ? formatRankDisplayVi(order.details.segment) : null);
                  const rankLabel =
                    segmentLabel ||
                    formatRankDisplayVi(order.details?.current_rank || order.details?.rank) ||
                    'Khởi điểm';

                  if (isPointBoost) {
                    const start =
                      order.details?.start_lp ??
                      order.details?.current_points ??
                      order.details?.current_lp ??
                      0;
                    const target =
                      order.details?.target_lp ??
                      order.details?.desired_points ??
                      order.details?.target_points ??
                      start + (order.details?.gained_points || 0);
                    return `${start} ${unit} ➜ ${target} ${unit} (${rankLabel})`;
                  }

                  return order.details?.calc_mode === 'BY_GAMES' || order.details?.num_games
                    ? `+${order.details?.num_games || 0} Trận thắng (${rankLabel})`
                    : `${order.details?.start_lp ?? order.details?.current_lp ?? 0} LP ➜ ${
                        order.details?.target_lp ?? 0
                      } LP (${rankLabel})`;
                }
                if (order.serviceType === 'MASTERY') {
                  return `${order.details.champion} (Lv.${order.details.current_mastery} ➜ Lv.${order.details.desired_mastery})`;
                }
                if (order.serviceType === 'ONBET') {
                  return `${order.details.game_count} Trận (${order.details.rank_label})`;
                }
                if (order.serviceType === 'COACHING') {
                  return `${order.details.coaching_type} (${order.details.hours} Giờ)`;
                }
                // Default (Rank Boost, Leveling, Promotion)
                const curr = order.details.current_rank
                  ? formatRankDisplayVi(order.details.current_rank)
                  : order.details.current_level;
                const des = order.details.desired_rank
                  ? formatRankDisplayVi(order.details.desired_rank)
                  : order.details.desired_level;
                return `${curr} ➜ ${des}`;
              })()}
            </span>
          </div>

          {/* Vị trí / Đường chỉ định (Hiển thị cân đối 2 bên kèm Logo / Tên đường) */}
          {hasSpecificRole && (
            <div className="flex justify-between items-start pt-3 border-t border-zinc-800 gap-3">
              <span className="text-zinc-500 shrink-0">Vị trí / Đường:</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {extractedRoles.length > 0 ? (
                  extractedRoles.map((roleId: string) => {
                    const meta = getLaneMeta(roleId, order.game);
                    return (
                      <span
                        key={roleId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold text-xs shadow-sm"
                      >
                        {meta.image && (
                          <Image
                            src={meta.image}
                            alt={meta.name}
                            width={16}
                            height={16}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span>{meta.name}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 font-bold text-xs shadow-sm">
                    <Image
                      src="/images/lane-aov/random-lane.png"
                      alt="Đường Bất Kỳ"
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain"
                    />
                    <span>Đường Bất Kỳ (Linh hoạt)</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Các tùy chọn mở rộng khác (Cày siêu tốc, Duo, Stream, Đặt lịch) */}
          {simpleOptions.length > 0 && (
            <div className="flex justify-between items-center pt-2.5 border-t border-zinc-800 gap-3">
              <span className="text-zinc-500 shrink-0">Tùy chọn khác:</span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {simpleOptions.map(([key, val]) => (
                  <span
                    key={key}
                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-300 font-medium"
                  >
                    {optionLabels[key] || key}
                    {Array.isArray(val) && typeof val[0] !== 'object' ? `: ${val.join(', ')}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Khung giờ nghỉ (Schedule Block) nếu có */}
          {scheduleOption && Array.isArray(scheduleOption[1]) && scheduleOption[1].length > 0 && (
            <div className="pt-2.5 border-t border-zinc-800">
              <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/15">
                <span className="text-red-400 text-xs mb-2 flex items-center gap-1.5 font-bold">
                  <Clock size={12} /> Khung giờ nghỉ (Cấm tuyển thủ chơi):
                </span>
                <div className="flex flex-wrap gap-2">
                  {scheduleOption[1].map((w: any, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/25 rounded-lg flex items-center gap-1.5"
                    >
                      {w.start} - {w.end}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NET WINS SPECIAL VIEW */}
      {order.serviceType === 'NET_WINS' && (
        <NetWinsOrderView
          order={order}
          isBooster={isBooster}
          isCustomer={isCustomer}
          onPayRemaining={onPayRemaining}
          onRefund={onRefund}
        />
      )}

      {/* RANK BOOST SPECIAL VIEW (NEW) */}
      {order.serviceType === 'RANK_BOOST' && <RankBoostOrderView order={order} />}

      {/* PROMOTION SPECIAL VIEW */}
      {order.serviceType === 'PROMOTION' && <PromotionOrderView order={order} />}

      {/* PLACEMENTS SPECIAL VIEW */}
      {order.serviceType === 'PLACEMENTS' && <PlacementsOrderView order={order} />}

      {/* MATCHES SPECIAL VIEW (CÀY THEO SỐ TRẬN) */}
      {(order.serviceType === 'MATCHES' || order.details?.is_matches) && (
        <MatchesOrderView order={order} isBooster={isBooster} />
      )}

      {/* MASTERY SPECIAL VIEW */}
      {order.serviceType === 'MASTERY' && <MasteryOrderView order={order} />}

      {/* LEVELING SPECIAL VIEW */}
      {order.serviceType === 'LEVELING' && <LevelingOrderView order={order} />}

      {/* ONBET SPECIAL VIEW */}
      {order.serviceType === 'ONBET' && <OnBetOrderView order={order} />}

      {/* COACHING SPECIAL VIEW */}
      {order.serviceType === 'COACHING' && (
        <CoachingOrderView
          order={order}
          isBooster={isBooster}
          vodLink={vodLink}
          setVodLink={setVodLink}
          onUpdateVodLink={onUpdateVodLink}
          isUpdatingVod={isUpdatingVod}
        />
      )}
    </>
  );
}
