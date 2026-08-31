"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTenantContext, assertCampusAccess, TenantContext } from "@/lib/tenant";
import { fetchAggregatedSchoolData } from "@/lib/ai-assistant/data-aggregator";
import { defaultAiAnalysisEngine } from "@/lib/ai-assistant/analysis-engine";
import {
  EquipmentCategory,
  AiAlertStatus,
  AiTaskGroup,
} from "@/lib/ai-assistant/types";

/**
 * Validates whether the user has executive access to the Principal AI Assistant.
 * Allowed roles: ADMIN (Principal), VICE_PRINCIPAL, DEPARTMENT_ADMIN, DISTRICT_ADMIN, WARD_ADMIN, SUPER_ADMIN.
 * Teachers and Students are rejected with 403 Forbidden.
 */
function assertExecutiveAccess(ctx: TenantContext) {
  const allowedRoles = [
    "ADMIN",
    "VICE_PRINCIPAL",
    "DEPARTMENT_ADMIN",
    "DISTRICT_ADMIN",
    "WARD_ADMIN",
    "SUPER_ADMIN",
  ];

  if (!allowedRoles.includes(ctx.userRole)) {
    throw new Error(
      "Không có quyền truy cập. Module Trợ lý AI chỉ dành cho Ban Giám hiệu và Cán bộ Quản lý."
    );
  }
}

/**
 * Fetches complete AI assistant executive dashboard data for 4 school points.
 */
export async function getAiAssistantDashboardData(
  selectedCampusId?: string,
  targetDateStr?: string
) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    // If VICE_PRINCIPAL, verify campus scope
    if (selectedCampusId) {
      assertCampusAccess(ctx, selectedCampusId);
    }

    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const startTime = Date.now();

    // 1. Data Aggregator Step
    const snapshot = await fetchAggregatedSchoolData(ctx, selectedCampusId, targetDate);

    // 2. Analysis Engine Step (Evaluate All 7 Tasks concurrently)
    const [
      realtime,
      planProgress,
      docs,
      earlyWarning,
      parentFeedback,
      periodicReport,
    ] = await Promise.all([
      defaultAiAnalysisEngine.analyzeRealtimeStatus(snapshot),
      defaultAiAnalysisEngine.analyzePlanAndKpiProgress(snapshot),
      defaultAiAnalysisEngine.analyzeOfficialDocuments(snapshot),
      defaultAiAnalysisEngine.scanEarlyWarnings(snapshot),
      defaultAiAnalysisEngine.synthesizeParentFeedback(snapshot),
      defaultAiAnalysisEngine.generatePeriodicReport("DAILY", snapshot),
    ]);

    const durationMs = Date.now() - startTime;

    // 3. Log analysis execution to AiAnalysisLog
    try {
      if (snapshot.schoolId && snapshot.schoolId !== "mock-school-id") {
        await prisma.aiAnalysisLog.create({
          data: {
            schoolId: snapshot.schoolId,
            campusId: selectedCampusId || null,
            triggeredBy: `USER:${ctx.userId}:${ctx.userRole}`,
            status: "SUCCESS",
            alertsGenerated: earlyWarning.totalActiveAlerts,
            durationMs,
            detailsJson: JSON.stringify({
              overallHealthScore: realtime.overallHealthScore,
              totalStudents: snapshot.attendanceTotals.totalStudents,
              pointsEvaluated: snapshot.schoolPoints.length,
            }),
          },
        });
      }
    } catch (logError) {
      console.warn("Could not record AiAnalysisLog:", logError);
    }

    return {
      success: true,
      data: {
        snapshot,
        realtime,
        planProgress,
        docs,
        earlyWarning,
        parentFeedback,
        periodicReport,
      },
    };
  } catch (error: any) {
    console.error("getAiAssistantDashboardData error:", error);
    return {
      success: false,
      error: error.message || "Lỗi khi phân tích dữ liệu Trợ lý AI.",
    };
  }
}

/**
 * Task Group 2: Recommend substitute teachers with multi-point distance optimization
 */
export async function getSubstituteRecommendationAction(
  absentTeacherId: string,
  period: number,
  classId: string,
  dateStr?: string
) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const snapshot = await fetchAggregatedSchoolData(ctx, undefined, targetDate);

    const result = await defaultAiAnalysisEngine.recommendSubstituteTeachers(
      { absentTeacherId, date: targetDate, period, classId },
      snapshot
    );

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi gợi ý dạy thay." };
  }
}

/**
 * Task Group 2: Recommend inter-point equipment transfers
 */
export async function getEquipmentTransferAdviceAction(
  category: EquipmentCategory,
  targetSchoolPointId: string,
  neededQuantity: number
) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    const snapshot = await fetchAggregatedSchoolData(ctx);

    const result = await defaultAiAnalysisEngine.recommendEquipmentTransfer(
      { category, targetSchoolPointId, neededQuantity },
      snapshot
    );

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tư vấn điều chuyển thiết bị." };
  }
}

