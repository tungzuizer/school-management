"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App Router page component src/app/admin/kpi/entry/page.tsx
 * 2. Affected API: KpiEntryPage (Client Component)
 * 3. Data schemas: KpiPeriod, KpiTarget, KpiEvidence, KpiPeriodStatus, ReportingFrequency, MeasurementDirection, KpiCategory
 * 4. Verbatim User Instruction: "cần 1 chút màu để cảnh báo kpi" -> "theo khuyến nghị của bạn" -> "thực hiện đi" (Bổ sung màu sắc cảnh báo ngữ nghĩa Traffic Light 3 cấp độ: Rose <50%, Amber 50-79%, Emerald >=80%)
 */

import { useEffect, useState } from "react";
import {
  getKpiPeriods,
  getKpiPeriodDetails,
  createKpiPeriod,
  saveKpiValues,
  addKpiEvidence,
  validateKpiPeriodWeights,
  submitKpiPeriod,
  requestUnlockKpiPeriod,
  getCampuses,
  autoCalculateActualKpiValues,
} from "../actions";
import { calculateKpiScore } from "../utils";
import { CATEGORY_LABELS, DIRECTION_LABELS, FREQUENCY_LABELS, STATUS_LABELS } from "../kpi-labels";
import { KpiPeriodStatus, ReportingFrequency, MeasurementDirection, KpiCategory } from "@prisma/client";
import {
  Calendar,
  Plus,
  Save,
  Send,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  TrendingUp,
  BarChart2,
  Info,
  Sparkles,
  Building2,
  X,
} from "lucide-react";

