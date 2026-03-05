Project: LOL Boosting Platform
Date started: 2026-02-25
Last updated: 2026-03-06

Purpose:

- Ghi lại toàn bộ các quyết định kiến trúc, schema, API, công thức giá, luồng tiền, và các bước triển khai.
- Được cập nhật liên tục bởi AI Assistant để theo dõi tiến độ dự án.

Change log & decisions:

1. 2026-02-25 — Initial spec

- Chọn stack: Next.js 14 (App Router) + TypeScript + TailwindCSS + Shadcn UI.
- Backend: Next.js API routes (serverless functions) + separate Socket.io server recommended for realtime.
- DB: MongoDB Atlas (use Change Streams for notification fallback).
- Auth: JWT + RBAC.
- Storage: Cloudinary for images (signed uploads).
- Payments: Escrow wallet model (admin holds funds).

2. 2026-02-26 — Auth & Dashboard Foundation

- **Backend:**
  - Implemented `User`, `Order`, `Transaction` Mongoose schemas.
  - Built API routes for user registration (`/api/auth/register`) and login (`/api/auth/login`) with password hashing and JWT generation.
- **Frontend:**
  - Created UI pages for `/login` and `/register` with form handling.
  - Built the basic Dashboard layout (`/dashboard`) with a sidebar and a main content area.
  - Successfully implemented the login flow: User logs in -> receives JWT -> gets redirected to `/dashboard`.

3. 2026-02-27 — UI Redesign, I18n & Google Auth

- **UI/UX Overhaul:**
  - Refactored Homepage (`page.tsx`) with "Esports/Cinematic" style using TailwindCSS 4.
  - Switched font to **Be Vietnam Pro** for better Vietnamese typography.
  - Implemented **Internationalization (i18n)** system (Context API) supporting VI, EN, KR, JP.
  - Updated all main pages (Home, Login, Register, Dashboard) to use dynamic translations.

- **Authentication:**
  - Integrated **Google OAuth** login flow (`/api/auth/google`).
  - Added `google-callback` page to handle JWT storage from social login.

- **Infrastructure & Fixes:**
  - Updated `next.config.ts` to allow Google Avatar images and ignore ESLint during build.
  - Fixed `mongoose` version issues and created `Transaction` model.
  - Addressed hydration mismatch warnings and Next.js security updates.

4. 2026-02-27 — Documentation Automation

- **Workflow:** Established protocol for AI Assistant to automatically log progress and architectural decisions into `memories.md` after each development cycle.

5. 2026-02-27 — Email Verification Strategy (OTP)

- **Decision:** Implement mandatory Email Verification using 6-digit OTP.
- **Schema Changes:** Add `phoneNumber`, `isEmailVerified` to User. Create `VerificationCode` collection (TTL index).
- **Flow:** Register -> Unverified User -> Send OTP -> Verify -> Active.

6. 2026-02-27 — Google Auth Polish, Forgot Password & UI Refinements

- **Google Auth:**
  - Fixed `isEmailVerified` logic (auto-true for Google users).
  - Added `platform` field to User schema to track login origin ('EMAIL' vs 'GOOGLE').
  - Fixed middleware redirection issues for Google logins.
- **Forgot Password:**
  - Implemented full flow: Request OTP -> Verify -> Reset Password.
  - Created APIs: `/api/auth/forgot-password` and `/api/auth/reset-password`.
  - Created UI: `/forgot-password` with multi-step form.
- **UI/UX:**
  - Redesigned `/verify-otp` page (Modern 2-column layout).
  - Added Password Strength indicator to Register page.
  - Fixed "Race Condition" in OTP verification redirect logic.
  - Fixed build errors (Suspense boundary for `useSearchParams`, duplicate route groups).

7. 2026-02-27 — Profile Management & Security Features

- **Profile Page:**
  - Implemented **Change Email** flow with OTP verification (Modal UI).
  - Implemented **Change Password** (restricted for Google/Social accounts).
  - Implemented **Delete Account** with safety confirmation (requires typing "delete {username}").
  - Added APIs: `/api/user/profile`, `/api/auth/change-email/*`, `/api/user/delete`.
- **Security & UX:**
  - Standardized API error responses to return i18n keys instead of raw strings.
  - Improved OTP Modal logic (persistent countdown handling).
  - Fixed various edge cases in authentication flows.

