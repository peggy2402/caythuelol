// src/lib/commentTree.ts

export const MAX_VISUAL_DEPTH = 1;

export interface FlattenedSubtreeItem {
  comment: any;
  actualDepth: number;
  ancestorIds: string[];
}

/**
 * Gom nhóm toàn bộ bình luận theo parentId và sắp xếp theo thời gian cũ -> mới.
 */
export function buildCommentChildrenMap(allComments: any[]): Map<string, any[]> {
  const childrenMap = new Map<string, any[]>();
  if (!Array.isArray(allComments)) return childrenMap;

  for (const c of allComments) {
    if (!c || !c._id) continue;
    const key = c.parentId ? String(c.parentId) : '__root__';
    const list = childrenMap.get(key);
    if (list) {
      list.push(c);
    } else {
      childrenMap.set(key, [c]);
    }
  }

  for (const list of childrenMap.values()) {
    list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  return childrenMap;
}

/**
 * Đếm tổng số phản hồi con cháu của một bình luận.
 */
export function countCommentDescendants(
  commentId: string,
  childrenMap: Map<string, any[]>
): number {
  const children = childrenMap.get(String(commentId)) || [];
  let count = children.length;
  for (const child of children) {
    count += countCommentDescendants(String(child._id), childrenMap);
  }
  return count;
}

/**
 * Làm phẳng nhánh con theo thứ tự DFS khi đạt giới hạn thụt lề tối đa (MAX_VISUAL_DEPTH),
 * giúp không bị tràn ngang trên màn hình nhỏ mà vẫn giữ được thứ tự và khả năng thu gọn.
 */
export function flattenSubtreeDFS(
  rootId: string,
  baseDepth: number,
  childrenMap: Map<string, any[]>
): FlattenedSubtreeItem[] {
  const result: FlattenedSubtreeItem[] = [];

  function walk(parentId: string, depth: number, ancestorIds: string[]) {
    const children = childrenMap.get(parentId) || [];
    for (const child of children) {
      const childId = String(child._id);
      result.push({
        comment: child,
        actualDepth: depth,
        ancestorIds,
      });
      walk(childId, depth + 1, [...ancestorIds, childId]);
    }
  }

  walk(String(rootId), baseDepth, []);
  return result;
}
