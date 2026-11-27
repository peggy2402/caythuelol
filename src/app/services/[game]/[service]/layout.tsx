import { Metadata } from 'next';
import { GAMES_CATALOG } from '@/lib/games';

const SERVICE_TITLES: Record<string, string> = {
  'rank-boost': 'Cày Cấp Bậc (Rank Boost)',
  'net-wins': 'Cày Trận Thắng (Net Wins)',
  'placements': 'Cày 5 Trận Phân Hạng Đầu Mùa (Placements)',
  'champion-mastery': 'Cày Thông Thạo Tướng',
  'arena': 'Cày Chế Độ Võ Đài (Arena)',
  'leveling': 'Cày Cấp Độ Tài Khoản (Leveling)',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ game: string; service: string }>;
}): Promise<Metadata> {
  const { game, service } = await params;
  const gameDef = GAMES_CATALOG.find(
    (g) => g.id.toLowerCase() === game.toLowerCase() || g.shortName?.toLowerCase() === game.toLowerCase()
  );
  const gameName = gameDef?.name || game.toUpperCase();
  const serviceName = SERVICE_TITLES[service.toLowerCase()] || service.replace(/-/g, ' ').toUpperCase();

  const title = `${serviceName} ${gameName} Uy Tín, Giá Rẻ - Kéo Rank Thần Tốc`;
  const description = `Dịch vụ ${serviceName} tựa game ${gameName} chuyên nghiệp số 1 Việt Nam. Đội ngũ Booster Thách Đấu leo rank siêu tốc, bảo mật tài khoản 100%, bảo hành uy tín tại LeoRank.`;

  return {
    title,
    description,
    keywords: [
      `cày thuê ${gameName.toLowerCase()}`,
      `cày rank ${gameName.toLowerCase()}`,
      `kéo rank ${gameName.toLowerCase()}`,
      `bảng giá ${serviceName.toLowerCase()}`,
      'cày thuê uy tín',
      'leorank',
      'thuê booster',
    ],
    alternates: {
      canonical: `/services/${game}/${service}`,
    },
    openGraph: {
      title: `${title} | LeoRank`,
      description,
      url: `/services/${game}/${service}`,
      type: 'website',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${serviceName} ${gameName} - LeoRank`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | LeoRank`,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default function ServiceDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
