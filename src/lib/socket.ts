import { io } from "socket.io-client";

// Kết nối đến Socket Server (chạy ở port 3001 hoặc biến môi trường)
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Chúng ta sẽ gọi socket.connect() thủ công trong useEffect khi User đã login
  reconnection: true,
  transports: ['websocket', 'polling'], // Ưu tiên websocket
});