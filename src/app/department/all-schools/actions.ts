"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Danh sách tất cả trường thuộc Sở (cả 2 nhánh WARD + THPT)
export async function getAllDepartmentSchools(branchFilter?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  let departmentId = session.user.departmentId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!departmentId && userRole === "DEPARTMENT_ADMIN");

  const where: any = {};
  if (departmentId || !isSuperAdmin) {
    where.departmentId = departmentId || "";
  }
  if (branchFilter === "WARD") where.branchType = "WARD";
  if (branchFilter === "THPT") where.branchType = "THPT";

  return prisma.school.findMany({
    where,
    include: {
      districtWard: { select: { name: true } },
      _count: { select: { classRooms: true, users: true, campuses: true } },
    },
    orderBy: [{ branchType: "asc" }, { name: "asc" }],
  });
}
