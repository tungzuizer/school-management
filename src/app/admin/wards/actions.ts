/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Administrative Region Management (`src/app/admin/wards/page.tsx`, `src/app/admin/wards/WardsClient.tsx`).
 * 2. Affected APIs: Server actions `getAdminWardsData`, `createDistrictWard`, `updateDistrictWard`, `deleteDistrictWard`.
 * 3. Schemas: Prisma models `EducationDepartment`, `DistrictWard`, `School`, `User`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Xây dựng trang Quản lý Tỉnh & Khu vực (/admin/wards) cho SuperAdmin.
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface WardDetailItem {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  phone: string | null;
  departmentId: string;
  departmentName: string;
  schoolsCount: number;
  usersCount: number;
  createdAt: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
  wardsCount: number;
  schoolsCount: number;
}

export async function getAdminWardsData(departmentId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập", wards: [], departments: [], stats: null };
    }

    const where: any = {};
    if (departmentId && departmentId !== "ALL") {
      where.departmentId = departmentId;
    }

    const [rawWards, rawDepartments, totalSchools, totalUsers] = await Promise.all([
      prisma.districtWard.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          _count: {
            select: {
              schools: true,
              users: true,
            },
          },
        },
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.educationDepartment.findMany({
        include: {
          _count: {
            select: {
              districtWards: true,
              schools: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.school.count(),
      prisma.user.count({
        where: {
          role: { in: [Role.DEPARTMENT_ADMIN, Role.WARD_ADMIN, Role.DISTRICT_ADMIN] },
        },
      }),
    ]);

    const wards: WardDetailItem[] = rawWards.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      address: w.address,
      phone: w.phone,
      departmentId: w.departmentId,
      departmentName: w.department?.name || "Chưa gắn Sở",
      schoolsCount: w._count.schools,
      usersCount: w._count.users,
      createdAt: w.createdAt.toISOString(),
    }));

    const departments: DepartmentOption[] = rawDepartments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      wardsCount: d._count.districtWards,
      schoolsCount: d._count.schools,
    }));

    const stats = {
      totalDepartments: departments.length,
      totalWards: wards.length,
      totalSchools,
      totalManagers: totalUsers,
    };

    return {
      success: true,
      wards,
      departments,
      stats,
    };
  } catch (error: any) {
    console.error("Error in getAdminWardsData:", error);
    return {
      success: false,
      error: error.message || "Lỗi tải dữ liệu khu vực",
      wards: [],
      departments: [],
      stats: null,
    };
  }
}

export async function createDistrictWard(data: {
  departmentId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.name?.trim()) return { success: false, error: "Vui lòng nhập tên Phòng GD&ĐT / Quận Huyện" };
    if (!data.departmentId) return { success: false, error: "Vui lòng chọn Sở GD&ĐT trực thuộc" };

    const newWard = await prisma.districtWard.create({
      data: {
        departmentId: data.departmentId,
        name: data.name.trim(),
        code: data.code?.trim() || null,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "DistrictWard",
      entityId: newWard.id,
      description: `Khởi tạo đơn vị quản lý mới: ${newWard.name}`,
    });

    revalidatePath("/admin/wards");
    return { success: true, data: newWard };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo mới khu vực" };
  }
}

export async function updateDistrictWard(
  id: string,
  data: {
    departmentId?: string;
    name?: string;
    code?: string;
    address?: string;
    phone?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const updated = await prisma.districtWard.update({
      where: { id },
      data: {
        departmentId: data.departmentId || undefined,
        name: data.name?.trim() || undefined,
        code: data.code !== undefined ? data.code.trim() : undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
        phone: data.phone !== undefined ? data.phone.trim() : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityName: "DistrictWard",
      entityId: id,
      description: `Cập nhật thông tin đơn vị quản lý: ${updated.name}`,
    });

    revalidatePath("/admin/wards");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật khu vực" };
  }
}

export async function deleteDistrictWard(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const target = await prisma.districtWard.findUnique({
      where: { id },
      include: { _count: { select: { schools: true, users: true } } },
    });

    if (!target) return { success: false, error: "Không tìm thấy khu vực" };
    if (target._count.schools > 0) {
      return {
        success: false,
        error: `Không thể xóa khu vực này vì đang có ${target._count.schools} trường học trực thuộc`,
      };
    }

    await prisma.districtWard.delete({ where: { id } });

    await recordAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityName: "DistrictWard",
      entityId: id,
      description: `Xóa đơn vị quản lý: ${target.name}`,
    });

    revalidatePath("/admin/wards");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa khu vực" };
  }
}
