/*
 * From Uiverse.io by satyamchaudharydev - https://uiverse.io/satyamchaudharydev/red-cow-21
 * MIT License, Copyright (c) satyamchaudharydev (satyam)
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BarLoaderProps {
  /** Optional caption shown underneath the loader bar */
  label?: string;
  /** Full-viewport centered wrapper (for top-level routes / Suspense fallbacks) */
  fullScreen?: boolean;
  /** Extra classes for the outer container */
  className?: string;
  /** Extra classes for the loader bar itself */
  barClassName?: string;
}

export function BarLoader({
  label,
  fullScreen = false,
  className,
  barClassName,
}: BarLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Đang tải'}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen w-full bg-zinc-950 text-zinc-400' : 'w-full py-16',
        className
      )}
    >
      <div className={cn('uiverse-bar-loader', barClassName)} />
      {label && (
        <span className="text-xs font-medium text-zinc-400 tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}

export default BarLoader;
