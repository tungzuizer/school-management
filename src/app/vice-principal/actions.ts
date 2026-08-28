"use server";

import { prisma } from "@/lib/prisma";
import { StudentStatus, AttendanceStatus } from "@prisma/client";

async function getEffectiveCampusId(campusId: string) {
  if (!campusId || campusId.startsWith("demo")) {
    const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
    if (firstCampus) return firstCampus.id;
  }
  return campusId;
}

export async function getVPClasses(campusId: string) {
  try {
    const effectiveCampusId = await getEffectiveCampusId(campusId);
    const classes = await prisma.classRoom.findMany({
      where: { campusId: effectiveCampusId },
      include: {
        school: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        homeroomTeacher: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    return classes;
  } catch (err) {
    console.error("getVPClasses error:", err);
    return [];
  }
}

export async function getVPStudents(campusId: string) {
  try {
    const effectiveCampusId = await getEffectiveCampusId(campusId);
    const students = await prisma.student.findMany({
      where: { classRoom: { campusId: effectiveCampusId } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        classRoom: { select: { id: true, name: true, gradeLevel: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    if (students.length === 0) {
      return prisma.student.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          classRoom: { select: { id: true, name: true, gradeLevel: true } },
        },
        orderBy: { user: { name: "asc" } },
        take: 200,
      });
    }

    return students;
  } catch (err) {
    console.error("getVPStudents error:", err);
    return [];
  }
}

export async function getVPAttendanceData(campusId: string) {
  try {
    const effectiveCampusId = await getEffectiveCampusId(campusId);
    const classes = await prisma.classRoom.findMany({
      where: { campusId: effectiveCampusId },
      include: { _count: { select: { students: true } } },
    });

    if (classes.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const classIds = classes.map((c) => c.id);
    const attendanceGroups = await prisma.attendance.groupBy({
      by: ["classId", "status"],
      where: {
        classId: { in: classIds },
        date: { gte: today },
      },
      _count: { _all: true },
    });

    const statsMap = new Map<string, { present: number; absent: number; late: number }>();
    attendanceGroups.forEach((g) => {
      const cur = statsMap.get(g.classId) || { present: 0, absent: 0, late: 0 };
      if (g.status === AttendanceStatus.PRESENT) {
        cur.present += g._count._all;
      } else if (
        g.status === AttendanceStatus.ABSENT_EXCUSED ||
        g.status === AttendanceStatus.ABSENT_UNEXCUSED
      ) {
        cur.absent += g._count._all;
      } else if (g.status === AttendanceStatus.LATE) {
        cur.late += g._count._all;
      }
      statsMap.set(g.classId, cur);
    });

    const classSummaries = classes.map((cls) => {
      const counts = statsMap.get(cls.id) || { present: 0, absent: 0, late: 0 };
      const total = cls._count.students || 0;
      const rate = total > 0 ? Math.round(((counts.present + counts.late) / total) * 100) : 0;

      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        totalStudents: total,
        presentCount: counts.present,
        absentCount: counts.absent,
        lateCount: counts.late,
        rate: rate > 100 ? 100 : rate,
      };
    });

    return classSummaries;
  } catch (err) {
    console.error("getVPAttendanceData error:", err);
    return [];
  }
}

export async function getVPJournals(campusId: string) {
  try {
    const effectiveCampusId = await getEffectiveCampusId(campusId);
    const entries = await prisma.classJournalEntry.findMany({
      where: { classRoom: { campusId: effectiveCampusId } },
      include: {
        classRoom: { select: { name: true } },
        teacher: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 20,
    });

    return entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      className: e.classRoom.name,
      teacherName: e.teacher?.user?.name || "—",
      subjectName: e.subject?.name || "Môn học",
      period: e.period,
      lessonTitle: e.lessonTitle || "",
      content: e.content || "",
    }));
  } catch (err) {
    console.error("getVPJournals error:", err);
    return [];
  }
}

export async function getVPLessonPlans(campusId: string) {
  try {
    const effectiveCampusId = await getEffectiveCampusId(campusId);
    const plans = await prisma.lessonPlan.findMany({
      where: {
        teacher: {
          OR: [
            { homeroomClasses: { some: { campusId: effectiveCampusId } } },
            { teachingAssignments: { some: { classRoom: { campusId: effectiveCampusId } } } },
          ],
        },
      },
      include: {
        teacher: { select: { user: { select: { name: true } } } },
        subject: { select: { name: true } },
        classRoom: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return plans.map((p) => ({
      id: p.id,
      title: p.title || "Kế hoạch bài dạy",
      status: p.status || "DRAFT",
      teacherName: p.teacher?.user?.name || "Giáo viên",
      subjectName: p.subject?.name || "Môn học",
      className: p.classRoom?.name || "Toàn khối",
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error("getVPLessonPlans error:", err);
    return [];
  }
}

export async function getVPWarnings(campusId: string) {
  try {
    const warnings = await prisma.earlyWarning.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return warnings.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      level: w.level,
      category: w.category,
      resolved: w.isResolved,
      createdAt: w.createdAt.toISOString(),
    }));
  } catch (err) {
    console.error("getVPWarnings error:", err);
    return [];
  }
}
