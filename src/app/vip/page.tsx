// src/app/vip/page.tsx
'use client';
import BarLoader from '@/components/ui/BarLoader';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import {
  Crown,
  Shield,
  Check,
  Zap,
  Star,
  Sparkles,
  ArrowRight,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ChevronDown,
  Gift,
  Coins,
  ShieldCheck,
  UserCheck,
  Layers,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface VipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  originalPrice?: number;
  discountPercent: number;
  periodLabel: string;
  badge?: string;
  popular?: boolean;
}

interface VipBenefit {
  id: string;
  title: string;
  desc: string;
}

interface UserVipStatus {
  isVip: boolean;
  packageType: string | null;
  discountPercent: number;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
}

interface UserWalletData {
  id?: string;
  username?: string;
  email?: string;
  walletBalance: number;
}

const DEFAULT_PLANS: VipPlan[] = [
  {
    id: '1_MONTH',
    name: 'LeoRank VIP Pass (1 Tháng)',
    durationDays: 30,
    price: 199000,
    originalPrice: 250000,
    discountPercent: 10,
    periodLabel: '30 ngày',
    badge: 'Khởi đầu',
  },
  {
    id: '3_MONTHS',
    name: 'LeoRank VIP Pro (3 Tháng)',
    durationDays: 90,
    price: 499000,
    originalPrice: 597000,
    discountPercent: 10,
    periodLabel: '90 ngày',
    popular: true,
    badge: 'Phổ biến nhất',
  },
  {
    id: '1_YEAR',
    name: 'LeoRank VIP Diamond (1 Năm)',
    durationDays: 365,
    price: 1590000,
    originalPrice: 2388000,
    discountPercent: 15,
    periodLabel: '365 ngày',
    badge: 'Tiết kiệm 35%',
  },
];

