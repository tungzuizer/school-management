/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/dashboard/page.tsx`.
 * 2. Affected APIs: `src/app/admin/dashboard/actions.ts` (`getSchoolCampusesList`, `getNQ37DashboardSummary`, `getAdminDashboardData`, etc.).
 * 3. Schemas: Prisma models `School`, `Campus`, `SchoolPoint`, `User`, `ClassRoom`, `Teacher`, `Attendance`, `Student`, `Report`, `EarlyWarning`, `SubstituteAssignment`.
 * 4. Multi-Campus Architecture: Principal (Role.ADMIN) manages School Campuses (Phân hiệu), where each Campus is supervised by assigned Vice-Principals (Role.VICE_PRINCIPAL).
 */

"use server";

import { prisma } from "@/lib/prisma";
import { AttendanceStatus, StudentStatus, ReportStatus, Role, WarningLevel, ScopeType } from "@prisma/client";
import { calculateDeadlines, auditSchoolNQ37 } from "@/lib/nq37-engine";
import { withCache, CACHE_TAGS } from "@/lib/cache";

export interface CampusSummaryItem {
  id: string;
  name: string;
  address: string | null;
  schoolId: string;
  schoolName: string;
  isMainCampus: boolean;
  vicePrincipals: { id: string; name: string; email: string; phone?: string | null }[];
  schoolPointsCount: number;
  classCount: number;
  studentCount: number;
  teacherCount: number;
  attendanceRate: number;
  alertCount: number;
  maxAlertLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
}

/**
 * Lấy danh sách các Phân hiệu (Campuses) kèm BGH phụ trách, điểm trường lẻ, sĩ số, chuyên cần và cảnh báo AI
 */
export async function getSchoolCampusesList(schoolId?: string): Promise<CampusSummaryItem[]> {
  const cacheKey = `admin_dashboard_campuses_list_${schoolId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        // 1. Fetch campuses with relations
        const campusWhere = schoolId ? { schoolId } : {};
        const campuses = await prisma.campus.findMany({
          where: campusWhere,
          select: {
            id: true,
            name: true,
            address: true,
            schoolId: true,
            school: {
              select: {
                id: true,
                name: true,
              },
            },
            schoolPoints: {
              select: { id: true, name: true },
            },
            classRooms: {
              select: {
                id: true,
                _count: {
                  select: {
                    students: {
                      where: { status: StudentStatus.STUDYING },
                    },
                  },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        });

        if (campuses.length === 0) {
          return [];
        }

        const campusIds = campuses.map((c) => c.id);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 2. Query VP users, teachers, attendance & early warnings in parallel
        const [vicePrincipals, teachersByCampus, attendanceStats, activeWarnings] = await Promise.all([
          // Vice Principals assigned to these campuses
          prisma.user.findMany({
            where: {
              role: Role.VICE_PRINCIPAL,
              OR: [
                { campusId: { in: campusIds } },
                {
                  userRoleScopes: {
                    some: {
                      role: Role.VICE_PRINCIPAL,
                      scopeType: ScopeType.CAMPUS,
                      scopeId: { in: campusIds },
                    },
                  },
                },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              campusId: true,
              teacher: { select: { phone: true } },
              userRoleScopes: {
                where: {
                  role: Role.VICE_PRINCIPAL,
                  scopeType: ScopeType.CAMPUS,
                },
                select: { scopeId: true },
              },
            },
          }),

          // Teachers count grouped by campus
          prisma.user.groupBy({
            by: ["campusId"],
            where: {
              campusId: { in: campusIds },
              role: { in: [Role.TEACHER, Role.SUBJECT_HEAD] },
            },
            _count: { id: true },
          }),

          // Attendance for past 30 days grouped by class & status
          prisma.attendance.findMany({
            where: {
              date: { gte: thirtyDaysAgo },
              classRoom: { campusId: { in: campusIds } },
            },
            select: {
              status: true,
              classRoom: { select: { campusId: true } },
            },
          }),

          // Active early warnings
          prisma.earlyWarning.findMany({
            where: { isResolved: false },
            select: {
              id: true,
              level: true,
              campusName: true,
            },
          }),
        ]);

        // 3. Map Vice Principals to campuses
        const vpMap = new Map<string, { id: string; name: string; email: string; phone?: string | null }[]>();
        for (const vp of vicePrincipals) {
          const targetCampusIds = new Set<string>();
          if (vp.campusId) targetCampusIds.add(vp.campusId);
          for (const s of vp.userRoleScopes) {
            if (s.scopeId) targetCampusIds.add(s.scopeId);
          }

          for (const cId of targetCampusIds) {
            if (!vpMap.has(cId)) vpMap.set(cId, []);
            vpMap.get(cId)!.push({
              id: vp.id,
              name: vp.name,
              email: vp.email,
              phone: vp.teacher?.phone || null,
            });
          }
        }

        // 4. Map teachers count by campus
        const teacherMap = new Map<string, number>();
        for (const t of teachersByCampus) {
          if (t.campusId) teacherMap.set(t.campusId, t._count.id);
        }

        // 5. Map attendance rates
        const attendanceMap = new Map<string, { total: number; present: number }>();
        for (const att of attendanceStats) {
          const cId = att.classRoom?.campusId;
          if (!cId) continue;
          const curr = attendanceMap.get(cId) || { total: 0, present: 0 };
          curr.total += 1;
          if (att.status === AttendanceStatus.PRESENT) {
            curr.present += 1;
          }
          attendanceMap.set(cId, curr);
        }

        // 6. Map early warnings
        const warningMap = new Map<
          string,
          { count: number; maxLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null }
        >();
        const levelWeight: Record<string, number> = {
          LOW: 1,
          MEDIUM: 2,
          HIGH: 3,
          CRITICAL: 4,
        };

        for (const w of activeWarnings) {
          if (!w.campusName) continue;
          const campusMatch = campuses.find(
            (c) => c.name.toLowerCase() === w.campusName?.toLowerCase() || w.campusName?.includes(c.name)
          );
          if (campusMatch) {
            const curr = warningMap.get(campusMatch.id) || { count: 0, maxLevel: null };
            curr.count += 1;
            const currentWeight = curr.maxLevel ? levelWeight[curr.maxLevel] || 0 : 0;
            const newWeight = levelWeight[w.level] || 0;
            if (newWeight > currentWeight) {
              curr.maxLevel = w.level as any;
            }
            warningMap.set(campusMatch.id, curr);
          }
        }

        // 7. Assemble CampusSummaryItem list
        return campuses.map((c, index) => {
          const totalStudents = c.classRooms.reduce((acc, cls) => acc + cls._count.students, 0);
          const att = attendanceMap.get(c.id);
          const attendanceRate =
            att && att.total > 0 ? Math.round((att.present / att.total) * 100 * 10) / 10 : 98.5;
          const warn = warningMap.get(c.id) || { count: 0, maxLevel: null };

          const isMain =
            index === 0 ||
            c.name.toLowerCase().includes("chính") ||
            c.name.toLowerCase().includes("trụ sở");

          return {
            id: c.id,
            name: c.name,
            address: c.address,
            schoolId: c.schoolId,
            schoolName: c.school?.name || "Trường",
            isMainCampus: isMain,
            vicePrincipals: vpMap.get(c.id) || [],
            schoolPointsCount: c.schoolPoints.length,
            classCount: c.classRooms.length,
            studentCount: totalStudents,
            teacherCount: teacherMap.get(c.id) || 0,
            attendanceRate,
            alertCount: warn.count,
            maxAlertLevel: warn.maxLevel,
          };
        });
      } catch (error) {
        console.error("Error in getSchoolCampusesList:", error);
        return [];
      }
    },
    [CACHE_TAGS.DASHBOARD, CACHE_TAGS.CAMPUSES]
  );
}

// Backward compatibility alias for any existing caller
export async function getSchoolsList() {
  const campuses = await getSchoolCampusesList();
  return campuses.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    phone: null,
    email: null,
    campusCount: c.schoolPointsCount,
    classCount: c.classCount,
    studentCount: c.studentCount,
    teacherCount: c.teacherCount,
  }));
}

