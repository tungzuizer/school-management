"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Dashboard thống kê cho Phòng GD&ĐT
export async function getWardDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.districtWardId) return null;

  const districtWardId = session.user.districtWardId;

  const [ward, schools, totalStudents, totalTeachers] = await Promise.all([
    prisma.districtWard.findUnique({
      where: { id: districtWardId },
      select: { id: true, name: true, code: true, department: { select: { name: true } } },
    }),
    prisma.school.findMany({
      where: { districtWardId },
      include: { _count: { select: { classRooms: true, users: true, campuses: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.student.count({ where: { classRoom: { school: { districtWardId } } } }),
    prisma.teacher.count({ where: { user: { school: { districtWardId } } } }),
  ]);

  return {
    ward,
    departmentName: ward?.department?.name || "",
    totalSchools: schools.length,
    totalStudents,
    totalTeachers,
    schools: schools.map(s => ({
      id: s.id,
      name: s.name,
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
  if (!session?.user?.districtWardId) return [];

  return prisma.school.findMany({
    where: { districtWardId: session.user.districtWardId },
    include: {
      _count: { select: { classRooms: true, users: true, campuses: true } },
    },
    orderBy: { name: "asc" },
  });
}
