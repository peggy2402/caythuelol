'use client';

import { useState, useEffect, useId } from 'react';
import Link from "next/link";
import Image from "next/image";
import {
  Shield, Zap, Trophy, Star, CheckCircle2, ArrowRight, Users, Clock, Target,
  ChevronRight, CreditCard, TrendingUp, Activity, Sparkles, MessageSquarePlus,
  Lightbulb, Bug, X, Loader2, UploadCloud, ChevronDown, Lock, Flame,
  Award, Crown, Gamepad2, Headphones, Check, Eye, HelpCircle, ExternalLink,
  Laptop, ShieldCheck, RefreshCw, BarChart3, BellRing, Sparkle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from 'react-countup';
import { toast } from "sonner";
import { FaDiscord, FaFacebookMessenger } from "react-icons/fa";

// Lightweight Custom Typewriter Hook
const Typewriter = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="inline-block min-w-[20px]">
      {words[index].substring(0, subIndex)}
      <span className="animate-pulse text-cyan-400">|</span>
    </span>
  );
};

// Rank Definitions
const RANKS = [
  { id: 'iron', name: 'Sắt', icon: '/images/ranks/iron.png', color: 'text-zinc-400', border: 'border-zinc-700' },
  { id: 'bronze', name: 'Đồng', icon: '/images/ranks/bronze.png', color: 'text-amber-600', border: 'border-amber-800' },
  { id: 'silver', name: 'Bạc', icon: '/images/ranks/silver.png', color: 'text-slate-300', border: 'border-slate-600' },
  { id: 'gold', name: 'Vàng', icon: '/images/ranks/gold.png', color: 'text-yellow-400', border: 'border-yellow-600' },
  { id: 'platinum', name: 'Bạch Kim', icon: '/images/ranks/platinum.png', color: 'text-cyan-300', border: 'border-cyan-600' },
  { id: 'emerald', name: 'Lục Bảo', icon: '/images/ranks/emerald.png', color: 'text-emerald-400', border: 'border-emerald-600' },
  { id: 'diamond', name: 'Kim Cương', icon: '/images/ranks/diamond.png', color: 'text-blue-400', border: 'border-blue-600' },
  { id: 'master', name: 'Cao Thủ', icon: '/images/ranks/master.png', color: 'text-purple-400', border: 'border-purple-600' },
];

const DIVISIONS = ['IV', 'III', 'II', 'I'];

// Step price table in VNĐ
const STEP_PRICES = [
  20000, 20000, 20000, 20000, // Iron IV -> Bronze IV (0,1,2,3)
  20000, 20000, 20000, 25000, // Bronze IV -> Silver IV (4,5,6,7)
  25000, 25000, 25000, 35000, // Silver IV -> Gold IV (8,9,10,11)
  35000, 35000, 35000, 55000, // Gold IV -> Plat IV (12,13,14,15)
  55000, 55000, 55000, 65000, // Plat IV -> Emerald IV (16,17,18,19)
  75000, 75000, 75000, 95000, // Emerald IV -> Diamond IV (20,21,22,23)
  120000, 140000, 170000, 220000 // Diamond IV -> Master (24,25,26,27)
];