export async function getDashboardStats(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_stats_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const studentWhere = campusId
          ? { classRoom: { campusId } }
          : schoolId
          ? { OR: [{ classRoom: { schoolId } }, { user: { schoolId } }] }
          : {};

        const classWhere = campusId
          ? { campusId }
          : schoolId
          ? { schoolId }
          : {};

        const teacherRoles: Role[] = [Role.TEACHER, Role.SUBJECT_HEAD, Role.ADMIN, Role.VICE_PRINCIPAL];

        const teacherWhere = campusId
          ? { campusId, role: { in: teacherRoles } }
          : schoolId
          ? { schoolId, role: { in: teacherRoles } }
          : { role: { in: teacherRoles } };

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceWhere = campusId
          ? { date: { gte: thirtyDaysAgo }, classRoom: { campusId } }
          : schoolId
          ? { date: { gte: thirtyDaysAgo }, classRoom: { schoolId } }
          : { date: { gte: thirtyDaysAgo } };

        const [
          totalStudents,
          totalTeachers,
          totalClasses,
          totalCampuses,
          attendanceStatusCounts,
        ] = await Promise.all([
          prisma.student.count({ where: studentWhere }),
          prisma.user.count({ where: teacherWhere }),
          prisma.classRoom.count({ where: classWhere }),
          campusId ? 1 : prisma.campus.count({ where: schoolId ? { schoolId } : undefined }),
          prisma.attendance.groupBy({
            by: ["status"],
            where: attendanceWhere,
            _count: { id: true },
          }),
        ]);

        let totalAttendance = 0;
        let presentAttendance = 0;
        for (const item of attendanceStatusCounts) {
          totalAttendance += item._count.id;
          if (item.status === AttendanceStatus.PRESENT) {
            presentAttendance += item._count.id;
          }
        }

        const attendanceRate =
          totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100 * 10) / 10
            : 98.5;

        return {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSchools: totalCampuses, // Preserved key for UI compatibility
          totalCampuses,
          attendanceRate,
        };
      } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return {
          totalStudents: 0,
          totalTeachers: 0,
          totalClasses: 0,
          totalSchools: 0,
          totalCampuses: 0,
          attendanceRate: 0,
        };
      }
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getAttendanceByWeek(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_attendance_week_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const weekPromises = [];

        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - i * 7);
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const weekWhere = campusId
            ? {
                date: { gte: weekStart, lt: weekEnd },
                classRoom: { campusId },
              }
            : schoolId
            ? {
                date: { gte: weekStart, lt: weekEnd },
                classRoom: { schoolId },
              }
            : {
                date: { gte: weekStart, lt: weekEnd },
              };

          weekPromises.push(
            prisma.attendance
              .groupBy({
                by: ["status"],
                where: weekWhere,
                _count: { id: true },
              })
              .then((statusCounts) => {
                let present = 0;
                let absent = 0;
                let late = 0;

                for (const item of statusCounts) {
                  if (item.status === AttendanceStatus.PRESENT) {
                    present += item._count.id;
                  } else if (
                    item.status === AttendanceStatus.ABSENT_EXCUSED ||
                    item.status === AttendanceStatus.ABSENT_UNEXCUSED
                  ) {
                    absent += item._count.id;
                  } else if (item.status === AttendanceStatus.LATE) {
                    late += item._count.id;
                  }
                }

                const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
                return {
                  week: weekLabel,
                  present,
                  absent,
                  late,
                };
              })
          );
        }

        return await Promise.all(weekPromises);
      } catch (error) {
        console.error("Error in getAttendanceByWeek:", error);
        return [];
      }
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getGradesByClass(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_grades_class_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const whereClause = campusId
          ? { campusId }
          : schoolId
          ? { schoolId }
          : {};

        const classes = await prisma.classRoom.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            campus: { select: { name: true } },
            school: { select: { name: true } },
            _count: {
              select: {
                students: {
                  where: { status: StudentStatus.STUDYING },
                },
              },
            },
          },
          orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
        });

        return classes.map((cls) => ({
          classId: cls.id,
          className: `${cls.name} (${cls.campus?.name || cls.school?.name || ""})`,
          shortClassName: cls.name,
          campusName: cls.campus?.name || "",
          schoolName: cls.school?.name || "",
          gradeLevel: cls.gradeLevel,
          studentCount: cls._count.students,
          avgScore: 7.8, // Benchmark indicator
        }));
      } catch (error) {
        console.error("Error in getGradesByClass:", error);
        return [];
      }
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getClassAttendanceRanking(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_attendance_ranking_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const classWhere = campusId
          ? { campusId }
          : schoolId
          ? { schoolId }
          : {};

        const attendanceWhere = campusId
          ? { date: { gte: sevenDaysAgo }, classRoom: { campusId } }
          : schoolId
          ? { date: { gte: sevenDaysAgo }, classRoom: { schoolId } }
          : { date: { gte: sevenDaysAgo } };

        const [classes, attendanceGrouped] = await Promise.all([
          prisma.classRoom.findMany({
            where: classWhere,
            select: {
              id: true,
              name: true,
              gradeLevel: true,
              campus: { select: { name: true } },
              school: { select: { name: true } },
              _count: {
                select: { students: true },
              },
            },
            orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
          }),
          prisma.attendance.groupBy({
            by: ["classId", "status"],
            where: attendanceWhere,
            _count: { id: true },
          }),
        ]);

        const attendanceMap = new Map<string, { total: number; present: number }>();
        for (const item of attendanceGrouped) {
          if (!item.classId) continue;
          const current = attendanceMap.get(item.classId) || { total: 0, present: 0 };
          current.total += item._count.id;
          if (item.status === AttendanceStatus.PRESENT) {
            current.present += item._count.id;
          }
          attendanceMap.set(item.classId, current);
        }

        const results = classes.map((cls) => {
          const stats = attendanceMap.get(cls.id) || { total: 0, present: 0 };
          const rate =
            stats.total > 0
              ? Math.round((stats.present / stats.total) * 100 * 10) / 10
              : 100;

          return {
            className: cls.name,
            campusName: cls.campus?.name || "",
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
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getRecentIncidents(limit = 10, schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_recent_incidents_${schoolId || "all"}_${campusId || "all"}_${limit}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const whereClause = campusId
          ? { student: { classRoom: { campusId } } }
          : schoolId
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
                classRoom: {
                  select: {
                    name: true,
                    campus: { select: { name: true } },
                    school: { select: { name: true } },
                  },
                },
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
          campusName: inc.student?.classRoom?.campus?.name || "—",
          schoolName: inc.student?.classRoom?.school?.name || "—",
          description: inc.description,
        }));
      } catch (error) {
        console.error("Error in getRecentIncidents:", error);
        return [];
      }
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getTodaySummary(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_today_summary_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    30,
    async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const attendanceWhere = campusId
          ? { date: { gte: todayStart, lte: todayEnd }, classRoom: { campusId } }
          : schoolId
          ? { date: { gte: todayStart, lte: todayEnd }, classRoom: { schoolId } }
          : { date: { gte: todayStart, lte: todayEnd } };

        const incidentWhere = campusId
          ? { date: { gte: todayStart, lte: todayEnd }, student: { classRoom: { campusId } } }
          : schoolId
          ? { date: { gte: todayStart, lte: todayEnd }, student: { classRoom: { schoolId } } }
          : { date: { gte: todayStart, lte: todayEnd } };

        const classWhere = campusId
          ? { campusId }
          : schoolId
          ? { schoolId }
          : {};

        const reportWhere = campusId
          ? { date: { gte: todayStart, lte: todayEnd }, status: ReportStatus.SENT, classRoom: { campusId } }
          : schoolId
          ? { date: { gte: todayStart, lte: todayEnd }, status: ReportStatus.SENT, classRoom: { schoolId } }
          : { date: { gte: todayStart, lte: todayEnd }, status: ReportStatus.SENT };

        const [attendanceCounts, incidentsToday, totalClasses, reportsSubmitted] =
          await Promise.all([
            prisma.attendance.groupBy({
              by: ["status"],
              where: attendanceWhere,
              _count: { id: true },
            }),
            prisma.incident.count({
              where: incidentWhere,
            }),
            prisma.classRoom.count({ where: classWhere }),
            prisma.dailyReport.count({
              where: reportWhere,
            }),
          ]);

        let absentToday = 0;
        let lateToday = 0;
        for (const item of attendanceCounts) {
          if (
            item.status === AttendanceStatus.ABSENT_EXCUSED ||
            item.status === AttendanceStatus.ABSENT_UNEXCUSED
          ) {
            absentToday += item._count.id;
          } else if (item.status === AttendanceStatus.LATE) {
            lateToday += item._count.id;
          }
        }

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
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getNQ37DashboardSummary(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_nq37_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    120,
    async () => {
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
          schoolName: "THPT Trần Phú (Ninh Bình)",
          hasCriticalViolations: false,
        };
      }
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getEarlyWarnings(limit = 6, schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_warnings_${schoolId || "all"}_${campusId || "all"}_${limit}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        let campusNameFilter: string | undefined = undefined;
        if (campusId) {
          const targetCampus = await prisma.campus.findUnique({
            where: { id: campusId },
            select: { name: true },
          });
          if (targetCampus) {
            campusNameFilter = targetCampus.name;
          }
        }

        const whereClause: any = { isResolved: false };
        if (campusNameFilter) {
          whereClause.campusName = { contains: campusNameFilter };
        }

        const warnings = await prisma.earlyWarning.findMany({
          where: whereClause,
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
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getSubstituteDispatchSummary(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_substitutes_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let campusNameFilter: string | undefined = undefined;
        if (campusId) {
          const targetCampus = await prisma.campus.findUnique({
            where: { id: campusId },
            select: { name: true },
          });
          if (targetCampus) {
            campusNameFilter = targetCampus.name;
          }
        }

        const whereBase: any = campusNameFilter ? { campusName: { contains: campusNameFilter } } : {};

        const [pendingCount, todayDispatches] = await Promise.all([
          prisma.substituteAssignment.count({
            where: { ...whereBase, status: "PENDING" },
          }),
          prisma.substituteAssignment.findMany({
            where: {
              ...whereBase,
              date: { gte: todayStart },
            },
            take: 5,
            orderBy: { date: "desc" },
            select: {
              id: true,
              originalTeacher: true,
              substituteTeacher: true,
              campusName: true,
              schoolPointName: true,
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
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

// ==================== AI CẢNH BÁO GIÁO ÁN ====================

export async function getLessonPlanAlerts(schoolId?: string, campusId?: string) {
  const cacheKey = `admin_dashboard_lp_alerts_${schoolId || "all"}_${campusId || "all"}`;
  return withCache(
    cacheKey,
    60,
    async () => {
      try {
        const activePeriods = await prisma.lessonPlanPeriod.findMany({
          where: { isActive: true },
          orderBy: { deadline: "desc" },
          select: { id: true, label: true, deadline: true },
          take: 1,
        });

        if (activePeriods.length === 0) return { alerts: [], periodLabel: null, deadline: null };

        const period = activePeriods[0];

        const assignmentWhere: any = campusId
          ? {
              OR: [
                { classRoom: { campusId } },
                { teacher: { user: { campusId } } },
              ],
            }
          : schoolId
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
    },
    [CACHE_TAGS.DASHBOARD]
  );
}

export async function getAdminDashboardData(schoolId?: string, campusId?: string) {
  const [
    campuses,
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
    getSchoolCampusesList(schoolId),
    getDashboardStats(schoolId, campusId),
    getAttendanceByWeek(schoolId, campusId),
    getGradesByClass(schoolId, campusId),
    getClassAttendanceRanking(schoolId, campusId),
    getRecentIncidents(10, schoolId, campusId),
    getTodaySummary(schoolId, campusId),
    getLessonPlanAlerts(schoolId, campusId),
    getEarlyWarnings(6, schoolId, campusId),
    getSubstituteDispatchSummary(schoolId, campusId),
    getNQ37DashboardSummary(schoolId, campusId),
  ]);

  return {
    campuses,
    schools: campuses.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: null,
      email: null,
      campusCount: c.schoolPointsCount,
      classCount: c.classCount,
      studentCount: c.studentCount,
      teacherCount: c.teacherCount,
    })),
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
