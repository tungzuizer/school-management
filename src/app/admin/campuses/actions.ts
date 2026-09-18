/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Campuses and School Points Management (`src/app/admin/campuses/page.tsx`, `src/app/admin/campuses/CampusesClient.tsx`).
 * 2. Affected APIs: Server actions `getAdminCampusesData`, `createCampus`, `updateCampus`, `deleteCampus`, `createSchoolPoint`, `updateSchoolPoint`, `deleteSchoolPoint`.
 * 3. Schemas: Prisma models `Campus`, `SchoolPoint`, `School`, `ClassRoom`, `User`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Xây dựng trung tâm Quản lý Cơ sở, Phân hiệu & Điểm trường (/admin/campuses).
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface SchoolPointItem {
  id: string;
  name: string;
  address: string | null;
  distanceKm: number | null;
  managerName: string | null;
  phone: string | null;
  classRoomsCount: number;
  createdAt: string;
}

export interface CampusItem {
  id: string;
  name: string;
  address: string | null;
  schoolId: string;
  schoolName: string;
  departmentName: string;
  districtWardName: string;
  schoolPoints: SchoolPointItem[];
  classRoomsCount: number;
  usersCount: number;
  createdAt: string;
}

export interface SchoolOption {
  id: string;
  name: string;
  departmentName?: string;
  districtWardName?: string;
  campusesCount: number;
}

export async function getAdminCampusesData(filters?: { schoolId?: string; search?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập", campuses: [], schools: [], stats: null };
    }

    const where: any = {};
    if (filters?.schoolId && filters.schoolId !== "ALL") {
      where.schoolId = filters.schoolId;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { school: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [rawCampuses, rawSchools, totalSchoolPoints, totalClassRooms] = await Promise.all([
      prisma.campus.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              department: { select: { name: true } },
              districtWard: { select: { name: true } },
            },
          },
          schoolPoints: {
            include: {
              _count: { select: { classRooms: true } },
            },
            orderBy: { name: "asc" },
          },
          _count: {
            select: {
              classRooms: true,
              users: true,
            },
          },
        },
        orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.school.findMany({
        select: {
          id: true,
          name: true,
          department: { select: { name: true } },
          districtWard: { select: { name: true } },
          _count: { select: { campuses: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.schoolPoint.count(),
      prisma.classRoom.count(),
    ]);

    const campuses: CampusItem[] = rawCampuses.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      schoolId: c.schoolId,
      schoolName: c.school?.name || "Chưa gắn trường",
      departmentName: c.school?.department?.name || "Bộ/Sở GD&ĐT",
      districtWardName: c.school?.districtWard?.name || "Toàn quốc",
      schoolPoints: c.schoolPoints.map((sp) => ({
        id: sp.id,
        name: sp.name,
        address: sp.address,
        distanceKm: sp.distanceKm,
        managerName: sp.managerName,
        phone: sp.phone,
        classRoomsCount: sp._count.classRooms,
        createdAt: sp.createdAt.toISOString(),
      })),
      classRoomsCount: c._count.classRooms,
      usersCount: c._count.users,
      createdAt: c.createdAt.toISOString(),
    }));

    const schools: SchoolOption[] = rawSchools.map((s) => ({
      id: s.id,
      name: s.name,
      departmentName: s.department?.name,
      districtWardName: s.districtWard?.name,
      campusesCount: s._count.campuses,
    }));

    const stats = {
      totalCampuses: rawCampuses.length,
      totalSchools: rawSchools.length,
      totalSchoolPoints,
      totalClassRooms,
    };

    return {
      success: true,
      campuses,
      schools,
      stats,
    };
  } catch (error: any) {
    console.error("Error in getAdminCampusesData:", error);
    return {
      success: false,
      error: error.message || "Lỗi tải dữ liệu cơ sở/phân hiệu",
      campuses: [],
      schools: [],
      stats: null,
    };
  }
}

