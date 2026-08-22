"use client";

import { useState } from "react";
import Modal from "./Modal";
import {
  FileSpreadsheet,
  Link,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Download,
} from "lucide-react";

interface GoogleDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "STUDENTS" | "TEACHERS" | "CLASSES" | "EVIDENCE" | "SUBJECT_GROUPS" | "SCHEDULES";
  onConfirmImport: (data: any[]) => Promise<void>;
  title?: string;
  extraSelects?: React.ReactNode;
}

export default function GoogleDriveImportModal({
  isOpen,
  onClose,
  targetType,
  onConfirmImport,
  title = "Nhập dữ liệu từ Google Drive",
  extraSelects,
}: GoogleDriveImportModalProps) {
  const [driveUrl, setDriveUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    fileId: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    errors: string[];
    data: any[];
  } | null>(null);
  const [onlyValid, setOnlyValid] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFetchDrive = async () => {
    if (!driveUrl.trim()) {
      setErrorMessage("Vui lòng nhập liên kết Google Drive hoặc Google Sheet.");
      return;
    }

    setFetching(true);
    setErrorMessage("");
    setResult(null);

    try {
      const res = await fetch("/api/integrations/google-drive/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveUrl, targetType }),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error || "Không thể đọc tệp từ Google Drive.");
      } else {
        setResult(json);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi kết nối tới máy chủ.");
    } finally {
      setFetching(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || result.validRows === 0) return;
    setImporting(true);
    try {
      const validData = result.data.filter((r) => r.isValid);
      await onConfirmImport(validData);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi lưu dữ liệu.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setDriveUrl("");
    setErrorMessage("");
    setResult(null);
    setOnlyValid(false);
    onClose();
  };

  const displayData = result
    ? onlyValid
      ? result.data.filter((r) => r.isValid)
      : result.data
    : [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-4">
        {/* Helper Banner */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Hướng dẫn nhập dữ liệu từ Google Drive:</p>
            <p>
              1. Mở file Google Sheet/Drive và đặt quyền chia sẻ là <b>Bất kỳ ai có liên kết (Viewer)</b>.
            </p>
            <p>
              2. Sao chép liên kết trình duyệt (URL) và dán vào ô bên dưới.
            </p>
            <p>
              3. Hệ thống sẽ tự động quét các tiêu đề cột tiếng Việt hoặc tiếng Anh để xử lý.
            </p>
          </div>
        </div>

        {extraSelects && <div>{extraSelects}</div>}

        {/* Input Bar */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
            Đường dẫn Google Sheet / Google Drive:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleFetchDrive}
              disabled={fetching || !driveUrl.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {fetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" /> Đọc dữ liệu
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Preview Results Area */}
        {result && (
          <div className="space-y-3">
            {/* Stats Overview */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Tổng số dòng: <strong>{result.totalRows}</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ: {result.validRows}
                </span>
                {result.invalidRows > 0 && (
                  <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Lỗi: {result.invalidRows}
                  </span>
                )}
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={onlyValid}
                  onChange={(e) => setOnlyValid(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Chỉ xem dòng hợp lệ
              </label>
            </div>

            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase font-semibold">
                  <tr>
                    <th className="p-2 border-b dark:border-gray-700 w-12 text-center">STT</th>
                    <th className="p-2 border-b dark:border-gray-700">Trạng thái</th>
                    {targetType === "SCHEDULES" ? (
                      <>
                        <th className="p-2 border-b dark:border-gray-700">Lớp</th>
                        <th className="p-2 border-b dark:border-gray-700">Thứ</th>
                        <th className="p-2 border-b dark:border-gray-700">Tiết</th>
                        <th className="p-2 border-b dark:border-gray-700">Môn Học</th>
                        <th className="p-2 border-b dark:border-gray-700">Giáo Viên</th>
                        <th className="p-2 border-b dark:border-gray-700">Phòng</th>
                      </>
                    ) : (
                      <>
                        <th className="p-2 border-b dark:border-gray-700">{targetType === "SUBJECT_GROUPS" ? "Tên Tổ" : "Họ và Tên"}</th>
                        {targetType === "STUDENTS" && (
                          <>
                            <th className="p-2 border-b dark:border-gray-700">Mã HS</th>
                            <th className="p-2 border-b dark:border-gray-700">Giới tính</th>
                            <th className="p-2 border-b dark:border-gray-700">Lớp</th>
                          </>
                        )}
                        {targetType === "TEACHERS" && (
                          <>
                            <th className="p-2 border-b dark:border-gray-700">Email</th>
                            <th className="p-2 border-b dark:border-gray-700">Chuyên môn</th>
                          </>
                        )}
                        {targetType === "CLASSES" && (
                          <>
                            <th className="p-2 border-b dark:border-gray-700">Khối</th>
                            <th className="p-2 border-b dark:border-gray-700">Trường/Phân hiệu</th>
                          </>
                        )}
                        {targetType === "SUBJECT_GROUPS" && (
                          <>
                            <th className="p-2 border-b dark:border-gray-700">Tổ Trưởng</th>
                            <th className="p-2 border-b dark:border-gray-700">Môn Học</th>
                            <th className="p-2 border-b dark:border-gray-700">Trường</th>
                          </>
                        )}
                      </>
                    )}
                    <th className="p-2 border-b dark:border-gray-700">Ghi chú / Lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-gray-500">
                        Không tìm thấy dòng phù hợp.
                      </td>
                    </tr>
                  ) : (
                    displayData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.isValid
                            ? "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                            : "bg-red-50/50 dark:bg-red-950/30"
                        }
                      >
                        <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              Lỗi
                            </span>
                          )}
                        </td>

                        {targetType === "SCHEDULES" ? (
                          <>
                            <td className="p-2 text-gray-900 dark:text-white font-semibold">{row.className || "Lớp chọn"}</td>
                            <td className="p-2 text-gray-600 dark:text-gray-300">{row.dayLabel}</td>
                            <td className="p-2 text-gray-600 dark:text-gray-300">Tiết {row.period}</td>
                            <td className="p-2 font-bold text-indigo-600 dark:text-indigo-400">{row.subjectName || "—"}</td>
                            <td className="p-2 text-gray-900 dark:text-white font-medium">{row.teacherName || "—"}</td>
                            <td className="p-2 text-gray-500">{row.room || "—"}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-medium text-gray-900 dark:text-white">
                              {row.name || "—"}
                            </td>
                            {targetType === "STUDENTS" && (
                              <>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.studentCode || "—"}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.gender === "MALE" ? "Nam" : row.gender === "FEMALE" ? "Nữ" : "Khác"}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.className || "—"}</td>
                              </>
                            )}
                            {targetType === "TEACHERS" && (
                              <>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.email || "—"}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.specialty || "—"}</td>
                              </>
                            )}
                            {targetType === "CLASSES" && (
                              <>
                                <td className="p-2 text-gray-600 dark:text-gray-300">Khối {row.gradeLevel}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.schoolName || row.campusName || "—"}</td>
                              </>
                            )}
                            {targetType === "SUBJECT_GROUPS" && (
                              <>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.headTeacherName || "—"}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.subjects || "—"}</td>
                                <td className="p-2 text-gray-600 dark:text-gray-300">{row.schoolName || "—"}</td>
                              </>
                            )}
                          </>
                        )}

                        <td className="p-2 text-gray-500 text-[11px]">
                          {row.error ? (
                            <span className="text-red-600 font-medium">{row.error}</span>
                          ) : (
                            "Sẵn sàng nhập"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Hủy bỏ
          </button>
          {result && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={importing || result.validRows === 0}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang nhập...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Xác nhận nhập {result.validRows} bản ghi
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
