// src/app/services/[game]/components/GameBoostersTab.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Star, User, Loader2 } from 'lucide-react';
import UserBadge from '@/components/UserBadge';
import { GameDefinition } from '@/lib/games';
import { BoosterItem } from './types';

interface GameBoostersTabProps {
  game: GameDefinition;
  filteredBoosters: BoosterItem[];
  loadingBoosters: boolean;
  onSelectBoosterForHire: (booster: BoosterItem) => void;
}

export function GameBoostersTab({
  game,
  filteredBoosters,
  loadingBoosters,
  onSelectBoosterForHire,
}: GameBoostersTabProps) {
  const router = useRouter();

  return (
    <div>
      {loadingBoosters ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-zinc-400 text-sm">Đang tải danh sách tuyển thủ...</p>
        </div>
      ) : filteredBoosters.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoosters.map((booster) => {
            const isReady = booster.booster_info?.isReady ?? true;
            const completedCount =
              booster.completedOrders || booster.booster_info?.completed_orders || 0;

            return (
              <div
                key={booster._id}
                onClick={() => router.push(`/b/${encodeURIComponent(booster.username)}`)}
                className="group bg-zinc-900/60 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Avatar & Online status */}
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500 transition-colors bg-zinc-800 shrink-0">
                      {booster.avatar ? (
                        <img
                          src={booster.avatar}
                          alt={booster.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <User className="w-full h-full p-2 text-zinc-500" />
                      )}
                      <div
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                          isReady ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-extrabold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                          {booster.displayName || booster.username}
                        </h3>
                        <UserBadge role={booster.role || 'BOOSTER'} size="sm" />
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <div
                          className={`flex items-center gap-1 font-bold ${
                            booster.rating && booster.rating > 0 ? 'text-amber-400' : 'text-zinc-500'
                          }`}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              booster.rating && booster.rating > 0
                                ? 'fill-amber-400'
                                : 'fill-zinc-600 text-zinc-600'
                            }`}
                          />
                          <span>
                            {booster.rating && booster.rating > 0 ? booster.rating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                        <span className="text-zinc-600">·</span>
                        <span className="text-zinc-400 font-medium">
                          {completedCount} đơn hoàn thành
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                        isReady
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isReady ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                        }`}
                      />
                      {isReady ? 'Sẵn sàng nhận đơn' : 'Đang bận'}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                  <Link
                    href={`/b/${booster.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs text-center transition-colors"
                  >
                    Hồ sơ chi tiết
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBoosterForHire(booster);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center transition-colors shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Thuê tuyển thủ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl border border-dashed border-white/10 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            Không tìm thấy tuyển thủ nào
          </h3>
          <p className="text-xs text-zinc-400">
            Thử thay đổi bộ lọc tìm kiếm hoặc quay lại sau.
          </p>
        </div>
      )}
    </div>
  );
}
