'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import ChampionCard from './ChampionCard';
import ChampionFilters, { FilterState } from './ChampionFilters';

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
  champions: any[];
  onSelect: (champion: any) => void;
  selectedId?: string;
}

export default function ChampionModal({ isOpen, onClose, champions, onSelect, selectedId }: ChampionModalProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [tempSelected, setTempSelected] = useState<any>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    roles: [],
    difficulty: [],
    attackType: [],
    resource: []
  });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTempSelected(champions.find(c => c.id === selectedId) || null);
      setShowMobileFilters(false);
    }
  }, [isOpen, selectedId, champions]);

  // Filter Logic
  const filteredChampions = useMemo(() => {
    return champions.filter(champ => {
      // 1. Search
      if (search && !champ.name.toLowerCase().includes(search.toLowerCase())) return false;

      // 2. Roles
      if (filters.roles.length > 0) {
        const hasRole = filters.roles.some(r => champ.tags.includes(r));
        if (!hasRole) return false;
      }

      // 3. Difficulty
      if (filters.difficulty.length > 0) {
        const diff = champ.info.difficulty;
        const isEasy = filters.difficulty.includes('Easy') && diff <= 3;
        const isMedium = filters.difficulty.includes('Medium') && diff >= 4 && diff <= 6;
        const isHard = filters.difficulty.includes('Hard') && diff >= 7;
        if (!isEasy && !isMedium && !isHard) return false;
      }

      // 4. Attack Type
      if (filters.attackType.length > 0) {
        const isAD = filters.attackType.includes('AD') && champ.info.attack >= 6;
        const isAP = filters.attackType.includes('AP') && champ.info.magic >= 6;
        const isHybrid = filters.attackType.includes('Hybrid') && champ.info.attack >= 4 && champ.info.magic >= 4;
        if (!isAD && !isAP && !isHybrid) return false;
      }

      // 5. Resource
      if (filters.resource.length > 0) {
        const pType = champ.partype || '';
        const isMana = filters.resource.includes('Mana') && pType.includes('Mana');
        const isEnergy = filters.resource.includes('Energy') && pType.includes('Energy');
        const isNoRes = filters.resource.includes('No Resource') && (pType === 'None' || pType === '');
        if (!isMana && !isEnergy && !isNoRes) return false;
      }

      return true;
    });
  }, [champions, search, filters]);

  const handleConfirm = () => {
    if (tempSelected) {
      onSelect(tempSelected);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder={t('searchChamp')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`md:hidden p-2.5 rounded-lg border ${showMobileFilters ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <button onClick={onClose} className="ml-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Filters (Desktop) */}
          <div className="hidden md:block w-64 border-r border-white/10 bg-zinc-900/30 p-5 overflow-y-auto">
            <ChampionFilters 
              filters={filters} 
              setFilters={setFilters} 
              onReset={() => setFilters({ roles: [], difficulty: [], attackType: [], resource: [] })} 
            />
          </div>

          {/* Mobile Filters Overlay */}
          {showMobileFilters && (
            <div className="absolute inset-0 z-20 bg-zinc-950 md:hidden p-5 overflow-y-auto animate-in slide-in-from-left-10">
              <ChampionFilters 
                filters={filters} 
                setFilters={setFilters} 
                onReset={() => setFilters({ roles: [], difficulty: [], attackType: [], resource: [] })} 
              />
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5 bg-zinc-950 custom-scrollbar">
            {champions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : filteredChampions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
                <p>Không tìm thấy tướng phù hợp</p>
                <button 
                  onClick={() => { setSearch(''); setFilters({ roles: [], difficulty: [], attackType: [], resource: [] }); }}
                  className="mt-4 text-blue-400 hover:underline text-sm"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {filteredChampions.map((champ) => (
                  <ChampionCard
                    key={champ.id}
                    champion={champ}
                    isSelected={tempSelected?.id === champ.id}
                    onClick={() => setTempSelected(champ)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tempSelected ? (
              <>
                <div className="w-10 h-10 rounded-full border border-blue-500 overflow-hidden relative">
                  <img src={tempSelected.imageUrl} alt="" className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{tempSelected.name}</p>
                  <p className="text-[10px] text-zinc-400">{tempSelected.tags.join(', ')}</p>
                </div>
              </>
            ) : (
              <span className="text-sm text-zinc-500 italic">Chưa chọn tướng nào</span>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!tempSelected}
              className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all ${
                tempSelected 
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {t('confirmSelection')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
