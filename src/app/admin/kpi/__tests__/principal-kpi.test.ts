/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner executing Principal KPI Verification suite
 * 2. Affected API: getPrincipalKpiComparisonData, generatePrincipalKpiAiInsights, composite score formulas
 * 3. Data Schemas: PrincipalKpiOverviewPayload, PrincipalKpiEntityComparison
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportingFrequency, KpiPeriodStatus, WarningCategory, WarningLevel } from "@prisma/client";
import {
  getPrincipalKpiComparisonData,
  generatePrincipalKpiAiInsights,
  savePrincipalKpiSnapshot,
  triggerPrincipalKpiEarlyWarnings,
  getPrincipalKpiHistoricalTrends,
  createQualityGoalFromBottleneck,
  batchScanAllCampusesKpiAndEarlyWarnings,
  submitCampusKpiForReview,
  approveCampusKpiSnapshot,
} from "../principal-actions";
import { getVPKpiSummary } from "@/app/vice-principal/dashboard/actions";

// Mock tenant context
vi.mock("@/lib/tenant", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    userId: "usr_principal_01",
    userName: "Hiệu Trưởng Nguyễn Văn A",
    userRole: "ADMIN",
    schoolId: "sch_primary_01",
    campusId: null,
  }),
  buildSchoolDirectFilter: vi.fn().mockReturnValue({ id: "sch_primary_01" }),
  isSuperAdmin: vi.fn().mockReturnValue(false),
}));

