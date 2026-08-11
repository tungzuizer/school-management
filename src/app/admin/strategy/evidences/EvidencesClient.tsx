"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  RotateCcw,
  History,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Layers,
  Building,
  Plus,
  RefreshCw,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  getEvidenceFiles,
  uploadEvidenceFile,
  replaceEvidenceFile,
  softDeleteEvidenceFile,
  restoreEvidenceFile,
  logFileDownload,
} from "./actions";

interface AuditLog {
  id: string;
  action: string;
  performedByName: string;
  detail?: string | null;
  createdAt: string | Date;
}

interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedByName: string;
  relatedModule: string;
  relatedRecordId?: string | null;
  relatedContent?: string | null;
  campusId?: string | null;
  description?: string | null;
  version: number;
  status: string;
  isDeleted: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  auditLogs: AuditLog[];
}

export default function EvidencesClient({
  initialFiles,
}: {
  initialFiles: EvidenceFile[];
}) {
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "TRASH" | "ALL">("ACTIVE");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    fileName: "",
    fileType: "pdf",
    fileSize: 1024 * 1024,
    fileUrl: "",
    relatedModule: "QUALITY_OBJECTIVE",
    relatedContent: "",
    campusId: "campus-main",
    description: "",
  });

  // Selected file preview & details modal state
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);

  // Version replace modal state
  const [replaceTargetFile, setReplaceTargetFile] = useState<EvidenceFile | null>(null);
  const [replaceForm, setReplaceForm] = useState({
    fileName: "",
    fileType: "pdf",
    fileSize: 1024 * 1024,
    fileUrl: "",
    description: "",
  });

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const refreshFiles = () => {
    startTransition(async () => {
      const res = await getEvidenceFiles({ includeDeleted: true });
      if (res.success && res.data) {
        setFiles(res.data);
      }
    });
  };

  // Filtered dataset
  const filteredFiles = files.filter((f) => {
    if (activeTab === "ACTIVE" && f.isDeleted) return false;
    if (activeTab === "TRASH" && !f.isDeleted) return false;

    if (moduleFilter !== "ALL" && f.relatedModule !== moduleFilter) return false;
    if (typeFilter !== "ALL" && f.fileType.toLowerCase() !== typeFilter.toLowerCase()) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.fileName.toLowerCase().includes(q);
      const matchContent = (f.relatedContent || "").toLowerCase().includes(q);
      const matchDesc = (f.description || "").toLowerCase().includes(q);
      if (!matchName && !matchContent && !matchDesc) return false;
    }

    return true;
  });

  // Upload handler with progress simulation
  const handleSimulatedUpload = () => {
    if (!uploadForm.fileName.trim()) {
      showToast("error", "Vui lòng nhập tên tệp minh chứng!");
      return;
    }

    setIsSimulatingUpload(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(100);

      const res = await uploadEvidenceFile({
        fileName: uploadForm.fileName,
        fileType: uploadForm.fileType,
        fileSize: uploadForm.fileSize,
        fileUrl: uploadForm.fileUrl || `https://storage.school.edu.vn/evidences/${uploadForm.fileName}`,
        relatedModule: uploadForm.relatedModule,
        relatedContent: uploadForm.relatedContent,
        campusId: uploadForm.campusId,
        description: uploadForm.description,
      });

      setIsSimulatingUpload(false);
      setUploadProgress(0);

      if (res.success) {
        showToast("success", res.message || "Tải lên tệp minh chứng thành công");
        setShowUploadModal(false);
        setUploadForm({
          fileName: "",
          fileType: "pdf",
          fileSize: 1024 * 1024,
          fileUrl: "",
          relatedModule: "QUALITY_OBJECTIVE",
          relatedContent: "",
          campusId: "campus-main",
          description: "",
        });
        refreshFiles();
      } else {
        showToast("error", res.error || "Thất bại khi tải lên");
      }
    }, 1200);
  };

  // Replace version handler
  const handleReplaceVersion = () => {
    if (!replaceTargetFile || !replaceForm.fileName.trim()) return;

    startTransition(async () => {
      const res = await replaceEvidenceFile(replaceTargetFile.id, {
        fileName: replaceForm.fileName,
        fileType: replaceForm.fileType,
        fileSize: replaceForm.fileSize,
        fileUrl: replaceForm.fileUrl || `https://storage.school.edu.vn/evidences/v2_${replaceForm.fileName}`,
        description: replaceForm.description,
      });

      if (res.success) {
        showToast("success", res.message || "Đã cập nhật phiên bản mới thành công");
        setReplaceTargetFile(null);
        refreshFiles();
      } else {
        showToast("error", res.error || "Không thể thay thế phiên bản");
      }
    });
  };

  // Soft Delete handler
  const handleSoftDelete = (id: string) => {
    startTransition(async () => {
      const res = await softDeleteEvidenceFile(id);
      if (res.success) {
        showToast("success", res.message || "Đã chuyển vào thùng rác");
        refreshFiles();
      } else {
        showToast("error", res.error || "Lỗi khi xóa");
      }
    });
  };

  // Restore handler
  const handleRestore = (id: string) => {
    startTransition(async () => {
      const res = await restoreEvidenceFile(id);
      if (res.success) {
        showToast("success", res.message || "Đã khôi phục thành công");
        refreshFiles();
      } else {
        showToast("error", res.error || "Lỗi khi khôi phục");
      }
    });
  };

  // File select handler for upload modal
  const handleSelectUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setUploadForm((prev) => ({
        ...prev,
        fileName: selectedFile.name,
        fileType: extension,
        fileSize: selectedFile.size,
        fileUrl: dataUrl || "",
      }));
    };
    reader.readAsDataURL(selectedFile);
  };

  // File select handler for replace modal
  const handleSelectReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "pdf";
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setReplaceForm((prev) => ({
        ...prev,
        fileName: selectedFile.name,
        fileType: extension,
        fileSize: selectedFile.size,
        fileUrl: dataUrl || "",
      }));
    };
    reader.readAsDataURL(selectedFile);
  };

  // Real file download logic and log
  const handleDownload = async (file: EvidenceFile) => {
    await logFileDownload(file.id);
    try {
      if (file.fileUrl && file.fileUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = file.fileUrl;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (file.fileUrl && (file.fileUrl.startsWith("http") || file.fileUrl.startsWith("/"))) {
        try {
          const res = await fetch(file.fileUrl);
          if (!res.ok) throw new Error("Fetch failed");
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch {
          // Fallback if URL is external/mock and cannot be fetched directly via CORS
          const dummyContent = `TỆP MINH CHỨNG CHIẾN LƯỢC\nTên tệp: ${file.fileName}\nNội dung: ${file.relatedContent || 'N/A'}\nMô tả: ${file.description || 'N/A'}`;
          const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        const dummyContent = `TỆP MINH CHỨNG CHIẾN LƯỢC\nTên tệp: ${file.fileName}\nNội dung: ${file.relatedContent || 'N/A'}\nMô tả: ${file.description || 'N/A'}`;
        const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      showToast("success", `Đã tải xuống tệp: ${file.fileName}`);
    } catch {
      showToast("error", "Không thể tải tệp về");
    }
  };

  // File Icon Helper
  const renderFileIcon = (fileType: string) => {
    const ext = fileType.toLowerCase();
    if (ext === "pdf") return <FileText className="w-6 h-6 text-red-500 shrink-0" />;
    if (ext === "docx" || ext === "doc") return <File className="w-6 h-6 text-blue-600 shrink-0" />;
    if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="w-6 h-6 text-emerald-600 shrink-0" />;
    if (["png", "jpg", "jpeg"].includes(ext)) return <ImageIcon className="w-6 h-6 text-purple-600 shrink-0" />;
    return <FileCode className="w-6 h-6 text-gray-500 shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center gap-2 animate-bounce ${
            feedback.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {feedback.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              HỆ THỐNG QUẢN LÝ TỆP MINH CHỨNG & KIỂM TOÁN VẾT
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tệp Minh Chứng Chiến Lược</h1>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Hỗ trợ tải lên đa định dạng (PDF, DOCX, XLSX, PNG, JPG, JPEG), quản lý phiên bản (Version Control), xóa mềm khôi phục và nhật ký kiểm toán Audit Logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition"
            >
              <Upload className="w-4 h-4" /> Tải lên Minh chứng Mới
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "ACTIVE" ? "bg-white text-[#1a237e] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tệp khả dụng ({files.filter((f) => !f.isDeleted).length})
            </button>
            <button
              onClick={() => setActiveTab("TRASH")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "TRASH" ? "bg-white text-rose-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Thùng rác / Đã xóa mềm ({files.filter((f) => f.isDeleted).length})
            </button>
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "ALL" ? "bg-white text-[#1a237e] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Tất cả ({files.length})
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả nội dung liên quan</option>
              <option value="QUALITY_OBJECTIVE">Mục tiêu SMART</option>
              <option value="STRATEGY_KPI">Bộ chỉ số KPI</option>
              <option value="FIVE_YEAR_PLAN">Chiến lược 5 năm</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả định dạng</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="png">Ảnh PNG/JPG/JPEG</option>
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên tệp, nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Files Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Tệp minh chứng</th>
                <th className="py-3.5 px-4">Nội dung liên quan</th>
                <th className="py-3.5 px-4">Kích thước</th>
                <th className="py-3.5 px-4">Phiên bản</th>
                <th className="py-3.5 px-4">Người tải lên</th>
                <th className="py-3.5 px-4">Ngày cập nhật</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Không tìm thấy tệp minh chứng nào theo điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-blue-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {renderFileIcon(file.fileType)}
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{file.fileName}</p>
                          <p className="text-[10px] text-gray-400">{file.fileType.toUpperCase()} file</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-blue-900">{file.relatedModule}</p>
                      <p className="text-gray-600 line-clamp-1">{file.relatedContent || "Chưa gán nội dung"}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 font-mono whitespace-nowrap">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[11px]">
                        v{file.version}.0
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">{file.uploadedByName}</td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Xem trước & Log
                      </button>

                      <button
                        onClick={() => handleDownload(file)}
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải về
                      </button>

                      {!file.isDeleted ? (
                        <>
                          <button
                            onClick={() => {
                              setReplaceTargetFile(file);
                              setReplaceForm({
                                fileName: file.fileName,
                                fileType: file.fileType,
                                fileSize: file.fileSize,
                                fileUrl: file.fileUrl,
                                description: file.description || "",
                              });
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Thay bản mới
                          </button>
                          <button
                            onClick={() => handleSoftDelete(file.id)}
                            className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Xóa mềm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(file.id)}
                          className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload File */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" /> Tải Lên Tệp Minh Chứng Mới
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-xl text-center">
                <label className="cursor-pointer block space-y-1">
                  <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                  <span className="text-xs font-bold text-blue-800 block">Chọn tệp từ máy tính của bạn</span>
                  <span className="text-[11px] text-gray-500 block">Hỗ trợ PDF, DOCX, XLSX, PNG, JPG, JPEG (tối đa 25MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleSelectUploadFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên tệp minh chứng *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Quyet_dinh_chi_tieu_chat_luong_2026.pdf"
                  value={uploadForm.fileName}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Định dạng tệp *</label>
                  <select
                    value={uploadForm.fileType}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="png">Ảnh PNG (.png)</option>
                    <option value="jpg">Ảnh JPG/JPEG (.jpg)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kích thước tệp (Bytes)</label>
                  <input
                    type="number"
                    value={uploadForm.fileSize}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileSize: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Module liên quan</label>
                  <select
                    value={uploadForm.relatedModule}
                    onChange={(e) => setUploadForm({ ...uploadForm, relatedModule: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="QUALITY_OBJECTIVE">Mục tiêu SMART</option>
                    <option value="STRATEGY_KPI">Bộ chỉ số KPI</option>
                    <option value="FIVE_YEAR_PLAN">Chiến lược 5 năm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Phân hiệu áp dụng</label>
                  <select
                    value={uploadForm.campusId}
                    onChange={(e) => setUploadForm({ ...uploadForm, campusId: e.target.value })}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="campus-main">Toàn trường / Điểm chính</option>
                    <option value="campus-1">Phân hiệu 1</option>
                    <option value="campus-2">Phân hiệu 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên mục tiêu / Nội dung liên quan</label>
                <input
                  type="text"
                  placeholder="Nhập tên mục tiêu SMART hoặc chỉ số KPI liên quan..."
                  value={uploadForm.relatedContent}
                  onChange={(e) => setUploadForm({ ...uploadForm, relatedContent: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mô tả tệp</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết về căn cứ văn bản..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload Progress Simulation Bar */}
              {isSimulatingUpload && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-bold text-blue-700">
                    <span>Đang tải lên hệ thống...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleSimulatedUpload}
                disabled={isSimulatingUpload || !uploadForm.fileName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
              >
                Bắt đầu tải lên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Version Modal */}
      {replaceTargetFile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" /> Thay Bản Mới (Tạo Version v{replaceTargetFile.version + 1}.0)
              </h2>
              <button onClick={() => setReplaceTargetFile(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600">
                Bạn đang thực hiện thay thế tệp <span className="font-bold text-gray-900">{replaceTargetFile.fileName}</span>. Hệ thống sẽ tự động lưu lại lịch sử Audit log.
              </p>

              <div className="p-3 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-xl text-center">
                <label className="cursor-pointer block space-y-1">
                  <RefreshCw className="w-8 h-8 text-amber-600 mx-auto" />
                  <span className="text-xs font-bold text-amber-800 block">Chọn tệp phiên bản mới từ máy tính</span>
                  <span className="text-[11px] text-gray-500 block">Chọn file để thay thế phiên bản cũ</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                    onChange={handleSelectReplaceFile}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Tên tệp mới *</label>
                <input
                  type="text"
                  value={replaceForm.fileName}
                  onChange={(e) => setReplaceForm({ ...replaceForm, fileName: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Ghi chú thay đổi phiên bản</label>
                <textarea
                  rows={3}
                  placeholder="Ghi rõ nội dung cập nhật hoặc căn cứ thay thế..."
                  value={replaceForm.description}
                  onChange={(e) => setReplaceForm({ ...replaceForm, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setReplaceTargetFile(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleReplaceVersion}
                disabled={isPending || !replaceForm.fileName.trim()}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
              >
                Xác nhận thay thế bản mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Audit Log Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderFileIcon(previewFile.fileType)}
                <div>
                  <h2 className="text-base font-bold">{previewFile.fileName}</h2>
                  <p className="text-xs text-blue-200">Phiên bản v{previewFile.version}.0 • {formatFileSize(previewFile.fileSize)}</p>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-white/80 hover:text-white text-xl font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* File details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <p className="text-gray-500">Loại minh chứng:</p>
                  <p className="font-bold text-gray-800">{previewFile.relatedModule}</p>
                </div>
                <div>
                  <p className="text-gray-500">Nội dung liên quan:</p>
                  <p className="font-bold text-gray-800">{previewFile.relatedContent || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Người tải lên:</p>
                  <p className="font-bold text-gray-800">{previewFile.uploadedByName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tạo:</p>
                  <p className="font-bold text-gray-800">{new Date(previewFile.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              {/* Preview Box Simulation */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-100 text-center space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase">Khung xem trước tài liệu (Preview)</p>
                {["png", "jpg", "jpeg"].includes(previewFile.fileType.toLowerCase()) ? (
                  <div className="max-h-60 mx-auto overflow-hidden rounded-lg bg-gray-900 p-2">
                    <img
                      src={previewFile.fileUrl}
                      alt="Preview"
                      className="max-h-56 mx-auto object-contain"
                      onError={(e) => {
                        (e.target as any).src = "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=60";
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg border border-gray-300 max-w-md mx-auto space-y-2">
                    {renderFileIcon(previewFile.fileType)}
                    <p className="font-bold text-gray-800">{previewFile.fileName}</p>
                    <p className="text-gray-500 text-[11px]">Tài liệu định dạng {previewFile.fileType.toUpperCase()} sẵn sàng xem và tải về.</p>
                  </div>
                )}
              </div>

              {/* Audit Logs */}
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800 uppercase flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" /> Nhật ký kiểm toán tác động (Audit Logs)
                </h3>
                <div className="space-y-2">
                  {previewFile.auditLogs && previewFile.auditLogs.length > 0 ? (
                    previewFile.auditLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                              {log.action}
                            </span>
                            <span className="font-semibold text-gray-800">{log.performedByName}</span>
                          </div>
                          <p className="text-gray-600 mt-1">{log.detail}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">Chưa có nhật ký ghi nhận.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold rounded-lg text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
