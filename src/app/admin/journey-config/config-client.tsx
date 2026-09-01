"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Save,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  saveCampusConfig,
  fetchCampusConfig,
  recalculateAfterConfigChange,
} from "./actions";

interface ConfigClientProps {
  initialConfig: {
    increasingSlope: number;
    decliningSlope: number;
    volatilityMax: number;
    minPeriodsRequired: number;
  };
  schools: Array<{
    id: string;
    name: string;
    campuses: Array<{ id: string; name: string }>;
  }>;
  currentSchoolId: string;
  currentCampusId?: string;
}

export default function JourneyConfigClient({
  initialConfig,
  schools,
  currentSchoolId,
  currentCampusId,
}: ConfigClientProps) {
  const [selectedSchool, setSelectedSchool] = useState(currentSchoolId || schools[0]?.id || "");
  const [selectedCampus, setSelectedCampus] = useState(currentCampusId || "");

  const [increasingSlope, setIncreasingSlope] = useState<number>(
    initialConfig?.increasingSlope ?? 0.25
  );
  const [decliningSlope, setDecliningSlope] = useState<number>(
    initialConfig?.decliningSlope ?? -0.25
  );
  const [volatilityMax, setVolatilityMax] = useState<number>(
    initialConfig?.volatilityMax ?? 1.2
  );
  const [minPeriodsRequired, setMinPeriodsRequired] = useState<number>(
    initialConfig?.minPeriodsRequired ?? 3
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const activeCampuses =
    schools.find((s) => s.id === selectedSchool)?.campuses || [];

  const handleSchoolOrCampusChange = async (schoolId: string, campusId?: string) => {
    setSelectedSchool(schoolId);
    setSelectedCampus(campusId || "");
    setMessage(null);

    const config = await fetchCampusConfig(schoolId, campusId);
    if (config) {
      setIncreasingSlope(config.increasingSlope);
      setDecliningSlope(config.decliningSlope);
      setVolatilityMax(config.volatilityMax);
      setMinPeriodsRequired(config.minPeriodsRequired);
    }
  };

  const handleSave = async (andRecalculate = false) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await saveCampusConfig({
        schoolId: selectedSchool,
        campusId: selectedCampus || undefined,
        params: {
          increasingSlope,
          decliningSlope,
          volatilityMax,
          minPeriodsRequired,
        },
      });

      if (!res.success) {
        setMessage({ text: res.error || "Lỗi khi lưu cấu hình.", type: "error" });
        return;
      }

      if (andRecalculate) {
        setIsRecalculating(true);
        const recalcRes = await recalculateAfterConfigChange(
          selectedSchool,
          selectedCampus || undefined
        );
        if (recalcRes.success) {
          setMessage({
            text: `Đã lưu cấu hình và tính toán lại thành công cho ${recalcRes.result?.totalStudents || 0} học sinh!`,
            type: "success",
          });
        } else {
          setMessage({
            text: "Đã lưu cấu hình nhưng gặp lỗi khi tính lại toàn trường.",
            type: "error",
          });
        }
      } else {
        setMessage({ text: "Đã cập nhật cấu hình thành công!", type: "success" });
      }
    } finally {
      setIsSaving(false);
      setIsRecalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/journey-overview"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Tổng quan Hành trình
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Sliders className="w-4 h-4" /> Tham số Hồi quy & Phân loại Toán học
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Cấu Hình Ngưỡng Hành Trình Học Sinh
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tùy biến các hệ số góc và mức độ biến động tối đa của mô hình Ordinary Least Squares (OLS) theo từng cơ sở trường học.
          </p>
        </div>

        {/* Scope Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Trường học (School)
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => handleSchoolOrCampusChange(e.target.value, "")}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Cơ sở / Phân hiệu (Campus)
            </label>
            <select
              value={selectedCampus}
              onChange={(e) => handleSchoolOrCampusChange(selectedSchool, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Cấu hình chung toàn trường (Mặc định)</option>
              {activeCampuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border animate-in fade-in ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-300 border-rose-500/30"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* 4 Form Inputs with Real-time Explanations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Increasing Slope */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Ngưỡng Tăng Trưởng (Slope)
              </span>
              <span className="text-xs font-mono text-slate-500">increasingSlope</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.05"
                value={increasingSlope}
                onChange={(e) => setIncreasingSlope(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-sm font-semibold text-slate-300">đ/kỳ</span>
            </div>
            <p className="text-xs text-slate-400">
              Học sinh có hệ số góc hồi quy $m \ge$ giá trị này (và residuals $\le$ ngưỡng biến động) được xếp vào diện <strong>TĂNG TRƯỞNG (IMPROVING)</strong>.
            </p>
          </div>

          {/* Declining Slope */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> Ngưỡng Sa Sút (Slope)
              </span>
              <span className="text-xs font-mono text-slate-500">decliningSlope</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.05"
                value={decliningSlope}
                onChange={(e) => setDecliningSlope(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-sm font-semibold text-slate-300">đ/kỳ</span>
            </div>
            <p className="text-xs text-slate-400">
              Học sinh có hệ số góc hồi quy $m \le$ giá trị này (ví dụ: -0.25đ/kỳ) sẽ được phân loại là <strong>SA SÚT (DECLINING)</strong> và tự động gửi cảnh báo AI Radar.
            </p>
          </div>

          {/* Max Volatility */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Độ Biến Động Tối Đa (Residual SD)
              </span>
              <span className="text-xs font-mono text-slate-500">volatilityMax</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={volatilityMax}
                onChange={(e) => setVolatilityMax(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold text-slate-300">điểm</span>
            </div>
            <p className="text-xs text-slate-400">
              Độ lệch chuẩn phần dư (Residual SD) vượt quá ngưỡng này phản ánh điểm số học sinh trồi sụt bất thường, phân loại <strong>BẤT ỔN (VOLATILE)</strong>.
            </p>
          </div>

          {/* Minimum Required Periods */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-blue-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Số Kỳ Tối Thiểu Để Hồi Quy
              </span>
              <span className="text-xs font-mono text-slate-500">minPeriodsRequired</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="1"
                min="2"
                max="10"
                value={minPeriodsRequired}
                onChange={(e) => setMinPeriodsRequired(parseInt(e.target.value, 10) || 3)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-slate-300">kỳ thi</span>
            </div>
            <p className="text-xs text-slate-400">
              Số kỳ thi cần thiết để kích hoạt thuật toán OLS Linear Regression (Khuyến nghị: 3 kỳ). Dưới ngưỡng này sẽ trả về trạng thái <em>Chưa đủ dữ liệu</em>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-800">
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving || isRecalculating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving && !isRecalculating ? "Đang lưu..." : "Lưu Cấu Hình"}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || isRecalculating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? "animate-spin" : ""}`} />
            {isRecalculating ? "Đang chạy hồi quy..." : "Lưu & Tính Lại Toàn Trường"}
          </button>
        </div>
      </div>
    </div>
  );
}
