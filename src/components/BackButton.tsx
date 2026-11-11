'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export default function BackButton({
  fallbackUrl = '/boosters',
  label = 'Quay lại',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // If there is valid browser history within our website, go back
    if (
      typeof window !== 'undefined' &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      router.back();
    } else {
      // Fallback safely to booster list or designated route
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-900/80 border border-white/10 hover:border-blue-500/50 rounded-xl text-zinc-300 hover:text-white transition-all backdrop-blur-md shadow-md hover:shadow-blue-500/10 active:scale-95 ${className}`}
      title={label}
    >
      <ArrowLeft size={16} className="text-zinc-400 group-hover:text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
