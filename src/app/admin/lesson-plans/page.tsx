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
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  User,
  Calendar,
  AlertCircle,
  FileCheck,
  FileX,
  RefreshCw,
} from "lucide-react";

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
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  reviewNote: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export default function AdminLessonPlansPage() {
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"ALL" | "SUBMITTED" | "APPROVED" | "REJECTED">("SUBMITTED");
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
  }, [fetchPlans]);

  // Handle Tab and Search filtering
  useEffect(() => {
    let result = plans;

    // Filter by Tab status
    if (activeTab !== "ALL") {
      result = result.filter((p) => p.status === activeTab);
    }

    // Filter by Search text (teacher name, title)
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
          status === "APPROVED" ? "Đã phê duyệt giáo án thành công" : "Đã từ chối phê duyệt giáo án",
          "success"
        );
        // Refresh
        const items = await getLessonPlansForAdmin();
        setPlans(items as any);
      } else {
        showToast(res.error || "Không thể thực hiện phê duyệt", "error");
      }
    } catch (e) {
      showToast("Lỗi hệ thống khi cập nhật giáo án", "error");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [planId]: false }));
    }
  };

  const getStatusBadge = (status: LessonPlanItem["status"]) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <Check className="w-3 h-3" /> Đã duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
            <X className="w-3 h-3" /> Từ chối
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Chờ duyệt
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {ToastComponent}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ban Giám Hiệu Phê Duyệt Giáo Án</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kiểm tra và duyệt kế hoạch bài dạy của giáo viên trước khi giảng dạy
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition duration-150 shadow-sm"
          title="Tải lại danh sách"
        >
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {/* Easy mode hints */}
      {isEasyMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-bold">Trợ giúp Duyệt Giáo Án:</p>
            <p>1. Chọn các tab bên dưới để chuyển giữa danh sách giáo án <strong>Chờ duyệt</strong>, <strong>Đã duyệt</strong> hoặc <strong>Từ chối</strong>.</p>
            <p>2. Nhập tên giáo viên hoặc môn học vào ô Tìm kiếm để tìm nhanh.</p>
            <p>3. Ấn vào một dòng giáo án để xem chi tiết nội dung, mục tiêu giảng dạy.</p>
            <p>4. Điền ý kiến nhận xét (nếu cần), sau đó nhấn nút <strong>Duyệt giáo án</strong> (Màu xanh) hoặc <strong>Không duyệt</strong> (Màu đỏ).</p>
          </div>
        </div>
      )}

      {/* Statistics board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium">Tổng giáo án nhận được</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium font-semibold text-blue-700">Đang chờ phê duyệt</p>
          <p className="text-xl font-bold text-blue-800 mt-1">
            {plans.filter((p) => p.status === "SUBMITTED").length}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium font-semibold text-emerald-700">Đã phê duyệt</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">
            {plans.filter((p) => p.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium font-semibold text-rose-700">Đã từ chối</p>
          <p className="text-xl font-bold text-rose-800 mt-1">
            {plans.filter((p) => p.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Tabs and Filters Row */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex border-b border-gray-100">
          {(["SUBMITTED", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => {
            let label = "";
            let count = 0;
            switch (tab) {
              case "SUBMITTED":
                label = "Chờ duyệt";
                count = plans.filter((p) => p.status === "SUBMITTED").length;
                break;
              case "APPROVED":
                label = "Đã duyệt";
                count = plans.filter((p) => p.status === "APPROVED").length;
                break;
              case "REJECTED":
                label = "Từ chối";
                count = plans.filter((p) => p.status === "REJECTED").length;
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
                  setExpandedPlanId(null); // Clear expansion when switching tabs
                }}
                className={`pb-2.5 px-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab
                    ? "text-blue-700 font-bold"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên giáo viên, chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-gray-400 mt-2 font-medium">Đang tải danh sách giáo án...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border p-6">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Không có giáo án nào thuộc mục này</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm || selectedSubject || selectedClass
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                : "Giáo án gửi lên của các giáo viên sẽ được liệt kê ở đây."}
            </p>
          </div>
        ) : (
          filteredPlans.map((p) => {
            const isExpanded = expandedPlanId === p.id;
            const isSubmitting = submittingIds[p.id] || false;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-sm"
              >
                {/* Header card info */}
                <div
                  onClick={() => setExpandedPlanId(isExpanded ? null : p.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1 flex-1 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Tuần {p.weekNumber}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        Lớp {p.className} • Tiết {p.periodStart === p.periodEnd ? p.periodStart : `${p.periodStart}-${p.periodEnd}`}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-300" /> GV: {p.teacherName}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight mt-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">Môn học: {p.subjectName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(p.status)}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4 text-xs text-gray-700">
                    {/* Lesson Plan Information blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Mục tiêu bài dạy (Objectives):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.objectives || "Chưa nhập mục tiêu"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Nội dung bài học (Content):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.content || "Chưa nhập nội dung"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Hoạt động dạy học (Activities):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.activities || "Chưa nhập hoạt động"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Thiết bị dạy học (Materials):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.materials || "Chưa có danh sách thiết bị"}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-gray-500 block mb-1">Đánh giá (Assessment):</span>
                        <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed min-h-[40px]">
                          {p.assessment || "Chưa nhập tiêu chí đánh giá"}
                        </p>
                      </div>

                      {p.notes && (
                        <div>
                          <span className="font-bold text-gray-500 block mb-1">Ghi chú bổ sung:</span>
                          <p className="bg-white rounded-lg p-2.5 border border-gray-200 whitespace-pre-line leading-relaxed">
                            {p.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Show existing review or provide review actions */}
                    {p.status !== "SUBMITTED" ? (
                      <div className="bg-white border border-gray-200 rounded-xl p-3 mt-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Check className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-gray-700">Thông tin phê duyệt:</span>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <p>
                            Trạng thái:{" "}
                            <span
                              className={`font-semibold ${
                                p.status === "APPROVED" ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {p.status === "APPROVED" ? "Đã duyệt" : "Không phê duyệt"}
                            </span>
                          </p>
                          <p>Người duyệt: {p.reviewedBy || "Ban Giám Hiệu"}</p>
                          {p.reviewedAt && (
                            <p>Thời gian: {new Date(p.reviewedAt).toLocaleString("vi-VN")}</p>
                          )}
                          {p.reviewNote && (
                            <div className="mt-2 bg-gray-50 border rounded-lg p-2.5 text-gray-700">
                              <p className="font-bold text-gray-500 text-[10px] uppercase mb-0.5">Nhận xét / Ý kiến chỉ đạo:</p>
                              <p className="whitespace-pre-line">{p.reviewNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-2 space-y-3">
                        <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
                          <span>Ban giám hiệu đánh giá & đưa ý kiến:</span>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-600 mb-1">
                            Ý kiến chỉ đạo / Nhận xét phê duyệt (Bắt buộc nếu từ chối):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Nhập nhận xét về nội dung, phương pháp hoặc lý do từ chối giáo án..."
                            value={reviewNotes[p.id] || ""}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                            }
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleReview(p.id, "APPROVED")}
                            disabled={isSubmitting}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <FileCheck className="w-4 h-4" />
                            Phê duyệt giáo án
                          </button>

                          <button
                            onClick={() => handleReview(p.id, "REJECTED")}
                            disabled={isSubmitting}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <FileX className="w-4 h-4" />
                            Từ chối / Yêu cầu sửa lại
                          </button>
                        </div>
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
