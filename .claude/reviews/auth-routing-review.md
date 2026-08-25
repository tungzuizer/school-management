# Code Review: Authentication Flow & Role-Based Routing

**Reviewed**: 2026-08-25
**Scope**: Auth flow, routing, middleware, password handling for Student & Teacher
**Decision**: REQUEST CHANGES — 3 CRITICAL, 3 HIGH, 3 MEDIUM issues found

---

## Summary

Phát hiện nhiều lỗi nghiêm trọng trong hệ thống phân luồng và đăng nhập. Vấn đề lớn nhất: **role `SUPER_ADMIN` không tồn tại trong Prisma schema nhưng được check khắp nơi trong middleware**, **admin layout không có `ForcePasswordChangeModal`**, và **logic redirect dùng email fallback thay vì role thực tế**. Đây là nguyên nhân chính khiến học sinh/giáo viên gặp lỗi đăng nhập và routing sai.

---

## Findings

### CRITICAL

#### C1. `SUPER_ADMIN` role không tồn tại trong DB nhưng được check trong middleware
- **File**: `src/middleware.ts:13`, `src/lib/auth.ts:92-102`
- **Vấn đề**: Prisma schema chỉ có 6 role: `DEPARTMENT_ADMIN, WARD_ADMIN, ADMIN, VICE_PRINCIPAL, TEACHER, STUDENT`. Nhưng middleware dòng 13 check `role === "SUPER_ADMIN"` — role này không bao giờ xuất hiện từ DB. 
- **Tác động**: Nhánh `isSuperAdmin` trong middleware sẽ không bao giờ match cho `SUPER_ADMIN` vì user từ DB không thể có role đó. Tuy nhiên, nhánh check `role === "ADMIN"` cũng được bao gồm nên SuperAdmin (email=superadmin@school.com, role=ADMIN) vẫn pass được — nhưng logic này rối và dễ gây nhầm.
- **Fix**: Bỏ check `SUPER_ADMIN` trong middleware, hoặc thêm `SUPER_ADMIN` vào Prisma enum nếu thực sự cần phân biệt.

#### C2. Demo fallback tạo user với role sai — `superadmin` email match `"admin"` keyword trước
- **File**: `src/lib/auth.ts:92-102`
- **Vấn đề**: Logic phân role bằng `email.includes()` có thứ tự ưu tiên dễ gây nhầm. Vì `"superadmin"` chứa cả `"admin"`, khi demo fallback tạo user, check `email.includes("admin")` sẽ match — role thành `"ADMIN"` (tình cờ đúng cho superadmin, nhưng logic fragile).
- **Fix**: Dùng exact match hoặc map cố định email→role thay vì `includes()`.

#### C3. Admin layout KHÔNG có `ForcePasswordChangeModal` — đổi mật khẩu bị bỏ qua cho admin/VP
- **File**: `src/app/admin/layout.tsx`, `src/app/vice-principal/layout.tsx`, `src/app/department/layout.tsx`, `src/app/ward/layout.tsx`
- **Vấn đề**: `ForcePasswordChangeModal` chỉ được render trong `Header` component. Nhưng **admin layout và vice-principal layout KHÔNG import `Header`** — chúng tự vẽ sidebar/header riêng. Kết quả: khi user ADMIN/VP đăng nhập lần đầu với mật khẩu mặc định, modal đổi mật khẩu **không hiện**.
- **Tác động**: Chỉ Teacher và Student layout import `Header` → chỉ 2 role này thấy modal đổi mật khẩu.
- **Fix**: Thêm `ForcePasswordChangeModal` vào admin layout, VP layout, department layout, và ward layout.

---

### HIGH

#### H1. Login page redirect fallback dùng email pattern thay vì role — gây sai hướng
- **File**: `src/app/login/page.tsx:76-91`
- **Vấn đề**: Hàm `redirectByRole` có 2 nhánh: (1) Check `session.user.role` → redirect đúng, (2) Fallback check `email.includes()` → redirect theo email pattern. Nhánh 2 chạy khi session chưa cập nhật role (race condition). Ví dụ: giáo viên email `admin.teacher@school.com` bị redirect vào `/admin/dashboard`. Default fallback (dòng 90) redirect **mọi** user không match pattern vào `/admin/dashboard` — kể cả STUDENT.
- **Fix**: Bỏ fallback email-based redirect. Default fallback nên redirect về `/login` hoặc `/unauthorized`.

#### H2. Đổi mật khẩu cho demo user tạo user mới với role hardcode `"TEACHER"`
- **File**: `src/app/actions/user-password.ts:61`
- **Vấn đề**: Khi demo user (ID "demo-xxx") đổi mật khẩu mà chưa có trong DB, code tạo user mới với `role: (session.user.role as any) || "TEACHER"`. Nếu `session.user.role` undefined → hardcode TEACHER. Lần đăng nhập sau, STUDENT bị gán role TEACHER → redirect sai route → lỗi giao diện.
- **Fix**: Ensure `session.user.role` luôn có giá trị, hoặc throw error thay vì fallback.

#### H3. Hardcoded fallback secret key cho NextAuth
- **File**: `src/lib/auth.ts:214`
- **Vấn đề**: `secret: process.env.NEXTAUTH_SECRET || "school_management_production_secret_key_2026"` — nếu env var không set, secret bị hardcode → bất kỳ ai đọc source đều có thể forge JWT.
- **Fix**: Bỏ fallback string, yêu cầu NEXTAUTH_SECRET bắt buộc.

---

### MEDIUM

#### M1. `DEPARTMENT_ADMIN` bị treat như SuperAdmin trong admin panel
- **File**: `src/app/admin/layout.tsx:191`
- **Vấn đề**: `session?.user?.role === "DEPARTMENT_ADMIN"` → `isSuperAdmin = true` → thấy full SuperAdmin menu. Cán bộ Sở GD nên có giao diện riêng, không phải SuperAdmin.

#### M2. Quick login thử 2 mật khẩu nối tiếp — chậm và error message sai
- **File**: `src/app/login/page.tsx:136-164`
- **Vấn đề**: Nếu user đã đổi mật khẩu, cả 2 attempt đều thất bại nhưng error nói "Hãy chạy seed database" — gây hiểu lầm.

#### M3. `db-seed` endpoint dùng GET + query param secret `seed123`
- **File**: `src/app/api/db-seed/route.ts:6-11`  
- **Vấn đề**: GET request bị log trong browser history, server logs. Endpoint reset password tất cả demo accounts khi gọi.

---

## Root Cause — Tại sao Học sinh & Giáo viên lỗi đăng nhập

1. **Demo user chưa seed**: Fallback tạo user mới, nhưng fail silently (catch rỗng dòng 138) → ID giả → mọi DB action fail.
2. **User đã đổi mật khẩu**: Quick login hardcode password → luôn fail → error sai.
3. **Demo user đổi mật khẩu**: Tạo user mới role="TEACHER" hardcoded → học sinh bị gán sai role.
4. **Session race condition**: Redirect fallback email-based → route sai.

---

## Files Reviewed
- `src/middleware.ts`, `src/lib/auth.ts`, `src/app/login/page.tsx`
- `src/app/actions/user-password.ts`, `src/components/auth/ForcePasswordChangeModal.tsx`
- `src/components/layout/Header.tsx`, `src/app/admin/layout.tsx`
- `src/app/teacher/layout.tsx`, `src/app/student/layout.tsx`
- `src/app/vice-principal/layout.tsx`, `src/app/api/db-seed/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/unauthorized/page.tsx`
- `types/next-auth.d.ts`, `prisma/schema.prisma`
