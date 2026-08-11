"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type EvidenceFileFilter = {
  relatedModule?: string;
  campusId?: string;
  fileType?: string;
  search?: string;
  includeDeleted?: boolean;
};

// Seed initial evidence files if none exist
// Fallback in-memory mock data store in case systemEvidenceFile table does not exist in DB
let mockEvidencesStore: any[] = [
  {
    id: "ev-001",
    fileName: "Quyet_dinh_Ban_hanh_Muc_tieu_Chat_luong_2026.pdf",
    fileType: "pdf",
    fileSize: 2450000,
    fileUrl: "https://example.com/files/quyet-dinh-01.pdf",
    uploadedByName: "Nguyễn Văn Phú (Phụ trách ĐBCL)",
    relatedModule: "QUALITY_OBJECTIVE",
    relatedRecordId: "obj-001",
    relatedContent: "Tỷ lệ học sinh đạt học lực Giỏi và Khá toàn trường",
    campusId: "campus-main",
    description: "Quyết định phê duyệt số 142/QĐ-BGH về chỉ tiêu học lực năm học 2026-2027.",
    version: 1,
    status: "ACTIVE",
    isDeleted: false,
    createdAt: new Date().toISOString(),
    auditLogs: [
      {
        id: "log-1",
        action: "UPLOAD",
        performedByName: "Nguyễn Văn Phú",
        detail: "Khởi tạo tải lên tệp minh chứng quyết định ban hành v1.0",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "ev-002",
    fileName: "Ke_hoach_KPI_Chuyen_doi_so_HK1_2026.docx",
    fileType: "docx",
    fileSize: 1850000,
    fileUrl: "https://example.com/files/kpi-chuyen-doi-so.docx",
    uploadedByName: "Ngô Thanh Sơn (Trung tâm CNTT)",
    relatedModule: "STRATEGY_KPI",
    relatedRecordId: "kpi-period-01",
    relatedContent: "Bộ chỉ số KPI Chuyển đổi số & Học tập HK1 năm 2026",
    campusId: "campus-1",
    description: "Bản kế hoạch chi tiết triển khai phần mềm quản lý và AI hỗ trợ giảng dạy.",
    version: 2,
    status: "ACTIVE",
    isDeleted: false,
    createdAt: new Date().toISOString(),
    auditLogs: [
      {
        id: "log-2",
        action: "REPLACE",
        performedByName: "Ngô Thanh Sơn",
        detail: "Thay thế bản cập nhật bổ sung phụ lục phân bổ chỉ tiêu v2.0",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "ev-003",
    fileName: "Bang_Phan_bo_Chi_tieu_Phan_hieu_2026.xlsx",
    fileType: "xlsx",
    fileSize: 840000,
    fileUrl: "https://example.com/files/phan-bo-phan-hieu.xlsx",
    uploadedByName: "Trần Thị Minh (Phó Hiệu Trưởng)",
    relatedModule: "FIVE_YEAR_PLAN",
    relatedRecordId: "plan-5y-01",
    relatedContent: "Chiến lược phát triển trường 5 năm 2026-2030",
    campusId: "campus-main",
    description: "Bảng số liệu phân bổ ngân sách, nhân sự và chỉ tiêu cho 3 phân hiệu.",
    version: 1,
    status: "ACTIVE",
    isDeleted: false,
    createdAt: new Date().toISOString(),
    auditLogs: [
      {
        id: "log-3",
        action: "UPLOAD",
        performedByName: "Trần Thị Minh",
        detail: "Tải lên file dữ liệu Excel phân bổ chỉ tiêu",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "ev-004",
    fileName: "Minh_chung_An_toan_Truong_hoc_Phan_hieu_2.png",
    fileType: "png",
    fileSize: 3200000,
    fileUrl: "https://example.com/files/an-toan-truong-hoc.png",
    uploadedByName: "Hoàng Minh Tuấn (Phòng Giám sát)",
    relatedModule: "QUALITY_OBJECTIVE",
    relatedRecordId: "obj-002",
    relatedContent: "Chỉ số an toàn & Phòng chống bạo lực học đường năm 2026",
    campusId: "campus-2",
    description: "Biên bản kiểm tra hệ thống PCCC và camera an toàn trường học Phân hiệu 2.",
    version: 1,
    status: "ACTIVE",
    isDeleted: false,
    createdAt: new Date().toISOString(),
    auditLogs: [
      {
        id: "log-4",
        action: "UPLOAD",
        performedByName: "Hoàng Minh Tuấn",
        detail: "Tải lên hình ảnh biên bản minh chứng thực địa",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

async function ensureSeedEvidences() {
  try {
    const db = prisma as any;
    if (!db.systemEvidenceFile) return;
    const count = await db.systemEvidenceFile.count();
    if (count > 0) return;

    const mockEvidences = [
      {
        fileName: "Quyet_dinh_Ban_hanh_Muc_tieu_Chat_luong_2026.pdf",
        fileType: "pdf",
        fileSize: 2450000,
        fileUrl: "https://example.com/files/quyet-dinh-01.pdf",
        uploadedByName: "Nguyễn Văn Phú (Phụ trách ĐBCL)",
        relatedModule: "QUALITY_OBJECTIVE",
        relatedRecordId: "obj-001",
        relatedContent: "Tỷ lệ học sinh đạt học lực Giỏi và Khá toàn trường",
        campusId: "campus-main",
        description: "Quyết định phê duyệt số 142/QĐ-BGH về chỉ tiêu học lực năm học 2026-2027.",
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedByName: "Nguyễn Văn Phú",
              detail: "Khởi tạo tải lên tệp minh chứng quyết định ban hành v1.0",
            },
          ],
        },
      },
      {
        fileName: "Ke_hoach_KPI_Chuyen_doi_so_HK1_2026.docx",
        fileType: "docx",
        fileSize: 1850000,
        fileUrl: "https://example.com/files/kpi-chuyen-doi-so.docx",
        uploadedByName: "Ngô Thanh Sơn (Trung tâm CNTT)",
        relatedModule: "STRATEGY_KPI",
        relatedRecordId: "kpi-period-01",
        relatedContent: "Bộ chỉ số KPI Chuyển đổi số & Học tập HK1 năm 2026",
        campusId: "campus-1",
        description: "Bản kế hoạch chi tiết triển khai phần mềm quản lý và AI hỗ trợ giảng dạy.",
        version: 2,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedByName: "Ngô Thanh Sơn",
              detail: "Tải lên bản thảo v1.0",
            },
            {
              action: "REPLACE",
              performedByName: "Ngô Thanh Sơn",
              detail: "Thay thế bản cập nhật bổ sung phụ lục phân bổ chỉ tiêu v2.0",
            },
          ],
        },
      },
      {
        fileName: "Bang_Phan_bo_Chi_tieu_Phan_hieu_2026.xlsx",
        fileType: "xlsx",
        fileSize: 840000,
        fileUrl: "https://example.com/files/phan-bo-phan-hieu.xlsx",
        uploadedByName: "Trần Thị Minh (Phó Hiệu Trưởng)",
        relatedModule: "FIVE_YEAR_PLAN",
        relatedRecordId: "plan-5y-01",
        relatedContent: "Chiến lược phát triển trường 5 năm 2026-2030",
        campusId: "campus-main",
        description: "Bảng số liệu phân bổ ngân sách, nhân sự và chỉ tiêu cho 3 phân hiệu.",
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedByName: "Trần Thị Minh",
              detail: "Tải lên file dữ liệu Excel phân bổ chỉ tiêu",
            },
          ],
        },
      },
      {
        fileName: "Minh_chung_An_toan_Truong_hoc_Phan_hieu_2.png",
        fileType: "png",
        fileSize: 3200000,
        fileUrl: "https://example.com/files/an-toan-truong-hoc.png",
        uploadedByName: "Hoàng Minh Tuấn (Phòng Giám sát)",
        relatedModule: "QUALITY_OBJECTIVE",
        relatedRecordId: "obj-002",
        relatedContent: "Chỉ số an toàn & Phòng chống bạo lực học đường năm 2026",
        campusId: "campus-2",
        description: "Biên bản kiểm tra hệ thống PCCC và camera an toàn trường học Phân hiệu 2.",
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedByName: "Hoàng Minh Tuấn",
              detail: "Tải lên hình ảnh biên bản minh chứng thực địa",
            },
          ],
        },
      },
    ];

    for (const item of mockEvidences) {
      await db.systemEvidenceFile.create({ data: item });
    }
  } catch (err) {
    console.error("Error seeding initial evidence files:", err);
  }
}

