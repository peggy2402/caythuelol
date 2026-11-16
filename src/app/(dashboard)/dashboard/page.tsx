'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Clock, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  MoreHorizontal,
  Gamepad2,
  Globe,
  Loader2,
  QrCode,
  Copy,
  Check,
  X,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Zap,
  Trophy,
  Target,
  ChevronRight,
  Crown,
  MessageSquare,
  Flame,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import confetti from 'canvas-confetti';

interface Order {
  _id: string;
  orderCode?: string;
  serviceType: string;
  status: string;
  pricing: {
    total_amount: number;
    deposit_amount?: number;
  };
  snapshot?: {
    gameCode?: string;
    serviceSlug?: string;
    initialState?: {
      rankId?: string;
      rankLabel?: string;
      lp?: number;
    };
    targetState?: {
      rankId?: string;
      rankLabel?: string;
      lp?: number;
    };
  };
  createdAt: string;
}

interface PaymentInfo {
  bankId: string;
  accountNo: string;
  accountName: string;
  content: string;
  amount: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language, setLanguage } = useLanguage();

  // --- MODAL STATES FOR VIETQR DEPOSIT ---
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [bankConfig, setBankConfig] = useState<any>(null);
  
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState('');
  
  const [pendingTx, setPendingTx] = useState<{ qrUrl: string, info: PaymentInfo } | null>(null);

  useEffect(() => {
    // Kiểm tra token và phiên đăng nhập
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Điều hướng theo Role
    if (parsedUser.role === 'BOOSTER') {
      router.replace('/booster/dashboard');
      return;
    }
    if (parsedUser.role === 'ADMIN') {
      router.replace('/admin/dashboard');
      return;
    }

    // Fetch dữ liệu đơn hàng và cấu hình ví
    const fetchData = async () => {
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }

        const walletRes = await fetch('/api/wallet');
        const walletData = await walletRes.json();
        if (walletRes.ok) {
          setBankConfig(walletData.bankInfo);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // SOCKET.IO: Lắng nghe tiền vào tự động
  useEffect(() => {
    if (user && user._id && isDepositModalOpen) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('join_user_room', user._id);

      const handleWalletUpdate = async (data: { balance: number, message: string, type?: string }) => {
        if (data.type === 'REJECT') {
          setIsWaitingForPayment(false);
          setIsFailed(true);
          setFailReason(data.message);
          return;
        }

        setUser((prev: any) => ({ ...prev, wallet_balance: data.balance }));
        setIsWaitingForPayment(false);
        setIsSuccess(true);

        try {
          const audio = new Audio('/sounds/coins.mp3');
          await audio.play();
        } catch (e) {
          console.error("Sound play error:", e);
        }

        const end = Date.now() + 3000;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        }());

        setTimeout(() => {
          setIsDepositModalOpen(false);
          setIsSuccess(false);
          setPendingTx(null);
          setDepositAmount('');
        }, 3000);
      };

      socket.on('wallet_update', handleWalletUpdate);

      return () => {
        socket.off('wallet_update', handleWalletUpdate);
      };
    }
  }, [user, isDepositModalOpen]);

  // Helper format currency
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
  };

  const handleShowQR = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount < 10000) { 
      toast.error('Số tiền nạp tối thiểu là 10.000 đ'); 
      return; 
    }
    if (!bankConfig || !user) { 
      toast.error('Đang tải thông tin ngân hàng...'); 
      return; 
    }
    const transferContent = `ZT${user.username.toUpperCase().replace(/\s/g, '')}`;
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankConfig.accountNo)}&bank=${encodeURIComponent(bankConfig.bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;
    setPendingTx({ qrUrl, info: { ...bankConfig, content: transferContent, amount } });
  };

  const handleConfirmTransfer = async () => {
    if (!pendingTx) return;
    setIsDepositing(true);
    try {
      const res = await fetch('/api/wallet', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ amount: pendingTx.info.amount }) 
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setIsWaitingForPayment(true);
    } catch (error: any) { 
      toast.error(error.message || 'Lỗi kết nối máy chủ'); 
    } finally { 
      setIsDepositing(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Đang tải Player Command Center...</span>
      </div>
    );
  }

  // Calculate metrics
  const totalSpent = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((sum, order) => sum + (order.pricing?.total_amount || 0), 0);

  const activeOrders = orders.filter(o =>
    ['IN_PROGRESS', 'APPROVED', 'PENDING_PAYMENT'].includes(o.status)
  );

  const completedOrders = orders.filter(o => o.status === 'COMPLETED');

  // Active spotlight order (most recent in-progress)
  const spotlightOrder = activeOrders[0] || null;

  // Status mapping styles
  const statusStyles: { [key: string]: { bg: string; text: string; dot: string; label: string } } = {
    COMPLETED: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Hoàn thành' },
    IN_PROGRESS: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400 animate-pulse', label: 'Đang cày' },
    APPROVED: { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Đã nhận đơn' },
    PENDING_PAYMENT: { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Chờ thanh toán' },
    PAID: { bg: 'bg-indigo-500/15 border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-400', label: 'Đã thanh toán' },
    REJECTED: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400', label: 'Bị từ chối' },
    REFUNDED: { bg: 'bg-zinc-500/15 border-zinc-500/30', text: 'text-zinc-400', dot: 'bg-zinc-400', label: 'Đã hoàn tiền' },
    DISPUTED: { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400', label: 'Đang khiếu nại' },
    CANCELLED: { bg: 'bg-zinc-700/15 border-zinc-700/30', text: 'text-zinc-500', dot: 'bg-zinc-500', label: 'Đã hủy' }
  };

  // User VIP Tier calculation
  const getVipTier = (spent: number) => {
    if (spent >= 5000000) return { name: 'VIP Kim Cương', discount: '15%', color: 'text-cyan-300', bg: 'bg-cyan-950/50 border-cyan-500/40' };
    if (spent >= 2000000) return { name: 'VIP Vàng', discount: '10%', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-500/40' };
    if (spent >= 500000) return { name: 'VIP Bạc', discount: '5%', color: 'text-slate-300', bg: 'bg-slate-900/60 border-slate-600/40' };
    return { name: 'Thành Viên', discount: '0%', color: 'text-zinc-400', bg: 'bg-zinc-900 border-zinc-800' };
  };

  const vip = getVipTier(totalSpent);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* ========================================================================= */}
      {/* 1. PLAYER COMMAND CENTER HEADER                                            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#070b14] via-[#091024] to-[#0d162e] border border-cyan-500/20 p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* User Profile Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 bg-zinc-950 rounded-full border border-cyan-500/40">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user?.username}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${vip.bg} ${vip.color}`}>
                  {vip.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 flex items-center gap-2">
                <span>Trạng thái tài khoản:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đã xác thực KYC
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">Đang có <b className="text-white">{activeOrders.length}</b> đơn cày chạy</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Language Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/orders/create"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>+ Tạo Đơn Cày Mới</span>
            </Link>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-500/50 text-white text-xs sm:text-sm font-bold transition-all hover:bg-zinc-800 backdrop-blur-md"
            >
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Nạp Tiền VietQR</span>
            </button>

            <Link
              href="/wallet"
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white text-xs sm:text-sm font-semibold hover:border-zinc-700 transition-colors"
            >
              <Wallet className="w-4 h-4 text-zinc-500" />
              <span>Ví Tiền</span>
            </Link>

            {/* Language dropdown */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="appearance-none rounded-xl bg-zinc-950/60 border border-zinc-800 py-3 pl-3.5 pr-8 text-xs font-bold text-zinc-300 hover:border-zinc-700 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="vi">VI (Tiếng Việt)</option>
                <option value="en">EN (English)</option>
                <option value="kr">KR (한국어)</option>
                <option value="jp">JP (日本語)</option>
              </select>
              <Globe className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SPOTLIGHT: ACTIVE ORDER LIVE TRACKING (IF ANY)                          */}
      {/* ========================================================================= */}
      {spotlightOrder && (
        <div className="relative rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/30 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(6,182,212,0.15)] overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Đơn Hàng Đang Cày (Live Tracking)
                </span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-xs text-zinc-400">
                  #{spotlightOrder.orderCode || spotlightOrder._id.slice(-6).toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Escrow Protected
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <span>{spotlightOrder.serviceType}</span>
                {spotlightOrder.snapshot?.initialState?.rankLabel && spotlightOrder.snapshot?.targetState?.rankLabel && (
                  <span className="text-sm font-semibold text-zinc-400 flex items-center gap-1.5 font-sans bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                    <span className="text-zinc-300">{spotlightOrder.snapshot.initialState.rankLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-300 font-bold">{spotlightOrder.snapshot.targetState.rankLabel}</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Booster đang được hệ thống giám sát tự động qua VPN riêng. Mọi trận đấu đều cập nhật điểm LP trực tiếp.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href={`/orders/${spotlightOrder._id}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
              >
                <span>Xem Trận Đấu & Chat</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CORE METRICS TILES                                                     */}
      {/* ========================================================================= */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        
        {/* Tile 1: Wallet Balance */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số Dư Ví Khả Dụng</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight mb-2">
            {user?.wallet_balance?.toLocaleString('vi-VN') || 0} đ
          </div>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="text-xs font-bold text-zinc-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>+ Nạp thêm tiền tức thì</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tile 2: Active Orders */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Đơn Đang Thực Hiện</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight mb-2">
            {activeOrders.length}
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-zinc-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Xem hàng đợi trận đấu</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Tile 3: Completed Orders */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Đơn Hoàn Thành</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight mb-2">
            {completedOrders.length}
          </div>
          <div className="text-xs text-zinc-500">
            Tỷ lệ thành công: <b className="text-emerald-400">100%</b>
          </div>
        </div>

        {/* Tile 4: Total Spent & VIP */}
        <div className="group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-5 sm:p-6 backdrop-blur-sm transition-all hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tổng Chi Tiêu & VIP</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Crown className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono tracking-tight mb-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpent)}
          </div>
          <div className="text-xs text-zinc-400 flex items-center justify-between">
            <span>Chiết khấu hiện tại:</span>
            <span className="text-amber-400 font-bold">-{vip.discount}</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. QUICK LAUNCH GAMES HUB (LỐI TẮT ĐẶT DỊCH VỤ NHANH)                     */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Đặt Dịch Vụ Cày Thuê Nhanh
            </h3>
            <p className="text-xs text-zinc-400">Chọn tựa game để ước tính giá và ghép tuyển thủ Thách Đấu trong 3 phút.</p>
          </div>
          <Link href="/services/lol" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              title: "LMHT: Cày Rank / Elo",
              tag: "Phổ biến nhất",
              color: "from-blue-600/30 to-cyan-500/20",
              border: "hover:border-cyan-500/50",
              link: "/services/lol/rank-boost"
            },
            {
              title: "Valorant Radiant Boost",
              tag: "Bảo mật VPN",
              color: "from-rose-600/30 to-red-500/20",
              border: "hover:border-rose-500/50",
              link: "/services/val"
            },
            {
              title: "ĐTCL / TFT Mùa Mới",
              tag: "Top 1 Thách Đấu",
              color: "from-amber-600/30 to-yellow-500/20",
              border: "hover:border-amber-500/50",
              link: "/services/tft"
            },
            {
              title: "Huấn Luyện & Duo 1-1",
              tag: "Không cần đưa acc",
              color: "from-purple-600/30 to-indigo-500/20",
              border: "hover:border-purple-500/50",
              link: "/services/lol/coaching"
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.link}
              className={`p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 ${item.border} transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group`}
            >
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 block">{item.tag}</span>
                <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors mb-4">{item.title}</h4>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 group-hover:text-white transition-colors pt-2 border-t border-zinc-900">
                <span>Đặt ngay</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT ORDERS (BẢNG ĐƠN HÀNG GẦN ĐÂY)                                  */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-zinc-800 p-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              Lịch Sử Đơn Hàng Gần Đây
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Tiền cọc của bạn được bảo đảm an toàn qua hệ thống Escrow.</p>
          </div>
          <Link href="/orders" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
            Xem tất cả đơn hàng <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="mb-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-inner">
                <Gamepad2 className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Bạn chưa có đơn cày nào</h3>
              <p className="text-xs text-zinc-500 max-w-sm mb-6">
                Bắt đầu hành trình bứt phá xếp hạng với tuyển thủ Thách Đấu ngay hôm nay.
              </p>
              <Link
                href="/services/lol/rank-boost"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md hover:scale-105 transition-all"
              >
                Đặt Đơn Cày Đầu Tiên
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile View: High-tech Card List */}
              <div className="grid gap-3 p-4 md:hidden">
                {orders.slice(0, 5).map((order) => {
                  const s = statusStyles[order.status] || { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', dot: 'bg-zinc-400', label: order.status };
                  return (
                    <div 
                      key={order._id} 
                      className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 active:scale-[0.98] transition-transform cursor-pointer"
                      onClick={() => router.push(`/orders/${order._id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-white text-sm">
                          #{order.orderCode || order._id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${s.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                          <span className={s.text}>{s.label}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Dịch vụ</span>
                        <span className="font-semibold text-zinc-200">{order.serviceType}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Tổng thanh toán</span>
                        <span className="font-mono font-black text-cyan-400 text-sm">
                          {formatCurrency(order.pricing?.total_amount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 border-t border-zinc-900 mt-1">
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span className="flex items-center gap-1 text-cyan-400 font-semibold">Xem chi tiết <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Styled Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950/80 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">Mã Đơn</th>
                      <th className="px-6 py-4 font-bold">Dịch Vụ Cày</th>
                      <th className="px-6 py-4 font-bold">Trạng Thái Escrow</th>
                      <th className="px-6 py-4 font-bold">Tổng Chi Phí</th>
                      <th className="px-6 py-4 font-bold">Ngày Khởi Tạo</th>
                      <th className="px-6 py-4 text-right"><span className="sr-only">Thao tác</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {orders.slice(0, 6).map((order) => {
                      const s = statusStyles[order.status] || { bg: 'bg-zinc-800 border-zinc-700', text: 'text-zinc-400', dot: 'bg-zinc-400', label: order.status };
                      return (
                        <tr 
                          key={order._id} 
                          className="group cursor-pointer transition-colors hover:bg-zinc-800/40"
                          onClick={() => router.push(`/orders/${order._id}`)}
                        >
                          <td className="px-6 py-4 font-mono font-bold text-white">
                            #{order.orderCode || order._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-200">{order.serviceType}</div>
                            {order.snapshot?.initialState?.rankLabel && order.snapshot?.targetState?.rankLabel && (
                              <div className="text-[11px] text-zinc-500">
                                {order.snapshot.initialState.rankLabel} → {order.snapshot.targetState.rankLabel}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${s.bg}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                              <span className={s.text}>{s.label}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-white text-sm">
                            {formatCurrency(order.pricing?.total_amount || 0)}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 group-hover:border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center gap-1 ml-auto transition-colors">
                              Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DEPOSIT MODAL (VIETQR INTEGRATION)                                     */}
      {/* ========================================================================= */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Nạp Tiền Nhanh Qua VietQR
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
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white text-center">Nạp Tiền Thành Công!</h3>
                  <p className="text-zinc-400 text-center text-xs">Số dư tài khoản đã được tự động cộng ngay lập tức.</p>
                  <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                    +{formatCurrency(pendingTx?.info.amount || 0)}
                  </div>
                </div>
              ) : isFailed ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center">Giao dịch chưa hoàn tất</h3>
                  <p className="text-zinc-400 text-center px-4 text-xs">{failReason || 'Giao dịch bị từ chối hoặc hết thời gian chờ.'}</p>
                  <button onClick={() => setIsFailed(false)} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold text-xs transition-colors">
                    Thử Lại
                  </button>
                </div>
              ) : isWaitingForPayment ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-black text-white">Đang Kiểm Tra Giao Dịch...</h3>
                    <p className="text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                      Hệ thống tự động lắng nghe tài khoản ngân hàng. Tiền sẽ được cộng trong 5-15 giây sau khi chuyển khoản.
                    </p>
                  </div>
                </div>
              ) : !pendingTx ? (
                <form onSubmit={handleShowQR} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      Nhập Số Tiền Cần Nạp (VNĐ)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="100000"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white text-xl font-black font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                        min="10000"
                        autoFocus
                      />
                      <span className="absolute right-4 top-4 text-zinc-500 font-bold text-sm">VND</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      Nạp tối thiểu 10.000 đ • Miễn phí giao dịch 100%
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt.toString())}
                        className="py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                      >
                        +{amt.toLocaleString('vi-VN')}
                      </button>
                    ))}
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-4 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                  >
                    <span>Tạo Mã QR Nạp Tiền</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-3 rounded-2xl flex justify-center shadow-inner">
                    <img src={pendingTx.qrUrl} alt="VietQR" className="w-full max-w-[200px] object-contain" />
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500">Ngân hàng</span>
                      <span className="font-bold text-white">MB Bank</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500">Số tài khoản</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{pendingTx.info.accountNo}</span>
                        <Copy onClick={() => copyToClipboard(pendingTx.info.accountNo)} className="w-4 h-4 text-cyan-400 cursor-pointer hover:text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-cyan-950/30 rounded-xl border border-cyan-500/40">
                      <span className="text-cyan-300 font-bold">Nội dung CK</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-cyan-400 tracking-wider select-all">{pendingTx.info.content}</span>
                        <Copy onClick={() => copyToClipboard(pendingTx.info.content)} className="w-4 h-4 text-cyan-400 cursor-pointer hover:text-white" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500">Số tiền nạp</span>
                      <span className="font-mono font-black text-emerald-400 text-base">{formatCurrency(pendingTx.info.amount)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-400 text-center italic bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    *Vui lòng sao chép chính xác Nội dung CK để hệ thống tự động cộng tiền sau 5-15s.
                  </p>
                  <div className="flex gap-2.5 pt-2">
                    <button onClick={() => setPendingTx(null)} className="flex-1 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl font-bold text-xs transition-colors">
                      Quay Lại
                    </button>
                    <button onClick={handleConfirmTransfer} disabled={isDepositing} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-black text-xs transition-colors shadow-md shadow-cyan-600/20">
                      {isDepositing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Tôi Đã Chuyển Khoản'}
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
