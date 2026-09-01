import { describe, it, expect, beforeEach } from "vitest";
import { defaultAiAnalysisEngine } from "@/lib/ai-assistant/analysis-engine";
import { DEFAULT_AI_THRESHOLDS, loadSchoolThresholds } from "@/lib/ai-assistant/default-thresholds";
import {
  TenantContext,
  assertCampusAccess,
  assertSubjectGroupAccess,
  assertNotSuperAdminOnAcademicDetail,
} from "@/lib/tenant";
import {
  AggregatedSchoolSnapshot,
  AiTaskGroup,
  AiAlertSeverity,
  AiAlertStatus,
  EquipmentCategory,
  EquipmentCondition,
  DocumentUrgency,
  DocumentStatus,
} from "@/lib/ai-assistant/types";

describe("Principal AI Assistant Suite (Multi-Campus)", () => {
  let mockSnapshot: AggregatedSchoolSnapshot;

  beforeEach(() => {
    mockSnapshot = {
      schoolId: "school-tan-xa",
      schoolName: "Trường THCS Tân Xã",
      date: new Date("2026-09-01"),
      thresholds: {
        ABSENCE_RATE_WARNING: 5.0,
        ABSENCE_RATE_CRITICAL: 10.0,
        CLASS_ABSENT_SPIKE: 4.0,
        STUDENT_ABSENT_UNEXCUSED_WARNING: 2.0,
        STUDENT_ABSENT_MONTH_WARNING: 3.0,
        TEACHER_MAX_WEEKLY_PERIODS: 23.0,
        MAX_TRAVEL_DISTANCE_KM: 15.0,
        LESSON_PLAN_DELAY_DAYS: 2.0,
        DOC_EXPIRING_HOURS: 48.0,
        PARENT_FEEDBACK_RESPONSE_HOURS: 48.0,
      },
      schoolPoints: [
        {
          id: "pt-central",
          campusId: "campus-tx",
          campusName: "Cơ sở chính",
          name: "Điểm trường Trung tâm",
          distanceKm: 0.0,
          managerName: "Thầy Hiệu trưởng",
          phone: "0912345678",
          totalStudents: 200,
          presentStudents: 195,
          absentStudents: 5,
          absentExcused: 4,
          absentUnexcused: 1,
          lateStudents: 0,
          absentRate: 2.5,
          totalClasses: 5,
          totalTeachers: 15,
          journalsCompleted: 5,
          journalsPending: 0,
          activeIncidentsCount: 0,
          activeWarningsCount: 0,
          healthScore: 98,
          statusColor: "GREEN",
        },
        {
          id: "pt-ban-mo",
          campusId: "campus-tx",
          campusName: "Cơ sở chính",
          name: "Điểm trường Bản Mó",
          distanceKm: 4.5,
          managerName: "Thầy Quyết",
          phone: "0912345679",
          totalStudents: 60,
          presentStudents: 55,
          absentStudents: 5,
          absentExcused: 2,
          absentUnexcused: 3,
          lateStudents: 1,
          absentRate: 8.3,
          totalClasses: 2,
          totalTeachers: 4,
          journalsCompleted: 2,
          journalsPending: 0,
          activeIncidentsCount: 0,
          activeWarningsCount: 1,
          healthScore: 82,
          statusColor: "YELLOW",
        },
        {
          id: "pt-ban-pun",
          campusId: "campus-tx",
          campusName: "Cơ sở chính",
          name: "Điểm trường Bản Pún",
          distanceKm: 8.2,
          managerName: "Cô Lan",
          phone: "0912345680",
          totalStudents: 45,
          presentStudents: 42,
          absentStudents: 3,
          absentExcused: 2,
          absentUnexcused: 1,
          lateStudents: 0,
          absentRate: 6.6,
          totalClasses: 2,
          totalTeachers: 3,
          journalsCompleted: 2,
          journalsPending: 0,
          activeIncidentsCount: 0,
          activeWarningsCount: 0,
          healthScore: 88,
          statusColor: "YELLOW",
        },
        {
          id: "pt-phia-xam",
          campusId: "campus-tx",
          campusName: "Cơ sở chính",
          name: "Điểm trường Phia Xam",
          distanceKm: 12.5,
          managerName: "Thầy Sơn",
          phone: "0912345681",
          totalStudents: 35,
          presentStudents: 28,
          absentStudents: 7,
          absentExcused: 4,
          absentUnexcused: 3,
          lateStudents: 0,
          absentRate: 20.0, // Critical (>10%)
          totalClasses: 1,
          totalTeachers: 2,
          journalsCompleted: 0,
          journalsPending: 1,
          activeIncidentsCount: 0,
          activeWarningsCount: 2,
          healthScore: 55,
          statusColor: "RED",
        },
      ],
      attendanceTotals: {
        totalStudents: 340,
        presentCount: 320,
        absentExcusedCount: 12,
        absentUnexcusedCount: 8,
        lateCount: 1,
        overallAttendanceRate: 94.1,
      },
      teachers: [
        {
          teacherId: "t-hoa",
          name: "Cô Trần Thị Hoa",
          specialty: "Toán học",
          subjectNames: ["Toán học", "Tin học"],
          schoolPointId: "pt-central",
          schoolPointName: "Điểm trường Trung tâm",
          weeklyPeriodsCount: 16,
          busyPeriods: [1, 5],
          isAvailableToday: true,
          distanceKm: 0.0,
        },
        {
          teacherId: "t-quyet",
          name: "Thầy Lò Văn Quyết",
          specialty: "Toán học",
          subjectNames: ["Toán học"],
          schoolPointId: "pt-ban-mo",
          schoolPointName: "Điểm trường Bản Mó",
          weeklyPeriodsCount: 18,
          busyPeriods: [1, 4], // period 2 is free
          isAvailableToday: true,
          distanceKm: 4.5,
        },
        {
          teacherId: "t-son",
          name: "Thầy Lữ Văn Sơn",
          specialty: "Toán học",
          subjectNames: ["Toán học"],
          schoolPointId: "pt-phia-xam",
          schoolPointName: "Điểm trường Phia Xam",
          weeklyPeriodsCount: 20,
          busyPeriods: [1, 2, 3, 4, 5],
          isAvailableToday: false,
          distanceKm: 12.5,
        },
      ],
      equipment: [
        {
          id: "eq-1",
          code: "PC-TT",
          name: "Máy vi tính Trung tâm",
          category: EquipmentCategory.IT_COMPUTER,
          schoolPointId: "pt-central",
          schoolPointName: "Điểm trường Trung tâm",
          totalQuantity: 25,
          availableQuantity: 20,
          inUseQuantity: 5,
          brokenQuantity: 0,
          condition: EquipmentCondition.GOOD,
          unit: "bộ",
        },
        {
          id: "eq-2",
          code: "PC-BM",
          name: "Máy vi tính Bản Mó",
          category: EquipmentCategory.IT_COMPUTER,
          schoolPointId: "pt-ban-mo",
          schoolPointName: "Điểm trường Bản Mó",
          totalQuantity: 5,
          availableQuantity: 2,
          inUseQuantity: 3,
          brokenQuantity: 0,
          condition: EquipmentCondition.GOOD,
          unit: "bộ",
        },
      ],
      lessonPlans: {
        totalExpected: 24,
        submittedCount: 22,
        approvedCount: 20,
        rejectedCount: 0,
        overdueCount: 2,
        submissionRate: 91.6,
        delayedTeachers: [
          {
            teacherId: "t-delay-1",
            teacherName: "Thầy Vũ Minh",
            subjectName: "Tổ Toán - Tin học",
            delayedDays: 3,
            schoolPointName: "Điểm trường Bản Mó",
          },
          {
            teacherId: "t-delay-2",
            teacherName: "Cô Mai Lan",
            subjectName: "Tổ Toán - Tin học",
            delayedDays: 2,
            schoolPointName: "Điểm trường Bản Pún",
          },
        ],
      },
      kpis: {
        totalKpis: 8,
        onTrackCount: 7,
        atRiskCount: 1,
        criticalCount: 0,
        averageScore: 88.5,
        atRiskList: [
          {
            id: "kpi-1",
            code: "KPI-01",
            title: "Khảo sát chất lượng đầu năm 4 điểm trường",
            category: "CHUYÊN MÔN",
            completionRate: 60,
            responsiblePerson: "Phó Hiệu trưởng phụ trách",
            campusScope: "Toàn trường",
          },
        ],
      },
      documents: {
        totalPending: 5,
        expiringWithin48h: 1,
        overdueCount: 0,
        expressCount: 1,
        urgentList: [
          {
            id: "doc-1",
            docNumber: "142/SGDĐT-GDTrH",
            title: "Chỉ đạo khẩn ứng phó mưa lũ điểm trường vùng cao",
            issuer: "Sở GD&ĐT",
            deadline: new Date(Date.now() + 20 * 3600 * 1000),
            urgency: DocumentUrgency.URGENT,
            status: DocumentStatus.PROCESSING,
            actionRequired: "Kiểm tra an toàn các điểm trường lẻ.",
            assignedToName: "Hiệu trưởng",
          },
        ],
      },
      warnings: [
        {
          id: "ew-1",
          schoolId: "school-tan-xa",
          campusId: "campus-tx",
          schoolPointId: "pt-ban-mo",
          schoolPointName: "Điểm trường Bản Mó",
          taskGroup: AiTaskGroup.EARLY_WARNING,
          severity: AiAlertSeverity.HIGH,
          status: AiAlertStatus.ACTIVE,
          title: "Học sinh Lò Văn Tuấn (Bản Mó) vắng 4 buổi không phép",
          description: "Nguy cơ bỏ học làm nương rẫy cao.",
          triggerMetric: "4 buổi",
          suggestedAction: "Phối hợp với trưởng bản vận động học sinh đến lớp.",
          targetEntity: "Student:tuấn",
          targetName: "Lò Văn Tuấn (6A1 - Bản Mó)",
          createdAt: new Date(),
        },
        {
          id: "ew-2",
          schoolId: "school-tan-xa",
          campusId: "campus-tx",
          schoolPointId: "pt-phia-xam",
          schoolPointName: "Điểm trường Phia Xam",
          taskGroup: AiTaskGroup.EARLY_WARNING,
          severity: AiAlertSeverity.CRITICAL,
          status: AiAlertStatus.ACTIVE,
          title: "Thiếu giáo viên Toán tại Điểm Phia Xam",
          description: "Thầy Sơn nghỉ ốm đột xuất.",
          targetEntity: "Teacher:sơn",
          targetName: "Thầy Lữ Văn Sơn",
          suggestedAction: "Cử giáo viên tăng cường từ Bản Mó hoặc Trung tâm.",
          createdAt: new Date(),
        },
      ],
      parentFeedbacks: {
        totalRecent: 12,
        unrespondedCount: 3,
        positiveCount: 6,
        neutralCount: 4,
        concernCount: 2,
        topConcerns: [
          {
            topic: "Đường sá và an toàn mùa mưa lũ",
            count: 5,
            schoolPointName: "Điểm Bản Mó & Phia Xam",
          },
        ],
        recentFeedbacks: [
          {
            id: "fb-1",
            parentName: "Bác Lò Văn A",
            studentName: "Lò Văn Tuấn",
            className: "6A1",
            content: "Đoạn đường lên Bản Mó sạt lở nguy hiểm cho học sinh đi bộ.",
            sentiment: "NEGATIVE",
            isResponded: false,
            createdAt: new Date(),
          },
        ],
      },
    };
  });

  // ==================== 1. RBAC & SCOPE TESTS ====================
  describe("1. RBAC & Multi-Campus Scoping Isolation", () => {
    it("allows ADMIN (Principal) to access all school campuses and points", () => {
      const adminCtx: TenantContext = {
        userId: "admin-1",
        userName: "Thầy Hiệu Trưởng",
        userRole: "ADMIN",
        schoolId: "school-tan-xa",
        campusId: undefined,
      };

      // Admin has full school access without throwing
      expect(() => assertCampusAccess(adminCtx, "campus-tx")).not.toThrow();
      expect(() => assertCampusAccess(adminCtx, "satellite-point-1")).not.toThrow();
    });

    it("restricts VICE_PRINCIPAL to their assigned campus only", () => {
      const vpCtx: TenantContext = {
        userId: "vp-1",
        userName: "Cô Phó Hiệu Trưởng",
        userRole: "VICE_PRINCIPAL",
        schoolId: "school-tan-xa",
        campusId: "campus-tx",
      };

      // Allowed for assigned campus
      expect(() => assertCampusAccess(vpCtx, "campus-tx")).not.toThrow();

      // Rejected for other campus
      expect(() => assertCampusAccess(vpCtx, "other-campus-id")).toThrow(
        /Khong co quyen truy cap du lieu phan hieu/
      );
    });

    it("restricts SUBJECT_HEAD to their assigned subject group only", () => {
      const ttcmCtx: TenantContext = {
        userId: "ttcm-1",
        userName: "Tổ Trưởng Chuyên Môn",
        userRole: "SUBJECT_HEAD",
        schoolId: "school-tan-xa",
      };

      expect(() =>
        assertSubjectGroupAccess(ttcmCtx, ["sg-math"], "sg-math")
      ).not.toThrow();

      expect(() =>
        assertSubjectGroupAccess(ttcmCtx, ["sg-math"], "sg-literature")
      ).toThrow(/Khong co quyen quan ly to chuyen mon/);
    });

    it("blocks SUPER_ADMIN from accessing academic student details", () => {
      const superAdminCtx: TenantContext = {
        userId: "sa-1",
        userName: "Quản Trị Viên Tối Cao",
        userRole: "SUPER_ADMIN",
      };

      expect(() => assertNotSuperAdminOnAcademicDetail(superAdminCtx)).toThrow(
        /Quan tri vien he thong khong duoc xem du lieu hoc vu/
      );
    });
  });

  // ==================== 2. ANALYSIS ENGINE & 7 TASK EVALUATORS ====================
  describe("2. Rule-based Analysis Engine & Task Evaluators", () => {
    // Task 1: Real-time Monitoring
    it("evaluates real-time health score across 4 school points", async () => {
      const result = await defaultAiAnalysisEngine.analyzeRealtimeStatus(mockSnapshot);

      expect(result.pointStatuses).toHaveLength(4);
      expect(result.overallHealthScore).toBeGreaterThan(0);
      expect(result.overallHealthScore).toBeLessThanOrEqual(100);

      // Phia Xam has 20% absent rate (80% attendance) -> Status should be RED
      const phiaXamStatus = result.pointStatuses.find((p) => p.schoolPointId === "pt-phia-xam");
      expect(phiaXamStatus).toBeDefined();
      expect(phiaXamStatus?.statusColor).toBe("RED");
      expect(phiaXamStatus?.attendanceRate).toBe(80.0);
    });

    // Task 2: Coordination & Dispatch
    it("optimizes substitute teacher assignment by subject match, workload, and km distance", async () => {
      const request = {
        absentTeacherId: "t-son", // Math teacher at Phia Xam (12.5km)
        date: new Date("2026-09-01"),
        period: 2,
        classId: "class-6a1-phia-xam",
      };

      const result = await defaultAiAnalysisEngine.recommendSubstituteTeachers(
        request,
        mockSnapshot
      );

      expect(result.recommendedCandidates.length).toBeGreaterThan(0);
      expect(result.optimalChoice).toBeDefined();

      // Thầy Quyết at Bản Mó is closer (4.5 km) than Cô Hoa at Trung tâm (0.0 km center)
      // and has period 2 free
      expect(result.optimalChoice?.teacherName).toContain("Lò Văn Quyết");
      expect(result.optimalChoice?.matchScore).toBeGreaterThan(50);
      expect(result.optimalChoice?.travelAdvice).toBeDefined();
    });

    it("advises on inter-point equipment transfers with route steps", async () => {
      const request = {
        category: EquipmentCategory.IT_COMPUTER,
        targetSchoolPointId: "pt-phia-xam",
        neededQuantity: 5,
      };

      const result = await defaultAiAnalysisEngine.recommendEquipmentTransfer(
        request,
        mockSnapshot
      );

      // Bản Mó is closer to Phia Xam (8.0 km away) than Trung tâm (12.5 km away)
      expect(result.suggestedSourcePointName).toContain("Điểm trường Bản Mó");
      expect(result.availableInSource).toBe(2);
      expect(result.transferSteps.length).toBeGreaterThan(0);
      expect(result.feasibilityScore).toBeGreaterThanOrEqual(70);
    });

    // Task 3: Decision Support Studio
    it("generates 3 structured decision options with legal citations and roadmap", async () => {
      const query = "Vận động học sinh vắng học tại Điểm Bản Mó và Phia Xam";
      const result = await defaultAiAnalysisEngine.evaluateDecisionOptions(query, mockSnapshot);

      expect(result.options).toHaveLength(3);
      expect(result.recommendedOptionNumber).toBe(1);
      expect(result.legalGrounds.length).toBeGreaterThan(0);
      expect(result.legalGrounds[0].code).toContain("Thông tư");
      expect(result.roadmap).toHaveLength(3);
      expect(result.options[0].pros.length).toBeGreaterThan(0);
      expect(result.options[0].cons.length).toBeGreaterThan(0);
    });

    // Task 4: Plan & KPI Progress
    it("tracks lesson plan approval and KPI milestones", async () => {
      const result = await defaultAiAnalysisEngine.analyzePlanAndKpiProgress(mockSnapshot);

      expect(result.delayedLessonPlanCount).toBe(2);
      expect(result.delayedSubjectGroups.length).toBeGreaterThan(0);
      const mathGroup = result.delayedSubjectGroups.find(
        (g) => g.subjectGroupName === "Tổ Toán - Tin học"
      );
      expect(mathGroup?.delayedCount).toBe(2);
      expect(result.criticalMilestones.length).toBeGreaterThan(0);
    });

    // Task 5: Docs & Periodic Reports
    it("analyzes official documents with 48h deadline alerts and compiles executive markdown report", async () => {
      const docsResult = await defaultAiAnalysisEngine.analyzeOfficialDocuments(mockSnapshot);
      expect(docsResult.expiringWithin48h).toBe(1);
      expect(docsResult.urgentDispatches.length).toBe(1);

      const reportResult = await defaultAiAnalysisEngine.generatePeriodicReport("DAILY", mockSnapshot);
      expect(reportResult.reportType).toBe("DAILY");
      expect(reportResult.markdownReport).toContain("BÁO CÁO ĐIỀU HÀNH");
      expect(reportResult.markdownReport).toContain("Điểm trường Trung tâm");
      expect(reportResult.markdownReport).toContain("Điểm trường Phia Xam");
    });

    // Task 6: Early Warning Radar
    it("scans early warnings for high-risk students and teacher shortages", async () => {
      const result = await defaultAiAnalysisEngine.scanEarlyWarnings(mockSnapshot);

      expect(result.totalActiveAlerts).toBeGreaterThanOrEqual(2);
      expect(result.highRiskStudents.length).toBeGreaterThanOrEqual(1);
      expect(result.teacherShortages.length).toBeGreaterThanOrEqual(1);
    });

    // Task 7: Communication & Parent Feedback
    it("synthesizes parent feedback and drafts official and Zalo announcements", async () => {
      const fbResult = await defaultAiAnalysisEngine.synthesizeParentFeedback(mockSnapshot);
      expect(fbResult.keyTopics.length).toBeGreaterThan(0);
      expect(fbResult.keyTopics[0].topicName).toBeDefined();

      const draftResult = await defaultAiAnalysisEngine.draftExecutiveAnnouncement(
        {
          topic: "Phòng chống thiên tai và ứng phó mưa lũ",
          audience: "SATELLITE_POINTS",
        },
        mockSnapshot
      );

      expect(draftResult.officialAnnouncementBody).toContain("THÔNG BÁO");
      expect(draftResult.zaloSmsSummary.length).toBeGreaterThan(0);
      expect(draftResult.audience).toBe("SATELLITE_POINTS");
    });
  });

  // ==================== 3. THRESHOLD PRECISION & RESILIENCE TESTS ====================
  describe("3. Threshold Precision & Missing Data Resilience", () => {
    it("loads default thresholds when database config is empty", async () => {
      const thresholds = await loadSchoolThresholds(undefined);
      expect(thresholds.ABSENCE_RATE_CRITICAL).toBe(
        DEFAULT_AI_THRESHOLDS.ABSENCE_RATE_CRITICAL.thresholdValue
      );
      expect(thresholds.ABSENCE_RATE_CRITICAL).toBe(10.0);
    });

    it("handles empty or sparse school point data gracefully without throwing", async () => {
      const emptySnapshot: AggregatedSchoolSnapshot = {
        schoolId: "empty-school",
        schoolName: "Trường THCS Trống",
        date: new Date(),
        thresholds: {
          ABSENCE_RATE_WARNING: 5.0,
          ABSENCE_RATE_CRITICAL: 10.0,
          CLASS_ABSENT_SPIKE: 4.0,
          STUDENT_ABSENT_UNEXCUSED_WARNING: 2.0,
          STUDENT_ABSENT_MONTH_WARNING: 3.0,
          TEACHER_MAX_WEEKLY_PERIODS: 23.0,
          MAX_TRAVEL_DISTANCE_KM: 15.0,
          LESSON_PLAN_DELAY_DAYS: 2.0,
          DOC_EXPIRING_HOURS: 48.0,
          PARENT_FEEDBACK_RESPONSE_HOURS: 48.0,
        },
        schoolPoints: [],
        attendanceTotals: {
          totalStudents: 0,
          presentCount: 0,
          absentExcusedCount: 0,
          absentUnexcusedCount: 0,
          lateCount: 0,
          overallAttendanceRate: 100.0,
        },
        teachers: [],
        equipment: [],
        lessonPlans: {
          totalExpected: 0,
          submittedCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          overdueCount: 0,
          submissionRate: 100,
          delayedTeachers: [],
        },
        kpis: {
          totalKpis: 0,
          onTrackCount: 0,
          atRiskCount: 0,
          criticalCount: 0,
          averageScore: 100,
          atRiskList: [],
        },
        documents: {
          totalPending: 0,
          expiringWithin48h: 0,
          overdueCount: 0,
          expressCount: 0,
          urgentList: [],
        },
        warnings: [],
        parentFeedbacks: {
          totalRecent: 0,
          unrespondedCount: 0,
          positiveCount: 0,
          neutralCount: 0,
          concernCount: 0,
          topConcerns: [],
          recentFeedbacks: [],
        },
      };

      const realtime = await defaultAiAnalysisEngine.analyzeRealtimeStatus(emptySnapshot);
      expect(realtime.overallStatus).toBe("STABLE");
      expect(realtime.overallHealthScore).toBe(100);

      const report = await defaultAiAnalysisEngine.generatePeriodicReport("DAILY", emptySnapshot);
      expect(report.markdownReport).toBeDefined();

      const radar = await defaultAiAnalysisEngine.scanEarlyWarnings(emptySnapshot);
      expect(radar.totalActiveAlerts).toBe(0);
    });
  });
});
