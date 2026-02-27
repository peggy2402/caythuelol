import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    // Xóa user khỏi database
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ error: 'userNotFound' }, { status: 404 });
    }

    const response = NextResponse.json({ success: true, message: 'deleteAccountToastSuccess' });
    response.cookies.delete('token'); // Xóa cookie đăng nhập
    
    return response;
  } catch (error) {
    console.error('Delete Account Error:', error);
    return NextResponse.json({ error: 'serverError' }, { status: 500 });
  }
}
