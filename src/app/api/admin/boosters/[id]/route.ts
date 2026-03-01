import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BoosterApplication from "@/models/BoosterApplication";
import User from "@/models/User";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json(); // 'approved' | 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    await dbConnect();
    
    const application = await BoosterApplication.findById(params.id);
    if (!application) {
      return NextResponse.json({ error: "Không tìm thấy đơn đăng ký" }, { status: 404 });
    }

    // 1. Cập nhật trạng thái đơn
    application.status = status;
    if (status === 'approved') {
        application.boosterLevel = 'new'; // Level khởi điểm
        application.reviewedAt = new Date();
        application.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    }
    await application.save();

    // 2. Nếu Duyệt -> Nâng cấp User lên BOOSTER
    if (status === 'approved') {
      await User.findByIdAndUpdate(application.userId, { role: 'BOOSTER' });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Admin Update App Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}