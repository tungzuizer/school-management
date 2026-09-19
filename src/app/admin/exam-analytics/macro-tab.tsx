/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `src/app/admin/exam-analytics/page.tsx`.
 * 2. Affected Component: `MacroTab` - Tab 1 trong hệ thống phân tích tích hợp.
 * 3. Schemas: `ExamAnalyticsOverviewData`.
 * 4. Verbatim User Instruction: "gộp lại đi" - Hợp nhất toàn bộ phân tích điểm thi và hành trình OLS vào `/admin/exam-analytics`.
 */

"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ExamAnalyticsOverviewData } from "./actions";

interface MacroTabProps {
  overviewData: ExamAnalyticsOverviewData;
}

const PIE_COLORS = ["#059669", "#2563EB", "#64748B", "#DC2626"];

export default function MacroTab({ overviewData }: MacroTabProps) {
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

  return (
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
            {overviewData.aiInsights.map((insight, idx) => (
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
              {overviewData.availableYears.join(" • ")}
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
                {overviewData.availableYears.map((year, idx) => (
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
                {overviewData.totalStudents}
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
                {overviewData.tt22Classification.goodPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                Khá (6.5 - 7.9)
              </span>
              <span className="font-semibold text-slate-900">
                {overviewData.tt22Classification.fairPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500"></span>
                Đạt (5.0 - 6.4)
              </span>
              <span className="font-semibold text-slate-900">
                {overviewData.tt22Classification.passPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span>
                Chưa đạt (&lt; 5.0)
              </span>
              <span className="font-semibold text-rose-700">
                {overviewData.tt22Classification.failPercent}%
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
                {overviewData.availableYears.map((year) => (
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
              {overviewData.subjectTrends.map((st) => (
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
          {overviewData.campusComparison.map((camp) => (
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
  );
}
