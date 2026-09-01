"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RefreshCw,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Search,
  Sparkles,
  UserCheck,
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
  runBatchJourneyCalculation,
  handleApproveIntervention,
  handleRejectIntervention,
  handleApplyIntervention,
  handleTrackOutcome,
  fetchJourneyOverviewData,
} from "./actions";

interface OverviewClientProps {
  initialData: any;
  schools: Array<{
    id: string;
    name: string;
    campuses: Array<{ id: string; name: string }>;
  }>;
  currentSchoolId?: string;
  currentCampusId?: string;
}

const COLORS = {
  IMPROVING: "#10b981", // Emerald 500
  STABLE: "#3b82f6", // Blue 500
  DECLINING: "#ef4444", // Rose 500
  VOLATILE: "#f59e0b", // Amber 500
  INSUFFICIENT: "#94a3b8", // Slate 400
};

export default function JourneyOverviewClient({
  initialData,
  schools,
  currentSchoolId,
  currentCampusId,
}: OverviewClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedSchool, setSelectedSchool] = useState(currentSchoolId || schools[0]?.id || "");
  const [selectedCampus, setSelectedCampus] = useState(currentCampusId || "");
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeInterventionTab, setActiveInterventionTab] = useState<
    "SUGGESTED" | "APPROVED" | "APPLIED" | "OUTCOME_TRACKED"
  >("SUGGESTED");

  // Modals state
  const [selectedIntervention, setSelectedIntervention] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "APPLY" | "OUTCOME" | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [scoreDelta, setScoreDelta] = useState<number>(0.5);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const activeCampuses =
    schools.find((s) => s.id === selectedSchool)?.campuses || [];

  const handleFilterChange = async (schoolId: string, campusId?: string) => {
    setSelectedSchool(schoolId);
    setSelectedCampus(campusId || "");
    const res = await fetchJourneyOverviewData(schoolId, campusId);
    if (res) setData(res);
  };

  const handleRecalculate = async () => {
    if (!selectedSchool) return;
    setIsCalculating(true);
    try {
      const res = await runBatchJourneyCalculation(
        selectedSchool,
        selectedCampus || undefined
      );
      if (res.success) {
        const updatedData = await fetchJourneyOverviewData(
          selectedSchool,
          selectedCampus || undefined
        );
        if (updatedData) setData(updatedData);
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
        await handleApproveIntervention(selectedIntervention.id, actionNote);
      } else if (actionType === "REJECT") {
        await handleRejectIntervention(selectedIntervention.id, actionNote);
      } else if (actionType === "APPLY") {
        await handleApplyIntervention(selectedIntervention.id, actionNote);
      } else if (actionType === "OUTCOME") {
        await handleTrackOutcome(selectedIntervention.id, scoreDelta, actionNote);
      }

      // Refresh overview data
      const updatedData = await fetchJourneyOverviewData(
        selectedSchool,
        selectedCampus || undefined
      );
      if (updatedData) setData(updatedData);

      setSelectedIntervention(null);
      setActionType(null);
      setActionNote("");
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
  const filteredInterventions = interventionsList.filter(
    (item: any) => item.status === activeInterventionTab
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/40 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Trí tuệ Nhân tạo & Phân tích Dọc (Longitudinal AI)
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hành Trình Học Sinh & Radar Can Thiệp
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Mô hình hồi quy tuyến tính học lực đa kỳ (OLS Regression) và quản trị can thiệp 4 bước.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/journey-config"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            Cấu hình Ngưỡng
          </Link>
          <Link
            href="/admin/journey-import"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Chuẩn hóa & Import Điểm
          </Link>
          <button
            onClick={handleRecalculate}
            disabled={isCalculating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isCalculating ? "animate-spin" : ""}`} />
            {isCalculating ? "Đang tính OLS..." : "Tính Lại Toàn Trường"}
          </button>
        </div>
      </div>

      {/* Scope Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-xl">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Phạm vi xem:
        </span>
        <select
          value={selectedSchool}
          onChange={(e) => handleFilterChange(e.target.value, "")}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {activeCampuses.length > 0 && (
          <select
            value={selectedCampus}
            onChange={(e) => handleFilterChange(selectedSchool, e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả Cơ sở / Phân hiệu</option>
            {activeCampuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-emerald-500/20 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Tăng Trưởng (Improving)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{summary.improving}</div>
          <div className="text-xs text-slate-400 mt-1">
            Độ dốc m &gt; +0.25đ / kỳ và độ biến động thấp
          </div>
        </div>

        <div className="bg-slate-900/80 border border-blue-500/20 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Ổn Định (Stable)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Minus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{summary.stable}</div>
          <div className="text-xs text-slate-400 mt-1">
            Duy trì phong độ đều đặn qua các học kỳ
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Sa Sút (Declining)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{summary.declining}</div>
          <div className="text-xs text-slate-400 mt-1">
            Độ dốc m &lt; -0.25đ / kỳ (Cần hỗ trợ sớm)
          </div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Bất Ổn (Volatile)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{summary.volatile}</div>
          <div className="text-xs text-slate-400 mt-1">
            Độ biến động residuals &gt; 1.2 (Phong độ thất thường)
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              Phân Bố Xu Hướng Học Lực
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dựa trên mô hình hồi quy tuyến tính OLS toàn bộ học sinh
            </p>
          </div>

          <div className="h-64 my-4 flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">Chưa có dữ liệu phân tích</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Tăng: {summary.improving}
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Ổn định: {summary.stable}
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Sa sút: {summary.declining}
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Bất ổn: {summary.volatile}
            </div>
          </div>
        </div>

        {/* Intervention Funnel Bar */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Phễu Quản Trị Vòng Đời Can Thiệp
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tiến độ giải quyết các trường hợp sa sút & bất thường do AI và GV phát hiện
            </p>
          </div>

          <div className="h-64 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Đề Xuất (Suggested)",
                    count: data?.interventions?.suggested || 0,
                    fill: "#f59e0b",
                  },
                  {
                    name: "Đã Duyệt (Approved)",
                    count: data?.interventions?.approved || 0,
                    fill: "#3b82f6",
                  },
                  {
                    name: "Triển Khai (Applied)",
                    count: data?.interventions?.applied || 0,
                    fill: "#8b5cf6",
                  },
                  {
                    name: "Đã Đo Kết Quả (Outcome)",
                    count: data?.interventions?.outcomeTracked || 0,
                    fill: "#10b981",
                  },
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {[
                    { fill: "#f59e0b" },
                    { fill: "#3b82f6" },
                    { fill: "#8b5cf6" },
                    { fill: "#10b981" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
            <span>
              Tổng số ca can thiệp:{" "}
              <strong className="text-white">{data?.interventions?.total || 0}</strong>
            </span>
            <span className="text-amber-400 font-medium">
              Cần BGH duyệt: {data?.interventions?.suggested || 0}
            </span>
          </div>
        </div>
      </div>

      {/* High-Risk Students Watchlist */}
      <div className="bg-slate-900/90 border border-rose-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Danh Sách Học Sinh Cần Can Thiệp Khẩn Cấp
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Top học sinh có độ dốc suy giảm mạnh nhất (Slope &lt; 0) hoặc độ biến động học lực bất thường
            </p>
          </div>
          <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
            {data?.highRiskStudents?.length || 0} trường hợp ưu tiên
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Học Sinh</th>
                <th className="px-4 py-4">Lớp</th>
                <th className="px-4 py-4">Phân Loại Xu Hướng</th>
                <th className="px-4 py-4">Độ Dốc (Slope)</th>
                <th className="px-4 py-4">Độ Biến Động</th>
                <th className="px-4 py-4">Thay Đổi Điểm</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data?.highRiskStudents && data.highRiskStudents.length > 0 ? (
                data.highRiskStudents.map((st: any) => (
                  <tr key={st.studentId} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{st.studentName}</div>
                      <div className="text-xs text-slate-400">
                        {st.studentCode ? `MHS: ${st.studentCode}` : `Kỳ: ${st.periodName}`}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-300">{st.className}</td>
                    <td className="px-4 py-4">
                      {st.trendLabel === "DECLINING" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <TrendingDown className="w-3.5 h-3.5" /> Sa Sút
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Activity className="w-3.5 h-3.5" /> Bất Ổn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-rose-400">
                      {st.trendSlope > 0 ? `+${st.trendSlope}` : st.trendSlope}
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-300">
                      {st.volatilityScore}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`font-semibold ${
                          st.deltaFromBaseline < 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {st.deltaFromBaseline > 0
                          ? `+${st.deltaFromBaseline}`
                          : st.deltaFromBaseline}
                        đ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/teacher/students/${st.studentId}/journey`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-xs font-semibold transition"
                      >
                        Xem Biểu Đồ
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Không có học sinh nào trong diện cảnh báo khẩn cấp tại cơ sở này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intervention Management Center */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Trung Tâm Quản Trị Vòng Đời Can Thiệp
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Quy trình 4 bước bắt buộc đảm bảo mọi cảnh báo đều được con người thẩm định và theo dõi kết quả
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveInterventionTab("SUGGESTED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeInterventionTab === "SUGGESTED"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cần Duyệt (Suggested)
            </button>
            <button
              onClick={() => setActiveInterventionTab("APPROVED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeInterventionTab === "APPROVED"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đã Duyệt (Approved)
            </button>
            <button
              onClick={() => setActiveInterventionTab("APPLIED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeInterventionTab === "APPLIED"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đang Áp Dụng (Applied)
            </button>
            <button
              onClick={() => setActiveInterventionTab("OUTCOME_TRACKED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeInterventionTab === "OUTCOME_TRACKED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Đã Đánh Giá (Outcome)
            </button>
          </div>
        </div>

        {/* Interventions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Học Sinh</th>
                <th className="px-4 py-4">Biện Pháp Can Thiệp</th>
                <th className="px-4 py-4">Nguồn Kích Hoạt</th>
                <th className="px-4 py-4">Ghi Chú / Phân Tích</th>
                <th className="px-4 py-4">Người Duyệt / Thực Hiện</th>
                <th className="px-6 py-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInterventions.length > 0 ? (
                filteredInterventions.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">
                        {item.student?.user?.name || "Học sinh"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.student?.classRoom?.name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-200">
                        {item.interventionType}
                      </div>
                      <div className="text-xs text-slate-500">
                        Xu hướng lúc tạo: {item.trendLabelAtTrigger}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                        {item.triggeredBy}
                      </span>
                    </td>
                    <td className="px-4 py-4 max-w-xs truncate text-xs text-slate-400">
                      {item.note || "—"}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {item.approvedByName && (
                        <div>
                          Duyệt: <strong className="text-slate-200">{item.approvedByName}</strong>
                        </div>
                      )}
                      {item.appliedByName && (
                        <div>
                          Triển khai: <strong className="text-slate-200">{item.appliedByName}</strong>
                        </div>
                      )}
                      {item.outcomeScoreDelta !== null && (
                        <div className="text-emerald-400 font-semibold">
                          Kết quả: {item.outcomeScoreDelta > 0 ? `+${item.outcomeScoreDelta}` : item.outcomeScoreDelta}đ
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {activeInterventionTab === "SUGGESTED" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedIntervention(item);
                              setActionType("APPROVE");
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIntervention(item);
                              setActionType("REJECT");
                            }}
                            className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-xs font-semibold transition"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}

                      {activeInterventionTab === "APPROVED" && (
                        <button
                          onClick={() => {
                            setSelectedIntervention(item);
                            setActionType("APPLY");
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Bắt đầu Triển khai
                        </button>
                      )}

                      {activeInterventionTab === "APPLIED" && (
                        <button
                          onClick={() => {
                            setSelectedIntervention(item);
                            setActionType("OUTCOME");
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Ghi Nhận Kết Quả
                        </button>
                      )}

                      {activeInterventionTab === "OUTCOME_TRACKED" && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Không có bản ghi can thiệp nào ở trạng thái này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal (Approve / Reject / Apply / Outcome) */}
      {selectedIntervention && actionType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                {actionType === "APPROVE" && (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Phê Duyệt Kế Hoạch Can Thiệp
                  </>
                )}
                {actionType === "REJECT" && (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500" />
                    Từ Chối Đề Xuất Can Thiệp
                  </>
                )}
                {actionType === "APPLY" && (
                  <>
                    <Play className="w-5 h-5 text-indigo-400" />
                    Bắt Đầu Triển Khai Can Thiệp
                  </>
                )}
                {actionType === "OUTCOME" && (
                  <>
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Ghi Nhận Đánh Giá Kết Quả Can Thiệp
                  </>
                )}
              </h4>
              <button
                onClick={() => {
                  setSelectedIntervention(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-sm text-slate-300 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                Học sinh:{" "}
                <strong className="text-white">
                  {selectedIntervention.student?.user?.name || "Học sinh"} (
                  {selectedIntervention.student?.classRoom?.name || "Lớp"})
                </strong>
              </div>
              <div>
                Biện pháp:{" "}
                <span className="text-indigo-300">
                  {selectedIntervention.interventionType}
                </span>
              </div>
              {selectedIntervention.note && (
                <div className="text-xs text-slate-400">
                  Lý do/Phát hiện: {selectedIntervention.note}
                </div>
              )}
            </div>

            {actionType === "OUTCOME" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase">
                  Thay đổi điểm số sau can thiệp (Score Delta)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={scoreDelta}
                    onChange={(e) => setScoreDelta(parseFloat(e.target.value) || 0)}
                    className="w-32 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400">
                    (Ví dụ: +0.75 hoặc -0.5)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                {actionType === "REJECT" ? "Lý do từ chối *" : "Ghi chú & Chỉ đạo"}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "REJECT"
                    ? "Nhập lý do cụ thể..."
                    : "Giao nhiệm vụ cho GVCN / phân công phụ đạo..."
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedIntervention(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
              >
                Hủy
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isSubmittingAction || (actionType === "REJECT" && !actionNote.trim())}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${
                  actionType === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : actionType === "APPROVE" || actionType === "OUTCOME"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {isSubmittingAction ? "Đang xử lý..." : "Xác Nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
