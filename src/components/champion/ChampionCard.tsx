'use client';

import React from 'react';
import Image from 'next/image';
import { Info } from 'lucide-react';

interface ChampionCardProps {
  champion: any;
  isSelected: boolean;
  onClick: () => void;
}

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-2 text-[10px]">
    <span className="w-8 text-zinc-400">{label}</span>
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full ${color}`} 
        style={{ width: `${(value / 10) * 100}%` }} 
      />
    </div>
  </div>
);

export default function ChampionCard({ champion, isSelected, onClick }: ChampionCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`group relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-105' : 'hover:scale-105'
      }`}
    >
      {/* Selection Ring & Glow */}
      <div className={`absolute -inset-1 rounded-xl transition-all duration-300 ${
        isSelected 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 opacity-100 blur-sm' 
          : 'bg-white/0 opacity-0 group-hover:bg-white/10 group-hover:opacity-100'
      }`} />

      {/* Card Content */}
      <div className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-zinc-900 ${
        isSelected ? 'border-transparent' : 'border-zinc-800 group-hover:border-zinc-600'
      }`}>
        <Image
          src={champion.imageUrl}
          alt={champion.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 64px, 80px"
          loading="lazy"
        />
        
        {/* Overlay Name (Mobile/Small) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1 pt-4">
          <p className="text-center text-[10px] font-bold text-white truncate px-1">
            {champion.name}
          </p>
        </div>
      </div>

      {/* Tooltip (Desktop Only) */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 hidden md:block">
        <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-lg p-3 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-bold text-white text-sm">{champion.name}</h4>
              <p className="text-[10px] text-zinc-400">{champion.tags.join(', ')}</p>
            </div>
            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              champion.info.difficulty > 7 ? 'bg-red-500/20 text-red-400' :
              champion.info.difficulty > 3 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              Diff: {champion.info.difficulty}
            </div>
          </div>
          <div className="space-y-1">
            <StatBar label="ATK" value={champion.info.attack} color="bg-red-500" />
            <StatBar label="MAG" value={champion.info.magic} color="bg-blue-500" />
            <StatBar label="DEF" value={champion.info.defense} color="bg-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
