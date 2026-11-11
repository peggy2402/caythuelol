'use client';

import { useState, useMemo } from 'react';
import { User, ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Send, X, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// ==========================================
// 1. DATA TYPES & FLATTEN DFS ALGORITHM
// ==========================================

export interface FlatCommentNode {
  comment: any;
  depth: number;
  isLastSibling: boolean;
  ancestorHasNextSibling: boolean[]; // Chiều dài = depth. Mỗi vị trí cho biết tổ tiên ở cấp đó có sibling phía sau không
  ancestorIds: string[];             // Danh sách ID tổ tiên từ root xuống parent trực tiếp (dùng cho collapse filter)
  replyCount: number;                // Tổng số lượng phản hồi con cháu
}

/**
 * Biến đổi danh sách comment lồng nhau (qua parentId) thành Mảng 1 chiều theo thứ tự DFS.
 * Mỗi node được gán sẵn depth, isLastSibling và ancestorHasNextSibling để Row tự render line.
 */
export function flattenComments(
  comments: any[],
  allComments?: any[]
): FlatCommentNode[] {
  const source = allComments || comments || [];
  if (!source || source.length === 0) return [];

  // Gom nhóm comment theo parentId
  const childrenMap = new Map<string | null, any[]>();
  for (const c of source) {
    const pId = c.parentId ? String(c.parentId) : null;
    if (!childrenMap.has(pId)) {
      childrenMap.set(pId, []);
    }
    childrenMap.get(pId)!.push(c);
  }

  // Sắp xếp các sibling theo thời gian cũ -> mới
  for (const list of childrenMap.values()) {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Hàm đếm tổng số con cháu của 1 node
  function countDescendants(id: string): number {
    const children = childrenMap.get(String(id)) || [];
    let count = children.length;
    for (const ch of children) {
      count += countDescendants(String(ch._id));
    }
    return count;
  }

  const result: FlatCommentNode[] = [];

  function dfs(
    node: any,
    depth: number,
    isLast: boolean,
    ancestorHasNextSibling: boolean[],
    ancestorIds: string[]
  ) {
    const nodeIdStr = String(node._id);
    const replyCount = countDescendants(nodeIdStr);

    result.push({
      comment: node,
      depth,
      isLastSibling: isLast,
      ancestorHasNextSibling,
      ancestorIds,
      replyCount,
    });

    const children = childrenMap.get(nodeIdStr) || [];
    // Với các con của node này, ancestor stack mở rộng thêm cờ !isLast (node có còn anh em phía sau không)
    const nextAncestorStack = [...ancestorHasNextSibling, !isLast];
    const nextAncestorIds = [...ancestorIds, nodeIdStr];

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const isChildLast = i === children.length - 1;
      dfs(child, depth + 1, isChildLast, nextAncestorStack, nextAncestorIds);
    }
  }

  // Xác định danh sách root nodes cần duyệt
  let rootNodes: any[] = [];
  if (Array.isArray(comments) && comments.length > 0) {
    // Nếu truyền danh sách roots cụ thể
    const hasParentIds = comments.some(c => c.parentId);
    if (hasParentIds) {
      rootNodes = comments.filter(c => !c.parentId);
    } else {
      rootNodes = comments;
    }
  } else {
    rootNodes = childrenMap.get(null) || [];
  }

  for (let i = 0; i < rootNodes.length; i++) {
    const root = rootNodes[i];
    const isRootLast = i === rootNodes.length - 1;
    dfs(root, 0, isRootLast, [], []);
  }

  return result;
}

// ==========================================
// 2. COMPONENT: CommentRow (RENDER PHẲNG)
// ==========================================

export interface CommentRowProps {
  node: FlatCommentNode;
  allComments: any[];
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId: string) => void;
  currentUser: any;
  isCollapsed: boolean;
  onToggleCollapse: (commentId: string) => void;
}

