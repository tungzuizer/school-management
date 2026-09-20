/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/page.tsx`.
 * 2. Affected Component: `StudentsTab` - Tab 3 trong hệ thống phân tích tích hợp.
 * 3. Schemas: `StudentProfileSummary`, `StudentTrajectoryDetailData`.
 * 4. Verbatim User Instruction: "gộp lại đi" - Hợp nhất toàn bộ phân tích điểm thi và hành trình OLS vào `/admin/exam-analytics`.
 */

"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  getStudentDetailTrajectoryAction,
  type StudentTrajectoryDetailData,
} from "./actions";
import { type StudentProfileSummary } from "@/lib/exam-analytics-engine";

interface StudentsTabProps {
  studentList: StudentProfileSummary[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (category: string) => void;
  onlyInterventionFilter: boolean;
  setOnlyInterventionFilter: (val: boolean) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export default function StudentsTab({
  studentList,
  searchQuery,
  setSearchQuery,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  onlyInterventionFilter,
  setOnlyInterventionFilter,
  onSearchSubmit,
}: StudentsTabProps) {
  const [selectedStudentDetail, setSelectedStudentDetail] =
    useState<StudentTrajectoryDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

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

  return (
    <div className="space-y-6">
      {/* Quick Filter Badges for Trajectories */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <form onSubmit={onSearchSubmit} className="flex-1 min-w-[280px] max-w-md">
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
                    <span className="text-xs text-slate-500 block">Khối {st.gradeLevel || 1}</span>
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
                      disabled={detailLoading}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                    >
                      Xem Radar & Chi Tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Trajectory Modal */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Hồ Sơ Quỹ Đạo Học Sinh • {selectedStudentDetail.summary.studentCode || "HS-CODE"}
                </span>
                <h3 className="text-xl font-bold">
                  {selectedStudentDetail.summary.studentName} — {selectedStudentDetail.summary.className || "Lớp"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* OLS Equation Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    Phương Trình Hồi Quy Tuyến Tính (OLS)
                  </span>
                  <div className="text-lg font-mono font-bold text-slate-900">
                    y = {selectedStudentDetail.summary.slope >= 0 ? "+" : ""}
                    {selectedStudentDetail.summary.slope.toFixed(2)}x +{" "}
                    {selectedStudentDetail.summary.overallAvgScore.toFixed(2)}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    Dự Báo Điểm Tốt Nghiệp / Kỳ Tới
                  </span>
                  <div className="text-xl font-bold text-emerald-700">
                    {selectedStudentDetail.summary.predictedGraduationScore.toFixed(1)} / 10.0
                  </div>
                </div>
              </div>

              {/* Charts Section: Line Timeline & Radar Competency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Line Chart for Exam Progression */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tiến Trình Điểm Thi Qua 10 Kỳ Khảo Sát
                  </h4>

                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={selectedStudentDetail.timeline}
                        margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="periodName" tick={{ fill: "#64748B", fontSize: 10 }} />
                        <YAxis domain={[0, 10]} tick={{ fill: "#64748B", fontSize: 10 }} />
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
                          dataKey="averageScore"
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
