'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import { FileText, Loader2, Clock, CheckCircle2, AlertCircle, PlayCircle, XCircle, Search } from 'lucide-react';

export default function BoosterOrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Logic lọc đơn hàng
  const filteredOrders = orders.filter(order => {
    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'ACTIVE' ? ['APPROVED', 'IN_PROGRESS'].includes(order.status) :
      statusFilter === 'COMPLETED' ? order.status === 'COMPLETED' :
      statusFilter === 'CANCELLED' ? ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) :
      true;

    const matchesSearch = search === '' ? true :
      order._id.toLowerCase().includes(search.toLowerCase()) ||
      order.service_type.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_id?.username?.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const filterOptions = [
    { id: 'ALL', label: t('catAll') },
    { id: 'ACTIVE', label: t('myActiveJobs') },
    { id: 'COMPLETED', label: t('completedOrders') },
    { id: 'CANCELLED', label: t('statusCancelled') },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('myActiveJobs')} & {t('history')}</h1>
          <p className="text-zinc-400 text-sm">Quản lý các đơn hàng bạn đã nhận và lịch sử làm việc.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStatusFilter(option.id)}
                className={`relative px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                statusFilter === option.id
                    ? 'bg-blue-600 text-white shadow-lg before:absolute before:inset-0 before:rounded-full before:bg-blue-500/30 before:blur-xl before:-z-10'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Tìm kiếm đơn hàng..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 w-full md:w-64"
            />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-white/5">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t('noOrders')}</h3>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">Bạn chưa nhận đơn hàng nào.</p>
          <Link
            href="/booster/jobs"
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            {t('jobMarket')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
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
                     ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) ? <XCircle className="w-6 h-6" /> :
                     <Clock className="w-6 h-6" />} 
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">
                      {order.service_type}
                      <span className="ml-3 text-xs font-normal text-zinc-500 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        Khách: <span className="text-white font-medium">{order.customer_id?.username || 'Unknown'}</span>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span className="flex items-center gap-1">
                        {order.details?.current_rank} &rarr; {order.details?.desired_rank}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">Thu nhập</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono">
                      {order.pricing?.booster_earnings?.toLocaleString()} đ
                    </p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    order.status === 'APPROVED' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
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