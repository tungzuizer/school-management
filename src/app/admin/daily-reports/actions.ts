"use server";

import prisma from "@/lib/prisma";

// Get all daily reports for a specific date, optionally filtered by school
export async function getAdminDailyReports(date: string, schoolId?: string) {
  try {
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: startOfDay, lte: endOfDay },
    };
    if (schoolId) {
      where.classRoom = { schoolId };
    }

    return await prisma.dailyReport.findMany({
      where,
      include: {
        classRoom: {
          include: {
            school: true,
            campus: true,
            homeroomTeacher: { include: { user: true } },
          },
        },
      },
      orderBy: [{ absentCount: "desc" }],
    });
  } catch (err) {
    console.error("getAdminDailyReports error:", err);
    return [];
  }
}

// Get all schools for filter dropdown
export async function getSchoolsForFilter() {
  try {
    return await prisma.school.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch (err) {
    console.error("getSchoolsForFilter error:", err);
    return [];
  }
}

// Get report detail by ID
export async function getReportDetail(reportId: string) {
  try {
    return await prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        classRoom: {
          include: {
            school: true,
            campus: true,
            homeroomTeacher: { include: { user: true } },
          },
        },
      },
    });
  } catch (err) {
    console.error("getReportDetail error:", err);
    return null;
  }
}

// Get reports for a date range (for history/search)
export async function getReportsInRange(
  startDate: string,
  endDate: string,
  schoolId?: string,
  classId?: string
) {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      date: { gte: start, lte: end },
      status: "SENT",
    };
    if (schoolId) {
      where.classRoom = { schoolId };
    }
    if (classId) {
      where.classId = classId;
    }

    return await prisma.dailyReport.findMany({
      where,
      include: {
        classRoom: {
          include: {
            school: true,
            campus: true,
            homeroomTeacher: { include: { user: true } },
          },
        },
      },
      orderBy: [{ date: "desc" }, { absentCount: "desc" }],
    });
  } catch (err) {
    console.error("getReportsInRange error:", err);
    return [];
  }
}

// Get summary stats for the admin overview
export async function getDailyReportStats(date: string) {
  try {
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const reports = await prisma.dailyReport.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, status: "SENT" },
    });

    const totalClasses = await prisma.classRoom.count();
    const reportedClasses = reports.length;
    const totalAbsent = reports.reduce((sum, r) => sum + (r.absentCount || 0), 0);
    const totalLate = reports.reduce((sum, r) => sum + (r.lateCount || 0), 0);
    const classesWithIssues = reports.filter(
      (r) => (r.absentCount || 0) >= 3 || (r.incidentSummary && r.incidentSummary.includes("VIOLATION"))
    ).length;

    return {
      totalClasses,
      reportedClasses,
      unreportedClasses: Math.max(0, totalClasses - reportedClasses),
      totalAbsent,
      totalLate,
      classesWithIssues,
    };
  } catch (err) {
    console.error("getDailyReportStats error:", err);
    return {
      totalClasses: 0,
      reportedClasses: 0,
      unreportedClasses: 0,
      totalAbsent: 0,
      totalLate: 0,
      classesWithIssues: 0,
    };
  }
}
