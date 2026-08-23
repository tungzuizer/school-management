"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LessonPlanStatus } from "@prisma/client";

// Helper to get current teacher id from user session
async function getTeacherId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isApproved: true },
  });
  if (!user || user.isApproved === false) return undefined;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
  });
  return teacher?.id;
}

// Fetch subjects and classes for lesson plan metadata
export async function getLessonPlanMetadata() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { classes: [], subjects: [], teacherId: null, sharedDriveUrl: null, activePeriods: [] };

    const teacherId = await getTeacherId(session.user.id);
    if (!teacherId) return { classes: [], subjects: [], teacherId: null, sharedDriveUrl: null, activePeriods: [] };

    const [classes, subjects, school, periods] = await Promise.all([
      prisma.classRoom.findMany({ orderBy: { name: "asc" } }),
      prisma.subject.findMany({ orderBy: { name: "asc" } }),
      session.user.schoolId
        ? prisma.school.findUnique({ where: { id: session.user.schoolId }, select: { sharedDriveUrl: true } })
        : null,
      session.user.schoolId
        ? prisma.lessonPlanPeriod.findMany({ where: { schoolId: session.user.schoolId, isActive: true }, orderBy: { deadline: "asc" } })
        : [],
    ]);

    return {
      classes: classes.map(c => ({ id: c.id, name: c.name })),
      subjects: subjects.map(s => ({ id: s.id, name: s.name })),
      teacherId,
      sharedDriveUrl: school?.sharedDriveUrl || null,
      activePeriods: (periods as any[]).map((p: any) => ({ id: p.id, label: p.label, deadline: p.deadline })),
    };
  } catch (error) {
    console.error("Error fetching lesson plan metadata:", error);
    return { classes: [], subjects: [], teacherId: null, sharedDriveUrl: null, activePeriods: [] };
  }
}

// Get all lesson plans for the current teacher
export async function getLessonPlans() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const teacherId = await getTeacherId(session.user.id);
    if (!teacherId) return [];

    const plans = await prisma.lessonPlan.findMany({
      where: { teacherId },
      include: {
        subject: { select: { name: true } },
        classRoom: { select: { name: true } },
      },
      orderBy: [
        { weekNumber: "desc" },
        { createdAt: "desc" }
      ],
    });

    return plans.map(p => ({
      id: p.id,
      subjectId: p.subjectId,
      subjectName: p.subject?.name || "Môn học",
      classId: p.classId,
      className: p.classRoom?.name || "Lớp học",
      periodId: p.periodId || "",
      weekNumber: p.weekNumber,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      title: p.title,
      objectives: p.objectives || "",
      content: p.content || "",
      activities: p.activities || "",
      materials: p.materials || "",
      assessment: p.assessment || "",
      notes: p.notes || "",
      driveFileUrl: p.driveFileUrl || "",
      status: p.status,
      reviewNote: p.reviewNote || "",
      reviewedAt: p.reviewedAt,
      createdAt: p.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    return [];
  }
}

// Save or update lesson plan
export async function saveLessonPlan(data: {
  id?: string;
  subjectId: string;
  classId: string;
  periodId?: string;
  weekNumber: number;
  periodStart: number;
  periodEnd: number;
  title: string;
  objectives: string;
  content: string;
  activities: string;
  materials: string;
  assessment: string;
  notes: string;
  driveFileUrl?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Tài khoản không phải giáo viên" };

  if (!data.title.trim()) {
    return { success: false, error: "Tên bài học không được để trống" };
  }

  try {
    if (data.id) {
      // Update existing
      const existing = await prisma.lessonPlan.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        return { success: false, error: "Không tìm thấy giáo án" };
      }

      if (existing.teacherId !== teacherId) {
        return { success: false, error: "Không có quyền chỉnh sửa giáo án này" };
      }

      if (existing.status === LessonPlanStatus.APPROVED) {
        return { success: false, error: "Giáo án đã được phê duyệt, không thể sửa đổi" };
      }

      // If they save, status goes back to DRAFT or keeps as selected
      await prisma.lessonPlan.update({
        where: { id: data.id },
        data: {
          subjectId: data.subjectId,
          classId: data.classId,
          periodId: data.periodId || null,
          weekNumber: Number(data.weekNumber),
          periodStart: Number(data.periodStart),
          periodEnd: Number(data.periodEnd),
          title: data.title,
          objectives: data.objectives,
          content: data.content,
          activities: data.activities,
          materials: data.materials,
          assessment: data.assessment,
          notes: data.notes,
          driveFileUrl: data.driveFileUrl || null,
          status: LessonPlanStatus.DRAFT, // Saved as DRAFT
        },
      });

      return { success: true };
    } else {
      // Create new
      await prisma.lessonPlan.create({
        data: {
          teacherId,
          subjectId: data.subjectId,
          classId: data.classId,
          periodId: data.periodId || null,
          weekNumber: Number(data.weekNumber),
          periodStart: Number(data.periodStart),
          periodEnd: Number(data.periodEnd),
          title: data.title,
          objectives: data.objectives,
          content: data.content,
          activities: data.activities,
          materials: data.materials,
          assessment: data.assessment,
          notes: data.notes,
          driveFileUrl: data.driveFileUrl || null,
          status: LessonPlanStatus.DRAFT,
        },
      });

      return { success: true };
    }
  } catch (error: any) {
    console.error("Error saving lesson plan:", error);
    return { success: false, error: "Lỗi hệ thống khi lưu giáo án: " + error.message };
  }
}

// Submit a lesson plan for approval
export async function submitLessonPlan(planId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Tài khoản không phải giáo viên" };

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return { success: false, error: "Không tìm thấy giáo án" };
    }

    if (existing.teacherId !== teacherId) {
      return { success: false, error: "Không có quyền thao tác giáo án này" };
    }

    if (existing.status === LessonPlanStatus.APPROVED) {
      return { success: false, error: "Giáo án đã được phê duyệt" };
    }

    await prisma.lessonPlan.update({
      where: { id: planId },
      data: {
        status: LessonPlanStatus.SUBMITTED,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting lesson plan:", error);
    return { success: false, error: "Lỗi hệ thống khi gửi phê duyệt: " + error.message };
  }
}

// Delete lesson plan
export async function deleteLessonPlan(planId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

  const teacherId = await getTeacherId(session.user.id);
  if (!teacherId) return { success: false, error: "Tài khoản không phải giáo viên" };

  try {
    const existing = await prisma.lessonPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return { success: false, error: "Không tìm thấy giáo án" };
    }

    if (existing.teacherId !== teacherId) {
      return { success: false, error: "Không có quyền xóa giáo án này" };
    }

    if (existing.status === LessonPlanStatus.APPROVED) {
      return { success: false, error: "Không thể xóa giáo án đã được phê duyệt" };
    }

    await prisma.lessonPlan.delete({
      where: { id: planId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson plan:", error);
    return { success: false, error: "Lỗi khi xóa giáo án: " + error.message };
  }
}