export default function KpiEntryPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>("ALL");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [periodDetails, setPeriodDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Form values state for actual results
  const [entryValues, setEntryValues] = useState<Record<string, { actualValue: number; notes: string }>>({});
  const [weightInfo, setWeightInfo] = useState<any>(null);

  // Modal states
  const [showCreatePeriodModal, setShowCreatePeriodModal] = useState(false);
  const [newPeriodData, setNewPeriodData] = useState({
    title: `Kỳ đánh giá KPI Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    year: new Date().getFullYear(),
    periodType: "MONTHLY" as ReportingFrequency,
    campusId: "",
  });

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedKpiValueId, setSelectedKpiValueId] = useState<string>("");
  const [selectedKpiName, setSelectedKpiName] = useState<string>("");
  const [evidenceData, setEvidenceData] = useState({ title: "", fileUrl: "", description: "" });

  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [requestedByName, setRequestedByName] = useState("Cán bộ nhập liệu KPI");

  const loadCampusesData = async () => {
    const res = await getCampuses();
    if (res.success && res.data) {
      setCampuses(res.data);
    }
  };

  const loadPeriods = async (campusFilter?: string) => {
    setLoading(true);
    const filter = campusFilter !== undefined ? campusFilter : selectedCampusFilter;
    const res = await getKpiPeriods(undefined, filter);
    if (res.success && res.data) {
      setPeriods(res.data);
      if (res.data.length > 0) {
        if (!selectedPeriodId || !res.data.some((p: any) => p.id === selectedPeriodId)) {
          setSelectedPeriodId(res.data[0].id);
        }
      } else {
        setSelectedPeriodId("");
        setPeriodDetails(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCampusesData();
    loadPeriods();
  }, []);

  const handleCampusFilterChange = (campusId: string) => {
    setSelectedCampusFilter(campusId);
    loadPeriods(campusId);
  };

  const loadPeriodDetails = async (id: string) => {
    if (!id) return;
    setLoading(true);
    const res = await getKpiPeriodDetails(id);
    if (res.success && res.data) {
      setPeriodDetails(res.data);

      // Initialize form entries from DB values or default targets
      const initialMap: Record<string, { actualValue: number; notes: string }> = {};
      res.data.targets.forEach((t: any) => {
        const valObj = res.data.values.find((v: any) => v.kpiId === t.kpiId);
        initialMap[t.kpiId] = {
          actualValue: valObj ? valObj.actualValue : t.kpi.baselineValue ?? 0,
          notes: valObj ? valObj.notes || "" : "",
        };
      });
      setEntryValues(initialMap);

      // Validate total weights
      const wRes = await validateKpiPeriodWeights(id);
      if (wRes.success) {
        setWeightInfo(wRes);
      }
    } else {
      setMessage({ type: "error", text: res.error || "Không thể tải chi tiết kỳ KPI." });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodDetails(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodData.title) return;

    setSaving(true);
    const res = await createKpiPeriod(
      newPeriodData.title,
      newPeriodData.year,
      newPeriodData.periodType,
      newPeriodData.campusId || undefined
    );
    if (res.success && res.data) {
      setMessage({ type: "success", text: "Tạo kỳ đánh giá KPI thành công!" });
      setShowCreatePeriodModal(false);
      await loadPeriods();
      setSelectedPeriodId(res.data.id);
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi tạo kỳ đánh giá." });
    }
    setSaving(false);
  };

  const handleAutoCalculate = async () => {
    if (!selectedPeriodId) return;
    setSaving(true);
    const res = await autoCalculateActualKpiValues(selectedPeriodId);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã tự động tính toán KPI từ dữ liệu thực tế thành công!" });
      await loadPeriodDetails(selectedPeriodId);
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi tự động tính toán KPI." });
    }
    setSaving(false);
  };

  const handleValueChange = (kpiId: string, field: "actualValue" | "notes", val: any) => {
    setEntryValues((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [field]: field === "actualValue" ? parseFloat(val) || 0 : val,
      },
    }));
  };

  const handleSaveDraft = async () => {
    if (!selectedPeriodId || !periodDetails) return;
    setSaving(true);
    const items = Object.entries(entryValues).map(([kpiId, val]) => ({
      kpiId,
      actualValue: val.actualValue,
      notes: val.notes,
    }));

    const res = await saveKpiValues(selectedPeriodId, items);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã lưu nháp kết quả thành công!" });
      await loadPeriodDetails(selectedPeriodId);
    } else {
      setMessage({ type: "error", text: res.error || "Không thể lưu kết quả KPI." });
    }
    setSaving(false);
  };

  const handleSubmitForApproval = async () => {
    if (!selectedPeriodId) return;
    setSaving(true);

    const items = Object.entries(entryValues).map(([kpiId, val]) => ({
      kpiId,
      actualValue: val.actualValue,
      notes: val.notes,
    }));
    await saveKpiValues(selectedPeriodId, items);

    const res = await submitKpiPeriod(selectedPeriodId, "Cán bộ nhập liệu", "Hoàn thành cập nhật kết quả KPI");
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã gửi kỳ KPI lên Phân hiệu thẩm định!" });
      await loadPeriodDetails(selectedPeriodId);
      await loadPeriods();
    } else {
      setMessage({ type: "error", text: res.error || "Không thể gửi duyệt KPI." });
    }
    setSaving(false);
  };

  const handleOpenEvidenceModal = (kpiId: string, kpiName: string) => {
    const valObj = periodDetails?.values?.find((v: any) => v.kpiId === kpiId);
    if (!valObj) {
      setMessage({ type: "warning", text: "Vui lòng bấm 'Lưu Nháp' trước khi đính kèm minh chứng!" });
      return;
    }
    setSelectedKpiValueId(valObj.id);
    setSelectedKpiName(kpiName);
    setEvidenceData({ title: "", fileUrl: "", description: "" });
    setShowEvidenceModal(true);
  };

  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpiValueId || !evidenceData.title) return;

    const res = await addKpiEvidence(
      selectedKpiValueId,
      evidenceData.title,
      evidenceData.fileUrl,
      evidenceData.description
    );

    if (res.success) {
      setMessage({ type: "success", text: "Đính kèm minh chứng thành công!" });
      setShowEvidenceModal(false);
      await loadPeriodDetails(selectedPeriodId);
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi đính kèm minh chứng." });
    }
  };

  const handleRequestUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId || !unlockReason) return;

    setSaving(true);
    const res = await requestUnlockKpiPeriod(selectedPeriodId, requestedByName, unlockReason);
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Đã gửi yêu cầu mở khóa!" });
      setShowUnlockModal(false);
      await loadPeriodDetails(selectedPeriodId);
      await loadPeriods();
    } else {
      setMessage({ type: "error", text: res.error || "Lỗi gửi yêu cầu mở khóa." });
    }
    setSaving(false);
  };

  // Calculate live preview overall score
  const calculateLiveOverallScore = () => {
    if (!periodDetails) return 0;
    let total = 0;
    periodDetails.targets.forEach((t: any) => {
      const entry = entryValues[t.kpiId];
      const actual = entry ? entry.actualValue : 0;
      const score = calculateKpiScore(actual, t.targetValue, t.weight, t.kpi.direction);
      total += score.weightedScore;
    });
    return Number(total.toFixed(2));
  };

  const isLocked = periodDetails?.status === KpiPeriodStatus.APPROVED;
  const isReadOnly =
    isLocked ||
    periodDetails?.status === KpiPeriodStatus.SUBMITTED ||
    periodDetails?.status === KpiPeriodStatus.CAMPUS_CHECKED ||
    periodDetails?.status === KpiPeriodStatus.VP_REVIEWED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-slate-800" />
            <h1 className="text-2xl font-bold text-slate-800">Cập Nhật Kết Quả KPI Toàn Trường</h1>
          </div>
          <p className="text-sm text-slate-500">
            Nhập kết quả thực tế, hệ thống tự động tính % hoàn thành & điểm số có trọng số, kèm minh chứng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreatePeriodModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 shadow-sm transition text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            Tạo Kỳ Đánh Giá Mới
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : message.type === "warning"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : message.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-semibold cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Period Selection & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-600">Phân hiệu:</span>
              <select
                value={selectedCampusFilter}
                onChange={(e) => handleCampusFilterChange(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white min-w-[200px]"
              >
                <option value="ALL">Tất cả Phân hiệu</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-600">Kỳ Đánh Giá:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="p-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white min-w-[280px]"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.year}) - {STATUS_LABELS[p.status as KpiPeriodStatus]?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {periodDetails && (
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                  STATUS_LABELS[periodDetails.status as KpiPeriodStatus]?.class
                }`}
              >
                {STATUS_LABELS[periodDetails.status as KpiPeriodStatus]?.label}
              </span>

              {periodDetails.campusId && (
                <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {campuses.find((c) => c.id === periodDetails.campusId)?.name || "Cơ sở phân hiệu"}
                </span>
              )}

              {isLocked ? (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-600" />
                  Yêu cầu Mở Khóa
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAutoCalculate}
                    disabled={saving || isReadOnly}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
                    title="Tự động truy xuất và tổng hợp số liệu thực tế từ CSDL phân hiệu"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                    Tự động tính từ CSDL thực tế
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || isReadOnly}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    Lưu Nháp
                  </button>
                  <button
                    onClick={handleSubmitForApproval}
                    disabled={saving || isReadOnly || (weightInfo && !weightInfo.isValid)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 disabled:opacity-50 transition shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-300" />
                    Gửi Phê Duyệt
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Indicators & Score Overview */}
        {periodDetails && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Tổng điểm KPI Dự kiến</div>
              <div className="text-3xl font-mono font-extrabold text-white mt-1">
                {calculateLiveOverallScore()} <span className="text-lg text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Tính theo tỷ lệ trọng số 100%</div>
            </div>

            <div className={`p-5 rounded-2xl border ${
              weightInfo?.isValid
                ? "bg-slate-50 border-slate-200"
                : "bg-amber-50/70 border-amber-300"
            }`}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Trọng Số Đã Gán</div>
              <div className={`text-2xl font-mono font-extrabold mt-1 ${weightInfo?.isValid ? "text-slate-900" : "text-amber-700"}`}>
                {weightInfo?.totalWeight ?? 0}%
              </div>
              <div className="text-xs mt-1 flex items-center gap-1.5">
                {weightInfo?.isValid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                    <span className="text-emerald-700 font-medium">Đạt yêu cầu chuẩn 100%</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                    <span className="text-amber-700 font-medium">Chưa đúng 100%</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số chỉ số KPI</div>
              <div className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
                {periodDetails.targets?.length || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">Chỉ số đang theo dõi</div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái Dữ liệu</div>
              <div className="flex items-center gap-2 mt-1">
                {isLocked ? (
                  <span className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                    <Lock className="w-4 h-4 text-slate-700" /> ĐÃ KHÓA SỔ
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                    <Unlock className="w-4 h-4 text-slate-600" /> ĐANG MỞ NHẬP
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {isLocked ? "Cần trình Hiệu trưởng mở khóa" : "Có thể cập nhật số liệu"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Entry List Table */}
      {periodDetails && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-slate-700" />
              Bảng Nhập Kết Quả Thực Tế
            </h2>
            <span className="text-xs text-slate-500">
              Cập nhật thực tế &rarr; % Hoàn thành &rarr; Điểm trọng số tự động
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã & Tên KPI</th>
                  <th className="py-3.5 px-4">Nhóm chỉ số</th>
                  <th className="py-3.5 px-4 text-center">Chỉ tiêu</th>
                  <th className="py-3.5 px-4 text-center">Trọng số</th>
                  <th className="py-3.5 px-4 text-center w-36">Thực tế đạt được</th>
                  <th className="py-3.5 px-4 text-center">% Hoàn thành</th>
                  <th className="py-3.5 px-4 text-center">Điểm trọng số</th>
                  <th className="py-3.5 px-4">Ghi chú & Minh chứng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {periodDetails.targets.map((t: any) => {
                  const entry = entryValues[t.kpiId] || { actualValue: 0, notes: "" };
                  const score = calculateKpiScore(entry.actualValue, t.targetValue, t.weight, t.kpi.direction);
                  const valObj = periodDetails.values.find((v: any) => v.kpiId === t.kpiId);
                  const evidenceCount = valObj?.evidence?.length || 0;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 max-w-sm align-top">
                        <div className="font-mono text-xs font-bold text-slate-700">{t.kpi.code}</div>
                        <div className="font-bold text-slate-900 text-sm">{t.kpi.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {DIRECTION_LABELS[t.kpi.direction as MeasurementDirection]}
                        </div>
                        {t.kpi.dataSource && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-medium">
                            <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Căn cứ: {t.kpi.dataSource}</span>
                          </div>
                        )}
                        {t.kpi.formula && (
                          <div className="mt-1 text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded truncate" title={t.kpi.formula}>
                            CT: {t.kpi.formula}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                        {CATEGORY_LABELS[t.kpi.category as KpiCategory]}
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                        {t.targetValue} {t.kpi.unit}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 font-mono">
                        {t.weight}%
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="number"
                          step="any"
                          disabled={isReadOnly}
                          value={entry.actualValue}
                          onChange={(e) => handleValueChange(t.kpiId, "actualValue", e.target.value)}
                          className="w-28 text-center p-2 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:ring-2 focus:ring-slate-400 bg-white disabled:bg-slate-100 text-sm"
                        />
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-sm">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg border font-bold ${
                            score.completionRate >= 80
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : score.completionRate >= 50
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {score.completionRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold font-mono text-slate-900 text-base">
                        {score.weightedScore}
                      </td>

                      <td className="py-3.5 px-4 space-y-2">
                        <input
                          type="text"
                          disabled={isReadOnly}
                          placeholder="Ghi chú giải trình..."
                          value={entry.notes}
                          onChange={(e) => handleValueChange(t.kpiId, "notes", e.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 disabled:bg-slate-100"
                        />

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEvidenceModal(t.kpiId, t.kpi.name)}
                            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                            Đính kèm minh chứng ({evidenceCount})
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Period Modal */}
      {showCreatePeriodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Tạo Kỳ Đánh Giá KPI Mới</h2>
              <button onClick={() => setShowCreatePeriodModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên kỳ đánh giá <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPeriodData.title}
                  onChange={(e) => setNewPeriodData({ ...newPeriodData, title: e.target.value })}
                  placeholder="VD: Kỳ đánh giá KPI Học kỳ 1 (2026-2027)"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Năm</label>
                  <input
                    type="number"
                    value={newPeriodData.year}
                    onChange={(e) =>
                      setNewPeriodData({ ...newPeriodData, year: parseInt(e.target.value) || 2026 })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tần suất</label>
                  <select
                    value={newPeriodData.periodType}
                    onChange={(e) =>
                      setNewPeriodData({ ...newPeriodData, periodType: e.target.value as ReportingFrequency })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 bg-white"
                  >
                    {Object.entries(FREQUENCY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Áp dụng cho Phân hiệu / Cơ sở
                </label>
                <select
                  value={newPeriodData.campusId}
                  onChange={(e) =>
                    setNewPeriodData({ ...newPeriodData, campusId: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 bg-white"
                >
                  <option value="">Toàn trường (Tổng hợp chung)</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Phân rã kỳ đánh giá theo phân hiệu giúp hệ thống tự động tổng hợp số liệu chính xác theo cơ sở.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreatePeriodModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 text-white font-medium rounded-xl text-sm hover:bg-slate-800 shadow-sm transition cursor-pointer"
                >
                  Tạo Kỳ KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Đính Kèm Minh Chứng KPI</h2>
                <p className="text-xs text-slate-600 font-semibold">{selectedKpiName}</p>
              </div>
              <button onClick={() => setShowEvidenceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvidenceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên tài liệu / Minh chứng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={evidenceData.title}
                  onChange={(e) => setEvidenceData({ ...evidenceData, title: e.target.value })}
                  placeholder="VD: Báo cáo kết quả kiểm tra chất lượng HK1"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đường dẫn tệp (URL / Google Drive)</label>
                <input
                  type="text"
                  value={evidenceData.fileUrl}
                  onChange={(e) => setEvidenceData({ ...evidenceData, fileUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={3}
                  value={evidenceData.description}
                  onChange={(e) => setEvidenceData({ ...evidenceData, description: e.target.value })}
                  placeholder="Trích yếu nội dung minh chứng đính kèm..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-medium rounded-xl text-sm hover:bg-slate-800 shadow-sm transition cursor-pointer"
                >
                  Lưu Minh Chứng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Request Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Yêu Cầu Mở Khóa Dữ Liệu KPI</h2>
              <button onClick={() => setShowUnlockModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Kỳ KPI đã được Hiệu trưởng phê duyệt. Bạn cần gửi văn bản giải trình lý do mở khóa để chỉnh sửa lại.
            </p>

            <form onSubmit={handleRequestUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Người yêu cầu</label>
                <input
                  type="text"
                  value={requestedByName}
                  onChange={(e) => setRequestedByName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lý do yêu cầu mở khóa <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="VD: Cập nhật điều chỉnh bổ sung số liệu minh chứng theo Quyết định mới..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-slate-400"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-slate-900 text-white font-medium rounded-xl text-sm hover:bg-slate-800 shadow-sm transition cursor-pointer"
                >
                  Gửi Yêu Cầu Mở Khóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
