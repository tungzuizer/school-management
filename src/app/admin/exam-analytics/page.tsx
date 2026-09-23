/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router route `/admin/exam-analytics`, referenced in `src/app/admin/layout.tsx`.
 * 2. Target: `src/app/admin/exam-analytics/page.tsx`.
 * 3. Schemas: `ExamAnalyticsOverviewData`, `StudentProfileSummary`.
 * 4. Verbatim User Instruction: "vấn đè của phần kpi bị lỗi không hiện thị các dữ liệu và phần điểm thi ols bị lỗi loading không vô được" - Xử lý tải song song overview và danh sách học sinh, kèm màn hình báo lỗi và cơ chế retry khi cần thiết.
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getMultiYearExamOverviewAction,
  getStudentProfilesTrajectoryAction,
  type ExamAnalyticsOverviewData,
} from "./actions";
import { type StudentProfileSummary } from "@/lib/exam-analytics-engine";
import MacroTab from "./macro-tab";
import JourneyTab from "./journey-tab";
import StudentsTab from "./students-tab";

function ExamAnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"macro" | "journey" | "students">(
    initialTab === "journey" || initialTab === "students" ? initialTab : "macro"
  );

  const [overviewData, setOverviewData] = useState<ExamAnalyticsOverviewData | null>(null);
  const [studentList, setStudentList] = useState<StudentProfileSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedCampusId, setSelectedCampusId] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [onlyInterventionFilter, setOnlyInterventionFilter] = useState<boolean>(false);

  // Sync tab with URL search parameter if changed externally
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "journey" || tabParam === "students" || tabParam === "macro") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Switch tab and update query without full reload
  const handleTabChange = (tab: "macro" | "journey" | "students") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  // Load Overview Data in parallel with graceful error resilience
  async function loadData() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [overviewRes, studentsRes] = await Promise.all([
        getMultiYearExamOverviewAction({
          campusId: selectedCampusId !== "ALL" ? selectedCampusId : undefined,
          gradeLevel: selectedGrade > 0 ? selectedGrade : undefined,
        }),
        getStudentProfilesTrajectoryAction({
          campusId: selectedCampusId !== "ALL" ? selectedCampusId : undefined,
          gradeLevel: selectedGrade > 0 ? selectedGrade : undefined,
          search: searchQuery,
          trendCategory: selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : undefined,
          onlyNeedIntervention: onlyInterventionFilter,
        }),
      ]);

      setOverviewData(overviewRes);
      setStudentList(studentsRes);
    } catch (err: any) {
      console.error("Failed to load exam analytics:", err);
      setErrorMsg(err?.message || "Không thể tải dữ liệu phân tích điểm thi. Vui lòng kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCampusId, selectedGrade, selectedCategoryFilter, onlyInterventionFilter]);

  // Handle Search Debounce / Trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  if (loading && !overviewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium text-xs tracking-wide uppercase">
          Đang tính toán hồi quy thống kê OLS và phân tích dữ liệu điểm thi đa niên khóa...
        </p>
      </div>
    );
  }

  if (errorMsg && !overviewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 bg-white p-8 rounded-2xl border border-red-200">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-800">Đã xảy ra sự cố khi tải dữ liệu</h2>
        <p className="text-sm text-slate-500 text-center max-w-md">{errorMsg}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-sm"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner for Principal */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-md uppercase tracking-wider">
                Trung Tâm Phân Tích Dữ Liệu & Hồi Quy OLS
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded-md uppercase tracking-wider">
                Thông tư 22/2021/TT-BGDĐT
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Giám Sát Điểm Thi Đa Niên Khóa & Hành Trình OLS
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Báo cáo điều hành chuyên sâu dành cho Ban Giám hiệu theo dõi chất lượng giáo dục xuyên suốt các năm học (2023 - 2026), đối sánh liên phân hiệu, và quản trị can thiệp sư phạm 4 bước dựa trên mô hình hồi quy độ dốc (OLS Slope).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              Làm mới dữ liệu
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition"
            >
              In Báo Cáo Ban Giám Hiệu
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar & 3-Tab Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Bộ lọc chỉ đạo:
          </span>

          {/* Campus Selector */}
          <select
            value={selectedCampusId}
            onChange={(e) => setSelectedCampusId(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-800 focus:outline-none"
          >
            <option value="ALL">Toàn bộ cơ sở / phân hiệu</option>
            {overviewData?.availableCampuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Grade Selector */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="text-xs font-medium bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-800 focus:outline-none"
          >
            <option value={0}>Tất cả các khối lớp (Khối 1 - 5)</option>
            <option value={1}>Khối 1</option>
            <option value={2}>Khối 2</option>
            <option value={3}>Khối 3</option>
            <option value={4}>Khối 4</option>
            <option value={5}>Khối 5</option>
          </select>
        </div>

        {/* 3-Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => handleTabChange("macro")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "macro"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Phổ Điểm & Đối Sánh Phân Hiệu
          </button>
          <button
            onClick={() => handleTabChange("journey")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "journey"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hành Trình OLS & Can Thiệp Sư Phạm
          </button>
          <button
            onClick={() => handleTabChange("students")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "students"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Quỹ Đạo Học Sinh ({overviewData?.totalStudents || 0})
          </button>
        </div>
      </div>

      {/* 3. Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Overall Average Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Điểm TB Toàn Trường</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">10.0</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {overviewData?.overallAverage.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-normal">/ 10.0</span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold">Tăng trưởng tích cực</p>
        </div>

        {/* KPI 2: Good & Excellent Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Tỷ Lệ Giỏi / Tốt (TT22)</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">CHUẨN</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {overviewData?.tt22Classification.goodPercent}%
            </span>
            <span className="text-xs text-slate-500 font-normal">
              ({overviewData?.tt22Classification.goodCount} HS)
            </span>
          </div>
          <p className="text-xs text-slate-500">Mức chất lượng mũi nhọn</p>
        </div>

        {/* KPI 3: Improving Trajectory Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Tiến Bộ Vượt Bậc (m &gt; 0)</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">OLS +</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-700">
              {overviewData?.improvingCount}
            </span>
            <span className="text-xs text-slate-500 font-normal">học sinh</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium">Xu hướng phát triển ổn định</p>
        </div>

        {/* KPI 4: Urgent Intervention Count */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold uppercase tracking-wider">
            <span>Cần Can Thiệp Khẩn Cấp</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">CẢNH BÁO</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-rose-700">
              {overviewData?.atRiskCount}
            </span>
            <span className="text-xs text-rose-800 font-normal">học sinh</span>
          </div>
          <p className="text-xs text-rose-700 font-semibold">Độ dốc âm / Nguy cơ hổng kiến thức</p>
        </div>

        {/* KPI 5: Total Exam Data Records */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Tổng Bài Thi Đã Khảo Sát</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">DỮ LIỆU</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {overviewData?.totalExams}
            </span>
            <span className="text-xs text-slate-500 font-normal">bài nộp</span>
          </div>
          <p className="text-xs text-slate-500">Xuyên suốt {overviewData?.availableYears.length} năm học</p>
        </div>
      </div>

      {/* 4. Tab 1: Macro Multi-Year Subject Trends & Campus Benchmarking */}
      {activeTab === "macro" && overviewData && (
        <MacroTab overviewData={overviewData} />
      )}

      {/* 5. Tab 2: OLS Journey & 4-Step Pedagogical Interventions */}
      {activeTab === "journey" && (
        <JourneyTab
          selectedCampusId={selectedCampusId}
          onRefreshParent={loadData}
        />
      )}

      {/* 6. Tab 3: Student Trajectory Profiling & OLS Linear Regression */}
      {activeTab === "students" && (
        <StudentsTab
          studentList={studentList}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
          onlyInterventionFilter={onlyInterventionFilter}
          setOnlyInterventionFilter={setOnlyInterventionFilter}
          onSearchSubmit={handleSearchSubmit}
        />
      )}
    </div>
  );
}

export default function ExamAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium text-xs tracking-wide uppercase">
            Đang tải dữ liệu phân tích học thuật & hành trình học sinh...
          </p>
        </div>
      }
    >
      <ExamAnalyticsContent />
    </Suspense>
  );
}
