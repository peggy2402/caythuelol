import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  AlertTriangle,
  Zap,
  ArrowRight,
  Swords,
} from 'lucide-react';
import { getRankImage } from '@/lib/rank-calculator';
import { GameDefinition } from '@/lib/games';

interface RiotAccountCheckerSectionProps {
  isRiotGame: boolean;
  isRankBoost: boolean;
  isPointBoost: boolean;
  serviceSlug: string;
  accountCheckInput: string;
  setAccountCheckInput: (val: string) => void;
  isCheckingAccount: boolean;
  accountCheckError: string;
  setAccountCheckError: (val: string) => void;
  checkedAccount: {
    gameName: string;
    tagLine: string;
    riotId: string;
    tier: string;
    tierVi: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    queueName: string;
    isMock?: boolean;
    allLeagues?: any[];
  } | null;
  game: GameDefinition;
  server: string;
  queueType: string;
  setQueueType: (val: string) => void;
  handleCheckAccountRank: (e: React.FormEvent, silent?: boolean) => void;
}

export function RiotAccountCheckerSection({
  isRiotGame,
  isRankBoost,
  isPointBoost,
  serviceSlug,
  accountCheckInput,
  setAccountCheckInput,
  isCheckingAccount,
  accountCheckError,
  setAccountCheckError,
  checkedAccount,
  game,
  server,
  queueType,
  setQueueType,
  handleCheckAccountRank,
}: RiotAccountCheckerSectionProps) {
  if (!isRiotGame || (!isRankBoost && !isPointBoost && serviceSlug !== 'net-wins')) {
    return null;
  }

  return (
    <div
      id="riot-account-check-box"
      className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.08)] space-y-4 relative overflow-hidden backdrop-blur-sm"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/60 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-white">
                Kiểm Tra Thông Tin Tài Khoản Riot
              </span>
              <span className="text-red-500 font-black text-sm">*</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30">
                Bắt buộc
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Nhập Ingame # Tagline để tự động nhận diện bậc Rank & Điểm LP chính xác từ Riot Games (Bắt buộc để tránh nhập sai)
            </p>
          </div>
        </div>

        {checkedAccount ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <CheckCircle2 size={12} /> Đã đồng bộ thông tin
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <AlertCircle size={12} /> Chưa xác thực
          </span>
        )}
      </div>

      {/* Input & Button Tra cứu (Tự động nhận diện khi gõ) */}
      <form onSubmit={(e) => handleCheckAccountRank(e, false)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={accountCheckInput}
            onChange={(e) => {
              setAccountCheckInput(e.target.value);
              if (accountCheckError) setAccountCheckError('');
            }}
            placeholder="Nhập Ingame # Tagline (Ví dụ: Mary Tái Lâm #2003)"
            className="w-full h-11 bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-28 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-medium"
          />
          {/* Trạng thái Inline bên trong ô nhập */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none select-none">
            {isCheckingAccount ? (
              <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold animate-pulse">
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span className="hidden sm:inline text-[11px]">Đang tìm...</span>
              </div>
            ) : checkedAccount && accountCheckInput.trim().toLowerCase() === checkedAccount.riotId.toLowerCase() ? (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 size={15} className="shrink-0" />
                <span className="hidden sm:inline text-[11px]">Hợp lệ</span>
              </div>
            ) : null}
          </div>
        </div>
        <button
          type="submit"
          disabled={isCheckingAccount || !accountCheckInput.trim()}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {isCheckingAccount ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            <>
              <Search size={15} />
              <span>Kiểm tra</span>
            </>
          )}
        </button>
      </form>

      {/* Thông báo lỗi validation nếu không có checkedAccount */}
      {accountCheckError && !checkedAccount && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span className="font-semibold">{accountCheckError}</span>
        </div>
      )}

      {/* Card hiển thị kết quả kiểm tra thành công */}
      {checkedAccount && (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-1 relative shadow-inner shrink-0">
                <img
                  src={getRankImage(game.id, { tier: checkedAccount.tier, division: checkedAccount.rank })}
                  alt={checkedAccount.tierVi}
                  className="w-10 h-10 object-contain drop-shadow"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white">{checkedAccount.riotId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {server || 'VN'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {checkedAccount.queueName}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 flex-wrap">
                  <span className="font-bold text-amber-400">
                    {['MASTER', 'GRANDMASTER', 'CHALLENGER', 'RADIANT'].includes(checkedAccount.tier)
                      ? checkedAccount.tierVi
                      : `${checkedAccount.tierVi}${checkedAccount.rank ? ' ' + checkedAccount.rank : ''}`}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-cyan-400 font-bold">{checkedAccount.lp} LP</span>
                  {checkedAccount.wins + checkedAccount.losses > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-400">
                        {checkedAccount.wins}W / {checkedAccount.losses}L (
                        {Math.round((checkedAccount.wins / (checkedAccount.wins + checkedAccount.losses)) * 100)}%)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
              {(() => {
                const isLol = (game.id || '').toLowerCase() === 'lol';
                const isPointEligible = !isLol || ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier);
                const isRankEligible = !isLol || !['GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier);

                if (isPointBoost ? isPointEligible : isRankEligible) {
                  return (
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 shadow-sm">
                      <CheckCircle2 size={14} className="shrink-0" />
                      <span>
                        {isPointBoost ? 'Đã tự động điền Điểm hiện tại' : 'Đã tự động chọn Rank hiện tại'}
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 shadow-sm">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{isPointBoost ? 'Chưa đủ điều kiện Cày Điểm LP' : 'Vượt quá mức Rank tối đa'}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* BANNER ĐIỀU HƯỚNG UX 1: Khách chọn Cày Điểm LP nhưng Rank ở chế độ này < Cao Thủ */}
          {isPointBoost && (game.id || '').toLowerCase() === 'lol' && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-zinc-950 border border-amber-500/40 text-amber-200 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 text-sm">
                    Tài khoản ở chế độ {checkedAccount.queueName} hiện là {checkedAccount.tierVi} {checkedAccount.rank} ({checkedAccount.lp} LP)
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Gói dịch vụ <strong className="text-white">Cày Điểm LP (Net Wins)</strong> trong LMHT chỉ áp dụng cho bậc <strong className="text-amber-400">Cao Thủ (Master) trở lên</strong> vì điểm LP tích lũy vô hạn.
                    Nếu bạn muốn cày từ <strong className="text-white">{checkedAccount.tierVi} {checkedAccount.rank}</strong> lên Cao Thủ, vui lòng chuyển sang gói <strong className="text-cyan-400">Cày Cấp Bậc Rank</strong>!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                <Link
                  href={`/services/lol/rank-boost?queueType=${queueType}&ingame=${encodeURIComponent(checkedAccount.riotId)}`}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Zap size={14} />
                  <span>Chuyển sang gói Cày Cấp Bậc Rank</span>
                  <ArrowRight size={13} />
                </Link>

                {checkedAccount.allLeagues?.some(
                  (l: any) =>
                    ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes((l.tier || '').toUpperCase()) &&
                    l.queueType !== (queueType === 'FLEX' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5')
                ) && (
                  <button
                    type="button"
                    onClick={() => setQueueType(queueType === 'FLEX' ? 'SOLO_DUO' : 'FLEX')}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                  >
                    <Swords size={13} className="text-cyan-400" />
                    <span>Chuyển sang {queueType === 'FLEX' ? 'Đơn / Đôi' : 'Linh Hoạt'} (Có bậc Cao Thủ+)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BANNER ĐIỀU HƯỚNG UX 2: Khách chọn Cày Cấp Bậc Rank nhưng Rank ở chế độ này > Cao Thủ */}
          {isRankBoost && (game.id || '').toLowerCase() === 'lol' && ['GRANDMASTER', 'CHALLENGER'].includes(checkedAccount.tier) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-900/20 to-zinc-950 border border-cyan-500/40 text-cyan-200 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-cyan-300 text-sm">
                    Tài khoản ở chế độ {checkedAccount.queueName} hiện là {checkedAccount.tierVi} ({checkedAccount.lp} LP)
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Gói <strong className="text-white">Cày Cấp Bậc Rank</strong> chỉ áp dụng từ bậc <strong className="text-cyan-400">Cao Thủ trở xuống</strong>.
                    Tài khoản của bạn đã đạt <strong className="text-amber-400">{checkedAccount.tierVi}</strong>, vui lòng chuyển sang gói <strong className="text-cyan-400">Cày Điểm LP (Net Wins)</strong> để cày thêm điểm!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cyan-500/20">
                <Link
                  href={`/services/lol/net-wins?queueType=${queueType}&ingame=${encodeURIComponent(checkedAccount.riotId)}`}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Zap size={14} />
                  <span>Chuyển sang gói Cày Điểm LP</span>
                  <ArrowRight size={13} />
                </Link>

                {checkedAccount.allLeagues?.some(
                  (l: any) =>
                    !['GRANDMASTER', 'CHALLENGER'].includes((l.tier || '').toUpperCase()) &&
                    l.queueType !== (queueType === 'FLEX' ? 'RANKED_FLEX_SR' : 'RANKED_SOLO_5x5')
                ) && (
                  <button
                    type="button"
                    onClick={() => setQueueType(queueType === 'FLEX' ? 'SOLO_DUO' : 'FLEX')}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-white/10 active:scale-95 transition-all"
                  >
                    <Swords size={13} className="text-cyan-400" />
                    <span>Chuyển sang {queueType === 'FLEX' ? 'Đơn / Đôi' : 'Linh Hoạt'} (&le; Cao Thủ)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RiotAccountCheckerSection;
