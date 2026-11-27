'use client';
import BarLoader from '@/components/ui/BarLoader';

import { useState, useEffect, ReactNode } from 'react';
import { useLanguage } from '@/lib/i18n';
import UserBadge from '@/components/UserBadge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, Key, Trash2, Save, Camera, X, Loader2, Sparkles, ChevronsUpDown, Check,
  Search, Copy, ExternalLink, Share2, Shield, Trophy, Flame, Star, Award,
  Wallet, ShoppingBag, Gift, ArrowRight, Settings, CheckCircle2, AlertCircle,
  Gamepad2, Plus, Edit3, Activity, Clock, CheckCheck, RefreshCw, Layers,
  Eye, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { GAMES_CATALOG } from '@/lib/games';
import BankSelectModal from '@/components/BankSelectModal';

interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

interface UserProfile {
  avatar?: string;
  bank_info?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  booster_info?: {
    bio?: string;
  };
}

interface BoosterGameItem {
  gameCode: string;
  gameName?: string;
  ranks: string[]; // [highestRank, currentRank] hoặc [currentRank]
  servers?: string[];
  performanceScore?: number;
  tier?: string;
  completedOrders?: number;
  successRate?: number;
  metadata?: {
    opggLink?: string;
    rankImageUrl?: string;
    [key: string]: any;
  };
}

interface BoosterProfileData {
  _id?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  games?: BoosterGameItem[];
  performanceScore?: number;
  tier?: string;
  tierName?: string;
  rating?: number;
  completedOrders?: number;
  scoreBreakdown?: {
    efficiencyScore: number;
    qualityScore: number;
    reliabilityScore: number;
    experienceScore: number;
    activityScore: number;
  };
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  platform?: string;
  role: 'CUSTOMER' | 'BOOSTER' | 'STAFF' | 'ADMIN';
  wallet_balance: number;
  loyalty_points?: number;
  profile: UserProfile;
  booster_info?: {
    bio?: string;
    rating?: number;
    completed_orders?: number;
    isReady?: boolean;
    currentRank?: string;
    highestRank?: string;
    performanceScore?: number;
    tier?: string;
    tierName?: string;
  };
  booster_profile?: BoosterProfileData;
  staff_permissions?: string[];
  vip_info?: {
    is_vip?: boolean;
    package_type?: string;
    expires_at?: string;
  };
  total_spent?: number;
  isReady?: boolean;
  createdAt: string;
}

