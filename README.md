# Cày Thuê LOL - League of Legends Boosting Platform

Nền tảng kết nối Khách hàng và Booster uy tín, tự động hóa quy trình đặt đơn, thanh toán và quản lý tiến độ cày thuê Liên Minh Huyền Thoại.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + Shadcn UI
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Realtime:** Socket.io (Custom Server)
- **Authentication:** JWT + Google OAuth
- **Payment:** SePay (VietQR Webhook)
- **Storage:** Cloudinary

## ✨ Tính năng chính

### 👤 Khách hàng (Customer)

- **Đặt đơn đa dạng:** Cày Rank, Net Wins, Phân hạng (Placements), Thông thạo (Mastery), Cày cấp (Leveling).
- **Tính giá tự động:** Hệ thống tính giá minh bạch dựa trên Rank hiện tại/mong muốn, LP Gain, và các tùy chọn thêm (Tốc độ, Tướng, Duo...).
- **Ví điện tử:** Nạp tiền tự động qua QR Code (SePay), lịch sử giao dịch realtime.
- **Tìm kiếm Booster:** Lọc Booster theo đánh giá, số đơn hoàn thành, tướng sở trường.

### 🎮 Booster

- **Quản lý dịch vụ:** Tự cấu hình bảng giá, bật/tắt dịch vụ, thiết lập hệ số Elo (Dễ/Khó).
- **Dashboard:** Thống kê thu nhập, đơn hàng đang chạy, lịch sử rút tiền.
- **Nhận đơn:** Xem chi tiết yêu cầu, chat với khách hàng, cập nhật tiến độ.

### 🛡️ Admin

- **Quản lý người dùng:** Duyệt hồ sơ Booster, quản lý Customer.
- **Quản lý tài chính:** Duyệt lệnh rút tiền, kiểm soát dòng tiền (Escrow), cấu hình phí sàn.
- **Cấu hình hệ thống:** Cài đặt tham số chung, banner, thông báo.

## 📂 Cấu trúc dự án

```bash
caythuelol/
├── src/
│   ├── app/                    # Next.js App Router (Pages & API)
│   │   ├── (auth)/             # Login, Register, Forgot Password
│   │   ├── (dashboard)/        # Admin/Booster/Customer Dashboards
│   │   ├── api/                # Backend API Routes
│   │   └── services/           # Public Service Pages
│   ├── components/             # Reusable UI Components
│   ├── lib/                    # Utilities (DB, Auth, Pricing, Socket)
│   ├── models/                 # Mongoose Schemas (User, Order, Transaction)
│   └── types/                  # TypeScript Interfaces
├── public/                     # Static Assets
└── socket-server/              # Node.js Server for Socket.io
```

## 🛠️ Cài đặt & Chạy dự án

1.  **Clone repository:**

    ```bash
    git clone https://github.com/your-username/caythuelol.git
    cd caythuelol
    ```

2.  **Cài đặt dependencies:**

    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Cấu hình biến môi trường (.env.local):**

    Tạo file `.env.local` và điền các thông tin sau:

    ```env
    # Database
    MONGODB_URI=mongodb+srv://...

    # Auth
    JWT_SECRET=your_super_secret_key
    NEXTAUTH_URL=http://localhost:3000

    # Google OAuth
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...

    # Cloudinary
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...

    # Security
    ENCRYPTION_KEY=your_32_char_encryption_key
    ```

4.  **Chạy Development Server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
