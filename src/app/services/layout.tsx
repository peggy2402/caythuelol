import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dịch vụ Cày Thuê LOL Uy Tín - Bảng Giá & Thuê Booster | CAYTHUELOL',
  description: 'Hệ thống cày thuê Liên Minh Huyền Thoại số 1 Việt Nam. Dịch vụ leo Rank, Cày Thông Thạo, Placement với đội ngũ Thách Đấu. Giá rẻ, an toàn tuyệt đối.',
  keywords: ['cày thuê lol', 'thuê booster', 'bảng giá cày thuê', 'leo rank thần tốc', 'cày thông thạo tướng'],
  openGraph: {
    title: 'Dịch vụ Cày Thuê LOL Uy Tín - Bảng Giá & Thuê Booster',
    description: 'Chọn ngay Booster ưng ý để leo rank thần tốc. Cam kết bảo mật và hoàn tiền nếu không đạt yêu cầu.',
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