// 12 Games Configuration
const ESPORTS_GAMES = [
  {
    id: 'lol',
    name: 'Liên Minh Huyền Thoại',
    shortName: 'LMHT / LoL',
    slug: 'lol',
    badge: 'Phổ biến nhất',
    servicesCount: '12 Dịch Vụ',
    boosterCount: '240+ Pro',
    image: '/images/games/lol-card.jpg',
    gradient: 'from-blue-600/30 to-cyan-500/20',
    borderGlow: 'group-hover:border-cyan-500/50'
  },
  {
    id: 'val',
    name: 'Valorant',
    shortName: 'Valorant',
    slug: 'val',
    badge: 'Radiant Boost',
    servicesCount: '8 Dịch Vụ',
    boosterCount: '180+ Pro',
    image: '/images/games/val-card.jpg',
    gradient: 'from-rose-600/30 to-red-500/20',
    borderGlow: 'group-hover:border-rose-500/50'
  },
  {
    id: 'tft',
    name: 'Đấu Trường Chân Lý',
    shortName: 'TFT / ĐTCL',
    slug: 'tft',
    badge: 'Mùa Mới',
    servicesCount: '6 Dịch Vụ',
    boosterCount: '95+ Pro',
    image: '/images/games/tft-card.jpg',
    gradient: 'from-amber-600/30 to-yellow-500/20',
    borderGlow: 'group-hover:border-amber-500/50'
  },
  {
    id: 'wildrift',
    name: 'LMHT: Tốc Chiến',
    shortName: 'Tốc Chiến',
    slug: 'wildrift',
    badge: 'Mobile Hot',
    servicesCount: '6 Dịch Vụ',
    boosterCount: '65+ Pro',
    image: '/images/games/lol-card.jpg',
    gradient: 'from-sky-600/30 to-blue-500/20',
    borderGlow: 'group-hover:border-sky-500/50'
  },
  {
    id: 'aov',
    name: 'Liên Quân Mobile',
    shortName: 'AOV / LQM',
    slug: 'aov',
    badge: 'Chiến Tướng',
    servicesCount: '5 Dịch Vụ',
    boosterCount: '85+ Pro',
    image: null,
    gradient: 'from-purple-600/30 to-indigo-500/20',
    borderGlow: 'group-hover:border-purple-500/50'
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2 / Premier',
    slug: 'cs2',
    badge: 'Faceit & Premier',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '50+ Pro',
    image: null,
    gradient: 'from-orange-600/30 to-amber-500/20',
    borderGlow: 'group-hover:border-orange-500/50'
  },
  {
    id: 'fconline',
    name: 'FC Online',
    shortName: 'FCO / FIFA 4',
    slug: 'fconline',
    badge: 'Thách Đấu',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '45+ Pro',
    image: null,
    gradient: 'from-emerald-600/30 to-teal-500/20',
    borderGlow: 'group-hover:border-emerald-500/50'
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    shortName: 'Apex Legends',
    slug: 'apex',
    badge: 'Predator Boost',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '35+ Pro',
    image: null,
    gradient: 'from-red-600/30 to-orange-500/20',
    borderGlow: 'group-hover:border-red-500/50'
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    shortName: 'Dota 2 MMR',
    slug: 'dota2',
    badge: 'Immortal MMR',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '30+ Pro',
    image: null,
    gradient: 'from-red-700/30 to-rose-600/20',
    borderGlow: 'group-hover:border-red-600/50'
  },
  {
    id: 'ow2',
    name: 'Overwatch 2',
    shortName: 'Overwatch 2',
    slug: 'ow2',
    badge: 'Top 500',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '25+ Pro',
    image: null,
    gradient: 'from-amber-500/30 to-orange-600/20',
    borderGlow: 'group-hover:border-amber-400/50'
  },
  {
    id: 'naraka',
    name: 'Naraka: Bladepoint',
    shortName: 'Naraka',
    slug: 'naraka',
    badge: 'Tu La',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '20+ Pro',
    image: null,
    gradient: 'from-crimson-600/30 to-red-800/20',
    borderGlow: 'group-hover:border-red-500/50'
  },
  {
    id: 'pubg',
    name: 'PUBG: Battlegrounds',
    shortName: 'PUBG PC',
    slug: 'pubg',
    badge: 'Top 500 RP',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '40+ Pro',
    image: null,
    gradient: 'from-yellow-600/30 to-amber-600/20',
    borderGlow: 'group-hover:border-yellow-500/50'
  }
];

