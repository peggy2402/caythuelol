'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import { FileText, Loader2, Plus, Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

export default function OrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('orders')}</h1>
          <p className="text-zinc-400 text-sm">Quản lý và theo dõi tiến độ các đơn hàng của bạn.</p>
        </div>
        <Link
          href="/orders/create"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          {t('createOrder')}
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-white/5">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t('noOrders')}</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">{t('startRank')}</p>
          <Link
            href="/orders/create"
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            {t('createOrder')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-500/50 transition-all hover:bg-zinc-900/80"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {order.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> :
                     order.status === 'IN_PROGRESS' ? <PlayCircle className="w-6 h-6" /> :
                     <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                      {order.service_type}
                      <span className="ml-3 text-xs font-normal text-zinc-500 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        {order.details?.current_rank} &rarr; {order.details?.desired_rank}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span>{order.details?.server}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">Tổng thanh toán</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono">
                      {order.pricing?.total_amount?.toLocaleString()} đ
                    </p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    order.status === 'PENDING_PAYMENT' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}