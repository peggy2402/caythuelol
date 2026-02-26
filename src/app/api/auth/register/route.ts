import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  console.log("MONGO URI:", process.env.MONGODB_URI)
  try {
    // 1. Kết nối Database
    await dbConnect();

    // 2. Lấy dữ liệu từ request body
    const { username, email, password, role } = await req.json();

    // 3. Validate dữ liệu đầu vào
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ username, email và mật khẩu' },
        { status: 400 }
      );
    }

    // 4. Kiểm tra user đã tồn tại chưa (check cả email và username)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email hoặc Username đã tồn tại trong hệ thống' },
        { status: 409 }
      );
    }

    // 5. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Xác định Role hợp lệ
    // Chỉ cho phép đăng ký CUSTOMER hoặc BOOSTER. Không cho phép đăng ký ADMIN qua API public.
    let userRole = UserRole.CUSTOMER;
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      if (role === UserRole.ADMIN) {
        // Nếu cố tình đăng ký ADMIN, force về CUSTOMER để bảo mật
        userRole = UserRole.CUSTOMER;
      } else {
        userRole = role as UserRole;
      }
    }

    // 7. Tạo User mới và Ví mặc định
    const newUser = new User({
      username,
      email,
      password_hash: passwordHash,
      role: userRole,
      wallet_balance: 0, // Khởi tạo ví 0đ
      pending_balance: 0,
      profile: {
        avatar: '', // Avatar rỗng
      },
    });

    await newUser.save();

    // 8. Trả về kết quả (loại bỏ password hash)
    const { password_hash, ...userWithoutPass } = newUser.toObject();

    return NextResponse.json(
      { success: true, message: 'Đăng ký tài khoản thành công', user: userWithoutPass },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
