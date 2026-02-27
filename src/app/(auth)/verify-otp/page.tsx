import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VerifyOtpForm from './verify-otp-form';

export default async function VerifyOtpPage() {
  // 1. Server Component đọc Cookie (Bảo mật, không lộ trên URL)
  const cookieStore = await cookies();
  const email = cookieStore.get('verification_email')?.value;
  const token = cookieStore.get('token')?.value;

  // 2. Logic điều hướng thông minh hơn:
  // Trường hợp: Vừa verify xong, API đã xóa cookie 'verification_email' nhưng Client chưa kịp chuyển trang.
  // Lúc này Server Component render lại, thấy mất email nên redirect về register (gây lỗi UX).
  // FIX: Nếu có token (đã login) mà mất email -> Chuyển về Dashboard để Middleware kiểm tra.
  if (!email && token) {
    redirect('/dashboard');
  }

  // 3. Nếu không có cả email lẫn token -> Về Register
  if (!email) {
    redirect('/register');
  }
  
  // 4. Truyền email xuống Client Component để xử lý logic
  return <VerifyOtpForm email={email} />;
}
