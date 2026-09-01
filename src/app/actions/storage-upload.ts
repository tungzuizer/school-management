"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import {
  getSupabaseSignedUploadUrl,
  getSupabaseSignedDownloadUrl,
  deleteObjectFromSupabase,
  StorageFolder,
} from "@/lib/supabase-storage";

export interface RequestPresignedUploadInput {
  folder: StorageFolder;
  fileName: string;
  contentType: string;
  fileSize?: number;
}

export interface RegisterEvidenceInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageKey?: string;
  relatedModule: string;
  relatedRecordId?: string;
  relatedContent?: string;
  campusId?: string;
  description?: string;
}

/**
 * Server Action to obtain a Supabase Storage Signed Upload URL.
 */
export async function getPresignedUploadUrlAction(input: RequestPresignedUploadInput) {
  try {
    const ctx = await getTenantContext();

    const schoolId = ctx.schoolId || "global";
    const result = await getSupabaseSignedUploadUrl({
      schoolId,
      folder: input.folder,
      fileName: input.fileName,
      contentType: input.contentType,
      expiresInSeconds: 900,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error("[Storage Action] Error generating presigned upload URL:", error);
    return {
      success: false,
      error: error.message || "Không thể khởi tạo liên kết tải lên.",
    };
  }
}

/**
 * Server Action to register an uploaded evidence file in the database after successful Supabase Storage upload.
 */
export async function registerUploadedEvidenceFileAction(input: RegisterEvidenceInput) {
  try {
    const ctx = await getTenantContext();

    const newEvidence = await (prisma as any).systemEvidenceFile.create({
      data: {
        fileName: input.fileName,
        fileType: input.fileType.toLowerCase(),
        fileSize: input.fileSize,
        fileUrl: input.fileUrl,
        uploadedById: ctx.userId,
        uploadedByName: ctx.userName,
        relatedModule: input.relatedModule,
        relatedRecordId: input.relatedRecordId || null,
        relatedContent: input.relatedContent || null,
        campusId: input.campusId || ctx.campusId || null,
        description: input.description || null,
        version: 1,
        status: "ACTIVE",
        isDeleted: false,
        auditLogs: {
          create: [
            {
              action: "UPLOAD",
              performedById: ctx.userId,
              performedByName: ctx.userName,
              detail: `Tải lên tệp minh chứng lên Supabase Storage: ${input.fileName}`,
            },
          ],
        },
      },
      include: {
        auditLogs: true,
      },
    });

    return {
      success: true,
      data: newEvidence,
    };
  } catch (error: any) {
    console.error("[Storage Action] Error registering evidence file:", error);
    return {
      success: false,
      error: error.message || "Lỗi khi lưu trữ thông tin minh chứng vào cơ sở dữ liệu.",
    };
  }
}

/**
 * Server Action to get a secure Presigned Download URL for protected evidence/documents.
 */
export async function getPresignedDownloadUrlAction(key: string) {
  try {
    const ctx = await getTenantContext();

    const isSuperAdmin =
      ctx.userRole === "SUPER_ADMIN" ||
      ctx.userEmail === "superadmin@school.com";

    const schoolId = ctx.schoolId || "global";

    // Tenant isolation verification
    if (
      !isSuperAdmin &&
      !key.startsWith(`schools/${schoolId}/`) &&
      !key.startsWith("schools/global/")
    ) {
      return {
        success: false,
        error: "Bạn không có quyền truy cập tài liệu thuộc đơn vị trường khác.",
      };
    }

    const downloadUrl = await getSupabaseSignedDownloadUrl(key, 3600);
    return {
      success: true,
      downloadUrl,
    };
  } catch (error: any) {
    console.error("[Storage Action] Error generating download URL:", error);
    return {
      success: false,
      error: error.message || "Không thể tạo liên kết tải xuống.",
    };
  }
}

/**
 * Server Action to delete a file from Supabase Storage and mark as deleted in DB.
 */
export async function deleteUploadedEvidenceFileAction(evidenceId: string, storageKey?: string) {
  try {
    const ctx = await getTenantContext();

    // 1. Soft-delete in database
    await (prisma as any).systemEvidenceFile.update({
      where: { id: evidenceId },
      data: {
        isDeleted: true,
        status: "DELETED",
        auditLogs: {
          create: [
            {
              action: "SOFT_DELETE",
              performedById: ctx.userId,
              performedByName: ctx.userName,
              detail: "Xóa tệp minh chứng khỏi danh mục hiển thị.",
            },
          ],
        },
      },
    });

    // 2. If storageKey is provided, delete from Supabase Storage
    if (storageKey) {
      await deleteObjectFromSupabase(storageKey);
    }

    return {
      success: true,
      message: "Đã xóa tệp minh chứng thành công.",
    };
  } catch (error: any) {
    console.error("[Storage Action] Error deleting evidence file:", error);
    return {
      success: false,
      error: error.message || "Không thể xóa tệp minh chứng.",
    };
  }
}
