'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Plus, DollarSign, Loader2, X, Image as ImageIcon, Command } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatInputProps {
  onSend: (content: string, type?: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
}

const POPUP_MOTION = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.96 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ChatInput({ onSend, disabled, onTyping, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Tự động đóng menu công cụ / emoji khi bấm ra ngoài hoặc nhấn ESC
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

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }

    // Typing indicator
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
    }
  };

  const handleSelectCommand = (cmd: string) => {
    setMessage(cmd + ' ');
    setShowTools(false);
    inputRef.current?.focus();
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
    if (!message.trim() || disabled) return;

    setSending(true);
    try {
      await onSend(message, 'TEXT');
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'; // Reset height
      }
      if (onTyping) onTyping(false);
      setShowEmoji(false);
      setShowTools(false);
    } catch (error) {
      toast.error('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleSendTip = async () => {
    const amount = parseInt(tipAmount.replace(/,/g, ''));
    if (!amount || amount < 10000) {
      toast.error('Số tiền tip tối thiểu 10,000đ');
      return;
    }
    await onSend(`/tip ${amount}`, 'TEXT');
    setShowTipModal(false);
    setTipAmount('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ hỗ trợ file ảnh');
        return;
      }

      const uploadToast = toast.loading('Đang tải ảnh...');
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        await onSend(url, 'IMAGE');
        toast.success('Đã gửi ảnh', { id: uploadToast });
        setShowTools(false);
      } catch (e) {
        toast.error('Lỗi tải ảnh', { id: uploadToast });
      }
    }
  };

  return (
    <div ref={containerRef} className="relative p-4 bg-zinc-900 border-t border-zinc-800 rounded-b-3xl">
      {/* Hidden file input (giữ ngoài AnimatePresence để click chọn ảnh luôn hoạt động ổn định) */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
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
            className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg mb-2 border-l-2 border-blue-500"
          >
            <div className="text-xs">
              <div className="font-bold text-blue-400">Đang trả lời {replyingTo.sender_id?.username}</div>
              <div className="text-zinc-400 truncate max-w-[200px]">{replyingTo.content}</div>
            </div>
            <button type="button" onClick={onCancelReply} className="cursor-pointer">
              <X size={14} className="text-zinc-500 hover:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tools Menu (Popup) — Đã bỏ mục Lệnh nhanh */}
      <AnimatePresence>
        {showTools && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full left-4 mb-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] origin-bottom-left"
          >
            <div className="p-1.5 grid gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer"
              >
                <ImageIcon size={18} className="text-blue-400 shrink-0" />
                <span>Gửi ảnh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTools(false);
                  setShowTipModal(true);
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer"
              >
                <DollarSign size={18} className="text-yellow-400 shrink-0" />
                <span>Gửi tiền Tip</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCommand('/order')}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors w-full text-left cursor-pointer"
              >
                <Command size={18} className="text-purple-400 shrink-0" />
                <span>Thông tin đơn hàng</span>
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
            <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={300} height={400} />
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Tools Button */}
        <button
          type="button"
          onClick={() => {
            const next = !showTools;
            setShowTools(next);
            if (next) setShowEmoji(false);
          }}
          className={`p-3 rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
            showTools ? 'bg-zinc-800 text-white rotate-45' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Mở rộng"
          aria-expanded={showTools}
        >
          <Plus size={24} />
        </button>

        {/* Input Area */}
        <div className="flex-1 bg-zinc-800/50 rounded-2xl flex items-end p-1.5 relative border border-zinc-700/50 focus-within:border-blue-500/50 focus-within:bg-zinc-800 transition-all">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="w-full bg-transparent border-none text-white px-3 py-2 resize-none overflow-hidden min-h-[40px] max-h-[150px] text-sm leading-relaxed scrollbar-hide placeholder:text-zinc-500 focus:outline-none focus:ring-0"
            disabled={disabled || sending}
            rows={1}
            style={{ minHeight: '40px' }}
          />

          {/* Emoji Button inside Input */}
          <button
            type="button"
            onClick={() => {
              const next = !showEmoji;
              setShowEmoji(next);
              if (next) setShowTools(false);
            }}
            className={`p-2 rounded-xl transition-colors shrink-0 mb-0.5 mr-0.5 cursor-pointer ${
              showEmoji ? 'text-yellow-400 bg-zinc-700' : 'text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700/50'
            }`}
            title="Emoji"
            aria-expanded={showEmoji}
          >
            <Smile size={20} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim() || disabled || sending}
          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 shrink-0 mb-0.5 cursor-pointer"
        >
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={message.trim() ? 'ml-0.5' : ''} />}
        </button>
      </form>

      {/* Tip Modal */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            {...POPUP_MOTION}
            className="absolute bottom-full left-0 w-full bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl p-4 shadow-2xl mb-2 z-[70] origin-bottom"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-500" /> Gửi tiền Tip
              </h3>
              <button type="button" onClick={() => setShowTipModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="Nhập số tiền (VD: 50000)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                <span className="absolute right-3 top-2 text-xs text-zinc-500 font-bold">VNĐ</span>
              </div>
              <button
                type="button"
                onClick={handleSendTip}
                className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm transition-colors cursor-pointer"
              >
                Xác nhận gửi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
