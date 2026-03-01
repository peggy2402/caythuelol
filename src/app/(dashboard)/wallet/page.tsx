'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2, QrCode, Copy, Check, X } from 'lucide-react';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface PaymentInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
  content: string;
  amount: number;
}

export default function WalletPage() {
  const { t } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [bankConfig, setBankConfig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // State cho QR Code
  const [pendingTx, setPendingTx] = useState<{ qrUrl: string, info: PaymentInfo } | null>(null);

  // Fetch data
  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTransactions(data.transactions);
        setBankConfig(data.bankInfo);
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    // Lấy thông tin user để tạo nội dung chuyển khoản
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Socket.io Integration: Lắng nghe sự kiện nạp tiền thành công
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      // 1. Kết nối và Join Room theo User ID
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join_user_room', user._id);

      // 2. Xử lý khi nhận được thông báo từ Server
      const handleWalletUpdate = (data: { balance: number, message: string }) => {
        toast.success('Nạp tiền thành công!', {
          description: data.message,
          icon: <Check className="w-5 h-5 text-green-500" />,
        });
        
        // Cập nhật UI ngay lập tức
        setBalance(data.balance);
        setPendingTx(null); // Ẩn mã QR
        setDepositAmount('');
        fetchWalletData(); // Tải lại lịch sử giao dịch để thấy record mới nhất
      };

      socket.on('wallet_update', handleWalletUpdate);

      return () => {
        socket.off('wallet_update', handleWalletUpdate);
      };
    }
  }, []);

  // Bước 1: Hiển thị QR Code (Chưa tạo giao dịch DB)
  const handleShowQR = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/,/g, ''));
    
    if (isNaN(amount) || amount < 10000) {
      toast.error(t('minDeposit'));
      return;
    }

    if (!bankConfig || !currentUser) {
      toast.error(t('loadingBankInfo'));
      return;
    }

    // Tạo nội dung chuyển khoản: NAP<USERNAME> (Viết liền, không dấu cách để khớp SePay)
    const transferContent = `NAP${currentUser.username.toUpperCase().replace(/\s/g, '')}`;
    
    // Tạo link VietQR Client-side
    const qrUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankConfig.accountName)}`;

    setPendingTx({
      qrUrl,
      info: {
        bankId: bankConfig.bankId,
        accountNo: bankConfig.accountNo,
        accountName: bankConfig.accountName,
        content: transferContent,
        amount: amount
      }
    });
  };

  // Bước 2: Xác nhận đã chuyển khoản -> Mới tạo giao dịch PENDING vào DB
  const handleConfirmTransfer = async () => {
    if (!pendingTx) return;

    setIsDepositing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pendingTx.info.amount }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success('Đã gửi xác nhận! Vui lòng chờ hệ thống xử lý.');
      
      // Reset UI
      setPendingTx(null);
      setDepositAmount('');
      
      // Refresh list để hiện transaction PENDING vừa tạo
      fetchWalletData();

    } catch (error: any) {
      toast.error(error.message || t('serverError'));
    } finally {
      setIsDepositing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleCancelTransaction = async (transactionId: string) => {
    if(!confirm('Bạn muốn hủy yêu cầu nạp tiền này?')) return;
    
    try {
      const res = await fetch('/api/wallet/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      if(res.ok) {
        toast.success('Đã hủy yêu cầu nạp tiền');
        fetchWalletData();
      } else {
        toast.error('Không thể hủy giao dịch này');
      }
    } catch(e) {
      toast.error('Lỗi kết nối');
    }
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
          
          {!pendingTx ? (
            <form onSubmit={handleShowQR} className="space-y-4">
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
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-4 rounded-xl flex justify-center">
                <img src={pendingTx.qrUrl} alt="VietQR" className="w-full max-w-[200px] object-contain" />
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Ngân hàng</span>
                  <span className="font-bold text-white">MB Bank</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{pendingTx.info.accountNo}</span>
                    <Copy onClick={() => copyToClipboard(pendingTx.info.accountNo)} className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Nội dung</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-500">{pendingTx.info.content}</span>
                    <Copy onClick={() => copyToClipboard(pendingTx.info.content)} className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-white" />
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Số tiền</span>
                  <span className="font-bold text-green-500">{formatCurrency(pendingTx.info.amount)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setPendingTx(null);
                    setDepositAmount('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleConfirmTransfer}
                  disabled={isDepositing}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold transition-colors"
                >
                  {isDepositing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Đã chuyển khoản'}
                </button>
              </div>
              <p className="text-xs text-center text-zinc-500">
                Hệ thống sẽ tự động cộng tiền sau 1-5 phút khi nhận được chuyển khoản.
              </p>
            </div>
          )}
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
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
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
                    <td className="px-6 py-4 text-right">
                      {tx.status === 'PENDING' && tx.type === 'DEPOSIT' && (
                        <button onClick={() => handleCancelTransaction(tx._id)} className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium">
                          Hủy đơn
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
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
