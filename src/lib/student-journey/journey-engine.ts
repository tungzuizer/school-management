import { prisma } from "@/lib/prisma";
import {
  TrendLabel,
  TriggerSource,
  InterventionStatus,
  WarningCategory,
  WarningLevel,
  Prisma,
} from "@prisma/client";
import {
  computeJourneyMetrics,
  DEFAULT_JOURNEY_THRESHOLDS,
  JourneyDataPoint,
  JourneyThresholdParams,
  RegressionResult,
} from "./regression";

/**
 * Get or create campus-specific threshold configuration
 */
export async function getCampusJourneyConfig(
  schoolId: string,
  campusId: string
): Promise<JourneyThresholdParams & { id?: string }> {
  try {
    const config = await prisma.journeyThresholdConfig.findUnique({
      where: {
        schoolId_campusId: {
          schoolId,
          campusId,
        },
      },
    });

    if (config) {
      return {
        id: config.id,
        increasingSlope: config.increasingSlope,
        decliningSlope: config.decliningSlope,
        volatilityMax: config.volatilityMax,
        minPeriodsRequired: config.minPeriodsRequired,
      };
    }

    return DEFAULT_JOURNEY_THRESHOLDS;
  } catch (error) {
    console.error("Error fetching campus journey config:", error);
    return DEFAULT_JOURNEY_THRESHOLDS;
  }
}

/**
 * Save or update campus journey configuration
 */
export async function upsertCampusJourneyConfig(
  schoolId: string,
  campusId: string,
  params: Partial<JourneyThresholdParams>,
  userId?: string,
  userName?: string
) {
  const current = await getCampusJourneyConfig(schoolId, campusId);

  const updated = await prisma.journeyThresholdConfig.upsert({
    where: {
      schoolId_campusId: {
        schoolId,
        campusId,
      },
    },
    update: {
      increasingSlope: params.increasingSlope ?? current.increasingSlope,
      decliningSlope: params.decliningSlope ?? current.decliningSlope,
      volatilityMax: params.volatilityMax ?? current.volatilityMax,
      minPeriodsRequired: params.minPeriodsRequired ?? current.minPeriodsRequired,
    },
    create: {
      schoolId,
      campusId,
      increasingSlope: params.increasingSlope ?? DEFAULT_JOURNEY_THRESHOLDS.increasingSlope,
      decliningSlope: params.decliningSlope ?? DEFAULT_JOURNEY_THRESHOLDS.decliningSlope,
      volatilityMax: params.volatilityMax ?? DEFAULT_JOURNEY_THRESHOLDS.volatilityMax,
      minPeriodsRequired: params.minPeriodsRequired ?? DEFAULT_JOURNEY_THRESHOLDS.minPeriodsRequired,
    },
  });

  // Audit log
  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || "Admin",
        userRole: "ADMIN",
        schoolId,
        campusId,
        action: "UPDATE",
        entityName: "JourneyThresholdConfig",
        entityId: updated.id,
        description: `Cập nhật ngưỡng tính toán Hành trình học sinh cho cơ sở: Độ dốc tăng (+${updated.increasingSlope}), Độ dốc giảm (-${updated.decliningSlope}), Biến động tối đa (${updated.volatilityMax}), Số kỳ tối thiểu (${updated.minPeriodsRequired})`,
        changesJson: JSON.stringify(params),
      },
    });
  }

  return updated;
}

/**
 * Computes journey snapshot for a single student across all periods or a specific subject.
 */
