"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dashboard thống kê cho Sở GD&ĐT
export async function getDepartmentDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.departmentId) return null;

  const departmentId = session.user.departmentId;

  const [department, wards, wardSchools, thptSchools, totalStudents, totalTeachers] = await Promise.all([
    prisma.educationDepartment.findUnique({ where: { id: departmentId }, select: { id: true, name: true, code: true } }),
    prisma.districtWard.findMany({ where: { departmentId }, select: { id: true, name: true, _count: { select: { schools: true } } }, orderBy: { name: "asc" } }),
    prisma.school.count({ where: { departmentId, branchType: "WARD" } }),
    prisma.school.count({ where: { departmentId, branchType: "THPT" } }),
    prisma.student.count({ where: { classRoom: { school: { departmentId } } } }),
    prisma.teacher.count({ where: { user: { school: { departmentId } } } }),
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
  if (!session?.user?.departmentId) return [];

  return prisma.districtWard.findMany({
    where: { departmentId: session.user.departmentId },
    include: {
      _count: { select: { schools: true, users: true } },
    },
    orderBy: { name: "asc" },
  });
}

// Danh sách trường THPT trực thuộc Sở
export async function getDepartmentThptSchools() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.departmentId) return [];

  return prisma.school.findMany({
    where: { departmentId: session.user.departmentId, branchType: "THPT" },
    include: {
      _count: { select: { classRooms: true, users: true } },
    },
    orderBy: { name: "asc" },
  });
}
