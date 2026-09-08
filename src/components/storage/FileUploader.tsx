/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Form modals, teacher lesson plan uploaders (`src/app/teacher/lesson-plans/page.tsx`, `src/app/admin/strategy/evidences/EvidencesClient.tsx`).
 * 2. Affected APIs: Client React component calling `/api/storage/upload`.
 * 3. Schema:
 *    - Props: `folder?: string`, `schoolId?: string`, `accept?: string`, `maxSizeMB?: number`, `value?: string`, `fileName?: string`, `onUploadComplete: (res: UploadResult) => void`, `onRemove?: () => void`, `disabled?: boolean`.
 *    - UploadResult: `{ fileUrl: string, fileName: string, fileSize: number, fileType: string }`.
 * 4. Verbatim User Instruction: "bỏ chức năng dùng link drive để lưu dữ liệu hay các giáo viên phải nộp lên đó mà hãy thay bằng lưu dữ liệu lên data base nhưng file pdf phải lưu ở dạng link và các thứ khác cũng vậy để để giảm thiểu bộ nhớ data base".
 */

"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";

export interface UploadedFileResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

interface FileUploaderProps {
  folder?: "lesson-plans" | "evidences" | "journey-imports" | "avatars" | "general";
  schoolId?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: string | null;
  fileName?: string | null;
  onUploadComplete: (result: UploadedFileResult) => void;
  onRemove?: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || mimeType?.includes("pdf")) {
    return <FileText className="w-6 h-6 text-rose-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext || "") || mimeType?.includes("sheet")) {
    return <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0" />;
  }
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "") || mimeType?.includes("image")) {
    return <ImageIcon className="w-6 h-6 text-sky-500 shrink-0" />;
  }
  return <File className="w-6 h-6 text-slate-500 shrink-0" />;
}

export default function FileUploader({
  folder = "lesson-plans",
  schoolId,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg",
  maxSizeMB = 25,
  value,
  fileName,
  onUploadComplete,
  onRemove,
  disabled = false,
  label = "Tải lên tệp tài liệu / giáo án",
  hint = "Hỗ trợ định dạng PDF, Word, Excel, Hình ảnh (Tối đa 25MB)",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<{
    url: string;
    name: string;
    size?: number;
  } | null>(value ? { url: value, name: fileName || "Tệp đính kèm" } : null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (disabled || isUploading) return;
    setErrorMessage(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`Dung lượng tệp vượt quá giới hạn cho phép (${maxSizeMB}MB).`);
      return;
    }

    try {
      setIsUploading(true);
      setProgress(20);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      if (schoolId) {
        formData.append("schoolId", schoolId);
      }

      setProgress(45);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(85);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tải lên thất bại. Vui lòng thử lại.");
      }

      setProgress(100);
      setCurrentFile({
        url: data.fileUrl,
        name: data.fileName || file.name,
        size: data.fileSize || file.size,
      });

      onUploadComplete({
        fileUrl: data.fileUrl,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        fileType: data.fileType || file.type,
      });
    } catch (err: unknown) {
      console.error("[FileUploader error]:", err);
      setErrorMessage(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải lên tệp.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFile(null);
    setErrorMessage(null);
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Uploaded File Presenter */}
      {currentFile ? (
        <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs transition-all hover:border-slate-300">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(currentFile.name)}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                  {currentFile.name}
                </p>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                {currentFile.size && <span>{formatBytes(currentFile.size)}</span>}
                <a
                  href={currentFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Mở xem tệp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Xóa tệp đính kèm"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* Dropzone Box */
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]"
              : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-white"
          } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled || isUploading}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Đang tải lên và lưu liên kết tài liệu...</p>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    <span className="text-indigo-600 hover:underline">Nhấn để chọn tệp</span> hoặc kéo thả tệp vào đây
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
