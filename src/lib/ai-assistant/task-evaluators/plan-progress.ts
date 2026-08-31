import {
  AggregatedSchoolSnapshot,
  PlanKpiProgressResult,
} from "../types";

/**
 * Task Group 4: Plan & KPI Progress Tracking
 * Audits lesson plan approvals across subject groups, tracks institutional KPI health,
 * and forecasts academic milestone delivery for all 4 school points.
 */
export function evaluatePlanAndKpiProgress(
  data: AggregatedSchoolSnapshot
): PlanKpiProgressResult {
  const lessonPlans = data.lessonPlans || {
    totalExpected: 0,
    submittedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    overdueCount: 0,
    submissionRate: 100,
    delayedTeachers: [],
  };
  const kpis = data.kpis || {
    totalKpis: 0,
    onTrackCount: 0,
    atRiskCount: 0,
    criticalCount: 0,
    averageScore: 100,
    atRiskList: [],
  };

  // 1. Group delayed teachers by subject group
  const subjectGroupMap = new Map<string, { total: number; delayed: number }>();

  for (const item of lessonPlans.delayedTeachers || []) {
    const groupName = item.subjectName || "Tổ Khoa học tự nhiên";
    const current = subjectGroupMap.get(groupName) || { total: 0, delayed: 0 };
    current.delayed += 1;
    subjectGroupMap.set(groupName, current);
  }

  // Ensure standard subject groups are represented
  const standardGroups = [
    "Tổ Toán - Tin học",
    "Tổ Ngữ văn - KHXH",
    "Tổ KHTN (Lý - Hóa - Sinh)",
    "Tổ Ngoại ngữ - Nghệ thuật",
  ];

  const delayedSubjectGroups = standardGroups.map((groupName) => {
    const recorded = subjectGroupMap.get(groupName) || { total: 10, delayed: 0 };
    const delayedCount = recorded.delayed;
    const submissionRate = Math.max(
      60,
      Math.min(100, Math.round(100 - delayedCount * 15))
    );

    return {
      subjectGroupName: groupName,
      submissionRate,
      delayedCount,
    };
  });

  // 2. Critical milestones for academic year 2026-2027
  const now = new Date();
  const criticalMilestones = [
    {
      title: "Hoàn thành duyệt Kế hoạch bài dạy (Giáo án) Tuần 1 - 4",
      deadline: new Date(now.getFullYear(), now.getMonth(), 15),
      status: lessonPlans.overdueCount > 0 ? ("DELAYED" as const) : ("ON_TIME" as const),
      riskLevel: lessonPlans.overdueCount > 2 ? "CAO" : "TRUNG BÌNH",
      actionRequired:
        lessonPlans.overdueCount > 0
          ? `Nhắc nhở ${lessonPlans.overdueCount} giáo viên nộp bù giáo án trước 17h00 thứ Sáu.`
          : "Duy trì tiến độ phê duyệt định kỳ.",
    },
    {
      title: "Khảo sát chất lượng đầu năm 4 điểm trường",
      deadline: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      status: "UPCOMING" as const,
      riskLevel: "THẤP",
      actionRequired: "Thống nhất đề kiểm tra chung giữa Điểm trung tâm và 3 điểm lẻ.",
    },
    {
      title: "Kiểm tra chuyên đề bán trú và an toàn trường học tại Điểm Bản Mó & Phia Xam",
      deadline: new Date(now.getFullYear(), now.getMonth(), 28),
      status: "UPCOMING" as const,
      riskLevel: "TRUNG BÌNH",
      actionRequired: "Phó Hiệu trưởng phụ trách cơ sở vật chất trực tiếp kiểm tra thực địa.",
    },
  ];

  // 3. Summary Advice Formulation
  let summaryAdvice = `Tiến độ chung toàn trường đạt mức tốt (Tỷ lệ nộp giáo án ${lessonPlans.submissionRate}%, Điểm KPI trung bình ${kpis.averageScore}/100).`;
  if (lessonPlans.overdueCount > 0 || kpis.atRiskCount > 0) {
    summaryAdvice = `Cần lưu ý: Hiện có ${lessonPlans.overdueCount} giáo viên chậm nộp giáo án và ${kpis.atRiskCount} chỉ tiêu KPI đang ở mức cảnh báo. Hiệu trưởng nên chỉ đạo Tổ trưởng chuyên môn tăng cường đôn đốc và hỗ trợ giáo viên tại các điểm lẻ (Bản Pún, Phia Xam).`;
  }

  return {
    academicYear: "2026 - 2027",
    currentTerm: "Học kỳ 1",
    overallLessonPlanRate: lessonPlans.submissionRate,
    overallKpiScore: kpis.averageScore,
    delayedLessonPlanCount: lessonPlans.overdueCount,
    atRiskKpiCount: kpis.atRiskCount,
    delayedSubjectGroups,
    criticalMilestones,
    summaryAdvice,
  };
}
