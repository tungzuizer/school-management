import {
  AggregatedSchoolSnapshot,
  DecisionSupportResult,
  DecisionOption,
} from "../types";

/**
 * Task Group 3: Decision Support Studio
 * Provides structured 3-option decision matrices, feasibility scores, pros/cons,
 * Vietnamese legal basis citations (TT 32/2020, TT 22/2021), and step-by-step roadmaps.
 */
export async function evaluateDecisionSupport(
  query: string,
  data: AggregatedSchoolSnapshot
): Promise<DecisionSupportResult> {
  const normalizedQuery = query.toLowerCase();

  // Determine query domain to generate contextually relevant options
  let domain = "GENERAL";
  if (normalizedQuery.includes("nghỉ") || normalizedQuery.includes("chuyên cần") || normalizedQuery.includes("bỏ học")) {
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

  if (domain === "ATTENDANCE") {
    executiveSummary = `Phân tích chuyên cần 4 điểm trường ghi nhận sĩ số toàn trường ${data.attendanceTotals.overallAttendanceRate}%. Đề xuất Hiệu trưởng áp dụng đồng bộ biện pháp vận động kết hợp hỗ trợ bán trú theo Thông tư 32/2020/TT-BGDĐT.`;
    options = [
      {
        optionNumber: 1,
        title: "Phương án 1 (Tối ưu - Toàn diện): Thành lập Tổ liên ngành vận động & Hỗ trợ tăng cường bán trú",
        description: "Phối hợp với Trưởng bản, UBND Xã và Đoàn thanh niên tổ chức đến từng hộ gia đình có học sinh vắng từ 2 buổi trở lên; rà soát chế độ bán trú hỗ trợ bữa ăn trưa ấm cho điểm lẻ.",
        score: 92,
        pros: [
          "Giải quyết tận gốc nguyên nhân vắng học (đường xa, hoàn cảnh kinh tế, mùa nương rẫy).",
          "Tạo sự gắn kết chặt chẽ giữa nhà trường, chính quyền địa phương và cộng đồng phụ huynh bản.",
          "Duy trì tỷ lệ chuyên cần bền vững trên 95% ở các điểm khó khăn (Bản Mó, Bản Pún, Phia Xam).",
        ],
        cons: [
          "Cần thời gian phối hợp và nhân lực của giáo viên chủ nhiệm sau giờ dạy.",
          "Cần bố trí kinh phí hỗ trợ công tác vận động cơ sở.",
        ],
        estimatedCostOrResource: "Khoảng 2 - 3 triệu đồng từ quỹ khuyến học / ngân sách hoạt động xã hội hóa.",
        feasibility: "RẤT CAO",
        riskLevel: "THẤP",
        actionSteps: [
          "1. Trích xuất danh sách học sinh vắng >= 2 buổi từ hệ thống AI Assistant.",
          "2. Hiệu trưởng ký thông báo gửi Ban quản lý bản và UBND xã Tân Xã.",
          "3. GVCN phối hợp cán bộ phụ trách điểm trường đến nhà học sinh trong vòng 24h.",
          "4. Kiểm tra điều kiện bán trú và hỗ trợ bổ sung gạo/thực phẩm tại điểm trường.",
        ],
      },
      {
        optionNumber: 2,
        title: "Phương án 2 (Nhanh - Linh hoạt): Giao ban trực tuyến điểm trường & Nhắn tin Zalo tự động",
        description: "Tổ chức họp nhanh trực tuyến với 3 quản lý điểm trường vào 16h30 hằng ngày, kích hoạt thông báo tự động qua Zalo cho cha mẹ học sinh vắng.",
        score: 80,
        pros: [
          "Triển khai ngay trong ngày, không phát sinh chi phí vận chuyển.",
          "Ban giám hiệu nắm bắt số liệu tức thời mà không cần đi lại 12.5 km.",
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
      code: "Thông tư 32/2020/TT-BGDĐT",
      title: "Điều lệ trường trung học cơ sở, trường trung học phổ thông và trường phổ thông có nhiều cấp học",
      relevantArticle: "Điều 11 (Điểm trường), Điều 19 (Nhiệm vụ và quyền hạn của Hiệu trưởng), Điều 28 (Khen thưởng và kỷ luật)",
      applicability: "Quy định thẩm quyền điều hành của Hiệu trưởng đối với các phân hiệu/điểm trường lẻ và quản lý học sinh.",
    },
    {
      code: "Thông tư 22/2021/TT-BGDĐT",
      title: "Quy định về đánh giá học sinh trung học cơ sở và học sinh trung học phổ thông",
      relevantArticle: "Điều 5 (Hình thức đánh giá), Điều 12 (Đánh giá kết quả rèn luyện và học tập)",
      applicability: "Căn cứ theo dõi tiến độ học vụ, rèn luyện phẩm chất và phân loại học sinh có nguy cơ học lực yếu.",
    },
    {
      code: "Nghị định 127/2018/NĐ-CP",
      title: "Quy định trách nhiệm quản lý nhà nước về giáo dục",
      relevantArticle: "Điều 7 (Trách nhiệm của UBND cấp xã), Điều 11 (Trách nhiệm của cơ sở giáo dục)",
      applicability: "Cơ sở pháp lý để nhà trường phối hợp với UBND cấp xã và Ban quản lý thôn bản trong công tác duy trì sĩ số.",
    },
  ];

  const roadmap = [
    {
      phase: "Giai đoạn 1: Chuẩn bị & Chỉ đạo ban đầu",
      timeline: "Ngày 1 - 2",
      tasks: [
        "Họp nhanh Ban giám hiệu và phân công Phó Hiệu trưởng phụ trách trực tiếp.",
        "Trích xuất dữ liệu rà soát từ Trợ lý AI và ban hành văn bản hướng dẫn.",
      ],
    },
    {
      phase: "Giai đoạn 2: Triển khai thực địa & Điều phối 4 điểm trường",
      timeline: "Ngày 3 - 10",
      tasks: [
        "Tổ chức triển khai đồng bộ tại Điểm trung tâm và 3 điểm lẻ.",
        "Theo dõi dữ liệu cập nhật hằng ngày qua bảng điều khiển AI.",
      ],
    },
    {
      phase: "Giai đoạn 3: Đánh giá kết quả & Báo cáo cấp trên",
      timeline: "Ngày 11 - 15",
      tasks: [
        "Tổng hợp báo cáo tiến độ bằng công cụ tự động của AI Assistant.",
        "Khen thưởng các cá nhân/tập thể hoàn thành xuất sắc nhiệm vụ.",
      ],
    },
  ];

  return {
    query,
    contextSummary: `Yêu cầu điều hành: "${query}" - Phạm vi áp dụng: 4 điểm trường (Trung tâm, Bản Mó, Bản Pún, Phia Xam) - Tổng quy mô: ${data.attendanceTotals.totalStudents} học sinh, ${data.teachers.length} giáo viên.`,
    options,
    recommendedOptionNumber: 1,
    executiveSummary,
    legalGrounds,
    roadmap,
  };
}
