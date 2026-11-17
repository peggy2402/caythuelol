'use client';

import React from 'react';

export type ThreadsCommentLineVariant = 'trunk' | 'branch';

export interface ThreadsCommentLineProps {
  /**
   * - `trunk`: Đường dọc nối từ dưới avatar bình luận cha xuống danh sách phản hồi con.
   * - `branch`: Đường nhánh ở cột gutter của bình luận con (gồm đường cong elbow và đường dọc nối tiếp nếu chưa phải con cuối).
   */
  variant: ThreadsCommentLineVariant;
  /** Có phải nhánh con cuối cùng không (chỉ dùng cho `branch`). Nếu true, đường dọc sẽ dừng tại góc cong. */
  isLast?: boolean;
  /** Nhánh có đang nối tới avatar kích thước reply (`--thread-avatar-size-reply`) hay không. */
  isReplyTarget?: boolean;
  /** Tùy chọn click vào đường trunk để thu gọn/mở rộng nhánh bình luận. */
  onClick?: () => void;
  /** Nhãn hỗ trợ accessibility khi line có thể click. */
  ariaLabel?: string;
}

/**
 * Component vẽ đường nối bình luận phong cách Threads/Facebook (Layout-driven, 100% dựa trên CSS tokens).
 * Hỗ trợ tự co giãn theo chiều cao nội dung, dark/light mode, reduced motion và RTL qua logical properties.
 */
export function ThreadsCommentLine({
  variant,
  isLast = false,
  isReplyTarget = true,
  onClick,
  ariaLabel,
}: ThreadsCommentLineProps) {
  if (variant === 'trunk') {
    const lineClassName =
      'block h-full rounded-t-full bg-[var(--thread-active-line,var(--thread-line-color))] transition-colors motion-reduce:transition-none';

    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel || 'Thu gọn nhánh bình luận'}
          title={ariaLabel || 'Thu gọn nhánh bình luận'}
          style={{ paddingTop: 'calc(var(--thread-gap) / 2)' }}
          className="group/thread-line relative flex w-full flex-1 min-h-0 justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <span
            aria-hidden="true"
            style={{ width: 'var(--thread-line-width)' }}
            className={`${lineClassName} group-hover/thread-line:bg-[var(--thread-line-hover)]`}
          />
        </button>
      );
    }

    return (
      <div
        aria-hidden="true"
        style={{ paddingTop: 'calc(var(--thread-gap) / 2)' }}
        className="relative flex w-full flex-1 min-h-0 justify-center pointer-events-none select-none"
      >
        <span
          style={{ width: 'var(--thread-line-width)' }}
          className={lineClassName}
        />
      </div>
    );
  }

  // variant === 'branch'
  const lineStartOffset = 'calc(50% - var(--thread-line-width) / 2)';
  const elbowWidth = isReplyTarget
    ? 'calc(50% + var(--thread-line-width) / 2 + var(--thread-gap) + (var(--thread-avatar-size) - var(--thread-avatar-size-reply)) / 2)'
    : 'calc(50% + var(--thread-line-width) / 2)';
  const elbowHeight = 'calc(var(--thread-avatar-size) / 2 + var(--thread-line-width) / 2)';
  const effectiveRadius = 'min(var(--thread-curve-radius), calc(var(--thread-avatar-size) / 2))';
  const continuationTop = `calc(${elbowHeight} - ${effectiveRadius})`;

  return (
    <div
      aria-hidden="true"
      style={{ width: 'var(--thread-avatar-size)' }}
      className="relative shrink-0 self-stretch pointer-events-none select-none"
    >
      {/* Đường dọc nối tiếp bắt đầu từ điểm tiếp tuyến của góc cong xuống đáy hàng (không chồng lên đoạn thẳng phía trên của elbow) */}
      {!isLast && (
        <div
          style={{
            insetInlineStart: lineStartOffset,
            top: continuationTop,
            width: 'var(--thread-line-width)',
          }}
          className="absolute bottom-0 bg-[var(--thread-active-line,var(--thread-line-color))] transition-colors motion-reduce:transition-none"
        />
      )}

      {/* Đường cong elbow nối từ đường dọc cha vào tâm avatar của phần tử hiện tại */}
      <div
        style={{
          insetInlineStart: lineStartOffset,
          width: elbowWidth,
          height: elbowHeight,
          borderTopWidth: 0,
          borderInlineEndWidth: 0,
          borderInlineStartWidth: 'var(--thread-line-width)',
          borderBlockEndWidth: 'var(--thread-line-width)',
          borderEndStartRadius: effectiveRadius,
        }}
        className="absolute top-0 border-solid border-[var(--thread-active-line,var(--thread-line-color))] transition-colors motion-reduce:transition-none"
      />
    </div>
  );
}

export default ThreadsCommentLine;
