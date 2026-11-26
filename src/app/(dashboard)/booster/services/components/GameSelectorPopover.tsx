// src/app/(dashboard)/booster/services/components/GameSelectorPopover.tsx
'use client';

import React from 'react';
import { Gamepad2, ChevronDown, Search, Check, X } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';
import { CustomService } from './servicesTypes';

interface GameSelectorPopoverProps {
  selectedGames: string[];
  activeGameCode: string;
  setActiveGameCode: (code: string) => void;
  currentGameDef: (typeof GAMES_CATALOG)[number];
  customServices: CustomService[];
  isGameSelectorOpen: boolean;
  setIsGameSelectorOpen: (open: boolean) => void;
  gameSearchQuery: string;
  setGameSearchQuery: (q: string) => void;
  gameSelectorRef: React.RefObject<HTMLDivElement | null>;
}

export const GameSelectorPopover: React.FC<GameSelectorPopoverProps> = ({
  selectedGames,
  activeGameCode,
  setActiveGameCode,
  currentGameDef,
  customServices,
  isGameSelectorOpen,
  setIsGameSelectorOpen,
  gameSearchQuery,
  setGameSearchQuery,
  gameSelectorRef,
}) => {
  if (selectedGames.length <= 1) return null;

  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <Gamepad2 size={20} />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>Đang cấu hình dịch vụ</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-mono font-normal">
                {selectedGames.length} tựa game đã chọn
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 mt-0.5">
              <span className="text-cyan-400">{currentGameDef.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {
                  customServices.filter(
                    (s) =>
                      (s.gameCode || 'LOL').toUpperCase() === activeGameCode &&
                      s.serviceType !== 'duo-boost' &&
                      s.slug !== 'duo-boost'
                  ).length
                }{' '}
                dịch vụ
              </span>
            </div>
          </div>
        </div>

        {/* Nút bấm mở Dropdown chọn nhanh Tựa Game */}
        <div className="relative" ref={gameSelectorRef}>
          <button
            type="button"
            onClick={() => setIsGameSelectorOpen(!isGameSelectorOpen)}
            className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
              isGameSelectorOpen
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 border-cyan-500/40 hover:border-cyan-400 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-black">Chọn tựa game:</span>
              <span className="text-zinc-200 max-w-[130px] sm:max-w-[180px] truncate font-extrabold">
                {currentGameDef.shortName || currentGameDef.name}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {selectedGames.length} game
            </span>
            <ChevronDown
              size={15}
              className={`text-zinc-400 transition-transform duration-200 ${
                isGameSelectorOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Popover Dropdown Chọn Nhanh Tựa Game */}
          {isGameSelectorOpen && (
            <>
              {/* Backdrop mờ trên mobile */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
                onClick={() => setIsGameSelectorOpen(false)}
              />
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-20 sm:top-full mt-2 w-auto sm:w-80 md:w-96 p-3 rounded-2xl bg-[#0b0f19] border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl max-w-sm sm:max-w-none mx-auto sm:mx-0">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Gamepad2 size={16} className="text-cyan-400" />
                    <span className="text-xs font-black text-white">
                      Chọn tựa game muốn cấu hình
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGameSelectorOpen(false)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Ô tìm kiếm nhanh nếu có từ 4 game trở lên */}
                {selectedGames.length > 3 && (
                  <div className="relative mb-2.5">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="text"
                      value={gameSearchQuery}
                      onChange={(e) => setGameSearchQuery(e.target.value)}
                      placeholder="Tìm nhanh tựa game..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                )}

                {/* Danh sách các tựa game dạng cuộn dọc gọn gàng */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-dark-scrollbar">
                  {selectedGames
                    .filter((gCode) => {
                      if (!gameSearchQuery.trim()) return true;
                      const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                      const q = gameSearchQuery.toLowerCase().trim();
                      return (
                        gCode.toLowerCase().includes(q) ||
                        (gObj?.name || '').toLowerCase().includes(q) ||
                        (gObj?.shortName || '').toLowerCase().includes(q)
                      );
                    })
                    .map((gCode) => {
                      const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
                      const isCurrentActive = activeGameCode === gCode;
                      const serviceCount = customServices.filter(
                        (s) =>
                          (s.gameCode || 'LOL').toUpperCase() === gCode &&
                          s.serviceType !== 'duo-boost' &&
                          s.slug !== 'duo-boost'
                      ).length;

                      return (
                        <button
                          key={gCode}
                          type="button"
                          onClick={() => {
                            setActiveGameCode(gCode);
                            setIsGameSelectorOpen(false);
                            setGameSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                            isCurrentActive
                              ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold shadow-sm'
                              : 'hover:bg-zinc-900/90 border border-transparent text-zinc-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isCurrentActive
                                  ? 'bg-cyan-500 text-black font-black text-xs'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              <Gamepad2 size={15} />
                            </div>
                            <div className="min-w-0 truncate">
                              <div className="text-xs font-bold truncate">
                                {gObj?.name || gCode}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {gObj?.shortName || gCode}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                serviceCount > 0
                                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {serviceCount} dịch vụ
                            </span>
                            {isCurrentActive && (
                              <Check size={16} className="text-cyan-400 shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Chips Bar */}
      <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded-2xl flex flex-wrap items-center gap-2">
        {selectedGames.map((gCode) => {
          const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
          const isActive = activeGameCode === gCode;
          const serviceCount = customServices.filter(
            (s) =>
              (s.gameCode || 'LOL').toUpperCase() === gCode &&
              s.serviceType !== 'duo-boost' &&
              s.slug !== 'duo-boost'
          ).length;

          return (
            <button
              key={gCode}
              type="button"
              onClick={() => setActiveGameCode(gCode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-300'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <span>{gObj?.shortName || gCode}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive
                    ? 'bg-black/20 text-black font-black'
                    : serviceCount > 0
                      ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {serviceCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
