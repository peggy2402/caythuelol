import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh Sách Tuyển Thủ Cày Thuê Chuyên Nghiệp - Thuê Booster Rank Cao',
  description:
    'Khám phá danh sách tuyển thủ cày thuê rank Thách Đấu, Cao Thủ hàng đầu Việt Nam tại LeoRank. Xem hồ sơ minh bạch, tỷ lệ thắng, đánh giá từ khách hàng thật và thuê ngay.',
  keywords: [
    'danh sách booster',
    'thuê booster lmht',
    'booster thách đấu',
    'tuyển thủ cày thuê',
    'thuê cày rank liên minh',
    'thuê cày rank tốc chiến',
    'thuê cày valorant',
    'leorank booster',
  ],
  alternates: {
    canonical: '/boosters',
  },
  openGraph: {
    title: 'Danh Sách Tuyển Thủ Cày Thuê Chuyên Nghiệp | LeoRank',
    description:
      'Chọn tuyển thủ cày thuê uy tín, xem review chân thật, tỷ lệ thắng cao. Leo rank bảo mật tuyệt đối tại LeoRank.',
    url: '/boosters',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LeoRank Boosters Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Danh Sách Tuyển Thủ Cày Thuê Chuyên Nghiệp | LeoRank',
    description: 'Chọn tuyển thủ cày rank Thách Đấu, Cao Thủ uy tín số 1 Việt Nam.',
    images: ['/og-image.png'],
  },
};

export default function BoostersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
