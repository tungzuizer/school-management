import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getSupabaseSignedUploadUrl,
  getSupabaseSignedDownloadUrl,
  StorageFolder,
} from "@/lib/supabase-storage";
import { z } from "zod";

const presignedUploadSchema = z.object({
  action: z.literal("upload").default("upload"),
  folder: z.enum([
    "avatars",
    "lesson-plans",
    "evidences",
    "journey-imports",
    "announcements",
    "general",
  ]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(128),
  fileSize: z.number().positive().max(100 * 1024 * 1024), // 100MB max
  expiresInSeconds: z.number().int().min(60).max(3600).optional(),
});

const presignedDownloadSchema = z.object({
  action: z.literal("download"),
  key: z.string().min(1),
  expiresInSeconds: z.number().int().min(60).max(86400).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập để thực hiện tải lên tệp." },
        { status: 401 }
      );
    }

    const schoolId = session.user.schoolId || "global";
    const body = await req.json();

    if (body.action === "download") {
      const parsedDownload = presignedDownloadSchema.safeParse(body);
      if (!parsedDownload.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Thông tin yêu cầu tải xuống không hợp lệ.",
            details: parsedDownload.error.flatten(),
          },
          { status: 400 }
        );
      }

      // Ensure tenant isolation: verify that non-superadmins only download keys matching their school or global
      const key = parsedDownload.data.key;
      const isSuperAdmin =
        session.user.role === "SUPER_ADMIN" ||
        session.user.email === "superadmin@school.com";

      if (!isSuperAdmin && !key.startsWith(`schools/${schoolId}/`) && !key.startsWith("schools/global/")) {
        return NextResponse.json(
          { success: false, error: "Bạn không có quyền truy cập tệp của trường khác." },
          { status: 403 }
        );
      }

      const downloadUrl = await getSupabaseSignedDownloadUrl(
        key,
        parsedDownload.data.expiresInSeconds || 3600
      );

      return NextResponse.json({
        success: true,
        data: { downloadUrl, key },
      });
    }

    // Default: Presigned Upload URL
    const parsedUpload = presignedUploadSchema.safeParse(body);
    if (!parsedUpload.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu tệp không hợp lệ.",
          details: parsedUpload.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { folder, fileName, contentType, expiresInSeconds } = parsedUpload.data;

    const presignedResult = await getSupabaseSignedUploadUrl({
      schoolId,
      folder: folder as StorageFolder,
      fileName,
      contentType,
      expiresInSeconds: expiresInSeconds || 900,
    });

    return NextResponse.json({
      success: true,
      data: presignedResult,
    });
  } catch (error: any) {
    console.error("[Storage API] Presigned URL Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi máy chủ khi khởi tạo liên kết lưu trữ.",
      },
      { status: 500 }
    );
  }
}
