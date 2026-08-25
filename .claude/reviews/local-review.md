# Báo Cáo Code Review & Sửa Lỗi Phân Luồng / Phân Quyền Tài Khoản (Account Isolation & Role Fixes)

**Ngày thực hiện**: 2026-08-25
**Mô tả sự cố được phát hiện**:
1. Tài khoản Hiệu trưởng (`admin@school.com` - TS. Nguyễn Văn Hùng) bị nhận diện nhầm thành "QUẢN TRỊ VIÊN TỐI CAO", hiển thị sai đơn vị ("Toàn bộ các Trường", "Tất cả các Phòng GD&ĐT", "Bộ GD&ĐT & Tất cả các Sở GD&ĐT").
2. Đang ở tài khoản Admin bấm vào liên kết Phân Hệ Sở GD&ĐT (`/department/dashboard`) bị nhảy sang giao diện Sở GD&ĐT, làm lẫn lộn giao diện giữa các vai trò.
3. Tài khoản Hiệu trưởng (`admin@school.com`) bị thiếu thông tin trường học (`schoolId` bị null trong cơ sở dữ liệu).

---

## 🛠️ Nguyên Nhân & Giải Pháp Sửa Lỗi

### 1. Phân định chính xác `isSuperAdmin` (`superadmin@school.com`)
- **Trước đây**: Logic gộp `role === "DEPARTMENT_ADMIN"` hoặc `(!user.schoolId && user.role === "ADMIN")` làm `isSuperAdmin`. Do đó khi `admin@school.com` có `schoolId` bị null, hệ thống tự biến Hiệu Trưởng thành Super Admin Tối Cao.
- **Khắc phục**: 
  - Chỉ duy nhất tài khoản `superadmin@school.com` (hoặc role `SUPER_ADMIN`) mới được tính là Super Admin Tối Cao.
  - `admin@school.com` là **ADMIN (Hiệu Trưởng)** của trường (VD: Trường THCS Tân Xã), hiển thị đúng tên **TS. Nguyễn Văn Hùng** và đúng đơn vị quản lý.

### 2. Cô lập truy cập giữa các phân hệ (Middleware & Nav Routing)
- **Trước đây**: Middleware cấp quyền cho `ADMIN` vào `/department/*`, và trên Bảng điều khiển Admin có nút liên kết sang `/department/dashboard`.
- **Khắc phục**:
  - Cập nhật `src/middleware.ts`:
    - Phân hệ Sở GD&ĐT (`/department/*`): Chỉ dành riêng cho `DEPARTMENT_ADMIN` (và Super Admin). Nếu vai trò khác truy cập sẽ tự động chuyển hướng về `/admin/dashboard`.
    - Phân hệ Phòng GD&ĐT (`/ward/*`): Chỉ dành riêng cho `WARD_ADMIN` (và Super Admin).
    - Phân hệ Trường (`/admin/*`): Dành cho `ADMIN` (Hiệu Trưởng).
  - Loại bỏ các đường dẫn chuyển vai trò không thuộc quyền hạn trên Bảng điều khiển Admin.

### 3. Cập nhật dữ liệu chuẩn trong Database & Seed Route
- Gắn chính xác `admin@school.com` với `Trường THCS Tân Xã`, `Phòng GD&ĐT Thạch Thất` và `Sở GD&ĐT Hà Nội`.
- Tạo mới/Cập nhật tài khoản `superadmin@school.com` với mật khẩu demo `abc123` / `123456`.

---

## 📊 Kết Quả Validation

| Kiểm tra | Lệnh | Kết quả |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | ✅ **PASS (0 errors)** |
| Database accounts | Check Prisma DB | ✅ **PASS (Tài khoản phân định riêng biệt)** |

---

## Decision
**APPROVE** — Tất cả logic phân quyền và phân luồng tài khoản đã được phân định chính xác và cô lập hoàn toàn.
