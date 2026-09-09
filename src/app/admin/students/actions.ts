/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/students/page.tsx`, `src/app/admin/students/components/StudentCredentialsModal.tsx`, `src/app/admin/students/components/StudentCredentialSlipsModal.tsx`.
 * 2. Affected APIs: `getStudentCredentialsOverview`, `resetStudentPasswordSecure`, `getStudentCredentialSlips`, `resetStudentPassword`, `createStudent`, `getStudents`.
 * 3. Schemas: Prisma models `User`, `Student`, `School`, `ClassRoom`.
 * 4. Verbatim User Instruction: "tôi muốn mỗi giáo viên mỗi học sinh sẽ có tài khoản mà mật khẩu và có thể hiện thị chỉ cho hiệu trưởng hoặc admin nhìn thấy được".
 */

"use server";

import prisma from "@/lib/prisma";

import bcrypt from "bcryptjs";
import { getTenantContext } from "@/lib/tenant";
import { recordAuditLog } from "@/lib/audit-logger";
import { generateStudentEmail } from "@/lib/student-email";
import { resolveUniqueStudentCodeAndEmail, previewNextStudentCodeAndEmail, DEFAULT_INITIAL_PASSWORD } from "@/lib/account-automation";

export interface StudentCredentialItem {
  id: string; // studentId
  userId: string;
  studentCode: string | null;
  name: string;
  email: string;
  className: string;
  classId?: string;
  gradeLevel?: number;
  schoolName: string;
  schoolId?: string;
  phone: string | null;
  parentPhone: string | null;
  parentName: string | null;
  status: string;
  mustChangePassword: boolean;
  createdAt: string;
  defaultPasswordHint: string;
}

function assertPrincipalOrAdmin(ctx: { userRole?: string; userEmail?: string }) {
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_ADMIN", "DISTRICT_ADMIN", "VICE_PRINCIPAL"];
  const isSuperAdminEmail =
    ctx.userEmail === "superadmin@school.com" ||
    ctx.userEmail === "sysadmin@so-gddt.gov.vn" ||
    ctx.userEmail === "admin@school.com";

  const hasAllowedRole = ctx.userRole && allowedRoles.includes(ctx.userRole);

  if (!hasAllowedRole && !isSuperAdminEmail) {
    throw new Error("Truy cập bị từ chối: Chỉ Hiệu trưởng (ADMIN) hoặc Quản trị viên cấp cao mới có quyền xem và quản lý tài khoản/mật khẩu.");
  }
}

export async function getStudents(search?: string, classId?: string, gradeLevel?: number, schoolId?: string) {
  try {
    const ctx = await getTenantContext().catch(() => null);
    let targetSchoolId: string | undefined;

    if (schoolId && schoolId !== "ALL" && schoolId !== "") {
      targetSchoolId = schoolId;
    } else if (ctx?.schoolId && ctx?.userRole !== "SUPER_ADMIN" && ctx?.userRole !== "ADMIN" && ctx?.userRole !== "DEPARTMENT_ADMIN" && ctx?.userRole !== "DISTRICT_ADMIN") {
      targetSchoolId = ctx.schoolId;
    }

    const andConditions: any[] = [];

    if (targetSchoolId) {
      andConditions.push({
        OR: [
          { classRoom: { schoolId: targetSchoolId } },
          { user: { schoolId: targetSchoolId } },
        ],
      });
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      andConditions.push({
        OR: [
          { user: { name: { contains: cleanSearch, mode: "insensitive" } } },
          { studentCode: { contains: cleanSearch, mode: "insensitive" } },
        ],
      });
    }

    if (classId && classId.trim()) {
      andConditions.push({ classId: classId.trim() });
    }

    if (gradeLevel) {
      andConditions.push({ classRoom: { gradeLevel: Number(gradeLevel) } });
    }

    const includeSelect = {
      user: { select: { id: true, name: true, email: true } },
      classRoom: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          school: { select: { id: true, name: true } },
        },
      },
      group: { select: { id: true, name: true } },
    };

    const result = await prisma.student.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      include: includeSelect,
      orderBy: { user: { name: "asc" } },
      take: 2000,
    });

    return result;
  } catch (error) {
    console.error("Error in getStudents:", error);
    return [];
  }
}

export async function getClassesForSelect(schoolId?: string) {
  try {
    const ctx = await getTenantContext().catch(() => null);
    let targetSchoolId: string | undefined;

    if (schoolId && schoolId !== "ALL" && schoolId !== "") {
      targetSchoolId = schoolId;
    } else if (ctx?.schoolId && ctx?.userRole !== "SUPER_ADMIN" && ctx?.userRole !== "ADMIN" && ctx?.userRole !== "DEPARTMENT_ADMIN" && ctx?.userRole !== "DISTRICT_ADMIN") {
      targetSchoolId = ctx.schoolId;
    }

    const where: any = {};
    if (targetSchoolId) where.schoolId = targetSchoolId;

    const classes = await prisma.classRoom.findMany({
      where,
      select: { id: true, name: true, gradeLevel: true, schoolId: true, school: { select: { id: true, name: true } } },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });
    if (classes.length > 0 || !targetSchoolId) return classes;
    return prisma.classRoom.findMany({
      select: { id: true, name: true, gradeLevel: true, schoolId: true, school: { select: { id: true, name: true } } },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    console.error("Error in getClassesForSelect:", error);
    return [];
  }
}

export async function getSchoolsForSelect() {
  try {
    const ctx = await getTenantContext().catch(() => null);
    if (ctx?.schoolId && ctx?.userRole !== "SUPER_ADMIN" && ctx?.userRole !== "ADMIN" && ctx?.userRole !== "DEPARTMENT_ADMIN" && ctx?.userRole !== "DISTRICT_ADMIN") {
      return prisma.school.findMany({
        where: { id: ctx.schoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
    }
    return prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }
}

export async function getNextStudentCodePreviewAction(classId?: string, gradeLevel?: number) {
  try {
    let resolvedGrade = gradeLevel;
    if (classId && !resolvedGrade) {
      const cls = await prisma.classRoom.findUnique({
        where: { id: classId },
        select: { gradeLevel: true },
      });
      if (cls?.gradeLevel) resolvedGrade = cls.gradeLevel;
    }

    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : "")).filter(Boolean)
    );

    const preview = previewNextStudentCodeAndEmail(existingCodes, resolvedGrade);
    return { success: true, ...preview };
  } catch (error: any) {
    return { success: false, studentCode: "HS26100001", email: "hs26100001@gmail.com" };
  }
}

export async function createStudent(data: {
  name: string;
  email?: string;
  password?: string;
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
    let userSchoolId: string | undefined;
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) userSchoolId = ctx.schoolId;
    } catch { /* skip */ }

    let gradeLevel: number | undefined;
    if (data.classId) {
      const cls = await prisma.classRoom.findUnique({
        where: { id: data.classId },
        select: { schoolId: true, gradeLevel: true },
      });
      if (cls?.schoolId && !userSchoolId) userSchoolId = cls.schoolId;
      if (cls?.gradeLevel) gradeLevel = cls.gradeLevel;
    }

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : "")).filter(Boolean)
    );

    const { studentCode: resolvedCode, email: resolvedEmail } = resolveUniqueStudentCodeAndEmail(
      existingCodes,
      existingEmails,
      {
        preferredCode: data.studentCode,
        preferredEmail: data.email,
        name: data.name,
        gradeLevel,
      }
    );

    const rawPassword = data.password && data.password.trim() ? data.password.trim() : DEFAULT_INITIAL_PASSWORD;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await prisma.user.create({
      data: {
        name: data.name,
        email: resolvedEmail,
        password: hashedPassword,
        role: "STUDENT",
        isApproved: true,
        mustChangePassword: true,
        schoolId: userSchoolId || undefined,
        student: {
          create: {
            studentCode: resolvedCode,
            classId: data.classId || undefined,
            dob: data.dob ? new Date(data.dob) : undefined,
            gender: (data.gender as any) || undefined,
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

    // Audit Log
    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "CREATE", entityName: "Student",
        description: `Tạo học sinh: ${data.name} (${resolvedEmail} - Mã: ${resolvedCode})`,
      });
    } catch { /* skip audit if no session */ }

    return { success: true, defaultPassword: rawPassword, studentCode: resolvedCode, email: resolvedEmail };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo học sinh" };
  }
}

export async function resetStudentPassword(userId: string, newPassword?: string) {
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
        action: "UPDATE", entityName: "StudentPassword", entityId: userId,
        description: `Đặt lại mật khẩu cho Học sinh`,
      });
    } catch { /* skip */ }

    return { success: true, newPassword: rawPassword };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi đổi mật khẩu học sinh" };
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
    

    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "UPDATE", entityName: "Student", entityId: studentId,
        description: `Cập nhật học sinh: ${data.name}`,
      });
    } catch { /* skip */ }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật" };
  }
}

export async function deleteStudent(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (!student) return { success: false, error: "Không tìm thấy học sinh" };

    await prisma.user.delete({ where: { id: student.userId } });
    

    try {
      const ctx = await getTenantContext();
      await recordAuditLog({
        userId: ctx.userId, userName: ctx.userName, userRole: ctx.userRole,
        schoolId: ctx.schoolId,
        action: "DELETE", entityName: "Student", entityId: studentId,
        description: `Xóa học sinh ID: ${studentId}`,
      });
    } catch { /* skip */ }

    return { success: true };
  } catch (error: any) {
    console.error("Lỗi khi xóa học sinh:", error);
    return { success: false, error: error.message || "Không thể xóa học sinh" };
  }
}

export interface BulkStudentInput {
  name: string;
  email?: string;
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
}

export async function createBulkStudents(studentsData: BulkStudentInput[]) {
  try {
    if (!studentsData || studentsData.length === 0) {
      return { success: false, error: "Danh sách nhập rỗng", count: 0 };
    }

    const defaultPasswordHash = await bcrypt.hash("abc123", 10);

    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const existingStudents = await prisma.student.findMany({ select: { studentCode: true } });
    const existingCodes = new Set(
      existingStudents.map((s) => (s.studentCode ? s.studentCode.toLowerCase() : ""))
    );

    let userSchoolId: string | undefined;
    try {
      const ctx = await getTenantContext();
      if (ctx.schoolId) userSchoolId = ctx.schoolId;
    } catch { /* skip */ }

    const classInfoMap = new Map<string, { schoolId?: string; gradeLevel?: number }>();
    const allClasses = await prisma.classRoom.findMany({ select: { id: true, schoolId: true, gradeLevel: true } });
    allClasses.forEach((c) => {
      classInfoMap.set(c.id, { schoolId: c.schoolId || undefined, gradeLevel: c.gradeLevel || undefined });
    });

    let createdCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < studentsData.length; i++) {
      const s = studentsData[i];
      const rowNum = i + 1;

      if (!s.name || !s.name.trim()) {
        errors.push(`Dòng ${rowNum}: Bỏ qua do thiếu Họ tên`);
        continue;
      }

      const clsInfo = s.classId ? classInfoMap.get(s.classId) : undefined;
      const { studentCode: resolvedCode, email: resolvedEmail } = resolveUniqueStudentCodeAndEmail(
        existingCodes,
        existingEmails,
        {
          preferredCode: s.studentCode,
          preferredEmail: s.email,
          name: s.name,
          gradeLevel: clsInfo?.gradeLevel,
          startSequence: i + 1,
        }
      );

      try {
        const rowSchoolId = userSchoolId || clsInfo?.schoolId;

        await prisma.user.create({
          data: {
            name: s.name.trim(),
            email: resolvedEmail,
            password: defaultPasswordHash,
            role: "STUDENT",
            isApproved: true,
            mustChangePassword: true,
            schoolId: rowSchoolId || undefined,
            student: {
              create: {
                studentCode: resolvedCode,
                classId: s.classId || undefined,
                dob: s.dob ? new Date(s.dob) : undefined,
                gender: (s.gender as any) || undefined,
                phone: s.phone || undefined,
                ethnicity: s.ethnicity || undefined,
                addressCurrent: s.addressCurrent || undefined,
                fatherName: s.fatherName || undefined,
                fatherJob: s.fatherJob || undefined,
                motherName: s.motherName || undefined,
                motherJob: s.motherJob || undefined,
              },
            },
          },
        });

        existingEmails.add(resolvedEmail.toLowerCase());
        existingCodes.add(resolvedCode.toLowerCase());
        createdCount++;
      } catch (err: any) {
        errors.push(`Dòng ${rowNum} (${s.name}): Lỗi - ${err.message}`);
      }
    }

    
    return {
      success: createdCount > 0,
      count: createdCount,
      errors,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi nhập hàng loạt", count: 0 };
  }
}

/**
 * Hiển thị danh sách Tài khoản & Mật khẩu khởi tạo của Học sinh
 * BẢO MẬT: Chỉ Hiệu trưởng (ADMIN), Quản trị viên (SUPER_ADMIN / DEPARTMENT_ADMIN) mới có quyền truy cập
 */
export async function getStudentCredentialsOverview(filters?: {
  schoolId?: string;
  classId?: string;
  gradeLevel?: number;
  search?: string;
}): Promise<{
  success: boolean;
  data?: StudentCredentialItem[];
  error?: string;
}> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const andConditions: any[] = [];

    let targetSchoolId = filters?.schoolId && filters.schoolId !== "ALL" ? filters.schoolId : undefined;
    if (!targetSchoolId && ctx.schoolId && ctx.userRole !== "SUPER_ADMIN" && ctx.userRole !== "DEPARTMENT_ADMIN") {
      targetSchoolId = ctx.schoolId;
    }

    if (targetSchoolId) {
      andConditions.push({
        OR: [
          { classRoom: { schoolId: targetSchoolId } },
          { user: { schoolId: targetSchoolId } },
        ],
      });
    }

    if (filters?.classId && filters.classId.trim() !== "" && filters.classId !== "ALL") {
      andConditions.push({ classId: filters.classId.trim() });
    }

    if (filters?.gradeLevel && Number(filters.gradeLevel) > 0) {
      andConditions.push({ classRoom: { gradeLevel: Number(filters.gradeLevel) } });
    }

    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.trim();
      andConditions.push({
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { studentCode: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const students = await prisma.student.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
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
        classRoom: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
            school: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { classRoom: { gradeLevel: "asc" } },
        { classRoom: { name: "asc" } },
        { user: { name: "asc" } },
      ],
      take: 2000,
    });

    const credentialItems: StudentCredentialItem[] = students.map((s) => ({
      id: s.id,
      userId: s.user.id,
      studentCode: s.studentCode,
      name: s.user.name,
      email: s.user.email,
      className: s.classRoom?.name || "Chưa phân lớp",
      classId: s.classRoom?.id,
      gradeLevel: s.classRoom?.gradeLevel,
      schoolName: s.classRoom?.school?.name || s.user.school?.name || "Trường THPT",
      schoolId: s.classRoom?.school?.id || s.user.school?.id,
      phone: s.phone,
      parentPhone: s.parentPhone,
      parentName: s.parentName,
      status: s.status,
      mustChangePassword: s.user.mustChangePassword,
      createdAt: s.user.createdAt.toISOString(),
      defaultPasswordHint: "abc123", // Mật khẩu chuẩn khởi tạo toàn trường
    }));

    return { success: true, data: credentialItems };
  } catch (error: any) {
    console.error("Error in getStudentCredentialsOverview:", error);
    return { success: false, error: error.message || "Không thể lấy thông tin tài khoản học sinh." };
  }
}

/**
 * Đặt lại mật khẩu bảo mật và cấp phát cho Học sinh
 */
export async function resetStudentPasswordSecure(
  userId: string,
  newPassword?: string,
  forceChangeOnLogin: boolean = true
): Promise<{ success: boolean; newPassword?: string; error?: string }> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const rawPassword = newPassword && newPassword.trim() ? newPassword.trim() : "abc123";
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
      entityName: "StudentCredential",
      entityId: userId,
      description: `Hiệu trưởng/Admin đã đặt lại mật khẩu cho Học sinh: ${updatedUser.name} (${updatedUser.email})`,
    }).catch(() => {});

    return { success: true, newPassword: rawPassword };
  } catch (error: any) {
    console.error("Error in resetStudentPasswordSecure:", error);
    return { success: false, error: error.message || "Không thể đổi mật khẩu học sinh." };
  }
}

/**
 * Lấy dữ liệu In thẻ tài khoản & phiếu bàn giao mật khẩu cho Học sinh
 */
export async function getStudentCredentialSlips(filters?: {
  schoolId?: string;
  classId?: string;
  gradeLevel?: number;
}): Promise<{
  success: boolean;
  schoolName: string;
  className?: string;
  slips: Array<{
    id: string;
    studentCode: string;
    studentName: string;
    className: string;
    email: string;
    passwordHint: string;
    parentPhone: string;
    generatedDate: string;
  }>;
  error?: string;
}> {
  try {
    const ctx = await getTenantContext();
    assertPrincipalOrAdmin(ctx);

    const overview = await getStudentCredentialsOverview(filters);
    if (!overview.success || !overview.data) {
      return { success: false, schoolName: "", slips: [], error: overview.error };
    }

    const schoolName = overview.data[0]?.schoolName || "SỞ GIÁO DỤC VÀ ĐÀO TẠO";
    const className = filters?.classId ? overview.data[0]?.className : undefined;
    const todayStr = new Date().toLocaleDateString("vi-VN");

    const slips = overview.data.map((item) => ({
      id: item.id,
      studentCode: item.studentCode || "Chưa cấp mã",
      studentName: item.name,
      className: item.className,
      email: item.email,
      passwordHint: item.defaultPasswordHint,
      parentPhone: item.parentPhone || "Chưa cập nhật",
      generatedDate: todayStr,
    }));

    return { success: true, schoolName, className, slips };
  } catch (error: any) {
    return { success: false, schoolName: "", slips: [], error: error.message || "Lỗi tạo phiếu tài khoản học sinh" };
  }
}

