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
  return (
    <>
      {/* Payment Info */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Thanh toán
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

          <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
            <span className="text-zinc-400">
              {isBooster ? 'Thu nhập thực nhận của bạn:' : 'Tổng thanh toán:'}
            </span>
            <span className={`text-base font-bold ${isBooster ? 'text-emerald-400' : 'text-white'}`}>
              {(isBooster
                ? getBoosterOrderValue(order.pricing)
                : order.pricing.total_amount
              ).toLocaleString()}{' '}
              đ
            </span>
          </div>

          {order.pricing.deposit_amount < order.pricing.total_amount ? (
            <div className="flex justify-between">
              <span className="text-zinc-500">
                {['NET_WINS', 'ONBET'].includes(order.serviceType)
                  ? `Đã cọc (${Math.round(
                      (order.pricing.deposit_amount / order.pricing.total_amount) * 100
                    )}%):`
                  : 'Đã cọc:'}
              </span>
              <span className="text-yellow-400 font-bold">
                {(isBooster
                  ? getBoosterDepositValue(order.pricing)
                  : order.pricing.deposit_amount
                ).toLocaleString()}{' '}
                đ
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="text-zinc-500">Trạng thái:</span>
              <span className="text-green-400 font-bold">Đã thanh toán 100%</span>
            </div>
          )}
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
