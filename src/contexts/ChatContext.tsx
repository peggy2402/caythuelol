'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { socket } from '@/lib/socket';

interface ChatContextType {
  hasNewMessage: boolean;
  setHasNewMessage: (has: boolean) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const connectSocket = useCallback(() => {
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socket.connected) {
      socket.disconnect();
    }
  }, []);

  // FIX: Tự động kết nối khi vào trang nếu đã đăng nhập
  useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
          connectSocket();
      }

      // FIX: Lắng nghe sự kiện connect để tự động định danh lại khi mạng rớt/kết nối lại
      const joinUserRoom = () => {
          const userStr = localStorage.getItem('user');
          if (userStr) {
              try {
                  const user = JSON.parse(userStr);
                  if (user._id) socket.emit('join_user_room', user._id);
              } catch (e) {}
          }
      };

      // Nếu đã kết nối rồi thì join luôn (tránh trường hợp F5 trang socket đã connected từ trước)
      if (socket.connected) {
          joinUserRoom();
      }

      socket.on('connect', joinUserRoom);

      // Lắng nghe sự kiện đăng nhập thành công từ các component khác
      const handleUserUpdate = () => connectSocket();
      window.addEventListener('user-updated', handleUserUpdate);

      return () => {
          socket.off('connect', joinUserRoom);
          window.removeEventListener('user-updated', handleUserUpdate);
      };
  }, [connectSocket]);

  const value = {
    hasNewMessage,
    setHasNewMessage,
    connectSocket,
    disconnectSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}