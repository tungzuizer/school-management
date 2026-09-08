/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Timetable Dashboard (`src/app/admin/schedule/page.tsx`), Timetable Components (`TimetableMatrixView.tsx`, `AiScheduleModal.tsx`, `ScheduleSwapModal.tsx`, `TeacherWorkloadDrawer.tsx`), Teacher & Student Schedule Views.
 * 2. Affected APIs: `generateAiTimetableAction`, `validateScheduleSwapAction`, `swapScheduleSlotsAction`, `getTeacherWorkloadStatsAction`, `getTimetableMatrixAction`, `getScheduleData`, `getScheduleFormData`, `createScheduleEntry`, `updateScheduleEntry`, `deleteScheduleEntry`, `clearClassSchedule`, `bulkImportSchedules`.
 * 3. Schema: `Schedule` (classId, subjectId, teacherId, dayOfWeek, period, room), `TeachingAssignment`, `ClassRoom` (homeroomTeacherId), `Subject`, `Teacher`.
 * 4. Verbatim User Instruction: "thêm chức năng thời khóa biểu thông minh Các tiết Chào cờ sinh hoạt phải đc cố định vào thứ 2 và thứ 6. Các môn có thể được cố định buổi dạy. Và gv chỉ dạy 5 buổi/ tuần không bị trùng nhau. 1 ngày chỉ đc 7 tiết và phải thông minh và hỗ trợ ban giám hiệu lập thời khóa biểu".
 */

"use server";

import { prisma } from "@/lib/prisma";
import { ParsedScheduleRow } from "@/lib/excel-parser";
import { revalidatePath } from "next/cache";
import {
  SmartTimetableEngine,
  ClassRequirement,
  SubjectDemand,
  ScheduledPeriod,
  TimetableEvaluationResult,
  TimetableGenerationConfig,
  DEFAULT_TIMETABLE_CONFIG,
  getShiftForPeriod,
} from "@/lib/smart-timetable-engine";

function revalidateSchedulePaths() {
  revalidatePath("/admin/schedule");
  revalidatePath("/teacher/schedule");
  revalidatePath("/teacher/attendance");
  revalidatePath("/student/schedule");
}

/**
 * Normalizes string for fuzzy matching (lowercased, stripped accents and symbols)
 */
function normalizeStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export interface ScheduleDayHeader {
  dayOfWeek: number;
  label: string;
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
}

function parseLocalDate(dateStr?: string): Date {
  if (!dateStr) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
}

function formatDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekDays(dateStr?: string) {
  const baseDate = parseLocalDate(dateStr);
  const todayStr = formatDateStr(new Date());

  const jsDay = baseDate.getDay();
  const diffToMon = jsDay === 0 ? 6 : jsDay - 1;

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - diffToMon);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const dayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

  const days: ScheduleDayHeader[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = formatDateStr(d);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    days.push({
      dayOfWeek: i + 1,
      label: dayLabels[i],
      dateStr: dStr,
      formattedDate: `${dd}/${mm}`,
      isToday: dStr === todayStr,
    });
  }

  return { monday, sunday, days, selectedDateStr: formatDateStr(baseDate) };
}