8. 2026-02-28 — Services, Wallet & Mobile Optimization

- **Services Page (`/services`):**
  - **Architecture:** Shifted to a "Booster First" booking flow (Select Booster -> Configure Service -> Pay).
  - **Mobile UI:** Implemented horizontal scrolling (carousel) for Boosters and Service Tabs to optimize for mobile screens.
  - **Features:** Added advanced filtering for Boosters (Rating, Orders), dynamic service configuration forms (Rank, Mastery, Placements, etc.), and integrated "Champion Select" modal.
  - **SEO:** Added JSON-LD Structured Data, `sitemap.ts`, and `robots.ts`.

- **Wallet System:**
  - **Backend:** Created `Transaction` model and `/api/wallet` endpoints (Deposit, History). Added a Mock Payment Confirm API for testing.
  - **Frontend:** Built `/dashboard/wallet` with real-time balance updates and transaction history table.

- **Boosters Page (`/boosters`):**
  - Redesigned with "Dark Premium" theme (Glassmorphism, Neon effects).
  - Added top navigation with User Info and Language Switcher.

- **Refactoring & Fixes:**
  - **ChampionModal:** Fixed mobile UX (added "Apply Filters" button) and z-index issues.
  - **I18n:** Expanded dictionary significantly to cover all service types and descriptions. Fixed `getNestedValue` crash.
  - **Hydration:** Fixed `bis_skin_checked` hydration mismatch caused by browser extensions.

9. 2026-02-28 — Booster Service Config & Advanced Order Flow (14:13)

- **Booster Dashboard:**
  - Implemented **Service Management** (`/dashboard/booster/services`): Allows boosters to enable/disable services and set price modifiers/base prices.
  - Backend API: `/api/boosters/services` (GET/POST) to store `booster_config` in User document.
  - Sidebar: Added "Manage Services" link for Booster role.

- **Service Booking Flow:**
  - **Unified Flow:** Redirected "Hire" button on Boosters page to `/services?booster={id}`.
  - **Dynamic Pricing:** Updated `/services` to calculate price based on selected Booster's specific configuration (if available) or fall back to system defaults.
  - **UI/UX:**
    - Added detailed forms for all service types: Promotion, Leveling, Net Wins, Placements.
    - Renamed payment button to "Thuê ngay".
    - Fixed API route paths to ensure consistency (`boosters` vs `booster`).

================================================================================

1. # PROJECT STRUCTURE

```bash
caythuelol/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login/Register routes
│   │   ├── (dashboard)/        # Protected routes (Admin/Booster/Customer)
│   │   ├── api/                # API Routes
│   │   │   ├── auth/
│   │   │   ├── orders/
│   │   │   ├── webhooks/       # Payment gateways / Socket events
│   │   │   └── wallet/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Shadcn UI & Custom components
│   ├── lib/
│   │   ├── db.ts               # MongoDB Connection (Singleton)
│   │   ├── auth.ts             # JWT & Session logic
│   │   ├── pricing.ts          # Core Pricing Engine
│   │   └── socket.ts           # Socket.io Client
│   ├── models/                 # Mongoose Schemas (User, Order, etc.)
│   ├── types/                  # TypeScript Interfaces & Zod Schemas
│   └── utils/                  # Helper functions
├── public/
├── socket-server/              # Separate Node.js for Socket.io (Optional for Vercel)
└── ...config files
```

# ================================================================================

# 2. DATABASE SCHEMA (MONGODB) - Cập nhật ngày 2026-03-05

# ================================================================================

### A. Users Collection

- `_id`: ObjectId
- `username`: string (unique)
- `email`: string (unique)
- `password_hash`: string
- `role`: enum ['ADMIN', 'BOOSTER', 'CUSTOMER']
- `platform`: enum ['EMAIL', 'GOOGLE'] (Phương thức đăng ký)
- `phoneNumber`: string (optional)
- `isEmailVerified`: boolean (default: false)
- `wallet_balance`: number (Số dư có thể sử dụng)
- `pending_balance`: number (Số dư đang bị khóa, vd: cho đơn hàng Booster đang thực hiện)
- `createdAt`, `updatedAt`: Date
- `profile`: {
  `avatar`: string (URL)
  `discord_id`: string (optional)
  `bank_info`: { (Dành cho Booster để rút tiền)
  `bankName`: string (vd: "CAKE")
  `accountNumber`: string
  `accountHolder`: string
  }
  }
