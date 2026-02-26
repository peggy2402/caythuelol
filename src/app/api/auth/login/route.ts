import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Identifier and password are required' }, { status: 400 });
    }

    // Find user by email or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${identifier}$`, 'i') },
        { username: new RegExp(`^${identifier}$`, 'i') }
      ]
    }).select('+password_hash'); // Explicitly include password_hash if it's excluded by default

    if (!user || !user.password_hash) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT Payload
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' } // Token expires in 7 days
    );
    
    // Prepare user object to return to client (without sensitive data)
    const userResponse = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        wallet_balance: user.wallet_balance,
        profile: user.profile,
    };

    return NextResponse.json({ success: true, token, user: userResponse });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
