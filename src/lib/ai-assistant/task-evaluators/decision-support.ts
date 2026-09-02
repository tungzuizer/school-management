/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/lib/ai-assistant/analysis-engine.ts`.
 * 2. Affected APIs: `src/lib/ai-assistant/task-evaluators/decision-support.ts`.
 * 3. Schemas: `AggregatedSchoolSnapshot`, `DecisionSupportResult`, `DecisionOption`.
 * 4. Verbatim User Instruction: "/ecc:plan cập nhập đự án phần mềm để phù hợp với nghị đinh mới này và phần mềm sẽ hỗ trợ hiệu trưởng hãy làm thật chi tiết và hoàn thiện"
 */

import {
  AggregatedSchoolSnapshot,
  DecisionSupportResult,
  DecisionOption,
} from "../types";

/**
 * Task Group 3: Decision Support Studio
 * Provides structured 3-option decision matrices, feasibility scores, pros/cons,
 * Vietnamese legal basis citations (NQ 37/2026/NQ-CP, ND 178/2024, ND 67/2025, ND 154/2025, TT 32/2020), and step-by-step roadmaps.
 */
export async function evaluateDecisionSupport(
  query: string,
  data: AggregatedSchoolSnapshot
): Promise<DecisionSupportResult> {
  const normalizedQuery = query.toLowerCase();

  // Determine query domain to generate contextually relevant options
  let domain = "GENERAL";
  if (
    normalizedQuery.includes("37/2026") ||
    normalizedQuery.includes("nghị quyết 37") ||
    normalizedQuery.includes("sắp xếp bộ máy") ||
    normalizedQuery.includes("ban giám hiệu") ||
    normalizedQuery.includes("phó hiệu trưởng") ||
    normalizedQuery.includes("dôi dư")
  ) {
    domain = "NQ37_RESTRUCTURING";
  } else if (
    normalizedQuery.includes("bảo lưu") ||
    normalizedQuery.includes("phụ cấp") ||
    normalizedQuery.includes("178/2024") ||
    normalizedQuery.includes("67/2025")
  ) {
    domain = "ALLOWANCE_PRESERVATION";
  } else if (
    normalizedQuery.includes("tinh giản") ||
    normalizedQuery.includes("154/2025") ||
    normalizedQuery.includes("nghỉ hưu trước tuổi")
  ) {
    domain = "STAFF_DOWNSIZING";
  } else if (
    normalizedQuery.includes("chuẩn hóa") ||
    normalizedQuery.includes("36 tháng") ||
    normalizedQuery.includes("nhân sự hỗ trợ") ||
    normalizedQuery.includes("văn bằng")
  ) {
    domain = "SUPPORT_STAFF_STANDARDIZATION";
  } else if (normalizedQuery.includes("nghỉ") || normalizedQuery.includes("chuyên cần") || normalizedQuery.includes("bỏ học")) {
    domain = "ATTENDANCE";
  } else if (normalizedQuery.includes("giáo viên") || normalizedQuery.includes("dạy thay") || normalizedQuery.includes("thiếu gv")) {
    domain = "TEACHER_SHORTAGE";
  } else if (normalizedQuery.includes("thiết bị") || normalizedQuery.includes("cơ sở vật chất") || normalizedQuery.includes("phòng máy")) {
    domain = "FACILITIES";
  } else if (normalizedQuery.includes("giáo án") || normalizedQuery.includes("tiến độ") || normalizedQuery.includes("chuyên môn")) {
    domain = "ACADEMIC";
  } else if (normalizedQuery.includes("phụ huynh") || normalizedQuery.includes("phản ánh") || normalizedQuery.includes("bán trú")) {
    domain = "PARENT_RELATIONS";
  }

  let options: DecisionOption[] = [];
  let executiveSummary = "";

  if (domain === "NQ37_RESTRUCTURING") {
    executiveSummary = `Căn cứ Điều 4 Nghị quyết 37/2026/NQ-CP: Cơ sở giáo dục sau sắp xếp bố trí duy nhất 01 Hiệu trưởng, 01 Phó Hiệu trưởng tại Trường chính và 01 Phó Hiệu trưởng tại mỗi Phân hiệu. Thời hạn hoàn thành kiện toàn trước 30/09/2026 (Điều 8). Cán bộ dôi dư được bảo lưu phụ cấp theo NĐ 178/2024/NĐ-CP hoặc giải quyết tinh giản biên chế theo NĐ 154/2025/NĐ-CP.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Khuyến nghị BGH): Bố trí Phó Hiệu trưởng dôi dư sang giảng dạy kiêm Tổ trưởng chuyên môn & Bảo lưu phụ cấp",
        description: "Điều chuyển Phó Hiệu trưởng dôi dư sang ngạch giáo viên bộ môn có trình độ chuyên môn cao, giao kiêm nhiệm Tổ trưởng chuyên môn; áp dụng chế độ bảo lưu phụ cấp chức vụ lãnh đạo theo Nghị định 178/2024/NĐ-CP và Nghị định 67/2025/NĐ-CP.",
        score: 95,
        pros: [
          "Giữ vững khối đoàn kết nội bộ, tận dụng tối đa kinh nghiệm quản lý và năng lực sư phạm của cán bộ.",
          "Đảm bảo đầy đủ quyền lợi chính sách tiền lương và phụ cấp theo Điều 11 Nghị định 178/2024/NĐ-CP.",
          "Đáp ứng 100% định mức biên chế chuẩn của Nghị quyết 37/2026/NQ-CP trước hạn chót 30/09/2026.",
        ],
        cons: [
          "Cần phân bổ lại số tiết giảng dạy và thời khóa biểu trong tổ chuyên môn.",
        ],
        estimatedCostOrResource: "Chi trả từ nguồn ngân sách nhà nước theo cơ chế bảo lưu phụ cấp hiện hành.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Lập danh sách trích ngang và tờ trình phương án sắp xếp BGH theo mẫu NQ 37 gửi Sở GD&ĐT.",
          "2. Họp trao đổi và nắm bắt tâm tư, nguyện vọng chuyên môn của Phó Hiệu trưởng dôi dư.",
          "3. Ban hành quyết định phân công nhiệm vụ chuyên môn mới và xác nhận mức bảo lưu phụ cấp chức vụ.",
          "4. Cập nhật hồ sơ nhân sự trên hệ thống School Management trước 30/09/2026.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2: Đề xuất điều động, bổ nhiệm luân chuyển sang cơ sở giáo dục khác còn thiếu Phó Hiệu trưởng",
        description: "Báo cáo Sở GD&ĐT điều động cán bộ sang trường học hoặc phân hiệu bạn trên cùng địa bàn đang khuyết vị trí lãnh đạo.",
        score: 85,
        pros: [
          "Giữ nguyên chức danh quản lý cho cán bộ, hỗ trợ kịp thời đơn vị bạn.",
          "Bộ máy nhà trường tinh gọn tuyệt đối đúng định mức ngay lập tức.",
        ],
        cons: [
          "Phụ thuộc vào chỉ tiêu điều động và quyết định phê duyệt của Giám đốc Sở GD&ĐT.",
          "Cán bộ có thể phải thay đổi khoảng cách đi lại.",
        ],
        estimatedCostOrResource: "Không phát sinh chi phí cho trường.",
        feasibility: "CAO",
        riskLevel: "VỪA",
        actionSteps: [
          "1. Rà soát nhu cầu bổ nhiệm lãnh đạo của các trường lân cận qua cổng liên trường Sở GD&ĐT.",
          "2. Soạn công văn đề xuất điều động gửi Phòng Tổ chức Cán bộ - Sở GD&ĐT.",
        ],
      },
      {
        optionNumber: 3,
        title: "Phương án 3: Giải quyết chính sách tinh giản biên chế nếu cán bộ có nguyện vọng",
        description: "Thực hiện quy trình nghỉ hưu trước tuổi hoặc thôi việc ngay có hưởng trợ cấp theo Nghị định số 154/2025/NĐ-CP đối với cán bộ tự nguyện xin nghỉ.",
        score: 75,
        pros: [
          "Thực hiện triệt để chính sách tinh gọn bộ máy của Chính phủ.",
          "Cán bộ nhận đầy đủ chế độ trợ cấp tài chính một lần theo quy định.",
        ],
        cons: [
          "Mất đi cán bộ có nhiều năm kinh nghiệm quản lý giáo dục.",
          "Thời gian thẩm định hồ sơ chế độ tại Sở Nội vụ kéo dài.",
        ],
        estimatedCostOrResource: "Chi trả từ nguồn kinh phí tinh giản biên chế của ngân sách thành phố.",
        feasibility: "TRUNG BÌNH",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Tiếp nhận đơn tự nguyện tinh giản biên chế của cán bộ.",
          "2. Họp Hội đồng trường và hoàn thiện hồ sơ theo Nghị định 154/2025/NĐ-CP trình cấp có thẩm quyền.",
        ],
      },
    ];
  } else if (domain === "SUPPORT_STAFF_STANDARDIZATION") {
    executiveSummary = `Căn cứ Điều 5 Nghị quyết 37/2026/NQ-CP: Nhân sự hỗ trợ giáo dục được phân thành nhóm dùng chung (Kế toán 1-2, Văn thư 1, Thủ quỹ 1) và nhóm riêng theo từng phân hiệu (7 vị trí). Lộ trình đào tạo chuẩn hóa kéo dài 36 tháng (đến 05/08/2029). Nghiêm cấm bố trí người chưa đạt chuẩn vào vị trí Kế toán hoặc Y tế.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Chuẩn hóa lộ trình 36 tháng): Cử nhân sự tham gia khóa đào tạo nâng chuẩn & Phân công kiêm nhiệm",
        description: "Lập kế hoạch cử nhân sự chưa đạt chuẩn trình độ đi học văn bằng 2 hoặc bồi dưỡng chứng chỉ chuyên môn, hoàn thành trước ngày 05/08/2029; trong thời gian đào tạo vẫn hưởng nguyên lương và ngạch bậc.",
        score: 94,
        pros: [
          "Đúng quy định chuyển tiếp tại Điều 5.3.a Nghị quyết 37/2026/NQ-CP.",
          "Ổn định tâm lý người lao động và đảm bảo nguồn nhân sự gắn bó lâu dài.",
          "Giữ nguyên hệ số lương và chế độ đãi ngộ trong suốt 36 tháng.",
        ],
        cons: [
          "Nhà trường phải sắp xếp người hỗ trợ công việc trong thời gian nhân sự đi học tập trung.",
        ],
        estimatedCostOrResource: "Kinh phí đào tạo bồi dưỡng viên chức hàng năm của trường.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Ký cam kết lộ trình đào tạo đạt chuẩn trước 05/08/2029 với từng cá nhân.",
          "2. Liên kết các cơ sở đào tạo được Bộ GD&ĐT / Bộ Y tế cấp phép để tổ chức lớp ngoài giờ.",
          "3. Cập nhật trạng thái 'ĐANG ĐÀO TẠO 36 THÁNG' trên Cổng Tuân thủ NQ 37.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2: Ký hợp đồng dịch vụ / Hợp tác y tế học đường với Trung tâm Y tế cấp xã/phường",
        description: "Đối với vị trí Y tế trường học nếu nhân sự hiện tại chưa có bằng y sĩ/điều dưỡng, ký thỏa thuận liên kết dịch vụ y tế với trạm y tế địa phương theo Điều 5.3.b NQ 37.",
        score: 90,
        pros: [
          "Đảm bảo an toàn tuyệt đối và tuân thủ lệnh cấm phân công y tế không bằng cấp.",
          "Đội ngũ y bác sĩ chuyên nghiệp phụ trách sơ cấp cứu học sinh.",
        ],
        cons: ["Phát sinh kinh phí hợp đồng dịch vụ y tế định kỳ."],
        estimatedCostOrResource: "Trích từ nguồn bảo hiểm y tế học sinh và kinh phí thường xuyên.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Lập tờ trình ký kết biên bản ghi nhớ hợp tác với Trạm Y tế phường.",
          "2. Bố trí phòng y tế học đường đạt chuẩn tại Trường chính và Phân hiệu 2.",
        ],
      },
      {
        optionNumber: 3,
        title: "Phương án 3: Điều chuyển nội bộ giữa các cơ sở để tối ưu hóa vị trí việc làm",
        description: "Hoán đổi nhân sự đạt chuẩn kế toán/y tế từ phân hiệu có dư sang cơ sở còn thiếu.",
        score: 80,
        pros: ["Tận dụng nguồn lực sẵn có trong nội bộ nhà trường."],
        cons: ["Thay đổi địa điểm làm việc của nhân sự."],
        estimatedCostOrResource: "Không phát sinh chi phí.",
        feasibility: "CAO",
        riskLevel: "VỪA",
        actionSteps: [
          "1. Khảo sát nguyện vọng nhân sự.",
          "2. Ban hành quyết định điều động công tác nội bộ liên cơ sở.",
        ],
      },
    ];
  } else if (domain === "ATTENDANCE") {
    executiveSummary = `Phân tích chuyên cần 4 điểm trường ghi nhận sĩ số toàn trường ${data.attendanceTotals.overallAttendanceRate}%. Đề xuất Hiệu trưởng áp dụng đồng bộ biện pháp vận động kết hợp hỗ trợ bán trú theo Thông tư 32/2020/TT-BGDĐT.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Tối ưu - Toàn diện): Thành lập Tổ cố vấn học tập & Liên hệ gia đình trực tiếp",
        description: "Phối hợp với GVCN, Đoàn trường và Ban đại diện CMHS liên hệ trực tiếp các trường hợp học sinh có nguy cơ chuyên cần hoặc sa sút học tập.",
        score: 92,
        pros: [
          "Giải quyết tận gốc nguyên nhân vắng học và khó khăn trong học tập của học sinh THPT.",
          "Tạo sự gắn kết chặt chẽ giữa nhà trường, giáo viên bộ môn và cha mẹ học sinh.",
          "Duy trì tỷ lệ chuyên cần và chất lượng học tập trên 98% cho tất cả các lớp.",
        ],
        cons: [
          "Cần thời gian phối hợp của giáo viên chủ nhiệm và ban tư vấn tâm lý học đường.",
        ],
        estimatedCostOrResource: "Sử dụng nguồn kinh phí hoạt động chuyên môn và tư vấn học đường của nhà trường.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Trích xuất danh sách học sinh cần hỗ trợ từ hệ thống AI Assistant.",
          "2. Ban Giám hiệu ký phiếu thông báo gửi giáo viên chủ nhiệm và phụ huynh.",
          "3. GVCN phối hợp Ban tư vấn học đường gặp gỡ phụ huynh và học sinh trong 24h.",
          "4. Xây dựng kế hoạch bồi dưỡng và hỗ trợ học tập cá nhân hóa.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2 (Nhanh - Linh hoạt): Giao ban trực tuyến điểm trường & Nhắn tin thông báo tự động",
        description: "Tổ chức họp nhanh trực tuyến với quản lý các cơ sở / điểm trường vào 16h30 hằng ngày, kích hoạt thông báo tự động qua ứng dụng cho phụ huynh.",
        score: 85,
        pros: [
          "Triển khai ngay trong ngày, thông tin đa chiều tức thời giữa các cơ sở.",
          "Ban Giám hiệu nắm bắt số liệu tức thời giữa các cơ sở đào tạo.",
        ],
        cons: [
          "Một số phụ huynh vùng cao không có smartphone hoặc sóng 4G chập chờn.",
          "Hiệu quả phụ thuộc vào tính chủ động của phụ huynh.",
        ],
        estimatedCostOrResource: "Không phát sinh chi phí.",
        feasibility: "CAO",
        riskLevel: "VỪA",
        actionSteps: [
          "1. Thiết lập nhóm Zalo điều hành chuyên cần 4 điểm trường.",
          "2. Gửi tin nhắn SMS/Zalo Portal tự động đến phụ huynh học sinh vắng lúc 8h00 sáng.",
          "3. Quản lý điểm trường báo cáo xác nhận lý do trước 11h30.",
        ],
      },
      {
        optionNumber: 3,
        title: "Phương án 3 (Tình thế - Dự phòng): Phân công học nhóm đôi bạn cùng tiến tại bản",
        description: "Giao học sinh khá/giỏi gần nhà kèm cặp, ghi chép bài hộ và động viên bạn đi học.",
        score: 68,
        pros: ["Tận dụng tình bạn của học sinh cùng thôn bản, dễ tiếp cận."],
        cons: ["Chưa giải quyết được việc phụ huynh giữ con ở nhà phụ việc nương rẫy."],
        estimatedCostOrResource: "Không phát sinh chi phí.",
        feasibility: "TRUNG BÌNH",
        riskLevel: "CAO",
        actionSteps: [
          "1. GVCN lập danh sách cặp 'Đôi bạn cùng tiến' theo từng bản.",
          "2. Bàn giao phiếu bài tập tự học cho bạn mang về bản.",
        ],
      },
    ];
  } else if (domain === "TEACHER_SHORTAGE") {
    executiveSummary = `Phát hiện tình huống thiếu giáo viên cục bộ tại điểm trường. Đề xuất Hiệu trưởng phê duyệt phương án dạy liên trường kết hợp dạy học trực tuyến kết nối điểm cầu theo Thông tư 32/2020.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Tối ưu): Điều động dạy thay theo cụm điểm trường gần nhất",
        description: "Bố trí giáo viên có cùng chuyên môn tại điểm trường lân cận (khoảng cách < 5 km) sang dạy thay, hưởng phụ cấp thừa giờ.",
        score: 90,
        pros: [
          "Đảm bảo chất lượng giảng dạy trực tiếp, học sinh được tương tác đầy đủ.",
          "Đúng quy chế chuyên môn và chế độ thừa giờ cho giáo viên.",
        ],
        cons: ["Giáo viên phải di chuyển giữa các điểm trường đèo dốc."],
        estimatedCostOrResource: "Thanh toán chế độ thừa giờ theo quy định hiện hành.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Chọn ứng viên đứng đầu bảng xếp hạng điều phối AI.",
          "2. Ban hành quyết định phân công dạy thay tạm thời.",
          "3. Thông báo trước cho quản lý điểm trường và lớp học.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2 (Hiện đại): Dạy học trực tuyến kết nối phòng học thông minh từ Điểm trung tâm",
        description: "Giáo viên tại Điểm trung tâm giảng bài qua màn hình tương tác / máy chiếu kết nối tới phòng học điểm Bản Pún / Phia Xam.",
        score: 82,
        pros: [
          "Không mất thời gian di chuyển, ứng dụng chuyển đổi số giáo dục.",
          "Nhiều lớp cùng khối có thể tiếp cận bài giảng của giáo viên giỏi.",
        ],
        cons: ["Yêu cầu đường truyền Internet ổn định tại điểm trường vùng cao."],
        estimatedCostOrResource: "Sử dụng hạ tầng phòng học thông minh sẵn có.",
        feasibility: "CAO",
        riskLevel: "VỪA",
        actionSteps: [
          "1. Kiểm tra kết nối mạng và thiết bị trình chiếu tại điểm trường.",
          "2. Phân công giáo viên chủ nhiệm hoặc cán bộ thiết bị hỗ trợ quản lý trật tự lớp.",
          "3. Phát đường link phòng học trực tiếp.",
        ],
      },
      {
        optionNumber: 3,
        title: "Phương án 3 (Dự phòng): Bố trí lớp tự quản làm phiếu bài tập có hướng dẫn",
        description: "Giao phiếu học tập và tài liệu tự đọc cho lớp trong 1-2 tiết vắng.",
        score: 65,
        pros: ["Xử lý tức thì khi giáo viên xin nghỉ đột xuất sát giờ học."],
        cons: ["Học sinh không được giảng giải lý thuyết bài học mới."],
        estimatedCostOrResource: "In ấn tài liệu học tập.",
        feasibility: "RẤT CAO",
        riskLevel: "CAO",
        actionSteps: [
          "1. Tổ chuyên môn cung cấp ngân hàng phiếu tự học theo tuần.",
          "2. Bàn giao cho cán bộ trực điểm trường giám sát.",
        ],
      },
    ];
  } else {
    // Default 3 options
    executiveSummary = `Phân tích yêu cầu "${query}" dựa trên hiện trạng 4 điểm trường và hệ thống chỉ tiêu kế hoạch năm học 2026-2027. Đề xuất phương án tối ưu số 1 để đạt hiệu quả cao nhất.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Căn bản & Toàn diện): Triển khai kế hoạch trọng tâm theo phân hiệu",
        description: "Phân công rõ trách nhiệm cán bộ phụ trách điểm trường, gắn chỉ tiêu đánh giá thi đua và kiểm tra định kỳ 2 tuần/lần.",
        score: 90,
        pros: [
          "Tính khả thi cao, huy động được sức mạnh tổng hợp của ban giám hiệu và tổ chuyên môn.",
          "Kiểm soát chặt chẽ tiến độ và chất lượng thực hiện.",
        ],
        cons: ["Khối lượng công việc theo dõi của BGH tăng lên."],
        estimatedCostOrResource: "Cân đối trong dự toán chi thường xuyên của nhà trường.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Ban hành văn bản chỉ đạo của Hiệu trưởng gửi 4 điểm trường.",
          "2. Thiết lập lịch kiểm tra và mốc thời gian hoàn thành.",
          "3. Sơ kết rút kinh nghiệm sau 1 tháng triển khai.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2 (Thí điểm): Áp dụng trước tại Điểm trung tâm và 1 điểm lẻ",
        description: "Triển khai thử nghiệm tại Điểm trung tâm và Điểm Bản Mó, đánh giá rút kinh nghiệm trước khi nhân rộng ra Bản Pún và Phia Xam.",
        score: 82,
        pros: ["Giảm thiểu rủi ro, dễ dàng điều chỉnh quy trình khi phát sinh vướng mắc."],
        cons: ["Thời gian hoàn thành trên toàn trường sẽ kéo dài hơn."],
        estimatedCostOrResource: "Chi phí thấp.",
        feasibility: "CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Chọn 2 điểm trường làm nòng cốt thí điểm.",
          "2. Theo dõi chỉ số sau 2 tuần.",
          "3. Nhân rộng toàn trường nếu đạt hiệu quả trên 80%.",
        ],
      },
      {
        optionNumber: 3,
        title: "Phương án 3 (Linh hoạt theo nhu cầu cơ sở): Giao quyền chủ động cho Quản lý điểm trường",
        description: "Điểm trường tự xây dựng giải pháp phù hợp với thực tế địa bàn và báo cáo Hiệu trưởng phê duyệt.",
        score: 72,
        pros: ["Phát huy tính năng động, sáng tạo của cán bộ cắm bản."],
        cons: ["Chất lượng thực hiện có thể không đồng đều giữa các điểm trường."],
        estimatedCostOrResource: "Tùy thuộc đề xuất từng điểm.",
        feasibility: "TRUNG BÌNH",
        riskLevel: "VỪA",
        actionSteps: [
          "1. Gửi hướng dẫn khung cho các điểm trường.",
          "2. Nhận đề xuất và duyệt phương án trong 48h.",
        ],
      },
    ];
  }

  const legalGrounds = [
    {
      code: "Nghị quyết số 37/2026/NQ-CP",
      title: "Nghị quyết của Chính phủ về cơ cấu, số lượng và chính sách đối với Ban Giám hiệu và Nhân sự hỗ trợ giáo dục khi sắp xếp cơ sở GD công lập",
      relevantArticle: "Điều 3 (Mô hình Trường chính - Phân hiệu), Điều 4 (Định mức BGH), Điều 5 (Định mức & Chuẩn hóa Nhân sự Hỗ trợ 36 tháng), Điều 8 (Hạn chót 30/09/2026)",
      applicability: "Căn cứ pháp lý cao nhất và bắt buộc áp dụng khi tái cơ cấu tổ chức bộ máy trường học đa phân hiệu giai đoạn 2026-2028.",
    },
    {
      code: "Nghị định 178/2024/NĐ-CP & NĐ 67/2025/NĐ-CP",
      title: "Quy định về chế độ bảo lưu phụ cấp chức vụ lãnh đạo đối với cán bộ, công chức, viên chức sau sắp xếp tổ chức bộ máy",
      relevantArticle: "Điều 11 (Bảo lưu phụ cấp chức vụ lãnh đạo dôi dư)",
      applicability: "Đảm bảo quyền lợi bảo lưu phụ cấp chức vụ cho Phó Hiệu trưởng dôi dư khi chuyển sang vị trí việc làm giáo viên hoặc chuyên môn khác.",
    },
    {
      code: "Nghị định 154/2025/NĐ-CP",
      title: "Quy định về chính sách tinh giản biên chế",
      relevantArticle: "Điều 5, Điều 9 (Chính sách về hưu trước tuổi và thôi việc ngay có trợ cấp)",
      applicability: "Áp dụng giải quyết nguyện vọng nghỉ hưu trước tuổi hoặc thôi việc hưởng trợ cấp cho cán bộ, nhân sự dôi dư.",
    },
    {
      code: "Thông tư 32/2020/TT-BGDĐT",
      title: "Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học",
      relevantArticle: "Điều 11 (Điểm trường), Điều 19 (Nhiệm vụ và quyền hạn của Hiệu trưởng), Điều 28 (Khen thưởng và kỷ luật)",
      applicability: "Quy định thẩm quyền điều hành của Hiệu trưởng đối với các phân hiệu/điểm trường lẻ và quản lý học sinh.",
    },
  ];

  const roadmap = [
    {
      phase: "Giai đoạn 1: Chuẩn bị, Thẩm định Pháp lý & Chỉ đạo ban đầu",
      timeline: "Ngày 1 - 2",
      tasks: [
        "Họp nhanh Ban giám hiệu và phân công Phó Hiệu trưởng phụ trách trực tiếp.",
        "Trích xuất dữ liệu rà soát định mức NQ 37 từ Trợ lý AI và ban hành văn bản hướng dẫn.",
      ],
    },
    {
      phase: "Giai đoạn 2: Triển khai thực địa & Kiện toàn tổ chức",
      timeline: "Ngày 3 - 10",
      tasks: [
        "Tổ chức triển khai đồng bộ tại Trường chính và các phân hiệu trực thuộc.",
        "Hoàn tất phương án phân công nhân sự và kiểm soát chuẩn hóa chuyên môn.",
      ],
    },
    {
      phase: "Giai đoạn 3: Đánh giá kết quả & Báo cáo Sở GD&ĐT",
      timeline: "Ngày 11 - 15",
      tasks: [
        "Tổng hợp hồ sơ phương án sắp xếp bộ máy gửi Sở GD&ĐT / UBND TP.",
        "Cập nhật hồ sơ điện tử đồng bộ trên toàn hệ thống.",
      ],
    },
  ];

  return {
    query,
    contextSummary: `Yêu cầu điều hành: "${query}" - Thẩm định theo Nghị quyết 37/2026/NQ-CP và các quy định pháp luật hiện hành.`,
    options,
    recommendedOptionNumber: 1,
    executiveSummary,
    legalGrounds,
    roadmap,
  };
}

