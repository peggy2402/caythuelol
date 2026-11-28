# Antigravity & Agent Coding Standards for LEORANK

## 🚨 BẮT BUỘC: TUYỆT ĐỐI KHÔNG DÙNG HỘP THOẠI MẶC ĐỊNH CỦA TRÌNH DUYỆT (STRICT NO BROWSER NATIVE DIALOGS)

Tất cả các AI Agent, Subagent và lập trình viên khi làm việc trong dự án này **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** sử dụng:
- ❌ `window.confirm(...)` hoặc `confirm(...)`
- ❌ `window.alert(...)` hoặc `alert(...)`
- ❌ `window.prompt(...)` hoặc `prompt(...)`

### Lý do:
- Các hộp thoại mặc định của trình duyệt (`alert`, `confirm`) là giao diện thô cứng của hệ điều hành, làm vỡ hoàn toàn phong cách UI/UX Dark Gaming hiện đại (Cyberpunk / Glassmorphism / Neon Accent) của LeoRank.
- Gây cảm giác thiếu chuyên nghiệp, nghiệp dư cho người dùng.

---

## ✅ QUY TẮC THAY THẾ CHUẨN MỰC

### 1. Thông báo trạng thái (Alerts, Notification, Feedback)
- **Luôn dùng:** `sonner` (`toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`).

### 2. Hộp thoại xác nhận (Confirm Dialog / Modals)
- **Luôn dùng:** Custom Modal / Dialog Component (sử dụng `@/components/ui/dialog` hoặc `@/components/ui/confirm-modal` hoặc React Portal với Tailwind CSS & Framer Motion).
- **Tiêu chuẩn thiết kế cho mọi Confirmation Modal:**
  1. **Backdrop:** Nền tối có làm mờ kính (`bg-black/80 backdrop-blur-md`).
  2. **Card Container:** Viền bo góc lớn (`rounded-2xl`), viền sáng nhẹ (`border border-zinc-800`), hiệu ứng đổ bóng sâu (`shadow-2xl`).
  3. **Biểu tượng nhận diện (Icon Badge):** Đặt trong khung tròn hoặc bo góc mềm với màu sắc ngữ cảnh:
     - Thao tác nguy hiểm (Xóa, Hủy vĩnh viễn): Màu Đỏ (`rose-500` / `red-500`).
     - Thao tác cảnh báo / Rút khiếu nại / Hoàn tác: Màu Vàng Hổ Phách (`amber-500`).
     - Thao tác xác nhận thường / Duyệt: Màu Xanh Lục (`emerald-500`) hoặc Xanh Dương (`cyan-500`).
  4. **Nội dung rõ ràng:** Tiêu đề đậm (font-extrabold), giải thích hậu quả của hành động, kèm hộp thông tin chi tiết (nếu có tiền bạc / quyền lợi).
  5. **Nút bấm kép (Dual Action Buttons):**
     - Nút Hủy: Nền trong suốt hoặc xám mờ (`text-zinc-400 hover:text-white`).
     - Nút Xác nhận: Nút chính có màu nhấn ngữ cảnh tương ứng, tích hợp hiệu ứng xoay tải (`<Loader2 className="animate-spin" />`) khi đang thực thi API.

---

## 🎨 TIÊU CHUẨN UI/UX CHUNG
- Mọi modal phải có khả năng đóng bằng phím `ESC` hoặc bấm ra ngoài overlay (khi không ở trạng thái loading).
- Không để layout bị giật/nhảy khi modal mở (sử dụng Portal gắn vào `document.body`).
