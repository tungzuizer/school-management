"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dashboard thống kê cho Phòng GD&ĐT
export async function getWardDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  let districtWardId = session.user.districtWardId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!districtWardId && userRole === "WARD_ADMIN");

  if (!districtWardId && isSuperAdmin) {
    const firstWard = await prisma.districtWard.findFirst({ orderBy: { name: "asc" } });
    if (firstWard) {
      districtWardId = firstWard.id;
    }
  }

  if (!districtWardId && !isSuperAdmin) return null;

  const schoolWhere = districtWardId ? { districtWardId } : {};
  const studentWhere = districtWardId ? { classRoom: { school: { districtWardId } } } : {};
  const teacherWhere = districtWardId ? { user: { school: { districtWardId } } } : {};

  const [ward, schools, totalStudents, totalTeachers] = await Promise.all([
    districtWardId
      ? prisma.districtWard.findUnique({
          where: { id: districtWardId },
          select: { id: true, name: true, code: true, department: { select: { name: true } } },
        })
      : { id: "all", name: "Tất cả Phòng GD&ĐT Toàn quốc", code: "ALL", department: { name: "Bộ GD&ĐT & Sở GD&ĐT" } },
    prisma.school.findMany({
      where: schoolWhere,
      include: { _count: { select: { classRooms: true, users: true, campuses: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where: studentWhere }),
    prisma.teacher.count({ where: teacherWhere }),
  ]);

  return {
    ward,
    departmentName: ward?.department?.name || "Bộ GD&ĐT",
    totalSchools: schools.length,
    totalStudents,
    totalTeachers,
    schools: schools.map(s => ({
      id: s.id,
      name: s.name,
      schoolType: s.schoolType,
      address: s.address,
      classCount: s._count.classRooms,
      userCount: s._count.users,
      campusCount: s._count.campuses,
    })),
  };
}

// Danh sách trường thuộc Phòng GD&ĐT
export async function getWardSchools() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  let districtWardId = session.user.districtWardId;
  const userRole = session.user.role;
  const isSuperAdmin =
    session.user.email === "superadmin@school.com" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    (!districtWardId && userRole === "WARD_ADMIN");

  const where = (!districtWardId && isSuperAdmin) ? {} : { districtWardId: districtWardId || "" };

  return prisma.school.findMany({
    where,
    include: {
      _count: { select: { classRooms: true, users: true, campuses: true } },
    },
    orderBy: { name: "asc" },
  });
}
