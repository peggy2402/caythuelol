'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  src,
  alt = 'Preview image',
  title,
  subtitle,
  onClose,
}: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 1280, h: 800 });

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const backdropOpacity = useTransform(dragY, [-240, 0, 240], [0.25, 1, 0.25]);
  const dragScale = useTransform(dragY, [-240, 0, 240], [0.85, 1, 0.85]);

  useEffect(() => {
    setMounted(true);
    const updateViewport = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Reset zoom, drag position & natural size when src/open changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      dragX.set(0);
      dragY.set(0);
    } else {
      setNaturalSize(null);
    }
  }, [isOpen, src, dragX, dragY]);

  // Re-center image whenever zoom returns to 1x
  useEffect(() => {
    if (zoom === 1) {
      dragX.set(0);
      dragY.set(0);
    }
  }, [zoom, dragX, dragY]);

  // Smart display dimensions: big & comfortable to read while avoiding blurry over-stretching
  const displayMetrics = React.useMemo(() => {
    if (!naturalSize || naturalSize.w <= 0 || naturalSize.h <= 0) {
      return { width: undefined, height: undefined, isLowRes: false };
    }
    const { w: natW, h: natH } = naturalSize;
    const maxW = Math.max(240, viewport.w * 0.88);
    const maxH = Math.max(240, viewport.h * 0.78);
    const fitScale = Math.min(maxW / natW, maxH / natH);
    const longestSide = Math.max(natW, natH);

    // Ảnh nhỏ / độ phân giải thấp: phóng vừa đủ dễ nhìn (tối đa 420px cạnh dài) để tránh bị vỡ nét
    if (longestSide < 400) {
      const targetLongest = Math.min(420, Math.max(longestSide * 2.5, 280));
      const scale = Math.min(fitScale, targetLongest / longestSide);
      return {
        width: Math.round(natW * scale),
        height: Math.round(natH * scale),
        isLowRes: longestSide < 240,
      };
    }

    // Ảnh chụp màn hình chuẩn: hiển thị lớn tối đa trong khung, giới hạn upscale <= 1.5x để luôn sắc nét
    const scale = Math.min(fitScale, 1.5);
    return {
      width: Math.round(natW * scale),
      height: Math.round(natH * scale),
      isLowRes: false,
    };
  }, [naturalSize, viewport]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(3, Number((z + 0.5).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(2))));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  // Keyboard shortcuts & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleResetZoom]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
    } else {
      setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (zoom === 1 && (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500)) {
      onClose();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `bang-chung-rank-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && src && (
        <motion.div
          key="messenger-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col select-none"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Xem ảnh phóng to'}
        >
          {/* Messenger-style dark translucent backdrop */}
          <motion.div
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="absolute inset-0 bg-black/92 backdrop-blur-xl"
          />

          {/* Top Messenger-style Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none"
          >
            {/* Left: Title & Subtitle */}
            <div className="min-w-0 pointer-events-auto">
              {title && (
                <h3 className="text-sm sm:text-base font-bold text-white truncate drop-shadow">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] sm:text-xs text-zinc-300/90 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Right: Messenger circular icon toolbar */}
            <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
              {/* Zoom controls group */}
              <div className="hidden sm:flex items-center gap-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md p-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  title="Thu nhỏ (-)"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Đặt lại 100% (0)"
                  className="px-2 h-8 rounded-full text-xs font-mono font-bold text-zinc-200 hover:bg-white/15 transition-colors cursor-pointer min-w-[3.25rem] text-center"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  title="Phóng to (+)"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {zoom > 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Đặt lại kích thước"
                  className="sm:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {/* Download button */}
              <button
                type="button"
                onClick={handleDownload}
                title="Tải ảnh xuống"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Open original in new tab */}
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở ảnh gốc trong tab mới"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </a>

              {/* Messenger-style Circular Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng ảnh"
                title="Đóng (ESC)"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg transition-all cursor-pointer ml-1"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>

          {/* Center Image Stage (click backdrop to close, drag down to dismiss like Messenger) */}
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDragging) {
                onClose();
              }
            }}
            onWheel={handleWheel}
            className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
          >
            <motion.div
              style={{
                x: dragX,
                y: dragY,
                scale: zoom === 1 ? dragScale : 1,
              }}
              drag={zoom === 1 ? 'y' : true}
              dragConstraints={
                zoom === 1
                  ? { top: 0, bottom: 0 }
                  : { top: -350, bottom: 350, left: -450, right: 450 }
              }
              dragElastic={zoom === 1 ? 0.65 : 0.15}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.84, y: 32 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
              className={`relative max-w-[92vw] max-h-[78vh] flex items-center justify-center ${
                zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              }`}
            >
              <motion.img
                src={src}
                alt={alt}
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                  }
                }}
                style={{
                  width: displayMetrics.width ? `${displayMetrics.width}px` : undefined,
                  height: displayMetrics.height ? `${displayMetrics.height}px` : undefined,
                }}
                animate={{ scale: zoom }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="max-w-[90vw] max-h-[78vh] object-contain rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.85)] ring-1 ring-white/15 bg-zinc-950/60"
              />
            </motion.div>
          </div>

          {/* Bottom subtle Messenger hint pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 flex items-center justify-center px-4 pb-5 pt-2 pointer-events-none"
          >
            <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[11px] sm:text-xs text-zinc-300 text-center flex items-center gap-2 flex-wrap justify-center">
              {naturalSize && (
                <span className="font-mono text-zinc-200 font-semibold">
                  {naturalSize.w} × {naturalSize.h}px
                  {displayMetrics.isLowRes ? ' (ảnh gốc nhỏ)' : ''}
                </span>
              )}
              {naturalSize && <span className="text-zinc-500">•</span>}
              <span>
                {zoom > 1
                  ? `Đang phóng to ${Math.round(zoom * 100)}% • Kéo để di chuyển • Nhấp đúp để thu nhỏ`
                  : 'Kéo xuống, bấm ra ngoài hoặc nhấn ESC để đóng • Nhấp đúp để phóng to'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
