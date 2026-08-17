"use server";

import prisma from "@/lib/prisma";

export async function getAuditLogs(
  filters?: {
    action?: string;
    entityName?: string;
    userName?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  page: number = 1,
  pageSize: number = 50
) {
  const where: any = {};

  if (filters?.action) {
    where.action = filters.action;
  }
  if (filters?.entityName) {
    where.entityName = { contains: filters.entityName, mode: "insensitive" };
  }
  if (filters?.userName) {
    where.userName = { contains: filters.userName, mode: "insensitive" };
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + "T23:59:59.999Z");
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, pageSize };
}