export async function computeStudentJourney(
  studentId: string,
  subjectId?: string
): Promise<{
  metrics: RegressionResult;
  snapshotId?: string;
  dataPoints: JourneyDataPoint[];
}> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, schoolId: true } },
      classRoom: {
        select: {
          id: true,
          name: true,
          schoolId: true,
          campusId: true,
          school: { select: { name: true } },
          campus: { select: { name: true } },
        },
      },
    },
  });

  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const schoolId = student.classRoom?.schoolId || student.user?.schoolId || "";
  const campusId = student.classRoom?.campusId || "";

  if (!schoolId) {
    throw new Error(`School not found for student ${studentId}`);
  }

  // Load campus config
  const thresholdConfig = await getCampusJourneyConfig(schoolId, campusId);

  // Fetch all scores of this student ordered by ExamPeriod.orderIndex
  const whereScore: Prisma.StudentScoreWhereInput = {
    studentId,
    ...(subjectId ? { subjectId } : {}),
  };

  const scores = await prisma.studentScore.findMany({
    where: whereScore,
    include: {
      examPeriod: true,
      subject: { select: { id: true, name: true } },
    },
    orderBy: {
      examPeriod: {
        orderIndex: "asc",
      },
    },
  });

  if (scores.length === 0) {
    const emptyMetrics = computeJourneyMetrics([], thresholdConfig);
    return { metrics: emptyMetrics, dataPoints: [] };
  }

  // Group scores by examPeriod to get composite average if subjectId is omitted
  const periodMap = new Map<
    string,
    {
      period: typeof scores[0]["examPeriod"];
      scores: number[];
    }
  >();

  for (const s of scores) {
    const pId = s.examPeriodId;
    if (!periodMap.has(pId)) {
      periodMap.set(pId, { period: s.examPeriod, scores: [] });
    }
    periodMap.get(pId)!.scores.push(s.score);
  }

  // Convert to JourneyDataPoints
  const dataPoints: JourneyDataPoint[] = [];
  for (const [, entry] of periodMap.entries()) {
    const avgForPeriod =
      entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
    dataPoints.push({
      x: entry.period.orderIndex,
      score: Math.round(avgForPeriod * 100) / 100,
      periodId: entry.period.id,
      periodName: entry.period.name,
      date: entry.period.startDate || entry.period.createdAt,
    });
  }

  // Sort by x (normalized order index)
  dataPoints.sort((a, b) => a.x - b.x);

  // Compute OLS Linear Regression & Volatility
  const metrics = computeJourneyMetrics(dataPoints, thresholdConfig);

  const latestPeriodId = dataPoints[dataPoints.length - 1].periodId;

  // Persist Snapshot
  let snapshot;
  try {
    snapshot = await prisma.studentJourneySnapshot.create({
      data: {
        studentId,
        subjectId: subjectId || null,
        examPeriodId: latestPeriodId,
        schoolId,
        campusId: campusId || schoolId,
        avgScore: metrics.currentAvgScore,
        trendSlope: metrics.slope,
        trendLabel: metrics.trendLabel,
        volatilityScore: metrics.volatilityScore,
        baselineScore: metrics.baselineScore,
        deltaFromBaseline: metrics.deltaFromBaseline,
        dataPointsCount: metrics.dataPointsCount,
        isInsufficientData: metrics.isInsufficientData,
      },
    });
  } catch (err) {
    console.error("Error creating snapshot:", err);
  }

  // AI RADAR & INTERVENTION AUTO-SUGGESTION TRIGGER
  // Trigger if student has DECLINING or VOLATILE and not insufficient data
  if (!metrics.isInsufficientData && (metrics.trendLabel === "DECLINING" || metrics.trendLabel === "VOLATILE")) {
    await handleAnomalyTrigger({
      student,
      schoolId,
      campusId,
      metrics,
      subjectId,
      latestPeriodName: dataPoints[dataPoints.length - 1].periodName,
    });
  }

  return {
    metrics,
    snapshotId: snapshot?.id,
    dataPoints,
  };
}

/**
 * Dispatches AI Radar Warning, Principal AI DecisionLog, and creates SUGGESTED InterventionRecord
 */
