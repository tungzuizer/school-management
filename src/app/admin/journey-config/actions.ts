/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Journey Config Page (`src/app/admin/journey-config/page.tsx`).
 * 2. Affected APIs: `getSchoolsList`, `fetchCampusConfig`, `saveCampusConfig`, `recalculateAfterConfigChange`.
 * 3. Schemas: `School`, `Campus`, `StudentJourneyConfig`.
 * 4. Verbatim User Instruction: "hãy là như 1 chuyên gia phần mềm hãy kiểm tra thật kỹ logic hoạt động và luồng xử lý và tất cả mọi thứ để phần mềm hoạt động mượt mà".
 */

"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  getCampusJourneyConfig,
  upsertCampusJourneyConfig,
  batchComputeJourneyForCampus,
} from "@/lib/student-journey";
import { revalidatePath } from "next/cache";

export async function fetchCampusConfig(schoolId: string, campusId?: string) {
  try {
    const config = await getCampusJourneyConfig(schoolId, campusId || "");
    return config;
  } catch (error) {
    console.error("Error in fetchCampusConfig:", error);
    return null;
  }
}

export async function saveCampusConfig({
  schoolId,
  campusId,
  params,
}: {
  schoolId: string;
  campusId?: string;
  params: {
    increasingSlope: number;
    decliningSlope: number;
    volatilityMax: number;
    minPeriodsRequired: number;
  };
}) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await upsertCampusJourneyConfig(
      schoolId,
      campusId || "",
      params,
      ctx.userId,
      ctx.userName
    );

    revalidatePath("/admin/journey-config");
    revalidatePath("/admin/journey-overview");

    return { success: true, config: updated };
  } catch (error: any) {
    console.error("Error in saveCampusConfig:", error);
    return { success: false, error: error.message || "Lỗi lưu cấu hình." };
  }
}

export async function recalculateAfterConfigChange(schoolId: string, campusId?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const result = await batchComputeJourneyForCampus(schoolId, campusId);
    revalidatePath("/admin/journey-overview");
    return { success: true, result };
  } catch (error: any) {
    console.error("Error in recalculateAfterConfigChange:", error);
    return { success: false, error: error.message || "Lỗi tính toán lại." };
  }
}

export async function getSchoolsList() {
  try {
    return await prisma.school.findMany({
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
  } catch (error) {
    console.error("Error in getSchoolsList:", error);
    return [];
  }
}
