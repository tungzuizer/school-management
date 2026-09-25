"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: src/app/admin/kpi/page.tsx (Tab 5)
 * 2. Public functions/components: DailyKpiConsole
 * 3. Data flows: getDailyKpiRealtime, saveDailyKpiEvaluation, getDailyKpiHistory, syncDailyToMonthlyKpi, submitDailyKpiByVP, lockDailyKpiByPrincipal, requestDailyKpiUnlock, unlockDailyKpiByPrincipal, lockAllCampusesDailyKpi, getDailyCampusMatrix, getDailyExecutiveBriefingData, getCampuses
 * 4. User design contract: Clean, minimal, monochrome slate with semantic traffic-light highlights for status and trends. No colorful emojis.
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
  Unlock,
  Send,
  TrendingUp,
  RefreshCw,
  Clock,
  UserCheck,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  X,
  ExternalLink,
  Users,
  GraduationCap,
  BookOpen,
  Utensils,
  Wrench,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import {
  getDailyKpiRealtime,
  saveDailyKpiEvaluation,
  getDailyKpiHistory,
  syncDailyToMonthlyKpi,
  submitDailyKpiByVP,
  lockDailyKpiByPrincipal,
  requestDailyKpiUnlock,
  unlockDailyKpiByPrincipal,
  lockAllCampusesDailyKpi,
  getDailyCampusMatrix,
  getDailyExecutiveBriefingData,
  DailyKpiEvaluationPayload,
  DailyKpiItemPayload,
  CampusDailyMatrixItem,
  DailyExecutiveBriefingData,
  DailyKpiWorkflowStatus,
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
  const [actionPending, startAction] = useTransition();

  const [evaluation, setEvaluation] = useState<DailyKpiEvaluationPayload | null>(null);
  const [campusMatrix, setCampusMatrix] = useState<CampusDailyMatrixItem[]>([]);
  const [matrixSummary, setMatrixSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [items, setItems] = useState<DailyKpiItemPayload[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>("");

  // Modals
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);
  const [briefingData, setBriefingData] = useState<DailyExecutiveBriefingData | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);

  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockReason, setUnlockReason] = useState<string>("");

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

  // Fetch daily KPI evaluation, multi-campus matrix & 7-day history
  const fetchData = async () => {
    setLoading(true);
    setNotification(null);

    try {
      const [evalRes, histRes, matrixRes] = await Promise.all([
        getDailyKpiRealtime(selectedDate, selectedCampus),
        getDailyKpiHistory(selectedCampus, 7),
        selectedCampus === "ALL" ? getDailyCampusMatrix(selectedDate) : Promise.resolve({ success: true, data: [] as CampusDailyMatrixItem[], summary: null }),
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

      if (matrixRes.success && matrixRes.data) {
        setCampusMatrix(matrixRes.data);
        setMatrixSummary(matrixRes.summary);
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
          const weightedScore = Number(((rate * item.normalizedWeight) / 100).toFixed(2));

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

  // Save Draft action
  const handleSaveDraft = () => {
    startSaving(async () => {
      setNotification(null);
      const res = await saveDailyKpiEvaluation({
        date: selectedDate,
        campusId: selectedCampus,
        notes: generalNotes,
        status: DailyKpiStatus.DRAFT,
        workflowStatus: "DRAFT",
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
          message: "Đã lưu bản nháp đánh giá KPI thành công!",
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

  // VP Submit Action
  const handleSubmitVP = () => {
    if (selectedCampus === "ALL") {
      setNotification({
        type: "error",
        message: "Vui lòng chọn một phân hiệu cụ thể trước khi nộp báo cáo",
      });
      return;
    }

    startAction(async () => {
      setNotification(null);
      const res = await submitDailyKpiByVP({
        date: selectedDate,
        campusId: selectedCampus,
        notes: generalNotes,
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
          message: "Đã nộp báo cáo KPI phân hiệu thành công tới Hiệu trưởng!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi nộp báo cáo",
        });
      }
    });
  };

  // Principal Lock / Sign-off Action
  const handleLockEvaluation = () => {
    startAction(async () => {
      setNotification(null);
      // First save current inputs
      await saveDailyKpiEvaluation({
        date: selectedDate,
        campusId: selectedCampus,
        notes: generalNotes,
        status: DailyKpiStatus.FINALIZED,
        workflowStatus: "FINALIZED",
        items: items.map((i) => ({
          kpiCatalogId: i.kpiCatalogId,
          autoValue: i.autoValue,
          manualValue: i.manualValue,
          notes: i.notes,
        })),
      });

      const res = await lockDailyKpiByPrincipal({
        date: selectedDate,
        campusId: selectedCampus,
        notes: generalNotes,
      });

      if (res.success) {
        setNotification({
          type: "success",
          message: "Hiệu trưởng đã ký duyệt và khóa sổ KPI ngày thành công!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi ký duyệt KPI",
        });
      }
    });
  };

  // 1-Click Lock All Campuses
  const handleLockAllCampuses = () => {
    if (!confirm(`Xác nhận khóa sổ đánh giá KPI của toàn bộ phân hiệu ngày ${selectedDate}?`)) {
      return;
    }

    startAction(async () => {
      setNotification(null);
      const res = await lockAllCampusesDailyKpi(selectedDate);
      if (res.success) {
        setNotification({
          type: "success",
          message: res.message || "Đã khóa sổ toàn bộ phân hiệu thành công!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi khóa sổ toàn bộ phân hiệu",
        });
      }
    });
  };

  // Unlock Request by VP
  const handleRequestUnlockSubmit = () => {
    if (!unlockReason.trim()) {
      alert("Vui lòng nhập lý do mở khóa điều chỉnh");
      return;
    }

    startAction(async () => {
      const res = await requestDailyKpiUnlock({
        date: selectedDate,
        campusId: selectedCampus,
        reason: unlockReason.trim(),
      });

      setShowUnlockModal(false);
      setUnlockReason("");

      if (res.success) {
        setNotification({
          type: "success",
          message: "Đã gửi yêu cầu mở khóa điều chỉnh tới Hiệu trưởng!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi gửi yêu cầu",
        });
      }
    });
  };

  // Principal approve unlock
  const handlePrincipalUnlock = (campusIdToUnlock?: string) => {
    const targetCampusId = campusIdToUnlock || selectedCampus;
    if (targetCampusId === "ALL") return;

    startAction(async () => {
      const res = await unlockDailyKpiByPrincipal({
        date: selectedDate,
        campusId: targetCampusId,
      });

      if (res.success) {
        setNotification({
          type: "success",
          message: "Đã mở khóa đánh giá KPI phân hiệu!",
        });
        fetchData();
      } else {
        setNotification({
          type: "error",
          message: res.error || "Lỗi mở khóa",
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

  // Open Executive Briefing Modal
  const handleOpenBriefing = async () => {
    setShowBriefingModal(true);
    setLoadingBriefing(true);
    try {
      const res = await getDailyExecutiveBriefingData(selectedDate);
      if (res.success && res.data) {
        setBriefingData(res.data);
      } else {
        setNotification({
          type: "error",
          message: res.error || "Không thể tạo bản tin giao ban",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Lỗi nạp bản tin giao ban",
      });
    } finally {
      setLoadingBriefing(false);
    }
  };

  const isFinalized = evaluation?.workflowStatus === "FINALIZED";
  const isVpSubmitted = evaluation?.workflowStatus === "VP_SUBMITTED";
  const isUnlockRequested = evaluation?.workflowStatus === "UNLOCK_REQUESTED";

  return (
    <div className="space-y-6">
      {/* 1. Control Header Bar: Filters, Date Picker, Workflow State & Quick Actions */}
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
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[220px]"
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
            title="Làm mới dữ liệu thời gian thực"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-slate-400" : ""}`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1-Page Executive Daily Briefing Trigger */}
          <button
            onClick={handleOpenBriefing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
            title="Xem & in Bản tin tóm tắt giao ban sáng"
          >
            <FileText className="w-4 h-4 text-slate-700" />
            Bản Tin Giao Ban Sáng
          </button>

          {/* Monthly Sync */}
          <button
            onClick={handleSyncToMonthly}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
            title="Đồng bộ điểm trung bình ngày vào kỳ KPI tháng"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            {syncing ? "Đang đồng bộ..." : "Đồng Bộ Tháng"}
          </button>

          {/* Contextual Workflow Action Buttons */}
          {selectedCampus === "ALL" ? (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving || loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-600" />
                {saving ? "Đang lưu..." : "Lưu Tổng Hợp"}
              </button>
              <button
                onClick={handleLockAllCampuses}
                disabled={actionPending || loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-slate-300" />
                {actionPending ? "Đang khóa..." : "Khóa Toàn Bộ Phân Hiệu"}
              </button>
            </>
          ) : (
            <>
              {/* Individual Campus Actions */}
              {isFinalized ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Khóa Sổ
                  </span>
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 transition cursor-pointer"
                  >
                    <Unlock className="w-4 h-4 text-slate-600" />
                    Yêu Cầu Mở Khóa
                  </button>
                  <button
                    onClick={() => handlePrincipalUnlock(selectedCampus)}
                    disabled={actionPending}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                    title="Hiệu trưởng mở khóa trực tiếp"
                  >
                    Mở Khóa (Hiệu Trưởng)
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || loading || actionPending}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-slate-600" />
                    {saving ? "Đang lưu..." : "Lưu Nháp"}
                  </button>

                  <button
                    onClick={handleSubmitVP}
                    disabled={actionPending || loading}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-blue-700" />
                    {actionPending ? "Đang nộp..." : "Nộp Hiệu Trưởng"}
                  </button>

                  <button
                    onClick={handleLockEvaluation}
                    disabled={actionPending || loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4 text-slate-300" />
                    {actionPending ? "Đang khóa..." : "Ký Duyệt & Khóa Sổ"}
                  </button>
                </>
              )}
            </>
          )}
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

      {/* Workflow Status Info Bar if special state */}
      {isUnlockRequested && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Phó Hiệu trưởng đã gửi yêu cầu mở khóa sổ: </strong>
              <span>&ldquo;{evaluation?.unlockReason}&rdquo;</span>
              <span className="text-amber-700 ml-2">({evaluation?.submittedBy} - {evaluation?.submittedAt ? new Date(evaluation.submittedAt).toLocaleTimeString("vi-VN") : ""})</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handlePrincipalUnlock(selectedCampus)}
              disabled={actionPending}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition cursor-pointer"
            >
              Chấp Thuận Mở Khóa
            </button>
          </div>
        </div>
      )}

      {isVpSubmitted && !isFinalized && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" />
            <span>
              <strong>Báo cáo đã được nộp bởi Phó Hiệu trưởng: </strong>
              {evaluation?.submittedBy} ({evaluation?.submittedAt ? new Date(evaluation.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Hôm nay"}). Đang chờ Hiệu trưởng ký duyệt khóa sổ.
            </span>
          </div>
          <button
            onClick={handleLockEvaluation}
            disabled={actionPending}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Ký Duyệt Ngay
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Scorecard & 8 Real-time Telemetry Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Composite Daily Score */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Điểm Vận Hành Hôm Nay (Daily Composite)
              </span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                isFinalized
                  ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                  : isVpSubmitted
                  ? "bg-blue-950 text-blue-300 border-blue-700"
                  : isUnlockRequested
                  ? "bg-amber-950 text-amber-300 border-amber-700"
                  : "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {isFinalized
                ? "ĐÃ KHÓA SỔ"
                : isVpSubmitted
                ? "PHÓ HT ĐÃ NỘP"
                : isUnlockRequested
                ? "YÊU CẦU MỞ KHÓA"
                : "BẢN NHÁP / LIVE"}
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
              {evaluation?.evaluatedByName ? `Chốt bởi: ${evaluation.evaluatedByName}` : "Chưa khóa sổ"}
            </span>
          </div>
        </div>

        {/* Sensor 1: Student Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-600" /> Chuyên Cần Học Sinh</span>
            <span className="font-mono font-bold text-slate-900">{evaluation?.metrics.attendanceRate ?? 100}%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.presentAttendance ?? 0}
              <span className="text-xs font-medium text-slate-500 ml-1">/ {evaluation?.metrics.totalAttendance || evaluation?.metrics.studentCount || 0} HS</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-amber-700">Có phép: {evaluation?.metrics.absentExcusedCount ?? 0}</span>
              <span>•</span>
              <span className="text-rose-700 font-semibold">Không phép: {evaluation?.metrics.absentUnexcusedCount ?? 0}</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
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

        {/* Sensor 2: Teacher Attendance & Substitute Dispatch */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-slate-600" /> Giáo Viên & Dạy Thay</span>
            <span className="font-mono font-bold text-slate-900">{evaluation?.metrics.teacherAttendanceRate ?? 100}%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.substituteCount ?? 0}
              <span className="text-xs font-medium text-slate-500 ml-1">tiết phân công</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Đã bố trí dạy thay: {evaluation?.metrics.substituteApprovedCount ?? 0}/{evaluation?.metrics.substituteCount ?? 0} ({evaluation?.metrics.substituteDispatchRate ?? 100}%)
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full bg-slate-800"
              style={{ width: `${Math.min(100, evaluation?.metrics.teacherAttendanceRate ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Sensor 3: Class Journal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-600" /> Sổ Đầu Bài Điện Tử</span>
            <span className="font-mono font-bold text-slate-900">{evaluation?.metrics.journalCompletionRate ?? 100}%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.confirmedJournalEntries ?? 0}
              <span className="text-xs font-medium text-slate-500 ml-1">/ {evaluation?.metrics.totalJournalEntries ?? 0} tiết</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Tỷ lệ hoàn tất ký nhận giảng dạy trong ngày
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full bg-slate-800"
              style={{ width: `${Math.min(100, evaluation?.metrics.journalCompletionRate ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Sensor 4: Lesson Plan Approval */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-600" /> Ký Duyệt Giáo Án</span>
            <span className="font-mono font-bold text-slate-900">{evaluation?.metrics.lessonPlanApprovalRate ?? 100}%</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.approvedLessonPlans ?? 0}
              <span className="text-xs font-medium text-slate-500 ml-1">/ {evaluation?.metrics.totalLessonPlans ?? 0} hồ sơ</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Tiến độ phê duyệt giáo án chuyên môn tuần này
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full bg-slate-800"
              style={{ width: `${Math.min(100, evaluation?.metrics.lessonPlanApprovalRate ?? 100)}%` }}
            />
          </div>
        </div>

        {/* Sensor 5: Boarding Meal Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Utensils className="w-4 h-4 text-slate-600" /> Suất Ăn Bán Trú</span>
            {evaluation?.metrics.isBoardingApplicable ? (
              <span className="font-mono font-bold text-slate-900">{evaluation.metrics.mealRate}%</span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">K.Áp dụng</span>
            )}
          </div>
          <div className="my-2">
            {evaluation?.metrics.isBoardingApplicable ? (
              <>
                <div className="text-2xl font-black text-slate-900">
                  {evaluation?.metrics.mealAttendanceCount ?? 0}
                  <span className="text-xs font-medium text-slate-500 ml-1">/ {evaluation?.metrics.totalBoardingStudents ?? 0} suất</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Điểm danh suất ăn trưa bán trú thực tế
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-bold text-slate-400 py-1">Không tổ chức bán trú</div>
                <div className="text-[11px] text-slate-400">Trọng số tự động chuẩn hóa sang các chỉ tiêu khác</div>
              </>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
            <div
              className="h-1.5 rounded-full bg-slate-800"
              style={{ width: `${evaluation?.metrics.isBoardingApplicable ? Math.min(100, evaluation?.metrics.mealRate ?? 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Sensor 6: School Safety & Discipline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-slate-600" /> An Toàn & Kỷ Luật</span>
            <span className="font-mono font-bold text-slate-900">{evaluation?.metrics.safetyScore ?? 100} đ</span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900">
              {evaluation?.metrics.incidentCount ?? 0}
              <span className="text-xs font-medium text-slate-500 ml-1">sự cố phát sinh</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Khen thưởng gương tốt: {evaluation?.metrics.commendationCount ?? 0} lượt
            </div>
          </div>
          <div className="text-xs font-bold mt-1">
            {evaluation?.metrics.incidentCount === 0 ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                100% An toàn
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Cần xử lý dứt điểm
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Multi-Campus Realtime Matrix (Shown when "Toàn trường" is selected) */}
      {selectedCampus === "ALL" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-700" />
                <h2 className="text-base font-bold text-slate-900">Ma Trận Vận Hành & KPI Các Phân Hiệu Trong Ngày</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng so sánh số liệu thời gian thực và trạng thái báo cáo giữa các phân hiệu trực thuộc.
              </p>
            </div>
            {matrixSummary && (
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Tổng HS: <strong className="text-slate-900 font-mono">{matrixSummary.totalStudents}</strong>
                </span>
                <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  Đã Khóa: <strong className="text-emerald-700 font-mono">{matrixSummary.finalizedCount}/{matrixSummary.totalCampuses}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Phân Hiệu / Cơ Sở</th>
                  <th className="px-4 py-3.5">Phó Hiệu Trưởng Phụ Trách</th>
                  <th className="px-4 py-3.5 text-center">Học Sinh</th>
                  <th className="px-4 py-3.5 text-center">Chuyên Cần</th>
                  <th className="px-4 py-3.5 text-center">Dạy Thay</th>
                  <th className="px-4 py-3.5 text-center">Sổ Đầu Bài</th>
                  <th className="px-4 py-3.5 text-center">Bán Trú</th>
                  <th className="px-4 py-3.5 text-center">An Toàn</th>
                  <th className="px-4 py-3.5 text-center">Điểm KPI</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-4 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {campusMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                      Đang tải số liệu ma trận các phân hiệu...
                    </td>
                  </tr>
                ) : (
                  campusMatrix.map((cm) => (
                    <tr key={cm.campusId} className="hover:bg-slate-50/75 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {cm.campusName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-semibold">{cm.vicePrincipalName}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {cm.studentCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            cm.attendanceRate >= 95
                              ? "bg-emerald-100 text-emerald-800"
                              : cm.attendanceRate >= 85
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {cm.attendanceRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-800">
                        {cm.substituteCount > 0 ? (
                          <span className={cm.substituteApprovedCount === cm.substituteCount ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                            {cm.substituteApprovedCount}/{cm.substituteCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {cm.journalRate}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cm.isBoardingApplicable ? (
                          <span className="font-mono font-bold text-slate-800">{cm.boardingRate}%</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">K.Áp dụng</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {cm.incidentCount === 0 ? (
                          <span className="text-emerald-700 font-bold">An toàn</span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {cm.incidentCount} sự cố
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm font-black text-slate-900">
                        {cm.dailyScore}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            cm.status === "FINALIZED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : cm.status === "VP_SUBMITTED"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : cm.status === "UNLOCK_REQUESTED"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {cm.status === "FINALIZED"
                            ? "ĐÃ KHÓA"
                            : cm.status === "VP_SUBMITTED"
                            ? "ĐÃ NỘP"
                            : cm.status === "UNLOCK_REQUESTED"
                            ? "XIN MỞ KHÓA"
                            : "NHÁP"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCampus(cm.campusId)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Chi Tiết
                        </button>
                        {cm.status === "UNLOCK_REQUESTED" && (
                          <button
                            onClick={() => handlePrincipalUnlock(cm.campusId)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Mở Khóa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. 7-Day Trendline Mini History */}
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
                      ? h.workflowStatus === "FINALIZED"
                        ? "bg-emerald-100 text-emerald-800"
                        : h.workflowStatus === "VP_SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {hasScore ? (h.workflowStatus === "FINALIZED" ? "Đã khóa" : h.workflowStatus === "VP_SUBMITTED" ? "Đã nộp" : "Nháp") : "Trống"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Detailed Line-Item Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Chi Tiết Bảng Đánh Giá KPI Hằng Ngày</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động tính toán (Auto-calculate) từ CSDL trường học và phân bổ trọng số thích ứng (Adaptive Weight).
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Tổng trọng số: <strong className="text-slate-900 font-mono">{items.reduce((acc, i) => acc + i.normalizedWeight, 0).toFixed(0)}%</strong>
            </span>
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
                  <tr key={item.kpiCatalogId} className={`hover:bg-slate-50/75 transition ${!item.isApplicable ? "opacity-60 bg-slate-50/50" : ""}`}>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                      {item.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {item.name}
                        {!item.isApplicable && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">K.áp dụng</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {item.normalizedWeight}%
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
                        disabled={isFinalized || !item.isApplicable}
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
                        disabled={isFinalized || !item.isApplicable}
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
                  {items.reduce((acc, i) => acc + i.normalizedWeight, 0).toFixed(0)}%
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

      {/* 6. General Notes / Qualitative Daily Directives */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          Nhận Xét Chung & Chỉ Đạo Của Ban Giám Hiệu Trong Ngày
        </label>
        <textarea
          rows={3}
          disabled={isFinalized}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Nhập nhận xét tổng quan về nền nếp, hoạt động dạy học, bố trí dạy thay, an toàn trường học hoặc các chỉ đạo cần lưu ý..."
          className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:bg-slate-100"
        />
      </div>

      {/* Unlock Request Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Yêu Cầu Mở Khóa Đánh Giá KPI</h3>
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Bản ghi đánh giá KPI của ngày {selectedDate} đã được ký duyệt. Vui lòng nêu rõ lý do cần điều chỉnh để gửi yêu cầu tới Hiệu trưởng.
            </p>

            <textarea
              rows={4}
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Bổ sung điểm danh bù lớp 10A1 do lỗi mạng; cập nhật thông tin tiết dạy thay...)"
              className="w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowUnlockModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleRequestUnlockSubmit}
                disabled={actionPending}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                {actionPending ? "Đang gửi..." : "Gửi Yêu Cầu Mở Khóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Page Executive Daily Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8 print:m-0 print:p-4 print:shadow-none print:border-none">
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Bản Tin Tóm Tắt Giao Ban Điều Hành Sáng (1-Page Briefing)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> In / Xuất PDF
                </button>
                <button
                  onClick={() => setShowBriefingModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingBriefing || !briefingData ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Đang tổng hợp dữ liệu giao ban...
              </div>
            ) : (
              <div className="space-y-6 text-slate-800">
                {/* Printable Document Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                      {briefingData.schoolName}
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                      Bản Tin Giao Ban Vận Hành Hằng Ngày — Ban Giám Hiệu
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-bold text-slate-900">Ngày: {briefingData.date}</div>
                    <div className="text-slate-500">Giờ xuất bản: {briefingData.generatedAt}</div>
                    <div className="text-slate-600 mt-1">Chủ trì: <strong>{briefingData.principalName}</strong></div>
                  </div>
                </div>

                {/* KPI Executive Summary Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Tổng Học Sinh & Cơ Sở</div>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {briefingData.summary.totalStudents} <span className="text-xs font-normal text-slate-500">HS / {briefingData.summary.totalCampuses} Phân hiệu</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Chuyên Cần Toàn Trường</div>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {briefingData.summary.averageAttendanceRate}%
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Tiết Dạy Thay Trong Ngày</div>
                    <div className="text-xl font-black text-slate-900 mt-1">
                      {briefingData.summary.totalSubstitutes} <span className="text-xs font-normal text-slate-500">tiết</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-300 uppercase">Điểm Vận Hành TB</div>
                    <div className="text-xl font-black mt-1">
                      {briefingData.summary.averageScore} <span className="text-xs font-normal text-slate-400">/ 100 đ</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Campus Comparative Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Tình Hình Vận Hành Chi Tiết Tại Các Phân Hiệu
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Phân Hiệu</th>
                          <th className="px-3 py-2">Phó Hiệu Trưởng</th>
                          <th className="px-3 py-2 text-center">Học Sinh</th>
                          <th className="px-3 py-2 text-center">Chuyên Cần</th>
                          <th className="px-3 py-2 text-center">Dạy Thay</th>
                          <th className="px-3 py-2 text-center">Sổ Đầu Bài</th>
                          <th className="px-3 py-2 text-center">An Toàn</th>
                          <th className="px-3 py-2 text-center">Điểm KPI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {briefingData.campusMatrix.map((cm) => (
                          <tr key={cm.campusId}>
                            <td className="px-3 py-2 font-bold text-slate-900">{cm.campusName}</td>
                            <td className="px-3 py-2 text-slate-700">{cm.vicePrincipalName}</td>
                            <td className="px-3 py-2 text-center font-mono">{cm.studentCount}</td>
                            <td className="px-3 py-2 text-center font-mono font-bold">{cm.attendanceRate}%</td>
                            <td className="px-3 py-2 text-center font-mono">{cm.substituteApprovedCount}/{cm.substituteCount}</td>
                            <td className="px-3 py-2 text-center font-mono">{cm.journalRate}%</td>
                            <td className="px-3 py-2 text-center">
                              {cm.incidentCount === 0 ? "100% An toàn" : `${cm.incidentCount} sự việc`}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-black text-slate-900">{cm.dailyScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* High Priority Alerts & AI Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Alerts */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-slate-700" />
                      Điểm Nóng Cần Lưu Ý
                    </h4>
                    {briefingData.highPriorityAlerts.length === 0 ? (
                      <p className="text-xs text-slate-500">Tất cả các chỉ số đều trong ngưỡng an toàn tuyệt đối.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs">
                        {briefingData.highPriorityAlerts.map((alert, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="font-bold text-slate-800">• [{alert.campusName}]:</span>
                            <span className="text-slate-700">{alert.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* AI Strategic Recommendations */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-slate-700" />
                      Đề Xuất Chỉ Đạo Giao Ban Sáng
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {briefingData.strategicRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="font-bold text-slate-900">{idx + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="pt-6 border-t border-slate-200 flex justify-end text-right text-xs">
                  <div className="space-y-8">
                    <div>
                      <strong>HIỆU TRƯỞNG PHÊ DUYỆT</strong>
                      <div className="text-[11px] text-slate-400 mt-0.5">(Ký và ghi rõ họ tên)</div>
                    </div>
                    <div className="font-bold text-slate-900">{briefingData.principalName}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
