'use client';

import { useState } from 'react';
import { User, ThumbsUp, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CommentItem({ comment, allComments, onLike, onReply, currentUser }: any) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const replies = allComments.filter((c: any) => c.parentId === comment._id);
  const hasLiked = comment.likes.includes(currentUser?._id);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReply(replyContent, comment._id);
    setReplyContent('');
    setShowReplyForm(false);
  };

  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700">
        {comment.userId?.profile?.avatar ? (
          <img src={comment.userId.profile.avatar} className="w-full h-full object-cover" alt={comment.userId?.username} />
        ) : (
          <User className="w-full h-full p-2 text-zinc-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-white text-sm">{comment.userId?.username || 'Unknown'}</span>
          <span className="text-xs text-zinc-500">{timeAgo}</span>
        </div>
        <div className="text-zinc-300 text-sm bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 inline-block">
          {comment.content}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <button
            onClick={() => onLike(comment._id)}
            className={`flex items-center gap-1 font-medium transition-colors ${hasLiked ? 'text-blue-400' : 'hover:text-white'}`}
          >
            <ThumbsUp size={14} className={hasLiked ? 'fill-blue-400' : ''} />
            {comment.likes.length > 0 && <span>{comment.likes.length}</span>}
            Thích
          </button>
          <button onClick={() => setShowReplyForm(!showReplyForm)} className="flex items-center gap-1 font-medium hover:text-white">
            <Reply size={14} />
            Trả lời
          </button>
        </div>

        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Trả lời ${comment.userId?.username}...`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
              autoFocus
            />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Gửi</button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-zinc-800">
            {replies.map((reply: any) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                allComments={allComments}
                onLike={onLike}
                onReply={onReply}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}