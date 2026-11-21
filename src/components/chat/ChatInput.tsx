'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  Plus,
  DollarSign,
  Loader2,
  X,
  Image as ImageIcon,
  FileText,
  Gamepad2,
  Coffee,
  Trophy,
  KeyRound,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';

export type OrderParticipantRole = 'CUSTOMER' | 'BOOSTER' | 'ADMIN';
export type BoosterStatusCode = 'PLAYING' | 'BREAK' | 'ALMOST_DONE' | 'NEED_LOGIN';

export interface OrderChatCapabilities {
  canSendImage: boolean;
  canViewOrderInfo: boolean;
  canSendTip: boolean;
  canSendBoosterStatus: boolean;
  canSendProgressReport: boolean;
}

interface ChatInputProps {
  onSend: (content: string, type?: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  participantRole?: OrderParticipantRole;
  capabilities?: OrderChatCapabilities;
  onSendTip?: (amount: number, note?: string) => Promise<boolean>;
  onSendOrderInfo?: () => Promise<void>;
  onSendBoosterStatus?: (statusCode: BoosterStatusCode, note?: string) => Promise<boolean>;
  onSendProgressReport?: (note?: string) => Promise<void>;
}

const POPUP_MOTION = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.96 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
};

const QUICK_TIP_AMOUNTS = [20000, 50000, 100000, 200000];

const BOOSTER_STATUS_OPTIONS: Array<{
  code: BoosterStatusCode;
  label: string;
  desc: string;
  icon: any;
  color: string;
}> = [
  {
    code: 'PLAYING',
    label: 'Đang vào game / Đang cày',
    desc: 'Báo khách không đăng nhập tránh văng trận',
    icon: Gamepad2,
    color: 'text-emerald-400',
  },
  {
    code: 'BREAK',
    label: 'Tạm nghỉ ngắn',
    desc: 'Thông báo tạm dừng ít phút rồi cày tiếp',
    icon: Coffee,
    color: 'text-amber-400',
  },
  {
    code: 'ALMOST_DONE',
    label: 'Sắp hoàn thành mục tiêu',
    desc: 'Chuẩn bị bàn giao tài khoản cho khách',
    icon: Trophy,
    color: 'text-cyan-400',
  },
  {
    code: 'NEED_LOGIN',
    label: 'Cần hỗ trợ đăng nhập / OTP',
    desc: 'Nhờ khách gửi mã xác thực 2FA / đổi mật khẩu',
    icon: KeyRound,
    color: 'text-rose-400',
  },
];

