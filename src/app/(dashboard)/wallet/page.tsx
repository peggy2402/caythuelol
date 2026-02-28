'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2 } from 'lucide-react';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Fetch data
  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Handle Deposit
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/,/g, ''));
    
    if (isNaN(amount) || amount < 10000) {
      toast.error(t('minDeposit'));
      return;
    }

    setIsDepositing(true);
    try {
      // 1. Tạo yêu cầu nạp tiền
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success(t('depositSuccess'));
      setDepositAmount('');
      
      // 2. Mock Payment (Tự động confirm để test)
      // Trong thực tế, bước này sẽ là redirect user sang cổng thanh toán hoặc hiển thị QR
      await mockPaymentConfirm(data.transaction._id);

    } catch (error: any) {
      toast.error(error.message || t('serverError'));
    } finally {
      setIsDepositing(false);
    }
  };

  // Hàm giả lập thanh toán thành công (Chỉ dùng cho Dev/Demo)
  const mockPaymentConfirm = async (transactionId: string) => {
    try {
      toast.loading('Đang xử lý thanh toán (Giả lập)...');
      const res = await fetch('/api/wallet/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      
      if (res.ok) {
        toast.dismiss();
        toast.success('Nạp tiền thành công!');
        fetchWalletData(); // Reload data
      } else {
        toast.dismiss();
        toast.error('Lỗi xử lý thanh toán');
      }
    } catch (error) {
      toast.dismiss();
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('walletTitle')}</h1>
        <p className="text-zinc-400">Quản lý số dư và lịch sử giao dịch của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          
          <div className="relative z-10">
            <p className="text-zinc-400 font-medium mb-1">{t('currentBalance')}</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {formatCurrency(balance)}
            </h2>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
                <ArrowUpRight className="w-4 h-4" />
                {t('deposit')}
              </button>
              <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                <ArrowDownLeft className="w-4 h-4" />
                {t('withdraw')}
              </button>
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            {t('deposit')}
          </h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                {t('enterAmount')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  min="10000"
                />
                <span className="absolute right-4 top-3 text-zinc-500 font-medium">VND</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{t('minDeposit')}</p>
            </div>
            
            <button
              type="submit"
              disabled={isDepositing}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isDepositing && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('confirmDeposit')}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-400" />
            {t('transactionHistory')}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">{t('date')}</th>
                <th className="px-6 py-4 font-medium">{t('description')}</th>
                <th className="px-6 py-4 font-medium">{t('amount')}</th>
                <th className="px-6 py-4 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                    <td className={`px-6 py-4 font-bold ${
                      tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RELEASE' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' :
                        tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    {t('noOrders')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
