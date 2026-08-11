"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target,
  Building2,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  Layers,
  Award,
  Bell,
  CheckSquare,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { getStrategyOverviewData, StrategyOverviewFilters } from "./actions";

export default function StrategyOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filters State
  const [filters, setFilters] = useState<StrategyOverviewFilters>({
    academicYear: "2026-2027",
    campusId: "ALL",
    status: "ALL",
    responsiblePerson: "ALL",
    timeRange: "ALL",
  });

  const [activeTab, setActiveTab] = useState<"pending" | "kpi" | "risk" | "missing">("pending");

  const loadData = async () => {
    setLoading(true);
    const res = await getStrategyOverviewData(filters);
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (key: keyof StrategyOverviewFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đã phê duyệt":
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã phê duyệt
          </span>
        );
      case "Chờ phê duyệt":
      case "SUBMITTED":
      case "CAMPUS_CHECKED":
      case "VP_REVIEWED":
      case "UNLOCK_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Chờ phê duyệt
          </span>
        );
      case "Đang thực hiện":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <TrendingUp className="w-3.5 h-3.5" /> Đang thực hiện
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Chưa bắt đầu
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Banner Giới Thiệu Quản Trị Chiến Lược */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Target className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-5xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-medium backdrop-blur-sm border border-blue-400/30">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Phân hệ I: Quản trị Chiến lược Nhà trường</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            TỔNG QUAN QUẢN TRỊ CHIẾN LƯỢC NHÀ TRƯỜNG
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed bg-black/20 p-4 rounded-xl backdrop-blur-md border border-white/10">
            Trong mô hình trường THCS có nhiều phân hiệu, Hiệu trưởng không trực tiếp làm thay các bộ phận mà điều hành nhà trường bằng mục tiêu, dữ liệu, tiến độ và kết quả. Quản trị chiến lược giúp bảo đảm các phân hiệu cùng hoạt động theo một định hướng và một hệ thống tiêu chuẩn thống nhất.
          </p>
        </div>
      </div>

      {/* Top Header Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Năm học</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-base font-bold text-slate-900">{data?.academicYear || "2026-2027"}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Trường học</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900 truncate">{data?.schoolName || "Chu Văn An"}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Phân hiệu</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-slate-900">{data?.topMetrics?.totalCampuses || 3}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Mục tiêu chiến lược</span>
          <div className="flex items-center gap-1.5 mt-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-lg font-bold text-slate-900">{data?.topMetrics?.totalStrategicGoals || 24}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Bộ chỉ số KPI</span>
          <div className="flex items-center gap-1.5 mt-2">
            <PieChart className="w-4 h-4 text-cyan-600" />
            <span className="text-lg font-bold text-slate-900">{data?.topMetrics?.totalKpis || 12}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Tỷ lệ hoàn thành</span>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-emerald-600">{data?.topMetrics?.planCompletionRate || 87.5}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Nhiệm vụ quá hạn</span>
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-lg font-bold text-rose-600">{data?.topMetrics?.overdueTasksCount || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Chờ Hiệu trưởng duyệt</span>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="text-lg font-bold text-amber-600">{data?.topMetrics?.pendingPrincipalApprovals || 0}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc chỉ số chiến lược</span>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Tải lại dữ liệu
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Năm học</label>
            <select
              value={filters.academicYear}
              onChange={(e) => handleFilterChange("academicYear", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="2026-2027">Năm học 2026 - 2027</option>
              <option value="2025-2026">Năm học 2025 - 2026</option>
              <option value="ALL">Tất cả năm học</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phân hiệu</label>
            <select
              value={filters.campusId}
              onChange={(e) => handleFilterChange("campusId", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả phân hiệu</option>
              {data?.campuses?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHUA_BAT_DAU">Chưa bắt đầu</option>
              <option value="DANG_THUC_HIEN">Đang thực hiện</option>
              <option value="CHO_PHE_DUYET">Chờ phê duyệt</option>
              <option value="DA_PHE_DUYET">Đã phê duyệt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Người phụ trách</label>
            <select
              value={filters.responsiblePerson}
              onChange={(e) => handleFilterChange("responsiblePerson", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả người phụ trách</option>
              <option value="Hiệu trưởng">Hiệu trưởng</option>
              <option value="Phó Hiệu trưởng">Phó Hiệu trưởng</option>
              <option value="Tổ trưởng Chuyên môn">Tổ trưởng Chuyên môn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Khoảng thời gian</label>
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange("timeRange", e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="MONTH">Tháng này</option>
              <option value="QUARTER">Quý này</option>
              <option value="SEMESTER_1">Học kỳ 1</option>
              <option value="SEMESTER_2">Học kỳ 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module Overall Progress Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-800">TIẾN ĐỘ THỰC HIỆN QUẢN TRỊ CHIẾN LƯỢC TOÀN TRƯỜNG</span>
          </div>
          <span className="text-sm font-extrabold text-blue-700">{data?.overallProgress || 88}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data?.overallProgress || 88}%` }}
          />
        </div>
      </div>

      {/* 6 Feature Cards Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>DANH MỤC TÍNH NĂNG QUẢN TRỊ CHIẾN LƯỢC (6 CHỨC NĂNG)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.featureCards?.map((card: any) => (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group border-l-4 border-l-blue-600"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  {getStatusBadge(card.status)}
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {card.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Tỷ lệ hoàn thành</span>
                    <span className="text-blue-700 font-bold">{card.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${card.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Uncompleted items count badge */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Hạng mục chưa hoàn thành:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      card.uncompletedCount > 0
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {card.uncompletedCount} hạng mục
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                <Link
                  href={card.href}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-sm"
                >
                  <span>Mở chức năng</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Công Việc Cần Xử Lý Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-800">CÔNG VIỆC CẦN XỬ LÝ (ACTION REQUIRED)</h2>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
            Cần phê duyệt & Cảnh báo khẩn
          </span>
        </div>

        {/* Action Required Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "pending"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Kế hoạch chờ phê duyệt ({data?.actionRequired?.pendingPlans?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("kpi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "kpi"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Chỉ số KPI chưa cập nhật ({data?.actionRequired?.kpiNotUpdatedList?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("risk")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "risk"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Chỉ tiêu có nguy cơ không đạt ({data?.actionRequired?.targetsAtRisk?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("missing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "missing"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Phân hiệu chưa gửi báo cáo ({data?.actionRequired?.missingReports?.filter((r: any) => r.isMissing).length || 0})
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="space-y-2 pt-2">
          {activeTab === "pending" && (
            <div className="space-y-2">
              {data?.actionRequired?.pendingPlans?.length > 0 ? (
                data.actionRequired.pendingPlans.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{item.campus}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Người gửi/Thẩm định: {item.reviewer} • Ngày gửi: {item.submittedDate}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
                    >
                      <span>Phê duyệt ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Không có kế hoạch nào đang chờ phê duyệt.</p>
              )}
            </div>
          )}

          {activeTab === "kpi" && (
            <div className="space-y-2">
              {data?.actionRequired?.kpiNotUpdatedList?.length > 0 ? (
                data.actionRequired.kpiNotUpdatedList.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 text-xs">{item.periodTitle}</span>
                      <p className="text-[11px] text-slate-500">Phân hiệu: {item.campus} • Năm: {item.year}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
                    >
                      <span>Cập nhật KPI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Tất cả kỳ KPI đều đã được cập nhật dữ liệu.</p>
              )}
            </div>
          )}

          {activeTab === "risk" && (
            <div className="space-y-2">
              {data?.actionRequired?.targetsAtRisk?.length > 0 ? (
                data.actionRequired.targetsAtRisk.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-900 text-xs">[{item.kpiCode}] {item.kpiName}</span>
                        <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-semibold">Tỷ lệ: {item.completionRate}%</span>
                      </div>
                      <p className="text-[11px] text-rose-700">Phụ trách: {item.responsiblePerson} • Thực tế: {item.actualValue} / Mục tiêu: {item.targetValue} {item.unit}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
                    >
                      <span>Khắc phục</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Không có chỉ tiêu nào ở mức cảnh báo rủi ro.</p>
              )}
            </div>
          )}

          {activeTab === "missing" && (
            <div className="space-y-2">
              {data?.actionRequired?.missingReports?.filter((r: any) => r.isMissing).length > 0 ? (
                data.actionRequired.missingReports
                  .filter((r: any) => r.isMissing)
                  .map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <span className="font-bold text-amber-900 text-xs">{item.campusName}</span>
                        <p className="text-[11px] text-amber-700">{item.lastReportDate}</p>
                      </div>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-semibold transition"
                      >
                        <span>Nhắc nhở phân hiệu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-slate-500 py-4 text-center">Tất cả phân hiệu đã hoàn thành gửi báo cáo đầy đủ.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
