'use client';

import { motion } from 'framer-motion';
import { Users, Star, Target, CheckCircle2 } from 'lucide-react';

const REVIEWS = [
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
    comment: "Mình chọn gói Chơi Cùng Booster (Duo) vì không muốn share pass. Bạn Booster call team nhiệt tình, chỉ bảo mẹo kê góc rất hay. Đáng đồng tiền bát gạo.",
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
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function CustomerReviews() {
  return (
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

        {/* Testimonials Grid with Staggered Parallax Cascade */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {REVIEWS.map((rev, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              whileHover={{ y: -5 }}
              className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-colors shadow-lg hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)]"
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
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
