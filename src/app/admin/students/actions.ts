"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getStudents(search?: string, classId?: string, gradeLevel?: number) {
  const where: any = {};
  if (search) {
    where.user = { name: { contains: search, mode: "insensitive" } };
  }
  if (classId) {
    where.classId = classId;
  }
  if (gradeLevel) {
    where.classRoom = { gradeLevel };
  }
  return prisma.student.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      classRoom: { select: { id: true, name: true, gradeLevel: true } },
      group: { select: { id: true, name: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 100,
  });
}

export async function getClassesForSelect() {
  return prisma.classRoom.findMany({
    select: { id: true, name: true, gradeLevel: true },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export async function createStudent(data: {
  name: string;
  email: string;
  password: string;
  studentCode?: string;
  classId?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  ethnicity?: string;
  addressCurrent?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email đã tồn tại" };

    if (data.studentCode) {
      const existingCode = await prisma.student.findFirst({ where: { studentCode: data.studentCode } });
      if (existingCode) return { success: false, error: "Mã học sinh đã tồn tại" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "STUDENT",
        student: {
          create: {
            studentCode: data.studentCode || undefined,
            classId: data.classId || undefined,
            dob: data.dob ? new Date(data.dob) : undefined,
            gender: data.gender as any || undefined,
            phone: data.phone || undefined,
            ethnicity: data.ethnicity || undefined,
            addressCurrent: data.addressCurrent || undefined,
            fatherName: data.fatherName || undefined,
            fatherJob: data.fatherJob || undefined,
            motherName: data.motherName || undefined,
            motherJob: data.motherJob || undefined,
          },
        },
      },
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo học sinh" };
  }
}

export async function updateStudent(
  studentId: string,
  data: {
    name: string;
    email: string;
    studentCode?: string;
    classId?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    ethnicity?: string;
    addressCurrent?: string;
    fatherName?: string;
    fatherJob?: string;
    motherName?: string;
    motherJob?: string;
    status?: string;
  }
) {
  try {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: student.userId },
        data: { name: data.name, email: data.email },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: {
          studentCode: data.studentCode || undefined,
          classId: data.classId || null,
          dob: data.dob ? new Date(data.dob) : undefined,
          gender: data.gender as any || undefined,
          phone: data.phone || undefined,
          ethnicity: data.ethnicity || undefined,
          addressCurrent: data.addressCurrent || undefined,
          fatherName: data.fatherName || undefined,
          fatherJob: data.fatherJob || undefined,
          motherName: data.motherName || undefined,
          motherJob: data.motherJob || undefined,
          status: data.status as any || undefined,
        },
      }),
    ]);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteStudent(studentId: string) {
  try {
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.user.delete({ where: { id: student.userId } });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa" };
  }
}
