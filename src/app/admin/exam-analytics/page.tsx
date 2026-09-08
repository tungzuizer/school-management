/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router route `/admin/exam-analytics`, referenced in `src/app/admin/layout.tsx`.
 * 2. Target: `src/app/admin/exam-analytics/page.tsx`.
 * 3. Schemas: `ExamAnalyticsOverviewData`, `StudentTrajectoryDetailData`, `StudentProfileSummary`.
 * 4. Verbatim User Instruction: "xóa bỏ hết các icon và không được dùng cái màu sắc vàng và cái huy chương nó quá thiếu chuyên nghiệp".
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getMultiYearExamOverviewAction,
  getStudentProfilesTrajectoryAction,
  getStudentDetailTrajectoryAction,
  type ExamAnalyticsOverviewData,
  type StudentTrajectoryDetailData,
} from "./actions";
import { type StudentProfileSummary } from "@/lib/exam-analytics-engine";

const PIE_COLORS = ["#059669", "#2563EB", "#64748B", "#DC2626"];

export default function ExamAnalyticsPage() {
  const [overviewData, setOverviewData] = useState<ExamAnalyticsOverviewData | null>(null);
  const [studentList, setStudentList] = useState<StudentProfileSummary[]>([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentTrajectoryDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Filters
  const [activeTab, setActiveTab] = useState<"macro" | "students">("macro");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [onlyInterventionFilter, setOnlyInterventionFilter] = useState<boolean>(false);

  // Load Overview Data
  async function loadData() {
    try {
      setLoading(true);
      const res = await getMultiYearExamOverviewAction({
        campusId: selectedCampusId !== "ALL" ? selectedCampusId : undefined,
        gradeLevel: selectedGrade > 0 ? selectedGrade : undefined,
      });
      setOverviewData(res);

      const students = await getStudentProfilesTrajectoryAction({
        campusId: selectedCampusId !== "ALL" ? selectedCampusId : undefined,
        gradeLevel: selectedGrade > 0 ? selectedGrade : undefined,
        search: searchQuery,
        trendCategory: selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : undefined,
        onlyNeedIntervention: onlyInterventionFilter,
      });
      setStudentList(students);
    } catch (err) {
      console.error("Failed to load exam analytics:", err);
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

  // View Student Detail Trajectory
  const handleViewStudentDetail = async (studentId: string) => {
    try {
      setDetailLoading(true);
      const detail = await getStudentDetailTrajectoryAction(studentId);
      setSelectedStudentDetail(detail);
    } catch (err) {
      console.error("Failed to load student detail trajectory:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Macro Subject Trends Chart Data Format
  const subjectBarChartData = useMemo(() => {
    if (!overviewData || !overviewData.subjectTrends) return [];
    return overviewData.subjectTrends.map((t) => {
      const row: Record<string, string | number> = { subject: t.subjectName };
      overviewData.availableYears.forEach((year) => {
        row[year] = t.yearlyAverages[year] || 0;
      });
      return row;
    });
  }, [overviewData]);

  // TT22 Pie Chart Data
  const tt22PieData = useMemo(() => {
    if (!overviewData) return [];
    const { tt22Classification } = overviewData;
    return [
      { name: "Tốt (≥ 8.0)", value: tt22Classification.goodCount },
      { name: "Khá (6.5 - 7.9)", value: tt22Classification.fairCount },
      { name: "Đạt (5.0 - 6.4)", value: tt22Classification.passCount },
      { name: "Chưa đạt (< 5.0)", value: tt22Classification.failCount },
    ];
  }, [overviewData]);

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

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner for Principal */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-md uppercase tracking-wider">
                Hệ Thống Phân Tích Dữ Liệu & Hồi Quy OLS
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded-md uppercase tracking-wider">
                Thông tư 22/2021/TT-BGDĐT
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Giám Sát Điểm Thi Đa Niên Khóa & Quỹ Đạo Học Sinh
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Báo cáo điều hành chuyên sâu dành cho Ban Giám hiệu theo dõi chất lượng giáo dục xuyên suốt các năm học (2023 - 2026), đối sánh liên phân hiệu, và kích hoạt can thiệp sư phạm cá nhân hóa dựa trên mô hình hồi quy độ dốc (OLS Slope).
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

      {/* 2. Filter Bar */}
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
            <option value={0}>Tất cả các khối lớp</option>
            <option value={10}>Khối 10</option>
            <option value={11}>Khối 11</option>
            <option value={12}>Khối 12</option>
          </select>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab("macro")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "macro"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ma Trận Xu Hướng Đa Niên Khóa
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "students"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Hồ Sơ Quỹ Đạo Học Sinh ({overviewData?.totalStudents || 0})
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
      {activeTab === "macro" && (
        <div className="space-y-6">
          {/* AI Executive Insights Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold tracking-tight">
                  Cố Vấn AI Ban Giám Hiệu: Phân Tích Xu Hướng & Cảnh Báo Sư Phạm
                </h3>
                <span className="text-xs px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                  TỰ ĐỘNG ĐỒNG BỘ
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {overviewData?.aiInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs leading-relaxed text-slate-200"
                  >
                    <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
                      Nhận định #{idx + 1}
                    </span>
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Year Subject Bar Chart & TT22 Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Multi-Year Subject Comparison Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Biểu Đồ Điểm Trung Bình Môn Học Qua Các Năm
                  </h3>
                  <p className="text-xs text-slate-500">
                    So sánh điểm trung bình từng môn học qua 3 niên khóa liên tiếp
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                  {overviewData?.availableYears.join(" • ")}
                </span>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectBarChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderRadius: "8px",
                        color: "#F8FAFC",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    {overviewData?.availableYears.map((year, idx) => (
                      <Bar
                        key={year}
                        dataKey={year}
                        name={`Năm ${year}`}
                        fill={idx === 0 ? "#94A3B8" : idx === 1 ? "#3B82F6" : "#1E3A8A"}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TT22 Classification Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Phân Loại Học Lực (TT 22)
                </h3>
                <p className="text-xs text-slate-500">
                  Tỷ lệ học sinh theo 4 mức chuẩn giáo dục phổ thông
                </p>
              </div>

              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tt22PieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tt22PieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderRadius: "8px",
                        color: "#F8FAFC",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">
                    {overviewData?.totalStudents}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Học sinh</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                    Tốt (≥ 8.0)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {overviewData?.tt22Classification.goodPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                    Khá (6.5 - 7.9)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {overviewData?.tt22Classification.fairPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
                    Đạt (5.0 - 6.4)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {overviewData?.tt22Classification.passPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
                    Chưa đạt (&lt; 5.0)
                  </span>
                  <span className="font-semibold text-rose-700">
                    {overviewData?.tt22Classification.failPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Delta Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ma Trận Tăng Trưởng Điểm Từng Tổ Chuyên Môn
                </h3>
                <p className="text-xs text-slate-500">
                  Đối chiếu độ lệch so với năm đầu và năm liền kề để đánh giá hiệu quả giảng dạy của tổ bộ môn
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Môn học / Tổ bộ môn</th>
                    {overviewData?.availableYears.map((year) => (
                      <th key={year} className="px-4 py-3.5 text-center">
                        Năm {year}
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-center">So với năm trước (Δ)</th>
                    <th className="px-4 py-3.5 text-center">So với năm đầu (Δ)</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái phát triển</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {overviewData?.subjectTrends.map((st) => (
                    <tr key={st.subjectId} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {st.subjectName}
                      </td>
                      {overviewData.availableYears.map((year) => (
                        <td key={year} className="px-4 py-3.5 text-center font-medium">
                          {st.yearlyAverages[year] ? st.yearlyAverages[year].toFixed(2) : "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3.5 text-center">
                        {st.deltaFromPreviousYear !== undefined ? (
                          <span
                            className={`inline-block font-semibold text-xs px-2 py-0.5 rounded ${
                              st.deltaFromPreviousYear > 0
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : st.deltaFromPreviousYear < 0
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {st.deltaFromPreviousYear > 0 ? "+" : ""}
                            {st.deltaFromPreviousYear.toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {st.deltaFromFirstYear !== undefined ? (
                          <span
                            className={`inline-block font-semibold text-xs px-2 py-0.5 rounded ${
                              st.deltaFromFirstYear > 0
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : st.deltaFromFirstYear < 0
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {st.deltaFromFirstYear > 0 ? "+" : ""}
                            {st.deltaFromFirstYear.toFixed(2)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {st.trendStatus === "IMPROVING" && (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold">
                            Đang tiến bộ (+{st.deltaFromFirstYear?.toFixed(2)})
                          </span>
                        )}
                        {st.trendStatus === "DECLINING" && (
                          <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-semibold">
                            Cần củng cố ({st.deltaFromFirstYear?.toFixed(2)})
                          </span>
                        )}
                        {st.trendStatus === "STABLE" && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                            Duy trì ổn định
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Campus Benchmarking Cards */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đối Sánh Hiệu Quả Khảo Sát Liên Phân Hiệu
                </h3>
                <p className="text-xs text-slate-500">
                  So sánh chất lượng giữa Trụ sở chính và các Phân hiệu trực thuộc
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overviewData?.campusComparison.map((camp) => (
                <div
                  key={camp.campusId}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{camp.campusName}</h4>
                      <span className="text-xs text-slate-500">
                        {camp.totalStudents} học sinh khảo sát • {camp.totalExams} bài thi
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Điểm TB</span>
                      <span className="text-xl font-bold text-slate-900">
                        {camp.averageScore.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80">
                    <div className="p-3 bg-white rounded-lg border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block font-semibold uppercase">Tỷ lệ Đạt (≥ 5.0)</span>
                      <span className="text-base font-bold text-emerald-700">
                        {camp.passRate}%
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200/60">
                      <span className="text-[11px] text-slate-500 block font-semibold uppercase">Tỷ lệ Giỏi (≥ 8.0)</span>
                      <span className="text-base font-bold text-blue-700">
                        {camp.goodRate}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Student Trajectory Profiling & OLS Linear Regression */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Quick Filter Badges for Trajectories */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh theo tên, mã số HS, hoặc lớp..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </form>

            {/* Quick Category Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategoryFilter("ALL");
                  setOnlyInterventionFilter(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategoryFilter === "ALL" && !onlyInterventionFilter
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Tất cả ({studentList.length})
              </button>
              <button
                onClick={() => {
                  setOnlyInterventionFilter(true);
                  setSelectedCategoryFilter("ALL");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  onlyInterventionFilter
                    ? "bg-rose-700 text-white shadow-xs"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                }`}
              >
                Cần Can Thiệp Khẩn Cấp
              </button>
              <button
                onClick={() => {
                  setSelectedCategoryFilter("STRONG_GROWTH");
                  setOnlyInterventionFilter(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategoryFilter === "STRONG_GROWTH"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                Tiến Bộ Vượt Bậc
              </button>
              <button
                onClick={() => {
                  setSelectedCategoryFilter("CRITICAL_DECLINE");
                  setOnlyInterventionFilter(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedCategoryFilter === "CRITICAL_DECLINE"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                Sụt Giảm Đáng Báo Động
              </button>
            </div>
          </div>

          {/* Student Trajectory Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Danh Sách Quỹ Đạo Học Sinh Dựa Trên Hồi Quy Tuyến Tính OLS
                </h3>
                <p className="text-xs text-slate-500">
                  Độ dốc (Slope m) thể hiện xu hướng tiến bộ hoặc thụt lùi theo từng kỳ khảo sát
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Học sinh</th>
                    <th className="px-4 py-3.5">Lớp / Khối</th>
                    <th className="px-4 py-3.5 text-center">Điểm TB Gần Nhất</th>
                    <th className="px-4 py-3.5 text-center">Điểm TB Chung</th>
                    <th className="px-4 py-3.5 text-center">Độ Dốc OLS (m/kỳ)</th>
                    <th className="px-4 py-3.5 text-center">Phân Loại Quỹ Đạo</th>
                    <th className="px-4 py-3.5 text-center">Dự Báo Tốt Nghiệp</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {studentList.map((st) => (
                    <tr
                      key={st.studentId}
                      className={`hover:bg-slate-50/90 transition ${
                        st.needsImmediateIntervention ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{st.studentName}</div>
                        <span className="text-xs text-slate-500 font-mono">
                          {st.studentCode || "HS-CODE"} • {st.campusName || "Trường chính"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800">{st.className || "—"}</span>
                        <span className="text-xs text-slate-500 block">Khối {st.gradeLevel || 12}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-base font-bold text-slate-900">
                          {st.latestAvgScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-medium text-slate-700">
                        {st.overallAvgScore.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block font-semibold text-xs px-2.5 py-0.5 rounded ${
                            st.slope > 0.2
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : st.slope < -0.2
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {st.slope > 0 ? "+" : ""}
                          {st.slope.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-semibold inline-block ${
                            st.trendCategory === "EXCELLENT_TALENT"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : st.trendCategory === "STRONG_GROWTH"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : st.trendCategory === "STEADY_PROGRESS"
                              ? "bg-slate-100 text-slate-800 border border-slate-200"
                              : st.trendCategory === "UNSTABLE_VOLATILE"
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : st.trendCategory === "CRITICAL_DECLINE"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-rose-100 text-rose-900 border border-rose-300"
                          }`}
                        >
                          {st.trendLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-900">
                        {st.predictedGraduationScore.toFixed(1)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleViewStudentDetail(st.studentId)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded transition"
                        >
                          Xem Quỹ Đạo
                        </button>
                      </td>
                    </tr>
                  ))}
                  {studentList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        Không tìm thấy học sinh nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal / Detail Drawer for Student Longitudinal Trajectory */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded uppercase tracking-wider">
                    Hồ Sơ Quỹ Đạo Cá Nhân
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedStudentDetail.summary.studentCode || "HS-CODE"}
                  </span>
                </div>
                <h2 className="text-xl font-bold">
                  {selectedStudentDetail.summary.studentName}
                </h2>
                <p className="text-xs text-slate-300">
                  Lớp: {selectedStudentDetail.summary.className} • Cơ sở: {selectedStudentDetail.summary.campusName} • Tổng số bài thi: {selectedStudentDetail.summary.totalExamsRecorded}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition"
              >
                Đóng
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* AI Advisory Box */}
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  selectedStudentDetail.summary.needsImmediateIntervention
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <span className="font-bold block text-sm mb-1 uppercase tracking-wider">
                  Khuyến Nghị Sư Phạm Của Ban Giám Hiệu:
                </span>
                <p>{selectedStudentDetail.summary.aiAdvisory}</p>
              </div>

              {/* Longitudinal Score Evolution Curve & Radar Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline Chart */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Đường Quỹ Đạo Điểm TB Qua Các Kỳ
                    </h4>
                    <span className="text-xs font-semibold text-slate-900">
                      Độ dốc m = {selectedStudentDetail.summary.slope.toFixed(2)}
                    </span>
                  </div>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedStudentDetail.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" />
                        <XAxis dataKey="periodName" tick={{ fill: "#475569", fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fill: "#475569", fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "8px",
                            color: "#F8FAFC",
                            fontSize: "11px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgScore"
                          name="Điểm TB Kỳ"
                          stroke="#1E3A8A"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#1E3A8A" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Radar Chart for Subject Competency */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Radar Đa Năng Lực Môn Học
                  </h4>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={selectedStudentDetail.subjectRadar}>
                        <PolarGrid stroke="#CBD5E1" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 9 }} />
                        <Radar
                          name="Điểm TB Môn"
                          dataKey="score"
                          stroke="#2563EB"
                          fill="#2563EB"
                          fillOpacity={0.3}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "8px",
                            color: "#F8FAFC",
                            fontSize: "11px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Môn Thế Mạnh Nổi Trội
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudentDetail.summary.strengths.map((st, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Môn Cần Phụ Đạo & Bổ Trợ
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudentDetail.summary.weaknesses.map((wk, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-rose-300 text-rose-800 text-xs font-semibold rounded"
                      >
                        {wk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Historical Transcript Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Lịch Sử Điểm Thi Đầy Đủ
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Kỳ Khảo Sát</th>
                        <th className="px-4 py-2.5">Năm Học</th>
                        <th className="px-4 py-2.5">Môn Học</th>
                        <th className="px-4 py-2.5 text-center">Điểm Số</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudentDetail.allExamScores.map((score) => (
                        <tr key={score.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {score.examPeriodName}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{score.schoolYear}</td>
                          <td className="px-4 py-2 font-semibold text-slate-900">
                            {score.subjectName}
                          </td>
                          <td className="px-4 py-2 text-center font-bold text-slate-900">
                            {score.score.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
              >
                In Phiếu Học Sinh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
