"use server";

import prisma from "@/lib/prisma";
import { KpiCategory, MeasurementDirection, ReportingFrequency, KpiPeriodStatus } from "@prisma/client";

import { calculateKpiScore } from "./utils";

export async function getKpiCatalogs(search?: string, category?: string, isActive?: boolean) {
  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { responsiblePerson: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category && category !== "ALL") {
      where.category = category as KpiCategory;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const catalogs = await prisma.kpiCatalog.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return { success: true, data: catalogs };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể tải danh mục KPI" };
  }
}

export async function createKpiCatalog(data: {
  code: string;
  name: string;
  category: KpiCategory;
  purpose?: string;
  formula?: string;
  unit: string;
  direction: MeasurementDirection;
  dataSource?: string;
  frequency: ReportingFrequency;
  weight: number;
  baselineValue?: number;
  targetValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  responsiblePerson?: string;
  scope?: string;
}) {
  try {
    const existing = await prisma.kpiCatalog.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return { success: false, error: "Mã KPI đã tồn tại trên hệ thống" };
    }

    const catalog = await prisma.kpiCatalog.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        purpose: data.purpose,
        formula: data.formula,
        unit: data.unit || "%",
        direction: data.direction || "HIGHER_BETTER",
        dataSource: data.dataSource,
        frequency: data.frequency || "MONTHLY",
        weight: data.weight || 0,
        baselineValue: data.baselineValue ?? 0,
        targetValue: data.targetValue ?? 100,
        warningThreshold: data.warningThreshold,
        criticalThreshold: data.criticalThreshold,
        responsiblePerson: data.responsiblePerson,
        scope: data.scope || "ALL",
      },
    });

    
    return { success: true, data: catalog };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo chỉ số KPI" };
  }
}

export async function updateKpiCatalog(
  id: string,
  data: Partial<{
    name: string;
    category: KpiCategory;
    purpose?: string;
    formula?: string;
    unit: string;
    direction: MeasurementDirection;
    dataSource?: string;
    frequency: ReportingFrequency;
    weight: number;
    baselineValue?: number;
    targetValue?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    responsiblePerson?: string;
    scope?: string;
    isActive: boolean;
  }>
) {
  try {
    const catalog = await prisma.kpiCatalog.update({
      where: { id },
      data,
    });

    
    return { success: true, data: catalog };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật KPI" };
  }
}

export async function duplicateKpiCatalog(id: string) {
  try {
    const original = await prisma.kpiCatalog.findUnique({ where: { id } });
    if (!original) return { success: false, error: "Không tìm thấy KPI gốc" };

    const newCode = `${original.code}_COPY_${Date.now().toString().slice(-4)}`;
    const duplicate = await prisma.kpiCatalog.create({
      data: {
        code: newCode,
        name: `${original.name} (Bản sao)`,
        category: original.category,
        purpose: original.purpose,
        formula: original.formula,
        unit: original.unit,
        direction: original.direction,
        dataSource: original.dataSource,
        frequency: original.frequency,
        weight: original.weight,
        baselineValue: original.baselineValue,
        targetValue: original.targetValue,
        warningThreshold: original.warningThreshold,
        criticalThreshold: original.criticalThreshold,
        responsiblePerson: original.responsiblePerson,
        scope: original.scope,
        isActive: true,
      },
    });

    
    return { success: true, data: duplicate };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi sao chép KPI" };
  }
}

export async function toggleKpiStatus(id: string) {
  try {
    const item = await prisma.kpiCatalog.findUnique({ where: { id } });
    if (!item) return { success: false, error: "Không tìm thấy KPI" };

    const updated = await prisma.kpiCatalog.update({
      where: { id },
      data: { isActive: !item.isActive },
    });

    
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi đổi trạng thái KPI" };
  }
}

