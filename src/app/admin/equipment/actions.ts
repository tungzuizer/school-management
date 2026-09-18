/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin Equipment Management (`src/app/admin/equipment/page.tsx`, `src/app/admin/equipment/EquipmentClient.tsx`).
 * 2. Affected APIs: Server actions `getAdminEquipmentData`, `createEquipment`, `updateEquipment`, `deleteEquipment`, `createEquipmentTransfer`, `updateTransferStatus`.
 * 3. Schemas: Prisma models `Equipment`, `EquipmentTransfer`, `School`, `Campus`, `SchoolPoint`.
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn" - Xây dựng trung tâm Quản lý Thiết bị số & Cơ sở vật chất (/admin/equipment).
 */

"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EquipmentCategory, EquipmentCondition, TransferStatus } from "@prisma/client";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  brokenQuantity: number;
  condition: EquipmentCondition;
  unit: string;
  locationDetail: string | null;
  schoolId: string;
  schoolName: string;
  campusId: string | null;
  campusName: string | null;
  schoolPointId: string | null;
  schoolPointName: string | null;
  createdAt: string;
}

export interface EquipmentTransferItem {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  schoolId: string;
  schoolName: string;
  fromSchoolPointId: string | null;
  fromPointName: string | null;
  toSchoolPointId: string;
  toPointName: string;
  quantity: number;
  transferDate: string;
  returnExpectedDate: string | null;
  actualReturnDate: string | null;
  reason: string;
  status: TransferStatus;
  aiRecommendation: string | null;
  createdAt: string;
}

export interface EquipmentFilterLookup {
  schools: Array<{ id: string; name: string }>;
  campuses: Array<{ id: string; name: string; schoolId: string }>;
  schoolPoints: Array<{ id: string; name: string; campusId: string }>;
}

