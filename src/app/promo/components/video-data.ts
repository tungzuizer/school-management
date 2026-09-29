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
  category: "master" | "teaser" | "social_reels";
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
    title: "Video Pitch Master 5 Phút: 6 Điểm Mạnh Sát Thủ của QLTHVN",
    subtitle: "Bản báo cáo quản trị tinh hoa 05:00 dành cho Ban Giám Hiệu & Lãnh Đạo Nhà Trường",
    category: "master",
    categoryLabel: "Video Master 5P",
    durationStr: "05:00",
    durationSec: 300,
    src: "/videos/video_master_toan_truong.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
    badge: "TINH HOA 5 PHÚT",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description:
      "Tập trung 100% vào 6 đột phá công nghệ cốt lõi: TKB AI 15s, 6 phân hiệu liên thông, Sổ đầu bài Audit Lock, 8 cảm biến Telemetry 0-105đ, Phổ Gauss OLS cảnh báo sớm và Chuẩn TT15.",
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
    id: "teaser_tkb",
    title: "Teaser 1: AI Solver Xếp TKB 15 Giây & Gom Lịch An Toàn Vượt Đèo",
    subtitle: "Thuật toán giải bài toán ràng buộc lớn, gom lịch 1 buổi/1 điểm trường an toàn đèo núi",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster2_academic_lessonplan_video.mp4",
    poster: "/screenshots/real_web/04_admin_schedule.png",
    badge: "AI TKB 15 GIÂY",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Giải quyết triệt để nỗi ám ảnh xếp TKB thủ công; tối ưu hóa thời gian di chuyển và bảo vệ an toàn thầy cô trên cung đường đèo núi.",
    keyStrengths: [
      "Tự động giải bài toán TKB trong 15 giây, 0% trùng lịch",
      "Gom lịch dạy: 1 buổi = 1 điểm trường an toàn đèo núi",
      "Nhanh gấp 200 lần xếp thủ công truyền thống",
      "Tối ưu phòng học chức năng & giáo viên liên trường",
    ],
  },
  {
    id: "teaser_multicampus",
    title: "Teaser 2: Mạng Lưới 6 Phân Hiệu Liên Thông Realtime Trên 1 Cockpit",
    subtitle: "Đồng bộ dữ liệu sống 1.700 học sinh, 62 lớp và 126 giáo viên không độ trễ",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster1_command_dashboard_video.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
    badge: "6 PHÂN HIỆU REALTIME",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    description:
      "Xóa nhòa hoàn toàn rào cản địa lý giữa Điểm trường Trung tâm và toàn bộ 6 phân hiệu phân tán trên màn hình Cockpit BGH.",
    keyStrengths: [
      "Đồng bộ thời gian thực giữa trung tâm & 6 phân hiệu",
      "Quản trị tập trung 1.700 học sinh, 62 lớp, 126 giáo viên",
      "Xóa nhòa hoàn toàn khoảng cách địa lý và độ trễ báo cáo",
      "Màn hình Cockpit chỉ huy thông minh hỗ trợ BGH ra quyết định tức thì",
    ],
  },
  {
    id: "teaser_auditlock",
    title: "Teaser 3: Sổ Đầu Bài Số & Thẩm Định 4 Cấp Khóa Niêm Phong Audit Lock",
    subtitle: "Ghi sổ 1 chạm trên di động, quy trình thẩm định nghiêm ngặt chống sửa số liệu 100%",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster2_academic_lessonplan_video.mp4",
    poster: "/screenshots/real_web/07_admin_journals.png",
    badge: "AUDIT LOCK 4 CẤP",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    description:
      "Quy trình thẩm định 4 cấp từ GVBM ➔ GVCN ➔ PHT ➔ HT với khóa niêm phong Audit Lock bất biến, minh chứng kiểm toán chuẩn xác.",
    keyStrengths: [
      "Ghi sổ đầu bài & điểm danh 1 chạm trên di động ngay tại lớp",
      "Quy trình thẩm định 4 cấp: GVBM ➔ GVCN ➔ PHT ➔ HT",
      "Khóa niêm phong cứng (Audit Lock) chống sửa số liệu 100%",
      "Ghi nhật ký kiểm toán (Audit Trail) minh bạch cho thanh tra giáo dục",
    ],
  },
  {
    id: "teaser_telemetry",
    title: "Teaser 4: 8 Cảm Biến Telemetry & Động Cơ Điểm Thi Đua 0-105đ",
    subtitle: "Giám sát nề nếp 24/7, vinh danh Bục vàng Podium xóa bỏ đánh giá cảm tính",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster1_command_dashboard_video.mp4",
    poster: "/screenshots/real_web/08_admin_kpi.png",
    badge: "TELEMETRY & PODIUM",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description:
      "Thu thập dữ liệu chuyên cần, nề nếp từng tiết học để tự động lượng hóa thang điểm 0-105đ và vinh danh bục vàng Podium mỗi tuần.",
    keyStrengths: [
      "8 cảm biến telemetry quét nề nếp, chuyên cần, kỷ luật 24/7",
      "Thang điểm chuẩn 0 - 105đ tự động cập nhật từng tiết học",
      "Vinh danh Bục vàng Podium Top 62 lớp & phân hiệu hàng tuần",
      "Đèn cảnh báo rủi ro Semantic Traffic Light chấn chỉnh nề nếp tức thì",
    ],
  },
  {
    id: "teaser_gauss",
    title: "Teaser 5: Khoa Học Phổ Gauss 153.000 Bài Thi & Cảnh Báo Sớm Kỳ 3",
    subtitle: "Hồi quy OLS phát hiện sa sút học tập trước 3-6 tháng, lập hồ sơ can thiệp 1-1",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster4_student_gradebook_transcripts_video.mp4",
    poster: "/screenshots/real_web/06_admin_exam_analytics.png",
    badge: "GAUSS & OLS REGRESSION",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    description:
      "Ứng dụng đường cong Gaussian Bell Curve và mô hình hồi quy tuyến tính OLS trên 153.000 bài thi để can thiệp sư phạm kịp thời.",
    keyStrengths: [
      "Phân tích phổ điểm Gauss, độ lệch chuẩn σ trên 153.000 bài thi",
      "Kiểm định độ phân hóa và độ tin cậy của đề kiểm tra",
      "Bản đồ 4 quỹ đạo học sinh: Tiến bộ, Ổn định, Biến động, Sa sút",
      "Cảnh báo sớm từ Kỳ 3 (trước 3-6 tháng) ➔ Hồ sơ can thiệp sư phạm 1-1",
    ],
  },
  {
    id: "teaser_roi",
    title: "Teaser 6: Cắt Giảm 90% In Ấn, Tiết Kiệm >500h & Chuẩn TT15/2024",
    subtitle: "Chuẩn hóa 16 vai trò, giải phóng người thầy khỏi áp lực sổ sách giấy tờ",
    category: "teaser",
    categoryLabel: "Teaser Đột Phá",
    durationStr: "01:30",
    durationSec: 90,
    src: "/videos/cluster3_teacher_evaluation_tt15_video.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
    badge: "ROI & CHUẨN TT15",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description:
      "Mỗi trường học tiết kiệm hơn 500 giờ làm việc hành chính/năm, cắt giảm 90% chi phí in ấn và chuẩn hóa 5 tiêu chuẩn 15 tiêu chí theo TT15.",
    keyStrengths: [
      "Tiết kiệm > 500 giờ làm việc hành chính/trường/năm cho cán bộ giáo viên",
      "Cắt giảm 90% chi phí in ấn văn phòng phẩm và sổ sách giấy tờ",
      "Tự động hóa đánh giá 5 tiêu chuẩn 15 tiêu chí theo Thông tư 15/2024",
      "Đồng bộ liên thông dữ liệu hai chiều chuẩn cơ sở dữ liệu ngành EMIS",
    ],
  },
  {
    id: "reels_main",
    title: "Social Reel 30s: Giải Phóng Người Thầy Khỏi Áp Lực Sổ Sách Giấy Tờ",
    subtitle: "Video ngắn truyền thông mạng xã hội Facebook Reels & TikTok",
    category: "social_reels",
    categoryLabel: "Viral Reels 30s",
    durationStr: "00:30",
    durationSec: 30,
    src: "/videos/reels_fb_school_management.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
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
  {
    id: "reels_tkb",
    title: "Social Reel 45s: 15 Giây Xong Thời Khóa Biểu Cả Trường - Chấm Dứt Thức Đêm",
    subtitle: "Cú hích chuyển đổi số giải quyết bài toán đau đầu nhất đầu năm học",
    category: "social_reels",
    categoryLabel: "Viral Reels 45s",
    durationStr: "00:45",
    durationSec: 45,
    src: "/videos/reels_fb_school_management.mp4",
    poster: "/screenshots/real_web/04_admin_schedule.png",
    badge: "AI SOLVER REELS",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Video ngắn làm nổi bật tốc độ xếp TKB 15 giây và thuật toán gom lịch bảo vệ an toàn thầy cô.",
    keyStrengths: [
      "Nhịp điệu dồn dập, nêu bật sự khác biệt 15s vs 5 ngày",
      "Trực quan hóa thuật toán AI giải hàng ngàn ràng buộc",
      "Kêu gọi hành động trải nghiệm thử trên qlthvn.com",
      "Tối ưu hóa cho người xem trên di động",
    ],
  },
  {
    id: "reels_bgh",
    title: "Social Reel 45s: Quyền Năng Quản Trị 6 Phân Hiệu Trong Tầm Tay Hiệu Trưởng",
    subtitle: "Cockpit chỉ huy thông minh - xóa nhòa khoảng cách địa lý đèo núi",
    category: "social_reels",
    categoryLabel: "Viral Reels 45s",
    durationStr: "00:45",
    durationSec: 45,
    src: "/videos/reels_fb_school_management.mp4",
    poster: "/screenshots/real_web/03_admin_dashboard.png",
    badge: "COCKPIT REELS",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    description:
      "Khẳng định vị thế và năng lực điều hành số hóa toàn diện của Ban Giám Hiệu với 8 cảm biến Telemetry.",
    keyStrengths: [
      "Trải nghiệm giám sát thời gian thực mọi biến động trường lớp",
      "Xóa bỏ hoàn toàn tình trạng chờ đợi báo cáo giấy tờ",
      "Khóa niêm phong Audit Lock 4 cấp bảo mật tuyệt đối",
      "Định vị thương hiệu trường học chuyển đổi số xuất sắc",
    ],
  },
];

