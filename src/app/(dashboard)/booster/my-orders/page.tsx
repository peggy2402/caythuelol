'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import { FileText, Loader2, Clock, CheckCircle2, AlertCircle, PlayCircle, XCircle, Search, Briefcase, RefreshCw, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';

export default function BoosterOrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  
  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/boosters/my-orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === 0 || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) setPullY(diff * 0.4); // Resistance factor
  };

  const handleTouchEnd = async () => {
    if (pullY > 60) {
      setIsRefreshing(true);
      setPullY(60); // Hold position
      await fetchOrders(false);
      setIsRefreshing(false);
    }
    setPullY(0);
    startY.current = 0;
  };

  // Logic lọc đơn hàng
  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const status = order.status || '';
    
    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'APPROVED' ? status === 'APPROVED' :
      statusFilter === 'IN_PROGRESS' ? status === 'IN_PROGRESS' :
      statusFilter === 'COMPLETED' ? ['COMPLETED', 'SETTLED'].includes(status) :
      statusFilter === 'CANCELLED' ? ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(status) :
      true;

    const matchesSearch = search === '' ? true :
      (order._id || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.serviceType || order.service_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.customerId?.username || order.customer_id?.username || '').toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const filterOptions = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'APPROVED', label: 'Đơn đã nhận' },
    { id: 'IN_PROGRESS', label: 'Đơn đang làm' },
    { id: 'COMPLETED', label: 'Đơn hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'PAID': return 'Chờ nhận (Direct)';
        case 'APPROVED': return 'Đã nhận (Chờ cày)';
        case 'IN_PROGRESS': return 'Đang làm';
        case 'COMPLETED': return 'Hoàn thành';
        case 'SETTLED': return 'Đã quyết toán';
        case 'CANCELLED': return 'Đã hủy';
        case 'REJECTED': return 'Đã từ chối';
        case 'REFUNDED': return 'Đã hoàn tiền';
        case 'DISPUTED': return 'Khiếu nại';
        default: return status;
    }
  };

  const handleAcceptOrder = async (e: React.MouseEvent, orderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
        const res = await fetch(`/api/orders/${orderId}/confirm`, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok) {
            toast.success('Đã nhận đơn hàng thành công! Hãy bắt đầu cày nhé.');
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'APPROVED' } : o));
        } else {
            toast.error(data.error || 'Lỗi khi nhận đơn');
        }
    } catch (error) {
        toast.error('Lỗi kết nối mạng');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div 
      className="space-y-6 animate-fade-in max-w-6xl mx-auto min-h-[80vh]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{t('myActiveJobs')} & {t('history')}</h1>
          <p className="text-zinc-400 text-xs md:text-sm">Quản lý các đơn hàng bạn đã nhận và lịch sử làm việc.</p>
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      <div 
        className="flex justify-center overflow-hidden transition-all duration-300 ease-out"
        style={{ height: pullY > 0 ? pullY : (isRefreshing ? 60 : 0), opacity: pullY > 0 || isRefreshing ? 1 : 0 }}
      >
        <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
          {isRefreshing ? <Loader2 className="animate-spin w-5 h-5 text-blue-500" /> : <RefreshCw className={`w-5 h-5 ${pullY > 60 ? 'text-blue-500 rotate-180 transition-transform' : ''}`} />}
          {isRefreshing ? 'Đang cập nhật...' : 'Kéo để làm mới'}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setStatusFilter(option.id)}
                className={`relative px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Tìm kiếm đơn hàng..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white text-xs md:text-sm rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 w-full md:w-64"
            />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-xl border border-white/5">
          <FileText className="w-12 h-12 md:w-16 md:h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-bold text-white mb-2">{t('noOrders')}</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            {statusFilter === 'ALL' ? 'Bạn chưa nhận đơn hàng nào.' : `Không có đơn hàng nào trong mục "${filterOptions.find(o => o.id === statusFilter)?.label}".`}
          </p>
          <Link
            href="/booster/jobs"
            className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
          >
            {t('jobMarket')} &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {filteredOrders.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}`}
              className="group block bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 hover:border-blue-500/50 transition-all hover:bg-zinc-900/80 active:scale-[0.99] relative overflow-hidden"
            >
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Top Section: Icon & Main Info */}
                <div className="flex items-start gap-3 md:gap-4 md:items-center">
                  <div className={`p-2.5 md:p-3 rounded-lg shrink-0 h-fit ${
                    ['COMPLETED', 'SETTLED'].includes(order.status) ? 'bg-green-500/10 text-green-500' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                    order.status === 'PAID' ? 'bg-yellow-500/10 text-yellow-500' :
                    order.status === 'APPROVED' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    {['COMPLETED', 'SETTLED'].includes(order.status) ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> :
                     order.status === 'IN_PROGRESS' ? <PlayCircle className="w-5 h-5 md:w-6 md:h-6" /> :
                     order.status === 'APPROVED' ? <Briefcase className="w-5 h-5 md:w-6 md:h-6" /> :
                     ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) ? <XCircle className="w-5 h-5 md:w-6 md:h-6" /> :
                     <Clock className="w-5 h-5 md:w-6 md:h-6" />} 
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-base md:text-lg group-hover:text-blue-400 transition-colors truncate">
                      {order.serviceType || order.service_type}
                      <span className="ml-2 md:ml-3 text-[10px] md:text-xs font-normal text-zinc-500 font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                    </h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs md:text-sm text-zinc-400 mt-1">
                      <span className="flex items-center gap-1 truncate">
                        Khách: <span className="text-white font-medium">{order.customerId?.username || order.customer_id?.username || 'Unknown'}</span>
                      </span>
                      <span className="hidden xs:inline w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span className="flex items-center gap-1 truncate max-w-full">
                        {order.details?.current_rank || order.details?.current_level} <span className="text-zinc-600">&rarr;</span> {order.details?.desired_rank || order.details?.desired_level}
                      </span>
                      <span className="hidden sm:inline w-1 h-1 rounded-full bg-zinc-700 self-center"></span>
                      <span className="text-[10px] md:text-xs opacity-70">{new Date(order.createdAt || order.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Footer Section - Responsive Layout */}
                <div className="pt-3 border-t border-white/5 mt-1 md:border-t-0 md:pt-0 md:mt-0 md:ml-auto">
                  
                  {/* MOBILE LAYOUT (Vertical Stack) */}
                  <div className="flex flex-col gap-3 md:hidden">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-500">Thu nhập</span>
                        <span className="text-base font-bold text-emerald-400 font-mono">
                            {order.pricing?.booster_earnings?.toLocaleString()} đ
                        </span>
                    </div>
                    
                    {order.status === 'PAID' && (
                        <button 
                            onClick={(e) => handleAcceptOrder(e, order._id)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex justify-center items-center gap-2"
                        >
                            Nhận đơn ngay <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

                    <div className={`w-full text-center py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        ['COMPLETED', 'SETTLED'].includes(order.status) ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        order.status === 'PAID' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        order.status === 'APPROVED' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                        ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                        {getStatusLabel(order.status)}
                    </div>
                  </div>

                  {/* DESKTOP LAYOUT (Horizontal Row) */}
                  <div className="hidden md:flex items-center justify-end gap-6">
                    {order.status === 'PAID' && (
                        <button 
                            onClick={(e) => handleAcceptOrder(e, order._id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 animate-pulse hover:animate-none hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                            Nhận đơn ngay
                        </button>
                    )}
                    <div className="text-right">
                        <p className="text-xs text-zinc-500 mb-0.5">Thu nhập</p>
                        <p className="text-lg font-bold text-emerald-400 font-mono leading-none">
                        {order.pricing?.booster_earnings?.toLocaleString()} đ
                        </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                        ['COMPLETED', 'SETTLED'].includes(order.status) ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        order.status === 'PAID' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                        order.status === 'APPROVED' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                        ['REJECTED', 'REFUNDED', 'DISPUTED', 'CANCELLED'].includes(order.status) ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                        {getStatusLabel(order.status)}
                    </div>
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