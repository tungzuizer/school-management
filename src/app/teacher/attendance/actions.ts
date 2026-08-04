"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get classes assigned to the current teacher
export async function getMyClasses() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: teacher.id },
    include: { classRoom: true, subject: true },
    distinct: ["classId"],
  });

  return assignments.map((a) => ({
    classId: a.classRoom.id,
    className: a.classRoom.name,
    gradeLevel: a.classRoom.gradeLevel,
  }));
}

// Get students of a class for attendance
export async function getClassStudents(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  // Verify teacher has access to this class
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId },
  });
  if (!hasAccess) return [];

  return prisma.student.findMany({
    where: { classId, status: "STUDYING" },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

// Get attendance records for a class on a date
export async function getAttendanceByDate(classId: string, date: string, period?: number) {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const where: any = { classId, date: dateObj };
  if (period) where.period = period;

  return prisma.attendance.findMany({
    where,
    include: { student: { include: { user: { select: { name: true } } } } },
  });
}

// Save attendance for all students at once
export async function saveAttendance(
  classId: string,
  date: string,
  period: number | null,
  records: { studentId: string; status: string; note?: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { success: false, error: "Không tìm thấy giáo viên" };

  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId },
  });
  if (!hasAccess) return { success: false, error: "Không có quyền với lớp này" };

  try {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Use transaction to save all records
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            studentId_classId_date_period: {
              studentId: r.studentId,
              classId,
              date: dateObj,
              period: period || 0,
            },
          },
          update: {
            status: r.status as any,
            note: r.note || null,
          },
          create: {
            studentId: r.studentId,
            classId,
            date: dateObj,
            period: period || 0,
            status: r.status as any,
            note: r.note || null,
          },
        })
      )
    );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi lưu điểm danh" };
  }
}

// Get attendance summary for a class in a date range
export async function getAttendanceSummary(classId: string, startDate: string, endDate: string) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const records = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      classId,
      date: { gte: start, lte: end },
    },
    _count: { status: true },
  });

  return records.map((r) => ({ status: r.status, count: r._count.status }));
}
