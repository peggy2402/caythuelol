import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import BoosterProfile from '@/models/BoosterProfile';
import { BoosterProfileView } from '@/app/boosters/[id]/page';

type Props = {
  params: Promise<{ username: string }>;
};

// 1. Tạo Metadata động cho SEO (Server-side)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  await dbConnect();
  
  // Tìm user theo username (không phân biệt hoa thường)
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select('username profile booster_info');
  if (!user) return { title: 'Booster Not Found' };

  // Lấy thông tin profile (Ưu tiên BoosterProfile nếu có, fallback sang booster_info trong User)
  const profile = await BoosterProfile.findOne({ userId: user._id }) || {};
  const info = { ...user.booster_info, ...profile };

  const statsText = info.rating ? `⭐ ${info.rating} (${info.completed_orders || 0} đơn)` : '';

  return {
    title: `${user.username} ${statsText} - Professional Booster`,
    description: info.bio || `Thuê ${user.username} cày thuê LMHT uy tín, giá rẻ, tốc độ cao. Xem bảng giá và đánh giá chi tiết.`,
    openGraph: {
      title: `Thuê Booster ${user.username} ${statsText}`,
      description: info.bio || `Xem hồ sơ, bảng giá và đánh giá của ${user.username}.`,
      images: user.profile?.avatar ? [user.profile.avatar] : [],
      type: 'profile',
    },
  };
}

// 2. Render Page (Wrapper)
export default async function ShortProfilePage({ params }: Props) {
  const { username } = await params;
  
  await dbConnect();
  // Resolve ID từ Username để đảm bảo Component con nhận được ID chuẩn
  const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).select('_id');
  
  if (!user) notFound();

  // Truyền ID thật (ObjectId string) thay vì @username để tránh lỗi logic ở component con
  return <BoosterProfileView id={user._id.toString()} />;
}
