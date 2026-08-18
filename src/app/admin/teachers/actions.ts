"use server";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";

export async function getTeachers(search?: string) {
  const where: any = {};

  // Tenant Isolation
  try {
    const ctx = await getTenantContext();
    if (ctx.schoolId) {
      where.user = { ...(where.user || {}), schoolId: ctx.schoolId };
    }
  } catch { /* allow */ }

  if (search) {
    where.user = { ...(where.user || {}), name: { contains: search, mode: "insensitive" } };
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
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa" };
  }
}

export interface BulkTeacherInput {
  name: string;
  email?: string;
  specialty?: string;
  phone?: string;
  degree?: string;
}

function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function createBulkTeachers(teachersData: BulkTeacherInput[]) {
  try {
    if (!teachersData || teachersData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const defaultPasswordHash = await bcrypt.hash("123456", 10);

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < teachersData.length; i++) {
      const t = teachersData[i];
      const rowNum = i + 1;

      if (!t.name || !t.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Họ tên`);
        continue;
      }

      let email = t.email?.trim().toLowerCase();

      if (!email) {
        const cleanName = removeVietnameseTones(t.name.trim());
        let baseEmail = `gv.${cleanName}@school.edu.vn`;
        email = baseEmail;
        let suffix = 1;
        while (existingEmails.has(email)) {
          email = `gv.${cleanName}${suffix}@school.edu.vn`;
          suffix++;
        }
      }

      if (existingEmails.has(email)) {
        errors.push(`Dòng ${rowNum}: Email "${email}" đã tồn tại trong hệ thống`);
        continue;
      }

      try {
        await prisma.user.create({
          data: {
            name: t.name.trim(),
            email,
            password: defaultPasswordHash,
            role: "TEACHER",
            teacher: {
              create: {
                specialty: t.specialty || undefined,
                phone: t.phone || undefined,
                degree: t.degree || undefined,
              },
            },
          },
        });

        existingEmails.add(email);
        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${t.name}): Lỗi - ${err.message}`);
      }
    }

    
    return {
      success: createdCount > 0,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi nhập hàng loạt giáo viên", count: 0 };
  }
}
