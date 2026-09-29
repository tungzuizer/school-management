export interface VideoScene {
  id: number;
  title: string;
  subtitle: string;
  duration: number; // in seconds
  voiceover: string;
  shortCaption: string;
  badge: string;
  badgeColor: string;
  screenshot: string;
  keyPoints: string[];
}

export interface RealVideoItem {
  id: string;
  title: string;
  subtitle: string;
  category: "master" | "cluster" | "role_guide" | "social_reels";
  categoryLabel: string;
  durationStr: string;
  durationSec: number;
  src: string;
  poster: string;
  badge: string;
  badgeColor: string;
  description: string;
  keyStrengths: string[];
}

export const REAL_VIDEO_PLAYLIST: RealVideoItem[] = [
  {
    id: "master",
    title: "Video Master: Tổng Quan Điều Hành Toàn Trường (25 Tính Năng)",
    subtitle: "Bản báo cáo quản trị toàn diện dành cho Ban Giám Hiệu & Lãnh Đạo Nhà Trường",
    category: "master",
    categoryLabel: "Video Master",
    durationStr: "25:00",
    durationSec: 1500,
    src: "/videos/video_master_toan_truong.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
    badge: "BẢN FULL TOÀN DIỆN",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description:
      "Trải nghiệm toàn diện 25 tính năng cốt lõi: Trung tâm chỉ huy, 6 phân hiệu, TKB AI 15s, sổ đầu bài số, đánh giá TT15, sổ điểm Gauss và kiểm toán niêm phong.",
    keyStrengths: [
      "Xếp TKB tự động 15 giây (nhanh gấp 200 lần, 0% xung đột)",
      "Mạng lưới đồng bộ 100% giữa trung tâm & 6 phân hiệu",
      "Sổ đầu bài số 1 chạm & Thẩm định 4 cấp niêm phong Audit Lock",
      "8 Cảm biến telemetry & Động cơ thi đua nề nếp 0-105đ",
      "Phổ Gauss OLS phát hiện sa sút học tập sớm từ Kỳ 3",
      "Tiết kiệm >500 giờ hành chính/năm & Cắt giảm 90% in ấn",
    ],
  },
  {
    id: "cluster1",
    title: "Cụm 1: Trung Tâm Chỉ Huy & 8 Cảm Biến Telemetry 6 Phân Hiệu",
    subtitle: "Cockpit thời gian thực, giám sát nề nếp 24/7 và cảnh báo rủi ro tức thì",
    category: "cluster",
    categoryLabel: "Phân Hệ Chuyên Sâu",
    durationStr: "07:30",
    durationSec: 450,
    src: "/videos/cluster1_command_dashboard_video.mp4",
    poster: "/videos/cluster1_command_dashboard_video_poster.png",
    badge: "COCKPIT TELEMETRY",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Giám sát trực tiếp 8 cảm biến dữ liệu sống của 1.700 học sinh, 62 lớp học trên toàn bộ 6 phân hiệu phân tán.",
    keyStrengths: [
      "8 cảm biến telemetry quét nề nếp, chuyên cần, kỷ luật 24/7",
      "Ma trận giám sát 6 phân hiệu liên thông tức thì",
      "Động cơ điểm thi đua 0-105đ vinh danh bục vàng Podium",
      "Đèn cảnh báo rủi ro Semantic Traffic Light",
    ],
  },
  {
    id: "cluster2",
    title: "Cụm 2: AI Solver Xếp TKB 15s & Kế Hoạch Bài Dạy Số",
    subtitle: "Thuật toán giải bài toán ràng buộc lớn, gom lịch tránh đèo dốc và sổ đầu bài số",
    category: "cluster",
    categoryLabel: "Phân Hệ Chuyên Sâu",
    durationStr: "07:20",
    durationSec: 440,
    src: "/videos/cluster2_academic_lessonplan_video.mp4",
    poster: "/videos/cluster2_academic_lessonplan_video_poster.png",
    badge: "AI TKB 15 GIÂY",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    description:
      "Giải quyết triệt để nỗi ám ảnh xếp TKB thủ công; tối ưu hóa thời gian di chuyển và bảo vệ an toàn thầy cô.",
    keyStrengths: [
      "Tự động giải bài toán TKB trong 15 giây, 0% trùng lịch",
      "Gom lịch dạy: 1 buổi = 1 điểm trường an toàn đèo núi",
      "Ghi sổ đầu bài điện tử 1 chạm trên smartphone",
      "Kế hoạch bài dạy (Giáo án) thẩm định và lưu trữ số",
    ],
  },
  {
    id: "cluster3",
    title: "Cụm 3: Ma Trận Đánh Giá Giáo Viên Chuẩn TT15/2024/TT-BGDĐT",
    subtitle: "Chuẩn hóa 5 tiêu chuẩn 15 tiêu chí, minh chứng số hóa và xếp loại tự động",
    category: "cluster",
    categoryLabel: "Phân Hệ Chuyên Sâu",
    durationStr: "08:45",
    durationSec: 525,
    src: "/videos/cluster3_teacher_evaluation_tt15_video.mp4",
    poster: "/videos/cluster3_teacher_evaluation_tt15_video_poster.png",
    badge: "CHUẨN TT15/2024",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    description:
      "Tự động hóa quy trình đánh giá chuẩn nghề nghiệp giáo viên cơ sở giáo dục phổ thông theo Thông tư 15.",
    keyStrengths: [
      "Đánh giá chuẩn nghề nghiệp 5 tiêu chuẩn 15 tiêu chí",
      "Tổng hợp kết quả tự đánh giá và tổ chuyên môn minh bạch",
      "Kho minh chứng số hóa đính kèm không lo thất lạc",
      "Phân loại viên chức và thi đua công bằng, chính xác",
    ],
  },
  {
    id: "cluster4",
    title: "Cụm 4: Sổ Điểm Điện Tử & Phổ Chuông Gauss Cảnh Báo Sớm Kỳ 3",
    subtitle: "Phân tích 153.000 bài thi, đo độ lệch chuẩn σ và can thiệp sa sút trước 3-6 tháng",
    category: "cluster",
    categoryLabel: "Phân Hệ Chuyên Sâu",
    durationStr: "05:40",
    durationSec: 340,
    src: "/videos/cluster4_student_gradebook_transcripts_video.mp4",
    poster: "/videos/cluster4_student_gradebook_transcripts_video_poster.png",
    badge: "PHỔ ĐIỂM GAUSS OLS",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description:
      "Ứng dụng thống kê thực chứng và đường cong Gaussian để bảo đảm chất lượng khảo sát và can thiệp sư phạm kịp thời.",
    keyStrengths: [
      "Phổ điểm chuẩn hóa Gauss trên 153.000 bài thi",
      "Hồi quy OLS phát hiện sa sút từ Kỳ 3 (trước 3-6 tháng)",
      "Hồ sơ can thiệp sư phạm 1-1 không để ai bị bỏ lại",
      "Học bạ điện tử liên thông, xuất PDF theo chuẩn BGD",
    ],
  },
  {
    id: "cluster5",
    title: "Cụm 5: Quản Lý Tài Chính, Thiết Bị Dạy Học & Chuẩn EMIS",
    subtitle: "Tự động hóa thu học phí, kiểm kê kho thiết bị phòng học và liên thông dữ liệu ngành",
    category: "cluster",
    categoryLabel: "Phân Hệ Chuyên Sâu",
    durationStr: "06:18",
    durationSec: 378,
    src: "/videos/cluster5_finance_emis_facilities_video.mp4",
    poster: "/videos/cluster5_finance_emis_facilities_video_poster.png",
    badge: "TÀI CHÍNH & EMIS",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    description:
      "Quản trị tài chính công khai, tài sản thiết bị trường học và đồng bộ dữ liệu quốc gia EMIS Bộ GD&ĐT.",
    keyStrengths: [
      "Theo dõi thu chi, công nợ học phí đa phương thức",
      "Quản lý mượn trả thiết bị thí nghiệm và phòng bộ môn",
      "Đồng bộ hai chiều dữ liệu EMIS của Bộ GD&ĐT",
      "Báo cáo tài chính minh bạch cho thanh tra kiểm toán",
    ],
  },
  {
    id: "hdsd_admin",
    title: "Hướng Dẫn Vận Hành Dành Cho Hiệu Trưởng & Ban Giám Hiệu",
    subtitle: "Cẩm nang số toàn diện cho BGH điều hành, phê duyệt 4 cấp và ra quyết định số",
    category: "role_guide",
    categoryLabel: "HDSD Vai Trò",
    durationStr: "25:00",
    durationSec: 1500,
    src: "/videos/video_hdsd_hieu_truong.mp4",
    poster: "/videos/video_hdsd_admin_poster.png",
    badge: "DÀNH CHO BGH",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    description:
      "Hướng dẫn chi tiết từng bước vận hành hệ thống cho Hiệu trưởng và Phó Hiệu trưởng: phê duyệt TKB, duyệt giáo án, niêm phong sổ sách.",
    keyStrengths: [
      "Phê duyệt kế hoạch giáo dục, TKB và giáo án 1 chạm",
      "Giám sát tiến độ chuyên môn của toàn bộ giáo viên",
      "Khóa niêm phong dữ liệu (Audit Lock) chống sửa số liệu",
      "Khai thác báo cáo phân tích chất lượng toàn diện",
    ],
  },
  {
    id: "hdsd_teacher",
    title: "Hướng Dẫn Dành Cho Giáo Viên Bộ Môn & Giáo Viên Chủ Nhiệm",
    subtitle: "Điểm danh sơ đồ lớp trực quan, ghi sổ đầu bài, nhập điểm và nộp giáo án số",
    category: "role_guide",
    categoryLabel: "HDSD Vai Trò",
    durationStr: "14:15",
    durationSec: 855,
    src: "/videos/video_hdsd_giao_vien.mp4",
    poster: "/videos/video_hdsd_teacher_poster.png",
    badge: "DÀNH CHO GIÁO VIÊN",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description:
      "Tối ưu hóa thao tác nghiệp vụ hằng ngày của giáo viên: chỉ mất 30 giây điểm danh, 1 phút ghi sổ đầu bài ngay trên điện thoại.",
    keyStrengths: [
      "Điểm danh học sinh bằng sơ đồ lớp rạp chiếu phim trực quan",
      "Ghi và ký sổ đầu bài điện tử ngay sau tiết dạy",
      "Nhập điểm nhanh chóng, kiểm tra phổ điểm tức thời",
      "Nộp và quản lý kho kế hoạch bài dạy số",
    ],
  },
  {
    id: "hdsd_student",
    title: "Hướng Dẫn Dành Cho Học Sinh & Phụ Huynh",
    subtitle: "Tra cứu thời khóa biểu, theo dõi điểm số, nề nếp và nhận thông báo tức thì",
    category: "role_guide",
    categoryLabel: "HDSD Vai Trò",
    durationStr: "06:45",
    durationSec: 405,
    src: "/videos/video_hdsd_hoc_sinh.mp4",
    poster: "/videos/video_hdsd_student_poster.png",
    badge: "HỌC SINH & PHỤ HUYNH",
    badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    description:
      "Cầu nối số gắn kết chặt chẽ gia đình và nhà trường: xem lịch học, nhận thông báo đổi tiết và kết quả rèn luyện minh bạch.",
    keyStrengths: [
      "Tra cứu TKB cá nhân và thông báo đổi tiết",
      "Xem bảng điểm chi tiết và nhận xét của thầy cô",
      "Theo dõi điểm thi đua nề nếp hàng tuần",
      "Nhận nhắc nhở lịch học và hoạt động nhà trường",
    ],
  },
  {
    id: "social_reels",
    title: "Video Ngắn Viral Reels / TikTok 30s: Đột Phá Quản Trị Trường Học",
    subtitle: "Clip ngắn 30 giây truyền thông mạnh mẽ trên mạng xã hội Facebook Reels & TikTok",
    category: "social_reels",
    categoryLabel: "Video Ngắn 30s",
    durationStr: "00:30",
    durationSec: 30,
    src: "/videos/reels_fb_school_management.mp4",
    poster: "/videos/reels_fb_school_management_poster.png",
    badge: "VIRAL REELS 30S",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    description:
      "Tập trung vào thông điệp cốt lõi: Giải phóng người thầy khỏi áp lực sổ sách giấy tờ, kiến tạo trường học số thông minh.",
    keyStrengths: [
      "Định dạng dọc 9:16 & ngang 16:9 sắc nét",
      "Thông điệp mạnh mẽ, nhịp độ nhanh cuốn hút",
      "Dễ dàng chia sẻ trên mạng xã hội và kênh truyền thông",
      "Tối ưu hóa cho chiến dịch truyền thông diện rộng",
    ],
  },
];

