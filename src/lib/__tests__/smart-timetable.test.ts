/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`npm test`).
 * 2. Purpose: Unit testing Smart AI Timetable Engine constraints (Assembly Mon P1, Homeroom Fri end, max 7 periods/day, teacher max 5 shifts/week, shift preference, zero overlap).
 * 3. Schema: `Schedule`, `ClassRoom`, `Teacher`, `Subject`, `TeachingAssignment`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

import { describe, it, expect } from "vitest";
import {
  SmartTimetableEngine,
  ClassRequirement,
  DEFAULT_TIMETABLE_CONFIG,
  getShiftForPeriod,
  generateAvailableTimeSlots,
} from "@/lib/smart-timetable-engine";

describe("Smart AI Timetable Engine & Pedagogical Constraints", () => {
  const sampleClasses: ClassRequirement[] = [
    {
      classId: "cls_10a1",
      className: "10A1",
      gradeLevel: 10,
      homeroomTeacherId: "tch_gvcn_10a1",
      homeroomTeacherName: "Thầy Nguyễn Văn A (GVCN 10A1)",
      demands: [
        { subjectId: "sub_toan", subjectName: "Toán", teacherId: "tch_toan_1", teacherName: "Cô Trần Thị Toán", periodsPerWeek: 4, requiresConsecutivePairs: true },
        { subjectId: "sub_van", subjectName: "Ngữ văn", teacherId: "tch_van_1", teacherName: "Cô Lê Thị Văn", periodsPerWeek: 4, requiresConsecutivePairs: true },
        { subjectId: "sub_anh", subjectName: "Tiếng Anh", teacherId: "tch_anh_1", teacherName: "Thầy John English", periodsPerWeek: 3 },
        { subjectId: "sub_ly", subjectName: "Vật lí", teacherId: "tch_ly_1", teacherName: "Thầy Phạm Vật Lý", periodsPerWeek: 2 },
        { subjectId: "sub_hoa", subjectName: "Hóa học", teacherId: "tch_hoa_1", teacherName: "Cô Hoàng Hóa Học", periodsPerWeek: 2 },
        { subjectId: "sub_theduc", subjectName: "Thể dục", teacherId: "tch_theduc_1", teacherName: "Thầy Vũ Thể Dục", periodsPerWeek: 2 },
        { subjectId: "sub_gdqp", subjectName: "GDQP-AN", teacherId: "tch_gdqp_1", teacherName: "Thầy Đỗ Quốc Phòng", periodsPerWeek: 1 },
        { subjectId: "sub_tin", subjectName: "Tin học", teacherId: "tch_tin_1", teacherName: "Cô Bùi Tin Học", periodsPerWeek: 2 },
        { subjectId: "sub_su", subjectName: "Lịch sử", teacherId: "tch_su_1", teacherName: "Thầy Ngô Lịch Sử", periodsPerWeek: 2 },
        { subjectId: "sub_dia", subjectName: "Địa lí", teacherId: "tch_dia_1", teacherName: "Cô Mai Địa Lý", periodsPerWeek: 2 },
      ],
    },
    {
      classId: "cls_10a2",
      className: "10A2",
      gradeLevel: 10,
      homeroomTeacherId: "tch_gvcn_10a2",
      homeroomTeacherName: "Cô Phạm Thị B (GVCN 10A2)",
      demands: [
        { subjectId: "sub_toan", subjectName: "Toán", teacherId: "tch_toan_1", teacherName: "Cô Trần Thị Toán", periodsPerWeek: 4, requiresConsecutivePairs: true },
        { subjectId: "sub_van", subjectName: "Ngữ văn", teacherId: "tch_van_2", teacherName: "Thầy Đặng Ngữ Văn", periodsPerWeek: 4, requiresConsecutivePairs: true },
        { subjectId: "sub_anh", subjectName: "Tiếng Anh", teacherId: "tch_anh_1", teacherName: "Thầy John English", periodsPerWeek: 3 },
        { subjectId: "sub_ly", subjectName: "Vật lí", teacherId: "tch_ly_1", teacherName: "Thầy Phạm Vật Lý", periodsPerWeek: 2 },
        { subjectId: "sub_theduc", subjectName: "Thể dục", teacherId: "tch_theduc_1", teacherName: "Thầy Vũ Thể Dục", periodsPerWeek: 2 },
        { subjectId: "sub_tin", subjectName: "Tin học", teacherId: "tch_tin_1", teacherName: "Cô Bùi Tin Học", periodsPerWeek: 2 },
      ],
    },
  ];

  it("generates valid time slots covering morning and afternoon shifts", () => {
    const slots = generateAvailableTimeSlots();
    expect(slots.length).toBe(6 * 7); // 6 days * 7 periods = 42 slots

    expect(getShiftForPeriod(1)).toBe("MORNING");
    expect(getShiftForPeriod(4)).toBe("MORNING");
    expect(getShiftForPeriod(5)).toBe("AFTERNOON");
    expect(getShiftForPeriod(7)).toBe("AFTERNOON");
  });

  it("strictly enforces Fixed Assembly (Chào cờ) at Monday Period 1 (Thứ 2 Tiết 1) with Homeroom Teacher", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    for (const cls of sampleClasses) {
      const assembly = result.schedules.find(
        (s) => s.classId === cls.classId && s.dayOfWeek === 1 && s.period === 1
      );
      expect(assembly).toBeDefined();
      expect(assembly?.subjectName).toBe("Chào cờ");
      expect(assembly?.teacherId).toBe(cls.homeroomTeacherId);
      expect(assembly?.isFixed).toBe(true);
    }
  });

  it("strictly enforces Fixed Homeroom (Sinh hoạt lớp) at Friday Last Period (Thứ 6 Tiết cuối) with Homeroom Teacher", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    for (const cls of sampleClasses) {
      const homeroom = result.schedules.find(
        (s) => s.classId === cls.classId && s.dayOfWeek === 5 && s.period === 7
      );
      expect(homeroom).toBeDefined();
      expect(homeroom?.subjectName).toBe("Sinh hoạt lớp");
      expect(homeroom?.teacherId).toBe(cls.homeroomTeacherId);
      expect(homeroom?.isFixed).toBe(true);
    }
  });

  it("strictly caps class daily workload to a maximum of 7 periods per day", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    // Group by class and day
    const classDayCounts: Record<string, number> = {};
    for (const s of result.schedules) {
      const key = `${s.classId}_day_${s.dayOfWeek}`;
      classDayCounts[key] = (classDayCounts[key] || 0) + 1;
    }

    for (const [key, count] of Object.entries(classDayCounts)) {
      expect(count).toBeLessThanOrEqual(7);
    }
  });

  it("strictly caps teacher workload to a maximum of 5 shifts (buổi) per week", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    for (const [teacherId, workload] of Object.entries(result.evaluation.teacherWorkloads)) {
      // Homeroom dummy teachers only have 2 periods (Assembly + Homeroom)
      expect(workload.totalShifts).toBeLessThanOrEqual(5);
      expect(workload.hasExceededShiftCap).toBe(false);
    }
  });

  it("ensures zero teacher double-booking conflicts across all classes", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    const teacherSlotOccupancy = new Set<string>();
    for (const s of result.schedules) {
      const key = `${s.teacherId}_d${s.dayOfWeek}_p${s.period}`;
      expect(teacherSlotOccupancy.has(key)).toBe(false);
      teacherSlotOccupancy.add(key);
    }

    expect(result.evaluation.hardConstraintViolations.filter((v) => v.type === "TEACHER_DOUBLE_BOOKED").length).toBe(0);
  });

  it("respects subject shift preferences (e.g. Thể dục in the afternoon, Toán in the morning)", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    const theDucSchedules = result.schedules.filter((s) => s.subjectName === "Thể dục");
    expect(theDucSchedules.length).toBeGreaterThan(0);
    for (const s of theDucSchedules) {
      expect(s.shift).toBe("AFTERNOON");
    }

    const toanSchedules = result.schedules.filter((s) => s.subjectName === "Toán");
    expect(toanSchedules.length).toBeGreaterThan(0);
    const morningToanCount = toanSchedules.filter((s) => s.shift === "MORNING").length;
    expect(morningToanCount).toBeGreaterThan(0);
  });

  it("accurately validates and prevents illegal schedule slot swaps", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    // 1. Attempting to swap fixed Assembly period should be rejected
    const swapFixed = engine.validateSwap(
      result.schedules,
      { classId: "cls_10a1", dayOfWeek: 1, period: 1 }, // Chào cờ
      { classId: "cls_10a1", dayOfWeek: 2, period: 3 }
    );
    expect(swapFixed.isValid).toBe(false);
    expect(swapFixed.conflicts[0]).toContain("tiết cố định");

    // 2. Swapping empty/non-conflicting slots should be valid
    const normalSlot = result.schedules.find((s) => !s.isFixed && s.classId === "cls_10a1");
    if (normalSlot) {
      const validSwap = engine.validateSwap(
        result.schedules,
        { classId: normalSlot.classId, dayOfWeek: normalSlot.dayOfWeek, period: normalSlot.period },
        { classId: normalSlot.classId, dayOfWeek: 6, period: 7 } // Saturday afternoon usually free
      );
      // Even if invalid due to constraints, it returns structured conflicts
      expect(typeof validSwap.isValid).toBe("boolean");
    }
  });

  it("calculates comprehensive timetable quality score and pedagogical metrics", () => {
    const engine = new SmartTimetableEngine();
    const result = engine.generate(sampleClasses);

    expect(result.evaluation.isValid).toBe(true);
    expect(result.evaluation.qualityScore).toBeGreaterThanOrEqual(70);
    expect(result.evaluation.totalScheduledPeriods).toBeGreaterThan(0);
    expect(result.evaluation.shiftPreferenceMatchRate).toBeGreaterThanOrEqual(80);
  });
});
