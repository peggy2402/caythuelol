'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Gift,
  Sparkles,
  Trophy,
  Ticket,
  History,
  Copy,
  Check,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';

interface LoyaltySummary {
  currentPoints: number;
  totalPointsEarned: number;
  targetPoints: number;
  progressPercent: number;
  remainingToTarget: number;
  hasReachedTarget: boolean;
  earnRateDescription: string;
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  validDays: number;
  isTargetReward?: boolean;
}

interface VoucherItem {
  _id: string;
  code: string;
  title: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  pointsCost: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
}

interface PointTxItem {
  _id: string;
  type: 'EARN_ORDER' | 'REDEEM_VOUCHER' | 'REVOKE_REFUND' | 'BONUS' | 'ADJUST';
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function CustomerLoyaltyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'vouchers' | 'history'>('catalog');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [loyalty, setLoyalty] = useState<LoyaltySummary>({
    currentPoints: 0,
    totalPointsEarned: 0,
    targetPoints: 2000,
    progressPercent: 0,
    remainingToTarget: 2000,
    hasReachedTarget: false,
    earnRateDescription: '1.000 VNĐ chi tiêu (đơn hoàn thành 100%) = 1 điểm tích lũy',
  });
  const [catalog, setCatalog] = useState<RewardItem[]>([]);
  const [myVouchers, setMyVouchers] = useState<VoucherItem[]>([]);
  const [pointHistory, setPointHistory] = useState<PointTxItem[]>([]);

  const fetchLoyaltyData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/loyalty/me');
      if (data.success) {
        setLoyalty(data.loyalty);
        setCatalog(data.catalog || []);
        setMyVouchers(data.myVouchers || []);
        setPointHistory(data.pointHistory || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Không thể tải dữ liệu tích điểm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userStr);
      if (parsed.role && parsed.role !== 'CUSTOMER') {
        toast.error('Tính năng tích điểm đổi voucher chỉ dành cho Khách hàng');
        router.replace('/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchLoyaltyData();
  }, [router, fetchLoyaltyData]);

  const handleRedeem = async (reward: RewardItem) => {
    if (loyalty.currentPoints < reward.pointsCost) {
      toast.error(
        `Bạn cần thêm ${(reward.pointsCost - loyalty.currentPoints).toLocaleString('vi-VN')} điểm nữa`
      );
      return;
    }

    setRedeemingId(reward.id);
    try {
      const data = await apiFetch('/api/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: reward.id }),
      });

      toast.success(data.message || 'Đổi voucher thành công!');
      confetti({
        particleCount: reward.isTargetReward ? 90 : 50,
        spread: 65,
        origin: { y: 0.65 },
      });

      await fetchLoyaltyData();
      setActiveTab('vouchers');
    } catch (error: any) {
      toast.error(error.message || 'Đổi voucher thất bại');
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error('Không thể sao chép mã');
    }
  };

