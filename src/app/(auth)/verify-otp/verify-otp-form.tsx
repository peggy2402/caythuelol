'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, 
  ArrowLeft, 
  MailCheck, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';

interface VerifyOtpFormProps {
  email: string;
}

export default function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const { t } = useLanguage();
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
      toast.error(t('otpRequired'));
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
        toast.error(data.error || t('verifyFailed'));
        return;
      }

      toast.success(t('verifySuccess'));
      router.push('/dashboard');
    } catch (error) {
      toast.error(t('connectionError'));
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

      toast.success(t('resendSuccess'));
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      toast.error(t('resendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-zinc-900 font-sans selection:bg-blue-500/30">
      {/* Left Side - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-white">
        {/* Back Link */}
        <Link 
          href="/login" 
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <div className="p-2 rounded-full bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{t('backToLogin')}</span>
        </Link>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in slide-in-from-left-8 fade-in duration-700">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-4 lg:mx-0">
               <MailCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{t('verifyTitle')}</h1>
            <p className="text-zinc-500">
              {t('verifyDesc')} <br className="hidden lg:block" />
              <span className="font-semibold text-zinc-900">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center lg:justify-start">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot 
                      key={index} 
                      index={index} 
                      className="w-10 h-12 sm:w-12 sm:h-14 text-lg font-bold border-zinc-200 bg-zinc-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all shadow-sm"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={handleVerify} 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]" 
              disabled={isLoading || otp.length < 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t('verifying')}
                </>
              ) : (
                t('verifyBtn')
              )}
            </Button>

            <div className="text-center lg:text-left text-sm">
              <p className="text-zinc-500 mb-2">{t('didntReceive')}</p>
              {canResend ? (
                <button 
                  onClick={handleResend} 
                  className="text-blue-600 font-bold hover:text-blue-500 hover:underline transition-colors flex items-center gap-2 mx-auto lg:mx-0"
                  disabled={isLoading}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('resendCode')}
                </button>
              ) : (
                <span className="text-zinc-400 font-medium flex items-center justify-center lg:justify-start gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t('resendIn')} {countdown}s
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-12 bg-zinc-900 overflow-hidden text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-zinc-900 to-purple-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg space-y-8 animate-in slide-in-from-right-8 fade-in duration-700">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('security2FA')}</span>
            </div>
            <h2 className="text-4xl font-extrabold leading-tight">
              {t('protectAccount')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {t('absoluteSafety')}
              </span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              {t('verifyHelpDesc')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Lock, title: t('e2eEncryption'), desc: t('e2eDesc') },
              { icon: MailCheck, title: t('instantVerify'), desc: t('instantVerifyDesc') },
              { icon: CheckCircle2, title: t('secureTrans'), desc: t('secureTransDesc') }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 mt-0.5">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 right-12 text-xs text-zinc-500 flex justify-between">
            <span>© 2026 {t('securityFooter')}</span>
            <span>{t('privacyTerms')}</span>
        </div>
      </div>
    </div>
  );
}
