'use client';

import React from 'react';
import { Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { formatRankDisplayVi } from '@/lib/riotRanks';
import { getGameMeta, formatServiceName } from './orderHelpers';

interface OrderGameProgressCardProps {
  order: any;
  liveLeagueInfo: any;
  isBooster: boolean;
  ingameName: string;
  setIngameName: (name: string) => void;
  handleCheckAndSaveRank: () => void;
  isCheckingRank: boolean;
  availableLeagues: any[];
  applySelectedLeague: (league: any) => void;
}

export const OrderGameProgressCard: React.FC<OrderGameProgressCardProps> = ({
  order,
  liveLeagueInfo,
  isBooster,
  ingameName,
  setIngameName,
  handleCheckAndSaveRank,
  isCheckingRank,
  availableLeagues,
  applySelectedLeague,
}) => {
  const gameCode = (order.snapshot?.gameCode || order.details?.game || 'LOL').toUpperCase();
  const isRiotGame = ['LOL', 'LEAGUE_OF_LEGENDS', 'VALORANT', 'VAL', 'TFT'].some((code) =>
    gameCode.includes(code)
  );
  const gameMeta = getGameMeta(gameCode);
  const serviceName = formatServiceName(order.serviceType || order.snapshot?.serviceSlug);

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl animate-in fade-in duration-300 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-bold text-zinc-300 uppercase">
            Hồ sơ Game &amp; Lộ trình Cày Rank
          </h3>
          <span
            className="px-2 py-0.5 rounded text-[11px] font-bold uppercase border"
            style={{
              backgroundColor: `${gameMeta.accentColor}15`,
              color: gameMeta.accentColor,
              borderColor: `${gameMeta.accentColor}30`,
            }}
          >
            {gameMeta.name}
          </span>
        </div>

        {order.details?.ingame_name && isRiotGame && (
          <button
            onClick={handleCheckAndSaveRank}
            disabled={isCheckingRank}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Làm mới Rank từ Riot"
          >
            {isCheckingRank ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        )}
      </div>

      {/* Rank / Match Progression Display */}
      <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {(order.serviceType === 'MATCHES' || order.details?.is_matches) ? (
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Mục tiêu cày trận:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-white">
                Cày {order.details?.match_count || order.details?.matches || 1} Trận
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {order.details?.queue_type === 'FLEX' ? 'Linh Hoạt (Flex)' : 'Đơn / Đôi'}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Tiến độ hiện tại: <span className="text-emerald-400 font-bold font-mono">{order.match_history?.length || 0}</span> / <span className="font-bold font-mono">{order.details?.match_count || order.details?.matches || 1}</span> trận (Chỉ tính số lượng trận)
            </div>
          </div>
        ) : (order.serviceType === 'PLACEMENTS' || order.details?.is_placements) ? (
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Mục tiêu phân hạng:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-white">
                {order.details?.placement_matches || order.details?.matches || 5} Trận Phân Hạng
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Rank cũ: {formatRankDisplayVi(order.details?.previous_rank_label || order.details?.previous_season_rank || 'Chưa có')}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Tiến độ hiện tại: <span className="text-emerald-400 font-bold font-mono">{order.match_history?.length || 0}</span> / <span className="font-bold font-mono">{order.details?.placement_matches || order.details?.matches || 5}</span> trận phân hạng
            </div>
          </div>
        ) : (
          <div>
            <span className="text-xs text-zinc-500 block mb-1">Tiến độ rank mục tiêu:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-white">
                {formatRankDisplayVi(
                  liveLeagueInfo
                    ? (['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(liveLeagueInfo.tier?.toUpperCase())
                      ? liveLeagueInfo.tier
                      : `${liveLeagueInfo.tier} ${liveLeagueInfo.rank || ''}`.trim())
                    : (order.details?.current_rank || order.details?.segment_label || (order.details?.is_point_boost ? 'Cao Thủ' : 'Khởi điểm'))
                )}
              </span>
              {(order.details?.desired_rank || order.details?.is_point_boost) && (
                <>
                  <span className="text-blue-400 font-bold text-lg">&rarr;</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-300">
                    {order.details?.desired_rank
                      ? formatRankDisplayVi(order.details.desired_rank)
                      : `${order.details?.segment_label || 'Cao Thủ'} (${order.details?.desired_points ?? order.details?.target_points ?? 0} ${order.details?.unit || 'LP'})`
                    }
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-blue-400 font-bold mt-1">
              {liveLeagueInfo
                ? `${liveLeagueInfo.leaguePoints ?? 0} LP`
                : order.details?.is_point_boost
                  ? `${order.details?.current_points ?? 0} / ${order.details?.desired_points ?? order.details?.target_points ?? 0} ${order.details?.unit || 'LP'} (+${order.details?.gained_points ?? 0} ${order.details?.unit || 'LP'})`
                  : (order.details?.current_lp !== undefined && order.details?.current_lp !== null)
                    ? `${order.details.current_lp} LP`
                    : order.details?.steps_count
                      ? `${order.details.steps_count} Bậc Rank`
                      : ''
              }
            </div>
          </div>
        )}

        {liveLeagueInfo && (
          <div className="text-right text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
            <div>Thắng: <span className="text-green-400 font-bold">{liveLeagueInfo.wins}</span></div>
            <div>Thua: <span className="text-red-400 font-bold">{liveLeagueInfo.losses}</span></div>
            <div>Tỉ lệ: <span className="text-white">{Math.round((liveLeagueInfo.wins / (liveLeagueInfo.wins + liveLeagueInfo.losses)) * 100)}%</span></div>
          </div>
        )}
      </div>

      {/* Booster Input Area */}
      {isBooster && ['IN_PROGRESS', 'APPROVED'].includes(order.status) && (
        <div className="pt-3 border-t border-zinc-800">
          {isRiotGame ? (
            <>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                Cập nhật Ingame &amp; Check Rank (Riot API)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={ingameName}
                  onChange={(e) => setIngameName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder="Tên Ingame#Tag..."
                />
                <button
                  onClick={handleCheckAndSaveRank}
                  disabled={isCheckingRank}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap w-full sm:w-auto"
                >
                  {isCheckingRank ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kiểm tra'}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                * Nhập tên ingame chính xác để hệ thống tự động lấy Rank và {gameCode.includes('VAL') ? 'RR' : 'LP'} từ {gameCode.includes('VAL') ? 'Valorant' : 'Riot Games'}.
              </p>
            </>
          ) : (
            <>
              <label className="text-xs font-bold text-zinc-500 uppercase mb-2 block">
                Tên nhân vật / Ingame trong tài khoản ({gameCode || 'Game'})
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={ingameName}
                  onChange={(e) => setIngameName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  placeholder="Nhập tên nhân vật trong game..."
                />
                <button
                  onClick={handleCheckAndSaveRank}
                  disabled={isCheckingRank}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap w-full sm:w-auto border border-zinc-700"
                >
                  {isCheckingRank ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu Tên Ingame'}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                * Tựa game này không có Riot API tự động. Booster đăng nhập tài khoản khách hàng để cày và cập nhật tiến độ theo số Sao / Trận thắng.
              </p>
            </>
          )}

          {/* Danh sách các bậc xếp hạng tìm thấy */}
          {availableLeagues.length > 0 && (
            <div className="mt-3 p-3 bg-zinc-900/90 rounded-xl border border-zinc-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                <span>⚡</span> Bậc xếp hạng tìm thấy:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableLeagues.map((l: any, idx: number) => {
                  const isVal = (order.snapshot?.gameCode || order.details?.game || order.details?.gameCode || '').toUpperCase().includes('VAL');
                  const isSolo = l.queueType === 'RANKED_SOLO_5x5';
                  const isCompVal = l.queueType === 'COMPETITIVE';
                  const queueLabel = isCompVal ? 'Competitive' : (isSolo ? 'Đơn / Đôi' : 'Linh Hoạt');
                  const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(l.tier?.toUpperCase());
                  const tierVi = formatRankDisplayVi(l.tier);
                  const rankText = isApex ? tierVi : `${tierVi} ${l.rank || ''}`.trim();
                  const isSelected = liveLeagueInfo?.queueType === l.queueType;
                  const unit = isVal ? 'RR' : 'LP';
                  const icon = isCompVal ? '🎯' : (isSolo ? '👑' : '🛡️');

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySelectedLeague(l)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all border ${isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/40 shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                    >
                      <span className="text-base">{icon}</span>
                      <div className="text-left">
                        <div className="text-[10px] text-zinc-400 font-medium">{queueLabel}</div>
                        <div className="font-bold text-white text-xs">{rankText} <span className="text-cyan-400 font-normal">({l.leaguePoints ?? 0} {unit})</span></div>
                      </div>
                      {l.wins > 0 && (
                        <span className="text-[10px] text-zinc-500 border-l border-zinc-800 pl-2">
                          {l.wins}W {l.losses > 0 ? `/ ${l.losses}L` : ''}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer View of Ingame Name */}
      {!isBooster && (
        <div className="pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
          <span className="text-zinc-500">Tên Ingame:</span>
          <span className="font-medium text-white font-mono bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
            {order.details?.ingame_name || 'Chưa cập nhật'}
          </span>
        </div>
      )}
    </div>
  );
};
