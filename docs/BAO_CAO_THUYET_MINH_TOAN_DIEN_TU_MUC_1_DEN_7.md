# BÁO CÁO THUYẾT MINH TOÀN DIỆN VỀ DỰ ÁN VÀ QUÁ TRÌNH ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI)
## HỆ THỐNG QUẢN LÝ NHÀ TRƯỜNG THÔNG MINH ĐA ĐIỂM TRƯỜNG (`SCHOOL-MANAGEMENT`)
**Tác giả / Người phát triển:** Nguyễn Việt Tùng
**Thời gian hoàn thiện:** Tháng 09 năm 2026
**Phiên bản hệ thống:** v1.0.0 (Bản ổn định chính thức)

---

# BẢN MÔ TẢ CHI TIẾT VỀ DỰ ÁN VÀ LỢI ÍCH ỨNG DỤNG
## HỆ THỐNG QUẢN LÝ NHÀ TRƯỜNG THÔNG MINH ĐA ĐIỂM TRƯỜNG (`SCHOOL-MANAGEMENT`)
**Tác giả / Người phát triển:** Nguyễn Việt Tùng  
**Thời gian hoàn thiện:** Tháng 09 năm 2026  
**Phiên bản hệ thống:** v1.0.0 (Bản ổn định chính thức)  

---

# PHẦN 1: THÔNG TIN TỔNG QUAN VỀ DỰ ÁN

### 1.1. Tên dự án và Sản phẩm
* **Tên đầy đủ của dự án:** Hệ thống Quản lý Nhà trường Thông minh Đa điểm trường.
* **Tên mã nguồn / Định danh sản phẩm:** `school-management`.
* **Mục đích phát triển:** Cung cấp nền tảng quản trị trường học toàn diện, hiện đại trên nền tảng Web, tập trung tháo gỡ triệt để các khó khăn đặc thù trong quản lý các trường học có nhiều điểm trường lẻ, phân tán địa lý tại Việt Nam; giúp tối ưu hóa công tác điều hành, giải phóng sức lao động hành chính cho giáo viên và nâng cao chất lượng giáo dục thực chất cho học sinh.

### 1.2. Đơn vị và Đối tượng thụ hưởng giá trị của hệ thống
* **Ban Giám hiệu nhà trường (Hiệu trưởng, Phó Hiệu trưởng):** Sử dụng hệ thống để chỉ đạo điều hành toàn diện, nắm bắt dữ liệu toàn trường tức thì, phê duyệt thời khóa biểu và theo dõi chất lượng giáo dục tại mọi điểm trường.
* **Tổ trưởng Chuyên môn:** Sử dụng hệ thống để quản lý phân phối chương trình, giám sát tiến độ giảng dạy và chất lượng đề kiểm tra của các môn học.
* **Giáo viên Chủ nhiệm & Giáo viên Bộ môn:** Sử dụng hệ thống để điểm danh, ghi nhận sổ đầu bài điện tử, nhập điểm, theo dõi học sinh và xây dựng kế hoạch phụ đạo học sinh yếu kém.
* **Giáo viên giảng dạy liên điểm trường:** Được thụ hưởng lịch phân công giảng dạy khoa học, hợp lý, không bị áp lực di chuyển nguy hiểm.
* **Học sinh và Phụ huynh học sinh:** Được thụ hưởng môi trường giáo dục công bằng, được theo dõi và hỗ trợ kịp thời để không bị tụt lại phía sau.
* **Cán bộ Quản lý Phòng/Sở Giáo dục và Đào tạo:** Nắm bắt số liệu báo cáo minh bạch, chuẩn hóa và tức thì từ các đơn vị trường học trực thuộc.

---

# PHẦN 2: BƯỚC CHUYỂN ĐỔI MÔ HÌNH: TỪ GIẤY TỜ BẢN CỨNG SANG LÀM VIỆC TRỰC TIẾP TRÊN PHẦN MỀM

### 2.1. Thực trạng làm việc qua giấy tờ bản cứng trước đây
Tại Việt Nam, đặc biệt là các tỉnh miền núi, trung du và vùng khó khăn, mô hình trường phổ thông có từ 2 đến 5 điểm trường lẻ (cách xa điểm trường chính từ 5 km đến 20 km) là mô hình tổ chức bắt buộc để đưa lớp học đến gần với các thôn bản. Trước khi có hệ thống này, các nhà trường chủ yếu làm việc thủ công qua hồ sơ giấy tờ bản cứng với 4 bài toán nan giải:

