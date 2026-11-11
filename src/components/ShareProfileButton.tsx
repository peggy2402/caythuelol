'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, Facebook, Send, Twitter, X } from 'lucide-react';
import { toast } from 'sonner';

interface ShareProfileButtonProps {
  username: string;
  displayName?: string;
  role?: string;
}

export default function ShareProfileButton({
  username,
  displayName,
}: ShareProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const name = displayName || username;
  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/b/${username}`
    : `https://www.leorank.site/b/${username}`;

  const shareText = `Thuê Booster ${name} cày thuê LMHT uy tín, tỉ lệ thắng cao trên LeoRank:`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.createElement('input');
        input.value = currentUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success('Đã sao chép liên kết hồ sơ!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép liên kết.');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Hồ sơ Booster ${name} - LeoRank`,
          text: shareText,
          url: currentUrl,
        });
        return;
      } catch {
        // User cancelled or unsupported, fallback to modal
      }
    }
    setIsOpen(true);
  };

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <>
      <button
        onClick={handleNativeShare}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium rounded-xl border border-zinc-700/60 hover:border-zinc-500 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 text-sm"
        title="Chia sẻ hồ sơ"
      >
        <Share2 size={18} className="text-blue-400" />
        <span>Chia sẻ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Chia sẻ hồ sơ Booster</h3>
                  <p className="text-xs text-zinc-400">Giới thiệu {name} tới bạn bè và cộng đồng</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Link Copy Box */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Liên kết trực tiếp
              </label>
              <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-xl p-1.5 focus-within:border-blue-500 transition-colors">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-transparent flex-1 text-sm text-zinc-300 px-3 outline-none select-all font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shrink-0 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-green-300" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
                Chia sẻ qua mạng xã hội
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-800/60 hover:bg-blue-600/20 border border-zinc-700/50 hover:border-blue-500/40 text-zinc-300 hover:text-blue-400 transition-all group"
                >
                  <Facebook size={20} className="group-hover:scale-110 transition-transform text-[#1877F2]" />
                  <span className="text-xs font-medium">Facebook</span>
                </a>

                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-800/60 hover:bg-sky-600/20 border border-zinc-700/50 hover:border-sky-500/40 text-zinc-300 hover:text-sky-400 transition-all group"
                >
                  <Send size={20} className="group-hover:scale-110 transition-transform text-[#229ED9]" />
                  <span className="text-xs font-medium">Telegram</span>
                </a>

                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/40 border border-zinc-700/50 hover:border-zinc-500 text-zinc-300 hover:text-white transition-all group"
                >
                  <Twitter size={20} className="group-hover:scale-110 transition-transform text-[#1DA1F2]" />
                  <span className="text-xs font-medium">Twitter / X</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
