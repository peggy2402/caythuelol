'use client';

import Link from 'next/link';
import { Flame, ChevronRight, ArrowRight } from 'lucide-react';

export default function QuickServicesHub() {
  const quickServices = [
    {
      title: 'LMHT: Cày Rank / Elo',
      tag: 'Phổ biến nhất',
      border: 'hover:border-cyan-500/50',
      link: '/services/lol/rank-boost'
    },
    {
      title: 'Valorant Radiant Boost',
      tag: 'Bảo mật VPN',
      border: 'hover:border-rose-500/50',
      link: '/services/val'
    },
    {
      title: 'ĐTCL / TFT Mùa Mới',
      tag: 'Top 1 Thách Đấu',
      border: 'hover:border-amber-500/50',
      link: '/services/tft'
    },
    {
      title: 'Huấn Luyện & Duo 1-1',
      tag: 'Không cần đưa acc',
      border: 'hover:border-purple-500/50',
      link: '/services/lol/coaching'
    }
  ];

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-zinc-900/50 border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-sm sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            Đặt Dịch Vụ Cày Nhanh
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400">Ước tính giá và ghép Booster Thách Đấu trong 3 phút.</p>
        </div>
        <Link href="/services/lol" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0">
          Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {quickServices.map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className={`p-3.5 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 ${item.border} transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group`}
          >
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 sm:mb-2 block truncate">{item.tag}</span>
              <h4 className="font-bold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors mb-3 sm:mb-4 line-clamp-2">{item.title}</h4>
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 group-hover:text-white transition-colors pt-2 border-t border-zinc-900">
              <span>Đặt ngay</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
