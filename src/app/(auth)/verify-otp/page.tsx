import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VerifyOtpForm from './verify-otp-form';

export default async function VerifyOtpPage() {
  // 1. Server Component đọc Cookie (Bảo mật, không lộ trên URL)
  const cookieStore = await cookies();
  const email = cookieStore.get('verification_email')?.value;

  // 2. Nếu không có cookie (do hết hạn hoặc truy cập trực tiếp) -> Về Register
  if (!email) {
    redirect('/register');
  }

  // 3. Truyền email xuống Client Component để xử lý logic
  return <VerifyOtpForm email={email} />;
}
