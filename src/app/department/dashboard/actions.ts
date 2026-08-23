"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dashboard thống kê cho Sở GD&ĐT
export async function getDepartmentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  let departmentId = session.user.departmentId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!departmentId && userRole === "DEPARTMENT_ADMIN");

  if (!departmentId && isSuperAdmin) {
    const firstDept = await prisma.educationDepartment.findFirst({ orderBy: { name: "asc" } });
    if (firstDept) {
      departmentId = firstDept.id;
    }
  }

  if (!departmentId && !isSuperAdmin) return null;

  const deptWhere = departmentId ? { id: departmentId } : {};
  const wardWhere = departmentId ? { departmentId } : {};
  const wardSchoolWhere: any = departmentId ? { departmentId, branchType: "WARD" } : { branchType: "WARD" };
  const thptSchoolWhere: any = departmentId ? { departmentId, branchType: "THPT" } : { branchType: "THPT" };
  const studentWhere = departmentId ? { classRoom: { school: { departmentId } } } : {};
  const teacherWhere = departmentId ? { user: { school: { departmentId } } } : {};

  const [department, wards, wardSchools, thptSchools, totalStudents, totalTeachers] = await Promise.all([
    departmentId
      ? prisma.educationDepartment.findUnique({ where: { id: departmentId }, select: { id: true, name: true, code: true } })
      : { id: "all", name: "Sở GD&ĐT (Toàn Quốc)", code: "BGD" },
    prisma.districtWard.findMany({ where: wardWhere, select: { id: true, name: true, _count: { select: { schools: true } } }, orderBy: { name: "asc" } }),
    prisma.school.count({ where: wardSchoolWhere }),
    prisma.school.count({ where: thptSchoolWhere }),
    prisma.student.count({ where: studentWhere }),
    prisma.teacher.count({ where: teacherWhere }),
  ]);

  return {
    department,
    totalWards: wards.length,
    totalWardSchools: wardSchools,
    totalThptSchools: thptSchools,
    totalStudents,
    totalTeachers,
    wards: wards.map(w => ({ id: w.id, name: w.name, schoolCount: w._count.schools })),
  };
}

// Danh sách Phòng GD&ĐT thuộc Sở
export async function getDepartmentWards() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  let departmentId = session.user.departmentId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!departmentId && userRole === "DEPARTMENT_ADMIN");

  const where = (!departmentId && isSuperAdmin) ? {} : { departmentId: departmentId || "" };

  return prisma.districtWard.findMany({
    where,
    include: {
      _count: { select: { schools: true, users: true } },
    },
    orderBy: { name: "asc" },
  });
}

// Danh sách trường THPT trực thuộc Sở
export async function getDepartmentThptSchools() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  let departmentId = session.user.departmentId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!departmentId && userRole === "DEPARTMENT_ADMIN");

  const where: any = { branchType: "THPT" };
  if (departmentId || !isSuperAdmin) {
    where.departmentId = departmentId || "";
  }

  return prisma.school.findMany({
    where,
    include: {
      _count: { select: { classRooms: true, users: true } },
    },
    orderBy: { name: "asc" },
  });
}
