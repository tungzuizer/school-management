"use server";

import prisma from "./prisma";
import { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  userId?: string;
  userName?: string;
  userRole?: string;
  schoolId?: string;
  campusId?: string;
  action: AuditAction;
  entityName: string;
  entityId?: string;
  description?: string;
  changesJson?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Records an audit log entry to the database.
 * Designed to be called from Server Actions & API Routes.
 * Catches DB errors silently to avoid blocking the main business flow.
 */
export async function recordAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        userRole: input.userRole,
        schoolId: input.schoolId,
        campusId: input.campusId,
        action: input.action,
        entityName: input.entityName,
        entityId: input.entityId,
        description: input.description,
        changesJson: input.changesJson,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit log:", err);
  }
}

/**
 * Helper to build changesJson from before/after values (only changed fields).
 * Limits output to the provided field names to avoid leaking sensitive data.
 */
export function buildChangesJson(
  before: Record<string, any>,
  after: Record<string, any>,
  fields: string[]
): string | undefined {
  const changes: Record<string, { from: any; to: any }> = {};
  let hasChanges = false;

  for (const field of fields) {
    const bVal = before[field];
    const aVal = after[field];
    if (bVal !== aVal) {
      changes[field] = { from: bVal ?? null, to: aVal ?? null };
      hasChanges = true;
    }
  }

  return hasChanges ? JSON.stringify(changes) : undefined;
}

/**
 * Records a Login or Login Failure audit entry.
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  reason?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email,
        success,
        reason,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Failed to record login attempt:", err);
  }
}

/**
 * Checks if an account is temporarily locked due to too many failed attempts.
 * Returns true if the account should be blocked.
 */
export async function isAccountLocked(
  email: string,
  maxAttempts: number = 5,
  lockWindowMinutes: number = 15
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - lockWindowMinutes * 60 * 1000);

    const failedCount = await prisma.loginAttempt.count({
      where: {
        email,
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    return failedCount >= maxAttempts;
  } catch {
    return false;
  }
}