async function handleAnomalyTrigger({
  student,
  schoolId,
  campusId,
  metrics,
  subjectId,
  latestPeriodName,
}: {
  student: any;
  schoolId: string;
  campusId: string;
  metrics: RegressionResult;
  subjectId?: string;
  latestPeriodName: string;
}) {
  const studentName = student.user?.name || "Học sinh";
  const className = student.classRoom?.name || "Lớp";
  const campusName = student.classRoom?.campus?.name || student.classRoom?.school?.name || "Cơ sở";

  const anomalyDesc =
    metrics.trendLabel === "DECLINING"
      ? `Điểm số có xu hướng tụt dốc liên tục (độ dốc: ${metrics.slope}, giảm ${Math.abs(metrics.deltaFromBaseline)}đ so với ban đầu ${metrics.baselineScore}đ)`
      : `Điểm số biến động bất thường thất thường (độ biến động: ${metrics.volatilityScore}, ngưỡng tối đa: 1.2)`;

  const warningTitle = `[Hành trình học sinh] Cảnh báo sa sút/bất thường: ${studentName} (${className})`;

  // 1. Check existing open/suggested intervention
  const existingIntervention = await prisma.interventionRecord.findFirst({
    where: {
      studentId: student.id,
      status: {
        in: [InterventionStatus.SUGGESTED, InterventionStatus.APPROVED, InterventionStatus.APPLIED],
      },
      ...(subjectId ? { subjectId } : {}),
    },
  });

  if (!existingIntervention) {
    await prisma.interventionRecord.create({
      data: {
        studentId: student.id,
        schoolId,
        campusId: campusId || schoolId,
        subjectId: subjectId || null,
        triggeredBy: TriggerSource.AI,
        trendLabelAtTrigger: metrics.trendLabel,
        interventionType:
          metrics.trendLabel === "DECLINING"
            ? "Kèm cặp học lực & Phụ đạo cá nhân hóa"
            : "Khảo sát tâm lý & Ổn định phương pháp học",
        note: `AI phát hiện tự động sau kỳ ${latestPeriodName}: ${anomalyDesc}`,
        status: InterventionStatus.SUGGESTED,
      },
    });
  }

  // 2. Tích hợp AI Radar (EarlyWarning)
  const existingWarning = await prisma.earlyWarning.findFirst({
    where: {
      studentName,
      className,
      category: WarningCategory.PROGRESS_SLIP,
      isResolved: false,
    },
  });

  if (!existingWarning) {
    await prisma.earlyWarning.create({
      data: {
        title: warningTitle,
        category: WarningCategory.PROGRESS_SLIP,
        level: metrics.trendLabel === "DECLINING" ? "HIGH" : "MEDIUM",
        campusName,
        schoolPointName: campusName,
        className,
        studentName,
        description: anomalyDesc,
        aiAnalysis: `Phân tích hồi quy dọc (Longitudinal Regression): Hệ số góc m = ${metrics.slope}, Điểm gốc = ${metrics.baselineScore}, Điểm hiện tại = ${metrics.currentAvgScore}, Chỉ số bất ổn = ${metrics.volatilityScore}. Đề xuất: Ban giám hiệu phê duyệt can thiệp kịp thời.`,
        isResolved: false,
      },
    });
  }

  // 3. Tích hợp Principal AI (DecisionLog)
  await prisma.decisionLog.create({
    data: {
      principalId: "AI_SYSTEM",
      query: `Cảnh báo xu hướng học tập học sinh ${studentName} (${className})`,
      aiRecommendation: `Phân tích hồi quy học tập: ${anomalyDesc}. Hệ số dốc: ${metrics.slope}, Chỉ số dao động: ${metrics.volatilityScore}, Điểm hiện tại: ${metrics.currentAvgScore}. Đề xuất: BGH phê duyệt can thiệp phụ đạo cá nhân hóa.`,
      decisionTaken: `Hệ thống tự động đề xuất can thiệp ${metrics.trendLabel} vào danh sách chờ duyệt.`,
    },
  });
}

/**
 * Batch recomputes journey snapshots for an entire campus or school.
 */
