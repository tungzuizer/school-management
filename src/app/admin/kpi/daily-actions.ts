"use server";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/kpi/daily/DailyKpiConsole.tsx, src/components/dashboard/DailyKpiWidget.tsx, src/app/admin/kpi/page.tsx
 * 2. Public functions affected: getDailyKpiRealtime, saveDailyKpiEvaluation, getDailyKpiHistory, syncDailyToMonthlyKpi, getDailyKpiOverviewForWidget
 * 3. Data structures: DailyKpiEvaluation, DailyKpiItem, KpiCatalog, Campus, EarlyWarning, KpiPeriod
 * 4. Verbatim User Instruction: "Kpi tôi muốn có thêm phần đánh giá hằng ngày" -> "đồng ý"
 */

import prisma from "@/lib/prisma";
import {
  DailyKpiStatus,
  KpiCategory,
  MeasurementDirection,
  ReportingFrequency,
  WarningLevel,
  WarningCategory,
  KpiPeriodStatus,
} from "@prisma/client";
import { calculateKpiScore } from "./utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface DailyKpiRealtimeMetrics {
  date: string;
  campusId?: string | null;
  campusName?: string;
  studentCount: number;
  totalAttendance: number;
  presentAttendance: number;
  attendanceRate: number;
  incidentCount: number;
  commendationCount: number;
  totalJournalEntries: number;
  confirmedJournalEntries: number;
  journalCompletionRate: number;
  totalEquipment: number;
  goodEquipment: number;
  equipmentRate: number;
  parentFeedbackCount: number;
  parentFeedbackResponded: number;
  parentFeedbackRate: number;
}

export interface DailyKpiItemPayload {
  kpiCatalogId: string;
  code: string;
  name: string;
  category: KpiCategory;
  unit: string;
  direction: MeasurementDirection;
  weight: number;
  targetValue: number;
  autoValue: number;
  manualValue?: number | null;
  actualValue: number;
  completionRate: number;
  weightedScore: number;
  notes?: string | null;
}

export interface DailyKpiEvaluationPayload {
  id?: string;
  date: string;
  campusId?: string | null;
  campusName?: string;
  overallScore: number;
  status: DailyKpiStatus;
  evaluatedById?: string | null;
  evaluatedByName?: string | null;
  notes?: string | null;
  updatedAt?: string;
  metrics: DailyKpiRealtimeMetrics;
  items: DailyKpiItemPayload[];
}

/**
 * Truncates / parses date to UTC midnight for consistent daily uniqueness
 */
function normalizeDate(dateInput: string | Date): { normalized: Date; startOfDay: Date; endOfDay: Date } {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  const normalized = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  const startOfDay = new Date(year, month, date, 0, 0, 0, 0);
  const endOfDay = new Date(year, month, date, 23, 59, 59, 999);

  return { normalized, startOfDay, endOfDay };
}

/**
 * Tính toán số liệu thực tế thời gian thực trong ngày từ CSDL trường học
 */
