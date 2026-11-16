'use client';

import { ShieldCheck, Users, Star, Zap, Shield } from 'lucide-react';

export default function BoostersHero() {
  const metrics = [
    { label: 'Tuyển thủ sẵn sàng', value: '500+ Pro', icon: Users, color: 'text-cyan-400' },
    { label: 'Đánh giá hài lòng', value: '4.9/5.0 ★', icon: Star, color: 'text-amber-400' },
    { label: 'Thời gian ghép', value: 'Dưới 3 phút', icon: Zap, color: 'text-emerald-400' },
    { label: 'Bảo chứng tài chính', value: '100% Escrow', icon: Shield, color: 'text-blue-400' }
  ];

  return (
    <div className="text-center mb-12 sm:mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.2)]">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>100% Tuyển Thủ Định Danh KYC • Bảo Chứng Escrow</span>
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
        Đội Ngũ Tuyển Thủ & <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">Booster Thách Đấu</span>
      </h1>

      <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
        Khám phá danh sách các tuyển thủ Thách Đấu 1000+ LP, Radiant Valorant được kiểm tra trình độ gắt gao. Xem tỷ lệ thắng, đánh giá và đặt cày trực tiếp.
      </p>

      {/* 4 Trust Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm flex items-center gap-3 text-left">
              <div className={`p-2 rounded-xl bg-zinc-950 border border-zinc-800 ${metric.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-zinc-500 font-medium">{metric.label}</div>
                <div className="text-sm font-black text-white font-mono">{metric.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
