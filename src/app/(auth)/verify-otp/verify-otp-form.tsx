'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { toast } from 'sonner';

interface VerifyOtpFormProps {
  email: string;
}

export default function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 giây đếm ngược
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Xác thực thất bại');
        return;
      }

      toast.success('Xác thực thành công!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Đã gửi lại mã OTP');
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      toast.error('Gửi lại thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 p-4 font-sans">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <MailCheck className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Xác thực tài khoản</h1>
          <p className="text-zinc-500 text-sm">
            Chúng tôi đã gửi mã xác thực 6 số đến email:
            <br />
            <span className="font-semibold text-zinc-900">{email}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              disabled={isLoading}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot 
                    key={index} 
                    index={index} 
                    className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-bold border-zinc-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg transition-all"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerify} 
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98]" 
            disabled={isLoading || otp.length < 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Xác nhận'
            )}
          </Button>

          <div className="text-center text-sm">
            <p className="text-zinc-500 mb-2">Bạn chưa nhận được mã?</p>
            {canResend ? (
              <button 
                onClick={handleResend} 
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                disabled={isLoading}
              >
                Gửi lại mã mới
              </button>
            ) : (
              <span className="text-zinc-400 font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Gửi lại sau {countdown}s
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center justify-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
