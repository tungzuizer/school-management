"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==================== DRIVE CONFIG ====================

export async function getSchoolDriveConfig() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return null;
  return prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { id: true, name: true, sharedDriveUrl: true },
  });
}

export async function updateSharedDriveUrl(driveUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return { success: false, error: "Không có quyền" };

  await prisma.school.update({
    where: { id: session.user.schoolId },
    data: { sharedDriveUrl: driveUrl || null },
  });
  revalidatePath("/admin/drive-config");
  return { success: true };
}

// ==================== LESSON PLAN PERIODS ====================

export async function getLessonPlanPeriods() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return [];
  return prisma.lessonPlanPeriod.findMany({
    where: { schoolId: session.user.schoolId },
    orderBy: { deadline: "desc" },
  });
}

export async function createLessonPlanPeriod(data: {
  label: string;
  startDate: string;
  deadline: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return { success: false, error: "Không có quyền" };

  if (!data.label.trim()) return { success: false, error: "Tên kỳ nộp không được trống" };

  await prisma.lessonPlanPeriod.create({
    data: {
      schoolId: session.user.schoolId,
      label: data.label.trim(),
      startDate: new Date(data.startDate),
      deadline: new Date(data.deadline),
    },
  });
  revalidatePath("/admin/drive-config");
  return { success: true };
}

export async function togglePeriodActive(periodId: string, isActive: boolean) {
  await prisma.lessonPlanPeriod.update({
    where: { id: periodId },
    data: { isActive },
  });
  revalidatePath("/admin/drive-config");
  return { success: true };
}

export async function deletePeriod(periodId: string) {
  await prisma.lessonPlanPeriod.delete({ where: { id: periodId } });
  revalidatePath("/admin/drive-config");
  return { success: true };
}

// ==================== SUBJECT GROUPS ====================

export async function getSubjectGroups() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return [];
  return prisma.subjectGroup.findMany({
    where: { schoolId: session.user.schoolId },
    include: {
      headTeacher: { include: { user: { select: { name: true } } } },
      subjects: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createSubjectGroup(data: { name: string; headTeacherId?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.schoolId) return { success: false, error: "Không có quyền" };

  await prisma.subjectGroup.create({
    data: {
      schoolId: session.user.schoolId,
      name: data.name.trim(),
      headTeacherId: data.headTeacherId || null,
    },
  });
  revalidatePath("/admin/subject-groups");
  return { success: true };
}

export async function deleteSubjectGroup(groupId: string) {
  // Unlink subjects first
  await prisma.subject.updateMany({ where: { subjectGroupId: groupId }, data: { subjectGroupId: null } });
  await prisma.subjectGroup.delete({ where: { id: groupId } });
  revalidatePath("/admin/subject-groups");
  return { success: true };
}

export async function assignSubjectToGroup(subjectId: string, groupId: string | null) {
  await prisma.subject.update({
    where: { id: subjectId },
    data: { subjectGroupId: groupId },
  });
  revalidatePath("/admin/subject-groups");
  return { success: true };
}

export async function getUnassignedSubjects() {
  return prisma.subject.findMany({
    where: { subjectGroupId: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getAllTeachersList() {
  return prisma.teacher.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}
