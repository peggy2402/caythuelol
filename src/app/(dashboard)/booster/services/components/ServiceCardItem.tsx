// src/app/(dashboard)/booster/services/components/ServiceCardItem.tsx
'use client';

import React from 'react';
import { Edit2, Trash2, ChevronDown, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { getRankSteps, getPointBoostTiers } from '@/lib/rank-calculator';
import { resolveAovStarRate } from '@/lib/aov';
import { renderWithStarIcon } from '@/app/services/[game]/[service]/components/StarIcon';
import { CustomService } from './servicesTypes';

interface ServiceCardItemProps {
  svc: CustomService;
  activeGameCode: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenEditModal: (svc: CustomService) => void;
  onDeleteService: (id: string, name: string) => void;
  onToggleService: (id: string) => void;
  onOpenRankTableModal: (serviceId: string) => void;
}

export const ServiceCardItem: React.FC<ServiceCardItemProps> = ({
  svc,
  activeGameCode,
  isExpanded,
  onToggleExpand,
  onOpenEditModal,
  onDeleteService,
  onToggleService,
  onOpenRankTableModal,
}) => {
  const svcGame = (svc.gameCode || activeGameCode || 'LOL').toUpperCase();
  const isVal = svcGame === 'VALORANT';
  const isAov = svcGame === 'AOV' || svcGame === 'LIENQUAN';

  // Phân loại hình thức tính giá chuẩn xác và loại trừ lẫn nhau
  const isRankBoost = svc.serviceType === 'rank-boost' || svc.pricingType === 'TIER_MATRIX';
  const isPointBoost =
    !isRankBoost && (svc.serviceType === 'net-wins' || svc.pricingType === 'TIER_PER_POINT');
  const isPerUnit =
    !isRankBoost &&
    !isPointBoost &&
    (svc.pricingType === 'PER_UNIT' ||
      svc.serviceType === 'placements' ||
      svc.serviceType === 'matches');
  const isFixedPrice = !isRankBoost && !isPointBoost && !isPerUnit;
  const isEnabled = svc.isActive;

  // Tên hiển thị chuẩn xác (chuẩn hóa tên phù hợp với game)
  let displayName = svc.name;
  if (
    isVal &&
    (displayName.includes('Cao Thủ') ||
      displayName.includes('Thách Đấu') ||
      displayName.includes('LP') ||
      displayName === 'Cày Điểm ...' ||
      displayName === 'Cày Điểm')
  ) {
    displayName = 'Cày Điểm RR (Immortal / Radiant)';
  } else if (
    isAov &&
    svc.serviceType === 'net-wins' &&
    (displayName.includes('Trận Thắng') ||
      displayName.includes('LP') ||
      displayName.includes('RR') ||
      displayName === 'Cày Rank Cao Cấp')
  ) {
    displayName = 'Cày Theo Số Sao (Đồng ➔ Chiến Tướng 99★+)';
  }

  // Đơn vị điểm (RR đối với Valorant, Sao đối với Liên Quân, LP đối với LOL)
  const pointUnit = isVal ? 'Điểm RR' : isAov ? 'Sao' : 'Điểm LP';
  const badgeText = isRankBoost
    ? 'Bậc Rank'
    : isPointBoost
      ? `Theo ${isAov ? 'Số Sao' : pointUnit}`
      : isPerUnit
        ? `Theo ${svc.unitName || 'Trận'}`
        : 'Trọn Gói';

  // Mô tả hiển thị phù hợp game
  let displayDesc = svc.desc || 'Dịch vụ do bạn tự cấu hình.';
  if (
    isVal &&
    (displayDesc.includes('Cao Thủ') || displayDesc.includes('LP') || displayDesc.includes('Đại Cao Thủ'))
  ) {
    displayDesc = 'Cày điểm xếp hạng Rank Rating (RR) bậc Immortal và Radiant theo điểm số.';
  } else if (
    isAov &&
    (isPointBoost || displayDesc.includes('MMR') || displayDesc.includes('LP') || displayDesc.includes('RR'))
  ) {
    displayDesc =
      'Tính tiền theo từng Sao (5k–30k+/sao) từ Đồng–Kim Cương, Tinh Anh, Cao Thủ, Đại Cao Thủ đến Chiến Tướng.';
  }

  return (
    <div
      className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
        isEnabled
          ? 'bg-zinc-950/80 border-zinc-700/80 hover:border-zinc-600 shadow-lg shadow-black/40'
          : 'bg-zinc-950/40 border-zinc-850 opacity-60'
      }`}
    >
      <div>
        {/* HÀNG 1: BADGE LOẠI HÌNH + TRẠNG THÁI (BÊN TRÁI) | HÀNG NÚT THAO TÁC + SWITCH (BÊN PHẢI) */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 shrink-0 ${
                isRankBoost
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : isPointBoost
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : isPerUnit
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{badgeText}</span>
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 bg-zinc-800/60'
              }`}
            >
              {isEnabled ? 'Đang bật' : 'Tạm tắt'}
            </span>
          </div>

          {/* Nhóm nút thao tác: Sửa, Xóa, Bật/Tắt */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenEditModal(svc)}
              title="Chỉnh sửa dịch vụ & giá"
              className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors shadow-sm cursor-pointer"
            >
              <Edit2 size={13} />
            </button>

            <button
              type="button"
              onClick={() => onDeleteService(svc.id, svc.name)}
              title="Xóa dịch vụ khỏi danh mục của bạn"
              className="p-1.5 rounded-lg bg-zinc-900/90 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-colors shadow-sm cursor-pointer"
            >
              <Trash2 size={13} />
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              onClick={() => onToggleService(svc.id)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isEnabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* HÀNG 2: TIÊU ĐỀ FULL-WIDTH KHÔNG BỊ BẺ DÒNG NÁT + MÔ TẢ DỊCH VỤ */}
        <div className="mb-3.5">
          <h3 className="font-extrabold text-white text-base sm:text-[17px] tracking-tight leading-snug mb-1.5 line-clamp-2">
            {renderWithStarIcon(displayName, 15)}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[34px]">
            {renderWithStarIcon(displayDesc, 11)}
          </p>
        </div>

        {/* BODY KHU VỰC GIỮA: THÔNG TIN CHI TIẾT TỪNG LOẠI HÌNH */}
        {/* TRƯỜNG HỢP 1: CÀY RANK THEO BẬC */}
        {isRankBoost && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Bảng giá thiết lập:</span>
              <span className="text-white font-extrabold font-mono">
                {getRankSteps(svc.gameCode).length} bậc Rank
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Hình thức cày:</span>
              <span className="text-blue-300 font-bold">Trọn gói từng đoàn</span>
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 2: CÀY ĐIỂM / SAO */}
        {isPointBoost && (() => {
          const pointTiers = getPointBoostTiers(svc.gameCode);
          const rates = pointTiers.map((t) =>
            isAov ? resolveAovStarRate(t.id, svc.tierRates) : (svc.tierRates?.[t.id] ?? t.defaultPrice)
          );
          const minRate = rates.length > 0 ? Math.min(...rates) : 5000;
          const maxRate = rates.length > 0 ? Math.max(...rates) : 45000;

          return (
            <div className="space-y-2 mb-3">
              {/* Box tổng quan khoảng giá */}
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Đơn giá cày {pointUnit}:
                  </span>
                  <button
                    type="button"
                    onClick={onToggleExpand}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Thu gọn' : `Chi tiết ${pointTiers.length} mốc`}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-black font-mono text-amber-400">
                    {minRate.toLocaleString('vi-VN')} – {maxRate.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium font-sans">
                    đ / {pointUnit}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-0.5">
                  Áp dụng lũy tiến qua {pointTiers.length} mốc Rank từ thấp đến cao
                </span>
              </div>

              {/* Danh sách các mốc rank nếu người dùng bấm mở rộng */}
              {isExpanded && (
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs max-h-48 overflow-y-auto scrollbar-thin animate-in fade-in duration-200">
                  {pointTiers.map((tier) => {
                    const rate = isAov
                      ? resolveAovStarRate(tier.id, svc.tierRates)
                      : (svc.tierRates?.[tier.id] ?? tier.defaultPrice);
                    return (
                      <div key={tier.id} className="flex justify-between items-center gap-2 py-0.5">
                        <span className="text-zinc-300 font-medium flex items-center gap-1.5 min-w-0 truncate">
                          {tier.image && (
                            <img
                              src={tier.image}
                              alt={tier.shortLabel}
                              className="w-4 h-4 object-contain shrink-0"
                            />
                          )}
                          <span className="truncate">
                            {renderWithStarIcon(
                              tier.label +
                                (tier.shortLabel && tier.shortLabel !== tier.label
                                  ? ` (${tier.shortLabel})`
                                  : ''),
                              11
                            )}
                            :
                          </span>
                        </span>
                        <span className="text-amber-400 font-mono font-bold shrink-0">
                          {rate.toLocaleString('vi-VN')} đ / {tier.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TRƯỜNG HỢP 3: THEO ĐƠN VỊ (CÀY TRẬN / COACHING / THÔNG THẠO) */}
        {isPerUnit && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Hình thức tính giá:</span>
              <span className="text-purple-300 font-bold">Theo từng {svc.unitName || 'Trận'}</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-[11px] text-zinc-400">Đơn giá niêm yết:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black font-mono text-purple-400">
                  {(svc.price || 0).toLocaleString('vi-VN')}
                </span>
                <span className="text-xs text-zinc-400 font-medium font-sans">
                  đ / {svc.unitName || 'Trận'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 4: TRỌN GÓI CỐ ĐỊNH */}
        {isFixedPrice && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Hình thức cày:</span>
              <span className="text-emerald-300 font-bold">Trọn gói hoàn thành</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-[11px] text-zinc-400">Chi phí trọn gói:</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {(svc.price || 0).toLocaleString('vi-VN')} VNĐ
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PHẦN ĐÁY FOOTER: CHỈ 1 DÒNG TỶ LỆ CỌC + NÚT BẤM CALL-TO-ACTION ĐỒNG BỘ */}
      <div className="pt-3.5 border-t border-zinc-800/80 space-y-2.5 mt-auto">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {isRankBoost || isFixedPrice ? 'Hình thức thanh toán:' : 'Tỷ lệ cọc giữ chỗ:'}
          </span>
          <span
            className={`font-bold font-mono ${
              isRankBoost || isFixedPrice
                ? 'text-emerald-400'
                : isPointBoost
                  ? 'text-cyan-400'
                  : 'text-amber-400'
            }`}
          >
            {isRankBoost || isFixedPrice
              ? 'Trọn gói 100% Escrow'
              : svc.depositPercent === 100
                ? 'Trọn gói 100%'
                : `Cọc ${svc.depositPercent || 40}%`}
          </span>
        </div>

        {/* Nút bấm hành động tương ứng từng loại hình */}
        {isRankBoost ? (
          <button
            type="button"
            onClick={() => onOpenRankTableModal(svc.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-500/60 text-blue-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
          >
            <Trophy size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Xem &amp; Sửa bảng giá {getRankSteps(svc.gameCode).length} bậc Rank</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : isPointBoost ? (
          <button
            type="button"
            onClick={() => onOpenEditModal(svc)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Xem &amp; Sửa bảng giá theo {isAov ? 'Sao' : pointUnit}</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : isPerUnit ? (
          <button
            type="button"
            onClick={() => onOpenEditModal(svc)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
          >
            <Edit2 size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Chỉnh sửa đơn giá {svc.unitName || 'Trận'}</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenEditModal(svc)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all shadow-sm group cursor-pointer"
          >
            <Edit2 size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Chỉnh sửa gói cày trọn gói</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
