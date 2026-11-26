// src/app/services/[game]/components/GameServicesTab.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Swords, Gamepad2, Users, ArrowRight, Lock, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { GameDefinition } from '@/lib/games';
import { GroupedService, ICON_MAP, AVATAR_BG_COLORS } from './types';
import { renderWithStarIcon } from '@/app/services/[game]/[service]/components/StarIcon';

interface GameServicesTabProps {
  game: GameDefinition;
  groupedServices: GroupedService[];
  loadingServices: boolean;
  onSwitchToBoosters: () => void;
}

export function GameServicesTab({
  game,
  groupedServices,
  loadingServices,
  onSwitchToBoosters,
}: GameServicesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Swords size={20} className="text-blue-400" />
            <span>Chọn loại dịch vụ bạn cần</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Nhấn vào dịch vụ để xem danh sách tuyển thủ và bảng giá chi tiết của từng tuyển thủ.
          </p>
        </div>
      </div>

      {loadingServices ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-zinc-400 text-sm">Đang tải danh mục dịch vụ từ tuyển thủ...</p>
        </div>
      ) : groupedServices.length === 0 ? (
        /* EMPTY STATE: Chưa có tuyển thủ nào niêm yết dịch vụ */
        <div className="p-8 sm:p-14 rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-900/30 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
            <Gamepad2 size={32} />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white mb-1">
              Hiện chưa có gói dịch vụ nào cho {game.name}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Các tuyển thủ hiện đang cập nhật bảng giá dịch vụ cho tựa game này. Bạn có thể xem danh sách tuyển thủ đang online để thuê trực tiếp hoặc gửi yêu cầu cày thuê!
            </p>
          </div>
          <button
            type="button"
            onClick={onSwitchToBoosters}
            className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Users size={16} />
            <span>Xem Danh Sách Tuyển Thủ Đang Online</span>
          </button>
        </div>
      ) : (
        /* HIỂN THỊ LƯỚI CARD KHỚP BẢN VẼ TAY CỦA USER */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {groupedServices.map((group) => {
            const IconComp = ICON_MAP[group.iconName] || Trophy;
            const isDeposit = group.depositPercent < 100;
            const hasBoosters = group.boosters.length > 0;
            const displayBoosters = group.boosters.slice(0, 3);
            const remainingCount = group.boosters.length > 3 ? group.boosters.length - 3 : 0;

            const cardContent = (
              <div
                className={`h-full rounded-3xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between ${
                  hasBoosters
                    ? 'bg-[#0c101d] group-hover:bg-[#11172a] border border-blue-500/30 group-hover:border-blue-500 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]'
                    : 'bg-[#0a0d14]/70 border border-zinc-800/60 opacity-60 grayscale-[35%] cursor-not-allowed select-none'
                }`}
                onClick={() => {
                  if (!hasBoosters) {
                    toast.error(
                      `Dịch vụ "${group.name}" hiện chưa có tuyển thủ nào niêm yết giá. Vui lòng chọn dịch vụ khác hoặc quay lại sau nhé!`
                    );
                  }
                }}
              >
                <div className="space-y-3">
                  {/* Top: Icon + Badge */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner ${
                        hasBoosters
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                          : 'bg-zinc-800/50 border border-zinc-700/40 text-zinc-500'
                      }`}
                    >
                      <IconComp size={22} />
                    </div>
                    {hasBoosters ? (
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                          isDeposit
                            ? 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {isDeposit ? `Cọc ${group.depositPercent}%` : 'Trọn gói'}
                      </span>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border bg-zinc-800/80 text-zinc-400 border-zinc-700/60 flex items-center gap-1 shadow-inner">
                        Chưa có tuyển thủ
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className={`font-extrabold text-base tracking-tight mb-1.5 transition-colors ${
                        hasBoosters
                          ? 'text-white group-hover:text-blue-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {renderWithStarIcon(group.name, 15)}
                    </h3>
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed min-h-[34px] ${
                        hasBoosters ? 'text-zinc-400' : 'text-zinc-500'
                      }`}
                    >
                      {renderWithStarIcon(group.desc, 12)}
                    </p>
                  </div>
                </div>

                {/* PHẦN ĐÁY: CHẤM TRÒN AVATAR BOOSTER + (+N) + MŨI TÊN HOẶC KHÓA */}
                <div className="pt-3.5 mt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {hasBoosters ? (
                      <>
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {displayBoosters.map((b, idx) => {
                            const colorClass = AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length];
                            const initial = (b.displayName || b.username || 'B').slice(0, 1).toUpperCase();

                            return (
                              <div
                                key={b._id || idx}
                                title={b.displayName || b.username || `Tuyển thủ #${idx + 1}`}
                                className="relative inline-block w-8 h-8 rounded-full ring-2 ring-[#0c101d] overflow-hidden shrink-0 shadow-md"
                              >
                                {b.avatar ? (
                                  <img
                                    src={b.avatar}
                                    alt={b.displayName || b.username || ''}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/default-avatar.png';
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center text-xs font-black ${colorClass}`}
                                  >
                                    {initial}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {remainingCount > 0 && (
                          <span className="text-xs font-black text-amber-400 pl-0.5">
                            +{remainingCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <span className="truncate">Tạm thời chưa có tuyển thủ</span>
                      </span>
                    )}
                  </div>

                  {hasBoosters ? (
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-blue-600 border border-white/10 group-hover:border-blue-500 flex items-center justify-center text-white transition-all duration-200 group-hover:translate-x-1 shadow-md">
                      <ArrowRight size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shadow-none">
                      <Lock size={14} />
                    </div>
                  )}
                </div>
              </div>
            );

            if (hasBoosters) {
              return (
                <Link
                  key={group.serviceType}
                  href={`/services/${game.id}/${group.serviceType}`}
                  className="group block h-full focus:outline-none"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div key={group.serviceType} className="h-full">
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
