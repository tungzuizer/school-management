"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Search,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  Eye,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  handleCreateImportBatch,
  handleReviewMapping,
  handleCommitBatch,
  handleRollbackBatch,
  fetchBatchDetails,
} from "./actions";

interface ImportClientProps {
  initialBatches: any[];
  contextData: {
    students: Array<{
      id: string;
      studentCode: string | null;
      user: { name: string };
      classRoom: { name: string } | null;
    }>;
    subjects: Array<{ id: string; name: string; code?: string }>;
    examPeriods: Array<{ id: string; name: string; orderIndex: number }>;
    schools: Array<{
      id: string;
      name: string;
      campuses: Array<{ id: string; name: string }>;
    }>;
  };
  currentSchoolId: string;
}

export default function JourneyImportClient({
  initialBatches,
  contextData,
  currentSchoolId,
}: ImportClientProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [selectedSchool, setSelectedSchool] = useState(currentSchoolId || contextData.schools[0]?.id || "");
  const [selectedCampus, setSelectedCampus] = useState("");

  // Active Tab
  const [activeTab, setActiveTab] = useState<"UPLOAD" | "MAPPING" | "HISTORY">("UPLOAD");

  // Upload Form State
  const [fileName, setFileName] = useState("Diem_Thi_Hoc_Ky_2025_2026.csv");
  const [rawText, setRawText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Active Batch Review
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeBatchData, setActiveBatchData] = useState<any | null>(null);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  // Mapping Edit Modal
  const [editingMapping, setEditingMapping] = useState<any | null>(null);
  const [editStudentId, setEditStudentId] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editPeriodId, setEditPeriodId] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Commit / Rollback Modals
  const [isCommitting, setIsCommitting] = useState(false);
  const [rollbackBatchId, setRollbackBatchId] = useState<string | null>(null);
  const [rollbackReason, setRollbackReason] = useState("");
  const [isRollingBack, setIsRollingBack] = useState(false);

  const activeCampuses =
    contextData.schools.find((s) => s.id === selectedSchool)?.campuses || [];

  // Parse CSV / TSV text to rows
  const handleParseAndUpload = async () => {
    if (!rawText.trim()) {
      setUploadError("Vui lòng nhập hoặc dán dữ liệu điểm.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);

    try {
      const lines = rawText.trim().split("\n");
      const rows: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header if detected
        if (
          i === 0 &&
          (line.toLowerCase().includes("họ và tên") ||
            line.toLowerCase().includes("tên học sinh") ||
            line.toLowerCase().includes("studentcode") ||
            line.toLowerCase().includes("name"))
        ) {
          continue;
        }

        // Support Tab or Comma delimited
        const parts = line.includes("\t")
          ? line.split("\t").map((p) => p.trim())
          : line.split(",").map((p) => p.trim());

        if (parts.length >= 4) {
          // Format: [StudentCode (opt)], Name, Class, Subject, Period, Score
          let code: string | undefined;
          let name = "";
          let classLabel = "";
          let subject = "";
          let period = "";
          let score = 0;

          if (parts.length === 4) {
            // Name, Subject, Period, Score
            name = parts[0];
            subject = parts[1];
            period = parts[2];
            score = parseFloat(parts[3]);
          } else if (parts.length === 5) {
            // Name, Class, Subject, Period, Score
            name = parts[0];
            classLabel = parts[1];
            subject = parts[2];
            period = parts[3];
            score = parseFloat(parts[4]);
          } else {
            // Code, Name, Class, Subject, Period, Score
            code = parts[0];
            name = parts[1];
            classLabel = parts[2];
            subject = parts[3];
            period = parts[4];
            score = parseFloat(parts[5]);
          }

          rows.push({
            rowNumber: rows.length + 1,
            studentCode: code || undefined,
            name,
            classLabel: classLabel || undefined,
            subjectName: subject,
            periodName: period,
            score: isNaN(score) ? -1 : score,
          });
        }
      }

      if (rows.length === 0) {
        setUploadError("Không tìm thấy dòng dữ liệu điểm hợp lệ nào. Vui lòng kiểm tra lại định dạng.");
        return;
      }

      const res = await handleCreateImportBatch({
        schoolId: selectedSchool,
        campusId: selectedCampus || undefined,
        fileName,
        rows,
      });

      if (!res.success || !res.batchId) {
        setUploadError(res.error || "Lỗi khi xử lý import.");
        return;
      }

      // Switch to Mapping view for this batch
      setActiveBatchId(res.batchId);
      const batchDetails = await fetchBatchDetails(res.batchId);
      setActiveBatchData(batchDetails);
      setActiveTab("MAPPING");
      setRawText("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectBatchToReview = async (batchId: string) => {
    setIsLoadingBatch(true);
    setActiveBatchId(batchId);
    setActiveTab("MAPPING");
    try {
      const details = await fetchBatchDetails(batchId);
      setActiveBatchData(details);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  const handleOpenEditMapping = (mapping: any) => {
    setEditingMapping(mapping);
    setEditStudentId(mapping.matchedStudentId || "");
    setEditSubjectId(mapping.matchedSubjectId || "");
    setEditPeriodId(mapping.matchedPeriodId || "");
    setEditNote(mapping.notes || "");
  };

  const handleSaveMapping = async () => {
    if (!editingMapping) return;
    setIsSavingMapping(true);
    try {
      const res = await handleReviewMapping({
        mappingId: editingMapping.id,
        studentId: editStudentId || undefined,
        subjectId: editSubjectId || undefined,
        periodId: editPeriodId || undefined,
        notes: editNote,
      });

      if (res.success && activeBatchId) {
        const details = await fetchBatchDetails(activeBatchId);
        setActiveBatchData(details);
        setEditingMapping(null);
      }
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleCommitCurrentBatch = async () => {
    if (!activeBatchId) return;
    setIsCommitting(true);
    try {
      const res = await handleCommitBatch(activeBatchId);
      if (res.success) {
        const details = await fetchBatchDetails(activeBatchId);
        setActiveBatchData(details);
      } else {
        alert(res.error || "Không thể nạp điểm.");
      }
    } finally {
      setIsCommitting(false);
    }
  };

  const handleExecuteRollback = async () => {
    if (!rollbackBatchId) return;
    setIsRollingBack(true);
    try {
      const res = await handleRollbackBatch(rollbackBatchId, rollbackReason);
      if (res.success) {
        if (activeBatchId === rollbackBatchId) {
          const details = await fetchBatchDetails(rollbackBatchId);
          setActiveBatchData(details);
        }
        setRollbackBatchId(null);
        setRollbackReason("");
      } else {
        alert(res.error || "Không thể thu hồi đợt import.");
      }
    } finally {
      setIsRollingBack(false);
    }
  };

  const loadSampleData = () => {
    const sample = `MHS001,Nguyễn Văn An,10A1,Toán học,Giữa Kỳ 1 (2025-2026),8.5
MHS001,Nguyễn Văn An,10A1,Toán học,Cuối Kỳ 1 (2025-2026),7.0
MHS001,Nguyễn Văn An,10A1,Toán học,Giữa Kỳ 2 (2025-2026),5.5
MHS002,Trần Thị Mai,10A1,Toán học,Giữa Kỳ 1 (2025-2026),6.0
MHS002,Trần Thị Mai,10A1,Toán học,Cuối Kỳ 1 (2025-2026),7.5
MHS002,Trần Thị Mai,10A1,Toán học,Giữa Kỳ 2 (2025-2026),9.0
,Lê Hoàng Nam,10A2,Ngữ văn,Giữa Kỳ 1 (2025-2026),8.0
,Lê Hoàng Nam,10A2,Ngữ văn,Cuối Kỳ 1 (2025-2026),4.5
,Lê Hoàng Nam,10A2,Ngữ văn,Giữa Kỳ 2 (2025-2026),8.5`;
    setRawText(sample);
  };

  // Gating check on active batch mappings
  const mappings = activeBatchData?.mappings || [];
  const unreviewedCount = mappings.filter(
    (m: any) =>
      (!m.reviewedBy && m.matchConfidence !== "EXACT") ||
      !m.matchedStudentId ||
      !m.matchedSubjectId ||
      !m.matchedPeriodId
  ).length;

  const isCommitted = activeBatchData?.status === "COMMITTED";
  const isRolledBack = activeBatchData?.status === "ROLLED_BACK";
  const canCommit = unreviewedCount === 0 && !isCommitted && !isRolledBack;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Data Normalization & Gating Pipeline
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Chuẩn Hóa & Import Điểm Số
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Quy trình Staging & Auto-Mapping đa tầng, cổng bảo vệ kiểm duyệt người thật (Human Gate) và Rollback an toàn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/journey-overview"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Tổng quan Hành trình
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("UPLOAD")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
            activeTab === "UPLOAD"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Upload className="w-4 h-4" /> 1. Upload & Staging
        </button>
        <button
          onClick={() => setActiveTab("MAPPING")}
          disabled={!activeBatchData}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-40 ${
            activeTab === "MAPPING"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Sparkles className="w-4 h-4" /> 2. Khớp Dữ Liệu & Gating (Auto-Mapping)
          {activeBatchData && unreviewedCount > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {unreviewedCount} cần duyệt
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
            activeTab === "HISTORY"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Clock className="w-4 h-4" /> 3. Lịch Sử & Thu Hồi (Rollback)
        </button>
      </div>

      {/* TAB 1: UPLOAD & STAGING */}
      {activeTab === "UPLOAD" && (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Nạp Dữ Liệu Điểm Vào Vùng Tạm (Staging)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Dữ liệu sẽ được lưu tạm tại Staging và tự động phân loại mức độ tin cậy trước khi nạp chính thức.
              </p>
            </div>
            <button
              type="button"
              onClick={loadSampleData}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              + Điền mẫu dữ liệu thử nghiệm
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Trường học *
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {contextData.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Cơ sở / Phân hiệu
              </label>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Toàn trường</option>
                {activeCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Tên đợt import *
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase">
              Dán Dữ Liệu CSV hoặc Tab-Separated (Mã HS, Họ tên, Lớp, Môn học, Kỳ thi, Điểm số)
            </label>
            <textarea
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="MHS001,Nguyễn Văn An,10A1,Toán học,Giữa Kỳ 1 (2025-2026),8.5"
              className="w-full font-mono text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {uploadError && (
            <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-medium bg-rose-500/10 text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              {uploadError}
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleParseAndUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Đang xử lý Staging..." : "Nạp Dữ Liệu & Khớp Tự Động"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AUTO-MAPPING & HUMAN REVIEW GATING */}
      {activeTab === "MAPPING" && activeBatchData && (
        <div className="space-y-6">
          {/* Batch Summary Header */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white">
                  Đợt import: {activeBatchData.fileName}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isCommitted
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isRolledBack
                      ? "bg-slate-800 text-slate-400 border border-slate-700 line-through"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {activeBatchData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Tổng: <strong>{activeBatchData.totalRows}</strong> dòng ({activeBatchData.validRows} hợp lệ, {activeBatchData.invalidRows} lỗi cú pháp).
                Người nạp: {activeBatchData.importedByName}.
              </p>
            </div>

            {/* Gating Commit Button */}
            <div className="flex items-center gap-3">
              {!isCommitted && !isRolledBack && (
                <button
                  onClick={handleCommitCurrentBatch}
                  disabled={!canCommit || isCommitting}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    canCommit
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  }`}
                >
                  {canCommit ? (
                    <Unlock className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                  {isCommitting ? "Đang ghi dữ liệu..." : "Nạp Vào Hệ Thống (Commit to Production)"}
                </button>
              )}

              {isCommitted && (
                <button
                  onClick={() => setRollbackBatchId(activeBatchData.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-sm font-semibold transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Thu Hồi (Rollback)
                </button>
              )}
            </div>
          </div>

          {/* Gating Alert Banner */}
          {!isCommitted && !isRolledBack && unreviewedCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>Cổng An Toàn (Gating Lock):</strong> Còn <strong>{unreviewedCount}</strong> bản ghi khớp mờ (FUZZY) hoặc chưa có khớp (MANUAL_REVIEW).
                  Vui lòng bấm nút <em>"Duyệt / Chỉnh sửa"</em> để kiểm tra trước khi nạp vào cơ sở dữ liệu chính thức.
                </span>
              </div>
            </div>
          )}

          {/* Mapping Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Danh Sách Khớp Thực Thể (Entity Mappings)
              </h4>
              <span className="text-xs text-slate-400">
                Tổng số thực thể cần khớp: {mappings.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tên Trong File (Raw)</th>
                    <th className="px-4 py-4">Học Sinh Khớp</th>
                    <th className="px-4 py-4">Môn Học & Kỳ Thi</th>
                    <th className="px-4 py-4">Mức Độ Tin Cậy</th>
                    <th className="px-4 py-4">Ghi Chú Khớp</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mappings.map((m: any) => {
                    const matchedStudent = contextData.students.find(
                      (st) => st.id === m.matchedStudentId
                    );
                    const matchedSubject = contextData.subjects.find(
                      (sub) => sub.id === m.matchedSubjectId
                    );
                    const matchedPeriod = contextData.examPeriods.find(
                      (ep) => ep.id === m.matchedPeriodId
                    );

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{m.rawName}</div>
                          <div className="text-xs text-slate-400">
                            {m.rawStudentCode ? `Mã: ${m.rawStudentCode}` : ""}
                            {m.rawClassLabel ? ` • Lớp: ${m.rawClassLabel}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {matchedStudent ? (
                            <div>
                              <div className="font-bold text-slate-200">
                                {matchedStudent.user?.name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {matchedStudent.classRoom?.name || "Chưa xếp lớp"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-rose-400 text-xs font-semibold">
                              Chưa gắn học sinh
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div>
                            Môn:{" "}
                            <strong className="text-slate-200">
                              {matchedSubject?.name || m.rawSubject || "—"}
                            </strong>
                          </div>
                          <div className="text-slate-400">
                            Kỳ: {matchedPeriod?.name || m.rawPeriod || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {m.matchConfidence === "EXACT" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" /> EXACT (Chính xác)
                            </span>
                          )}
                          {m.matchConfidence === "FUZZY" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5" /> FUZZY (Khớp mờ)
                            </span>
                          )}
                          {m.matchConfidence === "MANUAL_REVIEW" && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" /> MANUAL (Cần duyệt)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400 max-w-xs truncate">
                          {m.notes || "—"}
                          {m.reviewedByName && (
                            <div className="text-indigo-400 font-medium mt-0.5">
                              Đã duyệt bởi: {m.reviewedByName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isCommitted && !isRolledBack && (
                            <button
                              onClick={() => handleOpenEditMapping(m)}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition"
                            >
                              Duyệt / Sửa
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY & ROLLBACK */}
      {activeTab === "HISTORY" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Lịch Sử Các Đợt Import Điểm</h3>
              <p className="text-xs text-slate-400 mt-1">
                Quản lý các đợt nạp điểm trong quá khứ và thực hiện thu hồi (Rollback) toàn diện.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tên File / Đợt Import</th>
                  <th className="px-4 py-4">Trạng Thái</th>
                  <th className="px-4 py-4">Số Dòng / Điểm</th>
                  <th className="px-4 py-4">Người Nạp</th>
                  <th className="px-4 py-4">Thời Gian</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {b.fileName}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          b.status === "COMMITTED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : b.status === "ROLLED_BACK"
                            ? "bg-slate-800 text-slate-400 border border-slate-700 line-through"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div>Tổng: {b.totalRows} dòng</div>
                      <div className="text-slate-400">
                        Điểm ghi nhận: {b._count?.scores ?? b.validRows}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-300">
                      {b.importedByName}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {new Date(b.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSelectBatchToReview(b.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                        >
                          Chi Tiết
                        </button>
                        {b.status === "COMMITTED" && (
                          <button
                            onClick={() => setRollbackBatchId(b.id)}
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition"
                          >
                            Thu Hồi (Rollback)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MAPPING MODAL */}
      {editingMapping && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Kiểm Duyệt Khớp Thực Thể
              </h4>
              <button
                onClick={() => setEditingMapping(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div>
                Tên gốc trong file: <strong className="text-white">{editingMapping.rawName}</strong>
              </div>
              {editingMapping.rawStudentCode && (
                <div>Mã HS gốc: {editingMapping.rawStudentCode}</div>
              )}
              {editingMapping.rawClassLabel && (
                <div>Lớp gốc: {editingMapping.rawClassLabel}</div>
              )}
              <div>Môn: {editingMapping.rawSubject} • Kỳ thi: {editingMapping.rawPeriod}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Chọn Học Sinh Chính Thức *
                </label>
                <select
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chưa chọn học sinh --</option>
                  {contextData.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.user?.name} {st.studentCode ? `(${st.studentCode})` : ""} - {st.classRoom?.name || "Chưa xếp lớp"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Chọn Môn Học *
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chưa chọn môn học --</option>
                  {contextData.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Chọn Kỳ Thi Chuẩn Hóa *
                </label>
                <select
                  value={editPeriodId}
                  onChange={(e) => setEditPeriodId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chưa chọn kỳ thi --</option>
                  {contextData.examPeriods.map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      {ep.name} (Thứ tự: {ep.orderIndex})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Ghi chú duyệt
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Xác nhận khớp chính xác..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setEditingMapping(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={isSavingMapping || !editStudentId || !editSubjectId || !editPeriodId}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {isSavingMapping ? "Đang lưu..." : "Xác Nhận & Đánh Dấu Hợp Lệ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLLBACK CONFIRMATION MODAL */}
      {rollbackBatchId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <RotateCcw className="w-6 h-6" />
              <h4 className="text-lg font-bold text-white">Xác Nhận Thu Hồi (Rollback)</h4>
            </div>

            <p className="text-sm text-slate-300">
              Hành động này sẽ <strong>xóa toàn bộ điểm số</strong> đã được nạp từ đợt import này và tự động <strong>tính toán lại toàn bộ chỉ số Hành trình học sinh</strong> cho trường.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Lý do thu hồi *
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                placeholder="Nhập sai cột điểm / nhầm đợt thi..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRollbackBatchId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={handleExecuteRollback}
                disabled={isRollingBack || !rollbackReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {isRollingBack ? "Đang thu hồi..." : "Xác Nhận Thu Hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