- `booster_info`: { (Chỉ dành cho user có role 'BOOSTER')
  `bio`: string (Mô tả bản thân của Booster)
  `services`: string[] (Danh sách các loại dịch vụ cung cấp, vd: 'RANK_BOOST')
  `rating`: number (Đánh giá trung bình từ khách hàng)
  `completed_orders`: number (Số đơn hàng đã hoàn thành)
  `team_id`: ObjectId (Ref 'Teams', optional)
  `service_settings`: { (Object phức tạp cho việc định giá động, do Booster tự cấu hình)
  `enabledServices`: string[] (Các dịch vụ đang được bật)
  `servers`: string[] (Các máy chủ game mà Booster hoạt động, vd: 'VN', 'KR')
  `playingChampions`: string[] (Danh sách các tướng Booster chuyên chơi)

      # Bảng giá (Dạng Key-Value)
      `rankPrices`: Record<string, number> (Giá mỗi đoàn cho rank SOLO)
      `rankPricesFlex`: Record<string, number> (Giá mỗi đoàn cho rank FLEX)
      `rankPricesDuo`: Record<string, number> (Giá mỗi đoàn cho rank DUO)
      `promotionPrices`: Record<string, number> (Giá cho chuỗi thăng hạng, vd: 'Gold_I')
      `promotionPricesFlex`: Record<string, number>
      `promotionPricesDuo`: Record<string, number>
      `placementPrices`: Record<string, number> (Giá mỗi trận phân hạng dựa trên rank mùa trước)
      `placementPricesFlex`: Record<string, number>
      `placementPricesDuo`: Record<string, number>
      `netWinPrices`: Record<string, number> (Giá mỗi trận thắng-thua, cho rank Master+)
      `netWinPricesFlex`: Record<string, number>
      `netWinPricesDuo`: Record<string, number>
      `levelingPrices`: Record<string, number> (Giá mỗi khoảng cấp độ, vd: '1-10')
      `masteryPrices`: Record<string, number> (Giá mỗi khoảng cấp độ thông thạo, vd: 'M5_M6')

      # Các hệ số & Tùy chọn
      `lpGain`: { (Khoảng điểm LP nhận được để điều chỉnh giá theo MMR)
          `low`: number
          `medium`: number
          `high`: number
      }
      `queueModifiers`: { (Phụ phí/giảm giá dựa trên loại hàng chờ)
          `SOLO_DUO`: number (phần trăm)
          `FLEX`: number (phần trăm)
          `TFT`: number (phần trăm)
      }
      `options`: { (Giá/phần trăm cho các tùy chọn thêm của đơn hàng)
          `schedule`: boolean (Booster có nhận đặt lịch không)
          `roles`: string[] (Vai trò ưa thích, vd: 'JUNGLE', 'MID')
          `specificChamps`: number (Phụ phí phần trăm)
          `streaming`: number (Phí cố định)
          `express`: number (Phụ phí phần trăm cho đơn hàng siêu tốc)
          `duo`: number (Phụ phí phần trăm cho chơi cùng)
      }

  }
  }

### B. Orders Collection

- `_id`: ObjectId
- `customer_id`: ObjectId (Ref 'Users')
- `booster_id`: ObjectId (Ref 'Users', nullable)
- `service_type`: enum ['RANK_BOOST', 'PLACEMENT', 'MASTERY', 'LEVELING', 'NET_WINS', 'PROMOTION']
- `status`: enum ['PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REFUNDED', 'DISPUTED']
- `details`: {
  `current_rank`: string,
  `desired_rank`: string,
  `current_lp`: number,
  `server`: string,
  `account_info`: { `username`: string, `password`: string } (Được mã hóa bằng AES-256)
  }
- `options`: { (Các tùy chọn khách hàng đã chọn cho đơn hàng này)
  `express`: boolean
  `specific_champs`: string[]
  `streaming`: boolean
  `duo_queue`: boolean
  `scheduled_time`: Date (optional)
  }
- `pricing`: {
  `base_price`: number (Tính từ cài đặt của Booster hoặc mặc định của hệ thống)
  `option_fees`: number
  `total_amount`: number (Giá cuối cùng khách hàng trả)
  `platform_fee`: number (Phần của nền tảng)
  `booster_earnings`: number (Phần của booster)
  }
