/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/teachers/page.tsx`, `src/app/admin/teachers/components/TeacherCredentialsModal.tsx`, `src/app/admin/teachers/components/TeacherCredentialSlipsModal.tsx`.
 * 2. Affected APIs: `getTeacherCredentialsOverview`, `resetTeacherPasswordSecure`, `getTeacherCredentialSlips`, `resetTeacherPassword`, `createTeacher`, `getTeachers`, `getAdminCampuses`, `getSchoolsForTeacherSelect`.
 * 3. Schemas: Prisma models `User`, `Teacher`, `School`, `Campus`, `ClassRoom`.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu cho Quản lý Giáo viên.
 */

"use server";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { getTenantContext, isSuperAdmin } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";
import { resolveUniqueTeacherEmail, DEFAULT_INITIAL_PASSWORD } from "@/lib/account-automation";

export interface TeacherCredentialItem {
  id: string; // teacherId
  userId: string;
  name: string;
  email: string;
  specialty: string | null;
  phone: string | null;
  degree: string | null;
  schoolName: string;
  schoolId?: string;
  role: string;
  isApproved: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  defaultPasswordHint: string;
}

function assertPrincipalOrAdmin(ctx: { userRole?: string; userEmail?: string }) {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_ADMIN", "DISTRICT_ADMIN", "VICE_PRINCIPAL"];
  const hasAllowedRole = ctx.userRole && allowedRoles.includes(ctx.userRole);

  if (!hasAllowedRole && !isSuperAdmin(ctx)) {
    throw new Error("Truy cập bị từ chối: Chỉ Hiệu trưởng (ADMIN) hoặc Quản trị viên cấp cao mới có quyền xem và quản lý tài khoản/mật khẩu.");
  }
}

export async function getTeachers(search?: string, specialty?: string, schoolId?: string, campusId?: string) {
  const where: any = {};

  if (schoolId && schoolId !== "ALL" && schoolId !== "") {
    where.user = { ...(where.user || {}), schoolId };
  } else {
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId && ctx.userRole !== "SUPER_ADMIN" && ctx.userRole !== "ADMIN") {
        where.user = { ...(where.user || {}), schoolId: ctx.schoolId };
      }
    } catch { /* allow */ }
  }

  if (campusId && campusId !== "ALL" && campusId !== "") {
    where.OR = [
      { user: { campusId } },
      { homeroomClasses: { some: { campusId } } },
      { teachingAssignments: { some: { classRoom: { campusId } } } },
    ];
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isApproved: true,
          campusId: true,
          campus: { select: { id: true, name: true } },
          school: { select: { id: true, name: true } },
        },
      },
      homeroomClasses: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          campusId: true,
          campus: { select: { id: true, name: true } },
        },
      },
      teachingAssignments: {
        select: {
          id: true,
          subject: { select: { name: true } },
          classRoom: {
            select: {
              name: true,
              gradeLevel: true,
              campusId: true,
              campus: { select: { id: true, name: true } },
            },
          },
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

export async function getAdminCampuses(schoolId?: string) {
  try {
    const where = schoolId && schoolId !== "ALL" ? { schoolId } : {};
    return await prisma.campus.findMany({
      where,
      select: { id: true, name: true, schoolId: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Error fetching campuses for teachers:", error);
    return [];
  }
}

export async function createTeacher(data: {
  name: string;
  email?: string;
  password?: string;
  specialty?: string;
  phone?: string;
  degree?: string;
}) {
  try {
    let schoolDomain = "school.edu.vn";
    let schoolIdToUse: string | undefined = undefined;
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) {
        schoolIdToUse = ctx.schoolId;
        const sch = await prisma.school.findUnique({ where: { id: ctx.schoolId }, select: { name: true } });
        if (sch?.name) {
          const cleanName = sch.name
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          if (cleanName) {
            schoolDomain = `${cleanName}.edu.vn`;
          }
        }
      }
    } catch {}

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const resolvedEmail = resolveUniqueTeacherEmail(existingEmails, data.name, data.email, schoolDomain);

    const rawPassword = data.password && data.password.trim() ? data.password.trim() : DEFAULT_INITIAL_PASSWORD;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: resolvedEmail,
        password: hashedPassword,
        role: "TEACHER",
        isApproved: true,
        mustChangePassword: true,
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

    return { success: true, defaultPassword: rawPassword, email: resolvedEmail };
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
    const rawPassword = newPassword && newPassword.trim() ? newPassword.trim() : "123456";
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

    const defaultPasswordHash = await bcrypt.hash(DEFAULT_INITIAL_PASSWORD, 10);

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    let schoolDomain = "school.edu.vn";
    let schoolIdToUse: string | undefined = undefined;
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) {
        schoolIdToUse = ctx.schoolId;
        const sch = await prisma.school.findUnique({ where: { id: ctx.schoolId }, select: { name: true } });
        if (sch?.name) {
          const cleanName = sch.name
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
          if (cleanName) {
            schoolDomain = `${cleanName}.edu.vn`;
          }
        }
      }
    } catch {}

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < teachersData.length; i++) {
      const t = teachersData[i];
      const rowNum = i + 1;

      if (!t.name || !t.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Họ tên`);
        continue;
      }

      const email = resolveUniqueTeacherEmail(existingEmails, t.name, t.email, schoolDomain);

      try {
        await prisma.user.create({
          data: {
            name: t.name.trim(),
            email,
            password: defaultPasswordHash,
            role: "TEACHER",
            isApproved: true,
            mustChangePassword: true,
            schoolId: schoolIdToUse,
            teacher: {
              create: {
                specialty: t.specialty,
                phone: t.phone,
                degree: t.degree,
              },
            },
          },
        });

        existingEmails.add(email.toLowerCase());
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

/**
 * Hiển thị danh sách Tài khoản & Mật khẩu khởi tạo của Giáo viên
 * BẢO MẬT: Chỉ Hiệu trưởng (ADMIN), Quản trị viên (SUPER_ADMIN / DEPARTMENT_ADMIN) mới có quyền truy cập
 */
export async function getTeacherCredentialsOverview(filters?: {
  schoolId?: string;
  specialty?: string;
  search?: string;
}): Promise<{
  success: boolean;
  data?: TeacherCredentialItem[];
  error?: string;
}> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const where: any = {};

    let targetSchoolId = filters?.schoolId && filters.schoolId !== "ALL" ? filters.schoolId : undefined;
    if (!targetSchoolId && ctx.schoolId && ctx.userRole !== "SUPER_ADMIN" && ctx.userRole !== "DEPARTMENT_ADMIN") {
      targetSchoolId = ctx.schoolId;
    }

    if (targetSchoolId) {
      where.user = { ...(where.user || {}), schoolId: targetSchoolId };
    }

    if (filters?.specialty && filters.specialty.trim() !== "") {
      where.specialty = { contains: filters.specialty.trim(), mode: "insensitive" };
    }

    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.trim();
      where.OR = [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isApproved: true,
            mustChangePassword: true,
            createdAt: true,
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    const credentialItems: TeacherCredentialItem[] = teachers.map((t) => ({
      id: t.id,
      userId: t.user.id,
      name: t.user.name,
      email: t.user.email,
      specialty: t.specialty,
      phone: t.phone,
      degree: t.degree,
      schoolName: t.user.school?.name || "Trường THPT",
      schoolId: t.user.school?.id,
      role: t.user.role,
      isApproved: t.user.isApproved,
      mustChangePassword: t.user.mustChangePassword,
      createdAt: t.user.createdAt.toISOString(),
      defaultPasswordHint: "123456", // Mật khẩu chuẩn khởi tạo toàn trường
    }));

    return { success: true, data: credentialItems };
  } catch (error: any) {
    console.error("Error in getTeacherCredentialsOverview:", error);
    return { success: false, error: error.message || "Không thể lấy thông tin tài khoản giáo viên." };
  }
}

