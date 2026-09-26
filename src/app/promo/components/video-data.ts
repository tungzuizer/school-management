export interface VideoScene {
  id: number;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  voiceover: string;
  shortCaption: string;
  badge: string;
  badgeColor: string;
  keyPoints: string[];
}

export const VIDEO_SCENES: VideoScene[] = [
  {
    id: 1,
    title: "Nỗi Đau & Thách Thức Quản Trị Truyền Thống",
    subtitle: "5 nút thắt sống còn đè nặng lên các trường đa điểm trường",
    duration: 16,
    voiceover:
      "Trong suốt nhiều thập kỷ, công tác quản trị trường học luôn đối mặt với những rào cản vô hình: Hàng trăm trang sổ sách thủ công đè nặng lên vai người thầy; Xếp thời khóa biểu căng thẳng mất 3 đến 5 ngày; Khoảng cách địa lý chia cắt thông tin giữa các điểm trường; Và thi đua dồn cục cảm tính vào cuối năm.",
    shortCaption:
      "Hàng trăm trang sổ sách đè nặng • Xếp TKB mất 3-5 ngày • Đứt gãy thông tin liên trường",
    badge: "HIỆN TRẠNG & NỖI ĐAU",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    keyPoints: [
      "Sổ đầu bài, sổ điểm ghi tay 100+ trang",
      "Xếp TKB thủ công mất 3 - 5 ngày căng thẳng",
      "Điểm trường lẻ xa xôi, báo cáo gửi chậm trễ",
      "Thi đua cảm tính, dồn cục cuối năm",
      "Học sinh sa sút phát hiện quá muộn",
    ],
  },
  {
    id: 2,
    title: "Bước Chuyển Mình Đột Phá: Chuyển Đổi Số Toàn Diện",
    subtitle: "Từ hồ sơ bản cứng sang làm việc trực tiếp, tức thì trên phần mềm",
    duration: 14,
    voiceover:
      "Đã đến lúc tạo nên bước chuyển đổi căn bản! Hệ thống Quản lý Nhà trường Thông minh Đa điểm trường – Nền tảng số hóa toàn diện, đưa toàn bộ quy trình từ hồ sơ giấy tờ truyền thống sang môi trường làm việc trực tiếp, liên tục và tức thì trên không gian số.",
    shortCaption:
      "Chuyển đổi căn bản: Làm việc trực tiếp, liên tục và tức thì trên phần mềm",
    badge: "GIẢI PHÁP ĐỘT PHÁ",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    keyPoints: [
      "Nền tảng Cloud đồng bộ đa thiết bị 24/7",
      "Xóa nhòa hoàn toàn rào cản địa lý đa điểm trường",
      "Tối ưu hóa vận hành, minh bạch hóa 360 độ",
      "Giao diện hiện đại, trực quan, thân thiện người dùng",
    ],
  },
  {
    id: 3,
    title: "Thời Khóa Biểu Thông Minh 15 Giây & An Toàn Giáo Viên",
    subtitle: "Tự động xếp TKB nhanh hơn 200 lần, 0% xung đột, gom lịch an toàn",
    duration: 18,
    voiceover:
      "Đột phá đầu tiên: Thuật toán AI Xếp Thời khóa biểu tự động trong chỉ 15 giây! Tiết kiệm 99% thời gian, triệt tiêu 100% lỗi trùng lịch. Đặc biệt, hệ thống tự động gom lịch dạy liên trường thông minh – đảm bảo trong 1 buổi thầy cô chỉ dạy tại đúng 1 điểm trường, bảo vệ an toàn tối đa trên đường đèo dốc mùa mưa lũ.",
    shortCaption:
      "Xếp TKB tự động 15 giây • 0% xung đột • Gom lịch an toàn vượt đèo bảo vệ thầy cô",
    badge: "ĐỘT PHÁ TKB 15 GIÂY",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keyPoints: [
      "Thời gian xếp TKB giảm từ 3-5 ngày xuống còn 15 GIÂY",
      "0% trùng lịch giáo viên và trùng phòng chức năng",
      "Thuật toán gom lịch liên trường: 1 buổi = 1 điểm trường",
      "Bảo vệ an toàn tính mạng thầy cô khi di chuyển vùng cao",
    ],
  },
  {
    id: 4,
    title: "Trung Tâm Chỉ Huy Real-Time & Động Cơ Thi Đua 0-105đ",
    subtitle: "8 cảm biến quét sống & Thang điểm thi đua nề nếp tức thì",
    duration: 18,
    voiceover:
      "Trung tâm Chỉ huy Điều hành Real-Time với 8 cảm biến dữ liệu sống, quét sạch mọi đứt gãy thông tin. Xóa bỏ hoàn toàn bình xét thi đua cảm tính bằng Động cơ Điểm Thi Đua Nề Nếp Tức Thì: Tự động lượng hóa từ sổ đầu bài và chuyên cần thành thang điểm 0 đến 105 điểm, vinh danh bảng vàng Podium minh bạch theo từng ngày.",
    shortCaption:
      "8 cảm biến Real-Time • Động cơ Thi đua 0-105đ • Bảng vàng Podium minh bạch 360 độ",
    badge: "COCKPIT & KPI THI ĐUA",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    keyPoints: [
      "8 cảm biến telemetry quét sống: Chuyên cần, đi muộn, kỷ luật, sổ đầu bài...",
      "Thang điểm chuẩn 0 - 105đ tự động cập nhật từng tiết học",
      "Bảng xếp hạng Podium Top lớp dẫn đầu & phân hiệu benchmark",
      "Đèn cảnh báo rủi ro sớm (Semantic Traffic Light) chấn chỉnh nề nếp",
    ],
  },
  {
    id: 5,
    title: "Khoa Học Phân Tích Điểm Thi & Cảnh Báo Sớm Từ Kỳ 3",
    subtitle: "Phổ điểm chuẩn hóa Gauss, độ lệch chuẩn & can thiệp sớm trước 3-6 tháng",
    duration: 18,
    voiceover:
      "Hệ thống tiên phong ứng dụng Khoa học Phân tích Điểm thi Thực chứng: Tự động dựng phổ điểm chuẩn hóa Gaussian, đo lường độ lệch chuẩn và kiểm định chất lượng đề thi. Thuật toán phân tích quỹ đạo học tập giúp phát hiện sớm học sinh sa sút ngay từ Kỳ kiểm tra thứ 3 – sớm hơn từ 3 đến 6 tháng, kích hoạt ngay hồ sơ can thiệp sư phạm để không học sinh nào bị bỏ lại phía sau.",
    shortCaption:
      "Phổ điểm Gaussian Bell Curve • Cảnh báo sớm từ Kỳ 3 (trước 3-6 tháng) • Hồ sơ can thiệp sư phạm",
    badge: "KHOA HỌC PHỔ ĐIỂM",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    keyPoints: [
      "Phân tích phổ điểm Gauss, độ lệch chuẩn σ đo độ đồng đều kiến thức",
      "Kiểm định độ phân hóa đề thi (Item Discrimination Index)",
      "Bản đồ quỹ đạo 4 trạng thái học sinh (Tiến bộ, Ổn định, Biến động, Sa sút)",
      "Phát hiện sớm từ Kỳ 3 (trước 3-6 tháng) ➔ Lập Hồ sơ can thiệp sư phạm",
    ],
  },
  {
    id: 6,
    title: "Sổ Đầu Bài Số, Thẩm Định 4 Cấp & Khóa Niêm Phong",
    subtitle: "Quy trình thẩm định minh bạch & Khóa dữ liệu kiểm toán bất biến",
    duration: 16,
    voiceover:
      "Sổ đầu bài điện tử 1 chạm giúp cắt giảm 90% áp lực hồ sơ giấy. Quy trình thẩm định 4 cấp chặt chẽ kết hợp cơ chế Khóa niêm phong dữ liệu bất biến, triệt tiêu 100% việc can thiệp hay sửa đổi số liệu tùy tiện, thiết lập chuẩn mực kỷ cương số cao nhất cho nhà trường.",
    shortCaption:
      "Sổ đầu bài số 1 chạm • Thẩm định 4 cấp • Niêm phong khóa dữ liệu bất biến 100%",
    badge: "KỶ CƯƠNG & BẢO MẬT",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    keyPoints: [
      "Ghi sổ đầu bài, điểm danh điện tử 1 chạm trên di động",
      "Luồng thẩm định 4 cấp: Bản nháp ➔ Phân hiệu ➔ Hiệu phó ➔ Hiệu trưởng",
      "Niêm phong khóa dữ liệu cứng (Audit Lock) chống sửa số liệu",
      "Biên bản mở khóa điện tử ghi log kiểm toán vĩnh viễn",
    ],
  },
  {
    id: 7,
    title: "Bảng Vàng Định Lượng & Giải Phóng Người Thầy",
    subtitle: "Tiết kiệm >500 giờ hành chính/năm, cắt giảm 90% chi phí, kiến tạo tương lai",
    duration: 20,
    voiceover:
      "Hệ thống Quản lý Nhà trường Thông minh Đa điểm trường: Tiết kiệm hơn 500 giờ lao động hành chính mỗi năm, cắt giảm 90% chi phí in ấn, giải phóng người thầy để thăng hoa trong chuyên môn và trọn vẹn yêu thương với học trò. Hãy cùng chúng tôi kiến tạo tương lai giáo dục số công bằng và bền vững ngay hôm nay!",
    shortCaption:
      "Tiết kiệm 99% thời gian TKB • Giảm 90% in ấn • Tiết kiệm >500 giờ hành chính/năm",
    badge: "TÁC ĐỘNG & KÊU GỌI",
    badgeColor: "bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 text-emerald-300 border-emerald-500/30",
    keyPoints: [
      "Xếp TKB: 15 Giây (Nhanh hơn 200 lần so với 3-5 ngày)",
      "Báo cáo & Tổng hợp: Tức thì (Tiết kiệm 95% thời gian)",
      "Chi phí in ấn, văn phòng phẩm: Cắt giảm 90%",
      "Thời gian hành chính tiết kiệm: > 500 giờ/trường/năm",
    ],
  },
];

export const TOTAL_VIDEO_DURATION = VIDEO_SCENES.reduce(
  (acc, scene) => acc + scene.duration,
  0
);
