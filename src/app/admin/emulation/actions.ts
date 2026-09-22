"use server";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/emulation/page.tsx, src/app/admin/kpi/principal-dashboard/page.tsx
 * 2. Public functions affected: getRealtimeEmulationBoard, getEmulationClassDetail, getEmulationCampusesAndGrades
 * 3. Data structures: EmulationBoardPayload, ClassEmulationScore, CampusEmulationBenchmark, ClassEmulationDetail
 * 4. Verbatim User Instruction: "thực hiện đi" - "dựa trên điểm danh hằng ngày để đưa lên kpi trực tiếp hằng ngày và đi muộn để đánh giá thi đua của từng lớp và từng trường"
 */

import prisma from "@/lib/prisma";
import { getTenantContext, isSuperAdmin } from "@/lib/tenant";

export type EmulationTier = "XUAT_SAC" | "TOT" | "KHA" | "CAN_CAN_THIEP";

export interface ClassEmulationScore {
  classId: string;
  className: string;
  gradeLevel: number;
  campusId: string;
  campusName: string;
  schoolId: string;
  schoolName: string;
  homeroomTeacherName: string;
  studentCount: number;
  totalAttendanceRecords: number;
  presentCount: number;
  lateCount: number;
  absentExcusedCount: number;
  absentUnexcusedCount: number;
  incidentCount: number;
  commendationCount: number;
  attendanceRate: number; // 0 - 100 (%)
  punctualityRate: number; // 0 - 100 (%)
  emulationScore: number; // 0 - 105 (Điểm thi đua nề nếp)
  tier: EmulationTier;
  tierLabel: string;
  rank: number;
  rankInGrade: number;
  rankInCampus: number;
  bonusPoints: number;
  deductionPoints: number;
}

export interface CampusEmulationBenchmark {
  campusId: string;
  campusName: string;
  classCount: number;
  studentCount: number;
  avgEmulationScore: number;
  attendanceRate: number;
  punctualityRate: number;
  totalLateCount: number;
  totalAbsentCount: number;
  totalIncidentCount: number;
  topClass: {
    id: string;
    name: string;
    score: number;
  } | null;
}

export interface EmulationBoardPayload {
  periodType: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
  selectedDate: string;
  startDate: string;
  endDate: string;
  scopeCampusId: string;
  scopeGrade: number;
  totalClasses: number;
  totalStudents: number;
  overallAttendanceRate: number;
  overallPunctualityRate: number;
  overallAvgScore: number;
  totalLateCount: number;
  totalAbsentCount: number;
  totalIncidentCount: number;
  classes: ClassEmulationScore[];
  topPodiumClasses: ClassEmulationScore[];
  warningClasses: ClassEmulationScore[];
  campusBenchmarks: CampusEmulationBenchmark[];
}

export interface EmulationStudentDetail {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  date: string;
  period: number | null;
  status: "LATE" | "ABSENT_EXCUSED" | "ABSENT_UNEXCUSED" | "PRESENT";
  statusLabel: string;
  note: string | null;
}

export interface EmulationIncidentDetail {
  id: string;
  studentName: string;
  studentCode: string;
  date: string;
  type: string;
  description: string;
  reportedBy: string | null;
}

export interface ClassEmulationDetail {
  classId: string;
  className: string;
  campusName: string;
  homeroomTeacherName: string;
  emulationScore: number;
  attendanceRate: number;
  punctualityRate: number;
  lateRecords: EmulationStudentDetail[];
  absentRecords: EmulationStudentDetail[];
  incidents: EmulationIncidentDetail[];
}

function isWeekday(d: Date): boolean {
  const day = d.getUTCDay();
  return day >= 1 && day <= 5; // Monday = 1 to Friday = 5
}

/**
 * Helper to calculate local Date Range (Standard Monday-Friday school days for Primary Education)
 */
