"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Get all early warnings with optional filters
export async function getWarnings(filters?: {
  category?: string;
  level?: string;
  schoolPointName?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.category && filters.category !== "ALL") {
    where.category = filters.category;
  }
  if (filters?.level && filters.level !== "ALL") {
    where.level = filters.level;
  }
  if (filters?.schoolPointName && filters.schoolPointName !== "ALL") {
    where.schoolPointName = filters.schoolPointName;
  }

  const warnings = await prisma.earlyWarning.findMany({
    where,
    orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
  });

  return warnings.map((w) => ({
    id: w.id,
    title: w.title,
    category: w.category,
    level: w.level,
    campusName: w.campusName || "",
    schoolPointName: w.schoolPointName || "",
    className: w.className || undefined,
    studentName: w.studentName || undefined,
    description: w.description,
    aiAnalysis: w.aiAnalysis || "",
    isResolved: w.isResolved,
    createdAt: w.createdAt.toISOString().split("T")[0],
  }));
}

// Resolve a warning
export async function resolveWarning(id: string) {
  try {
    await prisma.earlyWarning.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
    revalidatePath("/admin/early-warnings");
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    return { success: false, error: msg };
  }
}

// Get all school points for filter dropdown
export async function getSchoolPoints() {
  const points = await prisma.schoolPoint.findMany({
    orderBy: { distanceKm: "asc" },
    select: {
      id: true,
      name: true,
      distanceKm: true,
      campus: { select: { name: true } },
    },
  });

  return points.map((p) => ({
    id: p.id,
    name: p.name,
    distanceKm: p.distanceKm ?? 0,
    campusName: p.campus.name,
  }));
}
