/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner executing Daily KPI System Verification Suite
 * 2. Affected API: calculateDailyRawMetrics, getDailyKpiRealtime, saveDailyKpiEvaluation, getDailyKpiHistory, syncDailyToMonthlyKpi, getDailyKpiOverviewForWidget
 * 3. Data Schemas: DailyKpiEvaluation, DailyKpiItem, DailyKpiPayload
 * 4. Verbatim User Instruction: "Kpi tôi muốn có thêm phần đánh giá hằng ngày" -> "đồng ý" (Kiểm thử tự động toàn diện hệ thống Daily KPI)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateDailyRawMetrics,
  getDailyKpiRealtime,
  saveDailyKpiEvaluation,
  getDailyKpiHistory,
  syncDailyToMonthlyKpi,
  getDailyKpiOverviewForWidget,
} from "../daily-actions";

// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: {
      id: "usr_admin_01",
      name: "Quản Trị Viên",
      role: "ADMIN",
    },
  }),
}));

// Mock tenant context
vi.mock("@/lib/tenant", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    userId: "usr_admin_01",
    userName: "Quản Trị Viên",
    userRole: "ADMIN",
    schoolId: "sch_primary_01",
    campusId: null,
  }),
  buildSchoolDirectFilter: vi.fn().mockReturnValue({ id: "sch_primary_01" }),
  isSuperAdmin: vi.fn().mockReturnValue(false),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    campus: {
      findMany: vi.fn().mockResolvedValue([
        { id: "cmp_main", name: "Cơ Sở Chính (Khu A)", code: "MAIN-01" },
        { id: "cmp_satellite", name: "Điểm Vệ Tinh (Thôn 2)", code: "SAT-02" },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: "cmp_main",
        name: "Cơ Sở Chính (Khu A)",
        code: "MAIN-01",
      }),
    },
    school: {
      findUnique: vi.fn().mockResolvedValue({
        id: "sch_primary_01",
        name: "Trường Tiểu Học Tân Xã",
      }),
    },
    classRoom: {
      findMany: vi.fn().mockResolvedValue([{ id: "cls_1" }, { id: "cls_2" }]),
    },
    student: {
      count: vi.fn().mockResolvedValue(200),
    },
    teacher: {
      count: vi.fn().mockResolvedValue(20),
    },
    attendance: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.status === "PRESENT") return Promise.resolve(190);
        return Promise.resolve(200);
      }),
    },
    incident: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.type?.not === "COMMENDATION") return Promise.resolve(1);
        return Promise.resolve(0);
      }),
      findMany: vi.fn().mockResolvedValue([
        { id: "inc_01", type: "DISCIPLINE", title: "Xô xát nhẹ", description: "Hai học sinh đùa nghịch", severity: "LOW" },
      ]),
    },
    classJournalEntry: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.isConfirmed === true) return Promise.resolve(8);
        return Promise.resolve(10);
      }),
    },
    equipment: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.condition?.in) return Promise.resolve(48);
        return Promise.resolve(50);
      }),
    },
    parentFeedback: {
      count: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.response?.not === null) return Promise.resolve(5);
        return Promise.resolve(5);
      }),
    },
    kpiCatalog: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "kpi_att",
          code: "KPI-STU-01",
          name: "Chuyên cần học sinh hằng ngày",
          category: "STUDENT",
          frequency: "DAILY",
          direction: "HIGHER_BETTER",
          targetValue: 95.0,
          weight: 40.0,
          unit: "%",
          isDailyTracked: true,
          isActive: true,
        },
        {
          id: "kpi_inc",
          code: "KPI-SAF-01",
          name: "Sự cố an ninh & nề nếp",
          category: "SCHOOL_SAFETY",
          frequency: "DAILY",
          direction: "LOWER_BETTER",
          targetValue: 0.0,
          weight: 30.0,
          unit: "vụ",
          isDailyTracked: true,
          isActive: true,
        },
        {
          id: "kpi_jou",
          code: "KPI-PRO-01",
          name: "Tỷ lệ ghi nhận sổ đầu bài",
          category: "PROFESSIONAL",
          frequency: "DAILY",
          direction: "HIGHER_BETTER",
          targetValue: 100.0,
          weight: 30.0,
          unit: "%",
          isDailyTracked: true,
          isActive: true,
        },
      ]),
    },
    dailyKpiEvaluation: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "eval_01",
          date: new Date(new Date().setHours(0, 0, 0, 0)),
          campusId: "cmp_main",
          overallScore: 88.5,
          status: "FINALIZED",
          evaluatedByName: "Quản Trị Viên",
          notes: "Vận hành ổn định",
          campus: { name: "Cơ Sở Chính (Khu A)" },
          items: [
            { kpiCatalogId: "kpi_att", actualValue: 95, kpiCatalog: { code: "KPI-STU-01", name: "Chuyên cần", category: "STUDENT" } },
            { kpiCatalogId: "kpi_inc", actualValue: 0, kpiCatalog: { code: "KPI-SAF-01", name: "Sự cố", category: "SCHOOL_SAFETY" } },
            { kpiCatalogId: "kpi_jou", actualValue: 100, kpiCatalog: { code: "KPI-PRO-01", name: "Sổ đầu bài", category: "PROFESSIONAL" } },
          ],
        },
      ]),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: "eval_upserted_01",
          ...args.create,
        })
      ),
    },
    dailyKpiItem: {
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
      createMany: vi.fn().mockResolvedValue({ count: 3 }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: "item_upserted_01",
          ...args.create,
        })
      ),
    },
    earlyWarning: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "ew_01", ...args.data })),
    },
    kpiPeriod: {
      findFirst: vi.fn().mockResolvedValue({
        id: "period_01",
        title: "Đánh giá KPI Tháng 9/2026",
        year: 2026,
        status: "DRAFT",
        targets: [
          {
            id: "target_01",
            periodId: "period_01",
            kpiId: "kpi_att",
            targetValue: 95,
            weight: 40,
            kpi: { id: "kpi_att", direction: "HIGHER_BETTER", targetValue: 95, weight: 40 },
          },
          {
            id: "target_02",
            periodId: "period_01",
            kpiId: "kpi_inc",
            targetValue: 0,
            weight: 30,
            kpi: { id: "kpi_inc", direction: "LOWER_BETTER", targetValue: 0, weight: 30 },
          },
          {
            id: "target_03",
            periodId: "period_01",
            kpiId: "kpi_jou",
            targetValue: 100,
            weight: 30,
            kpi: { id: "kpi_jou", direction: "HIGHER_BETTER", targetValue: 100, weight: 30 },
          },
        ],
      }),
      create: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: "period_created_01",
          ...args.data,
          targets: [],
        })
      ),
      update: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: args.where.id,
          ...args.data,
        })
      ),
    },
    kpiTarget: {
      createMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
    kpiValue: {
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: "val_synced_01",
          ...args.create,
        })
      ),
    },
  },
}));