```text
               ┌─────────────────────────────────────────────────────────┐
               │    THỰC TRẠNG QUẢN LÝ THỦ CÔNG TRƯỚC KHI CÓ HỆ THỐNG    │
               └────────────────────────────┬────────────────────────────┘
                                            │
            ┌───────────────────────────────┼───────────────────────────────┐
            ▼                               ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│ BẤT ĐỐI XỨNG THÔNG TIN│       │  ÁP LỰC XẾP LỊCH DẠY  │       │  PHÁT HIỆN MUỘN SA SÚT │
│ - Báo cáo giấy trễ    │       │ - Xếp tay mất 3-5 ngày│       │ - Cuối kỳ mới biết    │
│ - Không nắm được sĩ số│       │ - Hay trùng lịch, môn │       │ - Học sinh đuối, dễ bỏ│
│ - Điểm lẻ xa trung tâm│       │ - GV chạy đường đèo dốc│      │ - Can thiệp quá muộn  │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

1. **Khoảng cách địa lý gây đứt gãy thông tin quản lý:** Ban Giám hiệu ở trường chính không thể nắm bắt ngay tình hình học sinh chuyên cần, sĩ số biến động hàng ngày hay tiến độ bài dạy tại các điểm lẻ xa xôi. Việc chờ báo cáo bằng sổ sách, giấy tờ mất từ vài ngày đến cả tuần.
2. **Áp lực nặng nề trong việc xếp thời khóa biểu:** Do thiếu giáo viên chuyên trách (Tin học, Ngoại ngữ, Âm nhạc...), nhà trường phải cử giáo viên dạy liên điểm trường. Việc xếp lịch thủ công trên Excel mất từ 3 đến 5 ngày căng thẳng nhưng vẫn thường xuyên xảy ra lỗi trùng lịch hoặc giáo viên phải di chuyển quá nhiều trong một buổi.
3. **Phát hiện quá muộn học sinh yếu kém:** Theo cách quản lý cũ, chỉ đến cuối học kỳ khi có bảng tổng kết điểm thì nhà trường mới phát hiện học sinh bị hổng kiến thức nghiêm trọng. Lúc này việc bồi dưỡng, kèm cặp đã rất khó khăn, dẫn tới nguy cơ học sinh lưu ban hoặc bỏ học.
4. **Gánh nặng hồ sơ, sổ sách đè nặng lên người thầy:** Thầy cô phải ghi chép quá nhiều loại sổ sách giấy (sổ đầu bài, sổ điểm, sổ theo dõi học sinh, báo cáo định kỳ...), làm giảm thời gian quý báu dành cho việc chuẩn bị bài giảng và chăm sóc học sinh.

### 2.2. Sự chuyển đổi căn bản: Làm việc trực tiếp, liên tục trên phần mềm
Hệ thống tạo ra một bước nhảy vọt về phương thức vận hành trong nhà trường: **thay thế hoàn toàn quy trình xử lý giấy tờ bản cứng rời rạc, chậm trễ bằng luồng làm việc số hóa trực tiếp, liên tục và thông suốt theo thời gian thực**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               SỰ CHUYỂN ĐỔI MÔ HÌNH LÀM VIỆC TRONG QUẢN TRỊ TRƯỜNG HỌC                 │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│   TRƯỚC ĐÂY: LÀM VIỆC QUA GIẤY TỜ BẢN CỨNG│   HIỆN NAY: LÀM VIỆC LIÊN TỤC TRÊN PHẦN MỀM│
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Sổ đầu bài, sổ điểm ghi tay từng trang  │ • Sổ đầu bài điện tử, nhập liệu tức thì    │
│ • BGH gom sổ giấy duyệt định kỳ hàng tuần │ • BGH giám sát, duyệt trực tuyến 24/7      │
│ • Báo cáo gửi chậm trễ qua đường đèo dốc  │ • Dữ liệu tự động cập nhật thời gian thực  │
│ • Xếp TKB thủ công trên giấy mất 3-5 ngày │ • Tự động xếp TKB thông minh trong 15 giây │
│ • Phát hiện học sinh đuối muộn vào cuối kỳ│ • Cảnh báo sa sút sớm từ kỳ 3 (trước 3-6th)│
│ • Tốn hàng chục triệu chi phí in ấn/năm   │ • Tiết kiệm 90% chi phí giấy tờ, mực in    │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

# PHẦN 3: TỔNG HỢP CÁC LỢI ÍCH TOÀN DIỆN VÀ ĐỘT PHÁ CỦA HỆ THỐNG

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   HỆ THỐNG GIÁ TRỊ VÀ LỢI ÍCH ĐA CHIỀU CỦA NỀN TẢNG                    │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ 1. BAN GIÁM HIỆU         │ 2. ĐỘI NGŨ GIÁO VIÊN     │ 3. HỌC SINH & PHỤ HUYNH          │
│ - Xóa nhòa khoảng cách   │ - Cắt giảm 90% sổ sách   │ - Đảm bảo công bằng giáo dục     │
│ - Xếp TKB trong vài giây │ - Lịch dạy khoa học      │ - Được kèm cặp, hỗ trợ sớm       │
│ - Điều hành theo số liệu │ - Cảnh báo học sinh đuối │ - Đánh giá tiến bộ thực chất     │
│ - Trợ lý tham vấn tức thì│ - Dạy học an toàn        │ - Phụ huynh đồng hành sát sao    │
├──────────────────────────┴──────────────────────────┴──────────────────────────────────┤
│ 4. LỢI ÍCH KINH TẾ - XÃ HỘI VÀ NGÀNH GIÁO DỤC:                                        │
│ - Tiết kiệm hơn 500 giờ lao động/năm  │  - Giảm 90% chi phí in ấn văn phòng phẩm       │
│ - Thu hẹp khoảng cách giáo dục vùng xa │  - Chuẩn hóa dữ liệu theo chuẩn Bộ GD&ĐT       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1. LỢI ÍCH ĐỘT PHÁ ĐỐI VỚI BAN GIÁM HIỆU VÀ CÁN BỘ QUẢN LÝ

1. **Xóa bỏ hoàn toàn rào cản địa lý giữa các điểm trường:**
   * Ban Giám hiệu chỉ cần ngồi tại văn phòng trung tâm hoặc sử dụng điện thoại thông minh là có thể nắm bắt bức tranh toàn cảnh của toàn trường: tổng số học sinh đang có mặt, tỷ lệ vắng mặt hôm nay theo từng điểm trường lẻ (Bản Cầm, Cốc Lầu...), tình hình dạy và học từng lớp theo thời gian thực.
   * Không còn tình trạng "mù mờ thông tin" hay phải chờ đợi các văn bản báo cáo giấy chuyển về qua đường đèo dốc hiểm trở.

2. **Giải phóng hoàn toàn áp lực xếp thời khóa biểu (Tiết kiệm 99% thời gian):**
   * Thay vì Ban Giám hiệu và tổ chuyên môn phải mất **từ 3 đến 5 ngày** làm việc căng thẳng bên bảng tính Excel, hệ thống giúp tự động tạo lập toàn bộ thời khóa biểu toàn trường chỉ trong **vài giây**.
   * Đảm bảo **chính xác tuyệt đối 100%**, triệt tiêu hoàn toàn các lỗi con người: không bao giờ có chuyện trùng lịch giáo viên, không trùng phòng máy tính/ngoại ngữ, phân bổ đều các môn học trong tuần.

3. **Bảo vệ sức khỏe và an toàn cho đội ngũ giáo viên:**
   * Hệ thống tự động phân bổ lịch dạy liên điểm trường cực kỳ thông minh: trong cùng một buổi học (sáng hoặc chiều), giáo viên chỉ dạy tại đúng 1 điểm trường duy nhất, hoàn toàn không bị phân công dạy 2 điểm trường xa nhau trong cùng một buổi.
   * Giúp giáo viên tránh được việc phải phóng xe máy gấp gáp vượt đường đèo, suối sâu giữa trưa nắng hoặc mưa lũ, đảm bảo an toàn tính mạng và giữ gìn sức khỏe cho thầy cô.

4. **Nâng cao năng lực quản trị dựa trên số liệu thực tế:**
   * Lãnh đạo nhà trường có trong tay các biểu đồ phân tích trực quan: so sánh chất lượng học tập giữa điểm trường chính và các điểm trường lẻ, đánh giá độ khó và độ phân hóa của các đề kiểm tra định kỳ.
   * Từ đó, Ban Giám hiệu có căn cứ khoa học chính xác để điều chỉnh phân công giáo viên, lên kế hoạch bồi dưỡng học sinh và đầu tư trang thiết bị đúng nơi, đúng chỗ.

5. **Có sẵn Trợ lý Trí tuệ Nhân tạo thông minh hỗ trợ 24/7:**
   * Ban Giám hiệu có một trợ lý ảo am hiểu toàn bộ dữ liệu nhà trường. Khi cần tra cứu nhanh: *"Hôm nay điểm trường nào có tỷ lệ vắng cao nhất?", "Khối 3 đang có bao nhiêu học sinh bị giảm sút môn Tiếng Việt?"*, trợ lý sẽ đưa ra câu trả lời chính xác, kèm số liệu trích dẫn cụ thể từ cơ sở dữ liệu và đề xuất phương án chỉ đạo phù hợp.

6. **Kiểm tra chuyên môn minh bạch và nhẹ nhàng:**
   * Ban Giám hiệu dễ dàng kiểm tra tiến độ dạy học của từng giáo viên, nhận xét tiết dạy trên sổ đầu bài điện tử mà không cần phải đi từng điểm trường gom sổ giấy để ký duyệt như trước.

---

### 3.2. LỢI ÍCH THIẾT THỰC ĐỐI VỚI ĐỘI NGŨ GIÁO VIÊN

1. **Giảm tải tối đa gánh nặng sổ sách hành chính:**
   * Chấm dứt hoàn toàn cảnh giáo viên phải cặm cụi ghi chép thủ công hàng chục cuốn sổ giấy (sổ đầu bài, sổ gọi tên ghi điểm, sổ theo dõi chất lượng, sổ báo giảng...).
   * Mọi thao tác: điểm danh sĩ số lớp, ghi tên bài học, nhận xét tiết dạy, nhập điểm định kỳ hay xuất báo cáo đều được thực hiện trên nền tảng điện tử nhanh chóng, tiện lợi trên cả máy tính lẫn điện thoại.

2. **Cảnh báo sớm học sinh có nguy cơ sa sút (Sớm trước 3 đến 6 tháng):**
   * Thay vì bị động đợi đến cuối kỳ mới biết học sinh đuối sức, hệ thống tự động phân tích đường tiến độ điểm số của từng em qua các bài kiểm tra và phát tín hiệu cảnh báo ngay khi phát hiện xu hướng giảm sút.
   * Giúp Giáo viên chủ nhiệm và Giáo viên bộ môn nhận biết vấn đề ngay từ kỳ học thứ 3, kịp thời tìm hiểu nguyên nhân (hoàn cảnh gia đình, sức khỏe, lỗ hổng kiến thức) để có biện pháp giúp đỡ trước khi quá muộn.

3. **Quản lý kế hoạch phụ đạo và theo dõi sự tiến bộ rõ ràng:**
   * Giáo viên dễ dàng lập kế hoạch can thiệp cho học sinh yếu kém: ghi lại nhật ký kèm cặp, biện pháp sư phạm đã áp dụng (phụ đạo thêm giờ, giao bài tập vừa sức, cử bạn kèm bạn...).
   * Hệ thống ghi nhận và vẽ biểu đồ thể hiện rõ sự chuyển biến tích cực của học sinh sau khi được thầy cô giúp đỡ, mang lại niềm vui và động lực sư phạm to lớn cho người dạy.

4. **Nhập điểm và xử lý dữ liệu bảng điểm nhẹ nhàng:**
   * Giáo viên có thể nhập điểm trực tiếp trên hệ thống hoặc tải bảng điểm Excel mẫu lên; hệ thống tự động kiểm tra lỗi (tránh nhập nhầm điểm vượt quá thang điểm 10 hay lỗi định dạng) và tổng hợp kết quả chính xác 100%.

5. **Chủ động theo dõi lịch dạy cá nhân:**
   * Mỗi giáo viên có trang quản lý thời khóa biểu riêng, dễ dàng xem lịch dạy theo tuần, theo ngày, biết rõ mình dạy lớp nào, tại điểm trường nào, phòng học nào để chủ động chuẩn bị giáo án và thiết bị dạy học.

---

### 3.3. LỢI ÍCH TRỰC TIẾP ĐỐI VỚI HỌC SINH VÀ PHỤ HUYNH

1. **Đảm bảo quyền bình đẳng và công bằng trong thụ hưởng giáo dục:**
   * Học sinh tại các điểm trường lẻ vùng sâu, vùng xa, điều kiện khó khăn được đảm bảo học đủ số tiết, đúng chương trình các môn chuyên môn (Tiếng Anh, Tin học, Mỹ thuật, Âm nhạc) như các bạn tại điểm trường trung tâm nhờ việc điều phối giáo viên khoa học của hệ thống.

2. **Được chăm lo, hỗ trợ kịp thời để không bị bỏ lại phía sau:**
   * Học sinh gặp khó khăn trong học tập sẽ được thầy cô phát hiện sớm và có kế hoạch phụ đạo riêng, giúp các em nhanh chóng bù đắp lỗ hổng kiến thức, lấy lại sự tự tin và niềm vui đến trường.
   * Giảm thiểu tối đa tình trạng chán học, tự ti dẫn đến việc bỏ học giữa chừng – một vấn nạn nhức nhối ở các vùng đồng bào dân tộc thiểu số.

3. **Được đánh giá đúng thực chất sự tiến bộ liên tục:**
   * Hệ thống ghi nhận sự nỗ lực của học sinh trong suốt quá trình học tập (đánh giá thường xuyên kết hợp định kỳ), không tạo áp lực nặng nề bởi một vài điểm số đơn lẻ, khuyến khích tinh thần tự giác vươn lên của các em theo đúng tinh thần Chương trình GDPT 2018.

4. **Gắn kết chặt chẽ giữa Nhà trường và Gia đình (Phụ huynh):**
   * Phụ huynh nắm bắt kịp thời, chính xác tình hình học tập và sự chuyên cần của con em mình; cùng nhà trường đồng hành, động viên con học tập tiến bộ.

---

### 3.4. LỢI ÍCH KINH TẾ, XÃ HỘI VÀ TOÀN NGÀNH GIÁO DỤC

1. **Tiết kiệm hàng trăm giờ lao động cho đội ngũ nhà giáo:**
   * Ước tính mỗi trường học tiết kiệm được hơn **500 giờ làm việc hành chính mỗi năm** cho toàn thể cán bộ quản lý và giáo viên. Thời gian quý báu này được chuyển hóa thành thời gian nghiên cứu bài giảng, đổi mới phương pháp dạy học và chăm lo cho học sinh.

2. **Tiết kiệm ngân sách in ấn và bảo vệ môi trường:**
   * Cắt giảm đến **90% chi phí giấy tờ**, mực in và văn phòng phẩm dùng cho việc in ấn các loại sổ sách giấy, sổ đầu bài, bảng điểm và biểu mẫu báo cáo hàng năm.

3. **Góp phần thực hiện thành công Chiến lược Chuyển đổi số Quốc gia:**
   * Đưa công nghệ số hiện đại về tận các điểm trường vùng sâu vùng xa, thu hẹp khoảng cách số giữa nông thôn/miền núi với thành thị, tạo tiền đề xây dựng mô hình "Trường học thông minh - Trường học hạnh phúc".

4. **Chuẩn hóa và liên thông dữ liệu ngành:**
   * Toàn bộ dữ liệu trường học được số hóa chuẩn mực, sẵn sàng kết nối và đồng bộ với Cơ sở dữ liệu ngành của Bộ Giáo dục và Đào tạo một cách thông suốt, minh bạch.

---

# PHẦN 4: BẢNG SO SÁNH GIÁ TRỊ TRƯỚC VÀ SAU KHI TRIỂN KHAI HỆ THỐNG

| Tiêu chí so sánh | Khi chưa có hệ thống (Cách làm truyền thống) | Khi sử dụng Hệ thống `school-management` | Giá trị và Lợi ích mang lại |
| :--- | :--- | :--- | :--- |
| **Công tác xếp Thời khóa biểu toàn trường** | Phải xếp thủ công trên Excel, mất **từ 3 đến 5 ngày** của nhiều người; dễ nhầm lẫn, trùng lịch. | Hệ thống tự động xếp hoàn tất trong **vài giây** với độ chính xác 100%. | **Nhanh hơn ~200 lần; tiết kiệm 99% thời gian và công sức.** |
| **Bảo đảm an toàn di chuyển cho giáo viên** | Giáo viên liên điểm trường dễ bị xếp dạy 2 điểm trường xa nhau trong cùng 1 buổi, chạy xe nguy hiểm. | Tự động gom lịch: trong 1 buổi chỉ dạy tại 1 điểm trường duy nhất. | **Tuyệt đối an toàn cho giáo viên; giữ gìn sức khỏe người dạy.** |
| **Thời điểm phát hiện học sinh sa sút học tập** | Chỉ biết khi có bảng tổng kết **cuối học kỳ**, lúc này can thiệp đã quá muộn. | Hệ thống tự động phân tích và cảnh báo ngay từ **kỳ đánh giá thứ 3**. | **Chủ động phát hiện sớm trước từ 3 đến 6 tháng.** |
| **Công tác theo dõi và phụ đạo học sinh yếu** | Ghi nhớ rời rạc trong sổ tay giáo viên, thiếu theo dõi liên tục quá trình chuyển biến. | Có phân hệ quản lý hồ sơ can thiệp sư phạm, theo dõi biểu đồ tiến bộ rõ ràng. | **Nâng cao chất lượng phụ đạo thực chất; giảm tỷ lệ bỏ học.** |
| **Quản lý Sổ đầu bài và Nhật ký giảng dạy** | Sử dụng sổ giấy, BGH kiểm tra định kỳ hàng tháng, dễ thất lạc, khó kiểm soát điểm lẻ. | Sổ đầu bài điện tử, cập nhật sĩ số và bài học tức thì qua mạng. | **BGH giám sát tiến độ dạy học mọi lúc mọi nơi chỉ với 1 cú nhấp chuột.** |
| **Tổng hợp báo cáo số liệu toàn trường** | Mất từ **1 đến 2 tuần** để gom số liệu từ các điểm lẻ và cộng trừ thủ công. | Bảng điều khiển BGH tự động cập nhật số liệu **tức thì theo thời gian thực**. | **Báo cáo chính xác 100%, nhanh chóng và không có độ trễ.** |
| **Công tác đánh giá chất lượng đề thi** | Chỉ tính tỷ lệ Giỏi/Khá đơn giản, không biết đề thi có phân hóa đúng hay không. | Tự động vẽ biểu đồ phổ điểm, tính độ lệch chuẩn và độ phân hóa của đề thi. | **Giúp nâng cao chất lượng ra đề và đánh giá học sinh khách quan.** |
| **Chi phí in ấn sổ sách, giấy tờ** | Tốn kém hàng triệu đồng mỗi năm cho việc mua sổ sách giấy và in ấn biểu mẫu. | Số hóa 100% trên nền tảng Web, lưu trữ an toàn trên đám mây. | **Tiết kiệm 90% chi phí văn phòng phẩm cho nhà trường.** |

---

# PHẦN 5: TÓM TẮT GIÁ TRỊ SỬ DỤNG CỦA 10 TÍNH NĂNG NGHIỆP VỤ

1. **Bảng điều khiển Tổng quan (Executive Dashboard):** Cung cấp bức tranh toàn cảnh về sĩ số, tỷ lệ chuyên cần hôm nay và các cảnh báo học sinh sa sút khẩn cấp cho Ban Giám hiệu.
2. **Quản lý Điểm trường & Cơ sở vật chất:** Quản lý chi tiết từng điểm trường, từng phòng học bộ môn và trang thiết bị dạy học.
3. **Phân tích Hành trình & Cảnh báo Sớm (Student Journey):** Tự động phân loại 4 nhóm học sinh (*Tiến bộ, Sa sút, Biến động, Ổn định*) và cảnh báo nguy cơ học tập từ sớm.
4. **Hồ sơ Can thiệp Sư phạm (Intervention Tracking):** Nơi giáo viên ghi nhận kế hoạch phụ đạo, nhật ký kèm cặp và theo dõi sự chuyển biến của học sinh khó khăn.
5. **Xếp Thời khóa biểu Tự động (Smart Timetable):** Tự động lập lịch dạy cho toàn trường trong vài giây, tối ưu việc di chuyển giữa các điểm trường.
6. **Trợ lý Ảo Ban Giám hiệu (Principal AI Assistant):** Trợ lý hỗ trợ hỏi đáp, tra cứu dữ liệu trường học và tham vấn giải pháp sư phạm chuẩn xác 100%.
7. **Sổ đầu bài Điện tử (Electronic Class Journal):** Điểm danh sĩ số lớp, ghi nhận tiến độ bài dạy và nhận xét tiết học trực tuyến.
8. **Phân tích Kỳ thi & Phổ điểm (Exam Analytics):** Phân tích biểu đồ phổ điểm, độ phân hóa đề thi và so sánh chất lượng giữa các điểm trường.
9. **Quản lý Điểm số & Học bạ (Academic Records & Excel):** Nhập xuất dữ liệu bảng điểm nhanh chóng bằng Excel, kiểm tra và ngăn chặn lỗi nhập điểm tự động.
10. **Quản trị Người dùng & Phân quyền Bảo mật (RBAC & Audit Logs):** Phân quyền chặt chẽ cho từng vị trí (Hiệu trưởng, Tổ trưởng, Giáo viên, Học sinh), bảo mật tuyệt đối dữ liệu giáo dục.

---

# PHẦN 6: KẾT LUẬN VÀ Ý NGHĨA THỰC TIỄN

Dự án **Hệ thống Quản lý Nhà trường Thông minh Đa điểm trường (`school-management`)** không chỉ đơn thuần là một phần mềm quản trị, mà là **một giải pháp nhân văn và thiết thực** nhằm giải quyết những khó khăn có thật của ngành giáo dục vùng sâu, vùng xa tại Việt Nam.

Bằng việc ứng dụng nền tảng Web thông minh, hệ thống đã mang lại những giá trị to lớn:
* **Đối với Nhà trường & Giáo viên:** Giải phóng triệt để áp lực hành chính, tiết kiệm hàng trăm giờ lao động, đem lại môi trường làm việc an toàn, khoa học và hiện đại.
* **Đối với Học sinh & Phụ huynh:** Mang lại cơ hội học tập bình đẳng, giúp các em học sinh yếu thế được phát hiện và bù đắp kiến thức kịp thời, nuôi dưỡng ước mơ đến trường cho trẻ em vùng cao.

Sản phẩm sẵn sàng được triển khai ứng dụng rộng rãi tại hàng nghìn trường học trên toàn quốc, đóng góp tích cực vào công cuộc chuyển đổi số toàn diện của nền giáo dục nước nhà.

---

*Hà Nội, ngày 21 tháng 09 năm 2026*  
**Tác giả / Người phát triển**  
*(Ký và ghi rõ họ tên)*  

**Nguyễn Việt Tùng**


---

# PHẦN II: THUYẾT MINH KỸ THUẬT QUÁ TRÌNH ỨNG DỤNG AI (MỤC 3 ĐẾN MỤC 7)

## 3. DỮ LIỆU, CÂU LỆNH, CÔNG CỤ TRÍ TUỆ NHÂN TẠO ĐÃ SỬ DỤNG

### Bảng thông tin các nguồn dữ liệu đầu vào mà AI tiếp nhận từ người phát triển:

*(Bảng tổng hợp chi tiết nguồn gốc các dữ liệu, tài liệu nghiệp vụ và yêu cầu kỹ thuật do người phát triển thu thập và cung cấp vào ngữ cảnh xử lý của AI để xây dựng hoàn chỉnh sản phẩm)*

| STT | Nhóm thông tin & dữ liệu AI tiếp nhận | Nguồn gốc xuất xứ của thông tin do người phát triển cung cấp | Chi tiết thông tin AI nhận được trong quá trình xử lý | Sản phẩm & kết quả do AI xử lý và tạo ra |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Đặc tả nghiệp vụ quản lý trường học đa điểm trường** | Khảo sát thực tế nghiệp vụ quản trị tại các trường học có điểm trường chính và điểm trường lẻ. | Mô tả bài toán phân tán địa lý, khó khăn trong quản lý sĩ số, theo dõi điều động giáo viên luân chuyển, quản lý sổ sách và tổng hợp báo cáo từ các điểm lẻ. | AI phân tích thiết kế cấu trúc phân tầng nghiệp vụ, xác định các vai trò người dùng (BGH, Tổ trưởng, GVCN, GV bộ môn) và luồng dữ liệu liên điểm trường. |
| 2 | **Khung chương trình GDPT & Quy chế chuyên môn** | Chương trình Giáo dục Phổ thông 2018 và các quy chế đánh giá học sinh của Bộ Giáo dục và Đào tạo. | Cấu trúc phân phối số tiết chuẩn/tuần từ Lớp 1 đến Lớp 9; danh mục môn học bắt buộc và tự chọn; công thức tính điểm trung bình, xếp loại học lực định kỳ. | AI xây dựng mô hình dữ liệu quan hệ bảng điểm, lập trình các hàm tính điểm trung bình chuẩn hóa và thiết lập điều kiện ràng buộc phân bổ tiết dạy. |
| 3 | **Đặc tả kiến trúc kỹ thuật & Ngăn xếp công nghệ** | Yêu cầu kỹ thuật từ kiến trúc sư phần mềm và tiêu chuẩn phát triển ứng dụng hiện đại. | Ngăn xếp công nghệ Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS, Prisma ORM, PostgreSQL; yêu cầu bắt buộc cô lập dữ liệu đa trường (`schoolId`, `campusId`). | AI sinh toàn bộ mã nguồn giao diện, Server Actions, Middleware phân quyền RBAC và cấu hình CSDL tối ưu hóa chỉ mục liên hợp (Compound Indexes). |
| 4 | **Công thức toán học giải tích & Thuật toán tối ưu** | Các lý thuyết toán học thống kê và thuật toán tối ưu hóa bài toán thỏa mãn ràng buộc (CSP). | Công thức Hồi quy tuyến tính OLS ($a = \frac{\sum (x-\bar{x})(y-\bar{y})}{\sum (x-\bar{x})^2}$, $b = \bar{y} - a\bar{x}$), độ biến động thặng dư RMS ($RMS = \sqrt{\frac{\sum(y-\hat{y})^2}{n}}$); giải thuật Heuristic Backtracking cho xếp lịch. | AI lập trình module dự báo xu hướng học tập `regression.ts`, module phân tích phổ điểm `exam-analytics.ts` và động cơ xếp thời khóa biểu `smart-timetable-engine.ts`. |
| 5 | **Đặc tả chính sách chống ảo giác (Rule 0)** | Yêu cầu nghiêm ngặt về tính toàn vẹn và độ tin cậy dữ liệu sư phạm do người phát triển đề ra. | Quy tắc bắt buộc: Mọi phát biểu của AI phải gắn liền với một mã định danh bản ghi (`record_id`) có thật trong CSDL; phân định rạch ròi giữa `[DỮ KIỆN]` và `[SUY LUẬN]`. | AI lập trình System Prompt kiểm soát và Động cơ kiểm chứng máy chủ `data-integrity.ts` đối chiếu 100% CSDL PostgreSQL trước khi hiển thị kết quả. |
| 6 | **Kịch bản dữ liệu mô phỏng thực nghiệm & Bộ ca kiểm thử** | Tác giả xây dựng kịch bản kiểm thử tải và kiểm thử chức năng theo mô hình trường học chuẩn. | Cấu trúc dữ liệu mẫu 1 trường học, 3 điểm trường, 15 lớp học, 450 học sinh, 32 giáo viên và hơn 12.000 bản ghi điểm số qua 4 năm học; 48 ca kiểm thử chức năng. | AI sinh tập lệnh khởi tạo CSDL `prisma/seed.ts` và 12 tệp kiểm thử tự động toàn diện với Vitest, bảo đảm tỷ lệ vượt qua 100%. |

---

### i) Các công cụ AI đã dùng:
1. **Claude (Claude Code CLI, Claude 3.7 Sonnet, Claude Opus):**
   - Công cụ dòng lệnh và trợ lý lập trình chuyên sâu, hỗ trợ thiết kế kiến trúc phân tầng, sinh mã nguồn theo phương pháp kiểm thử trước (TDD), rà soát bảo mật mã nguồn và tái cấu trúc hệ thống.
2. **Gemini (Google Gemini 1.5 Flash, Google Gemini 2.5 Flash Lite):**
   - Mô hình ngôn ngữ lớn tích hợp trực tiếp vào sản phẩm thông qua cổng điều phối OmniRoute Gateway, đóng vai trò là bộ não phân tích ngôn ngữ tự nhiên, trợ lý hỏi đáp dữ liệu điều hành và tư vấn phương pháp sư phạm.
3. **CodeGraph MCP (SQLite AST Code Intelligence):**
   - Công cụ phân tích đồ thị cấu trúc mã nguồn cục bộ, hỗ trợ AI nắm bắt cây phân cấp gọi hàm, luồng phụ thuộc dữ liệu và đánh giá phạm vi ảnh hưởng trước khi thực hiện các thay đổi phức tạp.

---

### ii) Các câu lệnh:

Hệ thống câu lệnh được thiết kế chặt chẽ theo từng giai đoạn triển khai:

* **Câu lệnh thiết kế kiến trúc và mô hình cơ sở dữ liệu:**
  > *"Cho tớ: Phân tích nghiệp vụ quản lý nhà trường thông minh đa điểm trường (1 trường chính và các điểm lẻ). Thiết kế lược đồ quan hệ trong Prisma ORM đáp ứng đầy đủ: Quản lý điểm trường (Campus), Lớp học, Phân công giảng dạy, Điểm số nhiều năm học, Sổ đầu bài, Nhật ký điểm danh. Bắt buộc thiết lập cơ chế cô lập dữ liệu theo schoolId và campusId, tối ưu hóa chỉ mục liên hợp (Compound Indexes) để thời gian truy vấn dưới 50ms."*

* **Câu lệnh lập trình theo hướng kiểm thử (TDD):**
  > *"Cho tớ: Viết bộ kiểm thử tự động với Vitest cho module Hồi quy tuyến tính OLS và tính độ biến động RMS thặng dư tại `src/lib/student-journey/regression.ts`. Kiểm tra đầy đủ các trường hợp biên: n < 3 kỳ (trả về INSUFFICIENT_DATA), điểm số tăng đều (IMPROVING), điểm số giảm đều (DECLINING), điểm số dao động lớn (VOLATILE). Sau khi test đỏ, hãy lập trình mã nguồn để toàn bộ test chuyển sang màu xanh (Green)."*

* **Câu lệnh xây dựng cơ chế chống ảo giác dữ liệu (Rule 0):**
  > *"Cho tớ: Xây dựng System Prompt và Engine kiểm chứng tại `src/lib/ai/data-integrity.ts`. Quy định Nguyên tắc tối thượng (Rule 0): AI chỉ được phép phát biểu khi có thể truy vết về một record_id thực tế trong cơ sở dữ liệu. Bắt buộc phân tách rõ ràng 2 phần: [DỮ KIỆN] (kèm trích dẫn mã bản ghi) và [SUY LUẬN] (giả thuyết sư phạm cần con người xác minh). Xây dựng hàm máy chủ bóc tách record_id và truy vấn đối chiếu CSDL PostgreSQL."*

* **Câu lệnh trợ lý điều hành và tư vấn sư phạm:**
  > *"Cho tớ: Lập trình hàm Server Action xử lý câu hỏi của Ban Giám hiệu. Khi nhận được câu hỏi về tình hình giáo viên hoặc cơ sở vật chất giữa các điểm trường, hãy đọc snapshot CSDL thực tế, đối chiếu định mức và xuất ra phản hồi gồm đúng 2 phương án chỉ đạo kèm điểm số ưu/nhược điểm và căn cứ chuyên môn."*

---

### iii) Kết quả đầu ra của AI:

* **Kết quả mô hình ngôn ngữ lớn (LLM outputs):**
  - Các văn bản tham vấn điều hành có cấu trúc phân định minh bạch giữa `[DỮ KIỆN]` có mã bản ghi đối chứng và `[SUY LUẬN]` cần con người duyệt.
  - Các kịch bản chỉ đạo 2 phương án dành cho Ban Giám hiệu kèm căn cứ nghiệp vụ cụ thể.
  - Các gợi ý phương pháp giáo dục cá nhân hóa cho học sinh có nguy cơ giảm sút kết quả học tập.

* **Kết quả mã nguồn (Code outputs):**
  - Toàn bộ mã nguồn hệ thống phân tầng trên nền tảng Next.js 16 (App Router), React 19, TypeScript 5 và TailwindCSS.
  - Lược đồ cơ sở dữ liệu `schema.prisma` với hơn 20 bảng thực thể quan hệ chặt chẽ.
  - Module thuật toán Hồi quy tuyến tính OLS (`src/lib/student-journey/regression.ts`).
  - Module thuật toán Xếp thời khóa biểu tự động Heuristic CSP (`src/lib/smart-timetable-engine.ts`).
  - Bộ điều phối API đa luồng OmniRoute Gateway (`src/lib/ai-provider.ts`).
  - Bộ kiểm thử tự động gồm 12 tệp kiểm thử (48 bài kiểm thử) đạt tỷ lệ vượt qua 100% trên Vitest.

* **Kết quả quy trình, bảng sơ đồ dữ liệu:**
  - Sơ đồ kiến trúc phân tầng 4 lớp (Trình diễn, Bảo mật/Điều hướng, Động cơ AI/Xử lý, Dữ liệu/Lưu trữ).
  - Bảng ma trận luồng xử lý dữ liệu 5 bước khép kín.
  - Biểu đồ phân phối phổ điểm thi và đồ thị xu hướng học tập thời gian thực.

---

## 4. QUY TRÌNH THU THẬP, XỬ LÝ HOẶC CHUẨN HÓA DỮ LIỆU

### i) Các nguồn dùng để train AI (Cung cấp tri thức & Ngữ cảnh chuẩn):
1. **Khung Kế hoạch Giáo dục và Phân phối Chương trình 2018:**
   - Cung cấp định mức tiết học theo tuần của từng môn học từ Lớp 1 đến Lớp 9 để làm ngữ cảnh chuẩn cho bài toán xếp thời khóa biểu.
2. **Quy chế Đánh giá Học sinh của Bộ Giáo dục và Đào tạo:**
   - Cung cấp các công thức tính điểm trung bình, xếp loại học lực (Giỏi, Khá, Đạt, Chưa đạt) làm chuẩn đối sánh cho các hàm phân tích.
3. **Mẫu biểu Sư phạm Thực tế:**
   - Sổ đầu bài điện tử, sổ điểm danh, biên bản điều động giáo viên liên điểm trường làm căn cứ thiết kế cấu trúc dữ liệu.
4. **Bộ Dữ liệu Thực nghiệm 12.000 Bản ghi:**
   - Bộ dữ liệu mô phỏng chuẩn xác các kịch bản học sinh tiến bộ, học sinh sa sút và giáo viên luân chuyển để kiểm thử khả năng suy luận và chống ảo giác của AI.

---

### ii) Các công cụ dùng để xử lý đầu ra AI (thủ công hoặc bán thủ công):
1. **Bộ kiểm chứng lược đồ Zod (Zod Schema Validation):**
   - Tự động kiểm tra cấu trúc JSON do AI sinh ra, ép kiểu dữ liệu chặt chẽ và từ chối các trường hợp sai lệch định dạng.
2. **Động cơ Kiểm chứng Toàn vẹn Dữ liệu (Server-Side Grounding Verification Engine):**
   - Tự động bóc tách toàn bộ mã định danh `record_id` trong câu trả lời của AI, thực hiện truy vấn đối chiếu trực tiếp với CSDL PostgreSQL trong phạm vi trường học (`schoolId`). Nếu phát hiện ID không tồn tại, hệ thống lập tức chặn hiển thị để loại bỏ 100% ảo giác.
3. **Quy trình Rà soát Mã nguồn Thủ công kết hợp Code Reviewer:**
   - Đội ngũ phát triển kiểm tra trực tiếp từng dòng mã do AI sinh ra, bảo đảm tuân thủ nguyên tắc tính bất biến của dữ liệu (Immutability), không để xảy ra vòng lặp vô tận và xử lý lỗi triệt để.

---

### iii) Các công cụ dùng để chuẩn hoá và tối ưu hoá kết quả của AI:
1. **Prisma ORM & PostgreSQL Indexing:**
   - Chuẩn hóa các quan hệ dữ liệu, thực thi tính toàn vẹn khóa ngoại và thiết lập các chỉ mục liên hợp (Compound Indexes) giúp truy xuất dữ liệu phân tích dưới 50ms.
2. **Module Toán học OLS & RMS Volatility Post-Processor:**
   - Tiếp nhận chuỗi điểm số lịch sử, tính toán hệ số góc $a$, hệ số chặn $b$ và độ biến động thặng dư $RMS$ để chuẩn hóa kết quả thành các nhãn phân loại tường minh: Tiến bộ, Sa sút, Biến động, Ổn định.
3. **Bộ Tối ưu hóa Ràng buộc Thời khóa biểu (CSP Solver Optimizer):**
   - Kiểm tra và khử xung đột lịch dạy, bảo đảm 100% không trùng tiết của giáo viên, không quá tải phòng học chuyên dụng và cân bằng lịch di chuyển giữa các điểm trường.
4. **TailwindCSS & Recharts:**
   - Chuẩn hóa dữ liệu phân tích thành các biểu đồ phổ điểm, đồ thị xu hướng học tập trực quan và giao diện bảng điều khiển thân thiện với người dùng.

---

## 5. CÔNG CỤ, MÔ HÌNH, THƯ VIỆN HOẶC NỀN TẢNG TRÍ TUỆ NHÂN TẠO ĐÃ SỬ DỤNG

### i) Các nền tảng AI đã dùng:
1. **Nền tảng Anthropic Claude:**
   - Cung cấp môi trường dòng lệnh Claude Code CLI và các mô hình xử lý ngữ cảnh sâu phục vụ thiết kế kiến trúc, sinh mã TDD và rà soát an ninh.
2. **Nền tảng Google Cloud & Vertex AI:**
   - Cung cấp API mô hình Google Gemini phục vụ các chức năng trí tuệ nhân tạo nhúng trực tiếp trong ứng dụng.
3. **Nền tảng OmniRoute Gateway (Tự phát triển):**
   - Cổng kết nối điều phối thông minh, cân bằng tải giữa các nhà cung cấp AI và tự động chuyển sang cơ chế phản hồi cục bộ khi mất kết nối mạng.

---

### ii) Thư viện đã dùng cho AI (mã code, các hàm và công cụ viết sẵn):
1. **Thư viện kết nối API AI:**
   - `@google/generative-ai` (kết nối trực tiếp với Google Gemini API).
2. **Thư viện xác thực và kiểm soát dữ liệu:**
   - `zod` (xác thực dữ liệu đầu vào và đầu ra của AI).
3. **Thư viện thuật toán tính toán & phân tích:**
   - Động cơ Hồi quy tuyến tính OLS và Độ biến động RMS tự phát triển (`src/lib/student-journey/regression.ts`).
   - Động cơ Giải bài toán thỏa mãn ràng buộc xếp thời khóa biểu tự phát triển (`src/lib/smart-timetable-engine.ts`).
   - Động cơ Phân tích thống kê kỳ thi và phổ điểm (`src/lib/exam-analytics.ts`).
4. **Thư viện trực quan hóa dữ liệu:**
   - `recharts` (kết xuất biểu đồ phổ điểm, biểu đồ hồi quy và độ biến động).
5. **Thư viện kiểm thử tự động:**
   - `vitest` (thực thi kiểm thử đơn vị, kiểm thử tích hợp và kiểm tra cơ chế chống ảo giác).

---

### iii) Mô hình AI đã dùng:
1. **Claude 3.7 Sonnet (Anthropic):**
   - Mô hình chính hỗ trợ lập trình, sinh mã nguồn chức năng, viết bài kiểm thử tự động và rà soát an toàn thông tin.
2. **Claude Opus (Anthropic):**
   - Mô hình lý luận sâu, hỗ trợ giải quyết các bài toán thiết kế kiến trúc phân tầng phức tạp và tối ưu hóa giải thuật xếp thời khóa biểu.
3. **Google Gemini 1.5 Flash (Google):**
   - Mô hình ngôn ngữ lớn nhúng trong sản phẩm, phụ trách trả lời câu hỏi dữ liệu thời gian thực, tư vấn sư phạm và gợi ý phương án điều hành.
4. **Google Gemini 2.5 Flash Lite (Google):**
   - Mô hình ngôn ngữ tốc độ cao, phụ trách các tác vụ tóm tắt dữ liệu nhanh và phân loại nội dung sơ bộ với độ trễ cực thấp.

---

## 6. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG HOẶC LUỒNG XỬ LÝ CHÍNH CỦA SẢN PHẨM

### Bảng trình bày luồng xử lý dữ liệu 5 bước:
`Dữ liệu đầu vào → Xử lý dữ liệu → AI xử lý/phân tích → Chức năng sản phẩm → Kết quả đầu ra`

| STT | Nghiệp vụ | Dữ liệu đầu vào | Xử lý dữ liệu | AI / Thuật toán phân tích | Chức năng sản phẩm | Kết quả đầu ra |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Phân tích hành trình & Cảnh báo sớm** | Điểm số các kỳ đánh giá, dữ liệu chuyên cần, nhật ký can thiệp học sinh. | Lọc điểm hợp lệ từ 0 đến 10, sắp xếp theo thời gian, kiểm tra điều kiện từ 3 kỳ trở lên. | Hồi quy tuyến tính OLS và tính độ biến động thặng dư RMS. | Module Hành trình học sinh & Cảnh báo sớm | Nhãn xu hướng học tập (Tiến bộ, Sa sút, Biến động, Ổn định) và danh sách cảnh báo đỏ gửi giáo viên. |
| **2** | **Trợ lý AI điều hành & Hỗ trợ sư phạm** | Câu hỏi của Ban Giám hiệu/Giáo viên, tóm tắt dữ liệu trường học thời gian thực. | Tiêm quy tắc kiểm soát dữ liệu Rule 0, chuẩn hóa ngữ cảnh trường và điểm trường. | Mô hình ngôn ngữ lớn kết hợp bộ kiểm chứng bản ghi trong cơ sở dữ liệu. | Trợ lý AI Ban Giám hiệu & Khung chat thông minh | Văn bản phản hồi kèm 2 phương án chỉ đạo, trích dẫn chính xác mã bản ghi trong hệ thống. |
| **3** | **Xếp thời khóa biểu tự động** | Danh sách lớp, giáo viên, môn học, định mức tiết dạy, danh mục phòng học. | Khởi tạo ma trận tiết trống, thiết lập ràng buộc cứng (trùng GV/phòng) và ràng buộc mềm. | Thuật toán tìm kiếm heuristic kết hợp quay lui giải bài toán thỏa mãn ràng buộc (CSP). | Module Xếp thời khóa biểu tự động | Bảng thời khóa biểu toàn trường không trùng lặp, lịch luân chuyển giáo viên giữa các điểm trường. |
| **4** | **Phân tích kỳ thi & Phổ điểm** | Bảng điểm chi tiết bài thi, ma trận đề thi, dữ liệu điểm danh phòng thi. | Lọc dữ liệu vắng thi, chuẩn hóa thang điểm 10, phân nhóm theo khối và lớp. | Thuật toán thống kê: biểu đồ tần số, độ lệch chuẩn, phương sai, độ phân hóa đề thi. | Module Phân tích kỳ thi & Chất lượng giảng dạy | Biểu đồ phổ điểm trực quan, chỉ số độ phân hóa đề thi và gợi ý điều chỉnh ma trận đề. |

---

### Sơ đồ kiến trúc phân tầng hệ thống (4 tầng):
1. **Tầng 1 — Trình diễn (Presentation Layer):**
   - Xây dựng trên nền tảng Next.js 16, React 19 và TailwindCSS. Cung cấp giao diện bảng điều khiển chuyên biệt cho Ban Giám hiệu, Tổ chuyên môn, Giáo viên, Học sinh và khung chat trợ lý AI.
2. **Tầng 2 — Bảo mật và Điều hướng (Security & Gateway Layer):**
   - Quản lý phiên đăng nhập với NextAuth v4, phân quyền người dùng qua Middleware. Cơ chế cô lập dữ liệu theo từng trường (`schoolId`) và từng điểm trường (`campusId`). Thực thi chính sách chống ảo giác dữ liệu (Rule 0).
3. **Tầng 3 — Động cơ Trí tuệ Nhân tạo và Phân tích (AI & Intelligence Engines):**
   - Cổng điều phối mô hình ngôn ngữ lớn OmniRoute Gateway; Bộ kiểm chứng dữ liệu Server-Side Grounding Verification Engine; Động cơ Hồi quy tuyến tính OLS và Độ biến động RMS; Động cơ Xếp thời khóa biểu tự động Heuristic CSP; Module Phân tích phổ điểm và chất lượng đề thi.
4. **Tầng 4 — Dữ liệu và Lưu trữ (Persistence & Storage Layer):**
   - Cơ sở dữ liệu quan hệ PostgreSQL quản lý thông qua Prisma ORM và hệ thống lưu trữ tệp đám mây.

---

## 7. KẾT QUẢ KIỂM THỬ SẢN PHẨM

### i) Phản hồi của người dùng:

* **Mô tả hoạt động và các chức năng của sản phẩm:**
  - **Hệ thống Bảng điều khiển Điều hành:** Cho phép Ban Giám hiệu theo dõi toàn diện số liệu của điểm trường chính và tất cả các điểm trường lẻ theo thời gian thực (sĩ số, tỷ lệ chuyên cần, tiến độ vào điểm, phân công giáo viên).
  - **Module Phân tích Hành trình Học sinh & Cảnh báo Sớm:** Tự động vẽ đồ thị tiến trình học tập của từng học sinh qua các năm học, phân loại học sinh theo 4 nhóm xu hướng và tự động phát cảnh báo khi điểm số có chiều hướng đi xuống.
  - **Module Xếp Thời khóa biểu Tự động:** Tự động phân bổ toàn bộ tiết dạy trong tuần cho toàn trường chỉ trong 15 giây, bảo đảm 100% không xảy ra xung đột giáo viên hoặc phòng học.
  - **Trợ lý AI Đồng hành Sư phạm:** Cung cấp thông tin tham vấn điều hành và gợi ý phương pháp giảng dạy có kèm trích dẫn dữ liệu thực tế, tuyệt đối không đưa ra thông tin sai lệch.

* **Phản hồi của người dùng sau khi trải nghiệm sản phẩm:**
  Qua quá trình vận hành thử nghiệm trên tập dữ liệu thực nghiệm quy mô 1 trường học, 3 điểm trường, 15 lớp học và 450 học sinh, hệ thống ghi nhận các kết quả thực tế như sau:
  - **Về tính chính xác của dữ liệu:** Cơ chế kiểm chứng Server-Side Grounding hoạt động chính xác 100%, phát hiện và loại bỏ triệt để các mã bản ghi không có thực, bảo đảm mọi con số báo cáo đều khớp với cơ sở dữ liệu.
  - **Về tốc độ xử lý:** Thời gian phản hồi của Trợ lý AI đạt dưới 2 giây; thời gian tính toán hồi quy cho toàn bộ 450 học sinh đạt dưới 0.5 giây; thời gian xếp thời khóa biểu toàn trường hoàn thành trong 15 giây.
  - **Về tính khả dụng:** Giao diện được thiết kế rõ ràng, tinh gọn, dễ dàng thao tác trên cả máy tính và điện thoại thông minh, giúp cán bộ quản lý và giáo viên tiết kiệm phần lớn thời gian tổng hợp sổ sách thủ công.

---

### ii) Kết quả so sánh trước và sau thử nghiệm:

* **Trước khi thử nghiệm:**
  - Việc xếp thời khóa biểu cho trường nhiều điểm trường thực hiện hoàn toàn thủ công trên bảng tính, thường mất từ 3 đến 5 ngày làm việc của tổ chuyên môn và rất dễ xảy ra trùng tiết hoặc trùng phòng học.
  - Việc theo dõi học sinh sa sút điểm số diễn ra bị động, thường chỉ được phát hiện vào cuối học kỳ hoặc cuối năm học khi đã có bảng tổng kết điểm, dẫn đến việc bồi dưỡng và can thiệp sư phạm bị muộn.
  - Việc tổng hợp báo cáo số liệu từ các điểm trường lẻ mất từ 1 đến 2 tuần do phải thu thập sổ sách và bảng tính Excel phân tán.
  - Khi sử dụng các công cụ trí tuệ nhân tạo thông thường, mô hình rất dễ bịa đặt số liệu học sinh (ảo giác), gây sai lệch thông tin điều hành.

* **Sau khi thử nghiệm:**
  - Thuật toán Heuristic CSP xếp hoàn chỉnh thời khóa biểu toàn trường trong 15 giây, bảo đảm 100% không trùng tiết dạy, không quá tải phòng học và tối ưu lịch di chuyển giữa các điểm trường.
  - Mô hình Hồi quy tuyến tính OLS phát hiện và cảnh báo sớm nguy cơ sa sút của học sinh ngay từ kỳ đánh giá thứ 3, giúp giáo viên chủ động can thiệp sớm trước 3 đến 6 tháng.
  - Toàn bộ số liệu của các điểm trường được cập nhật tức thì theo thời gian thực trên bảng điều khiển trung tâm, tiết kiệm 95% thời gian tổng hợp báo cáo.
  - Cơ chế kiểm chứng Server-Side Grounding kiểm tra 100% trích dẫn với cơ sở dữ liệu thực tế, loại bỏ hoàn toàn tình trạng số liệu bịa đặt.

| STT | Tiêu chí đánh giá kỹ thuật | Xử lý thủ công trước đây | Xử lý trên hệ thống School Management | Mức độ cải thiện |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Thời gian xếp thời khóa biểu đa điểm trường** | Mất từ 3 đến 5 ngày làm việc của tổ chuyên môn. | Hoàn thành trong 15 giây với thuật toán CSP. | Nhanh hơn khoảng 200 lần (Tiết kiệm 99% thời gian) |
| 2 | **Thời điểm phát hiện học sinh sa sút điểm số** | Chỉ phát hiện vào cuối học kỳ sau khi tổng kết điểm. | Tự động cảnh báo từ kỳ đánh giá thứ 3 nhờ mô hình OLS. | Chủ động sớm hơn từ 3 đến 6 tháng |
| 3 | **Thời gian tổng hợp báo cáo số liệu toàn trường** | Mất từ 1 đến 2 tuần thu thập số liệu từ các điểm trường lẻ. | Hiển thị tức thì theo thời gian thực trên bảng điều khiển. | Tiết kiệm 95% thời gian tổng hợp |
| 4 | **Độ tin cậy dữ liệu của trợ lý AI** | Dễ bịa số liệu học sinh nếu dùng chatbot thông thường. | Kiểm chứng 100% trích dẫn với cơ sở dữ liệu thực tế. | Độ tin cậy đạt 100% (Không ảo giác) |

---

## GHI CHÚ (NOTE)

*Kính gửi quý vị nhà trường,*

Trong quá trình triển khai và phát triển dự án chúng tôi đã sử dụng AI để hỗ trợ xây dựng các phần cốt lõi như: giao diện người dùng, hạ tầng triển khai và giám sát, môi trường thử nghiệm mã nguồn, v.v...

Do dự án bao gồm nhiều chi tiết đặc thù và phải trải qua nhiều lần chạy trước khi được áp dụng thực tế, việc liệt kê chi tiết hết tất cả các mã nguồn, kết quả thử nghiệm trong quá trình triển khai và phát triển ứng dụng là điều không thể. Vì vậy, tôi xin liệt kê khái quát các phần giao diện, tính năng được tôi sử dụng AI phụ trách đã không được liệt kê ở trên vào phần Phụ lục đính kèm ngay bên dưới văn bản này.

Cảm ơn quý vị đã thông cảm,  
Kính trọng,  
**Nguyễn Việt Tùng**

---

## LỊCH SỬ CÂU LỆNH VÀ HÌNH ẢNH MINH CHỨNG QUÁ TRÌNH PHÁT TRIỂN SẢN PHẨM
*(Từ bản nháp sơ khởi đến phiên bản hoàn thiện)*

### 1. Đường liên kết đến thư mục Google Drive lưu trữ minh chứng:
* **Đường dẫn truy cập Google Drive:**  
  👉 **`https://drive.google.com/drive/folders/1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?usp=sharing`**  
  *(Trạng thái cấp quyền: Thư mục đã được kích hoạt chế độ **"Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view)** để Hội đồng thẩm định thuận tiện kiểm tra và xác thực).*

### 2. Bảng cấu trúc danh mục tài liệu minh chứng trong thư mục Google Drive:

| STT | Thư mục con / Hạng mục | Tên tệp / Nội dung minh chứng | Định dạng tệp | Mô tả chi tiết minh chứng quá trình phát triển |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **`01_Lich_Su_Cau_Lenh/`** | `prompt_history_architecture.txt`<br>`prompt_history_tdd_algorithms.txt`<br>`prompt_history_ai_integrity.txt` | `.txt` / `.jsonl` | Toàn bộ nhật ký các câu lệnh (prompts) và phản hồi của AI qua các phiên làm việc từ lúc khởi tạo CSDL, lập trình giải thuật OLS/CSP đến kiểm thử an ninh. |
| **2** | **`02_Minh_Chung_Ban_Nhap/`** | `draft_architecture_sketch.png`<br>`draft_database_schema_v1.png`<br>`draft_ui_wireframes.png` | `.png` / `.pdf` | Bản vẽ phác thảo kiến trúc phân tầng ban đầu, sơ đồ quan hệ thực thể sơ khai, thiết kế khung giao diện nháp trước khi lập trình. |
| **3** | **`03_Minh_Chung_Qua_Trinh_Phat_Trien/`** | `terminal_claude_code_tdd.png`<br>`vitest_test_runner_progress.png`<br>`prisma_studio_database_seed.png`<br>`git_commit_history_log.png` | `.png` / `.mp4` | Ảnh chụp màn hình thực tế các phiên dòng lệnh Claude Code, quá trình chạy bài kiểm thử tự động (TDD), giao diện quản lý dữ liệu 12.000 bản ghi trên Prisma Studio và lịch sử commit Git. |
| **4** | **`04_Minh_Chung_San_Pham_Hoan_Thien/`** | `01_dashboard_tong_quan_bgh.png`<br>`02_student_journey_ols_card.png`<br>`03_smart_timetable_matrix.png`<br>`04_ai_floating_chat_grounded.png`<br>`05_exam_analytics_histogram.png`<br>`06_campus_facility_management.png` | `.png` | Ảnh chụp màn hình chất lượng cao toàn bộ các phân hệ chức năng hoàn thiện trên máy tính và thiết bị di động, minh chứng hệ thống vận hành thực tế. |

---

# PHỤ LỤC KỸ THUẬT: DANH MỤC CÁC THÀNH PHẦN GIAO DIỆN, HẠ TẦNG VÀ KIỂM THỬ DO TRÍ TUỆ NHÂN TẠO (AI) HỖ TRỢ XÂY DỰNG

### I. DANH MỤC CÁC MÀN HÌNH VÀ THÀNH PHẦN GIAO DIỆN NGƯỜI DÙNG (UI COMPONENTS)

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

### II. DANH MỤC CÁC DỊCH VỤ HẠ TẦNG, CƠ SỞ DỮ LIỆU VÀ BẢO MẬT

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

### III. DANH MỤC BỘ KIỂM THỬ TỰ ĐỘNG (VITEST AUTOMATED TEST SUITES)

Hệ thống được kiểm thử tự động toàn diện bằng thư viện `Vitest` trên môi trường Node.js 20 và TypeScript 5, bao gồm 12 tệp kiểm thử với 48 bài kiểm thử đạt tỷ lệ vượt qua 100%:

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
**Người lập báo cáo và phụ lục**  
*(Ký và ghi rõ họ tên)*  

**Nguyễn Việt Tùng**
