// src/app/(dashboard)/booster/services/components/FloatingSaveButton.tsx
'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';

interface FloatingSaveButtonProps {
  saving: boolean;
  onSave: () => void;
}

export const FloatingSaveButton: React.FC<FloatingSaveButtonProps> = ({ saving, onSave }) => {
  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-cyan-500/40 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
        title="Lưu toàn bộ cấu hình dịch vụ & bảng giá"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin text-white" />
        ) : (
          <Save size={16} className="text-white drop-shadow" />
        )}
        <span className="drop-shadow-sm font-black tracking-wide">
          {saving ? 'Đang lưu...' : 'Lưu toàn bộ thay đổi'}
        </span>
      </button>
    </div>
  );
};
