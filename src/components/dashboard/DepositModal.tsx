'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  XCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  ArrowUpRight,
  Loader2,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { socket } from '@/lib/socket';

export interface PaymentInfo {
  transactionId?: string;
  bankId: string;
  bankName?: string;
  accountNo: string;
  accountName: string;
  content: string;
  amount: number;
}

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  bankConfig?: any;
  pendingTx?: { qrUrl: string; info: PaymentInfo } | null;
  setPendingTx?: (tx: { qrUrl: string; info: PaymentInfo } | null) => void;
  onSuccess?: (newBalance: number) => void;
  initialAmount?: number;
}

export default function DepositModal({
  isOpen,
  onClose,
  user,
  bankConfig,
  pendingTx: externalPendingTx,
  setPendingTx: externalSetPendingTx,
  onSuccess,
  initialAmount,
}: DepositModalProps) {
  const [internalPendingTx, setInternalPendingTx] = useState<{ qrUrl: string; info: PaymentInfo } | null>(null);
  const pendingTx = externalPendingTx !== undefined ? externalPendingTx : internalPendingTx;
  const setPendingTx = externalSetPendingTx || setInternalPendingTx;

  const [internalBankConfig, setInternalBankConfig] = useState<any>(null);
  const activeBankConfig = bankConfig || internalBankConfig;

  const [internalUser, setInternalUser] = useState<any>(null);
  const activeUser = user || internalUser;

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [failReason, setFailReason] = useState('');

  const initialBalanceRef = useRef<number>(activeUser?.wallet_balance || 0);

  useEffect(() => {
    if (activeUser?.wallet_balance !== undefined) {
      initialBalanceRef.current = activeUser.wallet_balance;
    }
  }, [activeUser?.wallet_balance]);

  // Tự động tải bankConfig nếu chưa được truyền từ props
  useEffect(() => {
    if (isOpen && !bankConfig && !internalBankConfig) {
      fetch('/api/wallet')
        .then((res) => res.json())
        .then((data) => {
          if (data?.bankInfo) {
            setInternalBankConfig(data.bankInfo);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, bankConfig, internalBankConfig]);

  // Tự động đọc user từ localStorage nếu chưa được truyền từ props
  useEffect(() => {
    if (isOpen && !user && !internalUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setInternalUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, [isOpen, user, internalUser]);

  // Tự động điền số tiền gợi ý (thiếu hụt) nếu có
  useEffect(() => {
    if (isOpen && initialAmount && initialAmount > 0) {
      const targetVal = Math.max(10000, Math.ceil(initialAmount));
      setDepositAmount(targetVal.toLocaleString('vi-VN'));
    }
  }, [isOpen, initialAmount]);

  // Phím ESC để đóng modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleCloseModal = () => {
    onClose();
    setPendingTx(null);
    setDepositAmount('');
    setIsWaitingForPayment(false);
    setIsSuccess(false);
    setIsFailed(false);
  };

  const triggerSuccess = (newBalance: number) => {
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
        origin: { y: 0.6 },
      });
    } catch (e) {}

    if (onSuccess) {
      onSuccess(newBalance);
    }

    setTimeout(() => {
      handleCloseModal();
    }, 3000);
  };

  // Socket lắng nghe biến động số dư khi modal mở
  useEffect(() => {
    if (!isOpen || !activeUser?._id) return;

    if (!socket.connected) {
      socket.connect();
    }
    const joinRoom = () => {
      socket.emit('join_user_room', activeUser._id);
    };
    joinRoom();
    socket.on('connect', joinRoom);

    const handleUpdate = (data: { balance: number; message: string; type?: string }) => {
      if (data.type === 'REJECT') {
        setIsWaitingForPayment(false);
        setIsFailed(true);
        setFailReason(data.message);
        return;
      }

      triggerSuccess(data.balance);
    };

    socket.on('wallet_update', handleUpdate);
    socket.on('balance_updated', handleUpdate);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('wallet_update', handleUpdate);
      socket.off('balance_updated', handleUpdate);
    };
  }, [isOpen, user?._id]);

  // Polling tự động kiểm tra giao dịch nạp tiền ngay khi mã QR xuất hiện hoặc khi đang chờ
  useEffect(() => {
    if (!isOpen || (!pendingTx && !isWaitingForPayment) || isSuccess) return;

    let isMounted = true;

    const checkDepositStatus = async () => {
      try {
        const res = await fetch(`/api/wallet?page=1&limit=5&_t=${Date.now()}_${Math.random()}`);
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        // Sửa bug đọc data.balance (trước đây đọc data.wallet?.balance nên luôn bằng 0)
        const currentBal = data.balance ?? data.availableBalance ?? data.wallet?.balance ?? 0;
        const latestTx = data.transactions?.[0];

        // 1. Kiểm tra theo Transaction ID nếu có
        const isMatchedId =
          pendingTx?.info?.transactionId &&
          latestTx?._id === pendingTx.info.transactionId &&
          latestTx?.status === 'SUCCESS';

        // 2. Kiểm tra nếu số dư tăng lên
        const isBalanceIncreased =
          initialBalanceRef.current > 0 ? currentBal > initialBalanceRef.current : currentBal > 0;

        // 3. Kiểm tra giao dịch nạp tiền thành công gần nhất khớp số tiền
        const isMatchedRecentTx =
          latestTx?.type === 'DEPOSIT' &&
          latestTx?.status === 'SUCCESS' &&
          pendingTx?.info?.amount &&
          latestTx?.amount === pendingTx.info.amount &&
          Date.now() - new Date(latestTx.createdAt).getTime() < 3 * 60 * 1000;

        if (isMatchedId || isBalanceIncreased || isMatchedRecentTx) {
          triggerSuccess(currentBal);
        }
      } catch (err) {
        console.error('Fast polling deposit check error:', err);
      }
    };

    // Kiểm tra ngay lập tức 1 lần không chờ delay
    checkDepositStatus();

    // Lặp lại mỗi 1.5 giây để nhận biến động thần tốc
    const interval = setInterval(checkDepositStatus, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, pendingTx, isWaitingForPayment, isSuccess]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép vào bộ nhớ tạm!');
  };

  // Bước 1: Tạo mã QR Client-side
  const handleShowQR = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000 đ');
      return;
    }
    if (!activeBankConfig || !activeUser) {
      toast.error('Đang tải cấu hình ngân hàng, vui lòng thử lại');
      return;
    }

    const bankId = activeBankConfig.bankId || activeBankConfig.bankName || 'MB';
    const bankName = activeBankConfig.bankName || activeBankConfig.bankId || 'MB Bank';
    const accountNo = activeBankConfig.accountNo || activeBankConfig.accountNumber || '';
    const accountName = activeBankConfig.accountName || activeBankConfig.accountHolder || '';

    if (!accountNo) {
      toast.error('Hệ thống chưa cấu hình Số tài khoản nhận tiền. Vui lòng liên hệ Admin!');
      return;
    }

    const cleanUsername = (activeUser.username || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const transferContent = `ZT${cleanUsername}`;
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;

    setPendingTx({
      qrUrl,
      info: {
        bankId,
        bankName,
        accountNo,
        accountName,
        content: transferContent,
        amount,
      },
    });
  };

  // Bước 2: Xác nhận đã chuyển khoản
  const handleConfirmTransfer = async () => {
    if (!pendingTx) return;

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

      if (data.transaction?._id) {
        setPendingTx({
          ...pendingTx,
          info: { ...pendingTx.info, transactionId: data.transaction._id },
        });
      }

      setIsWaitingForPayment(true);
    } catch (error: any) {
      toast.error(error.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div
      onClick={handleCloseModal}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-zinc-900 border border-zinc-800 rounded-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[92vh] flex flex-col transition-all my-auto ${
          pendingTx ? 'sm:max-w-2xl' : 'max-w-md'
        }`}
      >
        {/* Header Modal */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            Nạp tiền
          </h3>
          <button
            onClick={handleCloseModal}
            className="text-zinc-400 hover:text-white transition-colors p-1"
            title="Đóng (ESC)"
          >
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto">
          {isSuccess ? (
            /* Màn hình THÀNH CÔNG */
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-1">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Nạp tiền thành công!</h3>
              <p className="text-zinc-400 text-center text-sm">Số dư của bạn đã được cập nhật ngay lập tức.</p>
              <div className="text-2xl sm:text-3xl font-bold text-green-500 mt-1 font-mono">
                +{formatCurrency(pendingTx?.info.amount || 0)}
              </div>
            </div>
          ) : isFailed ? (
            /* Màn hình THẤT BẠI */
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-1">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Giao dịch thất bại</h3>
              <p className="text-zinc-400 text-center px-4 text-sm">{failReason || 'Giao dịch đã bị từ chối.'}</p>
              <button
                onClick={() => {
                  setIsFailed(false);
                  setIsWaitingForPayment(false);
                }}
                className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Thử lại
              </button>
            </div>
          ) : isWaitingForPayment ? (
            /* Màn hình CHỜ XỬ LÝ (Sau khi bấm Đã chuyển khoản) */
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-blue-500" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white">Đang kiểm tra giao dịch...</h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-[280px] mx-auto">
                  Hệ thống tự động cộng tiền khi nhận được biến động từ ngân hàng (thường mất 5 - 15 giây).
                </p>
              </div>

              <div className="flex gap-2.5 pt-2 w-full max-w-[300px]">
                <button
                  type="button"
                  onClick={() => setIsWaitingForPayment(false)}
                  className="flex-1 px-3 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> Xem lại mã QR
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 text-center max-w-[300px] leading-relaxed">
                💡 Nếu bạn chưa chuyển khoản, bạn có thể quay lại xem QR hoặc đóng cửa sổ này và bấm <b>"Thanh toán"</b> trong Lịch sử giao dịch.
              </p>
            </div>
          ) : !pendingTx ? (
            /* Màn hình NHẬP SỐ TIỀN (CHUẨN ẢNH 1) */
            <form onSubmit={handleShowQR} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nhập số tiền muốn nạp
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
                  <span className="w-1 h-1 rounded-full bg-zinc-500" />
                  Tối thiểu 10.000 VNĐ
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-white/10 text-sm"
              >
                Xác nhận nạp <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Màn hình QUÉT MÃ QR 2 CỘT COMPACT (CHUẨN ẢNH 1) */
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-center animate-fade-in">
              {/* Cột trái: QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 sm:p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <div className="bg-white p-2.5 rounded-xl flex justify-center shadow-md w-full max-w-[170px] aspect-square items-center">
                  <img
                    src={pendingTx.qrUrl}
                    alt="VietQR"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = 'true';
                        target.src = `https://img.vietqr.io/image/${encodeURIComponent(pendingTx.info.bankId)}-${encodeURIComponent(pendingTx.info.accountNo)}-compact2.png?amount=${pendingTx.info.amount}&addInfo=${encodeURIComponent(pendingTx.info.content)}`;
                      }
                    }}
                  />
                </div>
                <div className="mt-2.5 text-center">
                  <div className="text-xs font-semibold text-zinc-300">Quét mã VietQR</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Tự động điền đúng STK & số tiền</div>
                </div>
              </div>

              {/* Cột phải: Thông tin chuyển khoản chi tiết */}
              <div className="sm:col-span-7 space-y-2">
                {/* Ngân hàng & Chủ tài khoản */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Ngân hàng</span>
                    <span className="font-bold text-white truncate block mt-0.5">
                      {(pendingTx.info as any).bankName || pendingTx.info.bankId}
                    </span>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold">Chủ tài khoản</span>
                    <span className="font-bold text-white uppercase truncate block mt-0.5">
                      {pendingTx.info.accountName || 'LeoRank'}
                    </span>
                  </div>
                </div>

                {/* Số tài khoản */}
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-950 rounded-lg border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-medium">Số tài khoản</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-white">{pendingTx.info.accountNo}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pendingTx.info.accountNo)}
                      className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
                      title="Sao chép STK"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nội dung CK (Highlight) */}
                <div className="flex justify-between items-center px-3 py-2 bg-blue-950/40 rounded-lg border border-blue-500/40 text-xs">
                  <div>
                    <span className="text-blue-300 font-semibold block text-[11px]">Nội dung CK</span>
                    <span className="text-[10px] text-blue-400/80 font-normal">Bắt buộc chính xác</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-blue-400 tracking-wider select-all">
                      {pendingTx.info.content}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(pendingTx.info.content)}
                      className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md transition-colors"
                      title="Sao chép nội dung CK"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Số tiền */}
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-950 rounded-lg border border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 font-medium">Số tiền</span>
                  <span className="font-mono font-black text-base text-emerald-400">
                    {formatCurrency(pendingTx.info.amount)}
                  </span>
                </div>

                <p className="text-[11px] text-amber-400/90 text-center italic bg-amber-500/10 px-2 py-1.5 rounded-lg border border-amber-500/20 leading-tight">
                  * Nhập chính xác <b>Nội dung CK</b> để hệ thống cộng tiền tự động.
                </p>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingTx(null)}
                    className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    disabled={isDepositing}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đã chuyển khoản'}
                  </button>
                </div>

                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSuccess && activeUser?.wallet_balance) {
                        onSuccess(activeUser.wallet_balance);
                      }
                      toast.info('Đang kiểm tra biến động tài khoản...');
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Đã chuyển nhưng chưa thấy tiền?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
