# 📘 KỊCH BẢN HƯỚNG DẪN CHI TIẾT TOÀN BỘ CHỨC NĂNG HỆ THỐNG EDUSMART
## NỀN TẢNG QUẢN LÝ GIÁO DỤC ĐỘT PHÁ CHUẨN BỘ GIÁO DỤC & ĐÀO TẠO

---

* **Đơn vị phát triển**: EduSmart Platform Solutions
* **Phiên bản chuẩn hóa**: 2.5 (Tương thích Thông tư 15/2020/TT-BGDĐT, Thông tư 22/2021/TT-BGDĐT & Nghị quyết 37/2025/NQ-CP)
* **Đối tượng sử dụng**: Ban Giám Hiệu, Cán bộ Quản lý Sở/Phòng, Tổ trưởng Chuyên môn, Giáo viên, Học sinh & Phụ huynh.
* **Quy chuẩn kịch bản**: Định dạng 4 thành phần (Ý nghĩa Nghiệp vụ $\rightarrow$ Thao tác Từng bước $\rightarrow$ Lời thoại MC Thuyết minh $\rightarrow$ Mẹo & Lưu ý Thực tế).

---

# MỤC LỤC TỔNG QUAN HỆ THỐNG

1. [PHẦN I: PHÂN HỆ DÀNH CHO BAN GIÁM HIỆU & QUẢN TRỊ VIÊN (ADMIN & PRINCIPAL)](#phan-i-ban-giam-hieu--quan-tri-vien)
   - [Mục 1: Bảng Điều Khiển Quản Trị & Điều Hành Thời Gian Thực](#muc-1-bang-dieu-khien-quan-tri)
   - [Mục 2: Đánh Giá Giáo Viên Chuẩn Nghề Nghiệp Thông Tư 15/2020/TT-BGDĐT](#muc-2-danh-gia-tt15)
   - [Mục 3: Quản Lý & Phê Duyệt Kế Hoạch Bài Dạy (Giáo Án) Điện Tử](#muc-3-duyet-giao-an)
   - [Mục 4: Trung Tâm AI Cảnh Báo Sớm Học Sinh Nguy Cơ](#muc-4-ai-canh-bao-som)
   - [Mục 5: Quản Lý Thời Khóa Biểu, Lịch Báo Giảng & Điều Phối Dạy Thay](#muc-5-thoi-khoa-bieu-day-thay)
   - [Mục 6: Giám Sát Sổ Đầu Bài Toàn Trường & Nhật Ký Giảng Dạy](#muc-6-giam-sat-so-dau-bai)
   - [Mục 7: Phân Tích Kỳ Thi, Phổ Điểm & Học Bạ Điện Tử](#muc-7-phan-tich-thi-hoc-ba)
   - [Mục 8: Hành Trình Học Sinh 360 & Hồ Sơ Số Toàn Diện](#muc-8-hanh-trinh-hoc-sinh-360)
   - [Mục 9: Quản Trị Cơ Sở Dữ Liệu Trường Học (Học sinh, Giáo viên, Lớp, Môn)](#muc-9-quan-tri-csdl-truong-hoc)
   - [Mục 10: Quản Trị Chiến Lược, Tuân Thủ NQ37 & Tài Chính Nhà Trường](#muc-10-chien-luoc-nq37-tai-chinh)

2. [PHẦN II: PHÂN HỆ DÀNH CHO GIÁO VIÊN & TỔ CHUYÊN MÔN (TEACHER & SUBJECT HEAD)](#phan-ii-giao-vien--to-chuyen-mon)
   - [Mục 1: Bảng Điều Khiển Giáo Viên & Lịch Báo Giảng Hằng Ngày](#muc-11-dashboard-giao-vien)
   - [Mục 2: Sơ Đồ Chỗ Ngồi Lớp Học Cinema Seating Tương Tác](#muc-12-cinema-seating)
   - [Mục 3: Sổ Đầu Bài & Nhật Ký Giảng Dạy Điện Tử](#muc-13-so-dau-bai-giao-vien)
   - [Mục 4: Điểm Danh Tiết Dạy & Báo Cáo Chuyên Cần Lớp Học](#muc-14-diem-danh-chuyen-can)
   - [Mục 5: Nhập Điểm, Đánh Giá Thường Xuyên & Định Kỳ](#muc-15-nhap-diem-danh-gia)
   - [Mục 6: Soạn Thảo & Nộp Kế Hoạch Bài Dạy (Giáo Án) Điện Tử](#muc-16-nop-giao-an-dien-tu)
   - [Mục 7: Duyệt Giáo Án & Đánh Giá Tiết Dạy Dành Cho Tổ Trưởng Chuyên Môn](#muc-17-to-truong-chuyen-mon)
   - [Mục 8: Quản Lý Lớp Chủ Nhiệm, Khen Thưởng & Nhật Ký Hành Trình 360](#muc-18-lop-chu-nhiem-khen-thuong)

3. [PHẦN III: PHÂN HỆ DÀNH CHO CÁN BỘ SỞ / PHÒNG GD&ĐT (DEPARTMENT & WARD)](#phan-iii-so--phong-gddt)
   - [Mục 1: Bảng Điều Khiển Toàn Ngành & Quản Lý Khối Trường THPT](#muc-19-so-gddt-dashboard)
   - [Mục 2: Điều Hành Mạng Lưới Tuyến Phường/Huyện & Trường Trực Thuộc](#muc-20-phong-gddt-mang-luoi)
   - [Mục 3: Báo Cáo Thống Kê Toàn Ngành & Kiểm Soát Chất Lượng Giáo Dục](#muc-21-bao-cao-toan-nganh)

4. [PHẦN IV: PHÂN HỆ DÀNH CHO HỌC SINH & PHỤ HUYNH (STUDENT & PARENT)](#phan-iv-hoc-sinh--phu-huynh)
   - [Mục 1: Bảng Tin Học Tập & Thông Tin Cá Nhân](#muc-22-bang-tin-hoc-sinh)
   - [Mục 2: Tra Cứu Thời Khóa Biểu & Lịch Học Hằng Tuần](#muc-23-tra-cuu-thoi-khoa-bieu)
   - [Mục 3: Xem Điểm Số, Bảng Điểm & Học Bạ Điện Tử](#muc-24-tra-cuu-diem-so)
   - [Mục 4: Theo Dõi Điểm Danh & Hành Trình Rèn Luyện 360](#muc-25-hanh-trinh-hoc-tap-360)

---

<a name="phan-i-ban-giam-hieu--quan-tri-vien"></a>
# PHẦN I: PHÂN HỆ DÀNH CHO BAN GIÁM HIỆU & QUẢN TRỊ VIÊN

---

<a name="muc-1-bang-dieu-khien-quan-tri"></a>
## MỤC 1: BẢNG ĐIỀU KHIỂN QUẢN TRỊ & ĐIỀU HÀNH THỜI GIAN THỰC
* **Đường dẫn truy cập**: `/admin/dashboard` hoặc `/admin/strategy/dashboard`
* **Đối tượng**: Hiệu Trưởng, Phó Hiệu Trưởng, Thư Ký Hội Đồng.

### 1. Ý nghĩa & Nghiệp vụ
* Cung cấp bức tranh toàn cảnh về hoạt động dạy và học trong ngày của toàn trường theo thời gian thực (Real-time).
* Giúp Lãnh đạo nắm bắt ngay tỷ lệ chuyên cần học sinh, số tiết đã dạy, hồ sơ giáo án đang chờ duyệt, và các cảnh báo khẩn cấp từ AI mà không cần chờ báo cáo giấy cuối tuần.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Đăng nhập tài khoản Ban Giám Hiệu, hệ thống tự động chuyển đến màn hình `/admin/dashboard`.
2. **Bước 2**: Quan sát 4 thẻ chỉ số KPI tổng quan ở hàng đầu tiên:
   - **Tổng số Học sinh & Lớp học**: Sĩ số toàn trường, số học sinh có mặt hôm nay.
   - **Tỷ lệ Chuyên cần**: Tỷ lệ phần trăm có mặt (VD: `98.4%`), số học sinh vắng có phép và không phép.
   - **Tiến độ Giảng dạy trong ngày**: Tổng số tiết phân công hôm nay, số tiết giáo viên đã ghi sổ đầu bài xong.
   - **Hồ sơ cần xử lý ngay**: Số giáo án đang chờ BGH phê duyệt và số cảnh báo AI cấp độ Cao.
3. **Bước 3**: Nhấp vào biểu đồ **"Phân Bố Chất Lượng & Chuyên Cần Theo Khối"** để lọc xem chi tiết Khối 10, Khối 11 hoặc Khối 12.
4. **Bước 4**: Cuộn xuống mục **"Nhật Ký Hoạt Động & Sự Cố Trong Ngày"** để kiểm tra các thông báo mới nhất từ các lớp.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Kính thưa Ban Giám Hiệu và Quý Thầy Cô! Ngay khi đăng nhập vào hệ thống EduSmart, Bảng điều khiển Quản trị thời gian thực sẽ mở ra trước mắt Thầy Cô bức tranh toàn diện nhất về nhà trường. Không còn phải chờ đợi những tập báo cáo giấy tổng hợp vào cuối tuần, mọi chỉ số từ tỷ lệ chuyên cần 98.4%, số tiết dạy đã hoàn thành trong ngày, cho đến các hồ sơ giáo án đang chờ phê duyệt đều được cập nhật tức thì theo từng giây. Chỉ với một cú nhấp chuột, Thầy Cô có thể nắm trọn nhịp đập của toàn trường mọi lúc, mọi nơi trên máy tính hay điện thoại thông minh."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tự động làm mới**: Màn hình tự động cập nhật số liệu mỗi 60 giây. Thầy Cô có thể bấm biểu tượng `🔄 Làm mới` ở góc phải trên cùng để tải dữ liệu ngay lập tức.
* **Bộ lọc nhanh thời gian**: Dùng menu thả xuống để chuyển đổi góc nhìn giữa `Hôm nay`, `Tuần này`, hoặc `Tháng hiện tại`.

---

<a name="muc-2-danh-gia-tt15"></a>
## MỤC 2: ĐÁNH GIÁ GIÁO VIÊN CHUẨN NGHỀ NGHIỆP THÔNG TƯ 15/2020/TT-BGDĐT
* **Đường dẫn truy cập**: `/admin/tt15-evaluation` hoặc `/vice-principal/tt15-evaluation`
* **Đối tượng**: Hiệu Trưởng, Phó Hiệu Trưởng chuyên môn, Chủ tịch Công đoàn.

### 1. Ý nghĩa & Nghiệp vụ
* Số hóa 100% quy trình đánh giá chuẩn nghề nghiệp giáo viên cơ sở giáo dục phổ thông theo đúng 5 Tiêu chuẩn và 15 Tiêu chí quy định tại Thông tư số 15/2020/TT-BGDĐT.
* Tự động áp dụng thuật toán logic xếp loại chuẩn Bộ GD&ĐT (Xuất sắc, Khá, Đạt, Chưa đạt), loại bỏ hoàn toàn việc tính toán thủ công và sai sót biên bản.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Truy cập menu **"Đánh Giá Nhân Sự"** $\rightarrow$ chọn **"Chuẩn Nghề Nghiệp TT15/2020"**.
2. **Bước 2**: Tại danh sách giáo viên, nhấp nút `[+ Tạo Phiếu Đánh Giá]` hoặc bấm `[Chấm điểm]` tại tên giáo viên cần đánh giá (VD: *Thầy Nguyễn Văn A - Tổ Toán*).
3. **Bước 3**: Giao diện hiển thị 5 Tiêu chuẩn gồm 15 Tiêu chí:
   - *Tiêu chuẩn 1*: Phẩm chất nhà giáo (Tiêu chí 1: Đạo đức nhà giáo, Tiêu chí 2: Phong cách nhà giáo).
   - *Tiêu chuẩn 2*: Phát triển chuyên môn, nghiệp vụ (Tiêu chí 3 đến Tiêu chí 7).
   - *Tiêu chuẩn 3*: Xây dựng môi trường giáo dục (Tiêu chí 8 đến Tiêu chí 10).
   - *Tiêu chuẩn 4*: Phát triển mối quan hệ nhà trường, gia đình và xã hội (Tiêu chí 11 đến Tiêu chí 13).
   - *Tiêu chuẩn 5*: Sử dụng ngoại ngữ hoặc tiếng dân tộc, ứng dụng CNTT (Tiêu chí 14 và Tiêu chí 15).
4. **Bước 4**: Chọn mức đánh giá cho từng tiêu chí bằng cách nhấp chọn: `Tốt` (3 điểm), `Khá` (2 điểm), hoặc `Đạt` (1 điểm).
5. **Bước 5**: Nhập nhận xét tóm tắt và minh chứng vào ô ghi chú $\rightarrow$ Hệ thống tự động tính tổng điểm và hiển thị kết quả xếp loại: `XUẤT SẮC`.
6. **Bước 6**: Nhấp nút `[Lưu & Phê Duyệt Kết Quả]` $\rightarrow$ Nhấp `[Xuất Biên Bản PDF]` để in biên bản đánh giá chuẩn mẫu.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Kính thưa Ban Giám Hiệu, công tác đánh giá chuẩn nghề nghiệp giáo viên hằng năm luôn là một quy trình đòi hỏi sự công tâm, tỉ mỉ và tốn nhiều công sức sổ sách. Phân hệ Đánh giá TT15 của EduSmart đã số hóa trọn vẹn 5 tiêu chuẩn và 15 tiêu chí theo đúng quy định của Thông tư 15/2020/TT-BGDĐT. Ban Giám Hiệu chỉ cần chấm điểm trực quan cho từng tiêu chí, hệ thống sẽ tự động tính toán tổng điểm, đối chiếu điều kiện xếp loại Xuất sắc, Khá hay Đạt theo thuật toán thông minh và xuất ngay biên bản đánh giá chuẩn mẫu gửi về Sở Giáo dục trong vài giây."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Quy tắc xếp loại Xuất sắc**: Theo TT15, để đạt loại Xuất sắc thì tất cả 15 tiêu chí phải từ mức Khá trở lên, trong đó có ít nhất 10 tiêu chí đạt mức Tốt (bao gồm bắt buộc các tiêu chí 3, 4, 8, 9). Hệ thống đã tự động khóa điều kiện này giúp tránh sai luật.
* **Đính kèm minh chứng**: Giáo viên có thể tự tải file chứng chỉ, bằng khen lên hệ thống trước, Ban Giám Hiệu chỉ việc nhấp biểu tượng chiếc kẹp ghim `📎` để xem minh chứng trực tiếp trước khi chấm điểm.

---

<a name="muc-3-duyet-giao-an"></a>
## MỤC 3: QUẢN LÝ & PHÊ DUYỆT KẾ HOẠCH BÀI DẠY (GIÁO ÁN) ĐIỆN TỬ
* **Đường dẫn truy cập**: `/admin/lesson-plans` hoặc `/admin/approvals`
* **Đối tượng**: Ban Giám Hiệu, Tổ trưởng Chuyên môn.

### 1. Ý nghĩa & Nghiệp vụ
* Chấm dứt tình trạng in ấn giáo án giấy tốn kém, cồng kềnh; chuyển đổi sang quy trình nộp, thẩm định và phê duyệt giáo án điện tử có ký số xác nhận.
* Giúp BGH và Tổ trưởng theo dõi chính xác tiến độ nộp bài của từng giáo viên, góp ý trực tiếp trên từng trang bài giảng.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Học Vụ & Chuyên Môn"** $\rightarrow$ chọn **"Duyệt Kế Hoạch Bài Dạy"**.
2. **Bước 2**: Bộ lọc danh sách hiển thị các trạng thái: `Chờ duyệt`, `Đã duyệt`, `Yêu cầu chỉnh sửa`.
3. **Bước 3**: Nhấp vào một giáo án đang chờ (VD: *Kế hoạch bài dạy Tuần 12 - Môn Toán 10 - Giáo viên Trần Thị B*).
4. **Bước 4**: Màn hình xem trước (Preview) file giáo án Word/PDF mở ra trực tiếp trong trình duyệt.
5. **Bước 5**: Thực hiện phê duyệt:
   - Nếu đạt yêu cầu: Nhấp nút màu xanh `[✅ Phê Duyệt Giáo Án]`.
   - Nếu cần sửa: Nhập nhận xét vào ô phản hồi (VD: *"Bổ sung câu hỏi thảo luận nhóm ở Hoạt động 3"*) $\rightarrow$ Nhấp nút `[⚠️ Yêu Cầu Chỉnh Sửa]`.
6. **Bước 6**: Giáo viên sẽ nhận ngay thông báo (Push notification) về kết quả duyệt trên tài khoản cá nhân.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Việc kiểm duyệt kế hoạch bài dạy trước mỗi tuần lên lớp giờ đây trở nên nhẹ nhàng và chuyên nghiệp hơn bao giờ hết. Với phân hệ Duyệt giáo án điện tử của EduSmart, Thầy Cô quản lý có thể xem trước nội dung bài dạy trực tuyến, đối chiếu với khung phân phối chương trình, và thực hiện phê duyệt chỉ với một nút bấm. Mọi ý kiến đóng góp chuyên môn của Tổ trưởng hay Ban Giám Hiệu được gửi phản hồi tức thì về điện thoại của giáo viên, đảm bảo tính liên tục và nâng cao chất lượng từng giờ lên lớp."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Duyệt hàng loạt (Batch Approval)**: Khi Tổ trưởng đã thẩm định xong, BGH có thể tích chọn nhiều giáo án cùng lúc và bấm nút `[Duyệt Nhanh Các Mục Đã Chọn]` ở thanh công cụ phía trên.
* **Lịch sử phiên bản**: Mỗi lần giáo viên nộp lại bản sửa, hệ thống tự lưu lịch sử các phiên bản v1, v2 để BGH dễ dàng so sánh điểm thay đổi.

---

<a name="muc-4-ai-canh-bao-som"></a>
## MỤC 4: TRUNG TÂM AI CẢNH BÁO SỚM HỌC SINH NGUY CƠ (AI EARLY WARNINGS)
* **Đường dẫn truy cập**: `/admin/early-warnings` hoặc `/admin/principal-ai`
* **Đối tượng**: Ban Giám Hiệu, Giáo viên Chủ nhiệm, Cán bộ Tư vấn Tâm lý Học đường.

### 1. Ý nghĩa & Nghiệp vụ
* Ứng dụng Trí tuệ Nhân tạo (Machine Learning) để quét và phân tích đa chiều dữ liệu: điểm số thường xuyên, số buổi vắng học, thái độ học tập và nền tảng gia đình.
* Tự động phát hiện sớm nguy cơ học sinh sa sút học lực, có nguy cơ bỏ học hoặc gặp khủng hoảng tâm lý từ 2-4 tuần trước khi kỳ thi diễn ra, giúp nhà trường can thiệp kịp thời.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Trí Tuệ Nhân Tạo"** $\rightarrow$ chọn **"Trung Tâm Cảnh Báo Sớm AI"**.
2. **Bước 2**: Màn hình hiển thị danh sách cảnh báo được phân loại theo mức độ nghiêm trọng:
   - 🔴 **Cấp độ Đỏ (Cao)**: Nguy cơ bỏ học hoặc điểm trung bình giảm > 2.5 điểm.
   - 🟡 **Cấp độ Vàng (Trung bình)**: Vắng không phép 2 buổi liên tiếp hoặc điểm kiểm tra dưới 5.0.
   - 🟢 **Cấp độ Xanh (Theo dõi)**: Có dấu hiệu mất tập trung hoặc giảm tương tác lớp học.
3. **Bước 3**: Nhấp vào hồ sơ học sinh (VD: *Em Lê Hoàng Nam - Lớp 10A1 - Cảnh báo Chuyên cần & Học lực*).
4. **Bước 4**: Màn hình chi tiết phân tích biểu đồ suy giảm và đưa ra **"Khuyến nghị can thiệp thông minh từ AI"**:
   - *Gợi ý 1*: Giáo viên chủ nhiệm liên hệ phụ huynh trong 24 giờ.
   - *Gợi ý 2*: Phân công học sinh khá giỏi hỗ trợ môn Toán và Vật lý.
   - *Gợi ý 3*: Đặt lịch hẹn với phòng tư vấn tâm lý học đường.
5. **Bước 5**: Nhấp nút `[Phân Công Xử Lý]` $\rightarrow$ Chọn Giáo viên Chủ nhiệm tiếp nhận $\rightarrow$ Nhấp `[Gửi Chỉ Đạo]`.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Thưa Thầy Cô, một trong những tính năng đột phá và nhân văn nhất của EduSmart chính là Trung tâm Cảnh báo sớm AI Early Warnings. Bằng cách phân tích tự động chuỗi dữ liệu điểm số, chuyên cần và thái độ học tập, hệ thống sẽ nhận diện sớm các em học sinh có nguy cơ sa sút hoặc có dấu hiệu bất thường trước nhiều tuần. Ban Giám Hiệu và Thầy Cô chủ nhiệm sẽ nhận được khuyến nghị can thiệp cụ thể, kịp thời đồng hành cùng gia đình để không một học sinh nào bị bỏ lại phía sau."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tùy biến ngưỡng AI**: BGH có thể vào mục `/admin/ai-config` để tùy chỉnh mức độ nhạy cảm của AI (ví dụ: cảnh báo khi học sinh vắng từ 3 buổi trở lên hoặc điểm dưới 4.5).

---

<a name="muc-5-thoi-khoa-bieu-day-thay"></a>
## MỤC 5: QUẢN LÝ THỜI KHÓA BIỂU, LỊCH BÁO GIẢNG & ĐIỀU PHỐI DẠY THAY
* **Đường dẫn truy cập**: `/admin/schedule` và `/admin/substitute-dispatch`
* **Đối tượng**: Ban Giám Hiệu, Thư ký xếp Thời khóa biểu.

### 1. Ý nghĩa & Nghiệp vụ
* Quản lý thuật toán xếp thời khóa biểu thông minh với các ràng buộc cứng của ngành giáo dục: Chào cờ sáng Thứ Hai Tiết 1, Sinh hoạt lớp Thứ Bảy Tiết 4, chống trùng giáo viên và phòng chức năng.
* Xử lý bài toán đột xuất: Khi giáo viên xin nghỉ ốm/công tác, hệ thống tự động tìm kiếm giáo viên cùng bộ môn đang có giờ trống để điều phối dạy thay trong 30 giây.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Vào menu **"Thời Khóa Biểu"** $\rightarrow$ chọn **"Điều Phối Dạy Thay"** (`/admin/substitute-dispatch`).
2. **Bước 2**: Nhấp nút `[+ Tiếp Nhận Báo Vắng]`.
3. **Bước 3**: Chọn tên giáo viên vắng (VD: *Cô Nguyễn Thị Mai - Môn Ngữ Văn*), chọn ngày vắng và các tiết bị trống (VD: *Thứ Ba - Tiết 2 Lớp 10A2, Tiết 3 Lớp 10A3*).
4. **Bước 4**: Hệ thống tự động quét danh sách giáo viên môn Ngữ Văn đang trống tiết vào thời điểm đó $\rightarrow$ Đề xuất 2 giáo viên phù hợp nhất.
5. **Bước 5**: Chọn giáo viên dạy thay (VD: *Cô Phạm Thu Hà*) $\rightarrow$ Nhấp `[Xác Nhận & Gửi Lệnh Dạy Thay]`.
6. **Bước 6**: Lịch báo giảng của cả 2 giáo viên và Sổ đầu bài của các lớp liên quan được tự động cập nhật ngay lập tức.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Việc điều phối dạy thay khi giáo viên đột xuất có việc bận hay ốm đau từng là nỗi đau đầu của các Thầy Cô quản lý học vụ. Với phân hệ Điều phối dạy thay thông minh trên EduSmart, hệ thống sẽ tự động quét ma trận thời khóa biểu, tìm ra giáo viên cùng bộ môn có giờ trống phù hợp nhất và tự động cập nhật lại sổ đầu bài, lịch báo giảng chỉ trong 30 giây. Mọi thông báo được gửi trực tiếp đến ứng dụng của giáo viên, giúp hoạt động giảng dạy của trường luôn diễn ra nhịp nhàng, thông suốt."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tính toán chế độ dạy thay**: Hệ thống tự động ghi nhận số tiết dạy thay vào bảng chấm công của giáo viên để phục vụ tính thừa giờ cuối học kỳ.

---

<a name="muc-6-giam-sat-so-dau-bai"></a>
## MỤC 6: GIÁM SÁT SỔ ĐẦU BÀI TOÀN TRƯỜNG & NHẬT KÝ GIẢNG DẠY
* **Đường dẫn truy cập**: `/admin/journals` và `/admin/daily-reports`
* **Đối tượng**: Ban Giám Hiệu, Ban Thi Đua Nhà Trường.

### 1. Ý nghĩa & Nghiệp vụ
* Thay thế hoàn toàn cuốn sổ đầu bài bằng giấy dễ rách nát, thất lạc và chậm trễ.
* Giám sát trực tiếp giáo viên nào đã vào lớp đúng giờ, đã ghi sổ đầu bài tiết dạy chưa, nhận xét tiết học loại Tốt, Khá hay Trung bình.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Sổ Sách Điện Tử"** $\rightarrow$ chọn **"Sổ Đầu Bài Toàn Trường"**.
2. **Bước 2**: Chọn ngày cần kiểm tra trên lịch và chọn Khối/Lớp.
3. **Bước 3**: Bảng ma trận hiển thị đầy đủ các tiết học từ Tiết 1 đến Tiết 5 (Sáng/Chiều):
   - Ô màu xanh lá: Tiết học đã ghi sổ đầy đủ (Sĩ số, Tên bài dạy, Nhận xét, Điểm tiết).
   - Ô màu cam nhấp nháy: Tiết học đã kết thúc nhưng giáo viên chưa ký sổ đầu bài.
   - Ô màu xám: Tiết trống / Chưa đến giờ dạy.
4. **Bước 4**: Nhấp vào một tiết học để xem chữ ký số và nhận xét chi tiết của giáo viên bộ môn.
5. **Bước 5**: Nhấp nút `[🔔 Nhắc Nhở Ký Sổ]` để gửi thông báo tự động đến những giáo viên quên ký sổ sau buổi dạy.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Sổ đầu bài điện tử EduSmart là cuộc cách mạng xóa bỏ hoàn toàn việc mang vác những cuốn sổ giấy cồng kềnh. Ngay tại phòng làm việc, Ban Giám Hiệu có thể theo dõi tiến độ lên lớp của từng thầy cô theo thời gian thực. Tiết học nào diễn ra suôn sẻ, lớp nào có học sinh vắng, bài học nào đã được hoàn thành đều hiển thị rõ ràng trên bảng điều khiển trung tâm, mang lại tính minh bạch và kỷ cương tuyệt đối cho nhà trường."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Khóa dữ liệu tự động (Data Lock)**: Sau 23h59 hằng ngày, sổ đầu bài sẽ tự động khóa để bảo đảm tính trung thực, chỉ có BGH mới có quyền mở khóa chỉnh sửa nếu có lý do chính đáng.

---

<a name="muc-7-phan-tich-thi-hoc-ba"></a>
## MỤC 7: PHÂN TÍCH KỲ THI, PHỔ ĐIỂM & HỌC BẠ ĐIỆN TỬ
* **Đường dẫn truy cập**: `/admin/exam-analytics` và `/admin/transcripts`
* **Đối tượng**: Ban Giám Hiệu, Tổ trưởng Chuyên môn, Thư ký Điểm.

### 1. Ý nghĩa & Nghiệp vụ
* Tự động tổng hợp điểm số từ các tổ bộ môn theo đúng Quy chế đánh giá học sinh của Thông tư 22/2021/TT-BGDĐT (và TT58 đối với các lớp cũ).
* Vẽ biểu đồ phổ điểm hình chuông, phân tích độ lệch chuẩn, so sánh chất lượng giữa các lớp cùng khối để BGH có căn cứ điều chỉnh phương pháp dạy học.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Khảo Thí & Đánh Giá"** $\rightarrow$ chọn **"Phân Tích Phổ Điểm Kỳ Thi"**.
2. **Bước 2**: Chọn Kỳ thi (VD: *Khảo sát chất lượng Giữa Học kỳ 1*) và chọn Môn thi (VD: *Môn Toán Khối 10*).
3. **Bước 3**: Màn hình tự động kết xuất:
   - **Biểu đồ Phổ điểm (Score Distribution)**: Phân bố số lượng bài thi từ 0 đến 10 điểm.
   - **Thống kê Chất lượng**: Tỷ lệ Giỏi (≥ 8.0), Khá (6.5 - 7.9), Đạt (5.0 - 6.4), Chưa đạt (< 5.0).
   - **Bảng so sánh giữa các lớp**: Lớp 10A1 (Điểm TB: 8.2) vs Lớp 10A2 (Điểm TB: 7.1).
4. **Bước 4**: Chuyển sang mục **"Học Bạ Điện Tử"** (`/admin/transcripts`) để kiểm tra tiến trình ký số học bạ số hóa toàn trường.
5. **Bước 5**: Nhấp nút `[Xuất Báo Cáo EMIS]` để tải file Excel chuẩn định dạng nộp lên Cổng dữ liệu ngành của Bộ GD&ĐT.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Công tác khảo thí và phân tích chất lượng đào tạo giờ đây được nâng lên một tầm cao mới nhờ các công cụ phân tích dữ liệu trực quan của EduSmart. Hệ thống tự động vẽ biểu đồ phổ điểm, phân loại học lực theo đúng Thông tư 22, và chỉ ra chính xác những mảng kiến thức học sinh còn yếu kém. Không cần mất hàng tuần nhập liệu thủ công, Ban Giám Hiệu đã có trong tay những báo cáo phân tích sắc bén để chỉ đạo chuyên môn một cách hiệu quả và khoa học nhất."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tương thích cổng Cơ sở dữ liệu ngành**: Dữ liệu điểm và học bạ xuất ra khớp 100% cấu trúc file mẫu của Cục CNTT - Bộ GD&ĐT, đồng bộ 1 chạm không cần chỉnh sửa định dạng cột.

---

<a name="muc-8-hanh-trinh-hoc-sinh-360"></a>
## MỤC 8: HÀNH TRÌNH HỌC SINH 360 & HỒ SƠ SỐ TOÀN DIỆN
* **Đường dẫn truy cập**: `/admin/journey-overview` và `/admin/journey-config`
* **Đối tượng**: Ban Giám Hiệu, Giáo viên Chủ nhiệm, Phụ huynh.

### 1. Ý nghĩa & Nghiệp vụ
* Lưu trữ hồ sơ số liên tục của học sinh suốt 3 năm cấp 3 (hoặc 4 năm cấp 2): từ điểm số, hạnh kiểm, kết quả rèn luyện thể chất, giải thưởng thi đua, đến các ghi chú tâm lý và định hướng nghề nghiệp.
* Cung cấp góc nhìn 360 độ (Student 360 Journey) giúp định hướng nghề nghiệp và xây dựng học bạ điện tử cá nhân hóa.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Quản Lý Học Sinh"** $\rightarrow$ chọn **"Hành Trình Học Sinh 360"**.
2. **Bước 2**: Nhập mã định danh học sinh hoặc họ tên vào ô tìm kiếm (VD: *Lê Hoàng Nam*).
3. **Bước 3**: Giao diện Timeline Hành trình học tập hiển thị dạng dòng thời gian sinh động:
   - **Năm lớp 10**: Tham gia CLB Tin học, Đạt giải Ba Học sinh giỏi Toán cấp trường, Tỷ lệ chuyên cần 99%.
   - **Năm lớp 11**: Tham gia Hoạt động trải nghiệm hướng nghiệp, Điểm rèn luyện Tốt.
   - **Năm lớp 12**: Định hướng khối ngành Kỹ thuật Công nghệ, Điểm IELTS 6.5.
4. **Bước 4**: Nhấp nút `[Xuất Hồ Sơ Hành Trình PDF]` để gửi tặng học sinh và phụ huynh làm kỷ yếu quá trình trưởng thành.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Mỗi học sinh bước qua cánh cổng nhà trường là một hành trình trưởng thành quý giá. Tính năng Hành trình học sinh 360 độc quyền của EduSmart giúp lưu giữ trọn vẹn từng cột mốc đáng nhớ: từ những điểm số xuất sắc, giải thưởng thi đua, đến các hoạt động ngoại khóa và năng khiếu cá nhân. Đây không chỉ là học bạ điện tử, mà là bệ phóng vững chắc giúp các em tự tin định hướng tương lai và mở rộng cánh cửa đại học."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Bảo mật phân quyền**: Thông tin nhạy cảm về tâm lý hay hoàn cảnh gia đình đặc biệt chỉ có BGH và Giáo viên Chủ nhiệm mới có quyền xem, học sinh khác không thể truy cập.

---

<a name="muc-9-quan-tri-csdl-truong-hoc"></a>
## MỤC 9: QUẢN TRỊ CƠ SỞ DỮ LIỆU TRƯỜNG HỌC (CSDL)
* **Đường dẫn truy cập**: `/admin/students`, `/admin/teachers`, `/admin/classes`, `/admin/subjects`, `/admin/subject-groups`
* **Đối tượng**: Quản trị viên hệ thống (Admin), Cán bộ Văn phòng / Học vụ.

### 1. Ý nghĩa & Nghiệp vụ
* Quản lý toàn bộ cơ sở dữ liệu gốc của nhà trường: danh mục khối lớp, môn học, tổ chuyên môn, phân công giảng dạy và hồ sơ cán bộ giáo viên.
* Cho phép nhập/xuất dữ liệu hàng loạt bằng file Excel, đồng bộ hai chiều với cơ sở dữ liệu ngành.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Cơ Sở Dữ Liệu"** $\rightarrow$ chọn phân hệ cần quản lý (VD: `Quản lý Giáo Viên` hoặc `Quản lý Học Sinh`).
2. **Bước 2**: Để thêm danh sách hàng loạt: Nhấp nút `[📥 Nhập Từ Excel]` $\rightarrow$ Chọn file Excel danh sách học sinh theo mẫu $\rightarrow$ Nhấp `[Kiểm Tra Dữ Liệu]`.
3. **Bước 3**: Hệ thống tự động kiểm tra trùng lặp mã định danh, số điện thoại, ngày sinh và báo xanh các dòng hợp lệ.
4. **Bước 4**: Nhấp `[Xác Nhận Nạp Dữ Liệu]` $\rightarrow$ Hệ thống tự động khởi tạo tài khoản và phân lớp cho toàn bộ học sinh trong 5 giây.
5. **Bước 5**: Vào mục **"Phân Công Chuyên Môn"** để gán giáo viên dạy môn nào, lớp nào trong học kỳ mới.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Khởi tạo dữ liệu đầu năm học chưa bao giờ dễ dàng đến thế! Với bộ công cụ Quản trị CSDL thông minh của EduSmart, cán bộ văn phòng có thể nhập hàng ngàn hồ sơ học sinh, phân lớp và phân công giảng dạy chỉ bằng một thao tác kéo thả file Excel. Hệ thống tự động kiểm tra tính hợp lệ của dữ liệu, cấp tài khoản bảo mật cho từng thầy cô và phụ huynh, giúp nhà trường sẵn sàng vận hành năm học mới chỉ trong vòng 15 phút."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Mẫu file Excel chuẩn**: Luôn tải file mẫu bằng nút `[Tải File Mẫu Excel]` trên giao diện để đảm bảo chuẩn thứ tự cột trước khi điền dữ liệu.

---

<a name="muc-10-chien-luoc-nq37-tai-chinh"></a>
## MỤC 10: QUẢN TRỊ CHIẾN LƯỢC, TUÂN THỦ NQ37 & TÀI CHÍNH NHÀ TRƯỜNG
* **Đường dẫn truy cập**: `/admin/strategy/quality-goals`, `/admin/nq37-compliance`, `/admin/finance`
* **Đối tượng**: Hiệu Trưởng, Kế toán trưởng, Hội đồng trường.

### 1. Ý nghĩa & Nghiệp vụ
* Giám sát các chỉ số chất lượng giáo dục đạt chuẩn Quốc gia và các tiêu chí kiểm định chất lượng theo Nghị quyết số 37/2025/NQ-CP về chuyển đổi số giáo dục.
* Quản lý minh bạch nguồn thu học phí số, các khoản thu tự nguyện, tài trợ giáo dục và quyết toán ngân sách công khai.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Chiến Lược & Tuân Thủ"** $\rightarrow$ chọn **"Tuân Thủ Nghị Quyết 37"** (`/admin/nq37-compliance`).
2. **Bước 2**: Màn hình Dashboard kiểm tra chỉ số tuân thủ 4 trụ cột: Hạ tầng số, Học liệu số, Quản trị số, và Kỹ năng số.
3. **Bước 3**: Nhấp menu **"Quản Lý Tài Chính & Học Phí"** (`/admin/finance`) để theo dõi tình hình thu nộp học phí qua cổng thanh toán không dùng tiền mặt (QR Code ngân hàng / VietQR).
4. **Bước 4**: Nhấp nút `[Xuất Báo Cáo Tài Chính Công Khai]` để in biểu mẫu niêm yết theo đúng thông tư tài chính giáo dục.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Đảm bảo sự minh bạch trong tài chính và tuân thủ các chuẩn mực chuyển đổi số quốc gia là chìa khóa xây dựng uy tín nhà trường. Phân hệ Quản trị chiến lược và Tài chính số của EduSmart giúp Ban Giám Hiệu theo dõi sát sao lộ trình đạt chuẩn kiểm định chất lượng, đồng thời tự động hóa toàn bộ việc thu nộp học phí không dùng tiền mặt, mang lại sự tiện lợi tối đa cho phụ huynh và sự minh bạch tuyệt đối cho nhà trường."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tích hợp hóa đơn điện tử**: Hệ thống có khả năng xuất hóa đơn điện tử tự động ngay khi phụ huynh quét mã QR thanh toán thành công.

---

<a name="phan-ii-giao-vien--to-chuyen-mon"></a>
# PHẦN II: PHÂN HỆ DÀNH CHO GIÁO VIÊN & TỔ CHUYÊN MÔN

---

<a name="muc-11-dashboard-giao-vien"></a>
## MỤC 11: BẢNG ĐIỀU KHIỂN GIÁO VIÊN & LỊCH BÁO GIẢNG HẰNG NGÀY
* **Đường dẫn truy cập**: `/teacher/dashboard` và `/teacher/daily-report`
* **Đối tượng**: Tất cả Giáo viên Bộ môn và Giáo viên Chủ nhiệm.

### 1. Ý nghĩa & Nghiệp vụ
* Trợ lý ảo làm việc hằng ngày của Thầy Cô: tổng hợp lịch dạy hôm nay, tiết dạy tiếp theo ở phòng học nào, các thông báo khẩn từ BGH và danh sách việc cần làm.
* Tự động tạo Sổ báo giảng theo tuần từ dữ liệu phân phối chương trình, xóa bỏ hoàn toàn việc viết tay sổ báo giảng mỗi tuần.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Giáo viên đăng nhập tài khoản $\rightarrow$ Hệ thống mở ngay màn hình Bảng điều khiển cá nhân `/teacher/dashboard`.
2. **Bước 2**: Xem thẻ **"Tiết Dạy Hôm Nay"**: Hiển thị rõ danh sách các tiết dạy trong buổi (VD: *Tiết 1: Lớp 10A1 - Phòng 201; Tiết 3: Lớp 10A3 - Phòng 203*).
3. **Bước 3**: Nhấp nút `[Đi Đến Tiết Dạy]` ngay tại tiết học để mở Sơ đồ lớp hoặc Sổ đầu bài của lớp đó.
4. **Bước 4**: Vào mục **"Sổ Báo Giảng"** (`/teacher/daily-report`) $\rightarrow$ Chọn Tuần học $\rightarrow$ Bấm `[Tự Động Điền Bài Dạy]` $\rightarrow$ Nhấp `[Nộp Sổ Báo Giảng Cho Tổ Trưởng]`.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Chào mừng Quý Thầy Cô đến với không gian làm việc số EduSmart! Ngay tại trang chủ cá nhân, Thầy Cô sẽ có ngay một trợ lý đắc lực đồng hành mỗi ngày: từ lịch báo giảng tự động, nhắc nhở tiết dạy tiếp theo ở phòng học nào, đến danh sách bài tập học sinh đã nộp. Không còn phải mất cả buổi tối Chủ nhật để viết sổ báo giảng thủ công, hệ thống đã chuẩn bị sẵn sàng tất cả chỉ chờ Thầy Cô xác nhận."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Thông báo trên điện thoại**: Cài đặt ứng dụng EduSmart trên điện thoại để nhận chuông nhắc nhở trước mỗi tiết dạy 10 phút.

---

<a name="muc-12-cinema-seating"></a>
## MỤC 12: SƠ ĐỒ CHỖ NGỒI LỚP HỌC CINEMA SEATING TƯƠNG TÁC
* **Đường dẫn truy cập**: `/teacher/seating-cinema`
* **Đối tượng**: Giáo viên Chủ nhiệm, Giáo viên Bộ môn.

### 1. Ý nghĩa & Nghiệp vụ
* Tính năng **độc quyền đột phá** mô phỏng không gian lớp học 3D sinh động như sơ đồ chọn ghế rạp chiếu phim (Cinema Seating).
* Tích hợp hiển thị thông tin đa tầng trên từng ghế: vị trí học sinh cận thị cần ngồi bàn đầu, học sinh cá biệt cần kèm cặp, học sinh nhận huy hiệu sao điểm tốt.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Lớp Học"** $\rightarrow$ chọn **"Sơ Đồ Lớp Cinema Seating"**.
2. **Bước 2**: Chọn Lớp giảng dạy (VD: *Lớp 10A1*).
3. **Bước 3**: Giao diện hiển thị ma trận các hàng ghế (Hàng A, B, C, D...) hướng về bục giảng:
   - Ghế có biểu tượng kính mắt `👓`: Học sinh có tật khúc xạ mắt / Cận thị.
   - Ghế có biểu tượng ngôi sao `⭐`: Học sinh có thành tích xuất sắc trong tuần.
   - Ghế có dấu chấm đỏ `🔴`: Học sinh đang có cảnh báo chuyên cần/học lực.
4. **Bước 4**: Thao tác đổi chỗ ngồi: Kéo thả (Drag & Drop) ghế học sinh này sang vị trí ghế khác $\rightarrow$ Vị trí được hoán đổi tức thì.
5. **Bước 5**: Nhấp vào một ghế bất kỳ để xem nhanh hồ sơ học sinh, điểm trung bình và nhật ký nhận xét.
6. **Bước 6**: Nhấp `[Lưu Sơ Đồ Chỗ Ngồi]` $\rightarrow$ Sơ đồ mới sẽ tự động hiển thị cho tất cả giáo viên bộ môn khác cùng lớp nắm bắt.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Kính thưa Thầy Cô, việc quản lý lớp học giờ đây trở nên vô cùng thú vị và trực quan với tính năng Cinema Seating độc quyền trên EduSmart. Mô phỏng sơ đồ lớp học hiện đại như một rạp chiếu phim, Thầy Cô có thể dễ dàng sắp xếp vị trí bàn ghế bằng thao tác kéo thả mượt mà, nhận diện ngay học sinh cận thị cần ưu tiên ngồi bàn đầu, hay những em cần quan tâm đặc biệt. Đây chính là công cụ hoàn hảo giúp Thầy Cô làm chủ không gian lớp học và khơi dậy hứng khởi học tập cho từng học sinh."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Tự động tối ưu sơ đồ bằng 1 nhấp**: Bấm nút `[🤖 AI Sắp Xếp Chỗ Ngồi Tối Ưu]`, hệ thống sẽ tự động xếp học sinh thấp bé, cận thị lên phía trước và phân bổ đều học sinh khá giỏi ngồi cạnh học sinh cần hỗ trợ.

---

<a name="muc-13-so-dau-bai-giao-vien"></a>
## MỤC 13: SỔ ĐẦU BÀI & NHẬT KÝ GIẢNG DẠY ĐIỆN TỬ
* **Đường dẫn truy cập**: `/teacher/journal`
* **Đối tượng**: Tất cả Giáo viên Bộ môn khi vào tiết dạy.

### 1. Ý nghĩa & Nghiệp vụ
* Giúp giáo viên bộ môn ghi nhận sĩ số lớp, nội dung bài học, nhận xét nề nếp và chấm điểm tiết dạy chỉ trong vòng 30 giây ngay tại lớp học bằng điện thoại hoặc máy tính bảng.
* Dữ liệu tự động đồng bộ về sổ tổng hợp của trường, không còn nỗi lo quên ký sổ hay phải ký bù vào cuối kỳ.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Khi vào lớp dạy, giáo viên mở `/teacher/journal` $\rightarrow$ Chọn Tiết dạy hôm nay.
2. **Bước 2**: Nhập thông tin tiết dạy:
   - **Tên bài học**: Hệ thống tự gợi ý theo phân phối chương trình (VD: *Bài 12: Phương trình bậc hai một ẩn*).
   - **Sĩ số hiện diện**: Tự động điền số học sinh có mặt sau khi điểm danh.
   - **Nhận xét giờ dạy**: Nhập tóm tắt (VD: *"Lớp trật tự, hăng hái phát biểu, hoàn thành tốt bài tập"*).
   - **Đánh giá xếp loại tiết học**: Chọn `Loại Tốt` (A), `Loại Khá` (B), hoặc `Loại TB` (C).
3. **Bước 3**: Nhấp nút `[✍️ Ký Tên & Lưu Sổ Đầu Bài]`.
4. **Bước 4**: Thông báo xanh "Đã ghi sổ đầu bài thành công" xuất hiện, tiết dạy được đánh dấu hoàn thành.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Chỉ với 30 giây ngay trên điện thoại di động, Thầy Cô đã có thể hoàn thành việc ghi nhận Sổ đầu bài điện tử cho tiết dạy của mình. Tên bài học được tự động gợi ý đúng tiến độ, sĩ số học sinh được đồng bộ chính xác, và điểm tiết dạy được lưu trữ an toàn với chữ ký số cá nhân. Thầy Cô hoàn toàn thảnh thơi tập trung vào việc truyền thụ kiến thức mà không còn bất kỳ áp lực giấy tờ sổ sách nào."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Ghi âm nhận xét bằng giọng nói**: Thầy Cô có thể bấm biểu tượng chiếc micro `🎙️` trên bàn phím điện thoại để đọc nhận xét, hệ thống sẽ tự động chuyển giọng nói thành văn bản chuẩn xác.

---

<a name="muc-14-diem-danh-chuyen-can"></a>
## MỤC 14: ĐIỂM DANH TIẾT DẠY & BÁO CÁO CHUYÊN CẦN
* **Đường dẫn truy cập**: `/teacher/attendance`
* **Đối tượng**: Giáo viên Bộ môn (điểm danh theo tiết) & Giáo viên Chủ nhiệm (điểm danh đầu ngày).

### 1. Ý nghĩa & Nghiệp vụ
* Điểm danh nhanh sĩ số trong vòng 15 giây: Mặc định cả lớp có mặt, Thầy Cô chỉ cần chạm vào học sinh vắng để chọn lý do (Nghỉ ốm, Có phép, Không phép, Đi muộn).
* Tự động gửi tin nhắn SMS / Zalo / App Notification thông báo cho phụ huynh khi học sinh vắng mặt không phép, đảm bảo an toàn học đường.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Mở màn hình Điểm danh `/teacher/attendance` $\rightarrow$ Chọn Lớp và Tiết dạy.
2. **Bước 2**: Danh sách học sinh hiển thị với avatar và tên (mặc định tất cả đều có nút xanh `Có mặt`).
3. **Bước 3**: Nếu có học sinh vắng, chạm vào tên học sinh đó để chuyển trạng thái:
   - 🔴 **Vắng không phép** (Hệ thống tự động kích hoạt gửi cảnh báo phụ huynh).
   - 🟡 **Vắng có phép** (Có đơn xin nghỉ từ phụ huynh trên app).
   - 🟠 **Đi muộn** (Ghi chú số phút đi trễ).
4. **Bước 4**: Nhấp nút `[Lưu & Gửi Báo Cáo Chuyên Cần]`.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Công tác điểm danh mỗi đầu giờ học giờ đây chỉ mất vỏn vẹn vài cái chạm tay. Mặc định cả lớp có mặt, Thầy Cô chỉ cần nhấp chọn những em vắng học hoặc đi muộn. Ngay lập tức, thông báo chuyên cần sẽ được gửi đến phụ huynh và Ban Giám Hiệu, giúp gắn kết chặt chẽ giữa gia đình và nhà trường, đảm bảo sự an toàn tuyệt đối cho các em học sinh trên đường đến trường."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Đồng bộ tự động từ máy quét thẻ / Điểm danh khuôn mặt AI**: Nếu trường có trang bị máy quét thẻ học sinh tại cổng, dữ liệu điểm danh sẽ tự động đổ về màn hình của giáo viên mà không cần điểm danh lại.

---

<a name="muc-15-nhap-diem-danh-gia"></a>
## MỤC 15: NHẬP ĐIỂM, ĐÁNH GIÁ THƯỜNG XUYÊN & ĐỊNH KỲ
* **Đường dẫn truy cập**: `/teacher/grades` và `/teacher/transcript`
* **Đối tượng**: Tất cả Giáo viên Bộ môn.

### 1. Ý nghĩa & Nghiệp vụ
* Nhập điểm kiểm tra thường xuyên (ĐĐGtx), kiểm tra giữa kỳ (ĐĐGgk) và kiểm tra cuối kỳ (ĐĐGck) theo đúng cấu trúc tính điểm của Thông tư 22/2021/TT-BGDĐT.
* Tự động tính điểm trung bình môn học (ĐTBmhk), tự động làm tròn 1 chữ số thập phân, ngăn ngừa hoàn toàn lỗi nhập sai dải điểm (ví dụ nhập nhầm điểm 11 hoặc -1).

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Sổ Điểm Điện Tử"** $\rightarrow$ chọn **"Nhập Điểm Môn Học"** (`/teacher/grades`).
2. **Bước 2**: Chọn Lớp (VD: *10A1*), Môn học (VD: *Vật Lý*), và Học kỳ (VD: *Học kỳ 1*).
3. **Bước 3**: Bảng điểm điện tử mở ra dạng lưới Excel. Thầy Cô có 2 cách nhập:
   - *Cách 1*: Nhập trực tiếp trên lưới bằng bàn phím máy tính (dùng phím Mũi tên xuống $\downarrow$ hoặc Enter để chuyển học sinh tiếp theo).
   - *Cách 2*: Bấm `[📥 Nhập Từ Excel]` để tải file Excel điểm đã chấm lên hệ thống.
4. **Bước 4**: Quan sát cột **Điểm Trung Bình (ĐTB)**: Hệ thống tự động nhảy điểm trung bình môn theo công thức chuẩn: $(ĐĐGtx \times 1 + ĐĐGgk \times 2 + ĐĐGck \times 3) / \text{Tổng hệ số}$.
5. **Bước 5**: Nhấp nút `[Lưu Bảng Điểm]` $\rightarrow$ Bấm `[Gửi Phê Duyệt Sổ Điểm]` khi kết thúc học kỳ.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Sổ điểm điện tử EduSmart mang đến trải nghiệm nhập điểm mượt mà và chuẩn xác như thao tác trên Excel nhưng thông minh và bảo mật hơn gấp nhiều lần. Hệ thống tự động tính điểm trung bình môn theo đúng Thông tư 22 của Bộ Giáo dục, tự động kiểm tra lỗi dải điểm và khóa bảo vệ dữ liệu sau khi duyệt. Thầy Cô có thể nhập điểm mọi lúc mọi nơi mà không sợ sai sót công thức hay thất lạc sổ sách."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Phím tắt nhập nhanh**: Nhấn phím `Tab` để chuyển sang cột điểm tiếp theo, nhấn phím `Enter` để nhảy xuống học sinh bên dưới giúp nhập điểm siêu tốc.

---

<a name="muc-16-nop-giao-an-dien-tu"></a>
## MỤC 16: SOẠN THẢO & NỘP KẾ HOẠCH BÀI DẠY (GIÁO ÁN) ĐIỆN TỬ
* **Đường dẫn truy cập**: `/teacher/lesson-plans`
* **Đối tượng**: Tất cả Giáo viên Giảng dạy.

### 1. Ý nghĩa & Nghiệp vụ
* Nộp kế hoạch bài dạy (giáo án) trực tuyến trước mỗi tuần học theo Công văn 5512/BGDĐT-GDTrH.
* Nhận phản hồi góp ý tức thì từ Tổ trưởng chuyên môn và lưu trữ kho học liệu số dùng lại cho các năm học sau.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Vào menu **"Giáo Án & Bài Dạy"** $\rightarrow$ chọn **"Nộp Kế Hoạch Bài Dạy"** (`/teacher/lesson-plans`).
2. **Bước 2**: Nhấp nút `[+ Nộp Giáo Án Mới]`.
3. **Bước 3**: Điền thông tin nộp bài:
   - **Tên bài dạy**: (VD: *Chủ đề 3: Động lực học chất điểm*).
   - **Khối lớp & Môn học**: Khối 10 - Vật Lý.
   - **Tuần thực hiện**: Tuần 14 (từ ngày 01/12 đến 06/12).
   - **Tệp đính kèm**: Kéo thả file Word (`.docx`) hoặc PDF kế hoạch bài dạy vào khung tải lên.
4. **Bước 4**: Nhấp nút `[Gửi Phê Duyệt Cho Tổ Trưởng]`.
5. **Bước 5**: Theo dõi trạng thái: Khi Tổ trưởng duyệt, huy hiệu sẽ chuyển từ màu vàng `Đang chờ duyệt` sang màu xanh lá `Đã phê duyệt`.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Không còn phải in ấn hàng trăm trang giáo án mỗi tuần, giờ đây Thầy Cô chỉ cần kéo thả file bài soạn lên hệ thống EduSmart. Kế hoạch bài dạy được gửi thẳng đến Tổ trưởng chuyên môn để kiểm duyệt trực tuyến. Mọi kho học liệu số, bài giảng điện tử của Thầy Cô được lưu trữ vĩnh viễn trên đám mây an toàn, sẵn sàng sử dụng và tái cấu trúc cho những năm học tiếp theo."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Kho học liệu tham khảo**: Thầy Cô có thể vào thư viện mẫu của trường để tham khảo các giáo án chuẩn đạt giải cao của đồng nghiệp trong tổ.

---

<a name="muc-17-to-truong-chuyen-mon"></a>
## MỤC 17: DUYỆT GIÁO ÁN & ĐÁNH GIÁ DÀNH CHO TỔ TRƯỞNG CHUYÊN MÔN
* **Đường dẫn truy cập**: `/teacher/subject-head`
* **Đối tượng**: Tổ trưởng, Tổ phó Chuyên môn.

### 1. Ý nghĩa & Nghiệp vụ
* Cung cấp không gian làm việc chuyên trách cho Tổ trưởng: kiểm duyệt giáo án của các giáo viên trong tổ, lên kế hoạch sinh hoạt tổ chuyên môn và đánh giá tiết dạy thao giảng.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Đăng nhập với quyền Tổ trưởng $\rightarrow$ Mở menu **"Quản Lý Tổ Chuyên Môn"** (`/teacher/subject-head`).
2. **Bước 2**: Xem danh sách giáo án của các thành viên trong tổ nộp trong tuần:
   - Cột thành viên: Thầy A (Đã nộp), Cô B (Đã nộp), Thầy C (Chưa nộp).
3. **Bước 3**: Nhấp vào từng giáo án để thẩm định nội dung $\rightarrow$ Ghi ý kiến đóng góp $\rightarrow$ Nhấp `[✅ Duyệt Cấp Tổ]` hoặc `[⚠️ Yêu Cầu Sửa Đổi]`.
4. **Bước 4**: Sau khi duyệt xong, toàn bộ giáo án của tổ sẽ tự động được chuyển lên Ban Giám Hiệu phê duyệt bước cuối cùng.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Đối với các Thầy Cô Tổ trưởng chuyên môn, EduSmart cung cấp một bảng quản lý tổ vô cùng tiện lợi. Thầy Cô dễ dàng theo dõi tiến độ nộp giáo án của từng thành viên, thẩm định bài giảng trực tuyến và gửi ý kiến đóng góp mang tính xây dựng. Quy trình duyệt 2 cấp chặt chẽ giúp nâng cao chất lượng chuyên môn toàn diện cho toàn bộ tổ bộ môn."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Báo cáo nộp bài tự động**: Tổ trưởng có thể bấm nút `[Xuất Báo Cáo Chuyên Môn Tuần]` để nộp ngay báo cáo tình hình nộp giáo án của tổ lên Ban Giám Hiệu trong cuộc họp giao ban đầu tuần.

---

<a name="muc-18-lop-chu-nhiem-khen-thuong"></a>
## MỤC 18: QUẢN LÝ LỚP CHỦ NHIỆM, KHEN THƯỞNG & HÀNH TRÌNH 360
* **Đường dẫn truy cập**: `/teacher/homeroom`, `/teacher/commendations`, `/teacher/students/[id]/journey`
* **Đối tượng**: Giáo viên Chủ nhiệm (GVCN).

### 1. Ý nghĩa & Nghiệp vụ
* Trung tâm điều hành toàn diện dành cho Giáo viên Chủ nhiệm: theo dõi hồ sơ học sinh, điểm rèn luyện/hạnh kiểm, ban cán sự lớp, trao huy hiệu khen thưởng và gửi thông báo họp phụ huynh.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Vào menu **"Công Tác Chủ Nhiệm"** $\rightarrow$ chọn **"Tổng Quan Lớp Chủ Nhiệm"** (`/teacher/homeroom`).
2. **Bước 2**: Xem danh sách học sinh kèm điểm thi đua và xếp loại rèn luyện trong tuần.
3. **Bước 3**: Trao huy hiệu khen thưởng (`/teacher/commendations`): Nhấp chọn học sinh $\rightarrow$ Chọn huy hiệu (VD: *Sao Chăm Chỉ, Kiện Tướng Phát Biểu, Tinh Thần Đồng Đội*) $\rightarrow$ Nhấp `[Trao Thưởng & Thông Báo Phụ Huynh]`.
4. **Bước 4**: Cập nhật nhật ký rèn luyện cá nhân vào **Hành trình học sinh 360** để ghi nhận sự tiến bộ vượt bậc của học sinh.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Làm công tác chủ nhiệm chưa bao giờ gần gũi và truyền cảm hứng đến thế! Thầy Cô chủ nhiệm có thể dễ dàng quản lý nề nếp lớp học, khích lệ các em học sinh bằng những huy hiệu khen thưởng sinh động được gửi thẳng đến điện thoại của phụ huynh. Những ghi nhận kịp thời của Thầy Cô chính là nguồn động lực to lớn giúp các em học sinh ngày càng tự giác và gắn bó với tập thể lớp."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Gửi thông báo lớp 1-chạm**: GVCN có thể soạn thư ngỏ hoặc thông báo họp phụ huynh và bấm nút `[Gửi Cho Toàn Bộ Phụ Huynh Lớp]` qua tin nhắn Zalo/App hoàn toàn miễn phí.

---

<a name="phan-iii-so--phong-gddt"></a>
# PHẦN III: PHÂN HỆ DÀNH CHO CÁN BỘ SỞ / PHÒNG GD&ĐT

---

<a name="muc-19-so-gddt-dashboard"></a>
## MỤC 19: BẢNG ĐIỀU KHIỂN TOÀN NGÀNH & QUẢN LÝ KHỐI TRƯỜNG THPT
* **Đường dẫn truy cập**: `/department/dashboard` và `/department/thpt-schools`
* **Đối tượng**: Lãnh đạo Sở GD&ĐT, Trưởng/Phó Phòng Giáo dục Trung học, Cán bộ CNTT Sở.

### 1. Ý nghĩa & Nghiệp vụ
* Cung cấp góc nhìn điều hành vĩ mô cấp Tỉnh/Thành phố: kết nối liên thông dữ liệu từ toàn bộ các trường THPT và Trung tâm GDNN-GDTX trên địa bàn.
* Giám sát tỷ lệ chuyên cần toàn tỉnh, chỉ số hoàn thành chương trình, và phân tích chất lượng đội ngũ giáo viên theo chuẩn nghề nghiệp.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Đăng nhập tài khoản Sở GD&ĐT $\rightarrow$ Mở màn hình `/department/dashboard`.
2. **Bước 2**: Quan sát bản đồ địa lý số hóa mạng lưới trường học và các chỉ số toàn tỉnh:
   - Tổng số trường THPT trực thuộc, Tổng số học sinh, Tổng số giáo viên.
   - Tỷ lệ chuyên cần toàn tỉnh trong ngày hôm nay.
3. **Bước 3**: Vào mục **"Danh Sách Trường THPT"** (`/department/thpt-schools`) $\rightarrow$ Nhấp vào một trường bất kỳ (VD: *Trường THPT Chuyên Lương Văn Tụy*) để xem dữ liệu quản trị trực tiếp của trường đó.
4. **Bước 4**: Nhấp nút `[Phát Lệnh Chỉ Đạo Toàn Ngành]` để gửi thông báo khẩn đến Ban Giám Hiệu tất cả các trường.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Ở cấp độ quản lý vĩ mô, Cổng điều hành Sở Giáo dục & Đào tạo trên nền tảng EduSmart mang đến cho các cấp Lãnh đạo bức tranh số hóa toàn diện của toàn ngành. Mọi dữ liệu về quy mô trường lớp, chất lượng chuyên môn và tỷ lệ chuyên cần của hàng chục ngàn học sinh được tổng hợp tự động theo thời gian thực, giúp công tác chỉ đạo và điều hành luôn kịp thời, chính xác và bám sát thực tiễn."*

### 4. Mẹo & Lưu ý Thực tế (Pro-tips)
* **Bản đồ nhiệt chất lượng (Heatmap)**: Sở có thể bật chế độ xem Heatmap để phát hiện những địa bàn vùng sâu vùng xa đang gặp khó khăn về thiết bị hoặc giáo viên để có phương án hỗ trợ kịp thời.

---

<a name="muc-20-phong-gddt-mang-luoi"></a>
## MỤC 20: ĐIỀU HÀNH MẠNG LƯỚI TUYẾN PHƯỜNG/HUYỆN & TRƯỜNG TRỰC THUỘC
* **Đường dẫn truy cập**: `/department/wards` và `/ward/schools`
* **Đối tượng**: Lãnh đạo và Chuyên viên Phòng GD&ĐT Quận/Huyện/Thị xã.

### 1. Ý nghĩa & Nghiệp vụ
* Quản lý phân cấp hành chính theo tuyến Quận/Huyện, điều hành các trường Mầm non, Tiểu học và THCS trực thuộc trên địa bàn.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Mở menu **"Quản Lý Địa Bàn"** $\rightarrow$ chọn **"Mạng Lưới Tuyến Phường/Huyện"** (`/department/wards`).
2. **Bước 2**: Chọn đơn vị Quận/Huyện cần quản lý $\rightarrow$ Hệ thống hiển thị danh sách các trường Mầm non, Tiểu học, THCS trên địa bàn.
3. **Bước 3**: Kiểm tra tình hình phổ cập giáo dục, tỷ lệ huy động trẻ đến trường và tiến độ kiểm định chất lượng giáo dục trường chuẩn quốc gia.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Phân hệ quản lý tuyến Quận Huyện giúp Phòng Giáo dục & Đào tạo dễ dàng nắm bắt số liệu của từng cấp học trên địa bàn phụ trách. Hệ thống liên thông đa cấp từ Sở - Phòng - Trường học tạo nên một dòng chảy dữ liệu liền mạch, xóa bỏ hoàn toàn khoảng cách hành chính và nâng cao hiệu lực quản lý nhà nước về giáo dục."*

---

<a name="muc-21-bao-cao-toan-nganh"></a>
## MỤC 21: BÁO CÁO THỐNG KÊ TOÀN NGÀNH & KIỂM SOÁT CHẤT LƯỢNG
* **Đường dẫn truy cập**: `/department/reports`
* **Đối tượng**: Cán bộ Thống kê Sở và Phòng GD&ĐT.

### 1. Ý nghĩa & Nghiệp vụ
* Tự động kết xuất các biểu mẫu thống kê định kỳ (Báo cáo đầu năm EMIS, Báo cáo giữa kỳ, Báo cáo tổng kết năm học) theo đúng quy định của Bộ GD&ĐT mà không cần yêu cầu các trường nộp file rời rạc.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Vào menu **"Báo Cáo & Thống Kê"** (`/department/reports`).
2. **Bước 2**: Chọn mẫu báo cáo: *Thống kê phổ điểm tốt nghiệp, Thống kê xếp loại chuẩn nghề nghiệp giáo viên, Thống kê cơ sở vật chất*.
3. **Bước 3**: Nhấp `[Tự Động Tổng Hợp Số Liệu Toàn Tỉnh]` $\rightarrow$ Hệ thống xử lý dữ liệu hàng trăm ngàn học sinh trong 10 giây.
4. **Bước 4**: Nhấp nút `[Xuất File Báo Cáo Bộ GD&ĐT]` (Định dạng Excel / XML chuẩn).

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Công tác tổng hợp báo cáo thống kê ngành giáo dục giờ đây chỉ gói gọn trong một cú nhấp chuột. Thay vì mất hàng tháng trời đôn đốc, thu thập và ghép nối hàng trăm file Excel từ các trường, EduSmart tự động tổng hợp số liệu toàn tỉnh với độ chính xác tuyệt đối, sẵn sàng đồng bộ trực tiếp lên hệ sinh thái dữ liệu của Bộ Giáo dục & Đào tạo."*

---

<a name="phan-iv-hoc-sinh--phu-huynh"></a>
# PHẦN IV: PHÂN HỆ DÀNH CHO HỌC SINH & PHỤ HUYNH

---

<a name="muc-22-bang-tin-hoc-sinh"></a>
## MỤC 22: BẢNG TIN HỌC TẬP & THÔNG TIN CÁ NHÂN
* **Đường dẫn truy cập**: `/student/dashboard` và `/student/profile`
* **Đối tượng**: Học sinh và Phụ huynh học sinh.

### 1. Ý nghĩa & Nghiệp vụ
* Cổng thông tin tương tác thân thiện dành riêng cho học sinh và phụ huynh: xem lời chào đầu ngày, lịch học hôm nay, thông báo của nhà trường, nhiệm vụ bài tập và các huy hiệu thi đua đã đạt được.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Học sinh hoặc phụ huynh đăng nhập tài khoản $\rightarrow$ Giao diện Bảng tin cá nhân `/student/dashboard` mở ra.
2. **Bước 2**: Xem thẻ **"Lịch Học Hôm Nay"**: Hiển thị rõ các tiết học, phòng học và thầy cô giảng dạy.
3. **Bước 3**: Xem thẻ **"Hộp Thư Nhà Trường"**: Nhận các thông báo về lịch thi, hoạt động ngoại khóa hoặc thư ngỏ của Ban Giám Hiệu.
4. **Bước 4**: Vào mục **"Hồ Sơ Cá Nhân"** (`/student/profile`) để cập nhật thông tin liên hệ, nguyện vọng nghề nghiệp và câu lạc bộ ngoại khóa.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Đối với các em học sinh và quý bậc phụ huynh, EduSmart mang đến một ứng dụng đồng hành thông minh, thân thiện và ấm áp. Mỗi ngày mở ứng dụng, các em sẽ nắm rõ lịch học, bài tập cần chuẩn bị, và những lời nhắn nhủ yêu thương từ thầy cô. Phụ huynh hoàn toàn an tâm đồng hành cùng từng bước chân của con tại trường."*

---

<a name="muc-23-tra-cuu-thoi-khoa-bieu"></a>
## MỤC 23: TRA CỨU THỜI KHÓA BIỂU & LỊCH HỌC HẰNG TUẦN
* **Đường dẫn truy cập**: `/student/schedule`
* **Đối tượng**: Học sinh, Phụ huynh.

### 1. Ý nghĩa & Nghiệp vụ
* Tra cứu thời khóa biểu thông minh: hiển thị rõ tiết học, môn học, giáo viên phụ trách, và tự động đổi màu khi có lịch học bù hoặc lịch dạy thay đổi tiết.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Thời Khóa Biểu"** (`/student/schedule`).
2. **Bước 2**: Màn hình hiển thị lưới lịch học từ Thứ Hai đến Thứ Bảy.
3. **Bước 3**: Chuyển đổi giữa các tuần bằng nút mũi tên `[◀ Tuần Trước]` và `[Tuần Sau ▶]`.
4. **Bước 4**: Nhấp vào một tiết học để xem nội dung bài học cần chuẩn bị trước ở nhà.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Thời khóa biểu thông minh trên điện thoại giúp các em học sinh luôn chủ động chuẩn bị sách vở và bài học trước khi đến lớp. Mọi sự thay đổi về phòng học hay giáo viên dạy thay đều được cập nhật tức thì, giúp các em không bao giờ bị bỡ ngỡ."*

---

<a name="muc-24-tra-cuu-diem-so"></a>
## MỤC 24: XEM ĐIỂM SỐ, BẢNG ĐIỂM & HỌC BẠ ĐIỆN TỬ
* **Đường dẫn truy cập**: `/student/grades` và `/student/transcript`
* **Đối tượng**: Học sinh, Phụ huynh.

### 1. Ý nghĩa & Nghiệp vụ
* Tra cứu minh bạch điểm kiểm tra thường xuyên, điểm thi giữa kỳ và cuối kỳ ngay khi giáo viên vào điểm.
* Theo dõi biểu đồ tiến bộ học tập qua từng tuần để phụ huynh và học sinh có kế hoạch rèn luyện kịp thời.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Kết Quả Học Tập"** $\rightarrow$ chọn **"Bảng Điểm Chi Tiết"** (`/student/grades`).
2. **Bước 2**: Xem điểm số từng môn học: Cột kiểm tra miệng, 15 phút, 1 tiết, Giữa kỳ, Cuối kỳ.
3. **Bước 3**: Quan sát biểu đồ **"Xu Hướng Tiến Bộ Học Tập"**: Nhận biết môn học nào đang bứt phá, môn học nào cần dành thêm thời gian ôn tập.
4. **Bước 4**: Mở mục **"Học Bạ Điện Tử"** (`/student/transcript`) để xem bản học bạ số hóa có chữ ký số của Ban Giám Hiệu.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Minh bạch điểm số và theo dõi sự tiến bộ học tập trở nên dễ dàng hơn bao giờ hết. Ngay khi thầy cô chấm điểm, phụ huynh và học sinh sẽ nhận được thông báo chi tiết kèm biểu đồ phân tích năng lực. Đây là chiếc cầu nối vững chắc giúp cha mẹ thấu hiểu năng lực của con và cùng thầy cô động viên con tiến bộ mỗi ngày."*

---

<a name="muc-25-hanh-trinh-hoc-tap-360"></a>
## MỤC 25: THEO DÕI ĐIỂM DANH & HÀNH TRÌNH RÈN LUYỆN 360
* **Đường dẫn truy cập**: `/student/attendance` và `/student/journey`
* **Đối tượng**: Học sinh, Phụ huynh.

### 1. Ý nghĩa & Nghiệp vụ
* Kiểm tra lịch sử chuyên cần, số ngày đi học đầy đủ và xem cuốn nhật ký trưởng thành (Hành trình 360) lưu giữ toàn bộ kỷ niệm, chứng chỉ, giải thưởng thi đua trong suốt những năm tháng ngồi trên ghế nhà trường.

### 2. Thao tác Màn hình Từng bước (Visual Steps)
1. **Bước 1**: Nhấp menu **"Chuyên Cần & Rèn Luyện"** (`/student/attendance`).
2. **Bước 2**: Xem lịch điểm danh tháng: Đánh dấu xanh những ngày đi học đúng giờ, kiểm tra lý do các ngày nghỉ.
3. **Bước 3**: Chuyển sang mục **"Hành Trình Trưởng Thành 360"** (`/student/journey`).
4. **Bước 4**: Chiêm ngưỡng cuốn sổ lưu niệm số hóa lưu giữ toàn bộ ảnh chụp hoạt động, huy hiệu đạt được và lời chúc yêu thương của thầy cô.

### 3. Lời Thoại Thuyết Minh MC (Voiceover)
> *"Hành trình rèn luyện tại mái trường thân yêu sẽ trở thành hành trang vô giá theo các em suốt cuộc đời. Với tính năng Hành trình 360 của EduSmart, mỗi ngày đến trường là một ngày vui, nơi mỗi cố gắng nhỏ bé đều được ghi nhận và tỏa sáng. EduSmart tự hào được đồng hành cùng nhà trường, thầy cô và quý phụ huynh kiến tạo nên một môi trường giáo dục hạnh phúc và tương lai tươi sáng cho thế hệ mai sau."*

---

# 🎯 BẢNG TỔNG HỢP LỆNH CHỈ DẪN QUAY VIDEO & CHỤP ẢNH TỪNG MỤC

| STT | Tên Phân Hệ & Chức Năng | URL Màn Hình Thực Tế | Thời Lượng Video Khuyến Nghị | Phân Loại Vai Trò |
| :---: | :--- | :--- | :---: | :--- |
| **01** | Bảng điều khiển Quản trị & KPI | `/admin/dashboard` | 0:15 - 0:20 | Ban Giám Hiệu |
| **02** | Đánh giá giáo viên chuẩn TT15/2020 | `/admin/tt15-evaluation` | 0:20 - 0:25 | Ban Giám Hiệu |
| **03** | Duyệt kế hoạch bài dạy (Giáo án) | `/admin/lesson-plans` | 0:15 - 0:20 | Ban Giám Hiệu / Tổ trưởng |
| **04** | Trung tâm AI Cảnh báo sớm học sinh | `/admin/early-warnings` | 0:20 - 0:25 | Ban Giám Hiệu / GVCN |
| **05** | Quản lý TKB & Điều phối dạy thay | `/admin/substitute-dispatch` | 0:15 - 0:20 | Ban Giám Hiệu / Học vụ |
| **06** | Giám sát Sổ đầu bài toàn trường | `/admin/journals` | 0:15 - 0:20 | Ban Giám Hiệu |
| **07** | Phân tích kỳ thi & Học bạ điện tử | `/admin/exam-analytics` | 0:18 - 0:22 | Ban Giám Hiệu / Khảo thí |
| **08** | Hành trình học sinh 360 | `/admin/journey-overview` | 0:15 - 0:20 | BGH / GVCN / Phụ huynh |
| **09** | Quản trị CSDL trường học & Excel | `/admin/students` | 0:15 - 0:20 | Quản trị viên / Văn phòng |
| **10** | Quản trị chiến lược & Tuân thủ NQ37 | `/admin/nq37-compliance` | 0:15 - 0:20 | Ban Giám Hiệu / Hội đồng |
| **11** | Dashboard Giáo viên & Báo giảng | `/teacher/dashboard` | 0:15 - 0:20 | Giáo viên |
| **12** | Sơ đồ lớp học Cinema Seating | `/teacher/seating-cinema` | 0:20 - 0:25 | Giáo viên |
| **13** | Sổ đầu bài điện tử tiết dạy | `/teacher/journal` | 0:15 - 0:20 | Giáo viên |
| **14** | Điểm danh chuyên cần lớp học | `/teacher/attendance` | 0:12 - 0:15 | Giáo viên |
| **15** | Nhập điểm chuẩn Thông tư 22 | `/teacher/grades` | 0:18 - 0:22 | Giáo viên |
| **16** | Soạn & Nộp giáo án điện tử | `/teacher/lesson-plans` | 0:15 - 0:20 | Giáo viên |
| **17** | Duyệt giáo án cấp Tổ chuyên môn | `/teacher/subject-head` | 0:15 - 0:20 | Tổ trưởng chuyên môn |
| **18** | Quản lý lớp chủ nhiệm & Khen thưởng | `/teacher/homeroom` | 0:15 - 0:20 | Giáo viên chủ nhiệm |
| **19** | Bảng điều khiển Sở GD&ĐT | `/department/dashboard` | 0:15 - 0:20 | Lãnh đạo Sở |
| **20** | Quản lý tuyến Quận/Huyện Phòng GD | `/department/wards` | 0:15 - 0:20 | Cán bộ Phòng |
| **21** | Báo cáo thống kê toàn ngành EMIS | `/department/reports` | 0:15 - 0:20 | Cán bộ Thống kê |
| **22** | Bảng tin học tập cá nhân học sinh | `/student/dashboard` | 0:12 - 0:15 | Học sinh / Phụ huynh |
| **23** | Tra cứu thời khóa biểu thông minh | `/student/schedule` | 0:10 - 0:12 | Học sinh / Phụ huynh |
| **24** | Tra cứu điểm số & Học bạ điện tử | `/student/grades` | 0:12 - 0:15 | Học sinh / Phụ huynh |
| **25** | Theo dõi chuyên cần & Hành trình 360 | `/student/journey` | 0:12 - 0:15 | Học sinh / Phụ huynh |

---
*Tài liệu được biên soạn và chuẩn hóa hoàn chỉnh bởi Trợ lý AI Chuyên gia - Sẵn sàng cho công tác quay video thực tế, lồng tiếng truyền thông và đào tạo chuyển đổi số tại các cơ sở giáo dục.*
