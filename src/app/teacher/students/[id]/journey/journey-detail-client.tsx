"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Minus,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Plus,
  BookOpen,
  Target,
  FileText,
  User,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { handleCreateStudentIntervention } from "./actions";

interface JourneyDetailClientProps {
  initialData: {
    student: any;
    journeyResult: any;
    trendlinePoints: any[];
    interventions: any[];
    subjects: Array<{ id: string; name: string }>;
  };
}

export default function StudentJourneyDetailClient({
  initialData,
}: JourneyDetailClientProps) {
  const [data, setData] = useState(initialData);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Intervention Modal
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [category, setCategory] = useState<string>("Phụ đạo học tập (Academic Tutoring)");
  const [actionPlan, setActionPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { student, journeyResult, trendlinePoints, interventions, subjects } = data;
  const regression = journeyResult.metrics;

  const handleProposeIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPlan.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await handleCreateStudentIntervention({
        studentId: student.id,
        subjectId: selectedSubjectId || undefined,
        category,
        actionPlan,
      });

      if (res.success && res.intervention) {
        setData((prev) => ({
          ...prev,
          interventions: [res.intervention, ...prev.interventions],
        }));
        setIsInterventionModalOpen(false);
        setActionPlan("");
      } else {
        alert(res.error || "Không thể đề xuất can thiệp.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTrendBadge = (label: string) => {
    switch (label) {
      case "IMPROVING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <TrendingUp className="w-4 h-4" /> TĂNG TRƯỞNG (IMPROVING)
          </span>
        );
      case "DECLINING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <TrendingDown className="w-4 h-4" /> SA SÚT (DECLINING)
          </span>
        );
      case "VOLATILE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Activity className="w-4 h-4" /> BIẾN ĐỘNG (VOLATILE)
          </span>
        );
      case "STABLE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Minus className="w-4 h-4" /> DUY TRÌ ỔN ĐỊNH (STABLE)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            CHƯA ĐỦ DỮ LIỆU (&lt; 3 KỲ)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách học sinh
        </Link>

        <button
          onClick={() => setIsInterventionModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Đề Xuất Can Thiệp Sư Phạm
        </button>
      </div>

      {/* Student Profile & AI Radar Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-extrabold text-2xl shrink-0">
              {student.user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                  {student.user.name}
                </h1>
                {getTrendBadge(regression?.trendLabel || "INSUFFICIENT_DATA")}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                <span>Mã HS: <strong className="text-slate-200">{student.studentCode || "—"}</strong></span>
                <span>•</span>
                <span>Lớp: <strong className="text-slate-200">{student.classRoom.name}</strong></span>
                <span>•</span>
                <span>Trường: <strong className="text-slate-200">{student.classRoom.school.name}</strong></span>
              </div>
            </div>
          </div>

          {/* AI Early Warning Banner */}
          {(regression?.trendLabel === "DECLINING" || regression?.trendLabel === "VOLATILE") && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-300 text-xs max-w-md">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <strong>Cảnh báo AI Radar:</strong> Học sinh có dấu hiệu{" "}
                {regression?.trendLabel === "DECLINING"
                  ? "sa sút liên tục qua các kỳ thi"
                  : "điểm số biến động mạnh, thiếu ổn định"}
                . Hệ thống khuyến nghị giáo viên chủ nhiệm và bộ môn phối hợp hỗ trợ.
              </div>
            </div>
          )}
        </div>

        {/* 4 Math Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Hệ số góc hồi quy (Slope)</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {regression?.slope !== null ? `${regression.slope > 0 ? "+" : ""}${regression.slope.toFixed(2)} đ/kỳ` : "—"}
            </div>
            <div className="text-[11px] text-slate-500">Mô hình OLS ($y = mx + c$)</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Độ biến động (Residual SD)</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {regression?.volatilityScore !== null && regression?.volatilityScore !== undefined ? `±${regression.volatilityScore.toFixed(2)} đ` : "—"}
            </div>
            <div className="text-[11px] text-slate-500">Độ lệch chuẩn phần dư</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Độ lệch Baseline (Kỳ đầu)</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                (regression?.deltaFromBaseline || 0) >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {regression?.deltaFromBaseline !== null && regression?.deltaFromBaseline !== undefined
                ? `${regression.deltaFromBaseline > 0 ? "+" : ""}${regression.deltaFromBaseline.toFixed(2)} đ`
                : "—"}
            </div>
            <div className="text-[11px] text-slate-500">So với kỳ thi thứ nhất</div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Dữ liệu kỳ thi ghi nhận</span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-400">
              {journeyResult.dataPoints?.length || 0} kỳ
            </div>
            <div className="text-[11px] text-slate-500">
              Độ tin cậy: {regression?.isInsufficientData ? "INSUFFICIENT_DATA" : "RELIABLE"}
            </div>
          </div>
        </div>
      </div>

      {/* Regression Line Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Biểu Đồ Hồi Quy Tuyến Tính & Điểm Số Thực Tế
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Đường màu xanh thể hiện điểm thực tế qua các kỳ; đường đứt nét biểu diễn xu hướng hồi quy toán học ($y = {regression?.slope ? regression.slope.toFixed(2) : "m"}x + {regression?.intercept ? regression.intercept.toFixed(2) : "c"}$).
            </p>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Môn học:</span>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tất cả các môn (Tổng hợp)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {trendlinePoints.length > 0 ? (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendlinePoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="periodName"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                    color: "#f8fafc",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualScore"
                  name="Điểm thực tế"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: "#6366f1", r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="linear"
                  dataKey="predictedScore"
                  name="Đường hồi quy (Trendline OLS)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-sm">
            Chưa có đủ điểm số (&lt; 3 kỳ thi) để dựng đường hồi quy tuyến tính.
          </div>
        )}
      </div>

      {/* Interventions History */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Lịch Sử Can Thiệp & Tiến Trình Sư Phạm
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Quy trình 4 bước: Đề xuất (SUGGESTED) → Phê duyệt (APPROVED) → Triển khai (APPLIED) → Đánh giá kết quả (OUTCOME_TRACKED).
            </p>
          </div>
        </div>

        {interventions.length > 0 ? (
          <div className="space-y-4">
            {interventions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.interventionType}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                      item.status === "OUTCOME_TRACKED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : item.status === "APPLIED"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : item.status === "APPROVED"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : item.status === "REJECTED"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-sm text-slate-200">{item.note || "Không có ghi chú kế hoạch chi tiết."}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-2 border-t border-slate-800/60">
                  <span>
                    Nguồn kích hoạt: <strong className="text-slate-300">{item.triggeredBy}</strong>
                  </span>
                  {item.approvedByName && (
                    <>
                      <span>•</span>
                      <span>
                        Duyệt bởi: <strong className="text-slate-300">{item.approvedByName}</strong>
                      </span>
                    </>
                  )}
                  {item.appliedByName && (
                    <>
                      <span>•</span>
                      <span>
                        Thực hiện: <strong className="text-slate-300">{item.appliedByName}</strong>
                      </span>
                    </>
                  )}
                  {item.outcomeScoreDelta !== null && item.outcomeScoreDelta !== undefined && (
                    <>
                      <span>•</span>
                      <span>
                        Kết quả thực tế:{" "}
                        <strong
                          className={
                            item.outcomeScoreDelta >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }
                        >
                          {item.outcomeScoreDelta > 0 ? "+" : ""}
                          {item.outcomeScoreDelta.toFixed(2)} điểm
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            Chưa có đợt can thiệp nào cho học sinh này.
          </div>
        )}
      </div>

      {/* PROPOSE INTERVENTION MODAL */}
      {isInterventionModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Đề Xuất Can Thiệp Sư Phạm
              </h4>
              <button
                onClick={() => setIsInterventionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeIntervention} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nhóm Can Thiệp *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACADEMIC_TUTORING">Phụ đạo học tập (Academic Tutoring)</option>
                  <option value="BEHAVIORAL_COACHING">Rèn luyện nề nếp (Behavioral Coaching)</option>
                  <option value="PARENT_ENGAGEMENT">Tương tác phụ huynh (Parent Engagement)</option>
                  <option value="PSYCHOLOGICAL_COUNSELING">Tư vấn tâm lý học đường (Counseling)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Kế Hoạch Hành Động Cụ Thể *
                </label>
                <textarea
                  rows={4}
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="Kèm cặp 2 buổi/tuần môn Toán, kiểm tra bài tập về nhà mỗi sáng, mục tiêu nâng điểm lên >= 7.5..."
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInterventionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !actionPlan.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi Đề Xuất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
