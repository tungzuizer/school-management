"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  RefreshCw,
  Sliders,
  Sparkles,
  AlertCircle,
  FileCheck,
  Send,
  Building,
  ShieldCheck,
  Calendar,
  Share2,
  UserCheck,
} from "lucide-react";
import CampusOverviewGrid from "./components/CampusOverviewGrid";
import CampusDetailModal from "./components/CampusDetailModal";
import TaskTabsNavigation from "./components/TaskTabsNavigation";
import ThresholdConfigModal from "./components/ThresholdConfigModal";
import {
  getAiAssistantDashboardData,
  getSubstituteRecommendationAction,
  getEquipmentTransferAdviceAction,
  getDecisionSupportAdviceAction,
  generateExecutiveReportAction,
  draftAnnouncementAction,
  updateAiThresholdAction,
  acknowledgeAlertAction,
  resolveAlertAction,
} from "./actions";
import {
  AiTaskGroup,
  EquipmentCategory,
  SubstituteRecommendationResult,
  EquipmentTransferAdviceResult,
  DecisionSupportResult,
  AnnouncementDraftResult,
  PeriodicReportResult,
} from "@/lib/ai-assistant/types";

export default function AiAssistantPrincipalDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AiTaskGroup>(AiTaskGroup.REALTIME_MONITORING);
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(undefined);
  const [detailPoint, setDetailPoint] = useState<any | null>(null);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);

  // Sub-task interactive states
  const [decisionQuery, setDecisionQuery] = useState("");
  const [analyzingDecision, setAnalyzingDecision] = useState(false);
  const [decisionResult, setDecisionResult] = useState<DecisionSupportResult | null>(null);

  // Substitute dispatcher state
  const [selectedAbsentTeacherId, setSelectedAbsentTeacherId] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [substituteResult, setSubstituteResult] = useState<SubstituteRecommendationResult | null>(null);
  const [analyzingSubstitute, setAnalyzingSubstitute] = useState(false);

  // Equipment transfer state
  const [selectedEqCategory, setSelectedEqCategory] = useState<EquipmentCategory>(EquipmentCategory.IT_COMPUTER);
  const [targetEqPointId, setTargetEqPointId] = useState<string>("");
  const [neededEqQty, setNeededEqQty] = useState<number>(5);
  const [eqAdviceResult, setEqAdviceResult] = useState<EquipmentTransferAdviceResult | null>(null);
  const [analyzingEq, setAnalyzingEq] = useState(false);

  // Announcement Drafter state
  const [announcementTopic, setAnnouncementTopic] = useState("");
  const [announcementAudience, setAnnouncementAudience] = useState<"TEACHERS" | "PARENTS" | "ALL_STAFF" | "SATELLITE_POINTS">("ALL_STAFF");
  const [draftingAnnouncement, setDraftingAnnouncement] = useState(false);
  const [announcementResult, setAnnouncementResult] = useState<AnnouncementDraftResult | null>(null);

  // Periodic Report state
  const [reportPeriod, setReportPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "HK1">("DAILY");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentReport, setCurrentReport] = useState<PeriodicReportResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getAiAssistantDashboardData(selectedPointId);
    if (res.success && res.data) {
      setDashboardData(res.data);
      if (res.data.snapshot.teachers?.length > 0 && !selectedAbsentTeacherId) {
        setSelectedAbsentTeacherId(res.data.snapshot.teachers[0].teacherId);
      }
      if (res.data.snapshot.schoolPoints?.length > 1 && !targetEqPointId) {
        setTargetEqPointId(res.data.snapshot.schoolPoints[1].id);
      }
      if (res.data.periodicReport) {
        setCurrentReport(res.data.periodicReport);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedPointId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveThreshold = async (key: string, val: number) => {
    const res = await updateAiThresholdAction(key, val);
    if (res.success) {
      await loadData();
      return true;
    }
    return false;
  };

  const handleRunDecision = async () => {
    if (!decisionQuery.trim()) return;
    setAnalyzingDecision(true);
    const res = await getDecisionSupportAdviceAction(decisionQuery);
    if (res.success && res.data) {
      setDecisionResult(res.data);
    }
    setAnalyzingDecision(false);
  };

  const handleRunSubstituteDispatch = async () => {
    if (!selectedAbsentTeacherId) return;
    setAnalyzingSubstitute(true);
    const res = await getSubstituteRecommendationAction(
      selectedAbsentTeacherId,
      selectedPeriod,
      "class-mock"
    );
    if (res.success && res.data) {
      setSubstituteResult(res.data);
    }
    setAnalyzingSubstitute(false);
  };

  const handleRunEquipmentTransfer = async () => {
    if (!targetEqPointId) return;
    setAnalyzingEq(true);
    const res = await getEquipmentTransferAdviceAction(
      selectedEqCategory,
      targetEqPointId,
      neededEqQty
    );
    if (res.success && res.data) {
      setEqAdviceResult(res.data);
    }
    setAnalyzingEq(false);
  };

  const handleRunDraftAnnouncement = async () => {
    if (!announcementTopic.trim()) return;
    setDraftingAnnouncement(true);
    const res = await draftAnnouncementAction(announcementTopic, announcementAudience);
    if (res.success && res.data) {
      setAnnouncementResult(res.data);
    }
    setDraftingAnnouncement(false);
  };

  const handleGenerateReport = async (period: "DAILY" | "WEEKLY" | "MONTHLY" | "HK1") => {
    setReportPeriod(period);
    setGeneratingReport(true);
    const res = await generateExecutiveReportAction(period);
    if (res.success && res.data) {
      setCurrentReport(res.data);
    }
    setGeneratingReport(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await acknowledgeAlertAction(alertId);
    await loadData();
  };

  const handleResolveAlert = async (alertId: string) => {
    await resolveAlertAction(alertId, "Hiệu trưởng đã xử lý xong.");
    await loadData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-24 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
          <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const {
    snapshot,
    realtime,
    planProgress,
    docs,
    earlyWarning,
    parentFeedback,
  } = dashboardData || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                TRỢ LÝ ĐIỀU HÀNH HIỆU TRƯỞNG
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                4 Điểm trường Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Trung tâm Chỉ huy Điều hành Đa điểm trường
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tổng hợp dữ liệu thời gian thực từ 4 điểm trường (Trung tâm, Bản Mó, Bản Pún, Phia Xam). Hỗ trợ phân tích chuyên sâu, điều phối dạy thay, cảnh báo sớm và đề xuất quyết định chuẩn mực pháp lý.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/10 cursor-pointer shadow-sm"
            >
              <Sliders className="w-4 h-4 text-indigo-300" />
              Cấu hình ngưỡng
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Đang quét..." : "Quét dữ liệu mới"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Campus Matrix 4 Points */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Ma trận 4 Điểm trường (Giám sát Thời gian thực)
            </h2>
          </div>
          {selectedPointId && (
            <button
              onClick={() => setSelectedPointId(undefined)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Xem toàn trường (4 điểm)
            </button>
          )}
        </div>

        {realtime?.pointStatuses && (
          <CampusOverviewGrid
            pointStatuses={realtime.pointStatuses}
            selectedPointId={selectedPointId}
            onSelectPoint={(id) => setSelectedPointId(id === selectedPointId ? undefined : id)}
            onViewDetail={(point) => setDetailPoint(point)}
          />
        )}
      </div>

      {/* 3. Task Tabs Navigation */}
      <TaskTabsNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={{
          alertsCount: (earlyWarning?.criticalCount || 0) + (earlyWarning?.highCount || 0),
          urgentDocsCount: docs?.expiringWithin48h || 0,
          delayedLpCount: planProgress?.delayedLessonPlanCount || 0,
          feedbackCount: parentFeedback?.unrespondedCount || 0,
        }}
      />

      {/* 4. Tab Contents */}

      {/* TAB 1: REALTIME MONITORING */}
      {activeTab === AiTaskGroup.REALTIME_MONITORING && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Đánh giá Sức khỏe Tổng thể: {snapshot?.schoolName}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  realtime?.overallStatus === "STABLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : realtime?.overallStatus === "ATTENTION_REQUIRED"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {realtime?.overallStatus === "STABLE"
                  ? "HOẠT ĐỘNG ỔN ĐỊNH"
                  : realtime?.overallStatus === "ATTENTION_REQUIRED"
                  ? "CẦN LƯU Ý"
                  : "BÁO ĐỘNG ĐỎ"}
              </span>
            </div>

            {/* Total stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-700 font-medium block">Tổng học sinh</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {snapshot?.attendanceTotals?.totalStudents ?? 0} HS
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                  Có mặt: {snapshot?.attendanceTotals?.presentCount ?? 0}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-700 font-medium block">Tỷ lệ Chuyên cần</span>
                <span className="text-xl font-black text-indigo-600 mt-1 block">
                  {snapshot?.attendanceTotals?.overallAttendanceRate ?? 0}%
                </span>
                <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
                  Vắng: {(snapshot?.attendanceTotals?.absentExcusedCount ?? 0) + (snapshot?.attendanceTotals?.absentUnexcusedCount ?? 0)} HS
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-700 font-medium block">Giáo viên trực</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">
                  {snapshot?.teachers?.length ?? 0} GV
                </span>
                <span className="text-[11px] text-slate-700 font-semibold mt-0.5 block">
                  4 Điểm trường
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-700 font-medium block">Chỉ số Sức khỏe</span>
                <span className="text-xl font-black text-emerald-600 mt-1 block">
                  {realtime?.overallHealthScore ?? 0}/100
                </span>
                <span className="text-[11px] text-slate-700 font-semibold mt-0.5 block">
                  Toàn hệ thống
                </span>
              </div>
            </div>

            {/* Point breakdown checklist */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chi tiết tình hình từng điểm trường trong ngày
              </h4>
              <div className="space-y-3">
                {realtime?.pointStatuses?.map((pt: any) => (
                  <div
                    key={pt.schoolPointId}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {pt.schoolPointName}
                        <span className="text-xs font-normal text-slate-700">
                          ({pt.distanceKm === 0 ? "Trung tâm" : `${pt.distanceKm} km`})
                        </span>
                      </h5>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        {pt.issues?.map((issue: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200"
                          >
                            ⚠️ {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-bold text-slate-700">Chuyên cần: </span>
                      <span className="text-xs font-black text-indigo-600">{pt.attendanceRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Alerts Sidebar */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Sự vụ Cần Xử lý Ngay ({earlyWarning?.criticalCount || 0})
            </h3>

            <div className="space-y-3">
              {earlyWarning?.allAlerts
                ?.filter((a: any) => a.severity === "CRITICAL" || a.severity === "HIGH")
                ?.map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-rose-900 leading-snug">
                        {alert.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white uppercase">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{alert.description}</p>
                    {alert.suggestedAction && (
                      <p className="text-[11px] text-indigo-900 bg-indigo-50 p-2 rounded-lg font-medium border border-indigo-100">
                        💡 <strong>Gợi ý AI:</strong> {alert.suggestedAction}
                      </p>
                    )}
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                      >
                        Đã tiếp nhận
                      </button>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      >
                        Đóng sự vụ
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COORDINATION & DISPATCH */}
      {activeTab === AiTaskGroup.COORDINATION_DISPATCH && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatch Sub-module 1: Substitute Teacher Allocation */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Điều phối Dạy thay Tối ưu (Trọng số Khoảng cách Km)
                </h3>
                <p className="text-xs text-slate-700">
                  Tự động tìm kiếm giáo viên cùng chuyên môn, tối ưu lịch trống & km đèo dốc
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giáo viên vắng / cần dạy thay
                </label>
                <select
                  value={selectedAbsentTeacherId}
                  onChange={(e) => setSelectedAbsentTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {snapshot?.teachers?.map((t: any) => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.specialty}) - {t.schoolPointName || "Điểm trung tâm"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiết dạy</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5].map((p) => (
                    <option key={p} value={p}>
                      Tiết {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleRunSubstituteDispatch}
              disabled={analyzingSubstitute}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {analyzingSubstitute ? "Đang tính toán..." : "Phân tích Ứng viên Tối ưu nhất"}
            </button>

            {substituteResult && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[11px] font-extrabold uppercase text-indigo-700 block">
                    ⭐ ĐỀ XUẤT HÀNG ĐẦU CỦA AI
                  </span>
                  <p className="text-sm font-bold text-indigo-950 mt-1">
                    {substituteResult.optimalChoice?.teacherName} (Điểm phù hợp:{" "}
                    {substituteResult.optimalChoice?.matchScore}/100)
                  </p>
                  <p className="text-xs text-indigo-900 mt-1">
                    {substituteResult.optimalChoice?.reason}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 italic">
                    🚗 <strong>Chỉ dẫn di chuyển:</strong> {substituteResult.optimalChoice?.travelAdvice}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Các ứng viên dự phòng</h4>
                  <div className="divide-y divide-slate-100">
                    {substituteResult.recommendedCandidates?.slice(1).map((cand) => (
                      <div key={cand.teacherId} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{cand.teacherName}</p>
                          <p className="text-[11px] text-slate-700">
                            {cand.schoolPointName} ({cand.distanceKm.toFixed(1)} km) • {cand.weeklyLoad} tiết/tuần
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 rounded-md font-bold text-slate-700">
                          {cand.matchScore} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dispatch Sub-module 2: Equipment Transfer Advice */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tư vấn Điều chuyển Thiết bị Liên điểm trường
                </h3>
                <p className="text-xs text-slate-700">
                  Tối ưu sử dụng trang thiết bị dạy học giữa điểm trung tâm và điểm lẻ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại thiết bị</label>
                <select
                  value={selectedEqCategory}
                  onChange={(e) => setSelectedEqCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={EquipmentCategory.IT_COMPUTER}>Máy vi tính / Tin học</option>
                  <option value={EquipmentCategory.PROJECTOR_SCREEN}>Máy chiếu & Màn chiếu</option>
                  <option value={EquipmentCategory.LAB_PHYSICS}>Thí nghiệm Vật lý</option>
                  <option value={EquipmentCategory.LAB_CHEMISTRY}>Thí nghiệm Hóa học</option>
                  <option value={EquipmentCategory.LAB_BIOLOGY}>Thí nghiệm Sinh học</option>
                  <option value={EquipmentCategory.SPORTS}>Dụng cụ Thể thao</option>
                  <option value={EquipmentCategory.MUSIC_ARTS}>Nhạc cụ & Mỹ thuật</option>
                  <option value={EquipmentCategory.GENERAL}>Thiết bị dùng chung</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Điểm nhận</label>
                <select
                  value={targetEqPointId}
                  onChange={(e) => setTargetEqPointId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  {snapshot?.schoolPoints?.map((sp: any) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng cần</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={neededEqQty}
                  onChange={(e) => setNeededEqQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleRunEquipmentTransfer}
              disabled={analyzingEq}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {analyzingEq ? "Đang quét kho..." : "Tìm Điểm trường Nguồn & Đề xuất Lộ trình"}
            </button>

            {eqAdviceResult && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-950">
                    {eqAdviceResult.recommendationText}
                  </p>
                  <div className="mt-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      Các bước thực hiện bàn giao:
                    </span>
                    {eqAdviceResult.transferSteps?.map((step, i) => (
                      <p key={i} className="text-xs text-slate-600 leading-relaxed">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DECISION SUPPORT STUDIO */}
      {activeTab === AiTaskGroup.DECISION_SUPPORT && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              Studio Tư vấn Ra quyết định (Khung 3 Phương án & Căn cứ Pháp lý)
            </h3>
            <p className="text-xs text-slate-700">
              Nhập tình huống quản trị cần giải quyết (Ví dụ: &ldquo;Vận động học sinh vắng học tại Điểm Bản Mó&rdquo;, &ldquo;Thiếu giáo viên Tiếng Anh tại Phia Xam&rdquo;, &ldquo;Tổ chức bán trú mùa mưa lũ&rdquo;).
            </p>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={decisionQuery}
              onChange={(e) => setDecisionQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRunDecision()}
              placeholder="Nhập tình huống hoặc câu hỏi điều hành cần tư vấn..."
              className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleRunDecision}
              disabled={analyzingDecision}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              {analyzingDecision ? "Đang phân tích..." : "Phân tích 3 Phương án"}
            </button>
          </div>

          {decisionResult && (
            <div className="space-y-6 pt-4 border-t border-slate-100">
              {/* Executive summary */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-xs font-bold text-indigo-900 block">TÓM TẮT ĐIỀU HÀNH</span>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {decisionResult.executiveSummary}
                </p>
              </div>

              {/* 3 Options Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {decisionResult.options?.map((opt) => (
                  <div
                    key={opt.optionNumber}
                    className={`rounded-2xl p-5 border flex flex-col justify-between ${
                      opt.optionNumber === decisionResult.recommendedOptionNumber
                        ? "bg-indigo-50/30 border-indigo-300 ring-2 ring-indigo-500/30 shadow-md"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                          Điểm: {opt.score}/100
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            opt.riskLevel === "THẤP"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          Rủi ro: {opt.riskLevel}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{opt.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-emerald-700 block">Ưu điểm:</span>
                        <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                          {opt.pros?.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <span className="text-[11px] font-bold text-rose-700 block">Nhược điểm:</span>
                        <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5">
                          {opt.cons?.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-700 font-semibold">
                      Khả thi: <strong>{opt.feasibility}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legal grounds & Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Căn cứ Pháp lý & Điều lệ (Thông tư BGDĐT)
                  </h4>
                  <div className="space-y-2">
                    {decisionResult.legalGrounds?.map((lg, i) => (
                      <div key={i} className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-800">{lg.code}</p>
                        <p className="text-slate-600">{lg.relevantArticle}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Lộ trình Triển khai 3 Giai đoạn
                  </h4>
                  <div className="space-y-2">
                    {decisionResult.roadmap?.map((rm, i) => (
                      <div key={i} className="text-xs">
                        <p className="font-bold text-slate-800">
                          {rm.phase} ({rm.timeline})
                        </p>
                        <p className="text-slate-600">{rm.tasks.join("; ")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLAN & KPI PROGRESS */}
      {activeTab === AiTaskGroup.PLAN_PROGRESS && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              Tiến độ Kế hoạch & Duyệt Giáo án theo Tổ chuyên môn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {planProgress?.delayedSubjectGroups?.map((grp: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{grp.subjectGroupName}</h4>
                    <span
                      className={`text-xs font-black ${
                        grp.submissionRate >= 90 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {grp.submissionRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${grp.submissionRate >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${grp.submissionRate}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-700 block">
                    {grp.delayedCount > 0
                      ? `⚠️ ${grp.delayedCount} giáo viên chậm nộp`
                      : "100% nộp đúng hạn"}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Ý kiến Cố vấn của Trợ lý AI</h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {planProgress?.summaryAdvice}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Mốc Nhiệm vụ Trọng tâm Năm học
            </h3>
            <div className="space-y-3">
              {planProgress?.criticalMilestones?.map((ms: any, i: number) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{ms.title}</p>
                  <p className="text-slate-600">{ms.actionRequired}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCS & PERIODIC REPORTS */}
      {activeTab === AiTaskGroup.DOCS_PERIODIC_REPORTS && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-600" />
              Công văn & Chỉ đạo Khẩn ({docs?.urgentDispatches?.length || 0})
            </h3>
            <div className="space-y-3">
              {docs?.urgentDispatches?.map((doc: any, i: number) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-mono text-[10px] text-slate-700 font-bold">{doc.docNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">
                      {doc.urgency}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 leading-snug">{doc.title}</p>
                  <p className="text-indigo-900 bg-indigo-50/60 p-2 rounded-lg font-medium">
                    ⚡ {doc.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Tổng hợp Báo cáo Điều hành Định kỳ</h3>
              <div className="flex items-center gap-2">
                {(["DAILY", "WEEKLY", "MONTHLY", "HK1"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleGenerateReport(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      reportPeriod === p
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {p === "DAILY" ? "Ngày" : p === "WEEKLY" ? "Tuần" : p === "MONTHLY" ? "Tháng" : "Học kỳ 1"}
                  </button>
                ))}
              </div>
            </div>

            {currentReport && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 max-h-[500px] overflow-y-auto">
                  {currentReport.markdownReport}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: EARLY WARNING RADAR */}
      {activeTab === AiTaskGroup.EARLY_WARNING && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-rose-600" />
              Rada Học sinh Nguy cơ Bỏ học & Chuyên cần Yếu
            </h3>
            <div className="space-y-3">
              {earlyWarning?.highRiskStudents?.map((st: any) => (
                <div key={st.studentId} className="p-4 rounded-2xl bg-rose-50/30 border border-rose-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{st.studentName} ({st.className})</p>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      Vắng {st.absentDays} buổi
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{st.schoolPointName}</p>
                  <p className="text-xs font-semibold text-rose-900">⚠️ {st.riskCategory}</p>
                  <p className="text-xs text-indigo-900 bg-indigo-50 p-2 rounded-lg">
                    💡 <strong>Đề xuất:</strong> {st.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Rada Thiếu Giáo viên Cục bộ theo Điểm trường
            </h3>
            <div className="space-y-3">
              {earlyWarning?.teacherShortages?.map((ts: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900">
                    {ts.schoolPointName}: {ts.subjectName}
                  </h4>
                  <p className="text-xs text-amber-900 font-medium">Lý do: {ts.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COMMUNICATION & FEEDBACK */}
      {activeTab === AiTaskGroup.COMMUNICATION_FEEDBACK && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parent Feedback Synthesis */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Tổng hợp Ý kiến & Phản ánh Phụ huynh 4 Điểm trường
            </h3>

            <div className="space-y-3">
              {parentFeedback?.keyTopics?.map((top: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{top.topicName}</h4>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                      {top.occurrences} ý kiến
                    </span>
                  </div>
                  <p className="text-slate-600 italic">&ldquo;{top.sampleQuotes?.[0]}&rdquo;</p>
                  <p className="text-indigo-900 bg-indigo-50 p-2 rounded-lg font-medium">
                    💡 <strong>Hướng xử lý:</strong> {top.suggestedResolution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcement Drafter */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Trợ lý Soạn thảo Thông báo & Chỉ đạo Đa kênh
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề thông báo</label>
                <input
                  type="text"
                  value={announcementTopic}
                  onChange={(e) => setAnnouncementTopic(e.target.value)}
                  placeholder="Ví dụ: Tăng cường an toàn mùa mưa lũ và chế độ ăn trưa bán trú..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đối tượng nhận</label>
                <select
                  value={announcementAudience}
                  onChange={(e) => setAnnouncementAudience(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ALL_STAFF">Hội đồng Sư phạm Toàn trường</option>
                  <option value="SATELLITE_POINTS">3 Điểm trường Lẻ (Bản Mó, Bản Pún, Phia Xam)</option>
                  <option value="TEACHERS">Toàn thể Giáo viên</option>
                  <option value="PARENTS">Toàn thể Phụ huynh Học sinh</option>
                </select>
              </div>

              <button
                onClick={handleRunDraftAnnouncement}
                disabled={draftingAnnouncement}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {draftingAnnouncement ? "Đang soạn thảo..." : "Dự thảo Công văn & Bản tin Zalo"}
              </button>

              {announcementResult && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                    {announcementResult.officialAnnouncementBody}
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs">
                    <span className="font-bold text-indigo-950 block">Tin nhắn Zalo/SMS tóm tắt:</span>
                    <p className="text-indigo-900 mt-1">{announcementResult.zaloSmsSummary}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campus Point AI Deep Detail Modal */}
      <CampusDetailModal
        isOpen={!!detailPoint}
        onClose={() => setDetailPoint(null)}
        pointStatus={detailPoint}
        pointSummary={
          detailPoint && snapshot?.schoolPoints
            ? snapshot.schoolPoints.find(
                (sp: any) =>
                  sp.id === detailPoint.schoolPointId ||
                  sp.name === detailPoint.schoolPointName
              )
            : null
        }
        teachers={snapshot?.teachers || []}
        equipment={snapshot?.equipment || []}
        alerts={earlyWarning?.alerts || []}
        onNavigateToTab={(tab, payload) => {
          setActiveTab(tab);
          if (payload?.pointId) {
            setSelectedPointId(payload.pointId);
          }
        }}
      />

      {/* Threshold Config Modal */}
      <ThresholdConfigModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentThresholds={snapshot?.thresholds || {}}
        onSaveThreshold={handleSaveThreshold}
      />
    </div>
  );
}