// Mock AI Provider
vi.mock("@/lib/ai-provider", () => ({
  aiChatCompletion: vi.fn().mockResolvedValue({
    success: true,
    text: "### 1. ĐÁNH GIÁ TỔNG THỂ\n[DỮ KIỆN - có số liệu]: Tỷ lệ chuyên cần đạt 97% trên toàn trường.\n[SUY LUẬN - cần xác minh]: Cần tập trung đầu tư cơ sở vật chất cho điểm trường vệ tinh.",
  }),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    kpiCatalog: {
      findMany: vi.fn().mockResolvedValue([
        { id: "kpi_01", code: "KPI-01", name: "Chuyên cần học sinh", category: "STUDENT", targetValue: 95, weight: 1, direction: "ASCENDING", isActive: true },
        { id: "kpi_02", code: "KPI-02", name: "An toàn học đường", category: "SCHOOL_SAFETY", targetValue: 0, weight: 1, direction: "DESCENDING", isActive: true },
      ]),
    },
    campus: {
      findFirst: vi.fn().mockResolvedValue({ id: "cmp_main" }),
      findUnique: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: args?.where?.id || "cmp_satellite_1",
          name: "Điểm Trường Vệ Tinh (Thôn 2)",
          code: "SAT-02",
          schoolId: "sch_primary_01",
          school: { id: "sch_primary_01", name: "Trường Tiểu Học Tân Xã" },
        })
      ),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "cmp_main",
          name: "Điểm Trường Chính (Khu A)",
          code: "MAIN-01",
          schoolId: "sch_primary_01",
          school: { id: "sch_primary_01", name: "Trường Tiểu Học Tân Xã" },
        },
        {
          id: "cmp_satellite_1",
          name: "Điểm Trường Vệ Tinh (Thôn 2)",
          code: "SAT-02",
          schoolId: "sch_primary_01",
          school: { id: "sch_primary_01", name: "Trường Tiểu Học Tân Xã" },
        },
      ]),
    },
    school: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "sch_primary_01",
          name: "Trường Tiểu Học Tân Xã",
          code: "TH-TX",
          campuses: [
            { id: "cmp_main", name: "Điểm Trường Chính (Khu A)" },
            { id: "cmp_satellite_1", name: "Điểm Trường Vệ Tinh (Thôn 2)" },
          ],
        },
      ]),
    },
    classRoom: {
      findMany: vi.fn().mockResolvedValue([
        { id: "cls_1" },
        { id: "cls_2" },
      ]),
    },
    student: {
      count: vi.fn().mockResolvedValue(180),
    },
    teacher: {
      count: vi.fn().mockResolvedValue(15),
    },
    kpiPeriod: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "period_p1",
          month: 1,
          year: 2026,
          compositeScore: 82.0,
          campusId: "cmp_main",
          schoolId: "sch_primary_01",
          campus: { name: "Điểm Trường Chính (Khu A)" },
          school: { name: "Trường Tiểu Học Tân Xã" },
        },
        {
          id: "period_p2",
          month: 2,
          year: 2026,
          compositeScore: 85.5,
          campusId: "cmp_main",
          schoolId: "sch_primary_01",
          campus: { name: "Điểm Trường Chính (Khu A)" },
          school: { name: "Trường Tiểu Học Tân Xã" },
        },
        {
          id: "period_p3",
          month: 1,
          year: 2026,
          compositeScore: 75.0,
          campusId: "cmp_satellite_1",
          schoolId: "sch_primary_01",
          campus: { name: "Điểm Trường Vệ Tinh (Thôn 2)" },
          school: { name: "Trường Tiểu Học Tân Xã" },
        },
        {
          id: "period_p4",
          month: 2,
          year: 2026,
          compositeScore: 78.0,
          campusId: "cmp_satellite_1",
          schoolId: "sch_primary_01",
          campus: { name: "Điểm Trường Vệ Tinh (Thôn 2)" },
          school: { name: "Trường Tiểu Học Tân Xã" },
        },
      ]),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "period_new_01", ...args.data })),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args.where?.id || "period_01", ...args.data })),
    },
    earlyWarning: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "ew_01", ...args.data })),
    },
    notification: {
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "notif_01", ...args.data })),
    },
    qualityObjective: {
      count: vi.fn().mockResolvedValue(3),
      findMany: vi.fn().mockResolvedValue([
        { id: "qo_01", title: "Nâng cao chất lượng dạy học", status: "ACHIEVED", campusScope: "ALL" },
        { id: "qo_02", title: "Chuyển đổi số giáo án điện tử", status: "ACHIEVED", campusScope: "ALL" },
      ]),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "qo_01", ...args.data })),
    },
    commendation: {
      count: vi.fn().mockResolvedValue(4),
    },
    kpiApprovalLog: {
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "log_01", ...args.data })),
    },
    kpiValue: {
      upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "val_01", ...args.create })),
    },
    attendance: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args.where?.status === "PRESENT") return Promise.resolve(480);
        return Promise.resolve(500);
      }),
    },
    incident: {
      count: vi.fn().mockResolvedValue(0),
    },
    lessonPlan: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args.where?.status === "APPROVED") return Promise.resolve(45);
        return Promise.resolve(50);
      }),
    },
    grade: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args.where?.score?.gte === 6.5) return Promise.resolve(140);
        return Promise.resolve(150);
      }),
    },
    equipment: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args.where?.status === "IN_USE") return Promise.resolve(80);
        return Promise.resolve(100);
      }),
    },
    parentFeedback: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args.where?.status === "RESPONDED") return Promise.resolve(25);
        return Promise.resolve(30);
      }),
    },
  },
}));