export async function getAdminEquipmentData(filters?: {
  schoolId?: string;
  campusId?: string;
  category?: string;
  condition?: string;
  search?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập hệ thống",
        equipment: [],
        transfers: [],
        lookup: { schools: [], campuses: [], schoolPoints: [] },
        stats: null,
      };
    }

    const where: any = {};
    if (filters?.schoolId && filters.schoolId !== "ALL") {
      where.schoolId = filters.schoolId;
    }
    if (filters?.campusId && filters.campusId !== "ALL") {
      where.campusId = filters.campusId;
    }
    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category as EquipmentCategory;
    }
    if (filters?.condition && filters.condition !== "ALL") {
      where.condition = filters.condition as EquipmentCondition;
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { locationDetail: { contains: q, mode: "insensitive" } },
        { school: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [rawEquipment, rawTransfers, rawSchools, rawCampuses, rawSchoolPoints] =
      await Promise.all([
        prisma.equipment.findMany({
          where,
          include: {
            school: { select: { id: true, name: true } },
            campus: { select: { id: true, name: true } },
            schoolPoint: { select: { id: true, name: true } },
          },
          orderBy: [{ school: { name: "asc" } }, { category: "asc" }, { name: "asc" }],
        }),
        prisma.equipmentTransfer.findMany({
          include: {
            equipment: { select: { id: true, name: true, code: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        prisma.school.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.campus.findMany({
          select: { id: true, name: true, schoolId: true },
          orderBy: { name: "asc" },
        }),
        prisma.schoolPoint.findMany({
          select: { id: true, name: true, campusId: true },
          orderBy: { name: "asc" },
        }),
      ]);

    // Map lookup maps
    const pointMap = new Map<string, string>();
    rawSchoolPoints.forEach((p) => pointMap.set(p.id, p.name));

    const schoolMap = new Map<string, string>();
    rawSchools.forEach((s) => schoolMap.set(s.id, s.name));

    const equipment: EquipmentItem[] = rawEquipment.map((eq) => ({
      id: eq.id,
      code: eq.code,
      name: eq.name,
      category: eq.category,
      totalQuantity: eq.totalQuantity,
      availableQuantity: eq.availableQuantity,
      inUseQuantity: eq.inUseQuantity,
      brokenQuantity: eq.brokenQuantity,
      condition: eq.condition,
      unit: eq.unit,
      locationDetail: eq.locationDetail,
      schoolId: eq.schoolId,
      schoolName: eq.school?.name || "Chưa gắn trường",
      campusId: eq.campusId,
      campusName: eq.campus?.name || null,
      schoolPointId: eq.schoolPointId,
      schoolPointName: eq.schoolPoint?.name || null,
      createdAt: eq.createdAt.toISOString(),
    }));

    const transfers: EquipmentTransferItem[] = rawTransfers.map((tr) => ({
      id: tr.id,
      equipmentId: tr.equipmentId,
      equipmentName: tr.equipment?.name || "Thiết bị không rõ",
      equipmentCode: tr.equipment?.code || "N/A",
      schoolId: tr.schoolId,
      schoolName: schoolMap.get(tr.schoolId) || "Chưa gắn trường",
      fromSchoolPointId: tr.fromSchoolPointId,
      fromPointName: tr.fromSchoolPointId ? pointMap.get(tr.fromSchoolPointId) || tr.fromSchoolPointId : "Kho Trung tâm",
      toSchoolPointId: tr.toSchoolPointId,
      toPointName: pointMap.get(tr.toSchoolPointId) || tr.toSchoolPointId,
      quantity: tr.quantity,
      transferDate: tr.transferDate.toISOString(),
      returnExpectedDate: tr.returnExpectedDate ? tr.returnExpectedDate.toISOString() : null,
      actualReturnDate: tr.actualReturnDate ? tr.actualReturnDate.toISOString() : null,
      reason: tr.reason,
      status: tr.status,
      aiRecommendation: tr.aiRecommendation,
      createdAt: tr.createdAt.toISOString(),
    }));

    const totalQuantityCount = rawEquipment.reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const itDevicesCount = rawEquipment
      .filter((eq) => eq.category === EquipmentCategory.IT_COMPUTER || eq.category === EquipmentCategory.PROJECTOR_SCREEN)
      .reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const labDevicesCount = rawEquipment
      .filter(
        (eq) =>
          eq.category === EquipmentCategory.LAB_PHYSICS ||
          eq.category === EquipmentCategory.LAB_CHEMISTRY ||
          eq.category === EquipmentCategory.LAB_BIOLOGY
      )
      .reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const brokenDevicesCount = rawEquipment.reduce((acc, curr) => acc + curr.brokenQuantity, 0);

    const stats = {
      totalEquipmentTypes: rawEquipment.length,
      totalQuantityCount,
      itDevicesCount,
      labDevicesCount,
      brokenDevicesCount,
    };

    return {
      success: true,
      equipment,
      transfers,
      lookup: {
        schools: rawSchools,
        campuses: rawCampuses,
        schoolPoints: rawSchoolPoints,
      },
      stats,
    };
  } catch (error: any) {
    console.error("Error in getAdminEquipmentData:", error);
    return {
      success: false,
      error: error.message || "Lỗi tải dữ liệu thiết bị cơ sở vật chất",
      equipment: [],
      transfers: [],
      lookup: { schools: [], campuses: [], schoolPoints: [] },
      stats: null,
    };
  }
}

export async function createEquipment(data: {
  schoolId: string;
  campusId?: string;
  schoolPointId?: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  totalQuantity: number;
  condition: EquipmentCondition;
  unit?: string;
  locationDetail?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.name?.trim()) return { success: false, error: "Vui lòng nhập tên thiết bị" };
    if (!data.code?.trim()) return { success: false, error: "Vui lòng nhập mã thiết bị (QR/Barcode)" };
    if (!data.schoolId) return { success: false, error: "Vui lòng chọn trường học trực thuộc" };

    const cleanCode = data.code.trim().toUpperCase();
    const existing = await prisma.equipment.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return { success: false, error: `Mã thiết bị '${cleanCode}' đã tồn tại trong hệ thống` };
    }

    const totalQty = Math.max(1, Number(data.totalQuantity) || 1);
    const isBroken = data.condition === EquipmentCondition.BROKEN;

    const newEquipment = await prisma.equipment.create({
      data: {
        schoolId: data.schoolId,
        campusId: data.campusId || null,
        schoolPointId: data.schoolPointId || null,
        code: cleanCode,
        name: data.name.trim(),
        category: data.category || EquipmentCategory.GENERAL,
        totalQuantity: totalQty,
        availableQuantity: isBroken ? 0 : totalQty,
        inUseQuantity: 0,
        brokenQuantity: isBroken ? totalQty : 0,
        condition: data.condition || EquipmentCondition.GOOD,
        unit: data.unit?.trim() || "bộ",
        locationDetail: data.locationDetail?.trim() || null,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "Equipment",
      entityId: newEquipment.id,
      description: `Thêm mới thiết bị: [${newEquipment.code}] ${newEquipment.name} (SL: ${newEquipment.totalQuantity})`,
    });

    revalidatePath("/admin/equipment");
    return { success: true, data: newEquipment };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo mới thiết bị" };
  }
}

export async function updateEquipment(
  id: string,
  data: {
    name?: string;
    category?: EquipmentCategory;
    totalQuantity?: number;
    availableQuantity?: number;
    inUseQuantity?: number;
    brokenQuantity?: number;
    condition?: EquipmentCondition;
    unit?: string;
    locationDetail?: string;
    campusId?: string;
    schoolPointId?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const current = await prisma.equipment.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Không tìm thấy thiết bị" };

    const totalQty = data.totalQuantity !== undefined ? Number(data.totalQuantity) : current.totalQuantity;
    const availableQty = data.availableQuantity !== undefined ? Number(data.availableQuantity) : current.availableQuantity;
    const inUseQty = data.inUseQuantity !== undefined ? Number(data.inUseQuantity) : current.inUseQuantity;
    const brokenQty = data.brokenQuantity !== undefined ? Number(data.brokenQuantity) : current.brokenQuantity;

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        name: data.name?.trim() || undefined,
        category: data.category || undefined,
        totalQuantity: totalQty,
        availableQuantity: availableQty,
        inUseQuantity: inUseQty,
        brokenQuantity: brokenQty,
        condition: data.condition || undefined,
        unit: data.unit?.trim() || undefined,
        locationDetail: data.locationDetail !== undefined ? data.locationDetail.trim() : undefined,
        campusId: data.campusId !== undefined ? (data.campusId || null) : undefined,
        schoolPointId: data.schoolPointId !== undefined ? (data.schoolPointId || null) : undefined,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityName: "Equipment",
      entityId: id,
      description: `Cập nhật thông tin thiết bị: [${updated.code}] ${updated.name}`,
    });

    revalidatePath("/admin/equipment");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật thiết bị" };
  }
}

export async function deleteEquipment(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const target = await prisma.equipment.findUnique({
      where: { id },
      include: { _count: { select: { transfersFrom: true } } },
    });

    if (!target) return { success: false, error: "Không tìm thấy thiết bị" };

    if (target._count.transfersFrom > 0) {
      return {
        success: false,
        error: `Không thể xóa vì thiết bị đang có ${target._count.transfersFrom} lượt điều chuyển trong lịch sử`,
      };
    }

    await prisma.equipment.delete({ where: { id } });

    await recordAuditLog({
      userId: session.user.id,
      action: "DELETE",
      entityName: "Equipment",
      entityId: id,
      description: `Xóa thiết bị: [${target.code}] ${target.name}`,
    });

    revalidatePath("/admin/equipment");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi xóa thiết bị" };
  }
}

export async function createEquipmentTransfer(data: {
  schoolId: string;
  equipmentId: string;
  fromSchoolPointId?: string;
  toSchoolPointId: string;
  quantity: number;
  reason: string;
  returnExpectedDate?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    if (!data.equipmentId) return { success: false, error: "Vui lòng chọn thiết bị điều chuyển" };
    if (!data.toSchoolPointId) return { success: false, error: "Vui lòng chọn điểm trường tiếp nhận" };
    if (!data.reason?.trim()) return { success: false, error: "Vui lòng nhập lý do điều chuyển" };

    const equipment = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
    if (!equipment) return { success: false, error: "Không tìm thấy thiết bị" };

    const qty = Math.max(1, Number(data.quantity) || 1);
    if (equipment.availableQuantity < qty) {
      return {
        success: false,
        error: `Số lượng khả dụng (${equipment.availableQuantity}) không đủ để điều chuyển ${qty} thiết bị`,
      };
    }

    const newTransfer = await prisma.equipmentTransfer.create({
      data: {
        schoolId: data.schoolId || equipment.schoolId,
        equipmentId: data.equipmentId,
        fromSchoolPointId: data.fromSchoolPointId || equipment.schoolPointId || null,
        toSchoolPointId: data.toSchoolPointId,
        quantity: qty,
        reason: data.reason.trim(),
        status: TransferStatus.PENDING,
        returnExpectedDate: data.returnExpectedDate ? new Date(data.returnExpectedDate) : null,
        aiRecommendation: `Đề xuất điều phối tự động: Phục vụ giảng dạy trực quan tại điểm trường vệ tinh trong ${data.returnExpectedDate ? "thời hạn dự kiến" : "học kỳ"}.`,
      },
    });

    await recordAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entityName: "EquipmentTransfer",
      entityId: newTransfer.id,
      description: `Lập phiếu điều chuyển thiết bị [${equipment.code}] sang điểm trường ID: ${data.toSchoolPointId} (SL: ${qty})`,
    });

    revalidatePath("/admin/equipment");
    return { success: true, data: newTransfer };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi tạo phiếu điều chuyển" };
  }
}

export async function updateTransferStatus(transferId: string, status: TransferStatus) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };

    const transfer = await prisma.equipmentTransfer.findUnique({
      where: { id: transferId },
      include: { equipment: true },
    });

    if (!transfer) return { success: false, error: "Không tìm thấy phiếu điều chuyển" };

    const updated = await prisma.equipmentTransfer.update({
      where: { id: transferId },
      data: {
        status,
        approvedById: session.user.id,
        actualReturnDate: status === TransferStatus.COMPLETED ? new Date() : undefined,
      },
    });

    // Update equipment location if COMPLETED
    if (status === TransferStatus.COMPLETED) {
      await prisma.equipment.update({
        where: { id: transfer.equipmentId },
        data: {
          schoolPointId: transfer.toSchoolPointId,
        },
      });
    }

    await recordAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entityName: "EquipmentTransfer",
      entityId: transferId,
      description: `Cập nhật trạng thái phiếu điều chuyển thiết bị: ${status}`,
    });

    revalidatePath("/admin/equipment");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật trạng thái phiếu" };
  }
}
