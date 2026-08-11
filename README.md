# 🏫 Hệ Thống Quản Lý Trường Học & Phân Hệ Quản Trị Chiến Lược (Module I)

> **Hệ thống Quản lý Giáo dục & Governance số hóa tích hợp AI cho Trường PTDTBT / Trường Phổ thông nhiều Phân hiệu và Điểm trường lẻ.**

---

## 📌 Giới Thiệu Tổng Quan

Hệ thống Quản lý Trường học (School Management System) cung cấp một giải pháp toàn diện cho công tác Quản trị Chiến lược & Điều hành Giáo dục. Hệ thống hỗ trợ mô hình đa phân hiệu (Multi-Campus) và các điểm trường lẻ vùng cao, tự động hóa quy trình giao chỉ tiêu, giám sát Mục tiêu chất lượng SMART, quản lý KPI toàn trường, phê duyệt hồ sơ 6 bước, khóa dữ liệu bảo mật và gợi ý ra quyết định bằng Trí tuệ nhân tạo (AI Assistant).

---

## ✨ 🏛️ Các Phân Hệ & Tính Năng Nổi Bật (Module I)

### 1. 🎯 Quản Lý Mục Tiêu Chất Lượng (SMART Quality Objectives)
- Thiết lập & quản lý 10 nhóm mục tiêu chiến lược: Chất lượng học tập, Chuyên cần, Chuyển đổi số, Cơ sở vật chất, An toàn trường học, Mức độ hài lòng của phụ huynh...
- Tự động đo lường tỷ lệ hoàn thành (%), so sánh Baseline vs Target vs Actual.
- Phân rã mục tiêu xuống từng **Phân hiệu** (Trung tâm, Cụm Sơn Lâm, Cụm Khâu Cáp) và **Điểm trường lẻ**.
- Theo dõi lịch sử điều chỉnh và đính kèm hồ sơ minh chứng.

### 2. 📊 Bộ Chỉ Số KPI & Dashboard Quản Trị Chiến Lược
- Danh mục chỉ số KPI chuẩn hóa toàn trường (Academic, Operational, Financial, Staff, Digital Transformation).
- Giao chỉ tiêu KPI theo Học kỳ/Năm học kèm trọng số (%) và ngưỡng cảnh báo.
- Dashboard trực quan hóa dữ liệu với biểu đồ tiến độ, chỉ số KPI weighted score, tỷ lệ chuyên cần realtime và mức độ hoàn thành nhiệm vụ.

### 3. 🛡️ Quy Trình Phê Duyệt 6 Bước & Khóa Dữ Liệu (Data Locking)
- **Quy trình 6 cấp phê duyệt**: `DRAFT` ➔ `SUBMITTED` ➔ `CAMPUS_CONFIRMED` ➔ `VP_REVIEWED` ➔ `PRINCIPAL_APPROVED` ➔ `LOCKED`.
- Tính năng **Khóa dữ liệu tự động** sau khi Hiệu trưởng phê duyệt, ngăn chặn chỉnh sửa trái phép số liệu báo cáo.
- Quy trình yêu cầu mở khóa (Unlock Request) có ghi lại nhật ký kiểm toán (Audit Trail).

### 4. 📂 Quản Lý Tệp Minh Chứng & Kiểm Toán Hệ Thống (Evidence Management & Audit Logs)
- Lưu trữ tệp minh chứng (PDF, Word, Excel, Hình ảnh) liên quan tới KPI và Mục tiêu chất lượng.
- Quản lý phiên bản tệp (Version Control: v1, v2...) và nhật ký thao tác (`UPLOAD`, `REPLACE`, `SOFT_DELETE`, `RESTORE`).
- Xuất báo cáo dữ liệu định dạng **PDF, Word, Excel**.

### 5. 🤖 Trí Tuệ Nhân Tạo & Điều Hành Thông Minh (AI Assistant & Decision Support)
- Gợi ý phân công **Giáo viên dạy thay tối ưu** dựa trên vị trí địa lý (khoảng cách km giữa các phân hiệu/điểm trường) và chuyên môn bằng thuật toán AI.
- Hệ thống **Cảnh báo sớm (Early Warnings)** về rủi ro học sinh bỏ học, tụt lùi học lực, sự cố an toàn trường học.
- Trợ lý AI cho Hiệu trưởng (Decision Log): Tư vấn phương án xử lý tình huống quản trị và điều hành.

