'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { toast } from 'sonner';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // Step 1: Input Email
  // Step 2: Input OTP & New Password
  const [step, setStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errorMessage = t(data.error as any) || t('sendOtpFailed');
        // Xử lý lỗi đặc biệt cho tài khoản mạng xã hội (cần thay thế {platform})
        if (data.error === 'socialAccountResetError' && data.data?.platform) {
          errorMessage = errorMessage.replace('{platform}', data.data.platform);
        }
        throw new Error(errorMessage);
      }

      toast.success(t('otpSentSuccess'));
      setStep(2);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    if (otp.length !== 6) {
        toast.error(t('otpRequired'));
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        let errorMessage = t(data.error as any) || t('resetPasswordFailed');
        if (data.error === 'otpIncorrect' && data.data?.attemptsLeft > 0) {
             errorMessage = `${t('otpIncorrect')} ${t('remainingAttempts')} ${data.data.attemptsLeft} ${t('attemptsLeft')}`;
        }
        throw new Error(errorMessage);
      }

      toast.success(t('resetPasswordSuccess'));
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-zinc-900 font-sans selection:bg-blue-500/30">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <Link 
          href="/login" 
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors group"
        >
          <div className="p-2 rounded-full bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{t('backToLogin')}</span>
        </Link>

        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-left-8 fade-in duration-700">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-4 lg:mx-0">
               <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              {step === 1 ? t('forgotPasswordTitle') : t('resetPasswordTitle')}
            </h1>
            <p className="text-zinc-500">
              {step === 1 
                ? t('forgotPasswordDesc')
                : `${t('resetPasswordDesc')} ${email} ${t('andNewPassword')}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 ml-1">{t('email')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    {t('inProcess')}
                  </>
                ) : (
                  t('sendOtpBtn')
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 ml-1">Mã OTP</label>
                    <div className="flex justify-center lg:justify-start">
                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                            disabled={loading}
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 ml-1">{t('newPassword')}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    {t('inProcess')}
                  </>
                ) : (
                  t('resetPasswordBtn')
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-12 bg-zinc-900 overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-zinc-900 to-purple-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-lg space-y-8 animate-in slide-in-from-right-8 fade-in duration-700">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight">
              {t('restoreAccessTitle')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                {t('restoreAccessSubtitle')}
              </span>
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              {t('restoreAccessDesc')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: t('secureInfoTitle'), desc: t('secureInfoDesc') },
              { title: t('authOwnerTitle'), desc: t('authOwnerDesc') },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 mt-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
