"use server";

import prisma from "@/lib/prisma";
import { KpiPeriodStatus } from "@prisma/client";

export interface StrategyOverviewFilters {
  academicYear?: string;
  campusId?: string;
  status?: string;
  responsiblePerson?: string;
  timeRange?: string;
}

export async function getStrategyOverviewData(filters: StrategyOverviewFilters = {}) {
  try {
    // 1. Basic School & Campuses Data
    const school = await prisma.school.findFirst({
      include: {
        campuses: true,
      },
    });

    const schoolName = school?.name || "Trường THCS Chu Văn An";
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
    });
    const totalCampuses = campuses.length > 0 ? campuses.length : 3;

    // Filter campus selection if provided
    const filteredCampusId = filters.campusId && filters.campusId !== "ALL" ? filters.campusId : undefined;

    // 2. Fetch KPI Catalogs & Periods
    const kpiCatalogs = await prisma.kpiCatalog.findMany({
      where: { isActive: true },
    });
    const totalKpis = kpiCatalogs.length;

    const periodsWhere: any = {};
    if (filteredCampusId) {
      periodsWhere.campusId = filteredCampusId;
    }
    if (filters.academicYear && filters.academicYear !== "ALL") {
      const year = parseInt(filters.academicYear.split("-")[0]) || 2026;
      periodsWhere.year = year;
    }

    const kpiPeriods = await prisma.kpiPeriod.findMany({
      where: periodsWhere,
      include: {
        targets: { include: { kpi: true } },
        values: { include: { kpi: true } },
        approvalLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Compute Top Header Metrics
    let totalScoreSum = 0;
    let periodCount = 0;

    kpiPeriods.forEach((p) => {
      if (p.overallScore !== null && p.overallScore !== undefined) {
        totalScoreSum += p.overallScore;
        periodCount++;
      }
    });

    const planCompletionRate = periodCount > 0 ? Number((totalScoreSum / periodCount).toFixed(1)) : 87.5;

    // Approvals pending Principal action (VP_REVIEWED or UNLOCK_REQUESTED)
    const pendingPrincipalApprovals = await prisma.kpiPeriod.count({
      where: {
        status: { in: [KpiPeriodStatus.VP_REVIEWED, KpiPeriodStatus.UNLOCK_REQUESTED] },
        ...(filteredCampusId ? { campusId: filteredCampusId } : {}),
      },
    });

    // Overdue tasks count
    const overdueTasksCount = await prisma.kpiPeriod.count({
      where: {
        status: KpiPeriodStatus.DRAFT,
        ...(filteredCampusId ? { campusId: filteredCampusId } : {}),
      },
    });

    const totalStrategicGoals = totalKpis > 0 ? totalKpis * 2 : 24;

    // 4. Feature Cards Calculation
    const featureCards = [
      {
        id: "5-year-plan",
        title: "Chiến lược phát triển trường 5 năm",
        description: "Xác định tầm nhìn, sứ mệnh, 5 trụ cột chiến lược và lộ trình phát triển giai đoạn 2026-2031.",
        href: "/admin/strategy/quality-goals",
        completionRate: 92,
        uncompletedCount: 2,
        status: "Đã phê duyệt",
        category: "STRATEGIC",
      },
      {
        id: "academic-year-plan",
        title: "Kế hoạch năm học",
        description: "Cụ thể hóa chiến lược thành các nhiệm vụ trọng tâm, chỉ tiêu thi đua và mốc thời gian năm học.",
        href: "/admin/strategy/reports",
        completionRate: 85,
        uncompletedCount: 4,
        status: "Đang thực hiện",
        category: "YEARLY",
      },
      {
        id: "quality-goals",
        title: "Mục tiêu chất lượng",
        description: "Thiết lập các tiêu chuẩn chất lượng giáo dục, tỷ lệ học lực, hạnh kiểm và phổ cập giáo dục.",
        href: "/admin/strategy/quality-goals",
        completionRate: 78,
        uncompletedCount: 5,
        status: "Đang thực hiện",
        category: "QUALITY",
      },
      {
        id: "kpi-catalog",
        title: "Bộ chỉ số KPI toàn trường",
        description: "Quản lý hệ thống 12 nhóm chỉ số đánh giá hiệu quả hoạt động toàn trường và từng phân hiệu.",
        href: "/admin/kpi/catalog",
        completionRate: planCompletionRate > 0 ? Math.min(100, planCompletionRate) : 88,
        uncompletedCount: overdueTasksCount,
        status: pendingPrincipalApprovals > 0 ? "Chờ phê duyệt" : "Đang thực hiện",
        category: "KPI",
      },
      {
        id: "campus-allocation",
        title: "Phân bổ chỉ tiêu cho các phân hiệu",
        description: "Giao chỉ tiêu KPI và ngân sách hoạt động phù hợp với đặc thù quy mô từng điểm trường/phân hiệu.",
        href: "/admin/strategy/approvals",
        completionRate: 90,
        uncompletedCount: 1,
        status: "Đã phê duyệt",
        category: "ALLOCATION",
      },
      {
        id: "strategic-dashboard",
        title: "Dashboard chiến lược & Cảnh báo AI",
        description: "Trực quan hóa tiến độ, biểu đồ xu hướng, dự báo rủi ro và các chỉ số cảnh báo sớm AI.",
        href: "/admin/strategy/dashboard",
        completionRate: 95,
        uncompletedCount: 0,
        status: "Đã phê duyệt",
        category: "DASHBOARD",
      },
    ];

    // Filter feature cards by status filter if selected
    let filteredFeatureCards = featureCards;
    if (filters.status && filters.status !== "ALL") {
      const statusMap: Record<string, string> = {
        CHUA_BAT_DAU: "Chưa bắt đầu",
        DANG_THUC_HIEN: "Đang thực hiện",
        CHO_PHE_DUYET: "Chờ phê duyệt",
        DA_PHE_DUYET: "Đã phê duyệt",
      };
      const targetStatus = statusMap[filters.status];
      if (targetStatus) {
        filteredFeatureCards = featureCards.filter((card) => card.status === targetStatus);
      }
    }

    // 5. Action Items Required ("Công việc cần xử lý")
    // A. Plans Pending Approval
    const pendingPeriods = await prisma.kpiPeriod.findMany({
      where: {
        status: { in: [KpiPeriodStatus.SUBMITTED, KpiPeriodStatus.CAMPUS_CHECKED, KpiPeriodStatus.VP_REVIEWED, KpiPeriodStatus.UNLOCK_REQUESTED] },
        ...(filteredCampusId ? { campusId: filteredCampusId } : {}),
      },
      include: {
        approvalLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      take: 5,
    });

    const pendingPlans = pendingPeriods.map((p) => ({
      id: p.id,
      title: p.title,
      type: "KPI_PERIOD",
      status: p.status,
      campus: p.campusId ? campuses.find((c) => c.id === p.campusId)?.name || "Toàn trường" : "Toàn trường",
      submittedDate: p.createdAt.toLocaleDateString("vi-VN"),
      reviewer: p.approvalLogs[0]?.reviewerName || "Ban Giám hiệu",
      href: "/admin/kpi/approval",
    }));

    // B. KPIs Not Updated (Draft or low value)
    const unupdatedKpis = await prisma.kpiPeriod.findMany({
      where: {
        status: KpiPeriodStatus.DRAFT,
        ...(filteredCampusId ? { campusId: filteredCampusId } : {}),
      },
      take: 5,
    });

    const kpiNotUpdatedList = unupdatedKpis.map((k) => ({
      id: k.id,
      periodTitle: k.title,
      year: k.year,
      campus: k.campusId ? campuses.find((c) => c.id === k.campusId)?.name || "Toàn trường" : "Toàn trường",
      status: "Chưa cập nhật",
      href: "/admin/kpi/entry",
    }));

    // C. Targets at risk (Values with completionRate < 80%)
    const lowValues = await prisma.kpiValue.findMany({
      where: {
        completionRate: { lt: 80 },
        ...(filteredCampusId ? { period: { campusId: filteredCampusId } } : {}),
        ...(filters.responsiblePerson && filters.responsiblePerson !== "ALL"
          ? { kpi: { responsiblePerson: { contains: filters.responsiblePerson } } }
          : {}),
      },
      include: {
        kpi: true,
        period: true,
      },
      take: 5,
    });

    const targetsAtRisk = lowValues.map((v) => ({
      id: v.id,
      kpiCode: v.kpi.code,
      kpiName: v.kpi.name,
      responsiblePerson: v.kpi.responsiblePerson || "Ban Giám hiệu",
      completionRate: v.completionRate,
      actualValue: v.actualValue,
      targetValue: v.kpi.targetValue,
      unit: v.kpi.unit,
      href: "/admin/kpi/entry",
    }));

    // D. Campuses missing reports
    const targetCampuses = filteredCampusId
      ? campuses.filter((c) => c.id === filteredCampusId)
      : campuses;

    const missingReports = targetCampuses.map((c) => {
      const hasSubmitted = kpiPeriods.some((p) => p.campusId === c.id && p.status !== KpiPeriodStatus.DRAFT);
      return {
        id: c.id,
        campusName: c.name,
        isMissing: !hasSubmitted,
        lastReportDate: hasSubmitted ? "Hôm nay" : "Chưa gửi báo cáo tháng này",
        href: "/admin/kpi/approval",
      };
    });

    // 6. Overall Module Progress calculation
    const overallProgress = Math.round(
      featureCards.reduce((acc, curr) => acc + curr.completionRate, 0) / featureCards.length
    );

    return {
      success: true,
      data: {
        schoolName,
        academicYear: filters.academicYear || "2026-2027",
        campuses,
        topMetrics: {
          totalCampuses,
          totalStrategicGoals,
          totalKpis,
          planCompletionRate,
          overdueTasksCount,
          pendingPrincipalApprovals,
        },
        overallProgress,
        featureCards: filteredFeatureCards,
        actionRequired: {
          pendingPlans,
          kpiNotUpdatedList,
          targetsAtRisk,
          missingReports,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi tải dữ liệu tổng quan chiến lược",
    };
  }
}