describe("Daily KPI System Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Real-time Metrics Calculation (calculateDailyRawMetrics)", () => {
    it("should aggregate student attendance, incidents, and journal rates correctly", async () => {
      const today = new Date("2026-09-24");
      const metrics = await calculateDailyRawMetrics(today, "cmp_main");

      // 190 present / 200 total = 95%
      expect(metrics.attendanceRate).toBe(95);
      // 1 incident
      expect(metrics.incidentCount).toBe(1);
      // 8 confirmed / 10 total periods = 80%
      expect(metrics.journalCompletionRate).toBe(80);
      // 48 good / 50 total = 96%
      expect(metrics.equipmentRate).toBe(96);
      // 5 responded / 5 total = 100%
      expect(metrics.parentFeedbackRate).toBe(100);
    });
  });

  describe("2. Realtime Daily KPI Scorecard Evaluation (getDailyKpiRealtime)", () => {
    it("should calculate weighted scores and completion rates across indicators", async () => {
      const res = await getDailyKpiRealtime("2026-09-24", "cmp_main");

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const data = res.data!;
      expect(data.items.length).toBe(3);
      expect(data.campusName).toBe("Cơ Sở Chính (Khu A)");

      // Check attendance item: target 95, actual 95 => 100% completion => weighted 40 * 1 = 40
      const attItem = data.items.find((i) => i.code === "KPI-STU-01");
      expect(attItem).toBeDefined();
      expect(attItem?.actualValue).toBe(95);
      expect(attItem?.completionRate).toBe(100);
      expect(attItem?.weightedScore).toBe(40);

      // Check incident item (LOWER_BETTER): target 0, actual 1
      const incItem = data.items.find((i) => i.code === "KPI-SAF-01");
      expect(incItem).toBeDefined();
      expect(incItem?.actualValue).toBe(1);

      // Composite overall score should be calculated
      expect(data.overallScore).toBeGreaterThan(0);
      expect(data.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe("3. Save Daily KPI Evaluation & Warning Radar (saveDailyKpiEvaluation)", () => {
    it("should save draft evaluation successfully", async () => {
      const saveRes = await saveDailyKpiEvaluation({
        date: "2026-09-24",
        campusId: "cmp_main",
        status: "DRAFT" as any,
        notes: "Ghi chú theo dõi ban đầu",
        items: [
          {
            kpiCatalogId: "kpi_att",
            autoValue: 95,
            manualValue: 95,
            notes: "Đạt chỉ tiêu chuyên cần",
          },
          {
            kpiCatalogId: "kpi_inc",
            autoValue: 0,
            manualValue: 0,
            notes: "Không có sự cố an ninh",
          },
          {
            kpiCatalogId: "kpi_jou",
            autoValue: 100,
            manualValue: 100,
            notes: "Hoàn thành 100% sổ đầu bài",
          },
        ],
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.data?.overallScore).toBe(100);
      expect(saveRes.data?.status).toBe("DRAFT");
    });

    it("should finalize evaluation and compute composite score = 100", async () => {
      const saveRes = await saveDailyKpiEvaluation({
        date: "2026-09-24",
        campusId: "cmp_main",
        status: "FINALIZED" as any,
        notes: "Chốt dữ liệu vận hành cuối ngày",
        items: [
          {
            kpiCatalogId: "kpi_att",
            autoValue: 95,
            manualValue: 95,
          },
          {
            kpiCatalogId: "kpi_inc",
            autoValue: 0,
            manualValue: 0,
          },
          {
            kpiCatalogId: "kpi_jou",
            autoValue: 100,
            manualValue: 100,
          },
        ],
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.data?.overallScore).toBe(100);
      expect(saveRes.data?.status).toBe("FINALIZED");
    });
  });

  describe("4. 7-Day Trendline History (getDailyKpiHistory)", () => {
    it("should fetch historical evaluation records", async () => {
      const historyRes = await getDailyKpiHistory("cmp_main", 7);

      expect(historyRes.success).toBe(true);
      expect(historyRes.data).toBeDefined();
      expect(historyRes.data?.length).toBe(7);
      const todayRecord = historyRes.data?.find((d) => d.overallScore !== null);
      expect(todayRecord?.overallScore).toBe(88.5);
    });
  });

  describe("5. Monthly KPI Rollup Synchronization (syncDailyToMonthlyKpi)", () => {
    it("should aggregate daily scores and sync to monthly KpiPeriod", async () => {
      const syncRes = await syncDailyToMonthlyKpi(9, 2026, "cmp_main");

      expect(syncRes.success).toBe(true);
      expect(syncRes.message).toContain("đồng bộ thành công");
    });
  });

  describe("6. Daily KPI Dashboard Widget (getDailyKpiOverviewForWidget)", () => {
    it("should return compact widget summary with operational metrics", async () => {
      const widgetRes = await getDailyKpiOverviewForWidget("cmp_main");

      expect(widgetRes.success).toBe(true);
      expect(widgetRes.data).toBeDefined();
      expect(widgetRes.data?.attendanceRate).toBe(95);
      expect(widgetRes.data?.incidentCount).toBe(1);
      expect(widgetRes.data?.journalRate).toBe(80);
      expect(widgetRes.data?.campusName).toBe("Cơ Sở Chính (Khu A)");
    });
  });
});
