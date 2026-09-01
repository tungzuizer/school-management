"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  File,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { StorageFolder } from "@/lib/supabase-storage";

export interface UploadedFileResult {
  key: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface R2FileUploaderProps {
  folder: StorageFolder;
  maxSizeMB?: number;
  acceptedExtensions?: string[];
  onUploadComplete: (result: UploadedFileResult) => void;
  onError?: (error: string) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export default function R2FileUploader({
  folder,
  maxSizeMB = 50,
  acceptedExtensions = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"],
  onUploadComplete,
  onError,
  label = "Tải lên tệp đính kèm",
  hint = "Kéo thả tệp vào đây hoặc bấm để chọn tệp",
  className = "",
}: R2FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      // 1. Check size
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return `Kích thước tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn ${maxSizeMB}MB.`;
      }

      // 2. Check extension
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (acceptedExtensions.length > 0 && !acceptedExtensions.includes(ext)) {
        return `Định dạng tệp không được hỗ trợ. Chỉ chấp nhận: ${acceptedExtensions.join(", ")}`;
      }

      return null;
    },
    [maxSizeMB, acceptedExtensions]
  );

  const handleUpload = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      if (onError) onError(error);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(10);
    setIsSuccess(false);

    try {
      // Step 1: Request Presigned PUT URL from API Route
      const presignedRes = await fetch("/api/storage/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          folder,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });

      if (!presignedRes.ok) {
        const errorData = await presignedRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể khởi tạo liên kết tải lên.");
      }

      const { data } = await presignedRes.json();
      if (!data?.uploadUrl || !data?.key) {
        throw new Error("Dữ liệu liên kết tải lên không hợp lệ.");
      }

      setUploadProgress(40);

      // Step 2: Upload directly to Cloudflare R2 via Presigned PUT URL
      const uploadRes = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Tải lên máy chủ lưu trữ thất bại (${uploadRes.status}).`);
      }

      setUploadProgress(100);
      setIsSuccess(true);

      const ext = file.name.split(".").pop()?.toLowerCase() || "file";
      const result: UploadedFileResult = {
        key: data.key,
        publicUrl: data.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
      };

      onUploadComplete(result);
    } catch (err: any) {
      console.error("[R2FileUploader] Upload error:", err);
      const msg = err.message || "Lỗi khi tải tệp lên.";
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMessage(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptedExtensions.join(",")}
        className="hidden"
      />

      {/* Drop Zone Box */}
      {!selectedFile || errorMessage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/50 scale-[0.99]"
              : errorMessage
              ? "border-rose-300 bg-rose-50/30 hover:border-rose-400"
              : "border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">{hint}</p>
            <p className="text-xs text-slate-700 mt-1">
              Định dạng hỗ trợ: {acceptedExtensions.join(", ")} (Tối đa {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        /* Uploading / Uploaded State Card */
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-600">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã tải lên
                </span>
              )}

              {!isUploading && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Xóa / Chọn lại tệp"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-900">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Đang tải lên Supabase Storage...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-rose-600 hover:text-rose-800 font-bold shrink-0 inline-flex items-center gap-1 text-[11px]"
          >
            <RefreshCw className="w-3 h-3" /> Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
