'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, User as UserIcon, Heart, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface BoosterCardProps {
  booster: any;
  isBookmarked: boolean;
  onToggleBookmark: (boosterId: string, e: React.MouseEvent) => void;
}

export default function BoosterCard({ booster, isBookmarked, onToggleBookmark }: BoosterCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);
  const [isNavigatingHire, setIsNavigatingHire] = useState(false);

  const rank = booster.games?.[0]?.ranks?.[0];
  const profileUrl = `/b/${booster.username}`;
  const hireUrl = `/services/lol/rank-boost?booster=@${booster.username}`;

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingProfile(true);
    router.push(profileUrl);
  };

  const handleHireClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigatingHire(true);
    router.push(hireUrl);
  };

  return (
    <div className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-zinc-900/60 flex flex-col">
      {/* Cover / Avatar Area */}
      <div 
        className="h-28 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 relative cursor-pointer"
        onClick={handleProfileClick}
      >
        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
        
        <button
            onClick={(e) => onToggleBookmark(booster._id, e)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all z-20 group/heart"
        >
            <Heart className={`w-5 h-5 transition-colors ${isBookmarked ? 'fill-red-500 text-red-500' : 'text-zinc-400 group-hover/heart:text-white'}`} />
        </button>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-10">
          <div className="block w-20 h-20 rounded-full border-4 border-zinc-950 bg-zinc-900 overflow-hidden flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative">
            {isNavigatingProfile && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            )}
            {booster.avatar ? (
              <Image src={booster.avatar} alt={booster.username} fill className="object-cover" sizes="80px" />
            ) : (
              <UserIcon className="w-10 h-10 text-zinc-500" />
            )}
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="pt-12 pb-6 px-6 flex flex-col flex-1 text-center">
        <a href={profileUrl} onClick={handleProfileClick} className="block mb-1">
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{booster.displayName || booster.username}</h3>
        </a>
        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-4">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-bold">{booster.rating?.toFixed(1) || '5.0'}</span>
          <span className="text-zinc-500 text-sm ml-1">({booster.completedOrders || 0} {t('completedOrders')})</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6 flex-1 items-start">
          {rank ? (
             <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-bold text-yellow-500">
               <img src={`/images/ranks/${rank.split(/[_ ]/)[0].toLowerCase()}.png`} alt={rank} className="w-3.5 h-3.5 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
               {rank.replace('_', ' ')}
             </span>
          ) : ( <span className="px-3 py-1 rounded-full bg-zinc-800/50 border border-white/5 text-xs font-medium text-zinc-300">Challenger</span> )}
        </div>

        <button onClick={handleHireClick} disabled={isNavigatingHire || isNavigatingProfile} className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-white/10 hover:shadow-blue-500/30 group/btn disabled:opacity-70">
          {isNavigatingHire ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('hireBooster')} <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></>}
        </button>
      </div>
    </div>
  );
}