function getDateRange(
  periodType: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM",
  customDate?: string,
  customStart?: string,
  customEnd?: string
): { startDate: Date; endDate: Date; selectedDateStr: string; startStr: string; endStr: string } {
  const now = customDate ? new Date(`${customDate}T00:00:00.000Z`) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const date = now.getUTCDate();

  let start: Date;
  let end: Date;

  if (periodType === "TODAY") {
    start = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    end = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));
  } else if (periodType === "THIS_WEEK") {
    const day = now.getUTCDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start = new Date(Date.UTC(year, month, date + diffToMonday, 0, 0, 0, 0));
    // Standard Vietnamese Primary School Schedule: Monday to Friday (5 days)
    end = new Date(Date.UTC(year, month, date + diffToMonday + 4, 23, 59, 59, 999));
  } else if (periodType === "THIS_MONTH") {
    start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  } else {
    // CUSTOM
    const s = customStart ? new Date(`${customStart}T00:00:00.000Z`) : new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const e = customEnd ? new Date(`${customEnd}T23:59:59.999Z`) : new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    start = s;
    end = e;
  }

  const selectedDateStr = customDate || now.toISOString().split("T")[0];
  const startStr = start.toISOString().split("T")[0];
  const endStr = end.toISOString().split("T")[0];

  return { startDate: start, endDate: end, selectedDateStr, startStr, endStr };
}

/**
 * Evaluates Emulation Tier based on standard Vietnamese K-12 schooling metrics
 */
function determineTier(score: number): { tier: EmulationTier; tierLabel: string } {
  if (score >= 95) {
    return { tier: "XUAT_SAC", tierLabel: "Xuất sắc" };
  }
  if (score >= 85) {
    return { tier: "TOT", tierLabel: "Tốt" };
  }
  if (score >= 70) {
    return { tier: "KHA", tierLabel: "Khá" };
  }
  return { tier: "CAN_CAN_THIEP", tierLabel: "Cần chấn chỉnh" };
}

/**
 * 1. Core Engine: Aggregates real-time Daily Attendance, Late arrival, and Incident data
 * to produce class & campus emulation rankings and live KPI integration.
 */
