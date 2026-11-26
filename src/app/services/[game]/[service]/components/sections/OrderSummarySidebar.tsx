import React from 'react';
import Image from 'next/image';
import {
  Gamepad2,
  Medal,
  Shield,
  ShieldCheck,
  Tag,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import ServerFlag from '@/components/ServerFlag';
import { GameDefinition } from '@/lib/games';
import { AddonSelections } from '@/lib/rank-calculator';
import { getLaneMeta } from '@/lib/lanes';
import { getAovHighRankByStars } from '@/lib/aov';
import { LolServer, TIER_CONFIG } from '../../constants/bookingConfig';
import { ProviderLogo } from '../ProviderLogo';
import { StarIcon, renderWithStarIcon } from '../StarIcon';

interface OrderSummarySidebarProps {
  isPromotion: boolean;
  isMatches: boolean;
  isPlacements: boolean;
  isPointBoost: boolean;
  isAov: boolean;
  isValorant: boolean;
  isRankBoost: boolean;
  isRiotGame: boolean;
  serviceSlug: string;
  pointUnit: string;
  matchCount: number;
  placementMatches: number;
  gainedPoints: number;
  calculation: any;
  selectedPromo: any;
  queueType: string;
  unitPrice: number;
  currentServerObj: LolServer;
  previousSeasonRank: string;
  placementEffectivePricePerMatch: number;
  isSelectedAovHighStar: boolean;
  selectedPointTierObj: any;
  aovOddStartStep: any;
  aovOddCurrentStarsInDiv: number;
  aovOddStarsToAdd: number;
  aovOddTargetRank: any;
  currentPoints: number;
  desiredPoints: number;
  aovStarCalc: any;
  segmentRate: number;
  currentTierMeta: any;
  currentRankObj: any;
  desiredTierMeta: any;
  desiredRankObj: any;
  activeGainOptions: any[];
  lpGain: string;
  accountType: string;
  currentAccountTypeObj: any;
  addons: AddonSelections;
  game: GameDefinition;
  couponCode: string;
  setCouponCode: (code: string) => void;
  handleApplyCoupon: () => void;
  isApplyingCoupon: boolean;
  appliedCoupon: any;
  setAppliedCoupon: (coupon: any) => void;
  discountAmount: number;
  platformFeePercent: number;
  serviceFee: number;
  finalPrice: number;
  finalDeposit: number;
  effectiveDepositPercent: number;
  isSubmitting: boolean;
  isPointInvalid: boolean;
  checkedAccount: any;
  handlePlaceOrder: () => void;
}

export function OrderSummarySidebar({
  isPromotion,
  isMatches,
  isPlacements,
  isPointBoost,
  isAov,
  isValorant,
  isRankBoost,
  isRiotGame,
  serviceSlug,
  pointUnit,
  matchCount,
  placementMatches,
  gainedPoints,
  calculation,
  selectedPromo,
  queueType,
  unitPrice,
  currentServerObj,
  previousSeasonRank,
  placementEffectivePricePerMatch,
  isSelectedAovHighStar,
  selectedPointTierObj,
  aovOddStartStep,
  aovOddCurrentStarsInDiv,
  aovOddStarsToAdd,
  aovOddTargetRank,
  currentPoints,
  desiredPoints,
  aovStarCalc,
  segmentRate,
  currentTierMeta,
  currentRankObj,
  desiredTierMeta,
  desiredRankObj,
  activeGainOptions,
  lpGain,
  accountType,
  currentAccountTypeObj,
  addons,
  game,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  isApplyingCoupon,
  appliedCoupon,
  setAppliedCoupon,
  discountAmount,
  platformFeePercent,
  serviceFee,
  finalPrice,
  finalDeposit,
  effectiveDepositPercent,
  isSubmitting,
  isPointInvalid,
  checkedAccount,
  handlePlaceOrder,
}: OrderSummarySidebarProps) {
  const isOrderDisabled =
    isSubmitting ||
    calculation.totalPrice <= 0 ||
    isPointInvalid ||
    (isMatches && (matchCount < 1 || matchCount > 10)) ||
    (isPlacements && (placementMatches < 1 || placementMatches > 5));

  const submitButtonLabel =
    isRiotGame && (isRankBoost || isPointBoost || serviceSlug === 'net-wins') && !checkedAccount
      ? 'Cần Kiểm Tra Riot *'
      : 'Đặt Cày Ngay';

  return (
    <>
      {/* CỘT PHẢI: BẢNG GIÁ TỔNG, CHI TIẾT BƯỚC NHẢY & THANH TOÁN ESCROW (Fixed / Sticky trên Desktop xl+) */}
      <div className="xl:col-span-5 xl:sticky xl:top-24 self-start space-y-6 z-20">
        <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5 max-h-[calc(100vh-7.5rem)] overflow-y-auto scrollbar-none">
          <h3 className="text-base font-extrabold text-white flex items-center justify-between">
            <span>
              {isPromotion
                ? 'Tóm Tắt Chuỗi Thăng Hạng'
                : isMatches
                ? 'Tóm Tắt Đơn Cày Trận Thắng'
                : isPlacements
                ? 'Tóm Tắt Phân Hạng Đầu Mùa'
                : isPointBoost
                ? isAov
                  ? 'Tóm Tắt Đơn Cày Rank Cao Cấp'
                  : `Tóm Tắt Đơn Cày Điểm ${pointUnit}`
                : 'Tóm Tắt Đơn Cày Rank'}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {isPromotion
                ? 'Chuỗi Thăng Hạng'
                : isMatches
                ? `${matchCount} trận thắng`
                : isPlacements
                ? `${placementMatches} trận phân hạng`
                : isPointBoost
                ? `${gainedPoints} ${pointUnit} (+${gainedPoints})`
                : `${calculation.stepsCount} bậc thăng hạng`}
            </span>
          </h3>

          {/* Chi tiết lộ trình */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2 text-xs">
            {isPromotion ? (
              <>
                <div className="flex justify-between text-zinc-300">
                  <span>Chuỗi thăng hạng:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-amber-400">{selectedPromo.fromLabel}</span>
                    <span>➔</span>
                    <span className="text-emerald-400">{selectedPromo.toLabel}</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Loại hình:</span>
                  <span className="font-bold text-zinc-200">Chuỗi BO3/BO5 Bậc I</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Cam kết:</span>
                  <span className="font-medium text-emerald-400">Đạt {selectedPromo.toLabel} an toàn</span>
                </div>
              </>
            ) : isMatches ? (
              <>
                <div className="flex justify-between text-zinc-300">
                  <span>Dịch vụ:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Gamepad2 size={13} className="text-emerald-400" />
                    <span>Cày Theo Số Trận Thắng</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Số lượng:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {matchCount} trận thắng
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Hàng chờ:</span>
                  <span className="font-semibold text-zinc-200">
                    {queueType === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Đơn giá:</span>
                  <span className="font-mono text-zinc-300">
                    {unitPrice.toLocaleString('vi-VN')} đ / trận thắng
                  </span>
                </div>
                {!isValorant && !isAov && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Máy chủ (Server):</span>
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <ServerFlag code={currentServerObj.code} size="sm" />
                      <span>{currentServerObj.name} ({currentServerObj.code})</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Cam kết:</span>
                  <span className="text-emerald-400 font-semibold text-xs">
                    Đủ {matchCount} trận thắng (Đánh bù nếu thua)
                  </span>
                </div>
              </>
            ) : isPlacements ? (
              <>
                <div className="flex justify-between text-zinc-300">
                  <span>Dịch vụ:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Medal size={13} className="text-amber-400" />
                    <span>Phân Hạng Đầu Mùa</span>
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rank mùa trước:</span>
                  <span className="font-bold text-amber-400">
                    {TIER_CONFIG[previousSeasonRank]?.name || previousSeasonRank}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Số trận phân hạng:</span>
                  <span className="font-extrabold text-blue-400 text-sm">
                    {placementMatches} trận
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Hàng chờ:</span>
                  <span className="font-semibold text-zinc-200">
                    {queueType === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Đơn giá:</span>
                  <span className="font-mono text-zinc-300">
                    {placementEffectivePricePerMatch.toLocaleString('vi-VN')} đ / trận
                  </span>
                </div>
                {!isValorant && !isAov && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Máy chủ (Server):</span>
                    <span className="text-zinc-200 flex items-center gap-1.5">
                      <ServerFlag code={currentServerObj.code} size="sm" />
                      <span>{currentServerObj.name} ({currentServerObj.code})</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Quy cách cày:</span>
                  <span className="text-amber-400 font-semibold text-xs">
                    Đủ {placementMatches} trận phân hạng
                  </span>
                </div>
              </>
            ) : isPointBoost ? (
              <>
                {isAov && !isSelectedAovHighStar ? (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Hình thức:</span>
                      <span className="font-bold text-cyan-400">Cày Sao Lẻ ({selectedPointTierObj.label})</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Xuất phát:</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>{aovOddStartStep.label}</span>
                        <span className="text-amber-300 font-mono">({aovOddCurrentStarsInDiv}</span>
                        <StarIcon size={12} />
                        <span className="text-amber-300 font-mono">)</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Dự kiến đạt được:</span>
                      <span className="font-bold text-emerald-400">
                        {aovOddTargetRank?.targetStepLabel}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Số sao cần cày:</span>
                      <span className="font-bold font-mono text-amber-400">
                        +{aovOddStarsToAdd} Sao
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-zinc-300">
                      <span>Phân khúc:</span>
                      <span className="font-bold text-cyan-400 text-right">
                        {isAov && isSelectedAovHighStar
                          ? `${getAovHighRankByStars(currentPoints).label} → ${getAovHighRankByStars(desiredPoints).label}`
                          : selectedPointTierObj.label}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao hiện tại:' : 'Điểm hiện tại:'}</span>
                      <span className="font-bold font-mono text-zinc-300">
                        {currentPoints} {pointUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao mong muốn:' : 'Điểm mong muốn:'}</span>
                      <span className="font-bold font-mono text-emerald-400">
                        {desiredPoints} {pointUnit}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>{isAov ? 'Số sao cần cày:' : 'Số điểm cần cày:'}</span>
                      <span className="font-bold font-mono text-amber-400">
                        {gainedPoints} {pointUnit}
                      </span>
                    </div>
                  </>
                )}
                {isAov && aovStarCalc && aovStarCalc.isProgressive ? (
                  <div className="pt-1.5 mt-1 border-t border-zinc-800/80 space-y-1">
                    {aovStarCalc.breakdown.map((seg: any) => (
                      <div key={seg.tierId} className="flex justify-between text-[11px] text-zinc-400 gap-2">
                        <span className="truncate flex items-center gap-0.5">
                          {renderWithStarIcon(
                            `${seg.fromStar}★→${seg.toStar}★ (${seg.stars}★ × ${seg.ratePerStar.toLocaleString('vi-VN')}đ)`,
                            11
                          )}
                        </span>
                        <span className="font-mono text-cyan-400 font-bold shrink-0">
                          {seg.subtotal.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-between text-zinc-400">
                    <span>Đơn giá / {pointUnit}:</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {(isAov && aovStarCalc ? aovStarCalc.effectiveUnitPrice : segmentRate).toLocaleString('vi-VN')} đ / {pointUnit}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-zinc-300">
                <span>Lộ trình:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className={currentTierMeta.textColor}>{currentRankObj.label}</span>
                  <span>→</span>
                  <span className={desiredTierMeta.textColor}>{desiredRankObj.label}</span>
                </span>
              </div>
            )}

            {!isValorant && !isAov && !isMatches && !isPlacements && (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>Loại hàng đợi:</span>
                  <span className="text-zinc-200">
                    {queueType === 'SOLO_DUO' ? 'Đơn / Đôi' : 'Linh Hoạt'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Máy chủ (Server):</span>
                  <span className="text-zinc-200 flex items-center gap-1.5">
                    <ServerFlag code={currentServerObj.code} size="sm" />
                    <span>{currentServerObj.name} ({currentServerObj.code})</span>
                  </span>
                </div>
              </>
            )}
            {!isPromotion && !isAov && !isMatches && !isPlacements && (
              <div className="flex justify-between text-zinc-400">
                <span>Điểm cộng / ván:</span>
                <span className="text-zinc-200 flex items-center gap-1">
                  <span>{activeGainOptions.find((o) => o.id === lpGain)?.label}</span>
                  <span className={`text-[10px] font-bold px-1 rounded ${activeGainOptions.find((o) => o.id === lpGain)?.badgeClass}`}>
                    {activeGainOptions.find((o) => o.id === lpGain)?.discountLabel}
                  </span>
                </span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Loại tài khoản:</span>
              <span className="text-zinc-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded flex items-center justify-center shrink-0 overflow-hidden">
                  <ProviderLogo provider={accountType} className="w-4 h-4 object-contain" />
                </span>
                <span>{currentAccountTypeObj.name}</span>
              </span>
            </div>

            {addons.schedule && (
              <div className="flex justify-between items-start text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span className="shrink-0">Lịch cày:</span>
                <div className="text-right">
                  <div className="text-blue-400 font-bold">
                    {addons.scheduleDetails?.startDate
                      ? `${addons.scheduleDetails.startDate.split('-').reverse().slice(0, 2).join('/')} • ${
                          addons.scheduleDetails.timeWindow === 'CUSTOM'
                            ? `${addons.scheduleDetails.customStartTime || '20:00'} - ${addons.scheduleDetails.customEndTime || '23:00'}`
                            : (addons.scheduleDetails.timeWindow || '19:00 - 23:00')
                        }`
                      : 'Đã hẹn lịch'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {addons.scheduleDetails?.timezone || 'GMT+7 (Việt Nam)'}
                  </div>
                </div>
              </div>
            )}

            {addons.specificRole && (
              <div className="flex justify-between items-start text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span className="shrink-0">Vị trí / Đường:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {addons.selectedRoles && addons.selectedRoles.length > 0 ? (
                    addons.selectedRoles.map((roleId) => {
                      const meta = getLaneMeta(roleId, game.id);
                      return (
                        <span
                          key={roleId}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold text-xs"
                        >
                          <Image
                            src={meta.image}
                            alt={meta.name}
                            width={14}
                            height={14}
                            className="w-3.5 h-3.5 object-contain"
                          />
                          <span>{meta.name}</span>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-zinc-300 font-medium text-xs">Đường Bất Kỳ</span>
                  )}
                </div>
              </div>
            )}

            {addons.specificChamps && (
              <div className="flex justify-between items-start text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span className="shrink-0">Tướng chỉ định:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {addons.selectedChampions && addons.selectedChampions.length > 0 ? (
                    addons.selectedChampions.map((champName) => (
                      <span
                        key={champName}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-xs"
                      >
                        <span>{champName}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-400 italic text-xs">Chưa chọn tướng</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Voucher Input */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mã giảm giá (nếu có)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                disabled={isApplyingCoupon || !couponCode.trim()}
                onClick={handleApplyCoupon}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:opacity-60 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isApplyingCoupon ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  'Áp dụng'
                )}
              </button>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs text-emerald-400 mt-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-medium">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {appliedCoupon.title || `Mã ${appliedCoupon.code}`}
                    {appliedCoupon.discountPercent ? ` (-${appliedCoupon.discountPercent}%)` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-mono font-bold">
                    -{discountAmount.toLocaleString('vi-VN')} đ
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                      toast.info('Đã hủy áp dụng mã giảm giá');
                    }}
                    className="text-zinc-400 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                    title="Gỡ mã giảm giá"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TỔNG TIỀN VÀ TIỀN CỌC ESCROW */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-blue-500/20 space-y-2.5">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Tạm tính gói cày:</span>
              <span className="font-bold text-white font-mono">
                {calculation.basePrice.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {calculation.addonsCost > 0 && (
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Phụ phí tùy chọn:</span>
                <span className="font-bold text-amber-400 font-mono">
                  +{calculation.addonsCost.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            {appliedCoupon && discountAmount > 0 && (() => {
              const percent = appliedCoupon.discountPercent || (appliedCoupon.type === 'PERCENTAGE' ? appliedCoupon.value : 0);
              const fixed = appliedCoupon.discountAmount || (appliedCoupon.type === 'FIXED' ? appliedCoupon.value : 0);
              const discountTag = percent > 0 ? ` -${percent}%` : fixed > 0 ? ` -${fixed.toLocaleString('vi-VN')} đ` : '';
              return (
                <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                  <span>Mã giảm giá ({appliedCoupon.code}{discountTag}):</span>
                  <span className="font-mono font-bold">
                    -{discountAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              );
            })()}

            {/* Phí dịch vụ */}
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <span>Phí dịch vụ ({platformFeePercent}%):</span>
              <span className="font-mono text-cyan-400 font-bold">
                +{serviceFee.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
              <span className="font-bold text-zinc-300">Tổng giá dịch vụ:</span>
              <span className="text-base font-bold text-white font-mono">
                {finalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="pt-2.5 border-t border-zinc-800 space-y-2">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap">
                  {finalDeposit < finalPrice ? `Thanh toán tiền cọc (${effectiveDepositPercent}%):` : 'Số tiền thanh toán ngay:'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono whitespace-nowrap tracking-tight">
                  {finalDeposit.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-emerald-500/5 border border-emerald-500/15 px-2.5 py-1.5 rounded-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="leading-tight">
                  {finalDeposit < finalPrice
                    ? 'Tạm giữ an toàn • Số tiền còn lại chỉ trả khi hoàn thành'
                    : 'Tạm giữ Escrow an toàn • Chỉ chuyển tiền khi bạn hài lòng'}
                </span>
              </div>
            </div>
          </div>

          {/* Nút Đặt đơn (Desktop) */}
          <button
            type="button"
            disabled={isOrderDisabled}
            onClick={handlePlaceOrder}
            className="hidden xl:flex w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{submitButtonLabel}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="hidden xl:flex text-[11px] text-zinc-500 text-center items-center justify-center gap-1.5">
            <Shield size={12} className="text-emerald-400" />
            <span>Hoàn tiền 100% nếu không hoàn thành đúng tiến độ.</span>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM CHECKOUT BAR (Mobile & Tablet) */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 p-3 sm:p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] text-zinc-400">Tổng:</span>
              <span className="text-base font-extrabold text-white font-mono">
                {finalPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-400">
              {finalDeposit < finalPrice ? `Tiền cọc (${effectiveDepositPercent}%): ` : 'Thanh toán: '}
              {finalDeposit.toLocaleString('vi-VN')} đ
            </div>
          </div>

          <button
            type="button"
            disabled={isOrderDisabled}
            onClick={handlePlaceOrder}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{submitButtonLabel}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default OrderSummarySidebar;