export default function Home() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'BUG' | 'SUGGESTION'>('BUG');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackImage, setFeedbackImage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Live Rank Calculator State
  const [currentTier, setCurrentTier] = useState<string>('gold');
  const [currentDiv, setCurrentDiv] = useState<string>('IV');
  const [desiredTier, setDesiredTier] = useState<string>('emerald');
  const [desiredDiv, setDesiredDiv] = useState<string>('IV');

  // Addons State
  const [addonDuo, setAddonDuo] = useState(false);
  const [addonExpress, setAddonExpress] = useState(false);
  const [addonRoles, setAddonRoles] = useState(false);
  const [addonStream, setAddonStream] = useState(false);

  // VIP Club Billing Cycle
  const [isYearlyVip, setIsYearlyVip] = useState(false);

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Helper: calculate rank index
  const getRankIndex = (tierId: string, divStr: string): number => {
    const tierIdx = RANKS.findIndex(r => r.id === tierId);
    if (tierIdx === -1) return 0;
    if (tierId === 'master') return 28;
    const divIdx = DIVISIONS.indexOf(divStr);
    return tierIdx * 4 + (divIdx >= 0 ? divIdx : 0);
  };

  const startIndex = getRankIndex(currentTier, currentDiv);
  let endIndex = getRankIndex(desiredTier, desiredDiv);

  // Auto-correct if end <= start
  useEffect(() => {
    if (endIndex <= startIndex) {
      if (startIndex < 24) {
        setDesiredTier('emerald');
        setDesiredDiv('IV');
      } else {
        setDesiredTier('master');
        setDesiredDiv('I');
      }
    }
  }, [startIndex, endIndex]);

  // Compute live price
  const calculateLivePrice = () => {
    const s = startIndex;
    const e = endIndex > s ? endIndex : s + 1;

    let base = 0;
    for (let i = s; i < e && i < STEP_PRICES.length; i++) {
      base += STEP_PRICES[i];
    }
    if (base === 0) base = 35000;

    let addonFee = 0;
    if (addonDuo) addonFee += base * 0.5;
    if (addonExpress) addonFee += base * 0.35;
    if (addonRoles) addonFee += base * 0.3;
    if (addonStream) addonFee += 50000;

    const total = base + addonFee;
    return {
      base,
      addonFee,
      total,
      deposit: total // 100% Escrow deposit
    };
  };

  const quote = calculateLivePrice();

  const typewriterWords = [
    "Dịch vụ Cày Thuê LoL & Đa Game Uy Tín #1",
    "Bảo chứng tài chính 100% qua LeoRank Escrow",
    "Tuyển thủ Thách Đấu 1000+ LP định danh KYC",
    "Chế độ VPN riêng & Offline ẩn danh tuyệt đối"
  ];

  // Feedback Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Kích thước ảnh tối đa là 5MB!");
    }
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
      setFeedbackImage(data.url || data.secure_url);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return toast.error("Vui lòng nhập nội dung!");
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
          imageUrl: feedbackImage
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi gửi phản hồi");
      toast.success("Cảm ơn bạn đã đóng góp ý kiến!");
      setIsFeedbackOpen(false);
      setFeedbackText('');
      setFeedbackImage('');
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-zinc-100 font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      <Navbar />

      <main className="relative">
        {/* Ambient Dark Canvas Background Texture & Glows */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("/noise.png")' }}></div>

        {/* Dynamic Background Radial Glows */}
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-[800px] left-[-200px] w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none rounded-full" />
        <div className="absolute top-[1800px] right-[-200px] w-[600px] h-[600px] bg-cyan-600/10 blur-[160px] pointer-events-none rounded-full" />

        {/* ========================================================================= */}
        {/* SECTION 1: HERO SECTION                                                   */}
        {/* ========================================================================= */}
        <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden min-h-[85vh] flex items-center">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

              {/* Top Trust Indicator Pill */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-4 py-2 text-xs md:text-sm font-semibold text-cyan-300 mb-8 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              >
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-200">Đánh giá 4.9/5 trên Trustpilot & Hệ thống</span>
                <span className="text-zinc-400">|</span>
                <span className="text-cyan-400 font-bold">25.000+ Đơn hoàn thành</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1] uppercase"
              >
                LeoRank Esports Marketplace <br />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                  Nâng Tầm Đẳng Cấp Xếp Hạng
                </span>
              </motion.h1>

              {/* Typewriter Dynamic Subtitle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="h-8 mb-8 text-lg sm:text-xl md:text-2xl font-medium text-zinc-300 flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5 text-cyan-400" />
                <Typewriter words={typewriterWords} />
              </motion.div>

              {/* Sub-description */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-base sm:text-lg text-zinc-400 mb-10 max-w-2xl leading-relaxed"
              >
                Sàn giao dịch cày thuê esports đầu tiên bảo chứng giao dịch 100% bằng cơ chế ký quỹ <span className="text-white font-semibold">Escrow Protection</span>. Tuyển thủ Thách Đấu thi đấu ẩn danh, theo dõi trực tiếp từng trận qua Dashboard.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14"
              >
                <a
                  href="#calculator-section"
                  className="relative group flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 text-base font-bold text-white shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>Tính Giá & Đặt Cày Ngay</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>

                <Link
                  href="/services/lol"
                  className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-zinc-900/80 px-8 text-base font-bold text-zinc-300 border border-zinc-700/80 hover:border-zinc-500 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-md"
                >
                  <Gamepad2 className="w-5 h-5 text-cyan-400" />
                  <span>Khám Phá Dịch Vụ LMHT</span>
                </Link>
              </motion.div>

              {/* Quick Game Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
                <span className="text-zinc-500 font-semibold uppercase tracking-wider mr-2">Top Game:</span>
                {['LMHT Rank Đơn', 'Valorant Radiant', 'TFT ĐTCL', 'Tốc Chiến', 'CS2 Faceit', 'Coaching 1-1'].map((tag, i) => (
                  <Link
                    key={i}
                    href="/services/lol"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: 12-GAME ESPORTS SELECTOR GRID                                  */}
        {/* ========================================================================= */}
        <section className="py-16 relative z-10 border-t border-zinc-800/60 bg-[#06080d]/70 backdrop-blur-md">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                  <Gamepad2 className="w-4 h-4" />
                  Hệ Sinh Thái Game Hỗ Trợ
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Chọn Tựa Game Của Bạn
                </h2>
              </div>
              <p className="text-zinc-400 text-sm max-w-md mt-2 md:mt-0">
                Hơn 500+ Booster chuyên nghiệp đạt bậc xếp hạng cao nhất trong từng tựa game sẵn sàng đồng hành cùng bạn.
              </p>
            </div>

            {/* 12 Game Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {ESPORTS_GAMES.map((game) => (
                <Link
                  key={game.id}
                  href={`/services/${game.slug}`}
                  className={`group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${game.borderGlow} overflow-hidden flex flex-col justify-between`}
                >
                  {/* Subtle hover gradient backdrop */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div>
                    {/* Game Card Media or Styled Badge */}
                    <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-zinc-950 border border-white/5 flex items-center justify-center">
                      {game.image ? (
                        <Image
                          src={game.image}
                          alt={game.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center">
                          <Gamepad2 className="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                          <span className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">{game.shortName}</span>
                        </div>
                      )}
                      {/* Badge Top Left */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-white/10">
                        {game.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                      {game.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60 mt-2">
                    <span>{game.servicesCount}</span>
                    <span className="text-emerald-400 font-semibold">{game.boosterCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: LIVE INTERACTIVE RANK CALCULATOR & VALUE PROPOSITION            */}
        {/* ========================================================================= */}
        <section id="calculator-section" className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">

            <div className="grid lg:grid-cols-12 gap-12 items-start">

              {/* LEFT COLUMN: LIVE INTERACTIVE CALCULATOR (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  {/* Glowing Edge Header */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />

                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                        <Flame className="w-4 h-4 text-amber-400" />
                        Bảng Tính Giá Tức Thì
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Ước Tính Chi Phí Cày Rank LMHT
                      </h3>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-medium">
                      Cập nhật Mùa 2026
                    </span>
                  </div>

                  {/* Step 1: Current Rank Selector */}
                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      1. Chọn Bậc Rank Hiện Tại
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                      {RANKS.map((r) => {
                        const isSelected = currentTier === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setCurrentTier(r.id);
                              if (r.id === 'master') setCurrentDiv('I');
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105'
                                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}
                          >
                            <div className="relative w-8 h-8">
                              <Image src={r.icon} alt={r.name} fill className="object-contain" />
                            </div>
                            <span className={`text-[11px] font-bold ${isSelected ? 'text-cyan-300' : 'text-zinc-400'}`}>
                              {r.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {currentTier !== 'master' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium">Bậc nhỏ:</span>
                        <div className="flex gap-1.5">
                          {DIVISIONS.map((div) => (
                            <button
                              key={div}
                              type="button"
                              onClick={() => setCurrentDiv(div)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                currentDiv === div
                                  ? 'bg-cyan-500 text-black shadow-sm'
                                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {div}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Desired Rank Selector */}
                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      2. Chọn Bậc Rank Mong Muốn
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                      {RANKS.map((r) => {
                        const isSelected = desiredTier === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setDesiredTier(r.id);
                              if (r.id === 'master') setDesiredDiv('I');
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                              isSelected
                                ? 'bg-amber-950/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                                : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}
                          >
                            <div className="relative w-8 h-8">
                              <Image src={r.icon} alt={r.name} fill className="object-contain" />
                            </div>
                            <span className={`text-[11px] font-bold ${isSelected ? 'text-amber-300' : 'text-zinc-400'}`}>
                              {r.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {desiredTier !== 'master' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium">Bậc nhỏ:</span>
                        <div className="flex gap-1.5">
                          {DIVISIONS.map((div) => (
                            <button
                              key={div}
                              type="button"
                              onClick={() => setDesiredDiv(div)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                desiredDiv === div
                                  ? 'bg-amber-400 text-black shadow-sm'
                                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {div}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Add-on Options */}
                  <div className="mb-8">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      3. Tùy Chọn Mở Rộng (Add-ons)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${addonDuo ? 'bg-cyan-950/40 border-cyan-500/80 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addonDuo}
                            onChange={(e) => setAddonDuo(e.target.checked)}
                            className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-zinc-900"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Chơi cùng Booster (Duo)</div>
                            <div className="text-[11px] text-zinc-400">Không cần đưa tài khoản</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-400">+50%</span>
                      </label>

                      <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${addonExpress ? 'bg-cyan-950/40 border-cyan-500/80 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addonExpress}
                            onChange={(e) => setAddonExpress(e.target.checked)}
                            className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-zinc-900"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Cày siêu tốc ưu tiên</div>
                            <div className="text-[11px] text-zinc-400">Hoàn thành nhanh x2</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-400">+35%</span>
                      </label>

                      <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${addonRoles ? 'bg-cyan-950/40 border-cyan-500/80 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addonRoles}
                            onChange={(e) => setAddonRoles(e.target.checked)}
                            className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-zinc-900"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Tùy chọn tướng & đường</div>
                            <div className="text-[11px] text-zinc-400">Đánh tướng tủ của bạn</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-400">+30%</span>
                      </label>

                      <label className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${addonStream ? 'bg-cyan-950/40 border-cyan-500/80 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addonStream}
                            onChange={(e) => setAddonStream(e.target.checked)}
                            className="rounded border-zinc-700 text-cyan-500 focus:ring-cyan-500 w-4 h-4 bg-zinc-900"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">Livestream qua Discord</div>
                            <div className="text-[11px] text-zinc-400">Xem trực tiếp trận đấu</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-cyan-400">+50.000 đ</span>
                      </label>
                    </div>
                  </div>

                  {/* Summary & Price Checkout Bar */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="text-xs text-zinc-400 mb-1">
                          Lộ trình: <span className="text-white font-bold">{RANKS.find(r => r.id === currentTier)?.name} {currentTier !== 'master' && currentDiv} → {RANKS.find(r => r.id === desiredTier)?.name} {desiredTier !== 'master' && desiredDiv}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Bảo chứng Escrow 100% – Hoàn tiền nếu không đạt mục tiêu</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-zinc-400">Tổng thanh toán dự kiến:</div>
                        <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                          {quote.total.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/services/lol/rank-boost?fromTier=${currentTier}&fromDiv=${currentDiv}&toTier=${desiredTier}&toDiv=${desiredDiv}&duo=${addonDuo}&express=${addonExpress}`}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-base shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      <span>Tiến Hành Đặt Cày Ngay</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: CORE VALUE PROPOSITION (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between h-full pt-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    LeoRank Escrow System
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                    Cày Rank An Toàn, Minh Bạch & Bảo Vệ Khách Hàng Tuyệt Đối
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed mb-8">
                    Không còn nỗi lo mất tài khoản hay bị giữ tiền vô cớ. Mọi đơn cày trên LeoRank đều được vận hành theo cơ chế ký quỹ thông minh (Escrow Hold) chuẩn tài chính.
                  </p>
                </div>

                {/* 4 Pillars */}
                <div className="space-y-4">
                  {[
                    {
                      icon: Lock,
                      title: '100% Escrow Hold Payment',
                      desc: 'Tiền cọc được hệ thống đóng băng an toàn. Booster chỉ nhận tiền sau khi bạn kiểm tra và bấm xác nhận hoàn thành.',
                      color: 'text-cyan-400',
                      bg: 'bg-cyan-500/10'
                    },
                    {
                      icon: Trophy,
                      title: 'Tuyển Thủ Thách Đấu KYC Định Danh',
                      desc: '100% booster trải qua quy trình kiểm tra trình độ gắt gao (tối thiểu Cao Thủ 500LP+), có hợp đồng cam kết trách nhiệm.',
                      color: 'text-amber-400',
                      bg: 'bg-amber-500/10'
                    },
                    {
                      icon: Shield,
                      title: 'Ảo Hóa VPN & Chế Độ Offline',
                      desc: 'Hệ thống định tuyến VPN theo vị trí địa lý của bạn. Bật chế độ Offline không hiển thị online với bạn bè.',
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/10'
                    },
                    {
                      icon: Activity,
                      title: 'Theo Dõi Trận Đấu & Chat 1-1',
                      desc: 'Cập nhật tiến độ thắng thua thời gian thực trên giao diện cá nhân. Nhắn tin trực tiếp với booster để thống nhất giờ chơi.',
                      color: 'text-purple-400',
                      bg: 'bg-purple-500/10'
                    }
                  ].map((pillar, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className={`p-2.5 rounded-xl ${pillar.bg} ${pillar.color} shrink-0 mt-0.5`}>
                        <pillar.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">{pillar.title}</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">{pillar.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: VIP MEMBERSHIP & ESCROW GUARANTEE BANNER                       */}
        {/* ========================================================================= */}
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-6">
            <div className="relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-cyan-950/30 to-zinc-950 border border-emerald-500/30 p-8 md:p-12 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)]">

              {/* Decorative Background Lighting */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />

              <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">

                {/* Left Card: 3D Shield Emblem & Pricing */}
                <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
                    <Crown className="w-3.5 h-3.5" />
                    Đặc Quyền Thành Viên Cao Cấp
                  </div>

                  {/* 3D Glowing Shield Motif */}
                  <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                      <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
                        <Shield className="w-12 h-12 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                    LeoRank VIP Pass
                  </h3>
                  <p className="text-zinc-400 text-sm max-w-sm mb-6">
                    Tối ưu chi phí leo rank dài hạn với mức giảm giá 10% trọn đời và đặc quyền ghép nhanh tuyển thủ Pro.
                  </p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black text-white font-mono">199.000 đ</span>
                    <span className="text-zinc-400 text-sm">/ tháng</span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all hover:scale-105"
                  >
                    Đăng Ký Hội Viên VIP Ngay
                  </Link>
                </div>

                {/* Right Card: VIP Benefits Grid */}
                <div className="lg:col-span-7">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        title: 'Giảm 10% Tất Cả Đơn Hàng',
                        desc: 'Tự động áp dụng chiết khấu 10% cho mọi dịch vụ LMHT, Valorant, TFT và game khác.'
                      },
                      {
                        title: 'Ưu Tiên Ghép Booster 3 Phút',
                        desc: 'Đơn hàng VIP được đưa lên đầu hàng đợi và gán cho Booster Thách Đấu điểm cao nhất.'
                      },
                      {
                        title: 'Miễn Phí Chọn Tướng & Đường',
                        desc: 'Tiết kiệm thêm 30% phụ phí khi yêu cầu booster thi đấu đúng vị trí và tướng yêu thích.'
                      },
                      {
                        title: 'Chuyên Viên Hỗ Trợ 1-1',
                        desc: 'Hỗ trợ riêng qua Telegram/Zalo VIP, xử lý mọi yêu cầu phát sinh trong vòng 5 phút.'
                      },
                      {
                        title: 'Bảo Hiểm Tài Khoản 100%',
                        desc: 'Cam kết bồi thường 100% giá trị tài khoản nếu xảy ra bất kỳ rủi ro phạt nào do booster.'
                      },
                      {
                        title: 'Tích Điểm LeoPoint Đổi Quà',
                        desc: 'Nhận x2 điểm thưởng khi hoàn thành đơn để đổi Skin, Battle Pass hoặc thẻ cào.'
                      }
                    ].map((benefit, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/20 flex items-start gap-3 backdrop-blur-sm"
                      >
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-0.5">{benefit.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">{benefit.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: SOCIAL PROOF & VERIFIED REVIEWS                                 */}
        {/* ========================================================================= */}
        <section className="py-24 relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">

            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
                <Users className="w-4 h-4" />
                Đánh Giá Thực Tế Từ Cộng Đồng
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                Hơn 25.000 Game Thủ Đã Lên Rank Thành Công
              </h2>
              <p className="text-zinc-400 text-base">
                Xem đánh giá minh bạch từ khách hàng đã sử dụng dịch vụ và hoàn tất đơn hàng qua hệ thống Escrow.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Nguyễn Hải Đăng",
                  game: "LMHT",
                  rankProgression: "Vàng II → Kim Cương IV",
                  winrate: "94% Winrate",
                  comment: "Booster đánh quá khủng khiếp, streak 14 trận liền không thua ván nào. Đặt lúc 10h tối mà sáng hôm sau đã bàn giao xong. Cực kỳ uy tín!",
                  avatar: "Đ",
                  boosterTag: "Booster #18 (Thách Đấu 1100LP)",
                  verified: true
                },
                {
                  name: "Trần Quốc Tuấn",
                  game: "Valorant",
                  rankProgression: "Ascendant 2 → Immortal 1",
                  winrate: "88% Winrate",
                  comment: "Mình chọn gói Chơi Cùng Booster (Duo) vì không muốn share pass. Bạn tuyển thủ call team nhiệt tình, chỉ bảo mẹo kê góc rất hay. Đáng đồng tiền bát gạo.",
                  avatar: "T",
                  boosterTag: "Booster #05 (Radiant Top 50)",
                  verified: true
                },
                {
                  name: "Lê Minh Quân",
                  game: "LMHT",
                  rankProgression: "Bạch Kim I → Cao Thủ",
                  winrate: "90% Winrate",
                  comment: "Hệ thống Escrow giữ tiền làm mình rất yên tâm. Khi nào lên đủ điểm Cao Thủ mình vào kiểm tra xong mới bấm thanh toán. Sẽ tiếp tục ủng hộ!",
                  avatar: "Q",
                  boosterTag: "Booster #42 (Thách Đấu 850LP)",
                  verified: true
                }
              ].map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col justify-between hover:border-zinc-700 transition-all hover:-translate-y-1 shadow-lg"
                >
                  <div>
                    {/* Stars & Winrate Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                        {rev.winrate}
                      </span>
                    </div>

                    {/* Rank Badge Indicator */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-cyan-300 mb-4">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      {rev.rankProgression}
                    </div>

                    <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-base shadow-md">
                        {rev.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          {rev.name}
                          {rev.verified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">{rev.boosterTag}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: 2-COLUMN ACCORDION FAQ                                         */}
        {/* ========================================================================= */}
        <section className="py-20 relative z-10 border-t border-zinc-850 bg-[#06080d]/50">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
                <HelpCircle className="w-4 h-4" />
                Giải Đáp Thắc Mắc
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                Câu Hỏi Thường Gặp
              </h2>
              <p className="text-zinc-400 text-base">
                Mọi thông tin bạn cần biết về độ an toàn, bảo chứng tiền và quy trình cày thuê tại LeoRank.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  q: "Tài khoản của tôi có bị khóa khi cày thuê không?",
                  a: "LeoRank áp dụng 100% công nghệ ảo hóa VPN định tuyến theo vị trí máy chủ của bạn và bật chế độ Offline trong game. Tuyển thủ không chat, không troll game, đảm bảo an toàn tài khoản tối đa."
                },
                {
                  q: "Cơ chế ký quỹ Escrow bảo vệ tôi như thế nào?",
                  a: "Khoản tiền của bạn sẽ được giữ an toàn tại tài khoản Escrow của hệ thống. Booster chỉ được thanh toán sau khi bạn đăng nhập xác nhận đúng mức rank cam kết và hài lòng."
                },
                {
                  q: "Tôi có thể chơi Duo với Booster mà không cần đưa tài khoản không?",
                  a: "Có! Bạn chỉ cần chọn tùy chọn 'Chơi cùng Booster (Duo)' khi đặt đơn. Booster sẽ kết bạn trong game và cùng bạn leo rank mà bạn không cần phải chia sẻ mật khẩu."
                },
                {
                  q: "Thời gian hoàn thành một đơn hàng trung bình là bao lâu?",
                  a: "Thông thường mỗi bậc rank (ví dụ Vàng IV lên Vàng III) chỉ mất từ 2 đến 4 giờ thi đấu. Nếu chọn gói Siêu Tốc, đơn hàng được ưu tiên chạy liên tục."
                },
                {
                  q: "Nếu Booster không đạt mức rank mong muốn thì sao?",
                  a: "Hệ thống tự động tính toán đối soát theo quy chuẩn Section 8: hoàn lại 100% tiền cọc cho các mốc chưa hoàn thành, đồng thời hỗ trợ đổi booster khác hoặc hoàn tiền về ví ngay lập tức."
                },
                {
                  q: "Làm thế nào để trở thành Booster trên LeoRank?",
                  a: "Bạn cần có mức rank từ Cao Thủ 300LP trở lên, trải qua bài test kỹ năng 3 trận và xác minh danh tính KYC kèm tiền cọc bảo chứng uy tín."
                },
                {
                  q: "Tôi có thể theo dõi tiến độ cày rank như thế nào?",
                  a: "Trang Dashboard của bạn tự động cập nhật kết quả từng trận đấu (Thắng/Thua, KDA, Tướng đã dùng) theo thời gian thực và thông báo tức thì qua Telegram/Zalo."
                },
                {
                  q: "Hệ thống hỗ trợ những phương thức nạp/rút nào?",
                  a: "LeoRank hỗ trợ nạp tiền tức thì qua VietQR (tất cả ngân hàng Việt Nam), Ví MoMo, Thẻ ATM nội địa và Visa/Mastercard với phí 0%."
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-5 transition-colors hover:border-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left gap-4"
                  >
                    <span className="font-bold text-white text-sm sm:text-base">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-zinc-800 text-xs sm:text-sm text-zinc-400 leading-relaxed"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: META PATCH NOTES & ESPORTS SPOTLIGHT                            */}
        {/* ========================================================================= */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Góc Chiến Thuật & Cẩm Nang Rank
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Meta Phân Tích & Cập Nhật Mới Nhất
                </h2>
              </div>
              <Link href="/services/lol" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1.5 mt-2 md:mt-0">
                Xem tất cả cẩm nang <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">

              {/* Featured Big Card (7 Cols) */}
              <div className="lg:col-span-7">
                <div className="relative rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden group h-full flex flex-col justify-between">
                  <div className="relative w-full aspect-[16/9] bg-zinc-950 overflow-hidden">
                    <Image
                      src="/images/games/lol-card.jpg"
                      alt="LMHT Meta"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-md bg-cyan-500 text-black text-xs font-black uppercase tracking-wider">
                      LMHT Mùa 2026
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    <div className="text-xs text-zinc-500 mb-2 flex items-center gap-2">
                      <span>15 Tháng 11, 2026</span>
                      <span>•</span>
                      <span>5 Phút Đọc</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                      Top 5 Tướng Leo Rank Đơn Hiệu Quả Nhất Meta Phiên Bản Mới
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                      Phân tích chi tiết tỉ lệ thắng, cách lên đồ và lộ trình gank đầu trận của tuyển thủ Thách Đấu giúp bạn tối ưu hóa điểm cộng LP mỗi trận.
                    </p>
                    <Link href="/services/lol" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:translate-x-1 transition-transform">
                      Khám phá cẩm nang <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sub Articles (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {[
                  {
                    title: "Bí quyết Duo Queue thắng chuỗi 10 trận mà không cần call mic",
                    category: "Cẩm Nang Duo",
                    time: "3 Phút Đọc",
                    color: "text-amber-400"
                  },
                  {
                    title: "Valorant: Hướng dẫn line-up Sova & Fade kiểm soát map Ascent",
                    category: "Valorant",
                    time: "4 Phút Đọc",
                    color: "text-rose-400"
                  },
                  {
                    title: "Đấu Trường Chân Lý Mùa Mới: Các đội hình Fast 8 giữ máu chuẩn Thách Đấu",
                    category: "ĐTCL",
                    time: "6 Phút Đọc",
                    color: "text-emerald-400"
                  },
                  {
                    title: "Cách xử lý tâm lý khi dính chuỗi thua và reset MMR hiệu quả",
                    category: "Tâm Lý Thi Đấu",
                    time: "4 Phút Đọc",
                    color: "text-purple-400"
                  }
                ].map((art, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className={`font-bold uppercase tracking-wider ${art.color}`}>{art.category}</span>
                      <span className="text-zinc-500">{art.time}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {art.title}
                    </h4>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 hover:border-cyan-500 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all group"
        title="Góp ý & Báo lỗi"
      >
        <MessageSquarePlus className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
      </button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-900/95 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur-md"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/60">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageSquarePlus className="w-5 h-5 text-cyan-400" />
                  Góp ý & Báo lỗi hệ thống
                </h3>
                <button onClick={() => setIsFeedbackOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFeedbackType('BUG')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'BUG' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Bug className="w-5 h-5" />
                    <span className="text-sm font-bold">Báo lỗi</span>
                  </button>
                  <button onClick={() => setFeedbackType('SUGGESTION')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${feedbackType === 'SUGGESTION' ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}>
                    <Lightbulb className="w-5 h-5" />
                    <span className="text-sm font-bold">Góp ý cải tiến</span>
                  </button>
                </div>

                <textarea
                  autoFocus
                  value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={feedbackType === 'BUG' ? 'Mô tả chi tiết lỗi bạn gặp phải (Ví dụ: Không nạp được tiền, Web bị giật...)' : 'Bạn muốn hệ thống có thêm tính năng gì?'}
                  className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-cyan-500 outline-none resize-none placeholder:text-zinc-600"
                />

                {!feedbackImage ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-sm transition-colors ${isUploadingImage ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400' : 'border-zinc-800 bg-zinc-950/50 text-zinc-500 hover:border-zinc-600 hover:bg-zinc-900'}`}>
                      {isUploadingImage ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải ảnh lên...</>
                      ) : (
                        <><UploadCloud className="w-5 h-5" /> Tải lên ảnh màn hình (Tùy chọn)</>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-zinc-800 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={feedbackImage} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setFeedbackImage('')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-red-900/20">
                        <X className="w-4 h-4" /> Gỡ ảnh
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={handleSubmitFeedback} disabled={isSubmittingFeedback} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  {isSubmittingFeedback ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi phản hồi'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* SECTION 8: DARK LUXURY ESPORTS FOOTER                                     */}
      {/* ========================================================================= */}
      <footer className="relative bg-[#040507] border-t border-zinc-850 pt-20 pb-12 overflow-hidden">
        {/* Subtle Glow Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

            {/* Brand Col */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-10">
                  <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter">
                  LEO<span className="text-cyan-400">RANK</span>
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm">
                Sàn giao dịch cày thuê esports đa game uy tín hàng đầu. Cam kết bảo mật tài khoản tuyệt đối với bảo chứng tài chính 100% qua hệ thống ký quỹ Escrow thông minh.
              </p>

              {/* Social Channels */}
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/boostking.official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-md"
                >
                  <FaFacebookMessenger size={18} />
                </a>
                <a
                  href="https://discord.gg/yourserver"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all shadow-md"
                >
                  <FaDiscord size={18} />
                </a>
              </div>
            </div>

            {/* Services Col */}
            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Dịch Vụ Nổi Bật</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/services/lol/rank-boost" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Cày Rank / Elo LMHT</Link></li>
                <li><Link href="/services/val" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Valorant Radiant Boost</Link></li>
                <li><Link href="/services/tft" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> ĐTCL / TFT Rank</Link></li>
                <li><Link href="/services/wildrift" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Tốc Chiến Rank</Link></li>
                <li><Link href="/services/lol/coaching" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Huấn Luyện & Duo 1-1</Link></li>
              </ul>
            </div>

            {/* Support Col */}
            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Chính Sách & Hỗ Trợ</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li><Link href="/help" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Trung tâm trợ giúp</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Điều khoản dịch vụ</Link></li>
                <li><Link href="/privacy" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Chính sách bảo mật</Link></li>
                <li><Link href="/contact" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Liên hệ hỗ trợ</Link></li>
              </ul>
            </div>

            {/* Contact Col */}
            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Thông Tin Liên Hệ</h4>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Headphones size={13} /></div>
                  <a href="mailto:support@leorank.site" className="hover:text-cyan-300 transition-colors text-xs">support@leorank.site</a>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Shield size={13} /></div>
                  <span className="font-mono text-xs text-white">Hotline: 0862.587.229</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Clock size={13} /></div>
                  <span className="text-xs">Hỗ trợ 24/7 (Cả ngày lễ)</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-zinc-850 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
            <span>&copy; {currentYear} LEORANK. All rights reserved. Nền tảng cày thuê đa game uy tín hàng đầu.</span>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
