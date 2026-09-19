/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts` (line 26), `src/app/api/db-seed/route.ts` (line 27).
 * 2. Uniqueness: Dedicated seed module for KpiPeriod, KpiAssignment, KpiTarget, KpiValue, KpiEvidence, KpiApprovalLog, KpiUnlockLog, QualityObjectiveEvidence, QualityObjectiveHistory.
 * 3. Data Schemas:
 *    - KpiPeriod: { id: string, title: string, year: number, periodType: ReportingFrequency, campusId?: string, status: KpiPeriodStatus, overallScore?: number, createdById?: string }
 *    - KpiAssignment: { id: string, kpiId: string, assigneeId?: string, campusId?: string, weight: number, targetValue: number }
 *    - KpiTarget: { id: string, periodId: string, kpiId: string, targetValue: number, weight: number }
 *    - KpiValue: { id: string, periodId: string, kpiId: string, actualValue: number, completionRate: number, weightedScore: number, notes?: string, createdById?: string }
 *    - KpiEvidence: { id: string, kpiValueId: string, title: string, fileUrl?: string, description?: string }
 *    - KpiApprovalLog: { id: string, periodId: string, action: string, fromStatus: KpiPeriodStatus, toStatus: KpiPeriodStatus, reviewerId?: string, reviewerName?: string, comments?: string }
 *    - KpiUnlockLog: { id: string, periodId: string, requestedById?: string, requestedByName?: string, reason: string, approvedById?: string, approvedByName?: string, status: string }
 *    - QualityObjectiveEvidence: { id: string, objectiveId: string, title: string, fileUrl?: string, uploadedBy?: string, description?: string }
 *    - QualityObjectiveHistory: { id: string, objectiveId: string, updatedByName?: string, previousActual?: number, newActual: number, completionRate: number, status: QualityObjectiveStatus, note?: string }
 * 4. Verbatim User Instruction: "tôi muốn bạn thêm dữ liệu mô phỏng cho tất cả dữ liệu".
 */

import {
  PrismaClient,
  KpiPeriodStatus,
  ReportingFrequency,
  QualityObjectiveStatus,
} from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedKpiOperations(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n📊 Khởi tạo Vận hành KPI chu kỳ, Phân công chỉ tiêu, Minh chứng số & Lịch sử phê duyệt...");
  const { school, campuses } = schoolStruct;
  const { principalUser, vpUsers, teachers } = personnelStruct;

  // 1. Lấy danh mục KPI Catalog đã có
  const catalogs = await prisma.kpiCatalog.findMany();
  const qualityObjs = await prisma.qualityObjective.findMany();

  // 2. Khởi tạo 3 Chu kỳ Đánh giá KPI (KpiPeriod)
  console.log("   - Tạo 3 chu kỳ đánh giá KPI (Năm học 2024-2025, 2025-2026, 2026-2027)...");
  const periodSpecs = [
    {
      title: "Chu kỳ Đánh giá Toàn diện KPI Năm học 2024-2025",
      year: 2024,
      periodType: ReportingFrequency.YEARLY,
      status: KpiPeriodStatus.APPROVED,
      score: 94.8,
    },
    {
      title: "Chu kỳ Đánh giá Toàn diện KPI Năm học 2025-2026",
      year: 2025,
      periodType: ReportingFrequency.YEARLY,
      status: KpiPeriodStatus.APPROVED,
      score: 96.5,
    },
    {
      title: "Chu kỳ Đánh giá Mục tiêu KPI Học kỳ 1 Năm học 2026-2027",
      year: 2026,
      periodType: ReportingFrequency.SEMESTER,
      status: KpiPeriodStatus.SUBMITTED,
      score: 97.2,
    },
  ];

  const createdPeriods: any[] = [];
  for (const ps of periodSpecs) {
    const period = await prisma.kpiPeriod.create({
      data: {
        title: ps.title,
        year: ps.year,
        periodType: ps.periodType,
        campusId: campuses[0]?.campus.id,
        status: ps.status,
        overallScore: ps.score,
        createdById: principalUser.id,
      },
    });
    createdPeriods.push(period);
  }

  // 3. Khởi tạo Phân công KPI, Chỉ tiêu Mục tiêu & Kết quả Thực tế (KpiAssignment, KpiTarget, KpiValue, KpiEvidence)
  console.log("   - Tạo Phân công chỉ tiêu, Giá trị mục tiêu, Kết quả thực tế & Minh chứng số...");
  if (catalogs.length > 0 && createdPeriods.length > 0) {
    for (let cIdx = 0; cIdx < catalogs.length; cIdx++) {
      const cat = catalogs[cIdx];
      const targetTeacher = teachers[cIdx % teachers.length]?.teacher;

      // Phân công chỉ tiêu
      await prisma.kpiAssignment.create({
        data: {
          kpiId: cat.id,
          assigneeId: targetTeacher?.userId || principalUser.id,
          campusId: campuses[cIdx % campuses.length]?.campus.id,
          weight: 15.0,
          targetValue: 98.0,
        },
      });

      // Tạo KpiTarget & KpiValue cho chu kỳ hiện tại (2026-2027)
      const currentPeriod = createdPeriods[2];
      await prisma.kpiTarget.create({
        data: {
          periodId: currentPeriod.id,
          kpiId: cat.id,
          targetValue: 98.0,
          weight: 15.0,
        },
      });

      const actual = 98.5;
      const compRate = (actual / 98.0) * 100;
      const kpiVal = await prisma.kpiValue.create({
        data: {
          periodId: currentPeriod.id,
          kpiId: cat.id,
          actualValue: actual,
          completionRate: compRate,
          weightedScore: 15.2,
          notes: `Chỉ số "${cat.name}" đạt và vượt chỉ tiêu đề ra trong Kế hoạch giáo dục 2026-2027.`,
          createdById: principalUser.id,
        },
      });

      // Tạo minh chứng số
      await prisma.kpiEvidence.create({
        data: {
          kpiValueId: kpiVal.id,
          title: `Báo cáo minh chứng ${cat.code}`,
          fileUrl: `https://storage.thpholu.laocai.edu.vn/kpi/${cat.code}_evidence_2026.pdf`,
          description: `Báo cáo số liệu và bảng tổng hợp minh chứng cho chỉ số ${cat.name}.`,
        },
      });
    }
  }

  // 4. Khởi tạo Nhật ký Phê duyệt KPI & Yêu cầu Mở khóa (KpiApprovalLog, KpiUnlockLog)
  console.log("   - Tạo Nhật ký phê duyệt KPI & Hồ sơ yêu cầu mở khóa số liệu...");
  if (createdPeriods.length > 0) {
    const curPeriod = createdPeriods[2];
    await prisma.kpiApprovalLog.create({
      data: {
        periodId: curPeriod.id,
        action: "SUBMIT",
        fromStatus: KpiPeriodStatus.DRAFT,
        toStatus: KpiPeriodStatus.SUBMITTED,
        reviewerId: vpUsers[0]?.id || principalUser.id,
        reviewerName: "ThS. Nguyễn Văn Trung (PHT)",
        comments: "Đã rà soát đầy đủ 100% minh chứng các chỉ số KPI cấp trường và phân hiệu.",
      },
    });

    await prisma.kpiApprovalLog.create({
      data: {
        periodId: curPeriod.id,
        action: "APPROVE",
        fromStatus: KpiPeriodStatus.SUBMITTED,
        toStatus: KpiPeriodStatus.APPROVED,
        reviewerId: principalUser.id,
        reviewerName: principalUser.name,
        comments: "Hiệu trưởng ký duyệt khung kết quả đánh giá sơ kết kỳ 1.",
      },
    });

    await prisma.kpiUnlockLog.create({
      data: {
        periodId: createdPeriods[0].id,
        requestedById: principalUser.id,
        requestedByName: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
        reason: "Cập nhật bổ sung minh chứng khen thưởng cấp Bộ Giáo dục & Đào tạo cho tập thể nhà trường.",
        approvedById: principalUser.id,
        approvedByName: "Hội đồng Thi đua Khen thưởng",
        status: "APPROVED",
      },
    });
  }

  // 5. Khởi tạo Minh chứng & Lịch sử Mục tiêu Chất lượng (QualityObjectiveEvidence, QualityObjectiveHistory)
  console.log("   - Tạo Minh chứng tệp & Lịch sử thay đổi Mục tiêu Chất lượng...");
  if (qualityObjs.length > 0) {
    for (const qo of qualityObjs) {
      await prisma.qualityObjectiveEvidence.create({
        data: {
          objectiveId: qo.id,
          title: `Minh chứng Mục tiêu ${qo.code}`,
          fileUrl: `https://storage.thpholu.laocai.edu.vn/quality/${qo.code}.pdf`,
          uploadedBy: principalUser.name,
          description: `Tệp quyết định và số liệu chứng minh mục tiêu ${qo.title}.`,
        },
      });

      await prisma.qualityObjectiveHistory.create({
        data: {
          objectiveId: qo.id,
          updatedByName: principalUser.name,
          previousActual: qo.actualValue ? qo.actualValue - 2.0 : 90.0,
          newActual: qo.actualValue || 98.5,
          completionRate: 100.5,
          status: QualityObjectiveStatus.ACHIEVED,
          note: "Nâng chỉ số thực tế sau đợt kiểm tra giữa kỳ 1 năm học 2026-2027.",
        },
      });
    }
  }

  console.log(`   ✅ Đã nạp thành công 3 Chu kỳ KPI, Phân công chỉ tiêu, Minh chứng số, Lịch sử duyệt KPI & Mục tiêu chất lượng.`);
}
