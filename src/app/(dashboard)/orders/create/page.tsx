'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, User, ShieldCheck } from 'lucide-react';

// Bảng giá Client-side (để hiển thị ước tính)
const RANK_PRICES: { [key: string]: number } = {
  'Iron': 50000,
  'Bronze': 100000,
  'Silver': 150000,
  'Gold': 250000,
  'Platinum': 400000,
  'Emerald': 600000,
  'Diamond': 1000000,
  'Master': 2000000,
};
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master'];

function CreateOrderContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const boosterId = searchParams.get('booster');

  const [booster, setBooster] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [currentRank, setCurrentRank] = useState('Silver');
  const [desiredRank, setDesiredRank] = useState('Gold');
  const [accUser, setAccUser] = useState('');
  const [accPass, setAccPass] = useState('');
  const [note, setNote] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Fetch Booster Info if selected
  useEffect(() => {
    if (boosterId) {
      // Trong thực tế nên có API get single booster, ở đây ta giả lập hoặc fetch list rồi find
      // Để đơn giản, ta hiển thị ID hoặc fetch lại list
      fetch('/api/boosters')
        .then(res => res.json())
        .then(data => {
            const found = data.boosters.find((b: any) => b._id === boosterId);
            if (found) setBooster(found);
        });
    }
  }, [boosterId]);

  // Calculate Price
  useEffect(() => {
    const currentIdx = RANKS.indexOf(currentRank);
    const desiredIdx = RANKS.indexOf(desiredRank);

    if (currentIdx >= desiredIdx) {
      setTotalPrice(0);
      return;
    }

    let total = 0;
    for (let i = currentIdx + 1; i <= desiredIdx; i++) {
      total += (RANK_PRICES[RANKS[i]] || 0);
    }
    setTotalPrice(total);
  }, [currentRank, desiredRank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accUser || !accPass || totalPrice <= 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booster_id: boosterId,
          service_type: 'RANK_BOOST',
          current_rank: currentRank,
          desired_rank: desiredRank,
          account_username: accUser,
          account_password: accPass,
          note
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
            toast.error(t('insufficientBalance'));
            // Có thể redirect sang trang nạp tiền sau vài giây
            setTimeout(() => router.push('/dashboard/wallet'), 2000);
        } else {
            throw new Error(data.error);
        }
        return;
      }

      toast.success(t('orderSuccess'));
      router.push('/dashboard/orders'); // Chuyển hướng về danh sách đơn hàng

    } catch (error: any) {
      toast.error(error.message || t('serverError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">{t('createOrderTitle')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service Selection */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                {t('selectService')}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('currentRank')}</label>
                    <select 
                        value={currentRank}
                        onChange={(e) => setCurrentRank(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('desiredRank')}</label>
                    <select 
                        value={desiredRank}
                        onChange={(e) => setDesiredRank(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                {t('accountInfo')}
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Username (Riot ID)</label>
                    <input 
                        type="text" 
                        value={accUser}
                        onChange={(e) => setAccUser(e.target.value)}
                        placeholder="VD: Faker#VN2"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                    <input 
                        type="password" 
                        value={accPass}
                        onChange={(e) => setAccPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">{t('note')}</label>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="VD: Chỉ đánh tướng Yasuo, chat tắt..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">{t('totalPrice')}</h3>
                
                {booster && (
                    <div className="flex items-center gap-3 mb-6 p-3 bg-zinc-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                            {booster.profile?.avatar && <img src={booster.profile.avatar} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Booster</p>
                            <p className="font-bold text-white">{booster.username}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-3 mb-6 border-b border-zinc-800 pb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Dịch vụ:</span>
                        <span className="text-white font-medium">Rank Boost</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Từ:</span>
                        <span className="text-white font-medium">{currentRank}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Đến:</span>
                        <span className="text-white font-medium">{desiredRank}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                    <span className="text-zinc-400 font-medium">Tổng cộng:</span>
                    <span className="text-3xl font-bold text-blue-400">{formatCurrency(totalPrice)}</span>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={submitting || totalPrice <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {t('payNow')}
                </button>
                
                {totalPrice <= 0 && (
                    <p className="text-red-400 text-xs text-center mt-3">
                        Rank mong muốn phải cao hơn Rank hiện tại.
                    </p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateOrderPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>}>
            <CreateOrderContent />
        </Suspense>
    );
}
