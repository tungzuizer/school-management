/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/page.tsx`.
 * 2. Affected Component: `JourneyTab` - Tab 2 trong hệ thống phân tích tích hợp.
 * 3. Schemas: `InterventionRecord`, `StudentJourneySnapshot`, `School`, `Campus`.
 * 4. Verbatim User Instruction: "gộp lại đi" - Hợp nhất toàn bộ quản trị hành trình OLS và can thiệp 4 bước vào `/admin/exam-analytics`.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  ShieldAlert,
  Search,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  fetchJourneyOverviewDataAction,
  runBatchJourneyCalculationAction,
  handleApproveInterventionAction,
  handleRejectInterventionAction,
  handleApplyInterventionAction,
  handleTrackOutcomeAction,
} from "./actions";

interface JourneyTabProps {
  selectedSchoolId?: string;
  selectedCampusId?: string;
  onRefreshParent?: () => void;
}

const COLORS = {
  IMPROVING: "#059669", // Emerald 600
  STABLE: "#2563EB",    // Blue 600
  DECLINING: "#DC2626", // Rose 600
  VOLATILE: "#D97706",  // Amber 600
  INSUFFICIENT: "#64748B", // Slate 500
};

export default function JourneyTab({
  selectedSchoolId,
  selectedCampusId,
  onRefreshParent,
}: JourneyTabProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activeInterventionTab, setActiveInterventionTab] = useState<
    "SUGGESTED" | "APPROVED" | "APPLIED" | "OUTCOME_TRACKED"
  >("SUGGESTED");

  // Modals state
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "APPLY" | "OUTCOME" | null>(null);
  const [actionNote, setActionNote] = useState<string>("");
  const [scoreDelta, setScoreDelta] = useState<number>(0.5);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [filterSearch, setFilterSearch] = useState<string>("");

  const loadJourneyData = async () => {
    try {
      setLoading(true);
      const res = await fetchJourneyOverviewDataAction(
        selectedSchoolId,
        selectedCampusId !== "ALL" ? selectedCampusId : undefined
      );
      if (res) setData(res);
    } catch (err) {
      console.error("Error loading journey tab data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourneyData();
  }, [selectedSchoolId, selectedCampusId]);

  const handleRecalculate = async () => {
    if (!selectedSchoolId && !data?.schoolId) return;
    const targetSchool = selectedSchoolId || data?.schoolId;
    setIsCalculating(true);
    try {
      const res = await runBatchJourneyCalculationAction(
        targetSchool,
        selectedCampusId !== "ALL" ? selectedCampusId : undefined
      );
      if (res.success) {
        await loadJourneyData();
        if (onRefreshParent) onRefreshParent();
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedIntervention || !actionType) return;
    setIsSubmittingAction(true);
    try {
      if (actionType === "APPROVE") {
        await handleApproveInterventionAction(selectedIntervention.id, actionNote);
      } else if (actionType === "REJECT") {
        await handleRejectInterventionAction(selectedIntervention.id, actionNote);
      } else if (actionType === "APPLY") {
        await handleApplyInterventionAction(selectedIntervention.id, actionNote);
      } else if (actionType === "OUTCOME") {
        await handleTrackOutcomeAction(selectedIntervention.id, scoreDelta, actionNote);
      }

      await loadJourneyData();
      if (onRefreshParent) onRefreshParent();

      setSelectedIntervention(null);
      setActionType(null);
      setActionNote("");
    } catch (err) {
      console.error("Failed executing intervention action:", err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const summary = data?.summary || {
    total: 0,
    improving: 0,
    declining: 0,
    volatile: 0,
    stable: 0,
    insufficient: 0,
  };

  const pieChartData = [
    { name: "Tăng trưởng (+)", value: summary.improving, color: COLORS.IMPROVING },
    { name: "Ổn định (~)", value: summary.stable, color: COLORS.STABLE },
    { name: "Sa sút (-)", value: summary.declining, color: COLORS.DECLINING },
    { name: "Bất ổn (!)", value: summary.volatile, color: COLORS.VOLATILE },
    { name: "Chưa đủ dữ liệu", value: summary.insufficient, color: COLORS.INSUFFICIENT },
  ].filter((item) => item.value > 0);

  const interventionsList = data?.interventionsList || [];
  const filteredInterventions = interventionsList
    .filter((item: any) => item.status === activeInterventionTab)
    .filter((item: any) => {
      if (!filterSearch.trim()) return true;
      const q = filterSearch.toLowerCase().trim();
      const studentName = item.student?.user?.name?.toLowerCase() || "";
      const studentCode = item.student?.studentCode?.toLowerCase() || "";
      const className = item.student?.classRoom?.name?.toLowerCase() || "";
      const type = item.interventionType?.toLowerCase() || "";
      return studentName.includes(q) || studentCode.includes(q) || className.includes(q) || type.includes(q);
    });

  const funnelData = [
    {
      stage: "1. Đề xuất",
      count: interventionsList.filter((i: any) => i.status === "SUGGESTED").length,
      fill: "#64748B",
    },
    {
      stage: "2. Đã duyệt",
      count: interventionsList.filter((i: any) => i.status === "APPROVED").length,
      fill: "#2563EB",
    },
    {
      stage: "3. Triển khai",
      count: interventionsList.filter((i: any) => i.status === "APPLIED").length,
      fill: "#D97706",
    },
    {
      stage: "4. Kết quả",
      count: interventionsList.filter((i: any) => i.status === "OUTCOME_TRACKED").length,
      fill: "#059669",
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          Đang tính toán ma trận OLS & dữ liệu can thiệp sư phạm...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Sub-Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Mô Hình Hồi Quy Tuyến Tính Điểm Học Sinh (OLS Regression)
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Trung Tâm Điều Hành Hành Trình & Quản Trị Can Thiệp 4 Bước
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Phân tích phương trình hồi quy y = beta_0 + beta_1 x đánh giá tốc độ tiến bộ và chu trình phê duyệt can thiệp sư phạm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/journey-config"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            Cấu hình Ngưỡng
          </Link>
          <Link
            href="/admin/journey-import"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Import Điểm
          </Link>
          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "Đang chạy OLS..." : "Tính Lại OLS Tức Thì"}
          </button>
        </div>
      </div>

      {/* 2. 4 OLS Quadrant Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Improving */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <span>Tăng Trưởng (Improving)</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{summary.improving}</div>
          <p className="text-xs text-slate-500">
            Độ dốc m &gt; +0.25 đ/kỳ • Xu hướng vững chắc
          </p>
        </div>

        {/* Metric 2: Stable */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-800 uppercase tracking-wider">
            <span>Ổn Định (Stable)</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Minus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{summary.stable}</div>
          <p className="text-xs text-slate-500">
            Duy trì phong độ đều đặn qua các học kỳ
          </p>
        </div>

        {/* Metric 3: Declining */}
        <div className="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-800 uppercase tracking-wider">
            <span>Sa Sút (Declining)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-700">{summary.declining}</div>
          <p className="text-xs text-rose-700 font-medium">
            Độ dốc m &lt; -0.25 đ/kỳ • Cần kích hoạt can thiệp
          </p>
        </div>

        {/* Metric 4: Volatile */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <span>Bất Ổn (Volatile)</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-700">{summary.volatile}</div>
          <p className="text-xs text-amber-800 font-medium">
            Độ biến động residuals sigma &gt; 1.2 • Phong độ thất thường
          </p>
        </div>
      </div>

      {/* 3. Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Donut Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Phân Bố Xu Hướng Học Lực
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dựa trên mô hình hồi quy tuyến tính OLS toàn bộ học sinh
            </p>
          </div>

          <div className="h-56 my-3 flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: "0.5rem",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">Chưa có dữ liệu phân tích</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
              Tăng: <strong className="text-slate-900">{summary.improving}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
              Ổn định: <strong className="text-slate-900">{summary.stable}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
              Sa sút: <strong className="text-rose-700">{summary.declining}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-600" />
              Bất ổn: <strong className="text-amber-700">{summary.volatile}</strong>
            </div>
          </div>
        </div>

        {/* Chart 2: 4-Step Funnel Bar */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              Phễu Quản Trị Vòng Đời Can Thiệp Sư Phạm
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy trình 4 bước chuẩn hóa: Đề Xuất → Ban Giám Hiệu Duyệt → Triển Khai → Đo Lường Delta Điểm
            </p>
          </div>

          <div className="h-56 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="stage" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#475569", fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Số ca can thiệp" radius={[6, 6, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-100">
            {funnelData.map((item) => (
              <div key={item.stage} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 block">{item.stage}</span>
                <span className="font-bold text-sm text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Interventions Management Table Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Danh Sách Phê Duyệt & Đo Lường Hiệu Quả Can Thiệp
            </h3>
            <p className="text-xs text-slate-500">
              Quản trị toàn diện chu trình can thiệp sư phạm từng học sinh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Tìm theo tên học sinh, lớp, loại can thiệp..."
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            {/* Step Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveInterventionTab("SUGGESTED")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeInterventionTab === "SUGGESTED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Đề xuất ({interventionsList.filter((i: any) => i.status === "SUGGESTED").length})
              </button>
              <button
                onClick={() => setActiveInterventionTab("APPROVED")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeInterventionTab === "APPROVED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Đã duyệt ({interventionsList.filter((i: any) => i.status === "APPROVED").length})
              </button>
              <button
                onClick={() => setActiveInterventionTab("APPLIED")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeInterventionTab === "APPLIED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                3. Đang triển khai ({interventionsList.filter((i: any) => i.status === "APPLIED").length})
              </button>
              <button
                onClick={() => setActiveInterventionTab("OUTCOME_TRACKED")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  activeInterventionTab === "OUTCOME_TRACKED"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                4. Đã đo lường ({interventionsList.filter((i: any) => i.status === "OUTCOME_TRACKED").length})
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Học sinh</th>
                <th className="px-4 py-3.5">Lớp</th>
                <th className="px-4 py-3.5">Loại can thiệp</th>
                <th className="px-4 py-3.5">Nguồn kích hoạt</th>
                <th className="px-4 py-3.5">Ghi chú / Đề xuất</th>
                <th className="px-4 py-3.5">Tiến trình</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInterventions.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">
                      {item.student?.user?.name || "Học sinh"}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {item.student?.studentCode || "HS-CODE"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {item.student?.classRoom?.name || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    {item.interventionType}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.triggeredBy}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs truncate text-xs text-slate-600">
                    {item.note || "Không có ghi chú"}
                  </td>
                  <td className="px-4 py-3.5">
                    {item.status === "SUGGESTED" && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Chờ duyệt
                      </span>
                    )}
                    {item.status === "APPROVED" && (
                      <span className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Đã duyệt ({item.approvedByName || "BGH"})
                      </span>
                    )}
                    {item.status === "APPLIED" && (
                      <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                        <Activity className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        Đang can thiệp ({item.appliedByName || "Giáo viên"})
                      </span>
                    )}
                    {item.status === "OUTCOME_TRACKED" && (
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {item.outcomeScoreDelta > 0 ? `+${item.outcomeScoreDelta}` : item.outcomeScoreDelta}đ
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                          {item.outcomeNote || "Đã cải thiện"}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {item.status === "SUGGESTED" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedIntervention(item);
                            setActionType("APPROVE");
                          }}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold transition"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIntervention(item);
                            setActionType("REJECT");
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {item.status === "APPROVED" && (
                      <button
                        onClick={() => {
                          setSelectedIntervention(item);
                          setActionType("APPLY");
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition"
                      >
                        Bắt Đầu Áp Dụng
                      </button>
                    )}
                    {item.status === "APPLIED" && (
                      <button
                        onClick={() => {
                          setSelectedIntervention(item);
                          setActionType("OUTCOME");
                        }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition"
                      >
                        Ghi Nhận Kết Quả
                      </button>
                    )}
                    {item.status === "OUTCOME_TRACKED" && (
                      <span className="text-xs text-slate-400 italic">Hoàn tất</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredInterventions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Không có ca can thiệp nào trong trạng thái này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Action Modal */}
      {selectedIntervention && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {actionType === "APPROVE" && "Phê Duyệt Can Thiệp Sư Phạm"}
                {actionType === "REJECT" && "Từ Chối Đề Xuất Can Thiệp"}
                {actionType === "APPLY" && "Bắt Đầu Triển Khai Can Thiệp"}
                {actionType === "OUTCOME" && "Ghi Nhận Kết Quả & Đo Lường Delta Điểm"}
              </h3>
              <button
                onClick={() => {
                  setSelectedIntervention(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Học sinh:</strong> {selectedIntervention.student?.user?.name} (
                {selectedIntervention.student?.classRoom?.name})
              </p>
              <p>
                <strong>Loại can thiệp:</strong> {selectedIntervention.interventionType}
              </p>
            </div>

            {/* Form Fields according to action */}
            {actionType === "OUTCOME" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Thay đổi điểm số (Score Delta Δ):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={scoreDelta}
                    onChange={(e) => setScoreDelta(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                  <span className="text-xs text-slate-500">
                    (Ví dụ: +1.5 điểm hoặc -0.5 điểm)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {actionType === "REJECT" ? "Lý do từ chối:" : "Ghi chú / Đánh giá:"}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "APPROVE"
                    ? "Chỉ đạo từ Ban Giám Hiệu cho giáo viên phụ trách..."
                    : actionType === "REJECT"
                    ? "Nhập lý do không thông qua đề xuất..."
                    : actionType === "APPLY"
                    ? "Kế hoạch bắt đầu phụ đạo / tư vấn tâm lý..."
                    : "Nhận xét về sự tiến bộ của học sinh sau đợt can thiệp..."
                }
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedIntervention(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isSubmittingAction}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition ${
                  actionType === "REJECT"
                    ? "bg-rose-700 hover:bg-rose-600"
                    : actionType === "APPLY"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : actionType === "OUTCOME"
                    ? "bg-emerald-700 hover:bg-emerald-600"
                    : "bg-blue-700 hover:bg-blue-600"
                }`}
              >
                {isSubmittingAction ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
