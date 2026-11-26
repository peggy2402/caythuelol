import { io } from "socket.io-client";

// Kết nối đến Socket Server trên NestJS Backend
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "https://apil-lr.leorank.site";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Gọi socket.connect() khi User đã login
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  auth: (cb) => {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('jwt') || '';
    }
    cb({ token });
  },
});
