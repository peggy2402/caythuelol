'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSearchHistory(storageKey: string, maxItems: number = 8) {
  const [history, setHistory] = useState<string[]>([]);

  // Đọc từ localStorage khi mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter((item) => typeof item === 'string' && item.trim().length > 0));
        }
      }
    } catch {}
  }, [storageKey]);

  // Lưu lịch sử tìm kiếm (chỉ lưu những gì Customer thực sự gõ/tìm)
  const addSearch = useCallback(
    (term: string) => {
      const clean = term.trim();
      if (!clean) return;

      setHistory((prev) => {
        // Loại bỏ trùng lặp không phân biệt hoa thường và đưa lên đầu
        const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, maxItems);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [storageKey, maxItems]
  );

  // Xóa 1 mục
  const removeSearch = useCallback(
    (term: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setHistory((prev) => {
        const updated = prev.filter((item) => item !== term);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [storageKey]
  );

  // Xóa tất cả
  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
  }, [storageKey]);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  };
}
