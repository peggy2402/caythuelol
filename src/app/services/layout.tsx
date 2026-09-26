import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dịch Vụ Cày Thuê Game Uy Tín - Bảng Giá & Thuê Booster',
  description: 'Hệ thống dịch vụ cày thuê game uy tín số 1 Việt Nam. Cung cấp dịch vụ leo rank, cày thuê đa game: LMHT, Liên Quân Mobile, Valorant, Tốc Chiến, ĐTCL (TFT), CS2... Bảng giá minh bạch, an toàn tuyệt đối với đội ngũ booster trình độ cao.',
  keywords: [
    'dịch vụ cày thuê game',
    'bảng giá cày thuê',
    'thuê booster',
    'cày thuê uy tín',
    'boost rank',
    'cày thuê lol',
    'cày thuê liên quân',
    'cày thuê valorant',
    'cày thuê tốc chiến',
    'cày thuê tft',
    'kéo rank giá rẻ',
  ],
  openGraph: {
    title: 'Dịch Vụ Cày Thuê Game Uy Tín - Bảng Giá & Thuê Booster | LEORANK',
    description: 'Chọn ngay Booster ưng ý để leo rank thần tốc trong mọi tựa game. Cam kết bảo mật tài khoản và hoàn tiền nếu không đạt yêu cầu.',
    type: 'website',
    url: '/services',
  },
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}