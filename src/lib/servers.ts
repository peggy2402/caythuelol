export interface GameServer {
  name: string;
  code: string;
  platformId?: string;
  region: string;
  flag: string;
}

export const GAME_SERVERS: GameServer[] = [
  { name: 'Vietnam', code: 'VN', platformId: 'VN2', region: 'Vietnam', flag: '🇻🇳' },
  { name: 'Southeast Asia', code: 'SEA', platformId: 'SG2', region: 'Southeast Asia', flag: '🌏' },
  { name: 'North America', code: 'NA', platformId: 'NA1', region: 'North America', flag: '🇺🇸' },
  { name: 'Europe West', code: 'EUW', platformId: 'EUW1', region: 'Europe', flag: '🇪🇺' },
  { name: 'Europe Nordic & East', code: 'EUNE', platformId: 'EUN1', region: 'Europe', flag: '🇪🇺' },
  { name: 'Korea', code: 'KR', platformId: 'KR', region: 'Asia', flag: '🇰🇷' },
  { name: 'Japan', code: 'JP', platformId: 'JP1', region: 'Asia', flag: '🇯🇵' },
  { name: 'Taiwan', code: 'TW', platformId: 'TW2', region: 'Asia', flag: '🇹🇼' },
  { name: 'Oceania', code: 'OCE', platformId: 'OC1', region: 'Oceania', flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', platformId: 'BR1', region: 'Americas', flag: '🇧🇷' },
  { name: 'Latin America North', code: 'LAN', platformId: 'LA1', region: 'Americas', flag: '🇲🇽' },
  { name: 'Latin America South', code: 'LAS', platformId: 'LA2', region: 'Americas', flag: '🇨🇱' },
  { name: 'Türkiye', code: 'TR', platformId: 'TR1', region: 'Europe', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', platformId: 'RU', region: 'Europe', flag: '🇷🇺' },
  { name: 'Middle East', code: 'ME', platformId: 'ME1', region: 'Middle East', flag: '🇦🇪' },
  { name: 'Public Beta Environment', code: 'PBE', platformId: 'PBE', region: 'Americas', flag: '🧪' },
];

export function getServerByCode(code?: string): GameServer | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return GAME_SERVERS.find((s) => s.code.toUpperCase() === upper || s.name.toUpperCase() === upper);
}