- `timeline`: [{ `status`: string, `timestamp`: Date, `actor`: ObjectId }]
- `chat_room_id`: string (Dành cho chat trong đơn hàng)
- `createdAt`, `updatedAt`: Date

### C. Transactions Collection (Sổ cái)

- `_id`: ObjectId
- `userId`: ObjectId (Ref 'Users')
- `order_id`: ObjectId (Ref 'Orders', nullable)
- `type`: enum ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT_HOLD', 'PAYMENT_RELEASE', 'REFUND', 'COMMISSION']
- `amount`: number (+ cho credit, - cho debit)
- `balanceAfter`: number (Số dư ví của user sau giao dịch này)
- `status`: enum ['PENDING', 'SUCCESS', 'FAILED']
- `metadata`: { (Cho các chi tiết bổ sung)
  `gateway`: string (vd: 'SePay'),
  `gateway_txn_id`: string
  }
- `createdAt`, `updatedAt`: Date

### D. Teams Collection

- `_id`: ObjectId
- `name`: string
- `leader_id`: ObjectId (Ref 'Users')
- `members`: [{
  `user_id`: ObjectId (Ref 'Users'),
  `split_percent`: number
  }]
- `createdAt`, `updatedAt`: Date

### E. VerificationCodes Collection

- `_id`: ObjectId
- `email`: string (index)
- `code`: string (6 chữ số)
- `expiresAt`: Date (TTL Index để tự động xóa)
- `attempts`: number (default: 0)
- `type`: enum ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_CHANGE']
- `createdAt`, `updatedAt`: Date

### F. Game Collection (Mới - Dành cho dữ liệu hệ thống)

- `_id`: ObjectId
- `name`: string (vd: "League of Legends")
- `ranks`: [{ `name`: string, `order`: number, `img_url`: string }] (vd: "IRON_IV", 1, "/ranks/iron.png")
- `servers`: [{ `id`: string, `name`: string }] (vd: "VN", "Vietnam")

### G. SystemSetting Collection (Mới - Dành cho cấu hình của admin)

- `_id`: ObjectId
- `key`: string (unique, vd: "platform_fee_percent")
- `value`: any
- `description`: string
- `createdAt`, `updatedAt`: Date

# ================================================================================ 3. PRICING LOGIC & FORMULAS

**Base Formula:**
`Final Price = (Base Service Price + Extra Options) * Multipliers`

**A) Rank Boosting (ELO):**

- Define a matrix of prices per division (e.g., Iron 4 -> Iron 3 = 50k).
- Sum the cost of all steps between Current and Desired.

**B) Placements:**

- `Price = Base_Price_Per_Game * Number_Of_Games`
- Multiplier based on Previous Season Rank (e.g., Diamond prev season = 1.5x).

**C) Mastery:**

- `Price = (Target_Level - Current_Level) * Price_Per_Level`

**Options Multipliers:**

- Duo Queue: Total \* 1.5
- Flash Boost (Siêu tốc): Total \* 1.35
- Specific Champs: Total \* 1.3
- Streaming: Total + 349,000 VND (Flat fee)

# ================================================================================ 4. FINANCIAL FLOW (ESCROW MODEL)

**Scenario: Customer orders a boost for 500,000 VND.**

1. **Deposit/Payment:**
   - Customer pays via Gateway (QR/Card).
   - System creates Transaction: `DEPOSIT` +500k to Customer Wallet.

2. **Booking (Escrow):**
   - Customer confirms order.
   - System checks balance >= 500k.
   - Transaction 1: `PAYMENT_HOLD` -500k from Customer Wallet.
   - Money is logically in "Admin Holding Wallet".
   - Order Status: `PAID`.

3. **Execution:**
   - Booster accepts. Status: `APPROVED`.
   - Booster plays. Status: `IN_PROGRESS`.

4. **Completion & Payout:**
   - Booster marks `COMPLETED`.
   - Customer confirms (or auto-confirm after 24h).
   - System calculates split (e.g., 80% Booster, 20% Platform).
     - Booster Share: 400k.
     - Platform Share: 100k.
   - Transaction 2: `PAYMENT_RELEASE` +400k to Booster Wallet.
   - Transaction 3: `COMMISSION` +100k to Admin Revenue Wallet.

5. **Withdrawal:**
   - Booster requests withdraw.
   - Admin approves.
   - Transaction 4: `WITHDRAWAL` -400k from Booster Wallet.

