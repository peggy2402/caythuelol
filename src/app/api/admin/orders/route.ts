import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    await dbConnect();

    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const userQuery = { username: { $regex: search, $options: 'i' } };
      const users = await User.find(userQuery).select('_id');
      const userIds = users.map(u => u._id);

      query.$or = [
        { 'details.account_username': { $regex: search, $options: 'i' } },
        { customerId: { $in: userIds } },
        { boosterId: { $in: userIds } },
      ];
      // Check if search is a valid ObjectId
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(query)
      .populate('customerId', 'username')
      .populate('boosterId', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      orders,
      pagination: { page, totalPages, totalOrders },
    });

  } catch (error) {
    console.error('Get All Orders Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}