/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Compatibility re-export for any remaining references transitioning to Supabase Storage.
 * 2. Purpose: Seamless bridge forwarding all storage operations to Supabase Storage.
 * 3. Schemas: Re-exports types from supabase-storage.ts.
 * 4. Verbatim User Instruction: "tôi ko dùng clodflảe r2 tôi chỉ dùng supabase"
 */

export * from "./supabase-storage";

import {
  getSupabaseSignedUploadUrl,
  getSupabaseSignedDownloadUrl,
  uploadBufferToSupabase,
  deleteObjectFromSupabase,
  SignedUploadOptions,
  SignedUploadResult,
} from "./supabase-storage";

export type PresignedUploadOptions = SignedUploadOptions;
export type PresignedUploadResult = SignedUploadResult;

export const getR2PresignedUploadUrl = getSupabaseSignedUploadUrl;
export const getR2PresignedDownloadUrl = getSupabaseSignedDownloadUrl;
export const uploadBufferToR2 = uploadBufferToSupabase;
export const deleteObjectFromR2 = deleteObjectFromSupabase;