/**
 * Task Group 3: 3-Option Decision Support Studio with legal grounding
 */
export async function getDecisionSupportAdviceAction(query: string) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    if (!query || query.trim().length === 0) {
      return { success: false, error: "Vui lòng nhập nội dung hoặc câu hỏi cần tư vấn." };
    }

    const snapshot = await fetchAggregatedSchoolData(ctx);
    const result = await defaultAiAnalysisEngine.evaluateDecisionOptions(query, snapshot);

    // Save recommendation to database if schoolId is available
    if (snapshot.schoolId && snapshot.schoolId !== "mock-school-id") {
      try {
        await prisma.aiRecommendation.create({
          data: {
            schoolId: snapshot.schoolId,
            taskGroup: AiTaskGroup.DECISION_SUPPORT,
            title: query.slice(0, 150),
            contextSummary: result.contextSummary,
            optionsJson: JSON.stringify(result.options),
            recommendedOption: result.options[0]?.title || null,
            legalGrounds: JSON.stringify(result.legalGrounds),
            actionStepsJson: JSON.stringify(result.roadmap),
          },
        });
      } catch (dbError) {
        console.warn("Could not persist AiRecommendation:", dbError);
      }
    }

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi phân tích phương án." };
  }
}

/**
 * Task Group 5: Generate Periodic Executive Report
 */
export async function generateExecutiveReportAction(
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1"
) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    const snapshot = await fetchAggregatedSchoolData(ctx);
    const report = await defaultAiAnalysisEngine.generatePeriodicReport(period, snapshot);

    // Save to database
    if (snapshot.schoolId && snapshot.schoolId !== "mock-school-id") {
      try {
        await prisma.aiReportSummary.create({
          data: {
            schoolId: snapshot.schoolId,
            reportType: period,
            periodLabel: report.periodLabel,
            contentJson: JSON.stringify(report),
            aiExecutiveSummary: report.executiveBrief,
          },
        });
      } catch (dbError) {
        console.warn("Could not persist AiReportSummary:", dbError);
      }
    }

    return { success: true, data: report };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo báo cáo định kỳ." };
  }
}

/**
 * Task Group 7: Draft Multi-channel Executive Announcement
 */
export async function draftAnnouncementAction(
  topic: string,
  audience: "TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS",
  tone?: string
) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    const snapshot = await fetchAggregatedSchoolData(ctx);
    const result = await defaultAiAnalysisEngine.draftExecutiveAnnouncement(
      { topic, audience, tone },
      snapshot
    );

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi soạn thảo thông báo." };
  }
}

/**
 * Updates dynamic threshold configuration in DB
 */
export async function updateAiThresholdAction(
  metricKey: string,
  thresholdValue: number
) {
  try {
    const ctx = await getTenantContext();
    if (!["ADMIN", "SUPER_ADMIN", "DEPARTMENT_ADMIN"].includes(ctx.userRole)) {
      return { success: false, error: "Chỉ Hiệu trưởng mới có quyền thay đổi ngưỡng cảnh báo." };
    }

    const schoolId = ctx.schoolId;
    if (!schoolId) {
      return { success: false, error: "Không tìm thấy thông tin trường học." };
    }

    await prisma.aiConfigThreshold.upsert({
      where: {
        schoolId_metricKey: {
          schoolId,
          metricKey,
        },
      },
      update: {
        thresholdValue,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        metricKey,
        metricName: metricKey,
        taskGroup: AiTaskGroup.REALTIME_MONITORING,
        thresholdValue,
      },
    });

    revalidatePath("/admin/ai-assistant");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật ngưỡng cảnh báo." };
  }
}

/**
 * Acknowledges an AI Alert
 */
export async function acknowledgeAlertAction(alertId: string, note?: string) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    await prisma.aiAlert.update({
      where: { id: alertId },
      data: {
        status: AiAlertStatus.ACKNOWLEDGED,
        acknowledgedById: ctx.userId,
        acknowledgedAt: new Date(),
        resolutionNote: note || "Đã tiếp nhận và đang xử lý.",
      },
    });

    revalidatePath("/admin/ai-assistant");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xác nhận cảnh báo." };
  }
}

/**
 * Resolves an AI Alert
 */
export async function resolveAlertAction(alertId: string, note: string) {
  try {
    const ctx = await getTenantContext();
    assertExecutiveAccess(ctx);

    await prisma.aiAlert.update({
      where: { id: alertId },
      data: {
        status: AiAlertStatus.RESOLVED,
        resolvedById: ctx.userId,
        resolvedAt: new Date(),
        resolutionNote: note,
      },
    });

    revalidatePath("/admin/ai-assistant");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi đóng cảnh báo." };
  }
}
