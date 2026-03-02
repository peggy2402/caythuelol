'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import confetti from 'canvas-confetti';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2, QrCode, Copy, Check, X, RefreshCw, XCircle, CheckCircle2, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [bankConfig, setBankConfig] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userBankInfo, setUserBankInfo] = useState<any>(null);
  
  // Modal States
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // State cho QR Code
  const [pendingTx, setPendingTx] = useState<{ qrUrl: string, info: PaymentInfo } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10); // Mặc định 10 dòng

  // Fetch data
  const fetchWalletData = async (page = 1, currentLimit = limit) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet?page=${page}&limit=${currentLimit}`);
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setTransactions(data.transactions);
        setBankConfig(data.bankInfo);
        setUserBankInfo(data.userBankInfo);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData(1, limit);
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
      
      // console.log('🔌 Socket joining room:', currentUser._id);
      socket.emit('join_user_room', currentUser._id);

      // 2. Xử lý khi nhận được thông báo từ Server
      const handleWalletUpdate = async (data: { balance: number, message: string, type?: string }) => {
        console.log('Socket received:', data); // Debug log
        
        // Xử lý trường hợp bị TỪ CHỐI
        if (data.type === 'REJECT') {
          if (isDepositModalOpen) {
            setIsWaitingForPayment(false);
            setIsFailed(true);
            setFailReason(data.message);
            await fetchWalletData(currentPage);
          }
          return;
        }

        // Cập nhật UI ngay lập tức (Force Update)
        setBalance(data.balance);
        
        if (isDepositModalOpen) {
          // Nếu đang mở modal nạp tiền -> Chuyển sang trạng thái thành công
          setIsWaitingForPayment(false);
          setIsSuccess(true);

          // Phát âm thanh (Ưu tiên phát ở đây vì có tương tác người dùng)
          try {
            const audio = new Audio('/sounds/coins.mp3');
            audio.volume = 1.0;
            await audio.play();
          } catch (e) { console.error("Sound play error:", e); }

          // Hiệu ứng pháo hoa (Confetti)
          // Bắn liên tục trong 3 giây
          const duration = 3000;
          const end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#22c55e', '#3b82f6', '#eab308', '#ef4444']
            });
            confetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#22c55e', '#3b82f6', '#eab308', '#ef4444']
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());

          // Tự động đóng sau 3 giây
          setTimeout(async () => {
            setIsDepositModalOpen(false);
            setIsSuccess(false);
            setPendingTx(null);
            setDepositAmount('');
            await fetchWalletData(1); // Tải lại lịch sử (Lúc này đã là SUCCESS)
          }, 3000);
        } else {
          await fetchWalletData(currentPage, limit);
        }

        // Gọi fetch lại dữ liệu để đảm bảo đồng bộ với DB
      };

      socket.on('wallet_update', handleWalletUpdate);

      return () => {
        socket.off('wallet_update', handleWalletUpdate);
      };
    }
  }, [currentUser, isDepositModalOpen]); // Thêm dependency để socket closure cập nhật state mới nhất

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

      // KHÔNG ĐÓNG MODAL -> Chuyển sang trạng thái chờ
      setIsWaitingForPayment(true);
      
      // Có thể fetch lại data để background list hiện PENDING (tùy chọn)

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
        fetchWalletData(currentPage);
      } else {
        toast.error('Không thể hủy giao dịch này');
      }
    } catch(e) {
      toast.error('Lỗi kết nối');
    }
  };

  // Xử lý click nút Rút tiền
  const handleWithdrawClick = () => {
    if (!userBankInfo || !userBankInfo.accountNumber) {
      toast.error('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền');
      router.push('/profile'); // Chuyển hướng sang trang Profile
      return;
    }
    setIsWithdrawModalOpen(true);
  };

  // Xử lý xác nhận Rút tiền
  const handleConfirmWithdraw = async () => {
    const amount = parseInt(withdrawAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount < 50000) {
      toast.error('Số tiền rút tối thiểu là 50,000 VNĐ');
      return;
    }
    if (amount > balance) {
      toast.error('Số dư không đủ');
      return;
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Yêu cầu rút tiền thành công. Vui lòng chờ duyệt.');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        fetchWalletData(1);
      } else {
        toast.error(data.error || 'Lỗi rút tiền');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  // Xóa đoạn if (loading) return ... cũ để tránh layout shift
  // Thay vào đó ta dùng loading state để làm mờ bảng hoặc hiện skeleton

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
              <button 
                onClick={handleWithdrawClick}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
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
        
        <div className={`overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
              {loading && transactions.length === 0 ? (
                 // Skeleton Loading khi chưa có dữ liệu lần đầu
                 [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full"></div></td></tr>
                 ))
              ) : transactions.length > 0 ? (
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
                      {/* Tạm ẩn nút Hủy đơn theo yêu cầu */}
                      {/* {tx.status === 'PENDING' && tx.type === 'DEPOSIT' && (
                        <button onClick={() => handleCancelTransaction(tx._id)} className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium">
                          Hủy đơn
                        </button>
                      )} */}
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

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Hiển thị</span>
            <select 
              value={limit} 
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                fetchWalletData(1, newLimit); // Reset về trang 1 khi đổi limit
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 focus:outline-none focus:border-zinc-700"
            >
              {[5, 10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>dòng / trang</span>
          </div>

          {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchWalletData(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <span className="text-sm text-zinc-400">
              Trang <span className="text-white font-medium">{currentPage}</span> / {totalPages}
            </span>
            <button
              onClick={() => fetchWalletData(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          )}
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
                  setIsWaitingForPayment(false);
                  setIsSuccess(false);
                  setIsFailed(false);
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {isSuccess ? (
                // Màn hình THÀNH CÔNG
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center">Nạp tiền thành công!</h3>
                  <p className="text-zinc-400 text-center">Số dư của bạn đã được cập nhật.</p>
                  <div className="text-3xl font-bold text-green-500 mt-2">
                    +{formatCurrency(pendingTx?.info.amount || 0)}
                  </div>
                </div>
              ) : isFailed ? (
                // Màn hình THẤT BẠI / TỪ CHỐI
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center">Giao dịch thất bại</h3>
                  <p className="text-zinc-400 text-center px-4">{failReason || 'Giao dịch đã bị từ chối.'}</p>
                  
                  <button 
                    onClick={() => {
                      setIsFailed(false);
                      setIsWaitingForPayment(false);
                      // Giữ lại form để khách nhập lại hoặc thử lại
                    }}
                    className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              ) : isWaitingForPayment ? (
                // Màn hình CHỜ XỬ LÝ (Sau khi bấm Đã chuyển khoản)
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-white">Đang kiểm tra giao dịch...</h3>
                    <p className="text-sm text-zinc-400 max-w-[250px] mx-auto">
                      Hệ thống đang xác nhận khoản tiền của bạn. Vui lòng không tắt trình duyệt.
                    </p>
                  </div>
                </div>
              ) : !pendingTx ? (
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
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-red-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      onClick={() => fetchWalletData(currentPage, limit)}
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

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-500" />
                {t('withdraw')}
              </h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-zinc-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-sm">
                <div className="text-zinc-400 mb-1">Nhận tiền qua:</div>
                <div className="font-bold text-white">{userBankInfo?.bankName} - {userBankInfo?.accountNumber}</div>
                <div className="text-zinc-500 uppercase">{userBankInfo?.accountHolder}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Số tiền muốn rút</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button 
                    onClick={() => setWithdrawAmount(balance.toString())}
                    className="absolute right-3 top-2.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-2 py-1.5 rounded transition-colors"
                  >
                    Rút hết
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Số dư khả dụng: {formatCurrency(balance)}</p>
              </div>

              <button
                onClick={handleConfirmWithdraw}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
              >
                Xác nhận rút tiền
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
