// src/app/(dashboard)/booster/services/components/BoosterCouponSection.tsx
'use client';

import React from 'react';
import { Tag, RotateCw } from 'lucide-react';
import { BoosterCoupon } from './servicesTypes';

interface BoosterCouponSectionProps {
  coupon: BoosterCoupon;
  isGeneratingCoupon: boolean;
  onChangeCoupon: (updated: BoosterCoupon) => void;
  onGenerateCoupon: () => void;
  onSaveCoupon: () => void;
}

export const BoosterCouponSection: React.FC<BoosterCouponSectionProps> = ({
  coupon,
  isGeneratingCoupon,
  onChangeCoupon,
  onGenerateCoupon,
  onSaveCoupon,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4 max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Tag size={18} className="text-amber-400" />
            <span>6. Mã Giảm Giá Riêng Của Bạn</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tạo mã ưu đãi độc quyền dành riêng cho khách hàng quen khi chỉ định bạn làm tuyển thủ cày chính.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={coupon.isActive}
          onClick={() => {
            onChangeCoupon({ ...coupon, isActive: !coupon.isActive });
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
            coupon.isActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
              coupon.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Ký hiệu mã giảm giá
            </label>
            <span className="text-[10px] text-zinc-500 font-medium">Mã riêng không trùng</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="VD: PRO10, CHAOCHIEN"
              value={coupon.code}
              onChange={(e) => {
                onChangeCoupon({ ...coupon, code: e.target.value.toUpperCase() });
              }}
              onBlur={onSaveCoupon}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-28 py-2 text-xs font-mono font-bold text-white uppercase outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              type="button"
              onClick={onGenerateCoupon}
              disabled={isGeneratingCoupon}
              title="Tự động sinh mã ngẫu nhiên không trùng lặp trên toàn hệ thống"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCw size={12} className={isGeneratingCoupon ? 'animate-spin' : ''} />
              <span>Tự sinh mã</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
            Tỷ lệ giảm giá (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="5"
              max="50"
              value={coupon.discountPercent}
              onChange={(e) => {
                onChangeCoupon({ ...coupon, discountPercent: Number(e.target.value) || 10 });
              }}
              onBlur={onSaveCoupon}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none focus:border-cyan-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 text-xs font-bold">
              %
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl text-[11px] text-zinc-400">
        💡 Mã giảm giá này sẽ được tự động gợi ý và áp dụng cho khách hàng khi họ chọn bạn làm tuyển thủ cày trong bước đặt đơn.
      </div>
    </div>
  );
};