export async function getEvidenceFiles(filters?: EvidenceFileFilter) {
  try {
    const db = prisma as any;
    if (db.systemEvidenceFile) {
      await ensureSeedEvidences();
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
    }

    // Fallback using in-memory store if model is not in database
    let files = mockEvidencesStore.filter((f) => {
      if (!filters?.includeDeleted && f.isDeleted) return false;
      if (filters?.relatedModule && filters.relatedModule !== "ALL" && f.relatedModule !== filters.relatedModule) return false;
      if (filters?.campusId && filters.campusId !== "ALL" && f.campusId !== filters.campusId) return false;
      if (filters?.fileType && filters.fileType !== "ALL" && f.fileType !== filters.fileType) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        return (
          f.fileName.toLowerCase().includes(q) ||
          (f.relatedContent && f.relatedContent.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q))
        );
      }
      return true;
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

    revalidatePath("/admin/strategy/evidences");
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

    revalidatePath("/admin/strategy/evidences");
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

    revalidatePath("/admin/strategy/evidences");
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

    revalidatePath("/admin/strategy/evidences");
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

    // Fetch related evidence files, objectives, and KPIs
    const objectives = await db.qualityObjective.findMany({ orderBy: { code: "asc" } });
    const kpiCatalogs = await db.kpiCatalog.findMany({ orderBy: { code: "asc" } });
    const evidenceFiles = db.systemEvidenceFile
      ? await db.systemEvidenceFile.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        })
      : mockEvidencesStore.filter((f) => !f.isDeleted);

    const reportMeta = {
      governingBody: "SỞ GIÁO DỤC VÀ ĐÀO TẠO - PHÒNG GD&ĐT",
      schoolName: "TRƯỜNG THCS CHU VĂN AN",
      academicYear: "2026 - 2027",
      exportDate: new Date().toLocaleDateString("vi-VN"),
      preparedBy: "Nguyễn Văn Phú (Phòng ĐBCL)",
      checkedBy: "Trần Thị Minh (Phó Hiệu trưởng)",
      approvedBy: "Phạm Hoàng Anh (Hiệu trưởng)",
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