export const VIDEO_SCENES: VideoScene[] = [
  {
    id: 1,
    title: "Nỗi Đau & Thách Thức Quản Trị Truyền Thống",
    subtitle: "5 nút thắt sống còn đè nặng lên các trường đa điểm trường",
    duration: 16,
    voiceover:
      "Trong suốt nhiều thập kỷ, công tác quản trị trường học luôn đối mặt với những rào cản vô hình: Hàng trăm trang sổ sách thủ công đè nặng lên vai người thầy; Xếp thời khóa biểu căng thẳng mất 3 đến 5 ngày; Khoảng cách địa lý chia cắt thông tin giữa 6 điểm trường; Và thi đua dồn cục cảm tính vào cuối năm.",
    shortCaption:
      "Hàng trăm trang sổ sách đè nặng • Xếp TKB mất 3-5 ngày • Đứt gãy thông tin giữa 6 điểm trường",
    badge: "HIỆN TRẠNG & NỖI ĐAU",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    screenshot: "/screenshots/real_web/01_landing_hero.png",
    keyPoints: [
      "Sổ đầu bài, sổ điểm ghi tay 100+ trang/giáo viên",
      "Xếp TKB thủ công mất 3 - 5 ngày căng thẳng",
      "6 điểm trường phân tán, báo cáo gửi chậm trễ",
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
    screenshot: "/screenshots/real_web/03_admin_dashboard.png",
    keyPoints: [
      "Nền tảng Cloud đồng bộ đa thiết bị 24/7",
      "Xóa nhòa hoàn toàn rào cản địa lý giữa 6 phân hiệu",
      "Tối ưu hóa vận hành cho 1.700 học sinh & 126 giáo viên",
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
    screenshot: "/screenshots/real_web/04_admin_schedule.png",
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
      "Trung tâm Chỉ huy Điều hành Real-Time với 8 cảm biến dữ liệu sống, quét sạch mọi đứt gãy thông tin giữa 6 phân hiệu. Xóa bỏ hoàn toàn bình xét thi đua cảm tính bằng Động cơ Điểm Thi Đua Nề Nếp Tức Thì: Tự động lượng hóa từ sổ đầu bài và chuyên cần thành thang điểm 0 đến 105 điểm, vinh danh bảng vàng Podium minh bạch cho 62 lớp theo từng ngày.",
    shortCaption:
      "8 cảm biến Real-Time • Động cơ Thi đua 0-105đ • Bảng vàng Podium minh bạch 62 lớp",
    badge: "COCKPIT & KPI THI ĐUA",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    screenshot: "/screenshots/real_web/08_admin_kpi.png",
    keyPoints: [
      "8 cảm biến telemetry quét sống: Chuyên cần 98.7%, đi muộn, kỷ luật, sổ đầu bài...",
      "Thang điểm chuẩn 0 - 105đ tự động cập nhật từng tiết học",
      "Bảng xếp hạng Podium Top 62 lớp & 6 phân hiệu benchmark",
      "Đèn cảnh báo rủi ro sớm (Semantic Traffic Light) chấn chỉnh nề nếp",
    ],
  },
  {
    id: 5,
    title: "Khoa Học Phân Tích Điểm Thi & Cảnh Báo Sớm Từ Kỳ 3",
    subtitle: "Phổ điểm chuẩn hóa Gauss, độ lệch chuẩn & can thiệp sớm trước 3-6 tháng",
    duration: 18,
    voiceover:
      "Hệ thống tiên phong ứng dụng Khoa học Phân tích Điểm thi Thực chứng trên hơn 153.000 bài thi: Tự động dựng phổ điểm chuẩn hóa Gaussian, đo lường độ lệch chuẩn và kiểm định chất lượng đề thi. Thuật toán phân tích quỹ đạo học tập giúp phát hiện sớm học sinh sa sút ngay từ Kỳ kiểm tra thứ 3 – sớm hơn từ 3 đến 6 tháng, kích hoạt ngay hồ sơ can thiệp sư phạm để không học sinh nào bị bỏ lại phía sau.",
    shortCaption:
      "Phổ điểm Gaussian Bell Curve • Cảnh báo sớm từ Kỳ 3 (trước 3-6 tháng) • Hồ sơ can thiệp sư phạm",
    badge: "KHOA HỌC PHỔ ĐIỂM",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    screenshot: "/screenshots/real_web/06_admin_exam_analytics.png",
    keyPoints: [
      "Phân tích phổ điểm Gauss, độ lệch chuẩn σ trên 153.000 bài thi",
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
    screenshot: "/screenshots/real_web/07_admin_journals.png",
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
    screenshot: "/screenshots/real_web/03_admin_dashboard.png",
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
