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
  targetType: "STUDENTS" | "TEACHERS" | "CLASSES" | "EVIDENCE";
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
      <div className="space-y-5">
        {/* Helper Instructions Box */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3.5 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Hướng dẫn chuẩn bị file Google Drive / Google Sheet:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-blue-700 dark:text-blue-300">
              <li>Mở tệp Google Sheet trên Google Drive của bạn.</li>
              <li>Nhấp nút <strong>Chia sẻ (Share)</strong> ở góc phải trên &rarr; Chuyển sang <strong>"Bất kỳ ai có liên kết" (Anyone with the link)</strong>.</li>
              <li>Sao chép đường dẫn (URL) từ thanh địa chỉ trình duyệt và dán vào ô bên dưới.</li>
            </ol>
          </div>
        </div>

        {/* Extra Selection Controls (e.g. Bulk Class Selection) */}
        {extraSelects && <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">{extraSelects}</div>}

        {/* Input Box */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Đường dẫn Liên kết Google Drive / Google Sheet:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
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
                    <th className="p-2 border-b dark:border-gray-700">Họ và Tên</th>
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
                    <th className="p-2 border-b dark:border-gray-700">Ghi chú / Lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
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
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Hủy bỏ
          </button>
          {result && (
            <button
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
