import { Metadata } from 'next';
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
  
  const user = await User.findOne({ username }).select('username profile');
  if (!user) return { title: 'Booster Not Found' };

  const profile = await BoosterProfile.findOne({ userId: user._id });

  return {
    title: `${user.username} - Professional Booster | CAYTHUELOL`,
    description: profile?.bio || `Thuê ${user.username} cày thuê LMHT uy tín, giá rẻ, tốc độ cao.`,
    openGraph: {
      title: `Thuê Booster ${user.username} - Cày Thuê LOL`,
      description: profile?.bio || `Xem hồ sơ, bảng giá và đánh giá của ${user.username}.`,
      images: user.profile?.avatar ? [user.profile.avatar] : [],
      type: 'profile',
    },
  };
}

// 2. Render Page (Wrapper)
export default async function ShortProfilePage({ params }: Props) {
  const { username } = await params;
  return <BoosterProfileView id={`@${username}`} />;
}
