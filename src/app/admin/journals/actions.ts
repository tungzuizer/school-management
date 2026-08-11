"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Check if user is admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function getAdminJournalMetadata() {
  if (!(await isAdmin())) return { classes: [] };

  const classes = await prisma.classRoom.findMany({
    orderBy: { name: "asc" },
    include: {
      homeroomTeacher: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  return {
    classes: classes.map((c) => ({
      id: c.id,
      name: c.name,
      homeroomTeacherName: c.homeroomTeacher?.user?.name || "Chưa phân công",
    })),
  };
}

export async function getAdminJournalEntries(classId: string, dateStr: string) {
  if (!(await isAdmin()) || !classId || !dateStr) return [];

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
  if (!(await isAdmin())) return { success: false, error: "Không có quyền quản lý" };

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
  if (!(await isAdmin())) return { success: false, error: "Không có quyền quản lý" };

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
