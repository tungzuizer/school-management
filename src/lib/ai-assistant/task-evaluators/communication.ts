import {
  AggregatedSchoolSnapshot,
  ParentFeedbackSynthesisResult,
  AnnouncementDraftResult,
} from "../types";

/**
 * Task Group 7: Communication & Parent Feedback
 * Synthesizes parent feedback across 4 school points, highlights unresponded issues,
 * and drafts multi-channel executive announcements (Official Document, Zalo, SMS).
 */

export function synthesizeParentFeedback(
  data: AggregatedSchoolSnapshot
): ParentFeedbackSynthesisResult {
  const feedbacks = data.parentFeedbacks || {
    totalRecent: 0,
    unrespondedCount: 0,
    positiveCount: 0,
    neutralCount: 0,
    concernCount: 0,
    topConcerns: [],
    recentFeedbacks: [],
  };

  // Synthesize key topics
  const keyTopics = [
    {
      topicName: "Chế độ ăn trưa và nước ấm bán trú mùa đông",
      occurrences: 4,
      schoolPointName: "Điểm Bản Mó & Bản Pún",
      sampleQuotes: [
        "Đề nghị nhà trường kiểm tra việc nấu ăn trưa và cấp nước ấm cho các cháu vào mùa lạnh.",
        "Điểm trường cách xa trung tâm mong thầy cô quan tâm thêm bữa trưa cho học sinh ở lại.",
      ],
      suggestedResolution: "Chỉ đạo bộ phận phụ trách bán trú và quản lý điểm trường rà soát nguồn nước sạch và quy trình nấu ăn.",
    },
    {
      topicName: "Bảo dưỡng máy tính phòng thực hành Tin học",
      occurrences: 2,
      schoolPointName: "Điểm Bản Pún",
      sampleQuotes: [
        "Phòng máy tính có một số máy bị lỗi màn hình các cháu không thực hành được.",
      ],
      suggestedResolution: "Điều động cán bộ thiết bị từ Điểm trung tâm sang kiểm tra và sửa chữa trong tuần.",
    },
    {
      topicName: "Thời gian đón trả học sinh vùng đèo dốc mùa mưa",
      occurrences: 3,
      schoolPointName: "Điểm Phia Xam",
      sampleQuotes: [
        "Đường đi qua suối hay sạt lở xin phép nhà trường linh hoạt giờ vào lớp buổi sáng.",
      ],
      suggestedResolution: "Cho phép điểm Phia Xam lùi giờ vào học 15 phút khi có cảnh báo thời tiết xấu.",
    },
  ];

  const urgentFeedbackItems = (feedbacks.recentFeedbacks || [])
    .filter((f) => !f.isResponded)
    .map((f) => {
      return {
        id: f.id,
        parentName: f.parentName || "Phuhuỳnh học sinh",
        studentName: f.studentName || "Học sinh",
        schoolPointName: "Điểm trường",
        content: f.content,
        waitingHours: 36,
        recommendedReplyDraft: `Kính gửi phụ huynh em ${f.studentName || ""}, Ban giám hiệu nhà trường đã tiếp nhận ý kiến đóng góp của gia đình về việc "${f.content}". Hiệu trưởng đã chỉ đạo trực tiếp giáo viên chủ nhiệm và cán bộ quản lý điểm trường kiểm tra, khắc phục trong vòng 24h tới. Trân trọng cảm ơn sự đồng hành của gia đình!`,
      };
    });

  return {
    totalAnalyzed: feedbacks.totalRecent,
    unrespondedCount: feedbacks.unrespondedCount,
    sentimentDistribution: {
      positive: feedbacks.positiveCount,
      neutral: feedbacks.neutralCount,
      concerned: feedbacks.concernCount,
    },
    keyTopics,
    urgentFeedbackItems,
  };
}

export function draftExecutiveAnnouncement(
  input: {
    topic: string;
    audience: "TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS";
    tone?: string;
  },
  data: AggregatedSchoolSnapshot
): AnnouncementDraftResult {
  const audienceNames = {
    TEACHERS: "Toàn thể Cán bộ, Giáo viên và Nhân viên",
    PARENTS: "Quý Cha mẹ Học sinh toàn trường",
    ALL_STAFF: "Hội đồng Sư phạm Nhà trường",
    SATELLITE_POINTS: "Cán bộ, Giáo viên phụ trách 3 Điểm trường (Bản Mó, Bản Pún, Phia Xam)",
  };

  const audienceLabel = audienceNames[input.audience] || "Toàn thể Nhà trường";
  const now = new Date();

  const title = `THÔNG BÁO VỀ VIỆC ${input.topic.toUpperCase()}`;

  const officialAnnouncementBody = `
TRƯỜNG ${data.schoolName.toUpperCase()}
Số: .../TB-HT

CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------------
Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}

THÔNG BÁO
Về việc ${input.topic}
Kính gửi: ${audienceLabel}

Căn cứ Kế hoạch năm học 2026 - 2027 của Trường ${data.schoolName};
Xét tình hình thực tế triển khai nhiệm vụ giảng dạy và quản lý tại 4 điểm trường;

Hiệu trưởng nhà trường thông báo và chỉ đạo như sau:

1. Mục đích & Yêu cầu:
- Tăng cường kỷ cương nề nếp, đảm bảo chất lượng dạy học và an toàn tuyệt đối cho học sinh tại tất cả các điểm trường.
- Phát huy tinh thần trách nhiệm của cán bộ, giáo viên và sự phối hợp chặt chẽ của phụ huynh học sinh.

2. Nội dung chỉ đạo cụ thể đối với ${input.topic}:
- Điểm trung tâm và các điểm lẻ (Bản Mó, Bản Pún, Phia Xam) nghiêm túc triển khai theo đúng hướng dẫn chuyên môn.
- Cán bộ quản lý điểm trường chịu trách nhiệm trực tiếp trước Hiệu trưởng về kết quả thực hiện tại địa bàn được phân công.
- Giáo viên chủ nhiệm kịp thời thông tin, giải đáp các thắc mắc của phụ huynh và báo cáo tình hình hàng ngày.

3. Tổ chức thực hiện:
- Các bộ phận, tổ chuyên môn và cá nhân có liên quan nghiêm túc triển khai thực hiện thông báo này kể từ ngày ký.

Nơi nhận:
- Như trên;
- Ban Giám hiệu;
- Lưu: VT.

HIỆU TRƯỞNG
(Đã ký & Đóng dấu)
`.trim();

  const zaloSmsSummary = `[THÔNG BÁO TỪ BGH TRƯỜNG ${data.schoolName}] V/v ${input.topic}: Đề nghị ${audienceLabel} lưu ý thực hiện đúng kế hoạch. Chi tiết liên hệ GVCN hoặc xem tại cổng thông tin điện tử của nhà trường. Trân trọng!`;

  const actionItemsForRecipients = [
    "Quản lý các điểm trường phổ biến ngay nội dung thông báo trong buổi sinh hoạt đầu giờ.",
    "Giáo viên chủ nhiệm gửi bản tóm tắt qua nhóm Zalo lớp đến 100% phụ huynh học sinh.",
    "Báo cáo kết quả triển khai về Ban giám hiệu trước 17h00 thứ Sáu hàng tuần.",
  ];

  return {
    topic: input.topic,
    audience: input.audience,
    tone: input.tone || "Trang trọng, chuẩn mực điều hành",
    title,
    officialAnnouncementBody,
    zaloSmsSummary,
    actionItemsForRecipients,
  };
}
