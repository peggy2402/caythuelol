'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Zap, History, Search, Loader2, X, CheckCircle2 } from 'lucide-react';

interface ParsedBatchMatch {
  matchId: string;
  result: 'WIN' | 'LOSS';
  lp_change: number;
  champion?: string;
  reason?: string;
  riotMatchDetail?: any;
}

interface BatchMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  recentMatches: string[];
  batchInputText: string;
  onParseBatchText: (text: string) => void;
  parsedBatchMatches: ParsedBatchMatch[];
  setParsedBatchMatches: React.Dispatch<React.SetStateAction<ParsedBatchMatch[]>>;
  isFetchingRiotBatch: boolean;
  onAutoFetchRiotForBatch: () => void;
  isSubmittingBatch: boolean;
  onSaveBatchMatches: () => void;
}

export default function BatchMatchModal({
  isOpen,
  onClose,
  order,
  recentMatches,
  batchInputText,
  onParseBatchText,
  parsedBatchMatches,
  setParsedBatchMatches,
  isFetchingRiotBatch,
  onAutoFetchRiotForBatch,
  isSubmittingBatch,
  onSaveBatchMatches,
}: BatchMatchModalProps) {
  const isValorant = (
    order?.snapshot?.gameCode ||
    order?.details?.game ||
    order?.details?.gameCode ||
    ''
  )
    .toUpperCase()
    .includes('VAL');

  const rawQueue = String(
    order?.details?.queueType || order?.details?.queue_type || order?.serviceType || ''
  ).toUpperCase();
  const isFlex = rawQueue.includes('FLEX') || rawQueue.includes('LINH');
  const queueLabel = isFlex ? 'Linh Hoạt' : 'Đơn / Đôi';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col bg-zinc-950 border border-white/10 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Nhập nhanh danh sách trận đấu
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Dán chuỗi Match ID kèm điểm LP để hệ thống tự động nhận diện và cập nhật
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Quick Helper Button: Điền trận gần nhất */}
          {recentMatches.length > 0 && (
            <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 rounded-xl p-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <History className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Có <strong>{recentMatches.length}</strong> trận {queueLabel} gần nhất:
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sampleText = recentMatches
                    .slice(0, 5)
                    .map((id) => `${id} +20`)
                    .join('\n');
                  onParseBatchText(sampleText);
                }}
                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Dán nhanh {Math.min(5, recentMatches.length)} trận
              </button>
            </div>
          )}

          {/* Textarea dán dữ liệu */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Dán danh sách trận (Mỗi trận 1 dòng):</span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {isValorant ? 'Định dạng: MatchID [+/-RR]' : 'Định dạng: MatchID [+/-LP]'}
              </span>
            </label>
            <textarea
              rows={5}
              value={batchInputText}
              onChange={(e) => onParseBatchText(e.target.value)}
              placeholder={
                isValorant
                  ? `ba7a9a92-be79-494e-bdad-483131edb85c +18\nba7a9a92-be79-494e-bdad-483131edb85c -14`
                  : `VN2_1640656388 +25\nVN2_1640608730 -14\nVN2_1640571634 +20\nVN2_1640492570 +21\nVN2_1640449961 -16`
              }
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedBatchMatches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    Xem trước ({parsedBatchMatches.length} trận):
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                    {parsedBatchMatches.filter((m) => m.result === 'WIN').length} Thắng
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-bold">
                    {parsedBatchMatches.filter((m) => m.result === 'LOSS').length} Thua
                  </span>
                  <span className="font-mono text-zinc-400 text-[11px]">
                    Tổng:{' '}
                    <strong
                      className={
                        parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0) >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0) >= 0 ? '+' : ''}
                      {parsedBatchMatches.reduce((acc, m) => acc + m.lp_change, 0)}{' '}
                      {isValorant ? 'RR' : 'LP'}
                    </strong>
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isFetchingRiotBatch}
                  onClick={onAutoFetchRiotForBatch}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isFetchingRiotBatch ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang kéo trận...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3 h-3" />
                      <span>{isValorant ? 'Lấy KDA & Agent' : 'Lấy KDA & Tướng'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-zinc-900/70 border border-white/5 rounded-xl max-h-48 overflow-y-auto divide-y divide-white/5">
                {parsedBatchMatches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-zinc-500 font-mono text-[11px] w-4">{idx + 1}.</span>
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{m.matchId}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          {m.champion && (
                            <span className="text-blue-300 font-semibold">{m.champion}</span>
                          )}
                          {m.reason && <span className="text-zinc-500">• {m.reason}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.result === 'WIN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {m.result === 'WIN' ? 'Thắng' : 'Thua'}
                      </span>
                      <span
                        className={`font-mono font-bold text-xs w-16 text-right ${
                          m.lp_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {m.lp_change > 0 ? `+${m.lp_change}` : m.lp_change}{' '}
                        {isValorant ? 'RR' : 'LP'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setParsedBatchMatches((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title="Xóa trận này khỏi danh sách dán"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 sm:space-x-0">
          <button
            type="button"
            disabled={isSubmittingBatch}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmittingBatch || parsedBatchMatches.length === 0}
            onClick={onSaveBatchMatches}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingBatch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu tất cả ({parsedBatchMatches.length} trận)</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
