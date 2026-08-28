"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

async function isApprovedUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true },
  });
  return user?.isApproved !== false;
}


export interface TeacherSlotOption {
  slotKey: string; // Key unique for dropdown: e.g. "classId_period_subjectId"
  classId: string;
  className: string;
  gradeLevel: number;
  period: number;
  periodLabel: string;
  periodTime: string;
  subjectId: string;
  subjectName: string;
  room?: string | null;
  isHomeroom?: boolean;
  isLocked?: boolean;
}


function parseLocalDate(dateStr: string): { dateObj: Date; dayOfWeek: number } {
  const cleanDateStr = dateStr ? dateStr.split("T")[0] : "";
  const parts = cleanDateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const jsDay = d.getDay();
    return { dateObj: d, dayOfWeek: jsDay === 0 ? 7 : jsDay };
  }
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  const jsDay = dateObj.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;
  return { dateObj, dayOfWeek };
}

const PERIOD_TIMES: Record<number, string> = {
  1: "07:00 - 07:45",
  2: "07:50 - 08:35",
  3: "08:50 - 09:35",
  4: "09:40 - 10:25",
  5: "13:00 - 13:45",
  6: "13:50 - 14:35",
  7: "14:50 - 15:35",
  8: "15:40 - 16:25",
  9: "16:30 - 17:15",
  10: "17:20 - 18:05",
};

// Fetch teacher's exact teaching slots according to timetable on a specific date
export async function getTeacherScheduleForDate(date: string): Promise<TeacherSlotOption[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    if (!(await isApprovedUser(session.user.id))) return [];

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    const userRole = (session.user as any).role;
    const isManagement = userRole === "ADMIN" || userRole === "PRINCIPAL" || userRole === "VICE_PRINCIPAL";

    const { dateObj, dayOfWeek } = parseLocalDate(date);

    if (!teacher && isManagement) {
      const userSchoolId = (session.user as any).schoolId;
      const [scheduleEntries, existingAttendance] = await Promise.all([
        prisma.schedule.findMany({
          where: {
            dayOfWeek,
            classRoom: userSchoolId ? { schoolId: userSchoolId } : undefined,
          },
          include: { classRoom: true, subject: true },
          orderBy: [{ classId: "asc" }, { period: "asc" }],
        }),
        prisma.attendance.findMany({
          where: {
            date: dateObj,
            period: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
          },
          select: { classId: true, period: true },
        }),
      ]);

      const lockedSet = new Set(existingAttendance.map((a) => `${a.classId}_${a.period}`));
      const slots: TeacherSlotOption[] = [];

      scheduleEntries.forEach((s) => {
        const slotKey = `${s.classId}_${s.period}_${s.subjectId}`;
        const isLocked = lockedSet.has(`${s.classId}_${s.period}`);
        slots.push({
          slotKey,
          classId: s.classId,
          className: s.classRoom.name,
          gradeLevel: s.classRoom.gradeLevel,
          period: s.period,
          periodLabel: `Tiết ${s.period}`,
          periodTime: PERIOD_TIMES[s.period] || "",
          subjectId: s.subject.id,
          subjectName: s.subject.name,
          room: s.room,
          isHomeroom: false,
          isLocked,
        });
      });

      return slots;
    }

    if (!teacher) return [];

    // Execute queries in parallel using Promise.all for maximum speed
    const [scheduleEntries, homeroomClasses, existingAttendance] = await Promise.all([
      prisma.schedule.findMany({
        where: { teacherId: teacher.id, dayOfWeek },
        include: { classRoom: true, subject: true },
        orderBy: { period: "asc" },
      }),
      prisma.classRoom.findMany({
        where: { homeroomTeacherId: teacher.id },
      }),
      prisma.attendance.findMany({
        where: {
          date: dateObj,
          period: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        },
        select: { classId: true, period: true },
      }),
    ]);

    const lockedSet = new Set(existingAttendance.map((a) => `${a.classId}_${a.period}`));

    const slots: TeacherSlotOption[] = [];

    // Add timetable slots
    scheduleEntries.forEach((s) => {
      const slotKey = `${s.classId}_${s.period}_${s.subjectId}`;
      const isLocked = lockedSet.has(`${s.classId}_${s.period}`);

      slots.push({
        slotKey,
        classId: s.classId,
        className: s.classRoom.name,
        gradeLevel: s.classRoom.gradeLevel,
        period: s.period,
        periodLabel: `Tiết ${s.period}`,
        periodTime: PERIOD_TIMES[s.period] || "",
        subjectId: s.subject.id,
        subjectName: s.subject.name,
        room: s.room,
        isHomeroom: false,
        isLocked,
      });
    });

    // Add Homeroom Class fallback options for periods without explicit timetable slots
    if (homeroomClasses.length > 0) {
      // Try to find "Sinh hoạt" or teacher specialty subject, otherwise fallback
      let fallbackSubject = await prisma.subject.findFirst({
        where: { name: { contains: "Sinh hoạt" } },
        select: { id: true, name: true },
      });

      if (!fallbackSubject && teacher.specialty) {
        fallbackSubject = await prisma.subject.findFirst({
          where: { name: { contains: teacher.specialty.replace("học", "").trim() } },
          select: { id: true, name: true },
        });
      }

      if (!fallbackSubject) {
        fallbackSubject = await prisma.subject.findFirst({ select: { id: true, name: true } });
      }

      const subId = fallbackSubject?.id || "";
      const subName = "Sinh hoạt lớp (GVCN)";

      homeroomClasses.forEach((hr) => {
        // Allow periods for homeroom attendance if slot for that specific period doesn't exist yet in slots
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((p) => {
          const alreadyHasSlot = slots.some((s) => s.classId === hr.id && s.period === p);
          if (!alreadyHasSlot) {
            const slotKey = `${hr.id}_${p}_${subId}`;
            const isLocked = lockedSet.has(`${hr.id}_${p}`);
            slots.push({
              slotKey,
              classId: hr.id,
              className: hr.name,
              gradeLevel: hr.gradeLevel,
              period: p,
              periodLabel: `Tiết ${p} (GVCN)`,
              periodTime: PERIOD_TIMES[p] || "",
              subjectId: subId,
              subjectName: subName,
              room: null,
              isHomeroom: true,
              isLocked,
            });
          }
        });
      });
    }

    // Sort slots by period ascending so morning slots come first, then afternoon slots
    slots.sort((a, b) => a.period - b.period);

    return slots;
  } catch (err) {
    console.error("Error in getTeacherScheduleForDate:", err);
    return [];
  }
}

