"use client";

import React, { useEffect, useState } from "react";
import {
  getClassTranscripts,
  generateOrSyncClassTranscripts,
  updateHomeroomTeacherTranscript,
  submitClassTranscripts,
  requestTranscriptUnlock,
} from "@/app/actions/transcript";
import PrintableTranscript from "@/components/transcript/PrintableTranscript";
import {
  Loader2,
  RefreshCw,
  Send,
  Edit,
  Save,
  Unlock,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import { ConductRating, AcademicRating } from "@prisma/client";

export default function TeacherTranscriptPage() {
  const [classId, setClassId] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal / Form state for Editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");

  // Edit payload state
  const [editForm, setEditForm] = useState({
    term1Conduct: "" as ConductRating | "",
    term2Conduct: "" as ConductRating | "",
    fullYearConduct: "" as ConductRating | "",
    term1Academic: "" as AcademicRating | "",
    term2Academic: "" as AcademicRating | "",
    fullYearAcademic: "" as AcademicRating | "",
    homeroomTeacherComment: "",
    promotionStatus: "Lên lớp",
    rewardsAwarded: "",
  });

  useEffect(() => {
    // Fetch classes for teacher
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
        console.error("Lỗi lấy danh sách lớp:", err);
      }
    }
    fetchClasses();
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
      setMessage({ type: "error", text: res.error || "Không thể lấy danh sách học bạ" });
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!classId) return;
    setSyncing(true);
    setMessage(null);
    const res = await generateOrSyncClassTranscripts(classId, schoolYear);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đồng bộ thành công" });
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi đồng bộ học bạ" });
    }
    setSyncing(false);
  };

  const handleSubmitAll = async () => {
    if (!classId) return;
    if (!confirm("Bạn có chắc chắn muốn nộp học bạ cả lớp trình BGH phê duyệt & khóa sổ?")) return;
    setSubmitting(true);
    setMessage(null);
    const res = await submitClassTranscripts(classId, schoolYear);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã trình nộp thành công" });
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi gửi nộp học bạ" });
    }
    setSubmitting(false);
  };

  const openEditModal = (t: any) => {
    setSelectedTranscript(t);
    setEditForm({
      term1Conduct: t.term1Conduct || "",
      term2Conduct: t.term2Conduct || "",
      fullYearConduct: t.fullYearConduct || "",
      term1Academic: t.term1Academic || "",
      term2Academic: t.term2Academic || "",
      fullYearAcademic: t.fullYearAcademic || "",
      homeroomTeacherComment: t.homeroomTeacherComment || "",
      promotionStatus: t.promotionStatus || "Lên lớp",
      rewardsAwarded: t.rewardsAwarded || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTranscript) return;
    setSaving(true);
    setMessage(null);

    const payload = {
      term1Conduct: editForm.term1Conduct ? (editForm.term1Conduct as ConductRating) : null,
      term2Conduct: editForm.term2Conduct ? (editForm.term2Conduct as ConductRating) : null,
      fullYearConduct: editForm.fullYearConduct ? (editForm.fullYearConduct as ConductRating) : null,
      term1Academic: editForm.term1Academic ? (editForm.term1Academic as AcademicRating) : null,
      term2Academic: editForm.term2Academic ? (editForm.term2Academic as AcademicRating) : null,
      fullYearAcademic: editForm.fullYearAcademic ? (editForm.fullYearAcademic as AcademicRating) : null,
      homeroomTeacherComment: editForm.homeroomTeacherComment,
      promotionStatus: editForm.promotionStatus,
      rewardsAwarded: editForm.rewardsAwarded,
    };

    const res = await updateHomeroomTeacherTranscript(selectedTranscript.id, payload);
    if (res.success) {
      setMessage({ type: "success", text: "Đã cập nhật đánh giá tổng kết thành công" });
      setIsEditModalOpen(false);
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi cập nhật học bạ" });
    }
    setSaving(false);
  };

  const handleUnlockRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTranscript || !unlockReason) return;
    setSaving(true);
    const res = await requestTranscriptUnlock(selectedTranscript.id, unlockReason);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã gửi yêu cầu xin mở khóa" });
      setIsUnlockModalOpen(false);
      setUnlockReason("");
      await loadTranscripts();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi xin mở khóa" });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-slate-50 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 sm:p-8 rounded-2xl text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 uppercase tracking-wide">
            Dành Cho Giáo Viên Chủ Nhiệm
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">Quản Lý & Đánh Giá Học Bạ Lớp</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Tổng kết học lực, hạnh kiểm, nhận xét đánh giá và trình BGH phê duyệt khóa sổ
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer px-2 py-1"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900">
                Lớp: {c.name}
              </option>
            ))}
          </select>

          <select
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer px-2 py-1 border-l border-white/20"
          >
            <option value="2025-2026" className="text-gray-900">Năm học 2025-2026</option>
            <option value="2024-2025" className="text-gray-900">Năm học 2024-2025</option>
          </select>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Đồng bộ từ Bảng Điểm Môn Học</span>
          </button>
        </div>

        <button
          onClick={handleSubmitAll}
          disabled={submitting || transcripts.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Gửi Trình BGH Phê Duyệt Cả Lớp</span>
        </button>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Student List + Transcript Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Transcripts List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Danh Sách Học Sinh ({transcripts.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              <span className="text-xs font-medium">Đang tải danh sách...</span>
            </div>
          ) : transcripts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              Chưa có học bạ. Vui lòng bấm "Đồng bộ từ Bảng Điểm".
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto pr-1 space-y-1">
              {transcripts.map((t) => {
                const isSelected = selectedTranscript?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTranscript(t)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 shadow-2xs"
                        : "hover:bg-gray-50 border-transparent"
                    }`}
                  >
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
                          ? "Chờ Duyệt"
                          : "Bản Nháp"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>ĐTB Cả năm: <strong className="text-indigo-700 font-mono">{t.fullYearGPA ?? "---"}</strong></span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (t.status === "APPROVED_LOCKED") {
                            setSelectedTranscript(t);
                            setIsUnlockModalOpen(true);
                          } else {
                            openEditModal(t);
                          }
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1"
                      >
                        {t.status === "APPROVED_LOCKED" ? (
                          <>
                            <Unlock className="w-3 h-3 text-amber-600" /> Xin Mở Khóa
                          </>
                        ) : (
                          <>
                            <Edit className="w-3 h-3" /> Đánh giá GVCN
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Transcript Preview & Printing Sheet */}
        <div className="lg:col-span-2">
          {selectedTranscript ? (
            <PrintableTranscript transcript={selectedTranscript} />
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400">
              Chọn học sinh từ danh sách bên trái để xem và tổng kết học bạ
            </div>
          )}
        </div>
      </div>

      {/* Modal: Edit Homeroom Teacher Evaluation */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-600" />
              <span>Đánh Giá Tổng Kết Học Bạ: {selectedTranscript?.student?.user?.name}</span>
            </h3>

            <form onSubmit={handleSaveTranscript} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Rèn luyện HK1 (Hạnh kiểm)</label>
                  <select
                    value={editForm.term1Conduct}
                    onChange={(e) => setEditForm({ ...editForm, term1Conduct: e.target.value as ConductRating })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                  >
                    <option value="">-- Chưa đánh giá --</option>
                    <option value="GOOD">Tốt</option>
                    <option value="FAIR">Khá</option>
                    <option value="AVERAGE">Đạt</option>
                    <option value="POOR">Chưa đạt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Rèn luyện Cả Năm</label>
                  <select
                    value={editForm.fullYearConduct}
                    onChange={(e) => setEditForm({ ...editForm, fullYearConduct: e.target.value as ConductRating })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                  >
                    <option value="">-- Chưa đánh giá --</option>
                    <option value="GOOD">Tốt</option>
                    <option value="FAIR">Khá</option>
                    <option value="AVERAGE">Đạt</option>
                    <option value="POOR">Chưa đạt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kết quả Lên lớp</label>
                  <select
                    value={editForm.promotionStatus}
                    onChange={(e) => setEditForm({ ...editForm, promotionStatus: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                  >
                    <option value="Lên lớp">Được lên lớp</option>
                    <option value="Thi lại">Kiểm tra lại / Đánh giá lại</option>
                    <option value="Ở lại lớp">Chưa được lên lớp (Ở lại lớp)</option>
                    <option value="Hoàn thành CT">Hoàn thành chương trình học</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Khen thưởng danh hiệu</label>
                  <input
                    type="text"
                    value={editForm.rewardsAwarded}
                    onChange={(e) => setEditForm({ ...editForm, rewardsAwarded: e.target.value })}
                    placeholder="Học sinh Tiên tiến / Xuất sắc..."
                    className="w-full p-2.5 border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nhận xét của Giáo viên Chủ nhiệm</label>
                <textarea
                  rows={4}
                  value={editForm.homeroomTeacherComment}
                  onChange={(e) => setEditForm({ ...editForm, homeroomTeacherComment: e.target.value })}
                  placeholder="Nhập nhận xét chi tiết về tinh thần học tập, rèn luyện..."
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-white bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Lưu Nhận Xét</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Unlock Request */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-600" />
              <span>Gửi Yêu Cầu Xin Mở Khóa Học Bạ</span>
            </h3>
            <p className="text-xs text-gray-500">
              Học bạ của <strong>{selectedTranscript?.student?.user?.name}</strong> đã được Ban Giám Hiệu phê duyệt và khóa sổ pháp lý.
            </p>

            <form onSubmit={handleUnlockRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do xin mở khóa chỉnh sửa *</label>
                <textarea
                  rows={3}
                  required
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Ví dụ: Cập nhật lại điểm phúc khảo môn Toán..."
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 font-semibold rounded-xl text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 font-semibold rounded-xl text-sm flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Gửi Yêu Cầu Up BGH</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
