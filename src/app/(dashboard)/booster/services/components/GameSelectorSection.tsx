// src/app/(dashboard)/booster/services/components/GameSelectorSection.tsx
'use client';

import React from 'react';
import { Gamepad2, ChevronDown, Search, CheckCircle2 } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games';
import { ICON_MAP } from './servicesTypes';

interface GameSelectorSectionProps {
  selectedGames: string[];
  isSection1Collapsed: boolean;
  setIsSection1Collapsed: (val: boolean) => void;
  section1Search: string;
  setSection1Search: (val: string) => void;
  onToggleGame: (gameId: string) => void;
}

export const GameSelectorSection: React.FC<GameSelectorSectionProps> = ({
  selectedGames,
  isSection1Collapsed,
  setIsSection1Collapsed,
  section1Search,
  setSection1Search,
  onToggleGame,
}) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Gamepad2 size={20} className="text-cyan-400" />
            <span>1. Tựa game bạn có thể cày</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bật các game bạn nhận đơn. Khách hàng sẽ thấy bạn trong danh sách Booster của tựa game đó.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-zinc-400 font-semibold bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
            Đã chọn: <b className="text-cyan-400">{selectedGames.length}</b> game
          </span>
          <button
            type="button"
            onClick={() => setIsSection1Collapsed(!isSection1Collapsed)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 transition-all cursor-pointer active:scale-95"
          >
            <span>{isSection1Collapsed ? 'Mở rộng' : 'Thu gọn'}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isSection1Collapsed ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>

      {/* Chế độ thu gọn: Chỉ hiển thị các game đã chọn dạng chips gọn gàng */}
      {isSection1Collapsed ? (
        <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Danh sách game đang nhận cày:</span>
            <button
              type="button"
              onClick={() => setIsSection1Collapsed(false)}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              + Chọn thêm game
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
            {selectedGames.map((gCode) => {
              const gObj = GAMES_CATALOG.find((g) => g.id.toUpperCase() === gCode);
              return (
                <span
                  key={gCode}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono"
                >
                  <Gamepad2 size={13} className="text-cyan-400" />
                  <span>{gObj?.name || gCode}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        /* Chế độ mở rộng: Có ô tìm kiếm và khung cuộn gọn gàng trên mobile */
        <div className="space-y-2.5">
          {GAMES_CATALOG.length > 8 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={section1Search}
                onChange={(e) => setSection1Search(e.target.value)}
                placeholder="Tìm nhanh tựa game trong 20+ game..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 max-h-[320px] sm:max-h-none overflow-y-auto pr-1 custom-dark-scrollbar">
            {GAMES_CATALOG.filter((game) => {
              if (!section1Search.trim()) return true;
              const q = section1Search.toLowerCase().trim();
              return (
                game.name.toLowerCase().includes(q) ||
                game.shortName.toLowerCase().includes(q) ||
                game.id.toLowerCase().includes(q)
              );
            }).map((game) => {
              const isSelected = selectedGames.includes(game.id.toUpperCase());
              const GameIcon = ICON_MAP[game.iconName] || Gamepad2;

              return (
                <div
                  key={game.id}
                  onClick={() => onToggleGame(game.id)}
                  className={`p-2.5 sm:p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-[0_0_15px_rgba(6,182,212,0.12)]'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-xl border shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <GameIcon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{game.name}</div>
                      <div className="text-[10px] text-zinc-500">{game.shortName}</div>
                    </div>
                  </div>

                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ml-1.5 ${
                      isSelected ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isSelected && <CheckCircle2 size={11} className="stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
