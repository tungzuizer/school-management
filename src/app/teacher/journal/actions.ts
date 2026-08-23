"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get teacher id from session
async function getTeacherId(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isApproved: true },
    });
    if (!user || user.isApproved === false) return null;

    const teacher = await prisma.teacher.findFirst({
      where: { userId },
    });
    if (teacher) return teacher.id;

    return null;
  } catch (err) {
    console.error("getTeacherId error:", err);
    return null;
  }
}

// Get the list of all classes and subjects, plus tracking which ones are taught or homeroom
export async function getJournalMetadata() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return { classes: [], subjects: [], teacherId: null, homeroomClassIds: [], assignments: [] };

    const teacherId = await getTeacherId(userId);
    if (!teacherId) return { classes: [], subjects: [], teacherId: null, homeroomClassIds: [], assignments: [] };

    const classes = await prisma.classRoom.findMany({
      orderBy: { name: "asc" },
    });

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    let homeroomClassIds: string[] = [];
    if (teacherId) {
      try {
        const homeroomClasses = await prisma.classRoom.findMany({
          where: { homeroomTeacherId: teacherId },
          select: { id: true },
        });
        homeroomClassIds = homeroomClasses.map((c) => c.id);
      } catch {
        homeroomClassIds = [];
      }
    }

    return {
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        isHomeroom: homeroomClassIds.includes(c.id),
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      teacherId,
      homeroomClassIds,
      assignments: [],
    };
  } catch (error) {
    console.error("getJournalMetadata error:", error);
    return {
      classes: [],
      subjects: [],
      teacherId: null,
      homeroomClassIds: [],
      assignments: [],
    };
  }
}

// Get journal entries for a class on a specific date
export async function getJournalEntries(classId: string, dateStr: string) {
  if (!classId || !dateStr) return [];
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return [];
  
  try {
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
        classRoom: { select: { homeroomTeacherId: true } },
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
      homeroomTeacherId: entry.classRoom?.homeroomTeacherId || null,
    }));
  } catch (error) {
    console.error("getJournalEntries error:", error);
    return [];
  }
}

// Save or Update a class journal entry
export async function saveJournalEntry(data: {
  id?: string;
  classId: string;
  subjectId: string;
  dateStr: string;
  period: number;
  lessonTitle: string;
  content: string;
  absentees: string;
  notes: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Tài khoản không phải giáo viên" };

  const date = new Date(data.dateStr);
  date.setHours(0, 0, 0, 0);

  // Day of week: 1=Mon, 2=Tue, ..., 7=Sun. Javascript: 0=Sun, 1=Mon...
  let dayOfWeek = date.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7; // Map JS Sunday (0) to schema Sunday (7)

  try {
    // Check DataLock for JOURNAL
    const classRoom = await prisma.classRoom.findUnique({ where: { id: data.classId } });
    if (classRoom?.schoolId) {
      const isLocked = await prisma.dataLock.findFirst({
        where: {
          schoolId: classRoom.schoolId,
          lockType: "JOURNAL",
          isLocked: true,
        },
      });
      if (isLocked) {
        return { success: false, error: "Sổ đầu bài đã bị Ban Giám Hiệu khóa sổ, không thể chỉnh sửa." };
      }
    }

    // If updating, verify teacher owner or homeroom context
    if (data.id) {
      const existing = await prisma.classJournalEntry.findUnique({
        where: { id: data.id },
        include: { classRoom: true },
      });

      if (!existing) {
        return { success: false, error: "Không tìm thấy nội dung đã ghi" };
      }

      if (existing.isConfirmed) {
        return { success: false, error: "Sổ đầu bài đã được GVCN xác nhận, không thể sửa" };
      }

      if (existing.teacherId !== teacherId && existing.classRoom.homeroomTeacherId !== teacherId) {
        return { success: false, error: "Bạn không có quyền sửa tiết học của giáo viên khác" };
      }

      const updated = await prisma.classJournalEntry.update({
        where: { id: data.id },
        data: {
          subjectId: data.subjectId,
          lessonTitle: data.lessonTitle,
          content: data.content,
          absentees: data.absentees,
          notes: data.notes,
        },
      });

      return { success: true, entry: updated };
    }

    // Creating new entry. Unique constraint is [classId, date, period]
    // Check if period already has entry for that class & date
    const conflict = await prisma.classJournalEntry.findUnique({
      where: {
        classId_date_period: {
          classId: data.classId,
          date,
          period: data.period,
        },
      },
    });

    if (conflict) {
      return { success: false, error: `Tiết ${data.period} của ngày này đã có giáo viên khác ghi sổ` };
    }

    const newEntry = await prisma.classJournalEntry.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId,
        date,
        dayOfWeek,
        period: data.period,
        lessonTitle: data.lessonTitle,
        content: data.content,
        absentees: data.absentees,
        notes: data.notes,
      },
    });

    return { success: true, entry: newEntry };
  } catch (error: any) {
    console.error("Error saving journal entry:", error);
    return { success: false, error: "Lỗi lưu sổ đầu bài: " + error.message };
  }
}

// Homeroom teacher confirms the entry or whole day/period
export async function confirmJournalEntry(entryId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Không chuẩn cấu hình giáo viên" };

  const entry = await prisma.classJournalEntry.findUnique({
    where: { id: entryId },
    include: { classRoom: true },
  });

  if (!entry) return { success: false, error: "Không tìm thấy tiết học cần xác nhận" };

  if (entry.classRoom.homeroomTeacherId !== teacherId) {
    return { success: false, error: "Bạn không phải giáo viên chủ nhiệm lớp này để xác nhận" };
  }

  try {
    const updated = await prisma.classJournalEntry.update({
      where: { id: entryId },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
    return { success: true, entry: updated };
  } catch (error: any) {
    return { success: false, error: "Lỗi khi xác nhận: " + error.message };
  }
}

// Homeroom teacher signs all entries for a class on a date
export async function confirmAllJournalEntriesForDate(classId: string, dateStr: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Không phải giáo viên" };

  const classRoom = await prisma.classRoom.findUnique({
    where: { id: classId },
  });

  if (!classRoom) return { success: false, error: "Không tìm thấy lớp học" };
  if (classRoom.homeroomTeacherId !== teacherId) {
    return { success: false, error: "Bạn không phải giáo viên chủ nhiệm lớp này" };
  }

  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  try {
    await prisma.classJournalEntry.updateMany({
      where: {
        classId,
        date,
        isConfirmed: false,
      },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi hàng loạt: " + error.message };
  }
}

// Delete journal entry from class journal if it hasn't been confirmed yet
export async function deleteJournalEntry(entryId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Không phải giáo viên" };

  const entry = await prisma.classJournalEntry.findUnique({
    where: { id: entryId },
  });

  if (!entry) return { success: false, error: "Không tìm thấy tiết học cần xóa" };
  if (entry.isConfirmed) return { success: false, error: "Sổ đầu bài đã được GVCN xác nhận, không thể xóa" };
  if (entry.teacherId !== teacherId) return { success: false, error: "Bạn không thể xóa sổ đầu bài của giáo viên khác" };

  try {
    await prisma.classJournalEntry.delete({
      where: { id: entryId },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Lỗi xóa: " + error.message };
  }
}
