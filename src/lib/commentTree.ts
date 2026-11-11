// src/lib/commentTree.ts

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
    // Với các con của node này:
    // Nếu ở cấp root (depth === 0), con cấp 1 chưa có cột tổ tiên nào (chỉ có cột elbow của chính nó)
    // Nếu ở cấp con (depth > 0), con cấp tiếp theo sẽ tích lũy thêm trạng thái !isLast của node cha
    const nextAncestorStack = depth === 0
      ? []
      : [...ancestorHasNextSibling, !isLast];
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
