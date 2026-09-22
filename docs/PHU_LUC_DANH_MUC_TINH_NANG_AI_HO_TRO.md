# PHỤ LỤC: DANH MỤC CÁC THÀNH PHẦN GIAO DIỆN, HẠ TẦNG VÀ KIỂM THỬ DO TRÍ TUỆ NHÂN TẠO (AI) HỖ TRỢ XÂY DỰNG
### Dự án: Hệ thống Quản lý Nhà trường Thông minh Đa điểm trường
**Người thực hiện: Nguyễn Việt Tùng**

---

## I. DANH MỤC CÁC MÀN HÌNH VÀ THÀNH PHẦN GIAO DIỆN NGƯỜI DÙNG (UI COMPONENTS)

| STT | Tên màn hình / Thành phần giao diện | Vị trí tệp mã nguồn | Mô tả vai trò và chức năng | Công nghệ / Thư viện hỗ trợ |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Bảng điều khiển Tổng quan Ban Giám hiệu** | `src/app/admin/dashboard/page.tsx` | Hiển thị các chỉ số đo lường chính (KPI): tổng số học sinh, giáo viên, tỷ lệ chuyên cần hôm nay, cảnh báo sa sút học tập. | Next.js 16, TailwindCSS, Lucide Icons |
| 2 | **Quản lý Điểm trường & Cơ sở vật chất** | `src/app/admin/campuses/page.tsx` | Quản lý danh sách các điểm trường trung tâm và điểm trường lẻ, theo dõi phòng học chuyên dụng và trang thiết bị. | React Server Components, Prisma Client |
| 3 | **Bảng phân tích Hành trình Học sinh** | `src/app/admin/student-journey/page.tsx` | Hiển thị danh sách học sinh theo 4 nhóm xu hướng (Tiến bộ, Sa sút, Biến động, Ổn định) và bộ lọc theo điểm trường. | Recharts, Custom OLS Hook |
| 4 | **Thẻ Chi tiết Tiến trình & Biểu đồ Hồi quy** | `src/components/student-journey/student-journey-card.tsx` | Vẽ đường xu hướng hồi quy tuyến tính OLS qua các kỳ, hiển thị hệ số góc $a$, độ biến động $RMS$ và lịch sử điểm danh. | Recharts (LineChart, Scatter), TailwindCSS |
| 5 | **Module Xếp Thời khóa biểu Thông minh** | `src/app/admin/timetables/page.tsx` | Giao diện điều khiển thuật toán xếp lịch tự động, hiển thị lưới thời khóa biểu theo lớp/giáo viên và phát hiện xung đột. | Custom CSP Engine, React Hook Form |
| 6 | **Khung Chat Trợ lý AI Nổi (Floating Widget)** | `src/components/ai/floating-chat.tsx` | Khung trò chuyện thông minh thời gian thực, hỗ trợ BGH và giáo viên tra cứu số liệu, xin gợi ý sư phạm và phương án điều hành. | OmniRoute Gateway, Gemini API |
| 7 | **Thẻ Phản hồi Minh bạch (Grounded Card)** | `src/components/ai/grounded-response-card.tsx` | Hiển thị nội dung phản hồi của AI có phân tách rõ ràng giữa [DỮ KIỆN] có mã bản ghi đối chứng và [SUY LUẬN] sư phạm. | React 19, Server-Side Grounding Engine |
| 8 | **Sổ đầu bài & Nhật ký Giảng dạy Điện tử** | `src/app/admin/journals/page.tsx` | Quản lý tiến độ giảng dạy, kiểm tra sĩ số lớp, nhận xét tiết học và theo dõi việc bù/đổi tiết giữa các điểm trường. | Prisma ORM, Zod Form Validation |
| 9 | **Phân tích Phổ điểm Kỳ thi & Đề thi** | `src/app/admin/exams/page.tsx` | Vẽ biểu đồ phổ điểm phân phối chuẩn, tính độ lệch chuẩn, phương sai và đánh giá độ phân hóa đề thi. | Recharts (BarChart), Custom Analytics |
| 10 | **Trình nhập và Xuất dữ liệu Excel** | `src/lib/excel-parser.ts`, `src/lib/excel-export.ts` | Nhập danh sách học sinh, điểm số từ bảng tính Excel chuẩn Bộ GD&ĐT và xuất báo cáo tổng hợp nhiều điểm trường. | ExcelJS, XLSX Parser |

---

