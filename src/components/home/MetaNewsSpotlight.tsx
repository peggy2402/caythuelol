'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flame, ChevronRight, ArrowRight } from 'lucide-react';

const SUB_ARTICLES = [
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
];

export default function MetaNewsSpotlight() {
  return (
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
          <Link href="/blogs" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-1.5 mt-2 md:mt-0">
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
                <Link href="/blogs" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 group-hover:translate-x-1 transition-transform">
                  Khám phá cẩm nang <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sub Articles (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {SUB_ARTICLES.map((art, idx) => (
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
  );
}
