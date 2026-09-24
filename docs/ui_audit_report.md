# 📊 Báo Cáo Kiểm Tra Giao Diện — School Management System

## Trạng thái: Server đang chạy tại `http://localhost:3000`

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG (Critical)

### 1. Xung đột CSS — `globals.css` vs Tailwind v4
**File:** `src/app/globals.css`
- Dùng `@import "tailwindcss"` (Tailwind v4 syntax) nhưng các class như `shadow-xs`, `shadow-2xs`, `rounded-2xl`, `font-black` cần kiểm tra compatibility
- **Xung đột focus ring:** `globals.css` line 154 đặt `border-color: #4f46e5 !important` (indigo) cho tất cả input, nhưng login form dùng `focus:border-sky-600` — do `!important` trong globals thắng, làm mất đi hiệu ứng focus màu sky của form đăng nhập
- **Double hover transition:** `globals.css` đặt `translateY(-1px)` cho tất cả button hover, nhưng nhiều button trong code lại có `hover:-translate-y-0.5` — hai transform này có thể conflict tạo ra jitter

### 2. Login Page — Màu sắc sidebar vs form không đồng nhất
**File:** `src/app/login/page.tsx`
- Left panel dùng `bg-gradient-to-b from-sky-600 to-indigo-900` (dark blue)
- Right panel dùng `bg-white/90` (trắng sáng)
- Canvas particle (`LuminousBackground`) render lên nền sáng trắng — các hạt màu `rgba(2,132,199)` với `opacity-90` sẽ rất khó nhìn trên nền trắng phía bên phải

### 3. Admin Layout — Sidebar có vấn đề về màu `w-20` collapsed
**File:** `src/app/admin/layout.tsx`
- Khi sidebar collapsed (`w-20`), chỉ hiện icon nhưng **không có label** và **không có nhóm menu** → navigation bị mất hoàn toàn, chỉ còn icons không có ngữ cảnh
- NavTooltip chỉ visible khi hover — người dùng không biết icon nào dẫn đến đâu

---

## 🟠 VẤN ĐỀ TRUNG BÌNH (Major)

### 4. Dashboard — MetricCard thiếu icon, khô khan
**File:** `src/app/admin/dashboard/page.tsx` (line 1128)
- `MetricCard` component chỉ có số và text — không có icon, không có sparkline, không có trend arrow → cảm giác rất "báo cáo văn phòng"
- Nhưng user instruction đã nói *"xóa bỏ hết các icon"* — vậy đây là thiết kế có chủ ý. Tuy nhiên kết quả là cards trông quá trống trải

### 5. Dashboard — Header section "Tổng quan Điều hành"
**File:** `src/app/admin/dashboard/page.tsx` (line 186)
- `bg-white rounded-2xl p-5 border border-slate-200/80` — trắng thuần, không gradient, không accent → không nổi bật, nhạt nhẽo so với sidebar có nhiều màu sắc
- Quick action buttons (`px-3 py-2 bg-slate-100`) quá nhỏ, khó click trên mobile

### 6. Dashboard — Section "Daily Operations" dark card bị không đồng nhất style
**File:** `src/app/admin/dashboard/page.tsx` (line 495)
- `bg-[#090d16]` card tối hoàn toàn nằm giữa toàn bộ layout trắng sáng → contrast quá mạnh, gây mất điểm thẩm mỹ
- Nên có pattern nhất quán: hoặc dark theme hoàn toàn, hoặc light theme hoàn toàn

### 7. Admin Layout — Sidebar chỉ có light theme nhưng hover state dùng màu trắng
**File:** `src/app/admin/layout.tsx` (line 319)
- Sidebar background: `from-sky-100/90 via-sky-50/80 to-blue-100/70` — rất sáng
- Active item: `bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white` — đậm
- Hover: `hover:bg-gradient-to-r hover:from-sky-200/80 hover:to-blue-100/80` — rất nhạt, khó phân biệt với nền

