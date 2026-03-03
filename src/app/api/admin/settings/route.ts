import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SystemSetting from '@/models/SystemSetting';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import User, { UserRole } from '@/models/User';

// Helper: Kiểm tra quyền Admin
async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    
    await dbConnect();
    const user = await User.findById(userId);
    if (user && user.role === UserRole.ADMIN) {
        return user;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await SystemSetting.find({});
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, value, description } = body;

    if (!key) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Cập nhật hoặc tạo mới setting (Upsert)
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { value, description },
      { upsert: true, new: true }
    );

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Update Setting Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
