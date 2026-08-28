"use server";

import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export async function getPrincipalSchoolInfo() {
  try {
    const ctx = await getTenantContext();
    if (ctx.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: ctx.schoolId },
        select: { id: true, name: true, schoolType: true }
      });
      if (school) return school;
    }
  } catch {}
  const firstSchool = await prisma.school.findFirst({ select: { id: true, name: true, schoolType: true } });
  return firstSchool || { id: "", name: "Trường học", schoolType: "THPT" };
}

export async function getSubjects(search?: string) {
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  return prisma.subject.findMany({
    where,
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      headTeacherId: true,
      headTeacher: {
        select: {
          id: true,
          user: { select: { name: true, school: { select: { name: true } } } }
        }
      },
      teachingAssignments: {
        select: {
          id: true,
          teacher: {
            select: {
              id: true,
              specialty: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  school: { select: { id: true, name: true } }
                }
              }
            }
          },
          classRoom: {
            select: { id: true, name: true, gradeLevel: true }
          }
        }
      },
      _count: { select: { teachingAssignments: true, grades: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
  });
}

export async function getTeachersList() {
  return prisma.teacher.findMany({
    select: {
      id: true,
      user: { select: { name: true } }
    },
    orderBy: { user: { name: "asc" } }
  });
}

export async function createSubject(data: { name: string; gradeLevel?: number; headTeacherId?: string | null }) {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        headTeacherId: data.headTeacherId || null,
      }
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo môn học" };
  }
}

export async function updateSubject(id: string, data: { name: string; gradeLevel?: number; headTeacherId?: string | null }) {
  try {
    await prisma.subject.update({
      where: { id },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        headTeacherId: data.headTeacherId || null,
      }
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({ where: { id } });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Không thể xóa (có thể đang được sử dụng)" };
  }
}
