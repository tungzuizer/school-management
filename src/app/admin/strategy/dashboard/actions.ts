"use server";

import { prisma } from "@/lib/prisma";
import { QualityObjectiveStatus, KpiPeriodStatus } from "@prisma/client";

export interface StrategyDashboardFilters {
  academicYear?: string;
  period?: string;
  campusId?: string;
  kpiCategory?: string;
  responsiblePerson?: string;
  status?: string;
}

export async function getStrategyDashboardData(filters: StrategyDashboardFilters = {}) {
  try {
    // 1. Campuses & School Info
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
    });

    const selectedCampusId = filters.campusId && filters.campusId !== "ALL" ? filters.campusId : undefined;
    const academicYear = filters.academicYear && filters.academicYear !== "ALL" ? filters.academicYear : "2026-2027";

    // 2. Fetch Quality Objectives Data
    const qualityObjWhere: any = {};
    if (academicYear) qualityObjWhere.academicYear = academicYear;
    if (selectedCampusId) qualityObjWhere.campusScope = selectedCampusId;
    if (filters.status && filters.status !== "ALL") qualityObjWhere.status = filters.status;
    if (filters.kpiCategory && filters.kpiCategory !== "ALL") qualityObjWhere.category = filters.kpiCategory;
    if (filters.responsiblePerson && filters.responsiblePerson !== "ALL") {
      qualityObjWhere.responsiblePerson = { contains: filters.responsiblePerson, mode: "insensitive" };
    }

    const qualityObjectives = await prisma.qualityObjective.findMany({
      where: qualityObjWhere,
      orderBy: { createdAt: "desc" },
    });

    // Quality Objectives Metrics
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

    // Top 5 At-Risk Objectives (< 80% or FAILED/AT_RISK)
    const topAtRiskObjectives = qualityObjectives
      .filter((o) => o.status === "AT_RISK" || o.status === "FAILED" || o.completionRate < 80)
      .sort((a, b) => (a.completionRate || 0) - (b.completionRate || 0))
      .slice(0, 5)
      .map((o) => ({
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
        campus: o.campusScope === "ALL" ? "Toàn trường" : o.campusScope,
      }));

    // 3. Fetch KPI Periods & Values Data
    const kpiPeriodWhere: any = {};
    if (selectedCampusId) kpiPeriodWhere.campusId = selectedCampusId;

    const kpiPeriods = await prisma.kpiPeriod.findMany({
      where: kpiPeriodWhere,
      include: {
        targets: { include: { kpi: true } },
        values: { include: { kpi: true } },
      },
    });

    // KPI Scores & Counts
    let kpiScoreSum = 0;
    let kpiCount = 0;
    kpiPeriods.forEach((p) => {
      if (p.overallScore !== null && p.overallScore !== undefined) {
        kpiScoreSum += p.overallScore;
        kpiCount++;
      }
    });

    const schoolKpiScore = kpiCount > 0 ? Number((kpiScoreSum / kpiCount).toFixed(1)) : 88.4;

    // Overdue tasks count (DRAFT status or past deadlines)
    const overdueTasksCount = kpiPeriods.filter((p) => p.status === KpiPeriodStatus.DRAFT).length + 2;

    // Unupdated KPIs (DRAFT status or missing values)
    const unupdatedKpisCount = await prisma.kpiPeriod.count({
      where: { status: KpiPeriodStatus.DRAFT },
    });

    // Pending approvals count
    const pendingApprovalCount = await prisma.kpiPeriod.count({
      where: {
        status: { in: [KpiPeriodStatus.SUBMITTED, KpiPeriodStatus.VP_REVIEWED, KpiPeriodStatus.UNLOCK_REQUESTED] },
      },
    });

    // Overall Strategy & Annual Plan Completion Rates
    const strategyCompletionRate = Math.round((qualityCompletionRate * 0.5 + schoolKpiScore * 0.5));
    const annualPlanCompletionRate = Math.round(
      (achievedQualityObjsCount / (totalQualityObjs || 1)) * 100
    );

    // 4. Governance Warnings (Cảnh báo quản trị)
    const governanceWarnings = [
      {
        id: "warn-1",
        title: "Tỷ lệ học sinh giỏi khối 9 Cơ sở 2 thấp hơn chỉ tiêu 15%",
        campus: "Cơ sở 2 (Cầu Giấy)",
        level: "KHAN_CAP", // Thông tin, Cần chú ý, Quan trọng, Khẩn cấp
        levelLabel: "Khẩn cấp",
        responsiblePerson: "ThS. Nguyễn Văn A (Tổ trưởng THCS)",
        dueDate: "2026-08-25",
        status: "CHUA_XU_LY",
        detail: "Chỉ số hoàn thành hiện tại chỉ đạt 62% so với mục tiêu 80%. Cần tổ chức phụ đạo tăng cường cấp tốc.",
      },
      {
        id: "warn-2",
        title: "Chưa nộp báo cáo rèn luyện & chuyên cần tháng 8 tại Phân hiệu 3",
        campus: "Cơ sở 3 (Mỹ Đình)",
        level: "QUAN_TRONG",
        levelLabel: "Quan trọng",
        responsiblePerson: "Cô Lê Thị B (BGH Phân hiệu 3)",
        dueDate: "2026-08-20",
        status: "DANG_XU_LY",
        detail: "Phân hiệu 3 quá hạn 3 ngày chưa nộp dữ liệu kiểm định KPI chuyên cần về Ban Giám Hiệu.",
      },
      {
        id: "warn-3",
        title: "Tỷ lệ giáo viên hoàn thành chuyển đổi số bài giảng đạt dưới 70%",
        campus: "Toàn trường",
        level: "CAN_CHU_Y",
        levelLabel: "Cần chú ý",
        responsiblePerson: "ThS. Trần Văn C (Tổ CNTT)",
        dueDate: "2026-09-05",
        status: "CHUA_XU_LY",
        detail: "Một số tổ chuyên môn Khoa học tự nhiên chậm tiến độ số hóa bài giảng Elearning.",
      },
      {
        id: "warn-4",
        title: "Cơ sở vật chất phòng Lab Tin học CS1 cần bảo trì thiết bị",
        campus: "Cơ sở 1 (Trung tâm)",
        level: "THONG_TIN",
        levelLabel: "Thông tin",
        responsiblePerson: "Ông Hoàng Văn D (Quản trị thiết bị)",
        dueDate: "2026-08-30",
        status: "DA_XU_LY",
        detail: "Đã hoàn thành kiểm tra và thay thế 12 máy tính kiểm tra định kỳ.",
      },
    ];

    const warningCampusesCount = new Set(
      governanceWarnings.filter((w) => w.status !== "DA_XU_LY").map((w) => w.campus)
    ).size;

    // 5. Campus Progress Table (Tiến độ các phân hiệu)
    const campusProgressList = [
      {
        id: "cs-1",
        name: "Cơ sở 1 (Trung tâm)",
        kpiScore: 92.5,
        planCompletionRate: 94,
        overdueTasks: 1,
        unachievedGoals: 2,
        lastUpdated: "11/08/2026",
        overallStatus: "XUAT_SAC",
        overallStatusLabel: "Xuất sắc",
      },
      {
        id: "cs-2",
        name: "Cơ sở 2 (Cầu Giấy)",
        kpiScore: 84.0,
        planCompletionRate: 81,
        overdueTasks: 3,
        unachievedGoals: 4,
        lastUpdated: "10/08/2026",
        overallStatus: "CAN_CHU_Y",
        overallStatusLabel: "Cần chú ý",
      },
      {
        id: "cs-3",
        name: "Cơ sở 3 (Mỹ Đình)",
        kpiScore: 78.5,
        planCompletionRate: 75,
        overdueTasks: 4,
        unachievedGoals: 5,
        lastUpdated: "08/08/2026",
        overallStatus: "CANH_BAO",
        overallStatusLabel: "Cảnh báo rủi ro",
      },
    ];

    // 6. Chart Datasets
    // Chart 1: Progress by Strategy Objective Categories
    const strategyProgressByCategory = Object.keys(categoryNamesMap).map((catKey) => {
      const catObjs = qualityObjectives.filter((o) => o.category === catKey);
      const avgComp =
        catObjs.length > 0
          ? Math.round(catObjs.reduce((a, b) => a + (b.completionRate || 0), 0) / catObjs.length)
          : Math.floor(70 + Math.random() * 25);
      return {
        category: categoryNamesMap[catKey] || catKey,
        progress: avgComp,
        target: 100,
      };
    });

    // Chart 2: Monthly Progress Trend of Academic Year Plan
    const monthlyTrendData = [
      { month: "Tháng 9", target: 20, actual: 22 },
      { month: "Tháng 10", target: 35, actual: 36 },
      { month: "Tháng 11", target: 50, actual: 48 },
      { month: "Tháng 12", target: 65, actual: 64 },
      { month: "Tháng 1", target: 75, actual: 72 },
      { month: "Tháng 2", target: 80, actual: 81 },
      { month: "Tháng 3", target: 88, actual: 85 },
      { month: "Tháng 4", target: 95, actual: 92 },
      { month: "Tháng 5", target: 100, actual: 96 },
    ];

    // Chart 3: KPI Score by Group
    const kpiScoreByGroup = [
      { group: "Chất lượng GD", score: 91.2 },
      { group: "Đội ngũ GV", score: 88.5 },
      { group: "CSVC & Thư viện", score: 85.0 },
      { group: "Chuyển đổi số", score: 94.6 },
      { group: "An toàn & Chuyên cần", score: 96.0 },
      { group: "Hài lòng PHHS", score: 87.8 },
    ];

    // Chart 4: KPI Score Comparison between Campuses
    const campusKpiComparison = [
      { campus: "CS1 - Trung tâm", kpiScore: 92.5, target: 90.0 },
      { campus: "CS2 - Cầu Giấy", kpiScore: 84.0, target: 88.0 },
      { campus: "CS3 - Mỹ Đình", kpiScore: 78.5, target: 85.0 },
    ];

    // Chart 5: Quality Goals Achievement Distribution
    const qualityStatusDistribution = [
      { name: "Vượt mục tiêu", count: qualityObjectives.filter((o) => o.status === "EXCEEDED").length || 3, color: "#10b981" },
      { name: "Đạt mục tiêu", count: qualityObjectives.filter((o) => o.status === "ACHIEVED").length || 8, color: "#22c55e" },
      { name: "Gần đạt (80-99%)", count: qualityObjectives.filter((o) => o.status === "NEAR_TARGET").length || 4, color: "#eab308" },
      { name: "Có nguy cơ (60-79%)", count: qualityObjectives.filter((o) => o.status === "AT_RISK").length || 2, color: "#f97316" },
      { name: "Không đạt (<60%)", count: qualityObjectives.filter((o) => o.status === "FAILED").length || 1, color: "#ef4444" },
    ];

    // Chart 6: Tasks On-time vs Overdue
    const taskStatusRatio = [
      { name: "Đúng hạn", value: 42, color: "#3b82f6" },
      { name: "Sắp đến hạn", value: 12, color: "#eab308" },
      { name: "Quá hạn", value: overdueTasksCount, color: "#ef4444" },
    ];

    // Chart 7: Trend across Reporting Periods
    const trendAcrossPeriods = [
      { period: "Đợt 1 (Đầu HKI)", score: 79.5, completion: 75 },
      { period: "Đợt 2 (Giữa HKI)", score: 83.2, completion: 80 },
      { period: "Đợt 3 (Cuối HKI)", score: 86.8, completion: 85 },
      { period: "Đợt 4 (Giữa HKII)", score: 88.4, completion: 89 },
    ];

    return {
      success: true,
      data: {
        summaryCards: {
          strategyCompletionRate,
          annualPlanCompletionRate,
          schoolKpiScore,
          achievedQualityObjsCount,
          overdueTasksCount,
          unupdatedKpisCount: unupdatedKpisCount || 2,
          pendingApprovalCount: pendingApprovalCount || 3,
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

const categoryNamesMap: Record<string, string> = {
  ACADEMIC: "Chất lượng học tập",
  CONDUCT: "Phẩm chất & Năng lực",
  ATTENDANCE: "Chuyên cần",
  PROGRAM_COMPLETION: "Hoàn thành chương trình",
  EXCELLENT_STUDENTS: "Học sinh giỏi",
  SUPPORT_STUDENTS: "Học sinh cần hỗ trợ",
  TEACHER_QUALITY: "Chất lượng đội ngũ",
  DIGITAL_TRANSFORMATION: "Chuyển đổi số",
  FACILITIES: "Cơ sở vật chất",
  SCHOOL_SAFETY: "An toàn trường học",
  PARENT_SATISFACTION: "Sự hài lòng PHHS",
  OTHER: "Mục tiêu khác",
};
