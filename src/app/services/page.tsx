// src/app/services/page.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { ArrowRight, Gamepad2, Swords, Crosshair, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

const GAMES = [
  {
    id: 'lol',
    name: 'League of Legends',
    image: '/images/games/lol-card.jpg', // Bạn cần thêm ảnh này vào public
    url: '/services/lol/rank-boost', // Mặc định vào Rank Boost
    description: 'Leo rank thần tốc, Cày thuê uy tín số 1 Việt Nam',
    icon: Swords,
    color: 'from-blue-600 to-cyan-500',
    active: true
  },
  {
    id: 'tft',
    name: 'Teamfight Tactics',
    image: '/images/games/tft-card.jpg',
    url: '/services/tft',
    description: 'Cày thuê Đấu Trường Chân Lý, đội hình meta',
    icon: Gamepad2,
    color: 'from-orange-500 to-yellow-500',
    active: false
  },
  {
    id: 'valorant',
    name: 'Valorant',
    image: '/images/games/val-card.jpg',
    url: '/services/valorant',
    description: 'Leo rank Valorant, bắn thuê Radiant',
    icon: Crosshair,
    color: 'from-red-600 to-rose-500',
    active: false
  },
];

export default function ServicesHub() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      <Navbar />
      
      <main className="relative pt-32 pb-20 container mx-auto px-6">
        {/* Background Noise */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("/noise.png")' }}></div>

        <div className="text-center mb-16 relative z-10">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            CHỌN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">GAME</span> CẦN CÀY THUÊ
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Hệ thống hỗ trợ đa dạng các tựa game Esports hàng đầu hiện nay.
            Chọn game của bạn để bắt đầu leo rank ngay hôm nay.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          {GAMES.map((game) => (
            <Link 
              href={game.active ? game.url : '#'} 
              key={game.id}
              className={`group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 transition-all duration-500 ${!game.active ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-blue-500/30'}`}
            >
              {/* Image Placeholder if no image */}
              <div className={`h-48 w-full bg-gradient-to-br ${game.color} relative overflow-hidden`}>
                {game.image && (
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <game.icon className="absolute bottom-4 right-4 w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                
                {!game.active && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <span className="px-3 py-1 rounded-full border border-white/20 bg-black/50 text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{game.name}</h3>
                <p className="text-zinc-400 text-sm mb-6 line-clamp-2">{game.description}</p>
                
                <div className={`flex items-center gap-2 text-sm font-bold ${game.active ? 'text-blue-500' : 'text-zinc-600'}`}>
                  {game.active ? 'Xem dịch vụ' : 'Sắp ra mắt'}
                  <ArrowRight className={`w-4 h-4 transition-transform ${game.active ? 'group-hover:translate-x-1' : ''}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
