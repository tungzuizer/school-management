/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App Router route `/admin/early-warnings` linked via SuperAdmin sidebar navigation (`src/components/layout/AdminSidebar.tsx`).
 * 2. Affected APIs: `getWarnings`, `resolveWarning`, `getSchoolPoints` from `src/app/admin/early-warnings/actions.ts`.
 * 3. Schema: `EarlyWarningItem`, `SchoolPointOption`, `SchoolPoint`, `Campus`, `School`.
 * 4. Verbatim User Instruction: "bạn đã sửa toàn bộ giao diện cho phù hợp với admin chưa" - Chuẩn hóa toàn bộ giao diện các trang Quản trị cho SuperAdmin.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Sparkles,
  MapPin,
  Filter,
  Radio,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { getWarnings, resolveWarning, getSchoolPoints } from "./actions";

interface EarlyWarningItem {
  id: string;
  title: string;
  category: "ATTENDANCE" | "DROPOUT_RISK" | "PROGRESS_SLIP" | "SAFETY_INCIDENT";
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  campusName: string;
  schoolPointName: string;
  className?: string;
  studentName?: string;
  description: string;
  aiAnalysis: string;
  isResolved: boolean;
  createdAt: string;
}

interface SchoolPointOption {
  id: string;
  name: string;
  distanceKm: number;
  campusName: string;
}

export default function EarlyWarningsPage() {
  const [warnings, setWarnings] = useState<EarlyWarningItem[]>([]);
  const [schoolPoints, setSchoolPoints] = useState<SchoolPointOption[]>([]);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterPoint, setFilterPoint] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      const data = await getWarnings({
        category: filterCategory,
        level: filterLevel,
        schoolPointName: filterPoint,
      });
      setWarnings(data as EarlyWarningItem[]);
    } catch (err) {
      console.error("Lỗi tải cảnh báo:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterLevel, filterPoint]);

  useEffect(() => {
    getSchoolPoints().then(setSchoolPoints).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchWarnings();
  }, [fetchWarnings]);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      const result = await resolveWarning(id);
      if (result.success) {
        setWarnings((prev) =>
          prev.map((w) => (w.id === id ? { ...w, isResolved: true } : w))
        );
      } else {
        alert("Lỗi: " + result.error);
      }
    } catch (err) {
      console.error("Lỗi xử lý cảnh báo:", err);
    } finally {
      setResolving(null);
    }
  };

  const getLevelBadge = (level: EarlyWarningItem["level"]) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-50 text-rose-800 border-rose-300 font-bold";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-300 font-bold";
      case "MEDIUM":
        return "bg-yellow-50 text-yellow-800 border-yellow-300 font-medium";
      case "LOW":
        return "bg-blue-50 text-blue-800 border-blue-300 font-medium";
    }
  };

  const getCategoryLabel = (cat: EarlyWarningItem["category"]) => {
    switch (cat) {
      case "ATTENDANCE":
        return "Chuyên cần";
      case "DROPOUT_RISK":
        return "Nguy cơ bỏ học";
      case "PROGRESS_SLIP":
        return "Tiến độ học tập";
      case "SAFETY_INCIDENT":
        return "An toàn & Thiên tai";
    }
  };

  const allWarnings = warnings;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-bold mb-3 border border-rose-500/30">
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Multi-Point AI Early Warning Radar</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              Rada Cảnh Báo Sớm Điểm Trường Vệ Tinh
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Giám sát thời gian thực rủi ro học sinh bỏ học, chia cắt địa hình, thiên tai bão lũ và tiến độ giảng dạy trên tất cả 6 trường học và điểm trường phân tán.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchWarnings();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Quét lại rada
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng cảnh báo</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{allWarnings.length}</p>
        </div>
        <div className="bg-rose-50/70 rounded-2xl p-4 sm:p-5 border border-rose-200/80 shadow-2xs">
          <p className="text-xs text-rose-700 font-bold uppercase tracking-wider">Nguy cấp (Critical)</p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-700 mt-1">
            {allWarnings.filter((w) => w.level === "CRITICAL" && !w.isResolved).length}
          </p>
        </div>
        <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs">
          <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">Chưa can thiệp</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1">
            {allWarnings.filter((w) => !w.isResolved).length}
          </p>
        </div>
        <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-2xs">
          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Đã giải quyết</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-1">
            {allWarnings.filter((w) => w.isResolved).length}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Bộ lọc Rada
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-900 font-bold">{warnings.length}</strong> cảnh báo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Điểm trường / Phân hiệu</label>
            <select
              value={filterPoint}
              onChange={(e) => setFilterPoint(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tất cả điểm trường toàn hệ thống</option>
              {schoolPoints.map((pt) => (
                <option key={pt.id} value={pt.name}>
                  {pt.name} ({pt.distanceKm}km) — {pt.campusName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Phân loại rủi ro</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="DROPOUT_RISK">Nguy cơ bỏ học</option>
              <option value="SAFETY_INCIDENT">An toàn & An ninh thiên tai</option>
              <option value="ATTENDANCE">Chuyên cần</option>
              <option value="PROGRESS_SLIP">Tiến độ học tập</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">Mức độ rủi ro</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">Nguy cấp (Critical)</option>
              <option value="HIGH">Cao (High)</option>
              <option value="MEDIUM">Trung bình (Medium)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs py-16 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Đang quét phân tích rada cảnh báo sớm...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && warnings.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs py-16 text-center text-slate-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">Không có cảnh báo rủi ro nào phù hợp bộ lọc hiện tại.</p>
          <p className="text-xs text-slate-400 mt-1">Toàn bộ các điểm trường đang vận hành an toàn và ổn định.</p>
        </div>
      )}

      {/* Warning Cards List */}
      {!loading && (
        <div className="space-y-4">
          {warnings.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border ${
                item.isResolved
                  ? "border-slate-200/80 opacity-80"
                  : "border-slate-200/90 shadow-2xs hover:border-indigo-200"
              } p-5 sm:p-6 transition`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getLevelBadge(item.level)}`}>
                      {item.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.schoolPointName && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 flex items-center gap-1 border border-indigo-100">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        {item.schoolPointName}
                      </span>
                    )}
                    {item.className && (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 font-bold text-slate-800 border border-slate-200">
                        Lớp {item.className}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {item.isResolved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đã xử lý & can thiệp
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolve(item.id)}
                      disabled={resolving === item.id}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {resolving === item.id ? "Đang xử lý..." : "Xác nhận đã xử lý"}
                    </button>
                  )}
                </div>
              </div>

              {/* AI Analysis Box */}
              {item.aiAnalysis && (
                <div className="mt-4 bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 text-xs leading-relaxed space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Phân tích AI Rada & Đề xuất phương án can thiệp khẩn cấp:</span>
                  </div>
                  <p className="text-amber-950 font-medium pl-5">{item.aiAnalysis}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
