// src/app/(dashboard)/booster/services/page.tsx
'use client';

import Link from 'next/link';
import { Swords, Gamepad2, Crosshair, ArrowRight } from 'lucide-react';

const GAMES = [
  {
    id: 'lol',
    name: 'League of Legends',
    url: '/booster/services/lol', // Trỏ vào trang Cài đặt chung của LOL
    description: 'Cấu hình giá Rank, Net Wins, Placement...',
    icon: Swords,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    active: true
  },
  {
    id: 'tft',
    name: 'Teamfight Tactics',
    url: '/booster/services/tft',
    description: 'Cấu hình giá Cày thuê TFT',
    icon: Gamepad2,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10 border-orange-500/20',
    active: false
  },
  {
    id: 'valorant',
    name: 'Valorant',
    url: '/booster/services/valorant',
    description: 'Cấu hình giá Leo rank Valorant',
    icon: Crosshair,
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    active: false
  },
];

export default function ServicesHub() {
  return (
    <div className="max-w-5xl mx-auto pt-10">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Quản lý Dịch vụ
        </h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Chọn tựa game bạn muốn thiết lập bảng giá và cấu hình dịch vụ.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <Link 
            href={game.active ? game.url : '#'} 
            key={game.id}
            className={`group relative p-6 rounded-2xl border transition-all duration-300 ${
              game.active 
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:-translate-y-1 hover:shadow-xl' 
                : 'bg-zinc-900/50 border-zinc-800/50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${game.bg}`}>
              <game.icon className={`w-8 h-8 ${game.color}`} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              {game.name}
            </h3>
            <p className="text-sm text-zinc-400 mb-6 min-h-[40px]">
              {game.description}
            </p>
            
            <div className={`flex items-center gap-2 text-sm font-bold ${game.active ? 'text-blue-500' : 'text-zinc-600'}`}>
              {game.active ? 'Thiết lập ngay' : 'Sắp ra mắt'}
              <ArrowRight className={`w-4 h-4 transition-transform ${game.active ? 'group-hover:translate-x-1' : ''}`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
