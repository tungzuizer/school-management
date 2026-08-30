"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper: lấy student từ session user
async function getStudentFromSession() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        classRoom: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!student) return null;

    return { student, userId: session.user.id };
  } catch (error) {
    console.error("Error in getStudentFromSession:", error);
    return null;
  }
}

function parseLocalDate(dateStr?: string): Date {
  if (!dateStr) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekDays(dateStr?: string) {
  const baseDate = parseLocalDate(dateStr);
  const todayStr = formatDateStr(new Date());

  const jsDay = baseDate.getDay();
  const diffToMon = jsDay === 0 ? 6 : jsDay - 1;

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const dayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = formatDateStr(d);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    days.push({
      dayOfWeek: i + 1,
      label: dayLabels[i],
      dateStr: dStr,
      formattedDate: `${dd}/${mm}`,
      isToday: dStr === todayStr,
      dateObj: d,
    });
  }

  return { monday, sunday, days, selectedDateStr: formatDateStr(baseDate) };
}

// Dashboard data
export async function getStudentDashboardData() {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student, userId } = result;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const today = new Date();
    const dayOfWeek = today.getDay();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [
      grades,
      absentDays,
      lateDays,
      commendations,
      recentNotifications,
      todaySchedule,
      seatingChart,
    ] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId: student.id },
      }),
      prisma.attendance.count({
        where: {
          studentId: student.id,
          status: { in: ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] },
          date: { gte: thirtyDaysAgo },
        },
      }),
      prisma.attendance.count({
        where: {
          studentId: student.id,
          status: "LATE",
          date: { gte: thirtyDaysAgo },
        },
      }),
      prisma.incident.findMany({
        where: {
          studentId: student.id,
          type: "COMMENDATION",
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          sender: { select: { name: true, role: true } },
        },
      }),
      student.classId
        ? prisma.schedule.findMany({
            where: {
              classId: student.classId,
              dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek,
            },
            include: {
              subject: true,
              teacher: { include: { user: true } },
            },
            orderBy: { period: "asc" },
          })
        : Promise.resolve([]),
      student.classId
        ? prisma.seatingChart.findUnique({
            where: { classId_month_year: { classId: student.classId, month, year } },
          })
        : Promise.resolve(null),
    ]);

    let seatPosition: string | null = null;
    if (seatingChart?.layoutJson) {
      try {
        const parsed = JSON.parse(seatingChart.layoutJson);
        if (parsed.seats) {
          for (const [key, stId] of Object.entries(parsed.seats)) {
            if (stId === student.id) {
              const row = key[0];
              const col = key.slice(1);
              seatPosition = `Hàng ${row} - Ghế ${col} (Sơ đồ lớp học)`;
              break;
            }
          }
        }
      } catch {
        seatPosition = null;
      }
    }

    let avgScore = 0;
    if (grades.length > 0) {
      avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
    }

    let academicRating = "Chưa xếp loại";
    if (grades.length > 0) {
      if (avgScore >= 8.0) academicRating = "Giỏi";
      else if (avgScore >= 6.5) academicRating = "Khá";
      else if (avgScore >= 5.0) academicRating = "Đạt";
      else academicRating = "Chưa đạt";
    }

    return {
      student: {
        id: student.id,
        name: student.user.name,
        className: student.classRoom?.name || "Chưa phân lớp",
        schoolName: student.classRoom?.school?.name || "",
        studentCode: (student as Record<string, unknown>).studentCode as string | null,
        seatPosition: seatPosition || "Chưa xếp vị trí",
        bonusPoints: student.bonusPoints || 0,
      },
      stats: {
        avgScore: Math.round(avgScore * 100) / 100,
        absentDays,
        lateDays,
        academicRating,
        totalGrades: grades.length,
      },
      commendations: commendations.map((c) => ({
        id: c.id,
        description: c.description,
        date: c.date.toISOString(),
        reportedBy: c.reportedBy || "Giáo viên",
      })),
      recentNotifications: recentNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        senderName: n.sender?.name || "Hệ thống",
        createdAt: n.createdAt.toISOString(),
      })),
      todaySchedule: todaySchedule.map((s) => ({
        period: s.period,
        subjectName: s.subject.name,
        teacherName: s.teacher?.user?.name || "Giáo viên",
        room: s.room,
      })),
    };
  } catch (error) {
    console.error("Error in getStudentDashboardData:", error);
    return null;
  }
}

// Bảng điểm
export async function getStudentGrades(term?: number) {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student } = result;

    const whereClause: Record<string, unknown> = { studentId: student.id };
    if (term) whereClause.term = term;

    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        subject: true,
      },
      orderBy: [{ subject: { name: "asc" } }, { type: "asc" }],
    });

    const gradesBySubject: Record<
      string,
      {
        subjectId: string;
        subjectName: string;
        grades: { type: string; score: number; term: number }[];
        avgScore: number;
      }
    > = {};

    grades.forEach((g) => {
      if (!gradesBySubject[g.subjectId]) {
        gradesBySubject[g.subjectId] = {
          subjectId: g.subjectId,
          subjectName: g.subject.name,
          grades: [],
          avgScore: 0,
        };
      }
      gradesBySubject[g.subjectId].grades.push({
        type: g.type,
        score: g.score,
        term: g.term,
      });
    });

    Object.values(gradesBySubject).forEach((subject) => {
      let totalWeighted = 0;
      let totalWeight = 0;
      subject.grades.forEach((g) => {
        let weight = 1;
        if (g.type === "MIDTERM") weight = 2;
        if (g.type === "FINAL") weight = 3;
        totalWeighted += g.score * weight;
        totalWeight += weight;
      });
      subject.avgScore =
        totalWeight > 0
          ? Math.round((totalWeighted / totalWeight) * 100) / 100
          : 0;
    });

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "",
      subjects: Object.values(gradesBySubject),
    };
  } catch (error) {
    console.error("Error in getStudentGrades:", error);
    return null;
  }
}

