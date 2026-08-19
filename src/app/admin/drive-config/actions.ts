"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Helper function to resolve effective schoolId for Admin
async function getEffectiveSchoolId() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;

    if (session.user.schoolId) return session.user.schoolId;

    if (session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { schoolId: true },
      });
      if (dbUser?.schoolId) return dbUser.schoolId;
    }

    const firstSchool = await prisma.school.findFirst({ select: { id: true } });
    if (firstSchool?.id) return firstSchool.id;

    const defaultSchool = await prisma.school.create({
      data: { name: "Trường THPT Trung Tâm" },
    });
    return defaultSchool.id;
  } catch (error) {
    console.error("Error resolving schoolId:", error);
    return null;
  }
}

// ==================== DRIVE CONFIG ====================

export async function getSchoolDriveConfig() {
  const schoolId = await getEffectiveSchoolId();
  if (!schoolId) return null;
  return prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, sharedDriveUrl: true },
  });
}

export async function updateSharedDriveUrl(driveUrl: string) {
  const schoolId = await getEffectiveSchoolId();
  if (!schoolId) return { success: false, error: "Không tìm thấy thông tin Trường học" };

  await prisma.school.update({
    where: { id: schoolId },
    data: { sharedDriveUrl: driveUrl || null },
  });
  
  return { success: true };
}

// ==================== LESSON PLAN PERIODS ====================

export async function getLessonPlanPeriods() {
  const schoolId = await getEffectiveSchoolId();
  if (!schoolId) return [];
  return prisma.lessonPlanPeriod.findMany({
    where: { schoolId },
    orderBy: { deadline: "desc" },
  });
}

export async function createLessonPlanPeriod(data: {
  label: string;
  startDate: string;
  deadline: string;
}) {
  const schoolId = await getEffectiveSchoolId();
  if (!schoolId) return { success: false, error: "Không tìm thấy thông tin Trường học" };

  if (!data.label.trim()) return { success: false, error: "Tên kỳ nộp không được trống" };

  await prisma.lessonPlanPeriod.create({
    data: {
      schoolId,
      label: data.label.trim(),
      startDate: new Date(data.startDate),
      deadline: new Date(data.deadline),
    },
  });
  
  return { success: true };
}

export async function togglePeriodActive(periodId: string, isActive: boolean) {
  await prisma.lessonPlanPeriod.update({
    where: { id: periodId },
    data: { isActive },
  });
  
  return { success: true };
}

export async function deletePeriod(periodId: string) {
  await prisma.lessonPlanPeriod.delete({ where: { id: periodId } });
  return { success: true };
}

// ==================== SUBJECT GROUPS ====================

export async function getSubjectGroups() {
  try {
    const schoolId = await getEffectiveSchoolId();
    return await prisma.subjectGroup.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        headTeacher: { include: { user: { select: { name: true } } } },
        subjects: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error in getSubjectGroups:", error);
    return [];
  }
}

export async function createSubjectGroup(data: { name: string; headTeacherId?: string }) {
  try {
    const schoolId = await getEffectiveSchoolId();
    if (!schoolId) return { success: false, error: "Không tìm thấy trường học tương ứng để tạo tổ" };

    const trimmedName = data.name.trim();
    if (!trimmedName) return { success: false, error: "Tên tổ không được để trống" };

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.subjectGroup.findFirst({
        where: {
          schoolId,
          name: { equals: trimmedName, mode: "insensitive" },
        },
      });
      if (existing) {
        return { success: false, error: `Tổ chuyên môn "${trimmedName}" đã tồn tại.` };
      }

      await tx.subjectGroup.create({
        data: {
          schoolId,
          name: trimmedName,
          headTeacherId: data.headTeacherId || null,
        },
      });
      
      return { success: true };
    });
  } catch (err: any) {
    console.error("Error creating subject group:", err);
    return { success: false, error: err.message || "Không thể tạo tổ chuyên môn" };
  }
}

export async function deleteSubjectGroup(groupId: string) {
  try {
    await prisma.subject.updateMany({ where: { subjectGroupId: groupId }, data: { subjectGroupId: null } });
    await prisma.subjectGroup.delete({ where: { id: groupId } });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi xóa tổ" };
  }
}

export async function assignSubjectToGroup(subjectId: string, groupId: string | null) {
  try {
    await prisma.subject.update({
      where: { id: subjectId },
      data: { subjectGroupId: groupId },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi gán môn" };
  }
}

export async function getUnassignedSubjects() {
  try {
    return await prisma.subject.findMany({
      where: { subjectGroupId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error in getUnassignedSubjects:", error);
    return [];
  }
}

export async function getAllTeachersList() {
  try {
    return await prisma.teacher.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
  } catch (error) {
    console.error("Error in getAllTeachersList:", error);
    return [];
  }
}

export async function updateGroupHead(groupId: string, headTeacherId: string | null) {
  try {
    await prisma.subjectGroup.update({
      where: { id: groupId },
      data: { headTeacherId: headTeacherId || null },
    });
    return { success: true };
  } catch (err: any) {
    console.error("Error updating group head:", err);
    return { success: false, error: err.message || "Không thể cập nhật tổ trưởng" };
  }
}
