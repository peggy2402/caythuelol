'use client';

import { useState, useEffect } from 'react';
import { CreditCard, XCircle, CheckCircle2, AlertCircle, ShieldCheck, Copy, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentInfo {
  bankId: string;
  bankName?: string;
  accountNo: string;
  accountName: string;
  content: string;
  amount: number;
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  bankConfig: any;
  isWaitingForPayment: boolean;
  setIsWaitingForPayment: (val: boolean) => void;
  isSuccess: boolean;
  setIsSuccess: (val: boolean) => void;
  isFailed: boolean;
  setIsFailed: (val: boolean) => void;
  failReason: string;
  pendingTx: { qrUrl: string; info: PaymentInfo } | null;
  setPendingTx: (tx: { qrUrl: string; info: PaymentInfo } | null) => void;
}

export default function DepositModal({
  isOpen,
  onClose,
  user,
  bankConfig,
  isWaitingForPayment,
  setIsWaitingForPayment,
  isSuccess,
  setIsSuccess,
  isFailed,
  setIsFailed,
  failReason,
  pendingTx,
  setPendingTx
}: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Đóng modal bằng phím ESC trên PC
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

  if (!isOpen) return null;

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

    const bankId = bankConfig.bankId || bankConfig.bankName || 'MB';
    const bankName = bankConfig.bankName || bankConfig.bankId || 'MB Bank';
    const accountNo = bankConfig.accountNo || bankConfig.accountNumber || '';
    const accountName = bankConfig.accountName || bankConfig.accountHolder || '';

    if (!accountNo) {
      toast.error('Hệ thống chưa cấu hình Số tài khoản nhận tiền. Vui lòng liên hệ Admin!');
      return;
    }

    const cleanUsername = user.username.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const transferContent = `ZT${cleanUsername}`;
    const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankId)}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;
    setPendingTx({
      qrUrl,
      info: {
        ...bankConfig,
        bankId,
        bankName,
        accountNo,
        accountName,
        content: transferContent,
        amount,
      },
    });
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

  const handleCloseModal = () => {
    onClose();
    setPendingTx(null);
    setDepositAmount('');
    setIsWaitingForPayment(false);
    setIsSuccess(false);
    setIsFailed(false);
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
      >
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            Nạp Tiền Nhanh Qua VietQR
          </h3>
          <button
            onClick={handleCloseModal}
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
                <div className="w-20 h-20 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
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
                <img
                  src={pendingTx.qrUrl}
                  alt="VietQR"
                  className="w-full max-w-[200px] object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = `https://img.vietqr.io/image/${encodeURIComponent(pendingTx.info.bankId)}-${encodeURIComponent(pendingTx.info.accountNo)}-compact2.png?amount=${pendingTx.info.amount}&addInfo=${encodeURIComponent(pendingTx.info.content)}`;
                    }
                  }}
                />
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500">Ngân hàng</span>
                  <span className="font-bold text-white">{(pendingTx.info as any).bankName || pendingTx.info.bankId}</span>
                </div>
                {pendingTx.info.accountName && (
                  <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500">Chủ tài khoản</span>
                    <span className="font-bold text-white uppercase">{pendingTx.info.accountName}</span>
                  </div>
                )}
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
  );
}
