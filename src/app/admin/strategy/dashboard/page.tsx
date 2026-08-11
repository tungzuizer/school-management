"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  Clock,
  FileCheck,
  CheckCircle2,
  Building2,
  Download,
  Tv,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  Info,
  XCircle,
  Eye,
  X,
  Maximize2,
  Minimize2,
  Calendar,
  User,
  AlertCircle,
  PieChart as PieIcon,
  Printer,
  ChevronLeft,
} from "lucide-react";
import { getStrategyDashboardData, StrategyDashboardFilters } from "./actions";

export default function StrategyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters State
  const [filters, setFilters] = useState<StrategyDashboardFilters>({
    academicYear: "2026-2027",
    period: "ALL",
    campusId: "ALL",
    kpiCategory: "ALL",
    responsiblePerson: "ALL",
    status: "ALL",
  });

  // Data State
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Modals & Interactive Drill-down State
  const [selectedDetailModal, setSelectedDetailModal] = useState<{
    title: string;
    type: string;
    data: any;
  } | null>(null);

  // Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [presentationSlideIndex, setPresentationSlideIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await getStrategyDashboardData(filters);
    if (res.success && res.data) {
      setDashboardData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Presentation mode auto-rotation interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPresentationMode && autoRotate) {
      timer = setInterval(() => {
        setPresentationSlideIndex((prev) => (prev + 1) % 4);
      }, 7000);
    }
    return () => clearInterval(timer);
  }, [isPresentationMode, autoRotate]);

  const handlePrintPdf = () => {
    window.print();
  };

  const summaryCards = dashboardData?.summaryCards || {};
  const charts = dashboardData?.charts || {};
  const governanceWarnings = dashboardData?.governanceWarnings || [];
  const campusProgressList = dashboardData?.campusProgressList || [];

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isPresentationMode ? "bg-slate-900 text-white fixed inset-0 z-50 overflow-y-auto p-8" : "bg-slate-50 text-slate-900"}`}>
      {/* Hide print header in non-print mode */}
      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-full { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Top Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800/90 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-2xl font-black tracking-tight ${isPresentationMode ? "text-white text-3xl" : "text-slate-800"}`}>
                Dashboard Quản Trị Chiến Lược & KPI
              </h1>
              {isPresentationMode && (
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                  Chế Độ Trình Chiếu Họp Giao Ban
                </span>
              )}
            </div>
            <p className={`text-sm ${isPresentationMode ? "text-slate-300 text-base" : "text-slate-500"}`}>
              Hệ thống chỉ số điều hành chiến lược real-time toàn trường & các phân hiệu | Năm học {filters.academicYear}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <button
            onClick={() => loadData()}
            disabled={isPending || loading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              isPresentationMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Làm Mới
          </button>

          <button
            onClick={handlePrintPdf}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
              isPresentationMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            Xuất PDF / In
          </button>

          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition ${
              isPresentationMode
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isPresentationMode ? (
              <>
                <Minimize2 className="w-4 h-4" /> Thoát Trình Chiếu
              </>
            ) : (
              <>
                <Tv className="w-4 h-4" /> Trình Chiếu Giao Ban
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Filters Bar */}
      <div className={`p-5 rounded-2xl border shadow-sm space-y-3 no-print ${isPresentationMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Filter className="w-4 h-4" /> Bộ Lọc Điều Hành Chiến Lược Chung:
          </div>
          {isPresentationMode && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Tự động chuyển slide:</span>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 py-1 rounded-md font-bold text-xs ${autoRotate ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"}`}
              >
                {autoRotate ? "BẬT" : "TẮT"}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Filter 1: Academic Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Năm Học</label>
            <select
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="2026-2027">2026 - 2027</option>
              <option value="2025-2026">2025 - 2026</option>
              <option value="2024-2025">2024 - 2025</option>
            </select>
          </div>

          {/* Filter 2: Period */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Giai Đoạn</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="ALL">Cả năm học</option>
              <option value="HK1">Học kỳ I</option>
              <option value="HK2">Học kỳ II</option>
              <option value="Q1">Quý I</option>
              <option value="Q2">Quý II</option>
            </select>
          </div>

          {/* Filter 3: Campus */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Phân Hiệu / Cơ Sở</label>
            <select
              value={filters.campusId}
              onChange={(e) => setFilters({ ...filters, campusId: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="ALL">Tất cả phân hiệu (Toàn trường)</option>
              {dashboardData?.campuses?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: KPI Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nhóm KPI / Cốt Lõi</label>
            <select
              value={filters.kpiCategory}
              onChange={(e) => setFilters({ ...filters, kpiCategory: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="ALL">Tất cả nhóm KPI</option>
              <option value="ACADEMIC">Chất lượng học tập</option>
              <option value="TEACHER_QUALITY">Chất lượng đội ngũ</option>
              <option value="DIGITAL_TRANSFORMATION">Chuyển đổi số</option>
              <option value="SCHOOL_SAFETY">An toàn trường học</option>
              <option value="FACILITIES">Cơ sở vật chất</option>
            </select>
          </div>

          {/* Filter 5: Responsible Person */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Người Phụ Trách</label>
            <select
              value={filters.responsiblePerson}
              onChange={(e) => setFilters({ ...filters, responsiblePerson: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="ALL">Tất cả nhân sự</option>
              <option value="BGH">Ban Giám Hiệu</option>
              <option value="Tổ trưởng">Tổ trưởng Chuyên môn</option>
            </select>
          </div>

          {/* Filter 6: Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Trạng Thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-none ${
                isPresentationMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACHIEVED">Đạt / Vượt</option>
              <option value="AT_RISK">Có nguy cơ / Cảnh báo</option>
              <option value="FAILED">Không đạt</option>
            </select>
          </div>
        </div>
      </div>

      {/* 8 Summary Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Strategy Completion Rate */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Tỷ Lệ Hoàn Thành Chiến Lược",
              type: "STRATEGY_COMPLETION",
              data: summaryCards.strategyCompletionRate,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Tỷ lệ hoàn thành chiến lược
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-white text-5xl" : "text-slate-800"}`}>
            {summaryCards.strategyCompletionRate ?? 0}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(summaryCards.strategyCompletionRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 2: Academic Year Plan Rate */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Tỷ Lệ Hoàn Thành Kế Hoạch Năm Học",
              type: "YEARLY_PLAN",
              data: summaryCards.annualPlanCompletionRate,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Tỷ lệ kế hoạch năm học
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-emerald-400 text-5xl" : "text-emerald-600"}`}>
            {summaryCards.annualPlanCompletionRate ?? 0}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(summaryCards.annualPlanCompletionRate || 0, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: School KPI Score */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Điểm KPI Toàn Trường",
              type: "KPI_SCORE",
              data: summaryCards.schoolKpiScore,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Điểm KPI Toàn Trường
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-purple-400 text-5xl" : "text-purple-700"}`}>
            {summaryCards.schoolKpiScore ?? 0}
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Đánh giá tổng hợp 12 nhóm KPI</div>
        </div>

        {/* Card 4: Quality Objectives Achieved */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Số Mục Tiêu Chất Lượng Đã Đạt",
              type: "QUALITY_ACHIEVED",
              data: summaryCards.achievedQualityObjsCount,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Mục tiêu chất lượng đạt
            </span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-teal-400 text-5xl" : "text-teal-600"}`}>
            {summaryCards.achievedQualityObjsCount ?? 0}
            <span className="text-sm font-semibold text-slate-400"> Mục tiêu</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Đạt hoặc vượt tiêu chuẩn</div>
        </div>

        {/* Card 5: Overdue Tasks */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Số Nhiệm Vụ Quá Hạn",
              type: "OVERDUE_TASKS",
              data: summaryCards.overdueTasksCount,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Nhiệm vụ quá hạn
            </span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-red-400 text-5xl" : "text-red-600"}`}>
            {summaryCards.overdueTasksCount ?? 0}
            <span className="text-sm font-semibold text-slate-400"> Nhiệm vụ</span>
          </div>
          <div className="text-xs text-red-500 font-medium mt-2">Cần đôn đốc ngay</div>
        </div>

        {/* Card 6: Unupdated KPIs */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Số KPI Chưa Cập Nhật",
              type: "UNUPDATED_KPIS",
              data: summaryCards.unupdatedKpisCount,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              KPI chưa cập nhật
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-amber-400 text-5xl" : "text-amber-600"}`}>
            {summaryCards.unupdatedKpisCount ?? 0}
            <span className="text-sm font-semibold text-slate-400"> Chỉ số</span>
          </div>
          <div className="text-xs text-amber-600 font-medium mt-2">Đang chờ nhập điểm kỳ này</div>
        </div>

        {/* Card 7: Pending Approval Content */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Nội Dung Chờ Phê Duyệt",
              type: "PENDING_APPROVAL",
              data: summaryCards.pendingApprovalCount,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Nội dung chờ duyệt
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-indigo-400 text-5xl" : "text-indigo-600"}`}>
            {summaryCards.pendingApprovalCount ?? 0}
            <span className="text-sm font-semibold text-slate-400"> Hồ sơ</span>
          </div>
          <div className="text-xs text-indigo-500 font-medium mt-2">Cần BGH phê duyệt</div>
        </div>

        {/* Card 8: Warning Campuses */}
        <div
          onClick={() =>
            setSelectedDetailModal({
              title: "Chi tiết Số Phân Hiệu Có Cảnh Báo",
              type: "WARNING_CAMPUSES",
              data: summaryCards.warningCampusesCount,
            })
          }
          className={`p-5 rounded-2xl border shadow-sm cursor-pointer hover:scale-[1.02] transition ${
            isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Phân hiệu có cảnh báo
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-4xl font-black mt-2 ${isPresentationMode ? "text-rose-400 text-5xl" : "text-rose-600"}`}>
            {summaryCards.warningCampusesCount ?? 0}
            <span className="text-sm font-semibold text-slate-400"> Phân hiệu</span>
          </div>
          <div className="text-xs text-rose-500 font-medium mt-2">Cần kiểm tra giao ban</div>
        </div>
      </div>

      {/* 8 Strategic Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Progress by Strategy Objective Categories */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isPresentationMode ? "text-white text-xl" : "text-slate-800"}`}>
            <BarChart3 className="w-5 h-5 text-blue-600" />
            1. Tiến Độ Chiến Lược Theo Mục Tiêu Cốt Lõi
          </h3>
          <div className="space-y-3">
            {charts.strategyProgressByCategory?.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={isPresentationMode ? "text-slate-300" : "text-slate-700"}>{item.category}</span>
                  <span className="text-blue-600 font-bold">{item.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Monthly Progress Trend of Academic Year Plan */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isPresentationMode ? "text-white text-xl" : "text-slate-800"}`}>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            2. Tiến Độ Kế Hoạch Năm Học Theo Tháng
          </h3>
          <div className="h-56 flex items-end gap-2 pt-6">
            {charts.monthlyTrendData?.map((m: any, idx: number) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  {/* Target Bar */}
                  <div
                    className="w-2.5 bg-slate-200 dark:bg-slate-700 rounded-t transition-all"
                    style={{ height: `${m.target}%` }}
                    title={`Mục tiêu: ${m.target}%`}
                  ></div>
                  {/* Actual Bar */}
                  <div
                    className="w-3.5 bg-emerald-500 rounded-t transition-all"
                    style={{ height: `${m.actual}%` }}
                    title={`Thực tế: ${m.actual}%`}
                  ></div>
                </div>
                <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-slate-300 rounded"></span> Chỉ tiêu
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded"></span> Thực tế thực hiện
            </div>
          </div>
        </div>

        {/* Chart 3: KPI Score by Group */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isPresentationMode ? "text-white text-xl" : "text-slate-800"}`}>
            <Sparkles className="w-5 h-5 text-purple-600" />
            3. Điểm KPI Theo Nhóm Quản Lý
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {charts.kpiScoreByGroup?.map((g: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-xl border ${isPresentationMode ? "bg-slate-900 border-slate-700" : "bg-purple-50/50 border-purple-100"}`}>
                <div className="text-xs text-slate-500 font-medium">{g.group}</div>
                <div className="text-2xl font-black text-purple-700 mt-1">{g.score} <span className="text-xs text-slate-400">đ</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Campus KPI Comparison */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isPresentationMode ? "text-white text-xl" : "text-slate-800"}`}>
            <Building2 className="w-5 h-5 text-indigo-600" />
            4. So Sánh Điểm KPI Giữa Các Phân Hiệu
          </h3>
          <div className="space-y-4 pt-2">
            {charts.campusKpiComparison?.map((c: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className={isPresentationMode ? "text-slate-200" : "text-slate-800"}>{c.campus}</span>
                  <span className="text-indigo-600">{c.kpiScore} / 100 điểm</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.kpiScore}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 5: Quality Goals Distribution */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 ${isPresentationMode ? "text-white text-xl" : "text-slate-800"}`}>
            <PieIcon className="w-5 h-5 text-teal-600" />
            5. Tỷ Lệ Đạt Mục Tiêu Chất Lượng
          </h3>
          <div className="space-y-2.5">
            {charts.qualityStatusDistribution?.map((st: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }}></span>
                  <span className={isPresentationMode ? "text-slate-200" : "text-slate-700"}>{st.name}</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{st.count} Mục tiêu</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 8: Top 5 At-Risk Objectives */}
        <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <h3 className={`font-bold text-base mb-4 flex items-center gap-2 text-rose-600 ${isPresentationMode ? "text-xl text-rose-400" : ""}`}>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            8. Top 5 Chỉ Tiêu Có Nguy Cơ Không Đạt
          </h3>
          <div className="space-y-2.5">
            {charts.topAtRiskObjectives?.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Không có chỉ tiêu nào ở mức cảnh báo rủi ro.</div>
            ) : (
              charts.topAtRiskObjectives?.map((obj: any) => (
                <div
                  key={obj.id}
                  onClick={() =>
                    setSelectedDetailModal({
                      title: `Chi tiết chỉ tiêu: ${obj.title}`,
                      type: "OBJECTIVE_DETAIL",
                      data: obj,
                    })
                  }
                  className="p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-100/50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-xs text-slate-800 truncate">{obj.title}</div>
                    <div className="text-[11px] text-slate-500">Phụ trách: {obj.responsiblePerson}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-rose-600">{obj.completionRate}%</div>
                    <span className="text-[10px] text-slate-400">Hoàn thành</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Table 1: Governance Warnings (Cảnh báo quản trị) */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isPresentationMode ? "text-white text-2xl" : "text-slate-800"}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Bảng Cảnh Báo Quản Trị Hệ Thống
            </h3>
            <p className="text-xs text-slate-500">Theo dõi các nguy cơ, vi phạm hạn xử lý và phân cấp mức độ cảnh báo</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-slate-500 uppercase tracking-wider font-bold ${isPresentationMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200"}`}>
                <th className="py-3 px-4">Nội Dung Cảnh Báo</th>
                <th className="py-3 px-3">Phân Hiệu</th>
                <th className="py-3 px-3">Mức Độ Cảnh Báo</th>
                <th className="py-3 px-4">Người Chịu Trách Nhiệm</th>
                <th className="py-3 px-3">Hạn Xử Lý</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {governanceWarnings.map((warn: any) => (
                <tr key={warn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{warn.title}</td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium">{warn.campus}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        warn.level === "KHAN_CAP"
                          ? "bg-red-100 text-red-800 border-red-300 animate-pulse"
                          : warn.level === "QUAN_TRONG"
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : warn.level === "CAN_CHU_Y"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      {warn.levelLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{warn.responsiblePerson}</td>
                  <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">{warn.dueDate}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        warn.status === "DA_XU_LY" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {warn.status === "DA_XU_LY" ? "Đã xử lý" : "Chưa xử lý"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() =>
                        setSelectedDetailModal({
                          title: `Chi tiết cảnh báo: ${warn.title}`,
                          type: "GOVERNANCE_WARNING",
                          data: warn,
                        })
                      }
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg transition"
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Campus Progress (Tiến độ các phân hiệu) */}
      <div className={`p-6 rounded-2xl border shadow-sm ${isPresentationMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${isPresentationMode ? "text-white text-2xl" : "text-slate-800"}`}>
              <Building2 className="w-5 h-5 text-indigo-600" />
              Bảng Tiến Độ Thực Hiện Các Phân Hiệu
            </h3>
            <p className="text-xs text-slate-500">So sánh toàn diện về KPI, kế hoạch năm học và nguy cơ giữa các cơ sở</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b text-slate-500 uppercase tracking-wider font-bold ${isPresentationMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200"}`}>
                <th className="py-3 px-4">Tên Phân Hiệu</th>
                <th className="py-3 px-3 text-center">Điểm KPI</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Kế Hoạch</th>
                <th className="py-3 px-3 text-center">Số Quá Hạn</th>
                <th className="py-3 px-3 text-center">Số Chưa Đạt</th>
                <th className="py-3 px-3">Cập Nhật Gần Nhất</th>
                <th className="py-3 px-4 text-center">Trạng Thái Tổng Thể</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {campusProgressList.map((cp: any) => (
                <tr
                  key={cp.id}
                  onClick={() =>
                    setSelectedDetailModal({
                      title: `Chi tiết tình hình phân hiệu: ${cp.name}`,
                      type: "CAMPUS_DETAIL",
                      data: cp,
                    })
                  }
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{cp.name}</td>
                  <td className="py-3.5 px-3 text-center font-extrabold text-blue-600 text-sm">{cp.kpiScore}</td>
                  <td className="py-3.5 px-3 text-center font-extrabold text-emerald-600 text-sm">{cp.planCompletionRate}%</td>
                  <td className="py-3.5 px-3 text-center font-bold text-red-600">{cp.overdueTasks}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-amber-600">{cp.unachievedGoals}</td>
                  <td className="py-3.5 px-3 text-slate-500">{cp.lastUpdated}</td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                        cp.overallStatus === "XUAT_SAC"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : cp.overallStatus === "CAN_CHU_Y"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      }`}
                    >
                      {cp.overallStatusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Detail Modal */}
      {selectedDetailModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{selectedDetailModal.title}</h3>
              <button onClick={() => setSelectedDetailModal(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-200 max-h-[70vh] overflow-y-auto">
              {selectedDetailModal.type === "GOVERNANCE_WARNING" && (
                <div className="space-y-3">
                  <div><strong>Chi tiết nội dung:</strong> {selectedDetailModal.data.detail}</div>
                  <div><strong>Phân hiệu:</strong> {selectedDetailModal.data.campus}</div>
                  <div><strong>Người chịu trách nhiệm:</strong> {selectedDetailModal.data.responsiblePerson}</div>
                  <div><strong>Hạn xử lý:</strong> {selectedDetailModal.data.dueDate}</div>
                </div>
              )}

              {selectedDetailModal.type === "CAMPUS_DETAIL" && (
                <div className="space-y-3">
                  <div><strong>Phân hiệu:</strong> {selectedDetailModal.data.name}</div>
                  <div><strong>Điểm KPI đạt được:</strong> {selectedDetailModal.data.kpiScore} / 100</div>
                  <div><strong>Tỷ lệ hoàn thành kế hoạch:</strong> {selectedDetailModal.data.planCompletionRate}%</div>
                  <div><strong>Số chỉ tiêu chưa đạt:</strong> {selectedDetailModal.data.unachievedGoals}</div>
                  <div><strong>Trạng thái đánh giá:</strong> {selectedDetailModal.data.overallStatusLabel}</div>
                </div>
              )}

              {selectedDetailModal.type === "OBJECTIVE_DETAIL" && (
                <div className="space-y-3">
                  <div><strong>Mục tiêu:</strong> {selectedDetailModal.data.title}</div>
                  <div><strong>Mã chỉ số:</strong> {selectedDetailModal.data.code}</div>
                  <div><strong>Tỷ lệ hoàn thành:</strong> {selectedDetailModal.data.completionRate}%</div>
                  <div><strong>Người phụ trách:</strong> {selectedDetailModal.data.responsiblePerson}</div>
                </div>
              )}

              {["STRATEGY_COMPLETION", "YEARLY_PLAN", "KPI_SCORE", "QUALITY_ACHIEVED", "OVERDUE_TASKS", "UNUPDATED_KPIS", "PENDING_APPROVAL", "WARNING_CAMPUSES"].includes(selectedDetailModal.type) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                  <div className="text-3xl font-black text-blue-600 mb-1">{selectedDetailModal.data}</div>
                  <p className="text-xs text-slate-500">Dữ liệu được cập nhật theo thời gian thực từ cơ sở dữ liệu hệ thống.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-right">
              <button
                onClick={() => setSelectedDetailModal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
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
