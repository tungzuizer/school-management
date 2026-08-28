"use server";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";

export async function getTeachers(search?: string, specialty?: string, schoolId?: string) {
  const where: any = {};

  if (schoolId) {
    where.user = { ...(where.user || {}), schoolId };
  } else {
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) {
        where.user = { ...(where.user || {}), schoolId: ctx.schoolId };
      }
    } catch { /* allow */ }
  }

  if (specialty) {
    where.specialty = { contains: specialty, mode: "insensitive" };
  }

  if (search) {
    where.user = { ...(where.user || {}), name: { contains: search, mode: "insensitive" } };
  }
  return prisma.teacher.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, isApproved: true, school: { select: { id: true, name: true } } } },
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

export async function getSchoolsForTeacherSelect() {
  return prisma.school.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createTeacher(data: {
  name: string;
  email: string;
  password?: string;
  specialty?: string;
  phone?: string;
  degree?: string;
}) {
  try {
    const sanitizedEmail = cleanEmail(data.email);
    const existing = await prisma.user.findUnique({ where: { email: sanitizedEmail } });
    if (existing) return { success: false, error: "Email đã tồn tại" };

    const rawPassword = data.password && data.password.trim() ? data.password.trim() : "abc123";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    let schoolIdToUse: string | undefined = undefined;
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) schoolIdToUse = ctx.schoolId;
    } catch {}

    await prisma.user.create({
      data: {
        name: data.name,
        email: sanitizedEmail,
        password: hashedPassword,
        role: "TEACHER",
        schoolId: schoolIdToUse,
        teacher: {
          create: {
            specialty: data.specialty,
            phone: data.phone,
            degree: data.degree,
          },
        },
      },
    });
    
    return { success: true, defaultPassword: rawPassword };
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

export async function resetTeacherPassword(userId: string, newPassword?: string) {
  try {
    const rawPassword = newPassword && newPassword.trim() ? newPassword.trim() : "abc123";
    if (rawPassword.length < 6) return { success: false, error: "Mật khẩu tối thiểu 6 ký tự" };

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        action: "UPDATE", entityName: "TeacherPassword", entityId: userId,
        description: `Đặt lại mật khẩu cho Giáo viên`,
      });
    } catch { /* skip */ }

    return { success: true, newPassword: rawPassword };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi đổi mật khẩu giáo viên" };
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

function cleanEmail(email: string): string {
  if (!email || !email.includes("@")) return email ? email.trim().toLowerCase() : "";
  const [local, domain] = email.trim().toLowerCase().split("@");
  const cleanLocal = local
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9._-]/g, "");
  return `${cleanLocal}@${domain}`;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export async function createBulkTeachers(teachersData: BulkTeacherInput[]) {
  try {
    if (!teachersData || teachersData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const defaultPasswordHash = await bcrypt.hash("abc123", 10);

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

      let email = t.email ? cleanEmail(t.email) : undefined;

      if (!email) {
        const cleanName = removeVietnameseTones(t.name.trim());
        let baseEmail = `gv.${cleanName}@school.edu.vn`;
        email = baseEmail;
        let suffix = 1;
        while (existingEmails.has(email)) {
          email = `gv.${cleanName}${suffix}@school.edu.vn`;
          suffix++;
        }
      } else {
        email = cleanEmail(email);
      }

      if (existingEmails.has(email)) {
        errors.push(`Dòng ${rowNum}: Email "${email}" đã tồn tại trong hệ thống`);
        continue;
      }

      let schoolIdToUse: string | undefined = undefined;
      try {
        const ctx = await getTenantContext();
        if (ctx.schoolId) schoolIdToUse = ctx.schoolId;
      } catch {}

      try {
        await prisma.user.create({
          data: {
            name: t.name.trim(),
            email,
            password: defaultPasswordHash,
            role: "TEACHER",
            schoolId: schoolIdToUse,
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