# ================================================================================ 5. API DESIGN (CORE ROUTES)

- `POST /api/auth/register`: Role selection required.
- `POST /api/orders/calculate`: Public endpoint to get price quote.
- `POST /api/orders`: Create order (Requires Auth).
- `GET /api/orders/:id`: Get details & chat history.
- `PATCH /api/orders/:id/status`: Booster updates status (Start/Complete).
- `POST /api/wallet/deposit`: Generate QR code.
- `POST /api/wallet/withdraw`: Request payout.

# ================================================================================ 6. SECURITY & DEPLOYMENT

**Security:**

- **Passwords:** Bcrypt hashing.
- **Account Credentials:** Encrypt `account_info` (LoL user/pass) using AES-256 before saving to DB. Only decrypt when Booster views the order.
- **API:** Rate limiting on `/api/orders/calculate` to prevent scraping.
- **RBAC:** Middleware to check `req.user.role` before accessing Admin/Booster routes.

**Deployment (Vercel):**

1. Push to GitHub.
2. Import to Vercel.
3. Set Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `ENCRYPTION_KEY` (For LoL credentials)
4. Redeploy.

**Realtime (Socket.io):**

- Since Vercel Serverless functions have timeouts, deploy a small Node.js server on Railway/Render specifically for Socket.io.
- Frontend connects to this Socket server.
- Next.js API sends webhooks/HTTP requests to Socket server to broadcast events ("New Order", "Message").

# ================================================================================ 7. EXPANSION IDEAS

- **Loyalty Program:** Points per 1000 VND spent. Redeem for discount coupons.
- **Affiliate:** Customer invites friend -> gets 5% of friend's first order.
- **Coaching:** New service type where Booster watches stream and guides.

# ================================================================================ 8. NEXT STEPS (Kế hoạch tiếp theo)

- **Admin Dashboard:** Xây dựng trang quản trị (`/admin`) để duyệt rút tiền, quản lý đơn hàng và người dùng.
- **Booster Dashboard:** Hoàn thiện khu vực làm việc cho Booster (Nhận đơn, Cập nhật tiến độ, Chat với khách).
- **Realtime Chat:** Tối ưu hóa hệ thống chat trong đơn hàng (Polling hoặc chuyển sang Socket.io nếu cần).

10. 2026-03-01 — Admin & Booster Dashboards, UI Polish

- **Admin Dashboard (`/admin/boosters`):**
  - Hợp nhất "Duyệt đơn đăng ký" và "Danh sách Booster" vào một trang quản lý duy nhất với Tabs.
  - Tích hợp tính năng tìm kiếm, phân trang và cập nhật trạng thái (Duyệt/Từ chối).
  - Refactor API: `/api/admin/boosters` (GET đa năng) và `/api/admin/boosters/[id]` (PATCH).

- **Booster Dashboard (`/booster/dashboard`):**
  - Xây dựng Dashboard riêng hiển thị thống kê: Tổng thu nhập, Đơn hoàn thành, Đơn đang chạy.
  - Tạo API `/api/boosters/stats` để tổng hợp dữ liệu từ Transaction và Order.

- **Booster Application (`/boosters/apply`):**
  - Redesign giao diện theo phong cách "Dark Gaming Premium".
  - Khắc phục lỗi hiển thị input (chữ đen trên nền đen).
  - Tối ưu Responsive: Navbar trên Desktop, nút "Back to Home" trên Mobile.
  - Tích hợp đa ngôn ngữ (i18n).

- **Navigation & Layout:**
  - Cập nhật `Sidebar`: Thêm nút "Trang chủ" và "Đăng xuất".
  - Cập nhật `Navbar`: Điều hướng thông minh dựa trên Role (Admin/Booster/Customer) khi bấm vào Dashboard.
  - Đồng bộ hóa `Navbar` trên các trang public (`/services`, `/boosters`).

- **Fixes & Refactoring:**
  - Sửa lỗi Next.js 15: `params` trong API Route phải được `await`.
  - Sửa lỗi bất đồng bộ tên trường trong Model (camelCase vs snake_case).
  - Dọn dẹp các file API bị đặt sai vị trí hoặc trùng lặp.

11. 2026-03-01 — Wallet Realtime, SePay Integration & UI Polish (Late Night)

