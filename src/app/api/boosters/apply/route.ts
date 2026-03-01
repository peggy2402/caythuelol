// src/app/api/booster/apply/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // Giả sử bạn dùng auth.ts như trong context
import dbConnect from "@/lib/db";
import BoosterApplication from "@/models/BoosterApplication";
import { z } from "zod";

// Schema validation backend
const applySchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().min(10),
  facebookUrl: z.string().url(),
  discordTag: z.string().min(3),
  currentRank: z.string().min(1),
  highestRank: z.string().min(1),
  opggLink: z.string().url(),
  rankImageUrl: z.string().url(), // URL ảnh đã upload (Cloudinary)
  bankName: z.string().min(1),
  bankAccountName: z.string().min(1),
  bankAccountNumber: z.string().min(1),
  agreementSigned_name: z.string().min(2),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // 1. Validate Input
    const validatedData = applySchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: validatedData.error }, { status: 400 });
    }

    // 2. Validate Signature Logic
    if (validatedData.data.agreementSigned_name.toLowerCase() !== validatedData.data.fullName.toLowerCase()) {
      return NextResponse.json({ error: "Chữ ký xác nhận không khớp với họ tên" }, { status: 400 });
    }

    await dbConnect();

    // 3. Check existing application
    const existingApp = await BoosterApplication.findOne({ userId: session.user.id });
    if (existingApp && existingApp.status === 'pending') {
      return NextResponse.json({ error: "Bạn đã có đơn đăng ký đang chờ duyệt." }, { status: 409 });
    }

    // 4. Create Application
    const newApp = await BoosterApplication.create({
      userId: session.user.id,
      ...validatedData.data,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, applicationId: newApp._id });

  } catch (error) {
    console.error("Apply Booster Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
