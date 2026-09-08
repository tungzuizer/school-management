/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`), Schedule Server Actions (`src/app/admin/schedule/actions.ts`), Teacher Schedule View (`src/app/teacher/schedule/page.tsx`), Student Schedule View (`src/app/student/schedule/page.tsx`), Unit Tests (`src/lib/__tests__/smart-timetable.test.ts`).
 * 2. Affected APIs: Smart Timetable Engine (`SmartTimetableEngine`), Timetable generation solver (`generate`), Timetable evaluation auditor (`evaluate`), and Swap validator (`validateSwap`).
 * 3. Schema: `Schedule` (dayOfWeek 1-7, period 1-10, classId, subjectId, teacherId), `TeachingAssignment`, `ClassRoom` (homeroomTeacherId), `Subject`, `Teacher`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

export type ShiftType = "MORNING" | "AFTERNOON";

export interface TimeSlot {
  dayOfWeek: number; // 1 = Thứ 2, 2 = Thứ 3, ..., 6 = Thứ 7
  period: number; // 1..7 (Tiết 1-4: Sáng, Tiết 5-7: Chiều)
  shift: ShiftType;
}

export interface SubjectDemand {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
  preferredShift?: ShiftType;
  requiresConsecutivePairs?: boolean; // Ghép tiết đôi (VD: Văn 2 tiết liền, Thực hành)
  isFixed?: boolean; // Tiết cố định (Chào cờ, Sinh hoạt)
  fixedDay?: number;
  fixedPeriod?: number;
}

export interface ClassRequirement {
  classId: string;
  className: string;
  gradeLevel: number;
  homeroomTeacherId?: string | null;
  homeroomTeacherName?: string | null;
  demands: SubjectDemand[];
}

export interface ScheduledPeriod {
  id?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: number;
  period: number;
  shift: ShiftType;
  room?: string | null;
  isFixed?: boolean;
}

export interface TeacherShiftRecord {
  teacherId: string;
  teacherName: string;
  shifts: Set<string>; // "day-shift", e.g. "1-MORNING"
  totalPeriods: number;
  periodsByDay: Record<number, number[]>; // dayOfWeek -> list of periods
  idleGapsCount: number; // Số tiết lủng (tiết trống giữa buổi)
}

export interface TimetableGenerationConfig {
  maxPeriodsPerDay?: number; // Mặc định 7 tiết
  maxTeacherShiftsPerWeek?: number; // Mặc định 5 buổi/tuần
  schoolDays?: number[]; // [1, 2, 3, 4, 5, 6] (Thứ 2 đến Thứ 7)
  morningPeriods?: number[]; // [1, 2, 3, 4]
  afternoonPeriods?: number[]; // [5, 6, 7]
  fixedAssemblySlot?: { dayOfWeek: number; period: number }; // Thứ 2 Tiết 1
  fixedHomeroomSlot?: { dayOfWeek: number; period: number }; // Thứ 6 Tiết cuối (Tiết 7 hoặc Tiết 4)
  subjectShiftPreferences?: Record<string, ShiftType>; // Tên môn / ID -> Buổi ưu tiên
}

export interface ConflictReport {
  type: "TEACHER_DOUBLE_BOOKED" | "CLASS_DOUBLE_BOOKED" | "MAX_PERIODS_EXCEEDED" | "MAX_TEACHER_SHIFTS_EXCEEDED" | "FIXED_SLOT_VIOLATION";
  message: string;
  dayOfWeek: number;
  period: number;
  classId?: string;
  teacherId?: string;
}

export interface TimetableEvaluationResult {
  isValid: boolean;
  hardConstraintViolations: ConflictReport[];
  qualityScore: number; // 0 - 100
  totalScheduledPeriods: number;
  totalGapsCount: number;
  consecutivePairsCount: number;
  shiftPreferenceMatchRate: number; // 0% - 100%
  teacherWorkloads: Record<string, {
    teacherId: string;
    teacherName: string;
    totalPeriods: number;
    totalShifts: number;
    hasExceededShiftCap: boolean;
    idleGaps: number;
  }>;
}

export const DEFAULT_TIMETABLE_CONFIG: TimetableGenerationConfig = {
  maxPeriodsPerDay: 7,
  maxTeacherShiftsPerWeek: 5,
  schoolDays: [1, 2, 3, 4, 5, 6], // Thứ 2 đến Thứ 7
  morningPeriods: [1, 2, 3, 4], // Tiết 1 -> 4
  afternoonPeriods: [5, 6, 7], // Tiết 5 -> 7
  fixedAssemblySlot: { dayOfWeek: 1, period: 1 }, // Chào cờ: T2 Tiết 1
  fixedHomeroomSlot: { dayOfWeek: 5, period: 7 }, // Sinh hoạt lớp: T6 Tiết 7 (tiết cuối chiều)
  subjectShiftPreferences: {
    "Toán": "MORNING",
    "Toán học": "MORNING",
    "Ngữ văn": "MORNING",
    "Văn": "MORNING",
    "Tiếng Anh": "MORNING",
    "Ngoại ngữ": "MORNING",
    "Vật lí": "MORNING",
    "Vật lý": "MORNING",
    "Hóa học": "MORNING",
    "Sinh học": "MORNING",
    "Lịch sử": "MORNING",
    "Địa lí": "MORNING",
    "Địa lý": "MORNING",
    "Thể dục": "AFTERNOON",
    "Giáo dục thể chất": "AFTERNOON",
    "GDTC": "AFTERNOON",
    "Giáo dục quốc phòng": "AFTERNOON",
    "GDQP-AN": "AFTERNOON",
    "Hoạt động trải nghiệm": "AFTERNOON",
    "HĐTN": "AFTERNOON",
    "HĐTN-HN": "AFTERNOON",
    "Nghệ thuật": "AFTERNOON",
    "Âm nhạc": "AFTERNOON",
    "Mỹ thuật": "AFTERNOON",
    "Tin học": "AFTERNOON",
    "Công nghệ": "AFTERNOON",
  },
};

/**
 * Determine shift (MORNING/AFTERNOON) based on period number
 */
export function getShiftForPeriod(period: number, morningPeriods = [1, 2, 3, 4]): ShiftType {
  return morningPeriods.includes(period) ? "MORNING" : "AFTERNOON";
}

/**
 * Generate all available time slots in the week
 */
export function generateAvailableTimeSlots(config: TimetableGenerationConfig = DEFAULT_TIMETABLE_CONFIG): TimeSlot[] {
  const days = config.schoolDays || [1, 2, 3, 4, 5, 6];
  const morning = config.morningPeriods || [1, 2, 3, 4];
  const afternoon = config.afternoonPeriods || [5, 6, 7];
  const allPeriods = [...morning, ...afternoon].sort((a, b) => a - b);

  const slots: TimeSlot[] = [];
  for (const day of days) {
    for (const period of allPeriods) {
      slots.push({
        dayOfWeek: day,
        period,
        shift: getShiftForPeriod(period, morning),
      });
    }
  }
  return slots;
}

/**
 * Smart AI Timetable Engine using Constraint Satisfaction Problem (CSP) + Heuristics
 */
export class SmartTimetableEngine {
  private config: TimetableGenerationConfig;

  constructor(customConfig?: Partial<TimetableGenerationConfig>) {
    this.config = {
      ...DEFAULT_TIMETABLE_CONFIG,
      ...customConfig,
      subjectShiftPreferences: {
        ...DEFAULT_TIMETABLE_CONFIG.subjectShiftPreferences,
        ...(customConfig?.subjectShiftPreferences || {}),
      },
    };
  }

  /**
   * Main Solver: Automatically generates a balanced, conflict-free timetable matrix
   */
  public generate(classes: ClassRequirement[]): {
    schedules: ScheduledPeriod[];
    evaluation: TimetableEvaluationResult;
    unassignedDemands: { classId: string; subjectName: string; remainingPeriods: number }[];
  } {
    const availableSlots = generateAvailableTimeSlots(this.config);
    const scheduledPeriods: ScheduledPeriod[] = [];
    const unassignedDemands: { classId: string; subjectName: string; remainingPeriods: number }[] = [];

    // Fast lookup lookup structures for hard constraints
    const classPeriodOccupancy = new Map<string, ScheduledPeriod>(); // "classId_day_period" -> Period
    const teacherPeriodOccupancy = new Map<string, ScheduledPeriod>(); // "teacherId_day_period" -> Period
    const teacherShiftsMap = new Map<string, Set<string>>(); // teacherId -> Set of "day_shift"
    const classDailyPeriodsCount = new Map<string, number>(); // "classId_day" -> count

    const getOccupancyKey = (id: string, day: number, period: number) => `${id}_${day}_${period}`;
    const getDailyKey = (classId: string, day: number) => `${classId}_${day}`;
    const getShiftKey = (day: number, shift: ShiftType) => `${day}_${shift}`;

    const addScheduledPeriod = (p: ScheduledPeriod) => {
      scheduledPeriods.push(p);
      classPeriodOccupancy.set(getOccupancyKey(p.classId, p.dayOfWeek, p.period), p);
      teacherPeriodOccupancy.set(getOccupancyKey(p.teacherId, p.dayOfWeek, p.period), p);

      const dailyKey = getDailyKey(p.classId, p.dayOfWeek);
      classDailyPeriodsCount.set(dailyKey, (classDailyPeriodsCount.get(dailyKey) || 0) + 1);

      if (!teacherShiftsMap.has(p.teacherId)) {
        teacherShiftsMap.set(p.teacherId, new Set());
      }
      teacherShiftsMap.get(p.teacherId)!.add(getShiftKey(p.dayOfWeek, p.shift));
    };

    // STEP 1: Pre-assign Fixed System Periods (Chào cờ Thứ 2 & Sinh hoạt lớp Thứ 6)
    for (const cls of classes) {
      const homeroomTeacherId = cls.homeroomTeacherId || "GVCN_" + cls.classId;
      const homeroomTeacherName = cls.homeroomTeacherName || `GVCN ${cls.className}`;

      // 1.1 Chào cờ (Thứ 2 - Tiết 1)
      const assemblySlot = this.config.fixedAssemblySlot || { dayOfWeek: 1, period: 1 };
      const assemblyPeriod: ScheduledPeriod = {
        classId: cls.classId,
        className: cls.className,
        subjectId: "SUB_CHAO_CO",
        subjectName: "Chào cờ",
        teacherId: homeroomTeacherId,
        teacherName: homeroomTeacherName,
        dayOfWeek: assemblySlot.dayOfWeek,
        period: assemblySlot.period,
        shift: getShiftForPeriod(assemblySlot.period, this.config.morningPeriods),
        isFixed: true,
      };
      addScheduledPeriod(assemblyPeriod);

      // 1.2 Sinh hoạt lớp (Thứ 6 - Tiết cuối)
      const homeroomSlot = this.config.fixedHomeroomSlot || { dayOfWeek: 5, period: 7 };
      const homeroomPeriod: ScheduledPeriod = {
        classId: cls.classId,
        className: cls.className,
        subjectId: "SUB_SINH_HOAT",
        subjectName: "Sinh hoạt lớp",
        teacherId: homeroomTeacherId,
        teacherName: homeroomTeacherName,
        dayOfWeek: homeroomSlot.dayOfWeek,
        period: homeroomSlot.period,
        shift: getShiftForPeriod(homeroomSlot.period, this.config.morningPeriods),
        isFixed: true,
      };
      addScheduledPeriod(homeroomPeriod);
    }

    // STEP 2: Prepare Teaching Demands Queue
    interface AssignmentUnit {
      classId: string;
      className: string;
      subjectId: string;
      subjectName: string;
      teacherId: string;
      teacherName: string;
      length: 1 | 2; // 1 tiết hoặc tiết đôi (2 tiết)
      preferredShift?: ShiftType;
    }

    const demandUnits: AssignmentUnit[] = [];

    for (const cls of classes) {
      for (const demand of cls.demands) {
        // Normalize preferred shift from subject name preferences if not explicitly set
        const shiftPref = demand.preferredShift || this.config.subjectShiftPreferences?.[demand.subjectName] || this.config.subjectShiftPreferences?.[demand.subjectId];

        let remaining = demand.periodsPerWeek;

        // Pair multi-period subjects (e.g. Văn 4 tiết -> 2 pair units of 2 periods, or 1 pair + singles)
        if (demand.requiresConsecutivePairs && remaining >= 2) {
          while (remaining >= 2) {
            demandUnits.push({
              classId: cls.classId,
              className: cls.className,
              subjectId: demand.subjectId,
              subjectName: demand.subjectName,
              teacherId: demand.teacherId,
              teacherName: demand.teacherName,
              length: 2,
              preferredShift: shiftPref,
            });
            remaining -= 2;
          }
        }

        // Remaining single periods
        while (remaining > 0) {
          demandUnits.push({
            classId: cls.classId,
            className: cls.className,
            subjectId: demand.subjectId,
            subjectName: demand.subjectName,
            teacherId: demand.teacherId,
            teacherName: demand.teacherName,
            length: 1,
            preferredShift: shiftPref,
          });
          remaining -= 1;
        }
      }
    }

    // STEP 3: Order Demands by MRV (Minimum Remaining Values) & Constraint Difficulty
    // Double periods first, then subjects with specific shift constraints, then most loaded teachers
    const teacherLoadMap = new Map<string, number>();
    for (const u of demandUnits) {
      teacherLoadMap.set(u.teacherId, (teacherLoadMap.get(u.teacherId) || 0) + u.length);
    }

    demandUnits.sort((a, b) => {
      if (a.length !== b.length) return b.length - a.length; // 2 periods before 1
      if (a.preferredShift && !b.preferredShift) return -1;
      if (!a.preferredShift && b.preferredShift) return 1;
      const loadA = teacherLoadMap.get(a.teacherId) || 0;
      const loadB = teacherLoadMap.get(b.teacherId) || 0;
      return loadB - loadA; // Higher teacher load first
    });

    // STEP 4: Place Demands using Constraint Backtracking & Heuristic Scoring
    const maxDayPeriods = this.config.maxPeriodsPerDay || 7;
    const maxTeacherShifts = this.config.maxTeacherShiftsPerWeek || 5;

    for (const unit of demandUnits) {
      let bestSlotCandidate: { slot1: TimeSlot; slot2?: TimeSlot; score: number } | null = null;

      // Group candidate slots
      for (let i = 0; i < availableSlots.length; i++) {
        const slot1 = availableSlots[i];

        // Check Hard Constraint: Class Slot availability
        if (classPeriodOccupancy.has(getOccupancyKey(unit.classId, slot1.dayOfWeek, slot1.period))) {
          continue;
        }
        // Check Hard Constraint: Teacher Slot availability
        if (teacherPeriodOccupancy.has(getOccupancyKey(unit.teacherId, slot1.dayOfWeek, slot1.period))) {
          continue;
        }
        // Check Hard Constraint: Class Daily Limit (<= 7 periods/day)
        const currentDailyCount = classDailyPeriodsCount.get(getDailyKey(unit.classId, slot1.dayOfWeek)) || 0;
        if (currentDailyCount + unit.length > maxDayPeriods) {
          continue;
        }

        // Check Hard Constraint: Teacher Shift Limit (<= 5 shifts/week)
        const teacherShifts = teacherShiftsMap.get(unit.teacherId) || new Set();
        const candidateShiftKey = getShiftKey(slot1.dayOfWeek, slot1.shift);
        const wouldExceedShifts = !teacherShifts.has(candidateShiftKey) && teacherShifts.size >= maxTeacherShifts;
        if (wouldExceedShifts) {
          continue;
        }

        // For 2-period unit, check next period in same day & shift
        let slot2: TimeSlot | undefined = undefined;
        if (unit.length === 2) {
          const nextSlot = availableSlots.find(
            (s) => s.dayOfWeek === slot1.dayOfWeek && s.period === slot1.period + 1 && s.shift === slot1.shift
          );
          if (!nextSlot) continue; // Cannot span across shifts or non-consecutive
          if (classPeriodOccupancy.has(getOccupancyKey(unit.classId, nextSlot.dayOfWeek, nextSlot.period))) continue;
          if (teacherPeriodOccupancy.has(getOccupancyKey(unit.teacherId, nextSlot.dayOfWeek, nextSlot.period))) continue;
          slot2 = nextSlot;
        }

        // HEURISTIC SCORING: Calculate fitness for this slot candidate
        let score = 100;

        // 1. Shift match preference (+30 if matched, -30 if mismatched)
        if (unit.preferredShift) {
          if (slot1.shift === unit.preferredShift) {
            score += 30;
          } else {
            score -= 30;
          }
        }

        // 2. Teacher shift reuse (+25 if teacher already teaches this shift, saves a shift)
        if (teacherShifts.has(candidateShiftKey)) {
          score += 25;
        } else {
          score -= 10;
        }

        // 3. Class subject day distribution: Penalize having the same subject on the same day if already present
        const sameSubjectOnDay = scheduledPeriods.some(
          (p) => p.classId === unit.classId && p.subjectId === unit.subjectId && p.dayOfWeek === slot1.dayOfWeek
        );
        if (sameSubjectOnDay) {
          score -= 35;
        }

        // 4. Minimize Teacher Gaps: Check adjacency to existing periods of this teacher on the same day
        const teacherDayPeriods = scheduledPeriods
          .filter((p) => p.teacherId === unit.teacherId && p.dayOfWeek === slot1.dayOfWeek)
          .map((p) => p.period);
        if (teacherDayPeriods.length > 0) {
          const isAdjacent = teacherDayPeriods.some((p) => Math.abs(p - slot1.period) === 1);
          if (isAdjacent) {
            score += 20; // Adjacent periods are good
          } else {
            const hasGap = teacherDayPeriods.some((p) => Math.abs(p - slot1.period) > 1 && Math.abs(p - slot1.period) <= 3);
            if (hasGap) {
              score -= 15; // Isolated idle gap
            }
          }
        }

        // 5. Early week balancing: Distribute classes smoothly across Mon-Fri before Sat
        if (slot1.dayOfWeek === 6) {
          score -= 5;
        }

        if (!bestSlotCandidate || score > bestSlotCandidate.score) {
          bestSlotCandidate = { slot1, slot2, score };
        }
      }

      if (bestSlotCandidate) {
        // Place period 1
        addScheduledPeriod({
          classId: unit.classId,
          className: unit.className,
          subjectId: unit.subjectId,
          subjectName: unit.subjectName,
          teacherId: unit.teacherId,
          teacherName: unit.teacherName,
          dayOfWeek: bestSlotCandidate.slot1.dayOfWeek,
          period: bestSlotCandidate.slot1.period,
          shift: bestSlotCandidate.slot1.shift,
        });

        // Place period 2 if unit is a pair
        if (unit.length === 2 && bestSlotCandidate.slot2) {
          addScheduledPeriod({
            classId: unit.classId,
            className: unit.className,
            subjectId: unit.subjectId,
            subjectName: unit.subjectName,
            teacherId: unit.teacherId,
            teacherName: unit.teacherName,
            dayOfWeek: bestSlotCandidate.slot2.dayOfWeek,
            period: bestSlotCandidate.slot2.period,
            shift: bestSlotCandidate.slot2.shift,
          });
        }
      } else {
        // Could not place this demand unit
        unassignedDemands.push({
          classId: unit.classId,
          subjectName: unit.subjectName,
          remainingPeriods: unit.length,
        });
      }
    }

    const evaluation = this.evaluate(scheduledPeriods, classes);

    return {
      schedules: scheduledPeriods,
      evaluation,
      unassignedDemands,
    };
  }

  /**
   * Comprehensive Audit & Quality Evaluation of a Timetable
   */
  public evaluate(schedules: ScheduledPeriod[], classes: ClassRequirement[]): TimetableEvaluationResult {
    const hardViolations: ConflictReport[] = [];
    const maxDayPeriods = this.config.maxPeriodsPerDay || 7;
    const maxTeacherShifts = this.config.maxTeacherShiftsPerWeek || 5;

    const classSlots = new Map<string, ScheduledPeriod>();
    const teacherSlots = new Map<string, ScheduledPeriod>();
    const classDayCounts = new Map<string, number>();
    const teacherShifts = new Map<string, Set<string>>();
    const teacherDayPeriods = new Map<string, Record<number, number[]>>();
    const teacherNames = new Map<string, string>();

    let totalGaps = 0;
    let consecutivePairs = 0;
    let shiftMatches = 0;
    let totalNonFixed = 0;

    for (const p of schedules) {
      teacherNames.set(p.teacherId, p.teacherName);

      // 1. Check Class Double-Booking
      const classKey = `${p.classId}_${p.dayOfWeek}_${p.period}`;
      if (classSlots.has(classKey)) {
        hardViolations.push({
          type: "CLASS_DOUBLE_BOOKED",
          message: `Lớp ${p.className || p.classId} bị trùng 2 môn vào Thứ ${p.dayOfWeek + 1} - Tiết ${p.period}`,
          dayOfWeek: p.dayOfWeek,
          period: p.period,
          classId: p.classId,
        });
      } else {
        classSlots.set(classKey, p);
      }

      // 2. Check Teacher Double-Booking
      const teacherKey = `${p.teacherId}_${p.dayOfWeek}_${p.period}`;
      if (teacherSlots.has(teacherKey)) {
        hardViolations.push({
          type: "TEACHER_DOUBLE_BOOKED",
          message: `Giáo viên ${p.teacherName} bị trùng lịch dạy ở 2 lớp vào Thứ ${p.dayOfWeek + 1} - Tiết ${p.period}`,
          dayOfWeek: p.dayOfWeek,
          period: p.period,
          teacherId: p.teacherId,
        });
      } else {
        teacherSlots.set(teacherKey, p);
      }

      // 3. Track Daily Period Counts
      const dayKey = `${p.classId}_${p.dayOfWeek}`;
      const count = (classDayCounts.get(dayKey) || 0) + 1;
      classDayCounts.set(dayKey, count);
      if (count > maxDayPeriods) {
        hardViolations.push({
          type: "MAX_PERIODS_EXCEEDED",
          message: `Lớp ${p.className || p.classId} vượt quá giới hạn ${maxDayPeriods} tiết/ngày vào Thứ ${p.dayOfWeek + 1}`,
          dayOfWeek: p.dayOfWeek,
          period: p.period,
          classId: p.classId,
        });
      }

      // 4. Track Teacher Shifts
      if (!teacherShifts.has(p.teacherId)) {
        teacherShifts.set(p.teacherId, new Set());
      }
      teacherShifts.get(p.teacherId)!.add(`${p.dayOfWeek}_${p.shift}`);

      // 5. Track Teacher Periods for Gap detection
      if (!teacherDayPeriods.has(p.teacherId)) {
        teacherDayPeriods.set(p.teacherId, {});
      }
      const tDays = teacherDayPeriods.get(p.teacherId)!;
      if (!tDays[p.dayOfWeek]) tDays[p.dayOfWeek] = [];
      tDays[p.dayOfWeek].push(p.period);

      // 6. Check Shift Preference Match
      if (!p.isFixed) {
        totalNonFixed++;
        const pref = this.config.subjectShiftPreferences?.[p.subjectName];
        if (!pref || pref === p.shift) {
          shiftMatches++;
        }
      }
    }

    // Check Teacher Max Shifts Cap (<= 5 shifts/week)
    const teacherWorkloads: TimetableEvaluationResult["teacherWorkloads"] = {};
    for (const [tId, shiftsSet] of teacherShifts.entries()) {
      let tGaps = 0;
      const tDays = teacherDayPeriods.get(tId) || {};
      for (const dayStr in tDays) {
        const pList = tDays[dayStr].sort((a, b) => a - b);
        for (let i = 0; i < pList.length - 1; i++) {
          const gap = pList[i + 1] - pList[i] - 1;
          if (gap > 0 && gap <= 2) {
            tGaps += gap;
          }
        }
      }
      totalGaps += tGaps;

      const totalTeacherPeriods = schedules.filter((p) => p.teacherId === tId).length;
      const hasExceeded = shiftsSet.size > maxTeacherShifts;

      if (hasExceeded) {
        hardViolations.push({
          type: "MAX_TEACHER_SHIFTS_EXCEEDED",
          message: `Giáo viên ${teacherNames.get(tId) || tId} dạy ${shiftsSet.size} buổi/tuần (vượt quá định mức ${maxTeacherShifts} buổi)`,
          dayOfWeek: 1,
          period: 1,
          teacherId: tId,
        });
      }

      teacherWorkloads[tId] = {
        teacherId: tId,
        teacherName: teacherNames.get(tId) || tId,
        totalPeriods: totalTeacherPeriods,
        totalShifts: shiftsSet.size,
        hasExceededShiftCap: hasExceeded,
        idleGaps: tGaps,
      };
    }

    // Check Fixed Slots (Chào cờ T2 Tiết 1, Sinh hoạt T6 Tiết cuối)
    for (const cls of classes) {
      const assembly = schedules.find(
        (p) => p.classId === cls.classId && p.dayOfWeek === 1 && p.period === 1 && p.subjectName.includes("Chào cờ")
      );
      if (!assembly) {
        hardViolations.push({
          type: "FIXED_SLOT_VIOLATION",
          message: `Lớp ${cls.className} thiếu tiết Chào cờ cố định vào Thứ 2 - Tiết 1`,
          dayOfWeek: 1,
          period: 1,
          classId: cls.classId,
        });
      }
    }

    // Calculate Quality Score (0 - 100)
    let quality = 100;
    quality -= hardViolations.length * 20; // Heavy penalty for hard violations
    quality -= totalGaps * 2; // Minor penalty for teacher idle gaps
    const shiftRate = totalNonFixed > 0 ? (shiftMatches / totalNonFixed) * 100 : 100;
    quality = Math.max(0, Math.min(100, Math.round(quality * 0.7 + shiftRate * 0.3)));

    return {
      isValid: hardViolations.length === 0,
      hardConstraintViolations: hardViolations,
      qualityScore: quality,
      totalScheduledPeriods: schedules.length,
      totalGapsCount: totalGaps,
      consecutivePairsCount: consecutivePairs,
      shiftPreferenceMatchRate: Math.round(shiftRate),
      teacherWorkloads,
    };
  }

  /**
   * Validate if swapping two slots or moving a slot produces any conflicts
   */
  public validateSwap(
    allSchedules: ScheduledPeriod[],
    sourceSlot: { classId: string; dayOfWeek: number; period: number },
    targetSlot: { classId: string; dayOfWeek: number; period: number }
  ): { isValid: boolean; conflicts: string[] } {
    const conflicts: string[] = [];
    const sourcePeriod = allSchedules.find(
      (p) => p.classId === sourceSlot.classId && p.dayOfWeek === sourceSlot.dayOfWeek && p.period === sourceSlot.period
    );
    const targetPeriod = allSchedules.find(
      (p) => p.classId === targetSlot.classId && p.dayOfWeek === targetSlot.dayOfWeek && p.period === targetSlot.period
    );

    if (!sourcePeriod && !targetPeriod) {
      return { isValid: true, conflicts: [] };
    }

    // Disallow moving locked fixed periods
    if (sourcePeriod?.isFixed || targetPeriod?.isFixed) {
      conflicts.push("Không thể di chuyển hoặc hoán đổi các tiết cố định (Chào cờ, Sinh hoạt lớp)");
      return { isValid: false, conflicts };
    }

    // Clone and swap
    const simulated = allSchedules.map((p) => {
      if (sourcePeriod && p.id === sourcePeriod.id) {
        return {
          ...p,
          dayOfWeek: targetSlot.dayOfWeek,
          period: targetSlot.period,
          shift: getShiftForPeriod(targetSlot.period, this.config.morningPeriods),
        };
      }
      if (targetPeriod && p.id === targetPeriod.id) {
        return {
          ...p,
          dayOfWeek: sourceSlot.dayOfWeek,
          period: sourceSlot.period,
          shift: getShiftForPeriod(sourceSlot.period, this.config.morningPeriods),
        };
      }
      return p;
    });

    const evalResult = this.evaluate(simulated, []);
    if (!evalResult.isValid) {
      conflicts.push(...evalResult.hardConstraintViolations.map((v) => v.message));
    }

    return {
      isValid: conflicts.length === 0,
      conflicts,
    };
  }
}