- **Wallet System (Realtime & Automation):**
  - **Architecture:** Triển khai `Socket.io` server riêng (`socket-server/server.js`) để xử lý thông báo realtime, khắc phục hạn chế của Vercel Serverless.
  - **SePay Webhook:** Xây dựng `/api/webhooks/sepay` để tự động xử lý giao dịch nạp tiền. Logic thông minh: Parse nội dung `NAP + USERNAME + CODE`, tự động khớp đơn PENDING hoặc tạo đơn mới nếu khách chuyển khoản trực tiếp.
  - **Deposit Flow:** Tối ưu luồng nạp tiền: "Hiển thị QR (Client-side)" -> "Khách xác nhận đã chuyển" -> "Tạo Transaction PENDING". Giúp giảm rác trong DB.
  - **Anti-Spam:** Giới hạn tối đa 3 đơn nạp tiền PENDING/người dùng. Thêm tính năng cho phép khách tự "Hủy đơn" đang treo.
  - **Admin Transactions:** Xây dựng trang `/admin/transactions` để Admin duyệt đơn thủ công (Manual Approve) trong trường hợp Webhook gặp sự cố.

- **Booster Application (`/boosters/apply`):**
  - **VietQR Integration:** Tích hợp API `api.vietqr.io` cho phép chọn ngân hàng từ Dropdown có tìm kiếm, hiển thị Logo và Mã ngân hàng chuyên nghiệp.
  - **UI Polish:** Nâng cấp Stepper với hiệu ứng Gradient, Pulse animation và tối ưu hiển thị trên Mobile (ẩn text bước không active).

- **Refactoring & Fixes:**
  - **Schema Consistency:** Đồng bộ hóa tên trường `userId` (thay vì `user_id`) và `balanceAfter` (thay vì `balance_after`) trong toàn bộ code Transaction.
  - **API Routes:** Sửa đường dẫn `/api/booster/jobs` thành `/api/boosters/jobs` cho đúng chuẩn RESTful.
  - **Socket Client:** Tạo `src/lib/socket.ts` singleton để quản lý kết nối Socket ở Frontend.

12. 2026-03-02 — Advanced Wallet, Dynamic Pricing & Deployment Fixes

- **Wallet & Realtime Polish:**
  - **UX:** Thêm hiệu ứng âm thanh "Ting Ting" và pháo hoa (Confetti) khi nạp tiền thành công.
  - **Realtime:** Fix lỗi Socket.io không cập nhật số dư ngay lập tức (do `useEffect` dependencies).
  - **Withdrawal:** Triển khai tính năng Rút tiền: Modal nhập số tiền, kiểm tra thông tin ngân hàng, tạo Transaction `WITHDRAWAL`.
  - **Pagination:** Thêm phân trang cho Lịch sử giao dịch (Wallet) và Quản lý giao dịch (Admin).

- **Booster Service Configuration (Dynamic Pricing):**
  - **Architecture:** Chuyển từ Hardcoded Ranks sang Database-driven (`Rank` và `Game` models).
  - **Feature:** Xây dựng `/booster/services` cho phép Booster tự cấu hình:
    - Giá tiền theo từng Rank/Division.
    - Hệ số điều chỉnh theo điểm cộng LP (High/Medium/Low MMR).
    - Hệ số điều chỉnh theo chế độ chơi (Solo/Flex).
  - **Pricing Engine:** Nâng cấp `src/lib/pricing.ts` để tính giá đơn hàng dựa trên cấu hình riêng của Booster được chọn.
  - **Fix:** Xử lý triệt để lỗi không lưu được `service_settings` (kiểu Mixed) bằng cách dùng `User.collection.updateOne`.

- **Admin & Profile Enhancements:**
  - **Audit Logs:** Tạo hệ thống ghi nhật ký thay đổi thông tin nhạy cảm (Bank Info, Password).
  - **Admin Transactions:** Bổ sung bộ lọc nâng cao (Trạng thái, Loại GD, Tìm kiếm) và tính năng "Từ chối giao dịch".
  - **Profile:** Tích hợp VietQR API để chọn ngân hàng chuyên nghiệp. Thêm validate Username (chặn khoảng trắng).

- **Deployment & Infrastructure:**
  - **Vercel Fixes:**
    - Loại bỏ module `crypto` (Node.js) khỏi Client Components (`i18n.tsx`) gây lỗi build 500.
    - Fix lỗi "Internal Server Error" do không `await` các request `fetch` (Socket trigger) trong Serverless Functions.
    - Xóa log `MONGODB_URI` để bảo mật.
    - Fix lỗi cache build `MODULE_NOT_FOUND`.