export async function getRealtimeEmulationBoard(params: {
  schoolId?: string;
  campusId?: string;
  gradeLevel?: number;
  periodType?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data?: EmulationBoardPayload; error?: string }> {
  try {
    const tenantCtx = await getTenantContext();
    const isGlobalSuperAdmin = isSuperAdmin(tenantCtx);

    // Resolve target school
    let targetSchoolId = params.schoolId || tenantCtx.schoolId;
    if (!targetSchoolId && isGlobalSuperAdmin) {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      targetSchoolId = firstSchool?.id;
    }

    if (!targetSchoolId) {
      return { success: false, error: "Không tìm thấy thông tin trường học." };
    }

    const periodType = params.periodType || "THIS_WEEK";
    const { startDate, endDate, selectedDateStr, startStr, endStr } = getDateRange(
      periodType,
      params.date,
      params.startDate,
      params.endDate
    );

    // Build filter for classes
    const classWhere: Record<string, unknown> = {
      schoolId: targetSchoolId,
    };

    if (params.campusId && params.campusId !== "ALL") {
      classWhere.campusId = params.campusId;
    } else if (tenantCtx.campusId && !isGlobalSuperAdmin && tenantCtx.userRole === "VICE_PRINCIPAL") {
      classWhere.campusId = tenantCtx.campusId;
    }

    if (params.gradeLevel && params.gradeLevel > 0) {
      classWhere.gradeLevel = Number(params.gradeLevel);
    }

    // Fetch classes with campuses and homeroom teachers
    const classes = await prisma.classRoom.findMany({
      where: classWhere,
      include: {
        campus: { select: { id: true, name: true } },
        school: { select: { id: true, name: true } },
        homeroomTeacher: {
          include: {
            user: { select: { name: true } },
          },
        },
        students: {
          where: { status: "STUDYING" },
          select: { id: true },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    if (classes.length === 0) {
      return {
        success: true,
        data: {
          periodType,
          selectedDate: selectedDateStr,
          startDate: startStr,
          endDate: endStr,
          scopeCampusId: params.campusId || "ALL",
          scopeGrade: params.gradeLevel || 0,
          totalClasses: 0,
          totalStudents: 0,
          overallAttendanceRate: 100,
          overallPunctualityRate: 100,
          overallAvgScore: 100,
          totalLateCount: 0,
          totalAbsentCount: 0,
          totalIncidentCount: 0,
          classes: [],
          topPodiumClasses: [],
          warningClasses: [],
          campusBenchmarks: [],
        },
      };
    }

    const classIds = classes.map((c) => c.id);

    // Query Attendances in parallel with Incidents
    const [attendances, incidents] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          classId: { in: classIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          classId: true,
          status: true,
          date: true,
        },
      }),
      prisma.incident.findMany({
        where: {
          classId: { in: classIds },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          classId: true,
          type: true,
          date: true,
        },
      }),
    ]);

    // Group attendance counts by classId (filtering official Monday-Friday school days for multi-day periods)
    const attendanceMap = new Map<
      string,
      { present: number; late: number; absentExcused: number; absentUnexcused: number; total: number }
    >();

    for (const att of attendances) {
      if (periodType !== "TODAY" && !isWeekday(new Date(att.date))) {
        continue;
      }

      const current = attendanceMap.get(att.classId) || {
        present: 0,
        late: 0,
        absentExcused: 0,
        absentUnexcused: 0,
        total: 0,
      };

      current.total += 1;
      if (att.status === "PRESENT") current.present += 1;
      else if (att.status === "LATE") current.late += 1;
      else if (att.status === "ABSENT_EXCUSED") current.absentExcused += 1;
      else if (att.status === "ABSENT_UNEXCUSED") current.absentUnexcused += 1;

      attendanceMap.set(att.classId, current);
    }

    // Group incident counts by classId
    const incidentMap = new Map<string, { violations: number; commendations: number }>();
    for (const inc of incidents) {
      if (periodType !== "TODAY" && !isWeekday(new Date(inc.date))) {
        continue;
      }

      const current = incidentMap.get(inc.classId) || { violations: 0, commendations: 0 };
      if (inc.type === "COMMENDATION") {
        current.commendations += 1;
      } else {
        current.violations += 1;
      }
      incidentMap.set(inc.classId, current);
    }

    // Compute metrics for each class
    let grandTotalStudents = 0;
    let grandPresent = 0;
    let grandLate = 0;
    let grandAbsentExcused = 0;
    let grandAbsentUnexcused = 0;
    let grandIncident = 0;
    let grandAttendanceRecords = 0;

    const classScores: ClassEmulationScore[] = classes.map((cls) => {
      const stCount = cls.students.length;
      grandTotalStudents += stCount;

      const att = attendanceMap.get(cls.id) || {
        present: 0,
        late: 0,
        absentExcused: 0,
        absentUnexcused: 0,
        total: 0,
      };

      const inc = incidentMap.get(cls.id) || { violations: 0, commendations: 0 };

      grandAttendanceRecords += att.total;
      grandPresent += att.present;
      grandLate += att.late;
      grandAbsentExcused += att.absentExcused;
      grandAbsentUnexcused += att.absentUnexcused;
      grandIncident += inc.violations;

      // Rate calculations
      const attendanceRate =
        att.total > 0
          ? Number(((att.present / att.total) * 100).toFixed(1))
          : 100.0;

      const punctualityRate =
        att.total > 0
          ? Number((((att.total - att.late) / att.total) * 100).toFixed(1))
          : 100.0;

      // Emulation Score Formula (Option A - Standardized Vietnamese K-12 model)
      // Base: 100.0
      // LATE: -1.0 per occurrence
      // ABSENT_EXCUSED: -0.5 per occurrence
      // ABSENT_UNEXCUSED: -2.0 per occurrence
      // VIOLATION INCIDENT: -5.0 per occurrence
      // BONUS: +5.0 if 100% attendance & 0 late in the period with records
      const baseScore = 100.0;
      const deductions =
        att.late * 1.0 +
        att.absentExcused * 0.5 +
        att.absentUnexcused * 2.0 +
        inc.violations * 5.0;

      const isPerfectAttendance = att.total > 0 && att.present === att.total && att.late === 0 && inc.violations === 0;
      const bonus = isPerfectAttendance ? 5.0 : 0.0;

      const rawScore = baseScore - deductions + bonus;
      const emulationScore = Math.max(0, Math.min(105, Number(rawScore.toFixed(1))));

      const { tier, tierLabel } = determineTier(emulationScore);

      return {
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        campusId: cls.campusId || cls.campus?.id || "",
        campusName: cls.campus?.name || cls.school?.name || "Điểm trường chính",
        schoolId: cls.schoolId,
        schoolName: cls.school.name,
        homeroomTeacherName: cls.homeroomTeacher?.user?.name || "Chưa phân công",
        studentCount: stCount,
        totalAttendanceRecords: att.total,
        presentCount: att.present,
        lateCount: att.late,
        absentExcusedCount: att.absentExcused,
        absentUnexcusedCount: att.absentUnexcused,
        incidentCount: inc.violations,
        commendationCount: inc.commendations,
        attendanceRate,
        punctualityRate,
        emulationScore,
        tier,
        tierLabel,
        rank: 0, // Assigned after sorting
        rankInGrade: 0,
        rankInCampus: 0,
        bonusPoints: bonus,
        deductionPoints: Number(deductions.toFixed(1)),
      };
    });

    // Sort globally by score desc, then attendanceRate desc, then punctualityRate desc, then className asc
    classScores.sort((a, b) => {
      if (b.emulationScore !== a.emulationScore) return b.emulationScore - a.emulationScore;
      if (b.attendanceRate !== a.attendanceRate) return b.attendanceRate - a.attendanceRate;
      if (b.punctualityRate !== a.punctualityRate) return b.punctualityRate - a.punctualityRate;
      return a.className.localeCompare(b.className);
    });

    // Assign overall rank
    classScores.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Assign rankInGrade
    const gradeGroups = new Map<number, ClassEmulationScore[]>();
    classScores.forEach((c) => {
      const g = gradeGroups.get(c.gradeLevel) || [];
      g.push(c);
      gradeGroups.set(c.gradeLevel, g);
    });
    gradeGroups.forEach((group) => {
      group.forEach((item, idx) => {
        item.rankInGrade = idx + 1;
      });
    });

    // Assign rankInCampus
    const campusGroups = new Map<string, ClassEmulationScore[]>();
    classScores.forEach((c) => {
      const g = campusGroups.get(c.campusId) || [];
      g.push(c);
      campusGroups.set(c.campusId, g);
    });
    campusGroups.forEach((group) => {
      group.forEach((item, idx) => {
        item.rankInCampus = idx + 1;
      });
    });

    // Campus-level Benchmarks
    const campusBenchmarks: CampusEmulationBenchmark[] = Array.from(campusGroups.entries()).map(
      ([campusId, campusClasses]) => {
        const campusName = campusClasses[0]?.campusName || "Điểm trường";
        const cClassCount = campusClasses.length;
        const cStudentCount = campusClasses.reduce((acc, c) => acc + c.studentCount, 0);
        const cLateCount = campusClasses.reduce((acc, c) => acc + c.lateCount, 0);
        const cAbsentCount = campusClasses.reduce(
          (acc, c) => acc + c.absentExcusedCount + c.absentUnexcusedCount,
          0
        );
        const cIncidentCount = campusClasses.reduce((acc, c) => acc + c.incidentCount, 0);
        const avgScore = Number(
          (campusClasses.reduce((acc, c) => acc + c.emulationScore, 0) / (cClassCount || 1)).toFixed(1)
        );
        const avgAttRate = Number(
          (campusClasses.reduce((acc, c) => acc + c.attendanceRate, 0) / (cClassCount || 1)).toFixed(1)
        );
        const avgPuncRate = Number(
          (campusClasses.reduce((acc, c) => acc + c.punctualityRate, 0) / (cClassCount || 1)).toFixed(1)
        );

        const topC = campusClasses[0]
          ? {
              id: campusClasses[0].classId,
              name: campusClasses[0].className,
              score: campusClasses[0].emulationScore,
            }
          : null;

        return {
          campusId,
          campusName,
          classCount: cClassCount,
          studentCount: cStudentCount,
          avgEmulationScore: avgScore,
          attendanceRate: avgAttRate,
          punctualityRate: avgPuncRate,
          totalLateCount: cLateCount,
          totalAbsentCount: cAbsentCount,
          totalIncidentCount: cIncidentCount,
          topClass: topC,
        };
      }
    );

    // Sort campus benchmarks by avg score desc
    campusBenchmarks.sort((a, b) => b.avgEmulationScore - a.avgEmulationScore);

    // Top 3 Podium Classes
    const topPodiumClasses = classScores.slice(0, 3);

    // Classes needing intervention (Score < 80 or high late count)
    const warningClasses = classScores
      .filter((c) => c.emulationScore < 80 || c.lateCount >= 3 || c.absentUnexcusedCount >= 2 || c.incidentCount >= 1)
      .slice(0, 6);

    const overallAttendanceRate =
      grandAttendanceRecords > 0
        ? Number(((grandPresent / grandAttendanceRecords) * 100).toFixed(1))
        : 100.0;

    const overallPunctualityRate =
      grandAttendanceRecords > 0
        ? Number((((grandAttendanceRecords - grandLate) / grandAttendanceRecords) * 100).toFixed(1))
        : 100.0;

    const overallAvgScore = Number(
      (classScores.reduce((acc, c) => acc + c.emulationScore, 0) / (classScores.length || 1)).toFixed(1)
    );

    return {
      success: true,
      data: {
        periodType,
        selectedDate: selectedDateStr,
        startDate: startStr,
        endDate: endStr,
        scopeCampusId: params.campusId || "ALL",
        scopeGrade: params.gradeLevel || 0,
        totalClasses: classScores.length,
        totalStudents: grandTotalStudents,
        overallAttendanceRate,
        overallPunctualityRate,
        overallAvgScore,
        totalLateCount: grandLate,
        totalAbsentCount: grandAbsentExcused + grandAbsentUnexcused,
        totalIncidentCount: grandIncident,
        classes: classScores,
        topPodiumClasses,
        warningClasses,
        campusBenchmarks,
      },
    };
  } catch (err: unknown) {
    console.error("Error in getRealtimeEmulationBoard:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi tổng hợp bảng thi đua nề nếp.",
    };
  }
}

/**
 * 2. Detailed Inspection: Retrieves specific students who were Late, Absent or involved in Incidents
 */
export async function getEmulationClassDetail(params: {
  classId: string;
  startDate?: string;
  endDate?: string;
  date?: string;
}): Promise<{ success: boolean; data?: ClassEmulationDetail; error?: string }> {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx.userId) {
      return { success: false, error: "Phiên đăng nhập không hợp lệ." };
    }

    const classRoom = await prisma.classRoom.findUnique({
      where: { id: params.classId },
      include: {
        campus: { select: { name: true } },
        homeroomTeacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!classRoom) {
      return { success: false, error: "Không tìm thấy thông tin lớp học." };
    }

    const { startDate, endDate } = getDateRange(
      params.date ? "TODAY" : "THIS_WEEK",
      params.date,
      params.startDate,
      params.endDate
    );

    const [attendances, incidents] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          classId: params.classId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ["LATE", "ABSENT_EXCUSED", "ABSENT_UNEXCUSED"],
          },
        },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      }),
      prisma.incident.findMany({
        where: {
          classId: params.classId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    const lateRecords: EmulationStudentDetail[] = [];
    const absentRecords: EmulationStudentDetail[] = [];

    for (const att of attendances) {
      const item: EmulationStudentDetail = {
        id: att.id,
        studentId: att.studentId,
        studentCode: att.student.studentCode || "Chưa cấp mã",
        studentName: att.student.user.name,
        date: att.date.toISOString().split("T")[0],
        period: att.period,
        status: att.status as any,
        statusLabel:
          att.status === "LATE"
            ? "Đi muộn"
            : att.status === "ABSENT_EXCUSED"
            ? "Vắng có phép"
            : "Vắng không phép",
        note: att.note,
      };

      if (att.status === "LATE") {
        lateRecords.push(item);
      } else {
        absentRecords.push(item);
      }
    }

    const incidentDetails: EmulationIncidentDetail[] = incidents.map((inc) => ({
      id: inc.id,
      studentName: inc.student.user.name,
      studentCode: inc.student.studentCode || "Chưa cấp mã",
      date: inc.date.toISOString().split("T")[0],
      type: inc.type === "COMMENDATION" ? "Khen thưởng" : "Vi phạm nề nếp",
      description: inc.description,
      reportedBy: inc.reportedBy,
    }));

    // Quick score calculation for this class
    const totalRecords = attendances.length;
    const lateCount = lateRecords.length;
    const absentExcused = absentRecords.filter((a) => a.status === "ABSENT_EXCUSED").length;
    const absentUnexcused = absentRecords.filter((a) => a.status === "ABSENT_UNEXCUSED").length;
    const violations = incidents.filter((i) => i.type === "VIOLATION").length;

    const deductions = lateCount * 1.0 + absentExcused * 0.5 + absentUnexcused * 2.0 + violations * 5.0;
    const emulationScore = Math.max(0, Math.min(105, Number((100.0 - deductions).toFixed(1))));

    return {
      success: true,
      data: {
        classId: classRoom.id,
        className: classRoom.name,
        campusName: classRoom.campus?.name || "Điểm trường chính",
        homeroomTeacherName: classRoom.homeroomTeacher?.user?.name || "Chưa phân công",
        emulationScore,
        attendanceRate: totalRecords > 0 ? Number((((totalRecords - absentRecords.length) / totalRecords) * 100).toFixed(1)) : 100.0,
        punctualityRate: totalRecords > 0 ? Number((((totalRecords - lateCount) / totalRecords) * 100).toFixed(1)) : 100.0,
        lateRecords,
        absentRecords,
        incidents: incidentDetails,
      },
    };
  } catch (err: unknown) {
    console.error("Error in getEmulationClassDetail:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lỗi khi lấy chi tiết chuyên cần lớp học.",
    };
  }
}

/**
 * 3. Metadata for Filters: Retrieves Campuses and Grade Levels
 */
export async function getEmulationCampusesAndGrades(schoolId?: string): Promise<{
  campuses: Array<{ id: string; name: string }>;
  grades: number[];
}> {
  try {
    const tenantCtx = await getTenantContext();
    const targetSchoolId = schoolId || tenantCtx.schoolId;

    const whereSchool = targetSchoolId ? { schoolId: targetSchoolId } : {};

    const campuses = await prisma.campus.findMany({
      where: whereSchool,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    return {
      campuses,
      grades: [1, 2, 3, 4, 5],
    };
  } catch (err) {
    console.error("Error in getEmulationCampusesAndGrades:", err);
    return {
      campuses: [],
      grades: [1, 2, 3, 4, 5],
    };
  }
}

/**
 * 4. Automated Early Warning & Teacher Notification:
 * Scans classes in real-time, identifies classes with emulation score < 70 or >= 3 infractions,
 * creates EarlyWarning records and dispatches direct notification to the Homeroom Teacher (GVCN) & BGH.
 */
export async function triggerEmulationEarlyWarnings(params: {
  schoolId?: string;
  campusId?: string;
  periodType?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM";
  date?: string;
}): Promise<{
  success: boolean;
  count: number;
  warningsCreated: Array<{ className: string; emulationScore: number; warningId: string }>;
  message: string;
  error?: string;
}> {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx.userId) {
      return { success: false, count: 0, warningsCreated: [], message: "", error: "Phiên đăng nhập không hợp lệ." };
    }

    const boardRes = await getRealtimeEmulationBoard({
      schoolId: params.schoolId,
      campusId: params.campusId,
      periodType: params.periodType || "THIS_WEEK",
      date: params.date,
    });

    if (!boardRes.success || !boardRes.data) {
      return { success: false, count: 0, warningsCreated: [], message: "", error: boardRes.error || "Không thể tải bảng thi đua." };
    }

    const warningClasses = boardRes.data.classes.filter(
      (c) => c.emulationScore < 70.0 || c.lateCount + c.absentUnexcusedCount >= 3 || c.incidentCount >= 2
    );

    const warningsCreated: Array<{ className: string; emulationScore: number; warningId: string }> = [];

    for (const cls of warningClasses) {
      // Check if an active warning already exists for this class
      const existingWarning = await prisma.earlyWarning.findFirst({
        where: {
          className: cls.className,
          category: "ATTENDANCE",
          isResolved: false,
        },
      });

      if (!existingWarning) {
        // Query homeroom teacher's user ID
        const classRoom = await prisma.classRoom.findUnique({
          where: { id: cls.classId },
          include: {
            homeroomTeacher: {
              include: { user: { select: { id: true } } },
            },
          },
        });

        const teacherUserId = classRoom?.homeroomTeacher?.user?.id;

        const newWarning = await prisma.earlyWarning.create({
          data: {
            title: `Cảnh báo Nề nếp & Thi đua: Lớp ${cls.className}`,
            category: "ATTENDANCE",
            level: "HIGH",
            campusName: cls.campusName,
            className: cls.className,
            description: `Lớp ${cls.className} (${cls.campusName}) đạt điểm thi đua ${cls.emulationScore}/100 đ (Xếp hạng ${cls.tierLabel}). Ghi nhận ${cls.lateCount} lượt đi muộn, ${cls.absentUnexcusedCount} lượt nghỉ không phép và ${cls.incidentCount} vụ việc kỷ luật trong kỳ.`,
            aiAnalysis: `[Đề xuất BGH & GVCN]: Giáo viên chủ nhiệm (${cls.homeroomTeacherName}) cần phối hợp với Đội Cờ Đỏ và liên hệ ngay với phụ huynh các học sinh thường xuyên đi muộn/nghỉ học để chấn chỉnh nề nếp.`,
            isResolved: false,
          },
        });

        warningsCreated.push({
          className: cls.className,
          emulationScore: cls.emulationScore,
          warningId: newWarning.id,
        });

        // Dispatch notification to homeroom teacher if exists
        if (teacherUserId) {
          await prisma.notification.create({
            data: {
              senderId: tenantCtx.userId,
              receiverId: teacherUserId,
              title: `[Cảnh báo Nề nếp] Lớp ${cls.className} cần chấn chỉnh thi đua`,
              content: `Điểm thi đua hiện tại của lớp là ${cls.emulationScore}/100 đ (${cls.tierLabel}). Thầy/Cô vui lòng kiểm tra danh sách học sinh đi muộn (${cls.lateCount} lượt), vắng không phép (${cls.absentUnexcusedCount} lượt) để có biện pháp nhắc nhở kịp thời.`,
            },
          });
        }
      }
    }

    return {
      success: true,
      count: warningsCreated.length,
      warningsCreated,
      message:
        warningsCreated.length > 0
          ? `Đã tự động kích hoạt ${warningsCreated.length} cảnh báo sớm và gửi thông báo tới GVCN thành công.`
          : "Tất cả các lớp đều duy trì nề nếp tốt hoặc đã có cảnh báo đang được theo dõi xử lý.",
    };
  } catch (err: unknown) {
    console.error("Error in triggerEmulationEarlyWarnings:", err);
    return {
      success: false,
      count: 0,
      warningsCreated: [],
      message: "",
      error: err instanceof Error ? err.message : "Lỗi khi kích hoạt cảnh báo sớm nề nếp.",
    };
  }
}

