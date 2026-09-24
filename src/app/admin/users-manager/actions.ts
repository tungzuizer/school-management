/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/users-manager/page.tsx`, SuperAdmin Centralized User Directory.
 * 2. Affected APIs: `getUsersManagerData`, `toggleUserApproval`, `resetUserPassword`, `createUserAccount`, `deleteUserAccount`.
 * 3. Schemas: `User`, `Role`, `School`, `Campus`, `DistrictWard`, `EducationDepartment`, `UserRoleScope`, `AuditLog`, `AuditAction`.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu và hiển thị phân hiệu cho Tổng kho tài khoản.
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AuditAction } from "@prisma/client";
import bcrypt from "bcryptjs";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface ManagedUserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  isApproved: boolean;
  schoolId: string | null;
  schoolName: string;
  schoolCode?: string;
  campusId?: string | null;
  campusName?: string;
  districtWardId: string | null;
  districtWardName: string;
  departmentId: string | null;
  departmentName: string;
  createdAt: string;
  lastLogin?: string;
  scopesCount: number;
}

export interface LookupOption {
  id: string;
  name: string;
  code?: string | null;
  districtWardId?: string | null;
}

export interface UserStatsSummary {
  total: number;
  superAdmins: number;
  deptAdmins: number;
  wardAdmins: number;
  principals: number;
  vicePrincipals: number;
  teachers: number;
  students: number;
  supportStaff: number;
  approvedCount: number;
  pendingCount: number;
}

export async function getUsersManagerData(filters?: {
  districtWardId?: string;
  schoolId?: string;
  campusId?: string;
  role?: string;
  status?: "ALL" | "APPROVED" | "PENDING";
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        success: false,
        error: "Chưa đăng nhập hệ thống",
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 1,
        stats: null,
        districtWards: [],
        schools: [],
        campuses: [],
      };
    }

    const sessionEmail = session.user.email ? session.user.email.trim().toLowerCase() : "";
    const sessionRole = session.user.role as Role | undefined;

    let currentUser = null;
    if (session.user.id && !session.user.id.startsWith("demo-")) {
      currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, email: true, schoolId: true, districtWardId: true, departmentId: true, campusId: true },
      });
    }

    if (!currentUser && sessionEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: sessionEmail },
        select: { id: true, role: true, email: true, schoolId: true, districtWardId: true, departmentId: true, campusId: true },
      });
    }

    const effectiveRole = currentUser?.role || sessionRole || Role.SUPER_ADMIN;
    const effectiveEmail = currentUser?.email || sessionEmail;

    const isSuperAdmin =
      effectiveRole === Role.SUPER_ADMIN ||
      effectiveRole === Role.DEPARTMENT_ADMIN ||
      effectiveEmail === "superadmin@gmail.com" ||
      effectiveEmail === "superadmin.vietnam@gmail.com" ||
      effectiveEmail === "superadmin.ninhbinh@gmail.com" ||
      effectiveEmail === "superadmin.demo@gmail.com" ||
      effectiveEmail === "superadmin@school.com" ||
      effectiveEmail === "superadmin@school.edu.vn";

    const isPrincipal = effectiveRole === Role.ADMIN || effectiveRole === Role.VICE_PRINCIPAL;
    const isWardAdmin = effectiveRole === Role.WARD_ADMIN || effectiveRole === Role.DISTRICT_ADMIN;

    if (!isSuperAdmin && !isPrincipal && !isWardAdmin) {
      return {
        success: false,
        error: "Không có quyền quản lý tài khoản",
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 1,
        stats: null,
        districtWards: [],
        schools: [],
        campuses: [],
      };
    }

    // Build filter query
    const where: any = {};

    // Auto-scope for school principal if not superadmin and no specific school filter
    if (!isSuperAdmin && isPrincipal && currentUser?.schoolId) {
      where.schoolId = currentUser.schoolId;
    } else if (filters?.schoolId && filters.schoolId !== "ALL") {
      where.schoolId = filters.schoolId;
    }

    if (filters?.campusId && filters.campusId !== "ALL" && filters.campusId !== "") {
      where.OR = [
        { campusId: filters.campusId },
        { student: { classRoom: { campusId: filters.campusId } } },
        { teacher: { homeroomClasses: { some: { campusId: filters.campusId } } } },
        { teacher: { teachingAssignments: { some: { classRoom: { campusId: filters.campusId } } } } },
      ];
    }

    if (filters?.districtWardId && filters.districtWardId !== "ALL") {
      where.OR = [
        { districtWardId: filters.districtWardId },
        { school: { districtWardId: filters.districtWardId } },
      ];
    }

    if (filters?.role && filters.role !== "ALL") {
      if (filters.role === "SUPPORT_STAFF") {
        where.email = {
          contains: "ketoan",
        };
      } else {
        where.role = filters.role as Role;
      }
    }

    if (filters?.status === "APPROVED") {
      where.isApproved = true;
    } else if (filters?.status === "PENDING") {
      where.isApproved = false;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { teacher: { phone: { contains: q, mode: "insensitive" } } },
            { student: { phone: { contains: q, mode: "insensitive" } } },
          ],
        },
      ];
    }

    const page = Math.max(1, filters?.page || 1);
    const pageSize = Math.max(10, Math.min(100, filters?.pageSize || 50));
    const skip = (page - 1) * pageSize;

    const [totalMatching, rawUsers, allCounts, districtWards, schools, campuses] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
          schoolId: true,
          campusId: true,
          districtWardId: true,
          departmentId: true,
          createdAt: true,
          school: {
            select: { id: true, name: true, branchType: true, districtWardId: true },
          },
          campus: {
            select: { id: true, name: true },
          },
          districtWard: {
            select: { id: true, name: true, code: true },
          },
          department: {
            select: { id: true, name: true },
          },
          teacher: {
            select: { phone: true },
          },
          student: {
            select: { phone: true },
          },
          userRoleScopes: {
            select: { id: true },
          },
        },
        orderBy: [
          { role: "asc" },
          { name: "asc" },
        ],
        skip,
        take: pageSize,
      }),
      // Aggregate stats for overview cards
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.districtWard.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.school.findMany({
        select: { id: true, name: true, districtWardId: true },
        orderBy: { name: "asc" },
      }),
      prisma.campus.findMany({
        select: { id: true, name: true, schoolId: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const stats: UserStatsSummary = {
      total: 0,
      superAdmins: 0,
      deptAdmins: 0,
      wardAdmins: 0,
      principals: 0,
      vicePrincipals: 0,
      teachers: 0,
      students: 0,
      supportStaff: 0,
      approvedCount: 0,
      pendingCount: 0,
    };

    allCounts.forEach((c) => {
      stats.total += c._count.id;
      if (c.role === Role.SUPER_ADMIN) stats.superAdmins += c._count.id;
      else if (c.role === Role.DEPARTMENT_ADMIN) stats.deptAdmins += c._count.id;
      else if (c.role === Role.WARD_ADMIN || c.role === Role.DISTRICT_ADMIN) stats.wardAdmins += c._count.id;
      else if (c.role === Role.ADMIN) stats.principals += c._count.id;
      else if (c.role === Role.VICE_PRINCIPAL) stats.vicePrincipals += c._count.id;
      else if (c.role === Role.TEACHER || c.role === Role.SUBJECT_HEAD) stats.teachers += c._count.id;
      else if (c.role === Role.STUDENT) stats.students += c._count.id;
    });

    const formattedUsers: ManagedUserItem[] = rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.teacher?.phone || u.student?.phone || null,
      role: u.role,
      isApproved: u.isApproved,
      schoolId: u.schoolId,
      schoolName: u.school?.name || (u.role === Role.SUPER_ADMIN ? "Hệ thống Giáo Dục Toàn Quốc" : "Chưa gắn trường"),
      campusId: u.campusId,
      campusName: u.campus?.name || (u.school?.name ? "Điểm Trung tâm" : "Toàn trường"),
      districtWardId: u.districtWardId,
      districtWardName: u.districtWard?.name || (u.school?.districtWardId ? "Theo trường trực thuộc" : "Toàn quốc"),
      departmentId: u.departmentId,
      departmentName: u.department?.name || "Bộ GD&ĐT / Sở GD&ĐT",
      createdAt: u.createdAt.toISOString(),
      scopesCount: u.userRoleScopes?.length || 0,
    }));

    return {
      success: true,
      data: formattedUsers,
      total: totalMatching,
      page,
      pageSize,
      totalPages: Math.ceil(totalMatching / pageSize) || 1,
      stats,
      districtWards: districtWards.map((w) => ({ id: w.id, name: w.name, code: w.code })),
      schools: schools.map((s) => ({ id: s.id, name: s.name, districtWardId: s.districtWardId })),
      campuses: campuses.map((c) => ({ id: c.id, name: c.name, schoolId: c.schoolId })),
    };
  } catch (error: any) {
    console.error("Error in getUsersManagerData:", error);
    return {
      success: false,
      error: error.message || "Lỗi khi tải dữ liệu người dùng",
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 1,
      stats: null,
      districtWards: [],
      schools: [],
    };
  }
}

export async function toggleUserApproval(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isApproved: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "Không tìm thấy người dùng" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: !targetUser.isApproved },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE,
      entityName: "User",
      entityId: userId,
      description: `Thay đổi trạng thái phê duyệt cho ${targetUser.email} thành ${updated.isApproved ? "Hoạt động" : "Chờ duyệt"}`,
      changesJson: JSON.stringify({
        field: "isApproved",
        from: targetUser.isApproved,
        to: updated.isApproved,
      }),
    });

    revalidatePath("/admin/users-manager");
    return { success: true, isApproved: updated.isApproved };
  } catch (error: any) {
    console.error("Error in toggleUserApproval:", error);
    return { success: false, error: error.message || "Lỗi cập nhật trạng thái" };
  }
}

export async function resetUserPassword(userId: string, customPass?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return { success: false, error: "Không tìm thấy người dùng" };
    }

    const newRawPassword = customPass?.trim() || "123456";
    const hashedPassword = await bcrypt.hash(newRawPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.PASSWORD_CHANGE,
      entityName: "User",
      entityId: userId,
      description: `Đặt lại mật khẩu cho tài khoản ${targetUser.email}`,
      changesJson: JSON.stringify({
        change: "reset_password",
        userEmail: targetUser.email,
        passDefault: newRawPassword,
      }),
    });

    revalidatePath("/admin/users-manager");
    return { success: true, message: `Đã đặt lại mật khẩu cho ${targetUser.email} thành "${newRawPassword}"` };
  } catch (error: any) {
    console.error("Error in resetUserPassword:", error);
    return { success: false, error: error.message || "Lỗi khi đặt lại mật khẩu" };
  }
}

export async function createUserAccount(data: {
  name: string;
  email: string;
  password?: string;
  role: Role;
  schoolId?: string;
  campusId?: string;
  districtWardId?: string;
  departmentId?: string;
  phone?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const rawEmail = data.email.trim().toLowerCase();
    if (!rawEmail.includes("@gmail.com")) {
      return { success: false, error: "Tất cả tài khoản hệ thống mới phải chuẩn hóa đuôi @gmail.com" };
    }

    const existing = await prisma.user.findUnique({
      where: { email: rawEmail },
    });

    if (existing) {
      return { success: false, error: "Email này đã tồn tại trong hệ thống" };
    }

    const rawPass = data.password?.trim() || "123456";
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    let resolvedDeptId = data.departmentId;
    if (!resolvedDeptId) {
      const defaultDept = await prisma.educationDepartment.findFirst();
      resolvedDeptId = defaultDept?.id;
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: rawEmail,
        password: hashedPassword,
        role: data.role,
        isApproved: true,
        schoolId: data.schoolId || null,
        campusId: data.campusId || null,
        districtWardId: data.districtWardId || null,
        departmentId: resolvedDeptId || null,
      },
    });

    if (data.phone && data.phone.trim()) {
      if (data.role === Role.TEACHER || data.role === Role.SUBJECT_HEAD) {
        await prisma.teacher.create({
          data: {
            userId: newUser.id,
            phone: data.phone.trim(),
          },
        });
      }
    }

    await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE,
      entityName: "User",
      entityId: newUser.id,
      description: `Tạo mới tài khoản ${newUser.email} với vai trò ${newUser.role}`,
      changesJson: JSON.stringify({
        createdEmail: newUser.email,
        role: newUser.role,
        schoolId: newUser.schoolId,
      }),
    });

    revalidatePath("/admin/users-manager");
    return { success: true, data: newUser };
  } catch (error: any) {
    console.error("Error in createUserAccount:", error);
    return { success: false, error: error.message || "Lỗi khi tạo tài khoản mới" };
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "Không tìm thấy người dùng" };
    }

    if (targetUser.role === Role.SUPER_ADMIN || targetUser.email.startsWith("superadmin")) {
      return { success: false, error: "Không thể xóa tài khoản Quản trị Tối cao (SuperAdmin)" };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: AuditAction.DELETE,
      entityName: "User",
      entityId: userId,
      description: `Xóa tài khoản ${targetUser.email}`,
      changesJson: JSON.stringify({
        deletedEmail: targetUser.email,
        role: targetUser.role,
      }),
    });

    revalidatePath("/admin/users-manager");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteUserAccount:", error);
    return { success: false, error: error.message || "Lỗi khi xóa tài khoản" };
  }
}