  const activeVoucherCount = myVouchers.filter((v) => v.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-amber-400" />
            Tích Điểm Đổi Voucher
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Hoàn thành đơn hàng để tích lũy điểm thưởng và chinh phục mốc{' '}
            <span className="text-amber-400 font-bold">
              {loyalty.targetPoints.toLocaleString('vi-VN')} điểm
            </span>
          </p>
        </div>

        <Link
          href="/services"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shrink-0"
        >
          <Zap className="w-4 h-4" />
          Đặt đơn tích điểm ngay
        </Link>
      </div>

      {/* Hero Target Progress Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/20 p-6 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
              <Target className="w-3.5 h-3.5" />
              Mục tiêu đổi thưởng: {loyalty.targetPoints.toLocaleString('vi-VN')} điểm
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {loyalty.currentPoints.toLocaleString('vi-VN')}
              </span>
              <span className="text-sm font-semibold text-zinc-400">
                / {loyalty.targetPoints.toLocaleString('vi-VN')} điểm khả dụng
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 transition-all duration-500"
                  style={{ width: `${loyalty.progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {loyalty.hasReachedTarget ? (
                    <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Bạn đã đạt Target 2.000 điểm! Có thể đổi Siêu Voucher 20%.
                    </span>
                  ) : (
                    <>
                      Còn thiếu{' '}
                      <strong className="text-amber-300">
                        {loyalty.remainingToTarget.toLocaleString('vi-VN')} điểm
                      </strong>{' '}
                      để chạm mốc Target 2.000 điểm
                    </>
                  )}
                </span>
                <span className="font-bold text-amber-400">{loyalty.progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Stats mini cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-950/70 border border-white/5 p-4">
              <div className="text-xs text-zinc-400 mb-1">Tổng điểm đã tích</div>
              <div className="text-xl font-black text-white">
                {loyalty.totalPointsEarned.toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {loyalty.earnRateDescription}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950/70 border border-white/5 p-4">
              <div className="text-xs text-zinc-400 mb-1">Voucher khả dụng</div>
              <div className="text-xl font-black text-emerald-400">{activeVoucherCount}</div>
              <div className="text-[11px] text-zinc-500 mt-1">
                Dùng trực tiếp tại trang Checkout
              </div>
            </div>
          </div>
        </div>

        {/* Quy tắc tích điểm & thu hồi điểm minh bạch */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
          <div className="rounded-xl bg-zinc-950/60 border border-white/5 px-4 py-3">
            <span className="font-bold text-amber-300">Điều kiện cộng điểm:</span>{' '}
            Chỉ đơn hàng đã <strong className="text-white">hoàn thành 100%</strong> mới được tính là chi tiêu hợp lệ (1.000 VNĐ = 1 điểm).
          </div>
          <div className="rounded-xl bg-zinc-950/60 border border-white/5 px-4 py-3">
            <span className="font-bold text-rose-400">Cơ chế thu hồi điểm:</span>{' '}
            Nếu đơn hoàn thành bị khiếu nại (trong 24h) có đủ bằng chứng và được hoàn tiền, số điểm đã cộng từ đơn đó sẽ tự động bị trừ lại.
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Đổi Voucher ({catalog.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vouchers')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'vouchers'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Voucher của tôi ({myVouchers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          Lịch sử điểm ({pointHistory.length})
        </button>
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalog.map((reward) => {
            const canRedeem = loyalty.currentPoints >= reward.pointsCost;
            const isRedeeming = redeemingId === reward.id;

            return (
              <div
                key={reward.id}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                  reward.isTargetReward
                    ? 'bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                {reward.isTargetReward && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    TARGET 2.000 ĐIỂM
                  </span>
                )}

                <div className="space-y-2 pr-24">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Gift className="w-4 h-4" />
                    {reward.pointsCost.toLocaleString('vi-VN')} điểm
                  </div>
                  <h3 className="text-lg font-bold text-white">{reward.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{reward.description}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-3">
                  <div className="text-[11px] text-zinc-500">
                    HSD: <span className="text-zinc-300 font-medium">{reward.validDays} ngày</span>
                    {' · '}
                    Đơn từ{' '}
                    <span className="text-zinc-300 font-medium">
                      {reward.minOrderAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!canRedeem || isRedeeming}
                    onClick={() => handleRedeem(reward)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5 ${
                      canRedeem
                        ? reward.isTargetReward
                          ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Ticket className="w-3.5 h-3.5" />
                    )}
                    {canRedeem ? 'Đổi ngay' : 'Chưa đủ điểm'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: My Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="space-y-3">
          {myVouchers.length === 0 ? (
            <div className="rounded-2xl bg-zinc-900/60 border border-white/5 p-10 text-center text-zinc-400 text-sm">
              Bạn chưa đổi voucher nào. Hãy tích lũy điểm để đổi voucher ưu đãi!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myVouchers.map((v) => {
                const isActive = v.status === 'ACTIVE';
                return (
                  <div
                    key={v._id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'bg-zinc-900/80 border-emerald-500/30'
                        : 'bg-zinc-900/40 border-white/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-base">{v.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          Đơn tối thiểu: {v.minOrderAmount.toLocaleString('vi-VN')}đ
                          {v.maxDiscount
                            ? ` · Giảm tối đa ${v.maxDiscount.toLocaleString('vi-VN')}đ`
                            : ''}
                        </p>
                      </div>

                      {v.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Khả dụng
                        </span>
                      )}
                      {v.status === 'USED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-bold shrink-0">
                          Đã sử dụng
                        </span>
                      )}
                      {v.status === 'EXPIRED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-[11px] font-bold shrink-0">
                          <XCircle className="w-3 h-3" />
                          Hết hạn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        HSD: {format(new Date(v.expiresAt), 'dd/MM/yyyy', { locale: vi })}
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-white/10 text-amber-300 font-mono text-xs font-bold">
                          {v.code}
                        </code>
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => handleCopyCode(v.code)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedCode === v.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Point History */}
      {activeTab === 'history' && (
        <div className="rounded-2xl bg-zinc-900/70 border border-white/10 overflow-hidden">
          {pointHistory.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm">
              Chưa có giao dịch điểm nào.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {pointHistory.map((tx) => {
                const isEarn = tx.points > 0;
                return (
                  <div
                    key={tx._id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isEarn
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {isEarn ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {tx.description}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {format(new Date(tx.createdAt), 'HH:mm · dd/MM/yyyy', { locale: vi })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          isEarn ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isEarn ? `+${tx.points.toLocaleString('vi-VN')}` : tx.points.toLocaleString('vi-VN')}{' '}
                        điểm
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Số dư: {tx.balanceAfter.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
