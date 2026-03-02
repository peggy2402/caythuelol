'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { User, Key, Trash2, Save, Camera, X, Loader2, Sparkles, ChevronsUpDown, Check, Search } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';

// Define a User interface based on the provided data
interface UserProfile {
  avatar?: string;
  bank_info?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  platform?: string;
  role: string;
  wallet_balance: number;
  profile: UserProfile;
  createdAt: string;
}

// Reusable Card component for this page
const SettingsCard = ({ title, description, children, className }: { title: string, description: string, children: ReactNode, className?: string }) => (
  <div className={`rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-sm ${className || ''}`}>
    <div className="p-6 border-b border-white/5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="text-sm text-zinc-400 mt-1">{description}</p>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const DangerZoneCard = ({ title, description, children }: { title: string, description: string, children: ReactNode }) => (
    <div className="rounded-xl border border-red-500/30 bg-red-900/10">
      <div className="p-6">
        <h2 className="text-lg font-bold text-red-400">{title}</h2>
        <p className="text-sm text-zinc-400 mt-1 mb-6">{description}</p>
        {children}
      </div>
    </div>
);

// OTP Modal Component
const OtpModal = ({ 
  email, 
  isOpen, 
  otpExpiry,
  onClose, 
  onVerify, 
  onResend 
}: { 
  email: string, 
  isOpen: boolean, 
  otpExpiry: number | null,
  onClose: () => void, 
  onVerify: (otp: string) => Promise<void>, 
  onResend: () => Promise<void> 
}) => {
    const { t } = useLanguage();
    const [otp, setOtp] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && otpExpiry) {
            const now = Date.now();
            const remaining = Math.ceil((otpExpiry - now) / 1000);
            
            if (remaining > 0) {
                setCountdown(remaining);
                setCanResend(false);
            } else {
                setCountdown(0);
                setCanResend(true);
            }
        }
    }, [isOpen, otpExpiry]);

    useEffect(() => {
        if (countdown > 0 && isOpen) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCanResend(true);
        }
    }, [countdown, isOpen]);

    const handleVerifyClick = async () => {
        if (otp.length < 6) return;
        setLoading(true);
        await onVerify(otp);
        setLoading(false);
    }

    const handleResendClick = async () => {
        setLoading(true);
        await onResend();
        setLoading(false);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{t('verifyEmailChange')}</h3>
                    <p className="text-zinc-400 text-sm">
                        {t('enterOtpForEmail')} <br/>
                        <span className="text-blue-400 font-semibold text-base">{email}</span>
                    </p>
                </div>
                
                <div className="flex justify-center mb-8">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className="gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <InputOTPSlot 
                                    key={i} 
                                    index={i} 
                                    className="w-10 h-12 border-zinc-700 bg-zinc-800/50 text-white text-lg font-bold focus:border-blue-500 focus:ring-blue-500/20 transition-all" 
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleVerifyClick} 
                        disabled={otp.length < 6 || loading} 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('verifyBtn')}
                    </button>

                    <div className="text-center text-sm">
                        {canResend ? (
                            <button 
                                onClick={handleResendClick} 
                                disabled={loading}
                                className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                                <Sparkles className="w-4 h-4" />
                                {t('resendCode')}
                            </button>
                        ) : (
                            <span className="text-zinc-500 flex items-center justify-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {t('resendIn')} {countdown}s
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Delete Account Modal Component
const DeleteAccountModal = ({ user, isOpen, onClose, onConfirm, loading }: { user: UserData | null, isOpen: boolean, onClose: () => void, onConfirm: () => void, loading: boolean }) => {
    const { t } = useLanguage();
    const [confirmationText, setConfirmationText] = useState('');

    if (!isOpen) return null;

    const requiredText = `delete ${user?.username}`;
    const isConfirmed = confirmationText === requiredText;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="bg-zinc-900/90 border border-red-500/30 rounded-2xl p-8 w-full max-w-md relative shadow-2xl ring-1 ring-red-500/10 transform transition-all scale-100 animate-in zoom-in-95 duration-300">
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{t('deleteAccountConfirmTitle')}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    {t('deleteAccountConfirmDesc')}
                </p>
                <p className="text-sm text-zinc-400 mb-4">
                    Để xác nhận, vui lòng nhập <code className="bg-zinc-800 text-red-400 font-mono px-2 py-1 rounded">{requiredText}</code> vào ô bên dưới.
                </p>
                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-red-500 focus:ring-red-500 transition-colors mb-6"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={loading} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all">
                        {t('cancelBtn')}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={!isConfirmed || loading} 
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:bg-red-900/50 disabled:text-zinc-500 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('deleteBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Bank Info states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Bank Selector States
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);

  useEffect(() => {
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const parsedUser: UserData = JSON.parse(userDataString);
      setUser(parsedUser);
      setUsername(parsedUser.username);
      setEmail(parsedUser.email);
      setAvatarUrl(parsedUser.profile.avatar || '');
      
      if (parsedUser.profile.bank_info) {
        setBankName(parsedUser.profile.bank_info.bankName || '');
        setAccountNumber(parsedUser.profile.bank_info.accountNumber || '');
        setAccountHolder(parsedUser.profile.bank_info.accountHolder || '');
      }
    }
    setLoading(false);
  }, []);

  // Fetch Banks from VietQR
  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then(res => res.json())
      .then(data => setBanks(data.data || []))
      .catch(err => console.error("Failed to fetch banks", err));
  }, []);

  const handleResendOtp = async () => {
    try {
        const res = await fetch('/api/auth/change-email/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newEmail: email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(t('emailChangeOtpSent'));
        
        // Set expiry time (60s from now)
        setOtpExpiry(Date.now() + 60 * 1000);
    } catch (error: any) {
        toast.error(t(error.message as any));
        throw error; // Re-throw to handle loading state in modal
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    // Validate Username format (Chặn khoảng trắng và ký tự đặc biệt ngay lập tức)
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
      toast.error('Username không được chứa khoảng trắng hoặc ký tự đặc biệt');
      return;
    }

    setIsSavingProfile(true);
    
    // 1. Check if email changed
    if (email !== user.email) {
        try {
            // Check if there is an active OTP session
            const now = Date.now();
            if (otpExpiry && otpExpiry > now) {
                // OTP still valid, just open modal
                setIsOtpModalOpen(true);
            } else {
                // OTP expired or not sent yet, send new one
                await handleResendOtp();
                setIsOtpModalOpen(true);
            }
            setIsSavingProfile(false);
            return; // Stop here, wait for OTP
        } catch (error: any) {
            // Error handled in handleResendOtp
            setIsSavingProfile(false);
            return;
        }
    }

    // 2. Update basic info if email didn't change
    try {
        const res = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, avatar: avatarUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast.success(t('profileUpdateSuccess'));
        // Update local storage
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('user-updated')); // Báo cho Layout cập nhật
    } catch (error: any) {
        toast.error(t(error.message as any) || t('profileUpdateFailed'));
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleVerifyEmailOtp = async (otp: string) => {
    try {
        const res = await fetch('/api/auth/change-email/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newEmail: email, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast.success(t('emailChangeSuccess'));
        setIsOtpModalOpen(false);
        setOtpExpiry(null); // Clear expiry on success
        
        // Update local storage with new user data (including new email)
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser as UserData);
        window.dispatchEvent(new Event('user-updated')); // Báo cho Layout cập nhật
    } catch (error: any) {
        toast.error(t(error.message as any));
    }
  };

  const handleSaveBankInfo = async () => {
    setIsSavingBank(true);
    try {
      const res = await fetch('/api/user/bank-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountHolder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Cập nhật thông tin ngân hàng thành công');
      
      if (user) {
        const updatedUser = {
          ...user,
          profile: {
            ...user.profile,
            bank_info: { bankName, accountNumber, accountHolder: accountHolder.toUpperCase() }
          }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('user-updated')); // Báo cho Layout cập nhật
      }
    } catch (error: any) {
      toast.error(t(error.message as any) || 'Lỗi cập nhật ngân hàng');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleChangePassword = async () => {
      if (newPassword !== confirmNewPassword) {
          toast.error('Mật khẩu xác nhận không khớp');
          return;
      }
      setIsChangingPassword(true);
      try {
          const res = await fetch('/api/auth/change-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentPassword, newPassword }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success(t('passwordChangeSuccess'));
          setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      } catch (error: any) {
          toast.error(t(error.message as any) || t('passwordChangeFailed'));
      } finally {
          setIsChangingPassword(false);
      }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
        const res = await fetch('/api/user/delete', {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(t(data.error as any) || t('deleteAccountToastError'));

        toast.success(t('deleteAccountToastSuccess'));
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
    } catch (error: any) {
        toast.error(error.message);
        setDeleteLoading(false);
    }
  };

  if (loading) {
    // A simple skeleton loader
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-1/3 bg-zinc-800 rounded-md"></div>
        <div className="h-64 bg-zinc-900 rounded-xl"></div>
        <div className="h-72 bg-zinc-900 rounded-xl"></div>
        <div className="h-48 bg-zinc-900 rounded-xl"></div>
      </div>
    );
  }

  if (!user) {
    return <center><div>{t('userNotFoundPleaseLoginAgain')}</div></center>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <OtpModal 
        email={email} 
        isOpen={isOtpModalOpen} 
        otpExpiry={otpExpiry}
        onClose={() => setIsOtpModalOpen(false)} 
        onVerify={handleVerifyEmailOtp} 
        onResend={handleResendOtp}
      />
      <DeleteAccountModal user={user} isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAccount} loading={deleteLoading} />

      <h1 className="text-2xl font-bold text-white">{t('profileSettings')}</h1>

      {/* Profile Details Card */}
      <SettingsCard title={t('personalInfo')} description={t('personalInfoDesc')}>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative group w-32 h-32">
              <img
                src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&background=050505&color=fff`}
                alt="Avatar"
                className="rounded-full ring-2 ring-white/10 object-cover w-32 h-32"
              />
              <button className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera className="h-8 w-8 text-white" />
              </button>
            </div>
          </div>
          {/* Form */}
          <div className="flex-grow w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-2">{t('username')}</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="avatar" className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                <input
                  type="text"
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/my-avatar.jpg"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={handleSaveChanges} disabled={isSavingProfile} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Bank Info Card */}
      <SettingsCard title="Thông tin ngân hàng" description="Cập nhật tài khoản ngân hàng để nhận tiền rút" className="relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Ngân hàng</label>
            
            {/* Custom Bank Selector */}
            <div className="relative">
              <div 
                onClick={() => setIsBankOpen(!isBankOpen)}
                className="flex items-center justify-between w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer h-[46px]"
              >
                {bankName ? (
                  <div className="flex items-center gap-2">
                    {banks.find(b => b.shortName === bankName)?.logo && (
                      <img src={banks.find(b => b.shortName === bankName)?.logo} alt="Bank Logo" className="w-6 h-6 object-contain bg-white rounded-full p-0.5" />
                    )}
                    <span className="text-white font-medium truncate">{bankName}</span>
                  </div>
                ) : (
                  <span className="text-zinc-500">Chọn ngân hàng...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </div>

              {/* Dropdown Panel */}
              {isBankOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsBankOpen(false)} />
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-700 bg-zinc-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    <div className="sticky top-0 z-10 bg-zinc-900 p-2 border-b border-zinc-700">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <input 
                          className="w-full bg-zinc-800 text-white rounded-md py-2 pl-8 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-zinc-700"
                          placeholder="Tìm kiếm ngân hàng..."
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>
                    {banks.filter(b => b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) || b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.toLowerCase().includes(bankSearch.toLowerCase())).map((bank) => (
                      <div
                        key={bank.id}
                        className="relative flex cursor-pointer select-none items-center py-2 pl-3 pr-9 hover:bg-blue-600/20 hover:text-blue-400 text-zinc-300"
                        onClick={() => {
                          setBankName(bank.shortName);
                          setIsBankOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <img src={bank.logo} alt={bank.code} className="h-8 w-8 object-contain bg-white rounded-md p-0.5" />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{bank.shortName}</span>
                              <span className="text-[10px] text-zinc-400 font-normal bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">{bank.code}</span>
                            </div>
                            <span className="text-xs text-zinc-500 truncate max-w-[250px]">{bank.name}</span>
                          </div>
                        </div>
                        {bankName === bank.shortName && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-500">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    ))}
                    {banks.length === 0 && <div className="p-4 text-center text-zinc-500">Đang tải danh sách...</div>}
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Số tài khoản</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0123456789"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Tên chủ tài khoản (Không dấu)</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
              placeholder="NGUYEN VAN A"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors uppercase"
            />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button onClick={handleSaveBankInfo} disabled={isSavingBank} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSavingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu thông tin
          </button>
        </div>
      </SettingsCard>

      {/* Change Password Card */}
      {user.platform !== 'GOOGLE' && user.platform !== 'FACEBOOK' ? (
        <SettingsCard title={t('changePassword')} description={t('changePasswordDesc')}>
            <div className="max-w-lg space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('currentPassword')}</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('newPassword')}</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('confirmNewPassword')}</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-blue-500 focus:ring-blue-500 transition-colors" />
            </div>
            <div className="pt-2 flex justify-end">
                <button onClick={handleChangePassword} disabled={isChangingPassword} className="flex items-center gap-2 rounded-lg bg-zinc-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {t('updatePassword')}
                </button>
            </div>
            </div>
        </SettingsCard>
      ) : (
        <div className="rounded-xl border border-blue-500/30 bg-blue-900/10 p-6">
            <p className="text-blue-400 text-sm">Bạn đang đăng nhập bằng {user.platform}. Vui lòng quản lý mật khẩu tại nhà cung cấp dịch vụ.</p>
        </div>
      )}

      {/* Danger Zone */}
      <DangerZoneCard title={t('dangerZone')} description={t('dangerZoneDesc')}>
        <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20">
          <Trash2 className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
      </DangerZoneCard>
    </div>
  );
}
