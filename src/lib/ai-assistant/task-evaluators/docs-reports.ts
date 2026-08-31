import {
  AggregatedSchoolSnapshot,
  OfficialDocumentAnalysisResult,
  PeriodicReportResult,
  DocumentUrgency,
  DocumentStatus,
} from "../types";

/**
 * Task Group 5: Official Documents & Periodic Reports
 * Manages dispatch deadlines (48h triage), builds daily task checklists,
 * and auto-synthesizes multi-campus executive briefings.
 */

export function evaluateOfficialDocuments(
  data: AggregatedSchoolSnapshot
): OfficialDocumentAnalysisResult {
  const docs = data.documents || {
    totalPending: 0,
    expiringWithin48h: 0,
    overdueCount: 0,
    expressCount: 0,
    urgentList: [],
  };
  const now = new Date();

  const urgentDispatches = (docs.urgentList || []).map((doc) => {
    let remainingDays = 0;
    if (doc.deadline) {
      const diffTime = doc.deadline.getTime() - now.getTime();
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    let recommendedAction = "Phân công bộ phận chuyên môn xử lý theo quy trình.";
    if (remainingDays <= 0) {
      recommendedAction = "QUÁ HẠN: Hiệu trưởng đôn đốc trực tiếp cá nhân phụ trách hoàn thành ngay trong ngày.";
    } else if (remainingDays <= 2) {
      recommendedAction = "KHẨN (<=48h): Ưu tiên hoàn tất dự thảo báo cáo/công văn để Hiệu trưởng ký duyệt trước 16h00.";
    } else if (doc.urgency === DocumentUrgency.EXPRESS) {
      recommendedAction = "HỎA TỐC: Xử lý ngay lập tức và gửi công văn phản hồi trong vòng 24h.";
    }

    return {
      docNumber: doc.docNumber,
      title: doc.title,
      issuer: doc.issuer,
      deadline: doc.deadline || null,
      urgency: doc.urgency,
      status: doc.status,
      remainingDays,
      recommendedAction,
    };
  });

  // Build high-priority checklist for the Principal today
  const taskChecklistToday: string[] = [
    `Duyệt sĩ số và tình hình chuyên cần 4 điểm trường đầu giờ sáng (${data.attendanceTotals.overallAttendanceRate}% chuyên cần).`,
  ];

  if (docs.expiringWithin48h > 0) {
    taskChecklistToday.push(
      `Xử lý ${docs.expiringWithin48h} công văn/chỉ đạo đến hạn trong 48h (Ưu tiên công văn Sở/Phòng GD&ĐT).`
    );
  }

  if (data.lessonPlans.overdueCount > 0) {
    taskChecklistToday.push(
      `Ký duyệt nhắc nhở ${data.lessonPlans.overdueCount} giáo viên chậm tiến độ nộp giáo án.`
    );
  }

  if (data.parentFeedbacks.unrespondedCount > 0) {
    taskChecklistToday.push(
      `Chỉ đạo phản hồi ${data.parentFeedbacks.unrespondedCount} ý kiến phụ huynh còn tồn đọng.`
    );
  }

  return {
    totalPending: docs.totalPending,
    expiringWithin48h: docs.expiringWithin48h,
    overdueCount: docs.overdueCount,
    urgentDispatches,
    taskChecklistToday,
  };
}

export function generatePeriodicExecutiveReport(
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1",
  data: AggregatedSchoolSnapshot
): PeriodicReportResult {
  const periodTitles = {
    DAILY: `Báo cáo Điều hành Ngày ${data.date.toLocaleDateString("vi-VN")}`,
    WEEKLY: `Báo cáo Tổng hợp Tuần ${Math.ceil(data.date.getDate() / 7)} - Tháng ${data.date.getMonth() + 1}`,
    MONTHLY: `Báo cáo Chiến lược Tháng ${data.date.getMonth() + 1}/${data.date.getFullYear()}`,
    HK1: "Báo cáo Sơ kết Học kỳ 1 (2026 - 2027)",
  };

  const periodLabel = periodTitles[period] || periodTitles.DAILY;

  const pointBreakdowns = data.schoolPoints.map((sp) => {
    const notableIssues: string[] = [];
    if (sp.absentRate >= 5) notableIssues.push(`Vắng ${sp.absentStudents} HS (${sp.absentRate}%)`);
    if (sp.journalsPending > 0) notableIssues.push(`Còn ${sp.journalsPending} sổ đầu bài chưa ghi`);
    if (sp.activeIncidentsCount > 0) notableIssues.push(`${sp.activeIncidentsCount} sự cố nề nếp`);

    return {
      schoolPointName: sp.name,
      attendanceRate: 100 - sp.absentRate,
      disciplineStatus: sp.activeIncidentsCount === 0 ? "Tốt, không có sự cố" : `Ghi nhận ${sp.activeIncidentsCount} vụ việc`,
      academicProgress: sp.journalsPending === 0 ? "Đúng tiến độ 100%" : `Chậm ${sp.journalsPending} tiết ghi sổ`,
      notableIssues: notableIssues.length > 0 ? notableIssues : ["Nề nếp ổn định, giảng dạy đúng kế hoạch"],
    };
  });

  const kpiHighlights = [
    `Chỉ số KPI trung bình toàn trường đạt ${data.kpis.averageScore}/100 điểm.`,
    `Tỷ lệ nộp và duyệt giáo án đạt ${data.lessonPlans.submissionRate}%.`,
    `Tỷ lệ chuyên cần chung toàn trường: ${data.attendanceTotals.overallAttendanceRate}%.`,
  ];

  const nextPeriodPriorities = [
    "Duy trì sĩ số và kiểm tra công tác bán trú tại 3 điểm trường lẻ (Bản Mó, Bản Pún, Phia Xam).",
    "Tổ chức dự giờ thăm lớp đột xuất và đôn đốc các giáo viên còn nợ giáo án.",
    "Rà soát bảo dưỡng thiết bị máy tính phòng thực hành trước kỳ kiểm tra giữa kỳ.",
  ];

  // Markdown Report Builder
  const markdownReport = `
# ${periodLabel.toUpperCase()}
**Đơn vị:** ${data.schoolName}
**Ngày lập:** ${data.date.toLocaleDateString("vi-VN")} | **Người duyệt:** Hiệu trưởng

---

### I. TỔNG QUAN ĐIỀU HÀNH TOÀN TRƯỜNG
- **Tổng số học sinh:** ${data.attendanceTotals.totalStudents} HS (Hiện diện: ${data.attendanceTotals.presentCount} HS, Vắng: ${data.attendanceTotals.absentExcusedCount + data.attendanceTotals.absentUnexcusedCount} HS - ${data.attendanceTotals.overallAttendanceRate}% chuyên cần).
- **Tổng số giáo viên:** ${data.teachers.length} đồng chí.
- **Tiến độ giáo án:** Đạt ${data.lessonPlans.submissionRate}% (Còn ${data.lessonPlans.overdueCount} giáo viên chậm nộp).
- **Chỉ tiêu KPI:** Điểm trung bình ${data.kpis.averageScore}/100 (${data.kpis.atRiskCount} chỉ tiêu cần đôn đốc).

---

### II. CHI TIẾT TÌNH HÌNH TẠI 4 ĐIỂM TRƯỜNG
${pointBreakdowns
  .map(
    (p, idx) => `
#### ${idx + 1}. ${p.schoolPointName}
- **Chuyên cần:** ${p.attendanceRate}%
- **Kỷ luật & Nề nếp:** ${p.disciplineStatus}
- **Tiến độ chuyên môn:** ${p.academicProgress}
- **Vấn đề cần lưu ý:** ${p.notableIssues.join("; ")}
`
  )
  .join("")}

---

### III. CÔNG VĂN & HỒ SƠ QUẢN LÝ
- Tổng số công văn chờ xử lý: **${data.documents.totalPending}**
- Công văn khẩn đến hạn trong 48h: **${data.documents.expiringWithin48h}**
- Phản ánh phụ huynh cần trả lời: **${data.parentFeedbacks.unrespondedCount}**

---

### IV. NHIỆM VỤ TRỌNG TÂM THỜI GIAN TỚI
${nextPeriodPriorities.map((item, idx) => `${idx + 1}. ${item}`).join("\n")}
`.trim();

  const executiveBrief = `Toàn trường duy trì hoạt động dạy học ổn định với tỷ lệ chuyên cần ${data.attendanceTotals.overallAttendanceRate}%. Điểm trung tâm và Điểm Bản Mó đạt kết quả tốt; Điểm Bản Pún và Phia Xam cần tập trung cải thiện chuyên cần và hoàn thiện ghi chép sổ đầu bài.`;

  return {
    reportType: period,
    periodLabel,
    schoolName: data.schoolName,
    executiveBrief,
    pointBreakdowns,
    kpiHighlights,
    nextPeriodPriorities,
    markdownReport,
  };
}
