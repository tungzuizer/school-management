/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/principals/page.tsx`.
 * 2. Affected APIs: `getPrincipalsAndAdmins`, `togglePrincipalApproval`, `updatePrincipalAssignment`, `createPrincipalAccount`, `deletePrincipalAccount`.
 * 3. Schemas: `PrincipalUserItem`, `Role`, `User`, `School`, `DistrictWard`, `EducationDepartment`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn".
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, ScopeType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface PrincipalUserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isApproved: boolean;
  departmentId: string | null;
  departmentName: string;
  districtWardId: string | null;
  districtWardName: string;
  schoolId: string | null;
  schoolName: string;
  campusId: string | null;
  campusName: string;
  createdAt: string;
}

export interface CampusOptionItem {
  id: string;
  name: string;
  schoolId: string;
}

export async function getPrincipalsAndAdmins(filters?: {
  departmentId?: string;
  districtWardId?: string;
  schoolId?: string;
  campusId?: string;
  role?: string;
  status?: "ALL" | "APPROVED" | "PENDING";
  search?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập", data: [], departments: [], districtWards: [], schools: [], campuses: [] };
    }

    const sessionEmail = session.user.email ? session.user.email.trim().toLowerCase() : "";
    const sessionRole = session.user.role as Role | undefined;

    let currentUser = null;
    if (session.user.id && !session.user.id.startsWith("demo-")) {
      currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, email: true, schoolId: true, districtWardId: true, departmentId: true },
      });
    }

    if (!currentUser && sessionEmail) {
      currentUser = await prisma.user.findUnique({
        where: { email: sessionEmail },
        select: { id: true, role: true, email: true, schoolId: true, districtWardId: true, departmentId: true },
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

    if (
      !isSuperAdmin &&
      effectiveRole !== Role.ADMIN &&
      effectiveRole !== Role.WARD_ADMIN
    ) {
      return { success: false, error: "Không có quyền quản trị cấp cao", data: [], departments: [], districtWards: [], schools: [], campuses: [] };
    }

    const where: any = {
      role: {
        in: [Role.ADMIN, Role.VICE_PRINCIPAL, Role.DEPARTMENT_ADMIN, Role.WARD_ADMIN],
      },
    };

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }
    if (filters?.districtWardId) {
      where.districtWardId = filters.districtWardId;
    }
    if (filters?.schoolId) {
      where.schoolId = filters.schoolId;
    }
    if (filters?.campusId) {
      where.OR = [
        { campusId: filters.campusId },
        {
          userRoleScopes: {
            some: {
              role: Role.VICE_PRINCIPAL,
              scopeType: ScopeType.CAMPUS,
              scopeId: filters.campusId,
            },
          },
        },
      ];
    }
    if (filters?.role && filters.role !== "ALL") {
      where.role = filters.role as Role;
    }
    if (filters?.status === "APPROVED") {
      where.isApproved = true;
    } else if (filters?.status === "PENDING") {
      where.isApproved = false;
    }
    if (filters?.search && filters.search.trim()) {
      const searchCondition = [
        { name: { contains: filters.search.trim(), mode: "insensitive" } },
        { email: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const [users, departments, districtWards, schools, rawCampuses] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          districtWard: { select: { id: true, name: true } },
          school: { select: { id: true, name: true } },
          campus: { select: { id: true, name: true } },
          userRoleScopes: {
            where: { role: Role.VICE_PRINCIPAL, scopeType: ScopeType.CAMPUS },
            select: { scopeId: true },
          },
        },
        orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      }),
      prisma.educationDepartment.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.districtWard.findMany({
        select: { id: true, name: true, departmentId: true },
        orderBy: { name: "asc" },
      }),
      prisma.school.findMany({
        select: { id: true, name: true, departmentId: true, districtWardId: true },
        orderBy: { name: "asc" },
      }),
      prisma.campus.findMany({
        select: { id: true, name: true, schoolId: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const formattedUsers: PrincipalUserItem[] = users.map((u) => {
      const scopeCampusId = u.userRoleScopes?.[0]?.scopeId || null;
      const effectiveCampusId = u.campusId || scopeCampusId;
      let effectiveCampusName = u.campus?.name;
      if (!effectiveCampusName && effectiveCampusId) {
        effectiveCampusName = rawCampuses.find((c) => c.id === effectiveCampusId)?.name;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isApproved: u.isApproved,
        departmentId: u.departmentId,
        departmentName: u.department?.name || "Sở GD&ĐT (Chưa chọn)",
        districtWardId: u.districtWardId,
        districtWardName: u.districtWard?.name || "Phòng GD&ĐT (Chưa chọn)",
        schoolId: u.schoolId,
        schoolName: u.school?.name || "Chưa gán Trường",
        campusId: effectiveCampusId,
        campusName:
          u.role === Role.VICE_PRINCIPAL
            ? effectiveCampusName || "Chưa phân công phân hiệu"
            : effectiveCampusName || "Toàn trường",
        createdAt: u.createdAt.toISOString(),
      };
    });

    return {
      success: true,
      data: formattedUsers,
      departments,
      districtWards,
      schools,
      campuses: rawCampuses,
    };
  } catch (error: any) {
    console.error("Error fetching principals and admins:", error);
    return {
      success: false,
      error: "Lỗi hệ thống: " + (error.message || ""),
      data: [],
      departments: [],
      districtWards: [],
      schools: [],
      campuses: [],
    };
  }
}

export async function togglePrincipalApproval(userId: string, isApproved: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) return { success: false, error: "Không tìm thấy tài khoản" };

    await prisma.user.update({
      where: { id: userId },
      data: { isApproved },
    });

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: isApproved ? "APPROVE" : "REJECT",
      entityName: "UserPrincipal",
      entityId: userId,
      description: `${isApproved ? "Phê duyệt" : "Hủy quyền"} tài khoản Cán bộ/Hiệu trưởng: ${targetUser.name} (${targetUser.email})`,
    });

    revalidatePath("/admin/principals");
    revalidatePath("/admin/approvals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật trạng thái phê duyệt" };
  }
}

export async function updatePrincipalAssignment(input: {
  userId: string;
  role?: Role;
  schoolId?: string | null;
  departmentId?: string | null;
  districtWardId?: string | null;
  campusId?: string | null;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, name: true, email: true, role: true, schoolId: true, campusId: true },
    });

    if (!targetUser) return { success: false, error: "Không tìm thấy tài khoản" };

    let finalSchoolId = input.schoolId;
    let finalDeptId = input.departmentId;
    let finalWardId = input.districtWardId;
    let finalCampusId = input.campusId;

    if (finalCampusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: finalCampusId },
        select: { schoolId: true, school: { select: { departmentId: true, districtWardId: true } } },
      });
      if (campus) {
        if (!finalSchoolId) finalSchoolId = campus.schoolId;
        if (!finalDeptId && campus.school?.departmentId) finalDeptId = campus.school.departmentId;
        if (!finalWardId && campus.school?.districtWardId) finalWardId = campus.school.districtWardId;
      }
    }

    if (finalSchoolId && (!finalDeptId || !finalWardId)) {
      const sch = await prisma.school.findUnique({
        where: { id: finalSchoolId },
        select: { departmentId: true, districtWardId: true },
      });
      if (sch) {
        if (!finalDeptId && sch.departmentId) finalDeptId = sch.departmentId;
        if (!finalWardId && sch.districtWardId) finalWardId = sch.districtWardId;
      }
    }

    const effectiveRole = input.role || targetUser.role;

    // If role is ADMIN (Hiệu trưởng), campusId is null (Toàn trường)
    if (input.role === Role.ADMIN) {
      finalCampusId = null;
    }

    await prisma.user.update({
      where: { id: input.userId },
      data: {
        role: input.role || undefined,
        schoolId: finalSchoolId !== undefined ? finalSchoolId : undefined,
        departmentId: finalDeptId !== undefined ? finalDeptId : undefined,
        districtWardId: finalWardId !== undefined ? finalWardId : undefined,
        campusId: finalCampusId !== undefined ? finalCampusId : undefined,
      },
    });

    // Update UserRoleScope for VICE_PRINCIPAL
    if (effectiveRole === Role.VICE_PRINCIPAL && finalCampusId !== undefined) {
      // Remove old campus scopes
      await prisma.userRoleScope.deleteMany({
        where: {
          userId: input.userId,
          role: Role.VICE_PRINCIPAL,
          scopeType: ScopeType.CAMPUS,
        },
      });

      // Insert new scope if assigned to a specific campus
      if (finalCampusId) {
        await prisma.userRoleScope.create({
          data: {
            userId: input.userId,
            role: Role.VICE_PRINCIPAL,
            scopeType: ScopeType.CAMPUS,
            scopeId: finalCampusId,
          },
        });
      }
    } else if (input.role && input.role !== Role.VICE_PRINCIPAL) {
      // Clean up campus scopes if no longer VP
      await prisma.userRoleScope.deleteMany({
        where: {
          userId: input.userId,
          role: Role.VICE_PRINCIPAL,
          scopeType: ScopeType.CAMPUS,
        },
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: "UPDATE",
      entityName: "UserPrincipal",
      entityId: input.userId,
      description: `Điều chuyển/Cập nhật công tác tài khoản Cán bộ/Hiệu trưởng: ${targetUser.name}`,
    });

    revalidatePath("/admin/principals");
    revalidatePath("/admin/campuses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi cập nhật công tác" };
  }
}

export async function createPrincipalAccount(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  schoolId?: string;
  departmentId?: string;
  districtWardId?: string;
  campusId?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.name || !data.name.trim()) return { success: false, error: "Vui lòng nhập Họ tên" };
    if (!data.email || !data.email.trim()) return { success: false, error: "Vui lòng nhập Email" };
    if (!data.password || data.password.length < 6) return { success: false, error: "Mật khẩu tối thiểu 6 ký tự" };

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) return { success: false, error: "Email này đã tồn tại trong hệ thống" };

    let schoolId = data.schoolId || undefined;
    let deptId = data.departmentId || undefined;
    let wardId = data.districtWardId || undefined;
    let campusId = data.role === Role.ADMIN ? undefined : (data.campusId || undefined);

    if (campusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: campusId },
        select: { schoolId: true, school: { select: { departmentId: true, districtWardId: true } } },
      });
      if (campus) {
        if (!schoolId) schoolId = campus.schoolId;
        if (!deptId && campus.school?.departmentId) deptId = campus.school.departmentId;
        if (!wardId && campus.school?.districtWardId) wardId = campus.school.districtWardId;
      }
    }

    if (schoolId && (!deptId || !wardId)) {
      const sch = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { departmentId: true, districtWardId: true },
      });
      if (sch) {
        if (!deptId && sch.departmentId) deptId = sch.departmentId;
        if (!wardId && sch.districtWardId) wardId = sch.districtWardId;
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: data.role,
        isApproved: true,
        schoolId,
        departmentId: deptId,
        districtWardId: wardId,
        campusId,
      },
    });

    if (data.role === Role.VICE_PRINCIPAL && campusId) {
      await prisma.userRoleScope.create({
        data: {
          userId: newUser.id,
          role: Role.VICE_PRINCIPAL,
          scopeType: ScopeType.CAMPUS,
          scopeId: campusId,
        },
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: "CREATE",
      entityName: "UserPrincipal",
      entityId: newUser.id,
      description: `Khởi tạo tài khoản Cán bộ/Hiệu trưởng mới: ${newUser.name} (${cleanEmail})`,
    });

    revalidatePath("/admin/principals");
    revalidatePath("/admin/campuses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi tạo tài khoản" };
  }
}

export async function deletePrincipalAccount(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (userId === session.user.id) {
      return { success: false, error: "Bạn không thể tự xóa tài khoản của chính mình" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Tài khoản không tồn tại" };

    await prisma.user.delete({ where: { id: userId } });

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: "DELETE",
      entityName: "UserPrincipal",
      entityId: userId,
      description: `Xóa tài khoản Hiệu trưởng/Cán bộ: ${user.name} (${user.email})`,
    });

    revalidatePath("/admin/principals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa tài khoản" };
  }
}

export async function resetUserPassword(userId: string, newPassword?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const userRole = session.user.role;
    const isSuperAdmin =
      session.user.email === "superadmin@gmail.com" ||
      session.user.email === "superadmin.vietnam@gmail.com" ||
      session.user.email === "superadmin.ninhbinh@gmail.com" ||
      session.user.email === "superadmin.demo@gmail.com" ||
      session.user.email === "superadmin@school.com" ||
      (session.user as any).role === "SUPER_ADMIN" ||
      userRole === "ADMIN";

    if (!isSuperAdmin) {
      return { success: false, error: "Chỉ Quản trị viên cấp cao mới có quyền đặt lại mật khẩu" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Không tìm thấy tài khoản" };

    const passwordToSet = newPassword && newPassword.trim() ? newPassword.trim() : "123456";
    if (passwordToSet.length < 6) {
      return { success: false, error: "Mật khẩu tối thiểu 6 ký tự" };
    }

    const hashedPassword = await bcrypt.hash(passwordToSet, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: "UPDATE",
      entityName: "UserPassword",
      entityId: userId,
      description: `Đổi/Đặt lại mật khẩu cho tài khoản: ${user.name} (${user.email})`,
    });

    revalidatePath("/admin/principals");
    return { success: true, newPassword: passwordToSet };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi đặt lại mật khẩu" };
  }
}