export async function batchComputeJourneyForCampus(
  schoolId: string,
  campusId?: string
): Promise<{
  totalStudents: number;
  improvingCount: number;
  decliningCount: number;
  volatileCount: number;
  stableCount: number;
  insufficientCount: number;
}> {
  const whereStudent: Prisma.StudentWhereInput = {
    classRoom: {
      schoolId,
      ...(campusId ? { campusId } : {}),
    },
  };

  const students = await prisma.student.findMany({
    where: whereStudent,
    select: { id: true },
  });

  let improvingCount = 0;
  let decliningCount = 0;
  let volatileCount = 0;
  let stableCount = 0;
  let insufficientCount = 0;

  for (const s of students) {
    try {
      const { metrics } = await computeStudentJourney(s.id);
      if (metrics.isInsufficientData) {
        insufficientCount++;
      } else {
        switch (metrics.trendLabel) {
          case "IMPROVING":
            improvingCount++;
            break;
          case "DECLINING":
            decliningCount++;
            break;
          case "VOLATILE":
            volatileCount++;
            break;
          case "STABLE":
          default:
            stableCount++;
            break;
        }
      }
    } catch (err) {
      console.error(`Error computing journey for student ${s.id}:`, err);
    }
  }

  return {
    totalStudents: students.length,
    improvingCount,
    decliningCount,
    volatileCount,
    stableCount,
    insufficientCount,
  };
}

/**
 * Get comprehensive longitudinal journey data for student view / teacher view
 */
export async function getStudentJourneyHistory(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
      classRoom: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          schoolId: true,
          campusId: true,
          school: { select: { id: true, name: true } },
          campus: { select: { id: true, name: true } },
        },
      },
      studentScores: {
        include: {
          examPeriod: true,
          subject: true,
        },
        orderBy: {
          examPeriod: {
            orderIndex: "asc",
          },
        },
      },
      journeySnapshots: {
        include: {
          examPeriod: true,
          subject: true,
        },
        orderBy: {
          computedAt: "desc",
        },
        take: 20,
      },
      interventions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) return null;

  // Group scores by subject and chronological periods
  const subjectsMap = new Map<string, { id: string; name: string; scores: { periodName: string; orderIndex: number; score: number }[] }>();
  const periodMap = new Map<string, { id: string; name: string; orderIndex: number; scores: number[] }>();

  for (const s of student.studentScores) {
    // Subject grouping
    if (!subjectsMap.has(s.subjectId)) {
      subjectsMap.set(s.subjectId, {
        id: s.subjectId,
        name: s.subject.name,
        scores: [],
      });
    }
    subjectsMap.get(s.subjectId)!.scores.push({
      periodName: s.examPeriod.name,
      orderIndex: s.examPeriod.orderIndex,
      score: s.score,
    });

    // Period composite grouping
    if (!periodMap.has(s.examPeriodId)) {
      periodMap.set(s.examPeriodId, {
        id: s.examPeriod.id,
        name: s.examPeriod.name,
        orderIndex: s.examPeriod.orderIndex,
        scores: [],
      });
    }
    periodMap.get(s.examPeriodId)!.scores.push(s.score);
  }

  // Calculate composite timeline
  const compositeTimeline = Array.from(periodMap.values())
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p) => {
      const avg = p.scores.reduce((a, b) => a + b, 0) / p.scores.length;
      return {
        periodId: p.id,
        periodName: p.name,
        orderIndex: p.orderIndex,
        avgScore: Math.round(avg * 100) / 100,
        scoreCount: p.scores.length,
      };
    });

  // Calculate overall metrics
  const schoolId = student.classRoom?.schoolId || "";
  const campusId = student.classRoom?.campusId || "";
  const config = await getCampusJourneyConfig(schoolId, campusId);

  const dataPoints: JourneyDataPoint[] = compositeTimeline.map((t) => ({
    x: t.orderIndex,
    score: t.avgScore,
    periodId: t.periodId,
    periodName: t.periodName,
  }));

  const overallMetrics = computeJourneyMetrics(dataPoints, config);

  return {
    student: {
      id: student.id,
      name: student.user?.name || "Học sinh",
      studentCode: student.studentCode,
      className: student.classRoom?.name || "—",
      schoolName: student.classRoom?.school?.name || "—",
      campusName: student.classRoom?.campus?.name || "—",
      gradeLevel: student.classRoom?.gradeLevel,
    },
    compositeTimeline,
    subjectBreakdowns: Array.from(subjectsMap.values()),
    overallMetrics,
    snapshots: student.journeySnapshots,
    interventions: student.interventions,
  };
}

