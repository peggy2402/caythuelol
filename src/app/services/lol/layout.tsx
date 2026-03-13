// src/app/services/lol/layout.tsx
'use client';

import Navbar from '@/components/Navbar';
import BoosterPicker from '@/components/BoosterPicker';
import { Suspense } from 'react';
import ServiceTabs from '@/components/services/lol/ServiceTabs';

export default function LOLLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <Navbar />
      
      <main className="relative pt-24 pb-32 px-4">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[url('/noise.png')] bg-center opacity-10 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
              DỊCH VỤ <span className="text-blue-500">LIÊN MINH HUYỀN THOẠI</span>
            </h1>
            <p className="text-zinc-400">Chọn Booster và cấu hình dịch vụ mong muốn</p>
          </div>

          {/* Step 1: Select Booster (Shared across all LOL services) */}
          <Suspense fallback={<div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />}>
            <BoosterPicker />
          </Suspense>

          {/* Step 2: Service Configuration */}
          <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm border border-white/10">2</span>
                    Chọn dịch vụ
                </h2>
            </div>

            {/* Navigation Tabs */}
            <Suspense fallback={<div className="h-14 bg-zinc-900/50 rounded-xl animate-pulse mb-8" />}>
              <ServiceTabs />
            </Suspense>

            {/* Render Specific Service Page */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
