"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get classes assigned to the current teacher (teaching assignments + homeroom)
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

  const homeroomClasses = await prisma.classRoom.findMany({
    where: { homeroomTeacherId: teacher.id },
  });

  const classMap = new Map<string, { classId: string; className: string; gradeLevel: number }>();

  assignments.forEach((a) => {
    classMap.set(a.classRoom.id, {
      classId: a.classRoom.id,
      className: a.classRoom.name,
      gradeLevel: a.classRoom.gradeLevel,
    });
  });

  homeroomClasses.forEach((c) => {
    if (!classMap.has(c.id)) {
      classMap.set(c.id, { classId: c.id, className: c.name, gradeLevel: c.gradeLevel });
    }
  });

  return Array.from(classMap.values());
}

// Get students of a class for attendance
export async function getClassStudents(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  // Verify teacher has access to this class (either as subject teacher or homeroom teacher)
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
  const isHomeroom = classRoom?.homeroomTeacherId === teacher.id;
  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId },
  });
  if (!hasAccess && !isHomeroom) return [];

  return prisma.student.findMany({
    where: { classId, status: "STUDYING" },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

// Get attendance records for a class on a date
export async function getAttendanceByDate(classId: string, date: string, period?: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  const where: any = { classId, date: dateObj };
  if (period !== undefined && period !== null) {
    where.period = period;
  }

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

  const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
  if (!classRoom) return { success: false, error: "Không tìm thấy lớp học" };

  const isHomeroom = classRoom.homeroomTeacherId === teacher.id;
  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId },
  });
  if (!hasAccess && !isHomeroom) return { success: false, error: "Không có quyền với lớp này" };

  try {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Check DataLock
    const monthLabel = `Tháng ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    const isLocked = await prisma.dataLock.findFirst({
      where: {
        schoolId: classRoom.schoolId,
        isLocked: true,
        periodLabel: monthLabel,
      },
    });
    if (isLocked) {
      return { success: false, error: `Dữ liệu điểm danh ${monthLabel} đã bị khóa sổ` };
    }

    const periodVal = period !== null && period !== undefined ? period : 0;

    // Use transaction to save all records
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            studentId_classId_date_period: {
              studentId: r.studentId,
              classId,
              date: dateObj,
              period: periodVal,
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
            period: periodVal,
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
