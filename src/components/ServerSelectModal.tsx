'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, X, Check, Globe } from 'lucide-react';
import { GAME_SERVERS, GameServer } from '@/lib/servers';
import { cn } from '@/lib/utils';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServer?: string;
  onSelectServer: (serverCode: string) => void;
}

export default function ServerSelectModal({
  isOpen,
  onClose,
  selectedServer,
  onSelectServer,
}: ServerSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');

  const regions = useMemo(() => {
    const set = new Set<string>();
    GAME_SERVERS.forEach((s) => set.add(s.region));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredServers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return GAME_SERVERS.filter((s) => {
      const matchRegion = regionFilter === 'ALL' || s.region === regionFilter;
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q);
      return matchRegion && matchSearch;
    });
  }, [searchTerm, regionFilter]);

  const handleSelect = (code: string) => {
    onSelectServer(code);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'fixed z-[100] bg-zinc-950 border border-white/10 text-white shadow-2xl p-0 gap-0 overflow-hidden outline-none',
          'bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-3xl rounded-b-none max-h-[90vh]',
          'sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-xl sm:rounded-2xl sm:max-h-[85vh]'
        )}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Chọn Máy Chủ (Server)
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Hỗ trợ 16 máy chủ toàn cầu · Mặc định Vietnam (VN)
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 sm:px-5 py-3 border-b border-white/5 bg-zinc-900/50 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên máy chủ (Vietnam, Korea, NA...) hoặc mã VN, KR..."
              className="w-full bg-zinc-900 border border-white/10 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {regions.map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setRegionFilter(reg)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors border shrink-0',
                  regionFilter === reg
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/15'
                )}
              >
                {reg === 'ALL' ? 'Tất cả khu vực' : reg}
              </button>
            ))}
          </div>
        </div>

        {/* Server Grid */}
        <div className="overflow-y-auto p-3.5 sm:p-5 max-h-[50vh] space-y-2">
          {filteredServers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredServers.map((s) => {
                const isSelected = (selectedServer || '').toUpperCase() === s.code.toUpperCase();
                return (
                  <div
                    key={s.code}
                    onClick={() => handleSelect(s.code)}
                    className={cn(
                      'group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/80 shadow-md shadow-blue-500/10'
                        : 'bg-zinc-900/60 border-white/5 hover:border-blue-500/40 hover:bg-zinc-900'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <span className="text-2xl shrink-0 select-none">{s.flag}</span>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold text-sm truncate',
                              isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'
                            )}
                          >
                            {s.name}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                            {s.code}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 truncate mt-0.5">
                          {s.region}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/10 group-hover:border-blue-500/40 shrink-0 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-zinc-500">
              Không tìm thấy máy chủ phù hợp với từ khóa &quot;{searchTerm}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-900/80 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>{filteredServers.length} máy chủ sẵn sàng</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-300 hover:text-white font-medium"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
