'use client';

import { useState, useRef } from 'react';
import { Send, Smile, Plus, DollarSign, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ChatInputProps {
  onSend: (content: string, type?: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  onTyping?: (isTyping: boolean) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
}

const COMMANDS = [
  { cmd: '/tip', desc: 'Gửi tiền tip (VD: /tip 50000)' },
  { cmd: '/infobooster', desc: 'Xem thông tin Booster' },
  { cmd: '/img', desc: 'Gửi ảnh (VD: /img https://i.imgur.com/...)' },
  { cmd: '/rate', desc: 'Đánh giá (VD: /rate 5)' },
  { cmd: '/order', desc: 'Thông tin đơn hàng' },
  { cmd: '/matchlol', desc: 'Kết quả trận đấu (Booster only)' },
  { cmd: '/live', desc: 'Trạng thái Booster (Booster only)' },
];

export default function ChatInput({ onSend, disabled, onTyping, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);
    
    // Command check
    if (val.startsWith('/') || showCommands) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }

    // Typing indicator
    if (onTyping) {
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    }
  };

  const handleSelectCommand = (cmd: string) => {
    setMessage(cmd + ' ');
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    setSending(true);
    try {
      // Simple Slash Command Parser
      if (message.startsWith('/')) {
        const parts = message.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (cmd === '/tip') {
            // Logic xử lý tip sẽ phức tạp hơn, ở đây gửi text trước
            // Thực tế nên gọi API tip riêng rồi gửi message thông báo
            await onSend(message, 'TEXT');
        } else {
            // Các lệnh khác (bao gồm /img) gửi raw text lên server để backend xử lý
            await onSend(message, 'TEXT'); 
        }
      } else {
        await onSend(message, 'TEXT');
      }
      setMessage('');
      if (onTyping) onTyping(false);
      setShowCommands(false); // Close menu after send
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
    // FIX: Backend chỉ parse "/tip amount", không cần @booster
    await onSend(`/tip ${amount}`, 'TEXT');
    setShowTipModal(false);
    setTipAmount('');
  };

  return (
    <div className="relative p-4 bg-zinc-900 border-t border-zinc-800 rounded-b-3xl">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg mb-2 border-l-2 border-blue-500">
            <div className="text-xs">
                <div className="font-bold text-blue-400">Đang trả lời {replyingTo.sender_id?.username}</div>
                <div className="text-zinc-400 truncate max-w-[200px]">{replyingTo.content}</div>
            </div>
            <button onClick={onCancelReply}><X size={14} className="text-zinc-500 hover:text-white"/></button>
        </div>
      )}

      {/* Command Suggestions */}
      {showCommands && (
        <div className="absolute bottom-full left-4 mb-2 w-full max-w-[300px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-bottom-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="p-2 text-xs font-bold text-zinc-500 uppercase bg-zinc-950">Slash Commands</div>
          {COMMANDS.filter(c => c.cmd.startsWith(message.split(' ')[0])).map((c) => (
            <button
              key={c.cmd}
              onClick={() => handleSelectCommand(c.cmd)}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex justify-between"
            >
              <span className="font-mono font-bold">{c.cmd}</span>
              <span className="text-xs opacity-70">{c.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 mb-2 z-[60]">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={300} height={400} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex items-center gap-1">
            <button 
                type="button" 
                onClick={() => setShowCommands(!showCommands)}
                className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded-full transition-colors"
                title="Mở menu lệnh"
            >
                <Plus size={20} />
            </button>
            <button 
                type="button" 
                onClick={() => setShowTipModal(true)}
                className="p-2 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 rounded-full transition-colors" 
                title="Gửi Tip"
            >
                <DollarSign size={20} />
            </button>
            <button 
                type="button" 
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 text-zinc-400 hover:text-yellow-500 hover:bg-zinc-800 rounded-full transition-colors"
                title="Chọn Emoji"
            >
                <Smile size={20} />
            </button>
        </div>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            placeholder="Nhập tin nhắn hoặc gõ / để dùng lệnh..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-full px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
            disabled={disabled || sending}
          />
        </div>

        <button
            type="submit"
            disabled={!message.trim() || disabled || sending}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
        >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </form>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="absolute bottom-full left-0 w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl mb-2 z-[70] animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-500" /> Gửi tiền Tip
                </h3>
                <button onClick={() => setShowTipModal(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
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
                <button onClick={handleSendTip} className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm transition-colors">
                    Xác nhận gửi
                </button>
            </div>
        </div>
      )}
    </div>
  );
}