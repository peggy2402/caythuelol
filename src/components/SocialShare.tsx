'use client';

import { Facebook, Twitter, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
  url: string;
  title: string;
}

export default function SocialShare({ url, title }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết!');
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-zinc-400">Chia sẻ:</span>
      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white transition-colors"><Facebook size={16} /></a>
      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-zinc-800 hover:bg-sky-500 text-zinc-400 hover:text-white transition-colors"><Twitter size={16} /></a>
      <button onClick={copyLink} className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-600 text-zinc-400 hover:text-white transition-colors"><LinkIcon size={16} /></button>
    </div>
  );
}