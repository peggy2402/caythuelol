// src/app/services/lol/layout.tsx
'use client';

import Navbar from '@/components/Navbar';
import BoosterPicker from '@/components/BoosterPicker';
import { Suspense } from 'react';
import ServiceTabs from '@/components/services/lol/ServiceTabs';
import { useSearchParams } from 'next/navigation';
import { UserCheck, Sparkles, CreditCard, ChevronRight } from 'lucide-react';

function StepProgressIndicator() {
  const searchParams = useSearchParams();
  const booster = searchParams.get('booster');
  const hasBooster = !!booster;

  return (
    <div className="mb-8">
      {/* Mobile Step Bar */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-lg backdrop-blur-md">
        {/* Step 1 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasBooster
                ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                : 'bg-blue-600 text-white'
            }`}
          >
            {hasBooster ? '✓' : '1'}
          </div>
          <div className="truncate">
            <div className="text-[11px] sm:text-xs text-zinc-400 font-medium">Bước 1</div>
            <div className={`text-xs sm:text-sm font-bold truncate ${hasBooster ? 'text-emerald-400' : 'text-white'}`}>
              {hasBooster ? 'Đã chọn Booster' : 'Chọn Booster'}
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mx-1" />

        {/* Step 2 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              hasBooster
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
            }`}
          >
            2
          </div>
          <div className="truncate">
            <div className="text-[11px] sm:text-xs text-zinc-400 font-medium">Bước 2</div>
            <div className={`text-xs sm:text-sm font-bold truncate ${hasBooster ? 'text-white' : 'text-zinc-500'}`}>
              Chọn dịch vụ
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mx-1" />

        {/* Step 3 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-zinc-800 text-zinc-500 border border-zinc-700">
            3
          </div>
          <div className="truncate">
            <div className="text-[11px] sm:text-xs text-zinc-400 font-medium">Bước 3</div>
            <div className="text-xs sm:text-sm font-bold text-zinc-500 truncate">
              Cấu hình & Trả
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LOLLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <Navbar />

      <main className="relative pt-24 pb-32 px-4 sm:px-6">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] bg-center opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              DỊCH VỤ <span className="text-blue-500">LIÊN MINH HUYỀN THOẠI</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-400">
              Chọn Booster uy tín và cấu hình dịch vụ mong muốn
            </p>
          </div>

          {/* Interactive Multi-step Indicator */}
          <Suspense fallback={<div className="h-16 bg-zinc-900/50 rounded-2xl animate-pulse mb-8" />}>
            <StepProgressIndicator />
          </Suspense>

          {/* Step 1: Select Booster (Shared across all LOL services) */}
          <Suspense fallback={<div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />}>
            <BoosterPicker />
          </Suspense>

          {/* Step 2: Service Configuration */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 text-xs sm:text-sm font-extrabold border border-white/10">
                  2
                </span>
                <span>Chọn Dịch Vụ Của Booster</span>
              </h2>
            </div>

            {/* Navigation Tabs */}
            <Suspense fallback={<div className="h-14 bg-zinc-900/50 rounded-xl animate-pulse mb-8" />}>
              <ServiceTabs />
            </Suspense>

            {/* Step 3: Render Specific Service Page Form */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
