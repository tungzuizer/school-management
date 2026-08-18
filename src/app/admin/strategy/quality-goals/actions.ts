"use server";

import { prisma } from "@/lib/prisma";
import { QualityCategory, QualityObjectiveStatus, MeasurementDirection, ReportingFrequency } from "@prisma/client";


export interface QualityObjectiveInput {
  code: string;
  title: string;
  category: QualityCategory;
  metricName: string;
  unit?: string;
  baselineValue?: number | null;
  targetValue: number;
  actualValue?: number | null;
  direction?: MeasurementDirection;
  minRange?: number | null;
  maxRange?: number | null;
  deadline?: string | null;
  period?: ReportingFrequency;
  responsiblePerson?: string | null;
  dataSource?: string | null;
  reportingFrequency?: ReportingFrequency;
  campusScope?: string;
  academicYear?: string;
  actionPlan?: string | null;
  campusBreakdownJson?: string | null;
  notes?: string | null;
}

function calculateCompletionAndStatus(
  targetValue: number,
  actualValue: number | null | undefined,
  direction: MeasurementDirection = "HIGHER_BETTER",
  minRange?: number | null,
  maxRange?: number | null
): { completionRate: number; status: QualityObjectiveStatus } {
  if (actualValue === undefined || actualValue === null) {
    return { completionRate: 0, status: "NO_DATA" };
  }

  let rate = 0;

  if (direction === "HIGHER_BETTER") {
    rate = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
  } else if (direction === "LOWER_BETTER") {
    rate = actualValue > 0 ? (targetValue / actualValue) * 100 : 100;
  } else if (direction === "PASS_FAIL") {
    const min = minRange ?? targetValue * 0.9;
    const max = maxRange ?? targetValue * 1.1;
    if (actualValue >= min && actualValue <= max) {
      rate = 100;
    } else if (actualValue < min) {
      rate = (actualValue / min) * 100;
    } else {
      rate = max > 0 ? (max / actualValue) * 100 : 80;
    }
  }

  rate = Math.round(rate * 10) / 10;

  let status: QualityObjectiveStatus = "NO_DATA";
  if (rate >= 110) {
    status = "EXCEEDED";
  } else if (rate >= 100) {
    status = "ACHIEVED";
  } else if (rate >= 80) {
    status = "NEAR_TARGET";
  } else if (rate >= 60) {
    status = "AT_RISK";
  } else {
    status = "FAILED";
  }

  return { completionRate: rate, status };
}

