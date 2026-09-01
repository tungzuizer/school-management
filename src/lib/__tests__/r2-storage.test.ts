/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Vitest test runner (`pnpm vitest run`).
 * 2. Purpose: Compatibility suite ensuring r2-storage re-exports map accurately to Supabase storage.
 * 3. Schemas: PresignedUploadOptions, PresignedUploadResult.
 * 4. Verbatim User Instruction: "tôi ko dùng clodflảe r2 tôi chỉ dùng supabase"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateStorageKey,
  getStoragePublicUrl,
  getR2PresignedUploadUrl,
  getR2PresignedDownloadUrl,
  deleteObjectFromR2,
  uploadBufferToR2,
  getSupabaseClient,
} from "@/lib/r2-storage";

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

describe("Storage Compatibility Suite (Forwarding to Supabase)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generateStorageKey outputs correct multi-tenant key format", () => {
    const key = generateStorageKey("evidences", "BaoCao.pdf", "school-tan-xa");
    expect(key).toMatch(/^schools\/school-tan-xa\/evidences\/\d+-[a-z0-9]+-BaoCao\.pdf$/);
  });

  it("getR2PresignedUploadUrl forwards to Supabase Storage signed upload", async () => {
    const result = await getR2PresignedUploadUrl({
      schoolId: "school-tan-xa",
      folder: "evidences",
      fileName: "Test.pdf",
      contentType: "application/pdf",
    });
    expect(result.uploadUrl).toContain("mock.supabase.co/storage/v1/object/upload/sign");
  });

  it("getR2PresignedDownloadUrl forwards to Supabase Storage signed download", async () => {
    const downloadUrl = await getR2PresignedDownloadUrl("schools/school-1/evidences/test.pdf", 1800);
    expect(downloadUrl).toContain("mock.supabase.co/storage/v1/object/sign");
  });

  it("deleteObjectFromR2 forwards to Supabase remove", async () => {
    const success = await deleteObjectFromR2("schools/school-1/evidences/test.pdf");
    expect(success).toBe(true);
  });
});
