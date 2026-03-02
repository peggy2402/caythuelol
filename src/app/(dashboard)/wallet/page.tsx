'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2, QrCode, Copy, Check, X, RefreshCw, XCircle } from 'lucide-react';

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
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
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

  // Socket.io Integration: Fix triệt để vấn đề cập nhật
  useEffect(() => {
    if (currentUser && currentUser._id) {
      // 1. Kết nối và Join Room theo User ID
      if (!socket.connected) {
        socket.connect();
      }
      
      console.log('🔌 Socket joining room:', currentUser._id);
      socket.emit('join_user_room', currentUser._id);

      // 2. Xử lý khi nhận được thông báo từ Server
      const handleWalletUpdate = async (data: { balance: number, message: string }) => {
        console.log('Socket received:', data); // Debug log
        toast.success('Nạp tiền thành công!', {
          description: data.message,
          icon: <Check className="w-5 h-5 text-green-500" />,
        });
        
        // Cập nhật UI ngay lập tức (Force Update)
        setBalance(data.balance);
        setPendingTx(null); // Ẩn mã QR
        setDepositAmount('');
        setIsDepositModalOpen(false); // Đóng modal nạp tiền nếu đang mở
        
        // Gọi fetch lại dữ liệu để đảm bảo đồng bộ với DB
        await fetchWalletData(); // Tải lại lịch sử giao dịch
      };

      socket.on('wallet_update', handleWalletUpdate);

      return () => {
        socket.off('wallet_update', handleWalletUpdate);
      };
    }
  }, [currentUser]); // Chạy lại khi currentUser thay đổi (load xong từ localStorage)

  // Bước 1: Hiển thị QR Code (Chưa tạo giao dịch DB)
  const handleShowQR = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositAmount) {
      toast.error(t('enterAmount'));
      return;
    }

    const amount = parseInt(depositAmount.replace(/,/g, ''));
    
    if (isNaN(amount) || amount < 10000) {
      toast.error(t('minDeposit'));
      return;
    }

    if (!bankConfig || !currentUser) {
      toast.error(t('loadingBankInfo'));
      return;
    }

    // Tạo nội dung chuyển khoản: ZT<USERNAME> (Viết liền, không dấu cách để khớp SePay)
    const transferContent = `ZT${currentUser.username.toUpperCase().replace(/\s/g, '')}`;
    
    // Tạo link SePay QR Client-side
    // Format: https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankConfig.accountNo)}&bank=${encodeURIComponent(bankConfig.bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;

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
      setIsDepositModalOpen(false);
      
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
              <button 
                onClick={() => setIsDepositModalOpen(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
              >
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

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-red-500" />
                {t('deposit')}
              </h3>
              <button 
                onClick={() => {
                  setIsDepositModalOpen(false);
                  setPendingTx(null);
                  setDepositAmount('');
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {!pendingTx ? (
                <form onSubmit={handleShowQR} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      {t('enterAmount')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="50000"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-red-500 transition-colors"
                        min="10000"
                        autoFocus
                      />
                      <span className="absolute right-4 top-3.5 text-zinc-500 font-medium">VND</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                      {t('minDeposit')}
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-white/10"
                  >
                    {t('confirmDeposit')} <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  <div className="bg-white p-4 rounded-xl flex justify-center shadow-inner">
                    <img src={pendingTx.qrUrl} alt="VietQR" className="w-full max-w-[220px] object-contain" />
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
                    <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <span className="text-blue-200 font-medium">Nội dung CK</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-blue-400 tracking-wide select-all">
                          {pendingTx.info.content}
                        </span>
                        <Copy onClick={() => copyToClipboard(pendingTx.info.content)} className="w-5 h-5 text-blue-500 cursor-pointer hover:text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="text-zinc-400">Số tiền</span>
                      <span className="font-bold text-green-500 text-lg">{formatCurrency(pendingTx.info.amount)}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-red-400 text-center italic bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    *Lưu ý: Nhập chính xác nội dung chuyển khoản để được cộng tiền tự động.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setPendingTx(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                    >
                      Quay lại
                    </button>
                    <button 
                      onClick={handleConfirmTransfer}
                      disabled={isDepositing}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-blue-600/20"
                    >
                      {isDepositing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Đã chuyển khoản'}
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <button 
                      onClick={fetchWalletData}
                      className="text-xs text-zinc-500 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Đã chuyển nhưng chưa thấy tiền?
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