export const VIDEO_SCENES: VideoScene[] = [
  {
    id: 1,
    title: "Điểm Mạnh #1: AI Solver Xếp TKB 15 Giây & Gom Lịch An Toàn",
    subtitle: "Giải quyết hàng ngàn ràng buộc trong 15s, 0% xung đột, tối ưu di chuyển vùng cao",
    duration: 50,
    voiceover:
      "Điểm mạnh sát thủ đầu tiên của QLTHVN chính là Thuật toán AI Solver Xếp Thời khóa biểu tự động trong đúng 15 giây! Thay vì mất 3 đến 5 ngày ròng rã xếp tay dễ trùng lịch, hệ thống giải quyết đồng thời hàng ngàn ràng buộc sư phạm phức tạp, triệt tiêu 100% xung đột phòng học và giáo viên. Đặc biệt, thuật toán gom lịch thông minh bảo đảm 1 buổi giáo viên chỉ dạy tại đúng 1 điểm trường, bảo vệ tuyệt đối an toàn cho thầy cô khi di chuyển qua đèo dốc mùa mưa lũ.",
    shortCaption:
      "Xếp TKB tự động 15s • Nhanh gấp 200 lần • 0% xung đột • Gom lịch an toàn vượt đèo núi",
    badge: "ĐIỂM MẠNH #1: TKB 15S",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    screenshot: "/screenshots/real_web/04_admin_schedule.png",
    keyPoints: [
      "Thời gian xếp TKB giảm từ 3-5 ngày xuống còn đúng 15 GIÂY",
      "Triệt tiêu 100% xung đột lịch dạy giáo viên & phòng chức năng",
      "Thuật toán gom lịch liên trường: 1 buổi = 1 điểm trường",
      "Bảo vệ an toàn tính mạng thầy cô trên các cung đường đèo hiểm trở",
    ],
  },
  {
    id: 2,
    title: "Điểm Mạnh #2: Mạng Lưới Đa Phân Hiệu Liên Thông 100%",
    subtitle: "Đồng bộ thời gian thực giữa điểm trung tâm và 6 phân hiệu trên Cockpit chỉ huy",
    duration: 50,
    voiceover:
      "Điểm mạnh thứ hai là Khả năng liên thông đa phân hiệu 100% theo thời gian thực. Hệ thống xóa nhòa hoàn toàn rào cản địa lý giữa Điểm trường Trung tâm và toàn bộ 6 phân hiệu gồm Phố Lu, An Tiến, Sơn Hải, Sơn Hà 1, Sơn Hà 2 và Tân Thành. Mọi biến động về sĩ số 1.700 học sinh, 62 lớp và 126 cán bộ giáo viên đều được cập nhật tức thì về Trung tâm Chỉ huy Cockpit của Ban Giám Hiệu, giúp lãnh đạo ra quyết định chính xác mà không cần chờ báo cáo giấy.",
    shortCaption:
      "Liên thông 100% dữ liệu • Đồng bộ 6 phân hiệu • 1.700 học sinh & 62 lớp trên 1 Cockpit",
    badge: "ĐIỂM MẠNH #2: ĐA PHÂN HIỆU",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    screenshot: "/screenshots/real_web/03_admin_dashboard.png",
    keyPoints: [
      "Đồng bộ thời gian thực giữa trung tâm & 6 phân hiệu phân tán",
      "Quản trị tập trung 1.700 học sinh, 62 lớp, 126 giáo viên",
      "Xóa nhòa hoàn toàn khoảng cách địa lý và độ trễ báo cáo",
      "Màn hình Cockpit chỉ huy thông minh hỗ trợ BGH ra quyết định tức thì",
    ],
  },
  {
    id: 3,
    title: "Điểm Mạnh #3: Sổ Đầu Bài Số & Thẩm Định 4 Cấp Niêm Phong",
    subtitle: "Ghi sổ 1 chạm trên điện thoại, quy trình thẩm định 4 cấp & Audit Lock bất biến",
    duration: 50,
    voiceover:
      "Điểm mạnh thứ ba là Sổ đầu bài điện tử và Quy trình Thẩm định 4 cấp có khóa Niêm phong Audit Lock. Giáo viên bộ môn ghi nhận tiết dạy chỉ bằng một chạm trên điện thoại ngay tại lớp. Dữ liệu sau đó đi qua quy trình phê duyệt nghiêm ngặt 4 cấp: từ Giáo viên Bộ môn, Giáo viên Chủ nhiệm, Phó Hiệu trưởng đến Hiệu trưởng. Sau khi duyệt, hệ thống kích hoạt Khóa Niêm Phong bất biến, ghi log kiểm toán vĩnh viễn, ngăn chặn 100% tình trạng can thiệp hoặc sửa đổi số liệu tùy tiện.",
    shortCaption:
      "Sổ đầu bài 1 chạm • Phê duyệt 4 cấp (GVBM ➔ GVCN ➔ PHT ➔ HT) • Niêm phong Audit Lock 100%",
    badge: "ĐIỂM MẠNH #3: AUDIT LOCK 4 CẤP",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    screenshot: "/screenshots/real_web/07_admin_journals.png",
    keyPoints: [
      "Ghi sổ đầu bài & điểm danh 1 chạm trên di động ngay tại lớp",
      "Quy trình thẩm định 4 cấp: GVBM ➔ GVCN ➔ PHT ➔ HT",
      "Khóa niêm phong cứng (Audit Lock) chống sửa số liệu 100%",
      "Ghi nhật ký kiểm toán (Audit Trail) minh bạch cho thanh tra giáo dục",
    ],
  },
  {
    id: 4,
    title: "Điểm Mạnh #4: 8 Cảm Biến Telemetry & Động Cơ Thi Đua 0-105đ",
    subtitle: "Giám sát nề nếp 24/7, loại bỏ đánh giá cảm tính & vinh danh Bục vàng Podium",
    duration: 50,
    voiceover:
      "Điểm mạnh thứ tư là 8 Cảm biến Telemetry dữ liệu sống và Động cơ Thi đua nề nếp 0 đến 105 điểm. Hệ thống tự động thu thập dữ liệu chuyên cần, nề nếp, kỷ luật từng tiết học để tính điểm thi đua khách quan cho 62 lớp mỗi ngày. Không còn tình trạng bình xét cảm tính hay dồn cục cuối học kỳ. Bảng vàng Podium tự động vinh danh các tập thể xuất sắc hàng tuần, kết hợp hệ thống đèn tín hiệu Semantic Traffic Light cảnh báo sớm các lớp có dấu hiệu sa sút nề nếp để can thiệp kịp thời.",
    shortCaption:
      "8 Cảm biến Telemetry • Điểm thi đua 0-105đ tức thì • Vinh danh Bục vàng Podium 62 lớp",
    badge: "ĐIỂM MẠNH #4: TELEMETRY & THI ĐUA",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    screenshot: "/screenshots/real_web/08_admin_kpi.png",
    keyPoints: [
      "8 cảm biến telemetry quét nề nếp, chuyên cần, kỷ luật 24/7",
      "Thang điểm chuẩn 0 - 105đ tự động cập nhật từng tiết học",
      "Vinh danh Bục vàng Podium Top 62 lớp & phân hiệu hàng tuần",
      "Đèn cảnh báo rủi ro Semantic Traffic Light chấn chỉnh nề nếp tức thì",
    ],
  },
  {
    id: 5,
    title: "Điểm Mạnh #5: Khoa Học Phổ Gauss & Cảnh Báo Sớm Từ Kỳ 3",
    subtitle: "Phân tích 153.000 bài thi theo đường cong Gauss & phát hiện sa sút trước 3-6 tháng",
    duration: 50,
    voiceover:
      "Điểm mạnh thứ năm là Ứng dụng Khoa học Thống kê Phổ điểm Gauss trên hơn 153.000 bài thi thực tế. Hệ thống đo lường độ lệch chuẩn xích-ma, kiểm định độ phân hóa đề thi và vẽ bản đồ quỹ đạo học tập của từng học sinh. Thuật toán hồi quy tuyến tính OLS giúp phát hiện sớm học sinh có nguy cơ sa sút ngay từ Kỳ kiểm tra thứ 3 – sớm hơn từ 3 đến 6 tháng so với kỳ thi học kỳ, tự động kích hoạt Hồ sơ can thiệp sư phạm 1 kèm 1 để nâng đỡ kịp thời từng em.",
    shortCaption:
      "Phổ điểm Gaussian Bell Curve • Hồi quy OLS • Cảnh báo sớm từ Kỳ 3 trước 3-6 tháng",
    badge: "ĐIỂM MẠNH #5: PHỔ GAUSS OLS",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    screenshot: "/screenshots/real_web/06_admin_exam_analytics.png",
    keyPoints: [
      "Phân tích phổ điểm Gauss, độ lệch chuẩn σ trên 153.000 bài thi",
      "Kiểm định độ phân hóa và độ tin cậy của đề kiểm tra",
      "Bản đồ 4 quỹ đạo học sinh: Tiến bộ, Ổn định, Biến động, Sa sút",
      "Cảnh báo sớm từ Kỳ 3 (trước 3-6 tháng) ➔ Hồ sơ can thiệp sư phạm 1-1",
    ],
  },
  {
    id: 6,
    title: "Điểm Mạnh #6: Tiết Kiệm >500 Giờ & Chuẩn Hóa 16 Vai Trò TT15",
    subtitle: "Cắt giảm 90% in ấn, tiết kiệm >500h hành chính/năm & liên thông dữ liệu EMIS",
    duration: 50,
    voiceover:
      "Điểm mạnh thứ sáu là Khả năng tiết kiệm vượt trội và Chuẩn hóa 16 vai trò theo Thông tư 15/2024 của Bộ GD&ĐT. Mỗi trường học tiết kiệm hơn 500 giờ làm việc hành chính mỗi năm, cắt giảm 90% chi phí in ấn sổ sách, đồng thời tự động hóa toàn bộ quy trình đánh giá 5 tiêu chuẩn 15 tiêu chí chuẩn nghề nghiệp giáo viên. QLTHVN đồng bộ dữ liệu chuẩn quốc gia EMIS, giải phóng hoàn toàn người thầy khỏi biển sổ sách để tập trung trọn vẹn cho sứ mệnh trồng người.",
    shortCaption:
      "Tiết kiệm >500 giờ hành chính/năm • Giảm 90% in ấn • Chuẩn hóa 16 vai trò TT15/2024 & EMIS",
    badge: "ĐIỂM MẠNH #6: TIẾT KIỆM & TT15",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    screenshot: "/screenshots/real_web/03_admin_dashboard.png",
    keyPoints: [
      "Tiết kiệm > 500 giờ làm việc hành chính/trường/năm cho cán bộ giáo viên",
      "Cắt giảm 90% chi phí in ấn văn phòng phẩm và sổ sách giấy tờ",
      "Tự động hóa đánh giá 5 tiêu chuẩn 15 tiêu chí theo Thông tư 15/2024",
      "Đồng bộ liên thông dữ liệu hai chiều chuẩn cơ sở dữ liệu ngành EMIS",
    ],
  },
];

export const TOTAL_VIDEO_DURATION = VIDEO_SCENES.reduce(
  (acc, scene) => acc + scene.duration,
  0
);
