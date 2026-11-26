// src/app/(dashboard)/booster/services/components/ServiceUpsertModal.tsx
'use client';

import React from 'react';
import {
  X,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Trophy,
  Crown,
  Target,
  Swords,
  Users,
  Medal,
  Sparkles,
  Gamepad2,
  Zap,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  GAMES_CATALOG,
  LOL_MASTERY_STEPS,
  LOL_PROMOTION_SERIES,
  LOL_PLACEMENT_TIERS,
} from '@/lib/games';
import { getRankSteps, getRankImage, getPointBoostTiers } from '@/lib/rank-calculator';
import {
  AOV_TIER_PACKAGES,
  distributeAovTierPackageToSteps,
  getAovTierPackageCurrentTotal,
  resolveAovStarRate,
} from '@/lib/aov';
import { renderWithStarIcon } from '@/app/services/[game]/[service]/components/StarIcon';
import { CustomService } from './servicesTypes';

interface ServiceUpsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalStep: 1 | 2;
  setModalStep: (step: 1 | 2) => void;
  editingServiceId: string | null;
  formData: CustomService;
  setFormData: React.Dispatch<React.SetStateAction<CustomService>>;
  activeGameCode: string;
  availableServiceTypes: any[];
  customServices: CustomService[];
  placementQuickPrice: number;
  setPlacementQuickPrice: (price: number) => void;
  onGameChangeInModal: (gameCode: string) => void;
  onSelectTemplate: (type: string) => void;
  onProceedToStep2: (e: React.FormEvent) => void;
  onFinalSubmit: (e: React.FormEvent) => void;
  isServiceDuplicate: (
    candidate: Partial<CustomService>,
    serviceList: CustomService[],
    excludeId?: string | null
  ) => boolean;
}

