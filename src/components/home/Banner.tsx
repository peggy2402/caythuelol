'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function Banner() {
  const [banner, setBanner] = useState<{ active: boolean; imageUrl: string; link?: string } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/public/system-config');
        if (res.ok) {
          const data = await res.json();
          if (data.banner && data.banner.active) {
            setBanner(data.banner);
          }
        }
      } catch (error) {
        console.error('Failed to load banner');
      }
    };

    fetchConfig();
  }, []);

  if (!banner || !banner.active || !isVisible) return null;

  const Content = () => (
    <div className="relative w-full h-auto min-h-[60px] md:min-h-[80px] bg-zinc-900 border-b border-zinc-800 overflow-hidden">
      <img src={banner.imageUrl} alt="Announcement" className="w-full h-full object-cover" />
      <button 
        onClick={(e) => { e.preventDefault(); setIsVisible(false); }}
        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return banner.link ? (
    <Link href={banner.link} className="block"><Content /></Link>
  ) : <Content />;
}