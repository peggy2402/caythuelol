'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    confirmButton: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30',
    defaultIcon: <AlertTriangle className="w-6 h-6" />,
  },
  warning: {
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    confirmButton: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/20 font-extrabold',
    defaultIcon: <AlertCircle className="w-6 h-6" />,
  },
  info: {
    iconBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    confirmButton: 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20 font-bold',
    defaultIcon: <Info className="w-6 h-6" />,
  },
  success: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    confirmButton: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 font-bold',
    defaultIcon: <CheckCircle2 className="w-6 h-6" />,
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'warning',
  icon,
  children,
  isLoading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!mounted || !isOpen) return null;

  const currentVariant = VARIANT_CONFIG[variant];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className={`p-3 rounded-2xl border shrink-0 ${currentVariant.iconBg}`}>
            {icon || currentVariant.defaultIcon}
          </div>
          <div>
            <h4 className="font-extrabold text-white text-base leading-snug">{title}</h4>
            {description && (
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {children && <div className="space-y-3">{children}</div>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${currentVariant.confirmButton}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
