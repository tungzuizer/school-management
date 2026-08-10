"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, StudentStatus, ReportStatus } from "@prisma/client";

// All queries are campus-scoped: only return data for classes belonging to the VP's campus

export async function getVPDashboardStats(campusId: string) {
  const campusFilter = { classRoom: { campusId } };

  const [totalStudents, totalClasses] = await Promise.all([
    prisma.student.count({
      where: { status: StudentStatus.STUDYING, ...campusFilter },
    }),
    prisma.classRoom.count({ where: { campusId } }),
  ]);

  // Count teachers assigned to classes in this campus
  const totalTeachers = await prisma.teacher.count({
    where: {
      OR: [
        { homeroomClasses: { some: { campusId } } },
        { teachingAssignments: { some: { classRoom: { campusId } } } },
      ],
    },
  });

  // Attendance rate last 30 days for campus classes
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const classIds = (
    await prisma.classRoom.findMany({
      where: { campusId },
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

  // School points in this campus
  const totalSchoolPoints = await prisma.schoolPoint.count({
    where: { campusId },
  });

  return {
    totalStudents,
    totalTeachers,
    totalClasses,
    totalSchoolPoints,
    attendanceRate,
  };
}

export async function getVPAttendanceByWeek(campusId: string) {
  const classIds = (
    await prisma.classRoom.findMany({
      where: { campusId },
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
      present,
      absent: absentExcused + absentUnexcused,
      late,
    });
  }

  return weeks;
}

export async function getVPGradesByClass(campusId: string) {
  const classes = await prisma.classRoom.findMany({
    where: { campusId },
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
}

export async function getVPClassAttendanceRanking(campusId: string) {
  const classes = await prisma.classRoom.findMany({
    where: { campusId },
    include: {
      _count: {
        select: { students: true },
      },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

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
        total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 100;

      return {
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        studentCount: cls._count.students,
        attendanceRate: rate,
      };
    })
  );

  return results.sort((a, b) => b.attendanceRate - a.attendanceRate);
}

export async function getVPRecentIncidents(campusId: string, limit = 10) {
  const classIds = (
    await prisma.classRoom.findMany({
      where: { campusId },
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
}

export async function getVPTodaySummary(campusId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const classIds = (
    await prisma.classRoom.findMany({
      where: { campusId },
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
      prisma.classRoom.count({ where: { campusId } }),
      prisma.dailyReport.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: ReportStatus.SENT,
          classRoom: { campusId },
        },
      }),
    ]);

  return {
    absentToday,
    lateToday,
    incidentsToday,
    totalClasses,
    reportsSubmitted,
  };
}

export async function getVPCampusInfo(campusId: string) {
  const campus = await prisma.campus.findUnique({
    where: { id: campusId },
    include: {
      school: { select: { name: true } },
      schoolPoints: {
        select: { id: true, name: true, address: true, distanceKm: true, managerName: true },
        orderBy: { distanceKm: "asc" },
      },
    },
  });

  return campus;
}
