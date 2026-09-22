"use server";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/kpi/catalog/page.tsx, src/app/admin/kpi/entry/page.tsx, src/app/admin/kpi/approval/page.tsx, src/app/admin/kpi/page.tsx.
 * 2. Public functions affected: getCampuses, getKpiPeriods, createKpiPeriod, autoCalculateActualKpiValues, saveKpiValues, getKpiPeriodDetails.
 * 3. Data structures: KpiPeriod, KpiCatalog, KpiTarget, KpiValue, Attendance, Incident, LessonPlan, Grade, Equipment, ParentFeedback.
 * 4. Verbatim User Instruction: "không thay đổi gì cả ?? bạn đang làm gì vậy bạn không làm gì cả ?? tôi cần bạn làm thật kỹ" - "theo khuyến nghị".
 */

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
        purpose: "Đánh giá mức độ hoàn thành các mục tiêu chiến lược nhà trường giao cho phân hiệu",
        formula: "(Số mục tiêu đạt chuẩn / Tổng số mục tiêu giao) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Mục tiêu chiến lược (QualityObjective)",
        frequency: ReportingFrequency.SEMESTER,
        weight: 10,
        baselineValue: 80,
        targetValue: 95,
        responsiblePerson: "Hiệu trưởng / Ban Giám hiệu",
        scope: "ALL",
      },
      {
        code: "KPI-EDU-01",
        name: "Tỷ lệ học sinh đạt chuẩn học tập theo Thông tư 27 (Điểm số ≥ 5.0)",
        category: KpiCategory.EDUCATIONAL_QUALITY,
        purpose: "Nâng cao chất lượng học tập toàn trường theo quy chế đánh giá học sinh tiểu học (TT 27/2020/TT-BGDĐT)",
        formula: "(Số bài kiểm tra định kỳ có điểm ≥ 5.0 / Tổng số bài kiểm tra) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Điểm số & Học bạ điện tử (Grade)",
        frequency: ReportingFrequency.SEMESTER,
        weight: 15,
        baselineValue: 35,
        targetValue: 95,
        responsiblePerson: "Phó Hiệu trưởng Chuyên môn",
        scope: "ALL",
      },
      {
        code: "KPI-PRO-01",
        name: "Tỷ lệ giáo án điện tử được phê duyệt đúng hạn",
        category: KpiCategory.PROFESSIONAL,
        purpose: "Thúc đẩy đổi mới phương pháp giảng dạy và đảm bảo kỷ cương soạn giảng",
        formula: "(Số giáo án được Tổ trưởng/BGH phê duyệt đúng hạn / Tổng số giáo án đã nộp) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Giáo án điện tử (LessonPlan)",
        frequency: ReportingFrequency.MONTHLY,
        weight: 10,
        baselineValue: 70,
        targetValue: 95,
        responsiblePerson: "Tổ trưởng Chuyên môn",
        scope: "ALL",
      },
      {
        code: "KPI-STA-01",
        name: "Tỷ lệ giáo viên tham gia bồi dưỡng chuyên môn thường xuyên",
        category: KpiCategory.STAFF_PERSONNEL,
        purpose: "Nâng cao trình độ đội ngũ nhà giáo và năng lực sư phạm",
        formula: "(Số giáo viên hoàn thành bồi dưỡng / Tổng số giáo viên) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Hồ sơ giáo viên & Nhân sự (Teacher)",
        frequency: ReportingFrequency.QUARTERLY,
        weight: 8,
        baselineValue: 85,
        targetValue: 100,
        responsiblePerson: "Phó Hiệu trưởng Phụ trách",
        scope: "ALL",
      },
      {
        code: "KPI-STU-01",
        name: "Tỷ lệ chuyên cần của học sinh",
        category: KpiCategory.STUDENT,
        purpose: "Đảm bảo duy trì sĩ số và chuyên cần đến lớp hàng ngày của học sinh",
        formula: "(Số lượt học sinh có mặt / Tổng số lượt điểm danh) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Điểm danh điện tử (Attendance)",
        frequency: ReportingFrequency.MONTHLY,
        weight: 8,
        baselineValue: 90,
        targetValue: 98,
        responsiblePerson: "Giáo viên Chủ nhiệm & Tổng phụ trách",
        scope: "ALL",
      },
      {
        code: "KPI-DIG-01",
        name: "Mức độ hoàn thiện cơ sở dữ liệu ngành & Sổ sách điện tử",
        category: KpiCategory.DIGITAL_TRANSFORMATION,
        purpose: "Đảm bảo 100% học bạ, giáo án, sổ điểm số hóa đúng hạn",
        formula: "(Số hồ sơ số hóa được duyệt / Tổng hồ sơ) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Hồ sơ số hóa (LessonPlan & Digital Records)",
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
        purpose: "Sử dụng hiệu quả nguồn vốn được giao theo đúng quy định tài chính",
        formula: "(Kinh phí giải ngân thực tế / Kinh phí dự toán được giao) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "Sổ sách Dự toán & Giải ngân tài chính (Budget/Accounting)",
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
        purpose: "Quản lý và khai thác hiệu quả tài sản phòng học và trang thiết bị",
        formula: "(Số thiết bị hoạt động Tốt/Khá / Tổng số thiết bị kiểm kê) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Kiểm kê thiết bị dạy học (Equipment)",
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
        dataSource: "CSDL Cơ sở vật chất & Phòng học (Equipment/Facilities)",
        frequency: ReportingFrequency.MONTHLY,
        weight: 5,
        baselineValue: 1,
        targetValue: 1,
        responsiblePerson: "Trưởng ban Cơ sở vật chất",
        scope: "ALL",
      },
      {
        code: "KPI-SAF-01",
        name: "Số sự cố an toàn trường học, PCCC & Vi phạm kỷ luật",
        category: KpiCategory.SCHOOL_SAFETY,
        purpose: "Đảm bảo tuyệt đối an toàn cho GV & Học sinh (Chỉ tiêu không xảy ra sự cố)",
        formula: "Tổng số vụ việc mất an toàn hoặc vi phạm kỷ luật xảy ra (0 vụ = 100%)",
        unit: "vụ",
        direction: MeasurementDirection.LOWER_BETTER,
        dataSource: "CSDL Nhật ký Kỷ luật & Sự cố an toàn (Incident)",
        frequency: ReportingFrequency.MONTHLY,
        weight: 7,
        baselineValue: 0,
        targetValue: 0,
        warningThreshold: 1,
        criticalThreshold: 2,
        responsiblePerson: "Trưởng ban An ninh & Giám thị",
        scope: "ALL",
      },
      {
        code: "KPI-REL-01",
        name: "Tỷ lệ giải quyết ý kiến & phản hồi của phụ huynh",
        category: KpiCategory.SCHOOL_RELATIONS,
        purpose: "Tăng cường gắn kết giữa gia đình và nhà trường, giải quyết kịp thời kiến nghị",
        formula: "(Số ý kiến phụ huynh đã được phản hồi / Tổng số ý kiến tiếp nhận) * 100",
        unit: "%",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Ý kiến & Phản hồi phụ huynh (ParentFeedback)",
        frequency: ReportingFrequency.MONTHLY,
        weight: 8,
        baselineValue: 80,
        targetValue: 95,
        responsiblePerson: "Ban Giám hiệu & GVCN",
        scope: "ALL",
      },
      {
        code: "KPI-INN-01",
        name: "Số lượng sáng kiến kinh nghiệm & Khen thưởng thi đua",
        category: KpiCategory.INNOVATION,
        purpose: "Khuyến khích nghiên cứu khoa học sư phạm ứng dụng và thi đua dạy tốt",
        formula: "Tổng số đề tài SKKN và quyết định khen thưởng được công nhận",
        unit: "đề tài",
        direction: MeasurementDirection.HIGHER_BETTER,
        dataSource: "CSDL Khen thưởng & SKKN (Commendation)",
        frequency: ReportingFrequency.YEARLY,
        weight: 5,
        baselineValue: 2,
        targetValue: 5,
        responsiblePerson: "Hội đồng Thi đua Khen thưởng",
        scope: "ALL",
      },
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

