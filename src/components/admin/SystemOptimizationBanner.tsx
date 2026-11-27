'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface SystemOptimizationBannerProps {
  onOptimized?: () => void;
  className?: string;
}

export default function SystemOptimizationBanner({
  onOptimized,
  className = '',
}: SystemOptimizationBannerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [lastStats, setLastStats] = useState<any>(null);

  // Tính toán Chủ Nhật 23:59:00 theo múi giờ Việt Nam (UTC+7)
  const calculateNextSundayVn = useCallback((): Date => {
    const now = new Date();
    // Chuyển sang giờ VN (UTC+7)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utcTime + 7 * 3600000);
    const dayOfWeek = vnTime.getDay(); // 0: Chủ Nhật, 1: Thứ 2, ... 6: Thứ 7

    let daysUntilSunday = (7 - dayOfWeek) % 7;
    const targetVn = new Date(vnTime);
    targetVn.setDate(vnTime.getDate() + daysUntilSunday);
    targetVn.setHours(23, 59, 0, 0);

    // Nếu đã qua 23:59:00 Chủ Nhật tuần này thì chuyển sang Chủ Nhật tuần sau
    if (targetVn.getTime() <= vnTime.getTime()) {
      targetVn.setDate(targetVn.getDate() + 7);
    }

    // Chuyển target VN Date trở lại local browser Date
    const diffToVn = targetVn.getTime() - vnTime.getTime();
    return new Date(now.getTime() + diffToVn);
  }, []);

  // Lấy trạng thái từ Backend nếu có
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cron/system/optimization-status`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && isMounted) {
          if (json.data?.nextRunAt) {
            setTargetDate(new Date(json.data.nextRunAt));
          }
          if (json.data?.lastRun) {
            setLastStats(json.data.lastRun);
          }
        }
      } catch {
        // Fallback tự tính phía client
      }
    };

    fetchStatus();
    setTargetDate(calculateNextSundayVn());

    return () => {
      isMounted = false;
    };
  }, [calculateNextSundayVn]);

  // Bộ đếm thời gian thực mỗi 1 giây
  useEffect(() => {
    const updateCountdown = () => {
      const target = targetDate || calculateNextSundayVn();
      const now = new Date().getTime();
      const distance = target.getTime() - now;

      if (distance <= 0) {
        // Reset sang chu kỳ kế tiếp
        setTargetDate(calculateNextSundayVn());
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate, calculateNextSundayVn]);

  // Kích hoạt dọn dẹp ngay thủ công
  const handleManualPurge = async () => {
    if (isPurging) return;
    setIsPurging(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/cron/system/optimize?force=true`);
      const data = await res.json();

      if (res.ok && data.success) {
        const stats = data.data;
        setLastStats(stats);
        const totalItems =
          (stats?.expiredCodesRemoved || 0) +
          (stats?.oldNotificationsRemoved || 0) +
          (stats?.oldWebhookLogsRemoved || 0) +
          (stats?.oldAuditLogsRemoved || 0);

        toast.success(
          `Tối ưu hóa hoàn tất trong ${stats?.durationMs || 0}ms: Đã dọn ${totalItems} bản ghi rác, giải phóng ~${stats?.estimatedMemoryFreedKb || 0}KB bộ nhớ!`,
          {
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
            duration: 5000,
          }
        );

        if (onOptimized) onOptimized();
      } else {
        toast.error(data.message || 'Không thể thực thi dọn dẹp hệ thống');
      }
    } catch (err: any) {
      toast.error('Lỗi kết nối khi dọn dẹp hệ thống');
    } finally {
      setIsPurging(false);
    }
  };

  const format2Digits = (num: number) => num.toString().padStart(2, '0');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0c1017]/90 border border-zinc-800/80 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-zinc-700/80 ${className}`}
    >
      {/* Hiệu ứng ánh sáng nền tinh tế */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-rose-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Phần bên trái: Icon + Tiêu đề + Mô tả */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-inner">
            {/* Vòng quay cánh hoa/loading đỏ hồng tinh tế giống thiết kế */}
            <svg
              className="h-5 w-5 animate-spin text-rose-400"
              style={{ animationDuration: '3s' }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="3" r="1.5" fill="currentColor" opacity="0.9" />
              <circle cx="18.36" cy="5.64" r="1.5" fill="currentColor" opacity="0.75" />
              <circle cx="21" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
              <circle cx="18.36" cy="18.36" r="1.5" fill="currentColor" opacity="0.45" />
              <circle cx="12" cy="21" r="1.5" fill="currentColor" opacity="0.3" />
              <circle cx="5.64" cy="18.36" r="1.5" fill="currentColor" opacity="0.2" />
              <circle cx="3" cy="12" r="1.5" fill="currentColor" opacity="0.15" />
              <circle cx="5.64" cy="5.64" r="1.5" fill="currentColor" opacity="0.1" />
            </svg>
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Chu kỳ tối ưu hóa hệ thống & dọn dẹp Cache
              </h3>
              {lastStats?.durationMs ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đã dọn gần nhất ({lastStats.durationMs}ms)
                </span>
              ) : null}
            </div>
            <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed">
              Hệ thống tự động giải phóng bộ nhớ đệm và nhật ký phiên tạm thời vào{' '}
              <strong className="font-semibold text-white">23:59 Chủ Nhật</strong> hàng tuần (Giờ Việt Nam).
            </p>
          </div>
        </div>

        {/* Phần bên phải: Đồng hồ đếm ngược + Nút dọn dẹp thủ công */}
        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* NGÀY */}
            <div className="flex min-w-[50px] sm:min-w-[56px] flex-col items-center justify-center rounded-xl border border-zinc-800/90 bg-[#12161f]/90 px-2.5 py-1.5 shadow-sm">
              <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
                {format2Digits(timeLeft.days)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                NGÀY
              </span>
            </div>

            {/* GIỜ */}
            <div className="flex min-w-[50px] sm:min-w-[56px] flex-col items-center justify-center rounded-xl border border-zinc-800/90 bg-[#12161f]/90 px-2.5 py-1.5 shadow-sm">
              <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
                {format2Digits(timeLeft.hours)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                GIỜ
              </span>
            </div>

            {/* PHÚT */}
            <div className="flex min-w-[50px] sm:min-w-[56px] flex-col items-center justify-center rounded-xl border border-zinc-800/90 bg-[#12161f]/90 px-2.5 py-1.5 shadow-sm">
              <span className="font-mono text-lg sm:text-xl font-bold text-white tracking-wider">
                {format2Digits(timeLeft.minutes)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                PHÚT
              </span>
            </div>

            {/* GIÂY */}
            <div className="flex min-w-[50px] sm:min-w-[56px] flex-col items-center justify-center rounded-xl border border-zinc-800/90 bg-[#12161f]/90 px-2.5 py-1.5 shadow-sm">
              <span className="font-mono text-lg sm:text-xl font-bold text-rose-400 tracking-wider">
                {format2Digits(timeLeft.seconds)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                GIÂY
              </span>
            </div>
          </div>

          {/* Nút hành động dọn dẹp thủ công */}
          <button
            onClick={handleManualPurge}
            disabled={isPurging}
            title="Thực hiện giải phóng cache và dọn dẹp nhật ký ngay lập tức"
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 px-3 py-2 text-xs font-semibold text-rose-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isPurging ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span className="hidden sm:inline">{isPurging ? 'Đang dọn...' : 'Dọn dẹp ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