13. 2026-03-03 — Booster Service Config Complete & Dynamic Pricing

- **Booster Service Configuration (Full Suite):**
  - **Architecture:** Triển khai `ServiceContext` để quản lý state, tự động lưu nháp (Auto-save Draft) và khôi phục dữ liệu khi cấu hình dịch vụ.
  - **Rank Boost:** Hoàn thiện nhập giá theo từng bậc, tính năng "Nhập nhanh" (Bulk Import), và Calculator dự tính thu nhập.
  - **Net Wins:** Xây dựng cấu hình cho Rank cao (Master+), tích hợp **LP Modifiers** (Hệ số điểm cộng) và hiển thị thống kê Cut-off Rank thực tế.
  - **Placements & Promotion:** Cấu hình giá dựa trên Rank mùa trước và loại chuỗi thăng hạng.
  - **Leveling & Mastery:** Nhập giá chi tiết cho từng khoảng Level và cấp độ Thông thạo.
  - **General Settings:** Chọn Server hoạt động, cấu hình hệ số LP (Dễ/Khó), và **Champion Pool** (Tướng sở trường) với Modal lọc nâng cao.

- **Dynamic Pricing Engine (Core):**
  - Cập nhật `src/app/services` và `create order` để tính giá đơn hàng **động** dựa trên cấu hình riêng của Booster được chọn.
  - Logic xử lý: Nếu Booster có cấu hình -> Dùng giá Booster. Nếu không -> Dùng giá sàn hệ thống.
  - Tích hợp các hệ số: LP Gain (Elo), Tướng chỉ định, Duo Queue vào giá cuối cùng.

- **Admin & System:**
  - **Admin Settings:** Tạo trang `/admin/settings` để quản lý tham số toàn cục như **Platform Fee** (Phí sàn).
  - **SePay Webhook:** Tối ưu hóa `/api/webhooks/sepay`: Tự động khớp User kể cả khi nội dung chuyển khoản bị dính ký tự lạ (Smart Regex), check mã giao dịch để tránh trùng lặp.

- **Booster Workflow:**
  - **Dashboard:** Hiển thị thống kê tổng quan (Thu nhập, Đơn đang chạy) và danh sách "Đơn hàng của tôi" (`/booster/my-orders`) có bộ lọc trạng thái.
  - **Job Market:** (Đang hoàn thiện) Giao diện nhận đơn.

- **UI/UX:**
  - **Champion Modal:** Component tái sử dụng cho phép tìm kiếm, lọc tướng theo Vai trò, Độ khó, Loại sát thương.
  - **Realtime:** Cải thiện kết nối Socket.io trong `DashboardLayout` để cập nhật số dư ví ngay lập tức (hiệu ứng âm thanh).

14. 2026-03-04 — Rank Boost Config Refinement & Bug Fixes

- **Rank Boost Page (`/booster/services/lol/rank-boost`):**
  - **Bug Fixes:**
    - Sửa lỗi Type mismatch trong khởi tạo state `activeTab` (`'SO LO'` -> `'SOLO'`).
    - Sửa lỗi cú pháp JSX (unexpected token) và loại bỏ code thừa (unreachable code) trong `visibleRanks`.
    - Sửa logic lọc Rank Master+ (so sánh không phân biệt hoa thường để tránh lỗi dữ liệu).
  - **Features:**
    - **Calculator:** Tinh chỉnh logic tính toán để hiển thị chính xác: Khách trả, Booster thực nhận, và Phí sàn (Admin Fee).
    - **Fee Tool:** Thêm công cụ chuyển đổi nhanh giữa Giá thực nhận (Net) và Giá khách trả (Gross).
    - **Bulk Import:** Hoàn thiện tính năng nhập giá nhanh qua văn bản (Format: `Rank | Target | Price`).
    - **Pricing Tabs:** Hỗ trợ bảng giá riêng biệt cho các chế độ: SOLO, FLEX, và DUO.
  - **UI/UX:**
    - Tối ưu hóa các khối nội dung có thể thu gọn (Collapsible) cho giao diện Mobile.
    - Thêm cảnh báo trực quan khi nhập giá không hợp lệ (ví dụ: giá thấp hơn bậc trước).

