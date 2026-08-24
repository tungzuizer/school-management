"use client";

import React, { useEffect, useState } from "react";
import {
  getClassTranscripts,
  approveAndLockTranscripts,
  getPendingUnlockRequests,
  reviewUnlockRequest,
} from "@/app/actions/transcript";
import PrintableTranscript from "@/components/transcript/PrintableTranscript";
import {
  Loader2,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileCheck,
  Building,
} from "lucide-react";

export default function AdminTranscriptsPage() {
  const [activeTab, setActiveTab] = useState<"approve" | "unlocks">("approve");
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/classes");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.classes || [];
          setClasses(list);
          if (list.length > 0) {
            setClassId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy lớp học:", err);
      }
    }
    fetchClasses();
    fetchUnlockRequests();
  }, []);

  useEffect(() => {
    if (classId) {
      loadTranscripts();
    }
  }, [classId, schoolYear]);

  const loadTranscripts = async () => {
    if (!classId) return;
    setLoading(true);
    setMessage(null);
    const res = await getClassTranscripts(classId, schoolYear);
    if (res.success && res.data) {
      setTranscripts(res.data);
      if (res.data.length > 0) {
        setSelectedTranscript(res.data[0]);
      } else {
        setSelectedTranscript(null);
      }
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi tải học bạ" });
    }
    setLoading(false);
  };

  const fetchUnlockRequests = async () => {
    const res = await getPendingUnlockRequests();
    if (res.success && res.data) {
      setUnlockRequests(res.data);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(transcripts.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApproveAndLock = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn duyệt và KHÓA SỔ ${selectedIds.length} bản ghi học bạ?`)) return;

    setProcessing(true);
    setMessage(null);
    const res = await approveAndLockTranscripts(selectedIds);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Phê duyệt và khóa sổ học bạ thành công" });
      setSelectedIds([]);
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi phê duyệt học bạ" });
    }
    setProcessing(false);
  };

  const handleReviewUnlock = async (requestId: string, approve: boolean) => {
    setProcessing(true);
    setMessage(null);
    const res = await reviewUnlockRequest(requestId, approve);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Xử lý yêu cầu thành công" });
      await fetchUnlockRequests();
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi xử lý yêu cầu mở khóa" });
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-2xl text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-amber-400/20 rounded-full text-xs font-bold text-amber-300 uppercase tracking-wide border border-amber-400/30">
            Ban Giám Hiệu / Hiệu Trưởng
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Duyệt & Khóa Sổ Pháp Lý Học Bạ</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Phê duyệt học bạ các lớp học và quản lý các yêu cầu mở khóa sửa đổi học bạ từ GVCN
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/10 p-1.5 rounded-xl border border-white/20">
          <button
            onClick={() => setActiveTab("approve")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeTab === "approve" ? "bg-white text-indigo-900 shadow-sm" : "text-white hover:text-indigo-200"
            }`}
          >
            Phê Duyệt Lớp Học
          </button>
          <button
            onClick={() => setActiveTab("unlocks")}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "unlocks" ? "bg-white text-indigo-900 shadow-sm" : "text-white hover:text-indigo-200"
            }`}
          >
            <span>Yêu Cầu Mở Khóa</span>
            {unlockRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-bold animate-pulse">
                {unlockRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {activeTab === "approve" ? (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-indigo-600" />
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="p-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} (Khối {c.gradeLevel})
                  </option>
                ))}
              </select>

              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="p-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 outline-none"
              >
                <option value="2025-2026">Năm học 2025-2026</option>
                <option value="2024-2025">Năm học 2024-2025</option>
              </select>
            </div>

            <button
              onClick={handleApproveAndLock}
              disabled={selectedIds.length === 0 || processing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Phê Duyệt & Khóa Sổ ({selectedIds.length})</span>
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Student List Selection */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={transcripts.length > 0 && selectedIds.length === transcripts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700 uppercase">Chọn Tất Cả</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Tổng: {transcripts.length} học sinh</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span>Đang tải học bạ...</span>
                </div>
              ) : transcripts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">Chưa có bản ghi học bạ nào</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto pr-1 space-y-1">
                  {transcripts.map((t) => {
                    const isSelected = selectedTranscript?.id === t.id;
                    const isChecked = selectedIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTranscript(t)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 shadow-2xs"
                            : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(t.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm text-gray-900 font-bold">{t.student?.user?.name}</strong>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                t.status === "APPROVED_LOCKED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {t.status === "APPROVED_LOCKED"
                                ? "Đã Khóa"
                                : t.status === "SUBMITTED"
                                ? "Đã Trình Nộp"
                                : "Nháp"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ĐTB Cả năm: <strong className="text-indigo-700 font-mono">{t.fullYearGPA ?? "---"}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Preview Printable Transcript */}
            <div className="lg:col-span-2">
              {selectedTranscript ? (
                <PrintableTranscript transcript={selectedTranscript} />
              ) : (
                <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400">
                  Chọn học sinh để duyệt thông tin chi tiết
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Unlock Requests */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Unlock className="w-5 h-5 text-amber-600" />
            <span>Danh Sách Yêu Cầu Mở Khóa Học Bạ Từ GVCN ({unlockRequests.length})</span>
          </h3>

          {unlockRequests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-gray-700">Hiện tại không có yêu cầu mở khóa nào cần duyệt.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 space-y-4">
              {unlockRequests.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">
                      Học sinh: {req.transcript?.student?.user?.name} (Lớp {req.transcript?.classRoom?.name})
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Năm học: <strong className="text-gray-800">{req.transcript?.schoolYear}</strong> • Ngày gửi: {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg italic">
                      Lý do xin mở khóa: "{req.reason}"
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReviewUnlock(req.id, false)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Từ Chối
                    </button>
                    <button
                      onClick={() => handleReviewUnlock(req.id, true)}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Đồng Ý Mở Khóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
