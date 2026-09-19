/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Admin router at `/admin/lesson-plans`, navigation bar in admin layout.
 * 2. Affected APIs: Server actions `getLessonPlansForAdmin`, `reviewLessonPlan`, `getAdminSchools`, `getAdminCampuses`, component `FileViewerModal`.
 * 3. Schema: LessonPlan, Teacher, Subject, ClassRoom, School, Campus, LessonPlanReview.
 * 4. Verbatim User Instruction: "phần quản lý lớp học, sổ đầu bài , kế hoạch giạy học, hồ sơ học sinh, thời khóa biểu và tất cả mục khác phần mục chọn để lọc cho dễ tìm sao lại để mỗi trường chỗ đso phải là phân hiệu chứ" - Chuẩn hóa bộ lọc Phân hiệu / Điểm trường trực thuộc cho Quản lý & Phê duyệt Kế hoạch bài dạy.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getLessonPlansForAdmin, reviewLessonPlan, getAdminSchools, getAdminCampuses } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import FileViewerModal from "@/components/storage/FileViewerModal";
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
  Loader2,
  FileText,
  Eye,
  Download,
  Building2,
  CheckCircle2,
  MapPin,
  GraduationCap,
  Layers,
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
  schoolName?: string;
  campusId?: string | null;
  campusName?: string;
  gradeLevel?: number;
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
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
  reviewNote: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviews: LessonPlanReview[];
}

