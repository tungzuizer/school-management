"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSubjects(search?: string) {
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  return prisma.subject.findMany({
    where,
    include: {
      _count: { select: { teachingAssignments: true, grades: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export async function createSubject(data: { name: string; gradeLevel?: number }) {
  try {
    await prisma.subject.create({ data: { name: data.name, gradeLevel: data.gradeLevel } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo môn học" };
  }
}

export async function updateSubject(id: string, data: { name: string; gradeLevel?: number }) {
  try {
    await prisma.subject.update({ where: { id }, data: { name: data.name, gradeLevel: data.gradeLevel } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể xóa (có thể đang được sử dụng)" };
  }
}
