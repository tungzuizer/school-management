"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 1=Mon..7=Sun
  period: number;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  gradeLevel: number;
  room?: string | null;
  isHomeroom?: boolean;
}

export interface TeacherScheduleData {
  teacherName: string;
  specialty?: string | null;
  homeroomClassName?: string | null;
  totalPeriods: number;
  classesCount: number;
  slots: ScheduleSlot[];
}

export async function getTeacherSchedule(): Promise<TeacherScheduleData | null> {
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

  const schedules = await prisma.schedule.findMany({
    where: { teacherId: teacher.id },
    include: {
      classRoom: { select: { id: true, name: true, gradeLevel: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });

  const uniqueClasses = new Set(schedules.map((s) => s.classId));
  const homeroomName = teacher.homeroomClasses[0]?.name || null;

  const slots: ScheduleSlot[] = schedules.map((s) => ({
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    period: s.period,
    subjectId: s.subject.id,
    subjectName: s.subject.name,
    classId: s.classRoom.id,
    className: s.classRoom.name,
    gradeLevel: s.classRoom.gradeLevel,
    room: s.room,
    isHomeroom: teacher.homeroomClasses.some((h) => h.id === s.classId),
  }));

  return {
    teacherName: teacher.user.name,
    specialty: teacher.specialty,
    homeroomClassName: homeroomName,
    totalPeriods: slots.length,
    classesCount: uniqueClasses.size,
    slots,
  };
}
