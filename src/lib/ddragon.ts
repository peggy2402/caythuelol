/**
 * Riot Games Data Dragon Utility Helper
 * Tự động cập nhật patch version mới nhất (ví dụ: 16.23.1) thay vì hardcode
 */

let cachedVersion: string | null = null;
let lastFetchTime = 0;

/**
 * Lấy version mới nhất từ Riot DDragon API (GET https://ddragon.leagueoflegends.com/api/versions.json)
 * Có cơ chế in-memory caching 6 giờ để tối ưu performance
 */
export async function getLatestDDragonVersion(): Promise<string> {
  const now = Date.now();
  if (cachedVersion && now - lastFetchTime < 6 * 3600 * 1000) {
    return cachedVersion;
  }

  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json', {
      next: { revalidate: 21600 }, // Cache 6 giờ
    });
    if (res.ok) {
      const versions = await res.json();
      if (Array.isArray(versions) && versions.length > 0 && typeof versions[0] === 'string') {
        cachedVersion = versions[0];
        lastFetchTime = now;
        return cachedVersion;
      }
    }
  } catch {
    // Fallback nếu không kết nối được
  }

  return cachedVersion || '16.23.1';
}

/**
 * Trả về URL icon tướng theo version động
 */
export function getChampionIconUrl(championNameOrId: string, version = '16.23.1'): string {
  const clean = championNameOrId.endsWith('.png') ? championNameOrId : `${championNameOrId}.png`;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${clean}`;
}

/**
 * Trả về URL splash art tướng
 */
export function getChampionSplashUrl(championId: string, skinNum = 0): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_${skinNum}.jpg`;
}

/**
 * Trả về URL icon trang bị (Item) theo version động
 */
export function getItemIconUrl(itemId: string | number, version = '16.23.1'): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}
