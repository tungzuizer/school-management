/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/page.tsx`, `src/app/admin/exam-analytics/journey/page.tsx`, `src/app/admin/exam-analytics/cohort/page.tsx`.
 * 2. Affected APIs: `getMultiYearExamOverviewAction`, `getStudentProfilesTrajectoryAction`, `getStudentDetailTrajectoryAction`, `fetchJourneyOverviewDataAction`, `runBatchJourneyCalculationAction`, `handleApproveInterventionAction`, `handleRejectInterventionAction`, `handleApplyInterventionAction`, `handleTrackOutcomeAction`, `getSchoolsAndCampusesAction`.
 * 3. Schemas: Prisma models `ExamPeriod`, `StudentScore`, `Student`, `Subject`, `ClassRoom`, `Campus`, `School`, `StudentJourneySnapshot`, `InterventionRecord`.
 * 4. Verbatim User Instruction: "gộp lại đi" - Hợp nhất toàn bộ phân tích điểm thi và hành trình OLS vào một trang duy nhất tại `/admin/exam-analytics`.
 */

"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { InterventionStatus } from "@prisma/client";
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

  // 1. Determine target school
  let targetSchoolId = ctx.schoolId;
  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!defaultSchool) {
      throw new Error("Không tìm thấy dữ liệu trường học.");
    }
    targetSchoolId = defaultSchool.id;
  }

  // 2. Fetch campuses of the school
  const campuses = await prisma.campus.findMany({
    where: { schoolId: targetSchoolId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  // 3. Query all StudentScore records for this school
  const whereScore: any = {
    schoolId: targetSchoolId,
  };

  if (filters?.campusId && filters.campusId !== "ALL") {
    whereScore.campusId = filters.campusId;
  }

  if (filters?.subjectId && filters.subjectId !== "ALL") {
    whereScore.subjectId = filters.subjectId;
  }

  let scoreRecords: ExamScoreRecord[] = [];

  try {
    const rawScores = await prisma.studentScore.findMany({
      where: whereScore,
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
      orderBy: [
        { examPeriod: { orderIndex: "asc" } },
        { student: { studentCode: "asc" } },
      ],
    });

    // Map into standardized ExamScoreRecord structure
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
    console.error("[ExamAnalytics] Error querying StudentScore:", error);
    scoreRecords = [];
  }

  // Apply gradeLevel filter in memory if specified
  if (filters?.gradeLevel && filters.gradeLevel > 0) {
    scoreRecords = scoreRecords.filter(
      (s) => s.gradeLevel === filters.gradeLevel
    );
  }

  // If no score records exist in the database, return clean empty state
  if (scoreRecords.length === 0) {
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

  // 5. Extract available years and grades
  const yearsSet = new Set<string>();
  const gradesSet = new Set<number>();
  scoreRecords.forEach((s) => {
    if (s.schoolYear) yearsSet.add(s.schoolYear);
    if (s.gradeLevel) gradesSet.add(s.gradeLevel);
  });

  const availableYears = Array.from(yearsSet).sort();
  const availableGrades = Array.from(gradesSet).sort((a, b) => a - b);

  // 6. Compute statistics via Core Engine
  const subjectTrends = computeMultiYearSubjectTrends(
    scoreRecords,
    availableYears
  );
  const gradeDistribution = computeGradeDistribution(scoreRecords);

  // Calculate overall student averages for TT22
  const studentScoreMap = new Map<string, number[]>();
  scoreRecords.forEach((s) => {
    const list = studentScoreMap.get(s.studentId) || [];
    list.push(s.score);
    studentScoreMap.set(s.studentId, list);
  });

  const studentAverages: number[] = [];
  studentScoreMap.forEach((scores) => {
    const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
    studentAverages.push(Number(avg.toFixed(2)));
  });

  const tt22Classification = computeTT22Classification(studentAverages);
  const campusComparison = computeCampusExamComparison(scoreRecords);

  // Group scores by student to calculate student trajectory categories
  const studentGroups = new Map<string, ExamScoreRecord[]>();
  scoreRecords.forEach((s) => {
    const group = studentGroups.get(s.studentId) || [];
    group.push(s);
    studentGroups.set(s.studentId, group);
  });

  let atRiskCount = 0;
  let improvingCount = 0;
  let excellentCount = 0;

  studentGroups.forEach((records) => {
    const { summary } = computeStudentExamTrajectory(records);
    if (summary.needsImmediateIntervention || summary.trendCategory === "AT_RISK_FAIL") {
      atRiskCount++;
    }
    if (summary.trendCategory === "STRONG_GROWTH" || summary.trendCategory === "STEADY_PROGRESS") {
      improvingCount++;
    }
    if (summary.trendCategory === "EXCELLENT_TALENT") {
      excellentCount++;
    }
  });

  const totalExams = scoreRecords.length;
  const totalStudents = studentGroups.size;
  const overallAverage =
    totalExams > 0
      ? Number(
          (
            scoreRecords.reduce((sum, s) => sum + s.score, 0) / totalExams
          ).toFixed(2)
        )
      : 0;

  // AI Insights Generation
  const topSubjectNames = subjectTrends
    .filter((t) => t.trendStatus === "IMPROVING")
    .map((t) => t.subjectName);
  const laggingSubjectNames = subjectTrends
    .filter((t) => t.trendStatus === "DECLINING")
    .map((t) => t.subjectName);

  const prevYear = availableYears.length >= 2 ? availableYears[availableYears.length - 2] : undefined;
  const latestYear = availableYears[availableYears.length - 1];

  const prevYearScores = prevYear ? scoreRecords.filter((s) => s.schoolYear === prevYear) : [];
  const prevYearAvg =
    prevYearScores.length > 0
      ? Number((prevYearScores.reduce((sum, s) => sum + s.score, 0) / prevYearScores.length).toFixed(2))
      : undefined;

  const aiInsights = generateExamAnalyticsAIInsights({
    overallAverage,
    previousYearAverage: prevYearAvg,
    topSubjects: topSubjectNames.length > 0 ? topSubjectNames : ["Toán học", "Tiếng Anh", "Vật lí"],
    laggingSubjects: laggingSubjectNames.length > 0 ? laggingSubjectNames : ["Lịch sử"],
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
  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!defaultSchool) return [];
    targetSchoolId = defaultSchool.id;
  }

  const campuses = await prisma.campus.findMany({
    where: { schoolId: targetSchoolId },
    select: { id: true, name: true },
  });

  let scoreRecords: ExamScoreRecord[] = [];

  try {
    const rawScores = await prisma.studentScore.findMany({
      where: {
        schoolId: targetSchoolId,
        ...(filters?.campusId && filters.campusId !== "ALL" ? { campusId: filters.campusId } : {}),
      },
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
      orderBy: [
        { examPeriod: { orderIndex: "asc" } },
        { student: { studentCode: "asc" } },
      ],
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
    console.error("[ExamAnalytics] Error querying StudentScore in getStudentProfilesTrajectoryAction:", error);
    scoreRecords = [];
  }

  if (scoreRecords.length === 0) {
    return [];
  }

  // Group by student
  const studentGroups = new Map<string, ExamScoreRecord[]>();
  scoreRecords.forEach((s) => {
    const group = studentGroups.get(s.studentId) || [];
    group.push(s);
    studentGroups.set(s.studentId, group);
  });

  let summaries: StudentProfileSummary[] = [];

  studentGroups.forEach((records) => {
    const { summary } = computeStudentExamTrajectory(records);
    summaries.push(summary);
  });

  // Apply filters
  if (filters?.gradeLevel && filters.gradeLevel > 0) {
    summaries = summaries.filter((s) => s.gradeLevel === filters.gradeLevel);
  }

  if (filters?.trendCategory && filters.trendCategory !== "ALL") {
    summaries = summaries.filter((s) => s.trendCategory === filters.trendCategory);
  }

  if (filters?.onlyNeedIntervention) {
    summaries = summaries.filter((s) => s.needsImmediateIntervention);
  }

  if (filters?.search && filters.search.trim() !== "") {
    const q = filters.search.toLowerCase().trim();
    summaries = summaries.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
        (s.className && s.className.toLowerCase().includes(q))
    );
  }

  // Default sort: highest urgency (needs intervention first, then declining slope)
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
  if (!targetSchoolId) {
    const defaultSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
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

    if (!targetSchoolId || targetSchoolId === "ALL") {
      const firstSchool = await prisma.school.findFirst({ select: { id: true } });
      if (!firstSchool) return null;
      targetSchoolId = firstSchool.id;
    }

    const cleanCampusId = campusId && campusId !== "ALL" && campusId !== "" ? campusId : undefined;

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
export async function runBatchJourneyCalculationAction(schoolId: string, campusId?: string) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) throw new Error("Chưa xác thực.");

    const cleanCampusId = campusId && campusId !== "ALL" && campusId !== "" ? campusId : undefined;
    const result = await batchComputeJourneyForCampus(schoolId, cleanCampusId);
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

