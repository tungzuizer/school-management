/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner (`pnpm vitest run`).
 * 2. Purpose: Unit testing Supabase Storage utilities (generateStorageKey, getStoragePublicUrl, getSupabaseSignedUploadUrl, getSupabaseSignedDownloadUrl, uploadBufferToSupabase, deleteObjectFromSupabase, getSupabaseClient).
 * 3. Schemas: StorageFolder, SignedUploadOptions, SignedUploadResult.
 * 4. Verbatim User Instruction: "tôi ko dùng clodflảe r2 tôi chỉ dùng supabase"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStorageKey,
  getStoragePublicUrl,
  getSupabaseSignedUploadUrl,
  getSupabaseSignedDownloadUrl,
  uploadBufferToSupabase,
  deleteObjectFromSupabase,
  getSupabaseClient,
} from "@/lib/supabase-storage";

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
  const createSignedUploadUrlMock = vi.fn().mockResolvedValue({
    data: {
      signedUrl: "https://mock.supabase.co/storage/v1/object/upload/sign/school-storage/mock-path",
      token: "mock-token",
      path: "schools/school-tan-xa/evidences/mock-path.pdf",
    },
    error: null,
  });

  const createSignedUrlMock = vi.fn().mockResolvedValue({
    data: {
      signedUrl: "https://mock.supabase.co/storage/v1/object/sign/school-storage/mock-path?token=xyz",
    },
    error: null,
  });

  const getPublicUrlMock = vi.fn().mockImplementation((path: string) => ({
    data: {
      publicUrl: `https://mock.supabase.co/storage/v1/object/public/school-storage/${path}`,
    },
  }));

  const uploadMock = vi.fn().mockResolvedValue({
    data: { path: "schools/school-1/journey-imports/test.xlsx" },
    error: null,
  });

  const removeMock = vi.fn().mockResolvedValue({
    data: [{ name: "schools/school-1/evidences/old.pdf" }],
    error: null,
  });

  const storageFromMock = vi.fn().mockImplementation(() => ({
    createSignedUploadUrl: createSignedUploadUrlMock,
    createSignedUrl: createSignedUrlMock,
    getPublicUrl: getPublicUrlMock,
    upload: uploadMock,
    remove: removeMock,
  }));

  const clientMock = {
    storage: {
      from: storageFromMock,
    },
  };

  return {
    createClient: vi.fn().mockImplementation(() => clientMock),
  };
});

describe("Supabase Storage Infrastructure Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateStorageKey", () => {
    it("generates correct key structure with multi-tenant isolation", () => {
      const key = generateStorageKey("evidences", "BaoCao_KiemDinh_2026.pdf", "school-tan-xa");
      expect(key).toMatch(/^schools\/school-tan-xa\/evidences\/\d+-[a-z0-9]+-BaoCao_KiemDinh_2026\.pdf$/);
    });

    it("sanitizes special characters in file names", () => {
      const dangerousName = "Kế hoạch #1 [Draft] (Final) & test?.docx";
      const key = generateStorageKey("lesson-plans", dangerousName, "school-123");
      expect(key).toMatch(/^schools\/school-123\/lesson-plans\/\d+-[a-z0-9]+-K__ho_ch__1__Draft___Final____test_.docx$/);
    });

    it("uses default school identifier when schoolId is omitted", () => {
      const key = generateStorageKey("avatars", "user.png");
      expect(key).toMatch(/^schools\/default\/avatars\/\d+-[a-z0-9]+-user\.png$/);
    });
  });

  describe("getStoragePublicUrl", () => {
    it("returns public url matching object key in Supabase storage bucket", () => {
      const key = "schools/school-1/evidences/test.pdf";
      const url = getStoragePublicUrl(key);
      expect(url).toContain(key);
      expect(url).toContain("school-storage");
    });
  });

  describe("getSupabaseSignedUploadUrl", () => {
    it("generates signed upload URL with token for direct browser upload", async () => {
      const result = await getSupabaseSignedUploadUrl({
        schoolId: "school-tan-xa",
        folder: "evidences",
        fileName: "MinhChung_KPI.pdf",
        contentType: "application/pdf",
        expiresInSeconds: 600,
      });

      expect(result.uploadUrl).toContain("mock.supabase.co/storage/v1/object/upload/sign");
      expect(result.publicUrl).toContain("mock.supabase.co/storage/v1/object/public");
      expect(result.expiresInSeconds).toBe(600);
    });
  });

  describe("getSupabaseSignedDownloadUrl", () => {
    it("generates signed download url for protected object", async () => {
      const downloadUrl = await getSupabaseSignedDownloadUrl(
        "schools/school-tx/evidences/secret.pdf",
        1800
      );
      expect(downloadUrl).toContain("mock.supabase.co/storage/v1/object/sign");
    });
  });

  describe("uploadBufferToSupabase", () => {
    it("uploads buffer to Supabase bucket and returns public url", async () => {
      const buffer = Buffer.from("Test file content");
      const key = "schools/school-1/journey-imports/test.xlsx";
      const res = await uploadBufferToSupabase(
        buffer,
        key,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      expect(res.key).toBe(key);
      expect(res.publicUrl).toContain(key);
    });
  });

  describe("deleteObjectFromSupabase", () => {
    it("returns true on successful deletion from bucket", async () => {
      const success = await deleteObjectFromSupabase("schools/school-1/evidences/old.pdf");
      expect(success).toBe(true);
    });
  });

  describe("getSupabaseClient singleton", () => {
    it("returns consistent SupabaseClient instance", () => {
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();
      expect(client1).toBe(client2);
    });
  });
});
