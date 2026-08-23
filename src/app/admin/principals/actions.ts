"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
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
  createdAt: string;
}

export async function getPrincipalsAndAdmins(filters?: {
  departmentId?: string;
  districtWardId?: string;
  schoolId?: string;
  role?: string;
  status?: "ALL" | "APPROVED" | "PENDING";
  search?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập", data: [], departments: [], districtWards: [], schools: [] };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      currentUser?.role !== Role.ADMIN &&
      currentUser?.role !== Role.DEPARTMENT_ADMIN &&
      currentUser?.role !== Role.WARD_ADMIN
    ) {
      return { success: false, error: "Không có quyền quản trị cấp cao", data: [], departments: [], districtWards: [], schools: [] };
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
    if (filters?.role && filters.role !== "ALL") {
      where.role = filters.role as Role;
    }
    if (filters?.status === "APPROVED") {
      where.isApproved = true;
    } else if (filters?.status === "PENDING") {
      where.isApproved = false;
    }
    if (filters?.search && filters.search.trim()) {
      where.OR = [
        { name: { contains: filters.search.trim(), mode: "insensitive" } },
        { email: { contains: filters.search.trim(), mode: "insensitive" } },
      ];
    }

    const [users, departments, districtWards, schools] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          districtWard: { select: { id: true, name: true } },
          school: { select: { id: true, name: true } },
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
    ]);

    const formattedUsers: PrincipalUserItem[] = users.map((u) => ({
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
      createdAt: u.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: formattedUsers,
      departments,
      districtWards,
      schools,
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
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) return { success: false, error: "Không tìm thấy tài khoản" };

    let finalSchoolId = input.schoolId;
    let finalDeptId = input.departmentId;
    let finalWardId = input.districtWardId;

    if (finalSchoolId) {
      const sch = await prisma.school.findUnique({
        where: { id: finalSchoolId },
        select: { departmentId: true, districtWardId: true },
      });
      if (sch) {
        if (!finalDeptId && sch.departmentId) finalDeptId = sch.departmentId;
        if (!finalWardId && sch.districtWardId) finalWardId = sch.districtWardId;
      }
    }

    await prisma.user.update({
      where: { id: input.userId },
      data: {
        role: input.role || undefined,
        schoolId: finalSchoolId !== undefined ? finalSchoolId : undefined,
        departmentId: finalDeptId !== undefined ? finalDeptId : undefined,
        districtWardId: finalWardId !== undefined ? finalWardId : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Admin",
      userRole: session.user.role || "ADMIN",
      action: "UPDATE",
      entityName: "UserPrincipal",
      entityId: input.userId,
      description: `Điều chuyển/Cập nhật công tác tài khoản Hiệu trưởng: ${targetUser.name}`,
    });

    revalidatePath("/admin/principals");
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

    if (schoolId) {
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
      },
    });

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