// Điểm danh
export async function getStudentAttendance(month?: number, year?: number) {
  try {
    const result = await getStudentFromSession();
    if (!result?.student) return null;
    const { student } = result;

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: "asc" }, { period: "asc" }],
    });

    const totalPresent = attendances.filter(
      (a) => String(a.status) === "PRESENT"
    ).length;
    const totalAbsentExcused = attendances.filter(
      (a) => String(a.status) === "ABSENT_EXCUSED"
    ).length;
    const totalAbsentUnexcused = attendances.filter(
      (a) => String(a.status) === "ABSENT_UNEXCUSED"
    ).length;
    const totalLate = attendances.filter(
      (a) => String(a.status) === "LATE"
    ).length;

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "",
      month: targetMonth,
      year: targetYear,
      records: attendances.map((a) => ({
        id: a.id,
        date: a.date.toISOString().split("T")[0],
        period: a.period,
        status: String(a.status),
        note: a.note,
      })),
      summary: {
        total: attendances.length,
        present: totalPresent,
        absentExcused: totalAbsentExcused,
        absentUnexcused: totalAbsentUnexcused,
        late: totalLate,
        attendanceRate:
          attendances.length > 0
            ? Math.round((totalPresent / attendances.length) * 100)
            : 100,
      },
    };
  } catch (error) {
    console.error("Error in getStudentAttendance:", error);
    return null;
  }
}

export interface StudentScheduleDayHeader {
  dayOfWeek: number;
  label: string;
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
}

export interface StudentScheduleSlot {
  id: string;
  dayOfWeek: number;
  dateStr: string;
  period: number;
  subjectName: string;
  teacherName: string;
  room: string | null;
  attendanceStatus?: string | null;
}

export interface StudentNotificationItem {
  id: string;
  title: string;
  content: string;
  type?: string;
  senderName: string;
  createdAt: string;
  isImportant?: boolean;
}

export interface StudentScheduleData {
  studentName: string;
  className: string;
  schoolName: string;
  selectedDateStr: string;
  days: StudentScheduleDayHeader[];
  schedules: StudentScheduleSlot[];
  notifications: StudentNotificationItem[];
}

export async function getStudentSchedule(dateStr?: string): Promise<StudentScheduleData | null> {
  try {
    const result = await getStudentFromSession();
    if (!result?.student || !result.student.classId) return null;
    const { student, userId } = result;
    const classId = student.classId as string;

    const { monday, sunday, days, selectedDateStr } = getWeekDays(dateStr);

    const [schedules, attendances, notifications] = await Promise.all([
      prisma.schedule.findMany({
        where: { classId: classId },
        include: {
          subject: true,
          teacher: { include: { user: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      }),
      prisma.attendance.findMany({
        where: {
          studentId: student.id,
          date: { gte: monday, lte: sunday },
        },
        select: { period: true, date: true, status: true },
      }),
      prisma.notification.findMany({
        where: {
          OR: [
            { receiverId: userId },
            { receiverId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          sender: { select: { name: true, role: true } },
        },
      }),
    ]);

    const attendanceMap = new Map<string, string>();
    attendances.forEach((att) => {
      const dStr = formatDateStr(att.date);
      attendanceMap.set(`${att.period}_${dStr}`, String(att.status));
    });

    const slots: StudentScheduleSlot[] = [];
    days.forEach((dayHeader) => {
      const daySchedules = schedules.filter((s) => s.dayOfWeek === dayHeader.dayOfWeek);
      daySchedules.forEach((s) => {
        const status = attendanceMap.get(`${s.period}_${dayHeader.dateStr}`) || null;
        slots.push({
          id: `${s.id}_${dayHeader.dateStr}`,
          dayOfWeek: s.dayOfWeek,
          dateStr: dayHeader.dateStr,
          period: s.period,
          subjectName: s.subject.name,
          teacherName: s.teacher?.user?.name || "Giáo viên bộ môn",
          room: s.room,
          attendanceStatus: status,
        });
      });
    });

    const formattedNotifications: StudentNotificationItem[] = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      type: "Thông báo",
      senderName: n.sender?.name || "BGH Nhà trường",
      createdAt: new Date(n.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isImportant: n.title.toLowerCase().includes("thông báo") || n.title.toLowerCase().includes("lịch"),
    }));

    return {
      studentName: student.user.name,
      className: student.classRoom?.name || "Chưa xếp lớp",
      schoolName: student.classRoom?.school?.name || "Trường THCS",
      selectedDateStr,
      days: days.map(({ dateObj, ...rest }) => rest),
      schedules: slots,
      notifications: formattedNotifications,
    };
  } catch (error) {
    console.error("Error in getStudentSchedule:", error);
    return null;
  }
}
