// src/app/services/[game]/components/GameTabsAndSearch.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Swords, Users, Search, X } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import SearchHistoryDropdown from '@/components/common/SearchHistoryDropdown';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageKey = activeTab === 'SERVICES' ? 'recent_services_search' : 'recent_boosters_search';
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory(storageKey);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    setSearchTerm(val);
    addSearch(val);
    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      addSearch(searchTerm.trim());
      setIsDropdownOpen(false);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

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
      <div ref={containerRef} className="relative w-full md:w-80 lg:w-96 z-30">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder={
            activeTab === 'SERVICES'
              ? 'Tìm gói dịch vụ hoặc tuyển thủ...'
              : 'Tìm tuyển thủ theo tên...'
          }
          value={searchTerm}
          onFocus={() => setIsDropdownOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
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

        {/* Dropdown Lịch Sử Tìm Kiếm */}
        <SearchHistoryDropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          query={searchTerm}
          history={history}
          onSelect={handleSelect}
          onRemove={removeSearch}
          onClearAll={clearHistory}
          title={activeTab === 'SERVICES' ? 'Gói dịch vụ tìm gần đây' : 'Tuyển thủ tìm gần đây'}
        />
      </div>
    </div>
  );
}

