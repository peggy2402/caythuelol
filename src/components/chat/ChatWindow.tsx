'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Loader2, ArrowDown, UploadCloud, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import { useLanguage } from '@/lib/i18n';
import { socket } from '@/lib/socket';

interface ChatWindowProps {
  orderId: string;
  currentUser: any;
  title?: string;
  initialMessages?: any[];
}

export default function ChatWindow({ orderId, currentUser, title, initialMessages = [] }: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<any[]>(initialMessages);
  
  // Refs & State cho Scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // FIX: Đếm số tin nhắn chưa đọc

  const { t } = useLanguage();
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false); // State cho hiệu ứng kéo thả
  const [isSearching, setIsSearching] = useState(false); // State bật/tắt tìm kiếm
  const [searchTerm, setSearchTerm] = useState(''); // Từ khóa tìm kiếm

  // Ref để theo dõi trạng thái mở/đóng trong useEffect của socket mà không cần re-render
  const stateRef = useRef({ isOpen, isMinimized });
  useEffect(() => {
    stateRef.current = { isOpen, isMinimized };
  }, [isOpen, isMinimized]);

  // Xử lý sự kiện cuộn để hiện nút "Về dưới cùng"
  const handleScroll = () => {
    if (!scrollViewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollViewportRef.current;
    // Nếu cách đáy quá 100px thì hiện nút
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Lọc tin nhắn theo từ khóa
  const filteredMessages = useMemo(() => {
    if (!searchTerm.trim()) return messages;
    return messages.filter(msg => 
      msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Tránh bị tắt overlay khi di chuột vào các element con
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Cần thiết để sự kiện onDrop hoạt động
    e.stopPropagation();
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ hỗ trợ gửi file ảnh.');
        return;
      }

      const uploadToast = toast.loading('Đang tải ảnh lên...');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Tải ảnh thất bại');
        const { url } = await res.json();
        await handleSendMessage(url, 'IMAGE');
        toast.success('Đã gửi ảnh!', { id: uploadToast });
      } catch (error: any) { toast.error(`Không thể gửi ảnh: ${error.message}`, { id: uploadToast }); }
    }
  };

  // Effect 1: Cuộn xuống đáy NGAY LẬP TỨC khi mở lần đầu (Fix lỗi cuộn từ trên xuống)
  useEffect(() => {
    if (isOpen && !isMinimized && isFirstLoad && messages.length > 0) {
        scrollToBottom('auto'); // 'auto' = instant jump
        setIsFirstLoad(false);
    }
  }, [isOpen, isMinimized, messages, isFirstLoad]);

  // Effect 2: Cuộn mượt khi có tin nhắn MỚI
  useEffect(() => {
    if (isFirstLoad || !isOpen || isMinimized) return;

    const lastMsg = messages[messages.length - 1];
    const isMe = lastMsg?.sender_id?._id === currentUser?._id || lastMsg?.sender_id === currentUser?._id;

    // Nếu là mình gửi -> Luôn cuộn xuống
    // Nếu người khác gửi -> Chỉ cuộn nếu đang ở gần đáy (để không làm phiền khi đang đọc tin cũ)
    if (isMe || !showScrollButton) {
        scrollToBottom('smooth');
    } else {
        // Có thể thêm toast thông báo tin nhắn mới ở đây nếu muốn
    }
  }, [messages, isOpen, isMinimized, currentUser?._id]); // FIX: Bỏ isFirstLoad khỏi dependency để tránh chạy lại khi state này thay đổi

  // Socket & Polling
  useEffect(() => {
    // Socket Setup
    if (!socket.connected) socket.connect();
    socket.emit('join_order_room', orderId);

    const handleNewMessage = (msg: any) => {
        setMessages(prev => [...prev, msg]);
        
        // Nếu đang đóng hoặc thu nhỏ -> Bật thông báo chưa đọc
        if (!stateRef.current.isOpen || stateRef.current.isMinimized) {
            setUnreadCount(prev => prev + 1); // FIX: Tăng số lượng tin nhắn chưa đọc
            try {
                new Audio('/sounds/message.mp3').play().catch(() => {});
            } catch (e) {}
        }
    };

    // Xử lý sự kiện "Đã xem" từ người khác
    const handleMessageRead = (data: { userId: string, orderId: string }) => {
        if (data.orderId === orderId && data.userId !== currentUser._id) {
            setMessages(prev => prev.map(msg => {
                // Nếu tin nhắn là của mình và chưa có người này trong readBy -> Thêm vào
                if (msg.sender_id?._id === currentUser._id && !msg.readBy?.includes(data.userId)) {
                    return { ...msg, readBy: [...(msg.readBy || []), data.userId] };
                }
                return msg;
            }));
        }
    };

    const handleTyping = (data: { userId: string, isTyping: boolean }) => {
        if (data.userId !== currentUser._id) {
            setIsTyping(data.isTyping);
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTyping);
    socket.on('message_read', handleMessageRead);

    // FIX: Tách hàm fetch ra để gọi được ngay lập tức
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/messages`);
        if (res.ok) {
            const data = await res.json();
            // Cập nhật toàn bộ để đảm bảo đồng bộ (xử lý cả case xóa tin nhắn, react...)
            setMessages(prev => {
                // FIX: Tính toán số lượng tin nhắn chưa đọc dựa trên readBy
                // Nếu đang đóng/minimized -> Cộng dồn tin mới
                // Nếu mới load lần đầu -> Đếm tổng tin chưa đọc
                if (prev.length === 0) {
                    const unread = data.messages.filter((m: any) => m.sender_id?._id !== currentUser?._id && (!m.readBy || !m.readBy.includes(currentUser?._id))).length;
                    setUnreadCount(unread);
                } else if (data.messages.length > prev.length && (!stateRef.current.isOpen || stateRef.current.isMinimized)) {
                     // Chỉ tăng khi có tin mới VÀ đang đóng
                     setUnreadCount(count => count + (data.messages.length - prev.length));
                }
                return data.messages;
            });
        }
      } catch (e) {
        console.error("Fetch messages error:", e);
      }
    };

    // Gọi NGAY LẬP TỨC khi mount (Fix lỗi chờ 5s mới hiện chat)
    fetchMessages();

    // Fallback Polling (Keep for reliability if socket fails)
    const interval = setInterval(fetchMessages, 5000);

    return () => {
        clearInterval(interval);
        socket.off('new_message', handleNewMessage);
        socket.off('typing_status', handleTyping);
        socket.off('message_read', handleMessageRead);
    };
  }, [orderId, currentUser?._id]); // Bỏ isOpen khỏi dependency để socket luôn kết nối

  // Effect: Đánh dấu đã đọc khi mở chat hoặc có tin nhắn mới
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0 && unreadCount > 0) {
        const markRead = async () => {
            try {
                await fetch(`/api/orders/${orderId}/messages/read`, { method: 'POST' });
                socket.emit('mark_read', { orderId, userId: currentUser._id });
                setUnreadCount(0);
            } catch (e) {}
        };
        markRead();
    }
  }, [isOpen, isMinimized, messages.length, unreadCount, orderId, currentUser?._id]);

  const handleSendMessage = async (content: string, type = 'TEXT', metadata = {}) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, metadata, replyToId: replyingTo?._id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, data.message]);
        setReplyingTo(null); // Clear reply after send
        socket.emit('send_message', { room: orderId, message: data.message });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
      try {
        const res = await fetch(`/api/orders/${orderId}/messages/${msgId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emoji })
        });
        if (res.ok) {
            // Optimistic update
            setMessages(prev => prev.map(m => {
                if (m._id === msgId) {
                    const reactions = m.reactions || [];
                    const existingIdx = reactions.findIndex((r: any) => r.userId === currentUser._id && r.emoji === emoji);
                    if (existingIdx > -1) {
                        reactions.splice(existingIdx, 1);
                    } else {
                        reactions.push({ emoji, userId: currentUser._id });
                    }
                    return { ...m, reactions: [...reactions] };
                }
                return m;
            }));
        }
      } catch (e) {
          console.error(e);
      }
  };

  const handleDelete = async (msgId: string) => {
      if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
      try {
         const res = await fetch(`/api/orders/${orderId}/messages/${msgId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            toast.success('Đã thu hồi tin nhắn');
            setMessages(prev => prev.filter(m => m._id !== msgId));
        }
      } catch (e) {
          toast.error('Lỗi khi thu hồi');
      }
  };

  const handleTypingEvent = (isTyping: boolean) => {
      socket.emit('typing', { room: orderId, userId: currentUser._id, isTyping });
  };

  if (!isOpen) return (
      <>
      {/* CSS Animation Shake */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-4deg); }
          75% { transform: translateX(4px) rotate(4deg); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out infinite;
        }
      `}</style>
      <button
        onClick={() => { setIsOpen(true); setIsFirstLoad(true); setUnreadCount(0); }}
        className={`fixed bottom-4 right-4 text-white p-4 rounded-full shadow-2xl z-[60] transition-transform hover:scale-110 ${unreadCount > 0 ? 'bg-red-600 animate-shake' : 'bg-blue-600 hover:bg-blue-500'}`}
      >
          <MessageCircle size={24} />
          {/* Chấm đỏ thông báo */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full px-1 border-2 border-zinc-900 animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
      </button>
      </>
  );

  return (
    <div
        className={`fixed z-[60] flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl transition-all duration-300 ease-in-out
        ${isMinimized 
            ? 'bottom-4 right-4 left-4 sm:left-auto sm:w-72 h-14 rounded-xl' 
            : 'bottom-0 left-0 w-full h-[85dvh] rounded-t-2xl sm:left-auto sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] sm:rounded-xl'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleFileDrop}
    >
      {/* Lớp phủ khi kéo file */}
      {isDraggingOver && !isMinimized && (
        <div className="absolute inset-0 z-20 bg-blue-500/30 border-4 border-dashed border-blue-400 rounded-xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <UploadCloud className="w-16 h-16 text-white" />
          <p className="text-lg font-bold text-white mt-2">Thả ảnh vào đây để gửi</p>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => {
            setIsMinimized(!isMinimized);
            if (isMinimized) setUnreadCount(0); // FIX: Reset đếm khi mở lên
        }}
      >
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 ring-2 ring-zinc-900"></div>
                <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
                <h3 className="font-bold text-white text-sm">{title || t('chatTitle')}</h3>
                {!isMinimized && <p className="text-[10px] text-zinc-400">Đang hoạt động</p>}
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setIsSearching(!isSearching); if(isSearching) setSearchTerm(''); }} className={`p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg ${isSearching ? 'bg-zinc-800 text-white' : ''}`} title="Tìm kiếm tin nhắn">
                <Search size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            {/* FIX: Reset isFirstLoad = true khi đóng để lần sau mở lại sẽ cuộn tức thì (auto) thay vì trượt (smooth) */}
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsFirstLoad(true); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-700 rounded-lg">
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearching && !isMinimized && (
        <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 animate-in slide-in-from-top-2">
            <div className="relative">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm nội dung tin nhắn..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:border-blue-500 outline-none placeholder:text-zinc-600"
                    autoFocus
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Body */}
      {/* FIX: Wrap toàn bộ body (Messages + Input) trong 1 div flex có min-h-0 để tránh bị đẩy input ra ngoài */}
      <div className={`flex-1 flex flex-col min-h-0 bg-zinc-950/50 ${isMinimized ? 'hidden' : 'flex'}`}>
            <div 
                ref={scrollViewportRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent relative"
            >
                {filteredMessages.map((msg, index) => {
                    const isMe = msg.sender_id?._id === currentUser?._id;
                    // Logic gộp tin nhắn: Cùng người gửi + cách nhau dưới 5 phút
                    const prevMsg = filteredMessages[index - 1];
                    const isSequence = prevMsg && prevMsg.sender_id?._id === msg.sender_id?._id && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);

                    return (
                    <MessageItem
                        key={msg._id || index}
                        message={msg}
                        isMe={isMe}
                        isSequence={!!isSequence}
                        onReact={(emoji) => handleReact(msg._id, emoji)}
                        onReply={() => setReplyingTo(msg)}
                        onDelete={() => handleDelete(msg._id)}
                    />
                )})}
                
                {filteredMessages.length === 0 && searchTerm && (
                    <div className="text-center text-zinc-500 text-xs py-4">Không tìm thấy tin nhắn nào khớp với "{searchTerm}"</div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-2 ml-2 mb-2">
                    <div className="flex space-x-1 bg-zinc-800 p-2 rounded-xl rounded-bl-none">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-xs text-zinc-500 italic">Đang nhập...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />

                {/* Nút cuộn xuống dưới */}
                {showScrollButton && (
                    <button 
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg animate-in fade-in zoom-in duration-200 z-10"
                    >
                        <ArrowDown size={16} />
                    </button>
                )}
            </div>
            <ChatInput 
                onSend={handleSendMessage} 
                onTyping={handleTypingEvent}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
      </div>
    </div>
  );
}