'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Briefcase, CheckCircle2, Clock, Loader2, MapPin, Shield, Swords } from 'lucide-react';

interface Order {
  _id: string;
  service_type: string;
  details: {
    current_rank: string;
    desired_rank: string;
    server: string;
  };
  pricing: {
    booster_earnings: number;
  };
  created_at: string;
  status: string;
}

export default function BoosterJobsPage() {
  const { t } = useLanguage();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/boosters/jobs');
      const data = await res.json();
      if (res.ok) {
        setAvailableOrders(data.availableOrders || []);
        setMyOrders(data.myOrders || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAcceptJob = async (orderId: string) => {
    if (!confirm(t('acceptJobConfirm'))) return;

    setProcessingId(orderId);
    try {
      const res = await fetch('/api/boosters/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(t('orderSuccess')); // Reuse success message or add new
      fetchJobs(); // Reload lists
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('jobMarket')}</h1>
        <p className="text-zinc-400">Danh sách các đơn hàng đang chờ Booster.</p>
      </div>

      {/* My Active Jobs */}
      {myOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5" /> {t('myActiveJobs')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOrders.map(order => (
              <div key={order._id} className="bg-green-900/10 border border-green-500/30 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded uppercase">{order.service_type}</span>
                  <span className="text-zinc-400 text-xs">#{order._id.slice(-6)}</span>
                </div>
                <div className="mb-4">
                  <div className="text-white font-bold text-lg">{order.details.current_rank} ➔ {order.details.desired_rank}</div>
                  <div className="text-zinc-400 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> Server: {order.details.server}</div>
                </div>
                <div className="pt-3 border-t border-green-500/20 flex justify-between items-center">
                   <span className="text-green-400 font-bold">{formatCurrency(order.pricing.booster_earnings)}</span>
                   <span className="text-xs text-green-300 bg-green-500/10 px-2 py-1 rounded-full">Đang thực hiện</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      <div>
        <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5" /> {t('availableJobs')}
        </h2>
        
        {availableOrders.length === 0 ? (
          <div className="text-zinc-500 italic">Hiện chưa có đơn hàng nào mới.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableOrders.map(order => (
              <div key={order._id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase">{order.service_type}</span>
                  <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="mb-4">
                  <div className="text-white font-bold text-lg">{order.details.current_rank} ➔ {order.details.desired_rank}</div>
                  <div className="text-zinc-400 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> Server: {order.details.server}</div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xl font-bold text-yellow-500">{formatCurrency(order.pricing.booster_earnings)}</div>
                  <button 
                    onClick={() => handleAcceptJob(order._id)}
                    disabled={processingId === order._id}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {processingId === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {t('acceptJob')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}