// src/app/(dashboard)/booster/services/layout.tsx
'use client';

import { ReactNode } from 'react';

export default function BoosterServicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 p-4 md:p-8">
       {children}
    </div>
  );
}
