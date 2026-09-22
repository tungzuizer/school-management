/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner executing Emulation & Attendance KPI test suite
 * 2. Affected APIs: getRealtimeEmulationBoard, getEmulationClassDetail, getEmulationCampusesAndGrades
 * 3. Data Schemas: EmulationBoardPayload, ClassEmulationScore, CampusEmulationBenchmark
 * 4. Verbatim User Instruction: "thực hiện đi" - "dựa trên điểm danh hằng ngày để đưa lên kpi trực tiếp hằng ngày và đi muộn để đánh giá thi đua của từng lớp và từng trường"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRealtimeEmulationBoard,
  getEmulationClassDetail,
  getEmulationCampusesAndGrades,
  triggerEmulationEarlyWarnings,
} from "../actions";

// Mock Tenant Context
vi.mock("@/lib/tenant", () => ({
  getTenantContext: vi.fn().mockResolvedValue({
    userId: "usr_principal_01",
    userName: "ThS. Trần Thị Thanh Hà",
    userRole: "ADMIN",
    schoolId: "sch_pholu_01",
    campusId: null,
  }),
  isSuperAdmin: vi.fn().mockReturnValue(false),
}));

// Mock Prisma Client
vi.mock("@/lib/prisma", () => ({
  default: {
    school: {
      findFirst: vi.fn().mockResolvedValue({ id: "sch_pholu_01", name: "Trường Tiểu học Phố Lu" }),
    },
    campus: {
      findMany: vi.fn().mockResolvedValue([
        { id: "cmp_tt", name: "Điểm trường Trung tâm" },
        { id: "cmp_sh1", name: "Phân hiệu Sơn Hà 1" },
        { id: "cmp_sh2", name: "Phân hiệu Sơn Hà 2" },
      ]),
    },
    classRoom: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "cls_1A1",
          name: "1A1",
          gradeLevel: 1,
          campusId: "cmp_tt",
          schoolId: "sch_pholu_01",
          campus: { id: "cmp_tt", name: "Điểm trường Trung tâm" },
          school: { id: "sch_pholu_01", name: "Trường Tiểu học Phố Lu" },
          homeroomTeacher: { user: { id: "usr_t1", name: "Cô Nguyễn Thị Mai" } },
          students: [
            { id: "std_01" },
            { id: "std_02" },
            { id: "std_03" },
          ],
        },
        {
          id: "cls_1A2",
          name: "1A2",
          gradeLevel: 1,
          campusId: "cmp_tt",
          schoolId: "sch_pholu_01",
          campus: { id: "cmp_tt", name: "Điểm trường Trung tâm" },
          school: { id: "sch_pholu_01", name: "Trường Tiểu học Phố Lu" },
          homeroomTeacher: { user: { id: "usr_t2", name: "Thầy Lê Văn Bình" } },
          students: [
            { id: "std_04" },
            { id: "std_05" },
          ],
        },
        {
          id: "cls_2A_SH1",
          name: "2A_SH1",
          gradeLevel: 2,
          campusId: "cmp_sh1",
          schoolId: "sch_pholu_01",
          campus: { id: "cmp_sh1", name: "Phân hiệu Sơn Hà 1" },
          school: { id: "sch_pholu_01", name: "Trường Tiểu học Phố Lu" },
          homeroomTeacher: { user: { id: "usr_t3", name: "Cô Phạm Thị Dung" } },
          students: [
            { id: "std_06" },
            { id: "std_07" },
          ],
        },
        {
          id: "cls_3A_WARNED",
          name: "3A_WARNED",
          gradeLevel: 3,
          campusId: "cmp_sh2",
          schoolId: "sch_pholu_01",
          campus: { id: "cmp_sh2", name: "Phân hiệu Sơn Hà 2" },
          school: { id: "sch_pholu_01", name: "Trường Tiểu học Phố Lu" },
          homeroomTeacher: { user: { id: "usr_t4", name: "Thầy Hoàng Văn Hải" } },
          students: [
            { id: "std_08" },
            { id: "std_09" },
            { id: "std_10" },
          ],
        },
      ]),
      findUnique: vi.fn().mockImplementation((args: any) => {
        const id = args?.where?.id;
        return Promise.resolve({
          id: id || "cls_1A1",
          name: id === "cls_3A_WARNED" ? "3A_WARNED" : "1A1",
          campus: { name: "Điểm trường Trung tâm" },
          homeroomTeacher: { user: { id: "usr_teacher_01", name: "Cô Nguyễn Thị Mai" } },
        });
      }),
    },
    attendance: {
      findMany: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.classId === "cls_1A1" && args?.where?.status?.in) {
          // Used in getEmulationClassDetail
          return Promise.resolve([
            {
              id: "att_01",
              studentId: "std_01",
              date: new Date("2026-09-21T00:00:00.000Z"),
              period: 1,
              status: "LATE",
              note: "Đi muộn 10 phút do hỏng xe",
              student: { studentCode: "HS202601", user: { name: "Bùi Minh Nhật" } },
            },
          ]);
        }

        // General aggregation in getRealtimeEmulationBoard
        return Promise.resolve([
          // cls_1A1: 2 PRESENT, 1 LATE (Score: 100 - 1 = 99)
          { classId: "cls_1A1", status: "PRESENT", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_1A1", status: "PRESENT", date: new Date("2026-09-22T00:00:00.000Z") },
          { classId: "cls_1A1", status: "LATE", date: new Date("2026-09-22T00:00:00.000Z") },

          // cls_1A2: 2 PRESENT, 0 LATE (Score: 100 + 5 bonus = 105)
          { classId: "cls_1A2", status: "PRESENT", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_1A2", status: "PRESENT", date: new Date("2026-09-22T00:00:00.000Z") },

          // cls_2A_SH1: 1 PRESENT, 1 ABSENT_UNEXCUSED (Score: 100 - 2 = 98)
          { classId: "cls_2A_SH1", status: "PRESENT", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_2A_SH1", status: "ABSENT_UNEXCUSED", date: new Date("2026-09-22T00:00:00.000Z") },

          // cls_3A_WARNED: 5 LATE, 3 ABSENT_UNEXCUSED (Score: 100 - 5*1 - 3*2 = 89; late+absent = 8 >= 3)
          { classId: "cls_3A_WARNED", status: "LATE", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "LATE", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "LATE", date: new Date("2026-09-22T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "LATE", date: new Date("2026-09-22T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "LATE", date: new Date("2026-09-22T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "ABSENT_UNEXCUSED", date: new Date("2026-09-21T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "ABSENT_UNEXCUSED", date: new Date("2026-09-22T00:00:00.000Z") },
          { classId: "cls_3A_WARNED", status: "ABSENT_UNEXCUSED", date: new Date("2026-09-22T00:00:00.000Z") },
        ]);
      }),
    },
    incident: {
      findMany: vi.fn().mockImplementation((args: any) => {
        if (args?.where?.classId === "cls_1A1") {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      }),
    },
    earlyWarning: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: "ew_emu_01", ...args.data })
      ),
    },
    notification: {
      create: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({ id: "notif_emu_01", ...args.data })
      ),
    },
  },
}));

