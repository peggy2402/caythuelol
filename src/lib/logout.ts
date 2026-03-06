export function logout(disconnectSocket?: () => void) {
  try {
    // ngắt socket nếu có
    if (disconnectSocket) {
      disconnectSocket();
    }

    // clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('chat_cache');

    // redirect
    window.location.href = '/';
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
  }
}