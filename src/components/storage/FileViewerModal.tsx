/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Lesson plan lists, approval pages (`src/app/teacher/lesson-plans/page.tsx`, `src/app/admin/lesson-plans/page.tsx`, `src/app/vice-principal/lesson-plans/page.tsx`, `src/app/teacher/subject-head/SubjectHeadClient.tsx`).
 * 2. Affected APIs: Interactive In-App Document Viewer component.
 * 3. Schema:
 *    - Props: `isOpen: boolean`, `onClose: () => void`, `fileUrl: string | null`, `fileName?: string | null`, `title?: string`.
 * 4. Verbatim User Instruction: "bỏ chức năng dùng link drive để lưu dữ liệu hay các giáo viên phải nộp lên đó mà hãy thay bằng lưu dữ liệu lên data base nhưng file pdf phải lưu ở dạng link và các thứ khác cũng vậy để để giảm thiểu bộ nhớ data base".
 */

"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
} from "lucide-react";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  fileName?: string | null;
  title?: string;
}

export default function FileViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  title = "Xem tài liệu / Giáo án",
}: FileViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !fileUrl) return null;

  const ext = (fileName || fileUrl).split(".").pop()?.toLowerCase() || "";
  const isPdf = ext === "pdf" || fileUrl.toLowerCase().includes(".pdf");
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  const isOffice = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext);

  const displayTitle = fileName || title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 transition-all duration-300 w-full ${
          isFullscreen ? "h-screen max-h-screen rounded-none" : "max-w-5xl h-[88vh] max-h-[900px]"
        }`}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 text-rose-500" />
              ) : isOffice ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              ) : isImage ? (
                <ImageIcon className="w-4 h-4 text-sky-500" />
              ) : (
                <File className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {displayTitle}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                {isPdf ? "Tài liệu PDF" : isImage ? "Tệp hình ảnh" : "Tài liệu đính kèm"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Download Button */}
            <a
              href={fileUrl}
              download={fileName || "tai-lieu"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Tải về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </a>

            {/* External Link */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              aria-label={isFullscreen ? "Thu nhỏ cửa sổ" : "Phóng to toàn màn hình"}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer hidden md:flex"
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ xem tài liệu"
              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content / Document Canvas */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative flex flex-col items-center justify-center p-2 sm:p-4">
          {isPdf ? (
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1`}
              title={displayTitle}
              className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-xs"
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={displayTitle}
                className="max-h-full max-w-full object-contain rounded-lg shadow-md bg-white"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-md max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">{displayTitle}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng này cần được tải về hoặc xem qua ứng dụng văn phòng.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <a
                  href={fileUrl}
                  download={fileName || "tai-lieu"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp về máy</span>
                </a>
                <a
                  href={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Xem trực tuyến</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
