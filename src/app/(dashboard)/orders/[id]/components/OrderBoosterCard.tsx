'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  User,
  Star,
  ExternalLink,
  Phone,
  Gamepad2,
  ChevronDown,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { getBoosterGameBadgeStyle } from './orderHelpers';

interface OrderBoosterCardProps {
  order: any;
  isBooster: boolean;
  isCustomer: boolean;
  boosterProfile: any;
  boosterGamesWithServices: Array<{
    gameCode: string;
    servers: string[];
    ranks?: string[];
    roles?: string[];
    champions?: string[];
    services: Array<{ slug: string; name: string }>;
  }>;
  collapsedGames: Record<string, boolean>;
  toggleGameCollapse: (gameCode: string) => void;
}

export default function OrderBoosterCard({
  order,
  isBooster,
  isCustomer,
  boosterProfile,
  boosterGamesWithServices,
  collapsedGames,
  toggleGameCollapse,
}: OrderBoosterCardProps) {
  if (isBooster) return null;

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, label: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    toast.success(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div>
      <h3 className="text-sm font-bold text-zinc-400 uppercase mb-3 flex items-center gap-2">
        <Award className="w-4 h-4 text-blue-400" /> Thông tin Tuyển thủ (Booster)
      </h3>
      {order.boosterId ? (
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700 flex items-center justify-center">
                {order.boosterId.profile?.avatar ? (
                  <img
                    src={order.boosterId.profile.avatar}
                    alt={order.boosterId.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-zinc-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-base truncate">
                    {boosterProfile?.displayName || order.boosterId.username}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    @{order.boosterId.username}
                  </span>
                  {order.boosterId.booster_info?.isReady !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        order.boosterId.booster_info.isReady
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {order.boosterId.booster_info.isReady ? 'Đang sẵn sàng' : 'Tạm nghỉ'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {Number(boosterProfile?.rating ?? order.boosterId.booster_info?.rating ?? 5).toFixed(1)}
                  </span>
                  <span>
                    {boosterProfile?.completedOrders ?? order.boosterId.booster_info?.completed_orders ?? 0} đơn
                    hoàn thành
                  </span>
                  {order.boosterId.booster_info?.ingame_name && (
                    <span className="text-zinc-300">
                      In-game:{' '}
                      <strong className="font-mono text-white">
                        {order.boosterId.booster_info.ingame_name}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={`/b/${order.boosterId.username}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors shrink-0 cursor-pointer"
            >
              <span>Xem hồ sơ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(boosterProfile?.bio || order.boosterId.booster_info?.bio) && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/70 p-3 rounded-lg border border-white/5">
              {boosterProfile?.bio || order.boosterId.booster_info?.bio}
            </p>
          )}

          {/* Chi tiết liên hệ & thông tin game của Booster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-3 border-t border-zinc-800/80">
            {order.boosterId.email && (
              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] font-medium block">Email liên hệ</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-200 font-medium font-mono text-xs">{order.boosterId.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.boosterId.email, 'Email', 'email')}
                    className="p-1 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    title="Sao chép Email"
                  >
                    {copiedField === 'email' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}

            {order.boosterId.profile?.discord_id && (
              <div className="space-y-1">
                <span className="text-zinc-500 text-[11px] font-medium block">Discord ID</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-200 font-mono text-xs font-semibold">{order.boosterId.profile.discord_id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.boosterId.profile.discord_id, 'Discord ID', 'discord')}
                    className="p-1 rounded-md text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    title="Sao chép Discord ID"
                  >
                    {copiedField === 'discord' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}

            {order.boosterId.phoneNumber &&
              (() => {
                const phone = String(order.boosterId.phoneNumber);
                const cleanPhone = phone.replace(/[^\d+]/g, '');
                return (
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[11px] font-medium block">Số điện thoại</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400 font-mono font-bold text-xs">{phone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(phone, 'Số điện thoại', 'phone')}
                        className="p-1 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                        title="Sao chép số điện thoại"
                      >
                        {copiedField === 'phone' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                      <a
                        href={`tel:${cleanPhone}`}
                        target="_top"
                        title="Gọi điện cho Booster"
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/35 text-emerald-400 text-[10px] font-bold gap-1 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
                      >
                        <Phone size={11} />
                        <span>Gọi</span>
                      </a>
                    </div>
                  </div>
                );
              })()}

            {order.boosterId.profile?.facebook_url &&
              (() => {
                const boosterName = boosterProfile?.displayName || order.boosterId.username || 'Booster';
                return (
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[11px] font-medium block">Facebook cá nhân</span>
                    <div>
                      <a
                        href={order.boosterId.profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 hover:text-blue-300 text-xs font-semibold transition-all group/fb max-w-full cursor-pointer"
                        title={`Mở trang Facebook của ${boosterName}`}
                      >
                        <span className="truncate">{boosterName} (Facebook)</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover/fb:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                );
              })()}
          </div>

          {/* 🎮 Hồ sơ Game & Dịch vụ cung cấp */}
          {boosterGamesWithServices.length > 0 && (
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                  <Gamepad2 className="w-4 h-4 text-blue-400" /> Hồ sơ Game & Dịch vụ cung cấp
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {boosterGamesWithServices.length} tựa game nhận cày
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {boosterGamesWithServices.map((g) => {
                  const isCollapsed = Boolean(collapsedGames[g.gameCode]);
                  return (
                    <div
                      key={g.gameCode}
                      className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGameCollapse(g.gameCode)}
                        className="w-full p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wide border ${getBoosterGameBadgeStyle(
                              g.gameCode
                            )}`}
                          >
                            {g.gameCode}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
                            <span className="text-zinc-500">Server:</span>
                            <strong className="text-zinc-200 font-semibold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                              {g.servers.join(', ')}
                            </strong>
                          </span>

                          {Array.isArray(g.ranks) && g.ranks.length > 0 && (
                            <span className="text-[11px] text-zinc-400 hidden sm:inline-flex items-center gap-1">
                              • Rank: <strong className="text-blue-400 font-medium">{g.ranks.join(', ')}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
                            {g.services.length} dịch vụ
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                              isCollapsed ? '-rotate-90' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="px-3 pb-3 sm:px-4 sm:pb-3.5 pt-1 border-t border-white/[0.04] space-y-2.5">
                          <div className="flex flex-wrap gap-2">
                            {g.services.map((svc) => (
                              <span
                                key={svc.slug}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 text-xs font-semibold shadow-sm transition-all"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                {svc.name}
                              </span>
                            ))}
                          </div>

                          {Boolean(
                            (g.roles && g.roles.length > 0) || (g.champions && g.champions.length > 0)
                          )}
                          {Boolean(
                            (g.roles && g.roles.length > 0) || (g.champions && g.champions.length > 0)
                          ) && (
                            <div className="pt-2 border-t border-white/[0.03] text-[11px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
                              {g.roles && g.roles.length > 0 && (
                                <span>
                                  Vị trí: <strong className="text-zinc-200">{g.roles.join(', ')}</strong>
                                </span>
                              )}
                              {g.champions && g.champions.length > 0 && (
                                <span>
                                  Tướng tủ:{' '}
                                  <strong className="text-zinc-200">{g.champions.slice(0, 6).join(', ')}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="font-medium">
            Tuyển thủ: <strong className="text-amber-200">Đang tìm kiếm...</strong> (Đơn hàng đang chờ tuyển
            thủ tiếp nhận trên sàn)
          </span>
        </div>
      )}
    </div>
  );
}
