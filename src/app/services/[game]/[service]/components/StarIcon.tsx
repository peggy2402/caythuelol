import React from 'react';

interface StarIconProps {
  size?: number;
  className?: string;
}

export function StarIcon({ size = 14, className = '' }: StarIconProps) {
  return (
    <img
      src="/images/icons/star.png"
      alt="★"
      style={{ width: size, height: size }}
      className={`inline-block object-contain shrink-0 align-middle ${className}`}
    />
  );
}

/**
 * Tự động tìm ký tự '★' trong chuỗi và render bằng hình ảnh StarIcon (/images/icons/star.png)
 */
export function renderWithStarIcon(text: React.ReactNode, size = 14, className = ''): React.ReactNode {
  if (typeof text !== 'string') return text;
  if (!text || !text.includes('★')) return text;
  const parts = text.split('★');
  return (
    <>
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {part}
          {idx < parts.length - 1 && (
            <StarIcon size={size} className={`mx-0.5 inline-block -translate-y-[1px] ${className}`} />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default StarIcon;
