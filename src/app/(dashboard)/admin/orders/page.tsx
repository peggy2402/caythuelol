'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, ExternalLink, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  'ALL', 'PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS', 
  'COMPLETED', 'SETTLED', 'DISPUTED', 'CANCELLED', 'REJECTED', 'REFUNDED'
];

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-500/10 text-green-400',
  SETTLED: 'bg-green-500/10 text-green-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  APPROVED: 'bg-purple-500/10 text-purple-400',
  PAID: 'bg-yellow-500/10 text-yellow-400',
  DISPUTED: 'bg-red-500/10 text-red-400',
  CANCELLED: 'bg-zinc-700 text-zinc-400',
  DEFAULT: 'bg-zinc-800 text-zinc-300',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '15',
          status: statusFilter,
          search: debouncedSearch,
        });
        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
          setTotalPages(data.pagination.totalPages);
        } else {
          toast.error('Lỗi tải danh sách đơn hàng');
        }
      } catch (error) {
        toast.error('Lỗi kết nối server');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, debouncedSearch, statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <ClipboardList className="text-blue-500" /> Quản lý Đơn hàng
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Tìm theo ID, Tên User, Tên Ingame..." 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Tất cả trạng thái' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Dịch vụ</th>
                <th className="px-6 py-4">Khách / Booster</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full"></div></td></tr>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <Link href={`/orders/${order._id}`} className="text-blue-400 hover:underline flex items-center gap-1 font-mono">
                        #{order._id.slice(-6)} <ExternalLink size={12} />
                      </Link>
                      <div className="text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {order.serviceType.replace('_', ' ')}
                      <div className="text-xs text-zinc-400 font-normal">
                        {order.details.current_rank || order.details.current_level} → {order.details.desired_rank || order.details.desired_level}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">C: {order.customerId?.username || 'N/A'}</div>
                      <div className="text-zinc-500 text-xs">B: {order.boosterId?.username || 'Chưa nhận'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLES[order.status] || STATUS_STYLES.DEFAULT}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">
                      {order.pricing.total_amount.toLocaleString()} đ
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Không tìm thấy đơn hàng nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400">Trang <span className="text-white font-medium">{page}</span> / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}