export async function getScheduleData(classId?: string, schoolId?: string, dateStr?: string) {
  const { days, selectedDateStr } = getWeekDays(dateStr);

  const schools = await prisma.school.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const classWhere = schoolId ? { schoolId } : {};

  const classes = await prisma.classRoom.findMany({
    where: classWhere,
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      school: { select: { id: true, name: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });

  // Default to first class if not specified or invalid
  if (!classId && classes.length > 0) {
    classId = classes[0].id;
  } else if (classId && classes.length > 0 && !classes.some((c) => c.id === classId)) {
    classId = classes[0].id;
  }

  const selectedClass = classes.find((c) => c.id === classId);

  const schedules = classId
    ? await prisma.schedule.findMany({
        where: { classId },
        include: {
          subject: { select: { id: true, name: true } },
          teacher: {
            select: {
              id: true,
              specialty: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          classRoom: {
            select: { id: true, name: true, gradeLevel: true },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      })
    : [];

  // Summary statistics for this classroom schedule
  const uniqueTeachersCount = new Set(schedules.map((s) => s.teacherId)).size;

  return {
    schools,
    classes,
    selectedClass,
    schedules,
    selectedClassId: classId || "",
    selectedDateStr,
    days,
    stats: {
      totalPeriods: schedules.length,
      teacherCount: uniqueTeachersCount,
    },
  };
}

export async function getScheduleFormData(schoolId?: string) {
  const [subjects, teachers] = await Promise.all([
    prisma.subject.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      where: schoolId
        ? {
            user: { schoolId },
          }
        : undefined,
      select: {
        id: true,
        specialty: true,
        user: { select: { id: true, name: true, email: true } },
        homeroomClasses: { select: { school: { select: { id: true, name: true } } } },
        teachingAssignments: {
          select: {
            subjectId: true,
            classRoom: { select: { school: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return { subjects, teachers };
}

export async function createScheduleEntry(data: {
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
  room?: string;
}) {
  // Check for class conflict (same class, same day, same period)
  const existing = await prisma.schedule.findFirst({
    where: {
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
    },
  });

  if (existing) {
    // Update existing entry if it's the same slot
    await prisma.schedule.update({
      where: { id: existing.id },
      data: {
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        room: data.room || null,
      },
    });
    return { success: true, updated: true };
  }

  // Verify teacher belongs to the same school as the target class
  const targetClass = await prisma.classRoom.findUnique({
    where: { id: data.classId },
    select: { schoolId: true, name: true },
  });
  const teacher = await prisma.teacher.findUnique({
    where: { id: data.teacherId },
    include: { user: { select: { schoolId: true, name: true } } },
  });

  if (targetClass && teacher?.user?.schoolId && teacher.user.schoolId !== targetClass.schoolId) {
    return {
      error: `Giáo viên ${teacher.user.name} thuộc trường khác, không thể phân công dạy ở lớp ${targetClass.name}.`,
    };
  }

  // Check teacher conflict (same teacher, same day, same period in another class)
  const teacherConflict = await prisma.schedule.findFirst({
    where: {
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
    },
    include: {
      classRoom: { select: { name: true } },
    },
  });

  if (teacherConflict) {
    return {
      error: `Giáo viên đã có lịch dạy ở lớp ${teacherConflict.classRoom.name} vào Thứ ${
        data.dayOfWeek === 7 ? "Chủ Nhật" : data.dayOfWeek + 1
      } - Tiết ${data.period}`,
    };
  }

  await prisma.schedule.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
      room: data.room || null,
    },
  });

  revalidateSchedulePaths();
  return { success: true };
}

export async function updateScheduleEntry(
  id: string,
  data: {
    subjectId: string;
    teacherId: string;
    room?: string;
  }
) {
  const current = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!current) {
    return { error: "Không tìm thấy tiết học cần cập nhật" };
  }

  // Verify teacher belongs to the same school as the target class
  const targetClass = await prisma.classRoom.findUnique({
    where: { id: current.classId },
    select: { schoolId: true, name: true },
  });
  const teacher = await prisma.teacher.findUnique({
    where: { id: data.teacherId },
    include: { user: { select: { schoolId: true, name: true } } },
  });

  if (targetClass && teacher?.user?.schoolId && teacher.user.schoolId !== targetClass.schoolId) {
    return {
      error: `Giáo viên ${teacher.user.name} thuộc trường khác, không thể phân công dạy ở lớp ${targetClass.name}.`,
    };
  }

  // Check teacher conflict
  const teacherConflict = await prisma.schedule.findFirst({
    where: {
      id: { not: id },
      teacherId: data.teacherId,
      dayOfWeek: current.dayOfWeek,
      period: current.period,
    },
    include: {
      classRoom: { select: { name: true } },
    },
  });

  if (teacherConflict) {
    return {
      error: `Giáo viên đã có lịch dạy ở lớp ${teacherConflict.classRoom.name} vào thời gian này.`,
    };
  }

  await prisma.schedule.update({
    where: { id },
    data: {
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      room: data.room || null,
    },
  });

  revalidateSchedulePaths();
  return { success: true };
}

export async function deleteScheduleEntry(id: string) {
  await prisma.schedule.delete({ where: { id } });
  revalidateSchedulePaths();
  return { success: true };
}

export async function clearClassSchedule(classId: string) {
  await prisma.schedule.deleteMany({
    where: { classId },
  });
  revalidateSchedulePaths();
  return { success: true };
}

/**
 * Bulk imports schedule rows (from Excel or Google Drive)
 */
export async function bulkImportSchedules(
  dataList: ParsedScheduleRow[],
  fallbackClassId?: string
) {
  const [classes, subjects, teachers] = await Promise.all([
    prisma.classRoom.findMany({ select: { id: true, name: true } }),
    prisma.subject.findMany({ select: { id: true, name: true } }),
    prisma.teacher.findMany({
      select: {
        id: true,
        specialty: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  let importedCount = 0;
  const errors: string[] = [];

  for (let idx = 0; idx < dataList.length; idx++) {
    const row = dataList[idx];
    if (!row.isValid) continue;

    // 1. Resolve Class
    let targetClassId = fallbackClassId;
    if (row.className) {
      const normClassName = normalizeStr(row.className);
      const matchedClass = classes.find(
        (c) => normalizeStr(c.name) === normClassName
      );
      if (matchedClass) {
        targetClassId = matchedClass.id;
      }
    }

    if (!targetClassId) {
      errors.push(`Dòng ${idx + 1}: Không tìm thấy lớp "${row.className || "Mặc định"}" trong hệ thống.`);
      continue;
    }

    // 2. Resolve Subject
    const normSubj = normalizeStr(row.subjectName);
    const matchedSubject = subjects.find(
      (s) =>
        normalizeStr(s.name) === normSubj ||
        normalizeStr(s.name).includes(normSubj) ||
        normSubj.includes(normalizeStr(s.name))
    );

    if (!matchedSubject) {
      errors.push(`Dòng ${idx + 1}: Không tìm thấy môn học "${row.subjectName}".`);
      continue;
    }

    // 3. Resolve Teacher
    const normTeacher = normalizeStr(row.teacherName);
    const matchedTeacher = teachers.find(
      (t) =>
        normalizeStr(t.user.name) === normTeacher ||
        (t.user.email && normalizeStr(t.user.email) === normTeacher) ||
        normalizeStr(t.user.name).includes(normTeacher) ||
        normTeacher.includes(normalizeStr(t.user.name))
    );

    if (!matchedTeacher) {
      errors.push(`Dòng ${idx + 1}: Không tìm thấy giáo viên "${row.teacherName}".`);
      continue;
    }

    // 4. Create or Upsert Schedule Entry
    try {
      await prisma.schedule.upsert({
        where: {
          classId_dayOfWeek_period: {
            classId: targetClassId,
            dayOfWeek: row.dayOfWeek,
            period: row.period,
          },
        },
        create: {
          classId: targetClassId,
          dayOfWeek: row.dayOfWeek,
          period: row.period,
          subjectId: matchedSubject.id,
          teacherId: matchedTeacher.id,
          room: row.room || null,
        },
        update: {
          subjectId: matchedSubject.id,
          teacherId: matchedTeacher.id,
          room: row.room || null,
        },
      });

      importedCount++;
    } catch (err: any) {
      errors.push(`Dòng ${idx + 1}: Lỗi khi lưu vào cơ sở dữ liệu - ${err.message}`);
    }
  }

  revalidateSchedulePaths();
  return {
    success: true,
    importedCount,
    totalCount: dataList.length,
    errors,
  };
}

/**
 * ============================================================================
 * SMART AI TIMETABLE SCHEDULER & BGH ASSISTANT ACTIONS
 * ============================================================================
 */

export interface AiGenerateOptions {
  schoolId?: string;
  gradeLevel?: number;
  config?: Partial<TimetableGenerationConfig>;
}

/**
 * Generates automated smart schedule using CSP Solver with strict pedagogical constraints:
 * - Chào cờ: Mon P1 (GVCN)
 * - Sinh hoạt lớp: Fri Last Period (GVCN)
 * - Max 7 periods/day for each class
 * - Max 5 shifts/week for each teacher
 * - Zero teacher overlap
 * - Fixed/Preferred subject shifts (Toán/Văn sáng, Thể dục/GDQP chiều)
 */
export async function generateAiTimetableAction(options?: AiGenerateOptions) {
  try {
    const classWhere: any = {};
    if (options?.schoolId && options.schoolId !== "ALL") {
      classWhere.schoolId = options.schoolId;
    }
    if (options?.gradeLevel) {
      classWhere.gradeLevel = options.gradeLevel;
    }

    const classes = await prisma.classRoom.findMany({
      where: classWhere,
      include: {
        school: { select: { id: true, name: true } },
        homeroomTeacher: { include: { user: { select: { id: true, name: true } } } },
        teachingAssignments: {
          include: {
            subject: { select: { id: true, name: true, gradeLevel: true } },
            teacher: { include: { user: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    if (classes.length === 0) {
      return { error: "Không tìm thấy lớp học nào phù hợp với bộ lọc để xếp thời khóa biểu." };
    }

    // Fetch school subjects and teachers for fallback assignment
    const [allSubjects, allTeachers] = await Promise.all([
      prisma.subject.findMany({
        where: options?.schoolId && options.schoolId !== "ALL" ? { subjectGroup: { schoolId: options.schoolId } } : {},
        select: { id: true, name: true, gradeLevel: true },
      }),
      prisma.teacher.findMany({
        where: options?.schoolId && options.schoolId !== "ALL" ? { user: { schoolId: options.schoolId } } : {},
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const fallbackTeacher = allTeachers[0] || null;
    if (!fallbackTeacher && classes.every((c) => !c.homeroomTeacher && c.teachingAssignments.length === 0)) {
      return { error: "Chưa có dữ liệu giáo viên trong hệ thống để thực hiện phân công xếp TKB." };
    }

    // Standard subject curriculum template
    const standardSubjectConfigs: { name: string; periods: number; requiresConsecutive?: boolean; preferredShift?: "MORNING" | "AFTERNOON" }[] = [
      { name: "Toán", periods: 4, requiresConsecutive: true, preferredShift: "MORNING" },
      { name: "Ngữ văn", periods: 4, requiresConsecutive: true, preferredShift: "MORNING" },
      { name: "Tiếng Anh", periods: 3, preferredShift: "MORNING" },
      { name: "Vật lí", periods: 2, preferredShift: "MORNING" },
      { name: "Hóa học", periods: 2, preferredShift: "MORNING" },
      { name: "Sinh học", periods: 2, preferredShift: "MORNING" },
      { name: "Lịch sử", periods: 2 },
      { name: "Địa lí", periods: 2 },
      { name: "Tin học", periods: 2 },
      { name: "Giáo dục kinh tế và pháp luật", periods: 1 },
      { name: "Thể dục", periods: 2, preferredShift: "AFTERNOON" },
      { name: "GDQP-AN", periods: 1, preferredShift: "AFTERNOON" },
      { name: "Hoạt động trải nghiệm, hướng nghiệp", periods: 2, preferredShift: "AFTERNOON" },
      { name: "Công nghệ", periods: 1 },
    ];

    // Build ClassRequirement list
    const classRequirements: ClassRequirement[] = [];

    for (let cIdx = 0; cIdx < classes.length; cIdx++) {
      const cls = classes[cIdx];
      const homeroomTeacher = cls.homeroomTeacher || fallbackTeacher;

      const demands: SubjectDemand[] = [];
      const assignedSubjectIds = new Set<string>();

      // 1. Convert actual teaching assignments if present
      for (const ta of cls.teachingAssignments) {
        if (!ta.subject || !ta.teacher) continue;
        const normSubjName = ta.subject.name;
        const stdConfig = standardSubjectConfigs.find((s) => normalizeStr(s.name) === normalizeStr(normSubjName));
        const periods = stdConfig ? stdConfig.periods : 2;

        demands.push({
          subjectId: ta.subject.id,
          subjectName: ta.subject.name,
          teacherId: ta.teacher.id,
          teacherName: ta.teacher.user.name,
          periodsPerWeek: periods,
          requiresConsecutivePairs: stdConfig?.requiresConsecutive,
          preferredShift: stdConfig?.preferredShift,
        });
        assignedSubjectIds.add(ta.subject.id);
      }

      // 2. If assignments are fewer than 5 subjects, fill in standard curriculum subjects
      if (demands.length < 5) {
        for (let sIdx = 0; sIdx < standardSubjectConfigs.length; sIdx++) {
          const std = standardSubjectConfigs[sIdx];
          const matchedSubject = allSubjects.find(
            (s) => normalizeStr(s.name) === normalizeStr(std.name) || normalizeStr(s.name).includes(normalizeStr(std.name))
          );

          if (matchedSubject && !assignedSubjectIds.has(matchedSubject.id)) {
            // Find teacher with matching specialty or round-robin
            const matchedTeacher =
              allTeachers.find((t) => t.specialty && normalizeStr(t.specialty).includes(normalizeStr(std.name))) ||
              allTeachers[(cIdx + sIdx) % allTeachers.length] ||
              fallbackTeacher;

            if (matchedTeacher) {
              demands.push({
                subjectId: matchedSubject.id,
                subjectName: matchedSubject.name,
                teacherId: matchedTeacher.id,
                teacherName: matchedTeacher.user.name,
                periodsPerWeek: std.periods,
                requiresConsecutivePairs: std.requiresConsecutive,
                preferredShift: std.preferredShift,
              });
              assignedSubjectIds.add(matchedSubject.id);
            }
          }
        }
      }

      classRequirements.push({
        classId: cls.id,
        className: cls.name,
        gradeLevel: cls.gradeLevel,
        homeroomTeacherId: homeroomTeacher?.id || null,
        homeroomTeacherName: homeroomTeacher?.user.name || "GVCN",
        demands,
      });
    }

    // Run Smart Timetable CSP Engine
    const engine = new SmartTimetableEngine(options?.config);
    const result = engine.generate(classRequirements);

    // Save generated schedules into database inside an atomic transaction
    const targetClassIds = classes.map((c) => c.id);

    await prisma.$transaction(
      async (tx) => {
        // Delete previous schedules for these classes
        await tx.schedule.deleteMany({
          where: { classId: { in: targetClassIds } },
        });

        // Bulk insert generated schedule slots
        for (const item of result.schedules) {
          await tx.schedule.create({
            data: {
              classId: item.classId,
              subjectId: item.subjectId,
              teacherId: item.teacherId,
              dayOfWeek: item.dayOfWeek,
              period: item.period,
              room: item.room || null,
            },
          });
        }
      },
      { timeout: 30000 }
    );

    revalidateSchedulePaths();

    return {
      success: true,
      evaluation: result.evaluation,
      totalCount: result.schedules.length,
      unassignedDemands: result.unassignedDemands,
      generatedClassesCount: classes.length,
    };
  } catch (error: any) {
    return {
      error: `Lỗi trong quá trình tự động xếp thời khóa biểu: ${error.message || error}`,
    };
  }
}

/**
 * Validates whether swapping or moving schedule slots violates hard or soft pedagogical constraints
 */
export async function validateScheduleSwapAction(data: {
  classId: string;
  sourceSlot: { dayOfWeek: number; period: number };
  targetSlot: { dayOfWeek: number; period: number };
}) {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    const mappedSchedules: ScheduledPeriod[] = schedules.map((s) => ({
      id: s.id,
      classId: s.classId,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      teacherId: s.teacherId,
      teacherName: s.teacher.user.name,
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      shift: getShiftForPeriod(s.period),
      room: s.room,
      isFixed: (s.dayOfWeek === 1 && s.period === 1) || (s.dayOfWeek === 5 && (s.period === 7 || s.period === 4)),
    }));

    const engine = new SmartTimetableEngine();
    const validation = engine.validateSwap(
      mappedSchedules,
      { classId: data.classId, ...data.sourceSlot },
      { classId: data.classId, ...data.targetSlot }
    );

    return validation;
  } catch (err: any) {
    return {
      isValid: false,
      conflicts: [`Lỗi kiểm tra xung đột: ${err.message}`],
    };
  }
}

/**
 * Atomically swaps or moves two schedule slots for a class in database
 */
export async function swapScheduleSlotsAction(data: {
  classId: string;
  sourceSlot: { dayOfWeek: number; period: number };
  targetSlot: { dayOfWeek: number; period: number };
}) {
  try {
    // 1. Guard against fixed slots
    if (data.sourceSlot.dayOfWeek === 1 && data.sourceSlot.period === 1) {
      return { error: "Không thể di chuyển tiết Chào cờ cố định vào Thứ 2 Tiết 1." };
    }
    if (data.targetSlot.dayOfWeek === 1 && data.targetSlot.period === 1) {
      return { error: "Không thể hoán đổi vào vị trí Chào cờ cố định Thứ 2 Tiết 1." };
    }

    const [sourceEntry, targetEntry] = await Promise.all([
      prisma.schedule.findUnique({
        where: {
          classId_dayOfWeek_period: {
            classId: data.classId,
            dayOfWeek: data.sourceSlot.dayOfWeek,
            period: data.sourceSlot.period,
          },
        },
      }),
      prisma.schedule.findUnique({
        where: {
          classId_dayOfWeek_period: {
            classId: data.classId,
            dayOfWeek: data.targetSlot.dayOfWeek,
            period: data.targetSlot.period,
          },
        },
      }),
    ]);

    if (!sourceEntry && !targetEntry) {
      return { error: "Cả hai ô thời khóa biểu đều đang trống." };
    }

    // Atomic swap in transaction
    await prisma.$transaction(async (tx) => {
      if (sourceEntry && targetEntry) {
        // Temp period to avoid unique constraint collision
        await tx.schedule.update({
          where: { id: sourceEntry.id },
          data: { period: 999 },
        });

        await tx.schedule.update({
          where: { id: targetEntry.id },
          data: {
            dayOfWeek: data.sourceSlot.dayOfWeek,
            period: data.sourceSlot.period,
          },
        });

        await tx.schedule.update({
          where: { id: sourceEntry.id },
          data: {
            dayOfWeek: data.targetSlot.dayOfWeek,
            period: data.targetSlot.period,
          },
        });
      } else if (sourceEntry && !targetEntry) {
        await tx.schedule.update({
          where: { id: sourceEntry.id },
          data: {
            dayOfWeek: data.targetSlot.dayOfWeek,
            period: data.targetSlot.period,
          },
        });
      } else if (!sourceEntry && targetEntry) {
        await tx.schedule.update({
          where: { id: targetEntry.id },
          data: {
            dayOfWeek: data.sourceSlot.dayOfWeek,
            period: data.sourceSlot.period,
          },
        });
      }
    });

    revalidateSchedulePaths();
    return { success: true };
  } catch (err: any) {
    return { error: `Lỗi khi hoán đổi tiết học: ${err.message}` };
  }
}

/**
 * Returns teacher weekly workload statistics, shifts count (<= 5), and idle gaps for BGH monitoring
 */
export async function getTeacherWorkloadStatsAction(schoolId?: string) {
  try {
    const teacherWhere = schoolId && schoolId !== "ALL" ? { user: { schoolId } } : {};

    const [teachers, schedules] = await Promise.all([
      prisma.teacher.findMany({
        where: teacherWhere,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.schedule.findMany({
        include: {
          classRoom: { select: { id: true, name: true, gradeLevel: true } },
          subject: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { name: true } } } },
        },
      }),
    ]);

    const teacherMap: Record<
      string,
      {
        teacherId: string;
        teacherName: string;
        specialty?: string | null;
        totalPeriods: number;
        shifts: Set<string>;
        classesTaught: Set<string>;
        periodsByDay: Record<number, number[]>;
        idleGapsCount: number;
      }
    > = {};

    for (const t of teachers) {
      teacherMap[t.id] = {
        teacherId: t.id,
        teacherName: t.user.name,
        specialty: t.specialty,
        totalPeriods: 0,
        shifts: new Set<string>(),
        classesTaught: new Set<string>(),
        periodsByDay: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
        idleGapsCount: 0,
      };
    }

    for (const s of schedules) {
      if (!teacherMap[s.teacherId]) {
        teacherMap[s.teacherId] = {
          teacherId: s.teacherId,
          teacherName: s.teacher.user.name,
          specialty: null,
          totalPeriods: 0,
          shifts: new Set<string>(),
          classesTaught: new Set<string>(),
          periodsByDay: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
          idleGapsCount: 0,
        };
      }

      const rec = teacherMap[s.teacherId];
      rec.totalPeriods += 1;
      rec.classesTaught.add(s.classRoom.name);

      const shift = getShiftForPeriod(s.period);
      rec.shifts.add(`${s.dayOfWeek}_${shift}`);
      rec.periodsByDay[s.dayOfWeek].push(s.period);
    }

    // Calculate idle gaps for each teacher
    let totalOverloadedTeachers = 0;
    let totalIdleGapsInSchool = 0;

    const teacherStats = Object.values(teacherMap).map((t) => {
      let teacherGaps = 0;
      for (const day of [1, 2, 3, 4, 5, 6]) {
        const pList = (t.periodsByDay[day] || []).sort((a, b) => a - b);
        const morningList = pList.filter((p) => p <= 4);
        const afternoonList = pList.filter((p) => p > 4);

        if (morningList.length > 1) {
          const span = morningList[morningList.length - 1] - morningList[0] + 1;
          teacherGaps += Math.max(0, span - morningList.length);
        }
        if (afternoonList.length > 1) {
          const span = afternoonList[afternoonList.length - 1] - afternoonList[0] + 1;
          teacherGaps += Math.max(0, span - afternoonList.length);
        }
      }

      t.idleGapsCount = teacherGaps;
      totalIdleGapsInSchool += teacherGaps;

      const totalShifts = t.shifts.size;
      const isOverloaded = totalShifts > 5;
      if (isOverloaded) totalOverloadedTeachers += 1;

      return {
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        specialty: t.specialty,
        totalPeriods: t.totalPeriods,
        totalShifts,
        isOverloaded,
        idleGapsCount: t.idleGapsCount,
        classesTaught: Array.from(t.classesTaught),
        shiftsList: Array.from(t.shifts),
      };
    });

    return {
      teachers: teacherStats,
      summary: {
        totalTeachers: teachers.length,
        totalOverloadedTeachers,
        totalIdleGapsInSchool,
        averagePeriodsPerTeacher: teachers.length > 0 ? (schedules.length / teachers.length).toFixed(1) : 0,
      },
    };
  } catch (err: any) {
    return {
      error: `Lỗi khi lấy thông tin tải trọng giáo viên: ${err.message}`,
      teachers: [],
      summary: { totalTeachers: 0, totalOverloadedTeachers: 0, totalIdleGapsInSchool: 0, averagePeriodsPerTeacher: 0 },
    };
  }
}

/**
 * Returns full matrix schedule data grouped by Class or Teacher for interactive BGH view
 */
export async function getTimetableMatrixAction(filter: {
  schoolId?: string;
  gradeLevel?: number;
  classId?: string;
  teacherId?: string;
}) {
  try {
    const classWhere: any = {};
    if (filter.schoolId && filter.schoolId !== "ALL") classWhere.schoolId = filter.schoolId;
    if (filter.gradeLevel) classWhere.gradeLevel = filter.gradeLevel;
    if (filter.classId) classWhere.id = filter.classId;

    const [classes, teachers, schedules, subjects] = await Promise.all([
      prisma.classRoom.findMany({
        where: classWhere,
        include: {
          school: { select: { id: true, name: true } },
          homeroomTeacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      }),
      prisma.teacher.findMany({
        where: filter.schoolId && filter.schoolId !== "ALL" ? { user: { schoolId: filter.schoolId } } : {},
        include: { user: { select: { id: true, name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.schedule.findMany({
        where: filter.classId ? { classId: filter.classId } : filter.teacherId ? { teacherId: filter.teacherId } : {},
        include: {
          classRoom: { select: { id: true, name: true, gradeLevel: true } },
          subject: { select: { id: true, name: true } },
          teacher: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
      }),
      prisma.subject.findMany({
        select: { id: true, name: true, gradeLevel: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      classes,
      teachers,
      subjects,
      schedules,
    };
  } catch (err: any) {
    return {
      error: `Lỗi khi lấy dữ liệu ma trận thời khóa biểu: ${err.message}`,
      classes: [],
      teachers: [],
      subjects: [],
      schedules: [],
    };
  }
}

