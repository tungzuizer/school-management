"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, StudentStatus, ReportStatus } from "@prisma/client";

// All queries are campus-scoped: only return data for classes belonging to the VP's campus

export async function getVPDashboardStats(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const campusFilter = { classRoom: { campusId: effectiveCampusId } };

    const [totalStudents, totalClasses] = await Promise.all([
      prisma.student.count({
        where: { status: StudentStatus.STUDYING, ...campusFilter },
      }),
      prisma.classRoom.count({ where: { campusId: effectiveCampusId } }),
    ]);

    const totalTeachers = await prisma.teacher.count({
      where: {
        OR: [
          { homeroomClasses: { some: { campusId: effectiveCampusId } } },
          { teachingAssignments: { some: { classRoom: { campusId: effectiveCampusId } } } },
        ],
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const classIds = (
      await prisma.classRoom.findMany({
        where: { campusId: effectiveCampusId },
        select: { id: true },
      })
    ).map((c) => c.id);

    const [totalAttendance, presentAttendance] = await Promise.all([
      prisma.attendance.count({
        where: { date: { gte: thirtyDaysAgo }, classId: { in: classIds } },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: thirtyDaysAgo },
          classId: { in: classIds },
          status: AttendanceStatus.PRESENT,
        },
      }),
    ]);

    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100 * 10) / 10
        : 0;

    const totalSchoolPoints = await prisma.schoolPoint.count({
      where: { campusId: effectiveCampusId },
    });

    return {
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      totalClasses: totalClasses || 0,
      totalSchoolPoints: totalSchoolPoints || 0,
      attendanceRate: attendanceRate || 0,
    };
  } catch (err) {
    console.error("getVPDashboardStats error:", err);
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSchoolPoints: 0,
      attendanceRate: 0,
    };
  }
}

export async function getVPAttendanceByWeek(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const classIds = (
      await prisma.classRoom.findMany({
        where: { campusId: effectiveCampusId },
        select: { id: true },
      })
    ).map((c) => c.id);

    const weeks: {
      week: string;
      present: number;
      absent: number;
      late: number;
    }[] = [];

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const baseWhere = {
        date: { gte: weekStart, lt: weekEnd },
        classId: { in: classIds },
      };

      const [present, absentExcused, absentUnexcused, late] = await Promise.all([
        prisma.attendance.count({
          where: { ...baseWhere, status: AttendanceStatus.PRESENT },
        }),
        prisma.attendance.count({
          where: { ...baseWhere, status: AttendanceStatus.ABSENT_EXCUSED },
        }),
        prisma.attendance.count({
          where: { ...baseWhere, status: AttendanceStatus.ABSENT_UNEXCUSED },
        }),
        prisma.attendance.count({
          where: { ...baseWhere, status: AttendanceStatus.LATE },
        }),
      ]);

      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeks.push({
        week: weekLabel,
        present: present || 0,
        absent: absentExcused + absentUnexcused || 0,
        late: late || 0,
      });
    }

    return weeks;
  } catch (err) {
    console.error("getVPAttendanceByWeek error:", err);
    return [];
  }
}

