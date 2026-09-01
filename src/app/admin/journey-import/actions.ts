"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  createImportBatch,
  reviewMapping,
  commitImportBatch,
  rollbackImportBatch,
  getImportBatchDetails,
  RawImportRow,
} from "@/lib/student-journey";
import { revalidatePath } from "next/cache";

export async function handleCreateImportBatch({
  schoolId,
  campusId,
  fileName,
  rows,
}: {
  schoolId: string;
  campusId?: string;
  fileName: string;
  rows: RawImportRow[];
}) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const batch = await createImportBatch({
      schoolId,
      campusId,
      fileName,
      importedById: ctx.userId,
      importedByName: ctx.userName,
      rows,
    });

    revalidatePath("/admin/journey-import");
    return { success: true, batchId: batch.id };
  } catch (error: any) {
    console.error("Error creating import batch:", error);
    return { success: false, error: error.message || "Lỗi tạo đợt import." };
  }
}

export async function handleReviewMapping({
  mappingId,
  studentId,
  subjectId,
  periodId,
  notes,
}: {
  mappingId: string;
  studentId?: string;
  subjectId?: string;
  periodId?: string;
  notes?: string;
}) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await reviewMapping({
      mappingId,
      studentId,
      subjectId,
      periodId,
      reviewedById: ctx.userId,
      reviewedByName: ctx.userName,
      notes,
    });

    revalidatePath("/admin/journey-import");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error reviewing mapping:", error);
    return { success: false, error: error.message || "Lỗi kiểm duyệt mapping." };
  }
}

export async function handleCommitBatch(batchId: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const result = await commitImportBatch({
      batchId,
      committedById: ctx.userId,
      committedByName: ctx.userName,
    });

    revalidatePath("/admin/journey-import");
    revalidatePath("/admin/journey-overview");

    return { ...result };
  } catch (error: any) {
    console.error("Error committing batch:", error);
    return { success: false, error: error.message || "Lỗi khi nạp điểm vào hệ thống chính thức." };
  }
}

export async function handleRollbackBatch(batchId: string, reason?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const result = await rollbackImportBatch({
      batchId,
      userId: ctx.userId,
      userName: ctx.userName,
      reason,
    });

    revalidatePath("/admin/journey-import");
    revalidatePath("/admin/journey-overview");

    return { ...result };
  } catch (error: any) {
    console.error("Error rolling back batch:", error);
    return { success: false, error: error.message || "Lỗi khi thu hồi đợt import." };
  }
}

export async function fetchBatchDetails(batchId: string) {
  try {
    return await getImportBatchDetails(batchId);
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return null;
  }
}

export async function listRecentBatches(schoolId: string, campusId?: string) {
  try {
    return await prisma.studentImportBatch.findMany({
      where: {
        schoolId,
        ...(campusId ? { campusId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: {
            scores: true,
            mappings: true,
            stagings: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error listing batches:", error);
    return [];
  }
}

export async function getImportContextData(schoolId: string, campusId?: string) {
  try {
    const [students, subjects, examPeriods, schools] = await Promise.all([
      prisma.student.findMany({
        where: {
          classRoom: {
            schoolId,
            ...(campusId ? { campusId } : {}),
          },
        },
        select: {
          id: true,
          studentCode: true,
          user: { select: { name: true } },
          classRoom: { select: { name: true } },
        },
      }),
      prisma.subject.findMany({
        select: { id: true, name: true },
      }),
      prisma.examPeriod.findMany({
        where: { schoolId },
        select: { id: true, name: true, orderIndex: true, semester: true },
        orderBy: { orderIndex: "asc" },
      }),
      prisma.school.findMany({
        select: {
          id: true,
          name: true,
          campuses: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      students,
      subjects,
      examPeriods,
      schools,
    };
  } catch (error) {
    console.error("Error getting import context data:", error);
    return {
      students: [],
      subjects: [],
      examPeriods: [],
      schools: [],
    };
  }
}
