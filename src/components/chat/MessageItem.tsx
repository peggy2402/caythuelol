'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User, Smile, Reply, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { useRouter } from 'next/navigation';

interface MessageProps {
  message: any;
  isMe: boolean;
  isSequence?: boolean; // Prop mới: Có phải là tin nhắn liên tiếp không?
  searchTerm?: string; // Prop mới: Từ khóa tìm kiếm
  isOnline?: boolean; // Prop mới: Trạng thái Online
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete?: () => void;
}

export default function MessageItem({ message, isMe, isSequence = false, searchTerm = '', isOnline = false, onReact, onReply, onDelete }: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false); // State cho chế độ xem ảnh
  const { t } = useLanguage();
  const router = useRouter();

  const reactions = message.reactions || [];
  const groupedReactions = reactions.reduce((acc: any, r: any) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  // Kiểm tra xem tin nhắn đã được xem chưa (bởi người khác)
  // Logic: readBy chứa ít nhất 1 ID khác người gửi (là mình)
  const isSeen = isMe && message.readBy && message.readBy.length > 0;

  const handleViewProfile = () => {
    if (message.sender_id?._id && message.sender_id.role === 'BOOSTER') {
      router.push(`/boosters/${message.sender_id._id}`);
    }
  };

  const timeAgo = message.created_at 
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: vi }) 
    : '';

  // Hàm highlight từ khóa
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-500/50 text-white font-bold rounded px-0.5">{part}</span> : part
    );
  };

  return (
    <>
    <div
      className={`group flex gap-3 ${isSequence ? 'mb-0.5' : 'mb-4'} ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 flex flex-col justify-end">
        {!isSequence && (
          <div onClick={handleViewProfile} className={`relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 ${message.sender_id?.role === 'BOOSTER' ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all' : ''}`}>
            {message.sender_id?.profile?.avatar ? (
            <Image
              src={message.sender_id.profile.avatar}
              alt={message.sender_id.username}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <User size={16} />
              </div>
            )}
            
            {/* Chấm xanh Online trên Avatar tin nhắn */}
            {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-900 rounded-full"></div>}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        {!isSequence && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span onClick={handleViewProfile} className={`text-xs font-bold text-zinc-400 ${message.sender_id?.role === 'BOOSTER' ? 'cursor-pointer hover:text-blue-400 hover:underline' : ''}`}>{message.sender_id?.username}</span>
            <span className="text-[10px] text-zinc-600">
              {timeAgo}
            </span>
          </div>
        )}

        <div className="relative">
          {/* Reply Context */}
          {message.replyTo && (
            <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 bg-zinc-900/50 p-1 rounded border-l-2 border-zinc-600 opacity-80">
                <Reply size={10} />
                <span className="truncate max-w-[150px]">{message.replyTo.content}</span>
            </div>
          )}

          {/* Message Bubble */}
          <div className={`rounded-2xl text-sm break-all shadow-sm ${
            message.type === 'IMAGE' 
              ? 'bg-transparent p-0' // FIX: Không nền, không padding cho ảnh
              : message.type === 'COMMAND_RESULT'
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono whitespace-pre-wrap'
              : isMe
                ? `bg-blue-600 text-white px-3 py-2 ${isSequence ? 'rounded-tr-md' : 'rounded-tr-none'}`
                : `bg-zinc-800 text-zinc-200 border border-zinc-700 px-3 py-2 ${isSequence ? 'rounded-tl-md' : 'rounded-tl-none'}`
          }`} title={timeAgo}>
              {message.type === 'IMAGE' ? (
                <img
                  src={message.content}
                  alt="Image"
                  className="max-w-[260px] max-h-[320px] rounded-xl cursor-pointer hover:opacity-90 transition object-cover"
                  onClick={() => setIsZoomed(true)}
                />
              ) : (
                highlightText(message.content, searchTerm)
              )}
          </div>

          {/* Reactions Display */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={`absolute -bottom-5 ${isMe ? 'right-0' : 'left-0'} flex gap-1`}>
              {Object.entries(groupedReactions).map(([emoji, count]: any) => (
                <div key={emoji} className="bg-zinc-900 border border-zinc-800 rounded-full px-1.5 py-0.5 text-[10px] text-zinc-400 flex items-center gap-1 shadow-sm">
                  <span>{emoji}</span>
                  {count > 1 && <span className="font-bold">{count}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Seen Indicator */}
          {isSeen && !isSequence && (
            <div className="text-[10px] text-zinc-500 text-right mt-1 mr-1">Đã xem</div>
          )}
        </div>

        {/* Actions Row (Below Message) */}
        <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <button onClick={() => onReact('👍')} className="text-xs text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1">
              <Smile size={12} /> React
            </button>
            <button onClick={onReply} className="text-xs text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1">
              <Reply size={12} /> Reply
            </button>
            {isMe && onDelete && (
              <button onClick={onDelete} className="text-xs text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-1">
                <Trash2 size={12} /> Delete
              </button>
            )}
        </div>
      </div>
    </div>

    {/* Image Zoom Modal (Lightbox) */}
    {isZoomed && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            onClick={() => setIsZoomed(false)}
            className="absolute top-5 right-5 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={message.content} 
            alt="Full view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}
    </>
  );
}