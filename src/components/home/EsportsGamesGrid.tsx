'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gamepad2 } from 'lucide-react';

const ESPORTS_GAMES = [
  {
    id: 'lol',
    name: 'Liên Minh Huyền Thoại',
    shortName: 'LMHT / LoL',
    slug: 'lol',
    badge: 'Phổ biến nhất',
    servicesCount: '12 Dịch Vụ',
    boosterCount: '240+ Pro',
    image: '/images/games/lol-card.jpg',
    gradient: 'from-blue-600/30 to-cyan-500/20',
    borderGlow: 'group-hover:border-cyan-500/50'
  },
  {
    id: 'val',
    name: 'Valorant',
    shortName: 'Valorant',
    slug: 'val',
    badge: 'Radiant Boost',
    servicesCount: '8 Dịch Vụ',
    boosterCount: '180+ Pro',
    image: '/images/games/val-card.jpg',
    gradient: 'from-rose-600/30 to-red-500/20',
    borderGlow: 'group-hover:border-rose-500/50'
  },
  {
    id: 'tft',
    name: 'Đấu Trường Chân Lý',
    shortName: 'TFT / ĐTCL',
    slug: 'tft',
    badge: 'Mùa Mới',
    servicesCount: '6 Dịch Vụ',
    boosterCount: '95+ Pro',
    image: '/images/games/tft-card.jpg',
    gradient: 'from-amber-600/30 to-yellow-500/20',
    borderGlow: 'group-hover:border-amber-500/50'
  },
  {
    id: 'wildrift',
    name: 'LMHT: Tốc Chiến',
    shortName: 'Tốc Chiến',
    slug: 'wildrift',
    badge: 'Mobile Hot',
    servicesCount: '6 Dịch Vụ',
    boosterCount: '65+ Pro',
    image: '/images/games/lol-card.jpg',
    gradient: 'from-sky-600/30 to-blue-500/20',
    borderGlow: 'group-hover:border-sky-500/50'
  },
  {
    id: 'aov',
    name: 'Liên Quân Mobile',
    shortName: 'AOV / LQM',
    slug: 'aov',
    badge: 'Chiến Tướng',
    servicesCount: '5 Dịch Vụ',
    boosterCount: '85+ Pro',
    image: null,
    gradient: 'from-purple-600/30 to-indigo-500/20',
    borderGlow: 'group-hover:border-purple-500/50'
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2 / Premier',
    slug: 'cs2',
    badge: 'Faceit & Premier',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '50+ Pro',
    image: null,
    gradient: 'from-orange-600/30 to-amber-500/20',
    borderGlow: 'group-hover:border-orange-500/50'
  },
  {
    id: 'fconline',
    name: 'FC Online',
    shortName: 'FCO / FIFA 4',
    slug: 'fconline',
    badge: 'Thách Đấu',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '45+ Pro',
    image: null,
    gradient: 'from-emerald-600/30 to-teal-500/20',
    borderGlow: 'group-hover:border-emerald-500/50'
  },
  {
    id: 'apex',
    name: 'Apex Legends',
    shortName: 'Apex Legends',
    slug: 'apex',
    badge: 'Predator Boost',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '35+ Pro',
    image: null,
    gradient: 'from-red-600/30 to-orange-500/20',
    borderGlow: 'group-hover:border-red-500/50'
  },
  {
    id: 'dota2',
    name: 'Dota 2',
    shortName: 'Dota 2 MMR',
    slug: 'dota2',
    badge: 'Immortal MMR',
    servicesCount: '4 Dịch Vụ',
    boosterCount: '30+ Pro',
    image: null,
    gradient: 'from-red-700/30 to-rose-600/20',
    borderGlow: 'group-hover:border-red-600/50'
  },
  {
    id: 'ow2',
    name: 'Overwatch 2',
    shortName: 'Overwatch 2',
    slug: 'ow2',
    badge: 'Top 500',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '25+ Pro',
    image: null,
    gradient: 'from-amber-500/30 to-orange-600/20',
    borderGlow: 'group-hover:border-amber-400/50'
  },
  {
    id: 'naraka',
    name: 'Naraka: Bladepoint',
    shortName: 'Naraka',
    slug: 'naraka',
    badge: 'Tu La',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '20+ Pro',
    image: null,
    gradient: 'from-crimson-600/30 to-red-800/20',
    borderGlow: 'group-hover:border-red-500/50'
  },
  {
    id: 'pubg',
    name: 'PUBG: Battlegrounds',
    shortName: 'PUBG PC',
    slug: 'pubg',
    badge: 'Top 500 RP',
    servicesCount: '3 Dịch Vụ',
    boosterCount: '40+ Pro',
    image: null,
    gradient: 'from-yellow-600/30 to-amber-600/20',
    borderGlow: 'group-hover:border-yellow-500/50'
  }
];

export default function EsportsGamesGrid() {
  return (
    <section className="py-16 relative z-10 border-t border-zinc-800/60 bg-[#06080d]/70 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">
              <Gamepad2 className="w-4 h-4" />
              Hệ Sinh Thái Game Hỗ Trợ
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Chọn Tựa Game Của Bạn
            </h2>
          </div>
          <p className="text-zinc-400 text-sm max-w-md mt-2 md:mt-0">
            Hơn 500+ Booster chuyên nghiệp đạt bậc xếp hạng cao nhất trong từng tựa game sẵn sàng đồng hành cùng bạn.
          </p>
        </div>

        {/* 12 Game Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {ESPORTS_GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/services/${game.slug}`}
              className={`group relative rounded-2xl bg-zinc-900/70 border border-zinc-800/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${game.borderGlow} overflow-hidden flex flex-col justify-between`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              <div>
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-zinc-950 border border-white/5 flex items-center justify-center">
                  {game.image ? (
                    <Image
                      src={game.image}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-3 text-center">
                      <Gamepad2 className="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
                      <span className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">{game.shortName}</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-white/10">
                    {game.badge}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                  {game.name}
                </h3>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60 mt-2">
                <span>{game.servicesCount}</span>
                <span className="text-emerald-400 font-semibold">{game.boosterCount}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
