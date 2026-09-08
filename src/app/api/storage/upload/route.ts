/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Client uploader components (`src/components/storage/FileUploader.tsx`, `src/app/teacher/lesson-plans/page.tsx`, etc.).
 * 2. Affected APIs: POST `/api/storage/upload`.
 * 3. Schema:
 *    - Request: `multipart/form-data` with `file: File`, `folder?: string`, `schoolId?: string`.
 *    - Response: `{ success: boolean, fileUrl: string, fileName: string, fileSize: number, fileType: string, storageType: 'supabase' | 'local', error?: string }`.
 * 4. Verbatim User Instruction: "bỏ chức năng dùng link drive để lưu dữ liệu hay các giáo viên phải nộp lên đó mà hãy thay bằng lưu dữ liệu lên data base nhưng file pdf phải lưu ở dạng link và các thứ khác cũng vậy để để giảm thiểu bộ nhớ data base".
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateStorageKey, getSupabaseClient, StorageFolder } from "@/lib/supabase-storage";
import fs from "fs";
import path from "path";

// Allowed MIME types: PDF, Word, Excel, Images, Text
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as StorageFolder) || "lesson-plans";
    const schoolId = (formData.get("schoolId") as string) || session.user.schoolId || "global";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tệp đính kèm." },
        { status: 400 }
      );
    }

    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Dung lượng tệp vượt quá giới hạn 25MB." },
        { status: 400 }
      );
    }

    const originalName = file.name || "tailieu.pdf";
    const contentType = file.type || "application/octet-stream";

    // Validate type if known
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      const ext = path.extname(originalName).toLowerCase();
      const validExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".webp", ".zip"];
      if (!validExtensions.includes(ext)) {
        return NextResponse.json(
          { success: false, error: "Định dạng tệp không được hỗ trợ. Vui lòng tải lên PDF, Word, Excel hoặc hình ảnh." },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = generateStorageKey(folder, originalName, schoolId);

    // 1. Try Supabase Storage first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "school-storage";

    if (supabaseUrl && supabaseKey && !supabaseKey.includes("placeholder") && !supabaseKey.includes("mock")) {
      try {
        const client = getSupabaseClient();
        const { error: uploadErr } = await client.storage.from(bucket).upload(storageKey, buffer, {
          contentType,
          upsert: true,
        });

        if (!uploadErr) {
          const { data } = client.storage.from(bucket).getPublicUrl(storageKey);
          if (data?.publicUrl) {
            return NextResponse.json({
              success: true,
              fileUrl: data.publicUrl,
              fileName: originalName,
              fileSize: file.size,
              fileType: contentType,
              storageType: "supabase",
            });
          }
        } else {
          console.warn("[Storage API] Supabase upload failed, falling back to local storage:", uploadErr.message);
        }
      } catch (sbErr) {
        console.warn("[Storage API] Supabase error, falling back to local storage:", sbErr);
      }
    }

    // 2. Fallback to Local Server Storage in public/uploads/
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      fileName: originalName,
      fileSize: file.size,
      fileType: contentType,
      storageType: "local",
    });
  } catch (err: unknown) {
    console.error("[Storage Upload API Error]:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Lỗi khi xử lý tải lên tệp tin." },
      { status: 500 }
    );
  }
}
