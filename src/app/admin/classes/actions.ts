"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClasses(search?: string, schoolId?: string, gradeLevel?: number) {
  const where: any = {};
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (schoolId) where.schoolId = schoolId;
  if (gradeLevel) where.gradeLevel = gradeLevel;

  return prisma.classRoom.findMany({
    where,
    include: {
      school: { select: { id: true, name: true } },
      campus: { select: { id: true, name: true } },
      homeroomTeacher: { select: { id: true, user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export async function getSchoolsForSelect() {
  return prisma.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export async function getCampusesForSelect(schoolId?: string) {
  const where = schoolId ? { schoolId } : {};
  return prisma.campus.findMany({ where, select: { id: true, name: true, schoolId: true }, orderBy: { name: "asc" } });
}

export async function getTeachersForSelect() {
  return prisma.teacher.findMany({
    select: { id: true, user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });
}

export async function createClass(data: { name: string; gradeLevel: number; schoolId: string; campusId?: string; homeroomTeacherId?: string }) {
  try {
    await prisma.classRoom.create({ data });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo lớp" };
  }
}

export async function updateClass(id: string, data: { name: string; gradeLevel: number; schoolId: string; campusId?: string; homeroomTeacherId?: string }) {
  try {
    await prisma.classRoom.update({ where: { id }, data });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteClass(id: string) {
  try {
    await prisma.classRoom.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa lớp" };
  }
}
