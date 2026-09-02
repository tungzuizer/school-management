"use server";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/strategy/evidences/page.tsx`
 * 2. Affected APIs: `getEvidenceFiles`, `uploadEvidenceFile`, `replaceEvidenceFile`, `softDeleteEvidenceFile`, `restoreEvidenceFile`, `logFileDownload`, `getStrategyReportData`
 * 3. Schemas: `SystemEvidenceFile`, `FileAuditLog`, `QualityObjective`, `KpiCatalog`
 * 4. Verbatim User Instruction: "/ecc:plan cấm sử dụng dữ liệu giả hay fake và xóa hết tất cả dữ liệu và sẽ tạo 2 điểm trường trần phú và  trường lương khách thiện hải phòng"
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type EvidenceFileFilter = {
  relatedModule?: string;
  campusId?: string;
  fileType?: string;
  search?: string;
  includeDeleted?: boolean;
};

export async function getEvidenceFiles(filters?: EvidenceFileFilter) {
  try {
    const db = prisma as any;
    if (!db.systemEvidenceFile) {
      return { success: true, data: [] };
    }

    const where: any = {};

    if (!filters?.includeDeleted) {
      where.isDeleted = false;
    }

    if (filters?.relatedModule && filters.relatedModule !== "ALL") {
      where.relatedModule = filters.relatedModule;
    }

    if (filters?.campusId && filters.campusId !== "ALL") {
      where.campusId = filters.campusId;
    }

    if (filters?.fileType && filters.fileType !== "ALL") {
      where.fileType = filters.fileType;
    }

    if (filters?.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: "insensitive" } },
        { relatedContent: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const files = await db.systemEvidenceFile.findMany({
      where,
      include: {
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: files };
  } catch (error: any) {
    console.error("getEvidenceFiles error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadEvidenceFile(data: {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  relatedModule: string;
  relatedRecordId?: string;
  relatedContent?: string;
  campusId?: string;
  description?: string;
}) {
  try {
    const allowedTypes = ["pdf", "docx", "xlsx", "png", "jpg", "jpeg"];
    const ext = data.fileType.toLowerCase().replace(".", "");
    if (!allowedTypes.includes(ext)) {
      return {
        success: false,
        error: `Định dạng tệp .${ext} không được chấp nhận! Chỉ chấp nhận: PDF, DOCX, XLSX, PNG, JPG, JPEG.`,
      };
    }

    const maxBytes = 25 * 1024 * 1024; // 25MB
    if (data.fileSize > maxBytes) {
      return { success: false, error: "Kích thước tệp vượt quá giới hạn cho phép (tối đa 25MB)!" };
    }

    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ quản lý";
    const db = prisma as any;

    const newFile = await db.systemEvidenceFile.create({
      data: {
        fileName: data.fileName,
        fileType: ext,
        fileSize: data.fileSize,
        fileUrl: data.fileUrl,
        uploadedById: session?.user?.id || "user-id",
        uploadedByName: userName,
        relatedModule: data.relatedModule,
        relatedRecordId: data.relatedRecordId || null,
        relatedContent: data.relatedContent || null,
        campusId: data.campusId || null,
        description: data.description || null,
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedById: session?.user?.id || "user-id",
              performedByName: userName,
              detail: `Tải lên tệp minh chứng phiên bản v1.0 (${(data.fileSize / 1024 / 1024).toFixed(2)} MB)`,
            },
          ],
        },
      },
    });

    return { success: true, message: "Tải lên tệp minh chứng thành công!", data: newFile };
  } catch (error: any) {
    console.error("uploadEvidenceFile error:", error);
    return { success: false, error: error.message };
  }
}

export async function replaceEvidenceFile(
  fileId: string,
  data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    description?: string;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ quản lý";
    const db = prisma as any;

    const existing = await db.systemEvidenceFile.findUnique({ where: { id: fileId } });
    if (!existing) {
      return { success: false, error: "Không tìm thấy tệp minh chứng" };
    }

    const newVersion = (existing.version || 1) + 1;

    const updated = await db.systemEvidenceFile.update({
      where: { id: fileId },
      data: {
        fileName: data.fileName,
        fileType: data.fileType.toLowerCase().replace(".", ""),
        fileSize: data.fileSize,
        fileUrl: data.fileUrl,
        version: newVersion,
        description: data.description || existing.description,
        status: "ACTIVE",
      },
    });

    await db.fileAuditLog.create({
      data: {
        fileId,
        action: "REPLACE",
        performedById: session?.user?.id || "user-id",
        performedByName: userName,
        detail: `Thay thế tệp bằng phiên bản mới v${newVersion}.0 (${data.fileName})`,
      },
    });

    return { success: true, message: `Đã cập nhật phiên bản mới v${newVersion}.0 thành công!`, data: updated };
  } catch (error: any) {
    console.error("replaceEvidenceFile error:", error);
    return { success: false, error: error.message };
  }
}

export async function softDeleteEvidenceFile(fileId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ quản lý";
    const db = prisma as any;

    const updated = await db.systemEvidenceFile.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        status: "DELETED",
      },
    });

    await db.fileAuditLog.create({
      data: {
        fileId,
        action: "SOFT_DELETE",
        performedById: session?.user?.id || "user-id",
        performedByName: userName,
        detail: "Xóa mềm tệp minh chứng (Có thể khôi phục lại khi cần)",
      },
    });

    return { success: true, message: "Đã chuyển tệp vào thùng rác (xóa mềm).", data: updated };
  } catch (error: any) {
    console.error("softDeleteEvidenceFile error:", error);
    return { success: false, error: error.message };
  }
}

export async function restoreEvidenceFile(fileId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Cán bộ quản lý";
    const db = prisma as any;

    const updated = await db.systemEvidenceFile.update({
      where: { id: fileId },
      data: {
        isDeleted: false,
        status: "ACTIVE",
      },
    });

    await db.fileAuditLog.create({
      data: {
        fileId,
        action: "RESTORE",
        performedById: session?.user?.id || "user-id",
        performedByName: userName,
        detail: "Khôi phục lại tệp minh chứng từ thùng rác",
      },
    });

    return { success: true, message: "Đã khôi phục tệp thành công!", data: updated };
  } catch (error: any) {
    console.error("restoreEvidenceFile error:", error);
    return { success: false, error: error.message };
  }
}

export async function logFileDownload(fileId: string) {
  try {
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "Người dùng";
    const db = prisma as any;

    await db.fileAuditLog.create({
      data: {
        fileId,
        action: "DOWNLOAD",
        performedById: session?.user?.id || "user-id",
        performedByName: userName,
        detail: "Tải xuống tệp minh chứng",
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("logFileDownload error:", error);
    return { success: false, error: error.message };
  }
}

// Gathers structured report dataset for the 7 standard report types
export async function getStrategyReportData(reportType: string) {
  try {
    const db = prisma as any;

    // Fetch related evidence files, objectives, and KPIs directly from DB
    const objectives = await db.qualityObjective?.findMany({ orderBy: { code: "asc" } }) || [];
    const kpiCatalogs = await db.kpiCatalog?.findMany({ orderBy: { code: "asc" } }) || [];
    const evidenceFiles = db.systemEvidenceFile
      ? await db.systemEvidenceFile.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const reportMeta = {
      governingBody: "SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ HẢI PHÒNG",
      schoolName: "TRƯỜNG THPT CHUYÊN TRẦN PHÚ (HẢI PHÒNG)",
      academicYear: "2026 - 2027",
      exportDate: new Date().toLocaleDateString("vi-VN"),
      preparedBy: "Ban Đảm Bảo Chất Lượng & Quản Lý Chiến Lược",
      checkedBy: "Phó Hiệu trưởng",
      approvedBy: "Hiệu trưởng",
    };

    return {
      success: true,
      reportMeta,
      data: {
        objectives,
        kpiCatalogs,
        evidenceFiles,
        reportType,
      },
    };
  } catch (error: any) {
    console.error("getStrategyReportData error:", error);
    return { success: false, error: error.message };
  }
}