/**
 * Overview statistics for Executive Dashboard (`/admin/journey-overview`)
 */
export async function getCampusJourneyOverview(
  schoolId: string,
  campusId?: string
) {
  const whereBase: Prisma.StudentJourneySnapshotWhereInput = {
    schoolId,
    ...(campusId ? { campusId } : {}),
  };

  // Get distinct latest snapshots per student
  const latestSnapshots = await prisma.studentJourneySnapshot.findMany({
    where: whereBase,
    distinct: ["studentId"],
    orderBy: [{ studentId: "asc" }, { computedAt: "desc" }],
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          user: { select: { name: true } },
          classRoom: { select: { name: true, gradeLevel: true } },
        },
      },
      examPeriod: { select: { name: true, orderIndex: true } },
    },
  });

  const summary = {
    total: latestSnapshots.length,
    improving: 0,
    declining: 0,
    volatile: 0,
    stable: 0,
    insufficient: 0,
  };

  const highRiskStudents: Array<{
    studentId: string;
    studentName: string;
    studentCode: string | null;
    className: string;
    trendLabel: TrendLabel;
    trendSlope: number;
    volatilityScore: number;
    avgScore: number;
    deltaFromBaseline: number;
    periodName: string;
  }> = [];

  for (const s of latestSnapshots) {
    if (s.isInsufficientData) {
      summary.insufficient++;
    } else {
      switch (s.trendLabel) {
        case "IMPROVING":
          summary.improving++;
          break;
        case "DECLINING":
          summary.declining++;
          highRiskStudents.push({
            studentId: s.studentId,
            studentName: s.student.user?.name || "Học sinh",
            studentCode: s.student.studentCode,
            className: s.student.classRoom?.name || "—",
            trendLabel: s.trendLabel,
            trendSlope: s.trendSlope,
            volatilityScore: s.volatilityScore,
            avgScore: s.avgScore,
            deltaFromBaseline: s.deltaFromBaseline,
            periodName: s.examPeriod.name,
          });
          break;
        case "VOLATILE":
          summary.volatile++;
          highRiskStudents.push({
            studentId: s.studentId,
            studentName: s.student.user?.name || "Học sinh",
            studentCode: s.student.studentCode,
            className: s.student.classRoom?.name || "—",
            trendLabel: s.trendLabel,
            trendSlope: s.trendSlope,
            volatilityScore: s.volatilityScore,
            avgScore: s.avgScore,
            deltaFromBaseline: s.deltaFromBaseline,
            periodName: s.examPeriod.name,
          });
          break;
        case "STABLE":
        default:
          summary.stable++;
          break;
      }
    }
  }

  // Sort high risk by slope ascending (steepest decline first)
  highRiskStudents.sort((a, b) => a.trendSlope - b.trendSlope);

  // Get intervention summary
  const interventionWhere: Prisma.InterventionRecordWhereInput = {
    schoolId,
    ...(campusId ? { campusId } : {}),
  };

  const [suggestedCount, approvedCount, appliedCount, outcomeCount] =
    await Promise.all([
      prisma.interventionRecord.count({
        where: { ...interventionWhere, status: InterventionStatus.SUGGESTED },
      }),
      prisma.interventionRecord.count({
        where: { ...interventionWhere, status: InterventionStatus.APPROVED },
      }),
      prisma.interventionRecord.count({
        where: { ...interventionWhere, status: InterventionStatus.APPLIED },
      }),
      prisma.interventionRecord.count({
        where: {
          ...interventionWhere,
          status: InterventionStatus.OUTCOME_TRACKED,
        },
      }),
    ]);

  return {
    summary,
    highRiskStudents: highRiskStudents.slice(0, 20),
    interventions: {
      suggested: suggestedCount,
      approved: approvedCount,
      applied: appliedCount,
      outcomeTracked: outcomeCount,
      total: suggestedCount + approvedCount + appliedCount + outcomeCount,
    },
  };
}
