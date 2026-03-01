import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    const boosters = await User.find({ role: 'BOOSTER' })
      .select('username profile booster_info')
      .sort({ 'booster_info.rating': -1 });

    return NextResponse.json({ boosters });
  } catch (error) {
    console.error("Fetch Public Boosters Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
