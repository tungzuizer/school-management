import {
  AggregatedSchoolSnapshot,
  RealtimeMonitoringResult,
  EarlyWarningItem,
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
} from "../types";

/**
 * Task Group 1: Real-time Multi-Campus Monitoring
 * Computes health scores, attendance anomalies, and unrecorded class journals for 4 school points.
 */
export function evaluateRealtimeStatus(data: AggregatedSchoolSnapshot): RealtimeMonitoringResult {
  const warningRateThreshold = data.thresholds.ABSENCE_RATE_WARNING ?? 5.0;
  const criticalRateThreshold = data.thresholds.ABSENCE_RATE_CRITICAL ?? 10.0;

  const generatedAlerts: EarlyWarningItem[] = [];

  const pointStatuses = data.schoolPoints.map((sp) => {
    const issues: string[] = [];

    // 1. Check absence rates
    if (sp.absentRate >= criticalRateThreshold) {
      issues.push(`Tỷ lệ vắng học ${sp.absentRate}% vượt ngưỡng báo động đỏ (>= ${criticalRateThreshold}%)`);
      generatedAlerts.push({
        id: `alert-rt-${sp.id}-absent`,
        schoolId: data.schoolId,
        campusId: sp.campusId,
        schoolPointId: sp.id,
        schoolPointName: sp.name,
        taskGroup: AiTaskGroup.REALTIME_MONITORING,
        severity: AiAlertSeverity.CRITICAL,
        status: AiAlertStatus.ACTIVE,
        title: `Báo động đỏ chuyên cần tại ${sp.name}`,
        description: `Điểm trường ${sp.name} có ${sp.absentStudents}/${sp.totalStudents} học sinh vắng trong ngày (${sp.absentRate}%).`,
        triggerMetric: `Tỷ lệ vắng ${sp.absentRate}% (ngưỡng ${criticalRateThreshold}%)`,
        suggestedAction: `Hiệu trưởng liên hệ ngay Quản lý điểm trường (${sp.managerName || "Cán bộ phụ trách"}) kiểm tra danh sách vắng và phối hợp phụ huynh.`,
        targetEntity: `SchoolPoint:${sp.id}`,
        targetName: sp.name,
        createdAt: new Date(),
      });
    } else if (sp.absentRate >= warningRateThreshold) {
      issues.push(`Tỷ lệ vắng học ${sp.absentRate}% ở mức cảnh báo (>= ${warningRateThreshold}%)`);
    }

    // 2. Check pending journals
    if (sp.journalsPending > 0) {
      issues.push(`Còn ${sp.journalsPending} tiết chưa hoàn thành ghi sổ đầu bài điện tử`);
    }

    // 3. Check active incidents
    if (sp.activeIncidentsCount > 0) {
      issues.push(`Ghi nhận ${sp.activeIncidentsCount} sự cố / vi phạm kỷ luật cần xử lý`);
    }

    // Quick advice formulation
    let quickRecommendation = "Tình hình hoạt động ổn định, duy trì nề nếp.";
    if (sp.statusColor === "RED") {
      quickRecommendation = `Ưu tiên khẩn: Kiểm tra ngay sĩ số vắng và liên lạc với phụ trách điểm trường ${sp.managerName || ""}.`;
    } else if (sp.statusColor === "YELLOW") {
      quickRecommendation = "Nhắc nhở giáo viên bộ môn hoàn thành cập nhật sổ đầu bài và theo dõi sát chuyên cần buổi chiều.";
    }

    return {
      schoolPointId: sp.id,
      schoolPointName: sp.name,
      distanceKm: sp.distanceKm,
      healthScore: sp.healthScore,
      statusColor: sp.statusColor,
      attendanceRate: 100 - sp.absentRate,
      absentCount: sp.absentStudents,
      unrecordedJournals: sp.journalsPending,
      activeAlertsCount: sp.activeWarningsCount,
      issues,
      quickRecommendation,
    };
  });

  // Calculate Overall Health Score
  const totalPoints = pointStatuses.length;
  const overallHealth =
    totalPoints > 0
      ? Math.round(pointStatuses.reduce((acc, p) => acc + p.healthScore, 0) / totalPoints)
      : 100;

  let overallStatus: "STABLE" | "ATTENTION_REQUIRED" | "CRITICAL" = "STABLE";
  if (totalPoints === 0) {
    overallStatus = "STABLE";
  } else if (pointStatuses.some((p) => p.statusColor === "RED") || overallHealth < 70) {
    overallStatus = "CRITICAL";
  } else if (pointStatuses.some((p) => p.statusColor === "YELLOW") || overallHealth < 85) {
    overallStatus = "ATTENTION_REQUIRED";
  }

  // Combine with existing critical alerts
  const allCriticalAlerts = [
    ...generatedAlerts,
    ...(data.warnings || []).filter((w) => w.severity === AiAlertSeverity.CRITICAL),
  ];

  return {
    overallHealthScore: overallHealth,
    overallStatus,
    pointStatuses,
    criticalAlerts: allCriticalAlerts,
    timestamp: data.date || new Date(),
  };
}
