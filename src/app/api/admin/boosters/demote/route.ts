import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import BoosterApplication from "@/models/BoosterApplication";
import AuditLog from "@/models/AuditLog";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, reason } = await req.json();

    await dbConnect();

    // 1. Chuyển Role User về CUSTOMER
    await User.findByIdAndUpdate(userId, { role: "CUSTOMER" });

    // 2. Cập nhật trạng thái đơn đăng ký cũ
    // Chuyển status thành 'rejected' (để không còn là approved)
    // depositStatus tùy thuộc vào chính sách (ở đây tạm để 'refunded' để Admin xử lý tiền nong sau)
    await BoosterApplication.findOneAndUpdate(
      { userId, status: "approved" },
      { 
        status: "rejected", 
        depositStatus: "refunded",
        note: reason ? `Admin hủy tư cách: ${reason}` : "Admin hủy tư cách Booster"
      }
    );

    // 3. Ghi Audit Log
    await AuditLog.create({
      actorId: session.user.id,
      targetId: userId,
      action: "DEMOTE_BOOSTER",
      description: reason ? `Hủy tư cách Booster. Lý do: ${reason}` : "Hủy tư cách Booster",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demote Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
