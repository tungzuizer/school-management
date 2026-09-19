/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/journals/page.tsx`.
 * 2. Affected APIs: Server actions `getAdminJournalMetadata`, `getAdminJournalEntries`, `deleteAdminJournalEntry`, `confirmAdminJournalEntry`.
 * 3. Schema: Prisma `ClassRoom`, `Campus`, `School`, `ClassJournalEntry`, `User`, `Role`.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu / Điểm trường trực thuộc cho Sổ đầu bài.
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getTenantContext } from "@/lib/tenant";

// Check if user is authorized admin (SuperAdmin, School Admin, Vice Principal, Dept Admin)
async function isAuthorizedAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const isSuperAdmin =
    session.user.email === "superadmin@gmail.com" ||
    session.user.email === "superadmin.vietnam@gmail.com" ||
    session.user.email === "superadmin.ninhbinh@gmail.com" ||
    session.user.email === "superadmin.demo@gmail.com" ||
    session.user.email === "superadmin@school.com" ||
    (session.user as any).role === "SUPER_ADMIN";

  return (
    isSuperAdmin ||
    session.user.role === Role.ADMIN ||
    session.user.role === "VICE_PRINCIPAL" ||
    session.user.role === Role.DEPARTMENT_ADMIN ||
    session.user.role === Role.WARD_ADMIN
  );
}

export async function getAdminJournalMetadata(campusId?: string, schoolId?: string) {
  if (!(await isAuthorizedAdmin())) return { classes: [], campuses: [], schools: [] };

  const ctx = await getTenantContext().catch(() => null);
  let targetSchoolId: string | undefined;
  let targetCampusId: string | undefined;

  if (schoolId && schoolId !== "ALL" && schoolId !== "") {
    targetSchoolId = schoolId;
  } else if (ctx?.schoolId && ctx?.userRole !== "SUPER_ADMIN" && ctx?.userRole !== "ADMIN") {
    targetSchoolId = ctx.schoolId;
  }

  if (ctx?.campusId) {
    targetCampusId = ctx.campusId;
  } else if (campusId && campusId !== "ALL" && campusId !== "") {
    targetCampusId = campusId;
  }

  const classWhere: any = {};
  if (targetSchoolId) classWhere.schoolId = targetSchoolId;
  if (targetCampusId) classWhere.campusId = targetCampusId;

  const campusWhere: any = {};
  if (targetSchoolId) campusWhere.schoolId = targetSchoolId;

  const [classes, campuses, schools] = await Promise.all([
    prisma.classRoom.findMany({
      where: classWhere,
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
      include: {
        school: { select: { id: true, name: true } },
        campus: { select: { id: true, name: true } },
        homeroomTeacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.campus.findMany({
      where: campusWhere,
      select: { id: true, name: true, schoolId: true },
      orderBy: { name: "asc" },
    }),
    prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    schools,
    campuses,
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      schoolId: c.schoolId || null,
      schoolName: c.school?.name || "Toàn trường",
      campusId: c.campusId || null,
      campusName: c.campus?.name || "Điểm Trung tâm",
      homeroomTeacherName: c.homeroomTeacher?.user?.name || "Chưa phân công",
    })),
  };
}

export async function getAdminJournalEntries(classId: string, dateStr: string) {
  if (!(await isAuthorizedAdmin()) || !classId || !dateStr) return [];

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const entries = await prisma.classJournalEntry.findMany({
    where: {
      classId,
      date,
    },
    include: {
      subject: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: {
      period: "asc",
    },
  });

  return entries.map((entry) => ({
    id: entry.id,
    classId: entry.classId,
    subjectId: entry.subjectId,
    subjectName: entry.subject?.name || "Môn học",
    teacherId: entry.teacherId,
    teacherName: entry.teacher?.user?.name || "Giáo viên",
    date: entry.date,
    dayOfWeek: entry.dayOfWeek,
    period: entry.period,
    lessonTitle: entry.lessonTitle || "",
    content: entry.content || "",
    absentees: entry.absentees || "",
    notes: entry.notes || "",
    isConfirmed: entry.isConfirmed,
    confirmedAt: entry.confirmedAt,
  }));
}

export async function deleteAdminJournalEntry(entryId: string) {
  if (!(await isAuthorizedAdmin())) return { success: false, error: "Không có quyền quản lý" };

  try {
    await prisma.classJournalEntry.delete({
      where: { id: entryId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi xóa: " + error.message };
  }
}

export async function confirmAdminJournalEntry(entryId: string) {
  if (!(await isAuthorizedAdmin())) return { success: false, error: "Không có quyền quản lý" };

  try {
    await prisma.classJournalEntry.update({
      where: { id: entryId },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi lưu: " + error.message };
  }
}
