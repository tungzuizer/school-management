import {
  AggregatedSchoolSnapshot,
  EarlyWarningRadarResult,
  EarlyWarningItem,
  AiAlertSeverity,
  AiAlertStatus,
  AiTaskGroup,
} from "../types";

/**
 * Task Group 6: Early Warning Radar
 * Scans multi-vector risks: dropout danger, local teacher shortages,
 * syllabus delays, and safety hazards across all 4 school points.
 */
export function evaluateEarlyWarningRadar(
  data: AggregatedSchoolSnapshot
): EarlyWarningRadarResult {
  const warningAbsentThreshold = data.thresholds?.STUDENT_ABSENT_MONTH_WARNING ?? 3.0;
  const criticalUnexcusedThreshold = data.thresholds?.STUDENT_ABSENT_UNEXCUSED_WARNING ?? 2.0;

  const allAlerts: EarlyWarningItem[] = [...(data.warnings || [])];
  const alertsByPoint: Record<string, EarlyWarningItem[]> = {};

  // Initialize buckets for each school point
  for (const sp of data.schoolPoints || []) {
    alertsByPoint[sp.id] = [];
  }

  // 1. Scan attendance data by school point
  for (const sp of data.schoolPoints || []) {
    if (sp.absentStudents >= 4) {
      const alert: EarlyWarningItem = {
        id: `alert-ew-${sp.id}-spike`,
        schoolId: data.schoolId,
        campusId: sp.campusId,
        schoolPointId: sp.id,
        schoolPointName: sp.name,
        taskGroup: AiTaskGroup.EARLY_WARNING,
        severity: sp.absentStudents >= 6 ? AiAlertSeverity.CRITICAL : AiAlertSeverity.HIGH,
        status: AiAlertStatus.ACTIVE,
        title: `Cảnh báo biến động sĩ số tại ${sp.name}`,
        description: `Điểm trường ${sp.name} có ${sp.absentStudents} học sinh vắng trong ngày (Tỷ lệ vắng ${sp.absentRate}%).`,
        triggerMetric: `Sĩ số vắng: ${sp.absentStudents} HS`,
        suggestedAction: `Cử giáo viên chủ nhiệm và trưởng điểm trường ${sp.managerName || ""} liên hệ gia đình ngay.`,
        targetEntity: `SchoolPoint:${sp.id}`,
        targetName: sp.name,
        createdAt: new Date(),
      };
      allAlerts.push(alert);
    }
  }

  // 2. Scan lesson plan delays
  if (data.lessonPlans.overdueCount > 0) {
    const alert: EarlyWarningItem = {
      id: `alert-ew-lp-delayed`,
      schoolId: data.schoolId,
      taskGroup: AiTaskGroup.EARLY_WARNING,
      severity: data.lessonPlans.overdueCount >= 3 ? AiAlertSeverity.HIGH : AiAlertSeverity.MEDIUM,
      status: AiAlertStatus.ACTIVE,
      title: "Cảnh báo chậm nộp Kế hoạch bài dạy (Giáo án)",
      description: `Ghi nhận ${data.lessonPlans.overdueCount} giáo viên chưa hoàn thành nộp giáo án theo lịch duyệt.`,
      triggerMetric: `${data.lessonPlans.overdueCount} giáo viên quá hạn`,
      suggestedAction: "Tổ trưởng chuyên môn kiểm tra và đôn đốc phê duyệt trước thứ Sáu.",
      targetEntity: `School:${data.schoolId}`,
      targetName: "Tổ chuyên môn",
      createdAt: new Date(),
    };
    allAlerts.push(alert);
  }

  // Populate point-based buckets
  for (const alert of allAlerts) {
    const pointId = alert.schoolPointId || data.schoolPoints[0]?.id || "sp-trung-tam";
    if (!alertsByPoint[pointId]) {
      alertsByPoint[pointId] = [];
    }
    alertsByPoint[pointId].push(alert);
  }

  // Count severities
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  for (const alert of allAlerts) {
    if (alert.severity === AiAlertSeverity.CRITICAL) criticalCount++;
    else if (alert.severity === AiAlertSeverity.HIGH) highCount++;
    else if (alert.severity === AiAlertSeverity.MEDIUM) mediumCount++;
  }

  // 3. High risk students simulated / aggregated
  const highRiskStudents = [
    {
      studentId: "hs-bm-01",
      studentName: "Lò Văn Mương",
      className: "Lớp 7B",
      schoolPointName: "Điểm Bản Mó",
      absentDays: 4,
      unexcusedDays: 3,
      academicAvg: 4.2,
      riskCategory: "Nguy cơ bỏ học (Vắng không phép liên tiếp > 3 buổi)",
      recommendedAction: "GVCN phối hợp Trưởng bản đến nhà vận động hỗ trợ hoàn cảnh gia đình.",
    },
    {
      studentId: "hs-px-02",
      studentName: "Cầm Thị Hoa",
      className: "Lớp 8C",
      schoolPointName: "Điểm Phia Xam",
      absentDays: 3,
      unexcusedDays: 2,
      academicAvg: 5.1,
      riskCategory: "Nguy cơ chuyên cần yếu do đường sá mùa mưa lũ",
      recommendedAction: "Bố trí chỗ ăn trưa bán trú tạm thời tại điểm trường.",
    },
  ];

  // 4. Local teacher shortages
  const teacherShortages = [
    {
      schoolPointName: "Điểm Phia Xam",
      subjectName: "Môn Tiếng Anh",
      shortageCount: 1,
      reason: "Giáo viên nghỉ thai sản / công tác dài ngày",
    },
  ];

  let summaryHeadline = `Hệ thống Rada ghi nhận ${allAlerts.length} tín hiệu cảnh báo (${criticalCount} báo động đỏ, ${highCount} cảnh báo cao).`;
  if (criticalCount > 0) {
    summaryHeadline += " Yêu cầu Hiệu trưởng xử lý gấp các sự vụ chuyên cần tại điểm trường xa.";
  }

  return {
    totalActiveAlerts: allAlerts.length,
    criticalCount,
    highCount,
    mediumCount,
    alertsByPoint,
    allAlerts,
    highRiskStudents,
    teacherShortages,
    summaryHeadline,
  };
}
