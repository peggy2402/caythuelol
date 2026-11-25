'use client';

import React from 'react';
import { Swords, X, Search, Loader2, History, RefreshCw } from 'lucide-react';

interface MatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMatchId: string | null;
  order: any;
  riotMatchId: string;
  setRiotMatchId: (val: string) => void;
  isFetchingRiot: boolean;
  onFetchRiotMatch: () => void;
  recentMatches: string[];
  onRefreshRecentMatches: () => void;
  matchForm: {
    champion: string;
    result: string;
    lp_change: string | number;
    reason: string;
    mode?: string;
  };
  setMatchForm: React.Dispatch<React.SetStateAction<any>>;
  isAddingMatch: boolean;
  onSaveMatch: (e: React.FormEvent) => void;
}

export default function MatchFormModal({
  isOpen,
  onClose,
  editingMatchId,
  order,
  riotMatchId,
  setRiotMatchId,
  isFetchingRiot,
  onFetchRiotMatch,
  recentMatches,
  onRefreshRecentMatches,
  matchForm,
  setMatchForm,
  isAddingMatch,
  onSaveMatch,
}: MatchFormModalProps) {
  if (!isOpen) return null;

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
  const queueBadge = isFlex ? 'Linh Hoạt' : 'Đơn / Đôi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-blue-500" />
            {editingMatchId ? 'Chỉnh sửa trận đấu' : 'Cập nhật trận đấu'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Riot Match Fetcher (Only for new matches) */}
        {!editingMatchId && (
          <div className="space-y-2 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder={
                  isValorant
                    ? 'Nhập Match ID Valorant (VD: ba7a9a92-be79-494e-bdad-483131edb85c)'
                    : 'Nhập Match ID (VD: 1640656388 hoặc VN2_1640656388)'
                }
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
                value={riotMatchId}
                onChange={(e) => setRiotMatchId(e.target.value)}
              />
              <button
                type="button"
                onClick={onFetchRiotMatch}
                disabled={isFetchingRiot}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isFetchingRiot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Lấy Info
              </button>
            </div>

            <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  Trận đấu gần đây ({queueBadge}): <strong className="text-blue-400">{recentMatches.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onRefreshRecentMatches}
                    title="Tải lại danh sách trận từ Riot"
                    className="text-zinc-400 hover:text-blue-400 transition-colors p-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] text-zinc-500">Bấm để tự điền</span>
                </div>
              </div>
              {recentMatches.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {recentMatches.slice(0, 10).map((mId) => (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setRiotMatchId(mId)}
                      className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors cursor-pointer ${
                        riotMatchId === mId
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 font-bold'
                          : 'bg-zinc-900 text-zinc-300 border-white/5 hover:border-blue-500/30 hover:text-white'
                      }`}
                    >
                      {mId}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 py-0.5 italic flex items-center justify-between">
                  <span>Chưa có trận {queueBadge} gần đây của tài khoản này.</span>
                  <button
                    type="button"
                    onClick={onRefreshRecentMatches}
                    className="text-blue-400 hover:underline text-[10px] cursor-pointer"
                  >
                    Quét lại
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={onSaveMatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tướng (VD: Lee Sin)"
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:border-blue-500 outline-none"
              value={matchForm.champion}
              onChange={(e) => setMatchForm((prev: any) => ({ ...prev, champion: e.target.value }))}
              required
            />
            <select
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:border-blue-500 outline-none"
              value={matchForm.result}
              onChange={(e) => setMatchForm((prev: any) => ({ ...prev, result: e.target.value }))}
            >
              <option value="WIN">Thắng (Win)</option>
              <option value="LOSS">Thua (Loss)</option>
            </select>
          </div>
          <input
            type="number"
            placeholder="Điểm (+/- LP)"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:border-blue-500 outline-none"
            value={matchForm.lp_change}
            onChange={(e) => setMatchForm((prev: any) => ({ ...prev, lp_change: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Ghi chú (Tùy chọn)"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:border-blue-500 outline-none"
            value={matchForm.reason}
            onChange={(e) => setMatchForm((prev: any) => ({ ...prev, reason: e.target.value }))}
          />

          <button
            type="submit"
            disabled={isAddingMatch}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer shadow-lg shadow-blue-500/25"
          >
            {isAddingMatch ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editingMatchId ? (
              'Lưu thay đổi'
            ) : (
              'Thêm trận đấu'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
