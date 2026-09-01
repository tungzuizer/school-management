/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Callers: Application UI forms and evidence pages needing Supabase file uploading.
 * 2. Purpose: Supabase File Uploader component.
 * 3. Schemas: UploadedFileResult, StorageFolder.
 * 4. Verbatim User Instruction: "tôi ko dùng clodflảe r2 tôi chỉ dùng supabase"
 */

export { default, default as SupabaseFileUploader } from "./R2FileUploader";
export type { UploadedFileResult } from "./R2FileUploader";
