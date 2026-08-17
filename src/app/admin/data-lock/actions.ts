"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";

export async function getDataLocks() {
  const ctx = await getTenantContext();
  const where: any = {};
  if (ctx.schoolId) {
    where.schoolId = ctx.schoolId;
  }
  return prisma.dataLock.findMany({
    where,
    orderBy: [{ lockType: "asc" }, { periodLabel: "asc" }],
  });
}

export async function toggleDataLock(
  lockType: string,
  periodLabel: string,
  lock: boolean,
  reason?: string
) {
  const ctx = await getTenantContext();
  const schoolId = ctx.schoolId;
  if (!schoolId) return { success: false, error: "Không xác định được trường học." };

  try {
    const existing = await prisma.dataLock.findUnique({
      where: { schoolId_lockType_periodLabel: { schoolId, lockType, periodLabel } },
    });

    if (existing) {
      await prisma.dataLock.update({
        where: { id: existing.id },
        data: lock
          ? {
              isLocked: true,
              lockedById: ctx.userId,
              lockedByName: ctx.userName,
              lockedAt: new Date(),
              reason: reason || undefined,
            }
          : {
              isLocked: false,
              unlockedById: ctx.userId,
              unlockedByName: ctx.userName,
              unlockedAt: new Date(),
              reason: reason || undefined,
            },
      });
    } else {
      await prisma.dataLock.create({
        data: {
          schoolId,
          lockType,
          periodLabel,
          isLocked: lock,
          lockedById: lock ? ctx.userId : undefined,
          lockedByName: lock ? ctx.userName : undefined,
          lockedAt: lock ? new Date() : undefined,
          reason: reason || undefined,
        },
      });
    }

    await recordAuditLog({
      userId: ctx.userId,
      userName: ctx.userName,
      userRole: ctx.userRole,
      schoolId,
      action: lock ? "LOCK" : "UNLOCK",
      entityName: "DataLock",
      entityId: `${lockType}::${periodLabel}`,
      description: lock
        ? `Khóa sổ ${lockType} - ${periodLabel}`
        : `Mở khóa sổ ${lockType} - ${periodLabel}`,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function checkDataLock(
  schoolId: string,
  lockType: string,
  periodLabel: string
): Promise<boolean> {
  try {
    const lock = await prisma.dataLock.findUnique({
      where: { schoolId_lockType_periodLabel: { schoolId, lockType, periodLabel } },
      select: { isLocked: true },
    });
    return lock?.isLocked ?? false;
  } catch {
    return false;
  }
}
