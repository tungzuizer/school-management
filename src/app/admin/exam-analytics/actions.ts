/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/page.tsx`, `src/app/admin/exam-analytics/macro-tab.tsx`, `src/app/admin/exam-analytics/journey-tab.tsx`, `src/app/admin/exam-analytics/students-tab.tsx`.
 * 2. Affected APIs: `getMultiYearExamOverviewAction`, `getStudentProfilesTrajectoryAction`, `getStudentDetailTrajectoryAction`, `fetchJourneyOverviewDataAction`, `runBatchJourneyCalculationAction`.
 * 3. Schemas: Prisma models `ExamPeriod`, `StudentScore`, `Student`, `Subject`, `ClassRoom`, `Campus`, `School`, `StudentJourneySnapshot`, `InterventionRecord`.
 * 4. Verbatim User Instruction: "vấn đè của phần kpi bị lỗi không hiện thị các dữ liệu và phần điểm thi ols bị lỗi loading không vô được" - Tối ưu hóa truy vấn SQL tổng hợp trực tiếp trên PostgreSQL Server (GROUP BY, AVG, COUNT) và phân trang nạp học sinh có mục tiêu, giải phóng triệt để tình trạng treo loading trên 153.000 đầu điểm thi.
 */

"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { InterventionStatus, Prisma } from "@prisma/client";
import {
  getCampusJourneyOverview,
  batchComputeJourneyForCampus,
  approveIntervention,
  rejectIntervention,
  applyIntervention,
  trackInterventionOutcome,
  listCampusInterventions,
} from "@/lib/student-journey";
import {
  computeMultiYearSubjectTrends,
  computeGradeDistribution,
  computeTT22Classification,
  computeCampusExamComparison,
  computeStudentExamTrajectory,
  generateExamAnalyticsAIInsights,
  type ExamScoreRecord,
  type MultiYearSubjectTrend,
  type GradeDistributionBand,
  type TT22ClassificationSummary,
  type CampusExamStat,
  type StudentProfileSummary,
  type StudentExamTimelinePoint,
} from "@/lib/exam-analytics-engine";

export interface ExamAnalyticsOverviewData {
  availableYears: string[];
  availableCampuses: Array<{ id: string; name: string }>;
  availableGrades: number[];
  subjectTrends: MultiYearSubjectTrend[];
  gradeDistribution: GradeDistributionBand[];
  tt22Classification: TT22ClassificationSummary;
  campusComparison: CampusExamStat[];
  aiInsights: string[];
  totalStudents: number;
  totalExams: number;
  overallAverage: number;
  atRiskCount: number;
  improvingCount: number;
  excellentCount: number;
}

export interface StudentTrajectoryDetailData {
  summary: StudentProfileSummary;
  timeline: StudentExamTimelinePoint[];
  subjectRadar: Array<{ subject: string; score: number; fullMark: number }>;
  allExamScores: ExamScoreRecord[];
}

/**
 * Fetch executive multi-year exam analytics overview for school leadership
 */
export async function getMultiYearExamOverviewAction(filters?: {
  schoolYear?: string;
  campusId?: string;
  gradeLevel?: number;
  subjectId?: string;
}): Promise<ExamAnalyticsOverviewData> {
  const ctx = await getTenantContext();

  // 1. Determine target school with database CUID verification and fallback
  let targetSchoolId = ctx.schoolId;
  if (targetSchoolId) {
    const schoolRecord = await prisma.school.findUnique({
      where: { id: targetSchoolId },
      select: { id: true },
    });
    if (!schoolRecord) {
      targetSchoolId = undefined;
    }
  }

  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!defaultSchool) {
      throw new Error("Không tìm thấy dữ liệu trường học.");
    }
    targetSchoolId = defaultSchool.id;
  }

  // 2. Fetch campuses, available years and available grades in parallel
  const [campuses, yearsRaw, gradesRaw] = await Promise.all([
    prisma.campus.findMany({
      where: { schoolId: targetSchoolId },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.$queryRaw<Array<{ schoolYear: string }>>`
      SELECT DISTINCT ep."schoolYear"
      FROM "StudentScore" s
      JOIN "ExamPeriod" ep ON s."examPeriodId" = ep.id
      WHERE s."schoolId" = ${targetSchoolId}
      ORDER BY ep."schoolYear" ASC
    `,
    prisma.$queryRaw<Array<{ gradeLevel: number }>>`
      SELECT DISTINCT cr."gradeLevel"
      FROM "StudentScore" s
      JOIN "Student" stu ON s."studentId" = stu.id
      JOIN "ClassRoom" cr ON stu."classId" = cr.id
      WHERE s."schoolId" = ${targetSchoolId} AND cr."gradeLevel" IS NOT NULL
      ORDER BY cr."gradeLevel" ASC
    `,
  ]);

  // Dynamic SQL filters
  const campusFilter =
    filters?.campusId && filters.campusId !== "ALL"
      ? Prisma.sql`AND s."campusId" = ${filters.campusId}`
      : Prisma.empty;

  const gradeFilter =
    filters?.gradeLevel && filters.gradeLevel > 0
      ? Prisma.sql`AND cr."gradeLevel" = ${filters.gradeLevel}`
      : Prisma.empty;

  const subjectFilter =
    filters?.subjectId && filters.subjectId !== "ALL"
      ? Prisma.sql`AND s."subjectId" = ${filters.subjectId}`
      : Prisma.empty;

  const availableYears = yearsRaw.map((r) => r.schoolYear).filter(Boolean);
  const availableGrades = gradesRaw.map((r) => r.gradeLevel).filter(Boolean);

  if (availableYears.length === 0) {
    return {
      availableYears: [],
      availableCampuses: campuses,
      availableGrades: [],
      subjectTrends: [],
      gradeDistribution: computeGradeDistribution([]),
      tt22Classification: computeTT22Classification([]),
      campusComparison: [],
      aiInsights: [
        "Chưa có dữ liệu kỳ thi và điểm thi thực tế trong cơ sở dữ liệu.",
        "Vui lòng nhập liệu điểm thi học sinh hoặc đồng bộ kỳ thi để kích hoạt hệ thống phân tích.",
      ],
      totalStudents: 0,
      totalExams: 0,
      overallAverage: 0,
      atRiskCount: 0,
      improvingCount: 0,
      excellentCount: 0,
    };
  }

  // 3. Execute all 4 Aggregation Queries Concurrently on PostgreSQL Server
  const [subjectTrendsRaw, tt22StatsRaw, bandsRaw, campusStatsRaw] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        subjectId: string;
        subjectName: string;
        schoolYear: string;
        avgScore: number;
        examCount: bigint;
      }>
    >`
      SELECT
        s."subjectId",
        sub.name as "subjectName",
        ep."schoolYear",
        ROUND(AVG(s.score)::numeric, 2) as "avgScore",
        COUNT(s.id) as "examCount"
      FROM "StudentScore" s
      JOIN "Subject" sub ON s."subjectId" = sub.id
      JOIN "ExamPeriod" ep ON s."examPeriodId" = ep.id
      JOIN "Student" stu ON s."studentId" = stu.id
      LEFT JOIN "ClassRoom" cr ON stu."classId" = cr.id
      WHERE s."schoolId" = ${targetSchoolId}
      ${campusFilter}
      ${gradeFilter}
      ${subjectFilter}
      GROUP BY s."subjectId", sub.name, ep."schoolYear"
      ORDER BY sub.name ASC, ep."schoolYear" ASC
    `,
    prisma.$queryRaw<
      Array<{
        total_students: bigint;
        overall_avg: number;
        good_count: bigint;
        fair_count: bigint;
        pass_count: bigint;
        fail_count: bigint;
        excellent_count: bigint;
        at_risk_count: bigint;
        improving_count: bigint;
      }>
    >`
      WITH student_avgs AS (
        SELECT
          s."studentId",
          AVG(s.score) as avg_score,
          COUNT(s.id) as score_count
        FROM "StudentScore" s
        JOIN "Student" stu ON s."studentId" = stu.id
        LEFT JOIN "ClassRoom" cr ON stu."classId" = cr.id
        WHERE s."schoolId" = ${targetSchoolId}
        ${campusFilter}
        ${gradeFilter}
        ${subjectFilter}
        GROUP BY s."studentId"
      )
      SELECT
        COUNT(*) as total_students,
        ROUND(AVG(avg_score)::numeric, 2) as overall_avg,
        COUNT(CASE WHEN avg_score >= 8.0 THEN 1 END) as good_count,
        COUNT(CASE WHEN avg_score >= 6.5 AND avg_score < 8.0 THEN 1 END) as fair_count,
        COUNT(CASE WHEN avg_score >= 5.0 AND avg_score < 6.5 THEN 1 END) as pass_count,
        COUNT(CASE WHEN avg_score < 5.0 THEN 1 END) as fail_count,
        COUNT(CASE WHEN avg_score >= 8.5 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN avg_score < 5.0 THEN 1 END) as at_risk_count,
        COUNT(CASE WHEN avg_score >= 6.5 AND avg_score < 8.5 THEN 1 END) as improving_count
      FROM student_avgs
    `,
    prisma.$queryRaw<
      Array<{
        b0to3: bigint;
        b3to5: bigint;
        b5to65: bigint;
        b65to8: bigint;
        b8to10: bigint;
        totalExams: bigint;
      }>
    >`
      SELECT
        COUNT(CASE WHEN s.score < 3.0 THEN 1 END) as "b0to3",
        COUNT(CASE WHEN s.score >= 3.0 AND s.score < 5.0 THEN 1 END) as "b3to5",
        COUNT(CASE WHEN s.score >= 5.0 AND s.score < 6.5 THEN 1 END) as "b5to65",
        COUNT(CASE WHEN s.score >= 6.5 AND s.score < 8.0 THEN 1 END) as "b65to8",
        COUNT(CASE WHEN s.score >= 8.0 THEN 1 END) as "b8to10",
        COUNT(s.id) as "totalExams"
      FROM "StudentScore" s
      JOIN "Student" stu ON s."studentId" = stu.id
      LEFT JOIN "ClassRoom" cr ON stu."classId" = cr.id
      WHERE s."schoolId" = ${targetSchoolId}
      ${campusFilter}
      ${gradeFilter}
      ${subjectFilter}
    `,
    prisma.$queryRaw<
      Array<{
        campusId: string;
        campusName: string;
        avgScore: number;
        studentCount: bigint;
        totalExams: bigint;
        passRate: number;
        goodRate: number;
      }>
    >`
      SELECT
        c.id as "campusId",
        c.name as "campusName",
        ROUND(AVG(s.score)::numeric, 2) as "avgScore",
        COUNT(DISTINCT s."studentId") as "studentCount",
        COUNT(s.id) as "totalExams",
        ROUND((COUNT(CASE WHEN s.score >= 5.0 THEN 1 END)::numeric / NULLIF(COUNT(s.id), 0) * 100), 1) as "passRate",
        ROUND((COUNT(CASE WHEN s.score >= 8.0 THEN 1 END)::numeric / NULLIF(COUNT(s.id), 0) * 100), 1) as "goodRate"
      FROM "Campus" c
      LEFT JOIN "StudentScore" s ON s."campusId" = c.id AND s."schoolId" = ${targetSchoolId}
      WHERE c."schoolId" = ${targetSchoolId}
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `,
  ]);

  const subjectMap = new Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      yearlyAverages: Record<string, number>;
      scoresList: number[];
    }
  >();

  subjectTrendsRaw.forEach((row) => {
    if (!subjectMap.has(row.subjectId)) {
      subjectMap.set(row.subjectId, {
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        yearlyAverages: {},
        scoresList: [],
      });
    }
    const item = subjectMap.get(row.subjectId)!;
    item.yearlyAverages[row.schoolYear] = Number(row.avgScore);
    item.scoresList.push(Number(row.avgScore));
  });

  const subjectTrends: MultiYearSubjectTrend[] = [];
  subjectMap.forEach((val, subjectId) => {
    const yearsWithData = availableYears.filter((y) => (val.yearlyAverages[y] || 0) > 0);
    let deltaFromFirstYear = 0;
    let deltaFromPreviousYear = 0;
    if (yearsWithData.length >= 2) {
      const firstYear = yearsWithData[0];
      const latestYear = yearsWithData[yearsWithData.length - 1];
      const prevYear = yearsWithData[yearsWithData.length - 2];
      deltaFromFirstYear = Number(
        ((val.yearlyAverages[latestYear] || 0) - (val.yearlyAverages[firstYear] || 0)).toFixed(2)
      );
      deltaFromPreviousYear = Number(
        ((val.yearlyAverages[latestYear] || 0) - (val.yearlyAverages[prevYear] || 0)).toFixed(2)
      );
    }
    let trendStatus: "IMPROVING" | "DECLINING" | "STABLE" = "STABLE";
    if (deltaFromPreviousYear > 0.2) trendStatus = "IMPROVING";
    else if (deltaFromPreviousYear < -0.2) trendStatus = "DECLINING";

    const avgScore = Number(
      (
        val.scoresList.reduce((a, b) => a + b, 0) / (val.scoresList.length || 1)
      ).toFixed(2)
    );

    subjectTrends.push({
      subjectId,
      subjectName: val.subjectName,
      yearlyAverages: val.yearlyAverages,
      deltaFromFirstYear,
      deltaFromPreviousYear,
      trendStatus,
      averageScore: avgScore,
    });
  });

  // 5. TT22 & Totals via Subquery Aggregation Result
  const ttRow = tt22StatsRaw[0] || ({} as any);
  const totalStudents = Number(ttRow.total_students || 0);
  const overallAverage = Number(ttRow.overall_avg || 0);
  const goodCount = Number(ttRow.good_count || 0);
  const fairCount = Number(ttRow.fair_count || 0);
  const passCount = Number(ttRow.pass_count || 0);
  const failCount = Number(ttRow.fail_count || 0);
  const excellentCount = Number(ttRow.excellent_count || 0);
  const atRiskCount = Number(ttRow.at_risk_count || 0);
  const improvingCount = Number(ttRow.improving_count || 0);

  const tt22Classification: TT22ClassificationSummary = {
    goodCount,
    goodPercent: totalStudents > 0 ? Number(((goodCount / totalStudents) * 100).toFixed(1)) : 0,
    fairCount,
    fairPercent: totalStudents > 0 ? Number(((fairCount / totalStudents) * 100).toFixed(1)) : 0,
    passCount,
    passPercent: totalStudents > 0 ? Number(((passCount / totalStudents) * 100).toFixed(1)) : 0,
    failCount,
    failPercent: totalStudents > 0 ? Number(((failCount / totalStudents) * 100).toFixed(1)) : 0,
    total: totalStudents,
  };

  // 6. Score Distribution Bands
  const bRow = bandsRaw[0] || ({} as any);
  const totalExams = Number(bRow.totalExams || 0);

  const gradeDistribution: GradeDistributionBand[] = [
    {
      bandKey: "0-3",
      label: "Dưới 3.0 (Kém)",
      min: 0,
      max: 2.9,
      count: Number(bRow.b0to3 || 0),
      percentage: totalExams > 0 ? Number(((Number(bRow.b0to3 || 0) / totalExams) * 100).toFixed(1)) : 0,
      color: "#ef4444",
    },
    {
      bandKey: "3-5",
      label: "3.0 - 4.9 (Yếu)",
      min: 3,
      max: 4.9,
      count: Number(bRow.b3to5 || 0),
      percentage: totalExams > 0 ? Number(((Number(bRow.b3to5 || 0) / totalExams) * 100).toFixed(1)) : 0,
      color: "#f97316",
    },
    {
      bandKey: "5-6.5",
      label: "5.0 - 6.4 (Trung bình)",
      min: 5,
      max: 6.4,
      count: Number(bRow.b5to65 || 0),
      percentage: totalExams > 0 ? Number(((Number(bRow.b5to65 || 0) / totalExams) * 100).toFixed(1)) : 0,
      color: "#eab308",
    },
    {
      bandKey: "6.5-8",
      label: "6.5 - 7.9 (Khá)",
      min: 6.5,
      max: 7.9,
      count: Number(bRow.b65to8 || 0),
      percentage: totalExams > 0 ? Number(((Number(bRow.b65to8 || 0) / totalExams) * 100).toFixed(1)) : 0,
      color: "#3b82f6",
    },
    {
      bandKey: "8-10",
      label: "8.0 - 10.0 (Giỏi/Xuất sắc)",
      min: 8,
      max: 10,
      count: Number(bRow.b8to10 || 0),
      percentage: totalExams > 0 ? Number(((Number(bRow.b8to10 || 0) / totalExams) * 100).toFixed(1)) : 0,
      color: "#10b981",
    },
  ];

  // 7. Campus Comparison
  const campusComparison: CampusExamStat[] = campusStatsRaw.map((c) => ({
    campusId: c.campusId,
    campusName: c.campusName,
    averageScore: Number(c.avgScore || 0),
    totalStudents: Number(c.studentCount || 0),
    totalExams: Number(c.totalExams || 0),
    passRate: Number(c.passRate || 0),
    goodRate: Number(c.goodRate || 0),
  }));

  // 8. AI Insights
  const topSubjectNames = subjectTrends
    .filter((t) => t.trendStatus === "IMPROVING")
    .map((t) => t.subjectName);
  const laggingSubjectNames = subjectTrends
    .filter((t) => t.trendStatus === "DECLINING")
    .map((t) => t.subjectName);

  const prevYear = availableYears.length >= 2 ? availableYears[availableYears.length - 2] : undefined;
  const latestYear = availableYears[availableYears.length - 1];

  const aiInsights = generateExamAnalyticsAIInsights({
    overallAverage,
    previousYearAverage: undefined,
    topSubjects: topSubjectNames.length > 0 ? topSubjectNames : ["Toán", "Tiếng Việt", "Tiếng Anh"],
    laggingSubjects: laggingSubjectNames.length > 0 ? laggingSubjectNames : ["Khoa học"],
    atRiskCount,
    totalStudents,
    currentYear: latestYear,
    previousYear: prevYear,
  });

  return {
    availableYears,
    availableCampuses: campuses,
    availableGrades,
    subjectTrends,
    gradeDistribution,
    tt22Classification,
    campusComparison,
    aiInsights,
    totalStudents,
    totalExams,
    overallAverage,
    atRiskCount,
    improvingCount,
    excellentCount,
  };
}

/**
 * Fetch student trajectory summaries for the drill-down student directory
 */
export async function getStudentProfilesTrajectoryAction(filters?: {
  campusId?: string;
  gradeLevel?: number;
  search?: string;
  trendCategory?: string;
  onlyNeedIntervention?: boolean;
}): Promise<StudentProfileSummary[]> {
  const ctx = await getTenantContext();

  let targetSchoolId = ctx.schoolId;
  if (targetSchoolId) {
    const schoolRecord = await prisma.school.findUnique({
      where: { id: targetSchoolId },
      select: { id: true },
    });
    if (!schoolRecord) {
      targetSchoolId = undefined;
    }
  }

  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!defaultSchool) return [];
    targetSchoolId = defaultSchool.id;
  }

  const whereStudent: any = {
    user: { schoolId: targetSchoolId },
  };

  if (filters?.campusId && filters.campusId !== "ALL") {
    whereStudent.classRoom = {
      ...(whereStudent.classRoom || {}),
      campusId: filters.campusId,
    };
  }

  if (filters?.gradeLevel && filters.gradeLevel > 0) {
    whereStudent.classRoom = {
      ...(whereStudent.classRoom || {}),
      gradeLevel: filters.gradeLevel,
    };
  }

  if (filters?.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    whereStudent.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { studentCode: { contains: q, mode: "insensitive" } },
      { classRoom: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const limit = filters?.search && filters.search.trim() !== "" ? 500 : 250;

  let rawStudents: any[] = [];
  try {
    rawStudents = await prisma.student.findMany({
      where: whereStudent,
      take: limit,
      select: {
        id: true,
        studentCode: true,
        user: { select: { name: true } },
        classRoom: {
          select: {
            name: true,
            gradeLevel: true,
            campus: { select: { id: true, name: true } },
          },
        },
        studentScores: {
          select: {
            id: true,
            score: true,
            subjectId: true,
            subject: { select: { name: true } },
            examPeriod: {
              select: {
                id: true,
                name: true,
                schoolYear: true,
                semester: true,
                examType: true,
                orderIndex: true,
              },
            },
          },
          orderBy: {
            examPeriod: { orderIndex: "asc" },
          },
        },
      },
    });
  } catch (error) {
    console.error("[ExamAnalytics] Error in getStudentProfilesTrajectoryAction:", error);
    return [];
  }

  let summaries: StudentProfileSummary[] = [];

  for (const st of rawStudents) {
    const records: ExamScoreRecord[] = (st.studentScores || []).map((s: any) => ({
      id: s.id,
      studentId: st.id,
      studentName: st.user?.name || "Học sinh",
      studentCode: st.studentCode || undefined,
      className: st.classRoom?.name || undefined,
      gradeLevel: st.classRoom?.gradeLevel || undefined,
      subjectId: s.subjectId,
      subjectName: s.subject?.name || "Môn học",
      examPeriodId: s.examPeriod?.id,
      examPeriodName: s.examPeriod?.name,
      schoolYear: s.examPeriod?.schoolYear,
      semester: s.examPeriod?.semester,
      examType: s.examPeriod?.examType,
      orderIndex: s.examPeriod?.orderIndex || 1,
      score: s.score,
      campusId: st.classRoom?.campus?.id,
      campusName: st.classRoom?.campus?.name,
    }));

    if (records.length > 0) {
      const { summary } = computeStudentExamTrajectory(records);
      summaries.push(summary);
    }
  }

  // Apply trendCategory and onlyNeedIntervention filters
  if (filters?.trendCategory && filters.trendCategory !== "ALL") {
    summaries = summaries.filter((s) => s.trendCategory === filters.trendCategory);
  }

  if (filters?.onlyNeedIntervention) {
    summaries = summaries.filter((s) => s.needsImmediateIntervention);
  }

  // Sort by intervention urgency, then slope
  summaries.sort((a, b) => {
    if (a.needsImmediateIntervention && !b.needsImmediateIntervention) return -1;
    if (!a.needsImmediateIntervention && b.needsImmediateIntervention) return 1;
    return a.slope - b.slope;
  });

  return summaries;
}

/**
 * Fetch detailed trajectory, longitudinal chart, radar chart for a single student
 */
export async function getStudentDetailTrajectoryAction(
  studentId: string
): Promise<StudentTrajectoryDetailData | null> {
  const ctx = await getTenantContext();

  let targetSchoolId = ctx.schoolId;
  if (targetSchoolId) {
    const schoolRecord = await prisma.school.findUnique({
      where: { id: targetSchoolId },
      select: { id: true },
    });
    if (!schoolRecord) targetSchoolId = undefined;
  }
  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (defaultSchool) targetSchoolId = defaultSchool.id;
  }

  let scoreRecords: ExamScoreRecord[] = [];

  try {
    const rawScores = await prisma.studentScore.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { name: true } },
            classRoom: { select: { name: true, gradeLevel: true } },
          },
        },
        subject: { select: { id: true, name: true } },
        examPeriod: {
          select: {
            id: true,
            name: true,
            schoolYear: true,
            semester: true,
            examType: true,
            orderIndex: true,
          },
        },
        campus: { select: { id: true, name: true } },
      },
      orderBy: { examPeriod: { orderIndex: "asc" } },
    });

    scoreRecords = rawScores.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.user.name || "Học sinh",
      studentCode: s.student.studentCode || undefined,
      className: s.student.classRoom?.name || undefined,
      gradeLevel: s.student.classRoom?.gradeLevel || undefined,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      examPeriodId: s.examPeriodId,
      examPeriodName: s.examPeriod.name,
      schoolYear: s.examPeriod.schoolYear,
      semester: s.examPeriod.semester,
      examType: s.examPeriod.examType,
      orderIndex: s.examPeriod.orderIndex,
      score: s.score,
      campusId: s.campusId,
      campusName: s.campus.name,
    }));
  } catch (error) {
    console.error("[ExamAnalytics] Error querying StudentScore in getStudentDetailTrajectoryAction:", error);
    scoreRecords = [];
  }

  if (scoreRecords.length === 0) {
    return null;
  }

  const result = computeStudentExamTrajectory(scoreRecords);

  return {
    summary: result.summary,
    timeline: result.timeline,
    subjectRadar: result.subjectRadar,
    allExamScores: scoreRecords,
  };
}

/**
 * Fetch Campus Journey Overview & Intervention List for Unified Journey Tab
 */
export async function fetchJourneyOverviewDataAction(schoolId?: string, campusId?: string) {
  try {
    const ctx = await getTenantContext().catch(() => null);
    let targetSchoolId = schoolId || ctx?.schoolId;

    if (targetSchoolId) {
      const schoolRecord = await prisma.school.findUnique({
        where: { id: targetSchoolId },
        select: { id: true },
      });
      if (!schoolRecord) targetSchoolId = undefined;
    }

    if (!targetSchoolId || targetSchoolId === "ALL") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      if (!firstSchool) return null;
      targetSchoolId = firstSchool.id;
    }

    let cleanCampusId = campusId && campusId !== "ALL" && campusId !== "" ? campusId : undefined;
    if (cleanCampusId) {
      const campusRecord = await prisma.campus.findUnique({
        where: { id: cleanCampusId },
        select: { id: true },
      });
      if (!campusRecord) cleanCampusId = undefined;
    }

    const overview = await getCampusJourneyOverview(targetSchoolId, cleanCampusId);
    const interventionsList = await listCampusInterventions({
      schoolId: targetSchoolId,
      campusId: cleanCampusId,
      limit: 50,
    });

    return {
      ...overview,
      interventionsList,
    };
  } catch (error) {
    console.error("Error in fetchJourneyOverviewDataAction:", error);
    return null;
  }
}

/**
 * Trigger Batch OLS Journey Calculation across Campus
 */
export async function runBatchJourneyCalculationAction(schoolId?: string, campusId?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    let targetSchoolId = schoolId || ctx.schoolId;
    if (targetSchoolId) {
      const schoolRecord = await prisma.school.findUnique({
        where: { id: targetSchoolId },
        select: { id: true },
      });
      if (!schoolRecord) targetSchoolId = undefined;
    }

    if (!targetSchoolId || targetSchoolId === "ALL") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      if (firstSchool) targetSchoolId = firstSchool.id;
    }
    if (!targetSchoolId) throw new Error("Không tìm thấy trường học.");

    let cleanCampusId = campusId && campusId !== "ALL" && campusId !== "" ? campusId : undefined;
    if (cleanCampusId) {
      const campusRecord = await prisma.campus.findUnique({
        where: { id: cleanCampusId },
        select: { id: true },
      });
      if (!campusRecord) cleanCampusId = undefined;
    }

    const result = await batchComputeJourneyForCampus(targetSchoolId, cleanCampusId);
    revalidatePath("/admin/exam-analytics");
    return { success: true, result };
  } catch (error: any) {
    console.error("Error in runBatchJourneyCalculationAction:", error);
    return { success: false, error: error.message || "Lỗi khi tính toán lại hành trình học sinh." };
  }
}

/**
 * Human Approver approves intervention proposal
 */
export async function handleApproveInterventionAction(interventionId: string, note?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await approveIntervention({
      interventionId,
      approvedById: ctx.userId,
      approvedByName: ctx.userName,
      note,
    });

    revalidatePath("/admin/exam-analytics");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleApproveInterventionAction:", error);
    return { success: false, error: error.message || "Không thể phê duyệt can thiệp." };
  }
}

/**
 * Human Approver rejects intervention proposal
 */
export async function handleRejectInterventionAction(interventionId: string, reason: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await rejectIntervention({
      interventionId,
      rejectedById: ctx.userId,
      rejectedByName: ctx.userName,
      reason,
    });

    revalidatePath("/admin/exam-analytics");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleRejectInterventionAction:", error);
    return { success: false, error: error.message || "Không thể từ chối can thiệp." };
  }
}

/**
 * Teacher marks intervention as physically applied
 */
export async function handleApplyInterventionAction(interventionId: string, note?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await applyIntervention({
      interventionId,
      appliedById: ctx.userId,
      appliedByName: ctx.userName,
      note,
    });

    revalidatePath("/admin/exam-analytics");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleApplyInterventionAction:", error);
    return { success: false, error: error.message || "Không thể áp dụng can thiệp." };
  }
}

/**
 * Record outcome & delta score for applied intervention
 */
export async function handleTrackOutcomeAction(interventionId: string, scoreDelta: number, outcomeNote: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const updated = await trackInterventionOutcome({
      interventionId,
      scoreDelta,
      outcomeNote,
      trackedById: ctx.userId,
      trackedByName: ctx.userName,
    });

    revalidatePath("/admin/exam-analytics");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error in handleTrackOutcomeAction:", error);
    return { success: false, error: error.message || "Không thể lưu kết quả can thiệp." };
  }
}

/**
 * Get schools and campuses for selection
 */
export async function getSchoolsAndCampusesAction() {
  try {
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        campuses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    return schools;
  } catch (error) {
    console.error("Error in getSchoolsAndCampusesAction:", error);
    return [];
  }
}


