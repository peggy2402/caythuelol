'use client';

import React from 'react';
import Image from 'next/image';

interface ChampionCardProps {
  champion: any;
  isSelected: boolean;
  onClick: () => void;
  selectionOrder?: number;
  isBoosterFavorite?: boolean;
  onHover?: (champ: any, rect: DOMRect) => void;
  onLeave?: () => void;
}

const ROLE_NAMES_VI: Record<string, string> = {
  Fighter: 'Đấu Sĩ',
  Tank: 'Đỡ Đòn',
  Mage: 'Pháp Sư',
  Assassin: 'Sát Thủ',
  Marksman: 'Xạ Thủ',
  Support: 'Hỗ Trợ',
};

export const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2 text-[10px]">
    <span className="w-10 text-zinc-400 font-semibold">{label}</span>
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${color}`} 
        style={{ width: `${Math.min(100, Math.max(0, (value / 10) * 100))}%` }} 
      />
    </div>
    <span className="text-[9px] text-zinc-500 font-mono w-3 text-right">{value}</span>
  </div>
);

export function ChampionTooltip({ 
  champion, 
  style 
}: { 
  champion: any; 
  style: React.CSSProperties;
}) {
  const translatedRoles = (champion.tags || [])
    .map((t: string) => ROLE_NAMES_VI[t] || t)
    .join(', ');

  const subtitle = champion.title 
    ? `${champion.title} • ${translatedRoles}` 
    : translatedRoles;

  return (
    <div 
      style={style}
      className="absolute z-50 pointer-events-none transition-all duration-150 ease-out hidden md:block"
    >
      <div className="w-64 bg-zinc-950/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl shadow-cyan-950/50 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 pr-2">
            <h4 className="font-bold text-white text-sm truncate">{champion.name}</h4>
            <p className="text-[10px] text-cyan-300/80 truncate font-medium">{subtitle}</p>
          </div>
          <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
            champion.info?.difficulty > 7 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            champion.info?.difficulty > 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            Độ khó: {champion.info?.difficulty ?? 5}/10
          </div>
        </div>
        <div className="space-y-1.5 pt-2 border-t border-white/10">
          <StatBar label="CÔNG" value={champion.info?.attack ?? 5} color="bg-red-500" />
          <StatBar label="PHÉP" value={champion.info?.magic ?? 5} color="bg-blue-500" />
          <StatBar label="THỦ" value={champion.info?.defense ?? 5} color="bg-green-500" />
        </div>
      </div>
    </div>
  );
}

export default function ChampionCard({
  champion,
  isSelected,
  onClick,
  selectionOrder,
  isBoosterFavorite,
  onHover,
  onLeave,
}: ChampionCardProps) {
  return (
    <div 
      onClick={onClick}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onHover?.(champion, rect);
      }}
      onMouseLeave={() => onLeave?.()}
      className={`group relative cursor-pointer transition-all duration-200 select-none ${
        isSelected ? 'scale-105' : 'hover:scale-105'
      }`}
    >
      {/* Selection Ring & Glow */}
      <div className={`absolute -inset-1 rounded-xl transition-all duration-300 ${
        isSelected 
          ? 'bg-gradient-to-br from-blue-500 to-cyan-400 opacity-100 blur-sm' 
          : 'bg-white/0 opacity-0 group-hover:bg-white/10 group-hover:opacity-100'
      }`} />

      {/* Card Content */}
      <div className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-zinc-900 ${
        isSelected ? 'border-cyan-400 shadow-md shadow-cyan-500/20' : 'border-zinc-800 group-hover:border-zinc-600'
      }`}>
        <Image
          src={champion.imageUrl}
          alt={champion.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 64px, 80px"
          loading="lazy"
        />

        {/* Selection Order Badge */}
        {selectionOrder !== undefined && selectionOrder > 0 && (
          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center shadow-lg border border-black/40 z-10">
            {selectionOrder}
          </div>
        )}

        {/* Booster Favorite Badge */}
        {isBoosterFavorite && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black text-[9px] font-extrabold flex items-center gap-0.5 shadow-md border border-amber-300/40 z-10" title="Tướng tủ của tuyển thủ">
            <span>⭐ Tủ</span>
          </div>
        )}
        
        {/* Overlay Name */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-1 pt-4">
          <p className="text-center text-[10px] font-bold text-white truncate px-1">
            {champion.name}
          </p>
        </div>
      </div>
    </div>
  );
}
