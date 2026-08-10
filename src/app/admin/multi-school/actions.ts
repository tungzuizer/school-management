"use server";

import { prisma } from "@/lib/prisma";

const ABSENT_STATUSES = ["ABSENT_EXCUSED", "ABSENT_UNEXCUSED"] as any[];

// Lấy tổng hợp liên trường: sĩ số, giáo viên, chuyên cần, điểm TB
export async function getMultiSchoolOverview(dateFrom?: string, dateTo?: string) {
  const schools = await prisma.school.findMany({
    include: {
      classRooms: {
        include: {
          _count: { select: { students: true } },
          teachingAssignments: { select: { teacherId: true } },
        },
      },
      campuses: {
        include: {
          schoolPoints: {
            include: {
              classRooms: {
                include: {
                  _count: { select: { students: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const now = new Date();
  const from = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = dateTo ? new Date(dateTo) : now;

  const result = await Promise.all(
    schools.map(async (school) => {
      const classIds = school.classRooms.map((c) => c.id);
      const studentCount = school.classRooms.reduce((sum, c) => sum + c._count.students, 0);

      // Lấy unique teachers
      const teacherIds = new Set<string>();
      school.classRooms.forEach((c) => {
        c.teachingAssignments.forEach((ta: { teacherId: string }) => teacherIds.add(ta.teacherId));
      });

      // Tính chuyên cần
      let attendanceRate = 0;
      if (classIds.length > 0) {
        const totalAttendance = await prisma.attendance.count({
          where: { classId: { in: classIds }, date: { gte: from, lte: to } },
        });
        const absentCount = await prisma.attendance.count({
          where: {
            classId: { in: classIds },
            date: { gte: from, lte: to },
            status: { in: ABSENT_STATUSES },
          },
        });
        attendanceRate =
          totalAttendance > 0
            ? Math.round(((totalAttendance - absentCount) / totalAttendance) * 1000) / 10
            : 100;
      }

      // Tính điểm TB
      let avgScore = 0;
      if (classIds.length > 0) {
        const studentIdsResult = await prisma.student.findMany({
          where: { classId: { in: classIds } },
          select: { id: true },
        });
        const sIds = studentIdsResult.map((s: { id: string }) => s.id);
        if (sIds.length > 0) {
          const grades = await prisma.grade.aggregate({
            where: { studentId: { in: sIds } },
            _avg: { score: true },
          });
          avgScore = Math.round((grades._avg.score || 0) * 100) / 100;
        }
      }

      const schoolPointsCount = school.campuses.reduce((sum, c) => sum + (c.schoolPoints?.length || 0), 0);

      const campusDetails = school.campuses.map((c) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        schoolPoints: c.schoolPoints.map((sp) => ({
          id: sp.id,
          name: sp.name,
          address: sp.address,
          distanceKm: sp.distanceKm,
          managerName: sp.managerName,
          phone: sp.phone,
          classCount: sp.classRooms.length,
          studentCount: sp.classRooms.reduce((sum, cl) => sum + cl._count.students, 0),
        })),
      }));

      return {
        id: school.id,
        name: school.name,
        address: school.address,
        campusCount: school.campuses.length,
        schoolPointsCount,
        classCount: school.classRooms.length,
        studentCount,
        teacherCount: teacherIds.size,
        attendanceRate,
        avgScore,
        campusDetails,
      };
    })
  );

  return result;
}

// Lấy xu hướng theo thời gian (theo tuần/tháng)
export async function getSchoolTrends(
  schoolId: string,
  period: "week" | "month",
  count: number = 6
) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { classRooms: { select: { id: true } } },
  });
  if (!school) return [];

  const classIds = school.classRooms.map((c: { id: string }) => c.id);
  if (classIds.length === 0) return [];

  const now = new Date();
  const trends = [];

  for (let i = count - 1; i >= 0; i--) {
    const periodEnd = new Date(now);
    const periodStart = new Date(now);

    if (period === "week") {
      periodEnd.setDate(now.getDate() - i * 7);
      periodStart.setDate(periodEnd.getDate() - 7);
    } else {
      periodEnd.setMonth(now.getMonth() - i);
      periodStart.setMonth(periodEnd.getMonth() - 1);
    }

    const totalAttendance = await prisma.attendance.count({
      where: { classId: { in: classIds }, date: { gte: periodStart, lte: periodEnd } },
    });
    const absentCount = await prisma.attendance.count({
      where: {
        classId: { in: classIds },
        date: { gte: periodStart, lte: periodEnd },
        status: { in: ABSENT_STATUSES },
      },
    });
    const attendanceRate =
      totalAttendance > 0
        ? Math.round(((totalAttendance - absentCount) / totalAttendance) * 1000) / 10
        : 100;

    const studentIds = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      select: { id: true },
    });
    const sIds = studentIds.map((s: { id: string }) => s.id);
    let avgScore = 0;
    if (sIds.length > 0) {
      const grades = await prisma.grade.aggregate({
        where: { studentId: { in: sIds } },
        _avg: { score: true },
      });
      avgScore = Math.round((grades._avg.score || 0) * 100) / 100;
    }

    const label =
      period === "week"
        ? `T${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`
        : `T${periodEnd.getMonth() + 1}/${periodEnd.getFullYear()}`;

    trends.push({ label, attendanceRate, avgScore });
  }

  return trends;
}

// Cảnh báo: trường/lớp có vấn đề
export async function getAlerts() {
  const ABSENCE_THRESHOLD = 15; // >15% vắng = cảnh báo

  const schools = await prisma.school.findMany({
    include: {
      classRooms: {
        include: {
          students: { select: { id: true } },
          homeroomTeacher: { include: { user: { select: { name: true } } } },
        },
      },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const alerts: {
    type: "danger" | "warning";
    school: string;
    className?: string;
    message: string;
  }[] = [];

  for (const school of schools) {
    for (const cls of school.classRooms) {
      if (cls.students.length === 0) continue;

      const totalRecords = await prisma.attendance.count({
        where: { classId: cls.id, date: { gte: monthStart, lte: now } },
      });
      const absentRecords = await prisma.attendance.count({
        where: {
          classId: cls.id,
          date: { gte: monthStart, lte: now },
          status: { in: ABSENT_STATUSES },
        },
      });

      if (totalRecords > 0) {
        const absentRate = Math.round((absentRecords / totalRecords) * 1000) / 10;
        if (absentRate > ABSENCE_THRESHOLD) {
          alerts.push({
            type: "danger",
            school: school.name,
            className: cls.name,
            message: `Tỷ lệ vắng ${absentRate}% (vượt ngưỡng ${ABSENCE_THRESHOLD}%)`,
          });
        } else if (absentRate > ABSENCE_THRESHOLD * 0.7) {
          alerts.push({
            type: "warning",
            school: school.name,
            className: cls.name,
            message: `Tỷ lệ vắng ${absentRate}% — gần ngưỡng cảnh báo`,
          });
        }
      }
    }

    // Kiểm tra điểm TB giảm (so sánh HK1 vs HK2 nếu có)
    const classIds = school.classRooms.map((c) => c.id);
    const studentIds = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      select: { id: true },
    });
    const sIds = studentIds.map((s: { id: string }) => s.id);

    if (sIds.length > 0) {
      const hk1Avg = await prisma.grade.aggregate({
        where: { studentId: { in: sIds }, term: 1 },
        _avg: { score: true },
      });
      const hk2Avg = await prisma.grade.aggregate({
        where: { studentId: { in: sIds }, term: 2 },
        _avg: { score: true },
      });

      if (hk1Avg._avg.score && hk2Avg._avg.score) {
        const diff = hk2Avg._avg.score - hk1Avg._avg.score;
        if (diff < -0.5) {
          alerts.push({
            type: "warning",
            school: school.name,
            message: `Điểm TB giảm ${Math.abs(Math.round(diff * 100) / 100)} điểm so với HK trước`,
          });
        }
      }
    }
  }

  return alerts;
}

// Xếp hạng trường
export async function getSchoolRankings(sortBy: "attendance" | "score" = "attendance") {
  const overview = await getMultiSchoolOverview();

  if (sortBy === "attendance") {
    return overview.sort((a, b) => b.attendanceRate - a.attendanceRate);
  }
  return overview.sort((a, b) => b.avgScore - a.avgScore);
}
