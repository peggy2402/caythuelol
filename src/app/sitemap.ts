import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.leorank.site';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/boosters`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/boosters/apply`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vip`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/loyalty`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
  ];

  // Các trang dịch vụ game chi tiết quan trọng nhất cho SEO (Cày thuê Liên Quân, LMHT, Valorant...)
  const gameServices = [
    { game: 'aov', service: 'rank-boost' },
    { game: 'aov', service: 'star-boost' },
    { game: 'aov', service: 'net-wins' },
    { game: 'aov', service: 'placements' },
    { game: 'lol', service: 'rank-boost' },
    { game: 'lol', service: 'net-wins' },
    { game: 'lol', service: 'placements' },
    { game: 'lol', service: 'champion-mastery' },
    { game: 'lol', service: 'arena' },
    { game: 'valorant', service: 'rank-boost' },
    { game: 'valorant', service: 'net-wins' },
    { game: 'valorant', service: 'placements' },
    { game: 'tft', service: 'rank-boost' },
    { game: 'tft', service: 'net-wins' },
    { game: 'wildrift', service: 'rank-boost' },
    { game: 'wildrift', service: 'net-wins' },
    { game: 'fconline', service: 'rank-boost' },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = gameServices.map((item) => ({
    url: `${baseUrl}/services/${item.game}/${item.service}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // Fetch danh sách Booster để index hồ sơ booster công khai
  let boosterRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://apil-lr.leorank.site';
    const res = await fetch(`${apiBase}/api/boosters?limit=50`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const boosters = data.boosters || [];
      boosterRoutes = boosters
        .filter((b: any) => b.username)
        .map((b: any) => ({
          url: `${baseUrl}/b/${b.username}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.75,
        }));
    }
  } catch {
    // Fallback nếu API tạm thời không phản hồi
  }

  return [...staticRoutes, ...serviceRoutes, ...boosterRoutes];
}