export async function getCampuses() {
  try {
    const campuses = await prisma.campus.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });
    return { success: true, data: campuses };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lấy danh sách phân hiệu" };
  }
}

export async function getKpiPeriods(yearOrCampusId?: number | string, campusIdParam?: string) {
  try {
    const where: any = {};
    let year: number | undefined;
    let campusId: string | undefined;

    if (typeof yearOrCampusId === "number") {
      year = yearOrCampusId;
      campusId = campusIdParam;
    } else if (typeof yearOrCampusId === "string") {
      campusId = yearOrCampusId;
    }

    if (year) where.year = year;
    if (campusId && campusId !== "ALL") {
      where.campusId = campusId;
    }

    const [periods, campuses] = await Promise.all([
      prisma.kpiPeriod.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          approvalLogs: { orderBy: { createdAt: "desc" }, take: 5 },
          unlockLogs: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      }),
      prisma.campus.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const campusMap = new Map(campuses.map((c) => [c.id, c]));

    const enrichedPeriods = periods.map((p) => ({
      ...p,
      campus: p.campusId ? campusMap.get(p.campusId) || null : null,
    }));

    return { success: true, data: enrichedPeriods };
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

    let campus = null;
    if (period.campusId) {
      campus = await prisma.campus.findUnique({
        where: { id: period.campusId },
        select: { id: true, name: true },
      });
    }

    return { success: true, data: { ...period, campus } };
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

/**
 * Tự động tính toán giá trị thực tế các chỉ số KPI từ dữ liệu gốc trong CSDL của Phân hiệu
 */
export async function autoCalculateActualKpiValues(periodId: string) {
  try {
    const period = await prisma.kpiPeriod.findUnique({
      where: { id: periodId },
      include: {
        targets: { include: { kpi: true } },
      },
    });

    if (!period) return { success: false, error: "Kỳ KPI không tồn tại" };
    if (period.status === KpiPeriodStatus.APPROVED) {
      return { success: false, error: "Kỳ KPI đã được duyệt và khóa dữ liệu." };
    }

    const campusId = period.campusId;

    // Lấy danh sách lớp học thuộc phân hiệu này (hoặc toàn trường nếu không có phân hiệu)
    const classRooms = await prisma.classRoom.findMany({
      where: campusId ? { campusId } : undefined,
      select: { id: true },
    });
    const classIds = classRooms.map((c) => c.id);

    // 1. Tỷ lệ chuyên cần học sinh
    const totalAttendance = await prisma.attendance.count({
      where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
    });
    const presentAttendance = await prisma.attendance.count({
      where: {
        ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
        status: "PRESENT",
      },
    });
    const attendanceRate = totalAttendance > 0 ? Number(((presentAttendance / totalAttendance) * 100).toFixed(1)) : 0.0;

    // 2. Tỷ lệ học sinh vi phạm kỷ luật / sự cố an toàn
    const totalStudents = await prisma.student.count({
      where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
    });
    const incidentCount = await prisma.incident.count({
      where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
    });
    const violationRate = totalStudents > 0 ? Number(((incidentCount / totalStudents) * 100).toFixed(2)) : 0.0;

    // 3. Tỷ lệ giáo án điện tử được phê duyệt đúng hạn (Chuyên môn)
    const totalLessonPlans = await prisma.lessonPlan.count({
      where: classIds.length > 0 ? { classId: { in: classIds } } : undefined,
    });
    const approvedLessonPlans = await prisma.lessonPlan.count({
      where: {
        ...(classIds.length > 0 ? { classId: { in: classIds } } : {}),
        status: { in: ["APPROVED", "VP_APPROVED", "HEAD_APPROVED"] },
      },
    });
    const lessonPlanRate = totalLessonPlans > 0 ? Number(((approvedLessonPlans / totalLessonPlans) * 100).toFixed(1)) : 0.0;

    // 4. Chất lượng học tập / Điểm số theo chuẩn Thông tư 27 (Tỷ lệ Đạt yêu cầu >= 5.0)
    const totalGrades = await prisma.grade.count({
      where: classIds.length > 0 ? { student: { classId: { in: classIds } } } : undefined,
    });
    const passedGrades = await prisma.grade.count({
      where: {
        ...(classIds.length > 0 ? { student: { classId: { in: classIds } } } : {}),
        score: { gte: 5.0 },
      },
    });
    const goodGrades = await prisma.grade.count({
      where: {
        ...(classIds.length > 0 ? { student: { classId: { in: classIds } } } : {}),
        score: { gte: 8.0 },
      },
    });
    const academicRate = totalGrades > 0 ? Number(((passedGrades / totalGrades) * 100).toFixed(1)) : 0.0;

    // 5. Thiết bị & Cơ sở vật chất phòng học
    const totalEquip = await prisma.equipment.count({
      where: campusId ? { campusId } : undefined,
    });
    const availEquip = await prisma.equipment.count({
      where: {
        ...(campusId ? { campusId } : {}),
        condition: { in: ["EXCELLENT", "GOOD", "FAIR"] },
      },
    });
    const equipmentRate = totalEquip > 0 ? Number(((availEquip / totalEquip) * 100).toFixed(1)) : 0.0;

    // 6. Tương tác phụ huynh
    const totalFeedbacks = await prisma.parentFeedback.count({
      where: classIds.length > 0 ? { student: { classId: { in: classIds } } } : undefined,
    });
    const respondedFeedbacks = await prisma.parentFeedback.count({
      where: {
        ...(classIds.length > 0 ? { student: { classId: { in: classIds } } } : {}),
        response: { not: null },
      },
    });
    const parentRate = totalFeedbacks > 0 ? Number(((respondedFeedbacks / totalFeedbacks) * 100).toFixed(1)) : 0.0;

    // 7. Mục tiêu chiến lược hoàn thành
    const qualityObjs = await prisma.qualityObjective.findMany({
      where: campusId ? { OR: [{ campusScope: campusId }, { campusScope: "ALL" }] } : undefined,
    });
    const achievedObjs = qualityObjs.filter((o) => o.status === "ACHIEVED" || o.status === "EXCEEDED").length;
    const strategicRate = qualityObjs.length > 0 ? Number(((achievedObjs / qualityObjs.length) * 100).toFixed(1)) : 0.0;

    // 8. Đổi mới sáng tạo & Khen thưởng
    const commendationsCount = await prisma.commendation.count({
      where: classIds.length > 0 ? { student: { classId: { in: classIds } } } : undefined,
    });

    let overallScoreSum = 0;
    let updatedCount = 0;

    for (const target of period.targets) {
      const kpi = target.kpi;
      let calculatedVal = 0;
      let calculationNote = "";

      // Map according to KPI Code or Category with 100% truthful data
      if (kpi.code === "KPI-STR-01" || kpi.category === KpiCategory.STRATEGIC) {
        calculatedVal = strategicRate;
        calculationNote = qualityObjs.length > 0
          ? `Mục tiêu chiến lược hoàn thành: ${achievedObjs}/${qualityObjs.length} mục tiêu`
          : "[Chưa có dữ liệu gốc] Chưa gán mục tiêu chiến lược cho phân hiệu";
      } else if (kpi.code === "KPI-EDU-01" || kpi.category === KpiCategory.EDUCATIONAL_QUALITY) {
        calculatedVal = academicRate;
        calculationNote = totalGrades > 0
          ? `Chất lượng GD (TT27): Đạt yêu cầu (>=5.0) ${passedGrades}/${totalGrades} điểm (${academicRate}%), Khá/Giỏi: ${goodGrades}/${totalGrades}`
          : "[Chưa có dữ liệu gốc] Chưa có kỳ kiểm tra định kỳ trong khoảng thời gian này";
      } else if (kpi.code === "KPI-PRO-01" || kpi.category === KpiCategory.PROFESSIONAL) {
        calculatedVal = lessonPlanRate;
        calculationNote = totalLessonPlans > 0
          ? `Duyệt giáo án điện tử: ${approvedLessonPlans}/${totalLessonPlans} giáo án đúng hạn`
          : "[Chưa có dữ liệu gốc] 0/0 giáo án nộp trong kỳ đánh giá";
      } else if (kpi.code === "KPI-STU-01") {
        calculatedVal = violationRate;
        calculationNote = totalStudents > 0
          ? `Vi phạm kỷ luật: ${incidentCount} vụ / ${totalStudents} học sinh (${violationRate}%)`
          : "[Chưa có dữ liệu gốc] Chưa có danh sách học sinh";
      } else if (kpi.category === KpiCategory.STUDENT) {
        calculatedVal = attendanceRate;
        calculationNote = totalAttendance > 0
          ? `Chuyên cần học sinh: ${presentAttendance}/${totalAttendance} lượt có mặt (${attendanceRate}%)`
          : "[Chưa có dữ liệu gốc] Chưa thực hiện điểm danh điện tử trong kỳ";
      } else if (kpi.code === "KPI-SAF-01" || kpi.category === KpiCategory.SCHOOL_SAFETY) {
        calculatedVal = incidentCount;
        calculationNote = incidentCount === 0
          ? "Đạt chuẩn an toàn tuyệt đối: 0 sự cố an toàn & PCCC"
          : `Ghi nhận ${incidentCount} sự cố an toàn & PCCC cần xử lý`;
      } else if (kpi.code === "KPI-AST-01" || kpi.category === KpiCategory.ASSETS || kpi.category === KpiCategory.FACILITIES) {
        calculatedVal = equipmentRate;
        calculationNote = totalEquip > 0
          ? `Thiết bị & CSVC hoạt động tốt: ${availEquip}/${totalEquip} thiết bị (${equipmentRate}%)`
          : "[Chưa có dữ liệu gốc] Chưa có dữ liệu kiểm kê tài sản phòng học";
      } else if (kpi.code === "KPI-DIG-01" || kpi.category === KpiCategory.DIGITAL_TRANSFORMATION) {
        calculatedVal = lessonPlanRate;
        calculationNote = totalLessonPlans > 0
          ? `Số hóa hồ sơ giáo án: ${approvedLessonPlans}/${totalLessonPlans} hồ sơ số hóa`
          : "[Chưa có dữ liệu gốc] Chưa nộp hồ sơ số hóa";
      } else if (kpi.code === "KPI-REL-01" || kpi.category === KpiCategory.SCHOOL_RELATIONS) {
        calculatedVal = parentRate;
        calculationNote = totalFeedbacks > 0
          ? `Tương tác phụ huynh: ${respondedFeedbacks}/${totalFeedbacks} ý kiến đã phản hồi (${parentRate}%)`
          : "[Chưa có dữ liệu gốc] Chưa có ý kiến phụ huynh gửi đến phân hiệu";
      } else if (kpi.code === "KPI-INN-01" || kpi.category === KpiCategory.INNOVATION) {
        calculatedVal = commendationsCount;
        calculationNote = commendationsCount > 0
          ? `Ghi nhận ${commendationsCount} phong trào thi đua / khen thưởng`
          : "[Chưa có dữ liệu gốc] Chưa cập nhật đề tài SKKN hoặc khen thưởng";
      } else {
        calculatedVal = 0.0;
        calculationNote = "[Chỉ số đặc thù] Cần cập nhật số liệu và nộp minh chứng thực tế từ bộ phận chuyên trách";
      }

      const { completionRate, weightedScore } = calculateKpiScore(
        calculatedVal,
        target.targetValue,
        target.weight,
        kpi.direction
      );

      overallScoreSum += weightedScore;

      await prisma.kpiValue.upsert({
        where: {
          periodId_kpiId: {
            periodId,
            kpiId: kpi.id,
          },
        },
        update: {
          actualValue: calculatedVal,
          completionRate,
          weightedScore,
          notes: `Tự động tổng hợp từ CSDL thực tế phân hiệu lúc ${new Date().toLocaleTimeString("vi-VN")}`,
        },
        create: {
          periodId,
          kpiId: kpi.id,
          actualValue: calculatedVal,
          completionRate,
          weightedScore,
          notes: `Tự động tổng hợp từ CSDL thực tế phân hiệu lúc ${new Date().toLocaleTimeString("vi-VN")}`,
        },
      });

      updatedCount++;
    }

    await prisma.kpiPeriod.update({
      where: { id: periodId },
      data: { overallScore: Number(overallScoreSum.toFixed(2)) },
    });

    return {
      success: true,
      updatedCount,
      overallScore: Number(overallScoreSum.toFixed(2)),
      message: `Đã tự động tính toán và cập nhật thành công ${updatedCount} chỉ số KPI từ cơ sở dữ liệu thực tế!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tự động tính KPI" };
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
