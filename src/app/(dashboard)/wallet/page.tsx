'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import confetti from 'canvas-confetti';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2, QrCode, Copy, Check, X, RefreshCw, XCircle, CheckCircle2, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight, Clock, Lock, Search, Filter } from 'lucide-react';
import DepositModal from '@/components/dashboard/DepositModal';

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  metadata?: {
    fee?: number;
    netAmount?: number;
    [key: string]: any;
  };
}

interface PaymentInfo {
  transactionId?: string;
  bankId: string;
  bankName?: string;
  accountNo: string;
  accountName: string;
  content: string;
  amount: number;
}

export default function WalletPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
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
  const [withdrawFee, setWithdrawFee] = useState(5000);
  
  // State cho QR Code
  const [pendingTx, setPendingTx] = useState<{ qrUrl: string, info: PaymentInfo } | null>(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10); // Mặc định 10 dòng
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const fetchWalletData = async (
    page = currentPage,
    currentLimit = limit,
    type = filterType,
    status = filterStatus,
    search = searchQuery
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: currentLimit.toString(),
      });
      if (type && type !== 'ALL') params.set('type', type);
      if (status && status !== 'ALL') params.set('status', status);
      if (search && search.trim()) params.set('search', search.trim());

      params.set('_t', Date.now().toString());
      const res = await fetch(`/api/wallet?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setAvailableBalance(data.availableBalance ?? data.balance);
        setLockedBalance(data.lockedBalance || 0);
        setPendingBalance(data.pending_balance || 0);
        
        // --- LOGIC LỌC TRÙNG LẶP ---
        const rawTx = data.transactions || [];
        const successDeposits = rawTx.filter((t: any) => t.type === 'DEPOSIT' && t.status === 'SUCCESS');

        const cleanedTransactions = rawTx.filter((t: any) => {
          if (t.type === 'DEPOSIT' && t.status === 'PENDING') {
            const isDuplicate = successDeposits.some((st: any) => 
              st.amount === t.amount && 
              Math.abs(new Date(st.createdAt).getTime() - new Date(t.createdAt).getTime()) < 60 * 60 * 1000
            );
            return !isDuplicate;
          }
          return true;
        });

        setTransactions(cleanedTransactions);
        setBankConfig(data.bankInfo);
        setUserBankInfo(data.userBankInfo);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setCurrentPage(data.pagination.page || 1);
          setTotalCount(data.pagination.total || cleanedTransactions.length);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Withdraw Fee
  useEffect(() => {
    fetch('/api/settings/withdraw-fee')
      .then(res => res.json())
      .then(data => setWithdrawFee(data.fee || 5000))
      .catch(() => setWithdrawFee(5000));
  }, []);

  // Lắng nghe phím ESC để đóng popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDepositModalOpen) {
          setIsDepositModalOpen(false);
          setPendingTx(null);
          setDepositAmount('');
          setIsWaitingForPayment(false);
          setIsSuccess(false);
          setIsFailed(false);
        }
        if (isWithdrawModalOpen) {
          setIsWithdrawModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDepositModalOpen, isWithdrawModalOpen]);

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
        // Note: pending_balance might also need update via socket if implemented on backend
        
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
      socket.on('balance_updated', handleWalletUpdate);

      return () => {
        socket.off('wallet_update', handleWalletUpdate);
        socket.off('balance_updated', handleWalletUpdate);
      };
    }
  }, [currentUser, isDepositModalOpen]); // Thêm dependency để socket closure cập nhật state mới nhất

  // Cơ chế Polling tự động kiểm tra giao dịch nạp tiền khi đang hiển thị popup chờ (Backup cho Socket)
  useEffect(() => {
    if (!isWaitingForPayment) return;

    const initialBal = balance;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet?page=1&limit=5&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const currentBal = data.wallet?.balance ?? data.wallet?.wallet_balance ?? 0;
        const latestTx = data.transactions?.[0];

        // Nếu số dư đã tăng lên hoặc có giao dịch nạp tiền PENDING đã chuyển sang SUCCESS
        const isTxSuccess = pendingTx?.info?.transactionId
          ? latestTx?._id === pendingTx.info.transactionId && latestTx?.status === 'SUCCESS'
          : latestTx?.type === 'DEPOSIT' && latestTx?.status === 'SUCCESS' && currentBal > initialBal;

        if (isTxSuccess || currentBal > initialBal) {
          setBalance(currentBal);
          setIsWaitingForPayment(false);
          setIsSuccess(true);

          try {
            const audio = new Audio('/sounds/coins.mp3');
            audio.volume = 1.0;
            audio.play().catch(() => {});
          } catch (e) {}

          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch (e) {}

          setTimeout(async () => {
            setIsDepositModalOpen(false);
            setIsSuccess(false);
            setPendingTx(null);
            setDepositAmount('');
            await fetchWalletData(1);
          }, 3000);
        }
      } catch (err) {
        console.error('Polling deposit check error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isWaitingForPayment, balance, pendingTx]);

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

    const bankId = bankConfig.bankId || bankConfig.bankName || 'MB';
    const bankName = bankConfig.bankName || bankConfig.bankId || 'MB Bank';
    const accountNo = bankConfig.accountNo || bankConfig.accountNumber || '';
    const accountName = bankConfig.accountName || bankConfig.accountHolder || '';

    if (!accountNo) {
      toast.error('Hệ thống chưa cấu hình Số tài khoản nhận tiền. Vui lòng liên hệ Admin!');
      return;
    }

    // Chuẩn hóa nội dung chuyển khoản chỉ gồm chữ cái và số [A-Z0-9]
    // Tránh việc app ngân hàng (MBBank, Vietcombank...) tự động xóa bỏ dấu gạch dưới "_" gây lệch mã
    const cleanUsername = currentUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const transferContent = `ZT${cleanUsername}`;
    
    // Tạo link SePay QR Client-side
    // Format: https://qr.sepay.vn/img?acc=SO_TAI_KHOAN&bank=NGAN_HANG&amount=SO_TIEN&des=NOI_DUNG
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;

    setPendingTx({
      qrUrl,
      info: {
        bankId,
        bankName,
        accountNo,
        accountName,
        content: transferContent,
        amount: amount
      }
    });
  };

  // Bước 2: Xác nhận đã chuyển khoản -> Mới tạo giao dịch PENDING vào DB (hoặc tái sử dụng nếu đã có)
  const handleConfirmTransfer = async () => {
    if (!pendingTx) return;

    // Nếu đơn này đã có transactionId (ví dụ mở từ lịch sử để thanh toán tiếp hoặc đã bấm trước đó),
    // KHÔNG tạo thêm bản ghi mới nữa để tránh spam trùng lặp!
    if (pendingTx.info.transactionId) {
      setIsWaitingForPayment(true);
      return;
    }

    setIsDepositing(true);
    try {
      const res = await fetch('/api/wallet/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pendingTx.info.amount }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || data.error || 'Lỗi tạo giao dịch nạp tiền');

      // Ghi nhận transactionId để không tạo lại lần sau
      if (data.transaction?._id) {
        setPendingTx((prev) => prev ? {
          ...prev,
          info: { ...prev.info, transactionId: data.transaction._id }
        } : null);
      }

      setIsWaitingForPayment(true);
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

  const handleResumeDeposit = (tx: Transaction) => {
    if (!bankConfig || !currentUser) {
      toast.error('Đang tải thông tin ngân hàng, vui lòng thử lại');
      return;
    }
    const bankId = bankConfig.bankId || bankConfig.bankName || 'MB';
    const bankName = bankConfig.bankName || bankConfig.bankId || 'MB Bank';
    const accountNo = bankConfig.accountNo || bankConfig.accountNumber || '';
    const accountName = bankConfig.accountName || bankConfig.accountHolder || '';
    const cleanUsername = currentUser.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const transferContent = `ZT${cleanUsername}`;
    const amount = Math.abs(tx.amount);
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;

    setPendingTx({
      qrUrl,
      info: {
        transactionId: tx._id, // Ghi nhận ID giao dịch đang chờ để không tạo trùng bản ghi!
        bankId,
        bankName,
        accountNo,
        accountName,
        content: transferContent,
        amount,
      },
    });
    setIsWaitingForPayment(false);
    setIsDepositModalOpen(true);
  };

  const handleCancelTransaction = async (transactionId: string) => {
    if (!confirm('Bạn muốn hủy yêu cầu nạp tiền này?')) return;
    
    try {
      const res = await fetch('/api/wallet/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Đã hủy yêu cầu nạp tiền');
        fetchWalletData(currentPage, limit, filterType, filterStatus, searchQuery);
      } else {
        toast.error(data.message || 'Không thể hủy giao dịch này');
      }
    } catch(e) {
      toast.error('Lỗi kết nối');
    }
  };

  const getTransactionTypeMeta = (type: string, description?: string) => {
    switch (type) {
      case 'DEPOSIT':
        return {
          label: 'Nạp tiền',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          icon: ArrowDownLeft,
        };
      case 'WITHDRAWAL':
        return {
          label: 'Rút tiền',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          icon: ArrowUpRight,
        };
      case 'PAYMENT_RELEASE':
        return {
          label: 'Tiền công cày thuê',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          icon: Wallet,
        };
      case 'PAYMENT_HOLD':
        return {
          label: 'Tạm giữ cọc đơn',
          color: 'text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/20',
          icon: Lock,
        };
      case 'REFUND':
        return {
          label: 'Hoàn tiền',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
          icon: RefreshCw,
        };
      case 'DISPUTE_PENALTY':
        return {
          label: 'Truy thu khiếu nại',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
          icon: AlertCircle,
        };
      default:
        return {
          label: type || 'Giao dịch',
          color: 'text-zinc-400',
          bg: 'bg-zinc-800 border-zinc-700',
          icon: History,
        };
    }
  };

  const getTransactionTitle = (tx: Transaction) => {
    if (tx.description && !tx.description.startsWith('BankAPINotify')) {
      return tx.description;
    }
    if (tx.type === 'DEPOSIT') {
      return `Nạp tiền vào tài khoản (${formatCurrency(Math.abs(tx.amount))})`;
    }
    if (tx.type === 'WITHDRAWAL') {
      return `Yêu cầu rút tiền (${formatCurrency(Math.abs(tx.amount))})`;
    }
    if (tx.type === 'HOLD' || tx.type === 'PAYMENT_HOLD') return 'Tạm giữ tiền cọc đơn hàng';
    if (tx.type === 'RELEASE' || tx.type === 'PAYMENT_RELEASE') return 'Nhận tiền công cày thuê';
    if (tx.type === 'REFUND') return 'Hoàn tiền vào ví';
    if (tx.type === 'DISPUTE_PENALTY') return 'Truy thu tiền khiếu nại đơn';
    return tx.description || tx.type;
  };

  const getTransactionStatusMeta = (status: string, type?: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING':
        return {
          label: type === 'DEPOSIT' ? 'Chờ thanh toán' : 'Chờ xử lý',
          style: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          dotColor: 'bg-amber-400 animate-pulse',
        };
      case 'SUCCESS':
        return {
          label: 'Thành công',
          style: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          dotColor: 'bg-emerald-400',
        };
      case 'FAILED':
        return {
          label: 'Thất bại',
          style: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          dotColor: 'bg-rose-400',
        };
      case 'CANCELLED':
        return {
          label: 'Đã hủy',
          style: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
          dotColor: 'bg-zinc-500',
        };
      default:
        return {
          label: status,
          style: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
          dotColor: 'bg-zinc-500',
        };
    }
  };

  // Xử lý click nút Rút tiền
  const handleWithdrawClick = () => {
    const activeBankInfo = userBankInfo || currentUser?.profile?.bank_info;
    if (!activeBankInfo || !activeBankInfo.accountNumber) {
      toast.error('Vui lòng cập nhật thông tin ngân hàng trước khi rút tiền');
      router.push('/profile'); // Chuyển hướng sang trang Profile
      return;
    }
    if (!userBankInfo && activeBankInfo) {
      setUserBankInfo(activeBankInfo);
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
    if (amount > availableBalance) {
      toast.error('Số dư khả dụng không đủ');
      return;
    }

    const activeBankInfo = userBankInfo || currentUser?.profile?.bank_info;

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankInfo: activeBankInfo }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Yêu cầu rút tiền thành công. Vui lòng chờ duyệt.');
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
        fetchWalletData(1);
        // Optional: Play success sound
      } else {
        toast.error(data.error || 'Lỗi rút tiền');
      }
    } catch (e) { toast.error('Lỗi kết nối'); }
  };

  // Tính toán số tiền thực nhận cho Modal Rút tiền
  const withdrawAmountNum = parseInt(withdrawAmount.replace(/,/g, '')) || 0;
  const netReceived = Math.max(0, withdrawAmountNum - withdrawFee);

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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {formatCurrency(balance)}
            </h2>
            
            <div className="space-y-2 mb-6">
              {lockedBalance > 0 && (
                <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg w-fit border border-orange-500/20">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Tạm giữ 24h chờ khiếu nại: {formatCurrency(lockedBalance)}</span>
                </div>
              )}
              {pendingBalance > 0 && (
                <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1.5 rounded-lg w-fit border border-yellow-500/20">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Đang chờ duyệt/giữ: {formatCurrency(pendingBalance)}</span>
                </div>
              )}
            </div>
            
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

      {/* Transaction History (Card List Feed) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 space-y-4 bg-zinc-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              {t('transactionHistory')}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                {totalCount} giao dịch
              </span>
            </h3>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchWalletData(1, limit, filterType, filterStatus, e.target.value);
                }}
                placeholder="Tìm nội dung, mã đơn..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            {/* Filter by Type */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'DEPOSIT', label: 'Nạp tiền' },
                { key: 'WITHDRAWAL', label: 'Rút tiền' },
                { key: 'PAYMENT_RELEASE', label: 'Tiền công' },
                { key: 'PAYMENT_HOLD', label: 'Cọc đơn' },
                { key: 'REFUND', label: 'Hoàn tiền' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilterType(tab.key);
                    fetchWalletData(1, limit, tab.key, filterStatus, searchQuery);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    filterType === tab.key
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-zinc-950/70 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  fetchWalletData(1, limit, filterType, e.target.value, searchQuery);
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-zinc-700"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ thanh toán / Chờ xử lý</option>
                <option value="SUCCESS">Thành công</option>
                <option value="FAILED">Thất bại</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card List Feed */}
        <div className="p-3 sm:p-5 space-y-2.5">
          {loading && transactions.length === 0 ? (
            // Skeleton loader
            [...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-zinc-950/40 border border-zinc-800/60 rounded-xl animate-pulse flex items-center justify-between">
                <div className="flex items-center gap-3 w-2/3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl shrink-0"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-20"></div>
              </div>
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx) => {
              const typeMeta = getTransactionTypeMeta(tx.type, tx.description);
              const statusMeta = getTransactionStatusMeta(tx.status, tx.type);
              const isPendingDeposit = tx.status === 'PENDING' && tx.type === 'DEPOSIT';
              const Icon = typeMeta.icon;

              return (
                <div
                  key={tx._id}
                  onClick={() => {
                    if (isPendingDeposit) handleResumeDeposit(tx);
                  }}
                  className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPendingDeposit
                      ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07] border-amber-500/30 cursor-pointer shadow-sm hover:shadow-amber-500/10'
                      : 'bg-zinc-950/50 hover:bg-zinc-950/90 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Left: Icon + Description + Metadata */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${typeMeta.bg}`}>
                      <Icon className={`w-5 h-5 ${typeMeta.color}`} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                          {getTransactionTitle(tx)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${typeMeta.bg} ${typeMeta.color} font-medium shrink-0`}>
                          {typeMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-zinc-600" />
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {tx.type === 'WITHDRAWAL' && (
                          <span className="text-zinc-400 text-[11px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            Thực nhận: <b className="text-white">{formatCurrency(Math.abs(tx.amount) - (tx.metadata?.fee || 0))}</b>
                            {tx.metadata?.fee ? ` (Phí: ${formatCurrency(tx.metadata.fee)})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Status Badge + Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60 shrink-0">
                    <div className="text-left sm:text-right space-y-1">
                      <div className={`text-base font-black font-mono tracking-tight ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </div>

                      <div className="flex items-center sm:justify-end gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta.style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`}></span>
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Pending Deposit */}
                    {isPendingDeposit && (
                      <div className="flex items-center gap-1.5 pl-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleResumeDeposit(tx)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-600/20 flex items-center gap-1 cursor-pointer"
                          title="Tiếp tục thanh toán"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Thanh toán</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelTransaction(tx._id)}
                          className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                          title="Hủy yêu cầu nạp này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <History className="w-10 h-10 mx-auto text-zinc-600 stroke-1" />
              <div className="text-sm font-medium">{t('noTransfer')}</div>
              <p className="text-xs text-zinc-600">Thử thay đổi bộ lọc hoặc tìm kiếm để xem các giao dịch khác.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800 bg-zinc-950/60 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                setLimit(newLimit);
                fetchWalletData(1, newLimit, filterType, filterStatus, searchQuery);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-zinc-700"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>giao dịch / trang</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Trang <b className="text-white">{currentPage}</b> / {totalPages || 1}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fetchWalletData(currentPage - 1, limit, filterType, filterStatus, searchQuery)}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-300"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                .map((pageNum, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && pageNum - arr[idx - 1] > 1;
                  return (
                    <span key={pageNum} className="flex items-center">
                      {showEllipsisBefore && <span className="px-1 text-zinc-600">...</span>}
                      <button
                        type="button"
                        onClick={() => fetchWalletData(pageNum, limit, filterType, filterStatus, searchQuery)}
                        disabled={loading}
                        className={`min-w-[28px] h-7 px-2 rounded-lg font-mono font-semibold transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </span>
                  );
                })}

              <button
                type="button"
                onClick={() => fetchWalletData(currentPage + 1, limit, filterType, filterStatus, searchQuery)}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-300"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal Reusable Component */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          setPendingTx(null);
        }}
        user={currentUser}
        bankConfig={bankConfig}
        pendingTx={pendingTx}
        setPendingTx={setPendingTx}
        onSuccess={async (newBalance) => {
          setBalance(newBalance);
          await fetchWalletData(1);
        }}
      />

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div 
          onClick={() => setIsWithdrawModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-blue-500" />
                {t('withdraw')}
              </h3>
              <button 
                onClick={() => setIsWithdrawModalOpen(false)} 
                className="text-zinc-400 hover:text-white p-1"
                title="Đóng (ESC)"
              >
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
                    onClick={() => setWithdrawAmount(availableBalance.toString())}
                    className="absolute right-3 top-2.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-blue-400 px-2 py-1.5 rounded transition-colors"
                  >
                    Rút hết
                  </button>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>Khả dụng để rút: <strong className="text-white">{formatCurrency(availableBalance)}</strong></span>
                  <span>Phí rút: {formatCurrency(withdrawFee)}</span>
                </div>
                {withdrawAmountNum > 0 && (
                  <div className="flex justify-between text-sm font-bold text-white mt-3 pt-3 border-t border-zinc-800">
                    <span>Thực nhận về bank:</span>
                    <span className="text-green-500">{formatCurrency(netReceived)}</span>
                  </div>
                )}
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
