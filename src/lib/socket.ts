import { io } from "socket.io-client";

// Kết nối đến Socket Server trên NestJS Backend
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "https://apil-lr.leorank.site";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Gọi socket.connect() khi User đã login
  reconnection: true,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});
