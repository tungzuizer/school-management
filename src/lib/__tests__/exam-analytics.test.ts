/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`pnpm vitest run`).
 * 2. Target: `src/lib/exam-analytics-engine.ts`.
 * 3. Purpose: Comprehensive unit tests for Multi-Year Exam Analytics Engine.
 * 4. Verbatim User Instruction: "muốn cho hiệu trưởng theo dõi tình hình điểm thi và các cá nhận học sinh dựa trênn điểm thi của các năm" -> "Đồng ý".
 */

import { describe, it, expect } from "vitest";
import {
  computeMultiYearSubjectTrends,
  computeGradeDistribution,
  computeTT22Classification,
  computeCampusExamComparison,
  calculateSimpleOLS,
  computeStudentExamTrajectory,
  generateExamAnalyticsAIInsights,
  type ExamScoreRecord,
} from "../exam-analytics-engine";

describe("Exam Analytics Engine - Multi-Year Analytics & Trajectory", () => {
  const mockExamScores: ExamScoreRecord[] = [
    // Student 1 - Math across 3 years
    {
      id: "s1-m-23",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-math",
      subjectName: "Toán học",
      examPeriodId: "ep-23-hk1",
      examPeriodName: "Cuối kỳ 1 2023-2024",
      schoolYear: "2023-2024",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 1,
      score: 7.0,
      campusId: "camp-1",
      campusName: "Trường chính",
    },
    {
      id: "s1-m-24",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-math",
      subjectName: "Toán học",
      examPeriodId: "ep-24-hk1",
      examPeriodName: "Cuối kỳ 1 2024-2025",
      schoolYear: "2024-2025",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 2,
      score: 8.0,
      campusId: "camp-1",
      campusName: "Trường chính",
    },
    {
      id: "s1-m-25",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-math",
      subjectName: "Toán học",
      examPeriodId: "ep-25-hk1",
      examPeriodName: "Cuối kỳ 1 2025-2026",
      schoolYear: "2025-2026",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 3,
      score: 9.0,
      campusId: "camp-1",
      campusName: "Trường chính",
    },

    // Student 1 - Literature across 3 years
    {
      id: "s1-l-23",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-lit",
      subjectName: "Ngữ văn",
      examPeriodId: "ep-23-hk1",
      examPeriodName: "Cuối kỳ 1 2023-2024",
      schoolYear: "2023-2024",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 1,
      score: 6.5,
      campusId: "camp-1",
      campusName: "Trường chính",
    },
    {
      id: "s1-l-24",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-lit",
      subjectName: "Ngữ văn",
      examPeriodId: "ep-24-hk1",
      examPeriodName: "Cuối kỳ 1 2024-2025",
      schoolYear: "2024-2025",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 2,
      score: 7.0,
      campusId: "camp-1",
      campusName: "Trường chính",
    },
    {
      id: "s1-l-25",
      studentId: "stu-1",
      studentName: "Nguyễn Văn An",
      studentCode: "HS-001",
      className: "12A1",
      gradeLevel: 12,
      subjectId: "sub-lit",
      subjectName: "Ngữ văn",
      examPeriodId: "ep-25-hk1",
      examPeriodName: "Cuối kỳ 1 2025-2026",
      schoolYear: "2025-2026",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 3,
      score: 8.0,
      campusId: "camp-1",
      campusName: "Trường chính",
    },

    // Student 2 - Branch campus (Campus 2)
    {
      id: "s2-m-25",
      studentId: "stu-2",
      studentName: "Trần Thị Bình",
      studentCode: "HS-002",
      className: "10B1",
      gradeLevel: 10,
      subjectId: "sub-math",
      subjectName: "Toán học",
      examPeriodId: "ep-25-hk1",
      examPeriodName: "Cuối kỳ 1 2025-2026",
      schoolYear: "2025-2026",
      semester: "HK1",
      examType: "FINAL",
      orderIndex: 3,
      score: 4.5,
      campusId: "camp-2",
      campusName: "Phân hiệu 2 (Lê Hồng Phong)",
    },
  ];

  describe("computeMultiYearSubjectTrends", () => {
    it("correctly aggregates yearly averages and detects improving trend", () => {
      const trends = computeMultiYearSubjectTrends(mockExamScores, [
        "2023-2024",
        "2024-2025",
        "2025-2026",
      ]);

      expect(trends.length).toBe(2);
      const math = trends.find((t) => t.subjectId === "sub-math");
      expect(math).toBeDefined();
      expect(math?.yearlyAverages["2023-2024"]).toBe(7.0);
      expect(math?.yearlyAverages["2024-2025"]).toBe(8.0);
      expect(math?.yearlyAverages["2025-2026"]).toBe(6.75); // (9.0 + 4.5) / 2
      expect(math?.deltaFromFirstYear).toBe(-0.25);
      expect(math?.trendStatus).toBe("DECLINING"); // 6.75 - 8.0 = -1.25 (< -0.2)

      const lit = trends.find((t) => t.subjectId === "sub-lit");
      expect(lit).toBeDefined();
      expect(lit?.deltaFromFirstYear).toBe(1.5); // 8.0 - 6.5
      expect(lit?.deltaFromPreviousYear).toBe(1.0); // 8.0 - 7.0
      expect(lit?.trendStatus).toBe("IMPROVING");
    });
  });

  describe("computeGradeDistribution", () => {
    it("distributes scores across 5 bands accurately", () => {
      const scores = [
        { score: 2.5 },
        { score: 4.0 },
        { score: 6.0 },
        { score: 7.5 },
        { score: 9.0 },
      ];

      const bands = computeGradeDistribution(scores);
      expect(bands.length).toBe(5);
      expect(bands[0].count).toBe(1); // 0-3
      expect(bands[1].count).toBe(1); // 3-5
      expect(bands[2].count).toBe(1); // 5-6.5
      expect(bands[3].count).toBe(1); // 6.5-8
      expect(bands[4].count).toBe(1); // 8-10
      expect(bands.every((b) => b.percentage === 20.0)).toBe(true);
    });
  });

  describe("computeTT22Classification", () => {
    it("calculates Good, Fair, Pass, Fail counts and percentages", () => {
      const averages = [9.0, 8.2, 7.5, 6.8, 5.5, 4.0];
      const classification = computeTT22Classification(averages);

      expect(classification.total).toBe(6);
      expect(classification.goodCount).toBe(2); // 9.0, 8.2
      expect(classification.fairCount).toBe(2); // 7.5, 6.8
      expect(classification.passCount).toBe(1); // 5.5
      expect(classification.failCount).toBe(1); // 4.0
      expect(classification.goodPercent).toBe(33.3);
      expect(classification.failPercent).toBe(16.7);
    });
  });

  describe("computeCampusExamComparison", () => {
    it("groups exam stats by campus and calculates pass & good rates", () => {
      const comparison = computeCampusExamComparison(mockExamScores);
      expect(comparison.length).toBe(2);

      const mainCampus = comparison.find((c) => c.campusId === "camp-1");
      expect(mainCampus).toBeDefined();
      expect(mainCampus?.totalStudents).toBe(1);
      expect(mainCampus?.totalExams).toBe(6);
      expect(mainCampus?.passRate).toBe(100.0); // all scores >= 6.5

      const branchCampus = comparison.find((c) => c.campusId === "camp-2");
      expect(branchCampus).toBeDefined();
      expect(branchCampus?.totalStudents).toBe(1);
      expect(branchCampus?.totalExams).toBe(1);
      expect(branchCampus?.passRate).toBe(0.0); // score 4.5 (< 5.0)
    });
  });

  describe("calculateSimpleOLS", () => {
    it("calculates slope, intercept and R2 correctly for linear data", () => {
      const points = [
        { x: 1, y: 5 },
        { x: 2, y: 7 },
        { x: 3, y: 9 },
      ];
      const result = calculateSimpleOLS(points);
      expect(result.slope).toBe(2);
      expect(result.intercept).toBe(3);
      expect(result.r2).toBe(1);
      expect(result.volatility).toBe(0);
    });
  });

  describe("computeStudentExamTrajectory", () => {
    it("classifies strong growth student properly", () => {
      const student1Scores = mockExamScores.filter(
        (s) => s.studentId === "stu-1"
      );
      const trajectory = computeStudentExamTrajectory(student1Scores);

      expect(trajectory.summary.studentName).toBe("Nguyễn Văn An");
      expect(trajectory.timeline.length).toBe(3);
      expect(trajectory.summary.slope).toBeGreaterThan(0.25);
      expect(
        ["STRONG_GROWTH", "EXCELLENT_TALENT"].includes(
          trajectory.summary.trendCategory
        )
      ).toBe(true);
      expect(trajectory.summary.needsImmediateIntervention).toBe(false);
      expect(trajectory.subjectRadar.length).toBe(2);
    });

    it("flags at risk student with low scores requiring immediate intervention", () => {
      const atRiskScores: ExamScoreRecord[] = [
        {
          id: "r1",
          studentId: "stu-risk",
          studentName: "Lê Văn Hùng",
          className: "12A3",
          subjectId: "sub-math",
          subjectName: "Toán học",
          examPeriodId: "ep-1",
          examPeriodName: "GK1",
          schoolYear: "2025-2026",
          semester: "HK1",
          examType: "MIDTERM",
          orderIndex: 1,
          score: 5.0,
        },
        {
          id: "r2",
          studentId: "stu-risk",
          studentName: "Lê Văn Hùng",
          className: "12A3",
          subjectId: "sub-math",
          subjectName: "Toán học",
          examPeriodId: "ep-2",
          examPeriodName: "CK1",
          schoolYear: "2025-2026",
          semester: "HK1",
          examType: "FINAL",
          orderIndex: 2,
          score: 3.5,
        },
      ];

      const trajectory = computeStudentExamTrajectory(atRiskScores);
      expect(trajectory.summary.trendCategory).toBe("AT_RISK_FAIL");
      expect(trajectory.summary.needsImmediateIntervention).toBe(true);
      expect(trajectory.summary.aiAdvisory).toContain("CẢNH BÁO BGH");
    });
  });

  describe("generateExamAnalyticsAIInsights", () => {
    it("generates actionable insights for leadership", () => {
      const insights = generateExamAnalyticsAIInsights({
        overallAverage: 7.8,
        previousYearAverage: 7.3,
        topSubjects: ["Toán học", "Tiếng Anh"],
        laggingSubjects: ["Lịch sử"],
        atRiskCount: 3,
        totalStudents: 120,
      });

      expect(insights.length).toBeGreaterThanOrEqual(4);
      expect(insights.some((i) => i.includes("tăng +0.5"))).toBe(true);
      expect(insights.some((i) => i.includes("Toán học, Tiếng Anh"))).toBe(true);
      expect(insights.some((i) => i.includes("Lịch sử"))).toBe(true);
      expect(insights.some((i) => i.includes("3 học sinh"))).toBe(true);
    });
  });
});
