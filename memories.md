Project: LOL Boosting Platform
Date started: 2026-02-25
Last updated: 2026-02-27

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

# ================================================================================ 2. DATABASE SCHEMA (MONGODB)

### A. Users Collection

- `_id`: ObjectId
- `username`: string (unique)
- `email`: string (unique)
- `password_hash`: string
- `role`: enum ['ADMIN', 'BOOSTER', 'CUSTOMER']
- `phoneNumber`: string (optional)
- `isEmailVerified`: boolean (default: false)
- `wallet_balance`: number (Available funds)
- `pending_balance`: number (Locked funds - for Boosters)
- `profile`: {
  `avatar`: string,
  `discord_id`: string,
  `bank_info`: { ... } (For Boosters)
  }
- `booster_info`: {
  `ranks`: string[],
  `services`: string[],
  `team_id`: ObjectId (Ref Team),
  `rating`: number
  }

### B. Orders Collection

- `_id`: ObjectId
- `customer_id`: ObjectId (Ref User)
- `booster_id`: ObjectId (Ref User, nullable)
- `service_type`: enum ['RANK_BOOST', 'PLACEMENT', 'MASTERY', 'LEVELING', 'NET_WINS']
- `status`: enum ['PENDING_PAYMENT', 'PAID', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REFUNDED', 'DISPUTED']
- `details`: {
  `current_rank`: string,
  `desired_rank`: string,
  `current_lp`: number,
  `server`: string,
  `account_info`: { `username`: string, `password`: string } (Encrypted)
  }
- `options`: {
  `flash_boost`: boolean (+35%),
  `specific_champs`: string[] (+30%),
  `streaming`: boolean (+349k),
  `duo_queue`: boolean (+50%)
  }
- `pricing`: {
  `base_price`: number,
  `option_fees`: number,
  `total_amount`: number,
  `platform_fee`: number,
  `booster_earnings`: number
  }
- `timeline`: [{ `status`: string, `timestamp`: Date, `actor`: ObjectId }]
- `chat_room_id`: string

### C. Transactions Collection (Ledger)

- `_id`: ObjectId
- `user_id`: ObjectId
- `order_id`: ObjectId (nullable)
- `type`: enum ['DEPOSIT', 'WITHDRAWAL', 'PAYMENT_HOLD', 'PAYMENT_RELEASE', 'REFUND', 'COMMISSION']
- `amount`: number (+ for credit, - for debit)
- `balance_after`: number
- `status`: enum ['PENDING', 'SUCCESS', 'FAILED']
- `created_at`: Date

### D. Teams Collection

- `_id`: ObjectId
- `leader_id`: ObjectId
- `members`: [{ `user_id`: ObjectId, `split_percent`: number }]
- `name`: string

### E. VerificationCodes Collection (New)

- `email`: string (index)
- `code`: string (6 digits)
- `expiresAt`: Date (TTL Index)
- `attempts`: number (default 0)
- `type`: enum ['EMAIL_VERIFICATION', 'PASSWORD_RESET']

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

- **Services Page:** Xây dựng trang Dịch vụ (`/services`) hiển thị bảng giá chi tiết và bộ lọc.
- **Booster Page:** Xây dựng trang danh sách Booster (`/boosters`).
- **Wallet Page:** Hoàn thiện trang Ví tiền (`/dashboard/wallet`) với chức năng nạp tiền (mô phỏng) và lịch sử giao dịch.
- **Profile Page:** Xây dựng trang Hồ sơ cá nhân (`/dashboard/profile`) cho phép cập nhật thông tin và đổi mật khẩu.
