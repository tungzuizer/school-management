"use client";

import { useEffect, useState, useCallback } from "react";
import { getApprovalItems, processApproval } from "./actions";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  UserCheck,
  Search,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type LessonPlanItem = Awaited<ReturnType<typeof getApprovalItems>>["lessonPlans"][number];
type ChangeRequestItem = Awaited<ReturnType<typeof getApprovalItems>>["changeRequests"][number];
type ApprovalItem = LessonPlanItem | ChangeRequestItem;

export default function ApprovalsPage() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlanItem[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "LESSON_PLAN" | "CHANGE_REQUEST">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<{ id: string; type: "LESSON_PLAN" | "CHANGE_REQUEST"; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { showToast, ToastComponent } = useToast();

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const data = await getApprovalItems();
    setLessonPlans(data.lessonPlans);
    setChangeRequests(data.changeRequests);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Combine items
  const allItems: ApprovalItem[] = [...lessonPlans, ...changeRequests];

  // Helper status predicate
  const isPending = (status: string) => ["SUBMITTED", "HEAD_APPROVED", "VP_APPROVED", "PENDING"].includes(status);
  const isApproved = (status: string) => ["APPROVED"].includes(status);
  const isRejected = (status: string) => ["REJECTED", "HEAD_REJECTED", "VP_REJECTED", "CANCELLED"].includes(status);

  // Filtering
  const filtered = allItems.filter((item) => {
    // Category filter
    if (categoryFilter !== "ALL" && item.type !== categoryFilter) return false;

    // Status tab filter
    if (activeTab === "PENDING" && !isPending(item.status)) return false;
    if (activeTab === "APPROVED" && !isApproved(item.status)) return false;
    if (activeTab === "REJECTED" && !isRejected(item.status)) return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const teacherMatch = item.teacherName.toLowerCase().includes(q);
      const classMatch = item.className.toLowerCase().includes(q);
      return titleMatch || teacherMatch || classMatch;
    }

    return true;
  });

  const pendingCount = allItems.filter((i) => isPending(i.status)).length;
  const approvedCount = allItems.filter((i) => isApproved(i.status)).length;
  const rejectedCount = allItems.filter((i) => isRejected(i.status)).length;

  const handleApproveDirect = async (id: string, type: "LESSON_PLAN" | "CHANGE_REQUEST", title: string) => {
    setSubmitting(true);
    const res = await processApproval({ itemId: id, itemType: type, action: "APPROVE", reviewNote: "Phê duyệt thành công" });
    setSubmitting(false);
    if (res.success) {
      showToast(`Đã PHÊ DUYỆT: ${title}`, "success");
      loadData(true);
    } else {
      showToast(res.error || "Phê duyệt thất bại", "error");
    }
  };

  const openRejectModal = (id: string, type: "LESSON_PLAN" | "CHANGE_REQUEST", title: string) => {
    setTargetItem({ id, type, title });
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetItem) return;
    if (!rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối để giáo viên biết và sửa đổi", "error");
      return;
    }
    setSubmitting(true);
    const res = await processApproval({
      itemId: targetItem.id,
      itemType: targetItem.type,
      action: "REJECT",
      reviewNote: rejectReason.trim(),
    });
    setSubmitting(false);
    if (res.success) {
      showToast(`Đã TỪ CHỐI thành công: ${targetItem.title}`, "success");
      setRejectModalOpen(false);
      setTargetItem(null);
      setRejectReason("");
      loadData(true);
    } else {
      showToast(res.error || "Từ chối thất bại", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trung Tâm Phê Duyệt & Từ Chối</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xét duyệt hoặc Từ chối kèm lý do đối với Giáo án, Đơn từ & Phân công giảng dạy
          </p>
        </div>

        <button
          onClick={() => loadData()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("PENDING")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-amber-50 border-amber-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Chờ xét duyệt</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{pendingCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("APPROVED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "APPROVED"
              ? "bg-emerald-50 border-emerald-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đã phê duyệt</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{approvedCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("REJECTED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "REJECTED"
              ? "bg-rose-50 border-rose-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Đã từ chối</span>
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{rejectedCount}</p>
        </div>

        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === "ALL"
              ? "bg-indigo-50 border-indigo-300 shadow-sm"
              : "bg-white border-slate-200 hover:border-indigo-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Tất cả mục</span>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{allItems.length}</p>
        </div>
      </div>

      {/* Toolbar Filters & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, GV, lớp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 border rounded-xl text-xs bg-slate-50 focus:bg-white font-medium text-slate-700"
          >
            <option value="ALL">📁 Tất cả thể loại</option>
            <option value="LESSON_PLAN">📘 Giáo án giảng dạy</option>
            <option value="CHANGE_REQUEST">🔄 Đổi giáo viên / Phân công</option>
          </select>
        </div>

        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-bold self-end sm:self-auto">
          <button
            onClick={() => setViewMode("GRID")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "GRID" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🎴 Dạng Thẻ
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "TABLE" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 Dạng Bảng
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "GRID" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Đang tải danh sách chờ duyệt...</div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">Không có mục nào phù hợp.</div>
          ) : (
            filtered.map((item) => {
              const pending = isPending(item.status);
              const approved = isApproved(item.status);
              const rejected = isRejected(item.status);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                          item.type === "LESSON_PLAN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {item.type === "LESSON_PLAN" ? "📘 Giáo án" : "🔄 Đổi GV"}
                      </span>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${
                          pending
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : approved
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {pending
                          ? "⏳ Chờ duyệt"
                          : approved
                          ? "✅ Đã phê duyệt"
                          : "❌ Đã từ chối"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">Người nộp/Yêu cầu:</span> {item.teacherName}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Môn & Lớp:</span> {item.subjectName} — {item.className}
                      </p>
                    </div>

                    {item.type === "CHANGE_REQUEST" && (
                      <div className="p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 space-y-1">
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">GV mới thay thế:</span>{" "}
                          {(item as ChangeRequestItem).newTeacherName}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Lý do đổi:</span>{" "}
                          {(item as ChangeRequestItem).reason}
                        </p>
                      </div>
                    )}

                    {item.type === "LESSON_PLAN" && (item as LessonPlanItem).driveFileUrl && (
                      <a
                        href={(item as LessonPlanItem).driveFileUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Xem File Giáo án (Drive)
                      </a>
                    )}

                    {item.reviewNote && (
                      <div className="p-2.5 bg-slate-100/70 rounded-xl text-xs border text-slate-700 space-y-0.5">
                        <span className="font-semibold block text-slate-900">
                          Nhận xét / Lý do:
                        </span>
                        <p className="italic text-slate-600">"{item.reviewNote}"</p>
                      </div>
                    )}
                  </div>

                  {/* Dual Action Buttons: Phê duyệt & Từ chối */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleApproveDirect(item.id, item.type, item.title)}
                      disabled={submitting}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Phê Duyệt
                    </button>

                    <button
                      onClick={() => openRejectModal(item.id, item.type, item.title)}
                      disabled={submitting}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Từ Chối
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "TABLE" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-slate-500 font-semibold text-xs">
                  <th className="px-4 py-3">Thể loại</th>
                  <th className="px-4 py-3">Nội dung / Tiêu đề</th>
                  <th className="px-4 py-3">Người gửi</th>
                  <th className="px-4 py-3">Môn & Lớp</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Đang tải danh sách chờ duyệt...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Không có mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const pending = isPending(item.status);
                    const approved = isApproved(item.status);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              item.type === "LESSON_PLAN"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.type === "LESSON_PLAN" ? "Giáo án" : "Đổi GV"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{item.title}</td>
                        <td className="px-4 py-3 text-slate-600">{item.teacherName}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.subjectName} — {item.className}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              pending
                                ? "bg-amber-100 text-amber-800"
                                : approved
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {pending ? "Chờ duyệt" : approved ? "Đã duyệt" : "Đã từ chối"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveDirect(item.id, item.type, item.title)}
                              disabled={submitting}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => openRejectModal(item.id, item.type, item.title)}
                              disabled={submitting}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Từ Chối Kèm Lý Do */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Từ chối & Gửi yêu cầu chỉnh sửa"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs leading-relaxed">
            <strong className="block mb-1">Mục từ chối: {targetItem?.title}</strong>
            Nhập lý do từ chối hoặc hướng dẫn sửa đổi cụ thể để giáo viên biết và thực hiện lại.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do từ chối / Nhận xét phản hồi *
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Nội dung bài giảng tuần 12 chưa chuẩn hóa phương pháp mới; cần bổ sung giáo án đồ dùng dạy học..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleConfirmReject}
              disabled={submitting || !rejectReason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Xác Nhận Từ Chối
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
