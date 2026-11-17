'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Crown, Shield, Check } from 'lucide-react';

const benefitVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function VipMembershipBanner() {
  const [vipPrice, setVipPrice] = useState('199.000 đ');
  const [vipName, setVipName] = useState('LeoRank VIP Pass');
  const [discountPercent, setDiscountPercent] = useState(10);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('leorank_vip_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.price) setVipPrice(`${Number(parsed.price).toLocaleString('vi-VN')} đ`);
        if (parsed.name) setVipName(parsed.name);
        if (parsed.discountPercent) setDiscountPercent(parsed.discountPercent);
      }
    } catch {}
  }, []);
  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-cyan-950/30 to-zinc-950 border border-emerald-500/30 p-8 md:p-12 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.15)]">

          {/* Decorative Lighting */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">

            {/* Left Card: 3D Shield Emblem & Pricing */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
                <Crown className="w-3.5 h-3.5" />
                Đặc Quyền Thành Viên Cao Cấp
              </div>

              {/* 3D Glowing Shield Motif with Gentle Float */}
              <motion.div
                animate={{ y: [-6, 6, -6], rotate: [-1.5, 1.5, -1.5] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="relative w-28 h-28 mb-6 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-0.5 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <div className="w-full h-full bg-zinc-950 rounded-2xl flex items-center justify-center">
                    <Shield className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
              </motion.div>

              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                {vipName}
              </h3>
              <p className="text-zinc-400 text-sm max-w-sm mb-6">
                Tối ưu chi phí leo rank dài hạn với mức giảm giá {discountPercent}% trọn đời và đặc quyền ghép nhanh tuyển thủ Pro.
              </p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black text-white font-mono">{vipPrice}</span>
                <span className="text-zinc-400 text-sm">/ tháng</span>
              </div>

              <Link
                href="/dashboard"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all hover:scale-105"
              >
                Đăng Ký Hội Viên VIP Ngay
              </Link>
            </div>

            {/* Right Card: VIP Benefits Grid with Staggered Scroll Reveal */}
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
                  <motion.div
                    key={idx}
                    custom={idx}
                    variants={benefitVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-emerald-500/20 flex items-start gap-3 backdrop-blur-sm hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{benefit.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