export async function getQualityObjectives(filters?: {
  category?: string;
  status?: string;
  academicYear?: string;
  campusScope?: string;
  search?: string;
}) {
  try {
    const where: any = {};

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category as QualityCategory;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as QualityObjectiveStatus;
    }

    if (filters?.academicYear && filters.academicYear !== "ALL") {
      where.academicYear = filters.academicYear;
    }

    if (filters?.campusScope && filters.campusScope !== "ALL") {
      where.campusScope = filters.campusScope;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { code: { contains: filters.search, mode: "insensitive" } },
        { metricName: { contains: filters.search, mode: "insensitive" } },
        { responsiblePerson: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const objectives = await prisma.qualityObjective.findMany({
      where,
      include: {
        evidences: {
          orderBy: { createdAt: "desc" },
        },
        histories: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: objectives };
  } catch (error: any) {
    console.error("Error fetching quality objectives:", error);
    return { success: false, error: error.message || "Không thể tải danh sách mục tiêu chất lượng" };
  }
}

export async function createQualityObjective(data: QualityObjectiveInput) {
  try {
    const { completionRate, status } = calculateCompletionAndStatus(
      data.targetValue,
      data.actualValue,
      data.direction,
      data.minRange,
      data.maxRange
    );

    const deadlineDate = data.deadline ? new Date(data.deadline) : null;

    const newObj = await prisma.qualityObjective.create({
      data: {
        code: data.code,
        title: data.title,
        category: data.category,
        metricName: data.metricName,
        unit: data.unit || "%",
        baselineValue: data.baselineValue ?? 0,
        targetValue: data.targetValue,
        actualValue: data.actualValue ?? null,
        direction: data.direction || "HIGHER_BETTER",
        minRange: data.minRange ?? null,
        maxRange: data.maxRange ?? null,
        deadline: deadlineDate,
        period: data.period || "SEMESTER",
        responsiblePerson: data.responsiblePerson || null,
        dataSource: data.dataSource || null,
        reportingFrequency: data.reportingFrequency || "MONTHLY",
        campusScope: data.campusScope || "ALL",
        academicYear: data.academicYear || "2026-2027",
        status,
        completionRate,
        actionPlan: data.actionPlan || null,
        campusBreakdownJson: data.campusBreakdownJson || null,
        notes: data.notes || null,
      },
    });

    // Save initial history if actualValue exists
    if (data.actualValue !== undefined && data.actualValue !== null) {
      await prisma.qualityObjectiveHistory.create({
        data: {
          objectiveId: newObj.id,
          updatedByName: "Hệ thống / Quản trị viên",
          previousActual: null,
          newActual: data.actualValue,
          completionRate,
          status,
          note: "Khởi tạo mục tiêu chất lượng",
        },
      });
    }

    
    return { success: true, data: newObj };
  } catch (error: any) {
    console.error("Error creating quality objective:", error);
    return { success: false, error: error.message || "Không thể tạo mục tiêu chất lượng" };
  }
}

export async function updateQualityObjective(id: string, data: Partial<QualityObjectiveInput>) {
  try {
    const existing = await prisma.qualityObjective.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Mục tiêu chất lượng không tồn tại" };
    }

    const targetVal = data.targetValue ?? existing.targetValue;
    const actualVal = data.actualValue !== undefined ? data.actualValue : existing.actualValue;
    const direction = data.direction ?? existing.direction;
    const minRange = data.minRange !== undefined ? data.minRange : existing.minRange;
    const maxRange = data.maxRange !== undefined ? data.maxRange : existing.maxRange;

    const { completionRate, status } = calculateCompletionAndStatus(
      targetVal,
      actualVal,
      direction,
      minRange,
      maxRange
    );

    const deadlineDate = data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : existing.deadline;

    const updated = await prisma.qualityObjective.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.title && { title: data.title }),
        ...(data.category && { category: data.category }),
        ...(data.metricName && { metricName: data.metricName }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.baselineValue !== undefined && { baselineValue: data.baselineValue }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
        ...(data.actualValue !== undefined && { actualValue: data.actualValue }),
        ...(data.direction && { direction: data.direction }),
        ...(data.minRange !== undefined && { minRange: data.minRange }),
        ...(data.maxRange !== undefined && { maxRange: data.maxRange }),
        deadline: deadlineDate,
        ...(data.period && { period: data.period }),
        ...(data.responsiblePerson !== undefined && { responsiblePerson: data.responsiblePerson }),
        ...(data.dataSource !== undefined && { dataSource: data.dataSource }),
        ...(data.reportingFrequency && { reportingFrequency: data.reportingFrequency }),
        ...(data.campusScope && { campusScope: data.campusScope }),
        ...(data.academicYear && { academicYear: data.academicYear }),
        status,
        completionRate,
        ...(data.actionPlan !== undefined && { actionPlan: data.actionPlan }),
        ...(data.campusBreakdownJson !== undefined && { campusBreakdownJson: data.campusBreakdownJson }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Record history if actual value changed
    if (data.actualValue !== undefined && data.actualValue !== existing.actualValue) {
      await prisma.qualityObjectiveHistory.create({
        data: {
          objectiveId: id,
          updatedByName: "Quản trị viên",
          previousActual: existing.actualValue,
          newActual: data.actualValue ?? 0,
          completionRate,
          status,
          note: `Cập nhật kết quả thực tế từ ${existing.actualValue ?? 0} sang ${data.actualValue ?? 0}`,
        },
      });
    }

    
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating quality objective:", error);
    return { success: false, error: error.message || "Không thể cập nhật mục tiêu chất lượng" };
  }
}

export async function deleteQualityObjective(id: string) {
  try {
    await prisma.qualityObjective.delete({
      where: { id },
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting quality objective:", error);
    return { success: false, error: error.message || "Không thể xóa mục tiêu chất lượng" };
  }
}

export async function addObjectiveEvidence(
  objectiveId: string,
  evidenceData: { title: string; fileUrl?: string; description?: string; uploadedBy?: string }
) {
  try {
    const evidence = await prisma.qualityObjectiveEvidence.create({
      data: {
        objectiveId,
        title: evidenceData.title,
        fileUrl: evidenceData.fileUrl || null,
        description: evidenceData.description || null,
        uploadedBy: evidenceData.uploadedBy || "Quản trị viên",
      },
    });
    
    return { success: true, data: evidence };
  } catch (error: any) {
    console.error("Error adding objective evidence:", error);
    return { success: false, error: error.message || "Không thể thêm minh chứng" };
  }
}

export async function getObjectiveHistory(objectiveId: string) {
  try {
    const histories = await prisma.qualityObjectiveHistory.findMany({
      where: { objectiveId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: histories };
  } catch (error: any) {
    console.error("Error fetching objective history:", error);
    return { success: false, error: error.message || "Không thể tải lịch sử mục tiêu" };
  }
}

export async function importQualityObjectivesFromExcel(items: QualityObjectiveInput[]) {
  try {
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      if (!item.code || !item.title) continue;

      const { completionRate, status } = calculateCompletionAndStatus(
        item.targetValue || 100,
        item.actualValue,
        item.direction,
        item.minRange,
        item.maxRange
      );

      const existing = await prisma.qualityObjective.findUnique({
        where: { code: item.code },
      });

      if (existing) {
        await prisma.qualityObjective.update({
          where: { code: item.code },
          data: {
            title: item.title,
            category: item.category || "ACADEMIC",
            metricName: item.metricName || item.title,
            unit: item.unit || "%",
            baselineValue: item.baselineValue ?? existing.baselineValue,
            targetValue: item.targetValue || existing.targetValue,
            actualValue: item.actualValue !== undefined ? item.actualValue : existing.actualValue,
            direction: item.direction || existing.direction,
            responsiblePerson: item.responsiblePerson || existing.responsiblePerson,
            dataSource: item.dataSource || existing.dataSource,
            status,
            completionRate,
            actionPlan: item.actionPlan || existing.actionPlan,
          },
        });
        updatedCount++;
      } else {
        await prisma.qualityObjective.create({
          data: {
            code: item.code,
            title: item.title,
            category: item.category || "ACADEMIC",
            metricName: item.metricName || item.title,
            unit: item.unit || "%",
            baselineValue: item.baselineValue ?? 0,
            targetValue: item.targetValue || 100,
            actualValue: item.actualValue ?? null,
            direction: item.direction || "HIGHER_BETTER",
            responsiblePerson: item.responsiblePerson || null,
            dataSource: item.dataSource || null,
            status,
            completionRate,
            actionPlan: item.actionPlan || null,
            campusScope: item.campusScope || "ALL",
            academicYear: item.academicYear || "2026-2027",
          },
        });
        createdCount++;
      }
    }

    
    return { success: true, createdCount, updatedCount };
  } catch (error: any) {
    console.error("Error importing quality objectives:", error);
    return { success: false, error: error.message || "Không thể nhập dữ liệu từ tập tin" };
  }
}
