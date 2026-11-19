'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, X, Check, Building2, Landmark, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

interface BankSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks: Bank[];
  selectedBankName?: string;
  onSelectBank: (bank: Bank) => void;
}

// Thứ tự ưu tiên các ngân hàng phổ biến tại Việt Nam
const POPULAR_BANK_CODES = [
  'VCB',
  'MB',
  'TCB',
  'BIDV',
  'ICB',
  'CTG',
  'ACB',
  'VPB',
  'TPB',
  'STB',
  'VIB',
  'HDB',
];

const normalizeText = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

export default function BankSelectModal({
  isOpen,
  onClose,
  banks,
  selectedBankName,
  onSelectBank,
}: BankSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset bộ lọc khi mở popup và auto-focus trên PC (tránh bật bàn phím ảo đột ngột trên mobile)
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
          searchInputRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lọc ngân hàng hỗ trợ tiếng Việt không dấu, tên đầy đủ, tên viết tắt và mã ngân hàng
  const filteredBanks = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return banks;

    const normalizedQ = normalizeText(q);
    return banks.filter((bank) => {
      const matchShort = normalizeText(bank.shortName).includes(normalizedQ);
      const matchName = normalizeText(bank.name).includes(normalizedQ);
      const matchCode = normalizeText(bank.code).includes(normalizedQ);
      return matchShort || matchName || matchCode;
    });
  }, [banks, searchQuery]);

  // Sắp xếp danh sách ngân hàng phổ biến theo thứ tự ưu tiên POPULAR_BANK_CODES
  const popularBanks = useMemo(() => {
    if (!banks.length) return [];
    const byCode = new Map(banks.map((b) => [(b.code || '').toUpperCase(), b]));
    const picked: Bank[] = [];
    for (const code of POPULAR_BANK_CODES) {
      const found = byCode.get(code);
      if (found && !picked.some((item) => item.id === found.id)) {
        picked.push(found);
      }
      if (picked.length >= 8) break;
    }
    return picked;
  }, [banks]);

  const isBankSelected = (bank: Bank) => {
    if (!selectedBankName) return false;
    const sel = selectedBankName.trim().toLowerCase();
    return (
      (bank.shortName || '').trim().toLowerCase() === sel ||
      (bank.code || '').trim().toLowerCase() === sel ||
      (bank.name || '').trim().toLowerCase() === sel
    );
  };

  const handleSelect = (bank: Bank) => {
    onSelectBank(bank);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Ghi đè `grid` mặc định của DialogContent bằng `flex flex-col` để tránh grid min-content làm tràn ngang
          'fixed z-[100] flex flex-col bg-[#0B0E14] border border-white/10 text-white shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-0 gap-0 overflow-hidden outline-none',
          // Mobile: Bottom Sheet trượt sát đáy, tối ưu ngón tay cái và màn hình nhỏ
          'bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-3xl rounded-b-none h-[88dvh] max-h-[88dvh]',
          // PC / Tablet: Modal căn giữa gọn gàng, không bao giờ cắt mép
          'sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:right-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-2xl sm:rounded-2xl sm:h-[min(84vh,680px)] sm:max-h-[84vh]'
        )}
      >
        {/* Thanh kéo chỉ báo cho Mobile Bottom Sheet */}
        <div className="w-11 h-1 bg-zinc-700/80 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. HEADER */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3.5 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#0E121B]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                Chọn ngân hàng thụ hưởng
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5 truncate">
                Hỗ trợ {banks.length || '50+'} ngân hàng tại Việt Nam liên kết VietQR
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng hộp thoại"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 2. SEARCH & POPULAR CHIPS */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/5 bg-zinc-900/40 space-y-3">
          {/* Search Input */}
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên ngân hàng hoặc mã (VCB, MB, TCB, ACB...)"
              className="w-full h-11 bg-zinc-950/90 border border-white/10 text-white rounded-xl pl-10 pr-10 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
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

          {/* Quick Select Popular Banks: cuộn ngang ẩn scrollbar trên mobile, tự xuống dòng gọn gàng trên PC */}
          {!searchQuery && popularBanks.length > 0 && (
            <div className="w-full min-w-0">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Ngân hàng phổ biến
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0">
                {popularBanks.map((bank) => {
                  const isSelected = isBankSelected(bank);
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => handleSelect(bank)}
                      className={cn(
                        'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95',
                        isSelected
                          ? 'bg-blue-500/15 border-blue-500/70 text-blue-300 shadow-sm shadow-blue-500/15'
                          : 'bg-zinc-900/90 border-white/10 text-zinc-300 hover:border-blue-500/40 hover:bg-zinc-800/80 hover:text-white'
                      )}
                    >
                      {bank.logo && (
                        <img
                          src={bank.logo}
                          alt={bank.code}
                          className="w-4 h-4 object-contain bg-white rounded-sm p-0.5 shrink-0"
                        />
                      )}
                      <span>{bank.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. BANK LIST (Scrollable middle area) */}
        <div className="flex-1 min-h-0 w-full min-w-0 overflow-y-auto custom-dark-scrollbar p-4 sm:px-6 sm:py-4">
          {filteredBanks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full min-w-0">
              {filteredBanks.map((bank) => {
                const isSelected = isBankSelected(bank);
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => handleSelect(bank)}
                    className={cn(
                      'group relative w-full min-w-0 text-left flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60',
                      isSelected
                        ? 'bg-blue-500/12 border-blue-500/70 shadow-md shadow-blue-500/10'
                        : 'bg-zinc-900/60 border-white/[0.07] hover:border-blue-500/40 hover:bg-zinc-900'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-black/10">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.code}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              'font-bold text-sm truncate',
                              isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'
                            )}
                          >
                            {bank.shortName}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-white/10 shrink-0">
                            {bank.code}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5" title={bank.name}>
                          {bank.name}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/40">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/15 group-hover:border-blue-400/60 shrink-0 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center py-8 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-500 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-200">
                  Không tìm thấy ngân hàng phù hợp
                </p>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Không có kết quả cho &ldquo;{searchQuery}&rdquo;. Hãy thử tìm bằng mã viết tắt như VCB, MB, TCB, ACB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Xóa từ khóa tìm kiếm
              </button>
            </div>
          )}
        </div>

        {/* 4. FOOTER */}
        <div className="w-full min-w-0 shrink-0 px-4 py-3 sm:px-6 bg-[#0E121B] border-t border-white/10 flex items-center justify-between gap-3 text-xs pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
          <span className="text-zinc-400">
            Hiển thị{' '}
            <strong className="text-white font-semibold">{filteredBanks.length}</strong>
            {searchQuery ? ` / ${banks.length}` : ''} ngân hàng
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
