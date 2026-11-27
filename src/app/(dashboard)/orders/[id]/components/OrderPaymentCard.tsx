'use client';

import React from 'react';
import {
  DollarSign,
  CheckCircle2,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Star,
} from 'lucide-react';
import { getBoosterOrderValue, getBoosterDepositValue } from '@/lib/orderPricing';

interface OrderPaymentCardProps {
  order: any;
  isBooster: boolean;
  transactions: any[];
}

export default function OrderPaymentCard({
  order,
  isBooster,
  transactions,
}: OrderPaymentCardProps) {
  const totalAmount = Number(order.pricing?.total_amount || 0);
  const depositAmount = Number(order.pricing?.deposit_amount || 0);
  const serviceAmount = Number(
    order.pricing?.service_amount ||
      (Number(order.pricing?.base_price || 0) +
        Number(order.pricing?.option_fees || order.pricing?.addons_cost || 0)) ||
      (isBooster
        ? getBoosterOrderValue(order.pricing)
        : totalAmount > 0
        ? Math.round(totalAmount / 1.02)
        : totalAmount)
  );
  const platformFee = Number(
    order.pricing?.platform_fee ||
      order.pricing?.service_fee ||
      Math.max(0, totalAmount - serviceAmount)
  );
  const remainingAmount = Number(
    order.pricing?.remaining_amount ?? Math.max(0, totalAmount - depositAmount)
  );
  const isFullyPaid = Boolean(order.payment?.final_paid || depositAmount >= totalAmount);
  const boosterEarning = getBoosterOrderValue(order.pricing);
  const depositPercent =
    order.pricing?.deposit_percent ||
    (totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 100);

  return (
    <>
      {/* Payment Info */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Chi tiết tài chính & Ký quỹ
        </h3>
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 text-sm">
          {Boolean(
            isBooster &&
              (order.pricing?.funding_source === 'PLATFORM' ||
                (order.pricing?.platform_subsidy && Number(order.pricing.platform_subsidy) > 0))
          ) && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>Voucher do Hệ thống LeoRank tài trợ 100%</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Khách hàng sử dụng voucher tri ân{' '}
                <b className="text-white font-mono">{order.pricing?.coupon_code || ''}</b> (
                {Number(
                  order.pricing?.platform_subsidy || order.pricing?.discount_amount || 0
                ).toLocaleString()}{' '}
                đ). Khoản này được Sàn tài trợ bù đủ, thu nhập của bạn được{' '}
                <b className="text-emerald-400">bảo toàn trọn vẹn 100%</b> theo giá niêm yết!
              </p>
            </div>
          )}

          {Boolean(
            isBooster &&
              (order.pricing?.listed_price || order.pricing?.original_price) &&
              order.pricing?.discount_amount &&
              Number(order.pricing.discount_amount) > 0
          ) && (
            <>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Giá niêm yết dịch vụ:</span>
                <span className="font-mono text-zinc-300">
                  {Number(order.pricing.listed_price || order.pricing.original_price).toLocaleString()} đ
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Voucher giảm giá (Khách dùng):</span>
                <span className="font-mono">
                  -{Number(order.pricing.discount_amount).toLocaleString()} đ{' '}
                  {order.pricing.funding_source === 'PLATFORM' ? '(Sàn bù 100%)' : ''}
                </span>
              </div>
            </>
          )}

          {/* Cấu trúc chi tiết tài chính đối soát minh bạch */}
          <div className="space-y-2 text-xs">
            {/* 1. Tạm tính gói cày / Thu nhập dịch vụ */}
            <div className="flex justify-between text-zinc-400">
              <span>{isBooster ? 'Thu nhập dịch vụ dự kiến (100%):' : 'Tạm tính gói dịch vụ:'}</span>
              <span className={`font-mono font-bold ${isBooster ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {(isBooster ? boosterEarning : serviceAmount).toLocaleString()} đ
              </span>
            </div>

            {/* 2. Phí nền tảng Admin */}
            <div className="flex justify-between text-zinc-400">
              <span>Phí nền tảng Admin (2%):</span>
              <span className="font-mono text-zinc-300">
                {platformFee.toLocaleString()} đ
              </span>
            </div>

            {/* 3. Tổng giá trị đơn hàng */}
            <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800/60 text-sm">
              <span className="text-zinc-300 font-semibold">Tổng giá trị đơn hàng:</span>
              <span className="font-mono font-extrabold text-white">
                {totalAmount.toLocaleString()} đ
              </span>
            </div>

            {/* 4. Tiền cọc ký quỹ Escrow */}
            <div className="flex justify-between items-center pt-1">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                {isBooster
                  ? 'Khách đã cọc (Escrow giữ):'
                  : `Tiền cọc (${depositPercent}% - Escrow giữ):`}
              </span>
              <span className="font-mono font-bold text-amber-300">
                {depositAmount.toLocaleString()} đ
              </span>
            </div>

            {/* 5. Còn phải thanh toán / Quyết toán */}
            <div className="flex justify-between items-center pt-1 border-t border-zinc-800/40">
              <span className="text-zinc-400">
                {isFullyPaid
                  ? 'Trạng thái quyết toán:'
                  : isBooster
                  ? 'Khách còn phải trả khi hoàn thành:'
                  : 'Còn phải thanh toán:'}
              </span>
              {isFullyPaid ? (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Đã thanh toán 100%
                </span>
              ) : (
                <span className="font-mono font-bold text-rose-400">
                  {remainingAmount.toLocaleString()} đ
                </span>
              )}
            </div>

            {isBooster && (
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 space-y-1 mt-2">
                <div className="flex justify-between">
                  <span>Trạng thái ví thu nhập:</span>
                  <span className={`font-semibold ${order.payment?.booster_received_pending ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {order.payment?.booster_received_pending ? 'Đã nhận vào ví khả dụng' : 'Đang tạm giữ trong Escrow'}
                  </span>
                </div>
                {!order.payment?.booster_received_pending && (
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    * Tiền cọc được giữ an toàn trong Escrow. Sau khi bạn hoàn thành và đơn quyết toán thành công, toàn bộ thu nhập sẽ tự động cộng vào số dư ví của bạn.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
          <History className="w-4 h-4" /> Lịch sử giao dịch
        </h3>
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          {transactions.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {transactions.map((tx: any) => {
                const isPositive = tx.amount > 0;
                const amountDisplay = isPositive
                  ? `+${tx.amount.toLocaleString()} đ`
                  : `${tx.amount.toLocaleString()} đ`;

                return (
                  <div
                    key={tx._id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {tx.type === 'PAYMENT_HOLD'
                            ? order.pricing?.deposit_percent && order.pricing.deposit_percent < 100
                              ? `Thanh toán cọc (${order.pricing.deposit_percent}%)`
                              : 'Thanh toán đơn hàng (100% Escrow)'
                            : tx.type === 'PAYMENT_RELEASE'
                            ? 'Thanh toán bổ sung'
                            : tx.type === 'REFUND'
                            ? 'Hoàn tiền vào ví'
                            : tx.type === 'TIP_SENT'
                            ? 'Gửi tiền Tip cho Booster'
                            : tx.type === 'TIP_RECEIVED'
                            ? 'Nhận tiền Tip từ khách hàng'
                            : tx.description && !tx.description.startsWith('BankAPINotify')
                            ? tx.description
                            : tx.type === 'DEPOSIT'
                            ? 'Nạp tiền vào tài khoản'
                            : tx.type}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {amountDisplay}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-zinc-500 text-sm">
              Chưa có giao dịch nào được ghi nhận.
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị chi tiết Đánh giá (Nếu đã đánh giá) */}
      {order.rating && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" /> Đánh giá của bạn
          </h3>
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            {(() => {
              const stars =
                typeof order.rating.stars === 'number'
                  ? order.rating.stars
                  : typeof order.rating.rating === 'number'
                  ? order.rating.rating
                  : 5;
              const label =
                stars === 5
                  ? 'Tuyệt vời'
                  : stars === 4
                  ? 'Rất tốt'
                  : stars === 3
                  ? 'Bình thường'
                  : stars === 2
                  ? 'Tệ'
                  : 'Rất tệ';
              return (
                <div className="flex items-center gap-2 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < stars ? 'fill-current' : 'text-zinc-700'}
                    />
                  ))}
                  <span className="text-white font-bold ml-2">{label}</span>
                </div>
              );
            })()}
            {(order.rating.comment || order.review) && (
              <div className="p-3 bg-zinc-900 rounded-lg text-sm text-zinc-300 italic border border-zinc-800 break-words whitespace-pre-wrap">
                &quot;{order.rating.comment || order.review}&quot;
              </div>
            )}
            <div className="text-[10px] text-zinc-500 font-mono">
              Gửi lúc: {new Date(order.rating.createdAt || order.updatedAt).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
