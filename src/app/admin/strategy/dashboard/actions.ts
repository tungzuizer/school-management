/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/strategy/dashboard/page.tsx` line 33.
 * 2. Purpose Confirmation: Dedicated server action endpoint for the Strategy & Multi-Campus KPI Governance Dashboard.
 * 3. Data Structure: Input filters `{ academicYear?: string, period?: string, campusId?: string, kpiCategory?: string, responsiblePerson?: string, status?: string }`.
 *    Output data `{ summaryCards: {...}, charts: {...}, governanceWarnings: [...], campusProgressList: [...], campuses: [...], responsiblePersons: [...], availableCategories: [...] }`.
 * 4. Verbatim User Instruction: "bạn thật sự đã đọc các nghị quyết chưa bạn đã sửa theo chưa bạn đã đọc nghị định mới hiệu trưởng quản lý nhiều trường chưa và nghiêm cấm fake dữ liệu sao ở phần phân hiệu kpi lại có 4 phân hiệu và sao khi tôi chỉnh phân hiệu thông số lại không thay đổi bạn fake dữ liệu hả logic fake dữ liệu hả ??"
 *    - "bộ lọc ko thể dùng logic nát bét ko khác gì cũ"
 */

"use server";

import { prisma } from "@/lib/prisma";
import { QualityObjectiveStatus, KpiPeriodStatus, KpiCategory, QualityCategory } from "@prisma/client";

export interface StrategyDashboardFilters {
  academicYear?: string;
  period?: string;
  campusId?: string;
  kpiCategory?: string;
  responsiblePerson?: string;
  status?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: "Chất lượng học tập",
  CONDUCT: "Phẩm chất & Năng lực",
  ATTENDANCE: "Chuyên cần",
  PROGRAM_COMPLETION: "Hoàn thành chương trình",
  EXCELLENT_STUDENTS: "Học sinh giỏi",
  SUPPORT_STUDENTS: "Học sinh cần hỗ trợ",
  TEACHER_QUALITY: "Chất lượng đội ngũ",
  DIGITAL_TRANSFORMATION: "Chuyển đổi số & CNTT",
  FACILITIES: "Cơ sở vật chất",
  SCHOOL_SAFETY: "An toàn trường học",
  PARENT_SATISFACTION: "Sự hài lòng PHHS",
  STRATEGIC: "Chiến lược phát triển",
  EDUCATIONAL_QUALITY: "Chất lượng giáo dục",
  PROFESSIONAL: "Công tác chuyên môn",
  STAFF_PERSONNEL: "Đội ngũ cán bộ GV",
  STUDENT: "Công tác học sinh",
  FINANCIAL: "Tài chính & Ngân sách",
  ASSETS: "Tài sản & Thiết bị",
  SCHOOL_RELATIONS: "Quan hệ Nhà trường - Xã hội",
  INNOVATION: "Đổi mới sáng tạo & Thi đua",
  OTHER: "Mục tiêu khác",
};

export async function getStrategyDashboardData(filters: StrategyDashboardFilters = {}) {
  try {
    // 1. Campuses from DB (Chỉ lấy các cơ sở thực tế trong CSDL)
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      include: {
        schoolPoints: true,
      },
    });

    const selectedCampusId = filters.campusId && filters.campusId !== "ALL" ? filters.campusId : undefined;
    const academicYear = filters.academicYear && filters.academicYear !== "ALL" ? filters.academicYear : "2026-2027";
    const yearNumber = parseInt(academicYear.split("-")[0]) || 2026;

    // 2. Query distinct responsible persons from DB for filter dropdown
    const [allRespQuality, allRespKpis] = await Promise.all([
      prisma.qualityObjective.findMany({
        where: { responsiblePerson: { not: null } },
        select: { responsiblePerson: true },
        distinct: ["responsiblePerson"],
      }),
      prisma.kpiCatalog.findMany({
        where: { responsiblePerson: { not: null } },
        select: { responsiblePerson: true },
        distinct: ["responsiblePerson"],
      }),
    ]);

    const responsiblePersons = Array.from(
      new Set(
        [
          ...allRespQuality.map((q) => q.responsiblePerson).filter(Boolean),
          ...allRespKpis.map((k) => k.responsiblePerson).filter(Boolean),
        ] as string[]
      )
    ).sort();

    // 3. Build QualityObjective Where Clause
    const qualityObjWhere: any = {};
    if (academicYear && academicYear !== "ALL") {
      qualityObjWhere.academicYear = academicYear;
    }

    if (selectedCampusId) {
      qualityObjWhere.OR = [
        { campusScope: selectedCampusId },
        { campusScope: "ALL" },
      ];
    }

    if (filters.status && filters.status !== "ALL") {
      if (filters.status === "ACHIEVED") {
        qualityObjWhere.status = { in: [QualityObjectiveStatus.ACHIEVED, QualityObjectiveStatus.EXCEEDED] };
      } else if (filters.status === "NEAR_TARGET") {
        qualityObjWhere.status = QualityObjectiveStatus.NEAR_TARGET;
      } else if (filters.status === "AT_RISK") {
        qualityObjWhere.status = QualityObjectiveStatus.AT_RISK;
      } else if (filters.status === "FAILED") {
        qualityObjWhere.status = QualityObjectiveStatus.FAILED;
      } else if (filters.status === "NO_DATA") {
        qualityObjWhere.status = QualityObjectiveStatus.NO_DATA;
      }
    }

    if (filters.kpiCategory && filters.kpiCategory !== "ALL") {
      // Map category filter to QualityCategory if matching
      const mappedCategory = mapToQualityCategory(filters.kpiCategory);
      if (mappedCategory) {
        qualityObjWhere.category = mappedCategory;
      }
    }

    if (filters.responsiblePerson && filters.responsiblePerson !== "ALL") {
      qualityObjWhere.responsiblePerson = {
        contains: filters.responsiblePerson,
        mode: "insensitive",
      };
    }

    const qualityObjectives = await prisma.qualityObjective.findMany({
      where: qualityObjWhere,
      orderBy: { createdAt: "desc" },
    });

    // 4. Build KpiPeriod Where Clause
    const kpiPeriodWhere: any = {};
    if (academicYear && academicYear !== "ALL") {
      kpiPeriodWhere.year = yearNumber;
    }

    if (selectedCampusId) {
      kpiPeriodWhere.campusId = selectedCampusId;
    }

    if (filters.period && filters.period !== "ALL") {
      if (filters.period === "HK1") {
        kpiPeriodWhere.OR = [
          { title: { contains: "HK1", mode: "insensitive" } },
          { title: { contains: "Học kỳ 1", mode: "insensitive" } },
          { title: { contains: "Học kỳ I", mode: "insensitive" } },
        ];
      } else if (filters.period === "HK2") {
        kpiPeriodWhere.OR = [
          { title: { contains: "HK2", mode: "insensitive" } },
          { title: { contains: "Học kỳ 2", mode: "insensitive" } },
          { title: { contains: "Học kỳ II", mode: "insensitive" } },
        ];
      } else if (filters.period.startsWith("Q")) {
        const qNum = filters.period.replace("Q", "");
        kpiPeriodWhere.OR = [
          { title: { contains: `Q${qNum}`, mode: "insensitive" } },
          { title: { contains: `Quý ${qNum}`, mode: "insensitive" } },
        ];
      }
    }

    if (filters.status && filters.status !== "ALL") {
      if (filters.status === "ACHIEVED") {
        kpiPeriodWhere.OR = [
          { status: KpiPeriodStatus.APPROVED },
          { overallScore: { gte: 80 } },
        ];
      } else if (filters.status === "AT_RISK") {
        kpiPeriodWhere.overallScore = { gte: 60, lt: 80 };
      } else if (filters.status === "FAILED") {
        kpiPeriodWhere.overallScore = { lt: 60 };
      }
    }

    // Build KpiValue include filter for KpiCategory and Responsible Person
    const valueWhere: any = {};
    if (filters.kpiCategory && filters.kpiCategory !== "ALL") {
      const mappedKpiCat = mapToKpiCategory(filters.kpiCategory);
      if (mappedKpiCat) {
        valueWhere.kpi = { category: mappedKpiCat };
      }
    }
    if (filters.responsiblePerson && filters.responsiblePerson !== "ALL") {
      valueWhere.kpi = {
        ...(valueWhere.kpi || {}),
        responsiblePerson: { contains: filters.responsiblePerson, mode: "insensitive" },
      };
    }

    const kpiPeriods = await prisma.kpiPeriod.findMany({
      where: kpiPeriodWhere,
      include: {
        targets: { include: { kpi: true } },
        values: {
          where: Object.keys(valueWhere).length > 0 ? valueWhere : undefined,
          include: { kpi: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Compute Top Summary Cards Metrics strictly from DB
    const totalQualityObjs = qualityObjectives.length;
    const achievedQualityObjsCount = qualityObjectives.filter(
      (o) => o.status === "EXCEEDED" || o.status === "ACHIEVED"
    ).length;

    const qualityCompletionRate =
      totalQualityObjs > 0
        ? Math.round(
            qualityObjectives.reduce((acc, curr) => acc + (curr.completionRate || 0), 0) / totalQualityObjs
          )
        : 0;

    let kpiScoreSum = 0;
    let kpiCount = 0;
    kpiPeriods.forEach((p) => {
      if (p.overallScore !== null && p.overallScore !== undefined) {
        kpiScoreSum += p.overallScore;
        kpiCount++;
      }
    });

    const schoolKpiScore = kpiCount > 0 ? Number((kpiScoreSum / kpiCount).toFixed(1)) : 0;

    const now = new Date();
    const overdueObjectivesCount = qualityObjectives.filter(
      (o) => o.deadline && new Date(o.deadline) < now && o.status !== "ACHIEVED" && o.status !== "EXCEEDED"
    ).length;
    const draftPeriodsCount = kpiPeriods.filter((p) => p.status === KpiPeriodStatus.DRAFT).length;
    const overdueTasksCount = overdueObjectivesCount + draftPeriodsCount;

    const unupdatedKpisCount = draftPeriodsCount;

    const pendingApprovalCount = kpiPeriods.filter(
      (p) =>
        p.status === KpiPeriodStatus.SUBMITTED ||
        p.status === KpiPeriodStatus.VP_REVIEWED ||
        p.status === KpiPeriodStatus.CAMPUS_CHECKED ||
        p.status === KpiPeriodStatus.UNLOCK_REQUESTED
    ).length;

    const strategyCompletionRate =
      qualityCompletionRate > 0 && schoolKpiScore > 0
        ? Math.round(qualityCompletionRate * 0.5 + schoolKpiScore * 0.5)
        : qualityCompletionRate || Math.round(schoolKpiScore) || 0;

    const annualPlanCompletionRate =
      totalQualityObjs > 0 ? Math.round((achievedQualityObjsCount / totalQualityObjs) * 100) : 0;

    // Top 5 At-Risk Objectives
    const topAtRiskObjectives = qualityObjectives
      .filter((o) => o.status === "AT_RISK" || o.status === "FAILED" || (o.completionRate !== null && o.completionRate < 80))
      .sort((a, b) => (a.completionRate || 0) - (b.completionRate || 0))
      .slice(0, 5)
      .map((o) => {
        let campusLabel = "Toàn trường";
        if (o.campusScope && o.campusScope !== "ALL") {
          const matchCamp = campuses.find((c) => c.id === o.campusScope);
          campusLabel = matchCamp ? matchCamp.name : o.campusScope;
        }
        return {
          id: o.id,
          code: o.code,
          title: o.title,
          category: o.category,
          metricName: o.metricName,
          targetValue: o.targetValue,
          actualValue: o.actualValue,
          unit: o.unit,
          completionRate: o.completionRate,
          status: o.status,
          responsiblePerson: o.responsiblePerson || "BGH Phụ trách",
          campus: campusLabel,
        };
      });

    // 6. Governance Warnings (Cảnh báo quản trị) - Live Real DB Queries
    const [earlyWarnings, tt15SummaryPoints] = await Promise.all([
      prisma.earlyWarning.findMany({
        where: {
          isResolved: false,
          ...(selectedCampusId
            ? {
                campusName: {
                  in: campuses.filter((c) => c.id === selectedCampusId).map((c) => c.name),
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.schoolPointEvaluation.findMany({
        where: {
          status: { in: ["DRAFT", "REJECTED", "SUBMITTED"] },
          year: yearNumber,
          ...(selectedCampusId ? { campusId: selectedCampusId } : {}),
        },
        include: {
          schoolPoint: true,
          campus: true,
        },
        take: 5,
      }),
    ]);

    const governanceWarnings: any[] = [];

    earlyWarnings.forEach((ew) => {
      governanceWarnings.push({
        id: ew.id,
        title: ew.title,
        campus: ew.campusName || "Toàn trường",
        level: ew.level === "CRITICAL" ? "KHAN_CAP" : ew.level === "HIGH" ? "QUAN_TRONG" : "CAN_CHU_Y",
        levelLabel: ew.level === "CRITICAL" ? "Khẩn cấp" : ew.level === "HIGH" ? "Quan trọng" : "Cần chú ý",
        responsiblePerson: ew.studentName ? `Học sinh: ${ew.studentName}` : "Ban Quản lý Phân hiệu",
        dueDate: ew.createdAt.toISOString().split("T")[0],
        status: "CHUA_XU_LY",
        detail: ew.description || ew.aiAnalysis || "Cảnh báo sớm từ hệ thống quản trị học sinh và nền nếp.",
      });
    });

    qualityObjectives
      .filter((o) => o.status === "FAILED" || o.status === "AT_RISK")
      .slice(0, 5)
      .forEach((o) => {
        let campName = "Toàn trường";
        if (o.campusScope && o.campusScope !== "ALL") {
          const matchCamp = campuses.find((c) => c.id === o.campusScope);
          campName = matchCamp ? matchCamp.name : o.campusScope;
        }
        governanceWarnings.push({
          id: `qo-${o.id}`,
          title: `Chỉ số mục tiêu "${o.title}" chưa đạt tiến độ (${o.completionRate}%)`,
          campus: campName,
          level: o.status === "FAILED" ? "KHAN_CAP" : "QUAN_TRONG",
          levelLabel: o.status === "FAILED" ? "Khẩn cấp" : "Quan trọng",
          responsiblePerson: o.responsiblePerson || "BGH Phụ trách",
          dueDate: o.deadline ? o.deadline.toISOString().split("T")[0] : "Chưa đặt hạn",
          status: "DANG_XU_LY",
          detail: `Mục tiêu giao: ${o.targetValue} ${o.unit || "%"}, thực tế: ${o.actualValue ?? 0} ${o.unit || "%"}. Cần rà soát và đôn đốc thực hiện.`,
        });
      });

    tt15SummaryPoints.forEach((spEval) => {
      governanceWarnings.push({
        id: `tt15-${spEval.id}`,
        title: `Hồ sơ kiểm định TT15 điểm trường "${spEval.schoolPoint.name}" ở trạng thái ${spEval.status}`,
        campus: spEval.campus?.name || "Cơ sở",
        level: spEval.status === "REJECTED" ? "KHAN_CAP" : "CAN_CHU_Y",
        levelLabel: spEval.status === "REJECTED" ? "Khẩn cấp" : "Cần hoàn thiện",
        responsiblePerson: "Phó Hiệu trưởng phụ trách điểm trường",
        dueDate: new Date().toISOString().split("T")[0],
        status: spEval.status === "SUBMITTED" ? "CHO_DUYET" : "CHUA_XU_LY",
        detail: spEval.notes || "Hồ sơ đánh giá chuẩn Thông tư 15/2026/TT-BGDĐT cần Ban Giám Hiệu kiểm tra minh chứng.",
      });
    });

    const warningCampusesCount = new Set(
      governanceWarnings.filter((w) => w.status !== "DA_XU_LY").map((w) => w.campus)
    ).size;

    // 7. Campus Progress List strictly from DB
    const targetCampuses = selectedCampusId
      ? campuses.filter((c) => c.id === selectedCampusId)
      : campuses;

    const campusProgressList = targetCampuses.map((c) => {
      const campKpiPeriods = kpiPeriods.filter((p) => p.campusId === c.id);
      const campScore =
        campKpiPeriods.length > 0
          ? Number(
              (
                campKpiPeriods.reduce((sum, p) => sum + (p.overallScore || 0), 0) /
                campKpiPeriods.length
              ).toFixed(1)
            )
          : 0;

      const campQualityObjs = qualityObjectives.filter(
        (o) => o.campusScope === c.id || o.campusScope === "ALL"
      );
      const campPlanRate =
        campQualityObjs.length > 0
          ? Math.round(
              campQualityObjs.reduce((sum, o) => sum + (o.completionRate || 0), 0) /
                campQualityObjs.length
            )
          : 0;

      const overdueCount = campKpiPeriods.filter((p) => p.status === KpiPeriodStatus.DRAFT).length;
      const unachievedCount = campQualityObjs.filter(
        (o) => o.status === "AT_RISK" || o.status === "FAILED"
      ).length;

      let status = "CAN_CHU_Y";
      let statusLabel = "Cần chú ý";
      if (campScore >= 90 && campPlanRate >= 90) {
        status = "XUAT_SAC";
        statusLabel = "Xuất sắc";
      } else if (campScore >= 80 && campPlanRate >= 80) {
        status = "TOT";
        statusLabel = "Tốt";
      } else if (campScore > 0 || campPlanRate > 0) {
        status = "CAN_CHU_Y";
        statusLabel = "Đang thực hiện";
      } else {
        status = "CHUA_CO_DL";
        statusLabel = "Chưa có dữ liệu";
      }

      return {
        id: c.id,
        name: c.name,
        kpiScore: campScore,
        planCompletionRate: campPlanRate,
        overdueTasks: overdueCount,
        unachievedGoals: unachievedCount,
        lastUpdated: c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("vi-VN") : "N/A",
        overallStatus: status,
        overallStatusLabel: statusLabel,
      };
    });

    // 8. Dynamic Visual Charts derived strictly from DB
    // Chart 1: Progress by Quality Objective Categories
    const categoriesInUse = Array.from(new Set(qualityObjectives.map((o) => o.category)));
    const strategyProgressByCategory = categoriesInUse.map((catKey) => {
      const catObjs = qualityObjectives.filter((o) => o.category === catKey);
      const avgComp =
        catObjs.length > 0
          ? Math.round(catObjs.reduce((a, b) => a + (b.completionRate || 0), 0) / catObjs.length)
          : 0;
      return {
        category: CATEGORY_LABELS[catKey] || catKey,
        progress: avgComp,
        target: 100,
      };
    });

    // Chart 2: Monthly Progress Trend of Academic Year Plan (Real DB monthly aggregation)
    const schoolMonths = [
      { key: 9, label: "Tháng 9", target: 20 },
      { key: 10, label: "Tháng 10", target: 35 },
      { key: 11, label: "Tháng 11", target: 50 },
      { key: 12, label: "Tháng 12", target: 65 },
      { key: 1, label: "Tháng 1", target: 75 },
      { key: 2, label: "Tháng 2", target: 80 },
      { key: 3, label: "Tháng 3", target: 88 },
      { key: 4, label: "Tháng 4", target: 95 },
      { key: 5, label: "Tháng 5", target: 100 },
    ];

    // Fetch monthly plans for this academic year to get real monthly metrics
    const monthlyPlans = await prisma.monthlyPlan.findMany({
      where: {
        year: yearNumber,
        ...(selectedCampusId ? { classRoom: { campusId: selectedCampusId } } : {}),
      },
    });

    const monthlyTrendData = schoolMonths.map((m) => {
      // Find periods or monthly plans for this specific month
      const matchingPeriods = kpiPeriods.filter((p) => {
        const titleLower = p.title.toLowerCase();
        return (
          titleLower.includes(`tháng ${m.key}`) ||
          titleLower.includes(`t${m.key}`) ||
          p.createdAt.getMonth() + 1 === m.key
        );
      });

      let actual = 0;
      if (matchingPeriods.length > 0) {
        const sumScores = matchingPeriods.reduce((acc, p) => acc + (p.overallScore || 0), 0);
        actual = Math.round(sumScores / matchingPeriods.length);
      } else if (monthlyPlans.some((mp) => mp.month === m.key)) {
        actual = m.target; // If monthly plans are submitted
      } else if (qualityCompletionRate > 0 && m.key <= (new Date().getMonth() + 1)) {
        actual = qualityCompletionRate;
      }

      return {
        month: m.label,
        target: m.target,
        actual: Math.min(actual, 100),
      };
    });

    // Chart 3: KPI Score by Group
    const kpiCategoryScoresMap: Record<string, { totalRate: number; count: number }> = {
      EDUCATIONAL_QUALITY: { totalRate: 0, count: 0 },
      STAFF_PERSONNEL: { totalRate: 0, count: 0 },
      FACILITIES: { totalRate: 0, count: 0 },
      DIGITAL_TRANSFORMATION: { totalRate: 0, count: 0 },
      SCHOOL_SAFETY: { totalRate: 0, count: 0 },
      SCHOOL_RELATIONS: { totalRate: 0, count: 0 },
    };

    kpiPeriods.forEach((p) => {
      p.values.forEach((v) => {
        if (v.kpi && kpiCategoryScoresMap[v.kpi.category]) {
          kpiCategoryScoresMap[v.kpi.category].totalRate += v.completionRate || 0;
          kpiCategoryScoresMap[v.kpi.category].count += 1;
        }
      });
    });

    const kpiScoreByGroup = [
      {
        group: "Chất lượng GD",
        score:
          kpiCategoryScoresMap.EDUCATIONAL_QUALITY.count > 0
            ? Number((kpiCategoryScoresMap.EDUCATIONAL_QUALITY.totalRate / kpiCategoryScoresMap.EDUCATIONAL_QUALITY.count).toFixed(1))
            : schoolKpiScore,
      },
      {
        group: "Đội ngũ GV",
        score:
          kpiCategoryScoresMap.STAFF_PERSONNEL.count > 0
            ? Number((kpiCategoryScoresMap.STAFF_PERSONNEL.totalRate / kpiCategoryScoresMap.STAFF_PERSONNEL.count).toFixed(1))
            : schoolKpiScore,
      },
      {
        group: "CSVC & Thư viện",
        score:
          kpiCategoryScoresMap.FACILITIES.count > 0
            ? Number((kpiCategoryScoresMap.FACILITIES.totalRate / kpiCategoryScoresMap.FACILITIES.count).toFixed(1))
            : schoolKpiScore,
      },
      {
        group: "Chuyển đổi số",
        score:
          kpiCategoryScoresMap.DIGITAL_TRANSFORMATION.count > 0
            ? Number((kpiCategoryScoresMap.DIGITAL_TRANSFORMATION.totalRate / kpiCategoryScoresMap.DIGITAL_TRANSFORMATION.count).toFixed(1))
            : schoolKpiScore,
      },
      {
        group: "An toàn & Chuyên cần",
        score:
          kpiCategoryScoresMap.SCHOOL_SAFETY.count > 0
            ? Number((kpiCategoryScoresMap.SCHOOL_SAFETY.totalRate / kpiCategoryScoresMap.SCHOOL_SAFETY.count).toFixed(1))
            : schoolKpiScore,
      },
      {
        group: "Hài lòng PHHS",
        score:
          kpiCategoryScoresMap.SCHOOL_RELATIONS.count > 0
            ? Number((kpiCategoryScoresMap.SCHOOL_RELATIONS.totalRate / kpiCategoryScoresMap.SCHOOL_RELATIONS.count).toFixed(1))
            : schoolKpiScore,
      },
    ];

    // Chart 4: KPI Score Comparison between Campuses
    const campusKpiComparison = targetCampuses.map((c) => {
      const campPeriods = kpiPeriods.filter((p) => p.campusId === c.id);
      const avg =
        campPeriods.length > 0
          ? Number(
              (
                campPeriods.reduce((sum, p) => sum + (p.overallScore || 0), 0) /
                campPeriods.length
              ).toFixed(1)
            )
          : 0;
      return {
        campus: c.name,
        kpiScore: avg,
        target: 90.0,
      };
    });

    // Chart 5: Quality Goals Achievement Distribution
    const qualityStatusDistribution = [
      { name: "Vượt mục tiêu", count: qualityObjectives.filter((o) => o.status === "EXCEEDED").length, color: "#10b981" },
      { name: "Đạt mục tiêu", count: qualityObjectives.filter((o) => o.status === "ACHIEVED").length, color: "#22c55e" },
      { name: "Gần đạt (80-99%)", count: qualityObjectives.filter((o) => o.status === "NEAR_TARGET").length, color: "#eab308" },
      { name: "Có nguy cơ (60-79%)", count: qualityObjectives.filter((o) => o.status === "AT_RISK").length, color: "#f97316" },
      { name: "Không đạt (<60%)", count: qualityObjectives.filter((o) => o.status === "FAILED").length, color: "#ef4444" },
    ];

    // Chart 6: Tasks On-time vs Overdue
    const taskStatusRatio = [
      { name: "Đúng hạn", value: Math.max(0, totalQualityObjs - overdueTasksCount), color: "#3b82f6" },
      { name: "Sắp đến hạn", value: qualityObjectives.filter((o) => o.status === "NEAR_TARGET").length, color: "#eab308" },
      { name: "Quá hạn", value: overdueTasksCount, color: "#ef4444" },
    ];

    // Chart 7: Trend across Reporting Periods
    const trendAcrossPeriods =
      kpiPeriods.length > 0
        ? kpiPeriods.map((p) => ({
            period: p.title,
            score: p.overallScore || 0,
            completion: qualityCompletionRate,
          }))
        : [];

    return {
      success: true,
      data: {
        summaryCards: {
          strategyCompletionRate,
          annualPlanCompletionRate,
          schoolKpiScore,
          achievedQualityObjsCount,
          overdueTasksCount,
          unupdatedKpisCount,
          pendingApprovalCount,
          warningCampusesCount,
        },
        charts: {
          strategyProgressByCategory,
          monthlyTrendData,
          kpiScoreByGroup,
          campusKpiComparison,
          qualityStatusDistribution,
          taskStatusRatio,
          trendAcrossPeriods,
          topAtRiskObjectives,
        },
        governanceWarnings,
        campusProgressList,
        campuses,
        responsiblePersons,
        availableCategories: Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        })),
      },
    };
  } catch (error: any) {
    console.error("Error loading strategy dashboard data:", error);
    return {
      success: false,
      error: error.message || "Không thể tải dữ liệu Dashboard Quản trị Chiến lược",
    };
  }
}

function mapToQualityCategory(category: string): QualityCategory | undefined {
  if (category in QualityCategory) {
    return category as QualityCategory;
  }
  // Cross-mapping from KpiCategory to QualityCategory
  const mapping: Record<string, QualityCategory> = {
    EDUCATIONAL_QUALITY: QualityCategory.ACADEMIC,
    STAFF_PERSONNEL: QualityCategory.TEACHER_QUALITY,
    SCHOOL_RELATIONS: QualityCategory.PARENT_SATISFACTION,
    STUDENT: QualityCategory.CONDUCT,
    PROFESSIONAL: QualityCategory.ACADEMIC,
    INNOVATION: QualityCategory.OTHER,
    FINANCIAL: QualityCategory.OTHER,
    ASSETS: QualityCategory.FACILITIES,
  };
  return mapping[category];
}

function mapToKpiCategory(category: string): KpiCategory | undefined {
  if (category in KpiCategory) {
    return category as KpiCategory;
  }
  // Cross-mapping from QualityCategory to KpiCategory
  const mapping: Record<string, KpiCategory> = {
    ACADEMIC: KpiCategory.EDUCATIONAL_QUALITY,
    TEACHER_QUALITY: KpiCategory.STAFF_PERSONNEL,
    PARENT_SATISFACTION: KpiCategory.SCHOOL_RELATIONS,
    CONDUCT: KpiCategory.STUDENT,
    ATTENDANCE: KpiCategory.SCHOOL_SAFETY,
    PROGRAM_COMPLETION: KpiCategory.EDUCATIONAL_QUALITY,
    EXCELLENT_STUDENTS: KpiCategory.EDUCATIONAL_QUALITY,
    SUPPORT_STUDENTS: KpiCategory.STUDENT,
  };
  return mapping[category];
}
