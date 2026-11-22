# Local review: rà soát công việc và nhân sự

Nhánh này thêm quy trình nội bộ cho `ADMIN` (Hiệu trưởng) và `VICE_PRINCIPAL` (Phó Hiệu trưởng). Không sửa dữ liệu nhân sự, phân công, KPI, NQ 37 hoặc luồng phê duyệt cũ. Không gọi API AI. Bản xuất JSON là **bản nháp nội bộ**, chưa phải biểu mẫu hay quyết định chính thức.

## Chạy local

1. Cài dependency bằng `npm ci`.
2. Chạy PostgreSQL riêng cho dự án. Đặt `DATABASE_URL` và `DIRECT_URL` trỏ cùng database local, cùng `NEXTAUTH_URL=http://127.0.0.1:3100`, `NEXTAUTH_SECRET` là khóa local và `ALLOW_DEMO_LOGIN=false` trong `.env`. Không dùng database production.
3. Trên database local **trống**, chạy `npx prisma db push`, rồi `npm run dev -- --hostname 127.0.0.1 --port 3100`.
4. Tạo tài khoản QA thuộc một trường và cơ sở local. Hiệu trưởng tạo bản nháp; Phó ghi công việc/giải trình và gửi; Hiệu trưởng trả lại hoặc xác nhận. Bản xác nhận phải chỉ còn chế độ đọc.

`prisma migrate deploy` trên database trắng hiện lỗi ở migration cũ `20260826000000_rbac_roles_and_scope`: nó tham chiếu `WARD_ADMIN` nhưng migration nền chỉ tạo enum `ADMIN`, `TEACHER`, `STUDENT`. Không sửa migration lịch sử trong nhánh này. Migration mới `20261123000000_personnel_review` đã được so với SQL do `prisma migrate diff` sinh; **chưa áp trên bản sao schema production**. Cần kiểm tra trạng thái migration của môi trường đích trước khi triển khai.

## Phạm vi bản review

- Mỗi hồ sơ thuộc một cơ sở và kỳ rà soát; dữ liệu nhân sự, lớp, phân công được chụp khi tạo hồ sơ.
- Phó chỉ xem/sửa cơ sở gắn với tài khoản hoặc `UserRoleScope` kiểu `CAMPUS`, trong cùng trường. Hiệu trưởng chỉ xem trường của mình. Role và trường được đọc lại từ database tại mỗi server action.
- Trạng thái: `DRAFT` → `SUBMITTED` → `RETURNED` hoặc `CONFIRMED`. Hồ sơ xác nhận bị khóa; mọi cập nhật có phiên bản và nhật ký.
- Cảnh báo đầu tiên chỉ nêu lớp chưa có phân công trong dữ liệu nguồn; đây là tín hiệu kiểm tra, không tự kết luận thiếu nhân sự.
- Chưa có phạm vi theo tổ chuyên môn xuyên cơ sở, minh chứng upload hoặc biểu Excel/Word chính thức. Cần biểu mẫu và quy tắc phân công của trường để mở rộng đúng nghiệp vụ.
