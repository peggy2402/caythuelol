import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.zentramart.site';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/', // Chặn Google index trang quản trị
        '/api/',       // Chặn Google index API
        '/admin/',     // Chặn trang admin (nếu có)
        '/_next/',     // Chặn file build nội bộ
        '/static/',    // Chặn file tĩnh không cần thiết
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
