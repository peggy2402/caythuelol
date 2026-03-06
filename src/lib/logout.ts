import { socket } from '@/lib/socket';

export function logout() {
  try {
    // 1. Ngắt kết nối socket ngay lập tức để Server biết user đã Offline
    if (socket.connected) {
      socket.disconnect();
    }

    // 2. Xóa dữ liệu local
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chat_cache');

    // 3. Chuyển hướng về trang chủ
    window.location.href = '/';
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    window.location.href = '/';
  }
}