export async function createCampus(data: { schoolId: string; name: string; address?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.name?.trim()) return { success: false, error: "Vui lòng nhập tên Cơ sở / Phân hiệu" };
    if (!data.schoolId) return { success: false, error: "Vui lòng chọn Trường học trực thuộc" };

    const newCampus = await prisma.campus.create({
      data: {
        schoolId: data.schoolId,
        name: data.name.trim(),
        address: data.address?.trim() || null,
      },
    });

    // Automatically create a default central school point for convenience
    await prisma.schoolPoint.create({
      data: {
        campusId: newCampus.id,
        name: "Điểm trường Trung tâm",
        address: data.address?.trim() || null,
        distanceKm: 0,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "Campus",
      entityId: newCampus.id,
      description: `Khởi tạo Cơ sở/Phân hiệu mới: ${newCampus.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true, data: newCampus };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo mới cơ sở" };
  }
}

export async function updateCampus(id: string, data: { schoolId?: string; name?: string; address?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const updated = await prisma.campus.update({
      where: { id },
      data: {
        schoolId: data.schoolId || undefined,
        name: data.name?.trim() || undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityName: "Campus",
      entityId: id,
      description: `Cập nhật thông tin Cơ sở/Phân hiệu: ${updated.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật cơ sở" };
  }
}

export async function deleteCampus(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const target = await prisma.campus.findUnique({
      where: { id },
      include: { _count: { select: { classRooms: true, users: true } } },
    });

    if (!target) return { success: false, error: "Không tìm thấy cơ sở" };
    if (target._count.classRooms > 0) {
      return {
        success: false,
        error: `Không thể xóa cơ sở này vì đang có ${target._count.classRooms} lớp học đang hoạt động`,
      };
    }

    await prisma.campus.delete({ where: { id } });

    await recordAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityName: "Campus",
      entityId: id,
      description: `Xóa Cơ sở/Phân hiệu: ${target.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa cơ sở" };
  }
}

export async function createSchoolPoint(data: {
  campusId: string;
  name: string;
  address?: string;
  distanceKm?: number;
  managerName?: string;
  phone?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.name?.trim()) return { success: false, error: "Vui lòng nhập tên Điểm trường" };
    if (!data.campusId) return { success: false, error: "Vui lòng chọn Cơ sở trực thuộc" };

    const newPoint = await prisma.schoolPoint.create({
      data: {
        campusId: data.campusId,
        name: data.name.trim(),
        address: data.address?.trim() || null,
        distanceKm: data.distanceKm !== undefined ? Number(data.distanceKm) : 0,
        managerName: data.managerName?.trim() || null,
        phone: data.phone?.trim() || null,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "SchoolPoint",
      entityId: newPoint.id,
      description: `Thêm Điểm trường vệ tinh: ${newPoint.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true, data: newPoint };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo mới điểm trường" };
  }
}

export async function updateSchoolPoint(
  id: string,
  data: {
    name?: string;
    address?: string;
    distanceKm?: number;
    managerName?: string;
    phone?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const updated = await prisma.schoolPoint.update({
      where: { id },
      data: {
        name: data.name?.trim() || undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
        distanceKm: data.distanceKm !== undefined ? Number(data.distanceKm) : undefined,
        managerName: data.managerName !== undefined ? data.managerName.trim() : undefined,
        phone: data.phone !== undefined ? data.phone.trim() : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityName: "SchoolPoint",
      entityId: id,
      description: `Cập nhật Điểm trường: ${updated.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật điểm trường" };
  }
}

export async function deleteSchoolPoint(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const target = await prisma.schoolPoint.findUnique({
      where: { id },
      include: { _count: { select: { classRooms: true } } },
    });

    if (!target) return { success: false, error: "Không tìm thấy điểm trường" };
    if (target._count.classRooms > 0) {
      return {
        success: false,
        error: `Không thể xóa điểm trường này vì đang có ${target._count.classRooms} lớp học`,
      };
    }

    await prisma.schoolPoint.delete({ where: { id } });

    await recordAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityName: "SchoolPoint",
      entityId: id,
      description: `Xóa Điểm trường: ${target.name}`,
    });

    revalidatePath("/admin/campuses");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa điểm trường" };
  }
}
