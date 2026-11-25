// src/lib/toast-notification.tsx
import React from 'react';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle2,
  Swords,
  Trophy,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface SystemNotificationPayload {
  _id?: string;
  id?: string;
  title: string;
  message?: string;
  type?: string;
  variant?: ToastVariant;
  link?: string;
}

// Bộ nhớ đệm chống bắn lặp lại cùng một thông báo trong vòng 5 giây
const recentNotiIds = new Set<string>();

/**
 * Trích xuất các trường thông tin quan trọng từ text thông báo
 */
export function parseNotificationDetails(title: string, message: string = '') {
  const code = message.match(/#(?:BK-[A-Z0-9]+|[A-Z0-9]{6,})/i)?.[0]?.replace('#', '');
  const user = message.match(/@([a-zA-Z0-9_.-]+)/)?.[1];

  let gameRoute: string | undefined;
  const parts = message.split(/#(?:BK-[A-Z0-9]+|[A-Z0-9]{6,})\s*-\s*/i);
  if (parts[1]) {
    gameRoute = parts[1].split(/\.|\s+đã\s+/i)[0]?.trim();
  }

  const isBoosterJob =
    title.toLowerCase().includes('đơn hàng mới') ||
    title.toLowerCase().includes('chờ nhận') ||
    message.toLowerCase().includes('vào sàn việc làm');

  return { code, user, gameRoute, isBoosterJob };
}

/**
 * Phân tích và suy luận variant phù hợp nhất
 */
export function resolveToastVariant(data: {
  variant?: string;
  type?: string;
  title?: string;
  message?: string;
}): ToastVariant {
  if (data.variant && ['success', 'warning', 'error', 'info'].includes(data.variant)) {
    return data.variant as ToastVariant;
  }

  const text = `${data.title || ''} ${data.message || ''}`.toLowerCase();

  // 1. Success cases
  if (
    text.includes('thành công') ||
    text.includes('hoàn thành') ||
    text.includes('đã nhận đơn') ||
    text.includes('được nhận') ||
    text.includes('xác nhận nhận đơn')
  ) {
    return 'success';
  }

  // 2. Error cases
  if (
    text.includes('thất bại') ||
    text.includes('bị hủy') ||
    text.includes('từ chối') ||
    text.includes('không thành công') ||
    text.includes('lỗi') ||
    data.type === 'REFUND' ||
    data.type === 'ORDER_EXPIRED'
  ) {
    return 'error';
  }

  // 3. Warning cases
  if (
    text.includes('cảnh báo') ||
    text.includes('khiếu nại') ||
    text.includes('lưu ý') ||
    text.includes('chú ý') ||
    text.includes('hết hạn') ||
    data.type === 'RATE_REMINDER'
  ) {
    return 'warning';
  }

  return 'info';
}

/**
 * Thẻ thông báo chuẩn Gaming Glassmorphism siêu sang trọng
 */
function NotificationToastCard({
  id,
  data,
}: {
  id: string | number;
  data: SystemNotificationPayload;
}) {
  const title = data.title || 'Thông báo hệ thống';
  const message = data.message || '';
  const variant = resolveToastVariant(data);
  const { code, user, gameRoute, isBoosterJob } = parseNotificationDetails(title, message);

  // Xác định chủ đề thiết kế
  const isAccepted = title.toLowerCase().includes('đã được nhận') || title.toLowerCase().includes('xác nhận nhận đơn');
  const isCompleted = title.toLowerCase().includes('hoàn thành');
  const isNewJob = isBoosterJob || title.toLowerCase().includes('đơn hàng mới');

  let accentGradient = 'from-blue-500 via-indigo-500 to-cyan-400';
  let glowColor = 'bg-blue-500';
  let iconBg = 'bg-blue-500/15 border-blue-500/30 text-blue-400 ring-4 ring-blue-500/10';
  let badgeStyle = 'bg-blue-500/15 border-blue-500/30 text-blue-300';
  let badgeLabel = 'ĐƠN MỚI';
  let actionLabel = 'Nhận đơn ngay';
  let actionGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40';
  let IconComponent = Briefcase;

  if (isNewJob) {
    IconComponent = Briefcase;
    badgeLabel = 'VIỆC LÀM MỚI';
    actionLabel = 'Nhận đơn ngay';
    accentGradient = 'from-blue-500 via-indigo-500 to-cyan-400';
    glowColor = 'bg-blue-500';
    iconBg = 'bg-blue-500/15 border-blue-500/30 text-blue-400 ring-4 ring-blue-500/10';
    badgeStyle = 'bg-blue-500/20 border-blue-500/35 text-blue-300';
    actionGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40';
  } else if (isCompleted) {
    IconComponent = Trophy;
    badgeLabel = 'HOÀN THÀNH';
    actionLabel = 'Đánh giá ngay';
    accentGradient = 'from-amber-400 via-yellow-500 to-orange-500';
    glowColor = 'bg-amber-500';
    iconBg = 'bg-amber-500/15 border-amber-500/30 text-amber-400 ring-4 ring-amber-500/10';
    badgeStyle = 'bg-amber-500/20 border-amber-500/35 text-amber-300';
    actionGradient = 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/40';
  } else if (isAccepted) {
    IconComponent = Swords;
    badgeLabel = 'ĐÃ NHẬN ĐƠN';
    actionLabel = 'Theo dõi ngay';
    accentGradient = 'from-cyan-400 via-blue-500 to-indigo-500';
    glowColor = 'bg-cyan-500';
    iconBg = 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 ring-4 ring-cyan-500/10';
    badgeStyle = 'bg-cyan-500/20 border-cyan-500/35 text-cyan-300';
    actionGradient = 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/40';
  } else if (variant === 'success') {
    IconComponent = CheckCircle2;
    badgeLabel = 'THÀNH CÔNG';
    actionLabel = 'Xem chi tiết';
    accentGradient = 'from-emerald-400 via-teal-500 to-cyan-500';
    glowColor = 'bg-emerald-500';
    iconBg = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 ring-4 ring-emerald-500/10';
    badgeStyle = 'bg-emerald-500/20 border-emerald-500/35 text-emerald-300';
    actionGradient = 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40';
  } else if (variant === 'warning') {
    IconComponent = AlertTriangle;
    badgeLabel = 'CẢNH BÁO';
    actionLabel = 'Xem ngay';
    accentGradient = 'from-amber-500 to-orange-500';
    glowColor = 'bg-amber-500';
    iconBg = 'bg-amber-500/15 border-amber-500/30 text-amber-400 ring-4 ring-amber-500/10';
    badgeStyle = 'bg-amber-500/20 border-amber-500/35 text-amber-300';
    actionGradient = 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25';
  } else if (variant === 'error') {
    IconComponent = AlertCircle;
    badgeLabel = 'HỦY / LỖI';
    actionLabel = 'Xem chi tiết';
    accentGradient = 'from-red-500 to-rose-600';
    glowColor = 'bg-red-500';
    iconBg = 'bg-red-500/15 border-red-500/30 text-red-400 ring-4 ring-red-500/10';
    badgeStyle = 'bg-red-500/20 border-red-500/35 text-red-300';
    actionGradient = 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25';
  } else {
    IconComponent = Info;
    badgeLabel = 'THÔNG BÁO';
    actionLabel = 'Xem ngay';
    accentGradient = 'from-blue-500 to-cyan-500';
    glowColor = 'bg-blue-500';
    iconBg = 'bg-blue-500/15 border-blue-500/30 text-blue-400 ring-4 ring-blue-500/10';
    badgeStyle = 'bg-blue-500/20 border-blue-500/35 text-blue-300';
    actionGradient = 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25';
  }

  // Tùy chỉnh link điều hướng mặc định nếu là đơn mới
  const targetLink = data.link || (isNewJob ? '/booster/jobs' : undefined);

  return (
    <div className="w-[360px] sm:w-[420px] max-w-[calc(100vw-32px)] rounded-2xl bg-[#0c101a]/95 border border-zinc-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl p-4 text-white font-sans relative overflow-hidden group pointer-events-auto transition-all">
      {/* Vạch kẻ phát sáng đỉnh thẻ */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient}`} />

      {/* Hiệu ứng đèn hắt sáng xung quanh */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-25 ${glowColor}`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none opacity-20 ${glowColor}`}
      />

      {/* Header: Icon + Tiêu đề + Huy hiệu + Nút đóng */}
      <div className="flex items-start gap-3 relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-lg transition-all ${iconBg}`}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-black text-white tracking-tight truncate max-w-[210px]">
              {title}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider ${badgeStyle}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {badgeLabel}
            </span>
          </div>

          {/* Khối tóm tắt thông tin cấu trúc */}
          {code || user || gameRoute ? (
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 my-2 space-y-1.5 text-xs shadow-inner">
              <div className="flex items-center justify-between text-zinc-300 gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-zinc-500 font-medium shrink-0">
                    {isBoosterJob ? 'Khách:' : 'Đối tác:'}
                  </span>
                  <span className="font-semibold text-white truncate">
                    {user ? `@${user}` : 'Khách hàng'}
                  </span>
                </div>
                {code && (
                  <span className="font-mono font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md text-[11px] shrink-0">
                    #{code}
                  </span>
                )}
              </div>

              {gameRoute && (
                <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-zinc-800/70 text-[11px] gap-2">
                  <span className="text-zinc-400 font-medium truncate">
                    {gameRoute.split('(')[0]?.trim() || gameRoute}
                  </span>
                  {gameRoute.includes('(') && (
                    <span className="font-bold text-cyan-300 shrink-0 text-right">
                      {gameRoute.slice(gameRoute.indexOf('(') + 1, gameRoute.lastIndexOf(')'))}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-300 leading-relaxed my-2 line-clamp-3">
              {message}
            </p>
          )}

          {/* Footer nút hành động */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-zinc-400 truncate max-w-[170px]">
              {isNewJob
                ? 'Vào Sàn Việc Làm để nhận'
                : 'Nhấn để xem tiến độ đơn'}
            </span>

            {targetLink ? (
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(id);
                  if (typeof window !== 'undefined') {
                    window.location.href = targetLink;
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${actionGradient}`}
              >
                <span>{actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toast.dismiss(id)}
                className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            )}
          </div>
        </div>

        {/* Nút đóng X ở góc trên bên phải */}
        <button
          type="button"
          onClick={() => toast.dismiss(id)}
          className="absolute top-0 right-0 p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hiển thị Notification Toast chuẩn hệ thống (SUCCESS / WARNING / ERROR / INFO / NEW_JOB)
 * Kèm tính năng deduplicate chống spam và thiết kế Glassmorphism hiện đại
 */
export function showSystemNotification(data: SystemNotificationPayload) {
  if (!data || !data.title) return;

  const notiId = data._id || data.id || `noti-${data.title}-${data.message || ''}`;
  if (recentNotiIds.has(notiId)) return;
  recentNotiIds.add(notiId);
  setTimeout(() => recentNotiIds.delete(notiId), 5000);

  // Hiển thị Custom Toast đỉnh cao
  toast.custom((id) => <NotificationToastCard id={id} data={data} />, {
    id: notiId,
    duration: 8000,
  });
}
