"use client";

import { useState, useEffect } from "react";
import {
  getFinancialExpenditureData,
  CampusFinancialSummary,
} from "./actions";
import {
  Landmark,
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  DollarSign,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Building,
  Download,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Lightbulb,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function FinancialExpenditurePage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [data, setData] = useState<{
    year: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    overallDisbursementRate: number;
    campusData: CampusFinancialSummary[];
    categoryBreakdown: { category: string; budget: number; spent: number; rate: number }[];
    monthlyTrends: any[];
    aiRecommendations: { type: string; title: string; content: string }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "categories" | "ai">("overview");
  const [expandedCampus, setExpandedCampus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getFinancialExpenditureData(selectedYear, selectedCampus);
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedCampus]);

  const formatVND = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)} Tỷ VNĐ`;
    }
    return `${(amount / 1_000_000).toFixed(0)} Triệu VNĐ`;
  };

  const COLORS = ["#1a237e", "#0284c7", "#10b981", "#f59e0b", "#6366f1"];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Filters */}
      <div className="bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab] text-white p-6 md:p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md">
              <Landmark className="w-3.5 h-3.5" />
              <span>Phân Hệ II: Quản Trị Tài Chính & Đối Sánh Cơ Sở</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Chi Tiêu Tài Chính Đa Phân Hiệu
            </h1>
            <p className="text-sm text-blue-100 max-w-3xl">
              Giám sát ngân sách toàn trường, phân bổ kinh phí và đối sánh tốc độ giải ngân thực tế giữa các phân hiệu THCS Tân Xã, Hạ Bằng, FPT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Year */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20">
              <span className="text-xs text-blue-200 font-medium">Năm ngân sách:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer [&>option]:text-gray-900"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Filter Campus */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20">
              <Filter className="w-4 h-4 text-blue-200" />
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer [&>option]:text-gray-900"
              >
                <option value="ALL">Tất cả Phân hiệu</option>
                {data?.campusData.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#1a237e] border-t-transparent"></div>
          <p className="text-slate-500 font-medium text-sm">Đang tổng hợp dữ liệu chi tiêu tài chính...</p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Ngân Sách Cấp</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">
                    {formatVND(data.totalAllocated)}
                  </h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Được phê duyệt năm {data.year}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-[#1a237e] rounded-xl">
                  <Landmark className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Đã Giải Ngân Thật</p>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 mt-1">
                    {formatVND(data.totalSpent)}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Đạt {data.overallDisbursementRate}% kế hoạch
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kinh Phí Còn Lại</p>
                  <h3 className="text-xl md:text-2xl font-black text-[#1a237e] mt-1">
                    {formatVND(data.totalRemaining)}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Dự phòng hoạt động Q3 - Q4
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tỷ Lệ Giải Ngân Chung</p>
                  <h3 className="text-xl md:text-2xl font-black text-amber-600 mt-1">
                    {data.overallDisbursementRate}%
                  </h3>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(data.overallDisbursementRate, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <BarChart2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* AI Financial Recommendation Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                    Trợ lý AI Hiệu Trưởng
                  </span>
                  <h4 className="text-base font-bold text-slate-800">
                    Phân Tích Chi Tiêu & Đề Xuất Điều Chuyển Hạn Mức Ngân Sách
                  </h4>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Phân hiệu Hạ Bằng đã giải ngân <strong className="text-amber-800">88%</strong> (tiệm cận hạn mức năm), trong khi Phân hiệu FPT còn dư <strong className="text-blue-800">1.54 Tỷ VNĐ (72%)</strong> ở mảng Thiết bị CNTT.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button className="text-xs font-bold text-white bg-[#1a237e] hover:bg-blue-900 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Xem Chi Tiết Đề Xuất Điều Chuyển (300 Tr)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart: Cross Campus Budget vs Spent */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-[#1a237e]" />
                    Đối Sánh Ngân Sách Cấp vs Giải Ngân Theo Phân Hiệu
                  </h3>
                  <p className="text-xs text-slate-500">So sánh tổng kinh phí và số chi thực tế (VNĐ)</p>
                </div>
              </div>

              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.campusData.map((c) => ({
                      name: c.code,
                      fullName: c.name,
                      "Ngân sách cấp": c.allocatedBudget / 1_000_000,
                      "Đã giải ngân": c.spentBudget / 1_000_000,
                    }))}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit=" Tr" />
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toLocaleString()} Triệu VNĐ`]}
                      contentStyle={{ backgroundColor: "#1e293b", borderRadius: "12px", color: "#fff", border: "none" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="Ngân sách cấp" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Đã giải ngân" fill="#1a237e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PieIcon className="w-5 h-5 text-indigo-600" />
                  Cơ Cấu Chi Tiêu Theo Hạng Mục
                </h3>
                <p className="text-xs text-slate-500">Tỷ trọng các nhóm chi phí toàn trường</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      dataKey="spent"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${(Number(value) / 1_000_000).toLocaleString()} Triệu VNĐ`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                {data.categoryBreakdown.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-slate-700 font-medium truncate max-w-[170px]">{cat.category}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatVND(cat.spent)} ({cat.rate}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Campus Expenditure Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Bảng Chi Tiết Chi Tiêu & Cảnh Báo Chênh Lệch Các Phân Hiệu
                </h3>
                <p className="text-xs text-slate-500">
                  Thống kê kinh phí được duyệt, thực chi và tiến độ giải ngân từng phân hiệu
                </p>
              </div>

              <button className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất Báo Cáo Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">Phân Hiệu</th>
                    <th className="py-3 px-4 text-center">Số Học Sinh</th>
                    <th className="py-3 px-4 text-right">Ngân Sách Cấp</th>
                    <th className="py-3 px-4 text-right">Đã Giải Ngân</th>
                    <th className="py-3 px-4 text-right">Kinh Phí Còn Lại</th>
                    <th className="py-3 px-4 text-center">Tỷ Lệ %</th>
                    <th className="py-3 px-4">Tình Trạng & Cảnh Báo</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {data.campusData.map((campus) => {
                    const isExpanded = expandedCampus === campus.id;
                    return (
                      <tbody key={campus.id} className="group">
                        <tr className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-4 font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-100 text-[#1a237e] font-extrabold text-xs flex items-center justify-center">
                              {campus.code}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{campus.name}</p>
                              <p className="text-[11px] text-slate-400 font-normal">Mã cơ sở: {campus.id}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-medium text-slate-700">
                            {campus.studentCount} HS
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-slate-800">
                            {formatVND(campus.allocatedBudget)}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-emerald-700">
                            {formatVND(campus.spentBudget)}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-indigo-600">
                            {formatVND(campus.remainingBudget)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                campus.disbursementRate >= 85
                                  ? "bg-amber-100 text-amber-800"
                                  : campus.disbursementRate <= 75
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {campus.disbursementRate}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-600">
                            {campus.varianceAlert || "Tiến độ bình thường"}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => setExpandedCampus(isExpanded ? null : campus.id)}
                              className="text-xs font-semibold text-[#1a237e] hover:underline"
                            >
                              {isExpanded ? "Thu gọn" : "Xem Hạng Mục"}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Category Breakdown */}
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Phân Bổ Hạng Mục Chi Tiêu - {campus.name}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                  {campus.categories.map((c) => {
                                    const catRate = c.budget > 0 ? ((c.spent / c.budget) * 100).toFixed(0) : 0;
                                    return (
                                      <div key={c.category} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                                        <p className="text-xs font-semibold text-slate-700 truncate">{c.category}</p>
                                        <p className="text-xs text-slate-500">
                                          Chi: <strong className="text-slate-800">{formatVND(c.spent)}</strong> / {formatVND(c.budget)}
                                        </p>
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                                          <div
                                            className="bg-[#1a237e] h-1.5 rounded-full"
                                            style={{ width: `${Math.min(Number(catRate), 100)}%` }}
                                          />
                                        </div>
                                        <p className="text-[10px] text-right font-medium text-slate-400">{catRate}%</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Financial Recommendations Detailed Cards */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Khuyến Nghị Điều Trị & Tối Ưu Chi Phí Từ AI
                </h3>
                <p className="text-xs text-slate-500">
                  Phân tích tự động từ dữ liệu tài chính liên trường
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.aiRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {rec.type === "WARNING" && (
                        <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      {rec.type === "OPTIMIZATION" && (
                        <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                          <SlidersHorizontal className="w-4 h-4" />
                        </span>
                      )}
                      {rec.type === "COST_SAVING" && (
                        <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{rec.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rec.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60">
                    <button className="w-full text-center text-xs font-bold text-[#1a237e] hover:text-blue-900 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition">
                      Áp Dụng Chỉ Đạo Này
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