describe("Real-Time Daily Attendance & Emulation Scoring Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Real-time Calculation & Ranking", () => {
    it("should aggregate attendance records and correctly rank classes by emulation score", async () => {
      const res = await getRealtimeEmulationBoard({
        periodType: "TODAY",
        date: "2026-09-22",
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      if (!res.data) return;

      expect(res.data.totalClasses).toBe(4);
      expect(res.data.totalStudents).toBe(10);

      // Class 1A2 had 100% attendance & 0 late -> Score 105 -> Rank #1
      const topClass = res.data.classes[0];
      expect(topClass.className).toBe("1A2");
      expect(topClass.emulationScore).toBe(105);
      expect(topClass.tier).toBe("XUAT_SAC");
      expect(topClass.rank).toBe(1);

      // Class 1A1 had 1 Late -> Score 99 (100 - 1) -> Rank #2
      const secondClass = res.data.classes[1];
      expect(secondClass.className).toBe("1A1");
      expect(secondClass.emulationScore).toBe(99);
      expect(secondClass.lateCount).toBe(1);
      expect(secondClass.rank).toBe(2);

      // Class 2A_SH1 had 1 Absent Unexcused -> Score 98 (100 - 2) -> Rank #3
      const thirdClass = res.data.classes[2];
      expect(thirdClass.className).toBe("2A_SH1");
      expect(thirdClass.emulationScore).toBe(98);
      expect(thirdClass.absentUnexcusedCount).toBe(1);
      expect(thirdClass.rank).toBe(3);
    });

    it("should compute multi-campus benchmarks with correct averages", async () => {
      const res = await getRealtimeEmulationBoard({
        periodType: "THIS_WEEK",
      });

      expect(res.success).toBe(true);
      if (!res.data) return;

      expect(res.data.campusBenchmarks.length).toBe(3);
      const ttCampus = res.data.campusBenchmarks.find((c) => c.campusId === "cmp_tt");
      expect(ttCampus).toBeDefined();
      if (!ttCampus) return;

      expect(ttCampus.classCount).toBe(2);
      expect(ttCampus.studentCount).toBe(5);
      // Avg Score for cmp_tt: (105 + 99) / 2 = 102
      expect(ttCampus.avgEmulationScore).toBe(102);
      expect(ttCampus.totalLateCount).toBe(1);
      expect(ttCampus.topClass?.name).toBe("1A2");
    });

    it("should correctly rank classes within their respective Grade Level", async () => {
      const res = await getRealtimeEmulationBoard({
        periodType: "THIS_WEEK",
      });

      expect(res.success).toBe(true);
      if (!res.data) return;

      const class1A2 = res.data.classes.find((c) => c.className === "1A2");
      const class1A1 = res.data.classes.find((c) => c.className === "1A1");
      const class2A = res.data.classes.find((c) => c.className === "2A_SH1");

      expect(class1A2?.rankInGrade).toBe(1);
      expect(class1A1?.rankInGrade).toBe(2);
      expect(class2A?.rankInGrade).toBe(1); // Only class in Grade 2
    });
  });

  describe("2. Class Emulation Inspection & Late/Absent Student Drill-down", () => {
    it("should retrieve specific student late arrivals and reasons for the modal inspector", async () => {
      const detailRes = await getEmulationClassDetail({
        classId: "cls_1A1",
        date: "2026-09-22",
      });

      expect(detailRes.success).toBe(true);
      expect(detailRes.data).toBeDefined();
      if (!detailRes.data) return;

      expect(detailRes.data.className).toBe("1A1");
      expect(detailRes.data.campusName).toBe("Điểm trường Trung tâm");
      expect(detailRes.data.homeroomTeacherName).toBe("Cô Nguyễn Thị Mai");
      expect(detailRes.data.lateRecords.length).toBe(1);
      expect(detailRes.data.lateRecords[0].studentName).toBe("Bùi Minh Nhật");
      expect(detailRes.data.lateRecords[0].note).toContain("hỏng xe");
    });
  });

  describe("3. Filter Metadata retrieval", () => {
    it("should return campus list and 1-5 grade array", async () => {
      const meta = await getEmulationCampusesAndGrades("sch_pholu_01");
      expect(meta.campuses.length).toBe(3);
      expect(meta.grades).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("4. Automated Early Warning & Homeroom Teacher Notification", () => {
    it("should detect classes with emulation bottlenecks and dispatch warnings to homeroom teachers", async () => {
      const warningRes = await triggerEmulationEarlyWarnings({
        periodType: "THIS_WEEK",
      });

      expect(warningRes.success).toBe(true);
      expect(warningRes.count).toBeGreaterThan(0);
      expect(warningRes.warningsCreated.some((w) => w.className === "3A_WARNED")).toBe(true);
      expect(warningRes.message).toContain("cảnh báo sớm");
    });
  });
});
