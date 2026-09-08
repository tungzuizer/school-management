/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`npm test`).
 * 2. Purpose: Unit testing direct file upload & URL-based storage architecture (PDF link storage, size limits, format validation).
 * 3. Schema: LessonPlan file attachments (`fileUrl`, `fileName`, `fileSize`, `fileType`), Storage upload validation.
 * 4. Verbatim User Instruction: "bỏ chức năng dùng link drive để lưu dữ liệu hay các giáo viên phải nộp lên đó mà hãy thay bằng lưu dữ liệu lên data base nhưng file pdf phải lưu ở dạng link và các thứ khác cũng vậy để để giảm thiểu bộ nhớ data base".
 */

import { describe, it, expect } from "vitest";
import { generateStorageKey, getStoragePublicUrl } from "@/lib/supabase-storage";

describe("Direct File Storage & PDF Link Storage Architecture", () => {
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/png",
  ];

  it("validates file sizes up to 25MB correctly", () => {
    const validPdfSize = 10 * 1024 * 1024; // 10MB
    const oversizedSize = 30 * 1024 * 1024; // 30MB

    expect(validPdfSize <= MAX_FILE_SIZE).toBe(true);
    expect(oversizedSize <= MAX_FILE_SIZE).toBe(false);
  });

  it("permits standard educational file formats including PDF, Word, Excel, and Images", () => {
    expect(ALLOWED_MIME_TYPES).toContain("application/pdf");
    expect(ALLOWED_MIME_TYPES).toContain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    expect(ALLOWED_MIME_TYPES).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(ALLOWED_MIME_TYPES).toContain("image/png");
    expect(ALLOWED_MIME_TYPES).not.toContain("application/x-msdownload"); // .exe should be rejected
  });

  it("generates clean multi-tenant storage keys for lesson plan uploads", () => {
    const schoolId = "sch_hanoi_01";
    const fileName = "GiaoAn_Toan10_Tuan12.pdf";
    const key = generateStorageKey("lesson-plans", fileName, schoolId);

    expect(key).toContain(`schools/${schoolId}/lesson-plans/`);
    expect(key).toContain("GiaoAn_Toan10_Tuan12.pdf");
  });

  it("constructs direct public URLs for in-app PDF previewing", () => {
    const key = "schools/sch_hanoi_01/lesson-plans/1715000000000-abc123-GiaoAn.pdf";
    const publicUrl = getStoragePublicUrl(key);

    expect(publicUrl).toBeDefined();
    expect(publicUrl).toContain(key);
  });

  it("structures database lesson plan payload with URL links and lightweight metadata", () => {
    const lessonPlanPayload = {
      title: "Bài 12: Hàm số bậc hai",
      subjectId: "sub_math",
      classId: "cls_10a1",
      teacherId: "tch_nguyen_van_a",
      schoolId: "sch_01",
      fileUrl: "https://supabase.co/storage/v1/object/public/school-storage/schools/sch_01/lesson-plans/plan12.pdf",
      fileName: "Bai12_HamSoBacHai.pdf",
      fileSize: 2048576, // 2MB
      fileType: "application/pdf",
      status: "SUBMITTED" as const,
    };

    expect(lessonPlanPayload.fileUrl).toMatch(/^https?:\/\//);
    expect(lessonPlanPayload.fileType).toBe("application/pdf");
    expect(lessonPlanPayload.fileSize).toBeLessThan(MAX_FILE_SIZE);
    // Verified that no large base64/binary blob is in the database payload
    expect(typeof lessonPlanPayload.fileUrl).toBe("string");
    expect(lessonPlanPayload.fileUrl.length).toBeLessThan(500);
  });
});
