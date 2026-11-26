'use client';
import BarLoader from '@/components/ui/BarLoader';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Lock,
  Tag,
  Coins,
  Wallet,
  ArrowRight,
  Loader2,
  Clock,
  User,
  AlertCircle,
  Gamepad2,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

interface BoosterInfo {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  rating: number;
  completedOrders: number;
  currentRank?: string;
  highestRank?: string;
  coupon?: {
    code: string;
    discountPercent: number;
    isActive: boolean;
  } | null;
}

interface ServiceData {
  id: string;
  gameCode: string;
  name: string;
  desc?: string;
  pricingType: 'PER_UNIT' | 'FIXED';
  price: number;
  unitName?: string;
  depositPercent: number;
  requiredFields: string[];
}

export default function BookCustomServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = (params?.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState<ServiceData | null>(null);
  const [booster, setBooster] = useState<BoosterInfo | null>(null);

  // User & Wallet State
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form State
  const [quantity, setQuantity] = useState<number>(10);
  const [formData, setFormData] = useState<Record<string, string>>({
    currentRank: 'Vàng IV',
    desiredRank: 'Bạch Kim IV',
    server: 'VN',
    ingameName: '',
    accountUsername: '',
    accountPassword: '',
    customerPhone: '',
    customerNotes: '',
  });

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState('');

  // Fetch Service Details
  useEffect(() => {
    if (!serviceId) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/boosters/marketplace/services/${serviceId}`);
        if (!res.ok) {
          throw new Error('Không thể tải thông tin dịch vụ');
        }
        const data = await res.json();
        setService(data.service);
        setBooster(data.booster);

        // Auto apply booster coupon if available
        if (data.booster?.coupon?.isActive && data.booster.coupon.code) {
          setCouponCode(data.booster.coupon.code);
          setAppliedDiscount(data.booster.coupon.discountPercent || 0);
        }
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi tải dịch vụ');
      } finally {
        setLoading(false);
      }
    };

    // Load logged in user
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {}
    }

    fetchService();
  }, [serviceId]);

  // Handle Apply Coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setAppliedDiscount(0);
      return;
    }

    if (booster?.coupon && booster.coupon.isActive && booster.coupon.code.toUpperCase() === code) {
      setAppliedDiscount(booster.coupon.discountPercent);
      toast.success(`Đã áp dụng mã giảm giá ${booster.coupon.discountPercent}% của tuyển thủ!`);
    } else {
      setAppliedDiscount(0);
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  // Calculations
  const rawTotal = useMemo(() => {
    if (!service) return 0;
    if (service.pricingType === 'PER_UNIT') {
      return (service.price || 1000) * Math.max(1, quantity);
    }
    return service.price || 0;
  }, [service, quantity]);

  const discountAmount = useMemo(() => {
    if (appliedDiscount <= 0) return 0;
    return Math.round((rawTotal * appliedDiscount) / 100);
  }, [rawTotal, appliedDiscount]);

  const finalTotal = Math.max(0, rawTotal - discountAmount);

  const depositPercent = service?.depositPercent || 100;
  const depositAmount = Math.round((finalTotal * depositPercent) / 100);

  const walletBalance = currentUser?.wallet_balance || 0;
  const isBalanceSufficient = walletBalance >= depositAmount;

  // Handle Checkout / Booking
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để đặt dịch vụ');
      router.push(`/login?redirect=/services/book/${serviceId}`);
      return;
    }

    if (!isBalanceSufficient) {
      toast.error(`Số dư ví (${walletBalance.toLocaleString('vi-VN')} đ) không đủ để thanh toán tiền cọc (${depositAmount.toLocaleString('vi-VN')} đ). Vui lòng nạp thêm tiền vào ví.`);
      router.push('/wallet');
      return;
    }

    // Validate required fields
    if (service?.requiredFields?.includes('account_credentials')) {
      if (!formData.accountUsername || !formData.accountPassword) {
        toast.error('Vui lòng nhập tài khoản và mật khẩu game để Booster đăng nhập thực hiện');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        boosterId: booster?._id,
        serviceType: service?.name || 'CUSTOM_SERVICE',
        pricing: {
          basePrice: rawTotal,
          optionFees: 0,
          totalPrice: finalTotal,
          depositAmount: depositAmount,
          depositPercentage: depositPercent,
          discountAmount: discountAmount,
          couponCode: appliedDiscount > 0 ? couponCode : undefined,
        },
        details: {
          serviceId: service?.id,
          gameCode: service?.gameCode,
          pricingType: service?.pricingType,
          quantity: service?.pricingType === 'PER_UNIT' ? quantity : 1,
          ...formData,
        },
        options: {
          notes: formData.customerNotes,
        },
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tạo đơn hàng');
      }

      toast.success('Đặt dịch vụ và thanh toán tiền cọc thành công!');

      // Cập nhật số dư ví trong session
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          wallet_balance: Math.max(0, currentUser.wallet_balance - depositAmount),
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('user-updated'));
      }

      router.push(`/orders/${data.order?._id || data.orderId || ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] text-white">
        <Navbar />
        <BarLoader className="min-h-[60vh]" label="Đang tải thông tin dịch vụ..." />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#070709] text-white">
        <Navbar />
        <div className="max-w-md mx-auto pt-36 px-4 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold">Không tìm thấy dịch vụ</h2>
          <p className="text-zinc-400 text-sm">Dịch vụ này có thể đã bị gỡ hoặc ngừng cung cấp.</p>
          <Link
            href="/services"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Quay lại sàn dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-24 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service & Booster Card */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                  {service.gameCode}
                </span>
                {service.depositPercent < 100 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                    Cọc {service.depositPercent}%
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Trọn gói 100%
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                {service.name}
              </h1>

              {service.desc && (
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  {service.desc}
                </p>
              )}

              {/* Booster Profile Row */}
              {booster && (
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <Link
                    href={`/b/${booster.username}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 overflow-hidden shrink-0 group-hover:border-blue-500 transition-colors">
                      {booster.avatar ? (
                        <img
                          src={booster.avatar}
                          alt={booster.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-full h-full p-2 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                          {booster.displayName || booster.username}
                        </span>
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          Tuyển thủ
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {booster.rating.toFixed(1)}
                        </span>
                        <span>•</span>
                        <span>{booster.completedOrders} đơn hoàn thành</span>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/b/${booster.username}`}
                    className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    Xem hồ sơ
                  </Link>
                </div>
              )}
            </div>

            {/* Booster Coupon Banner */}
            {booster?.coupon?.isActive && (
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      Ưu đãi từ tuyển thủ: Giảm {booster.coupon.discountPercent}%
                    </div>
                    <div className="text-xs text-zinc-400">
                      Mã: <span className="font-mono font-bold text-blue-400">{booster.coupon.code}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCouponCode(booster.coupon?.code || '');
                    setAppliedDiscount(booster.coupon?.discountPercent || 0);
                    toast.success('Đã áp dụng mã giảm giá!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Áp dụng
                </button>
              </div>
            )}

            {/* Form Requirements */}
            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Pricing Specification (if PER_UNIT) */}
              {service.pricingType === 'PER_UNIT' && (
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Coins className="w-4 h-4 text-blue-400" />
                    Số lượng {service.unitName || 'điểm / trận'} cần thuê
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">
                        Số lượng ({service.unitName || 'Điểm'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">Đơn giá</label>
                      <div className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-emerald-400 text-sm font-bold">
                        {service.price.toLocaleString('vi-VN')} đ / {service.unitName || 'Điểm'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Credentials (if required) */}
              {service.requiredFields?.includes('account_credentials') && (
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <h3 className="text-base font-bold text-white">
                      Thông tin tài khoản Game
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Thông tin được mã hóa bảo mật và chỉ cung cấp cho Booster khi đơn hàng được xác nhận.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">
                        Tên đăng nhập tài khoản *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Tài khoản Riot / Game"
                        value={formData.accountUsername}
                        onChange={(e) => setFormData({ ...formData, accountUsername: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">
                        Mật khẩu tài khoản *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mật khẩu"
                        value={formData.accountPassword}
                        onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">
                        Tên Ingame (Riot ID #TAG)
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Faker#VN2"
                        value={formData.ingameName}
                        onChange={(e) => setFormData({ ...formData, ingameName: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1.5">
                        Máy chủ (Server)
                      </label>
                      <select
                        value={formData.server}
                        onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                      >
                        <option value="VN">Việt Nam (VN)</option>
                        <option value="KR">Hàn Quốc (KR)</option>
                        <option value="NA">Bắc Mỹ (NA)</option>
                        <option value="EUW">Tây Âu (EUW)</option>
                        <option value="SEA">Đông Nam Á (SEA)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranks Requirement */}
              {(service.requiredFields?.includes('current_rank') || service.requiredFields?.includes('desired_rank')) && (
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Cấu hình Hạng mục Rank
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {service.requiredFields?.includes('current_rank') && (
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1.5">Rank hiện tại</label>
                        <input
                          type="text"
                          placeholder="VD: Vàng IV, Bạch Kim II..."
                          value={formData.currentRank}
                          onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                    {service.requiredFields?.includes('desired_rank') && (
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1.5">Rank mong muốn</label>
                        <input
                          type="text"
                          placeholder="VD: Kim Cương IV, Cao Thủ..."
                          value={formData.desiredRank}
                          onChange={(e) => setFormData({ ...formData, desiredRank: e.target.value })}
                          className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-3">
                <label className="text-sm font-bold text-white block">
                  Yêu cầu / Ghi chú cho Booster
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Chỉ chơi vị trí Đi Rừng, tướng Lee Sin/Viego, không chat trong game..."
                  value={formData.customerNotes}
                  onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none placeholder:text-zinc-600 resize-none"
                />
              </div>
            </form>
          </div>

          {/* Right Column: Sticky Summary & Checkout */}
          <div className="space-y-6">
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-md sticky top-28 space-y-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white pb-3 border-b border-white/10">
                Tóm tắt thanh toán
              </h3>

              {/* Pricing breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Giá dịch vụ gốc:</span>
                  <span className="font-semibold text-white">
                    {rawTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Giảm giá ({appliedDiscount}%):
                    </span>
                    <span className="font-bold">
                      -{discountAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-zinc-300 pt-2 border-t border-white/5">
                  <span className="font-medium">Tổng giá trị đơn:</span>
                  <span className="font-extrabold text-white text-base">
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Deposit Highlight Box */}
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300">
                      Tiền cọc thanh toán ngay ({depositPercent}%):
                    </span>
                    <span className="text-lg font-black text-blue-400">
                      {depositAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Tiền cọc được hệ thống tạm giữ an toàn và chỉ thanh toán cho tuyển thủ sau khi bạn xác nhận hoàn thành đơn.
                  </p>
                </div>
              </div>

              {/* Coupon Input */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-zinc-400">
                  Mã khuyến mãi
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập mã KM..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase tracking-wider focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
              </div>

              {/* Wallet Balance Check */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                    Số dư ví hiện tại:
                  </span>
                  <span
                    className={`font-bold ${
                      isBalanceSufficient ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {walletBalance.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {!isBalanceSufficient && (
                  <p className="text-[11px] text-red-400">
                    Số dư không đủ để đặt cọc. Cần thêm{' '}
                    {(depositAmount - walletBalance).toLocaleString('vi-VN')} đ.
                  </p>
                )}
              </div>

              {/* Action Button */}
              {isBalanceSufficient ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý đơn...</span>
                    </>
                  ) : (
                    <>
                      <span>Đặt đơn & Thanh toán cọc</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/wallet"
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Nạp tiền vào ví</span>
                </Link>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bảo chứng hoàn tiền 100% nếu có tranh chấp</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