### 6. 👥 Phân Quyền Theo Vai Trò (RBAC & Campus Scope)
- **Hiệu trưởng (ADMIN)**: Toàn quyền quản trị chiến lược, duyệt mục tiêu, khóa dữ liệu, xem toàn bộ các phân hiệu.
- **Phó Hiệu trưởng (VICE_PRINCIPAL)**: Phụ trách chuyên môn/cơ sở, duyệt hồ sơ thuộc Phân hiệu được phân công.
- **Giáo viên (TEACHER)**: Cập nhật giáo án, sổ đầu bài, điểm danh, báo cáo ngày và theo dõi KPI cá nhân.
- **Học sinh (STUDENT)**: Xem thời khóa biểu, kết quả học tập, thông báo và rèn luyện.

---

## 🛠️ Kiến Trúc Công Nghệ

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) với React 19 & TypeScript
- **Database & ORM**: PostgreSQL (Neon / Supabase) & [Prisma ORM](https://www.prisma.io/)
- **Authentication**: NextAuth.js (JWT Session-based RBAC)
- **Styling**: Tailwind CSS & Lucide Icons
- **Deployment**: Vercel Serverless / Edge Runtime

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local Setup)

### 1. Yêu cầu môi trường
- Node.js version 18.x trở lên
- npm hoặc yarn / pnpm
- Cơ sở dữ liệu PostgreSQL (hoặc Neon Database URL)

### 2. Tải mã nguồn & Cài đặt thư viện
```bash
git clone https://github.com/tungzuizer/robot-contest.git
cd school-management
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
Cập nhật chuỗi kết nối PostgreSQL trong `.env`:
```env
DATABASE_URL="postgresql://username:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-at-least-32-characters-long"
```

### 4. Khởi tạo Cơ sở dữ liệu & Tạo Dữ liệu mẫu (Seed Data)
```bash
# Đẩy cấu trúc Schema vào Database
npx prisma db push

# Nạp dữ liệu kiểm thử thực tế (1 Trường, 3 Phân hiệu, 4 Điểm trường, 10 SMART Objectives, 15 KPIs, 4 Workflows, Minh chứng)
npx prisma db seed
```

### 5. Khởi chạy ứng dụng
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3000`

---

## 🔑 Tài Khoản Trải Nghiệm Demo

Sau khi chạy lệnh `npx prisma db seed`, bạn có thể đăng nhập bằng các tài khoản mẫu sau (Mật khẩu chung: `123456`):

| Vai Trò | Email | Mật Khẩu | Phạm Vi Quản Lý |
| :--- | :--- | :--- | :--- |
| **Hiệu trưởng (Admin)** | `admin@school.com` | `123456` | Toàn trường (Tất cả phân hiệu & điểm trường) |
| **Phó HT Phân hiệu 1** | `vp1@school.com` | `123456` | Phân hiệu 1 - Trung Tâm |
| **Phó HT Phân hiệu 2** | `vp2@school.com` | `123456` | Phân hiệu 2 - Cụm Sơn Lâm |
| **Giáo viên Chuyên môn** | `teacher@school.com` | `123456` | Giảng dạy & Chủ nhiệm Lớp 6A1 |
| **Học sinh** | `student@school.com` | `123456` | Cá nhân học sinh Lớp 6A1 |

---

## ☁️ Hướng Dẫn Triển Khai Lên Vercel (Deployment)

1. **Đẩy mã nguồn lên GitHub Repository**.
2. **Đăng nhập vào [Vercel](https://vercel.com/)** và tạo New Project từ GitHub Repo.
3. **Cấu hình Environment Variables** trên Vercel Dashboard:
   - `DATABASE_URL`: Chuỗi kết nối PostgreSQL (Neon/Supabase)
   - `NEXTAUTH_URL`: Domain của ứng dụng (VD: `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Khóa ngẫu nhiên bảo mật 32+ ký tự
   - `NODE_ENV`: `production`
4. **Build Command & Output**:
   - Vercel sẽ tự động phát hiện Next.js.
   - Trong `package.json`, lệnh `postinstall` hoặc Build command sẽ thực hiện `prisma generate`.
5. Sau khi Deploy thành công, chạy lệnh `npx prisma db push` và `npx prisma db seed` trên Database server từ terminal máy bạn hoặc tích hợp trong CI/CD.

---

## 📄 Giấy Phép & Bản Quyền

Hệ thống được phát triển phục vụ công tác Quản lý Giáo dục và Quản trị Chiến lược Nhà trường. Bảo lưu mọi quyền.