const DEFAULT_BENEFITS: VipBenefit[] = [
  {
    id: 'discount',
    title: 'Chiết Khấu 10% - 15% Toàn Bộ Đơn Hàng',
    desc: 'Tự động giảm giá trực tiếp mọi dịch vụ cày thuê LMHT, Valorant, ĐTCL, Liên Quân và tất cả game khác.',
  },
  {
    id: 'priority',
    title: 'Ưu Tiên Ghép Tuyển Thủ 3 Phút',
    desc: 'Đơn hàng VIP được ưu tiên đẩy lên đầu sàn việc làm, tự động chỉ định Booster Thách Đấu có tỷ lệ thắng trên 85%.',
  },
  {
    id: 'free_role',
    title: 'Miễn Phí Chọn Vị Trí & Tướng Tủ',
    desc: 'Miễn phí hoàn toàn phụ phí chọn tướng, chỉ định vị trí thi đấu (tiết kiệm thêm 20% - 30% trên mỗi đơn).',
  },
  {
    id: 'support',
    title: 'Chuyên Viên Chăm Sóc 1-1 Riêng Biệt',
    desc: 'Hỗ trợ VIP 24/7 qua Telegram/Zalo, giải quyết mọi yêu cầu phát sinh và điều phối tuyển thủ trong 5 phút.',
  },
  {
    id: 'insurance',
    title: 'Bảo Hiểm Tài Khoản 100% LeoRank Escrow',
    desc: 'Cam kết bồi thường 100% giá trị tài khoản và hoàn tiền nếu có sự cố kỷ luật do tuyển thủ gây ra.',
  },
  {
    id: 'leopoint',
    title: 'Nhân Đôi (x2) Điểm Thưởng LeoPoint',
    desc: 'Tích lũy x2 điểm thưởng khi hoàn thành đơn để đổi Skin, Thẻ cào và quà tặng hiện vật giá trị cao.',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Chiết khấu giảm giá dịch vụ', normal: 'Không có (0%)', vip: 'Giảm 10% - 15% trọn đời' },
  { feature: 'Tốc độ ghép tuyển thủ nhận cày', normal: 'Hàng đợi tiêu chuẩn (15 - 30p)', vip: 'Ưu tiên VIP (< 3 phút)' },
  { feature: 'Cấp bậc tuyển thủ phụ trách', normal: 'Bất kỳ tuyển thủ online', vip: 'Top 10 Thách Đấu / Pro tỉ lệ thắng 88%+' },
  { feature: 'Phụ phí chọn Tướng / Đường thi đấu', normal: 'Tính thêm 20% - 30%', vip: 'Miễn phí 100%' },
  { feature: 'Kênh hỗ trợ & xử lý sự cố', normal: 'Ticket hệ thống', vip: 'CSKH 1-1 qua Telegram / Zalo riêng' },
  { feature: 'Tích lũy điểm thưởng LeoPoint', normal: 'x1 điểm thường', vip: 'x2 điểm thưởng' },
  { feature: 'Bảo chứng tài khoản LeoRank Escrow', normal: 'Có bảo chứng', vip: 'Bảo chứng toàn diện + Cam kết bồi thường 100%' },
];

const FAQS = [
  {
    q: 'Lợi ích giảm giá VIP được áp dụng như thế nào khi tôi đặt cày?',
    a: 'Ngay khi bạn sở hữu VIP Pass, khi tạo đơn bất kỳ dịch vụ nào (Cày Rank, Cày Trận Thắng, Phân Hạng, v.v.), hệ thống tính giá tự động trừ trực tiếp 10% hoặc 15% vào tổng tiền thanh toán mà bạn không cần phải nhập thêm bất kỳ mã giảm giá nào.',
  },
  {
    q: 'Nếu tôi đang có VIP mà mua thêm gói khác thì thời hạn có được cộng dồn không?',
    a: 'Có! Hệ thống tự động tính ngày hết hạn hiện tại của bạn và cộng dồn thêm số ngày của gói mới (30 ngày, 90 ngày hoặc 365 ngày). Bạn hoàn toàn không bị mất bất kỳ ngày VIP nào.',
  },
  {
    q: 'Tôi có thể thanh toán bằng phương thức nào?',
    a: 'Bạn thanh toán trực tiếp qua Số dư Ví LeoRank. Bạn có thể nạp tiền vào ví qua chuyển khoản VietQR tự động 24/7 chỉ trong 30 giây tại trang Ví tiền.',
  },
  {
    q: 'Nếu hết hạn VIP thì tài khoản của tôi sẽ như thế nào?',
    a: 'Khi hết hạn, tài khoản của bạn sẽ tự động chuyển về trạng thái Thành viên tiêu chuẩn. Mọi đơn hàng đã đặt trong thời gian VIP vẫn được hưởng đầy đủ ưu tiên và chiết khấu đã áp dụng.',
  },
];

function VipPageContent() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<VipPlan[]>(DEFAULT_PLANS);
  const [benefits, setBenefits] = useState<VipBenefit[]>(DEFAULT_BENEFITS);
  const [vipStatus, setVipStatus] = useState<UserVipStatus | null>(null);
  const [userData, setUserData] = useState<UserWalletData | null>(null);

  // Modal State
  const [selectedPlanForBuy, setSelectedPlanForBuy] = useState<VipPlan | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch plans
        try {
          const planRes = await apiFetch<any>('/vip/plans');
          if (planRes?.plans && Array.isArray(planRes.plans)) {
            setPlans(planRes.plans);
          }
          if (planRes?.benefits && Array.isArray(planRes.benefits)) {
            setBenefits(planRes.benefits);
          }
        } catch {
          // Fallback to defaults
        }

        // 2. Fetch my status
        try {
          const statusRes = await apiFetch<any>('/vip/my-status');
          if (statusRes?.success) {
            setVipStatus(statusRes.vip);
            setUserData(statusRes.user);
          }
        } catch {
          // Chưa đăng nhập hoặc guest
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenSubscribeModal = (plan: VipPlan) => {
    if (!userData) {
      toast.error('Vui lòng đăng nhập để đăng ký gói Hội Viên VIP');
      router.push('/login?redirect=/vip');
      return;
    }
    setSelectedPlanForBuy(plan);
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPlanForBuy) return;
    setSubscribing(true);
    try {
      const res = await apiFetch<any>('/vip/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlanForBuy.id }),
      });

      if (res?.success) {
        toast.success(res.message || 'Kích hoạt gói VIP thành công!');
        if (res.vip) {
          setVipStatus(res.vip);
        }
        if (typeof res.newBalance === 'number' && userData) {
          setUserData({ ...userData, walletBalance: res.newBalance });
        }
        setSelectedPlanForBuy(null);
      } else {
        toast.error(res?.message || 'Không thể kích hoạt gói VIP');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi thanh toán');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans selection:bg-emerald-500/30">
      <Navbar />

      <main className="relative pt-24 pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <BackButton />
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">
              Trang Chủ
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-emerald-400 font-bold">Hội Viên VIP Pass</span>
          </nav>
        </div>

        {/* ========================================================================= */}
        {/* HERO BANNER: LeoRank VIP Pass                                             */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-7 sm:p-12 mb-12 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-cyan-950/20 to-zinc-950 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)]">
          {/* Decorative Lighting */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Crown className="w-4 h-4 text-emerald-400" />
                <span>Đặc Quyền Thành Viên Cao Cấp LeoRank</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                Nâng Tầm Đẳng Cấp Với{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                  LeoRank VIP Pass
                </span>
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl mb-6">
                Tối ưu chi phí leo rank dài hạn với mức giảm giá 10% - 15% trọn đời, miễn phí chọn tướng và quyền ưu tiên ghép những tuyển thủ Thách Đấu hàng đầu Việt Nam.
              </p>

              {/* Status Badge */}
              {userData && vipStatus?.isVip ? (
                <div className="inline-flex items-center gap-3 p-3 px-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-950/40">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Gói hiện tại của bạn:</div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-emerald-400">{vipStatus.packageType}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Còn {vipStatus.daysRemaining} ngày
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-white/5 px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kích hoạt ngay bằng số dư ví, nhận đặc quyền tức thì</span>
                </div>
              )}
            </div>

            {/* Glowing 3D Shield Graphic */}
            <div className="relative shrink-0 flex items-center justify-center self-center lg:self-auto">
              <div className="absolute inset-0 bg-emerald-500/25 blur-3xl rounded-full" />
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-emerald-400/80 via-teal-500/40 to-cyan-500/60 p-1 shadow-[0_0_50px_rgba(16,185,129,0.35)]">
                <div className="w-full h-full bg-[#0a0f12] rounded-[22px] flex flex-col items-center justify-center p-4 border border-white/10 text-center">
                  <Shield className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                    100% Escrow
                  </span>
                  <span className="text-[10px] text-zinc-400">Bảo chứng tài chính</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DANH SÁCH 3 GÓI HỘI VIÊN VIP                                              */}
        {/* ========================================================================= */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Lựa Chọn Gói Hội Viên Phù Hợp
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Đăng ký linh hoạt theo tháng hoặc theo năm. Nâng cấp bất cứ lúc nào với thời gian được cộng dồn 100%.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.popular;
              const isDiamond = plan.id === '1_YEAR';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
                    isPopular
                      ? 'bg-gradient-to-b from-emerald-950/50 via-zinc-900 to-zinc-950 border-2 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : isDiamond
                      ? 'bg-gradient-to-b from-cyan-950/40 via-zinc-900 to-zinc-950 border border-cyan-500/40 hover:border-cyan-500/70 shadow-lg'
                      : 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 shadow-md'
                  }`}
                >
                  {/* Top Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                          isPopular
                            ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                            : isDiamond
                            ? 'bg-cyan-500 text-black shadow-cyan-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        <Sparkles size={12} className="stroke-[3]" />
                        <span>{plan.badge}</span>
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="pt-2 mb-4">
                      <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white font-mono">
                          {plan.price.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-xs text-zinc-400">/ {plan.periodLabel}</span>
                      </div>
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <div className="text-xs text-zinc-500 line-through mt-0.5">
                          Giá gốc: {plan.originalPrice.toLocaleString('vi-VN')} đ
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-white/10 my-4" />

                    {/* Features list */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                        <span>
                          Giảm <strong>{plan.discountPercent}%</strong> cho tất cả đơn hàng
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                        <span>Ưu tiên ghép Tuyển thủ Top 10 Thách Đấu</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                        <span>Miễn phí chọn Tướng tủ & Vị trí</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                        <span>Nhân đôi (x2) điểm tích lũy LeoPoint</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check size={13} className="stroke-[3]" />
                        </div>
                        <span>Hỗ trợ VIP 1-1 riêng biệt qua Telegram/Zalo</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenSubscribeModal(plan)}
                    className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02]'
                        : isDiamond
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <span>
                      {vipStatus?.isVip ? 'Gia Hạn Gói Này' : 'Đăng Ký Gói Này'}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CHI TIẾT 6 ĐẶC QUYỀN VIP PASS                                             */}
        {/* ========================================================================= */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold uppercase mb-2">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span>Đặc Quyền Vượt Trội</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tất Cả Đặc Quyền Dành Riêng Cho Hội Viên VIP
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, idx) => {
              const icons = [Coins, Zap, UserCheck, ShieldCheck, Shield, Gift];
              const IconComp = icons[idx % icons.length];

              return (
                <div
                  key={b.id || idx}
                  className="p-5 sm:p-6 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-emerald-500/30 transition-all group backdrop-blur-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/10">
                    <IconComp size={22} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BẢNG SO SÁNH QUYỀN LỢI THÀNH VIÊN THƯỜNG VS VIP                           */}
        {/* ========================================================================= */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              Bảng So Sánh Quyền Lợi
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Xem rõ sự khác biệt giữa tài khoản thông thường và tài khoản VIP Pass.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-950/70">
                    <th className="py-4 px-5 text-zinc-400 font-bold uppercase text-[11px] sm:text-xs">
                      Tiêu chí dịch vụ
                    </th>
                    <th className="py-4 px-5 text-zinc-400 font-bold uppercase text-[11px] sm:text-xs">
                      Tài Khoản Tiêu Chuẩn
                    </th>
                    <th className="py-4 px-5 text-emerald-400 font-black uppercase text-[11px] sm:text-xs bg-emerald-950/20">
                      LeoRank VIP Pass 👑
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5 font-bold text-white">
                        {row.feature}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400">
                        {row.normal}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-emerald-300 bg-emerald-950/15">
                        {row.vip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FAQ ACCORDION                                                             */}
        {/* ========================================================================= */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
              Câu Hỏi Thường Gặp Về Hội Viên VIP
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/5 bg-zinc-900/60 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full py-4 px-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL XÁC NHẬN MUA / GIA HẠN GÓI VIP BẰNG VÍ                             */}
        {/* ========================================================================= */}
        {selectedPlanForBuy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-[#0f0f12] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Crown size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      {vipStatus?.isVip ? 'Xác Nhận Gia Hạn VIP' : 'Xác Nhận Đăng Ký VIP'}
                    </h3>
                    <p className="text-xs text-zinc-400">Thanh toán tự động qua số dư Ví</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanForBuy(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="py-5 space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Gói lựa chọn:</span>
                    <span className="text-white font-bold">{selectedPlanForBuy.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Thời gian cộng thêm:</span>
                    <span className="text-emerald-400 font-bold">{selectedPlanForBuy.durationDays} ngày</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Đặc quyền giảm giá:</span>
                    <span className="text-emerald-400 font-bold">Giảm {selectedPlanForBuy.discountPercent}% toàn sàn</span>
                  </div>
                  <div className="h-px bg-white/5 my-1" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-300 font-bold">Số tiền cần thanh toán:</span>
                    <span className="text-emerald-400 font-black font-mono text-base">
                      {selectedPlanForBuy.price.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* Wallet Balance check */}
                {userData && (
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Wallet size={14} />
                        <span>Số dư Ví của bạn:</span>
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          userData.walletBalance >= selectedPlanForBuy.price
                            ? 'text-white'
                            : 'text-red-400'
                        }`}
                      >
                        {userData.walletBalance.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {userData.walletBalance < selectedPlanForBuy.price && (
                      <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-red-400 flex items-start gap-1.5">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>
                          Số dư không đủ. Bạn còn thiếu{' '}
                          <strong>
                            {(selectedPlanForBuy.price - userData.walletBalance).toLocaleString('vi-VN')} đ
                          </strong>
                          . Vui lòng nạp thêm tiền.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForBuy(null)}
                  disabled={subscribing}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                {userData && userData.walletBalance < selectedPlanForBuy.price ? (
                  <Link
                    href="/wallet"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Wallet size={14} />
                    <span>Nạp Tiền Ngay</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmSubscribe}
                    disabled={subscribing}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {subscribing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" />
                        <span>Xác Nhận Kích Hoạt</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function VipPage() {
  return (
    <Suspense
      fallback={<BarLoader fullScreen className="bg-[#070709]" />}
    >
      <VipPageContent />
    </Suspense>
  );
}
