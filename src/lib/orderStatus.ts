/**
 * Utility chuẩn hóa hiển thị trạng thái đơn hàng (Order Status) sang tiếng Việt rõ ràng,
 * tránh hiển thị raw enum như DISPUTED, IN_PROGRESS, PAID gây khó hiểu cho người dùng.
 */

export interface OrderStatusConfig {
  label: string;
  style: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export function getOrderStatusInfo(status?: string, hasBooster?: boolean): OrderStatusConfig {
  const s = (status || '').toUpperCase().trim();
  switch (s) {
    case 'IN_PROGRESS':
    case 'IN_PROCESS':
      return {
        label: 'Đang cày...',
        style: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
        badgeBg: 'bg-blue-500/15',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/30',
      };
    case 'DISPUTED':
      return {
        label: 'Khiếu nại',
        style: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
        badgeBg: 'bg-rose-500/15',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/30',
      };
    case 'APPROVED':
      return {
        label: 'Đã nhận đơn',
        style: 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
        badgeBg: 'bg-purple-500/15',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/30',
      };
    case 'PAID':
      return {
        label: hasBooster ? 'Đang chờ Booster' : 'Đang chờ tuyển thủ',
        style: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
        badgeBg: 'bg-amber-500/15',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/30',
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        style: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        badgeBg: 'bg-emerald-500/15',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
      };
    case 'SETTLED':
      return {
        label: 'Đã quyết toán',
        style: 'bg-green-500/10 text-green-400 border border-green-500/20',
        badgeBg: 'bg-green-500/15',
        textColor: 'text-green-400',
        borderColor: 'border-green-500/30',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        style: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        badgeBg: 'bg-zinc-800',
        textColor: 'text-zinc-400',
        borderColor: 'border-zinc-700',
      };
    case 'REFUNDED':
      return {
        label: 'Đã hoàn tiền',
        style: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
        badgeBg: 'bg-cyan-500/15',
        textColor: 'text-cyan-400',
        borderColor: 'border-cyan-500/30',
      };
    case 'REJECTED':
      return {
        label: 'Đã từ chối',
        style: 'bg-red-500/10 text-red-400 border border-red-500/20',
        badgeBg: 'bg-red-500/15',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/30',
      };
    case 'PENDING_PAYMENT':
      return {
        label: 'Chờ thanh toán',
        style: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        badgeBg: 'bg-yellow-500/15',
        textColor: 'text-yellow-400',
        borderColor: 'border-yellow-500/30',
      };
    default:
      return {
        label: s.replace(/_/g, ' ') || 'Không xác định',
        style: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
        badgeBg: 'bg-zinc-800',
        textColor: 'text-zinc-400',
        borderColor: 'border-zinc-700',
      };
  }
}

/**
 * Format tên dịch vụ cày thuê sang tiếng Việt chuẩn và thân thiện,
 * tránh hiển thị raw enum như RANK_BOOST, NET_WINS gây khó hiểu.
 */
export function formatServiceNameVi(serviceType?: string, details?: any): string {
  if (details?.is_point_boost || details?.calc_mode === 'BY_LP' || details?.segment) {
    return 'Cày Điểm LP Cao Thủ / Thách Đấu';
  }
  if (!serviceType) return 'Dịch vụ Cày Thuê';
  const clean = serviceType.toUpperCase().replace(/[-\s]/g, '_');
  const map: Record<string, string> = {
    RANK_BOOST: 'Cày Cấp Bậc Rank',
    NET_WINS: 'Cày Trận Thắng (Net Wins)',
    PROMOTION: 'Chuỗi Thăng Hạng',
    PLACEMENTS: 'Đấu Phân Hạng Đầu Mùa',
    CHAMPION_RANK: 'Cày Rank Theo Tướng',
    MASTERY: 'Thông Thạo Tướng',
    CHAMPION_MASTERY: 'Thông Thạo Tướng',
    POINT_BOOST: 'Cày Điểm LP Cao Thủ / Thách Đấu',
    COACHING: 'Huấn Luyện Coaching 1-1',
    LEVELING: 'Cày Cấp Độ (Level)',
    ONBET: 'Cày Kèo Thắng Thua (Onbet)',
  };
  return map[clean] || serviceType.replace(/_/g, ' ');
}
