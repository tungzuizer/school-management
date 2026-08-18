"use server";

import prisma from "@/lib/prisma";


export async function getSchools(search?: string) {
  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
  return prisma.school.findMany({
    where,
    include: {
      _count: { select: { classRooms: true, campuses: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function createSchool(data: { name: string; address?: string; phone?: string; email?: string }) {
  try {
    await prisma.school.create({ data });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo trường" };
  }
}

export async function updateSchool(id: string, data: { name: string; address?: string; phone?: string; email?: string }) {
  try {
    await prisma.school.update({ where: { id }, data });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteSchool(id: string) {
  try {
    await prisma.school.delete({ where: { id } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa trường" };
  }
}
