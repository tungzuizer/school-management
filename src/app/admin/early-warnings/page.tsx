"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Sparkles,
  CheckCircle,
  MapPin,
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
        return "bg-red-100 text-red-800 border-red-300 font-bold";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300 font-bold";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 font-medium";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-300 font-medium";
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
        return "An toàn & An ninh thiên tai";
    }
  };

  // Use the full warnings list for stats (unfiltered count)
  const allWarnings = warnings;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-amber-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-300" />
              <span>Multi-Point AI Early Warning Radar</span>
            </div>
            <h1 className="text-2xl font-bold">Rada Cảnh Báo Sớm Điểm Trường Vệ Tinh</h1>
            <p className="text-rose-100 text-sm mt-1 max-w-2xl">
              Giám sát thời gian thực rủi ro học sinh bỏ học, chia cắt địa hình, thiên tai bão lũ và tiến độ giảng dạy trên tất cả điểm trường phân tán.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Tổng cảnh báo ghi nhận</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{allWarnings.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Mức độ Nguy cấp (Critical)</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {allWarnings.filter((w) => w.level === "CRITICAL" && !w.isResolved).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Chưa xử lý tại điểm lẻ</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {allWarnings.filter((w) => !w.isResolved).length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Đã can thiệp giải quyết</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {allWarnings.filter((w) => w.isResolved).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Điểm trường:</span>
            <select
              value={filterPoint}
              onChange={(e) => setFilterPoint(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            >
              <option value="ALL">Tất cả điểm trường</option>
              {schoolPoints.map((pt) => (
                <option key={pt.id} value={pt.name}>
                  {pt.name} ({pt.distanceKm}km)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Phân loại:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="DROPOUT_RISK">Nguy cơ bỏ học</option>
              <option value="SAFETY_INCIDENT">An toàn & An ninh thiên tai</option>
              <option value="ATTENDANCE">Chuyên cần</option>
              <option value="PROGRESS_SLIP">Tiến độ học tập</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Mức độ:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 text-sm font-medium"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">Nguy cấp (Critical)</option>
              <option value="HIGH">Cao (High)</option>
              <option value="MEDIUM">Trung bình (Medium)</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-gray-500 font-medium">
          Hiển thị {warnings.length} cảnh báo
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium">Đang tải dữ liệu cảnh báo...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && warnings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Không có cảnh báo nào phù hợp bộ lọc.</p>
        </div>
      )}

      {/* Warning Cards List */}
      {!loading && (
        <div className="space-y-4">
          {warnings.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border ${
                item.isResolved ? "border-gray-200 opacity-75" : "border-rose-200 shadow-md"
              } p-6 transition`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getLevelBadge(item.level)}`}>
                      {item.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {getCategoryLabel(item.category)}
                    </span>
                    {item.schoolPointName && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 flex items-center gap-1 border border-rose-100">
                        <MapPin className="w-3 h-3 text-rose-600" />
                        {item.schoolPointName}
                      </span>
                    )}
                    {item.className && (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 font-bold text-slate-800">
                        Lớp {item.className}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {item.isResolved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle className="w-4 h-4" />
                      Đã xử lý & can thiệp
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolve(item.id)}
                      disabled={resolving === item.id}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
                    >
                      {resolving === item.id ? "Đang xử lý..." : "Xác nhận đã xử lý"}
                    </button>
                  )}
                </div>
              </div>

              {/* AI Analysis Box */}
              {item.aiAnalysis && (
                <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 rounded-xl border border-amber-200/80 text-xs leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
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
