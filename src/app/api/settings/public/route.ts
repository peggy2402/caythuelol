import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SystemSetting from "@/models/SystemSetting";

export const dynamic = 'force-dynamic'; // Đảm bảo không bị cache static

export async function GET() {
  try {
    await dbConnect();
    
    // Whitelist: Chỉ cho phép lấy các key cấu hình công khai
    const publicKeys = [
      'ADMIN_BANK_INFO', 
      'booster_registration_config'
    ];

    const settings = await SystemSetting.find({ key: { $in: publicKeys } }).select('key value');
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Public Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}