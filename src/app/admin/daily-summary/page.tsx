"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Route: /admin/daily-summary
 * 2. Component: DailySummaryPage
 * 3. Purpose: Báo cáo Điều hành Chu kỳ 3 Pha AI (Sáng - Trưa - Tối) cho Ban Giám hiệu & 5 Điểm trường
 * 4. UI/UX: Executive Grade, Full Vietnamese Accents, Crisp Slate & Emerald Palette.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  FileText,
  Building2,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  Download,
  Share2,
  MapPin,
  Sun,
  Clock,
  Moon,
  ChevronRight,
  ShieldCheck,
  Copy,
  Check,
  Award,
} from "lucide-react";
import { getDailySummaryStats, getSchoolPointStats, generateAIBriefing } from "./actions";

interface SummaryStats {
  date: string;
  totalStudents: number;
  totalAbsent: number;
  absentWithReason: number;
  absentNoReason: number;
  teacherAbsences: number;
  substituteFulfilled: string;
}

interface SchoolPointStat {
  name: string;
  distanceKm: number;
  manager: string;
  studentsCount: number;
  presentRate: string;
  incidents: number;
  weatherStatus: string;
  substituteNote: string;
  note: string;
}

export default function DailySummaryPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeCyclePhase, setActiveCyclePhase] = useState<
    "MORNING" | "MIDDAY" | "EVENING"
  >("EVENING");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState<SummaryStats>({
    date: "",
    totalStudents: 0,
    totalAbsent: 0,
    absentWithReason: 0,
    absentNoReason: 0,
    teacherAbsences: 0,
    substituteFulfilled: "0/0 (100%)",
  });

  const [schoolPoints, setSchoolPoints] = useState<SchoolPointStat[]>([]);
  const [briefings, setBriefings] = useState<Record<string, string>>({
    MORNING: "",
    MIDDAY: "",
    EVENING: "",
  });

  // Fetch stats and school points when date changes
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsData, pointsData] = await Promise.all([
        getDailySummaryStats(selectedDate),
        getSchoolPointStats(selectedDate),
      ]);
      setStats(statsData);
      setSchoolPoints(pointsData);
      setBriefings({ MORNING: "", MIDDAY: "", EVENING: "" });
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu báo cáo điều hành:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAIBriefing(selectedDate, activeCyclePhase);
      if (result.success && result.text) {
        setBriefings((prev) => ({
          ...prev,
          [activeCyclePhase]: result.text!,
        }));
      } else {
        alert("Lỗi tạo báo cáo AI: " + (result.error || "Không xác định"));
      }
    } catch (err) {
      console.error("AI briefing error:", err);
      alert("Lỗi kết nối AI. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = briefings[activeCyclePhase];
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const presentRate = stats.totalStudents > 0
    ? ((1 - stats.totalAbsent / stats.totalStudents) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      {/* 1. Executive Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Point 3-Phase Daily AI Summary</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-400" />
              Báo Cáo Điều Hành Chu Kỳ 3 Pha AI Hiệu Trưởng
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Tổng hợp tự động thông tin vận hành 3 thời điểm trong ngày (Đầu ca Sáng – Giữa ngày – Cuối ngày) từ tất cả 5 phân hiệu & điểm trường trực thuộc.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "AI đang gom dữ liệu..." : "Tổng hợp báo cáo AI"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Date Picker & 3-Phase Cycle Selector */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-600" />
          <span className="text-xs sm:text-sm font-bold text-slate-700">Ngày báo cáo:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* 3-Phase Selector Buttons */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveCyclePhase("MORNING")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeCyclePhase === "MORNING"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Pha 1: Sáng (Điểm danh & Dạy thay)
          </button>
          <button
            onClick={() => setActiveCyclePhase("MIDDAY")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeCyclePhase === "MIDDAY"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pha 2: Trưa (Tiến độ & Sổ đầu bài)
          </button>
          <button
            onClick={() => setActiveCyclePhase("EVENING")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeCyclePhase === "EVENING"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Pha 3: Tối (Tóm tắt Cuối ngày BGH)
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            In / Xuất PDF
          </button>
        </div>
      </div>

      {/* 3. Quick Metrics Overview */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="ml-3 text-slate-600 text-sm font-medium">Đang tổng hợp dữ liệu thời gian thực...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng học sinh</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.totalStudents}</p>
              <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {presentRate}% Hiện diện toàn trường
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học sinh vắng</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">{stats.totalAbsent}</p>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                <span className="text-slate-700 font-bold">{stats.absentWithReason}</span> có phép / <span className="text-rose-600 font-bold">{stats.absentNoReason}</span> chưa phép
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">GV Vắng & Dạy thay</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.teacherAbsences}</p>
              <p className="text-xs text-emerald-700 font-semibold mt-1.5">
                Điều phối: <span className="font-bold">{stats.substituteFulfilled}</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phân hiệu đồng bộ</span>
                <Building2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">{schoolPoints.length}/{schoolPoints.length}</p>
              <p className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Điểm trường online
              </p>
            </div>
          </div>

          {/* 4. Satellite School Points Breakdown Cards */}
          {schoolPoints.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Hiện trạng Chi tiết 5 Phân hiệu & Điểm trường
                </h2>
                <span className="text-xs text-slate-500">Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {schoolPoints.map((pt, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3 hover:border-emerald-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{pt.name}</h3>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {pt.distanceKm === 0 ? "Phân hiệu Trung tâm" : `Cách ${pt.distanceKm} km`}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {pt.presentRate}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Phụ trách:</span>
                        <strong className="text-slate-800">{pt.manager}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Sĩ số:</span>
                        <strong className="text-slate-900">{pt.studentsCount} HS</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Thời tiết:</span>
                        <span className="text-slate-700 font-medium">{pt.weatherStatus}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dạy thay:</span>
                        <span className="text-blue-700 font-semibold">{pt.substituteNote}</span>
                      </div>
                    </div>

                    {pt.note && (
                      <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 italic">
                        {pt.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. AI Executive Briefing Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-sm sm:text-base text-white">
              Bản Tóm Tắt AI Executive Briefing –{" "}
              {activeCyclePhase === "MORNING"
                ? "Pha 1: Sáng (Chuyên Cần & Dạy Thay)"
                : activeCyclePhase === "MIDDAY"
                ? "Pha 2: Trưa (Tiến Độ Giảng Dạy & Sổ Đầu Bài)"
                : "Pha 3: Tối (Báo Cáo Tổng Hợp Điều Hành Cuối Ngày)"}
            </h2>
          </div>
          {briefings[activeCyclePhase] && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Đã sao chép" : "Sao chép"}
            </button>
          )}
        </div>

        <div className="p-6">
          {briefings[activeCyclePhase] ? (
            <div className="bg-slate-50 p-5 sm:p-6 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {briefings[activeCyclePhase]}
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                Chưa có bản tóm tắt AI cho pha này ({activeCyclePhase})
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Nhấn nút &quot;Tổng hợp báo cáo AI&quot; ở trên để trợ lý AI tự động gom số liệu từ 5 phân hiệu và tổng hợp nhận định cho Ban Giám hiệu.
              </p>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Đang xử lý..." : "Khởi tạo Tóm tắt Ngay"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
