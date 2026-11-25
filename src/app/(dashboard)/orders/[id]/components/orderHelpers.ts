import { GAMES_CATALOG, GameDefinition, getServiceMeta } from '@/lib/games';
import { formatServiceNameVi } from '@/lib/orderStatus';

// Helper lấy metadata tựa game
export function getGameMeta(gameCode?: string) {
  const code = (gameCode || 'LOL').toUpperCase();
  const game = GAMES_CATALOG.find((g: GameDefinition) => g.id.toUpperCase() === code);
  if (game) {
    return {
      name: game.name,
      shortName: game.shortName,
      accentColor: game.accentColor || '#06b6d4',
    };
  }
  return {
    name: code,
    shortName: code,
    accentColor: '#3b82f6',
  };
}

// Helper format tên dịch vụ thân thiện
export function formatServiceName(serviceType?: string, details?: any) {
  return formatServiceNameVi(serviceType, details);
}

// Helper tính KDA
export const calculateKDA = (k: number, d: number, a: number): string => {
  return ((k + a) / Math.max(1, d)).toFixed(1);
};

// Helper tính Team KDA
export const calculateTeamStats = (participants: any[]) => {
  const teams: Record<number, { kills: number; deaths: number; assists: number }> = {
    100: { kills: 0, deaths: 0, assists: 0 },
    200: { kills: 0, deaths: 0, assists: 0 },
  };
  participants.forEach((p) => {
    if (teams[p.teamId]) {
      teams[p.teamId].kills += p.kills || 0;
      teams[p.teamId].deaths += p.deaths || 0;
      teams[p.teamId].assists += p.assists || 0;
    }
  });
  return teams;
};

export function sanitizeMatchDetailClient(detail: any) {
  if (!detail || typeof detail !== 'object') return null;
  try {
    if (detail.info && Array.isArray(detail.info.participants)) {
      return {
        metadata: detail.metadata || null,
        info: {
          gameCreation: detail.info.gameCreation,
          gameDuration: detail.info.gameDuration,
          gameEndTimestamp: detail.info.gameEndTimestamp,
          gameId: detail.info.gameId,
          gameMode: detail.info.gameMode,
          gameType: detail.info.gameType,
          gameVersion: detail.info.gameVersion,
          mapId: detail.info.mapId,
          queueId: detail.info.queueId,
          teams: detail.info.teams,
          participants: detail.info.participants.map((p: any) => ({
            teamId: p.teamId,
            participantId: p.participantId,
            summonerName: p.summonerName,
            riotIdGameName: p.riotIdGameName,
            riotIdTagline: p.riotIdTagline,
            championId: p.championId,
            championName: p.championName,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            win: p.win,
            champLevel: p.champLevel,
            item0: p.item0,
            item1: p.item1,
            item2: p.item2,
            item3: p.item3,
            item4: p.item4,
            item5: p.item5,
            item6: p.item6,
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            goldEarned: p.goldEarned,
            totalMinionsKilled: p.totalMinionsKilled,
            neutralMinionsKilled: p.neutralMinionsKilled,
          })),
        },
      };
    }
    return detail;
  } catch {
    return detail;
  }
}

// Trả về style màu sắc cho badge Game
export const getBoosterGameBadgeStyle = (gameCode: string): string => {
  const code = (gameCode || '').toUpperCase();
  if (code.includes('LOL') || code.includes('LMHT')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (code.includes('AOV') || code.includes('LIENQUAN')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  if (code.includes('VAL')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  if (code.includes('TFT') || code.includes('DTCL')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  if (code.includes('CS2') || code.includes('CS')) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
};

// Định dạng tên dịch vụ tiếng Việt chuẩn chỉ, gọn gàng theo từng tựa game
export const formatBoosterServiceLabel = (gameCode: string, slug: string, customName?: string): string => {
  const normGame = (gameCode || 'LOL').toUpperCase();
  const cleanSlug = (slug || '').toLowerCase().replace(/_/g, '-');

  if (normGame === 'LOL' || normGame === 'LMHT') {
    if (cleanSlug.includes('rank')) return 'Cày Rank / Elo';
    if (cleanSlug.includes('net-win') || cleanSlug.includes('win') || cleanSlug.includes('lp')) return 'Cày Điểm Cao Thủ / Thách Đấu';
    if (cleanSlug.includes('match')) return 'Cày Số Trận Thắng';
    if (cleanSlug.includes('placement')) return 'Phân Hạng Đầu Mùa';
    if (cleanSlug.includes('promo')) return 'Chuỗi Thăng Hạng';
    if (cleanSlug.includes('level')) return 'Cày Cấp Độ 1-30';
    if (cleanSlug.includes('mastery')) return 'Cày Thông Thạo Tướng';
    if (cleanSlug.includes('coach')) return 'Huấn Luyện Coaching';
  }

  if (normGame === 'AOV' || normGame === 'LIENQUAN') {
    if (cleanSlug.includes('rank')) return 'Cày Rank Bậc';
    if (cleanSlug.includes('net-win') || cleanSlug.includes('win') || cleanSlug.includes('sao') || cleanSlug.includes('star')) return 'Cày Rank Theo Số Sao';
    if (cleanSlug.includes('match')) return 'Cày Số Trận Thắng';
    if (cleanSlug.includes('placement')) return 'Phân Hạng Đầu Mùa';
    if (cleanSlug.includes('promo')) return 'Chuỗi Thăng Hạng';
    if (cleanSlug.includes('coach')) return 'Huấn Luyện Coaching';
  }

  if (normGame === 'VALORANT' || normGame === 'VAL') {
    if (cleanSlug.includes('rank')) return 'Cày Rank / Elo';
    if (cleanSlug.includes('placement')) return 'Cày Phân Hạng';
    if (cleanSlug.includes('net-win') || cleanSlug.includes('win') || cleanSlug.includes('rr')) return 'Cày Điểm RR';
    if (cleanSlug.includes('match')) return 'Cày Số Trận Thắng';
    if (cleanSlug.includes('level')) return 'Cày Cấp 20';
    if (cleanSlug.includes('coach')) return 'Huấn Luyện Coaching';
  }

  if (normGame === 'TFT' || normGame === 'DTCL') {
    if (cleanSlug.includes('rank')) return 'Cày Rank / Top ĐTCL';
    if (cleanSlug.includes('net-win') || cleanSlug.includes('win') || cleanSlug.includes('lp')) return 'Cày Điểm LP ĐTCL';
    if (cleanSlug.includes('match')) return 'Cày Số Trận ĐTCL';
    if (cleanSlug.includes('placement')) return 'Phân Hạng ĐTCL';
    if (cleanSlug.includes('coach')) return 'Huấn Luyện Coaching';
  }

  if (normGame === 'CS2') {
    if (cleanSlug.includes('rank')) return 'Cày Premier / Competitive';
    if (cleanSlug.includes('net-win') || cleanSlug.includes('win') || cleanSlug.includes('rating')) return 'Cày Điểm Rating CS2';
    if (cleanSlug.includes('match')) return 'Cày Số Trận CS2';
    if (cleanSlug.includes('coach')) return 'Huấn Luyện Coaching';
  }

  if (customName && customName !== slug && !customName.includes('-')) {
    return customName;
  }

  const meta = getServiceMeta(normGame, cleanSlug);
  if (meta?.name) return meta.name;

  return cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
