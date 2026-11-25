'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  User,
  Smile,
  Reply,
  Trash2,
  X,
  Check,
  CheckCheck,
  ZoomIn,
  ExternalLink,
  ImageOff,
  DollarSign,
  FileText,
  Gamepad2,
  Coffee,
  Trophy,
  KeyRound,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatServiceNameVi } from '@/lib/orderStatus';
import { formatRankDisplayVi } from '@/lib/riotRanks';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

interface MessageProps {
  message: any;
  isMe: boolean;
  isSequence?: boolean;
  isLastInSequence?: boolean;
  isMaximized?: boolean;
  searchTerm?: string;
  isOnline?: boolean;
  partner?: any;
  orderContext?: {
    serviceType?: string;
    details?: any;
  };
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete?: () => void;
  onImageLoad?: () => void;
}

export default function MessageItem({
  message,
  isMe,
  isSequence = false,
  isLastInSequence = true,
  isMaximized = false,
  searchTerm = '',
  isOnline = false,
  partner,
  orderContext,
  onReact,
  onReply,
  onDelete,
  onImageLoad,
}: MessageProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const reactionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!showReactionPicker) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowReactionPicker(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showReactionPicker]);

  useEffect(() => {
    if (!isZoomed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomed(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isZoomed]);

  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const groupedReactions: Record<string, number> = reactions.reduce(
    (acc: Record<string, number>, r: any) => {
      if (r?.emoji) {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  const senderId = (message.sender_id?._id || message.sender_id)?.toString();

  // 1. ĐÃ XEM (Seen): Có đối phương trong danh sách readBy
  const isSeen =
    isMe &&
    Array.isArray(message.readBy) &&
    message.readBy.some((id: any) => {
      const s = (id?._id || id)?.toString();
      return s && s !== senderId;
    });

  // 2. ĐÃ NHẬN (Delivered): Đã xem, hoặc có đối phương trong danh sách deliveredTo, hoặc đối phương đang Online
  const isDelivered =
    isSeen ||
    (isMe && (
      (Array.isArray(message.deliveredTo) &&
        message.deliveredTo.some((id: any) => {
          const s = (id?._id || id)?.toString();
          return s && s !== senderId;
        })) ||
      Boolean(isOnline)
    ));

  // Avatar đối phương để hiển thị avatar nhỏ khi đã xem (chuẩn Messenger)
  const partnerAvatar =
    partner?.profile?.avatar ||
    partner?.avatar ||
    (typeof partner?.username === 'string'
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.username)}&background=0284c7&color=fff`
      : null);

  const handleViewProfile = () => {
    if (message.sender_id?._id && message.sender_id.role === 'BOOSTER') {
      router.push(`/boosters/${message.sender_id._id}`);
    }
  };

  const handleViewProgressTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('switch-order-tab', { detail: 'PROGRESS' }));
    const tabEl = document.getElementById('order-tabs-container');
    if (tabEl) {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const dateValue = message.createdAt || message.created_at;
  const timeAgo = dateValue
    ? formatDistanceToNow(new Date(dateValue), { addSuffix: true, locale: vi })
    : 'Vừa xong';

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.toLowerCase() === highlight.toLowerCase()) {
        return (
          <span
            key={i}
            className="bg-yellow-500/40 text-white font-semibold rounded px-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const commandType = message.type === 'COMMAND_RESULT' ? message.metadata?.command : null;
  const canDeleteMessage = Boolean(isMe && onDelete && commandType !== 'TIP');
  const isReplyImage = message.replyTo?.type === 'IMAGE';

  const renderCommandCard = () => {
    const meta = message.metadata || {};

    if (commandType === 'TIP') {
      return (
        <div
          className="w-[235px] sm:w-[250px] rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 p-3 shadow-lg"
          title={timeAgo}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <DollarSign size={13} className="shrink-0" />
              Tiền Tip cảm ơn
            </span>
            {meta.orderCode && (
              <span className="text-[10px] font-mono text-amber-300/70">
                #{meta.orderCode}
              </span>
            )}
          </div>
          <div className="text-lg font-black font-mono text-amber-300 tracking-tight">
            +{Number(meta.amount || 0).toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-zinc-300 mt-1">
            <span className="font-semibold text-white">{meta.customerUsername}</span>
            <span className="text-zinc-500"> → </span>
            <span className="font-semibold text-amber-300">{meta.boosterUsername}</span>
          </div>
          {meta.note && (
            <div className="mt-2 rounded-lg bg-black/30 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-zinc-300 italic break-words">
              &ldquo;{meta.note}&rdquo;
            </div>
          )}
        </div>
      );
    }

    if (commandType === 'ORDER_INFO') {
      return (
        <div
          className="w-[240px] sm:w-[260px] rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-zinc-900 to-zinc-950 p-3 shadow-lg text-xs"
          title={timeAgo}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
            <span className="inline-flex items-center gap-1.5 font-bold text-blue-400">
              <FileText size={13} />
              Đơn #{meta.orderCode}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-semibold text-blue-300 truncate max-w-[115px]">
              {meta.statusLabel || meta.status}
            </span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Game / SV:</span>
              <span className="text-zinc-200 font-semibold">
                {meta.game} • {meta.server}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Dịch vụ:</span>
              <span className="text-zinc-200 font-medium truncate max-w-[150px]">
                {formatServiceNameVi(meta.serviceType || orderContext?.serviceType, orderContext?.details)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Mục tiêu:</span>
              <span className="text-cyan-300 font-semibold text-right">
                {(() => {
                  if (meta.targetDisplay) return meta.targetDisplay;
                  const isMatches = meta.serviceType === 'MATCHES' || meta.isMatches || orderContext?.serviceType === 'MATCHES' || orderContext?.details?.is_matches;
                  if (isMatches) {
                    const count = meta.matchCount || orderContext?.details?.match_count || orderContext?.details?.matches || 1;
                    const queue = (meta.queueType || orderContext?.details?.queue_type) === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                    return `Cày ${count} trận (${queue})`;
                  }
                  const isPlacements = meta.serviceType === 'PLACEMENTS' || meta.isPlacements || orderContext?.serviceType === 'PLACEMENTS' || orderContext?.details?.is_placements;
                  if (isPlacements) {
                    const count = meta.placementMatches || orderContext?.details?.placement_matches || 5;
                    return `Cày ${count} trận phân hạng`;
                  }
                  const curr = formatRankDisplayVi(meta.currentRank);
                  const des = formatRankDisplayVi(meta.desiredRank);
                  if (curr !== '—' && des !== '—') return `${curr} → ${des}`;
                  if (des !== '—') return des;
                  if (curr !== '—') return curr;
                  return 'Theo yêu cầu';
                })()}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Trận đã đấu:</span>
              <span className="font-mono font-bold">
                <span className="text-emerald-400">{meta.wins || 0}W</span>
                <span className="text-zinc-500"> / </span>
                <span className="text-rose-400">{meta.losses || 0}L</span>
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (commandType === 'BOOSTER_STATUS') {
      const code = meta.statusCode || 'PLAYING';
      const styleMap: Record<
        string,
        { border: string; bg: string; badge: string; Icon: any }
      > = {
        PLAYING: {
          border: 'border-emerald-500/35',
          bg: 'from-emerald-500/15 via-zinc-900 to-zinc-950',
          badge: 'text-emerald-400',
          Icon: Gamepad2,
        },
        BREAK: {
          border: 'border-amber-500/35',
          bg: 'from-amber-500/15 via-zinc-900 to-zinc-950',
          badge: 'text-amber-400',
          Icon: Coffee,
        },
        ALMOST_DONE: {
          border: 'border-cyan-500/35',
          bg: 'from-cyan-500/15 via-zinc-900 to-zinc-950',
          badge: 'text-cyan-400',
          Icon: Trophy,
        },
        NEED_LOGIN: {
          border: 'border-rose-500/40',
          bg: 'from-rose-500/15 via-zinc-900 to-zinc-950',
          badge: 'text-rose-400',
          Icon: KeyRound,
        },
      };
      const cfg = styleMap[code] || styleMap.PLAYING;
      const StatusIcon = cfg.Icon;

      return (
        <div
          className={`w-[235px] sm:w-[255px] rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} p-3 shadow-lg`}
          title={timeAgo}
        >
          <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.badge}`}>
            <StatusIcon size={14} className="shrink-0" />
            <span>{meta.label || 'Cập nhật trạng thái'}</span>
          </div>
          {meta.description && (
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              {meta.description}
            </p>
          )}
          {meta.note && (
            <div className="mt-2 rounded-lg bg-black/30 border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-200 break-words">
              {meta.note}
            </div>
          )}
        </div>
      );
    }

    if (commandType === 'PROGRESS_REPORT') {
      const winRate = Number(meta.winRate || 0);
      const recentMatches = Array.isArray(meta.recentMatches) ? meta.recentMatches : [];

      return (
        <div
          className="w-[240px] sm:w-[260px] rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 p-3 shadow-lg text-xs"
          title={timeAgo}
        >
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
              <BarChart3 size={13} />
              Báo cáo tiến độ
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {winRate}% WR
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Hiện tại:</span>
              <span className="text-white font-semibold">
                {(() => {
                  const formatted = formatRankDisplayVi(meta.currentRank);
                  if (/\d+\s*LP/i.test(formatted)) return formatted;
                  return meta.currentLp !== undefined && meta.currentLp !== null
                    ? `${formatted} (${meta.currentLp} LP)`
                    : formatted;
                })()}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Mục tiêu:</span>
              <span className="text-cyan-300 font-semibold text-right">
                {(() => {
                  if (meta.targetDisplay) return meta.targetDisplay;
                  const isMatches = meta.serviceType === 'MATCHES' || meta.isMatches || orderContext?.serviceType === 'MATCHES' || orderContext?.details?.is_matches;
                  if (isMatches) {
                    const count = meta.matchCount || orderContext?.details?.match_count || orderContext?.details?.matches || 1;
                    const queue = (meta.queueType || orderContext?.details?.queue_type) === 'FLEX' ? 'Linh hoạt' : 'Đơn / Đôi';
                    return `Cày ${count} trận (${queue})`;
                  }
                  const isPlacements = meta.serviceType === 'PLACEMENTS' || meta.isPlacements || orderContext?.serviceType === 'PLACEMENTS' || orderContext?.details?.is_placements;
                  if (isPlacements) {
                    const count = meta.placementMatches || orderContext?.details?.placement_matches || 5;
                    return `Cày ${count} trận phân hạng`;
                  }
                  const formattedDes = formatRankDisplayVi(meta.desiredRank);
                  if (formattedDes && formattedDes !== '—') return formattedDes;
                  return 'Theo yêu cầu đơn hàng';
                })()}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Thành tích:</span>
              <span className="font-mono font-bold">
                <span className="text-emerald-400">{meta.wins || 0}W</span>
                <span className="text-zinc-500"> - </span>
                <span className="text-rose-400">{meta.losses || 0}L</span>
              </span>
            </div>

            {meta.totalMatches > 0 && (
              <div className="w-full h-1.5 rounded-full bg-rose-500/30 overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
                />
              </div>
            )}

            {meta.note && (
              <div className="mt-1.5 rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-[11px] text-zinc-200 break-words">
                {meta.note}
              </div>
            )}

            <button
              type="button"
              onClick={handleViewProgressTab}
              className="mt-2 w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-[0.98] text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
            >
              <span>Xem chi tiết</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="rounded-2xl bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 font-mono text-xs px-3.5 py-2.5 whitespace-pre-wrap break-words shadow-sm max-w-full"
        title={timeAgo}
      >
        {highlightText(message.content || '', searchTerm)}
      </div>
    );
  };

  return (
    <>
      <div
        className={`group flex flex-col ${isLastInSequence ? 'mb-3.5' : 'mb-1'}`}
      >
        {/* Sender Name & Time (chỉ hiện ở tin đầu tiên của chuỗi) */}
        {!isSequence && (
          <div
            className={`flex items-center gap-1.5 mb-1 ${
              isMe ? 'justify-end pr-9' : 'justify-start pl-9'
            }`}
          >
            <span
              onClick={handleViewProfile}
              className={`text-[11px] font-semibold text-zinc-400 ${
                message.sender_id?.role === 'BOOSTER'
                  ? 'cursor-pointer hover:text-blue-400 hover:underline'
                  : ''
              }`}
            >
              {message.sender_id?.username}
            </span>
            <span className="text-[10px] text-zinc-600">• {timeAgo}</span>
          </div>
        )}

        {/* Main Row: Avatar + Bubble + Floating Side Actions */}
        <div
          className={`flex items-end gap-2 ${
            isMe ? 'flex-row-reverse' : 'flex-row'
          }`}
        >
          {/* Avatar (cố định đáy bubble, chỉ hiện ở tin cuối của chuỗi) */}
          <div className="w-7 shrink-0 flex justify-center">
            {isLastInSequence && (
              <div
                onClick={handleViewProfile}
                className={`relative w-7 h-7 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700/80 ${
                  message.sender_id?.role === 'BOOSTER'
                    ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all'
                    : ''
                }`}
              >
                {message.sender_id?.profile?.avatar ? (
                  <Image
                    src={message.sender_id.profile.avatar}
                    alt={message.sender_id.username || 'User'}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <User size={14} />
                  </div>
                )}

                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-zinc-900 rounded-full" />
                )}
              </div>
            )}
          </div>

          {/* Bubble Column */}
          <div
            className={`flex flex-col min-w-0 max-w-[74%] ${
              isMe ? 'items-end' : 'items-start'
            }`}
          >
            {/* Reply Context */}
            {message.replyTo && (
              <div
                className={`mb-1 flex items-center gap-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 px-2.5 py-1 text-[11px] text-zinc-400 max-w-full ${
                  isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                }`}
              >
                <Reply size={11} className="shrink-0 text-zinc-500" />
                {isReplyImage ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={message.replyTo.content}
                      alt="Reply preview"
                      className="w-5 h-5 rounded object-cover shrink-0 border border-zinc-700"
                    />
                    <span className="truncate">Hình ảnh</span>
                  </div>
                ) : (
                  <span className="truncate max-w-[160px]">
                    {message.replyTo.content}
                  </span>
                )}
              </div>
            )}

            {/* Message Bubble */}
            {message.type === 'IMAGE' ? (
              imgError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-3 text-xs text-zinc-400">
                  <ImageOff size={16} className="text-zinc-500 shrink-0" />
                  <span>Không thể tải hình ảnh</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsZoomed(true)}
                  title={`${timeAgo} — Nhấn để phóng to`}
                  className="group/img relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/80 shadow-md transition-all duration-200 hover:border-blue-500/40 hover:shadow-blue-500/10 focus:outline-none cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.content}
                    alt="Ảnh đính kèm"
                    loading="lazy"
                    onLoad={() => onImageLoad?.()}
                    onError={() => setImgError(true)}
                    className={`block w-auto h-auto object-contain transition-transform duration-200 group-hover/img:scale-[1.02] ${
                      isMaximized
                        ? 'max-w-[260px] sm:max-w-[320px] max-h-[300px]'
                        : 'max-w-[175px] sm:max-w-[200px] max-h-[200px]'
                    }`}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/75 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <ZoomIn size={12} /> Xem ảnh
                    </span>
                  </div>
                </button>
              )
            ) : message.type === 'COMMAND_RESULT' ? (
              renderCommandCard()
            ) : (
              <div
                className={`rounded-2xl text-[13.5px] leading-relaxed break-words whitespace-pre-wrap shadow-sm max-w-full relative group/bubble ${
                  isMe
                    ? `bg-blue-600 text-white px-3.5 py-2 ${
                        isSequence ? 'rounded-tr-md' : 'rounded-tr-2xl'
                      } ${!isLastInSequence ? 'rounded-br-md' : ''}`
                    : `bg-zinc-800/95 text-zinc-100 border border-zinc-700/70 px-3.5 py-2 ${
                        isSequence ? 'rounded-tl-md' : 'rounded-tl-2xl'
                      } ${!isLastInSequence ? 'rounded-bl-md' : ''}`
                }`}
                title={timeAgo}
              >
                {highlightText(message.content || '', searchTerm)}

                {!isMe && message.type === 'TEXT' && (
                  <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover/bubble:opacity-100 transition-opacity pointer-events-none" />
                )}
              </div>
            )}

            {/* Reactions Display */}
            {Object.keys(groupedReactions).length > 0 && (
              <div
                className={`-mt-2 relative z-10 flex flex-wrap gap-1 ${
                  isMe ? 'justify-end mr-1.5' : 'justify-start ml-1.5'
                }`}
              >
                {Object.entries(groupedReactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReact(emoji)}
                    className="bg-zinc-900 border border-zinc-700/80 hover:border-blue-500/50 rounded-full px-1.5 py-0.5 text-[11px] text-zinc-200 flex items-center gap-0.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span className="font-bold text-[10px]">{count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Side Hover Actions Pill */}
          <div
            ref={reactionRef}
            className={`relative self-center shrink-0 flex items-center gap-0.5 rounded-full bg-zinc-900/95 border border-zinc-800/90 px-1 py-0.5 shadow-lg backdrop-blur-md transition-opacity duration-150 ${
              showReactionPicker
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto'
            }`}
          >
            {showReactionPicker && (
              <div
                className={`absolute bottom-full mb-1.5 ${
                  isMe ? 'right-0' : 'left-0'
                } z-30 flex items-center gap-0.5 rounded-full bg-zinc-900/95 border border-zinc-700/80 px-1.5 py-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150`}
              >
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onReact(emoji);
                      setShowReactionPicker(false);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm hover:bg-zinc-800 hover:scale-125 transition-all cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowReactionPicker((prev) => !prev)}
              className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Thả cảm xúc"
              aria-label="Thả cảm xúc"
            >
              <Smile size={13} />
            </button>

            <button
              type="button"
              onClick={onReply}
              className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Trả lời"
              aria-label="Trả lời"
            >
              <Reply size={13} />
            </button>

            {canDeleteMessage && (
              <button
                type="button"
                onClick={onDelete}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Thu hồi tin nhắn"
                aria-label="Thu hồi tin nhắn"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Read / Delivered / Sent Status Indicator (Messenger style) */}
        {isMe && isLastInSequence && (
          <div className="mt-1 pr-9 flex items-center justify-end gap-1.5 text-[10px] select-none">
            {isSeen ? (
              <span
                className="inline-flex items-center gap-1 text-cyan-400 font-semibold"
                title="Đã xem"
              >
                <CheckCheck size={13} className="text-cyan-400" />
                <span>Đã xem</span>
                {partnerAvatar && (
                  <span className="relative inline-block w-3.5 h-3.5 rounded-full overflow-hidden border border-cyan-500/50 shadow-sm ml-0.5 ring-1 ring-cyan-500/20">
                    <img
                      src={partnerAvatar}
                      alt="Seen"
                      className="w-full h-full object-cover"
                    />
                  </span>
                )}
              </span>
            ) : isDelivered ? (
              <span
                className="inline-flex items-center gap-0.5 text-zinc-300 font-normal"
                title="Đã nhận (Đối phương đã nhận được tin nhắn)"
              >
                <CheckCheck size={13} className="text-zinc-400" />
                <span>Đã nhận</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-0.5 text-zinc-500 font-normal"
                title="Đã gửi (Tin nhắn đã được gửi lên hệ thống)"
              >
                <Check size={13} className="text-zinc-500" />
                <span>Đã gửi</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Image Zoom Modal (Lightbox) */}
      {isZoomed &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setIsZoomed(false)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink size={18} />
              </a>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Đóng (ESC)"
              >
                <X size={20} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.content}
              alt="Full view"
              className="max-w-[92vw] max-h-[88vh] object-contain rounded-xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
