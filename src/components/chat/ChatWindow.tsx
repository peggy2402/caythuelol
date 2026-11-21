'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Loader2, ArrowDown, UploadCloud, MessageCircle, Search, User, ChevronUp, ChevronDown, Minus, Square } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import MessageItem from './MessageItem';
import ChatInput, {
  BoosterStatusCode,
  OrderChatCapabilities,
  OrderParticipantRole,
} from './ChatInput';
import { useLanguage } from '@/lib/i18n';
import { socket } from '@/lib/socket';

interface ChatWindowProps {
  orderId: string;
  currentUser: any;
  title?: string;
  initialMessages?: any[];
  partner?: any; // Thông tin người chat cùng
  orderRole?: OrderParticipantRole; // Vai trò thực tế trên đơn hàng (CUSTOMER | BOOSTER | ADMIN)
  trigger?: 'default' | 'side'; // New prop
}

export default function ChatWindow({ orderId, currentUser, title, initialMessages = [], partner, orderRole, trigger = 'default' }: ChatWindowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
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
  const [isPartnerOnline, setIsPartnerOnline] = useState(false); // Trạng thái Online của đối phương
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [participantRole, setParticipantRole] = useState<OrderParticipantRole | undefined>(
    orderRole || (currentUser?.role as OrderParticipantRole | undefined),
  );
  const [capabilities, setCapabilities] = useState<OrderChatCapabilities | undefined>(undefined);

  useEffect(() => {
    if (orderRole) setParticipantRole(orderRole);
  }, [orderRole]);
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
        formData.append('folder', 'chat');

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
    
    // FIX: Đưa logic join room và check online vào hàm để gọi lại khi socket reconnect
    const onConnect = () => {
        socket.emit('join_order_room', orderId);
        if (partner?._id) socket.emit('check_online', partner._id);
    };

    // Gọi ngay nếu đã kết nối
    if (socket.connected) {
        onConnect();
    }
    
    // Lắng nghe sự kiện connect để gọi lại khi mất kết nối và có lại
    socket.on('connect', onConnect);

    const handleNewMessage = (msg: any) => {
        // FIX: Chống trùng lặp tin nhắn (do Optimistic UI hoặc mạng lag)
        setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
        });
        
        // Phát âm thanh nếu tin nhắn đến từ người khác (bất kể đang mở hay đóng chat)
        const isMe = msg.sender_id?._id === currentUser?._id || msg.sender_id === currentUser?._id;
        if (!isMe) {
            try {
                new Audio('/sounds/message.mp3').play().catch(() => {});
            } catch (e) {}

            // Nếu người nhận đang mở khung chat và không thu nhỏ -> Đánh dấu ĐÃ XEM ngay lập tức!
            if (stateRef.current.isOpen && !stateRef.current.isMinimized) {
                try {
                    fetch(`/api/orders/${orderId}/messages/read`, { method: 'POST' });
                    socket.emit('mark_read', { orderId, userId: currentUser?._id });
                } catch (e) {}
            } else {
                // Nếu đang đóng hoặc thu nhỏ -> Đánh dấu ĐÃ NHẬN và tăng unreadCount
                try {
                    fetch(`/api/orders/${orderId}/messages/delivered`, { method: 'POST' });
                    socket.emit('mark_delivered', { orderId, userId: currentUser?._id });
                } catch (e) {}
                setUnreadCount(prev => prev + 1); // FIX: Tăng số lượng tin nhắn chưa đọc
            }
        }
    };

    // Xử lý sự kiện "Đã xem" từ người khác
    const handleMessageRead = (data: { userId: string, orderId: string }) => {
        const isTargetRoom = !data?.orderId || data.orderId === orderId || data.orderId.includes(orderId) || orderId.includes(data.orderId);
        if (isTargetRoom && data?.userId !== currentUser?._id) {
            setMessages(prev => prev.map(msg => {
                const sId = (msg.sender_id?._id || msg.sender_id)?.toString();
                const myId = currentUser?._id?.toString();
                // Nếu tin nhắn là của mình và chưa có người này trong readBy -> Thêm vào
                if (sId === myId && !msg.readBy?.some((id: any) => (id?._id || id)?.toString() === data.userId?.toString())) {
                    return { 
                      ...msg, 
                      readBy: [...(msg.readBy || []), data.userId],
                      deliveredTo: [...(msg.deliveredTo || []), data.userId] 
                    };
                }
                return msg;
            }));
        }
    };

    // Xử lý sự kiện "Đã nhận" từ người khác
    const handleMessageDelivered = (data: { userId: string, orderId: string }) => {
        const isTargetRoom = !data?.orderId || data.orderId === orderId || data.orderId.includes(orderId) || orderId.includes(data.orderId);
        if (isTargetRoom && data?.userId !== currentUser?._id) {
            setMessages(prev => prev.map(msg => {
                const sId = (msg.sender_id?._id || msg.sender_id)?.toString();
                const myId = currentUser?._id?.toString();
                // Nếu tin nhắn là của mình và chưa có người này trong deliveredTo -> Thêm vào
                if (sId === myId && !msg.deliveredTo?.some((id: any) => (id?._id || id)?.toString() === data.userId?.toString())) {
                    return { 
                      ...msg, 
                      deliveredTo: [...(msg.deliveredTo || []), data.userId] 
                    };
                }
                return msg;
            }));
        }
    };

    // Typing indicator logic
    const handleTyping = (data: { userId: string, isTyping: boolean }) => {
        if (data.userId !== currentUser._id) {
            setIsTyping(data.isTyping);
            
            // Auto-hide typing indicator after 3s if no stop event received (safety fallback)
            if (data.isTyping) { /* logic handled by sender's debounce usually, but could add timeout here */ }
        }
    };

    // Lắng nghe sự kiện thu hồi tin nhắn
    const handleMessageDeleted = (data: { messageId: string; orderId?: string }) => {
      if (data?.messageId) {
        setMessages((prev) => prev.filter((m) => m._id !== data.messageId));
      }
    };

    // Lắng nghe sự kiện reaction realtime
    const handleMessageReacted = (data: { messageId: string; reactions: any[] }) => {
      if (data?.messageId && Array.isArray(data.reactions)) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === data.messageId ? { ...m, reactions: data.reactions } : m,
          ),
        );
      }
    };

    // Lắng nghe sự kiện Online/Offline
    const handleUserStatus = (data: { userId: string, status: 'online' | 'offline' }) => {
        if (partner && data.userId === partner._id) {
            setIsPartnerOnline(data.status === 'online');
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reacted', handleMessageReacted);
    socket.on('typing_status', handleTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('user_status', handleUserStatus); // Cần backend emit sự kiện này

    // FIX: Tách hàm fetch ra để gọi được ngay lập tức
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/messages`);
        if (res.ok) {
            const data = await res.json();
            if (data.participantRole) {
              setParticipantRole(data.participantRole);
            }
            if (data.capabilities) {
              setCapabilities(data.capabilities);
            }
            // Cập nhật toàn bộ để đảm bảo đồng bộ (xử lý cả case xóa tin nhắn, react...)
            setMessages(prev => {
                // FIX: Tính toán số lượng tin nhắn chưa đọc dựa trên readBy
                // Nếu đang đóng/minimized -> Cộng dồn tin mới
                // Nếu mới load lần đầu -> Đếm tổng tin chưa đọc
                if (prev.length === 0) {
                    const unread = data.messages.filter((m: any) => (m.sender_id?._id || m.sender_id) !== currentUser?._id && (!m.readBy || !m.readBy.includes(currentUser?._id))).length;
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
        socket.off('message_deleted', handleMessageDeleted);
        socket.off('message_reacted', handleMessageReacted);
        socket.off('typing_status', handleTyping);
        socket.off('message_read', handleMessageRead);
        socket.off('message_delivered', handleMessageDelivered);
        socket.off('user_status', handleUserStatus);
        socket.off('connect', onConnect);
    };
  }, [orderId, currentUser?._id]); // Bỏ isOpen khỏi dependency để socket luôn kết nối

  // Effect: Đánh dấu đã đọc khi mở chat hoặc có tin nhắn mới
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
        const myId = currentUser?._id?.toString();
        const hasUnreadFromPartner = messages.some((m: any) => {
            const sId = (m.sender_id?._id || m.sender_id)?.toString();
            return sId !== myId && (!m.readBy || !m.readBy.some((id: any) => (id?._id || id)?.toString() === myId));
        });

        if (hasUnreadFromPartner || unreadCount > 0) {
            const markRead = async () => {
                try {
                    await fetch(`/api/orders/${orderId}/messages/read`, { method: 'POST' });
                    socket.emit('mark_read', { orderId, userId: currentUser?._id });
                    setUnreadCount(0);
                } catch (e) {}
            };
            markRead();
        }
    }
  }, [isOpen, isMinimized, messages, unreadCount, orderId, currentUser?._id]);

  const appendUniqueMessage = (msg: any) => {
    if (!msg) return;
    setMessages((prev) =>
      prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
    );
  };

  const playMessageSound = () => {
    try {
      new Audio('/sounds/message.mp3').play().catch(() => {});
    } catch (e) {}
  };

  const handleSendMessage = async (content: string, type = 'TEXT', metadata = {}) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type, metadata, replyToId: replyingTo?._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        appendUniqueMessage(data.message);
        setReplyingTo(null); // Clear reply after send
        playMessageSound();
        if (typeof data.newBalance === 'number') {
          window.dispatchEvent(new Event('user-updated'));
        }
      } else {
        toast.error(data?.message || data?.error || 'Không thể gửi tin nhắn');
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối khi gửi tin nhắn');
    }
  };

  // [Customer only] Gửi tiền Tip trực tiếp sang ví Booster
  const handleSendTip = async (amount: number, note?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || data?.error || 'Không thể gửi tiền Tip');
        return false;
      }
      appendUniqueMessage(data.message);
      playMessageSound();
      toast.success(`Đã gửi tặng Tip ${amount.toLocaleString('vi-VN')}đ cho Booster thành công!`);
      window.dispatchEvent(new Event('user-updated'));
      return true;
    } catch {
      toast.error('Lỗi kết nối khi gửi tiền Tip');
      return false;
    }
  };

  // [Customer & Booster] Gửi thẻ thông tin đơn hàng
  const handleSendOrderInfo = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/order-info`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || data?.error || 'Không thể lấy thông tin đơn hàng');
        return;
      }
      appendUniqueMessage(data.message);
      playMessageSound();
      toast.success('Đã gửi thông tin đơn hàng vào phòng chat!');
    } catch {
      toast.error('Lỗi kết nối khi gửi thông tin đơn hàng');
    }
  };

  // [Booster only] Cập nhật trạng thái cày nhanh
  const handleSendBoosterStatus = async (
    statusCode: BoosterStatusCode,
    note?: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/booster-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCode, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || data?.error || 'Không thể gửi trạng thái cày');
        return false;
      }
      appendUniqueMessage(data.message);
      playMessageSound();
      toast.success('Đã gửi cập nhật trạng thái cày cho khách hàng!');
      return true;
    } catch {
      toast.error('Lỗi kết nối khi cập nhật trạng thái');
      return false;
    }
  };

  // [Booster only] Gửi thẻ báo cáo tiến độ trận đấu
  const handleSendProgressReport = async (note?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message || data?.error || 'Không thể gửi báo cáo tiến độ');
        return;
      }
      appendUniqueMessage(data.message);
      playMessageSound();
      toast.success('Đã gửi báo cáo tiến độ trận đấu vào phòng chat!');
    } catch {
      toast.error('Lỗi kết nối khi gửi báo cáo tiến độ');
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
            const data = await res.json();
            setMessages(prev => prev.map(m => {
                if (m._id === msgId) {
                    if (Array.isArray(data?.reactions)) {
                      return { ...m, reactions: data.reactions };
                    }
                    const reactions = [...(m.reactions || [])];
                    const existingIdx = reactions.findIndex((r: any) => r.userId === currentUser._id && r.emoji === emoji);
                    if (existingIdx > -1) {
                        reactions.splice(existingIdx, 1);
                    } else {
                        reactions.push({ emoji, userId: currentUser._id });
                    }
                    return { ...m, reactions };
                }
                return m;
            }));
        }
      } catch (e) {
          console.error(e);
      }
  };

  const handleDelete = (msgId: string) => {
    setPendingDeleteId(msgId);
  };

  const confirmDeleteMessage = async () => {
    if (!pendingDeleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages/${pendingDeleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Đã thu hồi tin nhắn');
        setMessages((prev) => prev.filter((m) => m._id !== pendingDeleteId));
        setPendingDeleteId(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData?.message || 'Không thể thu hồi tin nhắn');
      }
    } catch {
      toast.error('Lỗi khi thu hồi tin nhắn');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTypingEvent = (isTyping: boolean) => {
      socket.emit('typing', { room: orderId, userId: currentUser._id, isTyping }); // Emit typing event
  };

    // Render Floating Button khi đóng chat
    if (!isOpen) {
    return (
        <>
        {/* CSS Animation Shake */}
        <style jsx global>{`
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
            onClick={() => {
            setIsOpen(true);
            setIsFirstLoad(true);
            setUnreadCount(0);
            }}
            className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 text-white p-3.5 sm:p-4 rounded-full shadow-2xl z-[60] transition-all duration-300 hover:scale-105 active:scale-95 group ${
            unreadCount > 0
                ? "bg-red-600 animate-shake shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            }`}
            title="Mở kênh chat với Booster"
        >
            {/* hiệu ứng glow */}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-30 duration-1000"></div>

            <MessageCircle size={24} className="sm:w-7 sm:h-7" />

            {/* Badge thông báo */}
            {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full px-1 border-2 border-zinc-900">
                {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            )}
        </button>
        </>
    );
    }

  return (
    <>
    <div
        className={`fixed z-[60] flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 ease-in-out
        ${isMinimized
            ? 'bottom-24 right-4 sm:bottom-6 sm:right-6 w-auto min-w-[210px] max-w-[300px] h-12 rounded-full cursor-pointer hover:border-blue-500/40 hover:bg-zinc-850 shadow-blue-500/10'
            : isMaximized
            ? 'inset-2 sm:inset-6 rounded-2xl'
            : 'bottom-24 right-3 left-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[380px] h-[65vh] sm:h-[500px] rounded-2xl border'}
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
        className={`flex items-center justify-between p-3 border-zinc-800 transition-colors h-12 sm:h-auto ${
          isMinimized
            ? 'rounded-full px-3.5 py-1.5 h-full bg-transparent border-none'
            : 'border-b bg-zinc-900/60 rounded-t-2xl cursor-pointer hover:bg-zinc-800/80'
        }`}
        onClick={() => {
            setIsMinimized(!isMinimized);
            if (isMinimized) setUnreadCount(0); // FIX: Reset đếm khi mở lên
        }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
            <div className="relative shrink-0">
                {/* Hiển thị Avatar Partner nếu có, ngược lại dùng icon mặc định */}
                {partner?.profile?.avatar || partner?.avatar ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800">
                        <Image src={partner.profile.avatar || partner.avatar} alt={partner.username} width={32} height={32} className="object-cover w-full h-full" />
                    </div>
                ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <User className="w-4 h-4 text-zinc-400" />
                    </div>
                )}
                
                {/* Chấm xanh Online */}
                {isPartnerOnline && <div className="w-2.5 h-2.5 bg-green-500 rounded-full absolute bottom-0 right-0 ring-2 ring-zinc-900 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
            </div>
            <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-xs sm:text-sm truncate">{partner?.username || title || t('chatTitle')}</h3>
                  {isMinimized && unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {!isMinimized && <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">{isPartnerOnline ? <span className="text-green-400 font-medium">● Online</span> : 'Offline'}</p>}
            </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
            {!isMinimized && (
              <button onClick={(e) => { e.stopPropagation(); setIsSearching(!isSearching); if(isSearching) setSearchTerm(''); }} className={`p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg ${isSearching ? 'bg-zinc-800 text-white' : ''}`} title="Tìm kiếm tin nhắn">
                  <Search size={14} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); setIsMaximized(false); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors" title={isMinimized ? "Mở rộng" : "Thu nhỏ"}>
                {isMinimized ? <ChevronUp size={16} /> : <Minus size={16} />} 
            </button>
            {!isMinimized && (
                <button onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg hidden sm:block" title={isMaximized ? "Khôi phục" : "Phóng to"}>
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            )}
            {/* FIX: Reset isFirstLoad = true khi đóng để lần sau mở lại sẽ cuộn tức thì (auto) thay vì trượt (smooth) */}
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); setIsFirstLoad(true); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-700 rounded-lg transition-colors" title="Đóng chat">
                <X size={16} />
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
      <div className={`relative flex-1 flex flex-col min-h-0 bg-zinc-950/85 rounded-b-2xl ${isMinimized ? 'hidden' : 'flex'}`}>
            {/* Confirm Recall Dialog inside ChatWindow */}
            {pendingDeleteId && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-b-2xl p-4 animate-in fade-in duration-150">
                <div className="w-full max-w-[270px] rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-2xl">
                  <h4 className="text-sm font-bold text-white mb-1">Thu hồi tin nhắn?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Tin nhắn này sẽ bị xóa vĩnh viễn khỏi cuộc trò chuyện của cả hai bên.
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setPendingDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={confirmDeleteMessage}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting && <Loader2 size={12} className="animate-spin" />}
                      Thu hồi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CSS Animation cho hiệu ứng Typing mượt mà - Moved to global css or style tag */}
            <style jsx>{`
                @keyframes typing {
                    0%, 100% { transform: translateY(0); opacity: 0.5; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }
                .animate-typing {
                    animation: typing 1.4s infinite ease-in-out both;
                }
            `}</style>
            <div 
                ref={scrollViewportRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3.5 py-4 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600"
            >
                {filteredMessages.map((msg, index) => {
                    const msgSenderId = msg.sender_id?._id || msg.sender_id;
                    const isMe = msgSenderId === currentUser?._id;
                    // Logic gộp tin nhắn: Cùng người gửi + cách nhau dưới 5 phút
                    const prevMsg = filteredMessages[index - 1];
                    const nextMsg = filteredMessages[index + 1];
                    const prevSenderId = prevMsg?.sender_id?._id || prevMsg?.sender_id;
                    const nextSenderId = nextMsg?.sender_id?._id || nextMsg?.sender_id;
                    const msgTime = new Date(msg.created_at || msg.createdAt || 0).getTime();
                    const prevTime = prevMsg ? new Date(prevMsg.created_at || prevMsg.createdAt || 0).getTime() : 0;
                    const nextTime = nextMsg ? new Date(nextMsg.created_at || nextMsg.createdAt || 0).getTime() : 0;

                    const isSequence = Boolean(prevMsg && prevSenderId === msgSenderId && (msgTime - prevTime < 5 * 60 * 1000));
                    const isLastInSequence = !nextMsg || nextSenderId !== msgSenderId || (nextTime - msgTime >= 5 * 60 * 1000);

                    return (
                    <MessageItem
                        key={msg._id || index}
                        message={msg}
                        isMe={isMe}
                        isSequence={isSequence}
                        isLastInSequence={isLastInSequence}
                        isMaximized={isMaximized}
                        isOnline={isPartnerOnline}
                        partner={partner}
                        searchTerm={searchTerm} // Truyền từ khóa xuống để highlight
                        onReact={(emoji) => handleReact(msg._id, emoji)}
                        onReply={() => setReplyingTo(msg)}
                        onDelete={() => handleDelete(msg._id)}
                        onImageLoad={() => {
                          if (!showScrollButton) scrollToBottom('smooth');
                        }}
                    />
                )})}
                
                {filteredMessages.length === 0 && searchTerm && (
                    <div className="text-center text-zinc-500 text-xs py-4">Không tìm thấy tin nhắn nào khớp với "{searchTerm}"</div>
                )}

                {isTyping && (
                  <div className="flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300 pl-1">
                    <div className="flex space-x-1 bg-zinc-800 px-3 py-2.5 rounded-2xl rounded-bl-none border border-zinc-700 items-center h-8 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing [animation-delay:-0.32s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing [animation-delay:-0.16s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-typing" />
                    </div>
                    <span className="text-[10px] text-zinc-500 italic">Đang nhập...</span>
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
                participantRole={participantRole}
                capabilities={capabilities}
                onSendTip={handleSendTip}
                onSendOrderInfo={handleSendOrderInfo}
                onSendBoosterStatus={handleSendBoosterStatus}
                onSendProgressReport={handleSendProgressReport}
            />
      </div>
    </div>
    </>
  );
}