// Seed initial default catalog with 12 categories
export async function seedDefaultKpiCatalog() {
  try {
    const count = await prisma.kpiCatalog.count();
    if (count > 0) return { success: true, message: "Danh mục KPI đã có dữ liệu." };

    const defaultKpis = [
      {
        code: "KPI-STR-01",
        name: "Tỷ lệ thực hiện kế hoạch chiến lược năm",
        category: KpiCategory.STRATEGIC,
        purpose: "Đánh giá mức độ hoàn thành nhiệm vụ trọng tâm chiến lược nhà trường",
        formula: "(Số nhiệm vụ hoàn thành / Tổng số nhiệm vụ giao) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Ban Giám hiệu",
        frequency: ReportingFrequency.SEMESTER,
        weight: 10,
        baselineValue: 80,
        targetValue: 95,
        responsiblePerson: "Hiệu trưởng",
        scope: "ALL",
      },
      {
        code: "KPI-EDU-01",
        name: "Tỷ lệ học sinh đạt học lực Giỏi/Tốt",
        category: KpiCategory.EDUCATIONAL_QUALITY,
        purpose: "Nâng cao chất lượng học tập toàn trường",
        formula: "(Số HS Giỏi / Tổng số HS toàn trường) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Sổ điểm điện tử",
        frequency: ReportingFrequency.SEMESTER,
        weight: 15,
        baselineValue: 35,
        targetValue: 45,
        responsiblePerson: "Phó Hiệu trưởng Chuyên môn",
        scope: "ALL",
      },
      {
        code: "KPI-PRO-01",
        name: "Tỷ lệ tiết dạy đạt chuẩn ứng dụng CNTT",
        category: KpiCategory.PROFESSIONAL,
        purpose: "Thúc đẩy đổi mới phương pháp giảng dạy",
        formula: "(Số tiết ứng dụng CNTT / Tổng số tiết dự giờ) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Tổ chuyên môn",
        frequency: ReportingFrequency.MONTHLY,
        weight: 10,
        baselineValue: 70,
        targetValue: 90,
        responsiblePerson: "Tổ trưởng Chuyên môn",
        scope: "ALL",
      },
      {
        code: "KPI-STA-01",
        name: "Tỷ lệ giáo viên tham gia bồi dưỡng thường xuyên",
        category: KpiCategory.STAFF_PERSONNEL,
        purpose: "Nâng cao trình độ đội ngũ nhà giáo",
        formula: "(Số GV hoàn thành bồi dưỡng / Tổng GV) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Bộ phận Nhân sự",
        frequency: ReportingFrequency.QUARTERLY,
        weight: 8,
        baselineValue: 85,
        targetValue: 100,
        responsiblePerson: "Phó Hiệu trưởng Nhân sự",
        scope: "ALL",
      },
      {
        code: "KPI-STU-01",
        name: "Tỷ lệ học sinh vi phạm nội quy",
        category: KpiCategory.STUDENT,
        purpose: "Duy trì kỷ nếp và đạo đức học sinh",
        formula: "(Số vụ vi phạm kỷ luật / Tổng số HS) * 100",
        unit: "%",
        direction: MeasurementDirection.LOWER_BETTER,
        dataSource: "Tổng phụ trách / Giám thị",
        frequency: ReportingFrequency.MONTHLY,
        weight: 8,
        baselineValue: 3,
        targetValue: 1,
        warningThreshold: 2,
        criticalThreshold: 5,
        responsiblePerson: "Tổng phụ trách Đội",
        scope: "ALL",
      },
      {
        code: "KPI-DIG-01",
        name: "Mức độ hoàn thiện cơ sở dữ liệu ngành & Sổ sách điện tử",
        category: KpiCategory.DIGITAL_TRANSFORMATION,
        purpose: "Đảm bảo 100% học bạ, giáo án, sổ điểm số hóa đúng hạn",
        formula: "(Số hồ sơ số hóa / Tổng hồ sơ) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Tổ CNTT",
        frequency: ReportingFrequency.MONTHLY,
        weight: 8,
        baselineValue: 80,
        targetValue: 100,
        responsiblePerson: "Cán bộ CNTT",
        scope: "ALL",
      },
      {
        code: "KPI-FIN-01",
        name: "Tỷ lệ giải ngân ngân sách giáo dục",
        category: KpiCategory.FINANCIAL,
        purpose: "Sử dụng hiệu quả nguồn vốn được giao",
        formula: "(Kinh phí giải ngân / Kinh phí dự toán) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Bộ phận Kế toán",
        frequency: ReportingFrequency.QUARTERLY,
        weight: 8,
        baselineValue: 85,
        targetValue: 98,
        responsiblePerson: "Kế toán trưởng",
        scope: "ALL",
      },
      {
        code: "KPI-AST-01",
        name: "Tỷ lệ thiết bị dạy học được bảo dưỡng & sử dụng tốt",
        category: KpiCategory.ASSETS,
        purpose: "Quản lý và khai thác hiệu quả tài sản phòng học",
        formula: "(Số thiết bị hoạt động tốt / Tổng thiết bị) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Bộ phận Thiết bị",
        frequency: ReportingFrequency.MONTHLY,
        weight: 6,
        baselineValue: 88,
        targetValue: 98,
        responsiblePerson: "Cán bộ Thiết bị",
        scope: "ALL",
      },
      {
        code: "KPI-FAC-01",
        name: "Đạt tiêu chuẩn phòng học xanh - sạch - đẹp",
        category: KpiCategory.FACILITIES,
        purpose: "Đảm bảo cảnh quan và môi trường học tập tốt nhất",
        formula: "Đánh giá đạt / không đạt (1 = Đạt, 0 = Không)",
        unit: "Điểm",
        direction: MeasurementDirection.PASS_FAIL,
        dataSource: "Ban Kiểm tra",
        frequency: ReportingFrequency.MONTHLY,
        weight: 5,
        baselineValue: 1,
        targetValue: 1,
        responsiblePerson: "Trưởng ban Cơ sở vật chất",
        scope: "ALL",
      },
      {
        code: "KPI-SAF-01",
        name: "Số sự cố an toàn trường học & PCCC",
        category: KpiCategory.SCHOOL_SAFETY,
        purpose: "Đảm bảo tuyệt đối an toàn cho GV & Học sinh",
        formula: "Tổng số vụ việc mất an toàn xảy ra",
        unit: "vụ",
        direction: MeasurementDirection.LOWER_BETTER,
        dataSource: "Bộ phận Bảo vệ / An ninh",
        frequency: ReportingFrequency.MONTHLY,
        weight: 7,
        baselineValue: 1,
        targetValue: 0,
        warningThreshold: 1,
        criticalThreshold: 2,
        responsiblePerson: "Trưởng ban An ninh",
        scope: "ALL",
      },
      {
        code: "KPI-REL-01",
        name: "Tỷ lệ phụ huynh tham gia họp & tương tác qua hệ thống",
        category: KpiCategory.SCHOOL_RELATIONS,
        purpose: "Tăng cường liên lạc giữa Nhà trường và Gia đình",
        formula: "(Số PH tương tác / Tổng số PH) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Cổng thông tin phụ huynh",
        frequency: ReportingFrequency.MONTHLY,
        weight: 4,
        baselineValue: 75,
        targetValue: 92,
        responsiblePerson: "Trưởng ban Truyền thông",
        scope: "ALL",
      },
      {
        code: "KPI-INN-01",
        name: "Số đề tài sáng kiến kinh nghiệm được cấp trên công nhận",
        category: KpiCategory.INNOVATION,
        purpose: "Thúc đẩy phong trào thi đua và đổi mới sáng tạo",
        formula: "Tổng số đề tài SKKN đạt giải",
        unit: "đề tài",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Hội đồng Thi đua",
        frequency: ReportingFrequency.YEARLY,
        weight: 4,
        baselineValue: 3,
        targetValue: 8,
        responsiblePerson: "Chủ tịch Hội đồng Thi đua",
        scope: "ALL",
      },
    ];

    await prisma.kpiCatalog.createMany({
      data: defaultKpis,
      skipDuplicates: true,
    });

    
    return { success: true, message: "Đã khởi tạo 12 chỉ số KPI mẫu thành công." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khởi tạo KPI mẫu" };
  }
}

// ==================== KPI PERIODS & ENTRY ====================

export async function getKpiPeriods(year?: number) {
  try {
    const periods = await prisma.kpiPeriod.findMany({
      where: year ? { year } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        approvalLogs: { orderBy: { createdAt: "desc" }, take: 5 },
        unlockLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    return { success: true, data: periods };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy danh sách kỳ đánh giá KPI" };
  }
}

export async function createKpiPeriod(title: string, year: number, periodType: ReportingFrequency, campusId?: string) {
  try {
    const existing = await prisma.kpiPeriod.findFirst({
      where: { title, year, campusId: campusId || null },
    });

    if (existing) {
      return { success: false, error: "Kỳ đánh giá KPI này đã tồn tại!" };
    }

    const period = await prisma.kpiPeriod.create({
      data: {
        title,
        year,
        periodType,
        campusId: campusId || null,
        status: KpiPeriodStatus.DRAFT,
      },
    });

    // Automatically clone active KPI catalog targets into this period
    const activeCatalogs = await prisma.kpiCatalog.findMany({
      where: { isActive: true },
    });

    if (activeCatalogs.length > 0) {
      await prisma.kpiTarget.createMany({
        data: activeCatalogs.map((kpi) => ({
          periodId: period.id,
          kpiId: kpi.id,
          targetValue: kpi.targetValue ?? 100,
          weight: kpi.weight ?? 0,
        })),
      });

      await prisma.kpiValue.createMany({
        data: activeCatalogs.map((kpi) => ({
          periodId: period.id,
          kpiId: kpi.id,
          actualValue: kpi.baselineValue ?? 0,
          completionRate: 0,
          weightedScore: 0,
        })),
      });
    }

    
    
    return { success: true, data: period };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo kỳ đánh giá KPI" };
  }
}

export async function getKpiPeriodDetails(periodId: string) {
  try {
    const period = await prisma.kpiPeriod.findUnique({
      where: { id: periodId },
      include: {
        targets: { include: { kpi: true } },
        values: { include: { kpi: true, evidence: true } },
        approvalLogs: { orderBy: { createdAt: "desc" } },
        unlockLogs: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!period) return { success: false, error: "Không tìm thấy kỳ KPI" };

    return { success: true, data: period };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi chi tiết kỳ KPI" };
  }
}

export { calculateKpiScore };

export async function saveKpiValues(
  periodId: string,
  entryValues: { kpiId: string; actualValue: number; notes?: string }[]
) {
  try {
    const period = await prisma.kpiPeriod.findUnique({
      where: { id: periodId },
      include: { targets: { include: { kpi: true } } },
    });

    if (!period) return { success: false, error: "Kỳ KPI không tồn tại" };
    if (period.status === KpiPeriodStatus.APPROVED) {
      return { success: false, error: "Kỳ KPI đã được Hiệu trưởng phê duyệt và bị khóa. Hãy gửi yêu cầu mở khóa nếu cần sửa." };
    }

    let overallScoreSum = 0;

    for (const item of entryValues) {
      const targetObj = period.targets.find((t) => t.kpiId === item.kpiId);
      const kpi = targetObj?.kpi;
      if (!kpi) continue;

      const targetVal = targetObj?.targetValue ?? kpi.targetValue ?? 100;
      const weightVal = targetObj?.weight ?? kpi.weight ?? 0;
      const { completionRate, weightedScore } = calculateKpiScore(
        item.actualValue,
        targetVal,
        weightVal,
        kpi.direction
      );

      overallScoreSum += weightedScore;

      await prisma.kpiValue.upsert({
        where: {
          periodId_kpiId: {
            periodId,
            kpiId: item.kpiId,
          },
        },
        update: {
          actualValue: item.actualValue,
          completionRate,
          weightedScore,
          notes: item.notes || null,
        },
        create: {
          periodId,
          kpiId: item.kpiId,
          actualValue: item.actualValue,
          completionRate,
          weightedScore,
          notes: item.notes || null,
        },
      });
    }

    // Update overall period score
    await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { overallScore: Number(overallScoreSum.toFixed(2)) },
    });

    
    
    return { success: true, message: "Đã lưu kết quả KPI thành công!" };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lưu dữ liệu KPI" };
  }
}

export async function addKpiEvidence(kpiValueId: string, title: string, fileUrl?: string, description?: string) {
  try {
    const evidence = await prisma.kpiEvidence.create({
      data: {
        kpiValueId,
        title,
        fileUrl,
        description,
      },
    });

    
    return { success: true, data: evidence };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi đính kèm minh chứng" };
  }
}

// Weight validation rule: sum of KPI weights must equal 100%
export async function validateKpiPeriodWeights(periodId: string) {
  try {
    const period = await prisma.kpiPeriod.findUnique({
      where: { id: periodId },
      include: { targets: { include: { kpi: true } } },
    });

    if (!period) return { success: false, error: "Không tìm thấy kỳ KPI" };

    let totalWeight = 0;
    const categoryWeights: Record<string, number> = {};

    period.targets.forEach((t) => {
      totalWeight += t.weight;
      const cat = t.kpi.category;
      categoryWeights[cat] = (categoryWeights[cat] || 0) + t.weight;
    });

    const is100Percent = Math.abs(totalWeight - 100) < 0.01;

    return {
      success: true,
      isValid: is100Percent,
      totalWeight: Number(totalWeight.toFixed(2)),
      categoryWeights,
      message: is100Percent
        ? "Tổng trọng số KPI đã đạt chuẩn 100%."
        : `Tổng trọng số KPI hiện là ${totalWeight.toFixed(2)}%. Cần điều chỉnh đúng 100% trước khi duyệt.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi kiểm tra trọng số" };
  }
}

// ==================== 4-TIER APPROVAL WORKFLOW ====================

export async function submitKpiPeriod(periodId: string, reviewerName?: string, comments?: string) {
  try {
    const weightCheck = await validateKpiPeriodWeights(periodId);
    if (!weightCheck.isValid) {
      return {
        success: false,
        error: `Không thể gửi duyệt: Tổng trọng số các KPI phải bằng 100% (Hiện tại: ${weightCheck.totalWeight}%).`,
      };
    }

    const updated = await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { status: KpiPeriodStatus.SUBMITTED },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId,
        action: "SUBMIT",
        fromStatus: KpiPeriodStatus.DRAFT,
        toStatus: KpiPeriodStatus.SUBMITTED,
        reviewerName: reviewerName || "Cán bộ nhập liệu",
        comments: comments || "Đã hoàn thành nhập liệu KPI và gửi duyệt.",
      },
    });

    
    
    return { success: true, data: updated, message: "Đã gửi dữ liệu KPI lên Phân hiệu/Quản lý kiểm tra." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi gửi duyệt KPI" };
  }
}

export async function checkCampusKpiPeriod(periodId: string, reviewerName?: string, comments?: string) {
  try {
    const updated = await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { status: KpiPeriodStatus.CAMPUS_CHECKED },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId,
        action: "CAMPUS_CHECK",
        fromStatus: KpiPeriodStatus.SUBMITTED,
        toStatus: KpiPeriodStatus.CAMPUS_CHECKED,
        reviewerName: reviewerName || "Quản lý Phân hiệu",
        comments: comments || "Đã rà soát dữ liệu KPI Phân hiệu chuẩn xác.",
      },
    });

    
    return { success: true, data: updated, message: "Phân hiệu đã thẩm định dữ liệu thành công." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi thẩm định Phân hiệu" };
  }
}

export async function reviewVpKpiPeriod(periodId: string, reviewerName?: string, comments?: string) {
  try {
    const updated = await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { status: KpiPeriodStatus.VP_REVIEWED },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId,
        action: "VP_REVIEW",
        fromStatus: KpiPeriodStatus.CAMPUS_CHECKED,
        toStatus: KpiPeriodStatus.VP_REVIEWED,
        reviewerName: reviewerName || "Phó Hiệu trưởng",
        comments: comments || "Đã thông qua thẩm định cấp Phó Hiệu trưởng.",
      },
    });

    
    return { success: true, data: updated, message: "Phó Hiệu trưởng đã thẩm định thành công." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi thẩm định Phó Hiệu trưởng" };
  }
}

export async function approvePrincipalKpiPeriod(periodId: string, reviewerName?: string, comments?: string) {
  try {
    const updated = await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { status: KpiPeriodStatus.APPROVED },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId,
        action: "APPROVE",
        fromStatus: KpiPeriodStatus.VP_REVIEWED,
        toStatus: KpiPeriodStatus.APPROVED,
        reviewerName: reviewerName || "Hiệu trưởng",
        comments: comments || "Hiệu trưởng đã chính thức phê duyệt kỳ KPI. Dữ liệu đã được khóa an toàn.",
      },
    });

    
    
    return { success: true, data: updated, message: "Hiệu trưởng đã phê duyệt kỳ KPI. Dữ liệu đã khóa." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi Hiệu trưởng phê duyệt KPI" };
  }
}

export async function requestUnlockKpiPeriod(periodId: string, requestedByName: string, reason: string) {
  try {
    const period = await prisma.kpiPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { success: false, error: "Kỳ KPI không tồn tại" };

    const unlockLog = await prisma.kpiUnlockLog.create({
      data: {
        periodId,
        requestedByName,
        reason,
        status: "PENDING",
      },
    });

    await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { status: KpiPeriodStatus.UNLOCK_REQUESTED },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId,
        action: "REQUEST_UNLOCK",
        fromStatus: period.status,
        toStatus: KpiPeriodStatus.UNLOCK_REQUESTED,
        reviewerName: requestedByName,
        comments: `Yêu cầu mở khóa: ${reason}`,
      },
    });

    
    return { success: true, data: unlockLog, message: "Đã gửi yêu cầu mở khóa kỳ KPI lên Hiệu trưởng." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi yêu cầu mở khóa" };
  }
}

export async function approveUnlockKpiPeriod(unlockLogId: string, approvedByName: string) {
  try {
    const unlockLog = await prisma.kpiUnlockLog.findUnique({
      where: { id: unlockLogId },
    });

    if (!unlockLog) return { success: false, error: "Yêu cầu mở khóa không tồn tại" };

    await prisma.kpiUnlockLog.update({
      where: { id: unlockLogId },
      data: {
        status: "APPROVED",
        approvedByName,
      },
    });

    // Unlock period back to DRAFT for edits
    await prisma.kpiPeriod.update({
      where: { id: unlockLog.periodId },
      data: { status: KpiPeriodStatus.DRAFT },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId: unlockLog.periodId,
        action: "UNLOCK_APPROVED",
        fromStatus: KpiPeriodStatus.UNLOCK_REQUESTED,
        toStatus: KpiPeriodStatus.DRAFT,
        reviewerName: approvedByName,
        comments: "Đã chấp thuận mở khóa kỳ KPI để điều chỉnh dữ liệu.",
      },
    });

    
    
    return { success: true, message: "Đã phê duyệt mở khóa kỳ KPI. Hiện tại có thể chỉnh sửa lại dữ liệu." };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi chấp thuận mở khóa" };
  }
}
