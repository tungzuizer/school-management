"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ScheduleDayHeader {
  dayOfWeek: number; // 1=Mon..7=Sun
  label: string; // e.g. "Thứ 2"
  dateStr: string; // e.g. "2026-08-17"
  formattedDate: string; // e.g. "17/08"
  isToday: boolean;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 1=Mon..7=Sun
  dateStr: string; // Exact date YYYY-MM-DD for this day of the week
  period: number;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  gradeLevel: number;
  room?: string | null;
  isHomeroom?: boolean;
  isAttendanceDone?: boolean; // Real DB status from prisma.attendance
}

export interface TeacherScheduleData {
  teacherName: string;
  specialty?: string | null;
  homeroomClassName?: string | null;
  totalPeriods: number;
  classesCount: number;
  selectedDateStr: string;
  days: ScheduleDayHeader[];
  slots: ScheduleSlot[];
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

  const jsDay = baseDate.getDay(); // 0=Sun, 1=Mon...6=Sat
  const diffToMon = jsDay === 0 ? 6 : jsDay - 1;

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const dayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

  const days: (ScheduleDayHeader & { dateObj: Date })[] = [];
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

export async function getTeacherSchedule(dateStr?: string): Promise<TeacherScheduleData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { name: true } },
      homeroomClasses: { select: { id: true, name: true } },
    },
  });

  if (!teacher) return null;

  const { monday, sunday, days, selectedDateStr } = getWeekDays(dateStr);

  // 1. Fetch real Timetable Schedule entries
  const schedules = await prisma.schedule.findMany({
    where: { teacherId: teacher.id },
    include: {
      classRoom: { select: { id: true, name: true, gradeLevel: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });

  const classIds = Array.from(new Set(schedules.map((s) => s.classId)));
  const homeroomName = teacher.homeroomClasses[0]?.name || null;

  // 2. Fetch real Attendance records for this teacher's classes during this week
  const attendanceRecords = classIds.length > 0
    ? await prisma.attendance.findMany({
        where: {
          classId: { in: classIds },
          date: { gte: monday, lte: sunday },
        },
        select: { classId: true, period: true, date: true },
      })
    : [];

  // Build lookup Set: "classId_period_YYYY-MM-DD"
  const attendanceDoneSet = new Set<string>();
  attendanceRecords.forEach((att) => {
    const attDateStr = formatDateStr(att.date);
    attendanceDoneSet.add(`${att.classId}_${att.period}_${attDateStr}`);
  });

  // Map schedule entries across days of week with dateStr and real attendance status
  const slots: ScheduleSlot[] = [];

  days.forEach((dayHeader) => {
    // Filter schedules matching this dayOfWeek (1..7)
    const daySchedules = schedules.filter((s) => s.dayOfWeek === dayHeader.dayOfWeek);

    daySchedules.forEach((s) => {
      const isDone = attendanceDoneSet.has(`${s.classId}_${s.period}_${dayHeader.dateStr}`);

      slots.push({
        id: `${s.id}_${dayHeader.dateStr}`,
        dayOfWeek: s.dayOfWeek,
        dateStr: dayHeader.dateStr,
        period: s.period,
        subjectId: s.subject.id,
        subjectName: s.subject.name,
        classId: s.classRoom.id,
        className: s.classRoom.name,
        gradeLevel: s.classRoom.gradeLevel,
        room: s.room,
        isHomeroom: teacher.homeroomClasses.some((h) => h.id === s.classId),
        isAttendanceDone: isDone,
      });
    });
  });

  return {
    teacherName: teacher.user.name,
    specialty: teacher.specialty,
    homeroomClassName: homeroomName,
    totalPeriods: schedules.length,
    classesCount: classIds.length,
    selectedDateStr,
    days: days.map(({ dateObj, ...rest }) => rest),
    slots,
  };
}
