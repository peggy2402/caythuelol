'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle2,
  Zap,
  Plus,
} from 'lucide-react';

interface OrderMatchHistoryListProps {
  order: any;
  isBooster: boolean;
  loadingDetailMatchId: string | null;
  onViewMatchDetail: (match: any) => void;
  onEditMatch: (match: any) => void;
  onPromptDeleteMatch: (match: any) => void;
  onOpenBatchModal: () => void;
  onOpenAddMatchModal: () => void;
}

export default function OrderMatchHistoryList({
  order,
  isBooster,
  loadingDetailMatchId,
  onViewMatchDetail,
  onEditMatch,
  onPromptDeleteMatch,
  onOpenBatchModal,
  onOpenAddMatchModal,
}: OrderMatchHistoryListProps) {
  const isMatchesCheck = order.serviceType === 'MATCHES' || order.details?.is_matches;
  const isPlacementsCheck = order.serviceType === 'PLACEMENTS' || order.details?.is_placements;
  const maxAllowed =
    isMatchesCheck || isPlacementsCheck
      ? Number(
          order.details?.match_count ||
            order.details?.placement_matches ||
            order.details?.matches ||
            order.details?.steps_count ||
            order.details?.num_games ||
            (isMatchesCheck ? 10 : 5)
        )
      : null;
  const currentProgress = isMatchesCheck
    ? (order.match_history || []).filter((m: any) => m.result === 'WIN').length
    : order.match_history?.length || 0;
  const isLimitReached = maxAllowed !== null && currentProgress >= maxAllowed;

  return (
    <div className="space-y-6">
      {/* Match History List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {order.match_history?.length > 0 ? (
            order.match_history.map((match: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl gap-4"
              >
                {/* Left: Result Image & Basic Info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0">
                    <img
                      src={match.result === 'WIN' ? '/images/victory.png' : '/images/defeat.png'}
                      alt={match.result}
                      className="w-10 h-10 sm:w-8 sm:h-8 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base sm:text-sm font-bold text-white truncate">
                      {match.champion}
                    </div>
                    <div className="text-xs text-zinc-400 mb-1">Chế độ: {match.mode}</div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(match.timestamp).toLocaleString('vi-VN')}
                    </div>
                    {match.reason && (
                      <div className="text-xs text-zinc-400 mt-1 italic line-clamp-1">{match.reason}</div>
                    )}
                  </div>
                </div>

                {/* Right: Stats & Actions */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4 sm:gap-1 border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                  {/* LP Change */}
                  <div
                    className={`text-lg sm:text-base font-black ${
                      match.lp_change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {match.lp_change > 0 ? '+' : ''}
                    {match.lp_change} <span className="text-xs font-normal text-zinc-500">LP</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {match.detail || match.riotMatchId ? (
                      <button
                        type="button"
                        onClick={() => onViewMatchDetail(match)}
                        disabled={loadingDetailMatchId === (match.match_id || match.riotMatchId)}
                        className="p-2 bg-zinc-900 hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition-colors border border-zinc-800 cursor-pointer disabled:opacity-50"
                        title="Xem chi tiết trận đấu"
                      >
                        {loadingDetailMatchId === (match.match_id || match.riotMatchId) ? (
                          <Loader2 size={16} className="animate-spin text-blue-400" />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    ) : (
                      <div
                        className="p-2 text-zinc-700 border border-zinc-800 rounded-lg cursor-not-allowed"
                        title="Trận đấu nhập thủ công không có dữ liệu Riot / Valorant"
                      >
                        <Eye size={16} />
                      </div>
                    )}

                    {isBooster && order.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={() => onEditMatch(match)}
                          className="p-2 bg-zinc-900 hover:bg-yellow-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800 cursor-pointer"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onPromptDeleteMatch(match)}
                          className="p-2 bg-zinc-900 hover:bg-rose-600 hover:text-white text-zinc-400 rounded-lg transition-colors border border-zinc-800 cursor-pointer"
                          title="Xóa trận đấu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl"
            >
              Chưa có trận đấu nào được cập nhật.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Match Form (Booster Only) */}
      {isBooster && order.status === 'IN_PROGRESS' && (
        <>
          {isLimitReached ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 mt-2 shadow-lg shadow-emerald-500/5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div className="text-xs">
                <p className="font-bold text-emerald-400 text-sm">
                  {isMatchesCheck
                    ? `Đã đạt đủ ${currentProgress}/${maxAllowed} trận thắng theo cam kết đơn hàng!`
                    : `Đã cập nhật đủ ${currentProgress}/${maxAllowed} trận theo yêu cầu đơn hàng!`}
                </p>
                <p className="text-zinc-400 mt-0.5">
                  Tiến độ trận đấu đã đủ số lượng. Bạn có thể chỉnh sửa các trận đã lưu hoặc nhấn &quot;Báo cáo
                  hoàn thành&quot;.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenBatchModal}
                className="w-full py-3 bg-gradient-to-r from-blue-600/25 via-blue-600/15 to-indigo-600/25 border border-blue-500/40 hover:border-blue-400 rounded-xl text-blue-300 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-blue-400" /> Nhập nhanh danh sách (Paste)
              </button>
              <button
                type="button"
                onClick={onOpenAddMatchModal}
                className="w-full py-3 border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/60 rounded-xl text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2 font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm thủ công 1 trận
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
