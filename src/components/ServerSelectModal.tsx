'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, X, Check, Globe, RotateCcw } from 'lucide-react';
import { GAME_SERVERS } from '@/lib/servers';
import ServerFlag from '@/components/ServerFlag';
import { cn } from '@/lib/utils';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServer?: string;
  onSelectServer: (serverCode: string) => void;
}

const normalizeText = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function ServerSelectModal({
  isOpen,
  onClose,
  selectedServer,
  onSelectServer,
}: ServerSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset bộ lọc khi mở modal & auto-focus ô tìm kiếm trên PC
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setRegionFilter('ALL');
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
          searchInputRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    GAME_SERVERS.forEach((s) => set.add(s.region));
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredServers = useMemo(() => {
    const q = normalizeText(searchTerm.trim());
    return GAME_SERVERS.filter((s) => {
      const matchRegion = regionFilter === 'ALL' || s.region === regionFilter;
      const matchSearch =
        !q ||
        normalizeText(s.name).includes(q) ||
        normalizeText(s.code).includes(q) ||
        normalizeText(s.region).includes(q) ||
        normalizeText(s.platformId || '').includes(q);
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
          // Ghi đè `grid` mặc định của DialogContent bằng `flex flex-col` để tránh tràn cắt mép phải
          'fixed z-[100] flex flex-col bg-[#0B0E14] border border-white/10 text-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-0 gap-0 overflow-hidden outline-none',
          // Mobile: Bottom Sheet trượt sát đáy
          'bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-3xl rounded-b-none h-[86dvh] max-h-[86dvh]',
          // PC / Tablet: Modal căn giữa cân đối
          'sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:rounded-2xl sm:h-[min(82vh,640px)] sm:max-h-[82vh]'
        )}
      >
        {/* Thanh kéo chỉ báo cho Mobile Bottom Sheet */}
        <div className="w-11 h-1 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. HEADER */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3.5 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#0E121B]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                Chọn Máy Chủ (Server)
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5 truncate">
                Hỗ trợ {GAME_SERVERS.length} máy chủ toàn cầu · Mặc định Vietnam (VN)
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 2. SEARCH & REGION FILTER CHIPS */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/5 bg-zinc-900/40 space-y-3">
          {/* Search Input */}
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên máy chủ (Vietnam, Korea, NA...) hoặc mã VN, KR..."
              className="w-full h-11 bg-zinc-950/90 border border-white/10 text-white rounded-xl pl-10 pr-12 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800/80 border border-white/10 text-[10px] font-mono text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                ESC
              </kbd>
            )}
          </div>

          {/* Region Chips: cuộn ngang mượt trên mobile, tự xuống dòng gọn gàng trên PC */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
            {regions.map((reg) => {
              const isActive = regionFilter === reg;
              return (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer active:scale-95',
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-zinc-900/90 border-white/10 text-zinc-400 hover:text-white hover:border-white/20 hover:bg-zinc-800/80'
                  )}
                >
                  {reg === 'ALL' ? 'Tất cả khu vực' : reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. SERVER LIST */}
        <div className="flex-1 min-h-0 w-full min-w-0 overflow-y-auto custom-dark-scrollbar px-4 py-3.5 sm:px-6 sm:py-4">
          {filteredServers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredServers.map((s) => {
                const isSelected = (selectedServer || '').toUpperCase() === s.code.toUpperCase();
                const isDefaultVN = s.code === 'VN';

                return (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => handleSelect(s.code)}
                    className={cn(
                      'group relative w-full min-w-0 flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.99]',
                      isSelected
                        ? 'bg-blue-500/12 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                        : 'bg-[#121622]/90 border-white/[0.07] hover:border-blue-500/40 hover:bg-[#161B2A]'
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Cờ quốc gia SVG sắc nét hiển thị chuẩn trên cả Windows, macOS & Mobile */}
                      <ServerFlag code={s.code} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              'font-bold text-sm truncate transition-colors',
                              isSelected ? 'text-blue-300' : 'text-white group-hover:text-blue-200'
                            )}
                          >
                            {s.name}
                          </span>
                          {isDefaultVN && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 shrink-0">
                              Phổ biến
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                          <span className="font-mono font-semibold text-zinc-300 shrink-0">
                            {s.code}
                          </span>
                          {s.platformId && (
                            <>
                              <span className="text-zinc-600">·</span>
                              <span className="font-mono text-[11px] text-zinc-400 shrink-0">
                                {s.platformId}
                              </span>
                            </>
                          )}
                          <span className="text-zinc-500 truncate">({s.region})</span>
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/40">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/15 group-hover:border-blue-400/50 shrink-0 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">
                  Không tìm thấy máy chủ phù hợp
                </p>
                <p className="text-xs text-zinc-500">
                  Không có kết quả cho &quot;{searchTerm}&quot;
                  {regionFilter !== 'ALL' ? ` tại khu vực ${regionFilter}` : ''}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRegionFilter('ALL');
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. FOOTER */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-3.5 bg-[#0E121B] border-t border-white/10 flex items-center justify-between gap-3 text-xs text-zinc-400">
          <span className="tabular-nums">
            Hiển thị <strong className="text-zinc-200 font-semibold">{filteredServers.length}</strong> / {GAME_SERVERS.length} máy chủ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
