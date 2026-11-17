'use client';

import React, { useState, useEffect } from 'react';

interface BoosterAvatarProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function BoosterAvatar({
  src,
  alt,
  className = 'w-full h-full object-cover',
}: BoosterAvatarProps) {
  const [imgSrc, setImgSrc] = useState(src || '/default-avatar.png');

  useEffect(() => {
    setImgSrc(src || '/default-avatar.png');
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => {
        if (imgSrc !== '/default-avatar.png') {
          setImgSrc('/default-avatar.png');
        }
      }}
    />
  );
}
