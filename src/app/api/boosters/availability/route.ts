import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'BOOSTER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isReady } = await req.json();

    await dbConnect();
    
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { "booster_info.isReady": isReady } },
      { new: true }
    );

    return NextResponse.json({ success: true, isReady: user?.booster_info?.isReady });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
