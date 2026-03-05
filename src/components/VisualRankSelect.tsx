"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const rankImageMap: Record<string, string> = {
  IRON: '/images/ranks/iron.png',
  BRONZE: '/images/ranks/bronze.png',
  SILVER: '/images/ranks/silver.png',
  GOLD: '/images/ranks/gold.png',
  PLATINUM: '/images/ranks/platinum.png',
  EMERALD: '/images/ranks/emerald.png',
  DIAMOND: '/images/ranks/diamond.png',
  MASTER: '/images/ranks/master.png',
};

const getRankImage = (rankKey: string) => {
  const rankTier = rankKey.split('_')[0].toUpperCase();
  return rankImageMap[rankTier] || '/images/ranks/iron.png';
};

export interface Rank {
  key: string;
  label: string;
}

interface VisualRankSelectProps {
  ranks: Rank[];
  selectedRank: string | null;
  onSelect: (rankKey: string) => void;
  disabledRanks?: string[];
  label: string;
}

const TIER_ORDER = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];

export const VisualRankSelect = ({
  ranks,
  selectedRank,
  onSelect,
  disabledRanks = [],
  label,
}: VisualRankSelectProps) => {

  const { groupedRanks, masterRank } = useMemo(() => {
    const masterRank = ranks.find(r => r.key === 'MASTER');
    const groups: Record<string, Rank[]> = {};

    ranks.forEach(rank => {
      if (rank.key === 'MASTER') return;
      const tierName = rank.key.split('_')[0];
      if (!groups[tierName]) {
        groups[tierName] = [];
      }
      groups[tierName].push(rank);
    });

    const sortedGroups: Record<string, Rank[]> = {};
    TIER_ORDER.forEach(tier => {
      if (groups[tier]) {
        sortedGroups[tier] = groups[tier].sort((a, b) => a.label > b.label ? -1 : 1);
      }
    });

    return { groupedRanks: sortedGroups, masterRank };
  }, [ranks]);
  

  return (
    <div className="w-full">
      <label className="text-xs text-zinc-400 mb-2 block font-medium">{label}</label>
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
          {TIER_ORDER.map(tierName => {
            const divisions = groupedRanks[tierName];
            if (!divisions) return null;

            const isDisabledTier = divisions.every(d => disabledRanks?.includes(d.key));

            return (
              <div key={tierName} className={cn("space-y-2 p-2 rounded-lg w-full bg-zinc-900/30 border border-white/5", isDisabledTier && "opacity-40 grayscale")}>
                <div className="flex items-center gap-2">
                  <Image src={getRankImage(tierName)} alt={tierName} width={24} height={24} unoptimized />
                  <h4 className="font-bold text-sm text-white">{tierName}</h4>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {divisions.map(division => {
                    const isSelected = selectedRank === division.key;
                    const isDisabled = disabledRanks?.includes(division.key);
                    return (
                      <button
                        key={division.key}
                        onClick={() => !isDisabled && onSelect(division.key)}
                        disabled={isDisabled}
                        title={division.label}
                        className={cn(
                          "relative aspect-video rounded-md text-sm font-bold text-zinc-300 transition-all duration-200 border",
                          "disabled:cursor-not-allowed",
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                            : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/80 hover:border-zinc-600"
                        )}
                      >
                        {division.label.split(' ').pop()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          })}

          {/* Master Rank */}
          {masterRank && (
              <div className="w-full p-2">
                  <button
                      onClick={() => !disabledRanks?.includes(masterRank.key) && onSelect(masterRank.key)}
                      disabled={disabledRanks?.includes(masterRank.key)}
                      title={masterRank.label}
                      className={cn(
                          "w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg p-3 text-base font-bold transition-all duration-200 border",
                          "disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale",
                          selectedRank === masterRank.key
                          ? "bg-gradient-to-r from-purple-600/30 to-red-600/30 border-purple-500 text-white shadow-[0_0_15px_rgba(192,132,252,0.5)]"
                          : "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700/50 hover:border-purple-700 text-zinc-300"
                      )}
                  >
                      <Image src={getRankImage(masterRank.key)} alt={masterRank.label} width={32} height={32} unoptimized />
                      {masterRank.label}
                  </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
