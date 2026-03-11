'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-zinc-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
    >
      <ArrowLeft size={16} />
      <span className="text-sm font-medium">Quay lại</span>
    </button>
  );
}