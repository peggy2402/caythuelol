'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteMatchModalProps {
  deleteMatchModal: {
    isOpen: boolean;
    matchId: string | null;
    loading: boolean;
    matchInfo?: any;
  };
  setDeleteMatchModal: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      matchId: string | null;
      loading: boolean;
      matchInfo?: any;
    }>
  >;
  onConfirmDelete: () => void;
}

export default function DeleteMatchModal({
  deleteMatchModal,
  setDeleteMatchModal,
  onConfirmDelete,
}: DeleteMatchModalProps) {
  return (
    <Dialog
      open={deleteMatchModal.isOpen}
      onOpenChange={(open) => {
        if (!deleteMatchModal.loading) {
          setDeleteMatchModal((prev) => ({ ...prev, isOpen: open }));
        }
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10">
            <Trash2 className="w-7 h-7" />
          </div>

          <DialogTitle className="text-lg font-bold text-white">
            Xác nhận xóa trận đấu
          </DialogTitle>

          <DialogDescription className="text-xs text-zinc-400 leading-relaxed max-w-[320px]">
            Bạn có chắc chắn muốn xóa trận đấu này khỏi lịch sử cày rank? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {/* Tóm tắt thông tin trận đấu cần xóa */}
        {deleteMatchModal.matchInfo && (
          <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-3.5 space-y-2 my-2 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Chế độ:</span>
              <span className="font-medium text-white">
                {deleteMatchModal.matchInfo.mode || 'Rank Đơn/Đôi'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Tướng:</span>
              <span className="font-semibold text-blue-300">
                {deleteMatchModal.matchInfo.champion || 'Chưa rõ'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="text-zinc-500">Kết quả:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  deleteMatchModal.matchInfo.result === 'WIN'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {deleteMatchModal.matchInfo.result === 'WIN' ? 'Thắng (Win)' : 'Thua (Loss)'}
              </span>
            </div>
            {deleteMatchModal.matchInfo.lp_change !== undefined && deleteMatchModal.matchInfo.lp_change !== '' && (
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-zinc-500">Điểm LP:</span>
                <span
                  className={`font-mono font-bold ${
                    Number(deleteMatchModal.matchInfo.lp_change) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {Number(deleteMatchModal.matchInfo.lp_change) >= 0
                    ? `+${deleteMatchModal.matchInfo.lp_change}`
                    : deleteMatchModal.matchInfo.lp_change}{' '}
                  LP
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 w-full">
          <button
            type="button"
            disabled={deleteMatchModal.loading}
            onClick={() => setDeleteMatchModal((prev) => ({ ...prev, isOpen: false }))}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={deleteMatchModal.loading}
            onClick={onConfirmDelete}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {deleteMatchModal.loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa trận</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
