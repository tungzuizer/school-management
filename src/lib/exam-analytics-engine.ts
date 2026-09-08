/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/actions.ts:10`, `src/app/admin/dashboard/actions.ts:15`, `src/lib/__tests__/exam-analytics.test.ts:1`.
 * 2. Uniqueness: No existing engine aggregates multi-year exam trends, campus comparisons, TT22 distribution, and multi-year individual student profiling.
 * 3. Schemas: Prisma models `ExamPeriod` (schoolYear: "2024-2025", semester: "HK1"|"HK2", orderIndex: Int), `StudentScore` (score: Float), `Student`, `ClassRoom`, `Subject`, `Campus`.
 * 4. Verbatim User Instruction: "muốn cho hiệu trưởng theo dõi tình hình điểm thi và các cá nhận học sinh dựa trênn điểm thi của các năm" -> "Đồng ý".
 */

export interface ExamScoreRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  classId?: string;
  className?: string;
  gradeLevel?: number; // 10, 11, 12
  subjectId: string;
  subjectName: string;
  examPeriodId: string;
  examPeriodName: string;
  schoolYear: string; // "2023-2024", "2024-2025", "2025-2026"
  semester: string; // "HK1" | "HK2"
  examType: string; // "MIDTERM" | "FINAL" | "PERIOD_SUMMARY"
  orderIndex: number; // 1, 2, 3, 4, 5...
  score: number; // 0.0 - 10.0
  campusId?: string;
  campusName?: string;
}

export interface MultiYearSubjectTrend {
  subjectId: string;
  subjectName: string;
  yearlyAverages: Record<string, number>; // { "2023-2024": 7.4, "2024-2025": 7.8, "2025-2026": 8.1 }
  deltaFromFirstYear: number; // Tăng giảm so với năm đầu tiên
  deltaFromPreviousYear: number; // Tăng giảm so với năm liền kề
  trendStatus: "IMPROVING" | "DECLINING" | "STABLE";
  averageScore: number;
}

export interface ScoreDistributionBand {
  bandKey: "0-3" | "3-5" | "5-6.5" | "6.5-8" | "8-10";
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  color: string;
}

export type GradeDistributionBand = ScoreDistributionBand;

export interface TT22Classification {
  goodCount: number; // Giỏi / Tốt (>= 8.0)
  goodPercent: number;
  fairCount: number; // Khá (6.5 - 7.9)
  fairPercent: number;
  passCount: number; // Đạt (5.0 - 6.4)
  passPercent: number;
  failCount: number; // Chưa đạt (< 5.0)
  failPercent: number;
  total: number;
}

export type TT22ClassificationSummary = TT22Classification;

export interface CampusExamComparison {
  campusId: string;
  campusName: string;
  averageScore: number;
  totalStudents: number;
  totalExams: number;
  passRate: number; // Tỷ lệ >= 5.0
  goodRate: number; // Tỷ lệ >= 8.0
}

export type CampusExamStat = CampusExamComparison;

export type StudentTrendCategory =
  | "EXCELLENT_TALENT" // Học sinh giỏi / Tài năng (Điểm >= 8.5, ổn định)
  | "STRONG_GROWTH" // Tăng trưởng vượt bậc (Slope > +0.3)
  | "STEADY_PROGRESS" // Tiến bộ vững chắc (Slope >= 0 và < 0.3)
  | "UNSTABLE_VOLATILE" // Biến động thất thường (Volatility > 1.2)
  | "CRITICAL_DECLINE" // Sa sút nghiêm trọng (Slope < -0.3)
  | "AT_RISK_FAIL"; // Nguy cơ trượt / Điểm < 5.0

export interface StudentProfileSummary {
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  gradeLevel?: number;
  campusName?: string;
  latestAvgScore: number;
  overallAvgScore: number;
  slope: number;
  volatility: number;
  trendCategory: StudentTrendCategory;
  trendLabel: string;
  trendColor: string;
  strengths: string[];
  weaknesses: string[];
  predictedGraduationScore: number;
  totalExamsRecorded: number;
  needsImmediateIntervention: boolean;
  aiAdvisory: string;
}

export interface StudentExamTimelinePoint {
  periodId: string;
  periodName: string;
  schoolYear: string;
  semester: string;
  examType: string;
  orderIndex: number;
  avgScore: number;
  subjectScores: Record<string, number>;
}

/**
 * 1. Compute multi-year subject averages and growth trends
 */
export function computeMultiYearSubjectTrends(
  scores: ExamScoreRecord[],
  yearsAvailable?: string[]
): MultiYearSubjectTrend[] {
  if (!scores || scores.length === 0) return [];

  const subjectMap = new Map<
    string,
    {
      subjectName: string;
      scoresByYear: Record<string, number[]>;
      allScores: number[];
    }
  >();

  const distinctYears = new Set<string>();

  scores.forEach((s) => {
    distinctYears.add(s.schoolYear);
    if (!subjectMap.has(s.subjectId)) {
      subjectMap.set(s.subjectId, {
        subjectName: s.subjectName,
        scoresByYear: {},
        allScores: [],
      });
    }

    const item = subjectMap.get(s.subjectId)!;
    if (!item.scoresByYear[s.schoolYear]) {
      item.scoresByYear[s.schoolYear] = [];
    }
    item.scoresByYear[s.schoolYear].push(s.score);
    item.allScores.push(s.score);
  });

  const sortedYears = (yearsAvailable || Array.from(distinctYears)).sort();

  const results: MultiYearSubjectTrend[] = [];

  subjectMap.forEach((val, subjectId) => {
    const yearlyAverages: Record<string, number> = {};
    sortedYears.forEach((y) => {
      const arr = val.scoresByYear[y] || [];
      if (arr.length > 0) {
        const sum = arr.reduce((a, b) => a + b, 0);
        yearlyAverages[y] = Number((sum / arr.length).toFixed(2));
      } else {
        yearlyAverages[y] = 0;
      }
    });

    const yearsWithData = sortedYears.filter((y) => yearlyAverages[y] > 0);
    let deltaFromFirstYear = 0;
    let deltaFromPreviousYear = 0;

    if (yearsWithData.length >= 2) {
      const firstYear = yearsWithData[0];
      const latestYear = yearsWithData[yearsWithData.length - 1];
      const prevYear = yearsWithData[yearsWithData.length - 2];

      deltaFromFirstYear = Number(
        (yearlyAverages[latestYear] - yearlyAverages[firstYear]).toFixed(2)
      );
      deltaFromPreviousYear = Number(
        (yearlyAverages[latestYear] - yearlyAverages[prevYear]).toFixed(2)
      );
    }

    let trendStatus: "IMPROVING" | "DECLINING" | "STABLE" = "STABLE";
    if (deltaFromPreviousYear > 0.2) trendStatus = "IMPROVING";
    else if (deltaFromPreviousYear < -0.2) trendStatus = "DECLINING";

    const overallAvg =
      val.allScores.length > 0
        ? Number(
            (
              val.allScores.reduce((a, b) => a + b, 0) / val.allScores.length
            ).toFixed(2)
          )
        : 0;

    results.push({
      subjectId,
      subjectName: val.subjectName,
      yearlyAverages,
      deltaFromFirstYear,
      deltaFromPreviousYear,
      trendStatus,
      averageScore: overallAvg,
    });
  });

  return results.sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * 2. Compute 5-band score distribution
 */
export function computeGradeDistribution(
  scores: Array<{ score: number }>
): ScoreDistributionBand[] {
  const bands: ScoreDistributionBand[] = [
    {
      bandKey: "0-3",
      label: "Kém (0 - <3.0)",
      min: 0,
      max: 3.0,
      count: 0,
      percentage: 0,
      color: "#ef4444",
    },
    {
      bandKey: "3-5",
      label: "Yếu (3.0 - <5.0)",
      min: 3.0,
      max: 5.0,
      count: 0,
      percentage: 0,
      color: "#f97316",
    },
    {
      bandKey: "5-6.5",
      label: "Trung bình / Đạt (5.0 - <6.5)",
      min: 5.0,
      max: 6.5,
      count: 0,
      percentage: 0,
      color: "#eab308",
    },
    {
      bandKey: "6.5-8",
      label: "Khá (6.5 - <8.0)",
      min: 6.5,
      max: 8.0,
      count: 0,
      percentage: 0,
      color: "#3b82f6",
    },
    {
      bandKey: "8-10",
      label: "Giỏi / Xuất sắc (8.0 - 10.0)",
      min: 8.0,
      max: 10.01,
      count: 0,
      percentage: 0,
      color: "#10b981",
    },
  ];

  if (!scores || scores.length === 0) return bands;

  scores.forEach((s) => {
    const val = s.score;
    if (val < 3.0) bands[0].count++;
    else if (val < 5.0) bands[1].count++;
    else if (val < 6.5) bands[2].count++;
    else if (val < 8.0) bands[3].count++;
    else bands[4].count++;
  });

  const total = scores.length;
  bands.forEach((b) => {
    b.percentage = Number(((b.count / total) * 100).toFixed(1));
  });

  return bands;
}

/**
 * 3. Compute TT 22 Classification based on student averages
 */
export function computeTT22Classification(
  studentAverages: number[]
): TT22Classification {
  const res: TT22Classification = {
    goodCount: 0,
    goodPercent: 0,
    fairCount: 0,
    fairPercent: 0,
    passCount: 0,
    passPercent: 0,
    failCount: 0,
    failPercent: 0,
    total: studentAverages?.length || 0,
  };

  if (res.total === 0) return res;

  studentAverages.forEach((avg) => {
    if (avg >= 8.0) res.goodCount++;
    else if (avg >= 6.5) res.fairCount++;
    else if (avg >= 5.0) res.passCount++;
    else res.failCount++;
  });

  res.goodPercent = Number(((res.goodCount / res.total) * 100).toFixed(1));
  res.fairPercent = Number(((res.fairCount / res.total) * 100).toFixed(1));
  res.passPercent = Number(((res.passCount / res.total) * 100).toFixed(1));
  res.failPercent = Number(((res.failCount / res.total) * 100).toFixed(1));

  return res;
}

/**
 * 4. Compare Exam Performance Across Campuses
 */
export function computeCampusExamComparison(
  scores: ExamScoreRecord[]
): CampusExamComparison[] {
  if (!scores || scores.length === 0) return [];

  const campusMap = new Map<
    string,
    {
      campusName: string;
      studentIds: Set<string>;
      scores: number[];
    }
  >();

  scores.forEach((s) => {
    const cId = s.campusId || "default-campus";
    const cName = s.campusName || "Trường chính";

    if (!campusMap.has(cId)) {
      campusMap.set(cId, {
        campusName: cName,
        studentIds: new Set(),
        scores: [],
      });
    }

    const item = campusMap.get(cId)!;
    item.studentIds.add(s.studentId);
    item.scores.push(s.score);
  });

  const results: CampusExamComparison[] = [];

  campusMap.forEach((val, campusId) => {
    const totalExams = val.scores.length;
    const avgScore =
      totalExams > 0
        ? Number(
            (val.scores.reduce((a, b) => a + b, 0) / totalExams).toFixed(2)
          )
        : 0;
    const passCount = val.scores.filter((sc) => sc >= 5.0).length;
    const goodCount = val.scores.filter((sc) => sc >= 8.0).length;

    results.push({
      campusId,
      campusName: val.campusName,
      averageScore: avgScore,
      totalStudents: val.studentIds.size,
      totalExams,
      passRate:
        totalExams > 0
          ? Number(((passCount / totalExams) * 100).toFixed(1))
          : 0,
      goodRate:
        totalExams > 0
          ? Number(((goodCount / totalExams) * 100).toFixed(1))
          : 0,
    });
  });

  return results.sort((a, b) => b.averageScore - a.averageScore);
}

/**
 * 5. Ordinary Least Squares Linear Regression Helper
 */
export function calculateSimpleOLS(
  points: Array<{ x: number; y: number }>
): { slope: number; intercept: number; r2: number; volatility: number } {
  const n = points.length;
  if (n < 2) {
    return { slope: 0, intercept: points[0]?.y || 0, r2: 1, volatility: 0 };
  }

  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let den = 0;
  let totalSS = 0;

  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    den += dx * dx;
    totalSS += dy * dy;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  let resSS = 0;
  for (const p of points) {
    const pred = intercept + slope * p.x;
    const err = p.y - pred;
    resSS += err * err;
  }

  const r2 =
    totalSS !== 0 ? Math.max(0, Math.min(1, 1 - resSS / totalSS)) : 1;
  const volatility = Math.sqrt(resSS / n);

  return {
    slope: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(2)),
    r2: Number(r2.toFixed(3)),
    volatility: Number(volatility.toFixed(2)),
  };
}

/**
 * 6. Compute Individual Student Multi-Year Trajectory
 */
export function computeStudentExamTrajectory(studentScores: ExamScoreRecord[]): {
  summary: StudentProfileSummary;
  timeline: StudentExamTimelinePoint[];
  subjectRadar: Array<{ subject: string; score: number; fullMark: number }>;
} {
  if (!studentScores || studentScores.length === 0) {
    const emptySummary: StudentProfileSummary = {
      studentId: "",
      studentName: "Chưa có dữ liệu",
      latestAvgScore: 0,
      overallAvgScore: 0,
      slope: 0,
      volatility: 0,
      trendCategory: "STEADY_PROGRESS",
      trendLabel: "Chưa đủ dữ liệu",
      trendColor: "#64748b",
      strengths: [],
      weaknesses: [],
      predictedGraduationScore: 0,
      totalExamsRecorded: 0,
      needsImmediateIntervention: false,
      aiAdvisory: "Cần bổ sung thêm kết quả các kỳ thi để phân tích.",
    };
    return { summary: emptySummary, timeline: [], subjectRadar: [] };
  }

  const first = studentScores[0];
  const studentId = first.studentId;
  const studentName = first.studentName;
  const studentCode = first.studentCode;
  const className = first.className;
  const gradeLevel = first.gradeLevel;
  const campusName = first.campusName;

  // Group by ExamPeriod orderIndex
  const periodMap = new Map<
    string,
    {
      periodName: string;
      schoolYear: string;
      semester: string;
      examType: string;
      orderIndex: number;
      scores: Record<string, number>;
    }
  >();

  // Group by Subject
  const subjectScoresMap = new Map<string, number[]>();

  studentScores.forEach((s) => {
    if (!periodMap.has(s.examPeriodId)) {
      periodMap.set(s.examPeriodId, {
        periodName: s.examPeriodName,
        schoolYear: s.schoolYear,
        semester: s.semester,
        examType: s.examType,
        orderIndex: s.orderIndex,
        scores: {},
      });
    }
    periodMap.get(s.examPeriodId)!.scores[s.subjectName] = s.score;

    if (!subjectScoresMap.has(s.subjectName)) {
      subjectScoresMap.set(s.subjectName, []);
    }
    subjectScoresMap.get(s.subjectName)!.push(s.score);
  });

  const timeline: StudentExamTimelinePoint[] = Array.from(periodMap.values())
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((p, idx) => {
      const vals = Object.values(p.scores);
      const avg =
        vals.length > 0
          ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
          : 0;
      return {
        periodId: Object.keys(periodMap)[idx] || `p-${p.orderIndex}`,
        periodName: p.periodName,
        schoolYear: p.schoolYear,
        semester: p.semester,
        examType: p.examType,
        orderIndex: p.orderIndex,
        avgScore: avg,
        subjectScores: p.scores,
      };
    });

  // Calculate regression over timeline
  const points = timeline.map((t, idx) => ({ x: idx + 1, y: t.avgScore }));
  const reg = calculateSimpleOLS(points);

  const latestPoint = timeline[timeline.length - 1];
  const latestAvgScore = latestPoint ? latestPoint.avgScore : 0;
  const allScoresList = studentScores.map((s) => s.score);
  const overallAvgScore =
    allScoresList.length > 0
      ? Number(
          (
            allScoresList.reduce((a, b) => a + b, 0) / allScoresList.length
          ).toFixed(2)
        )
      : 0;

  // Predict graduation / next year score (extrapolate next order point)
  const nextX = points.length + 1;
  const rawPred = reg.intercept + reg.slope * nextX;
  const predictedGraduationScore = Math.max(0, Math.min(10, Number(rawPred.toFixed(2))));

  // Identify Strengths and Weaknesses
  const subjectAverages: Array<{ subject: string; avg: number }> = [];
  subjectScoresMap.forEach((scoresList, subName) => {
    const avg = Number(
      (scoresList.reduce((a, b) => a + b, 0) / scoresList.length).toFixed(2)
    );
    subjectAverages.push({ subject: subName, avg });
  });

  subjectAverages.sort((a, b) => b.avg - a.avg);
  const strengths = subjectAverages.filter((s) => s.avg >= 8.0).map((s) => `${s.subject} (${s.avg})`);
  const weaknesses = subjectAverages.filter((s) => s.avg < 5.5).map((s) => `${s.subject} (${s.avg})`);

  // Classify Trend
  let trendCategory: StudentTrendCategory = "STEADY_PROGRESS";
  let trendLabel = "Tiến bộ vững chắc";
  let trendColor = "#3b82f6";
  let needsImmediateIntervention = false;
  let aiAdvisory = "Học sinh giữ nhịp độ học tập ổn định.";

  if (overallAvgScore >= 8.5 && reg.volatility < 1.0) {
    trendCategory = "EXCELLENT_TALENT";
    trendLabel = "Học sinh Giỏi / Tiềm năng Thủ khoa";
    trendColor = "#10b981";
    aiAdvisory = "Đề xuất đưa vào đội tuyển học sinh giỏi hoặc nhóm định hướng điểm 9-10 tốt nghiệp.";
  } else if (reg.slope >= 0.25) {
    trendCategory = "STRONG_GROWTH";
    trendLabel = "Tăng trưởng vượt bậc";
    trendColor = "#06b6d4";
    aiAdvisory = "Đang có sự bứt phá rõ nét qua các kỳ thi. Cần duy trì động lực và khen thưởng kịp thời.";
  } else if (reg.slope <= -0.25 || latestAvgScore < 5.0) {
    if (latestAvgScore < 5.0) {
      trendCategory = "AT_RISK_FAIL";
      trendLabel = "Nguy cơ trượt tốt nghiệp / Cần can thiệp gấp";
      trendColor = "#ef4444";
      needsImmediateIntervention = true;
      aiAdvisory = `CẢNH BÁO BGH: Học sinh có điểm thi < 5.0 ở các môn then chốt (${weaknesses.join(", ")}). Cần lập kế hoạch phụ đạo 1 kèm 1 và trao đổi với phụ huynh ngay.`;
    } else {
      trendCategory = "CRITICAL_DECLINE";
      trendLabel = "Sa sút nghiêm trọng liên tục";
      trendColor = "#f97316";
      needsImmediateIntervention = true;
      aiAdvisory = `Phong độ giảm liên tục (Slope: ${reg.slope}). Đề xuất giáo viên chủ nhiệm & tổ tư vấn tâm lý tìm hiểu nguyên nhân (sức khỏe, áp lực, gia đình).`;
    }
  } else if (reg.volatility >= 1.2) {
    trendCategory = "UNSTABLE_VOLATILE";
    trendLabel = "Biến động thất thường";
    trendColor = "#8b5cf6";
    aiAdvisory = "Điểm số dao động mạnh giữa các kỳ. Cần rèn luyện phương pháp làm bài thi và tính kỷ luật ôn tập.";
  }

  const summary: StudentProfileSummary = {
    studentId,
    studentName,
    studentCode,
    className,
    gradeLevel,
    campusName,
    latestAvgScore,
    overallAvgScore,
    slope: reg.slope,
    volatility: reg.volatility,
    trendCategory,
    trendLabel,
    trendColor,
    strengths,
    weaknesses,
    predictedGraduationScore,
    totalExamsRecorded: studentScores.length,
    needsImmediateIntervention,
    aiAdvisory,
  };

  const subjectRadar = subjectAverages.map((s) => ({
    subject: s.subject,
    score: s.avg,
    fullMark: 10,
  }));

  return { summary, timeline, subjectRadar };
}

/**
 * 7. Generate Executive AI Insights for Principal
 */
export function generateExamAnalyticsAIInsights(params: {
  overallAverage: number;
  previousYearAverage?: number;
  topSubjects: string[];
  laggingSubjects: string[];
  atRiskCount: number;
  totalStudents: number;
  currentYear?: string;
  previousYear?: string;
  schoolName?: string;
}): string[] {
  const insights: string[] = [];
  const prevAvg = params.previousYearAverage ?? params.overallAverage;
  const delta = Number((params.overallAverage - prevAvg).toFixed(2));

  if (params.previousYearAverage !== undefined && delta !== 0) {
    if (delta > 0) {
      insights.push(
        `Điểm trung bình toàn trường tăng +${delta} điểm so với năm học trước (đạt ${params.overallAverage}/10.0), phản ánh chất lượng chuyên môn cải thiện rõ rệt.`
      );
    } else {
      insights.push(
        `Điểm trung bình toàn trường giảm ${delta} điểm so với năm học trước. Cần chỉ đạo các tổ chuyên môn rà soát lại cấu trúc đề thi và phân phối chương trình.`
      );
    }
  } else {
    insights.push(
      `Chất lượng thi giữ mức ổn định ngang bằng năm học trước (${params.overallAverage}/10.0).`
    );
  }

  if (params.topSubjects && params.topSubjects.length > 0) {
    insights.push(
      `Tổ chuyên môn dẫn đầu về chất lượng và độ tăng trưởng: ${params.topSubjects.join(", ")}.`
    );
  }

  if (params.laggingSubjects && params.laggingSubjects.length > 0) {
    insights.push(
      `Các môn học có phổ điểm thấp cần tăng cường bồi dưỡng & đổi mới phương pháp giảng dạy: ${params.laggingSubjects.join(", ")}.`
    );
  }

  if (params.atRiskCount > 0) {
    const riskPct = ((params.atRiskCount / (params.totalStudents || 1)) * 100).toFixed(1);
    insights.push(
      `Phát hiện ${params.atRiskCount} học sinh (${riskPct}%) có nguy cơ trượt hoặc sa sút nghiêm trọng cần Ban Giám hiệu phê duyệt kế hoạch can thiệp sư phạm ngay trong tháng.`
    );
  } else {
    insights.push(
      `100% học sinh duy trì mức điểm đạt chuẩn; không ghi nhận ca sa sút báo động đỏ.`
    );
  }

  return insights;
}
