<!--
Fact-Forcing Gate Declaration:
- Importers / Callers: School Principals, Vice Principals, Academic Heads, School Administrators
- Affected API: All 25 Management Modules in /admin/* on EduSmart Management Platform
- Data schemas: Thông tư 15/2020/TT-BGDĐT, Thông tư 22/2021/TT-BGDĐT, Công văn 5512/BGDĐT-GDTrH, Thông tư 32/2018/TT-BGDĐT, Nghị định 130/2018/NĐ-CP (Chữ ký số)
- User's verbatim instruction: "hãy làm chi tiết từng mục của acc hiệu trưởng hướng dẫn chi tiết từng chức năng tất cả các mục ở menu trên acc hiệu trưởng"
-->
# 👑 SỔ TAY ĐIỀU HÀNH DÀNH RIÊNG CHO HIỆU TRƯỞNG & BAN GIÁM HIỆU
## HƯỚNG DẪN CHI TIẾT 100% CÁC CHỨC NĂNG & QUY TRÌNH TÁC NGHIỆP (25 MỤC MENU ADMIN)
*Áp dụng chuẩn hóa theo Thông tư 15/2020, Thông tư 22/2021, Công văn 5512 của Bộ GD&ĐT và Nghị định 130/2018 về Chữ ký số*

---

## 🧭 LỜI NÓI ĐẦU DÀNH CHO HIỆU TRƯỞNG

Kính thưa Thầy/Cô trong Ban Giám Hiệu!

Hệ sinh thái Quản trị Giáo dục **EduSmart** được xây dựng nhằm giải phóng hoàn toàn gánh nặng hồ sơ, sổ sách giấy tờ cồng kềnh, giúp Ban Giám Hiệu chuyển đổi từ phương thức quản lý hành chính thụ động sang **Quản trị dữ liệu số theo thời gian thực (Real-time Data-driven Governance)**.

Tài liệu này được biên soạn theo khung **7 Tiêu Chuẩn Tác Nghiệp Chuyên Sâu** cho toàn bộ 25 phân hệ chức năng trên tài khoản Hiệu trưởng, chia thành **5 Cụm Trọng Tâm Điều Hành**. Mỗi mục đều có sẵn mẫu lời phê chuẩn mực sư phạm và hướng dẫn xử lý sự cố trong 10 giây.

---

# CỤM 1: CHỈ HUY & GIÁM SÁT THỜI GIAN THỰC (DAILY OPERATIONS)

---

### MỤC 01: BẢNG ĐIỀU KHIỂN QUẢN TRỊ (DASHBOARD)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/dashboard`. Căn cứ Quyết định 4725/QĐ-BGDĐT về Bộ chỉ số chuyển đổi số trường học.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Giám sát bức tranh toàn cảnh 24/7 về sĩ số, tỷ lệ chuyên cần, tiến độ giảng dạy, hồ sơ công việc cần duyệt và cảnh báo AI nguy cơ sa sút.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Vòng tròn Chuyên cần toàn trường`: Tỷ lệ % học sinh có mặt hôm nay (Xanh lá $\ge 98\%$, Cam $95-97\%$, Đỏ $<95\%$).
  - `Thẻ Hồ sơ chờ duyệt`: Số lượng giáo án và đơn xin nghỉ phép đang đợi BGH phê duyệt.
  - `Thẻ Cảnh báo AI`: Số ca học sinh có dấu hiệu sa sút cần chỉ đạo hỗ trợ.
  - `Nút [🔄 Làm Mới Dữ Liệu]`: Tải lại số liệu mới nhất tức thì.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Lúc 07h30 sáng: Mở Dashboard trên máy tính hoặc điện thoại di động.
  2. Quan sát tỷ lệ chuyên cần: Nếu có lớp có màu cam/đỏ, nhấp trực tiếp vào số liệu để xem danh sách học sinh vắng.
  3. Kiểm tra mục "Việc cần xử lý ngay" và nhấp vào để duyệt giáo án hoặc công văn.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Yêu cầu GVCN lớp 10A2 liên hệ ngay với phụ huynh 02 học sinh vắng không phép trước 08h30 để nắm tình hình."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Dữ liệu sĩ số chưa cập nhật lúc 07h15: Do một số GVCN chưa bấm [Chốt điểm danh]. Bấm nút `[🔔 Gửi Thông Báo Đôn Đốc Điểm Danh]` để hệ thống gửi push notification đến điện thoại GVCN.
- **🔒 Bảo mật & Chữ ký số:** Dữ liệu dashboard chỉ hiển thị nội bộ BGH, không công khai ra bên ngoài.

---

### MỤC 02: NHẬT KÝ ĐIỂM DANH TOÀN TRƯỜNG
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/attendance`. Điều lệ trường THCS/THPT ban hành kèm Thông tư 32/2020/TT-BGDĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Nắm bắt chính xác sĩ số hiện diện từng lớp, phân loại vắng có phép/không phép, giám sát tính trung thực trong việc điểm danh của GVCN.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Bảng Ma Trận Sĩ Số Lớp`: Danh sách toàn bộ các lớp (Tổng số, Có mặt, Nghỉ phép, Không phép, Đi muộn).
  - `Bộ lọc Khối / Lớp / Ngày`: Tra cứu lịch sử chuyên cần của bất kỳ ngày nào trong năm học.
  - `Nút [📤 Xuất Báo Cáo Chuyên Cần Excel]`: Tải file tổng hợp chuyên cần tháng để tính thi đua lớp.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Chọn ngày cần kiểm tra trên thanh lịch.
  2. Quan sát các ô hiển thị số học sinh vắng không phép (bôi đỏ).
  3. Nhấp vào tên lớp để xem chi tiết họ tên, số điện thoại phụ huynh và lý do vắng.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Biểu dương Chi đoàn 12A1 duy trì tỷ lệ chuyên cần 100% suốt 3 tuần liên tiếp; Nhắc nhở lớp 11B3 có 4 trường hợp đi muộn vào tiết 1."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Phụ huynh phản ánh con có đi học nhưng hệ thống báo vắng: BGH nhấp vào tên học sinh $\rightarrow$ Chọn `[Xem Lịch Sử Điểm Danh]` để kiểm tra thời điểm GVCN thao tác, sau đó điều chỉnh trạng thái và thông báo lại cho phụ huynh.
- **🔒 Bảo mật & Chữ ký số:** Nhật ký điểm danh lưu vết vĩnh viễn, không thể chỉnh sửa lùi ngày sau khi đã khóa sổ tháng.

---

### MỤC 03: GIÁM SÁT SỔ ĐẦU BÀI ĐIỆN TỬ
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/journals`. Thông tư 28/2020/TT-BGDĐT về hồ sơ quản lý hoạt động giáo dục.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Kiểm tra việc thực hiện chương trình giảng dạy, số tiết dạy thực tế so với phân phối chương trình, tình hình kỷ luật và nề nếp từng tiết học.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Lưới Tiết Học Trong Ngày`: Thể hiện từ Tiết 1 đến Tiết 5 (Buổi sáng) và Tiết 6 đến Tiết 8 (Buổi chiều).
  - `Màu sắc trạng thái`: Xanh lá = Đã ký sổ & Đánh giá Tốt; Xanh dương = Đánh giá Khá; Vàng = Tiết học có học sinh vi phạm; Cam nhấp nháy = Tiết đã học nhưng GV chưa ký sổ.
  - `Nút [🔔 Nhắc Ký Sổ Tự Động]`: Gửi tin nhắn đến giáo viên chưa hoàn thành ký sổ.
  - `Nút [In Sổ Đầu Bài PDF]`: Xuất cuốn sổ đầu bài hoàn chỉnh có chữ ký số để lưu trữ thanh tra.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Cuối buổi sáng (11h45) hoặc cuối buổi chiều (17h15): BGH mở giao diện Sổ đầu bài.
  2. Lọc các tiết có màu cam nhấp nháy.
  3. Bấm `[🔔 Nhắc Ký Sổ Tự Động]` để gửi thông báo đôn đốc.
  4. Xem các tiết có đánh dấu ghi chú kỷ luật (màu vàng) để chỉ đạo Đoàn Thanh niên phối hợp xử lý.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Tiết 3 Môn Vật Lý lớp 10A3 thực hiện nghiêm túc, lớp học sôi nổi. Đề nghị GVBM bộ môn Hóa học Tiết 2 ký sổ bổ sung trước 17h00 hôm nay."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên báo dạy bù hoặc đổi tiết với đồng nghiệp: BGH nhấp vào ô tiết học $\rightarrow$ Chọn `[Xác Nhận Dạy Bù / Đổi Tiết]` để hệ thống tự động cập nhật lại tên giáo viên đứng lớp.
- **🔒 Bảo mật & Chữ ký số:** Sổ đầu bài điện tử được đóng dấu thời gian (Timestamp) chống chỉnh sửa hồi tố nội dung bài học.

---

### MỤC 04: TRUNG TÂM CẢNH BÁO SỚM HỌC ĐƯỜNG (AI MONITORING)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/ai-monitoring`. Đề án Chuyển đổi số ngành GD&ĐT ban hành theo Quyết định 131/QĐ-TTg.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Phát hiện sớm các nguy cơ: sa sút học lực đột ngột, nguy cơ bỏ học do vắng nhiều, biến động tâm lý hoặc vi phạm nội quy lặp lại.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Chỉ số Rủi ro (Risk Score 1-100)`: Đỏ ($\ge 75$: Nguy cơ cao), Vàng ($50-74$: Cần chú ý), Xanh ($<50$: An toàn).
  - `Biểu đồ Xu hướng học tập (OLS Trend)`: Phân tích đường dốc điểm số qua các bài kiểm tra.
  - `Nút [Giao Nhiệm Vụ Cho GVCN]`: Chuyển tiếp ca cảnh báo kèm yêu cầu hành động cho Giáo viên chủ nhiệm.
  - `Nút [Đóng Ca Can Thiệp]`: Ghi nhận hoàn thành sau khi học sinh đã tiến bộ.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Đầu tuần, BGH duyệt danh sách "Top học sinh cần hỗ trợ đặc biệt".
  2. Đọc bản phân tích nguyên nhân do AI tổng hợp (VD: Điểm Toán giảm 3.5 điểm + vắng 3 buổi không phép trong 2 tuần).
  3. Nhấp `[Giao Nhiệm Vụ Cho GVCN]` $\rightarrow$ Điền chỉ đạo $\rightarrow$ Bấm Gửi.
  4. Theo dõi tiến độ cập nhật phản hồi của GVCN tại cột "Kết quả can thiệp".
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Giao GVCN phối hợp cùng Ban đại diện CMHS gặp riêng gia đình em Nguyễn Văn A trong tuần này để tìm hiểu hoàn cảnh và có phương án phụ đạo bổ trợ."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Cảnh báo sai do nhập nhầm điểm: Khi giáo viên sửa lại điểm số đúng, chỉ số Risk Score của AI sẽ tự động tính toán lại và đưa học sinh ra khỏi danh sách đỏ sau 5 giây.
- **🔒 Bảo mật & Chữ ký số:** Thông tin hồ sơ tâm lý và cảnh báo rủi ro được mã hóa mức độ bảo mật cao nhất, chỉ Hiệu trưởng và GVCN trực tiếp mới có quyền truy cập.

---

### MỤC 05: CỔNG LIÊN LẠC & TIN NHẮN PHỤ HUYNH (COMMUNICATIONS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/communications`. Thông tư 09/2021/TT-BGDĐT về quản lý và tổ chức dạy học trực tuyến.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Phát hành thông báo chính thức của nhà trường, điều hành họp phụ huynh trực tuyến và gửi SMS thông báo khẩn cấp (nghỉ học do bão, lịch thi...).
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Nút [+ Soạn Thông Báo Toàn Trường]`: Tạo bản tin mới gửi đến toàn bộ phụ huynh và giáo viên.
  - `Hộp chọn Kênh gửi`: [App Phụ Huynh (Miễn phí)], [Tin Nhắn SMS Brandname], [Email Chính Thức].
  - `Thống kê lượt đọc`: Tỷ lệ % phụ huynh đã mở xem thông báo.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Nhấp `[+ Soạn Thông Báo Toàn Trường]`.
  2. Chọn Tiêu đề, Đối tượng nhận (Toàn trường, Khối 12, hoặc Danh sách phụ huynh nợ học phí).
  3. Nhập nội dung thông báo hoặc đính kèm văn bản chỉ đạo (PDF).
  4. Bấm `[Xem Trước & Ký Duyệt Phát Hành]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Kính gửi Quý Phụ huynh: Căn cứ dự báo bão số 3, Nhà trường cho học sinh toàn trường nghỉ học ngày 18/09. Lịch học bù sẽ được thông báo sau."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Gửi nhầm nội dung thông báo: Bấm ngay nút `[Thu Hồi Thông Báo]` trong vòng 5 phút để gỡ bản tin khỏi ứng dụng của phụ huynh và gửi bản đính chính.
- **🔒 Bảo mật & Chữ ký số:** Mọi thông báo chính thức đều được gắn mã định danh cơ quan phát hành, chống giả mạo thông tin nhà trường.

---

# CỤM 2: QUẢN TRỊ CHUYÊN MÔN & KÝ DUYỆT BÀI DẠY (ACADEMIC GOVERNANCE)

---

### MỤC 06: PHÊ DUYỆT KẾ HOẠCH BÀI DẠY (GIÁO ÁN CV 5512)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/lesson-plans`. Công văn số 5512/BGDĐT-GDTrH về xây dựng và tổ chức thực hiện kế hoạch giáo dục.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Phê duyệt cấp trường toàn bộ kế hoạch bài dạy của giáo viên sau khi Tổ trưởng chuyên môn đã thẩm định; kiểm tra chất lượng đổi mới phương pháp dạy học.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Thẻ Lọc Trạng Thái`: [Tất cả], [Chờ BGH duyệt], [Đã phê duyệt], [Yêu cầu sửa đổi].
  - `Khung xem trước tài liệu`: Đọc trực tiếp file Word/PDF trên trình duyệt không cần tải về máy.
  - `Nút [✅ Phê Duyệt & Ký Số]`: Ký duyệt bài dạy và đóng dấu mộc số BGH.
  - `Nút [⚠️ Yêu Cầu Hoàn Thiện Lại]`: Trả lại bài kèm ghi chú góp ý chuyên môn.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Vào danh sách "Chờ BGH duyệt" (chỉ gồm các giáo án đã có nhãn "Tổ CM đã duyệt").
  2. Nhấp vào tên bài dạy để đọc nhanh 4 hoạt động học tập (Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng).
  3. Nhập nhận xét chuyên môn hoặc chọn mẫu lời phê có sẵn.
  4. Bấm `[✅ Phê Duyệt & Ký Số]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:**
  - *Mẫu Phê duyệt tốt:* *"Kế hoạch bài dạy thiết kế chuẩn CV 5512; chuỗi hoạt động rõ ràng, phát huy tốt phẩm chất tự học và năng lực giải quyết vấn đề của học sinh. Đồng ý phê duyệt."*
  - *Mẫu Yêu cầu sửa:* *"Hoạt động 3 (Luyện tập) còn nặng về thuyết giảng của giáo viên, cần bổ sung phiếu học tập nhóm và tiêu chí đánh giá sản phẩm học sinh trước khi dạy."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Cần thu hồi giáo án đã lỡ ký duyệt do phát hiện sai sót: BGH mở bài dạy $\rightarrow$ Bấm `[Hủy Duyệt & Yêu Cầu Cập Nhật]` $\rightarrow$ Điền lý do thu hồi để giáo viên nộp lại bản sửa.
- **🔒 Bảo mật & Chữ ký số:** Tích hợp chữ ký số chứng thư số chuyên dùng công vụ hoặc chữ ký số cá nhân SmartCA của Hiệu trưởng.

---

### MỤC 07: THỜI KHÓA BIỂU THÔNG MINH AI (SCHEDULE)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/schedule`. Quy định về định mức giờ dạy và số tiết tối đa/ngày của giáo viên.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Xếp lịch học tự động, quản lý ràng buộc sư phạm (không quá 4 tiết/buổi cho GV lớn tuổi, tránh tiết trống lẻ loi, phân bố đều môn khó).
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Nút [🤖 AI Tự Động Xếp Thời Khóa Biểu]`: Kích hoạt thuật toán tối ưu xếp toàn trường trong 30 giây.
  - `Bộ kiểm tra xung đột`: Tự động đánh dấu đỏ nếu có giáo viên bị trùng tiết hoặc phòng học bị sử dụng trùng lặp.
  - `Nút [Công Bố Thời Khóa Biểu]`: Đẩy lịch học chính thức lên tài khoản của toàn bộ GV và Học sinh.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Cài đặt ràng buộc cố định (Chào cờ Tiết 1 Thứ 2, Sinh hoạt lớp Tiết 5 Thứ 6).
  2. Bấm nút `[🤖 AI Tự Động Xếp Thời Khóa Biểu]`.
  3. Quan sát bản đồ nhiệt phân bổ tiết học, kiểm tra số tiết trống của giáo viên.
  4. Bấm `[Công Bố Thời Khóa Biểu]` và xuất file Excel toàn trường gửi phòng GD&ĐT/Sở GD&ĐT.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Thời khóa biểu Áp dụng từ Tuần 5 - Học kỳ 1. Đề nghị các Tổ chuyên môn rà soát và phản hồi về Ban chuyên môn trước 17h00 Thứ 7."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên nghỉ ốm đột xuất cần tìm người dạy thay: Nhấp vào tiết học của giáo viên nghỉ $\rightarrow$ Bấm `[Gợi Ý Giáo Viên Dạy Thay Trống Tiết]` $\rightarrow$ Chọn GV cùng bộ môn đang không có tiết dạy $\rightarrow$ Bấm [Chuyển Tiết].
- **🔒 Bảo mật & Chữ ký số:** Thời khóa biểu sau khi công bố sẽ được lưu phiên bản (Version Control) để đối chiếu số tiết dạy thực tế khi thanh quyết toán thừa giờ.

---

### MỤC 08: PHÂN CÔNG GIẢNG DẠY & ĐỊNH MỨC TIẾT
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/assignments`. Thông tư 15/2017/TT-BGDĐT và Thông tư 28/2009/TT-BGDĐT về định mức tiết dạy của giáo viên phổ thông (17 tiết/tuần THPT, 19 tiết/tuần THCS).
- **🎯 Quyền hạn & Trách nhiệm BGH:** Phân bổ giáo viên phụ trách các lớp, tính toán hệ số giảm trừ định mức (Chủ nhiệm giảm 4 tiết, Tổ trưởng giảm 3 tiết, Chủ tịch Công đoàn giảm 3-4 tiết).
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Bảng Ma Trận Phân Công`: Dòng là Giáo viên, Cột là các Lớp được phân công.
  - `Cột Thống Kê Số Tiết/Tuần`: Tự động tính tổng số tiết dạy thực tế so với định mức quy định (Xanh = Vừa đủ; Cam = Dư tiết; Đỏ = Vượt trần 200 giờ/năm).
  - `Nút [Kiểm Tra Định Mức Tự Động]`: Quét toàn trường phát hiện giáo viên thiếu hoặc quá tải tiết.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Đầu năm học: Nhập số tiết được giảm trừ cho từng chức danh kiêm nhiệm.
  2. Chọn Giáo viên $\rightarrow$ Gán vào các Lớp và Môn tương ứng.
  3. Bấm `[Kiểm Tra Định Mức Tự Động]` để bảo đảm công bằng giữa các giáo viên trong tổ.
  4. Bấm `[Lưu & Ban Hành Phân Công Chuyên Môn]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Phê chuẩn bảng phân công chuyên môn Học kỳ 1. Định mức giảng dạy toàn trường bình quân 17.2 tiết/tuần, đảm bảo đúng quy định của Bộ GD&ĐT."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Thay đổi giáo viên dạy một lớp giữa học kỳ: Nhấp vào ô giao nhau giữa Lớp và Môn đó $\rightarrow$ Chọn tên Giáo viên mới $\rightarrow$ Bấm [Chuyển Giao Dữ Liệu]. Hệ thống tự động chuyển giao quyền vào điểm và sổ đầu bài sang giáo viên mới.
- **🔒 Bảo mật & Chữ ký số:** Quyết định phân công chuyên môn ký số bởi Hiệu trưởng là căn cứ pháp lý để chi trả lương và chế độ dạy thêm giờ.

---

### MỤC 09: QUẢN LÝ TỔ BỘ MÔN & BỔ NHIỆM CHUYÊN MÔN
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/subject-groups`. Điều 14 Điều lệ trường học ban hành kèm Thông tư 32/2020/TT-BGDĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Thành lập cơ cấu Tổ chuyên môn (Toán - Tin, Ngữ văn, KHTN, KHXH...), bổ nhiệm Tổ trưởng, Tổ phó và phê duyệt kế hoạch hoạt động tổ.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Danh sách Thẻ Tổ Bộ Môn`: Hiển thị số lượng tổ viên, họ tên Tổ trưởng/Tổ phó, tỷ lệ hoàn thành giáo án của tổ.
  - `Nút [+ Thành Lập Tổ Mới]`: Khởi tạo tổ chuyên môn mới.
  - `Nút [Bổ Nhiệm Tổ Trưởng]`: Cấp quyền thẩm định giáo án cấp Tổ cho cán bộ được bổ nhiệm.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Chọn Tổ chuyên môn cần cấu hình.
  2. Thêm hoặc chuyển giáo viên vào danh sách tổ viên.
  3. Chỉ định tài khoản giữ vai trò Tổ trưởng / Tổ phó.
  4. Bấm `[Lưu Cấu Hình Tổ]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Bổ nhiệm Thầy/Cô ... giữ chức vụ Tổ trưởng Tổ Toán - Tin năm học 2026-2027. Đề nghị đồng chí xây dựng Kế hoạch chuyên môn tổ nộp BGH trước ngày 25/08."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên dạy liên môn sinh hoạt tại 2 tổ: Bật tùy chọn `[Cho phép sinh hoạt chuyên môn kiêm nhiệm]` tại hồ sơ của giáo viên đó để họ xuất hiện trong danh sách sinh hoạt của cả 2 tổ.
- **🔒 Bảo mật & Chữ ký số:** Quyết định thành lập và bổ nhiệm Tổ CM được lưu trữ trong hồ sơ quản lý nhân sự điện tử.

---

### MỤC 10: QUẢN TRỊ DANH MỤC LỚP HỌC
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/classes`. Quy định về sĩ số tối đa học sinh/lớp (45 học sinh/lớp THPT, 40 học sinh/lớp THCS) và phân ban chuyên đề.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Khởi tạo danh mục lớp học theo khối, phân ban định hướng nghề nghiệp (KHTN / KHXH / Nghệ thuật), phân công GVCN và gán phòng học cố định.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Bảng Danh Sách Lớp`: Tên lớp, Khối, Ban học, Sĩ số hiện tại, Giáo viên chủ nhiệm, Phòng học.
  - `Nút [+ Thêm Lớp Mới]`: Tạo lớp học cho năm học mới.
  - `Nút [Phân Bổ Học Sinh Vào Lớp]`: Chia lớp tự động theo tổ hợp môn đăng ký đầu cấp.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Nhấp `[+ Thêm Lớp Mới]`.
  2. Điền Tên lớp (VD: 10A1), Khối 10, chọn Phân ban KHTN.
  3. Chọn Giáo viên Chủ nhiệm và gán số phòng học.
  4. Bấm `[Lưu Lớp Học]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Phê duyệt danh mục 30 lớp học năm học 2026-2027. Sĩ số bình quân 42.5 học sinh/lớp, đảm bảo đúng quy chuẩn trường chuẩn quốc gia."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Đổi GVCN giữa năm học: Mở lớp học $\rightarrow$ Bấm nút `[Sửa]` $\rightarrow$ Chọn GVCN mới $\rightarrow$ Bấm `[Cập Nhật]`. Hệ thống tự động chuyển toàn bộ quyền ký học bạ và điểm danh sang GVCN mới ngay lập tức.
- **🔒 Bảo mật & Chữ ký số:** Danh mục lớp học được liên thông đồng bộ trực tiếp lên hệ thống cơ sở dữ liệu ngành của Bộ GD&ĐT.

---

# CỤM 3: ĐÁNH GIÁ NHÂN SỰ & THI ĐUA VIÊN CHỨC (TEACHER EVALUATION & HR)

---

### MỤC 11: ĐÁNH GIÁ GIÁO VIÊN CHUẨN NGHỀ NGHIỆP TT15/2020
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/teacher-evaluations`. Thông tư 15/2020/TT-BGDĐT ban hành Quy chế đánh giá chuẩn nghề nghiệp giáo viên cơ sở giáo dục mầm non, phổ thông.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Đánh giá chính thức của Hiệu trưởng đối với từng giáo viên theo 5 tiêu chuẩn và 15 tiêu chí; tự động tổng hợp kết quả xếp loại thi đua (Tốt, Khá, Đạt, Chưa đạt).
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `5 Tiêu chuẩn & 15 Tiêu chí`:
    - Tiêu chuẩn 1: Phẩm chất nhà giáo (Tiêu chí 1, 2).
    - Tiêu chuẩn 2: Phát triển chuyên môn, nghiệp vụ (Tiêu chí 3, 4, 5, 6, 7).
    - Tiêu chuẩn 3: Xây dựng môi trường giáo dục (Tiêu chí 8, 9, 10).
    - Tiêu chuẩn 4: Phát triển mối quan hệ giữa nhà trường, gia đình và xã hội (Tiêu chí 11, 12, 13).
    - Tiêu chuẩn 5: Sử dụng ngoại ngữ hoặc tiếng dân tộc tộc thiểu số, ứng dụng CNTT (Tiêu chí 14, 15).
  - `Mức xếp loại tự động`:
    - **Tốt**: Tất cả 15 tiêu chí đạt loại Khá trở lên, trong đó tối thiểu 10 tiêu chí đạt loại Tốt (bắt buộc các tiêu chí 1, 3, 4, 8, 9 đạt loại Tốt).
    - **Khá**: Tất cả 15 tiêu chí đạt loại Đạt trở lên, trong đó tối thiểu 9 tiêu chí đạt loại Khá trở lên.
    - **Đạt**: Tất cả 15 tiêu chí đạt loại Đạt trở lên.
    - **Chưa đạt**: Có tiêu chí xếp loại Chưa đạt.
  - `Nút [Ký Duyệt Biên Bản Đánh Giá TT15]`: Đóng dấu số và xuất biên bản chuẩn Bộ GD&ĐT.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Chọn Giáo viên cần đánh giá trong danh sách.
  2. Xem bảng tự đánh giá của Giáo viên và ý kiến nhận xét của Tổ chuyên môn.
  3. Hiệu trưởng chấm điểm từng tiêu chí (Đạt / Khá / Tốt).
  4. Nhập nhận xét tổng quát về ưu điểm và hướng phát triển nghề nghiệp.
  5. Bấm `[Ký Duyệt Biên Bản Đánh Giá TT15]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Đồng chí có phẩm chất đạo đức chuẩn mực; chuyên môn vững vàng, tích cực ứng dụng CNTT và đổi mới phương pháp giảng dạy. Xếp loại Chuẩn nghề nghiệp: TỐT."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên có ý kiến khiếu nại về mức xếp loại: BGH mở lại phiếu đánh giá $\rightarrow$ Bấm `[Tạo Phiếu Họp Giải Trình]` $\rightarrow$ Cập nhật lại mức điểm sau khi Hội đồng thi đua họp thống nhất.
- **🔒 Bảo mật & Chữ ký số:** Kết quả đánh giá TT15 được bảo mật theo quy định bảo vệ bí mật công tác viên chức và được gửi trực tiếp lên Cổng thông tin cán bộ Sở GD&ĐT.

---

### MỤC 12: CƠ SỞ DỮ LIỆU HỒ SƠ GIÁO VIÊN
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/teachers`. Quy định về chuẩn hóa văn bằng, chứng chỉ chức danh nghề nghiệp theo Thông tư 01, 02, 03, 04/2021/TT-BGDĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Quản trị toàn diện hồ sơ lý lịch viên chức, hợp đồng lao động, chứng chỉ bồi dưỡng thường xuyên, nâng lương định kỳ và theo dõi thâm niên nhà giáo.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Bảng Danh Sách Cán Bộ Giáo Viên`: Họ tên, Ngày sinh, Mã số định danh, Hạng chức danh (Hạng I, II, III), Trình độ đào tạo (Thạc sĩ, Cử nhân), Trạng thái công tác.
  - `Bộ lọc Đạt chuẩn / Chưa đạt chuẩn`: Phát hiện ngay giáo viên cần cử đi đào tạo nâng chuẩn theo Nghị định 71/2020/NĐ-CP.
  - `Nút [📤 Xuất Báo Cáo Đội Ngũ Excel]`: Kết xuất danh sách phục vụ báo cáo Sở Nội vụ và Sở GD&ĐT.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Nhấp vào tên giáo viên để xem chi tiết hồ sơ điện tử.
  2. Kiểm tra các tệp đính kèm (Bằng cấp, Chứng chỉ quản lý GD, Chứng chỉ bồi dưỡng modul đổi mới GDPT 2018).
  3. Cập nhật ngày nâng bậc lương gần nhất và thời hạn hợp đồng.
  4. Bấm `[Lưu Hồ Sơ]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Hồ sơ viên chức đầy đủ, chuẩn hóa 100% văn bằng chứng chỉ chức danh nghề nghiệp Hạng II theo quy định."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên chuyển công tác sang trường khác: Nhấp vào hồ sơ $\rightarrow$ Chọn trạng thái `[Chuyển Công Tác]` $\rightarrow$ Nhập tên trường tiếp nhận. Dữ liệu hồ sơ sẽ tự động chuyển tuyến trên hệ thống mà không cần lập hồ sơ mới.
- **🔒 Bảo mật & Chữ ký số:** Hồ sơ cá nhân viên chức tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

---

### MỤC 13: PHÂN QUYỀN VAI TRÒ & QUẢN TRỊ TÀI KHOẢN (PERMISSIONS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/permissions`. Luật An toàn thông tin mạng và quy định quản lý tài khoản cơ quan nhà nước.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Thiết lập ma trận phân quyền: Ban Giám Hiệu (Toàn quyền), Giáo vụ (Nhập liệu hồ sơ), Tổ trưởng (Thẩm định bài dạy), Giáo viên (Nhập điểm & ký sổ đầu bài lớp phụ trách).
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Ma Trận Phân Quyền Theo Nhóm`: Bật/Tắt quyền (Xem, Thêm, Sửa, Xóa, Duyệt, Ký số, Xuất báo cáo) trên từng phân hệ.
  - `Nút [Khóa Tài Khoản Tạm Thời]`: Đình chỉ ngay tài khoản khi phát hiện nghi vấn lộ lọt mật khẩu.
  - `Nút [Đặt Lại Mật Khẩu & Bật Xác Thực 2 Bước (2FA)]`: Cấp mật khẩu an toàn và gửi mã OTP qua điện thoại.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Chọn Vai trò cần cấu hình (VD: Giáo viên Chủ nhiệm).
  2. Tích chọn các quyền được phép thực hiện (VD: Điểm danh, Kéo thả chỗ ngồi, Ký sổ chủ nhiệm).
  3. Bỏ tích các quyền nhạy cảm (VD: Khóa sổ điểm, Xóa học sinh).
  4. Bấm `[Lưu Ma Trận Quyền Hạn]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Cấu hình phân quyền chuẩn mực theo nguyên tắc Đúng vai - Đúng quyền - Trách nhiệm cá nhân rõ ràng."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên báo mất điện thoại hoặc nghi ngờ bị đăng nhập trái phép: Nhấp vào tài khoản giáo viên $\rightarrow$ Bấm `[Đăng Xuất Khỏi Mọi Thiết Bị]` và `[Khóa Tạm Thời]` để ngăn chặn truy cập trái phép.
- **🔒 Bảo mật & Chữ ký số:** Ghi nhận địa chỉ IP và danh tính người thực hiện phân quyền vào nhật ký bảo mật cấp cao.

---

### MỤC 14: NHẬT KÝ HỆ THỐNG & THANH TRA DỮ LIỆU (AUDIT LOGS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/audit-logs`. Căn cứ quy chuẩn lưu trữ chứng từ điện tử theo Luật Giao dịch điện tử.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Giám sát 100% mọi hành vi tương tác trên hệ thống: ai đã vào sửa điểm, ai đã sửa nhận xét học bạ, thời gian thao tác chính xác đến từng giây, địa chỉ IP và thiết bị sử dụng.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Lưới Nhật Ký Thao Tác`: Thời gian (Timestamp), Tài khoản thực hiện, Hành động (Thêm/Sửa/Xóa/Ký duyệt), Dữ liệu trước khi sửa $\rightarrow$ Dữ liệu sau khi sửa, Địa chỉ IP.
  - `Bộ lọc Hành Động Nhạy Cảm`: Lọc riêng các thao tác sửa điểm sau khi khóa sổ hoặc thay đổi kết quả xếp loại.
  - `Nút [Xuất Báo Cáo Kiểm Toán PDF]`: Phục vụ công tác thanh tra của Sở GD&ĐT hoặc Đoàn kiểm toán.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Khi có sự cố thắc mắc về điểm số hoặc dữ liệu học sinh: Mở mục Audit Logs.
  2. Nhập Mã học sinh hoặc Tên giáo viên vào ô tìm kiếm.
  3. Đọc nhật ký biến động dữ liệu: Đối chiếu giá trị cũ và giá trị mới.
  4. Trích xuất bằng chứng xác thực để làm việc với các bên liên quan.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Nhật ký hệ thống ghi nhận đầy đủ, minh bạch, đảm bảo tính toàn vẹn và chống chối bỏ trách nhiệm trong quản trị học vụ."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Phát hiện hành vi cố ý đăng nhập dò mật khẩu từ IP lạ: Bấm nút `[Chặn Địa Chỉ IP Này]` để ngăn chặn hoàn toàn kết nối từ địa chỉ đó.
- **🔒 Bảo mật & Chữ ký số:** Nhật ký Audit Log được ghi theo cơ chế Append-Only (Chỉ ghi thêm, không ai kể cả Super Admin có thể xóa hoặc sửa nhật ký).

---

# CỤM 4: QUẢN LÝ HỌC SINH, SỔ ĐIỂM, HỌC BẠ & KỲ THI (STUDENT AFFAIRS)

---

### MỤC 15: CƠ SỞ DỮ LIỆU HỒ SƠ HỌC SINH & VNeID
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/students`. Đề án 06/CP về phát triển ứng dụng dữ liệu dân cư, định danh và xác thực điện tử.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Quản trị hồ sơ toàn bộ học sinh toàn trường, chuẩn hóa mã định danh cá nhân (Số CCCD / Mã định danh Bộ Công an cấp), diện chính sách, học sinh khuyết tật và sổ liên lạc gia đình.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Thẻ Trạng Thái Đồng Bộ VNeID`: Màu xanh (Đã xác thực trùng khớp với CSDL Quốc gia về Dân cư); Màu đỏ (Sai lệch thông tin cần chỉnh sửa).
  - `Nút [📥 Nhập Hồ Sơ Từ Excel Chuẩn EMIS]`: Nạp nhanh toàn bộ danh sách học sinh đầu năm học.
  - `Nút [📤 Xuất Danh Sách Học Sinh Cấp Thẻ/Bảo Hiểm]`: Xuất file cho Bảo hiểm xã hội hoặc Ngân hàng làm thẻ học sinh thông minh.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Đầu năm học: Nhấp `[📥 Nhập Hồ Sơ Từ Excel]` nạp danh sách trúng tuyển lớp 10 hoặc lớp 6.
  2. Chạy tính năng `[Quét Trùng Lặp & Kiểm Tra Mã Định Danh]`.
  3. Rà soát danh sách học sinh diện chính sách miễn giảm học phí để phê duyệt chế độ.
  4. Bấm `[Đồng Bộ Lên Cơ Sở Dữ Liệu Ngành Bộ GD&ĐT]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Đã hoàn tất chuẩn hóa 100% mã định danh cá nhân cho 1.250 học sinh toàn trường, sẵn sàng kết nối dữ liệu quốc gia."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Học sinh chuyển trường đến hoặc chuyển đi giữa năm học: Mở hồ sơ học sinh $\rightarrow$ Bấm `[Chuyển Trường]` $\rightarrow$ Điền số quyết định tiếp nhận/chuyển đi $\rightarrow$ Hệ thống tự động trích xuất toàn bộ quá trình học tập và học bạ điện tử chuyển tuyến.
- **🔒 Bảo mật & Chữ ký số:** Dữ liệu nhân thân học sinh được bảo vệ nghiêm ngặt theo Luật Trẻ em và Luật An ninh mạng.

---

### MỤC 16: GIÁM SÁT SỔ NHẬP ĐIỂM CHUẨN THÔNG TƯ 22
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/grades`. Thông tư 22/2021/TT-BGDĐT về đánh giá học sinh THCS và THPT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Giám sát tiến độ vào điểm của tất cả các tổ bộ môn; kiểm soát công thức tính Điểm trung bình môn học kỳ ($ĐTB_{mhk}$) và Điểm trung bình môn cả năm ($ĐTB_{mcn}$); thực hiện lệnh Khóa sổ điểm hoặc Mở khóa sửa điểm có kiểm soát.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Công thức chuẩn Thông tư 22`:
    $$ĐTB_{mhk} = \frac{\sum ĐĐG_{tx} + 2 \times ĐĐG_{gk} + 3 \times ĐĐG_{ck}}{\text{Số cột } ĐĐG_{tx} + 5}$$
  - `Bảng Ma Trận Tiến Độ Vào Điểm`: Thể hiện tỷ lệ % hoàn thành điểm của từng môn/lớp (Xanh = Đủ điểm; Vàng = Thiếu cột ĐĐGtx; Đỏ = Chưa nộp điểm).
  - `Nút [🔒 Khóa Sổ Điểm Toàn Trường]`: Ngăn chặn mọi thao tác sửa điểm sau khi hết hạn.
  - `Nút [🔓 Cấp Quyền Sửa Điểm 24H]`: Cho phép giáo viên sửa điểm sau khi có đơn đề xuất được duyệt.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Kiểm tra bảng tiến độ vào điểm trước các mốc giữa kỳ và cuối kỳ.
  2. Bấm `[Gửi Cảnh Báo Hạn Chót Vào Điểm]` cho các giáo viên còn bôi đỏ.
  3. Sau thời hạn quy định: Bấm `[🔒 Khóa Sổ Điểm Toàn Trường]`.
  4. Duyệt các đề xuất xin sửa điểm chính đáng qua quy trình kiểm soát 2 bước.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Phê duyệt mở khóa sửa điểm cột ĐĐGtx môn Toán lớp 10A1 cho GV ... trong thời hạn 24 giờ (từ 08h00 ngày 15/12 đến 08h00 ngày 16/12) theo đề xuất số 05/ĐX."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Giáo viên cộng nhầm điểm kiểm tra cuối kỳ: BGH yêu cầu GV nộp bài thi gốc $\rightarrow$ BGH kiểm tra khớp đúng $\rightarrow$ Bấm `[Cấp Quyền Sửa Điểm 1 Học Sinh]` $\rightarrow$ Ghi rõ lý do đính kèm biên bản.
- **🔒 Bảo mật & Chữ ký số:** Mọi biến động điểm số đều được lưu vết trong Audit Log có chữ ký số của người cho phép mở khóa.

---

### MỤC 17: KÝ SỐ HỌC BẠ ĐIỆN TỬ TOÀN TRƯỜNG
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/transcripts`. Đề án thí điểm Học bạ số của Bộ GD&ĐT theo Quyết định 318/QĐ-BGDĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Ký số xác thực cấp Hiệu trưởng toàn bộ học bạ số hóa của học sinh sau khi GVCN và GV bộ môn đã hoàn thành ký số; phát hành bản học bạ điện tử có mã QR xác thực quốc gia.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Danh sách Học bạ theo Lớp`: Thể hiện tiến độ ký số (Cột GVBM: Đủ chữ ký; Cột GVCN: Đã ký; Cột Hiệu Trưởng: Chờ ký).
  - `Khung hiển thị Học bạ chuẩn Bộ`: Bảng điểm tất cả môn học, Nhận xét phẩm chất năng lực, Kết quả rèn luyện và Danh hiệu thi đua (Học sinh Xuất sắc, Học sinh Giỏi).
  - `Nút [✍️ Ký Số Hàng Loạt Toàn Khối / Toàn Trường]`: Ký duyệt hàng trăm học bạ chỉ bằng 1 lần xác thực mã PIN SmartCA/Token.
  - `Nút [Tải Bản Thể Hiện Học Bạ PDF Có Mã QR]`: Xuất file phục vụ học sinh nộp hồ sơ xét tuyển đại học.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Cuối học kỳ / Cuối năm học: Mở danh mục Học bạ điện tử.
  2. Kiểm tra điều kiện tiên quyết: 100% cột điểm đã khóa và GVCN đã hoàn thành ký số.
  3. Chọn Khối 12 (hoặc Khối cần ký) $\rightarrow$ Bấm `[✍️ Ký Số Hàng Loạt]`.
  4. Xác thực qua ứng dụng chữ ký số SmartCA trên điện thoại.
  5. Hệ thống tự động đóng dấu mộc số điện tử của trường và tạo mã QR xác thực gốc.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Phê chuẩn kết quả rèn luyện và học tập năm học 2026-2027. Công nhận danh hiệu Học sinh Xuất sắc cho 145 học sinh Khối 12."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Cần hủy chữ ký số học bạ do phát hiện sai sót trước khi công bố: BGH sử dụng quyền Hiệu trưởng chọn `[Hủy Xác Thực Chữ Ký Số Học Bạ]` $\rightarrow$ Điền biên bản hủy $\rightarrow$ Yêu cầu GVCN chỉnh sửa và trình ký lại.
- **🔒 Bảo mật & Chữ ký số:** Học bạ số được lưu trữ vĩnh viễn trên hạ tầng Cloud bảo mật của ngành, tích hợp dấu thời gian TSA chống làm giả.

---

### MỤC 18: TỔ CHỨC KỲ THI, ĐÁNH SỐ BÁO DANH & PHÒNG THI (EXAMS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/exams`. Quy chế thi và kiểm tra định kỳ của Bộ GD&ĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Lập danh sách phòng thi tập trung cho các kỳ thi Giữa kỳ, Cuối kỳ, Thi khảo sát chất lượng; tự động trộn số báo danh và phân công giám thị coi thi.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Nút [+ Khởi Tạo Kỳ Thi Mới]`: Tạo đợt thi (VD: Kiểm tra Cuối Kỳ 1 Khối 12).
  - `Nút [🤖 Tự Động Phân Phòng & Đánh SBD]`: Chia đều 24 học sinh/phòng, trộn ngẫu nhiên học sinh các lớp cùng ban để chống quay cóp.
  - `Nút [🤖 Phân Công Giám Thị Tự Động]`: Gán 2 giám thị/phòng bảo đảm nguyên tắc không coi thi môn của mình dạy và không coi học sinh lớp mình chủ nhiệm.
  - `Nút [In Danh Sách Phòng Thi & Phiếu Thu Bài]`: Kết xuất trọn bộ hồ sơ phòng thi chuẩn.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Nhấp `[+ Khởi Tạo Kỳ Thi Mới]`, chọn Khối và Danh sách các môn thi.
  2. Chọn quy tắc chia phòng (24 học sinh/phòng theo thứ tự ABC toàn khối).
  3. Bấm `[🤖 Tự Động Phân Phòng & Đánh SBD]`.
  4. Bấm `[🤖 Phân Công Giám Thị Tự Động]`.
  5. Xuất và in thẻ dự thi có mã QR cho học sinh.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Ban hành Kế hoạch tổ chức kỳ thi khảo sát chất lượng Học kỳ 1. Yêu cầu Ban coi thi và chấm thi thực hiện nghiêm túc quy chế, bảo mật đề thi tuyệt đối."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Học sinh bị trùng số báo danh hoặc thiếu tên: Bấm `[Rà Soát Lỗi Phòng Thi]` $\rightarrow$ Hệ thống tự động phát hiện và đánh lại SBD theo đúng quy chuẩn chỉ trong 3 giây.
- **🔒 Bảo mật & Chữ ký số:** Ma trận phân công coi thi được niêm phong số và chỉ mở trước giờ thi 30 phút.

---

# CỤM 5: VẬN HÀNH CƠ SỞ VẬT CHẤT, TÀI CHÍNH & BÁO CÁO SỞ (OPERATIONS)

---

### MỤC 19: BÁO CÁO THỐNG KÊ QUỐC GIA EMIS & BGD
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/reports`. Thông tư 24/2018/TT-BGDĐT về hệ thống thống kê ngành Giáo dục.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Kết xuất các biểu mẫu thống kê định kỳ đầu năm, giữa năm, cuối năm (Quy mô trường lớp, đội ngũ cán bộ, chất lượng học sinh, cơ sở vật chất) nộp Phòng/Sở và Cổng EMIS Quốc gia.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Danh mục Biểu Mẫu Chuẩn EMIS`: Mẫu 1 (Tổng quan), Mẫu 2 (Học sinh), Mẫu 3 (Đội ngũ), Mẫu 4 (Cơ sở vật chất & Phòng học).
  - `Nút [📥 Tự Động Tổng Hợp Số Liệu]`: Quét toàn bộ hệ sinh thái để gom dữ liệu vào bảng biểu, không cần tính toán thủ công.
  - `Nút [📤 Kết Xuất File Nạp EMIS / Cổng Bộ GD&ĐT]`: Xuất file XML/Excel đúng định dạng nạp cổng cấp trên.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Chọn Kỳ báo cáo (Đầu năm học hoặc Cuối năm học).
  2. Bấm `[📥 Tự Động Tổng Hợp Số Liệu]`.
  3. Rà soát các số liệu đối sánh so với năm học trước.
  4. Bấm `[Ký Số Báo Cáo & Xuất Dữ Liệu Nạp Cổng Bộ]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Báo cáo số liệu thống kê chuẩn xác 100%, phản ánh trung thực quy mô phát triển giáo dục của nhà trường năm học 2026-2027."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Báo cáo bị báo lỗi lệch số liệu học sinh: Nhấp vào dòng báo lỗi $\rightarrow$ Hệ thống chỉ rõ tên học sinh chưa cập nhật diện cư trú $\rightarrow$ Nhấp sửa trực tiếp $\rightarrow$ Xuất lại báo cáo.
- **🔒 Bảo mật & Chữ ký số:** Báo cáo nộp cấp trên có chữ ký số của Hiệu trưởng và mã băm toàn vẹn SHA-256.

---

### MỤC 20: QUẢN LÝ HỌC PHÍ & HÓA ĐƠN ĐIỆN TỬ (FEES)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/fees`. Nghị định 81/2021/NĐ-CP và Quyết định 241/QĐ-TTg về thanh toán không dùng tiền mặt trong trường học.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Giám sát các khoản thu đầu năm, học phí theo tháng, tiền bán trú, bảo hiểm y tế; tích hợp cổng thanh toán VietQR và xuất hóa đơn điện tử tự động cho phụ huynh.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Bảng Theo Dõi Thu Chi Toàn Trường`: Tổng số phải thu, Đã thu (% và số tiền), Còn nợ, Miễn giảm theo chế độ chính sách.
  - `Nút [Tạo Đợt Thu Học Phí Mới]`: Cấu hình danh mục các khoản thu theo khối/lớp.
  - `Nút [Gửi Thông Báo Học Phí Kèm Mã VietQR]`: Đẩy thông báo kèm mã QR thanh toán động đến từng phụ huynh trên ứng dụng di động.
  - `Nút [Xuất Hóa Đơn Điện Tử Tự Động]`: Kết nối phần mềm hóa đơn điện tử (VNPT, Viettel, MISA) phát hành hóa đơn hợp lệ.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Đầu tháng: Tạo đợt thu học phí theo Nghị quyết HĐND tỉnh/thành phố.
  2. Bấm `[Gửi Thông Báo Học Phí Kèm Mã VietQR]` đến toàn bộ phụ huynh.
  3. Theo dõi tiền tự động gạch nợ thời gian thực khi phụ huynh chuyển khoản.
  4. Bấm `[Xuất Hóa Đơn Điện Tử]` cho các khoản đã thanh toán thành công.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Thực hiện nghiêm túc quy định công khai tài chính và thanh toán không dùng tiền mặt 100% qua cổng VietQR của nhà trường."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Phụ huynh chuyển khoản nhưng quên ghi mã học sinh: Kế toán đối chiếu số tiền và giờ giao dịch tại mục `[Giao Dịch Cần Khớp Nối]` $\rightarrow$ Chọn tên học sinh $\rightarrow$ Bấm [Xác Nhận Gạch Nợ Thủ Công].
- **🔒 Bảo mật & Chữ ký số:** Tích hợp tiêu chuẩn an toàn tài chính ngành ngân hàng (PCI DSS), bảo mật thông tin tài khoản nhà trường.

---

### MỤC 21: QUẢN TRỊ CƠ SỞ VẬT CHẤT & THIẾT BỊ (FACILITIES)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/facilities`. Thông tư 13/2020/TT-BGDĐT và Thông tư 14/2020/TT-BGDĐT về tiêu chuẩn cơ sở vật chất trường học.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Quản lý danh mục phòng học, phòng chức năng (Tin học, Ngoại ngữ, Thí nghiệm Lý - Hóa - Sinh), tình trạng trang thiết bị (máy chiếu, điều hòa, bàn ghế) và nhật ký mượn trả đồ dùng dạy học.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Sơ Đồ Tòa Nhà & Khối Phòng Học`: Trực quan hóa mặt bằng các dãy nhà A, B, C, tình trạng phòng đang sử dụng hay còn trống.
  - `Bảng Theo Dõi Thiết Bị Thí Nghiệm`: Số lượng thiết bị theo danh mục tối thiểu của Bộ GD&ĐT, tình trạng hoạt động (Tốt / Hỏng / Cần bảo trì).
  - `Nút [+ Báo Hỏng & Yêu Cầu Sửa Chữa]`: Tiếp nhận phản ánh từ giáo viên để chuyển nhân viên kỹ thuật khắc phục.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Kiểm tra tình trạng phòng học và thiết bị đầu mỗi học kỳ.
  2. Duyệt các yêu cầu mượn phòng chức năng phục vụ chuyên đề giảng dạy.
  3. Phê duyệt đề xuất bảo trì, mua sắm bổ sung thiết bị dạy học.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Phê duyệt kế hoạch bảo dưỡng định kỳ hệ thống máy chiếu và điều hòa 30 phòng học trước ngày 30/08."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Phòng học bị hỏng máy chiếu đột xuất trong giờ dạy: Giáo viên bấm báo hỏng trên ứng dụng $\rightarrow$ BGH điều phối chuyển lớp sang phòng dự phòng ngay trên sơ đồ phòng học chỉ bằng 1 thao tác kéo thả.
- **🔒 Bảo mật & Chữ ký số:** Hồ sơ tài sản công được quản lý mã QR định danh từng thiết bị phục vụ kiểm kê tài chính hằng năm.

---

### MỤC 22: QUẢN LÝ CÔNG VĂN & HỒ SƠ ĐIỆN TỬ (DOCUMENTS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/documents`. Nghị định 30/2020/NĐ-CP về công tác văn thư.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Quản lý sổ công văn đi, sổ công văn đến điện tử; phân công xử lý văn bản chỉ đạo của Sở/Phòng GD&ĐT; theo dõi tiến độ hoàn thành nhiệm vụ của các bộ phận.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Sổ Công Văn Đến`: Danh sách văn bản từ Sở/Bộ, Hạn xử lý, Cán bộ được phân công chủ trì.
  - `Sổ Công Văn Đi`: Quản lý văn bản phát hành của nhà trường kèm số hiệu và chữ ký số BGH.
  - `Nút [Phân Phối Xử Lý Văn Bản]`: Chuyển tiếp công văn cho Phó Hiệu trưởng hoặc Tổ trưởng kèm thời hạn hoàn thành.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Văn thư tiếp nhận công văn mới $\rightarrow$ BGH mở mục Công văn đến.
  2. Đọc nội dung văn bản chỉ đạo.
  3. Nhấp `[Phân Phối Xử Lý Văn Bản]` $\rightarrow$ Chọn cán bộ phụ trách (VD: Đ/c Phó Hiệu trưởng CM) $\rightarrow$ Đặt hạn nộp báo cáo.
  4. Theo dõi đèn trạng thái: Xanh (Đang xử lý đúng hạn), Đỏ (Sắp đến hạn/Quá hạn).
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Giao Đ/c Phó Hiệu trưởng nghiên cứu Công văn số 1234/SGDĐT-GDTrH, xây dựng Kế hoạch triển khai cấp trường và báo cáo BGH trước ngày 20/09."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Văn bản đến hạn nhưng cán bộ phụ trách chưa hoàn thành: Bấm nút `[Gửi Đôn Đốc Khẩn]` để gửi cảnh báo đỏ đến tài khoản của cán bộ đó.
- **🔒 Bảo mật & Chữ ký số:** Quản lý phân quyền độ mật của văn bản (Thường, Mật, Tuyệt mật) theo đúng Luật Bảo vệ bí mật nhà nước.

---

### MỤC 23: DANH MỤC TRƯỜNG & HẠ TẦNG HỆ SINH THÁI (SCHOOLS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/schools`. Căn cứ mã định danh trường học trên CSDL Ngành của Bộ GD&ĐT.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Quản lý thông tin pháp lý của nhà trường (Tên chính thức, Mã trường Bộ GD&ĐT, Địa chỉ, Số điện thoại, Email công vụ), phân hiệu trường và niên khóa quản lý.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Thông Tin Hồ Sơ Pháp Lý Nhà Trường`: Tên trường, Cấp học (THPT / THCS / Tiểu học), Chuẩn Quốc gia (Mức độ 1 / Mức độ 2).
  - `Cấu Hình Niên Khóa`: Thiết lập năm học hiện tại (VD: 2026-2027) và phân kỳ học kỳ (Học kỳ 1 / Học kỳ 2 / Hè).
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Đầu năm học: Kiểm tra thông tin pháp lý nhà trường.
  2. Cấu hình mốc thời gian bắt đầu và kết thúc của từng học kỳ theo Khung kế hoạch thời gian năm học do UBND Tỉnh ban hành.
  3. Bấm `[Lưu Thiết Lập Năm Học]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Cập nhật niên khóa 2026-2027 chuẩn xác theo Quyết định Khung kế hoạch năm học của UBND Tỉnh."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Cần xem lại dữ liệu học sinh của các năm học cũ: Nhấp vào menu chọn `[Niên Khóa]` ở góc trên $\rightarrow$ Chọn năm học (VD: 2024-2025). Hệ thống tự động chuyển sang chế độ xem lịch sử (Read-only).
- **🔒 Bảo mật & Chữ ký số:** Mọi thay đổi về cấu hình năm học đều được bảo vệ bằng mật khẩu quản trị cấp cao.

---

### MỤC 24: CÀI ĐẶT TRƯỜNG & TÍCH HỢP CHỮ KÝ SỐ BGH (SETTINGS)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/settings`. Nghị định 130/2018/NĐ-CP hướng dẫn Luật Giao dịch điện tử về chữ ký số và dịch vụ chứng thực chữ ký số.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Cấu hình biểu mẫu, tải lên con dấu mộc số điện tử của trường, cấu hình dịch vụ chữ ký số từ xa (SmartCA / Viettel-CA / VNPT-CA), logo trường và quy tắc làm tròn điểm.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Khung Cấu Hình Chữ Ký Số BGH`: Tích hợp chữ ký số Token USB hoặc Chữ ký số từ xa (Remote Signing / Cloud CA) không cần cắm USB.
  - `Khung Tải Lên Con Dấu Mộc Đỏ Điện Tử`: Định dạng PNG trong suốt để tự động đóng dấu khi ký duyệt học bạ/bằng cấp.
  - `Tùy chọn Quy Tắc Học Vụ`: Quy định thời gian khóa sổ điểm, quy tắc gửi SMS tự động khi vắng học.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Tải lên file ảnh con dấu mộc đỏ của nhà trường (ảnh PNG nền trong suốt).
  2. Kết nối tài khoản chữ ký số SmartCA của Hiệu trưởng và các Phó Hiệu trưởng.
  3. Bấm `[Kiểm Tra Chữ Ký Số]` để bảo đảm chứng thư số còn hạn sử dụng.
  4. Bấm `[Lưu Cài Đặt Hệ Thống]`.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Hoàn tất kết nối chứng thư số chuyên dùng BGH, sẵn sàng triển khai 100% ký số học bạ và giáo án không giấy tờ."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Chứng thư số hết hạn: Hệ thống cảnh báo trước 30 ngày. BGH chỉ cần cập nhật mã số chứng thư số mới tại khung cài đặt và bấm [Xác Nhận Kích Hoạt Lại].
- **🔒 Bảo mật & Chữ ký số:** Khóa bảo mật Private Key của chữ ký số được lưu giữ trên thiết bị an toàn bảo mật chuẩn HSM/FIPS 140-2.

---

### MỤC 25: THEO DÕI AN TOÀN HỆ THỐNG & SAO LƯU DỮ LIỆU (SYSTEM HEALTH)
- **📍 Vị trí & Căn cứ pháp lý:** Đường dẫn `/admin/system-health`. Nghị định 85/2016/NĐ-CP về bảo đảm an toàn hệ thống thông tin theo cấp độ.
- **🎯 Quyền hạn & Trách nhiệm BGH:** Kiểm tra tình trạng hoạt động máy chủ, dung lượng lưu trữ đám mây của trường, lịch sử sao lưu dữ liệu tự động hằng ngày và quy trình phòng chống thảm họa.
- **🎛️ Bảng giải nghĩa giao diện & Nút bấm:**
  - `Đồng Hồ Đo Tài Nguyên`: Dung lượng ổ đĩa đã dùng (cho giáo án, ảnh học bạ, video bài giảng), Tải CPU máy chủ, Tốc độ phản hồi mạng.
  - `Nhật Ký Sao Lưu (Backup Logs)`: Lịch tự động sao lưu lúc 02h00 sáng mỗi ngày.
  - `Nút [💾 Tải Bản Sao Lưu Dữ Liệu Trường Về Máy Tính BGH]`: Tải file mã hóa nén dữ liệu độc lập về ổ cứng máy tính cá nhân của Hiệu trưởng để lưu trữ ngoại tuyến an toàn tuyệt đối.
- **📝 Quy trình thao tác (Step-by-Step):**
  1. Định kỳ mỗi tháng 1 lần: Hiệu trưởng mở mục System Health.
  2. Kiểm tra dòng trạng thái "Sao lưu tự động gần nhất: Thành công lúc 02:00".
  3. Bấm nút `[💾 Tải Bản Sao Lưu Dữ Liệu Trường Về Máy Tính BGH]` để lưu 1 bản ngoại tuyến trên máy tính BGH.
- **✍️ Mẫu nhận xét / Lời phê chuẩn mực:** *"Dữ liệu nhà trường được sao lưu tự động đa vùng (Multi-region Cloud Backup), đảm bảo an toàn thông tin Cấp độ 3 theo tiêu chuẩn quốc gia."*
- **⚠️ Tình huống sự cố & Xử lý trong 10s:** Máy chủ trường học gặp sự cố đường truyền mạng: Hệ thống tự động chuyển hướng sang máy chủ dự phòng đám mây (Cloud Failover) trong vòng 3 giây, không làm gián đoạn việc dạy và học.
- **🔒 Bảo mật & Chữ ký số:** Bản sao lưu được mã hóa AES-256 bit, chỉ duy nhất khóa riêng của Hiệu trưởng mới có thể giải mã để khôi phục dữ liệu.

---

## 📊 BẢNG TỔNG HỢP 5 CỤM ĐIỀU HÀNH DÀNH CHO HIỆU TRƯỞNG

| Cụm điều hành | Số mục | Tần suất thao tác | Mốc thời gian trọng tâm | Kết quả bàn giao |
| :--- | :---: | :--- | :--- | :--- |
| **Cụm 1: Chỉ huy & Giám sát thời gian thực** | 05 | Hằng ngày (Daily) | 07h15 - 08h00 & 16h30 - 17h15 | Nắm vững 100% sĩ số, nề nếp, xử lý ca rủi ro học đường. |
| **Cụm 2: Quản trị chuyên môn & Ký duyệt bài dạy** | 05 | Hằng tuần (Weekly) | Thứ 6 & Thứ 7 hằng tuần | Ký duyệt giáo án CV 5512, ban hành TKB, quản trị tổ chuyên môn. |
| **Cụm 3: Đánh giá nhân sự & Thi đua viên chức** | 04 | Định kỳ / Cuối kỳ | Tháng 12 & Tháng 5 hằng năm | Đánh giá chuẩn nghề nghiệp TT15, quản lý hồ sơ và phân quyền. |
| **Cụm 4: Quản lý học sinh, Sổ điểm, Học bạ & Kỳ thi** | 04 | Định kỳ kiểm tra & Cuối năm | Tuần thi & Bế giảng năm học | Khóa sổ điểm TT22, Ký số học bạ toàn trường, tổ chức thi. |
| **Cụm 5: Vận hành cơ sở vật chất, Tài chính & Báo cáo** | 07 | Hằng tháng & Đầu năm | Đầu năm học & Các kỳ báo cáo Sở | Xuất báo cáo EMIS Bộ GD&ĐT, thu học phí VietQR, quản trị chữ ký số. |

---

*Tài liệu thuộc bản quyền Hệ thống Quản trị Giáo dục EduSmart • Phục vụ công tác chỉ đạo, điều hành của Ban Giám Hiệu các trường Mầm non, Tiểu học, THCS, THPT trên toàn quốc.*
