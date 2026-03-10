import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import BoosterApplication from "@/models/BoosterApplication";
import Notification from "@/models/Notification";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // 1. Chuyển Role về CUSTOMER
    await User.findByIdAndUpdate(session.user.id, { role: "CUSTOMER" });

    // 2. Cập nhật đơn đăng ký
    await BoosterApplication.findOneAndUpdate(
      { userId: session.user.id, status: "approved" },
      { 
        status: "rejected", // Coi như bị từ chối/hủy để reset quy trình
        depositStatus: "refunded", // Giả định nghỉ việc êm đẹp thì hoàn cọc
        note: "Booster tự xin nghỉ (Resigned)"
      }
    );

    // 3. Thông báo cho Admin để hoàn cọc
    const admins = await User.find({ role: 'ADMIN' });
    if (admins.length > 0) {
      await Notification.insertMany(admins.map(admin => ({
        userId: admin._id,
        title: "⚠️ Booster xin nghỉ việc",
        message: `Booster ${session.user.username || session.user.email} đã xin rút quyền. Vui lòng kiểm tra và hoàn cọc (nếu có).`,
        type: "SYSTEM",
        link: "/admin/boosters"
      })));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resign Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
