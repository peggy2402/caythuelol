'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  User,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Link2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ThreadsCommentLine from '@/components/ThreadsCommentLine';
import {
  MAX_VISUAL_DEPTH,
  buildCommentChildrenMap,
  countCommentDescendants,
  flattenSubtreeDFS,
} from '@/lib/commentTree';

// ==========================================
// 1. COMPONENT: InlineReplyComposer (TRONG LUỒNG THREAD)
// ==========================================

interface InlineReplyComposerProps {
  targetComment: any;
  currentUser: any;
  isLast: boolean;
  hasBottomGap: boolean;
  onSubmit: (content: string, parentId?: string | null) => Promise<void> | void;
  onCancel: () => void;
}

function InlineReplyComposer({
  targetComment,
  currentUser,
  isLast,
  hasBottomGap,
  onSubmit,
  onCancel,
}: InlineReplyComposerProps) {
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(replyContent, targetComment._id);
      setReplyContent('');
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  const targetUsername = targetComment?.userId?.username || 'Người dùng';
  const currentUsername = currentUser?.username || 'Bạn';

  return (
    <div
      style={{ gap: 'var(--thread-gap)' }}
      className="flex items-stretch w-full min-w-0"
    >
      <ThreadsCommentLine variant="branch" isLast={isLast} isReplyTarget={true} />

      <div
        style={{
          gap: 'var(--thread-gap)',
          paddingBottom: hasBottomGap ? 'var(--thread-row-gap)' : 0,
        }}
        className="flex items-start flex-1 min-w-0"
      >
        <div
          style={{
            width: 'var(--thread-avatar-size)',
            height: 'var(--thread-avatar-size)',
          }}
          className="flex items-center justify-center shrink-0"
        >
          <div
            style={{
              width: 'var(--thread-avatar-size-reply)',
              height: 'var(--thread-avatar-size-reply)',
            }}
            className="rounded-full bg-[var(--thread-surface)] overflow-hidden shrink-0 border border-[var(--thread-surface-border)] flex items-center justify-center"
          >
            {currentUser?.profile?.avatar ? (
              <img
                src={currentUser.profile.avatar}
                className="w-full h-full object-cover"
                alt={currentUsername}
              />
            ) : (
              <User className="w-full h-full p-1 text-[var(--thread-text-muted)]" />
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-w-0 flex flex-col gap-2 bg-[var(--thread-surface)] p-3 rounded-2xl border border-[var(--thread-surface-border)] animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-[var(--thread-text-muted)]">
            <span className="truncate">
              Trả lời với vai trò <strong className="text-[var(--thread-text)]">{currentUsername}</strong>
              {' · '}
              <span className="text-blue-600 dark:text-blue-400 font-medium">@{targetUsername}</span>
            </span>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Đóng khung trả lời"
              className="hover:text-[var(--thread-text)] transition-colors motion-reduce:transition-none shrink-0"
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={`Phản hồi @${targetUsername}...`}
            rows={2}
            className="w-full bg-background/70 dark:bg-zinc-950/80 border border-[var(--thread-surface-border)] rounded-xl p-2.5 text-sm text-[var(--thread-text)] placeholder:text-[var(--thread-text-muted)] outline-none focus:border-blue-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--thread-text-muted)] hover:text-[var(--thread-text)] hover:bg-[var(--thread-surface-hover)] transition-colors motion-reduce:transition-none"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors motion-reduce:transition-none disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send size={12} />
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPONENT: ThreadCommentNode (ĐỆ QUY)
// ==========================================

interface ThreadCommentNodeProps {
  comment: any;
  depth: number;
  actualDepth?: number;
  hideChildren?: boolean;
  hasBottomGap?: boolean;
  childrenMap: Map<string, any[]>;
  commentById: Map<string, any>;
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId?: string | null) => Promise<void> | void;
  currentUser: any;
  collapsedIds: Set<string>;
  onToggleCollapse: (commentId: string) => void;
  activeReplyTarget: any | null;
  onOpenReply: (targetComment: any) => void;
  onCloseReply: () => void;
}

function ThreadCommentNode({
  comment,
  depth,
  actualDepth,
  hideChildren = false,
  hasBottomGap = false,
  childrenMap,
  commentById,
  onLike,
  onReply,
  currentUser,
  collapsedIds,
  onToggleCollapse,
  activeReplyTarget,
  onOpenReply,
  onCloseReply,
}: ThreadCommentNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const commentId = String(comment._id);
  const effectiveDepth = actualDepth ?? depth;
  const isReply = effectiveDepth > 0;
  const isCollapsed = collapsedIds.has(commentId);
  const isReplyingHere = activeReplyTarget && String(activeReplyTarget._id) === commentId;

  const TRUNCATE_LENGTH = 250;
  const isLongComment = comment.content?.length > TRUNCATE_LENGTH;

  const directChildren = useMemo(
    () => (hideChildren ? [] : childrenMap.get(commentId) || []),
    [hideChildren, childrenMap, commentId]
  );

  const totalDescendants = useMemo(
    () => countCommentDescendants(commentId, childrenMap),
    [commentId, childrenMap]
  );

  // Chuẩn bị danh sách con ở tầng làm phẳng (Cấp 3 trở đi về cấp 2)
  const flattenedTailItems = useMemo(() => {
    if (hideChildren || isCollapsed || depth < MAX_VISUAL_DEPTH - 1) return null;

    const items: Array<{ comment: any; actualDepth: number }> = [];
    for (const child of directChildren) {
      const childId = String(child._id);
      items.push({
        comment: child,
        actualDepth: depth + 1,
      });

      if (!collapsedIds.has(childId)) {
        const subItems = flattenSubtreeDFS(childId, depth + 2, childrenMap);
        for (const sub of subItems) {
          if (!sub.ancestorIds.some((id) => collapsedIds.has(id))) {
            items.push({
              comment: sub.comment,
              actualDepth: sub.actualDepth,
            });
          }
        }
      }
    }
    return items;
  }, [hideChildren, isCollapsed, depth, directChildren, childrenMap, collapsedIds]);

  const hasVisibleChildren =
    !hideChildren &&
    (totalDescendants > 0 || (depth === 0 && isReplyingHere));

  const parentComment = useMemo(() => {
    if (!comment.parentId) return null;
    return commentById.get(String(comment.parentId)) || null;
  }, [comment.parentId, commentById]);

  const hasLiked = comment.likes?.includes(currentUser?._id);
  const likeCount = comment.likes?.length || 0;

  const timeAgo = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })
    : '';

  const isEdited = Boolean(
    comment.updatedAt &&
      comment.createdAt &&
      new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 5000
  );

  const displayedContent =
    isLongComment && !isExpanded
      ? `${comment.content.substring(0, TRUNCATE_LENGTH)}...`
      : comment.content;

  const mediaUrl = comment.image || comment.mediaUrl;

  const avatarSizeVar = isReply
    ? 'var(--thread-avatar-size-reply)'
    : 'var(--thread-avatar-size)';

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#comment-${commentId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Đã sao chép liên kết bình luận');
    } catch {
      toast.error('Không thể sao chép liên kết');
    }
  };

  // Kiểm tra xem ô nhập trả lời có đang mở bên trong nhánh gốc này không
  const isReplyActiveInSubtree = useMemo(() => {
    if (!activeReplyTarget) return false;
    const activeId = String(activeReplyTarget._id);
    if (activeId === commentId) return true;
    if (flattenedTailItems) {
      return flattenedTailItems.some((item) => String(item.comment._id) === activeId);
    }
    return false;
  }, [activeReplyTarget, commentId, flattenedTailItems]);

  const rowNode = (
    <div
      id={`comment-${commentId}`}
      className="w-full min-w-0"
      data-depth={effectiveDepth}
      data-comment-id={commentId}
    >
      {/* Hàng chính của bình luận: [Cột Avatar + Trunk Line] | [Cột Nội Dung] */}
      <div
        style={{ gap: 'var(--thread-gap)' }}
        className="flex items-stretch w-full min-w-0 group/comment-row"
      >
        {/* Cột 1: Gutter Avatar + Đường nối dọc (nếu có nhánh con hoặc đang trả lời) */}
        <div
          style={{ width: 'var(--thread-avatar-size)' }}
          className="flex flex-col items-center shrink-0 self-stretch"
        >
          <div
            style={{
              width: 'var(--thread-avatar-size)',
              height: 'var(--thread-avatar-size)',
            }}
            className="flex items-center justify-center shrink-0"
          >
            <div
              style={{ width: avatarSizeVar, height: avatarSizeVar }}
              className="rounded-full bg-[var(--thread-surface)] overflow-hidden shrink-0 border border-[var(--thread-surface-border)] shadow-sm flex items-center justify-center"
            >
              {comment.userId?.profile?.avatar ? (
                <img
                  src={comment.userId.profile.avatar}
                  className="w-full h-full object-cover"
                  alt={comment.userId?.username || 'Avatar'}
                />
              ) : (
                <User
                  className={`w-full h-full ${isReply ? 'p-1' : 'p-1.5'} text-[var(--thread-text-muted)]`}
                />
              )}
            </div>
          </div>

          {hasVisibleChildren && (
            <ThreadsCommentLine
              variant="trunk"
              onClick={() => onToggleCollapse(commentId)}
              ariaLabel={
                isCollapsed
                  ? `Mở ${totalDescendants} phản hồi`
                  : 'Thu gọn nhánh bình luận'
              }
            />
          )}
        </div>

        {/* Cột 2: Nội dung bình luận */}
        <div
          style={{
            paddingBottom:
              hasVisibleChildren || hasBottomGap ? 'var(--thread-row-gap)' : 0,
          }}
          className="flex-1 min-w-0"
        >
          {/* Header: Tên đậm, thời gian & nhãn phụ nhạt nhỏ hơn, nút "..." khi hover/focus */}
          <div className="flex items-center gap-2 mb-1 flex-wrap min-w-0">
            <span
              className={`font-bold text-[var(--thread-text)] truncate max-w-44 sm:max-w-xs ${
                isReply ? 'text-[13px]' : 'text-sm'
              }`}
            >
              {comment.userId?.username || 'Người dùng'}
            </span>

            <span className="text-[11px] text-[var(--thread-text-muted)] shrink-0">
              {timeAgo}
            </span>

            {isEdited && (
              <span className="text-[11px] text-[var(--thread-text-muted)] shrink-0">
                · Đã chỉnh sửa
              </span>
            )}

            {totalDescendants > 0 && (
              <button
                type="button"
                onClick={() => onToggleCollapse(commentId)}
                className="text-[11px] font-medium text-[var(--thread-text-muted)] hover:text-blue-500 dark:hover:text-blue-400 transition-colors motion-reduce:transition-none shrink-0"
              >
                {isCollapsed ? `· +${totalDescendants} phản hồi` : '· Thu gọn'}
              </button>
            )}

            {/* Nút "..." chỉ nổi bật khi hover/focus */}
            <div ref={menuRef} className="relative ms-auto shrink-0">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Tùy chọn bình luận"
                aria-expanded={menuOpen}
                className="p-1 rounded-full text-[var(--thread-text-muted)] hover:text-[var(--thread-text)] hover:bg-[var(--thread-surface-hover)] opacity-0 group-hover/comment-row:opacity-100 group-focus-within/comment-row:opacity-100 focus:opacity-100 transition-opacity motion-reduce:transition-none"
              >
                <MoreHorizontal size={14} />
              </button>

              {menuOpen && (
                <div className="absolute end-0 top-full mt-1 z-20 min-w-40 rounded-xl bg-popover text-popover-foreground border border-[var(--thread-surface-border)] shadow-lg p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      handleShare();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--thread-surface-hover)] text-start transition-colors motion-reduce:transition-none"
                  >
                    <Link2 size={13} />
                    <span>Sao chép liên kết</span>
                  </button>
                  {totalDescendants > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleCollapse(commentId);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--thread-surface-hover)] text-start transition-colors motion-reduce:transition-none"
                    >
                      <span>{isCollapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bubble nội dung bình luận */}
          <div className="bg-[var(--thread-surface)] hover:bg-[var(--thread-surface-hover)] p-3 rounded-2xl border border-[var(--thread-surface-border)] transition-colors motion-reduce:transition-none block w-full min-w-0 overflow-hidden">
            <p
              style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
              className="text-[var(--thread-text)] text-sm whitespace-pre-wrap break-words leading-relaxed max-w-full"
            >
              {isReply && parentComment?.userId?.username && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold me-1.5">
                  @{parentComment.userId.username}
                </span>
              )}
              {displayedContent}
            </p>

            {mediaUrl && (
              <div className="mt-2 overflow-hidden rounded-xl border border-[var(--thread-surface-border)] max-w-sm">
                <img
                  src={mediaUrl}
                  alt="Ảnh bình luận"
                  className="w-full h-auto max-h-72 object-cover"
                />
              </div>
            )}

            {isLongComment && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Hàng hành động: Thích, Trả lời, Chia sẻ cùng baseline + Badge lượt thích gọn */}
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 mt-1.5 text-xs text-[var(--thread-text-muted)]">
            <button
              type="button"
              onClick={() => onLike(comment._id)}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors motion-reduce:transition-none ${
                hasLiked
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'hover:text-[var(--thread-text)]'
              }`}
            >
              <ThumbsUp size={13} className={hasLiked ? 'fill-current' : ''} />
              <span>Thích</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isReplyingHere) {
                  onCloseReply();
                } else {
                  if (depth === 0 && isCollapsed) {
                    onToggleCollapse(commentId);
                  }
                  onOpenReply(comment);
                }
              }}
              className={`inline-flex items-center gap-1.5 font-medium transition-colors motion-reduce:transition-none ${
                isReplyingHere
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'hover:text-[var(--thread-text)]'
              }`}
            >
              <MessageSquare size={13} />
              <span>Trả lời</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 font-medium hover:text-[var(--thread-text)] transition-colors motion-reduce:transition-none"
            >
              <Share2 size={13} />
              <span>Chia sẻ</span>
            </button>

            {likeCount > 0 && (
              <span className="ms-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--thread-surface)] border border-[var(--thread-surface-border)] text-[11px] font-medium text-[var(--thread-text-muted)]">
                <ThumbsUp size={11} className="text-blue-500 fill-blue-500" />
                <span>{likeCount}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Khu vực các phản hồi con / "Xem N phản hồi" / Ô nhập trả lời trong nhánh */}
      {hasVisibleChildren && (
        <div className="w-full min-w-0">
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                key="expanded-replies"
                initial={
                  shouldReduceMotion
                    ? false
                    : { height: 0, overflow: 'hidden' }
                }
                animate={{
                  height: 'auto',
                  transitionEnd: { overflow: 'visible' },
                }}
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { height: 0, overflow: 'hidden' }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.26,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full min-w-0"
              >
                {flattenedTailItems ? (
                  <>
                    {flattenedTailItems.map((item, idx) => {
                      const itemId = String(item.comment._id);
                      const isItemReplyTarget =
                        activeReplyTarget && String(activeReplyTarget._id) === itemId;
                      const hasMoreItemsAfter =
                        idx < flattenedTailItems.length - 1 || isReplyingHere;
                      const isItemBranchLast =
                        !hasMoreItemsAfter && !isItemReplyTarget && !isCollapsed;

                      return (
                        <React.Fragment key={itemId}>
                          <div
                            style={{ gap: 'var(--thread-gap)' }}
                            className="flex items-stretch w-full min-w-0"
                          >
                            <ThreadsCommentLine
                              variant="branch"
                              isLast={isItemBranchLast}
                              isReplyTarget={true}
                            />
                            <div className="flex-1 min-w-0">
                              <ThreadCommentNode
                                comment={item.comment}
                                depth={depth + 1}
                                actualDepth={item.actualDepth}
                                hideChildren={true}
                                hasBottomGap={!isItemBranchLast}
                                childrenMap={childrenMap}
                                commentById={commentById}
                                onLike={onLike}
                                onReply={onReply}
                                currentUser={currentUser}
                                collapsedIds={collapsedIds}
                                onToggleCollapse={onToggleCollapse}
                                activeReplyTarget={activeReplyTarget}
                                onOpenReply={onOpenReply}
                                onCloseReply={onCloseReply}
                              />
                            </div>
                          </div>

                          {isItemReplyTarget && (
                            <InlineReplyComposer
                              targetComment={activeReplyTarget}
                              currentUser={currentUser}
                              isLast={!hasMoreItemsAfter}
                              hasBottomGap={hasMoreItemsAfter}
                              onSubmit={onReply}
                              onCancel={onCloseReply}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {isReplyingHere && (
                      <InlineReplyComposer
                        targetComment={activeReplyTarget}
                        currentUser={currentUser}
                        isLast={true}
                        hasBottomGap={false}
                        onSubmit={onReply}
                        onCancel={onCloseReply}
                      />
                    )}
                  </>
                ) : (
                  directChildren.map((child, idx) => {
                    const isLast = idx === directChildren.length - 1 && !isCollapsed;
                    return (
                      <div
                        key={child._id}
                        style={{ gap: 'var(--thread-gap)' }}
                        className="flex items-stretch w-full min-w-0"
                      >
                        <ThreadsCommentLine
                          variant="branch"
                          isLast={isLast}
                          isReplyTarget={true}
                        />
                        <div className="flex-1 min-w-0">
                          <ThreadCommentNode
                            comment={child}
                            depth={depth + 1}
                            hasBottomGap={!isLast}
                            childrenMap={childrenMap}
                            commentById={commentById}
                            onLike={onLike}
                            onReply={onReply}
                            currentUser={currentUser}
                            collapsedIds={collapsedIds}
                            onToggleCollapse={onToggleCollapse}
                            activeReplyTarget={activeReplyTarget}
                            onOpenReply={onOpenReply}
                            onCloseReply={onCloseReply}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isCollapsed && (
            <div
              style={{ gap: 'var(--thread-gap)' }}
              className="flex items-stretch w-full min-w-0"
            >
              <ThreadsCommentLine variant="branch" isLast={true} isReplyTarget={false} />
              <div className="flex-1 min-w-0 flex items-center">
                <button
                  type="button"
                  onClick={() => onToggleCollapse(commentId)}
                  style={{ minHeight: 'var(--thread-avatar-size)' }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--thread-text-muted)] hover:text-blue-500 dark:hover:text-blue-400 transition-colors motion-reduce:transition-none py-1"
                >
                  <span>Xem {totalDescendants} phản hồi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Bọc cấp gốc bằng group hover/focus để làm đậm toàn bộ line trong nhánh đồng bộ
  if (depth === 0) {
    return (
      <div
        style={
          isReplyActiveInSubtree
            ? ({ '--thread-active-line': 'var(--thread-line-hover)' } as React.CSSProperties)
            : undefined
        }
        className="w-full min-w-0 hover:[--thread-active-line:var(--thread-line-hover)] focus-within:[--thread-active-line:var(--thread-line-hover)]"
      >
        {rowNode}
      </div>
    );
  }

  return rowNode;
}

// ==========================================
// 3. COMPONENT: CommentThread
// ==========================================

export interface CommentThreadProps {
  comments: any[];
  allComments?: any[];
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId?: string | null) => Promise<void> | void;
  currentUser: any;
}

export function CommentThread({
  comments,
  allComments,
  onLike,
  onReply,
  currentUser,
}: CommentThreadProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [activeReplyTarget, setActiveReplyTarget] = useState<any | null>(null);

  const source = allComments || comments || [];

  const childrenMap = useMemo(() => buildCommentChildrenMap(source), [source]);

  const commentById = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of source) {
      if (c && c._id) map.set(String(c._id), c);
    }
    return map;
  }, [source]);

  const rootNodes = useMemo(() => {
    if (Array.isArray(comments) && comments.length > 0) {
      const hasParent = comments.some((c) => c.parentId);
      return hasParent ? comments.filter((c) => !c.parentId) : comments;
    }
    return childrenMap.get('__root__') || [];
  }, [comments, childrenMap]);

  const handleToggleCollapse = (commentId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <div
      style={{ gap: 'var(--thread-thread-gap)' }}
      className="flex flex-col w-full max-w-full min-w-0"
    >
      {rootNodes.map((root) => (
        <ThreadCommentNode
          key={root._id}
          comment={root}
          depth={0}
          childrenMap={childrenMap}
          commentById={commentById}
          onLike={onLike}
          onReply={onReply}
          currentUser={currentUser}
          collapsedIds={collapsedIds}
          onToggleCollapse={handleToggleCollapse}
          activeReplyTarget={activeReplyTarget}
          onOpenReply={setActiveReplyTarget}
          onCloseReply={() => setActiveReplyTarget(null)}
        />
      ))}
    </div>
  );
}

// ==========================================
// 4. COMPONENT: CommentItem (BACKWARD COMPATIBILITY)
// ==========================================

export interface CommentItemProps {
  comment?: any;
  comments?: any[];
  allComments?: any[];
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId?: string | null) => Promise<void> | void;
  currentUser: any;
  depth?: number;
}

export default function CommentItem({
  comment,
  comments,
  allComments,
  onLike,
  onReply,
  currentUser,
}: CommentItemProps) {
  if (comments && Array.isArray(comments)) {
    return (
      <CommentThread
        comments={comments}
        allComments={allComments || comments}
        onLike={onLike}
        onReply={onReply}
        currentUser={currentUser}
      />
    );
  }

  if (comment) {
    const list = allComments || [comment];
    return (
      <CommentThread
        comments={[comment]}
        allComments={list}
        onLike={onLike}
        onReply={onReply}
        currentUser={currentUser}
      />
    );
  }

  return null;
}
