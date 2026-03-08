'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Plus, DollarSign, Loader2, X, Image as ImageIcon, Command, ChevronUp } from 'lucide-react';
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
  const [showTools, setShowTools] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // @ts-ignore
      handleSubmit(e);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    // setShowEmoji(false); // Giữ mở để spam emoji
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
    // FIX: Backend chỉ parse "/tip amount", không cần @booster
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
        } catch (e) { toast.error('Lỗi tải ảnh', { id: uploadToast }); }
    }
  };

  return (
    <div className="relative p-4 bg-zinc-900 border-t border-zinc-800 rounded-b-3xl">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg mb-2 border-l-2 border-blue-500 animate-in slide-in-from-bottom-2">
            <div className="text-xs">
                <div className="font-bold text-blue-400">Đang trả lời {replyingTo.sender_id?.username}</div>
                <div className="text-zinc-400 truncate max-w-[200px]">{replyingTo.content}</div>
            </div>
            <button onClick={onCancelReply}><X size={14} className="text-zinc-500 hover:text-white"/></button>
        </div>
      )}

      {/* Tools Menu (Popup) */}
      {showTools && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in slide-in-from-bottom-2">
          <div className="p-2 grid gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors w-full text-left">
                <ImageIcon size={18} className="text-blue-400" /> 
                <span>Gửi ảnh</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
            </button>
            <button onClick={() => setShowTipModal(true)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors w-full text-left">
                <DollarSign size={18} className="text-yellow-400" /> 
                <span>Gửi tiền Tip</span>
            </button>
            <button onClick={() => handleSelectCommand('/order')} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors w-full text-left">
                <Command size={18} className="text-purple-400" /> 
                <span>Thông tin đơn hàng</span>
            </button>
          </div>
          
          {/* Slash Commands List */}
          <div className="bg-zinc-950 px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase border-t border-zinc-800">Lệnh nhanh</div>
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
        <div className="absolute bottom-full right-0 mb-2 z-[60] shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom-right">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={300} height={400} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Tools Button */}
        <button 
            type="button"
            onClick={() => setShowTools(!showTools)}
            className={`p-3 rounded-full transition-all shrink-0 ${showTools ? 'bg-zinc-800 text-white rotate-45' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="Mở rộng"
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
            onClick={() => setShowEmoji(!showEmoji)}
            className={`p-2 rounded-xl transition-colors shrink-0 mb-0.5 mr-0.5 ${showEmoji ? 'text-yellow-400 bg-zinc-700' : 'text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700/50'}`}
            title="Emoji"
          >
            <Smile size={20} />
          </button>
        </div>

        <button
            type="submit"
            disabled={!message.trim() || disabled || sending}
            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 shrink-0 mb-0.5"
        >
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={message.trim() ? 'ml-0.5' : ''} />}
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