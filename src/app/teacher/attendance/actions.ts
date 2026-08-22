"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ClassSubjectOption {
  classId: string;
  className: string;
  gradeLevel: number;
  subjects: { id: string; name: string }[];
}

// Get classes & assigned subjects for current teacher
export async function getMyClasses(): Promise<ClassSubjectOption[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return [];

  const assignments = await prisma.teachingAssignment.findMany({
    where: { teacherId: teacher.id },
    include: { classRoom: true, subject: true },
  });

  const homeroomClasses = await prisma.classRoom.findMany({
    where: { homeroomTeacherId: teacher.id },
    include: {
      teachingAssignments: {
        include: { subject: true },
      },
    },
  });

  const classMap = new Map<
    string,
    { classId: string; className: string; gradeLevel: number; subjectsMap: Map<string, string> }
  >();

  assignments.forEach((a) => {
    if (!classMap.has(a.classRoom.id)) {
      classMap.set(a.classRoom.id, {
        classId: a.classRoom.id,
        className: a.classRoom.name,
        gradeLevel: a.classRoom.gradeLevel,
        subjectsMap: new Map(),
      });
    }
    if (a.subject) {
      classMap.get(a.classRoom.id)!.subjectsMap.set(a.subject.id, a.subject.name);
    }
  });

  homeroomClasses.forEach((c) => {
    if (!classMap.has(c.id)) {
      classMap.set(c.id, {
        classId: c.id,
        className: c.name,
        gradeLevel: c.gradeLevel,
        subjectsMap: new Map(),
      });
    }
    c.teachingAssignments.forEach((ta) => {
      if (ta.subject) {
        classMap.get(c.id)!.subjectsMap.set(ta.subject.id, ta.subject.name);
      }
    });
  });

  // If no subjects found for a class (e.g. homeroom without assignments), fetch all school subjects as fallback
  const allSubjects = await prisma.subject.findMany({ select: { id: true, name: true } });

  return Array.from(classMap.values()).map((item) => {
    let subjectList = Array.from(item.subjectsMap.entries()).map(([id, name]) => ({ id, name }));
    if (subjectList.length === 0) {
      subjectList = allSubjects;
    }
    return {
      classId: item.classId,
      className: item.className,
      gradeLevel: item.gradeLevel,
      subjects: subjectList,
    };
  });
}

// Get students of a class for attendance
export async function getClassStudents(classId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

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

// Get attendance & schedule info for specific class, date, and period
export async function getAttendanceByDateAndPeriod(classId: string, date: string, period: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { isLocked: false, existingData: [], scheduledSubject: null, lockedAt: null };

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // Convert Date to DayOfWeek (Sunday=0 -> 7, Monday=1 -> 1, ..., Saturday=6 -> 6)
  const jsDay = dateObj.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  // 1. Fetch scheduled subject from timetable
  const scheduleEntry = await prisma.schedule.findFirst({
    where: {
      classId,
      dayOfWeek,
      period,
    },
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { user: { select: { name: true } } } },
    },
  });

  // 2. Fetch existing attendance records for this period
  const existingData = await prisma.attendance.findMany({
    where: {
      classId,
      date: dateObj,
      period,
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  const isLocked = existingData.length > 0;
  const lockedAt = isLocked ? existingData[0].createdAt.toISOString() : null;

  return {
    isLocked,
    existingData,
    scheduledSubject: scheduleEntry ? scheduleEntry.subject : null,
    scheduledTeacherName: scheduleEntry ? scheduleEntry.teacher.user.name : null,
    lockedAt,
  };
}

// Save attendance for all students at once with STRICT 1-TIME PER PERIOD RULE
export async function saveAttendance(
  classId: string,
  date: string,
  period: number,
  subjectId: string,
  records: { studentId: string; status: string; note?: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  if (!period || period < 1 || period > 10) {
    return { success: false, error: "Vui lòng chọn Tiết học cụ thể (Tiết 1 đến Tiết 10) để điểm danh" };
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return { success: false, error: "Không tìm thấy hồ sơ giáo viên" };

  const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
  if (!classRoom) return { success: false, error: "Không tìm thấy thông tin lớp học" };

  const isHomeroom = classRoom.homeroomTeacherId === teacher.id;
  const hasAccess = await prisma.teachingAssignment.findFirst({
    where: { teacherId: teacher.id, classId },
  });
  if (!hasAccess && !isHomeroom) return { success: false, error: "Bạn không có quyền điểm danh lớp này" };

  try {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // 1. Check if Attendance for this period already exists (STRICT ONE-TIME RULE)
    const existingCount = await prisma.attendance.count({
      where: {
        classId,
        date: dateObj,
        period,
      },
    });

    if (existingCount > 0) {
      return {
        success: false,
        error: `Tiết ${period} ngày ${date} của lớp ${classRoom.name} đã được điểm danh trước đó và đã bị KHÓA. Mỗi tiết học chỉ được điểm danh 1 lần duy nhất!`,
      };
    }

    // 2. Check DataLock for the month
    const monthLabel = `Tháng ${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    const isLocked = await prisma.dataLock.findFirst({
      where: {
        schoolId: classRoom.schoolId,
        isLocked: true,
        periodLabel: monthLabel,
      },
    });
    if (isLocked) {
      return { success: false, error: `Dữ liệu điểm danh ${monthLabel} đã bị khóa sổ toàn trường` };
    }

    // 3. Save attendance inside transaction
    await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.create({
          data: {
            studentId: r.studentId,
            classId,
            date: dateObj,
            period,
            status: r.status as any,
            note: r.note || null,
          },
        })
      )
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error in saveAttendance:", error);
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
