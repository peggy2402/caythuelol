// src/lib/lanes.ts

export interface LaneMeta {
  id: string; // 'top' | 'jungle' | 'mid' | 'adc' | 'sp' | 'random'
  name: string;
  shortName: string;
  image: string;
  description: string;
}

export const MOBA_LANES_AOV: LaneMeta[] = [
  {
    id: 'top',
    name: 'Đường Caesar',
    shortName: 'Caesar',
    image: '/images/lane-aov/top.png',
    description: 'Đấu sĩ, đỡ đòn đường Tà thần Caesar',
  },
  {
    id: 'jungle',
    name: 'Đi Rừng',
    shortName: 'Rừng',
    image: '/images/lane-aov/jungle.png',
    description: 'Sát thủ, đấu sĩ kiểm soát rừng và mục tiêu lớn',
  },
  {
    id: 'mid',
    name: 'Đường Giữa',
    shortName: 'Mid',
    image: '/images/lane-aov/mid.png',
    description: 'Pháp sư kiểm soát khu vực trung tâm bản đồ',
  },
  {
    id: 'adc',
    name: 'Đường Rồng',
    shortName: 'Xạ Thủ',
    image: '/images/lane-aov/adc.png',
    description: 'Xạ thủ sát thương vật lý chủ lực đường Rồng Ánh Sáng',
  },
  {
    id: 'sp',
    name: 'Trợ Thủ',
    shortName: 'Trợ Thủ',
    image: '/images/lane-aov/sp.png',
    description: 'Đỡ đòn, hỗ trợ mở giao tranh và bảo kê chủ lực',
  },
  {
    id: 'random',
    name: 'Đường Bất Kỳ',
    shortName: 'Bất Kỳ',
    image: '/images/lane-aov/random-lane.png',
    description: 'Booster tự chọn vị trí tối ưu theo từng trận',
  },
];

export const MOBA_LANES_LOL: LaneMeta[] = [
  {
    id: 'jungle',
    name: 'Đi Rừng (Jungle)',
    shortName: 'Đi Rừng',
    image: '/images/lane-lol/jungle.png',
    description: 'Kiểm soát rừng và can thiệp các đường',
  },
  {
    id: 'top',
    name: 'Đường Trên (Top)',
    shortName: 'Đường Trên',
    image: '/images/lane-lol/top.png',
    description: 'Đấu sĩ, đỡ đòn đường trên',
  },
  {
    id: 'mid',
    name: 'Đường Giữa (Mid)',
    shortName: 'Đường Giữa',
    image: '/images/lane-lol/mid.png',
    description: 'Pháp sư, sát thủ đường giữa',
  },
  {
    id: 'adc',
    name: 'Đường Dưới (ADC)',
    shortName: 'Đường Dưới',
    image: '/images/lane-lol/adc.png',
    description: 'Xạ thủ đường dưới',
  },
  {
    id: 'sp',
    name: 'Hỗ Trợ (Support)',
    shortName: 'Hỗ Trợ',
    image: '/images/lane-lol/sp.png',
    description: 'Hỗ trợ kiểm soát tầm nhìn và giao tranh',
  },
];

export function getMobaLanes(gameId?: string): LaneMeta[] {
  const g = (gameId || '').toLowerCase();
  if (g.includes('aov') || g.includes('lienquan') || g.includes('lqm') || g.includes('arena_of_valor')) {
    return MOBA_LANES_AOV;
  }
  // Mặc định cho LMHT (LOL, LEAGUE) hoặc các tựa game MOBA khác
  return MOBA_LANES_LOL;
}

export function isMobaGame(gameId?: string): boolean {
  const g = (gameId || '').toLowerCase();
  return (
    g.includes('aov') ||
    g.includes('lienquan') ||
    g.includes('lol') ||
    g.includes('league') ||
    g.includes('wild_rift')
  );
}

export function getLaneMeta(laneId: string, gameId?: string): LaneMeta {
  const lanes = getMobaLanes(gameId);
  const key = (laneId || '').toLowerCase().trim();

  const direct = lanes.find(
    (l) =>
      l.id.toLowerCase() === key ||
      l.name.toLowerCase() === key ||
      l.shortName.toLowerCase() === key,
  );
  if (direct) return direct;

  if (key.includes('jungle') || key.includes('rừng') || key.includes('jg'))
    return lanes.find((l) => l.id === 'jungle') || lanes[0];
  if (key.includes('top') || key.includes('caesar') || key.includes('trên'))
    return lanes.find((l) => l.id === 'top') || lanes[0];
  if (key.includes('mid') || key.includes('middle') || key.includes('giữa'))
    return lanes.find((l) => l.id === 'mid') || lanes[0];
  if (
    key.includes('adc') ||
    key.includes('rồng') ||
    key.includes('bot') ||
    key.includes('dưới') ||
    key.includes('xạ thủ')
  )
    return lanes.find((l) => l.id === 'adc') || lanes[0];
  if (
    key.includes('sp') ||
    key.includes('trợ thủ') ||
    key.includes('hỗ trợ') ||
    key.includes('sup') ||
    key.includes('support')
  )
    return lanes.find((l) => l.id === 'sp') || lanes[0];
  if (
    key.includes('random') ||
    key.includes('bất kỳ') ||
    key.includes('fill') ||
    key.includes('any')
  )
    return lanes.find((l) => l.id === 'random') || lanes[0];

  const isAov = (gameId || '').toLowerCase().includes('aov') || (gameId || '').toLowerCase().includes('lienquan');
  return {
    id: laneId,
    name: laneId,
    shortName: laneId,
    image: isAov ? '/images/lane-aov/random-lane.png' : '/images/lane-lol/mid.png',
    description: 'Vị trí chỉ định',
  };
}
