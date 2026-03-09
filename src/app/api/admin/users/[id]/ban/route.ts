// src/app/api/admin/users/[id]/ban/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await dbConnect();
    
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Toggle Ban Status
    // Note: Ensure your User schema has 'isBanned' field. If not, you might need to add it to the model.
    // Assuming Mongoose schema is flexible or updated.
    user.isBanned = !user.isBanned;
    await user.save();

    return NextResponse.json({ success: true, isBanned: user.isBanned });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
