'use client';

import React from 'react';
import { Clock, X, Trash2, Search, ArrowUpLeft } from 'lucide-react';

export function HighlightTextYellow({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <span>{text}</span>;

  try {
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span
              key={i}
              className="text-amber-300 font-extrabold bg-amber-400/20 px-0.5 rounded"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch {
    return <span>{text}</span>;
  }
}

export interface SearchSuggestionItem {
  label: string;
  subLabel?: string;
  category?: string;
}

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  history: string[];
  onSelect: (value: string) => void;
  onRemove: (value: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  liveSuggestions?: SearchSuggestionItem[];
  title?: string;
}

export default function SearchHistoryDropdown({
  isOpen,
  onClose,
  query,
  history,
  onSelect,
  onRemove,
  onClearAll,
  liveSuggestions = [],
  title = 'Tìm kiếm gần đây',
}: SearchHistoryDropdownProps) {
  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Lọc lịch sử theo query (nếu có)
  const filteredHistory = cleanQuery
    ? history.filter((item) => item.toLowerCase().includes(cleanQuery))
    : history;

  // Lọc gợi ý data hệ thống theo query (nếu có)
  const filteredSuggestions = cleanQuery
    ? liveSuggestions.filter(
        (item) =>
          item.label.toLowerCase().includes(cleanQuery) ||
          (item.subLabel && item.subLabel.toLowerCase().includes(cleanQuery))
      )
    : [];

  const hasHistory = filteredHistory.length > 0;
  const hasSuggestions = filteredSuggestions.length > 0;

  // Nếu không có cả lịch sử lẫn gợi ý
  if (!hasHistory && !hasSuggestions) {
    if (!cleanQuery) return null; // Không hiển thị nếu chưa gõ và lịch sử trống
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f1118]/95 border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl z-50 p-4 text-center text-xs text-zinc-500 animate-in fade-in zoom-in-95 duration-150"
      >
        <Search className="w-5 h-5 text-zinc-600 mx-auto mb-1.5 opacity-60" />
        <span>Không có kết quả nào khớp với &ldquo;{query}&rdquo;</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f1118]/95 border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Phần Gợi Ý Dữ Liệu Hệ Thống (Nếu đang gõ và có data khớp) */}
      {hasSuggestions && (
        <div className="border-b border-zinc-800/80">
          <div className="px-3.5 py-2 bg-zinc-950/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Gợi ý phù hợp</span>
            <span className="text-[10px] text-cyan-400 font-mono font-normal">
              {filteredSuggestions.length} kết quả
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto py-1 divide-y divide-zinc-800/30">
            {filteredSuggestions.slice(0, 5).map((sugg, idx) => (
              <div
                key={idx}
                onClick={() => onSelect(sugg.label)}
                className="px-3.5 py-2.5 hover:bg-zinc-800/70 flex items-center justify-between gap-3 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Search size={13} className="text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">
                      <HighlightTextYellow text={sugg.label} query={query} />
                    </div>
                    {sugg.subLabel && (
                      <div className="text-[10px] text-zinc-500 truncate">
                        <HighlightTextYellow text={sugg.subLabel} query={query} />
                      </div>
                    )}
                  </div>
                </div>
                {sugg.category && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-medium text-zinc-400 shrink-0">
                    {sugg.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Phần Lịch Sử Tìm Kiếm Gần Đây */}
      {hasHistory && (
        <div>
          <div className="px-3.5 py-2 bg-zinc-950/40 text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between border-b border-zinc-800/40">
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-blue-400" />
              {title}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] font-medium text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer lowercase"
            >
              <Trash2 size={10} />
              <span>xóa lịch sử</span>
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto py-1 divide-y divide-zinc-800/30">
            {filteredHistory.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelect(item)}
                className="px-3.5 py-2.5 hover:bg-zinc-800/60 flex items-center justify-between gap-2 cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock size={13} className="text-zinc-500 group-hover:text-zinc-400 shrink-0" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                    <HighlightTextYellow text={item} query={query} />
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => onRemove(item, e)}
                    className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Xóa mục này"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Ghi Chú */}
      <div className="px-3.5 py-1.5 bg-zinc-950/80 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
        <span>Gõ từ khóa để lọc • Nhấn để chọn</span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Đóng (ESC)
        </button>
      </div>
    </div>
  );
}