15. 2026-03-05 — Net Wins Overhaul, Deposit Logic & Customer UI Polish

- **Net Wins Service (`/booster/services/lol/net-wins`):**
  - **Redesign:** Thiết kế lại toàn bộ trang cấu hình. Chia thành 2 phần: "Mô phỏng Đặt đơn" (Booking) và "Mô phỏng Quyết toán" (Settlement).
  - **Financial Logic:** Triển khai hệ thống **Tiền cọc (Deposit)**. Booster có thể cấu hình % cọc (mặc định 50%).
  - **Settlement:** Thêm logic tính "Giá thực tế" dựa trên kết quả thực (LP đạt được hoặc số trận thắng) so với tiền cọc. Xử lý các trường hợp Hoàn tiền/Thanh toán thêm.
  - **UI/UX:** Thay thế input LP Gain bằng Dropdown (Low/Medium/High Elo). Hiển thị chi tiết phân chia doanh thu (Admin Fee vs Booster Receive).

- **Customer Service Pages (`/services/lol/*`):**
  - **Net Wins:** Xây dựng trang đặt đơn cho khách hàng với logic tính giá động theo Booster đã chọn.
  - **Rank Boost:** Cập nhật trang đặt đơn Rank Boost để đồng bộ logic.
  - **Deposit Display:** Thay đổi hiển thị giá thành **"Tiền cọc"** thay vì tổng tiền, kèm tooltip giải thích quy trình thanh toán.
  - **Validation & Terms:** Thêm checkbox "Đồng ý điều khoản" và validate chặt chẽ các ô nhập liệu (ví dụ: Điểm mong muốn > Điểm hiện tại).
  - **UI Polish:** Cải thiện style Checkbox, ẩn thanh cuộn/spinner input, và tối ưu hiển thị trên Mobile.

- **Booster Dashboard Enhancements:**
  - **Calculators:** Cập nhật tất cả các công cụ tính giá (Leveling, Mastery, Promotion, Placements) để hiển thị rõ **Phí sàn** và **Thực nhận**.
  - **General Settings:** Cải thiện UI phần "Tùy chọn mở rộng" (Toggle switches, input gọn gàng).
  - **Rank Boost Config:** Chuyển đổi input LP Gain sang dạng Dropdown để dễ sử dụng hơn.

- **Architecture:**
  - Cập nhật `ServiceContext` để lưu trữ `netWinDepositPercent`.
  - Tinh chỉnh logic tính giá để xử lý cả 2 chế độ "Theo LP" và "Theo Số Trận" trong Net Wins.

16. 2026-03-06 — Service Config UI Polish & Fee Logic Standardization

- **UI/UX Enhancements:**
  - **Collapsible Sections:** Áp dụng cơ chế đóng/mở (Dropdown) cho tất cả các trang cấu hình dịch vụ (`Leveling`, `Mastery`, `Placements`, `Promotion`, `Net Wins`, `Rank Boost`) để tối ưu không gian trên Mobile.
  - **Mobile Optimization:** Điều chỉnh Grid layout (1 cột trên mobile, 2 cột trên desktop), padding và input styles để tránh vỡ giao diện.
  - **Visuals:** Thêm hình ảnh Rank minh họa cho Promotion và Rank Boost configuration.

- **Financial Logic Standardization:**
  - **Platform Fee:** Chuẩn hóa công thức tính phí sàn là **Markup** (`Giá Khách Trả = Giá Gốc * (1 + %Phí)`) trên toàn bộ hệ thống.
  - **Breakdown Display:** Cập nhật "Mô phỏng Đặt đơn" để hiển thị rõ ràng 3 phần:
    - **Khách trả:** Tổng tiền khách thanh toán.
    - **Bạn nhận:** Số tiền thực tế Booster nhận (Net).
    - **Admin nhận:** Phí sàn.
  - **Fee Tool:** Bổ sung hiển thị "Phí sàn (+...)" trong công cụ chuyển đổi Net-to-Gross để minh bạch số tiền cộng thêm.

- **Specific Service Fixes:**
  - **Leveling:** Sửa logic đếm cấp độ (1->30 là 29 cấp) và thêm Tooltip giải thích.
  - **Mastery/Placements/Promotion:** Sửa các lỗi cú pháp (syntax errors) và cấu trúc HTML trong form cấu hình.