export default function AdminLessonPlansPage() {
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<LessonPlanItem[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string; schoolType?: string; branchType?: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string; schoolId: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("ALL");
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isEasyMode } = useEasyMode();
  const { showToast, ToastComponent } = useToast();

  // In-app File Viewer Modal state
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    url: string | null;
    name?: string | null;
    title?: string;
  }>({
    isOpen: false,
    url: null,
    name: null,
    title: "",
  });

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // Detail & Action states
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  const fetchPlans = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const [items, schoolList, campusList] = await Promise.all([
        getLessonPlansForAdmin(
          selectedSchool,
          selectedCampus !== "ALL" ? selectedCampus : undefined,
          selectedGrade ? Number(selectedGrade) : undefined
        ),
        getAdminSchools(),
        getAdminCampuses(selectedSchool),
      ]);
      setPlans(items as any);
      setSchools(schoolList);
      setCampuses(campusList);
    } catch (e: any) {
      showToast("Lỗi khi tải thông tin giáo án: " + (e.message || ""), "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSchool, selectedCampus, selectedGrade, showToast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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

    // Filter by Campus
    if (selectedCampus && selectedCampus !== "ALL") {
      result = result.filter((p) => p.campusId === selectedCampus);
    }

    // Filter by Grade
    if (selectedGrade !== "") {
      result = result.filter((p) => p.gradeLevel === Number(selectedGrade));
    }

    // Filter by Search text
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.teacherName.toLowerCase().includes(searchLower) ||
          p.title.toLowerCase().includes(searchLower) ||
          p.subjectName.toLowerCase().includes(searchLower) ||
          p.className.toLowerCase().includes(searchLower) ||
          (p.campusName && p.campusName.toLowerCase().includes(searchLower)) ||
          (p.schoolName && p.schoolName.toLowerCase().includes(searchLower))
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
  }, [plans, activeTab, selectedCampus, selectedGrade, searchTerm, selectedSubject, selectedClass]);

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
        fetchPlans(true);
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

  const getCampusBadgeColor = (name: string) => {
    if (name.includes("Trung tâm")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (name.includes("Sơn Hà 1")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (name.includes("Sơn Hà 2")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (name.includes("Sơn Hải")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (name.includes("Phố Lu 3")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (name.includes("An Tiến")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            Quản Lý & Phê Duyệt Kế Hoạch Bài Dạy (Giáo Án)
            {isRefreshing && !loading && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Hệ thống kiểm duyệt, phân tích và thông qua kế hoạch bài dạy theo từng Phân hiệu & Khối lớp
          </p>
        </div>
        <div className="flex items-center gap-2">
          {schools.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả các trường</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => fetchPlans(false)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition duration-150 shadow-2xs cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className="w-4 h-4" /> Tải lại
          </button>
        </div>
      </div>

      {/* Campus Selector Bar (Thanh chọn Phân hiệu & Điểm trường trực thuộc) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Chọn Phân hiệu / Điểm trường trực thuộc để lọc:
          </span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            {campuses.length} Phân hiệu & Điểm trường
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCampus("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              selectedCampus === "ALL" || selectedCampus === ""
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Toàn trường (Tất cả điểm trường)
          </button>
          {campuses.map((c) => {
            const isSelected = selectedCampus === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCampus(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102"
                    : `bg-white text-slate-700 border-slate-200 hover:bg-slate-50`
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-indigo-500"}`} />
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Statistics board */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">Tổng giáo án nhận được</p>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{plans.length}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-amber-700">Chờ duyệt các cấp</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-800 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-700">Đã phê duyệt hoàn tất</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1">
            {plans.filter((p) => p.status === "APPROVED").length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-semibold text-rose-700">Đã từ chối / Trả lại</p>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-800 mt-1">
            {plans.filter((p) => p.status === "REJECTED").length}
          </p>
        </div>
      </div>

      {/* Tabs and Filters Row */}
      <div className="bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4 shadow-2xs">
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

        {/* Khối Lớp Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" /> Khối:
          </span>
          <button
            onClick={() => setSelectedGrade("")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              selectedGrade === ""
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả khối
          </button>
          {[1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGrade(String(g))}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedGrade === String(g)
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Khối {g}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên giáo viên, bài học, phân hiệu..."
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
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border border-slate-200 border-indigo-600 mx-auto"></div>
            <p className="text-xs text-slate-400 mt-2 font-semibold">Đang tải danh sách giáo án...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-6">
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
                      {p.campusName && (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${getCampusBadgeColor(p.campusName)}`}>
                          <MapPin className="w-3 h-3" />
                          {p.campusName}
                        </span>
                      )}
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
                    {/* Attached Lesson Plan Document / PDF */}
                    {p.fileUrl && (
                      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white text-rose-500 flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-indigo-950 text-xs truncate">
                              {p.fileName || "Tệp giáo án đính kèm"}
                            </p>
                            <p className="text-[11px] text-indigo-700/80">
                              Đã lưu liên kết URL tối ưu database
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setViewerState({
                                isOpen: true,
                                url: p.fileUrl,
                                name: p.fileName || `${p.title}.pdf`,
                                title: `Giáo án: ${p.title} - GV: ${p.teacherName}`,
                              })
                            }
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem trực tiếp</span>
                          </button>

                          <a
                            href={p.fileUrl}
                            download={p.fileName || "giao-an"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                            title="Tải về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
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
                              {rev.comment && <p className="text-slate-500 italic">"{rev.comment}"</p>}
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
                          <span>Ban Giám Hiệu Đánh Giá & Phê Duyệt:</span>
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
                            className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 min-h-[44px] cursor-pointer"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                            <span>{isSubmitting ? "Đang xử lý..." : "Phê Duyệt Giáo Án (Hoàn tất)"}</span>
                          </button>

                          <button
                            onClick={() => handleReview(p.id, "REJECTED")}
                            disabled={isSubmitting}
                            className="w-full sm:flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 min-h-[44px] cursor-pointer"
                          >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileX className="w-4 h-4" />}
                            <span>{isSubmitting ? "Đang xử lý..." : "Từ Chối / Yêu Cầu Sửa Lại"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Giáo án này đã được hoàn tất phê duyệt ({p.reviewedBy || "Ban Giám Hiệu"}).</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Embedded In-App PDF / Document Viewer Modal */}
      <FileViewerModal
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState((prev) => ({ ...prev, isOpen: false }))}
        fileUrl={viewerState.url}
        fileName={viewerState.name}
        title={viewerState.title}
      />
    </div>
  );
}
