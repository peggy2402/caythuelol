'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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