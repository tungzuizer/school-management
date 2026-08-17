"use client";

import { useEffect, useState, useCallback } from "react";
import { getLessonPlansForAdmin, reviewLessonPlan } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import {
  Check,
  X,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  User,
  AlertCircle,
  FileCheck,
  FileX,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface LessonPlanReview {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  action: string;
  comment: string;
  createdAt: Date;
}

interface LessonPlanItem {
  id: string;
  teacherName: string;
  subjectName: string;
  className: string;
  weekNumber: number;
  periodStart: number;
  periodEnd: number;
  title: string;
  objectives: string;
  content: string;
  activities: string;
  materials: string;
  assessment: string;
  notes: string;
  status: string;
  driveFileUrl: string | null;
  reviewNote: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviews: LessonPlanReview[];
}

export default function AdminLessonPlansPage() {
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Detail & Action states
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getLessonPlansForAdmin();
      setPlans(items as any);
    } catch (e: any) {
      showToast("Lỗi khi tải thông tin giáo án: " + (e.message || ""), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle Tab and Search filtering
  useEffect(() => {
    let result = plans;

    // Filter by Tab status
    if (activeTab === "PENDING") {
      result = result.filter(
        (p) =>
          p.status === "VP_APPROVED" ||
          p.status === "HEAD_APPROVED" ||
          p.status === "SUBMITTED"
      );
    } else if (activeTab === "APPROVED") {
      result = result.filter((p) => p.status === "APPROVED");
    } else if (activeTab === "REJECTED") {
      result = result.filter(
        (p) =>
          p.status === "REJECTED" ||
          p.status === "VP_REJECTED" ||
          p.status === "HEAD_REJECTED"
      );
    }

    // Filter by Search text
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.teacherName.toLowerCase().includes(searchLower) ||
          p.title.toLowerCase().includes(searchLower) ||
          p.subjectName.toLowerCase().includes(searchLower) ||
          p.className.toLowerCase().includes(searchLower)
      );
    }

    // Filter by Subject
    if (selectedSubject !== "") {
      result = result.filter((p) => p.subjectName === selectedSubject);
    }

    // Filter by Class
    if (selectedClass !== "") {
      result = result.filter((p) => p.className === selectedClass);
    }

    setFilteredPlans(result);
  }, [plans, activeTab, searchTerm, selectedSubject, selectedClass]);

  const uniqueSubjects = Array.from(new Set(plans.map((p) => p.subjectName))).sort();
  const uniqueClasses = Array.from(new Set(plans.map((p) => p.className))).sort();

  const handleReview = async (planId: string, status: "APPROVED" | "REJECTED") => {
    const note = reviewNotes[planId] || "";
    if (status === "REJECTED" && !note.trim()) {
      showToast("Vui lòng nhập lý do/nhận xét khi từ chối phê duyệt giáo án", "error");
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [planId]: true }));
    try {
      const res = await reviewLessonPlan({
        planId,
        status,
        reviewNote: note,
      });

      if (res.success) {
        showToast(
          status === "APPROVED" ? "Đã phê duyệt giáo án chính thức" : "Đã từ chối giáo án",
          "success"
        );
        fetchPlans();
      } else {
        showToast(res.error || "Không thể thực hiện phê duyệt", "error");
      }
    } catch (e) {
      showToast("Lỗi hệ thống khi cập nhật giáo án", "error");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-3 py-1 text-xs font-extrabold rounded-full badge-glowing-emerald flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <Check className="w-3.5 h-3.5" /> Hiệu trưởng đã duyệt
          </span>
        );
      case "VP_APPROVED":
        return (
          <span className="px-3 py-1 text-xs font-extrabold rounded-full badge-glowing-sky flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-sky-500 pulse-dot" />
            <ShieldCheck className="w-3.5 h-3.5" /> Phó HT đã duyệt
          </span>
        );
      case "HEAD_APPROVED":
        return (
          <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-cyan-500 pulse-dot" />
            <Clock className="w-3.5 h-3.5" /> Tổ trưởng đã duyệt
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-3 py-1 text-xs font-extrabold rounded-full badge-glowing-amber flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot" />
            <Clock className="w-3.5 h-3.5" /> Mới nộp (Chờ duyệt)
          </span>
        );
      case "REJECTED":
      case "VP_REJECTED":
      case "HEAD_REJECTED":
        return (
          <span className="px-3 py-1 text-xs font-extrabold rounded-full badge-glowing-rose flex items-center gap-1.5 shrink-0 transition-transform hover:scale-105">
            <span className="w-2 h-2 rounded-full bg-rose-500 pulse-dot" />
            <X className="w-3.5 h-3.5" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700 shrink-0">
            Bản nháp
          </span>
        );
    }
  };

  const pendingCount = plans.filter(
    (p) =>
      p.status === "VP_APPROVED" ||
      p.status === "HEAD_APPROVED" ||
      p.status === "SUBMITTED"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ban Giám Hiệu Phê Duyệt Giáo Án</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            Phê duyệt chính thức giáo án của toàn bộ giáo viên nhà trường
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition duration-150 shadow-2xs"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {/* Statistics board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">Tổng giáo án nhận được</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-amber-700">Chờ Hiệu trưởng duyệt</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-700">Đã phê duyệt hoàn tất</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1">
            {plans.filter((p) => p.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-rose-700">Đã từ chối</p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-800 mt-1">
            {plans.filter((p) => p.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Tabs and Filters Row */}
      <div className="bg-white border rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-2xs">
        {/* Status Tabs with Horizontal Scroll for Mobile */}
        <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-100 pb-0.5 no-scrollbar">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => {
            let label = "";
            let count = 0;
            switch (tab) {
              case "PENDING":
                label = "Chờ duyệt";
                count = pendingCount;
                break;
              case "APPROVED":
                label = "Đã duyệt";
                count = plans.filter((p) => p.status === "APPROVED").length;
                break;
              case "REJECTED":
                label = "Từ chối";
                count = plans.filter((p) => p.status === "REJECTED" || p.status === "VP_REJECTED" || p.status === "HEAD_REJECTED").length;
                break;
              case "ALL":
                label = "Tất cả";
                count = plans.length;
                break;
            }

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedPlanId(null);
                }}
                className={`pb-2.5 px-3.5 sm:px-4 text-xs font-bold transition-all relative shrink-0 ${
                  activeTab === tab
                    ? "text-indigo-700 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                )}
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên giáo viên, chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">Lọc theo Môn Học (Tất cả)</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">Lọc theo Lớp Học (Tất cả)</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2 font-semibold">Đang tải danh sách giáo án...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border p-6">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Không có giáo án nào thuộc mục này</p>
          </div>
        ) : (
          filteredPlans.map((p) => {
            const isExpanded = expandedPlanId === p.id;
            const isSubmitting = submittingIds[p.id] || false;
            const canReview = p.status !== "APPROVED" && p.status !== "REJECTED";

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-300 shadow-2xs interactive-card"
              >
                {/* Header card info */}
                <div
                  onClick={() => setExpandedPlanId(isExpanded ? null : p.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                        Tuần {p.weekNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        Lớp {p.className} • Tiết {p.periodStart === p.periodEnd ? p.periodStart : `${p.periodStart}-${p.periodEnd}`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> GV: <strong className="text-slate-800">{p.teacherName}</strong>
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight mt-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Môn học: {p.subjectName}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {getStatusBadge(p.status)}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-3.5 sm:p-4 space-y-3.5 text-xs text-slate-700">
                    {/* Google Drive Link if present */}
                    {p.driveFileUrl && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                        <span className="font-semibold text-blue-900 text-xs">File giáo án đính kèm Google Drive:</span>
                        <a
                          href={p.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Mở Thư Mục Drive ↗</span>
                        </a>
                      </div>
                    )}

                    {/* Lesson Plan Information blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <span className="font-bold text-slate-500 block mb-1">Mục tiêu bài dạy (Objectives):</span>
                        <p className="bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.objectives || "Chưa nhập mục tiêu"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-500 block mb-1">Nội dung bài học (Content):</span>
                        <p className="bg-white rounded-xl p-3 border border-slate-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.content || "Chưa nhập nội dung"}
                        </p>
                      </div>
                    </div>

                    {/* Review History Trail */}
                    {p.reviews && p.reviews.length > 0 && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <p className="font-bold text-slate-800 text-xs">Lịch sử duyệt các cấp:</p>
                        <div className="space-y-2">
                          {p.reviews.map((rev) => (
                            <div key={rev.id} className="p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{rev.reviewerName} ({rev.reviewerRole})</span>
                                <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleString("vi-VN")}</span>
                              </div>
                              <p className="text-slate-600">Hành động: <strong className="text-indigo-700">{rev.action}</strong></p>
                              {rev.comment && <p className="text-slate-500 italic">&quot;{rev.comment}&quot;</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review actions if pending */}
                    {canReview ? (
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                          <AlertCircle className="w-4 h-4 text-indigo-600" />
                          <span>Hiệu Trưởng Đánh Giá & Phê Duyệt:</span>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-600 mb-1">
                            Nhận xét phê duyệt / Ý kiến chỉ đạo (Bắt buộc nếu từ chối):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Nhập nhận xét hoặc chỉ đạo phê duyệt..."
                            value={reviewNotes[p.id] || ""}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                          <button
                            onClick={() => handleReview(p.id, "APPROVED")}
                            disabled={isSubmitting}
                            className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 min-h-[44px]"
                          >
                            <FileCheck className="w-4 h-4" />
                            Phê Duyệt Giáo Án (Hoàn tất)
                          </button>

                          <button
                            onClick={() => handleReview(p.id, "REJECTED")}
                            disabled={isSubmitting}
                            className="w-full sm:flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 min-h-[44px]"
                          >
                            <FileX className="w-4 h-4" />
                            Từ Chối / Yêu Cầu Sửa Lại
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-semibold">
                        ✅ Giáo án này đã được hoàn tất phê duyệt ({p.reviewedBy || "Ban Giám Hiệu"}).
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
