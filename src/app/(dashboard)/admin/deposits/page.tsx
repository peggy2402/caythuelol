'use client';

import { useState, useEffect } from 'react';
import { Loader2, Lock, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface HeldOrder {
  _id: string;
  serviceType: string;
  customerId: { username: string };
  boosterId?: { username: string };
  status: string;
  pricing: {
    deposit_amount: number;
    total_amount: number;
  };
  createdAt: string;
}

export default function AdminDepositsPage() {
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalHeld, setTotalHeld] = useState(0);

  useEffect(() => {
    const fetchHeldOrders = async () => {
      try {
        const res = await fetch('/api/admin/deposits');
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders);
          setTotalHeld(data.totalHeld);
        }
      } catch (error) {
        toast.error('Lỗi tải dữ liệu tiền cọc');
      } finally {
        setLoading(false);
      }
    };
    fetchHeldOrders();
  }, []);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Lock className="text-yellow-500" /> Quản lý Tiền cọc (Escrow)
            </h1>
            <p className="text-zinc-400 text-sm">Danh sách các đơn hàng đang giữ tiền của khách.</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
            <span className="text-xs text-yellow-500 font-bold uppercase block">Tổng tiền đang giữ</span>
            <span className="text-xl font-mono font-bold text-white">{totalHeld.toLocaleString()} đ</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Dịch vụ</th>
              <th className="px-6 py-4">Khách hàng / Booster</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Số tiền giữ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {orders.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Không có đơn hàng nào đang giữ tiền.</td></tr>
            ) : (
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
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">C: {order.customerId?.username}</div>
                    <div className="text-zinc-500 text-xs">B: {order.boosterId?.username || '---'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-yellow-500 font-bold">
                    {order.pricing.deposit_amount.toLocaleString()} đ
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
