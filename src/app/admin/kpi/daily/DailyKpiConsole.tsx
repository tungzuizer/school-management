"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/kpi/page.tsx (Tab 5)
 * 2. Public functions/components: DailyKpiConsole
 * 3. Data flows: getDailyKpiRealtime, saveDailyKpiEvaluation, getDailyKpiHistory, syncDailyToMonthlyKpi, getCampuses
 * 4. User design contract: Clean, minimal, monochrome slate with semantic traffic-light highlights for status and trends.
 */

import { useState, useEffect, useTransition } from "react";
import {
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Lock,
  TrendingUp,
  RefreshCw,
  Clock,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  getDailyKpiRealtime,
  saveDailyKpiEvaluation,
  getDailyKpiHistory,
  syncDailyToMonthlyKpi,
  DailyKpiEvaluationPayload,
  DailyKpiItemPayload,
} from "../daily-actions";
import { getCampuses } from "../actions";
import { CATEGORY_LABELS } from "../kpi-labels";
import { DailyKpiStatus } from "@prisma/client";

export default function DailyKpiConsole() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, startSaving] = useTransition();
  const [syncing, startSyncing] = useTransition();

  const [evaluation, setEvaluation] = useState<DailyKpiEvaluationPayload | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [items, setItems] = useState<DailyKpiItemPayload[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>("");

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Load campuses list
  useEffect(() => {
    async function loadCampuses() {
      const res = await getCampuses();
      if (res.success && res.data) {
        setCampuses(res.data);
      }
    }
    loadCampuses();
  }, []);

  // Fetch daily KPI evaluation & 7-day history
  const fetchData = async () => {
    setLoading(true);
    setNotification(null);

    try {
      const [evalRes, histRes] = await Promise.all([
        getDailyKpiRealtime(selectedDate, selectedCampus),
        getDailyKpiHistory(selectedCampus, 7),
      ]);

      if (evalRes.success && evalRes.data) {
        setEvaluation(evalRes.data);
        setItems(evalRes.data.items);
        setGeneralNotes(evalRes.data.notes || "");
      } else {
        setNotification({
          type: "error",
          message: evalRes.error || "Không thể tải dữ liệu KPI trong ngày",
        });
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Lỗi nạp dữ liệu đánh giá KPI",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedCampus]);

  // Handle manual adjustment change for an item
  const handleItemManualChange = (kpiCatalogId: string, valStr: string) => {
    const val = valStr === "" ? null : parseFloat(valStr);
    setItems((prev) =>
      prev.map((item) => {
        if (item.kpiCatalogId === kpiCatalogId) {
          const actualVal = val !== null && !isNaN(val) ? val : item.autoValue;
          let rate = 0;
          if (item.direction === "HIGHER_BETTER") {
            rate = item.targetValue === 0 ? (actualVal > 0 ? 100 : 0) : (actualVal / item.targetValue) * 100;
          } else if (item.direction === "LOWER_BETTER") {
            rate = actualVal === 0 ? (item.targetValue >= 0 ? 200 : 100) : (item.targetValue / actualVal) * 100;
          } else {
            rate = actualVal >= 1 ? 100 : 0;
          }
          rate = Math.max(0, Math.min(200, rate));
          const weightedScore = Number(((rate * item.weight) / 100).toFixed(2));

          return {
            ...item,
            manualValue: val !== null && !isNaN(val) ? val : null,
            actualValue: actualVal,
            completionRate: Number(rate.toFixed(2)),
            weightedScore,
          };
        }
        return item;
      })
    );
  };

  const handleItemNoteChange = (kpiCatalogId: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.kpiCatalogId === kpiCatalogId ? { ...item, notes: note } : item))
    );
  };

  // Re-calculate live overall score
  const liveOverallScore = Number(items.reduce((acc, i) => acc + i.weightedScore, 0).toFixed(2));

  // Save / Finalize action
  const handleSaveEvaluation = (status: DailyKpiStatus = DailyKpiStatus.DRAFT) => {
    startSaving(async () => {
      setNotification(null);
      const res = await saveDailyKpiEvaluation({
        date: selectedDate,
        campusId: selectedCampus,
        notes: generalNotes,
        status,
        items: items.map((i) => ({
          kpiCatalogId: i.kpiCatalogId,
          autoValue: i.autoValue,
          manualValue: i.manualValue,
          notes: i.notes,
        })),
      });

      if (res.success) {
        setNotification({
          type: "success",
          message:
            status === DailyKpiStatus.FINALIZED
              ? "Đã chốt và khóa đánh giá KPI trong ngày thành công!"
              : "Đã lưu bản nháp đánh giá KPI thành công!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi lưu đánh giá KPI",
        });
      }
    });
  };

  // Monthly Sync action
  const handleSyncToMonthly = () => {
    const d = new Date(selectedDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    if (
      !confirm(
        `Bạn có chắc chắn muốn tổng hợp trung bình tất cả các ngày trong Tháng ${month}/${year} vào Kỳ KPI chính thức?`
      )
    ) {
      return;
    }

    startSyncing(async () => {
      setNotification(null);
      const res = await syncDailyToMonthlyKpi(month, year, selectedCampus);
      if (res.success) {
        setNotification({
          type: "success",
          message: res.message || "Đã đồng bộ KPI thành công!",
        });
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi đồng bộ dữ liệu",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Header Bar: Filters, Date Picker, Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-slate-800">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Campus Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-slate-800">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân hiệu:</span>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toàn trường (Tổng hợp chung)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-400" : ""}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncToMonthly}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
            title="Đồng bộ điểm trung bình ngày vào kỳ KPI tháng"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            {syncing ? "Đang tổng hợp..." : "Đồng Bộ Sang KPI Tháng"}
          </button>

          <button
            onClick={() => handleSaveEvaluation(DailyKpiStatus.DRAFT)}
            disabled={saving || loading || evaluation?.status === DailyKpiStatus.FINALIZED}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-600" />
            {saving ? "Đang lưu..." : "Lưu Bản Nháp"}
          </button>

          <button
            onClick={() => handleSaveEvaluation(DailyKpiStatus.FINALIZED)}
            disabled={saving || loading || evaluation?.status === DailyKpiStatus.FINALIZED}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-slate-300" />
            {evaluation?.status === DailyKpiStatus.FINALIZED ? "Đã Chốt Đánh Giá" : "Chốt & Khóa Đánh Giá"}
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : notification.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {notification.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            {notification.type === "info" && <Info className="w-4 h-4 text-blue-600" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold hover:underline opacity-80 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Scorecard & Real-time Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Main Composite Daily Score */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Điểm Vận Hành Hôm Nay
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                evaluation?.status === DailyKpiStatus.FINALIZED
                  ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {evaluation?.status === DailyKpiStatus.FINALIZED ? "ĐÃ CHỐT" : "BẢN NHÁP / LIVE"}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight">{liveOverallScore}</span>
            <span className="text-slate-400 font-medium text-sm">/ 100 điểm</span>
            {liveOverallScore < 70 ? (
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Dưới ngưỡng an toàn
              </span>
            ) : (
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn vận hành
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 pt-3">
            <span>Phạm vi: {evaluation?.campusName || "Toàn trường"}</span>
            <span>
              {evaluation?.evaluatedByName ? `Chốt bởi: ${evaluation.evaluatedByName}` : "Chưa chốt"}
            </span>
          </div>
        </div>

        {/* Sensor 1: Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chuyên Cần Hôm Nay
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.attendanceRate ?? 100}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Có mặt: {evaluation?.metrics.presentAttendance ?? 0} /{" "}
              {evaluation?.metrics.totalAttendance || evaluation?.metrics.studentCount || 0} HS
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${
                (evaluation?.metrics.attendanceRate ?? 100) >= 95
                  ? "bg-emerald-600"
                  : (evaluation?.metrics.attendanceRate ?? 100) >= 85
                  ? "bg-amber-600"
                  : "bg-rose-600"
              }`}
              style={{ width: `${Math.min(100, evaluation?.metrics.attendanceRate ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Sensor 2: Safety / Incident */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            An Toàn & Kỷ Luật
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.incidentCount ?? 0}{" "}
              <span className="text-xs font-medium text-slate-500">sự cố</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Khen thưởng trong ngày: {evaluation?.metrics.commendationCount ?? 0} lượt
            </div>
          </div>
          <div className="text-xs font-bold text-slate-700 mt-2 flex items-center gap-1">
            {evaluation?.metrics.incidentCount === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% An toàn
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Cần can thiệp
              </span>
            )}
          </div>
        </div>

        {/* Sensor 3: Class Journal / Teaching */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Sổ Đầu Bài & Giảng Dạy
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.journalCompletionRate ?? 100}%
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Đã ký xác nhận: {evaluation?.metrics.confirmedJournalEntries ?? 0} /{" "}
              {evaluation?.metrics.totalJournalEntries ?? 0} tiết
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="h-1.5 rounded-full bg-slate-800"
              style={{
                width: `${Math.min(100, evaluation?.metrics.journalCompletionRate ?? 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. 7-Day Trendline Mini History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Xu Hướng Vận Hành 7 Ngày Gần Nhất
            </h2>
          </div>
          <span className="text-xs text-slate-500">Phân hiệu: {evaluation?.campusName || "Toàn trường"}</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {history.map((h, idx) => {
            const isSelected = h.date === selectedDate;
            const hasScore = h.overallScore !== null;
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(h.date)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                }`}
              >
                <span className={`text-[11px] font-semibold ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {h.displayDate}
                </span>
                <span className="text-lg font-black my-1">
                  {hasScore ? h.overallScore : "--"}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-slate-800 text-slate-200"
                      : hasScore
                      ? h.status === "FINALIZED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {hasScore ? (h.status === "FINALIZED" ? "Đã chốt" : "Nháp") : "Trống"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Detailed Line-Item Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chi Tiết Bảng Đánh Giá KPI Hằng Ngày</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động tính toán (Auto-calculate) từ CSDL trường học và cho phép điều chỉnh định tính.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            Tổng cộng: {items.length} chỉ số được theo dõi
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-16 text-center">Mã</th>
                <th className="px-4 py-3.5">Tên Chỉ Số KPI & Nhóm</th>
                <th className="px-4 py-3.5 text-center w-24">Trọng Số</th>
                <th className="px-4 py-3.5 text-center w-28">Mục Tiêu</th>
                <th className="px-4 py-3.5 text-center w-28">Tự Động (DB)</th>
                <th className="px-4 py-3.5 text-center w-32">Điều Chỉnh</th>
                <th className="px-4 py-3.5 text-center w-24">Tỷ Lệ Đạt</th>
                <th className="px-4 py-3.5 text-center w-24">Điểm Quy Đổi</th>
                <th className="px-4 py-3.5">Ghi Chú / Nguồn Dữ Liệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Không có chỉ số KPI nào được thiết lập theo dõi hằng ngày.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.kpiCatalogId} className="hover:bg-slate-50/75 transition">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {item.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {item.weight}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {item.targetValue} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                      {item.autoValue} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        disabled={evaluation?.status === DailyKpiStatus.FINALIZED}
                        placeholder={`${item.autoValue}`}
                        value={item.manualValue !== null && item.manualValue !== undefined ? item.manualValue : ""}
                        onChange={(e) => handleItemManualChange(item.kpiCatalogId, e.target.value)}
                        className="w-24 text-center font-mono font-bold px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          item.completionRate >= 100
                            ? "bg-emerald-100 text-emerald-800"
                            : item.completionRate >= 80
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.completionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-slate-900">
                      {item.weightedScore}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        disabled={evaluation?.status === DailyKpiStatus.FINALIZED}
                        value={item.notes || ""}
                        onChange={(e) => handleItemNoteChange(item.kpiCatalogId, e.target.value)}
                        placeholder="Thêm căn cứ / ghi chú..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:bg-slate-100"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-left">
                  TỔNG CỘNG ĐIỂM VẬN HÀNH NGÀY
                </td>
                <td className="px-4 py-3 text-center">
                  {items.reduce((acc, i) => acc + i.weight, 0)}%
                </td>
                <td colSpan={4} className="px-4 py-3 text-right text-slate-400 font-normal">
                  Điểm tổng kết:
                </td>
                <td className="px-4 py-3 text-center font-mono text-base font-black text-white">
                  {liveOverallScore}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. General Notes / Daily Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          Nhận Xét Chung Của Cán Bộ Đánh Giá Trong Ngày
        </label>
        <textarea
          rows={3}
          disabled={evaluation?.status === DailyKpiStatus.FINALIZED}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Nhập nhận xét tổng quan về nền nếp, hoạt động dạy học, an toàn trường học hoặc các sự việc phát sinh trong ngày..."
          className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:bg-slate-100"
        />
      </div>
    </div>
  );
}