/**
 * Đặt lại mật khẩu bảo mật và cấp phát cho Giáo viên
 */
export async function resetTeacherPasswordSecure(
  userId: string,
  newPassword?: string,
  forceChangeOnLogin: boolean = true
): Promise<{ success: boolean; newPassword?: string; error?: string }> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, schoolId: true },
    });
    if (!targetUser) {
      return { success: false, error: "Không tìm thấy người dùng giáo viên." };
    }

    if (!isSuperAdmin(ctx) && ctx.userRole !== "DEPARTMENT_ADMIN" && ctx.userRole !== "DISTRICT_ADMIN") {
      if (ctx.schoolId && targetUser.schoolId && ctx.schoolId !== targetUser.schoolId) {
        return { success: false, error: "Bạn không có quyền thay đổi mật khẩu của giáo viên trường khác." };
      }
    }

    const rawPassword = newPassword && newPassword.trim() ? newPassword.trim() : "123456";
    if (rawPassword.length < 6) {
      return { success: false, error: "Mật khẩu tối thiểu 6 ký tự" };
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: forceChangeOnLogin,
      },
      select: { name: true, email: true },
    });

    await recordAuditLog({
      userId: ctx.userId,
      userName: ctx.userName,
      userRole: ctx.userRole,
      schoolId: ctx.schoolId,
      action: "UPDATE",
      entityName: "TeacherCredential",
      entityId: userId,
      description: `Hiệu trưởng/Admin đã đặt lại mật khẩu cho Giáo viên: ${updatedUser.name} (${updatedUser.email})`,
    }).catch(() => {});

    return { success: true, newPassword: rawPassword };
  } catch (error: any) {
    console.error("Error in resetTeacherPasswordSecure:", error);
    return { success: false, error: error.message || "Không thể đổi mật khẩu giáo viên." };
  }
}

/**
 * Lấy dữ liệu In phiếu bàn giao tài khoản & mật khẩu cho Giáo viên
 */
export async function getTeacherCredentialSlips(filters?: {
  schoolId?: string;
  specialty?: string;
}): Promise<{
  success: boolean;
  schoolName: string;
  slips: Array<{
    id: string;
    teacherName: string;
    email: string;
    specialty: string;
    phone: string;
    passwordHint: string;
    generatedDate: string;
  }>;
  error?: string;
}> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const overview = await getTeacherCredentialsOverview(filters);
    if (!overview.success || !overview.data) {
      return { success: false, schoolName: "", slips: [], error: overview.error };
    }

    const schoolName = overview.data[0]?.schoolName || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
    const todayStr = new Date().toLocaleDateString("vi-VN");

    const slips = overview.data.map((item) => ({
      id: item.id,
      teacherName: item.name,
      email: item.email,
      specialty: item.specialty || "Giáo viên bộ môn",
      phone: item.phone || "Chưa cập nhật",
      passwordHint: item.defaultPasswordHint,
      generatedDate: todayStr,
    }));

    return { success: true, schoolName, slips };
  } catch (error: any) {
    return { success: false, schoolName: "", slips: [], error: error.message || "Lỗi tạo phiếu tài khoản" };
  }
}

