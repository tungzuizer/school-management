"use server";

import { prisma } from "@/lib/prisma";

export async function getScheduleData(classId?: string) {
  const classes = await prisma.classRoom.findMany({
    select: { id: true, name: true, gradeLevel: true },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  if (!classId && classes.length > 0) {
    classId = classes[0].id;
  }

  const schedules = classId
    ? await prisma.schedule.findMany({
        where: { classId },
        include: {
          subject: { select: { name: true } },
          teacher: {
            select: { user: { select: { name: true } } },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      })
    : [];

  return { classes, schedules, selectedClassId: classId || "" };
}

export async function getScheduleFormData() {
  const [subjects, teachers] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        specialty: true,
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return { subjects, teachers };
}

export async function createScheduleEntry(data: {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
  room?: string;
}) {
  // Check for conflict (same class, same day, same period)
  const existing = await prisma.schedule.findFirst({
    where: {
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
    },
  });

  if (existing) {
    return { error: "Đã có tiết học trong thời gian này cho lớp này" };
  }

  // Check teacher conflict (same teacher, same day, same period)
  const teacherConflict = await prisma.schedule.findFirst({
    where: {
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
    },
  });

  if (teacherConflict) {
    return { error: "Giáo viên đã có lịch dạy trong thời gian này" };
  }

  await prisma.schedule.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
      room: data.room || null,
    },
  });

  return { success: true };
}

export async function deleteScheduleEntry(id: string) {
  await prisma.schedule.delete({ where: { id } });
  return { success: true };
}