### 8. Login Page — Textarea/Input focus color conflict
- `globals.css`: `input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2) !important; }`
- Login form: `focus:border-sky-600 focus:ring-4 focus:ring-sky-500/15`
- → Global CSS override Tailwind → Focus ring màu **indigo** thay vì **sky** như thiết kế

### 9. Breadcrumb thiếu ngữ cảnh
- Chỉ nhìn thấy nếu component Breadcrumb hoạt động — cần verify component hiển thị đúng

---

## 🟡 VẤN ĐỀ NHỎ (Minor)

### 10. Typography không nhất quán
- Admin sidebar: `text-[9px]`, `text-[10px]`, `text-[11px]` — rất nhỏ, khó đọc trên màn hình nhỏ
- Dashboard section headers: `text-base font-bold` vs `text-lg font-bold` — không có hierarchy rõ ràng

### 11. Empty state charts
- `EmptyState` component rất đơn giản: `h-[260px]` với chỉ một dòng text
- Nên có illustration hoặc icon để làm phong phú hơn

### 12. Mobile bottom nav padding
**File:** `src/app/admin/layout.tsx` (line 546)
- `pb-36 lg:pb-8` — padding bottom mobile 144px là khá lớn

### 13. `w-9.5 h-9.5` — custom Tailwind class không chuẩn
- Login page line 457: `w-9.5 h-9.5` không phải class Tailwind tiêu chuẩn
- Trong Tailwind v4 có thể hoạt động, nhưng dễ gây lỗi nếu không được cấu hình đúng

### 14. Dashboard — `CHART_PALETTE` màu `#1e293b` (slate-900) cho bar chart
- Bar chart dùng màu tối trên nền trắng — ổn
- Nhưng `#dc2626` (đỏ) và `#059669` (xanh) cạnh nhau trong "Attendance" chart — màu sắc chưa hài hòa với design system chủ đạo sky/blue

---

## ✅ ĐIỂM TỐT (Strengths)

1. **Animation system** trong `globals.css` rất phong phú và được chuẩn bị tốt
2. **Login page** có thiết kế glassmorphism đẹp với canvas particle animation
3. **Skeleton loading** được implement đúng cách
4. **WCAG badge** colors được chú thích rõ ràng (compliant ≥4.5:1)
5. **Accordion sidebar** single-active collapse logic gọn gàng
6. **`prefers-reduced-motion`** được xử lý tốt trong CSS
7. **Mobile drawer + bottom nav** đã được thiết kế cho mobile

---

## 🎯 GIẢI PHÁP ƯU TIÊN

| Ưu tiên | Vấn đề | Giải pháp |
|---------|--------|-----------|
| P0 | Focus color conflict (indigo vs sky) | Đổi `globals.css` input focus sang `sky` hoặc dùng `.admin-input` class riêng |
| P0 | Button `translateY` double conflict | Gộp hoặc loại bỏ global button hover transform |
| P1 | MetricCard quá khô | Thêm gradient tint background + progress bar nhỏ |
| P1 | Dashboard header trắng nhạt | Thêm subtle gradient + accent border-left |
| P1 | Dark card `#090d16` cô lập | Thay bằng `slate-900` nhẹ hơn hoặc dùng dark card consistently |
| P2 | Sidebar collapsed thiếu labels | Đảm bảo tooltip hover hiển thị tốt |
| P2 | Text quá nhỏ `text-[9px]` | Tăng lên ít nhất `text-[11px]` |
| P3 | Empty state charts | Thêm SVG icon đơn giản |

---

## 📌 Các trang cần kiểm tra thêm

- `/teacher/dashboard` — chưa đọc code
- `/student/dashboard` — chưa đọc code  
- `/register` — chưa đọc code
- `/ward/dashboard` — chưa đọc code
- Mobile responsive breakpoints thực tế (< 375px)
