// src/lib/toast-notification.tsx
import { toast, ExternalToast } from 'sonner';

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
 * Hiển thị Notification Toast chuẩn hệ thống (SUCCESS / WARNING / ERROR / INFO)
 * Nút hành động tương phản cao màu trắng tinh khiết, chữ đậm, nổi bật tuyệt đối
 */
export function showSystemNotification(data: SystemNotificationPayload) {
  if (!data || !data.title) return;

  const notiId = data._id || data.id || `noti-${data.title}-${data.message || ''}`;
  if (recentNotiIds.has(notiId)) return;
  recentNotiIds.add(notiId);
  setTimeout(() => recentNotiIds.delete(notiId), 5000);

  const variant = resolveToastVariant(data);

  const isBoosterJob =
    data.title.toLowerCase().includes('đơn hàng mới') ||
    data.title.toLowerCase().includes('chờ nhận') ||
    (data.link && data.link.includes('/booster/jobs'));

  const actionLabel = isBoosterJob ? 'Nhận đơn ngay ➜' : 'Xem ngay ➜';

  const actionTextColors: Record<ToastVariant, string> = {
    success: '#022c22', // deep emerald on pure white
    info: '#0369a1',    // deep sky blue on pure white
    warning: '#78350f', // deep amber on pure white
    error: '#7f1d1d',   // deep red on pure white
  };

  const toastOptions: ExternalToast = {
    id: notiId,
    description: data.message,
    duration: 8000,
  };

  if (data.link) {
    toastOptions.action = {
      label: actionLabel,
      onClick: () => {
        if (typeof window !== 'undefined' && data.link) {
          window.location.href = data.link;
        }
      },
      actionButtonStyle: {
        backgroundColor: '#ffffff',
        color: actionTextColors[variant] || '#022c22',
        fontWeight: '900',
        fontSize: '12px',
        padding: '8px 18px',
        borderRadius: '9999px',
        border: '1px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1',
      },
    };
  }

  switch (variant) {
    case 'success':
      toast.success(data.title, toastOptions);
      break;
    case 'warning':
      toast.warning(data.title, toastOptions);
      break;
    case 'error':
      toast.error(data.title, toastOptions);
      break;
    case 'info':
    default:
      toast.info(data.title, toastOptions);
      break;
  }
}
