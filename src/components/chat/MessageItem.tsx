'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { User, Smile, Reply, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface MessageProps {
  message: any;
  isMe: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete?: () => void;
}

export default function MessageItem({ message, isMe, onReact, onReply, onDelete }: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const { t } = useLanguage();

  const reactions = message.reactions || [];
  const groupedReactions = reactions.reduce((acc: any, r: any) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div
      className={`group flex gap-3 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700">
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
        </div>
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-zinc-300">{message.sender_id?.username}</span>
          <span className="text-[10px] text-zinc-500">
            {format(new Date(message.created_at), 'HH:mm')}
          </span>
        </div>

        <div className="relative">
          {/* Reply Context */}
          {message.replyTo && (
            <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1 bg-zinc-900/50 p-1 rounded border-l-2 border-zinc-600 opacity-80">
                <Reply size={10} />
                <span className="truncate max-w-[150px]">{message.replyTo.content}</span>
            </div>
          )}

          {/* Message Bubble */}
          <div className={`px-4 py-2 rounded-2xl text-sm break-all shadow-sm ${
            message.type === 'COMMAND_RESULT'
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono whitespace-pre-wrap'
              : isMe
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
          }`}>
            {message.type === 'IMAGE' ? (
               <img 
                 src={message.content} 
                 alt="Image" 
                 className="max-w-[240px] max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover" 
                 onClick={() => window.open(message.content, '_blank')} 
               />
            ) : (
               message.content
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
  );
}