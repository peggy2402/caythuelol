'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Gamepad2, ShieldCheck, Pencil, X, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SparklineChart from '@/components/SparklineChart';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { toast } from 'sonner';

interface PlacementsOrderViewProps {
  order: any;
  isBooster?: boolean;
}

const RANK_TIERS = [
  { value: 'IRON', label: 'Sắt' },
  { value: 'BRONZE', label: 'Đồng' },
  { value: 'SILVER', label: 'Bạc' },
  { value: 'GOLD', label: 'Vàng' },
  { value: 'PLATINUM', label: 'Bạch Kim' },
  { value: 'EMERALD', label: 'Lục Bảo' },
  { value: 'DIAMOND', label: 'Kim Cương' },
  { value: 'MASTER', label: 'Cao Thủ' },
  { value: 'GRANDMASTER', label: 'Đại Cao Thủ' },
  { value: 'CHALLENGER', label: 'Thách Đấu' },
  { value: 'UNRANKED', label: 'Chưa có rank / Unranked' },
];

const DIVISIONS = ['IV', 'III', 'II', 'I'];

export default function PlacementsOrderView({ order, isBooster = false }: PlacementsOrderViewProps) {
  const { details, match_history } = order;
  const targetGames = parseInt(details?.num_games || details?.placement_matches || details?.matches || '5');

  // Lấy giá trị rank mùa trước từ các trường có thể lưu
  const initialRawPrevRank =
    details?.previous_rank_label ||
    details?.previous_season_rank ||
    details?.prev_rank ||
    details?.previousRank ||
    order?.snapshot?.initialState?.rankLabel ||
    '';

  const [prevRankVal, setPrevRankVal] = useState<string>(initialRawPrevRank);
  const [currentRankVal, setCurrentRankVal] = useState<string>(details?.current_rank || '');

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrevTier, setEditPrevTier] = useState<string>('');
  const [editCurrentTier, setEditCurrentTier] = useState<string>('');
  const [editCurrentDivision, setEditCurrentDivision] = useState<string>('IV');
  const [isUpdating, setIsUpdating] = useState(false);

  const seriesState = useMemo(() => {
    const matches = Array.isArray(match_history) ? match_history : [];
    const wins = matches.filter((m: any) => m.result === 'WIN').length;
    const losses = matches.filter((m: any) => m.result === 'LOSS').length;
    return { wins, losses, matches };
  }, [match_history]);

  // --- Dữ liệu cho biểu đồ Win Rate ---
  const winRateTrend = useMemo(() => {
    if (!match_history || match_history.length === 0) return [];
    let wins = 0;
    return match_history.map((m: any, idx: number) => {
      if (m.result === 'WIN') wins++;
      const total = idx + 1;
      return Math.round((wins / total) * 100);
    });
  }, [match_history]);

  const displayPrevRank = prevRankVal ? formatRankDisplayVi(prevRankVal) : 'Chưa có';
  const displayCurrentRank = currentRankVal ? formatRankDisplayVi(currentRankVal) : 'Đang cập nhật...';

  // Khởi tạo form khi mở modal
  const handleOpenEditModal = () => {
    // Tìm tier mùa trước
    const foundPrev = RANK_TIERS.find(
      (t) => t.value.toLowerCase() === prevRankVal.toLowerCase() || t.label.toLowerCase() === prevRankVal.toLowerCase()
    );
    setEditPrevTier(foundPrev ? foundPrev.value : prevRankVal || 'GOLD');

    // Parse rank tạm tính hiện tại
    if (!currentRankVal || currentRankVal.toLowerCase().includes('đang cập nhật')) {
      setEditCurrentTier('NONE');
      setEditCurrentDivision('IV');
    } else {
      const parts = currentRankVal.trim().split(' ');
      const rawTier = parts.slice(0, -1).join(' ') || parts[0];
      const rawDiv = parts[parts.length - 1];

      const foundCurr = RANK_TIERS.find(
        (t) =>
          t.label.toLowerCase() === rawTier.toLowerCase() ||
          t.value.toLowerCase() === rawTier.toLowerCase() ||
          currentRankVal.toLowerCase().includes(t.label.toLowerCase())
      );

      if (foundCurr) {
        setEditCurrentTier(foundCurr.value);
        setEditCurrentDivision(DIVISIONS.includes(rawDiv) ? rawDiv : 'IV');
      } else {
        setEditCurrentTier('NONE');
        setEditCurrentDivision('IV');
      }
    }

    setIsEditModalOpen(true);
  };

  const handleSaveRanks = async () => {
    setIsUpdating(true);
    try {
      // Tính toán label cho rank mùa trước
      const prevTierObj = RANK_TIERS.find((t) => t.value === editPrevTier);
      const newPrevRankLabel = prevTierObj ? prevTierObj.label : editPrevTier;

      // Tính toán label cho rank tạm tính
      let newCurrentRankLabel = '';
      if (editCurrentTier && editCurrentTier !== 'NONE') {
        const currTierObj = RANK_TIERS.find((t) => t.value === editCurrentTier);
        const tierName = currTierObj ? currTierObj.label : editCurrentTier;
        const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'Cao Thủ', 'Đại Cao Thủ', 'Thách Đấu'].includes(
          editCurrentTier
        );
        newCurrentRankLabel = isApex ? tierName : `${tierName} ${editCurrentDivision}`;
      }

      const updatePayload: Record<string, any> = {
        previous_rank_label: newPrevRankLabel,
        previous_season_rank: newPrevRankLabel,
        prev_rank: newPrevRankLabel,
        current_rank: newCurrentRankLabel || '',
      };

      const res = await fetch(`/api/orders/${order._id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Lỗi khi lưu thông tin rank');
      }

      // Cập nhật state local
      setPrevRankVal(newPrevRankLabel);
      setCurrentRankVal(newCurrentRankLabel);

      // Mutate object reference
      if (order.details) {
        order.details.previous_rank_label = newPrevRankLabel;
        order.details.previous_season_rank = newPrevRankLabel;
        order.details.prev_rank = newPrevRankLabel;
        order.details.current_rank = newCurrentRankLabel;
      }

      toast.success('Đã cập nhật thông tin Rank Phân Hạng thành công!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-visible">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              Tiến độ Phân Hạng
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Chuỗi {targetGames} trận đầu mùa định hình bậc xếp hạng
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">
              W: {seriesState.wins}
            </span>
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">
              L: {seriesState.losses}
            </span>
            {isBooster && (
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-1.5 px-3 py-1 bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold transition-all shadow-sm ml-1"
                title="Tùy chỉnh Rank mùa trước và Rank tạm tính"
              >
                <Pencil size={12} />
                Chỉnh Rank
              </button>
            )}
          </div>
        </div>

        {/* Visual Slots Display */}
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-8">
          {/* Played Matches */}
          {seriesState.matches.map((match: any, idx: number) => (
            <motion.div
              key={match._id || idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border-2 shadow-lg ${
                match.result === 'WIN'
                  ? 'bg-green-500/20 border-green-500 text-green-500 shadow-green-500/20'
                  : 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/20'
              }`}
              title={`Trận ${idx + 1}: ${match.result}`}
            >
              {match.result === 'WIN' ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
            </motion.div>
          ))}

          {/* Empty Slots */}
          {[...Array(Math.max(0, targetGames - seriesState.matches.length))].map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border-2 border-zinc-800 bg-zinc-900/50 text-zinc-700 border-dashed"
            >
              <span className="font-bold text-base sm:text-lg">{seriesState.matches.length + i + 1}</span>
            </div>
          ))}
        </div>

        {/* Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800 text-center min-w-0 relative group">
            <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider truncate">
              Rank Mùa Trước (Khách chọn)
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-400/90 mt-1 truncate">
              {displayPrevRank}
            </div>
            {isBooster && (
              <button
                onClick={handleOpenEditModal}
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition opacity-0 group-hover:opacity-100"
                title="Chỉnh sửa Rank mùa trước"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>

          <div className="bg-zinc-950/50 p-3.5 rounded-xl border border-zinc-800 text-center relative overflow-hidden min-w-0 group">
            <div className="absolute inset-0 bg-purple-500/5"></div>
            <div className="text-[11px] sm:text-[10px] text-zinc-500 uppercase font-bold tracking-wider relative z-10 truncate">
              Rank Tạm Tính (Provisional)
            </div>
            <div className="text-base sm:text-lg font-bold text-purple-400 mt-1 relative z-10 truncate">
              {displayCurrentRank}
            </div>
            {isBooster && (
              <button
                onClick={handleOpenEditModal}
                className="absolute top-2.5 right-2.5 p-1 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition opacity-0 group-hover:opacity-100 relative z-20"
                title="Chỉnh sửa Rank tạm tính"
              >
                <Pencil size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Win Rate Sparkline */}
        {winRateTrend.length > 1 && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Tỉ lệ thắng (Win Rate)
              </span>
              <span className="text-xs font-bold text-purple-400">
                {winRateTrend[winRateTrend.length - 1]}%
              </span>
            </div>
            <SparklineChart data={winRateTrend} color="#a855f7" height={40} />
          </div>
        )}
      </div>

      {/* Commitment Badge */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-900/10 border border-purple-500/20 text-purple-200">
        <ShieldCheck className="w-5 h-5 shrink-0 text-purple-400" />
        <p className="text-sm">
          Dịch vụ Phân Hạng đảm bảo tỷ lệ thắng cao nhất để bạn có khởi đầu mùa giải thuận lợi.
        </p>
      </div>

      {/* Modal Tùy Chỉnh Rank Dành Cho Booster */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-purple-400" />
                    Cập nhật Rank Phân Hạng
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Tùy chỉnh thông tin rank hiển thị trên đơn phân hạng
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Rank Mùa Trước */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Rank Mùa Trước (Khách khai báo)
                  </label>
                  <select
                    value={editPrevTier}
                    onChange={(e) => setEditPrevTier(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  >
                    {RANK_TIERS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Chỉnh sửa nếu khách chọn nhầm rank mùa trước khi tạo đơn.
                  </p>
                </div>

                {/* 2. Rank Tạm Tính */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Rank Tạm Tính (Provisional Rank sau các trận)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editCurrentTier}
                      onChange={(e) => setEditCurrentTier(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    >
                      <option value="NONE">-- Đang cập nhật... --</option>
                      {RANK_TIERS.filter((t) => t.value !== 'UNRANKED').map((tier) => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={editCurrentDivision}
                      onChange={(e) => setEditCurrentDivision(e.target.value)}
                      disabled={
                        editCurrentTier === 'NONE' ||
                        ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(editCurrentTier)
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {DIVISIONS.map((div) => (
                        <option key={div} value={div}>
                          Bậc {div}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Cập nhật theo rank tạm tính hiển thị trong client sau mỗi trận thắng/thua.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRanks}
                  disabled={isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition disabled:opacity-50 shadow-lg shadow-purple-600/30"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