// Get students of a class for attendance
export async function getClassStudents(classId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    if (!(await isApprovedUser(session.user.id))) return [];

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
    const userRole = (session.user as any).role;
    const isManagement = userRole === "ADMIN" || userRole === "PRINCIPAL" || userRole === "VICE_PRINCIPAL";

    if (!teacher && !isManagement) return [];

    if (!isManagement && teacher) {
      const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
      const isHomeroom = classRoom?.homeroomTeacherId === teacher.id;
      const hasAccess = await prisma.teachingAssignment.findFirst({
        where: { teacherId: teacher.id, classId },
      });
      const hasSchedule = await prisma.schedule.findFirst({
        where: { teacherId: teacher.id, classId },
      });

      if (!hasAccess && !isHomeroom && !hasSchedule) return [];
    }

    const students = await prisma.student.findMany({
      where: {
        classId,
        status: { notIn: ["TRANSFERRED", "DROPPED_OUT", "GRADUATED"] },
      },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });

    if (students.length === 0) {
      return prisma.student.findMany({
        where: { classId },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      });
    }

    return students;
  } catch (err) {
    console.error("Error in getClassStudents:", err);
    return [];
  }
}

// Get attendance records for a specific class, date, and period
export async function getAttendanceByDateAndPeriod(classId: string, date: string, period: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { isLocked: false, existingData: [], lockedAt: null };

    if (!(await isApprovedUser(session.user.id))) return { isLocked: false, existingData: [], lockedAt: null };

    const { dateObj } = parseLocalDate(date);

    const existingData = await prisma.attendance.findMany({
      where: {
        classId,
        date: dateObj,
        period: Number(period),
      },
      include: { student: { include: { user: { select: { name: true } } } } },
    });

    const isLocked = existingData.length > 0;
    const lockedAt = isLocked ? existingData[0].createdAt.toISOString() : null;

    return {
      isLocked,
      existingData,
      lockedAt,
    };
  } catch (err) {
    console.error("Error in getAttendanceByDateAndPeriod:", err);
    return { isLocked: false, existingData: [], lockedAt: null };
  }
}

// Save attendance with strict check: Teacher MUST be scheduled to teach this class at this period, or be Homeroom teacher
export async function saveAttendance(
  classId: string,
  date: string,
  period: number,
  subjectId: string,
  records: { studentId: string; status: string; note?: string }[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  if (!(await isApprovedUser(session.user.id))) {
    return { success: false, error: "Tài khoản của bạn đang chờ Hiệu trưởng phê duyệt và cấp quyền dữ liệu." };
  }

  if (!period || period < 1 || period > 10) {
    return { success: false, error: "Vui lòng chọn Tiết học cụ thể để điểm danh" };
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  const userRole = (session.user as any).role;
  const isManagement = userRole === "ADMIN" || userRole === "PRINCIPAL" || userRole === "VICE_PRINCIPAL";

  if (!teacher && !isManagement) return { success: false, error: "Không tìm thấy thông tin giáo viên" };

  const classRoom = await prisma.classRoom.findUnique({ where: { id: classId } });
  if (!classRoom) return { success: false, error: "Không tìm thấy thông tin lớp học" };

  const { dateObj, dayOfWeek } = parseLocalDate(date);

  // Verify Schedule permission: Is teacher scheduled to teach this class/period, or assignment, or homeroom?
  if (!isManagement && teacher) {
    const isHomeroom = classRoom.homeroomTeacherId === teacher.id;
    const isScheduled = await prisma.schedule.findFirst({
      where: {
        teacherId: teacher.id,
        classId,
        dayOfWeek,
        period,
      },
    });
    const isAssigned = await prisma.teachingAssignment.findFirst({
      where: { teacherId: teacher.id, classId },
    });

    if (!isScheduled && !isAssigned && !isHomeroom) {
      return {
        success: false,
        error: `Bạn không có ca dạy Lớp ${classRoom.name} vào Tiết ${period} ngày ${date}. Không thể thực hiện điểm danh!`,
      };
    }
  }

  try {
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

    revalidatePath("/teacher/attendance");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/daily-summary");
    revalidatePath("/vice-principal/dashboard");
    revalidatePath("/vice-principal/attendance");
    revalidatePath("/student/attendance");
    return { success: true };
  } catch (error: any) {
    console.error("Error in saveAttendance:", error);
    return { success: false, error: error.message || "Lỗi khi lưu điểm danh" };
  }
}
