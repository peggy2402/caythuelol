'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, Shield, Flame, ArrowRight, Gamepad2, Zap, Lock } from 'lucide-react';

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

export default function HeroSection() {
  const { scrollY } = useScroll();
  const yHeroGlow = useTransform(scrollY, [0, 600], [0, 150]);
  const opacityHero = useTransform(scrollY, [0, 500], [1, 0.4]);

  const typewriterWords = [
    "Dịch vụ Cày Thuê LoL & Đa Game Uy Tín #1",
    "Bảo chứng tài chính 100% qua LeoRank Escrow",
    "Tuyển thủ Thách Đấu 1000+ LP định danh KYC",
    "Chế độ VPN riêng & Offline ẩn danh tuyệt đối"
  ];

  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden min-h-[85vh] flex items-center">
      {/* Interactive Parallax Ambient Lighting */}
      <motion.div
        style={{ y: yHeroGlow, opacity: opacityHero }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none"
      />

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
              href="/services"
              className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-zinc-900/80 px-8 text-base font-bold text-zinc-300 border border-zinc-700/80 hover:border-zinc-500 hover:text-white hover:bg-zinc-800 transition-all backdrop-blur-md"
            >
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              <span>Khám Phá Dịch Vụ</span>
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
  );
}
