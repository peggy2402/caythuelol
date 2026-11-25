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

export default StarIcon;
