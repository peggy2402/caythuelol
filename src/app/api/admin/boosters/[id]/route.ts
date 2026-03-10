import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import BoosterApplication from "@/models/BoosterApplication";
import User from "@/models/User";
import { sendEmail } from "@/lib/mail";
import Notification from "@/models/Notification";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, note } = await req.json(); // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    await dbConnect();
    
    // Populate userId để lấy thông tin email
    const application = await BoosterApplication.findById(params.id).populate(
      "userId",
      "email"
    );
    if (!application) {
      return NextResponse.json({ error: "Không tìm thấy đơn đăng ký" }, { status: 404 });
    }

    // 1. Cập nhật trạng thái đơn
    application.status = status;
    application.reviewedAt = new Date();
    if (note) application.note = note; // Lưu ghi chú nếu có
    application.reviewedBy = new mongoose.Types.ObjectId(session.user.id);
    if (status === 'approved') {
        application.boosterLevel = 'new'; // Level khởi điểm
        // Tự động chuyển trạng thái cọc thành "paid" khi duyệt
        application.depositStatus = 'paid';
    }
    await application.save();

    // 2. Nếu Duyệt -> Nâng cấp User lên BOOSTER
    if (status === 'approved') {
      await User.findByIdAndUpdate(application.userId, { 
        role: 'BOOSTER',
        'profile.bank_info': {
          bankName: application.bankName,
          accountNumber: application.bankAccountNumber,
          accountHolder: application.bankAccountName
        }
      });
    }

    // 3. Tạo thông báo In-App (Notification)
    await Notification.create({
      userId: application.userId,
      title: status === 'approved' ? 'Đơn đăng ký Booster được duyệt' : 'Đơn đăng ký Booster bị từ chối',
      message: status === 'approved' ? 'Chúc mừng! Bạn đã trở thành Booster chính thức.' : `Lý do: ${note || 'Không có lý do cụ thể'}`,
      type: 'SYSTEM',
      link: status === 'approved' ? '/booster/dashboard' : '/boosters/apply',
    });

    // 4. Gửi Email thông báo
    // @ts-ignore - userId is populated
    const userEmail = application.userId.email;
    const userName = application.fullName;

    if (status === "approved") {
      await sendEmail(
        userEmail,
        "🎉 Chúc mừng! Đơn đăng ký Booster của bạn đã được duyệt",
        `
          <h1>Xin chào ${userName},</h1>
          <p>Chúng tôi vui mừng thông báo rằng đơn đăng ký trở thành Booster của bạn đã được <strong>CHẤP THUẬN</strong>.</p>
          <p>Từ bây giờ, bạn có thể truy cập vào Bảng điều khiển Booster để bắt đầu cấu hình dịch vụ và nhận những đơn hàng đầu tiên.</p>
          <p>Chào mừng bạn đến với đội ngũ!</p>
          <br/>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 8px;">Truy cập Dashboard</a>
        `,
      );
    } else if (status === "rejected") {
      await sendEmail(
        userEmail,
        "Thông báo về đơn đăng ký Booster của bạn",
        `
          <h1>Xin chào ${userName},</h1>
          <p>Chúng tôi rất tiếc phải thông báo rằng đơn đăng ký trở thành Booster của bạn đã bị <strong>TỪ CHỐI</strong>.</p>
          <p>Lý do có thể do thông tin cung cấp chưa chính xác hoặc không đáp ứng tiêu chí hiện tại của chúng tôi. Bạn có thể liên hệ bộ phận hỗ trợ để biết thêm chi tiết.</p>
          <p>Cảm ơn bạn đã quan tâm.</p>
        `,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Update App Error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}