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
    title: "Video Master 5 Phút: 6 Điểm Mạnh Sát Thủ của QLTHVN",
    subtitle: "Bản báo cáo quản trị tinh hoa 05:00 dành cho Ban Giám Hiệu & Lãnh Đạo Nhà Trường",
    category: "master",
    categoryLabel: "Video Master",
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
