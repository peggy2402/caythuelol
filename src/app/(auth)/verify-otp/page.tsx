import { cookies } from 'next/headers';
import VerifyOtpForm from './verify-otp-form';

export default async function VerifyOtpPage(props: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get('verification_email')?.value;
  const email = (searchParams?.email || cookieEmail || '').trim().toLowerCase();

  // Không dùng redirect() ở Server Component để tránh xung đột cookie/router.
  // VerifyOtpForm sẽ tự động fallback đọc từ sessionStorage/localStorage nếu thiếu email.
  return <VerifyOtpForm email={email} />;
}
