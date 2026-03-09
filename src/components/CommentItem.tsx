'use client';

import { useState } from 'react';
import { User, ThumbsUp, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CommentItem({ comment, allComments, onLike, onReply, currentUser }: any) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThreadCollapsed, setIsThreadCollapsed] = useState(false);

  // Đồng bộ độ dài cắt chuỗi
  const TRUNCATE_LENGTH = 250;
  const isLongComment = comment.content.length > TRUNCATE_LENGTH;

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

  const displayedContent = isLongComment && !isExpanded
    ? `${comment.content.substring(0, TRUNCATE_LENGTH)}...`
    : comment.content;

  return (
    <div className="relative group/comment-item">
      {/* Main Comment Row */}
      <div className="flex gap-3">
        {/* Left Gutter: Avatar */}
        <div className="w-8 shrink-0 flex flex-col items-center relative">
          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700 z-10">
            {comment.userId?.profile?.avatar ? (
                <img src={comment.userId.profile.avatar} className="w-full h-full object-cover" alt={comment.userId?.username} />
            ) : (
                <User className="w-full h-full p-1.5 text-zinc-500" />
            )}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-white text-sm truncate">{comment.userId?.username || 'Unknown'}</span>
            <span className="text-xs text-zinc-500 shrink-0">{timeAgo}</span>
            {/* Nút collapse/expand tinh tế hơn */}
            {replies.length > 0 && (
              <button onClick={() => setIsThreadCollapsed(!isThreadCollapsed)} className="text-zinc-600 hover:text-blue-400" title={isThreadCollapsed ? 'Mở rộng' : 'Thu gọn'}>
                [{isThreadCollapsed ? `+${replies.length}` : '-'}]
              </button>
            )}
          </div>

          {/* Content (hiện/ẩn dựa trên isThreadCollapsed) */}
          <div className={`${isThreadCollapsed ? 'hidden' : 'block'}`}>
            <div className="text-zinc-300 text-sm bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 inline-block max-w-full">
              <p className="whitespace-pre-wrap break-words">{displayedContent}</p>
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              {isLongComment && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"
                >
                  {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}

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
          </div>
        </div>
      </div>

      {/* Replies Container */}
      {!isThreadCollapsed && replies.length > 0 && (
        <div className="relative ml-4 pl-7 pt-4">
          {/* List of Replies */}
          <div className="flex flex-col gap-4">
              {replies.map((reply: any, index: number) => (
                <div key={reply._id} className="relative">
                  {/* Segmented Thread Line: Chỉ vẽ nếu không phải là reply cuối cùng */}
                  {index < replies.length - 1 && (
                     <div className="absolute -left-7 top-4 bottom-0 w-[2px] bg-zinc-800" />
                  )}

                  {/* Branch Line: Đường cong móc câu nối vào Main Thread Line */}
                  <div className="absolute -left-7 top-4 h-4 w-[18px] border-b-2 border-l-2 border-zinc-800 rounded-bl-lg pointer-events-none" />
                  
                  <CommentItem
                      comment={reply}
                      allComments={allComments}
                      onLike={onLike}
                      onReply={onReply}
                      currentUser={currentUser}
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}