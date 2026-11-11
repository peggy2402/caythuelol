'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function MasteryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Mastery Service Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Đã có lỗi xảy ra</h2>
      <p className="text-zinc-400 text-sm max-w-md mb-6">
        Không thể tải thông tin dịch vụ Cày Thông Thạo. Vui lòng thử lại hoặc chọn lại Booster khác.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
        >
          <RotateCcw className="w-4 h-4" /> Thử lại
        </button>

        <Link
          href="/services/lol/mastery"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-all border border-zinc-700"
        >
          <ArrowLeft className="w-4 h-4" /> Bỏ chọn Booster
        </Link>
      </div>
    </div>
  );
}
