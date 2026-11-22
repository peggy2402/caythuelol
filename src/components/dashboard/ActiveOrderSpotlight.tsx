'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { formatServiceNameVi } from '@/lib/orderStatus';

interface ActiveOrderSpotlightProps {
  order?: any;
  spotlightOrder?: any;
}

export default function ActiveOrderSpotlight({ order, spotlightOrder }: ActiveOrderSpotlightProps) {
  const active = spotlightOrder || order;
  if (!active) return null;

  const isPointBoost = Boolean(active.details?.is_point_boost || active.details?.calc_mode === 'BY_LP' || active.details?.segment);
  const serviceDisplayName = active.snapshot?.serviceName || active.details?.service_name || formatServiceNameVi(active.serviceType, active.details);
  const unit = active.details?.unit || 'LP';

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-cyan-950/30 border border-cyan-500/30 p-4 sm:p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(6,182,212,0.15)] overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-400">
              Đang cày (Live Tracking)
            </span>
            <span className="text-zinc-600">•</span>
            <span className="font-mono text-[11px] sm:text-xs text-zinc-400 font-bold">
              #{active.orderCode || active._id.slice(-6).toUpperCase()}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              Bảo đảm Ký quỹ
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
            <span>{serviceDisplayName}</span>
            {isPointBoost ? (
              <span className="text-xs sm:text-sm font-semibold text-zinc-400 flex items-center gap-1.5 font-sans bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">
                  {active.details?.start_lp ?? active.details?.current_points ?? 0} {unit}
                </span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                <span className="text-cyan-300 font-bold">
                  {active.details?.target_lp ?? active.details?.desired_points ?? active.details?.target_points ?? 100} {unit}
                </span>
              </span>
            ) : active.snapshot?.initialState?.rankLabel && active.snapshot?.targetState?.rankLabel ? (
              <span className="text-xs sm:text-sm font-semibold text-zinc-400 flex items-center gap-1.5 font-sans bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800">
                <span className="text-zinc-300">{active.snapshot.initialState.rankLabel}</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
                <span className="text-cyan-300 font-bold">{active.snapshot.targetState.rankLabel}</span>
              </span>
            ) : active.details?.num_games ? (
              <span className="text-xs sm:text-sm font-semibold text-cyan-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 font-sans">
                +{active.details.num_games} Trận thắng
              </span>
            ) : null}
          </h3>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-relaxed">
            Booster đang được hệ thống giám sát tự động qua VPN riêng. Mọi trận đấu đều cập nhật điểm LP trực tiếp.
          </p>
        </div>

        <div className="flex items-center shrink-0 w-full md:w-auto">
          <Link
            href={`/orders/${active._id}`}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            <span>Xem Trận Đấu & Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
