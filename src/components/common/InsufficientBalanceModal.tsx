'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ExternalLink,
  X,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  QrCode,
  Loader2,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { socket } from '@/lib/socket';

export interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  currentBalance?: number;
  missingAmount?: number;
  orderTitle?: string;
  user?: any;
  bankConfig?: any;
  onSuccess?: (newBalance: number) => void;
  onOpenDeposit?: () => void;
}

export default function InsufficientBalanceModal({
  isOpen,
  onClose,
  requiredAmount,
  currentBalance = 0,
  missingAmount,
  orderTitle,
  user: propUser,
  bankConfig: propBankConfig,
  onSuccess,
  onOpenDeposit,
}: InsufficientBalanceModalProps) {
  // Lấy dữ liệu user & bankConfig nội bộ nếu cha không truyền
  const [internalUser, setInternalUser] = useState<any>(null);
  const [internalBankConfig, setInternalBankConfig] = useState<any>(null);

  const activeUser = propUser || internalUser;
  const activeBankConfig = propBankConfig || internalBankConfig;

  // Tính số tiền thiếu cần nạp (làm tròn lên nếu có số lẻ nhỏ)
  const rawMissing = missingAmount !== undefined && missingAmount > 0
    ? missingAmount
    : Math.max(0, requiredAmount - currentBalance);
  const targetAmount = Math.max(10000, Math.ceil(rawMissing));

  // Trạng thái thanh toán realtime
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const initialBalanceRef = useRef<number>(currentBalance);

  // Đọc user từ localStorage
  useEffect(() => {
    if (isOpen && !propUser && !internalUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setInternalUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, [isOpen, propUser, internalUser]);

  // Đọc bankConfig từ /api/wallet
  useEffect(() => {
    if (isOpen && !propBankConfig && !internalBankConfig) {
      fetch('/api/wallet')
        .then((res) => res.json())
        .then((data) => {
          if (data?.bankInfo) {
            setInternalBankConfig(data.bankInfo);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, propBankConfig, internalBankConfig]);

  // Cập nhật mốc số dư ban đầu khi mở modal
  useEffect(() => {
    if (isOpen) {
      initialBalanceRef.current = activeUser?.wallet_balance ?? currentBalance ?? 0;
      setIsSuccess(false);
    }
  }, [isOpen, activeUser?.wallet_balance, currentBalance]);

  // Phím ESC & khóa cuộn trang
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Xử lý nạp thành công
  const triggerSuccess = (newBalance: number) => {
    setIsSuccess(true);
    try {
      const audio = new Audio('/sounds/coins.mp3');
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch {}

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    if (onSuccess) {
      onSuccess(newBalance);
    }

    setTimeout(() => {
      onClose();
    }, 2800);
  };

  // Socket lắng nghe biến động số dư
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
      if (data?.balance !== undefined) {
        triggerSuccess(data.balance);
      }
    };

    socket.on('wallet_update', handleUpdate);

    return () => {
      socket.off('wallet_update', handleUpdate);
      socket.off('connect', joinRoom);
    };
  }, [isOpen, activeUser?._id]);

  // Polling dự phòng mỗi 3 giây khi modal đang mở
  useEffect(() => {
    if (!isOpen || isSuccess || !activeUser?._id) return;

    const interval = setInterval(async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const res = await fetch('/api/wallet', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const currentBal = Number(data.balance ?? data.wallet_balance ?? 0);
          if (currentBal > initialBalanceRef.current) {
            triggerSuccess(currentBal);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, isSuccess, activeUser?._id]);

  // Thông tin ngân hàng & QR
  const bankId = activeBankConfig?.bankId || activeBankConfig?.bankName || 'MB';
  const bankName = activeBankConfig?.bankName || activeBankConfig?.bankId || 'MB Bank';
  const accountNo = activeBankConfig?.accountNo || activeBankConfig?.accountNumber || '0963032402';
  const accountName = activeBankConfig?.accountName || activeBankConfig?.accountHolder || 'LEORANK';
  const cleanUsername = (activeUser?.username || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const transferContent = cleanUsername ? `ZT${cleanUsername}` : 'ZT';
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(accountNo)}&bank=${encodeURIComponent(bankId)}&amount=${targetAmount}&des=${encodeURIComponent(transferContent)}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenWalletTab = () => {
    if (typeof window !== 'undefined') {
      window.open('/wallet?tab=deposit', '_blank');
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingBalance(true);
    toast.info('Đang kiểm tra biến động số dư...');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const currentBal = Number(data.balance ?? data.wallet_balance ?? 0);
        if (currentBal > initialBalanceRef.current) {
          triggerSuccess(currentBal);
          return;
        }
      }
      toast.warning('Chưa ghi nhận biến động mới. Vui lòng đợi thêm vài giây!');
    } catch {
      toast.error('Lỗi khi kiểm tra số dư');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop tối mờ mượt mà */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-2xl bg-[#0c0d14]/95 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.85)] text-white overflow-hidden z-10 my-auto"
          >
            {/* Ambient Lighting Gradients */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            {isSuccess ? (
              /* MÀN HÌNH THÀNH CÔNG */
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-in zoom-in" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Nạp Tiền Thành Công!</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    Số dư ví của bạn đã được cập nhật. Đơn hàng đang được sẵn sàng kích hoạt.
                  </p>
                </div>
                <div className="text-2xl font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
                  +{targetAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            ) : (
              /* NỘI DUNG CHÍNH (ALL-IN-ONE VIETQR DEPOSIT) */
              <div>
                {/* Header Tiêu Đề */}
                <div className="flex items-center gap-3 mb-5 pr-8">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
                    <div className="w-full h-full bg-[#0c0d14] rounded-[14px] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                        Nạp Tiền & Thanh Toán
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
                        Tự động 24/7
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Quét mã VietQR bằng app ngân hàng để cộng tiền và xác nhận đơn ngay lập tức.
                    </p>
                  </div>
                </div>

                {/* Grid Bố Cục 2 Cột Trên PC (Cột 1: Thông tin đơn; Cột 2: QR & Chuyển khoản) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* CỘT TRÁI: Chi tiết tài chính & Hướng dẫn */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                    {/* Thẻ Chi Tiết Tài Chính */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Đơn hàng:</span>
                        <span className="font-semibold text-zinc-200 truncate max-w-[130px] text-right">
                          {orderTitle || 'Dịch vụ LeoRank'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Cần thanh toán:</span>
                        <span className="font-mono text-zinc-300 font-semibold">
                          {requiredAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>Số dư ví hiện có:</span>
                        <span className="font-mono text-zinc-400">
                          {currentBalance.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      <div className="h-px bg-zinc-800 my-1" />

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles size={13} className="text-cyan-400" />
                          Cần nạp bổ sung:
                        </span>
                        <span className="font-mono text-base font-black text-cyan-400">
                          {targetAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Hướng Dẫn 3 Bước Tinh Gọn */}
                    <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-start gap-2 text-zinc-300">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>Mở App ngân hàng quét mã QR bên cạnh.</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span>Giữ nguyên nội dung chuyển khoản để nhận tự động.</span>
                      </div>
                      <div className="flex items-start gap-2 text-zinc-300">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <span>Cộng tiền tức thì & đơn cày không bị mất cấu hình.</span>
                      </div>
                    </div>

                    {/* Nút Phụ Nạp Tab Mới */}
                    <button
                      type="button"
                      onClick={handleOpenWalletTab}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={13} className="text-blue-400" />
                      <span>Mở trang Ví nạp tiền ở Tab mới</span>
                    </button>
                  </div>

                  {/* CỘT PHẢI: Khung VietQR Code & Thông Tin Sao Chép */}
                  <div className="md:col-span-7 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 flex flex-col items-center">
                    {/* Ảnh VietQR Code */}
                    <div className="relative p-2.5 bg-white rounded-2xl shadow-xl shadow-black/40 mb-3.5 max-w-[190px] sm:max-w-[210px] w-full aspect-square flex items-center justify-center">
                      <img
                        src={qrUrl}
                        alt="VietQR Chuyển khoản nạp tiền"
                        className="w-full h-full object-contain"
                        loading="eager"
                      />
                    </div>

                    {/* Live Status Pulse */}
                    <div className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Đang chờ chuyển khoản (Tự động nhận diện)</span>
                    </div>

                    {/* 3 Trường Thông Tin Có Nút Copy */}
                    <div className="w-full space-y-2 text-xs">
                      {/* Ngân hàng */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                        <span className="text-zinc-400">Ngân hàng:</span>
                        <span className="font-bold text-white">{bankName}</span>
                      </div>

                      {/* Số tài khoản */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                        <span className="text-zinc-400">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-cyan-400 tracking-wider">
                            {accountNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(accountNo, 'Số tài khoản')}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Sao chép STK"
                          >
                            {copiedField === 'Số tài khoản' ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Nội dung chuyển khoản */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/80 border border-cyan-500/30">
                        <span className="text-zinc-400">Nội dung:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-400 tracking-wider">
                            {transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(transferContent, 'Nội dung CK')}
                            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedField === 'Nội dung CK' ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nút Refresh kiểm tra thủ công */}
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={isCheckingBalance}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={isCheckingBalance ? 'animate-spin' : ''} />
                        <span>Đã chuyển tiền nhưng chưa thấy cập nhật? Bấm vào đây</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Bảo Chứng */}
                <div className="mt-5 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                    <span>Hệ thống Escrow bảo chứng 100% hoàn tiền nếu có tranh chấp</span>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
