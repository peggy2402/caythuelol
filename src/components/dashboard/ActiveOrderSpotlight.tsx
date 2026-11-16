'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ActiveOrderSpotlightProps {
  order?: any;
  spotlightOrder?: any;
}

export default function ActiveOrderSpotlight({ order, spotlightOrder }: ActiveOrderSpotlightProps) {
  const active = spotlightOrder || order;
  if (!active) return null;

  return (
    <div className="relative rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/30 border border-cyan-500/30 p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(6,182,212,0.15)] overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Đơn Hàng Đang Cày (Live Tracking)
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-xs text-zinc-400">
              #{active.orderCode || active._id.slice(-6).toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              Escrow Protected
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{active.serviceType}</span>
            {active.snapshot?.initialState?.rankLabel && active.snapshot?.targetState?.rankLabel && (
              <span className="text-sm font-semibold text-zinc-400 flex items-center gap-1.5 font-sans bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">{active.snapshot.initialState.rankLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300 font-bold">{active.snapshot.targetState.rankLabel}</span>
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Booster đang được hệ thống giám sát tự động qua VPN riêng. Mọi trận đấu đều cập nhật điểm LP trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/orders/${active._id}`}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            <span>Xem Trận Đấu & Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