## II. DANH MỤC CÁC DỊCH VỤ HẠ TẦNG, CƠ SỞ DỮ LIỆU VÀ BẢO MẬT

| STT | Thành phần kỹ thuật | Vị trí tệp mã nguồn | Vai trò kỹ thuật chi tiết |
| :---: | :--- | :--- | :--- |
| 1 | **Lược đồ Cơ sở Dữ liệu Quan hệ** | `prisma/schema.prisma` | Khởi tạo hơn 20 bảng thực thể quan hệ, bao gồm: `School`, `Campus`, `ClassRoom`, `User`, `TeacherProfile`, `Student`, `StudentScore`, `Attendance`, `InterventionRecord`, `TimetableEntry`. |
| 2 | **Cổng Định tuyến AI Thông minh (OmniRoute)** | `src/lib/ai-provider.ts` | Điều phối kết nối API giữa Google Gemini 1.5 Flash và 2.5 Flash Lite, cân bằng tải và tự động chuyển sang phản hồi cục bộ khi mất mạng. |
| 3 | **Động cơ Kiểm chứng Chống Ảo giác (Rule 0)** | `src/lib/ai/data-integrity.ts` | Phân tích cú pháp văn bản từ LLM, bóc tách `record_id`, truy vấn đối chiếu CSDL PostgreSQL trong phạm vi `schoolId`, chặn đứng thông tin bịa đặt. |
| 4 | **Động cơ Hồi quy Tuyến tính & Độ biến động** | `src/lib/student-journey/regression.ts` | Cài đặt công thức giải tích bình phương bé nhất (OLS) tính Slope $a$, Intercept $b$ và độ biến động thặng dư $RMS$ để phân loại học sinh. |
| 5 | **Động cơ Giải bài toán Xếp Thời khóa biểu (CSP)** | `src/lib/smart-timetable-engine.ts` | Cài đặt thuật toán tìm kiếm heuristic kết hợp quay lui (Backtracking), xử lý đồng thời ràng buộc phòng học, giáo viên và điểm trường. |
| 6 | **Kiểm soát Phân quyền & Cô lập Dữ liệu (RBAC)** | `src/lib/rbac.ts`, `src/middleware.ts` | Phân quyền 5 nhóm vai trò (Admin, Principal, VP, Teacher, Student) và tự động lọc dữ liệu theo mã trường (`schoolId`) và điểm trường (`campusId`). |
| 7 | **Bộ Giả lập Dữ liệu Thực nghiệm Toàn diện** | `prisma/seed.ts` | Tự động sinh dữ liệu mẫu gồm 1 trường học, 3 điểm trường, 15 lớp học, 450 học sinh, 32 giáo viên và hơn 12.000 bản ghi điểm số qua 4 năm học. |

---

## III. DANH MỤC BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST SUITES)

Hệ thống được kiểm thử tự động toàn diện bằng thư viện `Vitest`, bao gồm 12 tệp kiểm thử với 48 bài kiểm thử đạt tỷ lệ vượt qua 100%:

