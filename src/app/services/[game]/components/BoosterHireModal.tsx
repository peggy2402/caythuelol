// src/app/services/[game]/components/BoosterHireModal.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ArrowRight, AlertCircle, Trophy, Clock } from 'lucide-react';
import UserBadge from '@/components/UserBadge';
import { GameDefinition } from '@/lib/games';
import { BoosterItem, ICON_MAP } from './types';
import { getBoosterWorkingScheduleText } from '@/lib/booster-helpers';

interface BoosterHireModalProps {
  game: GameDefinition;
  selectedBooster: BoosterItem | null;
  onClose: () => void;
  boosterHireServices: any[];
}

export function BoosterHireModal({
  game,
  selectedBooster,
  onClose,
  boosterHireServices,
}: BoosterHireModalProps) {
  if (!selectedBooster) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto cursor-pointer"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#0e1017] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 shrink-0">
              <Image
                src={selectedBooster.avatar || '/images/default-avatar.png'}
                alt={selectedBooster.displayName || selectedBooster.username}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-avatar.png';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-white text-lg truncate">
                  {selectedBooster.displayName || selectedBooster.username}
                </h3>
                <UserBadge role={selectedBooster.role || 'BOOSTER'} size="sm" />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold">
                  <Clock size={11} className="text-cyan-400" />
                  <span>{getBoosterWorkingScheduleText(selectedBooster)}</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Chọn dịch vụ <span className="text-blue-400 font-semibold">{game.name}</span> bạn muốn tuyển thủ này thực hiện:
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách gói dịch vụ mà booster cung cấp */}
        <div className="overflow-y-auto custom-dark-scrollbar py-4 space-y-3 pr-1">
          {boosterHireServices.length > 0 ? (
            boosterHireServices.map((svc) => {
              const SvcIcon = ICON_MAP[svc.iconName] || Trophy;
              const hireUrl = `/services/${game.id}/${svc.slug}?booster=@${encodeURIComponent(selectedBooster.username)}`;

              return (
                <div
                  key={svc.slug}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <SvcIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                          {svc.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Cọc {svc.depositPercent}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {svc.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <Link
                      href={hireUrl}
                      onClick={onClose}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
                    >
                      <span>Chọn cày gói này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 px-4 text-center border border-dashed border-white/10 rounded-2xl bg-zinc-950/40">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h4 className="text-white font-bold text-sm mb-1">
                Tuyển thủ hiện chưa mở dịch vụ nào
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tuyển thủ này chưa kích hoạt hoặc đã tạm tắt toàn bộ gói dịch vụ cho tựa game {game.name}. Vui lòng quay lại sau hoặc chọn tuyển thủ khác!
              </p>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] sm:text-xs">Bảo chứng giao dịch an toàn 100% qua LeoRank</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
