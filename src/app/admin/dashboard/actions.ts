/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/dashboard/page.tsx`.
 * 2. Affected APIs: `src/app/admin/dashboard/actions.ts` (`getNQ37DashboardSummary`, `getAdminDashboardData`).
 * 3. Schemas: Prisma models `School`, `Campus`, `User`, `ClassRoom`, `Teacher`, `Attendance`, `Student`, `Report`.
 * 4. Verbatim User Instruction: "sửa lại cấu trúc Bảng Điều Khiển Ban Giám Hiệu cho logic và phù hợp với những gì tôi mô tả về dự án"
 */

"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, StudentStatus, ReportStatus } from "@prisma/client";
import { calculateDeadlines, auditSchoolNQ37 } from "@/lib/nq37-engine";

export async function getSchoolsList() {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        campuses: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            classRooms: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const enrichedSchools = await Promise.all(
      schools.map(async (sch) => {
        const studentCount = await prisma.student.count({
          where: {
            OR: [
              { classRoom: { schoolId: sch.id } },
              { user: { schoolId: sch.id } },
            ],
          },
        });

        const teacherCount = await prisma.teacher.count({
          where: {
            OR: [
              { user: { schoolId: sch.id } },
              { homeroomClasses: { some: { schoolId: sch.id } } },
              { teachingAssignments: { some: { classRoom: { schoolId: sch.id } } } },
            ],
          },
        });

        return {
          id: sch.id,
          name: sch.name,
          address: sch.address,
          phone: sch.phone,
          email: sch.email,
          campusCount: sch.campuses.length,
          classCount: sch._count.classRooms,
          studentCount,
          teacherCount,
        };
      })
    );

    return enrichedSchools;
  } catch (error) {
    console.error("Error in getSchoolsList:", error);
    return [];
  }
}

export async function getDashboardStats(schoolId?: string) {
  try {
    const studentWhere = schoolId
      ? {
          OR: [
            { classRoom: { schoolId } },
            { user: { schoolId } },
          ],
        }
      : {};

    const classWhere = schoolId ? { schoolId } : {};

    const teacherCountPromise = schoolId
      ? prisma.teacher.count({
          where: {
            OR: [
              { user: { schoolId } },
              { homeroomClasses: { some: { schoolId } } },
              { teachingAssignments: { some: { classRoom: { schoolId } } } },
            ],
          },
        })
      : prisma.teacher.count();

    const [totalStudents, totalTeachers, totalClasses, totalSchools] =
      await Promise.all([
        prisma.student.count({ where: studentWhere }),
        teacherCountPromise,
        prisma.classRoom.count({ where: classWhere }),
        prisma.school.count(),
      ]);

    // Attendance rate last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceWhere = schoolId
      ? { date: { gte: thirtyDaysAgo }, classRoom: { schoolId } }
      : { date: { gte: thirtyDaysAgo } };

    const [totalAttendance, presentAttendance] = await Promise.all([
      prisma.attendance.count({
        where: attendanceWhere,
      }),
      prisma.attendance.count({
        where: {
          ...attendanceWhere,
          status: AttendanceStatus.PRESENT,
        },
      }),
    ]);

    const attendanceRate =
      totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100 * 10) / 10
        : 100;

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

export async function getAttendanceByWeek(schoolId?: string) {
  try {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const whereClause = schoolId
      ? { date: { gte: eightWeeksAgo }, classRoom: { schoolId } }
      : { date: { gte: eightWeeksAgo } };

    const records = await prisma.attendance.findMany({
      where: whereClause,
      select: { date: true, status: true },
    });

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

      let present = 0;
      let absent = 0;
      let late = 0;

      records.forEach((r) => {
        const d = new Date(r.date);
        if (d >= weekStart && d < weekEnd) {
          if (r.status === AttendanceStatus.PRESENT) present++;
          else if (
            r.status === AttendanceStatus.ABSENT_EXCUSED ||
            r.status === AttendanceStatus.ABSENT_UNEXCUSED
          )
            absent++;
          else if (r.status === AttendanceStatus.LATE) late++;
        }
      });

      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeks.push({
        week: weekLabel,
        present,
        absent,
        late,
      });
    }

    return weeks;
  } catch (error) {
    console.error("Error in getAttendanceByWeek:", error);
    return [];
  }
}

export async function getGradesByClass(schoolId?: string) {
  try {
    const whereClause = schoolId ? { schoolId } : {};

    const classes = await prisma.classRoom.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        school: { select: { name: true } },
        students: {
          where: { status: StudentStatus.STUDYING },
          select: {
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
        className: `${cls.name} (${cls.school?.name || ""})`,
        shortClassName: cls.name,
        schoolName: cls.school?.name || "",
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

export async function getClassAttendanceRanking(schoolId?: string) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const classWhere = schoolId ? { schoolId } : {};
    const attendanceWhere = schoolId
      ? { date: { gte: sevenDaysAgo }, classRoom: { schoolId } }
      : { date: { gte: sevenDaysAgo } };

    const [classes, attendanceRecords] = await Promise.all([
      prisma.classRoom.findMany({
        where: classWhere,
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          school: { select: { name: true } },
          _count: {
            select: { students: true },
          },
        },
        orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      }),
      prisma.attendance.findMany({
        where: attendanceWhere,
        select: { classId: true, status: true },
      }),
    ]);

    const attendanceMap = new Map<string, { total: number; present: number }>();
    attendanceRecords.forEach((rec) => {
      if (!rec.classId) return;
      const current = attendanceMap.get(rec.classId) || { total: 0, present: 0 };
      current.total++;
      if (rec.status === AttendanceStatus.PRESENT) {
        current.present++;
      }
      attendanceMap.set(rec.classId, current);
    });

    const results = classes.map((cls) => {
      const stats = attendanceMap.get(cls.id) || { total: 0, present: 0 };
      const rate =
        stats.total > 0
          ? Math.round((stats.present / stats.total) * 100 * 10) / 10
          : 100;

      return {
        className: cls.name,
        schoolName: cls.school?.name || "",
        gradeLevel: cls.gradeLevel,
        studentCount: cls._count.students,
        attendanceRate: rate,
      };
    });

    return results.sort((a, b) => b.attendanceRate - a.attendanceRate);
  } catch (error) {
    console.error("Error in getClassAttendanceRanking:", error);
    return [];
  }
}

export async function getRecentIncidents(limit = 10, schoolId?: string) {
  try {
    const whereClause = schoolId
      ? { student: { classRoom: { schoolId } } }
      : {};

    const incidents = await prisma.incident.findMany({
      where: whereClause,
      take: limit,
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        type: true,
        description: true,
        student: {
          select: {
            user: { select: { name: true } },
            classRoom: { select: { name: true, school: { select: { name: true } } } },
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
      schoolName: inc.student?.classRoom?.school?.name || "—",
      description: inc.description,
    }));
  } catch (error) {
    console.error("Error in getRecentIncidents:", error);
    return [];
  }
}

export async function getTodaySummary(schoolId?: string) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const attendanceWhere = schoolId
      ? { date: { gte: todayStart, lte: todayEnd }, classRoom: { schoolId } }
      : { date: { gte: todayStart, lte: todayEnd } };

    const incidentWhere = schoolId
      ? { date: { gte: todayStart, lte: todayEnd }, student: { classRoom: { schoolId } } }
      : { date: { gte: todayStart, lte: todayEnd } };

    const classWhere = schoolId ? { schoolId } : {};

    const reportWhere = schoolId
      ? { date: { gte: todayStart, lte: todayEnd }, status: ReportStatus.SENT, classRoom: { schoolId } }
      : { date: { gte: todayStart, lte: todayEnd }, status: ReportStatus.SENT };

    const [absentToday, lateToday, incidentsToday, totalClasses, reportsSubmitted] =
      await Promise.all([
        prisma.attendance.count({
          where: {
            ...attendanceWhere,
            status: { in: [AttendanceStatus.ABSENT_EXCUSED, AttendanceStatus.ABSENT_UNEXCUSED] },
          },
        }),
        prisma.attendance.count({
          where: {
            ...attendanceWhere,
            status: AttendanceStatus.LATE,
          },
        }),
        prisma.incident.count({
          where: incidentWhere,
        }),
        prisma.classRoom.count({ where: classWhere }),
        prisma.dailyReport.count({
          where: reportWhere,
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

export async function getNQ37DashboardSummary(schoolId?: string) {
  try {
    const defaultSchool = schoolId
      ? await prisma.school.findUnique({
          where: { id: schoolId },
          include: {
            campuses: true,
            classRooms: true,
            users: {
              include: { teacher: true, campus: true },
            },
          },
        })
      : await prisma.school.findFirst({
          orderBy: { createdAt: "asc" },
          include: {
            campuses: true,
            classRooms: true,
            users: {
              include: { teacher: true, campus: true },
            },
          },
        });

    const now = new Date("2026-09-02");
    const deadlines = calculateDeadlines(now);

    if (!defaultSchool) {
      return {
        deadlines,
        scorecard: null,
        schoolName: "Chưa có dữ liệu trường",
        hasCriticalViolations: false,
      };
    }

    const campuses = defaultSchool.campuses.map((c, index) => ({
      id: c.id,
      name: c.name,
      isMainCampus:
        index === 0 ||
        c.name.toLowerCase().includes("chính") ||
        c.name.toLowerCase().includes("trụ sở") ||
        c.name.toLowerCase().includes("lê hồng phong"),
    }));

    const mainCampus = campuses.find((c) => c.isMainCampus);
    const mainCampusId = mainCampus ? mainCampus.id : (campuses[0]?.id || "");

    const principalUsers = defaultSchool.users.filter(
      (u) =>
        u.role === "ADMIN" ||
        (u.teacher?.specialty && u.teacher.specialty.toLowerCase().includes("hiệu trưởng"))
    );

    const vicePrincipalUsers = defaultSchool.users.filter(
      (u) =>
        u.role === "VICE_PRINCIPAL" ||
        (u.teacher?.specialty && u.teacher.specialty.toLowerCase().includes("phó hiệu trưởng"))
    );

    const mainCampusViceCount = vicePrincipalUsers.filter(
      (u) => !u.campusId || u.campusId === mainCampusId
    ).length;

    const branchCampusViceCount = vicePrincipalUsers.filter(
      (u) => u.campusId && u.campusId !== mainCampusId
    ).length;

    // Support staff audit data
    const staffList: Array<any> = [];
    defaultSchool.users.forEach((u) => {
      const spec = (u.teacher?.specialty || "").toLowerCase();
      const degree = (u.teacher?.degree || "").toLowerCase();
      let staffRole: any = null;

      if (spec.includes("kế toán") || u.email.includes("ketoan")) staffRole = "ACCOUNTANT";
      else if (spec.includes("văn thư") || u.email.includes("vanthu")) staffRole = "CLERK";
      else if (spec.includes("thủ quỹ") || u.email.includes("thuquy")) staffRole = "TREASURER";
      else if (spec.includes("thiết bị") || spec.includes("thí nghiệm") || u.email.includes("thietbi")) staffRole = "EQUIPMENT_LAB";
      else if (spec.includes("thư viện") || u.email.includes("thuvien")) staffRole = "LIBRARY";
      else if (spec.includes("giáo vụ") || u.email.includes("giaovu")) staffRole = "ACADEMIC_AFFAIRS";
      else if (spec.includes("tư vấn") || spec.includes("tâm lý") || u.email.includes("tamly")) staffRole = "STUDENT_COUNSELING";
      else if (spec.includes("khuyết tật") || spec.includes("hỗ trợ gd")) staffRole = "DISABILITY_SUPPORT";
      else if (spec.includes("cntt") || spec.includes("công nghệ thông tin") || spec.includes("quản trị") || u.email.includes("cntt")) staffRole = "IT_OFFICE_ADMIN";
      else if (spec.includes("y tế") || spec.includes("điều dưỡng") || u.email.includes("yte")) staffRole = "MEDICAL_HEALTH";

      if (staffRole) {
        const hasMed = degree.includes("y") || degree.includes("bác sĩ") || degree.includes("điều dưỡng") || degree.includes("y sĩ");
        const hasAcc = degree.includes("kế toán") || degree.includes("tài chính") || degree.includes("kinh tế");
        staffList.push({
          id: u.id,
          name: u.name,
          role: staffRole,
          campusId: u.campusId,
          campusName: u.campus?.name || "Trường chính",
          degreeName: u.teacher?.degree || "Cử nhân / Chứng chỉ",
          hasMedicalCertificate: hasMed,
          hasAccountingCertificate: hasAcc,
          isCertified: staffRole === "MEDICAL_HEALTH" ? hasMed : (staffRole === "ACCOUNTANT" ? hasAcc : true),
        });
      }
    });

    const campusesAuditData = campuses.map((c) => ({
      id: c.id,
      name: c.name,
      isMainCampus: c.isMainCampus,
      staff: staffList.filter((s) => s.campusId === c.id || (c.isMainCampus && !s.campusId)),
    }));

    const scorecard = auditSchoolNQ37({
      schoolId: defaultSchool.id,
      schoolName: defaultSchool.name,
      totalClasses: defaultSchool.classRooms.length || 30,
      isBoardingOrDayBoarding: false,
      principalCount: Math.max(1, principalUsers.length),
      mainCampusViceCount: Math.max(1, mainCampusViceCount),
      branchCampusViceCount,
      campuses: campusesAuditData,
      now,
    });

    return {
      deadlines,
      scorecard,
      schoolName: defaultSchool.name,
      hasCriticalViolations: scorecard.criticalViolations.length > 0,
    };
  } catch (error) {
    console.error("Error in getNQ37DashboardSummary:", error);
    return {
      deadlines: calculateDeadlines(new Date("2026-09-02")),
      scorecard: null,
      schoolName: "THPT Chuyên Trần Phú (Hải Phòng)",
      hasCriticalViolations: false,
    };
  }
}

export async function getAdminDashboardData(schoolId?: string) {
  const [
    schools,
    stats,
    weekData,
    classGrades,
    classAttendance,
    incidents,
    today,
    lpAlerts,
    earlyWarnings,
    substitutes,
    nq37Summary,
  ] = await Promise.all([
    getSchoolsList(),
    getDashboardStats(schoolId),
    getAttendanceByWeek(schoolId),
    getGradesByClass(schoolId),
    getClassAttendanceRanking(schoolId),
    getRecentIncidents(10, schoolId),
    getTodaySummary(schoolId),
    getLessonPlanAlerts(schoolId),
    getEarlyWarnings(6, schoolId),
    getSubstituteDispatchSummary(schoolId),
    getNQ37DashboardSummary(schoolId),
  ]);

  return {
    schools,
    stats,
    weekData,
    classGrades,
    classAttendance,
    incidents,
    today,
    lpAlerts,
    earlyWarnings,
    substitutes,
    nq37Summary,
  };
}

export async function getEarlyWarnings(limit = 6, schoolId?: string) {
  try {
    const warnings = await prisma.earlyWarning.findMany({
      where: { isResolved: false },
      take: limit,
      orderBy: [
        { level: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        campusName: true,
        schoolPointName: true,
        className: true,
        studentName: true,
        description: true,
        aiAnalysis: true,
        createdAt: true,
      },
    });

    return warnings.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error in getEarlyWarnings:", error);
    return [];
  }
}

export async function getSubstituteDispatchSummary(schoolId?: string) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pendingCount, todayDispatches] = await Promise.all([
      prisma.substituteAssignment.count({
        where: { status: "PENDING" },
      }),
      prisma.substituteAssignment.findMany({
        where: {
          date: { gte: todayStart },
        },
        take: 5,
        orderBy: { date: "desc" },
        select: {
          id: true,
          originalTeacher: true,
          substituteTeacher: true,
          className: true,
          subjectName: true,
          period: true,
          status: true,
          reason: true,
          aiRecommendation: true,
        },
      }),
    ]);

    return {
      pendingCount,
      todayDispatches,
    };
  } catch (error) {
    console.error("Error in getSubstituteDispatchSummary:", error);
    return { pendingCount: 0, todayDispatches: [] };
  }
}

// ==================== AI CẢNH BÁO GIÁO ÁN ====================

export async function getLessonPlanAlerts(schoolId?: string) {
  try {
    const activePeriods = await prisma.lessonPlanPeriod.findMany({
      where: { isActive: true },
      orderBy: { deadline: "desc" },
      select: { id: true, label: true, deadline: true },
      take: 1
    });

    if (activePeriods.length === 0) return { alerts: [], periodLabel: null, deadline: null };

    const period = activePeriods[0];

    const assignmentWhere = schoolId
      ? {
          OR: [
            { teacher: { user: { schoolId } } },
            { teacher: { homeroomClasses: { some: { schoolId } } } },
            { classRoom: { schoolId } },
          ],
        }
      : {};

    const [assignments, submittedPlans] = await Promise.all([
      prisma.teachingAssignment.findMany({
        where: assignmentWhere,
        select: {
          teacherId: true,
          subjectId: true,
          teacher: { select: { user: { select: { name: true } } } },
          subject: {
            select: {
              id: true,
              name: true,
              subjectGroup: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.lessonPlan.findMany({
        where: {
          periodId: period.id,
          status: { not: "DRAFT" as any },
        },
        select: { teacherId: true, subjectId: true, createdAt: true, status: true },
      }),
    ]);

    const submittedMap = new Map<string, { createdAt: Date; status: string }>();
    for (const p of submittedPlans) {
      submittedMap.set(`${p.teacherId}::${p.subjectId}`, { createdAt: p.createdAt, status: p.status });
    }

    type Alert = {
      teacherName: string;
      subjectName: string;
      groupName: string;
      status: "NOT_SUBMITTED" | "LATE" | "ON_TIME";
      daysLate: number;
      planStatus: string;
    };

    const alerts: Alert[] = [];
    const seen = new Set<string>();

    for (const a of assignments) {
      const key = `${a.teacherId}::${a.subjectId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const plan = submittedMap.get(key);
      const groupName = a.subject.subjectGroup?.name || "Chưa phân tổ";
      const teacherName = a.teacher?.user?.name || "Giáo viên";
      const subjectName = a.subject.name;

      if (!plan) {
        alerts.push({ teacherName, subjectName, groupName, status: "NOT_SUBMITTED", daysLate: 0, planStatus: "" });
      } else if (plan.createdAt > period.deadline) {
        const daysLate = Math.ceil((plan.createdAt.getTime() - period.deadline.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({ teacherName, subjectName, groupName, status: "LATE", daysLate, planStatus: plan.status });
      } else {
        alerts.push({ teacherName, subjectName, groupName, status: "ON_TIME", daysLate: 0, planStatus: plan.status });
      }
    }

    const order = { NOT_SUBMITTED: 0, LATE: 1, ON_TIME: 2 };
    alerts.sort((a, b) => {
      const d = order[a.status] - order[b.status];
      if (d !== 0) return d;
      return a.groupName.localeCompare(b.groupName) || a.subjectName.localeCompare(b.subjectName);
    });

    return {
      alerts,
      periodLabel: period.label,
      deadline: period.deadline,
    };
  } catch (error) {
    console.error("Error in getLessonPlanAlerts:", error);
    return { alerts: [], periodLabel: null, deadline: null };
  }
}
