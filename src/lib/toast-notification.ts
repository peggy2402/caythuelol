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

// Bộ nhớ đệm tạm thời để chống bắn duplicate thông báo trong 5 giây
const recentNotiIds = new Set<string>();

/**
 * Suy luận variant chuẩn xác nếu chưa được backend cung cấp
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

  // 4. Default: Info
  return 'info';
}

/**
 * Hiển thị Notification Toast chuẩn hệ thống (SUCCESS / WARNING / ERROR / INFO)
 * Kèm tính năng deduplicate chống spam và nút điều hướng nhanh nếu có link
 */
export function showSystemNotification(data: SystemNotificationPayload) {
  if (!data || !data.title) return;

  const notiId = data._id || data.id || `noti-${data.title}-${data.message || ''}`;
  if (recentNotiIds.has(notiId)) return;
  recentNotiIds.add(notiId);
  setTimeout(() => recentNotiIds.delete(notiId), 5000);

  const variant = resolveToastVariant(data);

  const toastOptions: ExternalToast = {
    id: notiId,
    description: data.message,
    duration: 6000,
  };

  if (data.link) {
    toastOptions.action = {
      label: 'Xem ngay',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = data.link!;
        }
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
