'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, X, Check, Building2, Landmark } from 'lucide-react';
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

// Danh sách các ngân hàng phổ biến tại Việt Nam
const POPULAR_BANK_CODES = [
  'MB',
  'VCB',
  'TCB',
  'ACB',
  'VPB',
  'TPB',
  'CTG',
  'BIDV',
  'STB',
  'VIB',
  'HDB',
  'MSB',
];

export default function BankSelectModal({
  isOpen,
  onClose,
  banks,
  selectedBankName,
  onSelectBank,
}: BankSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus ô tìm kiếm khi mở popup trên màn hình desktop
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

  // Lọc danh sách ngân hàng theo từ khóa tìm kiếm (hỗ trợ tiếng Việt không dấu)
  const filteredBanks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return banks;

    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const normalizedQ = normalize(q);

    return banks.filter((bank) => {
      const matchShort = normalize(bank.shortName || '').includes(normalizedQ);
      const matchName = normalize(bank.name || '').includes(normalizedQ);
      const matchCode = (bank.code || '').toLowerCase().includes(q);
      return matchShort || matchName || matchCode;
    });
  }, [banks, searchQuery]);

  // Danh sách ngân hàng phổ biến
  const popularBanks = useMemo(() => {
    if (!banks.length) return [];
    return banks.filter((b) => POPULAR_BANK_CODES.includes(b.code));
  }, [banks]);

  const handleSelect = (bank: Bank) => {
    onSelectBank(bank);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'fixed z-[100] bg-zinc-950 border border-white/10 text-white shadow-2xl p-0 gap-0 overflow-hidden outline-none',
          // Mobile: Bottom Sheet hiện đại
          'bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 w-full max-w-full rounded-t-3xl rounded-b-none max-h-[90vh]',
          // Desktop: Popup modal đặt giữa màn hình
          'sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-2xl sm:rounded-2xl sm:max-h-[85vh]'
        )}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                Chọn ngân hàng thụ hưởng
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Hỗ trợ 50+ ngân hàng tại Việt Nam liên kết qua VietQR
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
        <div className="p-4 sm:px-6 py-3 border-b border-white/5 bg-zinc-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ngân hàng, mã viết tắt (MB, VCB, ACB, TPB...)"
              className="w-full bg-zinc-900 border border-white/10 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Select Popular Banks */}
          {!searchQuery && popularBanks.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Ngân hàng phổ biến
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {popularBanks.slice(0, 8).map((bank) => {
                  const isSelected = selectedBankName === bank.shortName;
                  return (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => handleSelect(bank)}
                      className={cn(
                        'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/10'
                          : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20 hover:text-white'
                      )}
                    >
                      {bank.logo && (
                        <img
                          src={bank.logo}
                          alt={bank.code}
                          className="w-4 h-4 object-contain bg-white rounded p-0.5"
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

        {/* Bank List */}
        <div className="overflow-y-auto p-4 sm:p-6 max-h-[50vh] sm:max-h-[52vh] space-y-2">
          {filteredBanks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBanks.map((bank) => {
                const isSelected = selectedBankName === bank.shortName;
                return (
                  <div
                    key={bank.id}
                    onClick={() => handleSelect(bank)}
                    className={cn(
                      'group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/80 shadow-md shadow-blue-500/10'
                        : 'bg-zinc-900/60 border-white/5 hover:border-blue-500/40 hover:bg-zinc-900'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-11 h-11 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-black/5">
                        {bank.logo ? (
                          <img
                            src={bank.logo}
                            alt={bank.code}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold text-sm truncate',
                              isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'
                            )}
                          >
                            {bank.shortName}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                            {bank.code}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 truncate mt-0.5">
                          {bank.name}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-white/10 group-hover:border-blue-500/40 shrink-0 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-zinc-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-zinc-300">
                Không tìm thấy ngân hàng phù hợp
              </div>
              <div className="text-xs text-zinc-500 max-w-xs mx-auto">
                Không có kết quả nào cho từ khóa &quot;{searchQuery}&quot;. Vui lòng thử tìm với mã viết tắt (VCB, MB, ACB,...)
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-900/80 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>Tổng số: {filteredBanks.length} ngân hàng</span>
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
