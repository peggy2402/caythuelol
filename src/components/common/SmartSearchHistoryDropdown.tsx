'use client';

import React, { useState } from 'react';
import { Clock, Star, X, Trash2, Shield, Search } from 'lucide-react';

export interface SearchHistoryItem {
  id: string;
  riotId: string;
  server?: string;
  tier?: string;
  rank?: string;
  isFavorite?: boolean;
  timestamp?: number;
}

export function HighlightText({ text, query }: { text: string; query: string }) {
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
              className="text-amber-400 font-black bg-amber-400/20 px-0.5 py-0.2 rounded text-shadow-sm"
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

interface SmartSearchHistoryDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  recentItems: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export default function SmartSearchHistoryDropdown({
  isOpen,
  onClose,
  query,
  recentItems,
  onSelect,
  onRemove,
  onToggleFavorite,
  onClearAll,
}: SmartSearchHistoryDropdownProps) {
  const [activeTab, setActiveTab] = useState<'RECENT' | 'FAVORITE'>('RECENT');

  if (!isOpen) return null;

  // Lọc theo Tab (Gần đây hoặc Yêu thích)
  const baseItems = activeTab === 'FAVORITE'
    ? recentItems.filter((item) => item.isFavorite)
    : recentItems;

  // Tìm kiếm tức thì theo query nếu đang gõ
  const filteredItems = query.trim()
    ? baseItems.filter((item) =>
        item.riotId.toLowerCase().includes(query.trim().toLowerCase())
      )
    : baseItems;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 right-0 mt-1.5 bg-[#0f1118]/95 border border-zinc-800 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top Banner Thông Báo (OP.GG Style) */}
      <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <span className="px-1.5 py-0.5 rounded bg-blue-500 text-white font-extrabold text-[10px]">
            RIOT ID
          </span>
          <span className="text-[11px] text-zinc-300">
            Tìm nhanh bằng cú pháp <strong className="text-white">Tên Ingame + #Tagline</strong>
          </span>
        </div>
      </div>

      {/* Tabs Chuyển Đổi: Gần Đây / Yêu Thích */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 bg-zinc-950/40">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('RECENT')}
            className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'RECENT'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock size={13} />
            <span>Tìm kiếm Gần đây</span>
            {recentItems.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                {recentItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FAVORITE')}
            className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'FAVORITE'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Star size={13} className={activeTab === 'FAVORITE' ? 'text-amber-400 fill-amber-400' : ''} />
            <span>Yêu thích</span>
          </button>
        </div>

        {recentItems.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 size={11} />
            <span>Xóa tất cả</span>
          </button>
        )}
      </div>

      {/* Danh Sách Mục Lịch Sử */}
      <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/40 py-1">
        {filteredItems.length === 0 ? (
          <div className="py-7 px-4 text-center">
            <Search className="w-6 h-6 text-zinc-600 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-zinc-400">
              {query.trim()
                ? `Không tìm thấy tài khoản nào khớp với "${query}"`
                : activeTab === 'FAVORITE'
                ? 'Chưa có tài khoản yêu thích nào được lưu.'
                : 'Chưa có lịch sử tìm kiếm gần đây.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="px-3.5 py-2.5 hover:bg-zinc-800/60 flex items-center justify-between gap-3 cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Region Badge (VN / KR / NA...) */}
                <span className="w-6 h-5 rounded bg-blue-600/80 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0 shadow-sm">
                  {item.server || 'VN'}
                </span>

                {/* Tên Riot ID với highlight từ khóa */}
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors truncate">
                  <HighlightText text={item.riotId} query={query} />
                </div>
              </div>

              {/* Nút Sao Yêu Thích & Nút Xóa */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(item.id, e)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    item.isFavorite
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-zinc-600 hover:text-zinc-300'
                  }`}
                  title={item.isFavorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}
                >
                  <Star size={13} className={item.isFavorite ? 'fill-amber-400' : ''} />
                </button>

                <button
                  type="button"
                  onClick={(e) => onRemove(item.id, e)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Xóa khỏi lịch sử"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Ghi Chú Tinh Tế */}
      <div className="px-3 py-2 bg-zinc-950/70 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
        <span>💡 Bấm vào tài khoản để điền và tự động đồng bộ rank</span>
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