export function CommentRow({
  node,
  allComments,
  onLike,
  onReply,
  currentUser,
  isCollapsed,
  onToggleCollapse,
}: CommentRowProps) {
  const { comment, depth, isLastSibling, ancestorHasNextSibling, replyCount } = node;
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const TRUNCATE_LENGTH = 250;
  const isLongComment = comment.content?.length > TRUNCATE_LENGTH;
  const isReply = depth > 0;

  // Tìm người được trả lời nếu là comment con
  const parentComment = useMemo(() => {
    if (!comment.parentId) return null;
    return allComments?.find((c: any) => String(c._id) === String(comment.parentId)) || null;
  }, [comment.parentId, allComments]);

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

  return (
    <div
      className="flex items-start w-full min-w-0 pb-3.5 group/comment-row"
      data-depth={depth}
      data-comment-id={comment._id}
    >
      {/* CỘT 1: Gutter - Cột các đường line dọc & elbow connector (Chỉ render nếu depth > 0) */}
      {depth > 0 && (
        <div className="flex shrink-0 self-stretch pointer-events-none select-none">
          {/* A. Các cột tổ tiên phía trước (depth - 1 cột): Mỗi cột có width cố định w-5 sm:w-6 */}
          {ancestorHasNextSibling.slice(0, depth - 1).map((hasLine, colIdx) => (
            <div key={colIdx} className="w-5 sm:w-6 shrink-0 relative flex justify-center self-stretch">
              {hasLine && (
                <div className="w-[2px] h-full bg-zinc-800" />
              )}
            </div>
          ))}

          {/* B. Cột Elbow connector (Cột depth - 1): Nối trực tiếp vào avatar của row hiện tại */}
          <div className="w-5 sm:w-6 shrink-0 relative self-stretch">
            {/* Nếu row này không phải là con cuối cùng trong sibling, line dọc tiếp tục kéo hết chiều cao row */}
            {!isLastSibling && (
              <div className="w-[2px] h-full bg-zinc-800 absolute left-1/2 -translate-x-1/2 top-0" />
            )}
            {/* Góc cong Elbow (└ hoặc ├) có chiều cao cố định đúng bằng nửa chiều cao avatar (14px sm:16px) */}
            <div className="absolute left-1/2 top-0 w-1/2 h-[14px] sm:h-[16px] border-l-2 border-b-2 border-zinc-800 rounded-bl-xl pointer-events-none" />
          </div>
        </div>
      )}

      {/* CỘT 2: Avatar (Kích thước chuẩn w-7 h-7 khi là reply, w-8 h-8 khi là root) */}
      <div className="w-8 shrink-0 flex items-center justify-center mr-2.5 sm:mr-3">
        <div
          className={`${
            isReply ? 'w-7 h-7' : 'w-8 h-8'
          } rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-zinc-700/80 shadow-sm flex items-center justify-center`}
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

      {/* CỘT 3: Nội dung bình luận (flex-1 min-w-0 tự co giãn an toàn tuyệt đối) */}
      <div className="flex-1 min-w-0">
        {/* Header: Username, badge Cấp X, tag @reply, thời gian, nút thu gọn */}
        <div className="flex items-center gap-2 mb-1 flex-wrap min-w-0">
          <span className={`font-bold text-white truncate max-w-[160px] sm:max-w-xs ${isReply ? 'text-xs' : 'text-sm'}`}>
            {comment.userId?.username || 'Người dùng'}
          </span>

          {/* Badge cấp độ khi lồng sâu từ cấp 4 (depth >= 3) */}
          {depth >= 3 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 shrink-0">
              Cấp {depth + 1}
            </span>
          )}

          {/* Tag người được trả lời */}
          {parentComment?.userId?.username && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 truncate max-w-[130px] sm:max-w-[180px]">
              <CornerDownRight className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">@{parentComment.userId.username}</span>
            </span>
          )}

          <span className="text-xs text-zinc-500 shrink-0">{timeAgo}</span>

          {/* Nút thu gọn / mở rộng chuỗi nếu có phản hồi con cháu */}
          {replyCount > 0 && (
            <button
              onClick={() => onToggleCollapse(comment._id)}
              className="ml-auto text-xs text-zinc-500 hover:text-blue-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5 shrink-0"
            >
              {isCollapsed ? `+${replyCount} phản hồi` : 'Thu gọn'}
            </button>
          )}
        </div>

        {/* Khung nội dung comment */}
        <div className="bg-zinc-900/60 hover:bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 transition-colors block w-full min-w-0 shadow-sm overflow-hidden">
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
          <form
            onSubmit={handleReplySubmit}
            className="mt-3 flex flex-col gap-2 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-200 w-full min-w-0"
          >
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>
                Trả lời <strong className="text-white">@{comment.userId?.username}</strong>
              </span>
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
              placeholder="Nhập phản hồi của bạn..."
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
      </div>
    </div>
  );
}

// ==========================================
// 3. COMPONENT: CommentThread (QUẢN LÝ FLATTEN & COLLAPSE)
// ==========================================

export interface CommentThreadProps {
  comments: any[];
  allComments?: any[];
  onLike: (commentId: string) => void;
  onReply: (content: string, parentId: string) => void;
  currentUser: any;
}

export function CommentThread({
  comments,
  allComments,
  onLike,
  onReply,
  currentUser,
}: CommentThreadProps) {
  // Tập hợp các commentId đang bị thu gọn (collapsed)
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Làm phẳng cây một lần theo DFS O(N)
  const flatNodes = useMemo(() => {
    return flattenComments(comments, allComments || comments);
  }, [comments, allComments]);

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

  // Lọc các node con cháu của những node đang bị collapse
  const visibleNodes = useMemo(() => {
    if (collapsedIds.size === 0) return flatNodes;
    return flatNodes.filter((node) => {
      // Nếu bất kỳ tổ tiên nào của node này nằm trong collapsedIds -> ẩn node này
      return !node.ancestorIds.some((id) => collapsedIds.has(id));
    });
  }, [flatNodes, collapsedIds]);

  return (
    <div className="w-full max-w-full min-w-0">
      {visibleNodes.map((node) => (
        <CommentRow
          key={node.comment._id}
          node={node}
          allComments={allComments || comments}
          onLike={onLike}
          onReply={onReply}
          currentUser={currentUser}
          isCollapsed={collapsedIds.has(node.comment._id)}
          onToggleCollapse={handleToggleCollapse}
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
  onReply: (content: string, parentId: string) => void;
  currentUser: any;
  depth?: number;
}

/**
 * CommentItem giữ nguyên API đầu vào để tương thích 100% với BlogDetailClient.tsx.
 * Bên trong tự động làm phẳng toàn bộ nhánh con thành các CommentRow phẳng.
 */
export default function CommentItem({
  comment,
  comments,
  allComments,
  onLike,
  onReply,
  currentUser,
}: CommentItemProps) {
  // Nếu truyền mảng comments (toàn bộ danh sách)
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

  // Nếu truyền từng comment đơn lẻ (cách gọi cũ từ BlogDetailClient)
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