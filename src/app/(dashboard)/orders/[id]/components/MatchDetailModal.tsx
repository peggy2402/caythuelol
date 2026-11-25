'use client';

import React from 'react';
import { Swords, X } from 'lucide-react';
import { calculateKDA, calculateTeamStats } from './orderHelpers';

interface MatchDetailModalProps {
  selectedMatchDetail: any;
  onClose: () => void;
  order: any;
  dDragonVersion: string;
}

export default function MatchDetailModal({
  selectedMatchDetail,
  onClose,
  order,
  dDragonVersion,
}: MatchDetailModalProps) {
  if (!selectedMatchDetail) return null;

  const targetName = (
    order?.details?.ingame_name ||
    order?.details?.account_username ||
    ''
  )
    .toLowerCase()
    .replace(/\s/g, '')
    .replace('#', '');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-yellow-500" /> Chi tiết trận đấu
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6 space-y-6">
          {(() => {
            // TRƯỜNG HỢP 1: TRẬN ĐẤU VALORANT (HenrikDev format)
            if (selectedMatchDetail.players?.all_players) {
              const allPlayers = selectedMatchDetail.players.all_players;
              const bluePlayers = allPlayers.filter((p: any) => p.team?.toLowerCase() === 'blue');
              const redPlayers = allPlayers.filter((p: any) => p.team?.toLowerCase() === 'red');
              const blueWon = selectedMatchDetail.teams?.blue?.has_won;
              const redWon = selectedMatchDetail.teams?.red?.has_won;
              const blueRounds = selectedMatchDetail.teams?.blue?.rounds_won ?? 0;
              const redRounds = selectedMatchDetail.teams?.red?.rounds_won ?? 0;

              const ValTeamBlock = ({ players, color, title, won, rounds }: any) => (
                <div className="space-y-3">
                  <div
                    className={`flex justify-between items-center pb-2 border-b ${
                      color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                        {title}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          won
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {won ? 'Chiến Thắng' : 'Thất Bại'} ({rounds} Rounds)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {players.map((p: any, idx: number) => {
                      const pFull = `${p.name || ''}#${p.tag || ''}`.toLowerCase().replace(/\s/g, '');
                      const isMe =
                        targetName && (pFull.includes(targetName) || targetName.includes(p.name?.toLowerCase()));
                      const agentIcon = p.assets?.agent?.small || p.assets?.agent?.bust || '';

                      return (
                        <div
                          key={idx}
                          className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                            isMe
                              ? 'bg-yellow-500/10 border-yellow-500/50'
                              : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'
                          }`}
                        >
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 flex items-center justify-center">
                            {agentIcon ? (
                              <img src={agentIcon} alt={p.character} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-zinc-400">{p.character?.slice(0, 2)}</span>
                            )}
                            <div className="absolute bottom-0 right-0 bg-black/80 text-[9px] text-white px-1 rounded-tl font-mono">
                              {p.level || p.character}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0 pr-2">
                                <div
                                  className={`text-sm font-bold truncate ${
                                    isMe ? 'text-yellow-400' : 'text-white'
                                  }`}
                                >
                                  {p.name}#{p.tag} {isMe && '(Tôi)'}
                                </div>
                                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                  <span className="font-semibold text-blue-300">{p.character}</span>
                                  {p.currenttier_patched && (
                                    <span className="text-zinc-500">• {p.currenttier_patched}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div
                                  className={`text-sm font-mono font-bold ${
                                    isMe ? 'text-yellow-200' : 'text-white'
                                  }`}
                                >
                                  {p.stats?.kills}/<span className="text-red-400">{p.stats?.deaths}</span>/
                                  {p.stats?.assists}
                                </div>
                                <div className="text-[10px] font-bold text-zinc-500">
                                  {calculateKDA(
                                    p.stats?.kills ?? 0,
                                    p.stats?.deaths ?? 0,
                                    p.stats?.assists ?? 0
                                  )}{' '}
                                  KDA • {p.stats?.score} pts
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                    <div>
                      Map: <span className="text-white font-bold">{selectedMatchDetail.metadata?.map}</span> •
                      Mode:{' '}
                      <span className="text-cyan-400 font-bold">{selectedMatchDetail.metadata?.mode}</span>
                    </div>
                    <div>
                      Thời gian:{' '}
                      <span className="text-white font-mono">
                        {Math.floor((selectedMatchDetail.metadata?.game_length || 0) / 60)} phút
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ValTeamBlock
                      players={bluePlayers}
                      color="blue"
                      title="Blue Team"
                      won={blueWon}
                      rounds={blueRounds}
                    />
                    <ValTeamBlock
                      players={redPlayers}
                      color="red"
                      title="Red Team"
                      won={redWon}
                      rounds={redRounds}
                    />
                  </div>
                </div>
              );
            }

            // TRƯỜNG HỢP 2: TRẬN ĐẤU LEAGUE OF LEGENDS (Riot format)
            if (selectedMatchDetail.info?.participants) {
              const teams = calculateTeamStats(selectedMatchDetail.info.participants);
              const blueTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 100);
              const redTeam = selectedMatchDetail.info.participants.filter((p: any) => p.teamId === 200);

              const TeamBlock = ({ teamId, players, color, title }: any) => {
                const isWin = players.length > 0 ? players[0].win : false;
                return (
                  <div className="space-y-3">
                    <div
                      className={`flex justify-between items-center pb-2 border-b ${
                        color === 'blue' ? 'border-blue-500/30' : 'border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${color === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                          {title}
                        </span>
                        {players.length > 0 && (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                              isWin
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {isWin ? 'Chiến Thắng' : 'Thất Bại'}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono text-white">
                        {teams[teamId]?.kills ?? 0} /{' '}
                        <span className="text-red-400">{teams[teamId]?.deaths ?? 0}</span> /{' '}
                        {teams[teamId]?.assists ?? 0}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {players.map((p: any, idx: number) => {
                        const pName = (p.riotIdGameName || p.summonerName || '')
                          .toLowerCase()
                          .replace(/\s/g, '');
                        const pTag = (p.riotIdTagline || '').toLowerCase();
                        const fullName = pName + pTag;
                        const isMe =
                          targetName && (fullName.includes(targetName) || targetName.includes(pName));

                        return (
                          <div
                            key={idx}
                            className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                              isMe
                                ? 'bg-yellow-500/10 border-yellow-500/50'
                                : 'bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900'
                            }`}
                          >
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
                              <img
                                src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/champion/${p.championName}.png`}
                                alt={p.championName}
                                className={`w-full h-full rounded-lg object-cover border ${
                                  isMe ? 'border-yellow-500' : 'border-zinc-700'
                                }`}
                              />
                              <div className="absolute bottom-0 right-0 bg-black/80 text-[10px] text-white px-1 rounded-tl border-t border-l border-zinc-700 font-mono">
                                {p.champLevel}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0 pr-2">
                                <div
                                  className={`text-sm font-bold truncate leading-tight ${
                                    isMe ? 'text-yellow-400' : 'text-white'
                                  }`}
                                >
                                  {p.riotIdGameName || p.summonerName} {isMe && '(Tôi)'}
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate leading-tight">
                                  {p.championName}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div
                                  className={`text-sm font-mono font-bold leading-tight ${
                                    isMe ? 'text-yellow-200' : 'text-white'
                                  }`}
                                >
                                  {p.kills}/<span className="text-red-400">{p.deaths}</span>/{p.assists}
                                </div>
                                <div className="text-[10px] font-bold text-zinc-500 leading-tight">
                                  {calculateKDA(p.kills, p.deaths, p.assists)} KDA
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 overflow-x-auto no-scrollbar">
                              {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5].map((itemId, i) => (
                                <div
                                  key={i}
                                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded bg-zinc-800 border overflow-hidden shrink-0 ${
                                    isMe ? 'border-yellow-500/30' : 'border-zinc-700'
                                  }`}
                                >
                                  {itemId > 0 && (
                                    <img
                                      src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/item/${itemId}.png`}
                                      alt="Item"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              ))}
                              <div
                                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 border overflow-hidden ml-1 shrink-0 ${
                                  isMe ? 'border-yellow-500/30' : 'border-zinc-700'
                                }`}
                              >
                                {p.item6 > 0 && (
                                  <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/${dDragonVersion}/img/item/${p.item6}.png`}
                                    alt="Trinket"
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TeamBlock teamId={100} players={blueTeam} color="blue" title="Blue Team" />
                <TeamBlock teamId={200} players={redTeam} color="red" title="Red Team" />
              </div>
            );
          }

          // Fallback: Nếu không đúng cấu trúc chi tiết
          return (
            <div className="text-center py-12 text-zinc-400 space-y-2">
              <p className="font-bold text-white text-base">Thông tin tổng quan trận đấu</p>
              <p className="text-xs text-zinc-500">Mã trận: {selectedMatchDetail.matchId || 'Không xác định'}</p>
              <pre className="text-left text-xs bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-x-auto text-zinc-300 font-mono mt-4">
                {JSON.stringify(selectedMatchDetail, null, 2)}
              </pre>
            </div>
          );
        })()}
      </div>
    </div>
  </div>
);
}
