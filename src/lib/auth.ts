import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import dbConnect from "@/lib/db";
import User from "@/models/User";
const cypto = require("crypto");
const JWT_SECRET = process.env.JWT_SECRET || cypto.randomBytes(32).toString("hex"); // Fallback nếu chưa có env, nhưng nên đặt trong .env để ổn định
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Session {
  user: SessionUser;
}

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);

  if (!payload) return null;

  try {
    await dbConnect();
    // Lấy ID từ payload (hỗ trợ cả id thường và userId từ Google Auth)
    const userId = payload.id || payload.userId || payload.sub;
    const user = await User.findById(userId);

    if (!user) return null;

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role, // Luôn lấy role mới nhất từ DB
        avatar: user.profile?.avatar,
      },
    };
  } catch (error) {
    return null;
  }
}