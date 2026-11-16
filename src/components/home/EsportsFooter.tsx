'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Headphones, Shield, Clock } from 'lucide-react';
import { FaDiscord, FaFacebookMessenger } from 'react-icons/fa';

export default function EsportsFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#040507] border-t border-zinc-850 pt-20 pb-12 overflow-hidden">
      {/* Subtle Glow Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">

          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-10 w-10">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                LEO<span className="text-cyan-400">RANK</span>
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm">
              Sàn giao dịch cày thuê esports đa game uy tín hàng đầu. Cam kết bảo mật tài khoản tuyệt đối với bảo chứng tài chính 100% qua hệ thống ký quỹ Escrow thông minh.
            </p>

            {/* Social Channels */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/boostking.official/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all shadow-md"
              >
                <FaFacebookMessenger size={18} />
              </a>
              <a
                href="https://discord.gg/yourserver"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-[#5865F2] hover:text-white hover:border-[#5865F2] transition-all shadow-md"
              >
                <FaDiscord size={18} />
              </a>
            </div>
          </div>

          {/* Services Col */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Dịch Vụ Nổi Bật</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/services/lol/rank-boost" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Cày Rank / Elo LMHT</Link></li>
              <li><Link href="/services/val" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Valorant Radiant Boost</Link></li>
              <li><Link href="/services/tft" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> ĐTCL / TFT Rank</Link></li>
              <li><Link href="/services/wildrift" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Tốc Chiến Rank</Link></li>
              <li><Link href="/services/lol/coaching" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Huấn Luyện & Duo 1-1</Link></li>
            </ul>
          </div>

          {/* Support Col */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Chính Sách & Hỗ Trợ</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/help" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Trung tâm trợ giúp</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Điều khoản dịch vụ</Link></li>
              <li><Link href="/privacy" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Chính sách bảo mật</Link></li>
              <li><Link href="/contact" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-zinc-600" /> Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-white font-bold mb-5 uppercase tracking-wider text-xs">Thông Tin Liên Hệ</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Headphones size={13} /></div>
                <a href="mailto:support@leorank.site" className="hover:text-cyan-300 transition-colors text-xs">support@leorank.site</a>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Shield size={13} /></div>
                <span className="font-mono text-xs text-white">Hotline: 0862.587.229</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shrink-0"><Clock size={13} /></div>
                <span className="text-xs">Hỗ trợ 24/7 (Cả ngày lễ)</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-850 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <span>&copy; {currentYear} LEORANK. All rights reserved. Nền tảng cày thuê đa game uy tín hàng đầu.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
