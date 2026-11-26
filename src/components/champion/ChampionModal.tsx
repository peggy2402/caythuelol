'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, SlidersHorizontal, Loader2, AlertCircle, Check, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';
import ChampionCard, { ChampionTooltip } from './ChampionCard';
import ChampionFilters, { FilterState } from './ChampionFilters';

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
  champions: any[];
  onSelect?: (champion: any) => void;
  selectedId?: string;
  // Hỗ trợ chế độ chọn nhiều tướng
  multiSelect?: boolean;
  maxSelect?: number;
  selectedIds?: string[];
  onSelectMultiple?: (champions: any[]) => void;
  title?: string;
  boosterChampions?: string[];
}

export default function ChampionModal({
  isOpen,
  onClose,
  champions,
  onSelect,
  selectedId,
  multiSelect = false,
  maxSelect = 3,
  selectedIds = [],
  onSelectMultiple,
  title,
  boosterChampions = [],
}: ChampionModalProps) {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const [hoveredData, setHoveredData] = useState<{ champion: any; rect: DOMRect } | null>(null);
  const [search, setSearch] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [onlyBoosterFavs, setOnlyBoosterFavs] = useState(false);
  const [tempSelected, setTempSelected] = useState<any>(null);
  const [tempSelectedList, setTempSelectedList] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({
    roles: [],
    difficulty: [],
    attackType: [],
    resource: []
  });

  // Calculate dynamic floating tooltip position inside modal (escapes scroll container & never gets clipped)
  const tooltipStyle = useMemo(() => {
    if (!hoveredData || !modalRef.current) return null;
    const modalRect = modalRef.current.getBoundingClientRect();
    const cardRect = hoveredData.rect;

    const tooltipWidth = 256; // w-64
    const tooltipHeight = 125;

    // Centered on card, relative to modal container
    const cardCenterX = cardRect.left + cardRect.width / 2 - modalRect.left;
    let posX = cardCenterX - tooltipWidth / 2;

    // Clamp horizontally inside modal with safe margins
    const minX = 16;
    const maxX = modalRect.width - tooltipWidth - 16;
    if (posX < minX) posX = minX;
    if (posX > maxX) posX = maxX;

    const cardTopInModal = cardRect.top - modalRect.top;
    let posY: number;

    // Check vertical positioning
    // If enough space above the card (above header ~68px)
    if (cardTopInModal - tooltipHeight - 10 >= 68) {
      posY = cardTopInModal - tooltipHeight - 8;
    } else {
      // Show below the card
      posY = cardTopInModal + cardRect.height + 8;
    }

    return {
      left: `${posX}px`,
      top: `${posY}px`,
    };
  }, [hoveredData]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setHoveredData(null);
      setSearch('');
      setShowMobileFilters(false);
      setOnlyBoosterFavs(false);

      if (multiSelect) {
        const initialList = champions.filter((c) =>
          selectedIds.some((id) => id?.toLowerCase() === c.id?.toLowerCase() || id?.toLowerCase() === c.name?.toLowerCase())
        );
        setTempSelectedList(initialList);
      } else {
        setTempSelected(champions.find((c) => c.id === selectedId || c.name === selectedId) || null);
      }
    }
  }, [isOpen, selectedId, selectedIds, champions, multiSelect]);

  // Click chọn tướng
  const handleChampionClick = (champ: any) => {
    if (!multiSelect) {
      setTempSelected(champ);
      return;
    }

    const exists = tempSelectedList.some((c) => c.id === champ.id);
    if (exists) {
      setTempSelectedList((prev) => prev.filter((c) => c.id !== champ.id));
    } else {
      if (tempSelectedList.length >= maxSelect) {
        toast.warning(`Bạn chỉ được chọn tối đa ${maxSelect} tướng ưu tiên!`);
        return;
      }
      setTempSelectedList((prev) => [...prev, champ]);
    }
  };

  const handleRemoveFromList = (champId: string) => {
    setTempSelectedList((prev) => prev.filter((c) => c.id !== champId));
  };

  // Filter Logic
  const filteredChampions = useMemo(() => {
    return champions.filter(champ => {
      if (search && !champ.name.toLowerCase().includes(search.toLowerCase()) && !champ.title?.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Nếu bật lọc chỉ xem tướng tủ của booster
      if (onlyBoosterFavs && boosterChampions.length > 0) {
        const isFav = boosterChampions.some(
          (b) => b.toLowerCase() === champ.id?.toLowerCase() || b.toLowerCase() === champ.name?.toLowerCase()
        );
        if (!isFav) return false;
      }

      if (filters.roles.length > 0 && !filters.roles.some(r => champ.tags.includes(r))) return false;
      
      if (filters.difficulty.length > 0) {
        const diff = champ.info.difficulty;
        const isEasy = filters.difficulty.includes('Easy') && diff <= 3;
        const isMedium = filters.difficulty.includes('Medium') && diff >= 4 && diff <= 6;
        const isHard = filters.difficulty.includes('Hard') && diff >= 7;
        if (!isEasy && !isMedium && !isHard) return false;
      }

      if (filters.attackType.length > 0) {
        const isAD = filters.attackType.includes('AD') && champ.info.attack >= 6;
        const isAP = filters.attackType.includes('AP') && champ.info.magic >= 6;
        const isHybrid = filters.attackType.includes('Hybrid') && champ.info.attack >= 4 && champ.info.magic >= 4;
        if (!isAD && !isAP && !isHybrid) return false;
      }

      if (filters.resource.length > 0) {
        const pType = champ.partype || '';
        const isMana = filters.resource.includes('Mana') && pType.includes('Mana');
        const isEnergy = filters.resource.includes('Energy') && pType.includes('Energy');
        const isNoRes = filters.resource.includes('No Resource') && (pType === 'None' || pType === '');
        if (!isMana && !isEnergy && !isNoRes) return false;
      }

      return true;
    });
  }, [champions, search, filters, onlyBoosterFavs, boosterChampions]);

  const handleConfirm = () => {
    if (multiSelect) {
      if (onSelectMultiple) {
        onSelectMultiple(tempSelectedList);
      }
      onClose();
    } else {
      if (tempSelected && onSelect) {
        onSelect(tempSelected);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div 
        ref={modalRef}
        className="relative w-full max-w-5xl h-[88vh] bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={title ? `Tìm kiếm tướng...` : t('searchChamp')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none placeholder:text-zinc-500"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nút lọc nhanh tướng tủ của Booster nếu có */}
            {boosterChampions.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlyBoosterFavs(!onlyBoosterFavs)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  onlyBoosterFavs
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
                }`}
              >
                <Star size={13} className={onlyBoosterFavs ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />
                <span>Tướng tủ Booster ({boosterChampions.length})</span>
              </button>
            )}
            
            <button 
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`md:hidden p-2.5 rounded-xl border transition-colors ${showMobileFilters ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar Filters (Desktop) */}
          <div className="hidden md:block w-60 border-r border-white/10 bg-zinc-900/40 p-4 overflow-y-auto custom-scrollbar shrink-0">
            <ChampionFilters 
              filters={filters} 
              setFilters={setFilters} 
              onReset={() => setFilters({ roles: [], difficulty: [], attackType: [], resource: [] })} 
            />
          </div>

          {/* Mobile Filters Overlay */}
          {showMobileFilters && (
            <div className="absolute inset-0 z-20 bg-zinc-950 md:hidden flex flex-col animate-in slide-in-from-bottom-10">
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Bộ lọc tướng</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 text-zinc-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {boosterChampions.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setOnlyBoosterFavs(!onlyBoosterFavs)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 ${
                        onlyBoosterFavs ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      <Star size={14} className="text-amber-400" />
                      <span>Chỉ xem tướng tủ Booster ({boosterChampions.length})</span>
                    </button>
                  </div>
                )}
                <ChampionFilters 
                  filters={filters} 
                  setFilters={setFilters} 
                  onReset={() => setFilters({ roles: [], difficulty: [], attackType: [], resource: [] })} 
                />
              </div>
              <div className="p-4 border-t border-white/10 bg-zinc-900">
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Áp dụng bộ lọc
                </button>
              </div>
            </div>
          )}

          {/* Grid Champions */}
          <div 
            onScroll={() => setHoveredData(null)}
            onMouseLeave={() => setHoveredData(null)}
            className="flex-1 overflow-y-auto p-4 sm:p-5 bg-zinc-950 custom-scrollbar"
          >
            {champions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <span className="text-xs">Đang tải danh sách tướng Riot Games...</span>
              </div>
            ) : filteredChampions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                <AlertCircle className="w-12 h-12 mb-3 opacity-40 text-cyan-400" />
                <p className="text-sm font-semibold">Không tìm thấy tướng phù hợp với bộ lọc</p>
                <button 
                  onClick={() => { setSearch(''); setOnlyBoosterFavs(false); setFilters({ roles: [], difficulty: [], attackType: [], resource: [] }); }}
                  className="mt-3 text-cyan-400 hover:underline text-xs font-bold cursor-pointer"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-3.5">
                {filteredChampions.map((champ) => {
                  const isSelectedInMulti = tempSelectedList.some((c) => c.id === champ.id);
                  const isSelectedInSingle = tempSelected?.id === champ.id;
                  const isSelected = multiSelect ? isSelectedInMulti : isSelectedInSingle;
                  
                  const selectionOrder = multiSelect
                    ? tempSelectedList.findIndex((c) => c.id === champ.id) + 1
                    : undefined;

                  const isBoosterFav = boosterChampions.some(
                    (b) => b.toLowerCase() === champ.id?.toLowerCase() || b.toLowerCase() === champ.name?.toLowerCase()
                  );

                  return (
                    <ChampionCard
                      key={champ.id}
                      champion={champ}
                      isSelected={isSelected}
                      selectionOrder={selectionOrder !== undefined && selectionOrder > 0 ? selectionOrder : undefined}
                      isBoosterFavorite={isBoosterFav}
                      onClick={() => handleChampionClick(champ)}
                      onHover={(c, rect) => setHoveredData({ champion: c, rect })}
                      onLeave={() => setHoveredData(null)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Champion Tooltip (Always within modal bounds, never clipped) */}
        {hoveredData && tooltipStyle && (
          <ChampionTooltip 
            champion={hoveredData.champion} 
            style={tooltipStyle} 
          />
        )}

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full w-full sm:w-auto py-1">
            {multiSelect ? (
              tempSelectedList.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-300 mr-1">
                    Đã chọn ({tempSelectedList.length}/{maxSelect}):
                  </span>
                  {tempSelectedList.map((champ, idx) => (
                    <div
                      key={champ.id}
                      className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs shadow-sm"
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-cyan-400/50">
                        <img src={champ.imageUrl} alt={champ.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-[11px]">{champ.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromList(champ.id);
                        }}
                        className="text-zinc-400 hover:text-white rounded-full p-0.5 transition-colors cursor-pointer"
                        title="Bỏ chọn"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic">
                  Chưa chọn tướng nào (Chọn tối đa {maxSelect} tướng ưu tiên)
                </span>
              )
            ) : tempSelected ? (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full border-2 border-cyan-400 overflow-hidden relative shadow-md">
                  <img src={tempSelected.imageUrl} alt="" className="object-cover w-full h-full" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{tempSelected.name}</p>
                  <p className="text-[10px] text-zinc-400">{tempSelected.tags.join(', ')}</p>
                </div>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 italic">Chưa chọn tướng nào</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={handleConfirm}
              disabled={multiSelect ? tempSelectedList.length === 0 : !tempSelected}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer ${
                (multiSelect ? tempSelectedList.length > 0 : tempSelected)
                  ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20 active:scale-95' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              {multiSelect
                ? `Xác nhận (${tempSelectedList.length} tướng)`
                : t('confirmSelection')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
