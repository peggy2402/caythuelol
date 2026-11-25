'use client';

import React from 'react';
import { Lock } from 'lucide-react';

export function ProviderLogo({
  provider,
  className = 'w-5 h-5',
}: {
  provider: string;
  className?: string;
}) {
  const p = (provider || '').trim();
  switch (p) {
    case 'Garena':
      return (
        <img
          src="/images/logo-aov/logo-garena.png"
          alt="Garena"
          className={`${className} object-contain shrink-0`}
        />
      );
    case 'Facebook':
      return (
        <img
          src="/images/logo-aov/logo-facebook.png"
          alt="Facebook"
          className={`${className} object-contain shrink-0`}
        />
      );
    case 'Apple':
      return (
        <img
          src="/images/logo-aov/logo-apple.png"
          alt="Apple"
          className={`${className} object-contain shrink-0`}
        />
      );
    case 'Google':
      return (
        <img
          src="/images/logo-aov/logo-google.png"
          alt="Google"
          className={`${className} object-contain shrink-0`}
        />
      );
    case 'Riot':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#EF4444">
          <path d="M13.43 2.18L2.09 7.64l3.19 11.75 4.67-1.3-1.63-6 1.7-.47 1.25 4.61 2.55-.71-1.25-4.61 1.7-.47 1.25 4.61 2.55-.71-1.6-5.89 2.45-.68.84 3.09 2.5-.7L21.91 2.6l-8.48-.42zM3.48 20.37l4.9-1.36.95 3.49-4.9 1.36-.95-3.49z" />
        </svg>
      );
    case 'Xbox':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#107C10">
          <path d="M4.64 3.58C6.67 1.84 9.22.8 12 .8c2.78 0 5.33 1.04 7.36 2.78-1.53 1.57-3.8 3.8-5.32 5.37-.36.38-.72.76-1.07 1.14-.38-.41-.75-.8-1.12-1.2-1.53-1.63-3.69-3.79-5.21-5.31zm-2.8 3.65C.66 9.17 0 11.49 0 14c0 3.89 1.63 7.38 4.22 9.87C3.2 21.2 2.3 17.5 2.8 14c.3-2.1.8-4.5 1.9-6.6l-2.86-.17zm20.32 0l-2.86.17c1.1 2.1 1.6 4.5 1.9 6.6.5 3.5-.4 7.2-1.42 9.87 2.59-2.49 4.22-5.98 4.22-9.87 0-2.51-.66-4.83-1.84-6.77zM12 12.3c.6 0 1.2.3 1.5.8 1.4 2.1 3.5 5.5 4.6 8.8C16.3 23.2 14.2 24 12 24s-4.3-.8-6.1-2.1c1.1-3.3 3.2-6.7 4.6-8.8.3-.5.9-.8 1.5-.8z" />
        </svg>
      );
    case 'PlayStation':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#003791">
          <path d="M8.07 4.62c0-.55.45-1 .99-1h3.76c2.72 0 4.93 2.21 4.93 4.93 0 2.22-1.47 4.1-3.5 4.72v-2.09c1-.48 1.69-1.49 1.69-2.67 0-1.62-1.32-2.94-2.94-2.94H10.9v10.5h-2.83V4.62zm-6.2 12.51c-.69-.47-1.1-1.25-1.1-2.08 0-1.21.87-2.22 2.05-2.43 1.83-.33 5.48-.96 5.48-.96l-1.07 1.88-3.48.58c-.51.08-.88.52-.88 1.04 0 .39.21.75.55.94l6.09 3.52-2.61.94-5.03-3.43zm11.97.94l6.09-3.52c.34-.19.55-.55.55-.94 0-.52-.37-.96-.88-1.04l-3.48-.58-1.07-1.88s3.65.63 5.48.96c1.18.21 2.05 1.22 2.05 2.43 0 .83-.41 1.61-1.1 2.08l-5.03 3.43-2.61-.94z" />
        </svg>
      );
    default:
      return <Lock className={className} />;
  }
}

export default ProviderLogo;