export async function getVPGradesByClass(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const classes = await prisma.classRoom.findMany({
      where: { campusId: effectiveCampusId },
      include: {
        students: {
          where: { status: StudentStatus.STUDYING },
          include: {
            grades: {
              select: { score: true },
            },
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    if (!classes || classes.length === 0) {
      return [];
    }

    return classes.map((cls) => {
      const allScores = cls.students.flatMap((s) =>
        s.grades.map((g) => g.score)
      );
      const avg =
        allScores.length > 0
          ? Math.round(
              (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100
            ) / 100
          : 0;
      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        studentCount: cls.students.length,
        avgScore: avg,
      };
    });
  } catch (err) {
    console.error("getVPGradesByClass error:", err);
    return [];
  }
}

export async function getVPClassAttendanceRanking(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const classes = await prisma.classRoom.findMany({
      where: { campusId: effectiveCampusId },
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    if (!classes || classes.length === 0) {
      return [];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const results = await Promise.all(
      classes.map(async (cls) => {
        const [total, present] = await Promise.all([
          prisma.attendance.count({
            where: { classId: cls.id, date: { gte: sevenDaysAgo } },
          }),
          prisma.attendance.count({
            where: {
              classId: cls.id,
              date: { gte: sevenDaysAgo },
              status: AttendanceStatus.PRESENT,
            },
          }),
        ]);

        const rate =
          total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

        return {
          className: cls.name,
          gradeLevel: cls.gradeLevel,
          studentCount: cls._count.students || 0,
          attendanceRate: rate,
        };
      })
    );

    return results.sort((a, b) => b.attendanceRate - a.attendanceRate);
  } catch (err) {
    console.error("getVPClassAttendanceRanking error:", err);
    return [];
  }
}

export async function getVPRecentIncidents(campusId: string, limit = 10) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const classIds = (
      await prisma.classRoom.findMany({
        where: { campusId: effectiveCampusId },
        select: { id: true },
      })
    ).map((c) => c.id);

    const incidents = await prisma.incident.findMany({
      take: limit,
      orderBy: { date: "desc" },
      where: {
        student: { classId: { in: classIds } },
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            classRoom: { select: { name: true } },
          },
        },
      },
    });

    return incidents.map((inc) => ({
      id: inc.id,
      date: inc.date.toISOString(),
      type: inc.type,
      studentName: inc.student.user.name,
      className: inc.student.classRoom?.name || "—",
      description: inc.description,
    }));
  } catch (err) {
    console.error("getVPRecentIncidents error:", err);
    return [];
  }
}

export async function getVPTodaySummary(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({ select: { id: true } });
      if (firstCampus) effectiveCampusId = firstCampus.id;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const classIds = (
      await prisma.classRoom.findMany({
        where: { campusId: effectiveCampusId },
        select: { id: true },
      })
    ).map((c) => c.id);

    const baseWhere = {
      date: { gte: todayStart, lte: todayEnd },
      classId: { in: classIds },
    };

    const [absentToday, lateToday, incidentsToday, totalClasses, reportsSubmitted] =
      await Promise.all([
        prisma.attendance.count({
          where: {
            ...baseWhere,
            status: {
              in: [
                AttendanceStatus.ABSENT_EXCUSED,
                AttendanceStatus.ABSENT_UNEXCUSED,
              ],
            },
          },
        }),
        prisma.attendance.count({
          where: { ...baseWhere, status: AttendanceStatus.LATE },
        }),
        prisma.incident.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            student: { classId: { in: classIds } },
          },
        }),
        prisma.classRoom.count({ where: { campusId: effectiveCampusId } }),
        prisma.dailyReport.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            status: ReportStatus.SENT,
            classRoom: { campusId: effectiveCampusId },
          },
        }),
      ]);

    return {
      absentToday: absentToday || 0,
      lateToday: lateToday || 0,
      incidentsToday: incidentsToday || 0,
      totalClasses: totalClasses || 0,
      reportsSubmitted: reportsSubmitted || 0,
    };
  } catch (err) {
    console.error("getVPTodaySummary error:", err);
    return {
      absentToday: 0,
      lateToday: 0,
      incidentsToday: 0,
      totalClasses: 0,
      reportsSubmitted: 0,
    };
  }
}

export async function getVPCampusInfo(campusId: string) {
  try {
    let effectiveCampusId = campusId;
    if (!effectiveCampusId || effectiveCampusId.startsWith("demo")) {
      const firstCampus = await prisma.campus.findFirst({
        include: {
          school: { select: { name: true } },
          schoolPoints: {
            select: { id: true, name: true, address: true, distanceKm: true, managerName: true },
            orderBy: { distanceKm: "asc" },
          },
        },
      });
      if (firstCampus) return firstCampus;
    }

    const campus = await prisma.campus.findUnique({
      where: { id: effectiveCampusId },
      include: {
        school: { select: { name: true } },
        schoolPoints: {
          select: { id: true, name: true, address: true, distanceKm: true, managerName: true },
          orderBy: { distanceKm: "asc" },
        },
      },
    });

    return campus;
  } catch (err) {
    console.error("getVPCampusInfo error:", err);
    return null;
  }
}
