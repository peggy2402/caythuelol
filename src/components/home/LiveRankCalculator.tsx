'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Flame, ShieldCheck, ArrowRight, Lock, Trophy, Shield, Activity 
} from 'lucide-react';

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

const STEP_PRICES = [
  20000, 20000, 20000, 20000, // Iron IV -> Bronze IV (0,1,2,3)
  20000, 20000, 20000, 25000, // Bronze IV -> Silver IV (4,5,6,7)
  25000, 25000, 25000, 35000, // Silver IV -> Gold IV (8,9,10,11)
  35000, 35000, 35000, 55000, // Gold IV -> Plat IV (12,13,14,15)
  55000, 55000, 55000, 65000, // Plat IV -> Emerald IV (16,17,18,19)
  75000, 75000, 75000, 95000, // Emerald IV -> Diamond IV (20,21,22,23)
  120000, 140000, 170000, 220000 // Diamond IV -> Master (24,25,26,27)
];

export default function LiveRankCalculator() {
  const [currentTier, setCurrentTier] = useState<string>('gold');
  const [currentDiv, setCurrentDiv] = useState<string>('IV');
  const [desiredTier, setDesiredTier] = useState<string>('emerald');
  const [desiredDiv, setDesiredDiv] = useState<string>('IV');

  // Addons State
  const [addonDuo, setAddonDuo] = useState(false);
  const [addonExpress, setAddonExpress] = useState(false);
  const [addonRoles, setAddonRoles] = useState(false);
  const [addonStream, setAddonStream] = useState(false);

  const getRankIndex = (tierId: string, divStr: string): number => {
    const tierIdx = RANKS.findIndex(r => r.id === tierId);
    if (tierIdx === -1) return 0;
    if (tierId === 'master') return 28;
    const divIdx = DIVISIONS.indexOf(divStr);
    return tierIdx * 4 + (divIdx >= 0 ? divIdx : 0);
  };

  const startIndex = getRankIndex(currentTier, currentDiv);
  let endIndex = getRankIndex(desiredTier, desiredDiv);

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
      deposit: total
    };
  };

  const quote = calculateLivePrice();

  return (
    <section id="calculator-section" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">

        <div className="grid lg:grid-cols-12 gap-12 items-start">

          {/* LEFT COLUMN: LIVE INTERACTIVE CALCULATOR (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
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
                  href="/services"
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
                  title: 'Booster Thách Đấu KYC Định Danh',
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
  );
}
