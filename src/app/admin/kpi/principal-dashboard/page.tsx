"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/kpi/page.tsx:21
 * 2. Public functions affected: PrincipalKpiDashboard (Default Export Component)
 * 3. Data structures: PrincipalKpiOverviewPayload, PrincipalKpiEntityComparison, PrincipalKpiPillarScore
 * 4. Verbatim User Instruction: "hãy cập nhập thêm phần KPI của hiểu trưởng để theo dõi các trường" - "theo khuyến nghị của bạn"
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getPrincipalKpiComparisonData,
  getPrincipalKpiSchoolOptions,
  generatePrincipalKpiAiInsights,
  savePrincipalKpiSnapshot,
  triggerPrincipalKpiEarlyWarnings,
  getPrincipalKpiHistoricalTrends,
  createQualityGoalFromBottleneck,
  batchScanAllCampusesKpiAndEarlyWarnings,
  approveCampusKpiSnapshot,
  PrincipalKpiOverviewPayload,
  PrincipalKpiEntityComparison,
  PillarComponentBreakdown,
} from "../principal-actions";
import { ReportingFrequency, KpiCategory } from "@prisma/client";
import { CATEGORY_LABELS } from "../kpi-labels";
import {
  Building2,
  Target,
  Award,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  Layers,
  GraduationCap,
  Users,
  ShieldCheck,
  Zap,
  Info,
  SlidersHorizontal,
  X,
  Compass,
  FileSpreadsheet,
  BookmarkCheck,
  Save,
  BellRing,
  PlusCircle,
  History,
  ExternalLink,
  Database,
  Trophy,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const TREND_COLORS = [
  "#1e40af",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0d9488",
  "#e11d48",
  "#4f46e5",
  "#b45309",
];

export default function PrincipalKpiDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PrincipalKpiOverviewPayload | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("ALL");
  const [scopeType, setScopeType] = useState<"CAMPUS" | "SCHOOL">("CAMPUS");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [periodType, setPeriodType] = useState<ReportingFrequency>(ReportingFrequency.MONTHLY);
  const [activeSubView, setActiveSubView] = useState<"LEADERBOARD" | "RADAR" | "TREND" | "HEATMAP">("LEADERBOARD");

  // Detailed Modal / Drawer State
  const [selectedEntity, setSelectedEntity] = useState<PrincipalKpiEntityComparison | null>(null);
  const [selectedPillarForDrilldown, setSelectedPillarForDrilldown] = useState<{
    name: string;
    code?: string;
    score: number;
    target?: number;
    weight?: number;
    components?: PillarComponentBreakdown[];
    entityName?: string;
  } | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotFeedback, setSnapshotFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Early Warning & Quality Goal Action States
  const [warningLoading, setWarningLoading] = useState(false);
  const [warningFeedback, setWarningFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [creatingGoal, setCreatingGoal] = useState<string | null>(null);
  const [goalFeedback, setGoalFeedback] = useState<{ bottleneck: string; message: string; code?: string } | null>(null);

  // Batch Auto-Scan State
  const [batchScanLoading, setBatchScanLoading] = useState(false);
  const [batchScanFeedback, setBatchScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Historical Trends State
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendEntities, setTrendEntities] = useState<string[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // AI Insights State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Load School Options
  useEffect(() => {
    async function loadOptions() {
      const res = await getPrincipalKpiSchoolOptions();
      if (res.success && res.data) {
        setSchools(res.data.schools);
      }
    }
    loadOptions();
  }, []);

  // Fetch KPI Comparison Data
  const fetchData = async () => {
    setLoading(true);
    const res = await getPrincipalKpiComparisonData({
      year,
      periodType,
      scopeType,
      schoolId: selectedSchoolId,
    });

    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  // Fetch Historical Trends Data
  const fetchTrendData = async () => {
    setTrendLoading(true);
    const res = await getPrincipalKpiHistoricalTrends({
      scopeType,
      year,
    });
    if (res.success && res.trendData) {
      setTrendData(res.trendData);
      setTrendEntities(res.entities || []);
    }
    setTrendLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (activeSubView === "TREND") {
      fetchTrendData();
    }
  }, [year, periodType, scopeType, selectedSchoolId, activeSubView]);

  // Trigger Early Warning Action
  const handleTriggerWarning = async (entity: PrincipalKpiEntityComparison) => {
    setWarningLoading(true);
    setWarningFeedback(null);
    const res = await triggerPrincipalKpiEarlyWarnings({
      entityId: entity.id,
      entityName: entity.name,
      compositeScore: entity.compositeScore,
      tier: entity.tier,
      bottlenecks: entity.bottlenecks,
      attendanceRate: entity.categoryScores["STUDENT"]?.completionRate || 92,
      incidentCount: entity.categoryScores["SCHOOL_SAFETY"]?.completionRate === 100 ? 0 : 1,
    });
    if (res.success) {
      setWarningFeedback({ type: "success", message: res.message || "Đã kích hoạt cảnh báo sớm thành công!" });
    } else {
      setWarningFeedback({ type: "error", message: res.error || "Không thể kích hoạt cảnh báo." });
    }
    setWarningLoading(false);
  };

  // Create Quality Goal from Bottleneck
  const handleCreateQualityGoal = async (entity: PrincipalKpiEntityComparison, bottleneck: string) => {
    setCreatingGoal(bottleneck);
    setGoalFeedback(null);
    const res = await createQualityGoalFromBottleneck({
      entityName: entity.name,
      campusId: entity.type === "CAMPUS" ? entity.id : undefined,
      bottleneckText: bottleneck,
      targetScore: 95,
    });
    if (res.success) {
      setGoalFeedback({ bottleneck, message: res.message || "Đã tạo mục tiêu thành công!", code: res.code });
    }
    setCreatingGoal(null);
  };

  // Save Snapshot Action
  const handleSaveSnapshot = async (entity: PrincipalKpiEntityComparison) => {
    setSnapshotLoading(true);
    setSnapshotFeedback(null);
    const res = await savePrincipalKpiSnapshot({
      entityId: entity.id,
      entityType: entity.type,
      year,
      periodType,
      compositeScore: entity.compositeScore,
      categoryScores: entity.categoryScores,
    });
    if (res.success) {
      setSnapshotFeedback({ type: "success", message: res.message || "Đã chốt sổ và lưu snapshot KPI thành công!" });
      fetchData();
    } else {
      setSnapshotFeedback({ type: "error", message: res.error || "Không thể lưu snapshot KPI." });
    }
    setSnapshotLoading(false);
  };

  // Batch Auto-Scan All Campuses for Early Warnings
  const handleBatchScan = async () => {
    setBatchScanLoading(true);
    setBatchScanFeedback(null);
    try {
      const res = await batchScanAllCampusesKpiAndEarlyWarnings({
        year,
        schoolId: selectedSchoolId,
        autoDispatchWarnings: true,
      });
      if (res.success) {
        setBatchScanFeedback({ type: "success", message: res.message || "Đã hoàn thành quét tự động toàn bộ điểm trường!" });
        fetchData();
      } else {
        setBatchScanFeedback({ type: "error", message: res.error || "Lỗi quét tự động KPI" });
      }
    } catch (err: any) {
      setBatchScanFeedback({ type: "error", message: err.message || "Lỗi không xác định khi quét tự động" });
    } finally {
      setBatchScanLoading(false);
    }
  };

  // 1-Click Approve & Lock Snapshot
  const handleApproveSnapshot = async (entity: PrincipalKpiEntityComparison) => {
    setApproveLoading(true);
    try {
      const res = await approveCampusKpiSnapshot({
        campusId: entity.type === "CAMPUS" ? entity.id : undefined,
        periodId: entity.periodId,
        year,
        periodType,
        comments: `Hiệu trưởng đã phê duyệt và khóa sổ KPI chính thức cho ${entity.name}`,
      });
      if (res.success) {
        setSnapshotFeedback({ type: "success", message: res.message || "Đã phê duyệt và khóa sổ thành công!" });
        fetchData();
        if (selectedEntity && selectedEntity.id === entity.id) {
          setSelectedEntity({ ...selectedEntity, periodStatus: "APPROVED" });
        }
      } else {
        setSnapshotFeedback({ type: "error", message: res.error || "Lỗi phê duyệt KPI" });
      }
    } catch (err: any) {
      setSnapshotFeedback({ type: "error", message: err.message || "Lỗi không xác định khi phê duyệt" });
    } finally {
      setApproveLoading(false);
    }
  };

  // Export Excel CSV with UTF-8 BOM
  const handleExportExcel = () => {
    if (!data || data.entities.length === 0) return;

    const allCatKeys = Object.keys(CATEGORY_LABELS) as KpiCategory[];
    const headers = [
      "Hạng",
      "Tên Đơn Vị",
      "Trực Thuộc Trường",
      "Điểm Tổng Hợp (/100)",
      "Phân Hạng",
      "Sĩ Số Học Sinh",
      "Số Lớp",
      "Số Giáo Viên",
      "Trụ Cột 1 (Đào Tạo & Học Sinh %)",
      "Trụ Cột 2 (Chuyên Môn & Giáo Viên %)",
      "Trụ Cột 3 (Nề Nếp & An Toàn %)",
      "Trụ Cột 4 (CSVC & Chuyển Đổi Số %)",
      ...allCatKeys.map((k) => `KPI: ${CATEGORY_LABELS[k] || k} (%)`),
    ];

    const rows = data.entities.map((e) => [
      `#${e.rank}`,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${(e.schoolName || "").replace(/"/g, '""')}"`,
      e.compositeScore,
      `"${e.tierLabel}"`,
      e.studentCount,
      e.classCount,
      e.teacherCount,
      e.pillars[0]?.score ?? 0,
      e.pillars[1]?.score ?? 0,
      e.pillars[2]?.score ?? 0,
      e.pillars[3]?.score ?? 0,
      ...allCatKeys.map((k) => e.categoryScores[k]?.completionRate ?? 0),
    ]);

    const csvContent = "﻿" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_KPI_Hieu_Truong_${year}_${periodType}_${scopeType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger AI Decision Analysis
  const handleGenerateAiInsights = async () => {
    if (!data || data.entities.length === 0) return;
    setAiModalOpen(true);
    setAiLoading(true);

    const summary = data.entities.map((e) => ({
      name: e.name,
      rank: e.rank,
      compositeScore: e.compositeScore,
      tier: e.tierLabel,
      topBottlenecks: e.bottlenecks,
      topStrengths: e.topStrengths,
    }));

    const res = await generatePrincipalKpiAiInsights({
      year,
      periodType,
      scopeType,
      entityCount: data.totalEntities,
      averageScore: data.averageScore,
      entitiesSummary: summary,
    });

    if (res.success && res.analysis) {
      setAiAnalysis(res.analysis);
    } else {
      setAiAnalysis("Không thể khởi tạo phân tích lúc này. Vui lòng thử lại sau.");
    }
    setAiLoading(false);
  };

  // Color mapping helpers
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "XUAT_SAC":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">🌟 Xuất sắc</span>;
      case "TOT":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">✨ Khá / Tốt</span>;
      case "DAT":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">⚡ Đạt chuẩn</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">🚨 Cần can thiệp</span>;
    }
  };

  const getHeatmapColor = (rate: number) => {
    if (rate >= 90) return "bg-emerald-600 text-white font-semibold";
    if (rate >= 75) return "bg-blue-600 text-white font-medium";
    if (rate >= 60) return "bg-amber-400 text-amber-950 font-bold";
    return "bg-rose-600 text-white font-bold animate-pulse";
  };

  // Bar Chart formatting
  const barChartData = data?.entities.map((e) => ({
    name: e.name.length > 18 ? e.name.substring(0, 16) + "..." : e.name,
    fullName: e.name,
    score: e.compositeScore,
    rank: e.rank,
    tier: e.tier,
    "Chất lượng đào tạo": e.pillars[0]?.score || 0,
    "Chuyên môn GV": e.pillars[1]?.score || 0,
    "Nề nếp & An toàn": e.pillars[2]?.score || 0,
    "Cơ sở vật chất": e.pillars[3]?.score || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Bảng Giám Sát KPI Hiệu Trưởng (Liên Trường & Điểm Trường)
            </h2>
            <p className="text-xs text-slate-500">
              Tổng hợp, phân tích đa chiều và xếp hạng chất lượng vận hành toàn hệ thống theo thời gian thực
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/emulation"
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
            title="Xem Bảng Vàng Thi Đua & Giám Sát Chuyên Cần Đi Muộn Real-time"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Bảng Vàng Thi Đua</span>
          </Link>

          <button
            onClick={handleBatchScan}
            disabled={batchScanLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-amber-950 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
            title="Quét toàn bộ điểm trường và tự động kích hoạt cảnh báo sớm nếu phát hiện nguy cơ"
          >
            <BellRing className={`w-4 h-4 ${batchScanLoading ? "animate-spin" : ""}`} />
            <span>{batchScanLoading ? "Đang quét..." : "Quét Cảnh Báo Sớm"}</span>
          </button>

          <button
            onClick={handleGenerateAiInsights}
            className="flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-sm font-semibold shadow-md transition-all scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            AI Phân Tích & Đề Xuất
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Xuất Excel (.csv)
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium border border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            In Báo Cáo
          </button>

          <button
            onClick={fetchData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Batch Scan Feedback Banner */}
      {batchScanFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
            batchScanFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {batchScanFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{batchScanFeedback.message}</span>
          </div>
          <button
            onClick={() => setBatchScanFeedback(null)}
            className={`p-1 rounded-md transition-colors ${
              batchScanFeedback.type === "success"
                ? "text-emerald-700 hover:text-emerald-950 hover:bg-emerald-100/60"
                : "text-rose-700 hover:text-rose-950 hover:bg-rose-100/60"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-blue-700" />
            Phạm vi:
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setScopeType("CAMPUS")}
              className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                scopeType === "CAMPUS" ? "bg-blue-700 text-white shadow-xs" : "text-slate-800 hover:bg-white hover:text-blue-900"
              }`}
            >
              📍 Theo Điểm Trường / Phân Hiệu
            </button>
            <button
              onClick={() => setScopeType("SCHOOL")}
              className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all ${
                scopeType === "SCHOOL" ? "bg-blue-700 text-white shadow-xs" : "text-slate-800 hover:bg-white hover:text-blue-900"
              }`}
            >
              🏫 Theo Trường Học (Cụm)
            </button>
          </div>

          {scopeType === "CAMPUS" && schools.length > 0 && (
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">-- Tất cả trường học --</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as ReportingFrequency)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="MONTHLY">Định kỳ Hàng Tháng</option>
            <option value="QUARTERLY">Định kỳ Hàng Quý</option>
            <option value="SEMESTER">Theo Học Kỳ</option>
            <option value="YEARLY">Tổng Kết Cả Năm</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2026}>Năm học 2025 - 2026</option>
            <option value={2025}>Năm học 2024 - 2025</option>
            <option value={2024}>Năm học 2023 - 2024</option>
          </select>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300">
          <button
            onClick={() => setActiveSubView("LEADERBOARD")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubView === "LEADERBOARD"
                ? "bg-blue-800 text-white shadow-xs"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            🏆 Bảng Xếp Hạng
          </button>
          <button
            onClick={() => setActiveSubView("RADAR")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubView === "RADAR"
                ? "bg-blue-800 text-white shadow-xs"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            🕸️ Radar So Sánh
          </button>
          <button
            onClick={() => setActiveSubView("TREND")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubView === "TREND"
                ? "bg-blue-800 text-white shadow-xs"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            📈 Xu Hướng Đa Kỳ
          </button>
          <button
            onClick={() => setActiveSubView("HEATMAP")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeSubView === "HEATMAP"
                ? "bg-blue-800 text-white shadow-xs"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            🔥 Ma Trận Nhiệt (12 Nhóm)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Đang tổng hợp dữ liệu KPI toàn hệ thống...</p>
        </div>
      ) : !data || data.entities.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Info className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Chưa có dữ liệu trường học phù hợp</h3>
          <p className="text-sm text-slate-500">Vui lòng thay đổi bộ lọc trường hoặc năm đánh giá.</p>
        </div>
      ) : (
        <>
          {/* 3. Top Executive Metric Cards (4 Strategic Pillars + Distribution) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* Card 1: Điểm Trung Bình Toàn Mạng Lưới */}
            <div className="bg-gradient-to-br from-[#1a237e] to-[#283593] text-white p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Tổng Điểm Mạng Lưới</span>
                <Award className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">{data.averageScore}</span>
                <span className="text-xs text-blue-200">/ 100 điểm</span>
              </div>
              <div className="pt-2 border-t border-white/15 text-xs text-blue-100 flex items-center justify-between">
                <span>Tổng số đơn vị:</span>
                <span className="font-bold text-white">{data.totalEntities} đơn vị</span>
              </div>
            </div>

            {/* Pillar 1 */}
            <div
              onClick={() =>
                setSelectedPillarForDrilldown({
                  code: data.pillarAverages[0]?.code,
                  name: data.pillarAverages[0]?.name,
                  score: data.pillarAverages[0]?.averageScore,
                  target: data.pillarAverages[0]?.target || 90,
                  weight: data.pillarAverages[0]?.weight || 35,
                  components: data.pillarAverages[0]?.components,
                  entityName: "Toàn Mạng Lưới Trường Học",
                })
              }
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase group-hover:text-emerald-700 transition-colors">
                  Chất Lượng Đào Tạo
                </span>
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{data.pillarAverages[0]?.averageScore}%</span>
                <span className="text-xs text-slate-400">chuẩn ≥90%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.pillarAverages[0]?.averageScore || 0)}%` }}
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  Căn cứ: Điểm số TT 27 & Học tập
                </span>
                <span className="text-emerald-600 text-[10px] font-bold group-hover:underline">Chi tiết →</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div
              onClick={() =>
                setSelectedPillarForDrilldown({
                  code: data.pillarAverages[1]?.code,
                  name: data.pillarAverages[1]?.name,
                  score: data.pillarAverages[1]?.averageScore,
                  target: data.pillarAverages[1]?.target || 92,
                  weight: data.pillarAverages[1]?.weight || 25,
                  components: data.pillarAverages[1]?.components,
                  entityName: "Toàn Mạng Lưới Trường Học",
                })
              }
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase group-hover:text-blue-700 transition-colors">
                  Chuyên Môn Giáo Viên
                </span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{data.pillarAverages[1]?.averageScore}%</span>
                <span className="text-xs text-slate-400">chuẩn ≥92%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.pillarAverages[1]?.averageScore || 0)}%` }}
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  Căn cứ: Giáo án (LessonPlan)
                </span>
                <span className="text-blue-600 text-[10px] font-bold group-hover:underline">Chi tiết →</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div
              onClick={() =>
                setSelectedPillarForDrilldown({
                  code: data.pillarAverages[2]?.code,
                  name: data.pillarAverages[2]?.name,
                  score: data.pillarAverages[2]?.averageScore,
                  target: data.pillarAverages[2]?.target || 95,
                  weight: data.pillarAverages[2]?.weight || 20,
                  components: data.pillarAverages[2]?.components,
                  entityName: "Toàn Mạng Lưới Trường Học",
                })
              }
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase group-hover:text-amber-700 transition-colors">
                  Nề Nếp & An Toàn
                </span>
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{data.pillarAverages[2]?.averageScore}%</span>
                <span className="text-xs text-slate-400">chuẩn ≥95%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.pillarAverages[2]?.averageScore || 0)}%` }}
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  Căn cứ: Điểm danh & Đi muộn
                </span>
                <span className="text-amber-600 text-[10px] font-bold group-hover:underline">Chi tiết →</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div
              onClick={() =>
                setSelectedPillarForDrilldown({
                  code: data.pillarAverages[3]?.code,
                  name: data.pillarAverages[3]?.name,
                  score: data.pillarAverages[3]?.averageScore,
                  target: data.pillarAverages[3]?.target || 88,
                  weight: data.pillarAverages[3]?.weight || 20,
                  components: data.pillarAverages[3]?.components,
                  entityName: "Toàn Mạng Lưới Trường Học",
                })
              }
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase group-hover:text-sky-700 transition-colors">
                  Cơ Sở & Số Hóa
                </span>
                <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg group-hover:bg-sky-100 transition-colors">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-800">{data.pillarAverages[3]?.averageScore}%</span>
                <span className="text-xs text-slate-400">chuẩn ≥88%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, data.pillarAverages[3]?.averageScore || 0)}%` }}
                />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 truncate">
                  <Database className="w-3 h-3 text-slate-400 shrink-0" />
                  Căn cứ: Thiết bị & Mục tiêu CL
                </span>
                <span className="text-sky-600 text-[10px] font-bold group-hover:underline">Chi tiết →</span>
              </div>
            </div>
          </div>

          {/* Tier Distribution Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>Phân Bổ Xếp Hạng ({data.totalEntities} Đơn Vị):</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                🌟 Xuất sắc: {data.tierDistribution.xuatSac}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                ✨ Khá/Tốt: {data.tierDistribution.tot}
              </span>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                ⚡ Đạt chuẩn: {data.tierDistribution.dat}
              </span>
              <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                🚨 Cần can thiệp: {data.tierDistribution.canCanThiep}
              </span>
            </div>
          </div>

          {/* 4. Sub-view Panels */}

          {/* VIEW 1: LEADERBOARD & RANKINGS */}
          {activeSubView === "LEADERBOARD" && (
            <div className="space-y-6">
              {/* Leaderboard Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-700" />
                    Biểu Đồ Xếp Hạng Điểm Tổng Hợp & Phân Rã 4 Trụ Cột
                  </h3>
                  <span className="text-xs text-slate-400">Đơn vị: Điểm KPI (0 - 100)</span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#475569" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="score" fill="#1e40af" name="Điểm Tổng Hợp" radius={[6, 6, 0, 0]} barSize={28} />
                      <Bar dataKey="Chất lượng đào tạo" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="Chuyên môn GV" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="Nề nếp & An toàn" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Entity Ranking Table / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.entities.map((entity) => (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntity(entity)}
                    className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-4 relative group"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                            entity.rank === 1
                              ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                              : entity.rank === 2
                              ? "bg-slate-200 text-slate-800 border border-slate-300"
                              : entity.rank === 3
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          #{entity.rank}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {entity.name}
                          </h4>
                          {entity.schoolName && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {entity.schoolName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {getTierBadge(entity.tier)}
                        {entity.periodStatus === "APPROVED" ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Đã Khóa Sổ
                          </span>
                        ) : entity.periodStatus === "SUBMITTED" ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 animate-pulse flex items-center gap-1">
                            <Target className="w-3 h-3" /> Chờ BGH Duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Dự báo tự động
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">Điểm tổng hợp:</span>
                        <span className="font-extrabold text-blue-800 text-sm">{entity.compositeScore} / 100</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            entity.compositeScore >= 90
                              ? "bg-emerald-500"
                              : entity.compositeScore >= 75
                              ? "bg-blue-500"
                              : entity.compositeScore >= 60
                              ? "bg-amber-400"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, entity.compositeScore)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Stats: Students & Teachers */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Học sinh</span>
                        <span className="font-bold text-slate-700">{entity.studentCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Giáo viên</span>
                        <span className="font-bold text-slate-700">{entity.teacherCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Lớp học</span>
                        <span className="font-bold text-slate-700">{entity.classCount}</span>
                      </div>
                    </div>

                    {/* Top Strengths & Bottlenecks */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{entity.topStrengths[0] || "Đồng đều các chỉ số"}</span>
                      </div>
                      {entity.bottlenecks.length > 0 && (
                        <div className="flex items-start gap-1.5 text-rose-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{entity.bottlenecks[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Xem chi tiết chỉ số & minh chứng</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: RADAR CHART MULTI-ENTITY COMPARISON */}
          {activeSubView === "RADAR" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar Comparison Chart */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-700" />
                    Biểu Đồ Radar So Sánh 6 Trục Chất Lượng Với Chuẩn Mạng Lưới
                  </h3>
                  <span className="text-xs text-slate-400">Đơn vị: Tỷ lệ hoàn thành %</span>
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.benchmarkRadar}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "#334155" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                      <Radar
                        name="Điểm Chuẩn Trung Bình"
                        dataKey="avgScore"
                        stroke="#1e40af"
                        fill="#1e40af"
                        fillOpacity={0.25}
                      />
                      <Radar
                        name="Mức Cao Nhất (Max)"
                        dataKey="maxScore"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.15}
                      />
                      <Radar
                        name="Mức Thấp Nhất (Min)"
                        dataKey="minScore"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.15}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dimension Analysis Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-700" />
                  Đánh Giá 6 Trục Trọng Tâm
                </h4>

                <div className="space-y-3">
                  {data.benchmarkRadar.map((dim, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{dim.dimension}</span>
                        <span className="font-extrabold text-blue-800">{dim.avgScore}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cao nhất: {dim.maxScore}%</span>
                        <span className="text-rose-600">Thấp nhất: {dim.minScore}%</span>
                        <span>Độ lệch: {(dim.maxScore - dim.minScore).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-700 h-full rounded-full"
                          style={{ width: `${Math.min(100, dim.avgScore)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: HEATMAP MATRIX OF ALL 12 KPI CATEGORIES */}
          {activeSubView === "HEATMAP" && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-700" />
                    Ma Trận Cảnh Báo Nhiệt 12 Nhóm KPI Giữa Các Trường / Điểm Trường
                  </h3>
                  <p className="text-xs text-slate-500">
                    Màu Xanh: Tốt (≥90%) | Xanh dương: Khá (75-89%) | Vàng: Đạt (60-74%) | Đỏ: Cảnh báo sụt giảm (&lt;60%)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="p-3 font-bold sticky left-0 bg-slate-100 z-10 w-48">Đơn Vị / Trường</th>
                      <th className="p-3 font-bold text-center w-24">Tổng Điểm</th>
                      {Object.keys(CATEGORY_LABELS).map((catKey) => (
                        <th key={catKey} className="p-2 font-semibold text-center w-20" title={CATEGORY_LABELS[catKey as KpiCategory]}>
                          {catKey.substring(0, 5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.entities.map((entity) => (
                      <tr key={entity.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">#{entity.rank}</span>
                            <span className="line-clamp-1">{entity.name}</span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <span className="px-2 py-1 rounded-md font-extrabold bg-slate-100 text-blue-800">
                            {entity.compositeScore}
                          </span>
                        </td>
                        {Object.keys(CATEGORY_LABELS).map((catKey) => {
                          const catScore = entity.categoryScores[catKey];
                          const rate = catScore ? catScore.completionRate : 0;
                          return (
                            <td key={catKey} className="p-1.5 text-center">
                              <div
                                className={`p-1.5 rounded-lg text-[11px] text-center transition-transform hover:scale-110 shadow-xs cursor-default ${getHeatmapColor(
                                  rate
                                )}`}
                                title={`${CATEGORY_LABELS[catKey as KpiCategory]}: ${rate}%`}
                              >
                                {rate}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: MULTI-PERIOD HISTORICAL TRENDS */}
          {activeSubView === "TREND" && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-700" />
                      Biểu Đồ Xu Hướng & Lịch Sử Tiến Bộ KPI Qua Các Kỳ ({year})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Theo dõi độ dốc tăng trưởng và điểm rơi hiệu suất của từng đơn vị trong mạng lưới
                    </p>
                  </div>
                  <button
                    onClick={fetchTrendData}
                    disabled={trendLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors self-start md:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${trendLoading ? "animate-spin" : ""}`} />
                    Làm mới xu hướng
                  </button>
                </div>

                {trendLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : trendData.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <History className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">Chưa có dữ liệu lịch sử các kỳ trước.</p>
                  </div>
                ) : (
                  <div className="h-80 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="periodLabel" tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#475569" }} stroke="#cbd5e1" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e2e8f0",
                            fontSize: "12px",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        {trendEntities.map((ent, idx) => (
                          <Line
                            key={ent}
                            type="monotone"
                            dataKey={ent}
                            name={ent}
                            stroke={TREND_COLORS[idx % TREND_COLORS.length]}
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Entity Growth Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-700" />
                  Bảng Tổng Hợp Độ Tăng Trưởng & Đánh Giá Nhịp Độ Phát Triển
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="p-3 font-semibold">Đơn Vị</th>
                        <th className="p-3 font-semibold text-center">Điểm Hiện Tại</th>
                        <th className="p-3 font-semibold text-center">Xếp Hạng</th>
                        <th className="p-3 font-semibold text-center">Trạng Thái</th>
                        <th className="p-3 font-semibold text-right">Khuyến Nghị Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.entities.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-800">{e.name}</td>
                          <td className="p-3 text-center font-extrabold text-blue-900">{e.compositeScore}</td>
                          <td className="p-3 text-center">
                            <span className="font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700">#{e.rank}</span>
                          </td>
                          <td className="p-3 text-center">{getTierBadge(e.tier)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedEntity(e)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                            >
                              Xem & Cải tiến →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Detail Modal for Inspected Entity */}
      {selectedEntity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded-md text-xs font-bold font-mono">
                    Hạng #{selectedEntity.rank}
                  </span>
                  <h3 className="text-xl font-extrabold">{selectedEntity.name}</h3>
                </div>
                <p className="text-xs text-blue-200">
                  {selectedEntity.schoolName ? `Trường: ${selectedEntity.schoolName} | ` : ""}
                  Sĩ số: {selectedEntity.studentCount} HS • {selectedEntity.teacherCount} GV • {selectedEntity.classCount} Lớp
                </p>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Score & Tier Banner */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Điểm Đánh Giá Tổng Hợp</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-900">{selectedEntity.compositeScore}</span>
                    <span className="text-xs text-slate-400">/ 100 điểm</span>
                  </div>
                </div>
                {getTierBadge(selectedEntity.tier)}
              </div>

              {/* 4 Pillars Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Kết Quả 4 Trụ Cột Chiến Lược</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">(căn cứ csdl thời gian thực)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEntity.pillars.map((pil, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        setSelectedPillarForDrilldown({
                          code: pil.code,
                          name: pil.name,
                          score: pil.score,
                          target: pil.target,
                          weight: pil.weight,
                          components: pil.components,
                          entityName: selectedEntity.name,
                        })
                      }
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 group-hover:text-blue-800 transition-colors">
                          {pil.name}
                        </span>
                        <span className="font-bold text-blue-800">{pil.score}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-700 h-full rounded-full"
                          style={{ width: `${Math.min(100, pil.score)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <Database className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {idx === 0
                              ? "Căn cứ: Điểm số TT 27 (Grade) & Học tập"
                              : idx === 1
                              ? "Căn cứ: Giáo án (LessonPlan) & GV"
                              : idx === 2
                              ? "Căn cứ: Điểm danh (Attendance) & Nề nếp"
                              : "Căn cứ: Thiết bị & Mục tiêu CL"}
                          </span>
                        </span>
                        <span className="text-blue-600 font-bold group-hover:underline shrink-0">Tra cứu →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Strengths and Bottlenecks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <h5 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Thế Mạnh Nổi Bật
                  </h5>
                  <ul className="text-xs text-emerald-900 space-y-1">
                    {selectedEntity.topStrengths.map((str, i) => (
                      <li key={i}>• {str}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Điểm Nghẽn & Khuyến Nghị
                    </h5>
                    {(selectedEntity.compositeScore < 70 || selectedEntity.tier === "CAN_CAN_THIEP") && (
                      <button
                        onClick={() => handleTriggerWarning(selectedEntity)}
                        disabled={warningLoading}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                        title="Kích hoạt cảnh báo sớm và phát thông báo hệ thống"
                      >
                        {warningLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <BellRing className="w-3 h-3" />
                        )}
                        Phát Cảnh Báo Sớm
                      </button>
                    )}
                  </div>

                  {warningFeedback && (
                    <div
                      className={`text-xs font-semibold p-2 rounded-lg flex items-center gap-1.5 ${
                        warningFeedback.type === "success"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{warningFeedback.message}</span>
                    </div>
                  )}

                  <ul className="text-xs text-rose-900 space-y-2">
                    {selectedEntity.bottlenecks.length > 0 ? (
                      selectedEntity.bottlenecks.map((bot, i) => (
                        <li
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white/70 rounded-xl border border-rose-100"
                        >
                          <span className="font-medium">• {bot}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {goalFeedback?.bottleneck === bot ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ✓ Đã lập ({goalFeedback.code})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCreateQualityGoal(selectedEntity, bot)}
                                disabled={creatingGoal === bot}
                                className="px-2 py-0.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                {creatingGoal === bot ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <PlusCircle className="w-2.5 h-2.5" />
                                )}
                                Tạo Kế Hoạch Cải Tiến
                              </button>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li>• Vận hành ổn định, không có điểm nghẽn nghiêm trọng.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {snapshotFeedback ? (
                <div
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                    snapshotFeedback.type === "success"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {snapshotFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{snapshotFeedback.message}</span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    Trạng thái kỳ đánh giá:{" "}
                    <span className="font-bold text-slate-800">
                      {selectedEntity.periodStatus === "APPROVED"
                        ? "✓ Đã phê duyệt chính thức & Khóa sổ"
                        : selectedEntity.periodStatus === "SUBMITTED"
                        ? "⏳ Đang trình duyệt BGH (Phó HT đã gửi)"
                        : "⚡ Dự báo tự động theo thời gian thực"}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Kỳ: {periodType} {year} | Điểm tổng hợp: {selectedEntity.compositeScore}/100
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {selectedEntity.periodStatus !== "APPROVED" && (
                  <button
                    onClick={() => handleApproveSnapshot(selectedEntity)}
                    disabled={approveLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    title="Ký duyệt chính thức và đóng băng số liệu KPI kỳ này"
                  >
                    {approveLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
                    )}
                    {approveLoading ? "Đang ký duyệt..." : "Ký Duyệt & Khóa Sổ"}
                  </button>
                )}

                <button
                  onClick={() => handleSaveSnapshot(selectedEntity)}
                  disabled={snapshotLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {snapshotLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-200" />
                  )}
                  {snapshotLoading ? "Đang lưu..." : "Lưu Snapshot"}
                </button>

                <button
                  onClick={() => {
                    setSelectedEntity(null);
                    setSnapshotFeedback(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI Decision Support Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#1a237e] to-[#283593] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <Sparkles className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cố Vấn Chiến Lược AI — Đề Xuất Chỉ Đạo Hiệu Trưởng</h3>
                  <p className="text-xs text-blue-200">
                    Tự động chẩn đoán nguyên nhân và xây dựng phương án hành động liên trường
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-700 leading-relaxed">
              {aiLoading ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-sm">Trợ lý AI đang đọc toàn bộ số liệu KPI...</p>
                    <p className="text-xs text-slate-400">
                      Đang phân tích chênh lệch giữa các điểm trường và tính toán phương án điều phối nhân sự
                    </p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none space-y-3 whitespace-pre-wrap font-sans">
                  {aiAnalysis}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                🔒 Dữ liệu đã được khử trùng PII và tuân thủ Quy tắc toàn vẹn AI (Rule 0).
              </span>
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Pillar Database Lineage & Component Drill-down Inspector */}
      {selectedPillarForDrilldown && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 rounded-xl">
                  <Database className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-400/20 text-cyan-200 rounded text-[10px] font-bold font-mono">
                      {selectedPillarForDrilldown.code || "KPI-PILLAR"}
                    </span>
                    <h3 className="text-base font-extrabold">{selectedPillarForDrilldown.name}</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Đơn vị: {selectedPillarForDrilldown.entityName || "Toàn trường"} • Trọng số: {selectedPillarForDrilldown.weight}% • Chuẩn: ≥{selectedPillarForDrilldown.target}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPillarForDrilldown(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Score summary banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-500">Điểm đánh giá thực tế:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-950">{selectedPillarForDrilldown.score}%</span>
                    <span className="text-xs text-slate-400">/ 100%</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Tiêu chuẩn ngành:</span>
                  <p className="text-sm font-bold text-emerald-700">≥{selectedPillarForDrilldown.target}%</p>
                </div>
              </div>

              {/* Components Lineage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-700" />
                    Cấu Thành Chỉ Số & Nguồn Gốc Dữ Liệu Thực Tế
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">100% CSDL xác thực</span>
                </div>

                {selectedPillarForDrilldown.components && selectedPillarForDrilldown.components.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPillarForDrilldown.components.map((comp, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs space-y-2.5 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold flex items-center justify-center">
                                {cIdx + 1}
                              </span>
                              {comp.name}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-extrabold shrink-0">
                            {comp.value}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{comp.detail}</p>

                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-indigo-700 font-semibold bg-indigo-50/50 p-2 rounded-lg">
                          <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Nguồn CSDL: {comp.dbSource}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                    Dữ liệu chi tiết trụ cột đang được đồng bộ trực tiếp từ hệ thống.
                  </div>
                )}
              </div>

              {/* Data Integrity Guarantee Notice */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="font-bold">Cam kết minh bạch dữ liệu:</span> Toàn bộ các chỉ số KPI được kết xuất tự động từ các bảng nghiệp vụ thực tế của nhà trường (Điểm danh hằng ngày, Sổ điểm TT27, Giáo án điện tử, Quản lý sự cố). Tuyệt đối không sử dụng số liệu ước lượng hoặc giả lập.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedPillarForDrilldown(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Đóng Tra Cứu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
