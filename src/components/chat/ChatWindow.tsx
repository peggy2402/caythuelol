'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen && !isMinimized) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Socket & Polling
  useEffect(() => {
    if (!isOpen) return;

    // Socket Setup
    if (!socket.connected) socket.connect();
    socket.emit('join_order_room', orderId);

    const handleNewMessage = (msg: any) => {
        setMessages(prev => [...prev, msg]);
    };

    const handleTyping = (data: { userId: string, isTyping: boolean }) => {
        if (data.userId !== currentUser._id) {
            setIsTyping(data.isTyping);
        }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing_status', handleTyping);

    // Fallback Polling (Keep for reliability if socket fails)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/messages`);
        if (res.ok) {
            const data = await res.json();
            // Simple check to avoid re-render if count same (not perfect but okay for fallback)
            if (data.messages.length > messages.length) {
                setMessages(data.messages);
            }
        }
      } catch (e) {}
    }, 5000);

    return () => {
        clearInterval(interval);
        socket.off('new_message', handleNewMessage);
        socket.off('typing_status', handleTyping);
    };
  }, [orderId, isOpen, messages.length, currentUser._id]);

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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl z-50 transition-transform hover:scale-110"
      >
          <MessageSquare size={24} />
      </button>
  );

  return (
    <div
        className={`fixed bottom-0 right-0 sm:right-4 z-50 flex flex-col bg-zinc-900 border border-zinc-800 rounded-t-xl shadow-2xl transition-all duration-300 ease-in-out
        ${isMinimized ? 'h-14 w-full sm:w-72' : 'h-[80vh] sm:h-[600px] w-full sm:w-[400px]'}
        `}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900 rounded-t-xl cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
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
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-700 rounded-lg">
                <X size={14} />
            </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/50 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <MessageItem
                        key={msg._id}
                        message={msg}
                        isMe={msg.sender_id?._id === currentUser?._id}
                        onReact={(emoji) => handleReact(msg._id, emoji)}
                        onReply={() => setReplyingTo(msg)}
                        onDelete={() => handleDelete(msg._id)}
                    />
                ))}
                
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
            </div>
            <ChatInput 
                onSend={handleSendMessage} 
                onTyping={handleTypingEvent}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
        </>
      )}
    </div>
  );
}