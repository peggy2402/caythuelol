'use client';

interface BoostersPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function BoostersPagination({ page, totalPages, onPageChange }: BoostersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center mt-16 gap-3">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
      >
        Trang Trước
      </button>
      <span className="px-4 py-2 text-zinc-400 text-xs font-mono font-bold bg-zinc-950 rounded-xl border border-zinc-800">
        Trang {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-bold"
      >
        Trang Sau
      </button>
    </div>
  );
}
