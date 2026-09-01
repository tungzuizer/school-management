"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  getCampusJourneyOverview,
  batchComputeJourneyForCampus,
  approveIntervention,
  rejectIntervention,
  applyIntervention,
  trackInterventionOutcome,
  listCampusInterventions,
} from "@/lib/student-journey";
import { InterventionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function fetchJourneyOverviewData(schoolId?: string, campusId?: string) {
  try {
    const ctx = await getTenantContext().catch(() => null);
    const targetSchoolId = schoolId || ctx?.schoolId;

    if (!targetSchoolId) {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      if (!firstSchool) return null;
      return getCampusJourneyOverview(firstSchool.id, campusId);
    }

    const overview = await getCampusJourneyOverview(targetSchoolId, campusId);
    const interventionsList = await listCampusInterventions({
      schoolId: targetSchoolId,
      campusId,
      limit: 50,
    });

    return {
      ...overview,
      interventionsList,
    };
  } catch (error) {
    console.error("Error in fetchJourneyOverviewData:", error);
    return null;
  }
}

export async function runBatchJourneyCalculation(schoolId: string, campusId?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const result = await batchComputeJourneyForCampus(schoolId, campusId);
    revalidatePath("/admin/journey-overview");
    return { success: true, result };
  } catch (error: any) {
    console.error("Error in runBatchJourneyCalculation:", error);
    return { success: false, error: error.message || "Lỗi khi tính toán lại hành trình học sinh." };
  }
}

export async function handleApproveIntervention(interventionId: string, note?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await approveIntervention({
      interventionId,
      approvedById: ctx.userId,
      approvedByName: ctx.userName,
      note,
    });

    revalidatePath("/admin/journey-overview");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleApproveIntervention:", error);
    return { success: false, error: error.message || "Không thể phê duyệt can thiệp." };
  }
}

export async function handleRejectIntervention(interventionId: string, reason: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await rejectIntervention({
      interventionId,
      rejectedById: ctx.userId,
      rejectedByName: ctx.userName,
      reason,
    });

    revalidatePath("/admin/journey-overview");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleRejectIntervention:", error);
    return { success: false, error: error.message || "Không thể từ chối can thiệp." };
  }
}

export async function handleApplyIntervention(interventionId: string, note?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await applyIntervention({
      interventionId,
      appliedById: ctx.userId,
      appliedByName: ctx.userName,
      note,
    });

    revalidatePath("/admin/journey-overview");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleApplyIntervention:", error);
    return { success: false, error: error.message || "Không thể áp dụng can thiệp." };
  }
}

export async function handleTrackOutcome(interventionId: string, scoreDelta: number, outcomeNote: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await trackInterventionOutcome({
      interventionId,
      scoreDelta,
      outcomeNote,
      trackedById: ctx.userId,
      trackedByName: ctx.userName,
    });

    revalidatePath("/admin/journey-overview");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleTrackOutcome:", error);
    return { success: false, error: error.message || "Không thể lưu kết quả can thiệp." };
  }
}

export async function getSchoolsAndCampuses() {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        campuses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return schools;
  } catch (error) {
    console.error("Error in getSchoolsAndCampuses:", error);
    return [];
  }
}