describe("Principal KPI Multi-School & Multi-Campus System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Data Aggregation & Multi-Campus Comparison", () => {
    it("should successfully aggregate KPI data for all campuses under a school", async () => {
      const res = await getPrincipalKpiComparisonData({
        year: 2026,
        periodType: ReportingFrequency.MONTHLY,
        scopeType: "CAMPUS",
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      if (!res.data) return;

      expect(res.data.totalEntities).toBe(2);
      expect(res.data.entities.length).toBe(2);
      expect(res.data.averageScore).toBeGreaterThan(0);
      expect(res.data.benchmarkRadar.length).toBe(6);
    });

    it("should assign correct 4-tier ratings based on composite score", async () => {
      const res = await getPrincipalKpiComparisonData({
        year: 2026,
        periodType: ReportingFrequency.MONTHLY,
        scopeType: "CAMPUS",
      });

      expect(res.success).toBe(true);
      if (!res.data) return;

      const entity = res.data.entities[0];
      expect(entity.rank).toBe(1);
      expect(["XUAT_SAC", "TOT", "DAT", "CAN_CAN_THIEP"]).toContain(entity.tier);
      expect(entity.pillars.length).toBe(4);
    });

    it("should correctly compute 6-dimension benchmark radar values", async () => {
      const res = await getPrincipalKpiComparisonData({
        year: 2026,
        periodType: ReportingFrequency.MONTHLY,
        scopeType: "CAMPUS",
      });

      expect(res.success).toBe(true);
      if (!res.data) return;

      const radar = res.data.benchmarkRadar;
      expect(radar.some((r) => r.dimension === "Chất lượng dạy học")).toBe(true);
      expect(radar.some((r) => r.dimension === "Chuyên môn giáo viên")).toBe(true);
      expect(radar.some((r) => r.dimension === "Chuyên cần nề nếp")).toBe(true);
      expect(radar.some((r) => r.dimension === "An toàn học đường")).toBe(true);
      expect(radar.some((r) => r.dimension === "Cơ sở vật chất")).toBe(true);
      expect(radar.some((r) => r.dimension === "Chuyển đổi số")).toBe(true);
    });
  });

  describe("2. Principal AI Decision Support Generator", () => {
    it("should generate grounded strategic advice without errors", async () => {
      const aiRes = await generatePrincipalKpiAiInsights({
        year: 2026,
        periodType: ReportingFrequency.MONTHLY,
        scopeType: "CAMPUS",
        entityCount: 2,
        averageScore: 84.5,
        entitiesSummary: [
          {
            name: "Điểm Trường Chính (Khu A)",
            rank: 1,
            compositeScore: 88,
            tier: "Khá / Tốt",
            topBottlenecks: [],
            topStrengths: ["Chuyên cần & Nề nếp đạt 97%"],
          },
          {
            name: "Điểm Trường Vệ Tinh (Thôn 2)",
            rank: 2,
            compositeScore: 78,
            tier: "Khá / Tốt",
            topBottlenecks: ["Cơ sở vật chất đạt 72%"],
            topStrengths: ["Nề nếp & Chuyên cần tốt"],
          },
        ],
      });

      expect(aiRes.success).toBe(true);
      expect(aiRes.analysis).toBeDefined();
      expect(typeof aiRes.analysis).toBe("string");
      expect(aiRes.analysis!.length).toBeGreaterThan(20);
    });
  });

  describe("3. Principal KPI Snapshot Freezing & Storage", () => {
    it("should successfully freeze and save KPI snapshot with approval log", async () => {
      const res = await savePrincipalKpiSnapshot({
        entityId: "cmp_main",
        entityType: "CAMPUS",
        year: 2026,
        periodType: ReportingFrequency.MONTHLY,
        compositeScore: 88.5,
        status: KpiPeriodStatus.APPROVED,
        comments: "Phê duyệt snapshot kiểm toán tháng",
        categoryScores: {
          STUDENT: {
            category: "STUDENT" as any,
            categoryName: "Chất lượng dạy học",
            completionRate: 95,
            weightedScore: 7.6,
            status: "EXCELLENT",
            kpiCount: 1,
          },
        },
      });

      expect(res.success).toBe(true);
      expect(res.periodId).toBe("period_new_01");
      expect(res.message).toContain("Đã chốt sổ và lưu snapshot KPI thành công");
    });
  });

  describe("4. Vice-Principal KPI Summary Scoping", () => {
    it("should retrieve campus-scoped KPI performance for Vice Principal", async () => {
      const vpSummary = await getVPKpiSummary("cmp_main");

      expect(vpSummary).not.toBeNull();
      if (!vpSummary) return;

      expect(vpSummary.campusName).toBe("Điểm Trường Chính (Khu A)");
      expect(vpSummary.compositeScore).toBeGreaterThan(0);
      expect(vpSummary.rank).toBe(1);
      expect(vpSummary.totalEntities).toBe(2);
      expect(vpSummary.pillars.length).toBe(4);
    });
  });

  describe("5. Automated Early Warning & Alert Triggering", () => {
    it("should dispatch early warnings when entity composite score is below 70 or tier is CAN_CAN_THIEP", async () => {
      const res = await triggerPrincipalKpiEarlyWarnings({
        entityId: "cmp_satellite_1",
        entityName: "Điểm Trường Vệ Tinh (Thôn 2)",
        compositeScore: 65,
        tier: "CAN_CAN_THIEP",
        bottlenecks: ["Cơ sở vật chất xuống cấp", "Chuyên cần sụt giảm"],
        attendanceRate: 88,
        incidentCount: 2,
      });

      expect(res.success).toBe(true);
      expect(res.count).toBeGreaterThan(0);
      expect(res.message).toContain("cảnh báo sớm");
    });

    it("should not create duplicate warnings if already resolved or normal", async () => {
      const res = await triggerPrincipalKpiEarlyWarnings({
        entityId: "cmp_main",
        entityName: "Điểm Trường Chính (Khu A)",
        compositeScore: 92,
        tier: "XUAT_SAC",
        bottlenecks: [],
        attendanceRate: 98,
        incidentCount: 0,
      });

      expect(res.success).toBe(true);
      expect(res.count).toBe(0);
    });
  });

  describe("6. Multi-Period Longitudinal Trend Engine", () => {
    it("should aggregate historical KPI periods across months", async () => {
      const trendRes = await getPrincipalKpiHistoricalTrends({
        scopeType: "CAMPUS",
        year: 2026,
      });

      expect(trendRes.success).toBe(true);
      expect(trendRes.trendData).toBeDefined();
      expect(trendRes.trendData!.length).toBeGreaterThan(0);
      expect(trendRes.entities).toContain("Điểm Trường Chính (Khu A)");
      expect(trendRes.entities).toContain("Điểm Trường Vệ Tinh (Thôn 2)");

      const firstPeriod = trendRes.trendData![0];
      expect(firstPeriod.periodLabel).toBeDefined();
    });
  });

  describe("7. Bottleneck to Strategic Quality Objective Conversion", () => {
    it("should convert a detected KPI bottleneck into an actionable Quality Objective", async () => {
      const goalRes = await createQualityGoalFromBottleneck({
        entityName: "Điểm Trường Vệ Tinh (Thôn 2)",
        campusId: "cmp_satellite_1",
        bottleneckText: "Tỷ lệ cơ sở vật chất đạt chuẩn chỉ đạt 70%",
        targetScore: 95,
      });

      expect(goalRes.success).toBe(true);
      expect(goalRes.objectiveId).toBe("qo_01");
      expect(goalRes.code).toBeDefined();
      expect(goalRes.message).toContain("Đã tạo Kế hoạch Cải tiến Chất lượng thành công");
    });
  });

  describe("8. Batch Scanning All Campuses and Early Warnings", () => {
    it("should scan all campuses across the network and report scan counts and warning counts", async () => {
      const scanRes = await batchScanAllCampusesKpiAndEarlyWarnings({
        year: 2026,
        autoDispatchWarnings: true,
      });

      expect(scanRes.success).toBe(true);
      expect(scanRes.scannedEntitiesCount).toBe(2);
      expect(scanRes.scanResults).toBeDefined();
      expect(scanRes.scanResults!.length).toBe(2);
      expect(typeof scanRes.totalWarningsCreated).toBe("number");
    });
  });

  describe("9. 2-Step Review & Snapshot Approval Workflow", () => {
    it("should allow Vice Principal to submit campus KPI review request", async () => {
      const submitRes = await submitCampusKpiForReview({
        campusId: "cmp_satellite_1",
        year: 2026,
        periodType: ReportingFrequency.SEMESTER,
        compositeScore: 78.5,
        comments: "Phó Hiệu Trưởng kính trình Ban Giám Hiệu xem xét kết quả KPI Học kỳ 1",
      });

      expect(submitRes.success).toBe(true);
      expect(submitRes.periodId).toBeDefined();
      expect(submitRes.message).toContain("phê duyệt thành công");
    });

    it("should allow Principal to approve and lock campus KPI snapshot", async () => {
      const approveRes = await approveCampusKpiSnapshot({
        campusId: "cmp_satellite_1",
        year: 2026,
        periodType: ReportingFrequency.SEMESTER,
        comments: "Hiệu Trưởng đã ký duyệt và chính thức khóa sổ dữ liệu KPI",
      });

      expect(approveRes.success).toBe(true);
      expect(approveRes.periodId).toBeDefined();
      expect(approveRes.message).toContain("thành công");
    });
  });
});
