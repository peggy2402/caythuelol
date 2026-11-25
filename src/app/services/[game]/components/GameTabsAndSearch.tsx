// src/app/services/[game]/components/GameTabsAndSearch.tsx
'use client';

import React from 'react';
import { Swords, Users, Search, X } from 'lucide-react';

interface GameTabsAndSearchProps {
  activeTab: 'SERVICES' | 'BOOSTERS';
  setActiveTab: (tab: 'SERVICES' | 'BOOSTERS') => void;
  servicesCount: number;
  boostersCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function GameTabsAndSearch({
  activeTab,
  setActiveTab,
  servicesCount,
  boostersCount,
  searchTerm,
  setSearchTerm,
}: GameTabsAndSearchProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-7">
      <div className="grid grid-cols-2 md:inline-flex p-1.5 bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg w-full md:w-auto">
        <button
          type="button"
          onClick={() => setActiveTab('SERVICES')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SERVICES'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Swords size={15} className="shrink-0" />
          <span className="truncate">Gói Dịch Vụ ({servicesCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('BOOSTERS')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 h-9 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'BOOSTERS'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={15} className="shrink-0" />
          <span className="truncate">Tuyển Thủ ({boostersCount})</span>
        </button>
      </div>

      {/* Search Box */}
      <div className="relative w-full md:w-80 lg:w-96">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder={
            activeTab === 'SERVICES'
              ? 'Tìm gói dịch vụ hoặc tuyển thủ...'
              : 'Tìm tuyển thủ theo tên...'
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 bg-zinc-900/90 border border-white/10 rounded-2xl pl-11 pr-10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-lg"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            aria-label="Xóa tìm kiếm"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