export async function calculateDailyRawMetrics(
  dateInput: string | Date,
  campusId?: string | null
): Promise<DailyKpiRealtimeMetrics> {
  const { normalized, startOfDay, endOfDay } = normalizeDate(dateInput);

  // 1. Phân hiệu & Danh sách lớp học
  let campusName = "Toàn trường";
  if (campusId && campusId !== "ALL") {
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      select: { name: true },
    });
    if (campus) campusName = campus.name;
  }

  const classWhere: any = {};
  if (campusId && campusId !== "ALL") {
    classWhere.campusId = campusId;
  }

  const classRooms = await prisma.classRoom.findMany({
    where: Object.keys(classWhere).length > 0 ? classWhere : undefined,
    select: { id: true },
  });
  const classIds = classRooms.map((c) => c.id);

  // 2. Số lượng học sinh
  const studentCount = await prisma.student.count({
    where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
  });

  // 3. Điểm danh / Chuyên cần trong ngày
  const totalAttendance = await prisma.attendance.count({
    where: {
      ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const presentAttendance = await prisma.attendance.count({
    where: {
      ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
      date: { gte: startOfDay, lte: endOfDay },
      status: "PRESENT",
    },
  });

  const attendanceRate =
    totalAttendance > 0
      ? Number(((presentAttendance / totalAttendance) * 100).toFixed(1))
      : studentCount > 0
      ? 100.0 // Default 100% nếu chưa có dữ liệu điểm danh vắng
      : 0.0;

  // 4. Sự cố an toàn / Kỷ luật & Khen thưởng trong ngày
  const incidents = await prisma.incident.findMany({
    where: {
      ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    select: { type: true },
  });

  const commendationCount = incidents.filter((i) => i.type === "COMMENDATION").length;
  const incidentCount = incidents.filter((i) => i.type !== "COMMENDATION").length;

  // 5. Sổ đầu bài / Nhật ký giảng dạy trong ngày
  const totalJournalEntries = await prisma.classJournalEntry.count({
    where: {
      ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const confirmedJournalEntries = await prisma.classJournalEntry.count({
    where: {
      ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
      date: { gte: startOfDay, lte: endOfDay },
      isConfirmed: true,
    },
  });

  const journalCompletionRate =
    totalJournalEntries > 0
      ? Number(((confirmedJournalEntries / totalJournalEntries) * 100).toFixed(1))
      : 100.0;

  // 6. Trang thiết bị & Cơ sở vật chất
  const equipWhere: any = {};
  if (campusId && campusId !== "ALL") {
    equipWhere.campusId = campusId;
  }
  const totalEquipment = await prisma.equipment.count({
    where: Object.keys(equipWhere).length > 0 ? equipWhere : undefined,
  });
  const goodEquipment = await prisma.equipment.count({
    where: {
      ...(Object.keys(equipWhere).length > 0 ? equipWhere : {}),
      condition: { in: ["EXCELLENT", "GOOD", "FAIR"] },
    },
  });
  const equipmentRate =
    totalEquipment > 0 ? Number(((goodEquipment / totalEquipment) * 100).toFixed(1)) : 100.0;

  // 7. Tương tác phụ huynh trong ngày
  const parentFeedbackCount = await prisma.parentFeedback.count({
    where: {
      ...(classIds.length > 0 ? { student: { classId: { in: classIds } } } : {}),
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  const parentFeedbackResponded = await prisma.parentFeedback.count({
    where: {
      ...(classIds.length > 0 ? { student: { classId: { in: classIds } } } : {}),
      createdAt: { gte: startOfDay, lte: endOfDay },
      response: { not: null },
    },
  });

  const parentFeedbackRate =
    parentFeedbackCount > 0
      ? Number(((parentFeedbackResponded / parentFeedbackCount) * 100).toFixed(1))
      : 100.0;

  return {
    date: normalized.toISOString().split("T")[0],
    campusId: campusId && campusId !== "ALL" ? campusId : null,
    campusName,
    studentCount,
    totalAttendance,
    presentAttendance,
    attendanceRate,
    incidentCount,
    commendationCount,
    totalJournalEntries,
    confirmedJournalEntries,
    journalCompletionRate,
    totalEquipment,
    goodEquipment,
    equipmentRate,
    parentFeedbackCount,
    parentFeedbackResponded,
    parentFeedbackRate,
  };
}

/**
 * Lấy dữ liệu đánh giá KPI hằng ngày (real-time + đã lưu nếu có)
 */
export async function getDailyKpiRealtime(
  dateStr: string,
  campusIdParam?: string
): Promise<{ success: boolean; data?: DailyKpiEvaluationPayload; error?: string }> {
  try {
    const campusId = campusIdParam && campusIdParam !== "ALL" ? campusIdParam : null;
    const { normalized } = normalizeDate(dateStr);

    // 1. Tính toán số liệu thô từ DB
    const metrics = await calculateDailyRawMetrics(normalized, campusId);

    // 2. Lấy danh mục KPI đang hoạt động
    let catalogs: any[] = [];
    try {
      catalogs = await prisma.kpiCatalog.findMany({
        where: {
          isActive: true,
          OR: [{ frequency: ReportingFrequency.DAILY }, { frequency: ReportingFrequency.MONTHLY }],
        },
        orderBy: [{ category: "asc" }, { code: "asc" }],
      });
    } catch {
      try {
        catalogs = await prisma.kpiCatalog.findMany({
          where: { isActive: true },
          orderBy: { code: "asc" },
        });
      } catch {
        catalogs = [];
      }
    }

    // Nếu chưa có danh mục, lấy toàn bộ danh mục KPI đang active
    if (catalogs.length === 0) {
      try {
        catalogs = await prisma.kpiCatalog.findMany({
          where: { isActive: true },
          orderBy: { code: "asc" },
        });
      } catch {
        catalogs = [];
      }
    }

    // 3. Tìm bản ghi DailyKpiEvaluation đã lưu cho ngày và phân hiệu này (nếu có)
    let existingEvaluation: any = null;
    try {
      existingEvaluation = await prisma.dailyKpiEvaluation.findFirst({
        where: {
          date: normalized,
          campusId: campusId,
        },
        include: {
          items: true,
          campus: { select: { name: true } },
        },
      });
    } catch {
      // Fallback nếu bảng DailyKpiEvaluation chưa được tạo trên DB
      existingEvaluation = null;
    }

    const itemsMap = new Map<string, any>(
      (existingEvaluation?.items || []).map((i: any) => [i.kpiCatalogId, i])
    );

    // 4. Ghép nối và tính toán autoValue cho từng chỉ số
    let totalScore = 0;
    const items: DailyKpiItemPayload[] = catalogs.map((catalog) => {
      const existingItem = itemsMap.get(catalog.id);

      // Tính toán autoValue dựa trên category và code
      let autoValue = 100.0;
      let notes = existingItem?.notes || "";

      if (catalog.code === "KPI-STU-01" || catalog.category === KpiCategory.STUDENT) {
        autoValue = metrics.attendanceRate;
        if (!notes) {
          notes = `Chuyên cần: ${metrics.presentAttendance}/${metrics.totalAttendance || metrics.studentCount} HS (${metrics.attendanceRate}%)`;
        }
      } else if (catalog.code === "KPI-SAF-01" || catalog.category === KpiCategory.SCHOOL_SAFETY) {
        autoValue = metrics.incidentCount;
        if (!notes) {
          notes =
            metrics.incidentCount === 0
              ? "Tuyệt đối an toàn: 0 sự cố vi phạm"
              : `Phát hiện ${metrics.incidentCount} vụ việc cần xử lý trong ngày`;
        }
      } else if (catalog.code === "KPI-PRO-01" || catalog.category === KpiCategory.PROFESSIONAL) {
        autoValue = metrics.journalCompletionRate;
        if (!notes) {
          notes = `Sổ đầu bài: Đã duyệt ${metrics.confirmedJournalEntries}/${metrics.totalJournalEntries || 1} tiết`;
        }
      } else if (catalog.code === "KPI-AST-01" || catalog.category === KpiCategory.ASSETS) {
        autoValue = metrics.equipmentRate;
        if (!notes) {
          notes = `Thiết bị hoạt động tốt: ${metrics.goodEquipment}/${metrics.totalEquipment || 1} thiết bị (${metrics.equipmentRate}%)`;
        }
      } else if (catalog.code === "KPI-REL-01" || catalog.category === KpiCategory.SCHOOL_RELATIONS) {
        autoValue = metrics.parentFeedbackRate;
        if (!notes) {
          notes = `Phản hồi phụ huynh: ${metrics.parentFeedbackResponded}/${metrics.parentFeedbackCount} ý kiến`;
        }
      } else {
        autoValue = catalog.targetValue ?? 100.0;
      }

      const manualValue = existingItem?.manualValue ?? null;
      const actualValue = manualValue !== null && manualValue !== undefined ? manualValue : autoValue;
      const targetVal = catalog.targetValue ?? 100.0;
      const weightVal = catalog.weight ?? 0.0;

      const { completionRate, weightedScore } = calculateKpiScore(
        actualValue,
        targetVal,
        weightVal,
        catalog.direction
      );

      totalScore += weightedScore;

      return {
        kpiCatalogId: catalog.id,
        code: catalog.code,
        name: catalog.name,
        category: catalog.category,
        unit: catalog.unit,
        direction: catalog.direction,
        weight: weightVal,
        targetValue: targetVal,
        autoValue: Number(autoValue.toFixed(2)),
        manualValue,
        actualValue: Number(actualValue.toFixed(2)),
        completionRate,
        weightedScore,
        notes,
      };
    });

    const overallScore = existingEvaluation
      ? existingEvaluation.overallScore
      : Number(totalScore.toFixed(2));

    const payload: DailyKpiEvaluationPayload = {
      id: existingEvaluation?.id,
      date: metrics.date,
      campusId,
      campusName: metrics.campusName,
      overallScore,
      status: existingEvaluation?.status || DailyKpiStatus.DRAFT,
      evaluatedById: existingEvaluation?.evaluatedById,
      evaluatedByName: existingEvaluation?.evaluatedByName,
      notes: existingEvaluation?.notes || null,
      updatedAt: existingEvaluation?.updatedAt.toISOString(),
      metrics,
      items,
    };

    return { success: true, data: payload };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy dữ liệu đánh giá KPI hằng ngày" };
  }
}

/**
 * Lưu hoặc cập nhật phiếu Đánh giá KPI hằng ngày
 */
export async function saveDailyKpiEvaluation(data: {
  date: string;
  campusId?: string | null;
  notes?: string | null;
  status?: DailyKpiStatus;
  items: {
    kpiCatalogId: string;
    autoValue: number;
    manualValue?: number | null;
    notes?: string | null;
  }[];
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    const evaluatedById = session?.user?.id || null;
    const evaluatedByName = session?.user?.name || "Cán bộ Quản lý";

    const { normalized } = normalizeDate(data.date);
    const campusId = data.campusId && data.campusId !== "ALL" ? data.campusId : null;

    // 1. Lấy thông tin KPI Catalogs để tính weightedScore chính xác
    const catalogIds = data.items.map((i) => i.kpiCatalogId);
    const catalogs = await prisma.kpiCatalog.findMany({
      where: { id: { in: catalogIds } },
    });
    const catalogMap = new Map(catalogs.map((c) => [c.id, c]));

    let overallScoreSum = 0;
    const processedItems = data.items.map((item) => {
      const catalog = catalogMap.get(item.kpiCatalogId);
      const targetVal = catalog?.targetValue ?? 100.0;
      const weightVal = catalog?.weight ?? 0.0;
      const direction = catalog?.direction ?? MeasurementDirection.HIGHER_BETTER;

      const manualVal = item.manualValue !== undefined ? item.manualValue : null;
      const actualVal = manualVal !== null && manualVal !== undefined ? manualVal : item.autoValue;

      const { completionRate, weightedScore } = calculateKpiScore(
        actualVal,
        targetVal,
        weightVal,
        direction
      );

      overallScoreSum += weightedScore;

      return {
        kpiCatalogId: item.kpiCatalogId,
        autoValue: Number(item.autoValue.toFixed(2)),
        manualValue: manualVal !== null ? Number(manualVal.toFixed(2)) : null,
        actualValue: Number(actualVal.toFixed(2)),
        targetValue: targetVal,
        weight: weightVal,
        completionRate,
        weightedScore,
        notes: item.notes || null,
      };
    });

    const finalOverallScore = Number(overallScoreSum.toFixed(2));
    const finalStatus = data.status || DailyKpiStatus.DRAFT;

    // 2. Upsert DailyKpiEvaluation
    const evaluation = await prisma.dailyKpiEvaluation.upsert({
      where: {
        date_campusId: {
          date: normalized,
          campusId: campusId as any,
        },
      },
      update: {
        overallScore: finalOverallScore,
        status: finalStatus,
        evaluatedById,
        evaluatedByName,
        notes: data.notes || null,
      },
      create: {
        date: normalized,
        campusId,
        overallScore: finalOverallScore,
        status: finalStatus,
        evaluatedById,
        evaluatedByName,
        notes: data.notes || null,
      },
    });

    // 3. Upsert DailyKpiItem records
    for (const item of processedItems) {
      await prisma.dailyKpiItem.upsert({
        where: {
          evaluationId_kpiCatalogId: {
            evaluationId: evaluation.id,
            kpiCatalogId: item.kpiCatalogId,
          },
        },
        update: {
          autoValue: item.autoValue,
          manualValue: item.manualValue,
          actualValue: item.actualValue,
          targetValue: item.targetValue,
          weight: item.weight,
          completionRate: item.completionRate,
          weightedScore: item.weightedScore,
          notes: item.notes,
        },
        create: {
          evaluationId: evaluation.id,
          kpiCatalogId: item.kpiCatalogId,
          autoValue: item.autoValue,
          manualValue: item.manualValue,
          actualValue: item.actualValue,
          targetValue: item.targetValue,
          weight: item.weight,
          completionRate: item.completionRate,
          weightedScore: item.weightedScore,
          notes: item.notes,
        },
      });
    }

    // 4. Cảnh báo tự động (EarlyWarning) nếu điểm tổng kết ngày < 70 điểm
    if (finalOverallScore < 70) {
      let campusName = "Toàn trường";
      if (campusId) {
        const campus = await prisma.campus.findUnique({
          where: { id: campusId },
          select: { name: true },
        });
        if (campus) campusName = campus.name;
      }

      const warningTitle = `[Cảnh báo KPI Hằng ngày] Điểm vận hành ngày ${data.date} dưới ngưỡng (${finalOverallScore} điểm)`;

      // Kiểm tra xem hôm nay đã có cảnh báo tương tự chưa để tránh duplicate
      const existingWarning = await prisma.earlyWarning.findFirst({
        where: {
          title: warningTitle,
          campusName,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      if (!existingWarning) {
        await prisma.earlyWarning.create({
          data: {
            title: warningTitle,
            category: WarningCategory.PROGRESS_SLIP,
            level: finalOverallScore < 50 ? WarningLevel.CRITICAL : WarningLevel.HIGH,
            campusName,
            description: `Điểm đánh giá KPI hằng ngày của ${campusName} đạt ${finalOverallScore}/100 điểm. Cần rà soát các chỉ tiêu sụt giảm trong ngày.`,
            aiAnalysis: `Hệ thống AI đề xuất: 1. Phó Hiệu trưởng kiểm tra nguyên nhân sụt giảm chỉ tiêu chuyên cần / giảng dạy. 2. Họp nhanh giao ban phân hiệu để khắc phục ngay trong ngày làm việc tiếp theo.`,
            isResolved: false,
          },
        });
      }
    }

    return {
      success: true,
      data: {
        id: evaluation.id,
        overallScore: finalOverallScore,
        status: finalStatus,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lưu phiếu đánh giá KPI hằng ngày" };
  }
}

/**
 * Lấy lịch sử đánh giá KPI hằng ngày cho biểu đồ xu hướng (Trendline 7 - 30 ngày)
 */
export async function getDailyKpiHistory(
  campusIdParam?: string,
  daysLimit: number = 7
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const campusId = campusIdParam && campusIdParam !== "ALL" ? campusIdParam : null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysLimit - 1));
    startDate.setHours(0, 0, 0, 0);

    let evaluations: any[] = [];
    try {
      evaluations = await prisma.dailyKpiEvaluation.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          campusId: campusId,
        },
        orderBy: { date: "asc" },
        include: {
          items: {
            include: {
              kpiCatalog: { select: { code: true, name: true, category: true } },
            },
          },
          campus: { select: { name: true } },
        },
      });
    } catch {
      evaluations = [];
    }

    // Format output data for charts
    const historyList = [];
    const dateCursor = new Date(startDate);

    while (dateCursor <= endDate) {
      const dateStr = dateCursor.toISOString().split("T")[0];
      const match = evaluations.find(
        (e) => e.date.toISOString().split("T")[0] === dateStr
      );

      if (match) {
        historyList.push({
          date: dateStr,
          displayDate: `${dateCursor.getDate()}/${dateCursor.getMonth() + 1}`,
          overallScore: match.overallScore,
          status: match.status,
          evaluatedByName: match.evaluatedByName,
          itemCount: match.items.length,
          notes: match.notes,
        });
      } else {
        // Ngày chưa chốt đánh giá -> tính điểm ước tính nhanh hoặc trả về null
        historyList.push({
          date: dateStr,
          displayDate: `${dateCursor.getDate()}/${dateCursor.getMonth() + 1}`,
          overallScore: null,
          status: "UNRECORDED",
          evaluatedByName: null,
          itemCount: 0,
          notes: null,
        });
      }

      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return { success: true, data: historyList };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy lịch sử đánh giá KPI" };
  }
}

/**
 * 1-Click Sync: Tổng hợp trung bình đánh giá hằng ngày vào Kỳ đánh giá KPI chính thức (KpiPeriod)
 */
export async function syncDailyToMonthlyKpi(
  month: number,
  year: number,
  campusIdParam?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const campusId = campusIdParam && campusIdParam !== "ALL" ? campusIdParam : null;

    // 1. Xác định phạm vi ngày trong tháng
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 2. Tìm tất cả DailyKpiEvaluation trong tháng
    let dailyEvals: any[] = [];
    try {
      dailyEvals = await prisma.dailyKpiEvaluation.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          campusId: campusId,
        },
        include: {
          items: true,
        },
      });
    } catch {
      return {
        success: false,
        error: "Chưa tìm thấy dữ liệu hoặc bảng DailyKpiEvaluation chưa được khởi tạo trong CSDL. Vui lòng áp dụng SQL migration.",
      };
    }

    if (dailyEvals.length === 0) {
      return {
        success: false,
        error: `Không tìm thấy bản ghi đánh giá KPI hằng ngày nào trong Tháng ${month}/${year}.`,
      };
    }

    // 3. Tìm hoặc Tạo KpiPeriod cho tháng này
    const periodTitle = `Đánh giá KPI Tháng ${month}/${year}`;
    let period = await prisma.kpiPeriod.findFirst({
      where: {
        title: periodTitle,
        year,
        periodType: ReportingFrequency.MONTHLY,
        campusId: campusId,
      },
      include: {
        targets: { include: { kpi: true } },
      },
    });

    if (!period) {
      const createdPeriod = await prisma.kpiPeriod.create({
        data: {
          title: periodTitle,
          year,
          periodType: ReportingFrequency.MONTHLY,
          campusId: campusId,
          status: KpiPeriodStatus.DRAFT,
        },
        include: {
          targets: { include: { kpi: true } },
        },
      });

      // Clone targets from active catalog
      const activeCatalogs = await prisma.kpiCatalog.findMany({
        where: { isActive: true },
      });

      if (activeCatalogs.length > 0) {
        await prisma.kpiTarget.createMany({
          data: activeCatalogs.map((kpi) => ({
            periodId: createdPeriod.id,
            kpiId: kpi.id,
            targetValue: kpi.targetValue ?? 100,
            weight: kpi.weight ?? 0,
          })),
        });

        // Re-fetch targets
        period = (await prisma.kpiPeriod.findUnique({
          where: { id: createdPeriod.id },
          include: { targets: { include: { kpi: true } } },
        })) as any;
      } else {
        period = createdPeriod as any;
      }
    }

    if (period && period.status === KpiPeriodStatus.APPROVED) {
      return {
        success: false,
        error: "Kỳ KPI Tháng này đã được Hiệu trưởng phê duyệt và khóa. Không thể ghi đè.",
      };
    }

    // 4. Tính toán giá trị trung bình từng chỉ số KPI qua các ngày
    const catalogItemStats = new Map<string, { sumActual: number; count: number }>();

    for (const evalRecord of dailyEvals) {
      for (const item of evalRecord.items) {
        const curr = catalogItemStats.get(item.kpiCatalogId) || { sumActual: 0, count: 0 };
        curr.sumActual += item.actualValue;
        curr.count += 1;
        catalogItemStats.set(item.kpiCatalogId, curr);
      }
    }

    let overallScoreSum = 0;
    let syncedCount = 0;

    for (const target of period!.targets) {
      const stats = catalogItemStats.get(target.kpiId);
      if (!stats || stats.count === 0) continue;

      const avgActual = Number((stats.sumActual / stats.count).toFixed(2));
      const targetVal = target.targetValue ?? target.kpi.targetValue ?? 100;
      const weightVal = target.weight ?? target.kpi.weight ?? 0;

      const { completionRate, weightedScore } = calculateKpiScore(
        avgActual,
        targetVal,
        weightVal,
        target.kpi.direction
      );

      overallScoreSum += weightedScore;
      syncedCount += 1;

      await prisma.kpiValue.upsert({
        where: {
          periodId_kpiId: {
            periodId: period!.id,
            kpiId: target.kpiId,
          },
        },
        update: {
          actualValue: avgActual,
          completionRate,
          weightedScore,
          notes: `[Tự động tổng hợp]: Trung bình từ ${stats.count} ngày đánh giá trong tháng ${month}/${year}.`,
        },
        create: {
          periodId: period!.id,
          kpiId: target.kpiId,
          actualValue: avgActual,
          completionRate,
          weightedScore,
          notes: `[Tự động tổng hợp]: Trung bình từ ${stats.count} ngày đánh giá trong tháng ${month}/${year}.`,
        },
      });
    }

    // Cập nhật overallScore của KpiPeriod
    await prisma.kpiPeriod.update({
      where: { id: period!.id },
      data: {
        overallScore: Number(overallScoreSum.toFixed(2)),
      },
    });

    return {
      success: true,
      message: `Đã đồng bộ thành công ${syncedCount} chỉ số KPI từ ${dailyEvals.length} ngày đánh giá vào ${periodTitle}. Điểm tổng kết: ${overallScoreSum.toFixed(2)} điểm.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi đồng bộ dữ liệu KPI hằng ngày sang tháng" };
  }
}

/**
 * Lấy tổng quan nhanh KPI hôm nay cho Widget trên Dashboard
 */
export async function getDailyKpiOverviewForWidget(campusIdParam?: string): Promise<{
  success: boolean;
  data?: {
    todayScore: number;
    attendanceRate: number;
    incidentCount: number;
    journalRate: number;
    evaluationStatus: DailyKpiStatus | "UNRECORDED";
    warningAlert: boolean;
    campusName: string;
  };
  error?: string;
}> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await getDailyKpiRealtime(today, campusIdParam);

    if (!res.success || !res.data) {
      return { success: false, error: res.error || "Không lấy được dữ liệu KPI hôm nay" };
    }

    const payload = res.data;
    const warningAlert = payload.overallScore < 70 || payload.metrics.incidentCount > 0;

    return {
      success: true,
      data: {
        todayScore: payload.overallScore,
        attendanceRate: payload.metrics.attendanceRate,
        incidentCount: payload.metrics.incidentCount,
        journalRate: payload.metrics.journalCompletionRate,
        evaluationStatus: payload.id ? payload.status : "UNRECORDED",
        warningAlert,
        campusName: payload.campusName || "Toàn trường",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy dữ liệu widget KPI" };
  }
}
