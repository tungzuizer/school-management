"use server";

import { prisma } from "@/lib/prisma";
import { ParsedScheduleRow } from "@/lib/excel-parser";

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

export async function getScheduleData(classId?: string, schoolId?: string) {
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
            OR: [
              { user: { schoolId } },
              { homeroomClasses: { some: { schoolId } } },
              { teachingAssignments: { some: { classRoom: { schoolId } } } },
            ],
          }
        : undefined,
      select: {
        id: true,
        specialty: true,
        user: { select: { id: true, name: true, email: true } },
        teachingAssignments: { select: { subjectId: true } },
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

  return { success: true };
}

export async function deleteScheduleEntry(id: string) {
  await prisma.schedule.delete({ where: { id } });
  return { success: true };
}

export async function clearClassSchedule(classId: string) {
  await prisma.schedule.deleteMany({
    where: { classId },
  });
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

  return {
    success: true,
    importedCount,
    totalCount: dataList.length,
    errors,
  };
}
