"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, StudentStatus, ReportStatus } from "@prisma/client";

export async function getDashboardStats() {
  try {
    const [totalStudents, totalTeachers, totalClasses, totalSchools] =
      await Promise.all([
        prisma.student.count({ where: { status: StudentStatus.STUDYING } }),
        prisma.teacher.count(),
        prisma.classRoom.count(),
        prisma.school.count(),
      ]);

    // Attendance rate last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalAttendance, presentAttendance] = await Promise.all([
      prisma.attendance.count({
        where: { date: { gte: thirtyDaysAgo } },
      }),
      prisma.attendance.count({
        where: {
          date: { gte: thirtyDaysAgo },
          status: AttendanceStatus.PRESENT,
        },
      }),
    ]);

    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100 * 10) / 10
        : 0;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSchools,
      attendanceRate,
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSchools: 0,
      attendanceRate: 0,
    };
  }
}

export async function getAttendanceByWeek() {
  try {
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

      const [present, absentExcused, absentUnexcused, late] = await Promise.all([
        prisma.attendance.count({
          where: {
            date: { gte: weekStart, lt: weekEnd },
            status: AttendanceStatus.PRESENT,
          },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: weekStart, lt: weekEnd },
            status: AttendanceStatus.ABSENT_EXCUSED,
          },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: weekStart, lt: weekEnd },
            status: AttendanceStatus.ABSENT_UNEXCUSED,
          },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: weekStart, lt: weekEnd },
            status: AttendanceStatus.LATE,
          },
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
  } catch (error) {
    console.error("Error in getAttendanceByWeek:", error);
    return [];
  }
}

export async function getGradesByClass() {
  try {
    const classes = await prisma.classRoom.findMany({
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
  } catch (error) {
    console.error("Error in getGradesByClass:", error);
    return [];
  }
}

export async function getClassAttendanceRanking() {
  try {
    const classes = await prisma.classRoom.findMany({
      include: {
        _count: {
          select: {
            students: true,
          },
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
          total > 0
            ? Math.round((present / total) * 100 * 10) / 10
            : 100;

        return {
          className: cls.name,
          gradeLevel: cls.gradeLevel,
          studentCount: cls._count.students,
          attendanceRate: rate,
        };
      })
    );

    return results.sort((a, b) => b.attendanceRate - a.attendanceRate);
  } catch (error) {
    console.error("Error in getClassAttendanceRanking:", error);
    return [];
  }
}

export async function getRecentIncidents(limit = 10) {
  try {
    const incidents = await prisma.incident.findMany({
      take: limit,
      orderBy: { date: "desc" },
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
      studentName: inc.student?.user?.name || "Học sinh",
      className: inc.student?.classRoom?.name || "—",
      description: inc.description,
    }));
  } catch (error) {
    console.error("Error in getRecentIncidents:", error);
    return [];
  }
}

export async function getTodaySummary() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [absentToday, lateToday, incidentsToday, totalClasses, reportsSubmitted] =
      await Promise.all([
        prisma.attendance.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            status: { in: [AttendanceStatus.ABSENT_EXCUSED, AttendanceStatus.ABSENT_UNEXCUSED] },
          },
        }),
        prisma.attendance.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            status: AttendanceStatus.LATE,
          },
        }),
        prisma.incident.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.classRoom.count(),
        prisma.dailyReport.count({
          where: {
            date: { gte: todayStart, lte: todayEnd },
            status: ReportStatus.SENT,
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
  } catch (error) {
    console.error("Error in getTodaySummary:", error);
    return {
      absentToday: 0,
      lateToday: 0,
      incidentsToday: 0,
      totalClasses: 0,
      reportsSubmitted: 0,
    };
  }
}
