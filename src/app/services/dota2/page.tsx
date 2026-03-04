// src/app/services/valorant/page.tsx
'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function ValorantServicePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30">
      <Navbar />
      
      <main className="relative pt-32 pb-20 container mx-auto px-6">
        {/* Background Noise */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("/noise.png")' }}></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
            <Construction className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            DỊCH VỤ <span className="text-red-500">DOTA2</span>
          </h1>
          
          <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
            Hệ thống đang trong quá trình hoàn thiện tính năng này. 
            Vui lòng quay lại sau hoặc sử dụng dịch vụ Liên Minh Huyền Thoại.
          </p>

          <Link 
            href="/services"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang dịch vụ
          </Link>
        </div>
      </main>
    </div>
  );
}
