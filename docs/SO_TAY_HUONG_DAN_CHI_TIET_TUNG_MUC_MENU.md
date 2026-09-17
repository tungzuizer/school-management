<!--
Fact-Forcing Gate Declaration:
- Importers / Callers: School Administrators, Teachers, Education Departments (Sở/Phòng GD&ĐT), Parents, Students, Documentation Portal
- Affected API: Navigation Routes across /admin/*, /teacher/*, /department/*, /ward/*, /student/*
- Data schemas: Thông tư 15/2020/TT-BGDĐT, Thông tư 22/2021/TT-BGDĐT, Nghị quyết 37/2025/NQ-CP, Công văn 5512/BGDĐT-GDTrH
- User's verbatim instruction: "tôi cần hướng dẫn chi tiết cách dùng trong từng mục trong menu luôn phải chi tiết từng mục"
-->

# 📚 SỔ TAY HƯỚNG DẪN SỬ DỤNG CHI TIẾT TỪNG MỤC MENU
## HỆ THỐNG QUẢN LÝ GIÁO DỤC THÔNG MINH EDUSMART (CHUẨN BỘ GD&ĐT)

---

* **Quy chuẩn áp dụng**: Thông tư 15/2020/TT-BGDĐT, Thông tư 22/2021/TT-BGDĐT, Nghị quyết 37/2025/NQ-CP & Công văn 5512/BGDĐT-GDTrH.
* **Cấu trúc cẩm nang**: Phân rã 100% tất cả các mục menu của 4 phân hệ (Admin/BGH $\rightarrow$ Giáo viên/Tổ trưởng $\rightarrow$ Sở/Phòng GD&ĐT $\rightarrow$ Học sinh/Phụ huynh).
* **Mỗi mục menu bao gồm 5 nội dung chuyên sâu**:
  1. *Vị trí menu & Mục đích nghiệp vụ*
  2. *Giải thích chi tiết giao diện (KPIs, bộ lọc, bảng dữ liệu, nút bấm)*
  3. *Quy trình thao tác chuẩn từng bước*
  4. *Tình huống thực tế & Cách xử lý sự cố*
  5. *Quyền hạn & Phân cấp phê duyệt*

---

# MỤC LỤC TOÀN BỘ CÁC MỤC MENU

- [PHẦN I: PHÂN HỆ BAN GIÁM HIỆU & QUẢN TRỊ VIÊN (ADMIN & PRINCIPAL)](#phan-i-admin)
  - [Nhóm 01: ĐIỀU HÀNH NHÀ TRƯỜNG & THỜI GIAN THỰC](#nhom-01-dieu-hanh-bgh)
    - [1.1. Bảng điều khiển (`/admin/dashboard`)](#menu-11)
    - [1.2. Điểm thi OLS (`/admin/exam-analytics`)](#menu-12)
    - [1.3. Radar cảnh báo (`/admin/early-warnings`)](#menu-13)
    - [1.4. Báo cáo ngày (`/admin/daily-reports`)](#menu-14)
    - [1.5. Đánh giá TT 15 (`/admin/tt15-evaluation`)](#menu-15)
    - [1.6. Trợ lý BGH AI (`/admin/principal-ai`)](#menu-16)
    - [1.7. Chiến lược & KPI (`/admin/strategy`)](#menu-17)
  - [Nhóm 02: DẠY HỌC & CHUYÊN MÔN](#nhom-02-day-hoc-chuyen-mon)
    - [2.1. Kế hoạch bài dạy (`/admin/lesson-plans`)](#menu-21)
    - [2.2. Sổ đầu bài (`/admin/journals`)](#menu-22)
    - [2.3. Lớp học (`/admin/classes`)](#menu-23)
    - [2.4. Hồ sơ học sinh (`/admin/students`)](#menu-24)
    - [2.5. Thời khóa biểu (`/admin/schedule`)](#menu-25)
    - [2.6. Tổ bộ môn (`/admin/subject-groups`)](#menu-26)
    - [2.7. Danh mục trường (`/admin/schools`)](#menu-27)
  - [Nhóm 03: NHÂN SỰ & NGHỊ QUYẾT 37](#nhom-03-nhan-su-nq37)
    - [3.1. Định mức NQ 37 (`/admin/nq37-compliance`)](#menu-31)
    - [3.2. Nhân sự 36T (`/admin/support-staff`)](#menu-32)
    - [3.3. Đội ngũ giáo viên (`/admin/teachers`)](#menu-33)
    - [3.4. Dạy thay khẩn cấp (`/admin/substitute-dispatch`)](#menu-34)
    - [3.5. Cán bộ BGH (`/admin/principals`)](#menu-35)
  - [Nhóm 04: PHÊ DUYỆT & QUẢN TRỊ](#nhom-04-phe-duyet-quan-tri)
    - [4.1. Duyệt yêu cầu BGH (`/admin/approvals`)](#menu-41)
    - [4.2. Khóa sổ dữ liệu (`/admin/data-lock`)](#menu-42)
    - [4.3. Duyệt học bạ (`/admin/transcripts`)](#menu-43)
    - [4.4. Cơ sở phân hiệu (`/admin/multi-school`)](#menu-44)
    - [4.5. Thông báo trường (`/admin/notifications`)](#menu-45)
    - [4.6. Nhật ký kiểm toán (`/admin/audit-log`)](#menu-46)

- [PHẦN II: PHÂN HỆ GIÁO VIÊN & TỔ CHUYÊN MÔN (TEACHER & SUBJECT HEAD)](#phan-ii-teacher)
  - [Nhóm 01: ĐIỀU HÀNH GIẢNG DẠY](#nhom-t01-dieu-hanh)
    - [5.1. Bảng điều khiển 360° (`/teacher/dashboard`)](#menu-51)
    - [5.2. Thời khóa biểu tuần (`/teacher/schedule`)](#menu-52)
  - [Nhóm 02: QUẢN LÝ HỌC SINH](#nhom-t02-quan-ly-hoc-sinh)
    - [5.3. Danh sách học sinh (`/teacher/students`)](#menu-53)
    - [5.4. Sơ đồ chỗ ngồi lớp Cinema Seating (`/teacher/seating-cinema`)](#menu-54)
    - [5.5. Cộng điểm rèn luyện & Khen thưởng (`/teacher/commendations`)](#menu-55)
  - [Nhóm 03: LỚP CHỦ NHIỆM](#nhom-t03-chu-nhiem)
    - [5.6. Sổ chủ nhiệm (`/teacher/homeroom`)](#menu-56)
    - [5.7. Điểm danh sĩ số (`/teacher/attendance`)](#menu-57)
    - [5.8. Học bạ điện tử (`/teacher/transcript`)](#menu-58)
    - [5.9. Báo cáo ngày BGH (`/teacher/daily-report`)](#menu-59)
  - [Nhóm 04: GIẢNG DẠY BỘ MÔN](#nhom-t04-bo-mon)
    - [5.10. Sổ đầu bài điện tử (`/teacher/journal`)](#menu-510)
    - [5.11. Giáo án & Bài dạy AI (`/teacher/lesson-plans`)](#menu-511)
    - [5.12. Sổ nhập điểm (`/teacher/grades`)](#menu-512)
  - [Nhóm 05: TỔ CHUYÊN MÔN & TÀI KHOẢN](#nhom-t05-to-chuyen-mon)
    - [5.13. Duyệt giáo án Tổ CM (`/teacher/subject-head`)](#menu-513)
    - [5.14. Hồ sơ giáo viên (`/teacher/profile`)](#menu-514)

- [PHẦN III: PHÂN HỆ CÁN BỘ SỞ & PHÒNG GD&ĐT (DEPARTMENT & WARD)](#phan-iii-department)
  - [6.1. Bảng điều khiển Sở (`/department/dashboard`)](#menu-61)
  - [6.2. Phòng GD&ĐT trực thuộc (`/department/wards`)](#menu-62)
  - [6.3. Trường THPT trực thuộc (`/department/thpt-schools`)](#menu-63)
  - [6.4. Báo cáo tổng hợp ngành (`/department/reports`)](#menu-64)
  - [6.5. Điều hành Phòng GD&ĐT Quận/Huyện (`/ward/dashboard` & `/ward/schools`)](#menu-65)

- [PHẦN IV: PHÂN HỆ HỌC SINH & PHỤ HUYNH (STUDENT & PARENT)](#phan-iv-student)
  - [7.1. Góc học tập (`/student/dashboard`)](#menu-71)
  - [7.2. Bảng điểm chi tiết (`/student/grades`)](#menu-72)
  - [7.3. Học bạ điện tử (`/student/transcript`)](#menu-73)
  - [7.4. Thời khóa biểu tuần (`/student/schedule`)](#menu-74)
  - [7.5. Nhật ký chuyên cần (`/student/attendance`)](#menu-75)
  - [7.6. Thông tin cá nhân (`/student/profile`)](#menu-76)

---

<a name="phan-i-admin"></a>
# PHẦN I: PHÂN HỆ BAN GIÁM HIỆU & QUẢN TRỊ VIÊN

<a name="nhom-01-dieu-hanh-bgh"></a>
## NHÓM 01: ĐIỀU HÀNH NHÀ TRƯỜNG & THỜI GIAN THỰC

---

<a name="menu-11"></a>
### 1.1. BẢNG ĐIỀU KHIỂN QUẢN TRỊ
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Bảng điều khiển`
* **URL**: `/admin/dashboard`

#### 1. Vị trí & Mục đích nghiệp vụ
Là trung tâm chỉ huy thời gian thực (Real-time Operations Center) của Hiệu trưởng và Ban Giám Hiệu. Cung cấp dữ liệu tức thời về tỷ lệ chuyên cần, tiến độ dạy học trong ngày, cảnh báo an toàn học đường và các hồ sơ cần phê duyệt khẩn cấp.

#### 2. Chi tiết Giao diện & Nút bấm
* **Thẻ KPI 1 (Sĩ số & Hiện diện)**: Hiển thị tổng số học sinh toàn trường, số học sinh có mặt hôm nay và tỷ lệ % có mặt.
* **Thẻ KPI 2 (Tiến độ Giảng dạy)**: Tổng số tiết học theo TKB hôm nay, số tiết giáo viên đã ký sổ đầu bài.
* **Thẻ KPI 3 (Hồ sơ Chờ duyệt)**: Số kế hoạch bài dạy và đơn xin nghỉ phép đang chờ BGH phê duyệt.
* **Thẻ KPI 4 (Cảnh báo Nguy cơ)**: Số học sinh nằm trong diện cảnh báo đỏ từ AI Early Warnings.
* **Nút bấm `[🔄 Làm mới]`**: Cập nhật lại số liệu tức thời.
* **Bộ lọc Thời gian**: Menu thả xuống chọn `Hôm nay`, `Tuần này`, `Tháng này`.

#### 3. Quy trình Thao tác Chuẩn
1. Đăng nhập hệ thống bằng tài khoản BGH $\rightarrow$ Hệ thống tự động chuyển vào `/admin/dashboard`.
2. Kiểm tra chỉ số chuyên cần đầu ngày tại Thẻ KPI 1.
3. Nếu có cảnh báo đỏ $\rightarrow$ Nhấp trực tiếp vào thẻ cảnh báo để xem chi tiết học sinh cần can thiệp.
4. Kiểm tra danh sách giáo viên chưa ký sổ đầu bài ở bảng bên dưới và nhấp `[Nhắc nhở tự động]`.

#### 4. Tình huống Thực tế & Xử lý
* **Sự cố**: Tỷ lệ chuyên cần hiển thị thấp bất thường.
* **Cách xử lý**: Nhấp vào biểu đồ cột để lọc theo Khối/Lớp $\rightarrow$ Xác định lớp chưa hoàn thành điểm danh $\rightarrow$ Gửi thông báo đôn đốc Giáo viên chủ nhiệm.

#### 5. Quyền hạn Phân cấp
* **Xem**: Hiệu trưởng, Phó Hiệu trưởng, Thư ký Hội đồng.
* **Sửa/Cấu hình chỉ số**: Quản trị viên hệ thống (Super Admin).

---

<a name="menu-12"></a>
### 1.2. ĐIỂM THI OLS & PHÂN TÍCH KHẢO THÍ
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Điểm thi OLS` (Badge: *Mới / OLS*)
* **URL**: `/admin/exam-analytics`

#### 1. Vị trí & Mục đích nghiệp vụ
Phân tích kết quả các kỳ thi khảo sát chất lượng, thi giữa kỳ, cuối kỳ theo phương pháp thống kê OLS (Ordinary Least Squares) và biểu đồ phổ điểm hình chuông chuẩn Bộ GD&ĐT.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bộ chọn Kỳ thi & Môn học**: Dropdown chọn Kỳ thi (VD: *Khảo sát HK1*) và Môn thi (VD: *Toán, Ngữ Văn, Tiếng Anh*).
* **Biểu đồ Phổ điểm Hình chuông**: Trục hoành thang điểm 0 - 10, trục tung số lượng bài thi.
* **Bảng So sánh Liên lớp**: Cột Tên lớp, Sĩ số dự thi, Điểm Trung bình, Tỷ lệ Giỏi/Khá/Đạt/Chưa đạt.
* **Nút `[📥 Xuất Báo Cáo EMIS]`**: Tải file Excel chuẩn nộp Sở GD&ĐT.

#### 3. Quy trình Thao tác Chuẩn
1. Chọn Kỳ thi cần phân tích từ menu thả xuống.
2. Chọn Khối và Môn học $\rightarrow$ Hệ thống tự động vẽ phổ điểm.
3. Đối chiếu độ lệch chuẩn: Nếu phổ điểm lệch trái (nhiều điểm dưới 5.0) $\rightarrow$ Xem đề xuất can thiệp của tổ chuyên môn.
4. Nhấp `[📥 Xuất Báo Cáo EMIS]` để lưu trữ biên bản khảo thí.

#### 4. Tình huống Thực tế & Xử lý
* **Sự cố**: Xuất hiện điểm số ngoài thang điểm (VD: 11 điểm hoặc điểm âm do nhập lỗi).
* **Cách xử lý**: Hệ thống tự động bôi đỏ dòng lỗi $\rightarrow$ Bấm nút `[Yêu cầu Tổ bộ môn sửa điểm]` để mở khóa chỉnh sửa cho giáo viên chấm thi.

#### 5. Quyền hạn Phân cấp
* **Hiệu trưởng / Phó HT Chuyên môn**: Xem toàn trường, duyệt kết quả.
* **Tổ trưởng**: Xem phổ điểm môn của tổ mình.

---

<a name="menu-13"></a>
### 1.3. RADAR CẢNH BÁO SỚM AI (EARLY WARNINGS)
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Radar cảnh báo`
* **URL**: `/admin/early-warnings`

#### 1. Vị trí & Mục đích nghiệp vụ
Hệ thống AI tự động quét chuỗi dữ liệu đa chiều (chuyên cần, điểm thường xuyên, hành vi lớp học) để cảnh báo sớm học sinh có nguy cơ sa sút học lực hoặc bỏ học từ 2-4 tuần trước kỳ thi.

#### 2. Chi tiết Giao diện & Nút bấm
* **Thanh phân loại Mức độ Cảnh báo**:
  - 🔴 **Cấp độ Đỏ**: Nguy cơ cao (Điểm giảm >2.5đ hoặc vắng không phép $\ge 3$ buổi).
  - 🟡 **Cấp độ Vàng**: Nguy cơ trung bình.
  - 🟢 **Cấp độ Xanh**: Theo dõi tiến bộ.
* **Thẻ Hồ sơ Học sinh Nguy cơ**: Hiển thị Họ tên, Lớp, Biểu đồ sa sút, và Khuyến nghị can thiệp thông minh.
* **Nút `[Phân Công GVCN Xử Lý]`**: Giao việc can thiệp cho giáo viên chủ nhiệm.
* **Nút `[Lên Lịch Tư Vấn Tâm Lý]`**: Đặt lịch hẹn với phòng tư vấn học đường.

#### 3. Quy trình Thao tác Chuẩn
1. Mở màn hình `/admin/early-warnings`.
2. Lọc danh sách học sinh theo Cấp độ Đỏ.
3. Nhấp vào học sinh cần xử lý để xem báo cáo phân tích nguyên nhân từ AI.
4. Nhấp `[Phân Công GVCN Xử Lý]` $\rightarrow$ Nhập ghi chú chỉ đạo $\rightarrow$ Bấm `[Gửi Lệnh Can Thiệp]`.

#### 4. Tình huống Thực tế & Xử lý
* **Sự cố**: Học sinh đã cải thiện điểm số nhưng AI vẫn báo cảnh báo vàng.
* **Cách xử lý**: Nhấp vào nút `[Cập nhật Dữ liệu Mới]` hoặc nhấp `[Đánh dấu Đã hoàn thành can thiệp]`.

#### 5. Quyền hạn Phân cấp
* **Ban Giám Hiệu & Cán bộ Tư vấn**: Toàn quyền xem và chỉ đạo.
* **Giáo viên Chủ nhiệm**: Tiếp nhận và báo cáo kết quả can thiệp của lớp mình.

---

<a name="menu-14"></a>
### 1.4. BÁO CÁO NGÀY TOÀN TRƯỜNG
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Báo cáo ngày`
* **URL**: `/admin/daily-reports`

#### 1. Vị trí & Mục đích nghiệp vụ
Tổng hợp toàn bộ diễn biến trong ngày: nề nếp, chuyên cần, số tiết dạy, sự cố phát sinh, và các đề xuất từ giáo viên chủ nhiệm các lớp.

#### 2. Chi tiết Giao diện & Nút bấm
* **Lịch chọn Ngày**: Chọn ngày trong tuần để xem lịch sử.
* **Bảng Tổng hợp Khối**: Thống kê số lớp đã nộp báo cáo, số lớp chưa nộp.
* **Nút `[✅ Phê Duyệt Báo Cáo Ngày]`**: BGH xác nhận hoàn thành công tác ngày.
* **Nút `[In Sổ Nhật Ký Trường]`**: Xuất bản in lưu trữ hồ sơ hành chính.

#### 3. Quy trình Thao tác Chuẩn
1. Chọn ngày cần duyệt (mặc định là ngày hôm nay).
2. Kiểm tra danh sách các lớp đã gửi báo cáo tổng kết.
3. Đọc phần ghi chú sự cố (nếu có) $\rightarrow$ Nhập chỉ đạo xử lý của BGH.
4. Bấm `[✅ Phê Duyệt Báo Cáo Ngày]`.

---

<a name="menu-15"></a>
### 1.5. ĐÁNH GIÁ GIÁO VIÊN CHUẨN THÔNG TƯ 15/2020/TT-BGDĐT
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Đánh giá TT 15` (Badge: *TT 15*)
* **URL**: `/admin/tt15-evaluation`

#### 1. Vị trí & Mục đích nghiệp vụ
Số hóa quy trình đánh giá chuẩn nghề nghiệp giáo viên theo 5 Tiêu chuẩn và 15 Tiêu chí quy định tại Thông tư 15/2020/TT-BGDĐT. Tự động áp dụng thuật toán phân loại Xuất sắc, Khá, Đạt, Chưa đạt.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bảng Danh sách Giáo viên**: Cột Mã GV, Họ tên, Tổ chuyên môn, Điểm tự đánh giá, Điểm Tổ đánh giá, Điểm BGH đánh giá, Xếp loại.
* **Nút `[+ Tạo Phiếu Đánh Giá]` / `[Chấm Điểm]`**: Mở form chấm 15 tiêu chí.
* **Các nút mức điểm**: `Tốt (3đ)`, `Khá (2đ)`, `Đạt (1đ)`, `Chưa đạt (0đ)`.
* **Nút `[📎 Xem Minh Chứng]`**: Mở file chứng chỉ, bằng khen giáo viên đã tải lên.
* **Nút `[Xuất Biên Bản TT15 PDF]`**: Tải biên bản mẫu số 01/TT15.

#### 3. Quy trình Thao tác Chuẩn
1. Nhấp `[Chấm Điểm]` tại dòng tên giáo viên cần đánh giá.
2. Kiểm tra minh chứng đính kèm bằng nút `[📎 Xem Minh Chứng]`.
3. Nhấp chọn mức điểm cho từng tiêu chí từ Tiêu chí 1 đến Tiêu chí 15.
4. Hệ thống tự động tính điểm và hiển thị kết quả xếp loại $\rightarrow$ Nhập nhận xét của Thủ trưởng đơn vị $\rightarrow$ Nhấp `[Lưu & Phê Duyệt Kết Quả]`.
5. Nhấp `[Xuất Biên Bản TT15 PDF]` để in và ký đóng dấu.

#### 4. Tình huống Thực tế & Xử lý
* **Sự cố**: Giáo viên có tổng điểm cao nhưng hệ thống không xếp loại Xuất sắc.
* **Nguyên nhân**: Vi phạm quy tắc Thông tư 15 (Tiêu chuẩn 2 hoặc 3 có tiêu chí đạt mức Khá hoặc Đạt, không đủ 10 tiêu chí Tốt).
* **Cách xử lý**: Hệ thống hiển thị ghi chú giải thích rõ tiêu chí nào chưa đạt để BGH giải trình minh bạch cho giáo viên.

---

<a name="menu-16"></a>
### 1.6. TRỢ LÝ BGH AI (PRINCIPAL AI ASSISTANT)
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Trợ lý BGH AI`
* **URL**: `/admin/principal-ai`

#### 1. Vị trí & Mục đích nghiệp vụ
Trợ lý AI chuyên trách hỗ trợ Hiệu trưởng soạn thảo văn bản chỉ đạo, dự thảo diễn văn khai giảng/bế giảng, tra cứu nhanh văn bản quy phạm pháp luật giáo dục và phân tích dữ liệu chuyên sâu bằng ngôn ngữ tự nhiên.

#### 2. Chi tiết Giao diện & Nút bấm
* **Khung Chat Tương tác**: Nhập câu hỏi hoặc yêu cầu (VD: *"Soạn kế hoạch kiểm tra chuyên đề đổi mới phương pháp dạy học theo Chương trình GDPT 2018"*).
* **Nút Gợi ý Lệnh Nhanh**: `[Dự thảo Kế hoạch Tuần]`, `[Phân tích Chất lượng Thi Khảo Sát]`, `[Tra cứu Thông tư 22/TT15]`.
* **Nút `[📋 Sao chép Văn Bản]`**: Copy văn bản hoàn chỉnh vào Word.

#### 3. Quy trình Thao tác Chuẩn
1. Nhập nội dung câu hỏi hoặc chọn một mẫu lệnh có sẵn.
2. AI phản hồi văn bản chuẩn thể thức hành chính giáo dục trong 3 giây.
3. Nhấp `[📋 Sao chép Văn Bản]` để dán vào hồ sơ nhà trường.

---

<a name="menu-17"></a>
### 1.7. CHIẾN LƯỢC & QUẢN TRỊ MỤC TIÊU KPI
* **Menu Sidebar**: `01. ĐIỀU HÀNH NHÀ TRƯỜNG` $\rightarrow$ `Chiến lược & KPI`
* **URL**: `/admin/strategy`

#### 1. Vị trí & Mục đích nghiệp vụ
Theo dõi tiến độ thực hiện các mục tiêu chiến lược phát triển nhà trường giai đoạn 5 năm: Tỷ lệ tốt nghiệp THPT, Tỷ lệ trúng tuyển đại học top đầu, Tỷ lệ giáo viên dạy giỏi cấp tỉnh, và Chỉ số chuyển đổi số trường học.

#### 2. Chi tiết Giao diện & Nút bấm
* **Vòng tròn Tiến độ Chiến lược**: Hiển thị % hoàn thành kế hoạch năm học.
* **Bảng Mục tiêu Thành phần**: Mục tiêu, Đơn vị phụ trách, Thời hạn, Chỉ số đo lường (KPI Target vs Actual).
* **Nút `[+ Thiết Lập Mục Tiêu Mới]`**: Bổ sung chỉ tiêu thi đua năm học mới.

---

<a name="nhom-02-day-hoc-chuyen-mon"></a>
## NHÓM 02: DẠY HỌC & CHUYÊN MÔN

---

<a name="menu-21"></a>
### 2.1. QUẢN LÝ & DUYỆT KẾ HOẠCH BÀI DẠY (GIÁO ÁN)
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Kế hoạch bài dạy`
* **URL**: `/admin/lesson-plans`

#### 1. Vị trí & Mục đích nghiệp vụ
Quản lý tập trung toàn bộ giáo án điện tử của giáo viên toàn trường. Kiểm tra việc tuân thủ cấu trúc bài dạy theo Công văn 5512/BGDĐT-GDTrH và ký duyệt số cấp trường.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bộ lọc Trạng thái**: `Tất cả`, `Chờ duyệt cấp BGH`, `Đã duyệt`, `Yêu cầu chỉnh sửa`.
* **Khung Xem trước Văn bản (Document Preview)**: Xem trực tiếp file Word/PDF không cần tải về máy.
* **Nút `[✅ Phê Duyệt Giáo Án]`**: Ký duyệt chấp thuận.
* **Nút `[⚠️ Yêu Cầu Chỉnh Sửa]`**: Gửi trả giáo viên kèm ý kiến nhận xét.
* **Nút `[Duyệt Nhanh Các Mục Đã Chọn]`**: Duyệt hàng loạt các bài dạy đã qua thẩm định của Tổ trưởng.

#### 3. Quy trình Thao tác Chuẩn
1. Lọc danh sách theo trạng thái `Chờ duyệt cấp BGH`.
2. Nhấp vào tên bài dạy để mở khung xem trước nội dung.
3. Nếu đạt yêu cầu $\rightarrow$ Nhấp `[✅ Phê Duyệt Giáo Án]`.
4. Nếu cần bổ sung $\rightarrow$ Nhập ghi chú vào ô phản hồi và bấm `[⚠️ Yêu Cầu Chỉnh Sửa]`.

---

<a name="menu-22"></a>
### 2.2. GIÁM SÁT SỔ ĐẦU BÀI TOÀN TRƯỜNG
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Sổ đầu bài`
* **URL**: `/admin/journals`

#### 1. Vị trí & Mục đích nghiệp vụ
Giám sát việc thực hiện nền nếp giảng dạy của tất cả các lớp: kiểm tra sĩ số, tên bài học, nhận xét tiết dạy và chữ ký số của giáo viên bộ môn theo thời gian thực.

#### 2. Chi tiết Giao diện & Nút bấm
* **Ma trận Tiết học**: Hiển thị toàn bộ các lớp (10A1, 10A2...) và các tiết học (Tiết 1 đến Tiết 5).
  - Màu xanh: Đã ký sổ đầy đủ.
  - Màu cam nhấp nháy: Tiết đã học xong nhưng chưa ký sổ.
  - Màu xám: Tiết chưa đến giờ dạy.
* **Nút `[🔔 Nhắc Nhở Ký Sổ Tự Động]`**: Gửi thông báo đến điện thoại của giáo viên chưa hoàn thành ký sổ.
* **Nút `[Xuất File Sổ Đầu Bài PDF]`**: In sổ lưu trữ theo tuần.

---

<a name="menu-23"></a>
### 2.3. QUẢN LÝ DANH MỤC LỚP HỌC
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Lớp học`
* **URL**: `/admin/classes`

#### 1. Vị trí & Mục đích nghiệp vụ
Khởi tạo và quản lý danh mục lớp học, phân ban (Khoa học Tự nhiên / Khoa học Xã hội), gán phòng học cố định và phân công Giáo viên Chủ nhiệm cho từng lớp.

#### 2. Chi tiết Giao diện & Nút bấm
* **Nút `[+ Thêm Lớp Học Mới]`**: Mở form tạo lớp (Tên lớp, Khối, Ban học, GVCN, Phòng học).
* **Bảng Danh sách Lớp**: Hiển thị Sĩ số học sinh, Tên GVCN, Phòng học và Tình trạng hoạt động.
* **Nút `[Sửa]` / `[Xóa]`**: Chỉnh sửa thông tin hoặc giải tán lớp học kết thúc khóa.

---

<a name="menu-24"></a>
### 2.4. QUẢN LÝ HỒ SƠ HỌC SINH
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Hồ sơ học sinh`
* **URL**: `/admin/students`

#### 1. Vị trí & Mục đích nghiệp vụ
Cơ sở dữ liệu học sinh toàn trường: lưu trữ mã định danh VNeID/Bộ GD&ĐT, họ tên, ngày sinh, giới tính, thông tin liên hệ phụ huynh, diện chính sách ưu tiên và trạng thái học tập (Đang học, Chuyển trường, Nghỉ học).

#### 2. Chi tiết Giao diện & Nút bấm
* **Thanh Tìm kiếm & Bộ lọc**: Tìm theo Tên, Mã học sinh, Khối, Lớp.
* **Nút `[📥 Nhập Từ Excel]`**: Tải danh sách hàng ngàn học sinh từ file Excel đầu năm.
* **Nút `[📤 Xuất Danh Sách Excel]`**: Xuất dữ liệu phục vụ báo cáo.
* **Nút `[+ Thêm Học Sinh]`**: Thêm lẻ 1 học sinh mới chuyển đến.

#### 3. Quy trình Nhập liệu Hàng loạt từ Excel
1. Nhấp `[📥 Nhập Từ Excel]` $\rightarrow$ Tải file mẫu chuẩn `Mau_Danh_Sach_Hoc_Sinh.xlsx`.
2. Điền thông tin học sinh vào file $\rightarrow$ Kéo thả file vào khung nạp dữ liệu.
3. Nhấp `[Kiểm Tra Dữ Liệu]` $\rightarrow$ Hệ thống quét lỗi trùng mã định danh.
4. Nhấp `[Xác Nhận Nạp]` $\rightarrow$ Hoàn tất khởi tạo danh sách và tài khoản cho học sinh.

---

<a name="menu-25"></a>
### 2.5. QUẢN LÝ THỜI KHÓA BIỂU
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Thời khóa biểu` (Badge: *AI*)
* **URL**: `/admin/schedule`

#### 1. Vị trí & Mục đích nghiệp vụ
Xếp và điều chỉnh thời khóa biểu tự động bằng thuật toán AI: chống trùng tiết giáo viên, tránh xếp môn khó vào tiết cuối, đảm bảo định mức số tiết dạy chuẩn/tuần.

#### 2. Chi tiết Giao diện & Nút bấm
* **Xem theo Chế độ**: `Xem theo Lớp`, `Xem theo Giáo Viên`, `Xem theo Phòng Học`.
* **Nút `[🤖 Tự Động Xếp TKB Bằng AI]`**: Chạy thuật toán xếp lịch tự động.
* **Nút `[Công Bố Thời Khóa Biểu]`**: Kích hoạt lịch học mới cho toàn trường.

---

<a name="menu-26"></a>
### 2.6. QUẢN LÝ TỔ BỘ MÔN
* **Menu Sidebar**: `02. DẠY HỌC & CHUYÊN MÔN` $\rightarrow$ `Tổ bộ môn`
* **URL**: `/admin/subject-groups`

#### 1. Vị trí & Mục đích nghiệp vụ
Quản lý cơ cấu tổ chức chuyên môn nhà trường (Tổ Toán - Tin, Tổ Ngữ Văn, Tổ KHTN, Tổ KHXH...), bổ nhiệm Tổ trưởng, Tổ phó và phân bổ giáo viên vào từng tổ.

---

<a name="menu-27"></a>
### 2.7. DANH MỤC TRƯỜNG HỌC (DÀNH CHO SUPER ADMIN)
* **Menu Sidebar**: `02. TRƯỜNG & CHUYÊN MÔN` $\rightarrow$ `Danh mục trường`
* **URL**: `/admin/schools`

#### 1. Vị trí & Mục đích nghiệp vụ
Dành riêng cho Quản trị viên cấp cao: quản lý danh sách tất cả các trường học trong hệ thống, cấu hình niên khóa, cấp học và kích hoạt bản quyền phần mềm cho từng trường.

---

<a name="nhom-03-nhan-su-nq37"></a>
## NHÓM 03: NHÂN SỰ & NGHỊ QUYẾT 37

---

<a name="menu-31"></a>
### 3.1. ĐỊNH MỨC NGHỊ QUYẾT 37/2025/NQ-CP
* **Menu Sidebar**: `03. NHÂN SỰ & NQ 37` $\rightarrow$ `Định mức NQ 37` (Badge: *NQ 37*)
* **URL**: `/admin/nq37-compliance`

#### 1. Vị trí & Mục đích nghiệp vụ
Kiểm soát việc thực hiện các chỉ tiêu định mức biên chế giáo viên/lớp, tỷ lệ thiết bị số trên lớp học và các chỉ tiêu chuyển đổi số theo Nghị quyết 37/2025/NQ-CP của Chính phủ.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bảng Chỉ số Tuân thủ NQ37**: Tỷ lệ giáo viên/lớp (Chuẩn THPT: 2.25 GV/lớp), Tỷ lệ máy tính/học sinh, Tỷ lệ bài giảng số.
* **Huy hiệu Trạng thái**: `Đạt Chuẩn (Xanh)`, `Cần Bổ Sung (Vàng)`, `Chưa Đạt (Đỏ)`.
* **Nút `[Xuất Báo Cáo Tuân Thủ NQ37]`**: Kết xuất hồ sơ giải trình gửi Phòng Kế hoạch Tài chính Sở GD&ĐT.

---

<a name="menu-32"></a>
### 3.2. QUẢN LÝ NHÂN SỰ 36T (HỢP ĐỒNG & NHÂN VIÊN)
* **Menu Sidebar**: `03. NHÂN SỰ & NQ 37` $\rightarrow$ `Nhân sự 36T`
* **URL**: `/admin/support-staff`

#### 1. Vị trí & Mục đích nghiệp vụ
Quản lý đội ngũ nhân sự hỗ trợ giáo dục theo Nghị định 111/2022/NĐ-CP và cơ chế 36T: Nhân viên y tế học đường, Kế toán, Thủ quỹ, Văn thư, Thư viện, Thiết bị thí nghiệm, Bảo vệ và Tạp vụ.

---

<a name="menu-33"></a>
### 3.3. QUẢN LÝ ĐỘI NGŨ GIÁO VIÊN
* **Menu Sidebar**: `03. NHÂN SỰ & NQ 37` $\rightarrow$ `Đội ngũ giáo viên`
* **URL**: `/admin/teachers`

#### 1. Vị trí & Mục đích nghiệp vụ
Hồ sơ cán bộ giáo viên toàn trường: Trình độ chuyên môn (Cử nhân, Thạc sĩ, Tiến sĩ), Hạng chức danh nghề nghiệp (Hạng I, II, III), Chứng chỉ bồi dưỡng tiêu chuẩn chức danh, Số tiết định mức giảng dạy/tuần và phân công kiêm nhiệm.

#### 2. Chi tiết Giao diện & Nút bấm
* **Nút `[+ Thêm Giáo Viên Mới]`**: Tạo hồ sơ và cấp tài khoản đăng nhập.
* **Nút `[📥 Nhập Danh Sách Từ Excel]`**: Nạp dữ liệu giáo viên đầu năm.
* **Nút `[Phân Công Giảng Dạy]`**: Gán lớp dạy và số tiết cho giáo viên.

---

<a name="menu-34"></a>
### 3.4. ĐIỀU PHỐI DẠY THAY KHẨN CẤP
* **Menu Sidebar**: `03. NHÂN SỰ & NQ 37` $\rightarrow$ `Dạy thay khẩn cấp`
* **URL**: `/admin/substitute-dispatch`

#### 1. Vị trí & Mục đích nghiệp vụ
Xử lý tự động việc điều phối giáo viên dạy thay khi có giáo viên báo vắng đột xuất (ốm đau, công tác). Hệ thống tự quét lịch trống của các giáo viên cùng bộ môn để đề xuất người thay thế trong 30 giây.

#### 2. Chi tiết Giao diện & Nút bấm
* **Nút `[+ Tiếp Nhận Báo Vắng]`**: Chọn giáo viên vắng, ngày vắng, tiết vắng.
* **Danh sách Đề xuất Giáo viên Dạy thay**: Hiển thị tên giáo viên cùng môn đang có giờ trống và số tiết đã dạy thay trong tháng (để đảm bảo phân bổ công bằng).
* **Nút `[Xác Nhận & Phát Lệnh Dạy Thay]`**: Gửi thông báo đến app của cả 2 giáo viên và cập nhật sổ đầu bài.

---

<a name="menu-35"></a>
### 3.5. CÁN BỘ BAN GIÁM HIỆU
* **Menu Sidebar**: `03. NHÂN SỰ & NQ 37` $\rightarrow$ `Cán bộ BGH`
* **URL**: `/admin/principals`

#### 1. Vị trí & Mục đích nghiệp vụ
Quản lý danh sách thành viên Ban Giám Hiệu (Hiệu trưởng, các Phó Hiệu trưởng), phân công mảng phụ trách (Chuyên môn, Cơ sở vật chất, Nề nếp học sinh) và quản lý chữ ký số BGH.

---

<a name="nhom-04-phe-duyet-quan-tri"></a>
## NHÓM 04: PHÊ DUYỆT & QUẢN TRỊ

---

<a name="menu-41"></a>
### 4.1. DUYỆT YÊU CẦU BAN GIÁM HIỆU
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Duyệt yêu cầu BGH`
* **URL**: `/admin/approvals`

#### 1. Vị trí & Mục đích nghiệp vụ
Trung tâm phê duyệt tập trung toàn bộ các yêu cầu phát sinh: Đơn xin nghỉ phép của giáo viên, Đề xuất mua sắm bổ sung thiết bị dạy học, Đề xuất mở khóa sửa điểm, Đơn xin chuyển lớp của học sinh.

#### 2. Chi tiết Giao diện & Nút bấm
* **Danh sách Thẻ Yêu cầu**: Loại yêu cầu, Người gửi, Thời gian gửi, Nội dung tóm tắt.
* **Nút `[✅ Chấp Thuận]`**: Phê duyệt yêu cầu.
* **Nút `[❌ Từ Chối]`**: Bác bỏ yêu cầu kèm lý do.

---

<a name="menu-42"></a>
### 4.2. KHÓA SỔ DỮ LIỆU ĐIỆN TỬ
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Khóa sổ dữ liệu`
* **URL**: `/admin/data-lock`

#### 1. Vị trí & Mục đích nghiệp vụ
Bảo đảm tính toàn vẹn và chống chỉnh sửa trái phép dữ liệu học vụ: Khóa sổ điểm kiểm tra giữa kỳ/cuối kỳ, Khóa sổ đầu bài sau 23h59 hằng ngày, Khóa sổ học bạ sau khi kết thúc niên khóa.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bảng Trạng thái Khóa**: Tên sổ sách, Học kỳ, Trạng thái (`Đang mở`, `Đã khóa`), Người khóa, Ngày khóa.
* **Nút `[🔒 Khóa Sổ Toàn Trường]`**: Khóa đóng băng dữ liệu.
* **Nút `[🔓 Mở Khóa Đặc Cách]`**: Cấp quyền chỉnh sửa tạm thời trong 24 giờ cho giáo viên (yêu cầu ghi rõ lý do mở khóa vào nhật ký kiểm toán).

---

<a name="menu-43"></a>
### 4.3. DUYỆT & KÝ SỐ HỌC BẠ ĐIỆN TỬ
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Duyệt học bạ`
* **URL**: `/admin/transcripts`

#### 1. Vị trí & Mục đích nghiệp vụ
Tổng hợp kết quả rèn luyện và học tập cả năm của học sinh, kiểm tra chữ ký số của tất cả giáo viên bộ môn và GVCN, tiến hành ký số xác nhận của Hiệu trưởng trên học bạ điện tử chuẩn Quốc gia.

#### 2. Chi tiết Giao diện & Nút bấm
* **Thanh Tiến độ Ký số**: Tỷ lệ % học bạ đã hoàn thành ký số của toàn trường.
* **Khung Xem Học Bạ PDF**: Xem trước bản thể hiện học bạ chuẩn mẫu Bộ GD&ĐT.
* **Nút `[✍️ Ký Số Hàng Loạt Bằng Token/SmartCA]`**: Ký số hàng trăm học bạ trong 1 lần xác thực.

---

<a name="menu-44"></a>
### 4.4. CƠ SỞ PHÂN HIỆU & ĐIỂM TRƯỜNG LẺ
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Cơ sở phân hiệu`
* **URL**: `/admin/multi-school`

#### 1. Vị trí & Mục đích nghiệp vụ
Quản lý các trường có nhiều điểm trường, cơ sở 1, cơ sở 2 hoặc phân hiệu vùng cao. Giúp theo dõi độc lập cơ sở vật chất và nề nếp từng điểm trường trên cùng một hệ thống quản trị.

---

<a name="menu-45"></a>
### 4.5. THÔNG BÁO TRƯỜNG & HỘP THƯ HỆ THỐNG
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Thông báo trường`
* **URL**: `/admin/notifications`

#### 1. Vị trí & Mục đích nghiệp vụ
Phát thông báo chính thức từ BGH đến các nhóm đối tượng: Toàn bộ Hội đồng sư phạm, Toàn bộ Phụ huynh, hoặc Nhóm Giáo viên Chủ nhiệm qua tin nhắn đẩy trên ứng dụng.

---

<a name="menu-46"></a>
### 4.6. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOG)
* **Menu Sidebar**: `04. PHÊ DUYỆT & QUẢN TRỊ` $\rightarrow$ `Nhật ký kiểm toán`
* **URL**: `/admin/audit-log`

#### 1. Vị trí & Mục đích nghiệp vụ
Ghi nhận nhật ký bất biến (Immutable Audit Trail) toàn bộ các thao tác nhạy cảm: Ai sửa điểm học sinh nào, lúc mấy giờ, từ điểm bao nhiêu thành bao nhiêu, sử dụng địa chỉ IP nào. Đảm bảo tính minh bạch và phục vụ công tác thanh tra giáo dục.

---

<a name="phan-ii-teacher"></a>
# PHẦN II: PHÂN HỆ GIÁO VIÊN & TỔ CHUYÊN MÔN

<a name="nhom-t01-dieu-hanh"></a>
## NHÓM 01: ĐIỀU HÀNH GIẢNG DẠY

---

<a name="menu-51"></a>
### 5.1. BẢNG ĐIỀU KHIỂN 360° GIÁO VIÊN
* **Menu Sidebar**: `01. ĐIỀU HÀNH GIẢNG DẠY` $\rightarrow$ `Bảng điều khiển 360°`
* **URL**: `/teacher/dashboard`

#### 1. Vị trí & Mục đích nghiệp vụ
Trang chủ cá nhân của giáo viên: tổng hợp danh sách các tiết dạy hôm nay, phòng học tương ứng, thông báo khẩn từ BGH, tình trạng nộp giáo án tuần và danh sách công việc cần xử lý.

#### 2. Chi tiết Giao diện & Nút bấm
* **Thẻ Lịch dạy Hôm nay**: Hiển thị Tiết 1 $\rightarrow$ Tiết 5, Lớp, Phòng học, Nút `[Vào Tiết Dạy]`.
* **Thẻ Trạng thái Kế hoạch bài dạy**: Báo xanh `Đã duyệt tuần 12` hoặc báo vàng `Cần nộp tuần 13`.
* **Thẻ Nhắc việc**: Số tiết chưa ký sổ đầu bài, số cột điểm kiểm tra còn thiếu theo tiến độ.

---

<a name="menu-52"></a>
### 5.2. THỜI KHÓA BIỂU TUẦN CỦA GIÁO VIÊN
* **Menu Sidebar**: `01. ĐIỀU HÀNH GIẢNG DẠY` $\rightarrow$ `Thời khóa biểu tuần`
* **URL**: `/teacher/schedule`

#### 1. Vị trí & Mục đích nghiệp vụ
Xem ma trận lịch dạy cá nhân cả tuần từ Thứ Hai đến Thứ Bảy, bao gồm các tiết dạy chính khóa, tiết dạy thay được phân công và lịch sinh hoạt tổ chuyên môn.

---

<a name="nhom-t02-quan-ly-hoc-sinh"></a>
## NHÓM 02: QUẢN LÝ HỌC SINH

---

<a name="menu-53"></a>
### 5.3. DANH SÁCH HỌC SINH CÁC LỚP GIẢNG DẠY
* **Menu Sidebar**: `02. QUẢN LÝ HỌC SINH` $\rightarrow$ `Danh sách học sinh` (Badge: *Mới*)
* **URL**: `/teacher/students`

#### 1. Vị trí & Mục đích nghiệp vụ
Tra cứu danh sách học sinh của tất cả các lớp mà giáo viên được phân công giảng dạy hoặc chủ nhiệm. Xem ảnh thẻ, thông tin liên lạc và tình hình học lực của từng em.

---

<a name="menu-54"></a>
### 5.4. SƠ ĐỒ CHỖ NGỒI LỚP HỌC CINEMA SEATING
* **Menu Sidebar**: `02. QUẢN LÝ HỌC SINH` $\rightarrow$ `Sơ đồ chỗ ngồi lớp` (Badge: *Trực quan*)
* **URL**: `/teacher/seating-cinema`

#### 1. Vị trí & Mục đích nghiệp vụ
Tính năng mô phỏng 3D rạp chiếu phim (Cinema Seating) độc quyền: quản lý sơ đồ vị trí bàn ghế của lớp học, đánh dấu học sinh cận thị cần ngồi bàn đầu, học sinh có biểu hiện mất tập trung, và đổi chỗ ngồi bằng thao tác kéo thả.

#### 2. Chi tiết Giao diện & Nút bấm
* **Ma trận Ghế ngồi**: Các dãy bàn hướng về bục giảng. Ghế có avatar, tên học sinh và các biểu tượng:
  - 👓: Học sinh cận thị / Tật khúc xạ.
  - ⭐: Học sinh đạt điểm tốt trong tuần.
  - 🔴: Học sinh cần chú ý nhắc nhở nề nếp.
* **Nút `[🤖 AI Sắp Xếp Chỗ Ngồi Tối Ưu]`**: Tự động xếp học sinh thấp bé ngồi trước, phân bổ học sinh khá kèm học sinh yếu.
* **Nút `[Lưu Sơ Đồ Chỗ Ngồi]`**: Cập nhật sơ đồ cho toàn thể giáo viên bộ môn cùng lớp theo dõi.

#### 3. Quy trình Thao tác Chuẩn
1. Chọn Lớp cần xếp chỗ ngồi (VD: *Lớp 10A1*).
2. Kéo thả ghế của học sinh từ vị trí này sang vị trí khác để hoán đổi.
3. Nhấp vào ghế để gắn nhãn (Cận thị, Cần hỗ trợ).
4. Nhấp `[Lưu Sơ Đồ Chỗ Ngồi]`.

---

<a name="menu-55"></a>
### 5.5. CỘNG ĐIỂM RÈN LUYỆN & KHEN THƯỞNG
* **Menu Sidebar**: `02. QUẢN LÝ HỌC SINH` $\rightarrow$ `Cộng điểm rèn luyện`
* **URL**: `/teacher/commendations`

#### 1. Vị trí & Mục đích nghiệp vụ
Trao huy hiệu thi đua và cộng điểm rèn luyện trực tiếp trong giờ học: Khen ngợi học sinh hăng hái phát biểu, hoàn thành xuất sắc bài tập nhóm, hoặc có tinh thần tương thân tương ái.

#### 2. Chi tiết Giao diện & Nút bấm
* **Bộ Huy Hiệu Sinh Động**: *Ngôi Sao Chăm Chỉ*, *Kiện Tướng Phát Biểu*, *Đôi Bạn Cùng Tiến*, *Gương Sáng Việc Tốt*.
* **Nút `[Trao Thưởng & Báo Phụ Huynh]`**: Gửi thông báo chúc mừng về ứng dụng của phụ huynh học sinh.

---

<a name="nhom-t03-chu-nhiem"></a>
## NHÓM 03: LỚP CHỦ NHIỆM

---

<a name="menu-56"></a>
### 5.6. SỔ CHỦ NHIỆM ĐIỆN TỬ
* **Menu Sidebar**: `03. LỚP CHỦ NHIỆM` $\rightarrow$ `Sổ chủ nhiệm`
* **URL**: `/teacher/homeroom`

#### 1. Vị trí & Mục đích nghiệp vụ
Dành riêng cho Giáo viên Chủ nhiệm: Quản lý Ban cán sự lớp, phân chia tổ thi đua, ghi nhật ký theo dõi nề nếp tuần, biên bản họp phụ huynh và kế hoạch hoạt động trải nghiệm hướng nghiệp.

---

<a name="menu-57"></a>
### 5.7. ĐIỂM DANH SĨ SỐ & BÁO CÁO CHUYÊN CẦN
* **Menu Sidebar**: `03. LỚP CHỦ NHIỆM` $\rightarrow$ `Điểm danh sĩ số`
* **URL**: `/teacher/attendance`

#### 1. Vị trí & Mục đích nghiệp vụ
Điểm danh sĩ số lớp học hằng ngày trong 15 giây: Mặc định tất cả có mặt, GVCN chỉ cần chạm vào học sinh vắng để chọn lý do (Nghỉ ốm, Có phép, Không phép, Đi muộn). Tự động kích hoạt SMS thông báo cho phụ huynh khi vắng không phép.

---

<a name="menu-58"></a>
### 5.8. HỌC BẠ ĐIỆN TỬ LỚP CHỦ NHIỆM
* **Menu Sidebar**: `03. LỚP CHỦ NHIỆM` $\rightarrow$ `Học bạ điện tử`
* **URL**: `/teacher/transcript`

#### 1. Vị trí & Mục đích nghiệp vụ
GVCN kiểm tra bảng tổng kết điểm tất cả các môn học của lớp, nhập nhận xét phẩm chất, năng lực và kết quả rèn luyện cả năm, sau đó ký số nộp lên Ban Giám Hiệu.

---

<a name="menu-59"></a>
### 5.9. BÁO CÁO NGÀY GỬI BAN GIÁM HIỆU
* **Menu Sidebar**: `03. LỚP CHỦ NHIỆM` $\rightarrow$ `Báo cáo ngày BGH`
* **URL**: `/teacher/daily-report`

#### 1. Vị trí & Mục đích nghiệp vụ
Gửi báo cáo tổng kết tình hình lớp trong ngày (sĩ số, học sinh nghỉ học, sự cố đột xuất) về cho Ban Giám Hiệu trước 16h30 hằng ngày.

---

<a name="nhom-t04-bo-mon"></a>
## NHÓM 04: GIẢNG DẠY BỘ MÔN

---

<a name="menu-510"></a>
### 5.10. SỔ ĐẦU BÀI ĐIỆN TỬ TIẾT DẠY
* **Menu Sidebar**: `04. GIẢNG DẠY BỘ MÔN` $\rightarrow$ `Sổ đầu bài điện tử`
* **URL**: `/teacher/journal`

#### 1. Vị trí & Mục đích nghiệp vụ
Ghi sổ đầu bài ngay khi kết thúc tiết dạy: Tên bài dạy (tự động gợi ý theo phân phối chương trình), sĩ số hiện diện, nhận xét giờ học và xếp loại tiết dạy (Tốt, Khá, TB).

#### 2. Quy trình Thao tác 30 Giây
1. Mở màn hình `/teacher/journal` $\rightarrow$ Chọn Tiết dạy vừa kết thúc.
2. Kiểm tra tên bài học và sĩ số.
3. Nhập tóm tắt nhận xét (hoặc bấm Micro `🎙️` để nói nhận xét).
4. Chọn xếp loại tiết học $\rightarrow$ Nhấp `[✍️ Ký Tên & Lưu Sổ Đầu Bài]`.

---

<a name="menu-511"></a>
### 5.11. SOẠN & NỘP GIÁO ÁN ĐIỆN TỬ (BÀI DẠY AI)
* **Menu Sidebar**: `04. GIẢNG DẠY BỘ MÔN` $\rightarrow$ `Giáo án & Bài dạy AI`
* **URL**: `/teacher/lesson-plans`

#### 1. Vị trí & Mục đích nghiệp vụ
Nộp kế hoạch bài dạy trước mỗi tuần học theo Công văn 5512. Tích hợp công cụ AI gợi ý mục tiêu phẩm chất, năng lực và thiết kế phiếu học tập sáng tạo.

#### 2. Quy trình Nộp Giáo án
1. Nhấp `[+ Nộp Giáo Án Mới]`.
2. Chọn Môn, Lớp, Tuần thực hiện $\rightarrow$ Kéo thả file `.docx` hoặc `.pdf` giáo án vào.
3. Bấm `[Gửi Phê Duyệt Cho Tổ Trưởng]`.

---

<a name="menu-512"></a>
### 5.12. SỔ NHẬP ĐIỂM BỘ MÔN (THÔNG TƯ 22)
* **Menu Sidebar**: `04. GIẢNG DẠY BỘ MÔN` $\rightarrow$ `Sổ nhập điểm`
* **URL**: `/teacher/grades`

#### 1. Vị trí & Mục đích nghiệp vụ
Nhập điểm đánh giá thường xuyên (ĐĐGtx), giữa kỳ (ĐĐGgk) và cuối kỳ (ĐĐGck). Hệ thống tự động tính điểm trung bình môn học theo công thức Thông tư 22/2021/TT-BGDĐT.

#### 2. Phím tắt Nhập Nhanh
* Nhấn `Tab` để sang cột điểm kế tiếp.
* Nhấn `Enter` hoặc $\downarrow$ để nhảy xuống học sinh tiếp theo.
* Nhấp `[📥 Nhập Từ Excel]` nếu muốn tải file điểm đã chấm trên máy.

---

<a name="nhom-t05-to-chuyen-mon"></a>
## NHÓM 05: TỔ CHUYÊN MÔN & TÀI KHOẢN

---

<a name="menu-513"></a>
### 5.13. DUYỆT GIÁO ÁN TỔ CHUYÊN MÔN (DÀNH CHO TỔ TRƯỞNG)
* **Menu Sidebar**: `05. TỔ CHUYÊN MÔN` $\rightarrow$ `Duyệt giáo án Tổ CM` (Badge: *Cần duyệt*)
* **URL**: `/teacher/subject-head`

#### 1. Vị trí & Mục đích nghiệp vụ
Dành riêng cho Tổ trưởng chuyên môn: theo dõi tiến độ nộp giáo án của các tổ viên, thẩm định chuyên môn bài dạy, ghi nhận xét góp ý và phê duyệt cấp Tổ trước khi chuyển lên BGH.

---

<a name="menu-514"></a>
### 5.14. HỒ SƠ GIÁO VIÊN & PHÂN CÔNG
* **Menu Sidebar**: `06. HỒ SƠ CÁ NHÂN` $\rightarrow$ `Hồ sơ giáo viên`
* **URL**: `/teacher/profile`

#### 1. Vị trí & Mục đích nghiệp vụ
Xem và cập nhật thông tin cá nhân giáo viên, chứng chỉ bồi dưỡng thường xuyên, bảng theo dõi số tiết thừa giờ trong kỳ và đổi mật khẩu bảo mật tài khoản.

---

<a name="phan-iii-department"></a>
# PHẦN III: PHÂN HỆ CÁN BỘ SỞ & PHÒNG GD&ĐT

---

<a name="menu-61"></a>
### 6.1. BẢNG ĐIỀU KHIỂN SỞ GD&ĐT
* **Menu Sidebar**: `01. ĐIỀU HÀNH SỞ GD&ĐT` $\rightarrow$ `Bảng điều khiển Sở`
* **URL**: `/department/dashboard`
* **Mục đích**: Tổng hợp số liệu toàn ngành GD&ĐT cấp Tỉnh/Thành phố: Quy mô học sinh, giáo viên, tỷ lệ chuyên cần hôm nay, và bản đồ số mạng lưới trường học trực thuộc.

---

<a name="menu-62"></a>
### 6.2. QUẢN LÝ CÁC PHÒNG GD&ĐT QUẬN/HUYỆN
* **Menu Sidebar**: `02. QUẢN LÝ ĐƠN VỊ` $\rightarrow$ `Phòng GD&ĐT trực thuộc`
* **URL**: `/department/wards`
* **Mục đích**: Quản lý tuyến hành chính Phòng Giáo dục các Quận/Huyện/Thị xã, theo dõi số lượng trường MN, TH, THCS trên từng địa bàn.

---

<a name="menu-63"></a>
### 6.3. QUẢN LÝ HỆ THỐNG TRƯỜNG THPT
* **Menu Sidebar**: `02. QUẢN LÝ ĐƠN VỊ` $\rightarrow$ `Trường THPT trực thuộc`
* **URL**: `/department/thpt-schools`
* **Mục đích**: Giám sát trực tiếp dữ liệu học vụ của các trường THPT, THPT Chuyên và Trung tâm GDTX trực thuộc Sở.

---

<a name="menu-64"></a>
### 6.4. BÁO CÁO TỔNG HỢP TOÀN NGÀNH
* **Menu Sidebar**: `03. BÁO CÁO & THỐNG KÊ` $\rightarrow$ `Báo cáo tổng hợp ngành`
* **URL**: `/department/reports`
* **Mục đích**: Tự động tổng hợp báo cáo định kỳ EMIS, thống kê chất lượng khảo thí toàn tỉnh, và kết xuất file đồng bộ lên Cổng dữ liệu quốc gia của Bộ GD&ĐT.

---

<a name="menu-65"></a>
### 6.5. ĐIỀU HÀNH PHÒNG GD&ĐT QUẬN/HUYỆN
* **Menu Sidebar**: `01. ĐIỀU HÀNH PHÒNG GD&ĐT` $\rightarrow$ `Bảng điều khiển` / `Trường MN, TH & THCS`
* **URL**: `/ward/dashboard` & `/ward/schools`
* **Mục đích**: Không gian làm việc của Lãnh đạo Phòng GD&ĐT: quản lý các trường Mầm non, Tiểu học và Trung học cơ sở trên địa bàn quản lý.

---

<a name="phan-iv-student"></a>
# PHẦN IV: PHÂN HỆ HỌC SINH & PHỤ HUYNH

---

<a name="menu-71"></a>
### 7.1. GÓC HỌC TẬP CÁ NHÂN
* **Menu Sidebar**: `01. HỌC TẬP & KẾT QUẢ` $\rightarrow$ `Góc học tập`
* **URL**: `/student/dashboard`
* **Mục đích**: Bảng tin hằng ngày cho học sinh: xem lịch học hôm nay, nhiệm vụ bài tập về nhà, thông báo từ nhà trường và các huy hiệu khen thưởng đã đạt được.

---

<a name="menu-72"></a>
### 7.2. BẢNG ĐIỂM CHI TIẾT CÁC MÔN HỌC
* **Menu Sidebar**: `01. HỌC TẬP & KẾT QUẢ` $\rightarrow$ `Bảng điểm chi tiết`
* **URL**: `/student/grades`
* **Mục đích**: Tra cứu điểm kiểm tra thường xuyên, giữa kỳ, cuối kỳ của từng môn học; xem biểu đồ phân tích năng lực và xu hướng tiến bộ học tập.

---

<a name="menu-73"></a>
### 7.3. HỌC BẠ ĐIỆN TỬ HỌC SINH
* **Menu Sidebar**: `01. HỌC TẬP & KẾT QUẢ` $\rightarrow$ `Học bạ điện tử`
* **URL**: `/student/transcript`
* **Mục đích**: Xem bản học bạ số hóa chính thức có chữ ký số của Ban Giám Hiệu và Giáo viên chủ nhiệm qua các năm học.

---

<a name="menu-74"></a>
### 7.4. THỜI KHÓA BIỂU TUẦN HỌC SINH
* **Menu Sidebar**: `02. LỊCH TRÌNH & CHUYÊN CẦN` $\rightarrow$ `Thời khóa biểu tuần`
* **URL**: `/student/schedule`
* **Mục đích**: Tra cứu lịch học, phòng học và giáo viên phụ trách từng tiết trong tuần để chủ động chuẩn bị bài học trước khi đến lớp.

---

<a name="menu-75"></a>
### 7.5. NHẬT KÝ CHUYÊN CẦN
* **Menu Sidebar**: `02. LỊCH TRÌNH & CHUYÊN CẦN` $\rightarrow$ `Nhật ký chuyên cần`
* **URL**: `/student/attendance`
* **Mục đích**: Phụ huynh và học sinh kiểm tra lịch sử điểm danh từng ngày, số buổi đi học đầy đủ và tình trạng xin nghỉ phép có đơn.

---

<a name="menu-76"></a>
### 7.6. THÔNG TIN CÁ NHÂN & NGUYỆN VỌNG HỌC TẬP
* **Menu Sidebar**: `03. TÀI KHOẢN CÁ NHÂN` $\rightarrow$ `Thông tin cá nhân`
* **URL**: `/student/profile`
* **Mục đích**: Cập nhật thông tin liên hệ phụ huynh, nguyện vọng chọn khối thi/tổ hợp môn và tham gia các câu lạc bộ ngoại khóa của trường.

---
*Tài liệu Cẩm nang Hướng dẫn Vận hành EduSmart chuẩn hóa - Sẵn sàng cho công tác đào tạo tập huấn, thẩm định chất lượng và hỗ trợ người dùng 24/7.*