export const ServiceUpsertModal: React.FC<ServiceUpsertModalProps> = ({
  isOpen,
  onClose,
  modalStep,
  setModalStep,
  editingServiceId,
  formData,
  setFormData,
  activeGameCode,
  availableServiceTypes,
  customServices,
  placementQuickPrice,
  setPlacementQuickPrice,
  onGameChangeInModal,
  onSelectTemplate,
  onProceedToStep2,
  onFinalSubmit,
  isServiceDuplicate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`bg-[#0e1017] border border-white/10 rounded-3xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 ${
          modalStep === 2 &&
          ['rank-boost', 'net-wins', 'mastery', 'promotion'].includes(formData.serviceType || '')
            ? 'max-w-5xl'
            : 'max-w-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800/90 flex justify-between items-center bg-zinc-950/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black text-sm shrink-0">
              {modalStep}/2
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {editingServiceId ? 'Sửa Gói Dịch Vụ' : 'Thêm Dịch Vụ Mới'}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {modalStep === 1
                  ? 'Bước 1: Cấu hình thông tin dịch vụ cơ bản'
                  : 'Bước 2: Cấu hình bảng giá chi tiết cho từng bậc'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* BƯỚC 1: CẤU HÌNH DỊCH VỤ CƠ BẢN */}
        {modalStep === 1 && (
          <form
            onSubmit={onProceedToStep2}
            className="p-6 space-y-5 text-xs overflow-y-auto custom-dark-scrollbar"
          >
            {/* 1. Tựa Game áp dụng */}
            <div>
              <label className="text-zinc-300 font-bold uppercase block mb-1.5">
                Tựa Game Áp Dụng{' '}
                <span className="text-cyan-400 font-normal normal-case">
                  (*Mẫu dịch vụ sẽ tự động thích ứng)
                </span>
              </label>
              <select
                value={formData.gameCode || activeGameCode}
                onChange={(e) => onGameChangeInModal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-cyan-500 shadow-inner"
              >
                {GAMES_CATALOG.map((g) => (
                  <option key={g.id} value={g.id.toUpperCase()}>
                    {g.name} ({g.shortName})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Chọn loại hình dịch vụ */}
            <div>
              <label className="text-zinc-300 font-bold uppercase mb-1.5 flex items-center justify-between">
                <span>Chọn Loại Hình Dịch Vụ</span>
                {isServiceDuplicate(formData, customServices, editingServiceId) && (
                  <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
                    Đã tồn tại trong game này
                  </span>
                )}
              </label>
              <select
                value={formData.serviceType || 'rank-boost'}
                onChange={(e) => onSelectTemplate(e.target.value)}
                className={`w-full bg-zinc-950 border rounded-xl px-4 py-3 text-sm text-white font-bold outline-none shadow-inner transition-colors ${
                  isServiceDuplicate(formData, customServices, editingServiceId)
                    ? 'border-red-500/70 focus:border-red-500 text-red-200'
                    : 'border-cyan-500/40 focus:border-cyan-400'
                }`}
              >
                <optgroup
                  label={`Danh mục dịch vụ chuẩn (${
                    GAMES_CATALOG.find(
                      (g) =>
                        g.id.toUpperCase() ===
                        (formData.gameCode || activeGameCode).toUpperCase()
                    )?.shortName || (formData.gameCode || activeGameCode)
                  })`}
                >
                  {availableServiceTypes.map((tpl) => {
                    const tplKey = (tpl.serviceType || tpl.slug || '').toLowerCase().trim();
                    const isConfigured = customServices.some((s) => {
                      if (editingServiceId && s.id === editingServiceId) return false;
                      const sGame = (s.gameCode || 'LOL').toUpperCase().trim();
                      const curGame = (formData.gameCode || activeGameCode).toUpperCase().trim();
                      if (sGame !== curGame) return false;
                      const sType = (s.serviceType || s.slug || '').toLowerCase().trim();
                      return sType === tplKey;
                    });

                    return (
                      <option
                        key={tpl.serviceType || tpl.slug}
                        value={tpl.serviceType || tpl.slug}
                        disabled={isConfigured}
                        className={
                          isConfigured
                            ? 'text-zinc-500 bg-zinc-900/90 font-normal italic'
                            : 'text-white font-bold'
                        }
                      >
                        {tpl.name} {isConfigured ? '✓ (Đã cấu hình)' : ''}
                      </option>
                    );
                  })}
                </optgroup>
                <option value="custom">-- Gói Dịch Vụ Tùy Chỉnh Khác --</option>
              </select>

              {isServiceDuplicate(formData, customServices, editingServiceId) && (
                <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-200">
                      Dịch vụ này đã tồn tại trong tựa game{' '}
                      {(formData.gameCode || activeGameCode).toUpperCase()}!
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                      Mỗi tựa game chỉ được cấu hình duy nhất 1 gói của từng loại dịch vụ để tránh trùng lặp. Vui lòng chọn loại dịch vụ khác hoặc quay lại chỉnh sửa gói đã có.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Tên Dịch Vụ (*) */}
            <div>
              <label className="text-zinc-300 font-bold uppercase block mb-1.5">
                Tên Dịch Vụ <span className="text-red-500 font-black">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cày Rank Liên Quân, Cày Theo Số Sao..."
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-semibold outline-none focus:border-cyan-500"
              />
            </div>

            {/* Mô Tả */}
            <div>
              <label className="text-zinc-300 font-bold uppercase block mb-1.5">
                Mô Tả Gói Cày
              </label>
              <textarea
                rows={3}
                placeholder="Mô tả cam kết thời gian hoàn thành, chất lượng và hỗ trợ..."
                value={formData.desc || ''}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={isServiceDuplicate(formData, customServices, editingServiceId)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <span>Tiếp tục: Cấu hình giá</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* BƯỚC 2: CẤU HÌNH GIÁ CHO TỪNG BẬC CỦA DỊCH VỤ */}
        {modalStep === 2 && (
          <form
            onSubmit={onFinalSubmit}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-dark-scrollbar p-6 space-y-5 text-xs">
              {/* Banner Thông tin gói + Escrow */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-zinc-950 to-zinc-950 border border-cyan-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-extrabold text-white text-sm sm:text-base">
                    {formData.name}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    Thiết lập mức giá cụ thể cho từng bậc rank hoặc đơn giá sao của gói dịch vụ này.
                  </div>
                </div>
                {formData.serviceType === 'rank-boost' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 self-start sm:self-auto">
                    <ShieldCheck size={14} />
                    <span>Trọn gói 100% Escrow</span>
                  </div>
                )}
              </div>

              {/* TRƯỜNG HỢP 1: CÀY RANK / ELO SIÊU TỐC */}
              {formData.serviceType === 'rank-boost' && (() => {
                const modalGameCode = (formData.gameCode || activeGameCode || 'LOL').toUpperCase();
                const isAovModal = modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN';
                const currentRankSteps = getRankSteps(modalGameCode);

                return (
                  <div className="space-y-6">
                    {isAovModal && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/25 via-zinc-950/90 to-zinc-950 border border-amber-500/30 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                              <Sparkles size={15} className="text-amber-400" />
                              <span>Cấu hình nhanh theo Bậc lớn (Đồng → Cao Thủ &amp; Cao Thủ trở lên)</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Nhập giá trọn bậc, hệ thống tự động chia đều xuống từng đoàn bên dưới. Từ Cao Thủ trở lên tự do tùy chỉnh.
                            </p>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 w-fit shrink-0">
                            {AOV_TIER_PACKAGES.length} mốc bậc lớn
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {AOV_TIER_PACKAGES.map((pkg) => {
                            const currentTotal = getAovTierPackageCurrentTotal(
                              pkg,
                              formData.stepOverrides
                            );
                            const hasCustom = pkg.stepIds.some(
                              (id) =>
                                typeof formData.stepOverrides?.[id] === 'number' &&
                                (formData.stepOverrides?.[id] ?? 0) > 0
                            );
                            return (
                              <div
                                key={pkg.id}
                                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                  pkg.isHighRank
                                    ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-400/50'
                                    : 'bg-zinc-900/70 border-zinc-800 hover:border-amber-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl px-1.5 py-1 shrink-0">
                                      <img
                                        src={pkg.fromImage}
                                        alt={pkg.fromTier}
                                        className="w-6 h-6 object-contain"
                                      />
                                      <ArrowRight size={11} className="text-zinc-500" />
                                      <img
                                        src={pkg.toImage}
                                        alt={pkg.toTier}
                                        className="w-6 h-6 object-contain"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div
                                        className="text-xs font-extrabold text-white truncate"
                                        title={pkg.label}
                                      >
                                        {pkg.shortLabel}
                                      </div>
                                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                        {pkg.desc}
                                      </div>
                                    </div>
                                  </div>
                                  {pkg.isHighRank && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                                      Cao Thủ+
                                    </span>
                                  )}
                                </div>

                                <div className="relative">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder={pkg.defaultTotalPrice.toLocaleString('vi-VN')}
                                    value={hasCustom ? currentTotal : ''}
                                    onChange={(e) => {
                                      const clean = e.target.value
                                        .replace(/\D/g, '')
                                        .replace(/^0+/, '');
                                      const val = clean ? parseInt(clean, 10) : 0;
                                      setFormData((prev) => ({
                                        ...prev,
                                        stepOverrides: distributeAovTierPackageToSteps(
                                          pkg,
                                          val,
                                          prev.stepOverrides || {}
                                        ),
                                      }));
                                    }}
                                    className={`w-full bg-zinc-950 border rounded-xl pr-7 pl-3 py-2 text-sm font-mono font-extrabold text-right outline-none transition-colors ${
                                      hasCustom
                                        ? 'border-amber-400/70 text-amber-300 focus:border-amber-400'
                                        : 'border-zinc-700/80 text-amber-300 placeholder:text-amber-300/60 focus:border-amber-400'
                                    }`}
                                  />
                                  <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    đ
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs sm:text-sm text-zinc-200 font-extrabold uppercase tracking-wide flex items-center gap-2">
                          <Trophy size={15} className="text-cyan-400" />
                          <span>
                            Bảng Giá Chi Tiết {currentRankSteps.length} Bậc Rank (
                            {currentRankSteps[0]?.label} →{' '}
                            {currentRankSteps[currentRankSteps.length - 1]?.label})
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, stepOverrides: {} })}
                          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                        >
                          Dùng giá sàn mặc định
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {currentRankSteps.slice(0, -1).map((step, idx) => {
                          const nextStep = currentRankSteps[idx + 1];
                          const overrideVal = formData.stepOverrides?.[step.id];
                          const stepImg = getRankImage(modalGameCode, step);
                          const nextImg = getRankImage(modalGameCode, nextStep);

                          return (
                            <div
                              key={step.id}
                              className={`px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                                overrideVal
                                  ? 'bg-cyan-950/15 border-cyan-500/40'
                                  : 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs sm:text-[13px] font-bold text-zinc-200 min-w-0">
                                <img
                                  src={stepImg}
                                  alt={step.label}
                                  className="w-7 h-7 object-contain shrink-0 drop-shadow"
                                />
                                <span className="truncate">{step.label}</span>
                                <ArrowRight size={13} className="text-zinc-500 shrink-0" />
                                <img
                                  src={nextImg}
                                  alt={nextStep.label}
                                  className="w-7 h-7 object-contain shrink-0 drop-shadow"
                                />
                                <span className="truncate">{nextStep.label}</span>
                              </div>
                              <div className="relative w-32 shrink-0">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  placeholder={step.stepPrice.toLocaleString('vi-VN')}
                                  value={overrideVal || ''}
                                  onChange={(e) => {
                                    const clean = e.target.value
                                      .replace(/\D/g, '')
                                      .replace(/^0+/, '');
                                    const val = clean ? parseInt(clean, 10) : 0;
                                    const steps = { ...(formData.stepOverrides || {}) };
                                    if (!val || val <= 0) {
                                      delete steps[step.id];
                                    } else {
                                      steps[step.id] = val;
                                    }
                                    setFormData({ ...formData, stepOverrides: steps });
                                  }}
                                  className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-1.5 text-xs sm:text-[13px] text-white placeholder:text-zinc-500 font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                  đ
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TRƯỜNG HỢP 2: CÀY ĐIỂM (LP HOẶC RR HOẶC SAO LIÊN QUÂN + CỌC) */}
              {formData.serviceType === 'net-wins' && (() => {
                const modalGameCode = (formData.gameCode || activeGameCode || 'LOL').toUpperCase();
                const isVal = modalGameCode === 'VALORANT';
                const isAov = modalGameCode === 'AOV' || modalGameCode === 'LIENQUAN';
                const pointTiers = getPointBoostTiers(modalGameCode);
                const oddStarTiers = isAov
                  ? pointTiers.filter((t) => t.category === 'ODD_STAR' || !t.isHighEloRange)
                  : [];
                const highEloTiers = isAov
                  ? pointTiers.filter((t) => t.category === 'HIGH_ELO' || t.isHighEloRange)
                  : [];

                const renderTierItem = (tier: (typeof pointTiers)[number]) => {
                  const currentVal = isAov
                    ? (formData.tierRates?.[tier.id] ??
                      resolveAovStarRate(tier.id, formData.tierRates))
                    : (formData.tierRates?.[tier.id] ?? tier.defaultPrice);
                  return (
                    <div
                      key={tier.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-cyan-500/40 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/10 p-1.5 flex items-center justify-center shrink-0">
                          {tier.image ? (
                            <img
                              src={tier.image}
                              alt={tier.label}
                              className="w-full h-full object-contain drop-shadow"
                            />
                          ) : (
                            <Crown size={18} className="text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-white text-xs sm:text-sm block truncate">
                            {renderWithStarIcon(
                              tier.label +
                                (tier.shortLabel && tier.shortLabel !== tier.label
                                  ? ` (${tier.shortLabel})`
                                  : ''),
                              13
                            )}
                          </span>
                          <span className="text-[11px] text-zinc-400 block truncate mt-0.5">
                            {renderWithStarIcon(tier.desc, 11)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={currentVal === 0 ? '' : currentVal}
                          placeholder={tier.defaultPrice.toLocaleString('vi-VN')}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            const parsed = clean ? parseInt(clean, 10) : 0;
                            setFormData((prev) => ({
                              ...prev,
                              tierRates: {
                                ...(prev.tierRates || {}),
                                [tier.id]: parsed,
                              },
                            }));
                          }}
                          className="w-28 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-extrabold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-zinc-400 text-xs font-bold whitespace-nowrap">
                          đ/{tier.unit}
                        </span>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-5">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                          Đơn Giá Cày {isVal ? 'Điểm RR Valorant' : isAov ? 'Sao Liên Quân' : 'Điểm LP Liên Minh'} Từng Mức Rank
                        </label>
                        <span className="text-xs text-cyan-400 font-bold">
                          Đơn vị: {isVal ? 'đ / RR' : isAov ? 'đ / Sao' : 'đ / LP'}
                        </span>
                      </div>

                      {isAov ? (
                        <div className="space-y-6">
                          {/* NHÓM 1: SAO LẺ DƯỚI CAO THỦ */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                              <div className="flex items-center gap-2">
                                <Sparkles size={15} className="text-cyan-400" />
                                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wide">
                                  1. Phân Khúc Cày Sao Lẻ (Bậc Dưới Cao Thủ)
                                </span>
                              </div>
                              <span className="text-[10px] text-cyan-300 font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                Áp dụng khách cày 1 – 5 sao lẻ/đoàn
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {oddStarTiers.map(renderTierItem)}
                            </div>
                          </div>

                          {/* NHÓM 2: SAO TÍCH LŨY CAO THỦ+ */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                              <div className="flex items-center gap-2">
                                <Crown size={15} className="text-amber-400" />
                                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                                  2. Phân Khúc Cày Sao Tích Lũy (Cao Thủ Trở Lên)
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-0.5">
                                {renderWithStarIcon('Áp dụng khách cày 0★ ➔ 100★+', 11)}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {highEloTiers.map(renderTierItem)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {pointTiers.map(renderTierItem)}
                        </div>
                      )}
                    </div>

                    {/* Tỷ lệ cọc */}
                    <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-zinc-300 font-bold uppercase block text-xs">
                          Tỷ Lệ Cọc Escrow Giữ Chỗ
                        </label>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono">
                          Khuyên dùng
                        </span>
                      </div>
                      <select
                        value={formData.depositPercent ?? (isVal || isAov ? 40 : 30)}
                        onChange={(e) =>
                          setFormData({ ...formData, depositPercent: parseInt(e.target.value) })
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white font-semibold outline-none focus:border-cyan-500 text-xs sm:text-sm"
                      >
                        <option value="30">Cọc 30% giữ chỗ</option>
                        <option value="40">Cọc 40% giữ chỗ (Khuyên dùng)</option>
                        <option value="50">Cọc 50%</option>
                        <option value="100">Thanh toán trọn gói 100%</option>
                      </select>
                    </div>
                  </div>
                );
              })()}

              {/* TRƯỜNG HỢP 3: HUẤN LUYỆN COACHING */}
              {formData.serviceType === 'coaching' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                      <Target size={15} />
                      <span>Huấn Luyện Coaching 1-1</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Dạy kèm kỹ năng, phân tích replay ván đấu hoặc duo kèm cặp trực tiếp theo thời gian.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                      <select
                        value={formData.unitName || 'Giờ'}
                        onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs cursor-pointer"
                      >
                        <option value="Giờ">Giờ (Khuyên dùng)</option>
                        <option value="Ngày">Ngày</option>
                        <option value="Tuần">Tuần</option>
                        <option value="Tháng">Tháng</option>
                        <option value="Buổi học (2 giờ)">Buổi học (2 giờ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Giá (VNĐ / {formData.unitName || 'Giờ'})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="VD: 100000"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 font-bold uppercase block mb-1">
                      Tỷ Lệ Cọc Escrow
                    </label>
                    <select
                      value={formData.depositPercent ?? 100}
                      onChange={(e) =>
                        setFormData({ ...formData, depositPercent: parseInt(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                    >
                      <option value="50">Cọc 50% giữ chỗ</option>
                      <option value="100">Thanh toán trọn gói 100% (Khuyên dùng)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 4: CÀY THÔNG THẠO TƯỚNG */}
              {formData.serviceType === 'mastery' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                      <Swords size={15} />
                      <span>Cơ Chế Thông Thạo Riot Games Mới (Cấp 1 ➔ Cấp 10+)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Cày điểm thông thạo và tích lũy dấu ấn từ Cấp 1 đến Cấp 10+ (mở khóa vĩnh viễn Danh hiệu tướng).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                      <input
                        type="text"
                        value={formData.unitName || 'Cấp thông thạo'}
                        onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Giá Bình Quân / Cấp (VNĐ)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="VD: 50000"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                        Bảng Giá Chi Tiết Theo Nấc Thông Thạo (Cấp 1 ➔ Cấp 10+)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, stepOverrides: {} })}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                      >
                        Dùng giá mặc định
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {LOL_MASTERY_STEPS.map((mStep) => {
                        const overrideVal =
                          formData.stepOverrides?.[mStep.id] ?? mStep.defaultPrice;
                        return (
                          <div
                            key={mStep.id}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-cyan-500/40 transition-colors gap-3"
                          >
                            <div className="min-w-0">
                              <div className="font-extrabold text-white text-xs sm:text-sm">
                                {mStep.label}
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                {mStep.pointsReq}{' '}
                                {mStep.marksReq !== 'Không có' ? `+ ${mStep.marksReq}` : ''}
                              </div>
                            </div>
                            <div className="relative w-32 shrink-0">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={overrideVal || ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const clean = e.target.value
                                    .replace(/\D/g, '')
                                    .replace(/^0+/, '');
                                  const val = clean ? parseInt(clean, 10) : 0;
                                  const steps = { ...(formData.stepOverrides || {}) };
                                  if (val <= 0) {
                                    delete steps[mStep.id];
                                  } else {
                                    steps[mStep.id] = val;
                                  }
                                  setFormData({ ...formData, stepOverrides: steps });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 5: CÀY CẤP ĐỘ (LEVELING) */}
              {formData.serviceType === 'leveling' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
                      <Users size={15} />
                      <span>Cày Cấp Độ Tài Khoản (Từ Cấp Này ➔ Cấp Khác)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Khách hàng chọn cấp độ bắt đầu và cấp độ đích. Giá được tính tự động theo số cấp chênh lệch.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                      <input
                        type="text"
                        value={formData.unitName || 'Cấp độ'}
                        onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Giá / 1 Cấp Độ (VNĐ)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="VD: 10000"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {formData.price > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
                      <span>Ví dụ cày từ Cấp 1 lên 30 (29 cấp):</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {new Intl.NumberFormat('vi-VN').format((formData.price || 0) * 29)} đ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TRƯỜNG HỢP 6: PHÂN HẠNG ĐẦU MÙA (PLACEMENTS) */}
              {formData.serviceType === 'placements' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-purple-300 mb-1">
                      <Medal size={16} />
                      <span>Phân Hạng Đầu Mùa (Tối Đa 5 Trận · 8 Mốc Rank Mùa Trước)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Tương ứng với góc nhìn khách hàng (chọn Rank mùa trước từ <strong>Sắt đến Cao Thủ</strong> và chọn từ <strong>1 đến 5 trận</strong>). Thiết lập đơn giá / 1 trận phân hạng cho từng bậc rank dưới đây:
                    </p>
                  </div>

                  {/* Thanh công cụ áp dụng giá nhanh */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-purple-400" />
                        <span>Công Cụ Thiết Lập Giá Nhanh</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultSteps: Record<string, number> = {};
                          LOL_PLACEMENT_TIERS.forEach((t) => {
                            defaultSteps[t.id] = t.defaultPrice;
                          });
                          setFormData({
                            ...formData,
                            price: 30000,
                            unitName: 'Trận',
                            stepOverrides: defaultSteps,
                          });
                          toast.success('Đã khôi phục bảng giá mặc định theo hệ thống');
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 transition-colors cursor-pointer"
                      >
                        Dùng giá mặc định hệ thống
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="VD: 30000"
                          value={placementQuickPrice || ''}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            setPlacementQuickPrice(clean ? parseInt(clean, 10) : 0);
                          }}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white font-mono font-bold outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-zinc-500 font-mono absolute right-3 top-1/2 -translate-y-1/2">
                          đ / trận
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (placementQuickPrice <= 0) {
                            toast.error('Vui lòng nhập số tiền hợp lệ');
                            return;
                          }
                          const newSteps: Record<string, number> = {};
                          LOL_PLACEMENT_TIERS.forEach((t) => {
                            newSteps[t.id] = Math.round(placementQuickPrice * t.multiplier);
                          });
                          setFormData({
                            ...formData,
                            price: placementQuickPrice,
                            unitName: 'Trận',
                            stepOverrides: newSteps,
                          });
                          toast.success('Đã tự động tính giá theo hệ số rank cho 8 mốc');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Tự động nhân hệ số Rank</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (placementQuickPrice <= 0) {
                            toast.error('Vui lòng nhập số tiền hợp lệ');
                            return;
                          }
                          const newSteps: Record<string, number> = {};
                          LOL_PLACEMENT_TIERS.forEach((t) => {
                            newSteps[t.id] = placementQuickPrice;
                          });
                          setFormData({
                            ...formData,
                            price: placementQuickPrice,
                            unitName: 'Trận',
                            stepOverrides: newSteps,
                          });
                          toast.success(
                            `Đã áp dụng ${placementQuickPrice.toLocaleString('vi-VN')} đ cho tất cả 8 rank`
                          );
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Áp dụng giá này cho tất cả</span>
                      </button>
                    </div>
                  </div>

                  {/* Bảng giá chi tiết 8 mức Rank */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                        Bảng Giá Theo Từng Mức Rank Mùa Trước (8 Mốc)
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Đơn vị: <strong>VNĐ / 1 trận</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {LOL_PLACEMENT_TIERS.map((tier) => {
                        const overrideVal =
                          formData.stepOverrides?.[tier.id] ?? tier.defaultPrice;
                        return (
                          <div
                            key={tier.id}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-purple-500/40 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center p-1 shrink-0">
                                <img
                                  src={tier.icon}
                                  alt={tier.name}
                                  className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-white text-xs sm:text-sm">
                                  Rank {tier.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                  Gói 5 trận:{' '}
                                  <span className="text-purple-400 font-bold font-mono">
                                    {(overrideVal * 5).toLocaleString('vi-VN')} đ
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="relative w-36 shrink-0">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={overrideVal || ''}
                                placeholder="VD: 30000"
                                onChange={(e) => {
                                  const clean = e.target.value
                                    .replace(/\D/g, '')
                                    .replace(/^0+/, '');
                                  const val = clean ? parseInt(clean, 10) : 0;
                                  const steps = { ...(formData.stepOverrides || {}) };
                                  if (val <= 0) {
                                    delete steps[tier.id];
                                  } else {
                                    steps[tier.id] = val;
                                  }
                                  setFormData({
                                    ...formData,
                                    unitName: 'Trận',
                                    price: steps['IRON'] || formData.price || tier.defaultPrice,
                                    stepOverrides: steps,
                                  });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-14 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[11px] font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                đ/trận
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 7: CÀY THEO SỐ TRẬN THẮNG (MATCHES) */}
              {formData.serviceType === 'matches' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-xs text-zinc-300 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <Gamepad2 size={15} />
                      <span>Cày Theo Số Trận Thắng (1 – 10 trận thắng)</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Khách hàng chọn số lượng trận thắng mong muốn (1–10 trận). Tiến độ đơn hàng chỉ tính theo{' '}
                      <strong className="text-white">số trận Thắng đạt được</strong>.
                    </p>
                    <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                      • Trường hợp phát sinh trận thua, Booster{' '}
                      <strong>chủ động đánh bù miễn phí</strong> để hoàn thành đủ số trận thắng cam kết cho khách.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">Đơn Vị Tính</label>
                      <input
                        type="text"
                        value={formData.unitName || 'Trận thắng'}
                        onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Giá / 1 Trận Thắng (VNĐ)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="VD: 35000"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {Number(formData.price || 0) > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[3, 5, 10].map((qty) => (
                        <div
                          key={qty}
                          className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 text-center"
                        >
                          <div className="text-[10px] text-zinc-500 font-semibold uppercase">
                            Gói {qty} trận thắng
                          </div>
                          <div className="text-xs font-extrabold text-emerald-400 font-mono mt-0.5">
                            {(Number(formData.price || 0) * qty).toLocaleString('vi-VN')} đ
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TRƯỜNG HỢP: CHUỖI THĂNG HẠNG (PROMOTION) */}
              {formData.serviceType === 'promotion' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                      <Zap size={15} />
                      <span>Cấu Hình Giá Cho Từng Chuỗi Thăng Hạng (Bậc I ➔ Bậc Tiếp Theo)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Khách hàng sẽ chọn rank hiện tại để bạn cày thăng hạng lên bậc kế tiếp. Bạn có thể tùy chỉnh đơn giá cho từng chuỗi dưới đây.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-zinc-200 font-extrabold uppercase block text-xs sm:text-sm">
                        Bảng Giá Chi Tiết Theo Từng Chuỗi (7 Nấc)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            price: 40000,
                            stepOverrides: {},
                          });
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:border-cyan-400/50 transition-colors cursor-pointer"
                      >
                        Dùng giá mặc định
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {LOL_PROMOTION_SERIES.map((promoStep) => {
                        const overrideVal =
                          formData.stepOverrides?.[promoStep.id] ?? promoStep.defaultPrice;
                        return (
                          <div
                            key={promoStep.id}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800 hover:border-amber-500/40 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-xl px-2 py-1.5 shrink-0">
                                <img
                                  src={promoStep.icon}
                                  alt={promoStep.fromLabel}
                                  className="w-7 h-7 object-contain"
                                />
                                <ArrowRight size={12} className="text-zinc-500" />
                                <img
                                  src={promoStep.targetIcon}
                                  alt={promoStep.toLabel}
                                  className="w-7 h-7 object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-white text-xs sm:text-sm truncate">
                                  {promoStep.fromLabel} ➔ {promoStep.toLabel}
                                </div>
                                <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                                  Chuỗi BO3/BO5 · Cam kết thăng hạng
                                </div>
                              </div>
                            </div>
                            <div className="relative w-32 shrink-0">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={overrideVal || ''}
                                placeholder="0"
                                onChange={(e) => {
                                  const clean = e.target.value
                                    .replace(/\D/g, '')
                                    .replace(/^0+/, '');
                                  const val = clean ? parseInt(clean, 10) : 0;
                                  const steps = { ...(formData.stepOverrides || {}) };
                                  if (val <= 0) {
                                    delete steps[promoStep.id];
                                  } else {
                                    steps[promoStep.id] = val;
                                  }
                                  setFormData({
                                    ...formData,
                                    price: formData.price || promoStep.defaultPrice,
                                    stepOverrides: steps,
                                  });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700/90 rounded-xl pr-7 pl-3 py-2 text-xs sm:text-sm text-white font-mono font-bold text-right outline-none focus:border-cyan-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-xs font-bold text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                đ
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 8: GÓI TÙY CHỈNH (CUSTOM) */}
              {formData.serviceType === 'custom' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300">
                    <div className="font-bold text-white text-xs mb-1">
                      Cấu Hình Mô Hình Giá Gói Tùy Chỉnh
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Chọn rõ hình thức tính giá cho gói dịch vụ riêng của bạn để khách hàng hiểu chính xác khi đặt hàng.
                    </p>
                  </div>

                  <div>
                    <label className="text-zinc-400 font-bold uppercase block mb-1.5">
                      Hình Thức Tính Giá
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            pricingType: 'PER_UNIT',
                            unitName: 'Trận thắng',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          formData.pricingType === 'PER_UNIT' &&
                          (formData.unitName === 'Trận' || formData.unitName === 'Trận thắng')
                            ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Theo Số Trận Thắng
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, pricingType: 'PER_UNIT', unitName: 'Giờ' })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          formData.pricingType === 'PER_UNIT' && formData.unitName !== 'Trận'
                            ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Theo Thời Gian
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, pricingType: 'FIXED', unitName: 'Gói' })
                        }
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          formData.pricingType === 'FIXED'
                            ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Trọn Gói Cố Định
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Vị Tính
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Trận, Giờ, Nhiệm vụ"
                        value={formData.unitName || ''}
                        onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Đơn Giá (VNĐ)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Nhập giá VNĐ"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TRƯỜNG HỢP 9: CÁC DỊCH VỤ TRỌN GÓI CỐ ĐỊNH KHÁC */}
              {formData.serviceType !== 'rank-boost' &&
                formData.serviceType !== 'net-wins' &&
                formData.serviceType !== 'coaching' &&
                formData.serviceType !== 'mastery' &&
                formData.serviceType !== 'leveling' &&
                formData.serviceType !== 'placements' &&
                formData.serviceType !== 'matches' &&
                formData.serviceType !== 'promotion' &&
                formData.serviceType !== 'custom' &&
                formData.pricingType === 'FIXED' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Giá Trọn Gói Dịch Vụ (VNĐ)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Nhập đơn giá (VNĐ)"
                        value={formData.price || ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                          setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400">
                      <span>Hình thức thanh toán:</span>
                      <span className="text-emerald-400 font-bold">Trọn gói 100% Escrow</span>
                    </div>
                  </div>
                )}

              {/* TRƯỜNG HỢP 10: CÁC DỊCH VỤ PER_UNIT CHUNG KHÁC */}
              {formData.serviceType !== 'rank-boost' &&
                formData.serviceType !== 'net-wins' &&
                formData.serviceType !== 'coaching' &&
                formData.serviceType !== 'mastery' &&
                formData.serviceType !== 'leveling' &&
                formData.serviceType !== 'placements' &&
                formData.serviceType !== 'matches' &&
                formData.serviceType !== 'promotion' &&
                formData.serviceType !== 'custom' &&
                formData.pricingType === 'PER_UNIT' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1">
                          Đơn Vị Tính
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Trận, Giờ"
                          value={formData.unitName || ''}
                          onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-400 font-bold uppercase block mb-1">
                          Đơn Giá (VNĐ)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Nhập đơn giá (VNĐ)"
                          value={formData.price || ''}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                            setFormData({ ...formData, price: clean ? parseInt(clean, 10) : 0 });
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-cyan-500 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-zinc-400 font-bold uppercase block mb-1">
                        Tỷ Lệ Cọc Escrow
                      </label>
                      <select
                        value={formData.depositPercent ?? 100}
                        onChange={(e) =>
                          setFormData({ ...formData, depositPercent: parseInt(e.target.value) })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="30">Cọc 30% giữ chỗ</option>
                        <option value="50">Cọc 50%</option>
                        <option value="100">Thanh toán trọn gói 100%</option>
                      </select>
                    </div>
                  </div>
                )}
            </div>

            {/* Sticky Footer */}
            <div className="shrink-0 px-6 py-4 bg-zinc-950/95 border-t border-zinc-800/90 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Quay lại Bước 1</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Save size={16} />
                <span>{editingServiceId ? 'Lưu Thay Đổi' : 'Lưu & Kích Hoạt Dịch Vụ'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
