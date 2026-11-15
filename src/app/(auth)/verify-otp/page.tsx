import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VerifyOtpForm from './verify-otp-form';

export default async function VerifyOtpPage(props: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const cookieStore = await cookies();
  const cookieEmail = cookieStore.get('verification_email')?.value;
  const email = searchParams?.email || cookieEmail;

  // Nếu không có thông tin email để verify -> Chuyển về Register
  if (!email) {
    redirect('/register');
  }

  return <VerifyOtpForm email={email} />;
}