// Reusable Card component
const SettingsCard = ({
  title,
  description,
  badge,
  children,
  className
}: {
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-md shadow-xl overflow-hidden transition-all hover:border-white/15 ${className || ''}`}>
    <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4 bg-zinc-950/40">
      <div>
        <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
          {title}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">{description}</p>
      </div>
      {badge && <div>{badge}</div>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DangerZoneCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="rounded-2xl border border-red-500/20 bg-red-950/10 backdrop-blur-md overflow-hidden">
    <div className="p-6">
      <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        {title}
      </h2>
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
  onResend,
}: {
  email: string;
  isOpen: boolean;
  otpExpiry: number | null;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
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
  };

  const handleResendClick = async () => {
    setLoading(true);
    await onResend();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">
            {t('verifyEmailChange')}
          </h3>
          <p className="text-zinc-400 text-sm">
            {t('enterOtpForEmail')} <br />
            <span className="text-blue-400 font-semibold text-base">
              {email}
            </span>
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className="w-10 h-12 border-zinc-700 bg-zinc-800/50 text-white text-lg font-bold focus:border-blue-500 focus:ring-blue-500/20 transition-all rounded-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleVerifyClick}
            disabled={otp.length < 6 || loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('verifyBtn')
            )}
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
const DeleteAccountModal = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  const { t } = useLanguage();
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) return null;

  const requiredText = `delete ${user?.username}`;
  const isConfirmed = confirmationText === requiredText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-md relative shadow-2xl ring-1 ring-red-500/20 transform transition-all scale-100 animate-in zoom-in-95 duration-300">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {t('deleteAccountConfirmTitle')}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          {t('deleteAccountConfirmDesc')}
        </p>
        <p className="text-sm text-zinc-400 mb-4">
          Để xác nhận, vui lòng nhập{' '}
          <code className="bg-zinc-800 text-red-400 font-mono px-2 py-1 rounded">
            {requiredText}
          </code>{' '}
          vào ô bên dưới.
        </p>
        <input
          type="text"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white focus:border-red-500 focus:ring-red-500 transition-colors mb-6"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            {t('cancelBtn')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed || loading}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:bg-red-900/50 disabled:text-zinc-500 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t('deleteBtn')
            )}
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
  const [isSavingGames, setIsSavingGames] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  // Booster Specific States
  const [globalCurrentRank, setGlobalCurrentRank] = useState('Cao Thủ');
  const [globalHighestRank, setGlobalHighestRank] = useState('Thách Đấu');
  const [selectedEditGame, setSelectedEditGame] = useState<string>('LOL');

  const [boosterGames, setBoosterGames] = useState<BoosterGameItem[]>([]);
  const [boosterProfile, setBoosterProfile] = useState<BoosterProfileData | null>(null);
  const [isReady, setIsReady] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'ranks' | 'score' | 'payout' | 'general'>('ranks');

  // Bank Info states
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Bank Selector States
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankOpen, setIsBankOpen] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);

  // Short Link State
  const [origin, setOrigin] = useState('');

  // Fetch initial profile
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userDataString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (userDataString) {
      try {
        const parsedUser: UserData = JSON.parse(userDataString);
        setUser(parsedUser);
        setUsername(parsedUser.username || '');
        setEmail(parsedUser.email || '');
        setAvatarUrl(parsedUser.profile?.avatar || '');
        setBio(parsedUser.booster_info?.bio || parsedUser.profile?.booster_info?.bio || '');
        setIsReady(parsedUser.isReady !== false && parsedUser.booster_info?.isReady !== false);

        if (parsedUser.booster_info?.currentRank) setGlobalCurrentRank(parsedUser.booster_info.currentRank);
        if (parsedUser.booster_info?.highestRank) setGlobalHighestRank(parsedUser.booster_info.highestRank);

        if (parsedUser.profile?.bank_info) {
          setBankName(parsedUser.profile.bank_info.bankName || '');
          setAccountNumber(parsedUser.profile.bank_info.accountNumber || '');
          setAccountHolder(parsedUser.profile.bank_info.accountHolder || '');
        }

        if (parsedUser.booster_profile) {
          setBoosterProfile(parsedUser.booster_profile);
          if (parsedUser.booster_profile.games) {
            setBoosterGames(parsedUser.booster_profile.games);
          }
        }
      } catch (err) {
        console.error('Failed to parse cached user data', err);
      }
    }

    // Luôn fetch profile mới nhất từ server
    if (token) {
      fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && (data._id || data.user)) {
            const freshUser: UserData = data.user || data;
            setUser(freshUser);
            if (freshUser.username) setUsername(freshUser.username);
            if (freshUser.email) setEmail(freshUser.email);
            if (freshUser.profile?.avatar) setAvatarUrl(freshUser.profile.avatar);
            if (freshUser.booster_info?.bio || freshUser.profile?.booster_info?.bio) {
              setBio(freshUser.booster_info?.bio || freshUser.profile?.booster_info?.bio || '');
            }
            if (freshUser.booster_info?.currentRank) setGlobalCurrentRank(freshUser.booster_info.currentRank);
            if (freshUser.booster_info?.highestRank) setGlobalHighestRank(freshUser.booster_info.highestRank);

            if (freshUser.profile?.bank_info) {
              setBankName(freshUser.profile.bank_info.bankName || '');
              setAccountNumber(freshUser.profile.bank_info.accountNumber || '');
              setAccountHolder(freshUser.profile.bank_info.accountHolder || '');
            }
            setIsReady(freshUser.isReady !== false && freshUser.booster_info?.isReady !== false);

            if (freshUser.booster_profile) {
              setBoosterProfile(freshUser.booster_profile);
              if (freshUser.booster_profile.games && freshUser.booster_profile.games.length > 0) {
                setBoosterGames(freshUser.booster_profile.games);
              }
            }
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch((err) => console.error('Failed to fetch latest user profile', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch Banks from VietQR
  useEffect(() => {
    fetch('https://api.vietqr.io/v2/banks')
      .then((res) => res.json())
      .then((data) => setBanks(data.data || []))
      .catch((err) => console.error('Failed to fetch banks', err));
  }, []);

  // Toggle Booster Ready Status
  const handleToggleReady = async () => {
    if (!user || user.role !== 'BOOSTER') return;
    setIsTogglingReady(true);
    const newStatus = !isReady;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/boosters/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isReady: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setIsReady(newStatus);
      const updatedUser = {
        ...user,
        isReady: newStatus,
        booster_info: { ...user.booster_info, isReady: newStatus },
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success(newStatus ? 'Đã bật trạng thái SẴN SÀNG NHẬN ĐƠN 🟢' : 'Đã chuyển sang trạng thái TẠM NGHỈ 🔴');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái hoạt động');
    } finally {
      setIsTogglingReady(false);
    }
  };

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
      setOtpExpiry(Date.now() + 60 * 1000);
    } catch (error: any) {
      toast.error(t(error.message as any));
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    if (!/^[a-zA-Z0-9_\-\.]+$/.test(username)) {
      toast.error('Username không được chứa khoảng trắng hoặc ký tự đặc biệt');
      return;
    }

    setIsSavingProfile(true);

    if (email !== user.email) {
      try {
        const now = Date.now();
        if (otpExpiry && otpExpiry > now) {
          setIsOtpModalOpen(true);
        } else {
          await handleResendOtp();
          setIsOtpModalOpen(true);
        }
        setIsSavingProfile(false);
        return;
      } catch (error: any) {
        setIsSavingProfile(false);
        return;
      }
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username,
          avatar: avatarUrl,
          bio,
          booster_info: user.role === 'BOOSTER' ? { bio } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);

      toast.success(t('profileUpdateSuccess'));
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new Event('user-updated'));
    } catch (error: any) {
      toast.error(t(error.message as any) || t('profileUpdateFailed'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cập nhật Rank & Game cho Booster
  const handleSaveBoosterGames = async () => {
    if (!user || user.role !== 'BOOSTER') return;
    setIsSavingGames(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/booster-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bio,
          displayName: username,
          currentRank: globalCurrentRank,
          highestRank: globalHighestRank,
          games: boosterGames,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      toast.success('Đã lưu thông tin trình độ & các tựa game thành công! 🎉');
      if (data.booster_profile) {
        setBoosterProfile(data.booster_profile);
      }
      if (data.booster_info) {
        const updatedUser = {
          ...user,
          booster_info: {
            ...user.booster_info,
            ...data.booster_info,
          },
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi lưu thông tin game');
    } finally {
      setIsSavingGames(false);
    }
  };

  const handleUpdateGameRank = (gameCode: string, field: 'highestRank' | 'currentRank' | 'opggLink' | 'rankImageUrl', value: string) => {
    setBoosterGames((prev) => {
      const existing = prev.find((g) => g.gameCode.toUpperCase() === gameCode.toUpperCase());
      if (existing) {
        return prev.map((g) => {
          if (g.gameCode.toUpperCase() !== gameCode.toUpperCase()) return g;
          const currentRanks = [...(g.ranks || [])];
          let highest = currentRanks[0] || 'N/A';
          let current = currentRanks[1] || currentRanks[0] || 'N/A';

          if (field === 'highestRank') highest = value;
          if (field === 'currentRank') current = value;

          const meta = { ...(g.metadata || {}) };
          if (field === 'opggLink') meta.opggLink = value;
          if (field === 'rankImageUrl') meta.rankImageUrl = value;

          return {
            ...g,
            ranks: [highest, current],
            metadata: meta,
          };
        });
      } else {
        // Thêm mới
        const gDef = GAMES_CATALOG.find((x) => x.id.toUpperCase() === gameCode.toUpperCase());
        return [
          ...prev,
          {
            gameCode: gameCode.toUpperCase(),
            gameName: gDef?.name || gameCode,
            ranks: field === 'highestRank' ? [value, 'N/A'] : ['N/A', value],
            metadata: {
              ...(field === 'opggLink' ? { opggLink: value } : {}),
              ...(field === 'rankImageUrl' ? { rankImageUrl: value } : {}),
            },
          },
        ];
      }
    });
  };

  const handleRemoveGame = (gameCode: string) => {
    setBoosterGames((prev) =>
      prev.map((g) => {
        if (g.gameCode.toUpperCase() === gameCode.toUpperCase()) {
          return { ...g, ranks: [] };
        }
        return g;
      })
    );
    toast.success(`Đã xóa cấu hình rank của ${gameCode}`);
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
      setOtpExpiry(null);

      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser as UserData);
      window.dispatchEvent(new Event('user-updated'));
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
            bank_info: { bankName, accountNumber, accountHolder: accountHolder.toUpperCase() },
          },
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('user-updated'));
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          oldPassword: currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = Array.isArray(data.message)
          ? data.message[0]
          : data.message || data.error;
        throw new Error(errMsg);
      }
      toast.success(t('passwordChangeSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast.error(error.message || t('passwordChangeFailed'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t(data.error as any) || t('deleteAccountToastError'));

      toast.success(t('deleteAccountToastSuccess'));
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message);
      setDeleteLoading(false);
    }
  };

  const copyShortLink = () => {
    navigator.clipboard.writeText(`${origin}/b/${username}`);
    toast.success('Đã sao chép link hồ sơ Booster!');
  };

  if (loading) {
    return <BarLoader className="min-h-[50vh]" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
        <p>{t('userNotFoundPleaseLoginAgain')}</p>
        <Link href="/login" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">
          Đăng nhập lại
        </Link>
      </div>
    );
  }

  // Helper render Tier Badge Color
  const getTierBadgeDetails = (tierName: string = 'Silver') => {
    switch (tierName.toUpperCase()) {
      case 'GRANDMASTER':
        return { color: 'from-rose-500 to-red-600', text: 'text-rose-400', border: 'border-rose-500/30' };
      case 'MASTER':
        return { color: 'from-purple-500 to-indigo-600', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'DIAMOND':
        return { color: 'from-cyan-400 to-blue-500', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      case 'PLATINUM':
        return { color: 'from-teal-400 to-emerald-500', text: 'text-teal-400', border: 'border-teal-500/30' };
      case 'GOLD':
        return { color: 'from-amber-400 to-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      default:
        return { color: 'from-zinc-400 to-zinc-600', text: 'text-zinc-300', border: 'border-zinc-500/30' };
    }
  };

  const currentTier = boosterProfile?.tierName || user.booster_info?.tierName || 'Diamond';
  const currentScore = boosterProfile?.performanceScore || user.booster_info?.performanceScore || 88;
  const tierStyle = getTierBadgeDetails(currentTier);

  // Active game details for studio editor
  const selectedCatGame = GAMES_CATALOG.find((x) => x.id.toUpperCase() === selectedEditGame.toUpperCase()) || GAMES_CATALOG[0];
  const matchedActiveBoosterGame = boosterGames.find((bg) => bg.gameCode.toUpperCase() === selectedEditGame.toUpperCase());
  const activeGameHasRank = !!(matchedActiveBoosterGame && matchedActiveBoosterGame.ranks && matchedActiveBoosterGame.ranks.length > 0 && matchedActiveBoosterGame.ranks.some((r) => r && r !== 'N/A' && r.trim() !== ''));
  const currentEditHighestRank = matchedActiveBoosterGame?.ranks?.[0] || 'N/A';
  const currentEditCurrentRank = matchedActiveBoosterGame?.ranks?.[1] || matchedActiveBoosterGame?.ranks?.[0] || 'N/A';
  const currentEditOpgg = matchedActiveBoosterGame?.metadata?.opggLink || '';
  const currentEditProof = matchedActiveBoosterGame?.metadata?.rankImageUrl || '';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <OtpModal
        email={email}
        isOpen={isOtpModalOpen}
        otpExpiry={otpExpiry}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={handleVerifyEmailOtp}
        onResend={handleResendOtp}
      />
      <DeleteAccountModal
        user={user}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />
      <BankSelectModal
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        banks={banks}
        selectedBankName={bankName}
        onSelectBank={(bank) => setBankName(bank.shortName)}
      />

      {/* =========================================================================
          ROLE-BASED HEADER HERO BANNER
      ========================================================================= */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative group w-20 h-20 md:w-24 md:h-24 shrink-0">
              <img
                src={avatarUrl || `https://ui-avatars.com/api/?name=${username}&background=050505&color=fff`}
                alt="Avatar"
                className="rounded-2xl ring-2 ring-white/10 object-cover w-full h-full shadow-lg"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('avatar-input');
                  input?.focus();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            </div>

            <div>
              {/* Tên + Huy hiệu gắn liền cạnh tên */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {username}
                </h1>
                <UserBadge
                  role={user.role}
                  vipTier={user.vip_info?.package_type}
                  size="md"
                />
              </div>

              {/* Badge chức danh và thông tin đặt ở dòng dưới */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {user.role === 'BOOSTER' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-blue-400 border border-blue-500/40 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Booster Pro
                  </span>
                )}
                {user.role === 'CUSTOMER' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {user.vip_info?.is_vip ? user.vip_info?.package_type || 'Hội Viên VIP' : 'Khách Hàng Thành Viên'}
                  </span>
                )}
                {user.role === 'STAFF' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Ban Điều Hành / Staff
                  </span>
                )}
                {user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Super Admin
                  </span>
                )}
              </div>

              <p className="text-xs md:text-sm text-zinc-400 flex items-center gap-2">
                <span>{email}</span>
                <span>•</span>
                <span>
                  Gia nhập:{' '}
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </span>
              </p>
            </div>
          </div>

          {/* RIGHT SIDE OF HERO: ROLE SPECIFIC WIDGET */}
          {user.role === 'BOOSTER' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Performance & Tier Pill */}
              <div className={`px-4 py-2 rounded-xl bg-zinc-950/80 border ${tierStyle.border} flex items-center gap-3 shadow-inner`}>
                <Trophy className={`w-5 h-5 ${tierStyle.text}`} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Cấp Bậc & Điểm Số</div>
                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                    <span className={tierStyle.text}>{currentTier}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-emerald-400">{currentScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Ready / Offline Toggle */}
              <button
                onClick={handleToggleReady}
                disabled={isTogglingReady}
                className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs ${
                  isReady
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-emerald-500/10 shadow-lg'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                {isReady ? 'Sẵn sàng nhận đơn' : 'Tạm nghỉ'}
              </button>

              {/* Public Profile Link */}
              <a
                href={`/b/${username}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 text-xs font-bold"
                title="Xem hồ sơ công khai"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Xem hồ sơ</span>
              </a>
            </div>
          )}

          {user.role === 'CUSTOMER' && (
            <div className="flex items-center gap-4">
              <div className="px-4 py-2.5 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">Số dư ví</div>
                  <div className="text-base font-black text-emerald-400">
                    {new Intl.NumberFormat('vi-VN').format(user.wallet_balance || 0)} đ
                  </div>
                </div>
              </div>
              <Link
                href="/services"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Thuê Booster
              </Link>
            </div>
          )}

          {user.role === 'STAFF' && (
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Bảng Vận Hành Staff
              </Link>
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
              >
                <Flame className="w-4 h-4" />
                Bảng Quản Trị Hệ Thống
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CASE 1: PROFILE VIEW FOR ROLE 'BOOSTER'
      ========================================================================= */}
      {user.role === 'BOOSTER' && (
        <div className="space-y-6">
          {/* Booster Nav Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab('ranks')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'ranks'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Tựa Game & Trình Độ Rank
            </button>
            <button
              onClick={() => setActiveTab('score')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'score'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Điểm Năng Lực (100đ) & Tier
            </button>
            <button
              onClick={() => setActiveTab('payout')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'payout'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Tài Khoản Ngân Hàng (Rút Tiền)
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'general'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <User className="w-4 h-4" />
              Thông Tin & Giới Thiệu
            </button>
          </div>

          {/* TAB 1: GAME RANKS & PROOF (NEW STUDIO UX) */}
          {activeTab === 'ranks' && (
            <div className="space-y-6">
              {/* 1. KHỐI CẤU HÌNH RANK ĐẠI DIỆN TOÀN SÀN */}
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-zinc-900 to-indigo-950/40 p-5 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      Bậc Rank Đại Diện Toàn Sàn Của Booster
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Hiển thị trực tiếp trên danh thiếp Booster, kết quả tìm kiếm và trang hồ sơ.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Global Ranks
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Rank Hiện Tại (Current Rank)
                    </label>
                    <input
                      type="text"
                      value={globalCurrentRank}
                      onChange={(e) => setGlobalCurrentRank(e.target.value)}
                      placeholder="VD: Cao Thủ, Radiant, Master..."
                      className="w-full rounded-xl border border-cyan-500/30 bg-zinc-900/90 px-4 py-2.5 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-400 mb-1.5 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      Rank Cao Nhất / Đỉnh Cao (Highest Rank Peak)
                    </label>
                    <input
                      type="text"
                      value={globalHighestRank}
                      onChange={(e) => setGlobalHighestRank(e.target.value)}
                      placeholder="VD: Thách Đấu, TEST, Radiant..."
                      className="w-full rounded-xl border border-purple-500/30 bg-zinc-900/90 px-4 py-2.5 text-sm font-bold text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. KHỐI CHỌN TỰA GAME ĐỂ THIẾT LẬP (STUDIO CAROUSEL / GRID VỚI ẢNH BÌA) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-blue-400" />
                    Chọn tựa game để thiết lập trình độ & rank:
                  </div>
                  <span className="text-xs text-zinc-400">
                    Đang chọn: <span className="text-blue-400 font-bold">{selectedCatGame?.name || selectedEditGame}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {GAMES_CATALOG.map((g) => {
                    const code = g.id.toUpperCase();
                    const isSelected = selectedEditGame.toUpperCase() === code;
                    const matched = boosterGames.find((bg) => bg.gameCode.toUpperCase() === code);
                    const hasConfiguredRank = matched && matched.ranks && matched.ranks.length > 0 && matched.ranks.some((r) => r && r !== 'N/A' && r.trim() !== '');
                    const bannerImg = g.banner || `/images/games/${code.toLowerCase()}-card.jpg`;

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setSelectedEditGame(code)}
                        className={`relative rounded-2xl overflow-hidden p-3 text-left border transition-all flex flex-col justify-between h-[110px] group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/40'
                            : hasConfiguredRank
                            ? 'border-emerald-500/30 bg-zinc-900/70 hover:border-emerald-500/50'
                            : 'border-white/5 bg-zinc-950/60 hover:border-white/20 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {/* Background overlay */}
                        <div className="absolute inset-0 z-0">
                          <Image
                            src={bannerImg}
                            alt={g.name}
                            fill
                            className="object-cover opacity-25 group-hover:opacity-40 transition-opacity"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
                        </div>

                        <div className="relative z-10 flex items-start justify-between w-full">
                          <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20 relative shrink-0 shadow">
                            <Image src={bannerImg} alt={g.shortName} fill className="object-cover" />
                          </div>
                          {hasConfiguredRank ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Đã có rank" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-zinc-600" title="Chưa cấu hình" />
                          )}
                        </div>

                        <div className="relative z-10 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{g.name}</div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {hasConfiguredRank ? (
                              <span className="text-emerald-400 font-semibold">{matched?.ranks?.[0]}</span>
                            ) : (
                              <span className="text-zinc-500">Chưa nhận cày</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. KHU VỰC CHỈNH SỬA CHI TIẾT TỰA GAME ĐANG CHỌN */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 backdrop-blur-md space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/15 shadow-xl shrink-0">
                      <Image
                        src={selectedCatGame?.banner || `/images/games/${selectedEditGame.toLowerCase()}-card.jpg`}
                        alt={selectedCatGame?.name || selectedEditGame}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-white">{selectedCatGame?.name || selectedEditGame}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                          {selectedEditGame}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {activeGameHasRank
                          ? `Đang kích hoạt nhận đơn cày với Rank: ${currentEditHighestRank}`
                          : 'Tựa game này chưa được cấu hình rank. Điền thông tin bên dưới để mở nhận cày!'}
                      </p>
                    </div>
                  </div>

                  {activeGameHasRank && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGame(selectedEditGame)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa cấu hình game này
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Rank Cao Nhất (Peak Rank) cho {selectedCatGame?.shortName || selectedEditGame}
                    </label>
                    <input
                      type="text"
                      value={currentEditHighestRank === 'N/A' ? '' : currentEditHighestRank}
                      onChange={(e) => handleUpdateGameRank(selectedEditGame, 'highestRank', e.target.value)}
                      placeholder="VD: Thách Đấu, Radiant, TEST, Global Elite..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-sm text-white font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Rank Hiện Tại (Current Rank) cho {selectedCatGame?.shortName || selectedEditGame}
                    </label>
                    <input
                      type="text"
                      value={currentEditCurrentRank === 'N/A' ? '' : currentEditCurrentRank}
                      onChange={(e) => handleUpdateGameRank(selectedEditGame, 'currentRank', e.target.value)}
                      placeholder="VD: Cao Thủ, Immortal 3..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-sm text-white font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Link OPGG / Tracker / Hồ Sơ Ingame
                    </label>
                    <input
                      type="text"
                      value={currentEditOpgg}
                      onChange={(e) => handleUpdateGameRank(selectedEditGame, 'opggLink', e.target.value)}
                      placeholder="https://op.gg/summoners/..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      Link Ảnh Bằng Chứng Rank (Screenshot proof)
                    </label>
                    <input
                      type="text"
                      value={currentEditProof}
                      onChange={(e) => handleUpdateGameRank(selectedEditGame, 'rankImageUrl', e.target.value)}
                      placeholder="https://i.imgur.com/..."
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/90 px-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveBoosterGames}
                    disabled={isSavingGames}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isSavingGames ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu Tất Cả Cấu Hình Trình Độ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE SCORE & TIER BREAKDOWN */}
          {activeTab === 'score' && (
            <div className="space-y-6">
              <SettingsCard
                title="Hệ Thống Đánh Giá Năng Lực & Phân Cấp Booster"
                description="Điểm Performance Score (thang 100) được tính toán tự động qua 5 nhóm tiêu chí độc lập, quyết định cấp bậc Tier và thứ hạng của bạn."
              >
                <div className="space-y-6">
                  {/* Big Score Card */}
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${tierStyle.color} flex items-center justify-center text-white shadow-xl shadow-blue-500/20`}>
                        <Trophy className="w-10 h-10" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-bold text-zinc-400">Cấp Bậc Hiện Tại</div>
                        <div className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                          <span className={tierStyle.text}>{currentTier}</span>
                          <span className="text-zinc-600 text-xl">•</span>
                          <span className="text-emerald-400 text-xl font-bold">{currentScore}/100</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Tổng số đơn hoàn thành: <span className="text-white font-bold">{boosterProfile?.completedOrders || user.booster_info?.completed_orders || 0}</span> | Đánh giá:{' '}
                          <span className="text-amber-400 font-bold">{boosterProfile?.rating || 5.0} ★</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 5 Criteria Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                        <span>Hiệu Suất</span>
                        <span>25%</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {boosterProfile?.scoreBreakdown?.efficiencyScore || 90}/100
                      </div>
                      <p className="text-[11px] text-zinc-500">Tỉ lệ hoàn thành & đúng thời hạn cam kết.</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>Chất Lượng</span>
                        <span>30%</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {boosterProfile?.scoreBreakdown?.qualityScore || 95}/100
                      </div>
                      <p className="text-[11px] text-zinc-500">Điểm đánh giá từ khách & tỷ lệ khiếu nại.</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>Độ Tin Cậy</span>
                        <span>20%</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {boosterProfile?.scoreBreakdown?.reliabilityScore || 100}/100
                      </div>
                      <p className="text-[11px] text-zinc-500">Tỷ lệ hủy nhận đơn & không bỏ ngang.</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-400">
                        <span>Kinh Nghiệm</span>
                        <span>15%</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {boosterProfile?.scoreBreakdown?.experienceScore || 80}/100
                      </div>
                      <p className="text-[11px] text-zinc-500">Khối lượng đơn & thời gian cống hiến.</p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                        <span>Hoạt Động</span>
                        <span>10%</span>
                      </div>
                      <div className="text-xl font-black text-white">
                        {boosterProfile?.scoreBreakdown?.activityScore || 85}/100
                      </div>
                      <p className="text-[11px] text-zinc-500">Tương tác gần đây & trạng thái nhận đơn.</p>
                    </div>
                  </div>
                </div>
              </SettingsCard>
            </div>
          )}

          {/* TAB 3: PAYOUT BANK ACCOUNT */}
          {activeTab === 'payout' && (
            <div className="space-y-6">
              <SettingsCard
                title="Tài Khoản Ngân Hàng Nhận Tiền Rút & Thù Lao"
                description="Cung cấp chính xác thông tin tài khoản ngân hàng chính chủ để nhận thanh toán thù lao cày thuê."
                className="relative z-20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Ngân hàng thụ hưởng</label>
                    <button
                      type="button"
                      onClick={() => setIsBankOpen(true)}
                      className="flex items-center justify-between w-full rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-500 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer min-h-[48px] group text-left shadow-sm"
                    >
                      {bankName ? (
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-black/10">
                            {banks.find((b) => b.shortName === bankName)?.logo ? (
                              <img
                                src={banks.find((b) => b.shortName === bankName)?.logo}
                                alt="Bank Logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Landmark className="w-4 h-4 text-zinc-700" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold text-sm truncate">{bankName}</span>
                              {banks.find((b) => b.shortName === bankName)?.code && (
                                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                                  {banks.find((b) => b.shortName === bankName)?.code}
                                </span>
                              )}
                            </div>
                            {banks.find((b) => b.shortName === bankName)?.name && (
                              <span className="text-xs text-zinc-400 truncate max-w-[280px]">
                                {banks.find((b) => b.shortName === bankName)?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-300">
                          <Landmark className="w-5 h-5 text-zinc-500" />
                          <span className="text-sm">Chọn ngân hàng thụ hưởng...</span>
                        </div>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400 group-hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Số tài khoản ngân hàng</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Tên chủ tài khoản (In hoa không dấu)
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500 transition-colors uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveBankInfo}
                    disabled={isSavingBank}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSavingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu Tài Khoản Ngân Hàng
                  </button>
                </div>
              </SettingsCard>
            </div>
          )}

          {/* TAB 4: GENERAL & BIO */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <SettingsCard
                title="Thông Tin Cá Nhân & Bio Giới Thiệu"
                description="Cập nhật tên tài khoản, ảnh đại diện và lời giới thiệu kinh nghiệm để tạo ấn tượng tốt nhất."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                      <input
                        type="text"
                        id="avatar-input"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Lời giới thiệu bản thân (Bio hiển thị ngoài trang Booster)
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500 min-h-[120px]"
                        placeholder="Viết đôi dòng về thành tích thi đấu, sở trường leo rank, thời gian online..."
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Lưu Hồ Sơ
                    </button>
                  </div>
                </div>
              </SettingsCard>

              {/* Booster Operations Shortcuts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/booster/jobs"
                  className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4 hover:border-blue-500/30 transition-all group"
                >
                  <ShoppingBag className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Chợ Đơn Hàng</div>
                  <div className="text-xs text-zinc-500">Xem và nhận các đơn mới</div>
                </Link>
                <Link
                  href="/booster/my-orders"
                  className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4 hover:border-emerald-500/30 transition-all group"
                >
                  <CheckCheck className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Đơn Của Tôi</div>
                  <div className="text-xs text-zinc-500">Tiến độ cày các đơn đã nhận</div>
                </Link>
                <Link
                  href="/booster/services"
                  className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4 hover:border-yellow-500/30 transition-all group"
                >
                  <Settings className="w-6 h-6 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Cấu Hình Bảng Giá</div>
                  <div className="text-xs text-zinc-500">Tùy biến giá dịch vụ nhận cày</div>
                </Link>
                <Link
                  href="/wallet"
                  className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4 hover:border-purple-500/30 transition-all group"
                >
                  <Wallet className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Ví & Thu Nhập</div>
                  <div className="text-xs text-zinc-500">Quản lý số dư và rút tiền</div>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CASE 2: PROFILE VIEW FOR ROLE 'CUSTOMER'
      ========================================================================= */}
      {user.role === 'CUSTOMER' && (
        <div className="space-y-6">
          {/* Customer Dashboard Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-bold uppercase">Số Dư Khả Dụng</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {new Intl.NumberFormat('vi-VN').format(user.wallet_balance || 0)} đ
              </div>
              <Link
                href="/wallet"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                Nạp tiền ví <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-bold uppercase">Đơn Hàng Cày Thuê</span>
                <ShoppingBag className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-white">Quản Lý Đơn</div>
              <Link
                href="/orders"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
              >
                Xem tiến độ đơn <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-bold uppercase">Điểm LeoPoints</span>
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">
                {user.loyalty_points || 0} điểm
              </div>
              <Link
                href="/loyalty"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold"
              >
                Đổi quà & Voucher <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-bold uppercase">Dịch Vụ Cày Thuê</span>
                <Gamepad2 className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-black text-yellow-400">11+ Game</div>
              <Link
                href="/services"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 font-bold"
              >
                Bảng giá & Đặt đơn <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Personal Info Card */}
          <SettingsCard title={t('personalInfo')} description={t('personalInfoDesc')}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t('username')}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">{t('email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Avatar URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-avatar.jpg"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('saveChanges')}
                </button>
              </div>
            </div>
          </SettingsCard>

          {/* Refund Bank Info Card */}
          <SettingsCard
            title="Tài Khoản Nhận Hoàn Tiền (Refund)"
            description="Thông tin tài khoản ngân hàng để hệ thống hoàn trả tiền tự động khi đơn hàng có khiếu nại hoặc hủy bỏ."
            className="relative z-20"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Ngân hàng thụ hưởng</label>
                <button
                  type="button"
                  onClick={() => setIsBankOpen(true)}
                  className="flex items-center justify-between w-full rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-500 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer min-h-[48px] group text-left shadow-sm"
                >
                  {bankName ? (
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-black/10">
                        {banks.find((b) => b.shortName === bankName)?.logo ? (
                          <img
                            src={banks.find((b) => b.shortName === bankName)?.logo}
                            alt="Bank Logo"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Landmark className="w-4 h-4 text-zinc-700" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm truncate">{bankName}</span>
                          {banks.find((b) => b.shortName === bankName)?.code && (
                            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                              {banks.find((b) => b.shortName === bankName)?.code}
                            </span>
                          )}
                        </div>
                        {banks.find((b) => b.shortName === bankName)?.name && (
                          <span className="text-xs text-zinc-400 truncate max-w-[280px]">
                            {banks.find((b) => b.shortName === bankName)?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 text-zinc-400 group-hover:text-zinc-300">
                      <Landmark className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm">Chọn ngân hàng hoàn tiền...</span>
                    </div>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400 group-hover:text-white transition-colors" />
                </button>
              </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Số tài khoản</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0123456789"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Tên chủ tài khoản (In hoa không dấu)
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                      placeholder="NGUYEN VAN A"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500 uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveBankInfo}
                    disabled={isSavingBank}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {isSavingBank ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu Tài Khoản Hoàn Tiền
                  </button>
                </div>
              </SettingsCard>
        </div>
      )}

      {/* =========================================================================
          CASE 3: PROFILE VIEW FOR ROLE 'STAFF'
      ========================================================================= */}
      {user.role === 'STAFF' && (
        <div className="space-y-6">
          <SettingsCard
            title="Quyền Hạn & Phạm Vi Vận Hành Của Bạn"
            description="Tài khoản này được cấp quyền kiểm duyệt và điều hành các module nghiệp vụ của LeoRank."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(user.staff_permissions && user.staff_permissions.length > 0
                  ? user.staff_permissions
                  : ['users', 'disputes', 'deposits', 'cron', 'settings', 'blogs']
                ).map((perm) => (
                  <span
                    key={perm}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {perm}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 hover:border-amber-500/30 transition-all group"
                >
                  <Shield className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Xử Lý Khiếu Nại</div>
                  <div className="text-xs text-zinc-500">Giải quyết tranh chấp đơn hàng</div>
                </Link>
                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 hover:border-emerald-500/30 transition-all group"
                >
                  <Wallet className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Duyệt Nạp & Rút</div>
                  <div className="text-xs text-zinc-500">Đối soát giao dịch ngân hàng</div>
                </Link>
                <Link
                  href="/admin"
                  className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 hover:border-blue-500/30 transition-all group"
                >
                  <User className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Quản Lý Booster</div>
                  <div className="text-xs text-zinc-500">Kiểm duyệt hồ sơ ứng tuyển</div>
                </Link>
              </div>
            </div>
          </SettingsCard>
        </div>
      )}

      {/* =========================================================================
          CASE 4: PROFILE VIEW FOR ROLE 'ADMIN'
      ========================================================================= */}
      {user.role === 'ADMIN' && (
        <div className="space-y-6">
          <SettingsCard
            title="Trung Tâm Điều Hành Quản Trị Viên Tối Cao (Super Admin)"
            description="Bạn có toàn quyền kiểm soát hệ thống, cấu hình trọng số đánh giá Booster, quản lý tài chính và tài khoản."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin"
                className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-5 hover:border-rose-500/40 transition-all group"
              >
                <Flame className="w-7 h-7 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Bảng Quản Trị Admin</div>
                <div className="text-xs text-zinc-500 mt-1">Truy cập tổng quan số liệu toàn hệ thống</div>
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl border border-blue-500/20 bg-blue-950/10 p-5 hover:border-blue-500/40 transition-all group"
              >
                <Trophy className="w-7 h-7 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Cấu Hình Trọng Số & Tier</div>
                <div className="text-xs text-zinc-500 mt-1">Quản lý module Trình Độ & Xếp Hạng</div>
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5 hover:border-emerald-500/40 transition-all group"
              >
                <Wallet className="w-7 h-7 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Kiểm Soát Tài Chính</div>
                <div className="text-xs text-zinc-500 mt-1">Doanh thu, phí sàn và số dư escrow</div>
              </Link>

              <Link
                href="/admin"
                className="rounded-2xl border border-purple-500/20 bg-purple-950/10 p-5 hover:border-purple-500/40 transition-all group"
              >
                <Layers className="w-7 h-7 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-sm font-bold text-white">Kiểm Duyệt Booster</div>
                <div className="text-xs text-zinc-500 mt-1">Duyệt hồ sơ và đồng bộ trình độ rank</div>
              </Link>
            </div>
          </SettingsCard>
        </div>
      )}

      {/* =========================================================================
          COMMON SECTION: CHANGE PASSWORD (For non-OAuth users)
      ========================================================================= */}
      {user.platform !== 'GOOGLE' && user.platform !== 'FACEBOOK' ? (
        <SettingsCard title={t('changePassword')} description={t('changePasswordDesc')}>
          <div className="max-w-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">{t('currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">{t('newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">{t('confirmNewPassword')}</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-white focus:border-blue-500"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-6 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                {t('updatePassword')}
              </button>
            </div>
          </div>
        </SettingsCard>
      ) : (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-6 backdrop-blur-md">
          <p className="text-blue-400 text-sm">
            Bạn đang đăng nhập bằng tài khoản liên kết {user.platform}. Vui lòng quản lý mật khẩu tại nhà cung cấp dịch vụ tương ứng.
          </p>
        </div>
      )}

      {/* =========================================================================
          COMMON SECTION: DANGER ZONE
      ========================================================================= */}
      <DangerZoneCard title={t('dangerZone')} description={t('dangerZoneDesc')}>
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
      </DangerZoneCard>
    </div>
  );
}
