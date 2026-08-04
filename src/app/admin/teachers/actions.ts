"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getTeachers(search?: string) {
  const where: any = {};
  if (search) {
    where.user = { name: { contains: search, mode: "insensitive" } };
  }
  return prisma.teacher.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      homeroomClasses: { select: { id: true, name: true, gradeLevel: true } },
      teachingAssignments: {
        select: {
          id: true,
          subject: { select: { name: true } },
          classRoom: { select: { name: true } },
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export async function createTeacher(data: {
  name: string;
  email: string;
  password: string;
  specialty?: string;
  phone?: string;
  degree?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email đã tồn tại" };

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            specialty: data.specialty,
            phone: data.phone,
            degree: data.degree,
          },
        },
      },
    });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo giáo viên" };
  }
}

export async function updateTeacher(
  teacherId: string,
  data: { name: string; email: string; specialty?: string; phone?: string; degree?: string }
) {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
    if (!teacher) return { success: false, error: "Không tìm thấy giáo viên" };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: teacher.userId },
        data: { name: data.name, email: data.email },
      }),
      prisma.teacher.update({
        where: { id: teacherId },
        data: { specialty: data.specialty, phone: data.phone, degree: data.degree },
      }),
    ]);
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteTeacher(teacherId: string) {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
    if (!teacher) return { success: false, error: "Không tìm thấy giáo viên" };

    await prisma.user.delete({ where: { id: teacher.userId } });
    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa" };
  }
}