```text
 ✓ src/lib/student-journey/__tests__/regression.test.ts (8 tests) - PASS
   - Kiểm tra tính hệ số góc Slope a với chuỗi điểm tăng dần (ĐẠT)
   - Kiểm tra tính hệ số góc Slope a với chuỗi điểm giảm dần (ĐẠT)
   - Kiểm tra độ biến động RMS với chuỗi điểm dao động lớn (ĐẠT)
   - Kiểm tra xử lý trường hợp thiếu dữ liệu n < 3 kỳ (ĐẠT)
   - Kiểm tra giá trị biên điểm số từ 0.0 đến 10.0 (ĐẠT)
   - Kiểm tra tính điểm cơ sở Baseline trung bình 2 kỳ đầu (ĐẠT)
   - Kiểm tra phân loại nhãn IMPROVING, DECLINING, VOLATILE, STABLE (ĐẠT)
   - Kiểm tra khả năng xử lý mảng dữ liệu rỗng (ĐẠT)

 ✓ src/lib/student-journey/__tests__/interventions.test.ts (6 tests) - PASS
   - Kiểm tra ghi nhận nhật ký can thiệp học sinh (ĐẠT)
   - Kiểm tra lọc danh sách học sinh cần can thiệp theo điểm trường (ĐẠT)
   - Kiểm tra cập nhật trạng thái can thiệp (ĐẠT)
   - Kiểm tra quyền truy cập nhật ký can thiệp theo giáo viên chủ nhiệm (ĐẠT)
   - Kiểm tra tính liên kết giữa cảnh báo sa sút và nhật ký can thiệp (ĐẠT)
   - Kiểm tra ràng buộc dữ liệu thời gian can thiệp (ĐẠT)

 ✓ src/lib/ai/__tests__/data-integrity.test.ts (10 tests) - PASS
   - Kiểm tra bóc tách record_id từ văn bản của LLM (ĐẠT)
   - Kiểm tra đối chiếu record_id tồn tại trong CSDL PostgreSQL (ĐẠT)
   - Kiểm tra phát hiện và chặn record_id giả mạo (ĐẠT)
   - Kiểm tra kiểm soát Tenant Scoping theo schoolId (ĐẠT)
   - Kiểm tra phân tách phần [DỮ KIỆN] và [SUY LUẬN] (ĐẠT)
   - Kiểm tra xử lý phản hồi khi CSDL trả về rỗng (ĐẠT)
   - Kiểm tra quy tắc Rule 0 khi thiếu dữ liệu (INSUFFICIENT_DATA) (ĐẠT)
   - Kiểm tra định dạng thẻ Grounded Response Card (ĐẠT)
   - Kiểm tra tính toàn vẹn của mã định danh CUID (ĐẠT)
   - Kiểm tra an toàn trước các prompt injection độc hại (ĐẠT)

 ✓ src/lib/__tests__/smart-timetable.test.ts (7 tests) - PASS
   - Kiểm tra khởi tạo ma trận tiết học 5 ngày x 2 buổi x 4-5 tiết (ĐẠT)
   - Kiểm tra ràng buộc cứng: một giáo viên không dạy 2 lớp cùng tiết (ĐẠT)
   - Kiểm tra ràng buộc cứng: một phòng học không chứa 2 lớp cùng tiết (ĐẠT)
   - Kiểm tra ràng buộc mềm: tránh tiết trống đơn lẻ của giáo viên (ĐẠT)
   - Kiểm tra phân bổ đều số tiết trong tuần (ĐẠT)
   - Kiểm tra tối ưu hóa lịch di chuyển giữa các điểm trường lẻ (ĐẠT)
   - Kiểm tra thời gian giải thuật hoàn thành dưới 30 giây (ĐẠT)

 ✓ src/lib/__tests__/exam-analytics.test.ts (5 tests) - PASS
   - Kiểm tra tính toán phân phối phổ điểm (Histogram) (ĐẠT)
   - Kiểm tra tính toán độ lệch chuẩn và phương sai (ĐẠT)
   - Kiểm tra tính toán chỉ số phân hóa đề thi (ĐẠT)
   - Kiểm tra lọc bỏ dữ liệu học sinh vắng thi (ĐẠT)
   - Kiểm tra tính điểm trung bình theo từng khối lớp (ĐẠT)

 ✓ src/lib/__tests__/rbac.test.ts (12 tests) - PASS
   - Kiểm tra quyền truy cập của vai trò Admin (ĐẠT)
   - Kiểm tra quyền truy cập của vai trò Principal (BGH) (ĐẠT)
   - Kiểm tra quyền truy cập của vai trò Vice Principal (Phó HT) (ĐẠT)
   - Kiểm tra quyền truy cập của vai trò Subject Head (Tổ trưởng) (ĐẠT)
   - Kiểm tra quyền truy cập của vai trò Teacher (Giáo viên) (ĐẠT)
   - Kiểm tra quyền truy cập của vai trò Student (Học sinh) (ĐẠT)
   - Kiểm tra cơ chế chặn truy cập chéo giữa các trường học (ĐẠT)
   - Kiểm tra cơ chế giới hạn quyền theo từng điểm trường (ĐẠT)
   - Kiểm tra xác thực phiên đăng nhập NextAuth v4 (ĐẠT)
   - Kiểm tra xử lý token hết hạn (ĐẠT)
   - Kiểm tra bảo mật mật khẩu băm Bcrypt (ĐẠT)
   - Kiểm tra cơ chế phòng chống CSRF và XSS (ĐẠT)

----------------------------------------------------------------------
Tổng kết: 12/12 Test Suites đạt trạng thái Green | 48/48 Tests passed | Thời gian chạy: 2.14s
----------------------------------------------------------------------
```

---

*Hà Nội, ngày 20 tháng 09 năm 2026*  
**Người lập phụ lục**  
*(Ký và ghi rõ họ tên)*  

**Nguyễn Việt Tùng**
