'use client';

import { useState } from 'react';
import { User, ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Send, X, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CommentItemProps {
  comment: any;
  allComments: any[];
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId: string) => void;
  currentUser: any;
  depth?: number;
}

export default function CommentItem({
  comment,
  allComments,
  onLike,
  onReply,
  currentUser,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThreadCollapsed, setIsThreadCollapsed] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const TRUNCATE_LENGTH = 250;
  const isLongComment = comment.content?.length > TRUNCATE_LENGTH;
  const isReply = depth > 0;

  // Giới hạn thụt lề tối đa: Sau cấp 3 (depth >= 3), không cộng dồn indent nữa để tránh vỡ bố cục mobile
  const MAX_INDENT_DEPTH = 3;
  const isCappedDepth = depth >= MAX_INDENT_DEPTH;

  // Lấy danh sách replies của comment này và sắp xếp thời gian cũ -> mới
  const replies = (allComments || [])
    .filter((c: any) => c.parentId === comment._id)
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Tìm người được trả lời nếu là comment con
  const parentComment = comment.parentId
    ? allComments.find((c: any) => c._id === comment.parentId)
    : null;

  const hasLiked = comment.likes?.includes(currentUser?._id);

  const timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })
    : '';

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    await onReply(replyContent, comment._id);
    setReplyContent('');
    setShowReplyForm(false);
    setSubmittingReply(false);
  };

  const displayedContent = isLongComment && !isExpanded
    ? `${comment.content.substring(0, TRUNCATE_LENGTH)}...`
    : comment.content;

  const hasReplies = replies.length > 0;

  return (
    <div className="flex flex-col group/thread-item w-full min-w-0" data-depth={depth}>
      {/* Khung bình luận hiện tại */}
      <div className="flex gap-3 items-stretch relative w-full min-w-0">
        {/* Cột Avatar & đường dẫn dọc: Cố định bề rộng w-8 để trục dọc luôn bất biến tại x = 16px */}
        <div className="w-8 shrink-0 flex flex-col items-center relative">
          {/* Avatar Container: luôn là 32x32px (w-8 h-8) để tâm avatar luôn chuẩn xác ở (16px, 16px) */}
          <div className="w-8 h-8 flex items-center justify-center shrink-0 relative">
            <div
              className={`${
                isReply ? 'w-7 h-7' : 'w-8 h-8'
              } rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700/80 shadow-sm z-10 flex items-center justify-center`}
            >
              {comment.userId?.profile?.avatar ? (
                <img
                  src={comment.userId.profile.avatar}
                  className="w-full h-full object-cover"
                  alt={comment.userId?.username || 'Avatar'}
                />
              ) : (
                <User className={`w-full h-full ${isReply ? 'p-1' : 'p-1.5'} text-zinc-500`} />
              )}
            </div>
          </div>

          {/* Đường chỉ dọc nối từ dưới avatar cha xuống chạm đúng đáy comment row */}
          {hasReplies && !isThreadCollapsed && (
            <div
              className={`w-[2px] flex-1 ${
                isCappedDepth ? 'bg-zinc-700/60' : 'bg-zinc-800'
              }`}
            />
          )}
        </div>

        {/* Cột phải: Thông tin & Nội dung bình luận */}
        <div className="flex-1 min-w-0 w-full pb-2">
          {/* Header: Username, time, tag trả lời, badge cấp độ */}
          <div className="flex items-center gap-2 mb-1 flex-wrap min-w-0">
            <span className={`font-bold text-white truncate max-w-[200px] sm:max-w-xs ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.userId?.username || 'Người dùng'}
            </span>

            {/* Badge hiển thị cấp độ khi độ sâu đạt ngưỡng giới hạn thụt lề */}
            {isCappedDepth && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
                Cấp {depth + 1}
              </span>
            )}

            {/* Tag người được trả lời: Biết ngay ai đang nói chuyện với ai */}
            {parentComment?.userId?.username && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 truncate max-w-[200px]">
                <CornerDownRight className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">@{parentComment.userId.username}</span>
              </span>
            )}

            <span className="text-xs text-zinc-500 shrink-0">{timeAgo}</span>

            {/* Nút thu gọn / mở rộng chuỗi nếu có replies */}
            {hasReplies && (
              <button
                onClick={() => setIsThreadCollapsed(!isThreadCollapsed)}
                className="ml-auto text-xs text-zinc-500 hover:text-blue-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5 shrink-0"
              >
                {isThreadCollapsed ? `+${replies.length} phản hồi` : 'Thu gọn'}
              </button>
            )}
          </div>

          {/* Hộp nội dung comment: Khắc phục triệt để tràn văn bản dài không dấu cách */}
          <div className="bg-zinc-900/60 hover:bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 transition-colors block w-fit max-w-full min-w-0 shadow-sm overflow-hidden">
            <p
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              className="text-zinc-200 text-sm whitespace-pre-wrap break-words leading-relaxed max-w-full"
            >
              {displayedContent}
            </p>

            {isLongComment && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 mt-2 transition-colors"
              >
                {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Thanh tương tác: Thích & Trả lời */}
          <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-400">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                hasLiked ? 'text-blue-400' : 'hover:text-white'
              }`}
            >
              <ThumbsUp size={14} className={hasLiked ? 'fill-blue-400' : ''} />
              <span>{comment.likes?.length > 0 ? comment.likes.length : ''} Thích</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                showReplyForm ? 'text-blue-400' : 'hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              Trả lời
            </button>
          </div>

          {/* Form trả lời inline */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex flex-col gap-2 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200 w-full min-w-0">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Trả lời <strong className="text-white">@{comment.userId?.username}</strong></span>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Nhập phản hồi của bạn...`}
                rows={2}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white outline-none focus:border-blue-500 resize-none"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={12} />
                  Gửi
                </button>
              </div>
            </form>
          )}

          {/* Nút xem lại phản hồi nếu đang thu gọn */}
          {isThreadCollapsed && hasReplies && (
            <button
              onClick={() => setIsThreadCollapsed(false)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20 transition-all"
            >
              <ChevronDown size={14} />
              Xem {replies.length} phản hồi
            </button>
          )}
        </div>
      </div>

      {/* Danh sách các bình luận con:
          - depth < MAX_INDENT_DEPTH: Thụt lề với ml-4 pl-5 (36px) và nhánh cong
          - depth >= MAX_INDENT_DEPTH: Khóa thụt lề với ml-0 pl-0 (0px shift), tâm avatar giữ nguyên thẳng hàng theo trục dọc
      */}
      {!isThreadCollapsed && hasReplies && (
        <div className={`${depth < MAX_INDENT_DEPTH ? 'ml-4 pl-5' : 'ml-0 pl-0'} pt-2 w-full min-w-0`}>
          {replies.map((reply: any, index: number) => {
            const isLast = index === replies.length - 1;

            return (
              <div key={reply._id} className="relative pb-3 last:pb-0 w-full min-w-0">
                {depth < MAX_INDENT_DEPTH ? (
                  /* Với cấp 1-3 (depth < 3): Nhánh cong từ trục cha rẽ vào avatar con */
                  <>
                    <div
                      className="absolute -left-5 top-0 h-4 w-[24px] border-b-2 border-l-2 border-zinc-800 rounded-bl-xl pointer-events-none"
                    />
                    {!isLast && (
                      <div
                        className="absolute -left-5 top-0 bottom-0 w-[2px] bg-zinc-800 pointer-events-none"
                      />
                    )}
                  </>
                ) : (
                  /* Với cấp 4 trở đi (depth >= 3): Khóa thụt lề, tâm avatar thẳng hàng tuyệt đối (shift = 0), nối dọc qua trục 16px */
                  <>
                    <div
                      className="absolute left-[15px] top-0 h-3 w-[2px] bg-zinc-700/60 pointer-events-none"
                    />
                    {!isLast && (
                      <div
                        className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-zinc-700/60 pointer-events-none"
                      />
                    )}
                  </>
                )}

                <CommentItem
                  comment={reply}
                  allComments={allComments}
                  onLike={onLike}
                  onReply={onReply}
                  currentUser={currentUser}
                  depth={depth + 1}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}