export default function ChatInput({
  onSend,
  disabled,
  onTyping,
  replyingTo,
  onCancelReply,
  participantRole,
  capabilities,
  onSendTip,
  onSendOrderInfo,
  onSendBoosterStatus,
  onSendProgressReport,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Customer-only Tip modal state
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [tipNote, setTipNote] = useState('');

  // Booster-only Status modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BoosterStatusCode>('PLAYING');
  const [statusNote, setStatusNote] = useState('');

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSendTip = capabilities ? capabilities.canSendTip : participantRole === 'CUSTOMER';
  const canSendBoosterStatus = capabilities
    ? capabilities.canSendBoosterStatus
    : participantRole === 'BOOSTER';
  const canSendProgressReport = capabilities
    ? capabilities.canSendProgressReport
    : participantRole === 'BOOSTER';

  // Tự động đóng menu công cụ / emoji / modal khi bấm ra ngoài hoặc nhấn ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTools(false);
        setShowEmoji(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTools(false);
        setShowEmoji(false);
        setShowTipModal(false);
        setShowStatusModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    if (!message.trim() || disabled || sending) return;

    setSending(true);
    try {
      await onSend(message, 'TEXT');
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      if (onTyping) onTyping(false);
      setShowEmoji(false);
      setShowTools(false);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleSendTipSubmit = async () => {
    const amount = parseInt(tipAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount < 10000) {
      toast.error('Số tiền tip tối thiểu 10.000đ');
      return;
    }

    setSubmittingAction(true);
    try {
      let ok = false;
      if (onSendTip) {
        ok = await onSendTip(amount, tipNote.trim() || undefined);
      } else {
        await onSend(`/tip ${amount}${tipNote.trim() ? ' ' + tipNote.trim() : ''}`, 'TEXT');
        ok = true;
      }
      if (ok) {
        setShowTipModal(false);
        setTipAmount('');
        setTipNote('');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendStatusSubmit = async () => {
    if (!onSendBoosterStatus) return;
    setSubmittingAction(true);
    try {
      const ok = await onSendBoosterStatus(selectedStatus, statusNote.trim() || undefined);
      if (ok) {
        setShowStatusModal(false);
        setStatusNote('');
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOrderInfoClick = async () => {
    setShowTools(false);
    if (onSendOrderInfo) {
      setSubmittingAction(true);
      try {
        await onSendOrderInfo();
      } finally {
        setSubmittingAction(false);
      }
    } else {
      await onSend('/order', 'TEXT');
    }
  };

  const handleProgressReportClick = async () => {
    setShowTools(false);
    if (onSendProgressReport) {
      setSubmittingAction(true);
      try {
        await onSendProgressReport();
      } finally {
        setSubmittingAction(false);
      }
    } else {
      await onSend('/progress', 'TEXT');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ file ảnh');
      e.target.value = '';
      return;
    }

    setShowTools(false);
    setUploadingImage(true);
    const uploadToast = toast.loading('Đang tải ảnh...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat');
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Upload failed');
      }
      const { url } = await res.json();
      await onSend(url, 'IMAGE');
      try {
        new Audio('/sounds/message.mp3').play().catch(() => {});
      } catch (e) {}
      toast.success('Đã gửi ảnh thành công!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi tải ảnh', { id: uploadToast });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const roleHeaderLabel =
    participantRole === 'BOOSTER'
      ? 'Công cụ Tuyển thủ'
      : participantRole === 'CUSTOMER'
        ? 'Công cụ Khách hàng'
        : 'Tiện ích phòng chat';

  return (
    <div ref={containerRef} className="relative p-3 bg-zinc-900/95 border-t border-zinc-800/90 rounded-b-2xl">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        disabled={uploadingImage}
        onChange={handleFileSelect}
      />

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex items-center justify-between gap-2 bg-zinc-800/60 p-2 rounded-xl mb-2 border-l-2 border-blue-500"
          >
            <div className="flex items-center gap-2 min-w-0 text-xs">
              {replyingTo.type === 'IMAGE' && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={replyingTo.content}
                  alt="Reply preview"
                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-700"
                />
              )}
              <div className="min-w-0">
                <div className="font-bold text-blue-400 truncate">
                  Đang trả lời {replyingTo.sender_id?.username}
                </div>
                <div className="text-zinc-400 truncate max-w-[200px]">
                  {replyingTo.type === 'IMAGE' ? '📷 Hình ảnh' : replyingTo.content}
                </div>
              </div>
            </div>
            <button type="button" onClick={onCancelReply} className="p-1 cursor-pointer shrink-0">
              <X size={14} className="text-zinc-500 hover:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tools Menu (Phân chia rõ chức năng theo vai trò Customer vs Booster) */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full left-3 mb-2 w-60 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] origin-bottom-left"
          >
            <div className="px-3 py-1.5 bg-zinc-950/70 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {roleHeaderLabel}
            </div>
            <div className="p-1.5 grid gap-1">
              {/* Dùng chung: Gửi ảnh */}
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer disabled:opacity-50"
              >
                <ImageIcon size={17} className="text-blue-400 shrink-0" />
                <div>
                  <div className="font-medium text-[13px]">Gửi ảnh</div>
                  <div className="text-[10px] text-zinc-500">Ảnh màn hình, trao đổi trong chat</div>
                </div>
              </button>

              {/* Chỉ Customer: Gửi tiền Tip cho Booster */}
              {canSendTip && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTools(false);
                    setShowStatusModal(false);
                    setShowTipModal(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer"
                >
                  <DollarSign size={17} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="font-medium text-[13px]">Gửi tiền Tip</div>
                    <div className="text-[10px] text-zinc-500">Thưởng trực tiếp cho Booster</div>
                  </div>
                </button>
              )}

              {/* Chỉ Booster: Cập nhật trạng thái cày */}
              {canSendBoosterStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTools(false);
                    setShowTipModal(false);
                    setShowStatusModal(true);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer"
                >
                  <Gamepad2 size={17} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-medium text-[13px]">Cập nhật trạng thái cày</div>
                    <div className="text-[10px] text-zinc-500">Báo đang trận, tạm nghỉ, cần OTP...</div>
                  </div>
                </button>
              )}

              {/* Chỉ Booster: Gửi báo cáo tiến độ trận đấu */}
              {canSendProgressReport && (
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleProgressReportClick}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer disabled:opacity-50"
                >
                  <BarChart3 size={17} className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-medium text-[13px]">Gửi báo cáo tiến độ</div>
                    <div className="text-[10px] text-zinc-500">Tổng hợp Win/Loss & Rank hiện tại</div>
                  </div>
                </button>
              )}

              {/* Dùng chung: Thông tin đơn hàng */}
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleOrderInfoClick}
                className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer disabled:opacity-50"
              >
                <FileText size={17} className="text-purple-400 shrink-0" />
                <div>
                  <div className="font-medium text-[13px]">Thông tin đơn hàng</div>
                  <div className="text-[10px] text-zinc-500">Gửi nhanh tóm tắt đơn vào chat</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full right-0 mb-2 z-[60] shadow-2xl rounded-xl overflow-hidden origin-bottom-right"
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={300} height={380} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            const next = !showTools;
            setShowTools(next);
            if (next) {
              setShowEmoji(false);
              setShowTipModal(false);
              setShowStatusModal(false);
            }
          }}
          className={`p-2.5 rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
            showTools ? 'bg-zinc-800 text-white rotate-45' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title={roleHeaderLabel}
          aria-expanded={showTools}
        >
          {uploadingImage ? <Loader2 size={22} className="animate-spin text-blue-400" /> : <Plus size={22} />}
        </button>

        <div className="flex-1 bg-zinc-800/50 rounded-2xl flex items-end p-1 relative border border-zinc-700/50 focus-within:border-blue-500/50 focus-within:bg-zinc-800 transition-all">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="w-full bg-transparent border-none text-white px-3 py-2 resize-none overflow-hidden min-h-[38px] max-h-[120px] text-sm leading-relaxed scrollbar-hide placeholder:text-zinc-500 focus:outline-none focus:ring-0"
            disabled={disabled || sending}
            rows={1}
            style={{ minHeight: '38px' }}
          />

          <button
            type="button"
            onClick={() => {
              const next = !showEmoji;
              setShowEmoji(next);
              if (next) {
                setShowTools(false);
                setShowTipModal(false);
                setShowStatusModal(false);
              }
            }}
            className={`p-2 rounded-xl transition-colors shrink-0 mb-0.5 mr-0.5 cursor-pointer ${
              showEmoji ? 'text-yellow-400 bg-zinc-700' : 'text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700/50'
            }`}
            title="Emoji"
            aria-expanded={showEmoji}
          >
            <Smile size={19} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled || sending}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 shrink-0 mb-0.5 cursor-pointer"
        >
          {sending ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} className={message.trim() ? 'ml-0.5' : ''} />}
        </button>
      </form>

      {/* Customer-only Tip Modal */}
      <AnimatePresence>
        {showTipModal && canSendTip && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full left-0 w-full bg-zinc-900/95 backdrop-blur-xl border border-amber-500/30 rounded-xl p-4 shadow-2xl mb-2 z-[70] origin-bottom"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Gửi tiền Tip cho Booster
              </h3>
              <button
                type="button"
                onClick={() => setShowTipModal(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Quick amount chips */}
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK_TIP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTipAmount(String(amt))}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      Number(tipAmount) === amt
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {amt / 1000}k
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="Nhập số tiền (tối thiểu 10.000)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-3 pr-12 py-2 text-sm text-white outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-xs text-zinc-500 font-bold">VNĐ</span>
              </div>

              <input
                type="text"
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
                maxLength={150}
                placeholder="Lời nhắn cảm ơn (không bắt buộc)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500 placeholder:text-zinc-600"
              />

              <p className="text-[10px] text-zinc-500">
                Tiền Tip sẽ được trừ trực tiếp từ số dư ví của bạn và chuyển 100% cho Tuyển thủ.
              </p>

              <button
                type="button"
                disabled={submittingAction}
                onClick={handleSendTipSubmit}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Xác nhận gửi Tip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booster-only Quick Status Modal */}
      <AnimatePresence>
        {showStatusModal && canSendBoosterStatus && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full left-0 w-full bg-zinc-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-xl p-4 shadow-2xl mb-2 z-[70] origin-bottom"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-emerald-400" /> Cập nhật trạng thái cày
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid gap-1.5">
                {BOOSTER_STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = selectedStatus === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setSelectedStatus(opt.code)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <Icon size={16} className={`${opt.color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight">{opt.label}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{opt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                maxLength={200}
                placeholder="Ghi chú thêm cho khách hàng (không bắt buộc)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-zinc-600"
              />

              <button
                type="button"
                disabled={submittingAction}
                onClick={handleSendStatusSubmit}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Gửi trạng thái cho khách
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
