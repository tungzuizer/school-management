"use client";

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
      // Reset briefings when date changes
      setBriefings({ MORNING: "", MIDDAY: "", EVENING: "" });
    } catch (err) {
      console.error("Failed to fetch daily summary:", err);
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
        alert("Loi tao bao cao AI: " + (result.error || "Khong xac dinh"));
      }
    } catch (err) {
      console.error("AI briefing error:", err);
      alert("Loi ket noi AI. Vui long thu lai.");
    } finally {
      setIsGenerating(false);
    }
  };

  const presentRate = stats.totalStudents > 0
    ? ((1 - stats.totalAbsent / stats.totalStudents) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Multi-Point 3-Phase Daily AI Summary</span>
            </div>
            <h1 className="text-2xl font-bold">Bao Cao Dieu Hanh Chu Ky 3 Pha AI Hieu Truong</h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              Tong hop tu dong thong tin van hanh 3 thoi diem trong ngay (Dau ca Sang - Giua ngay - Cuoi ngay) tu cac diem truong phan tan.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-xl text-sm transition shadow flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-900 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "AI dang gom du lieu diem truong..." : "Tong hop bao cao ngay"}
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker & 3-Phase Navigation Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-700">Ngay bao cao:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 3-Phase Selector */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveCyclePhase("MORNING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "MORNING"
                ? "bg-amber-500 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Pha 1: Sang (Diem danh & Day thay)
          </button>
          <button
            onClick={() => setActiveCyclePhase("MIDDAY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "MIDDAY"
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pha 2: Trua (Tien do & So dau bai)
          </button>
          <button
            onClick={() => setActiveCyclePhase("EVENING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeCyclePhase === "EVENING"
                ? "bg-emerald-700 text-white shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Pha 3: Tom tat Cuoi ngay BGH
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            <Download className="w-4 h-4" />
            Xuat PDF
          </button>
          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            <Share2 className="w-4 h-4" />
            Gui BGH & PGD
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-3 text-gray-500 text-sm">Dang tai du lieu...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Tong hoc sinh</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">{presentRate}% Hien dien toan he thong</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Hoc sinh vang mat</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.totalAbsent}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.absentWithReason} co phep / {stats.absentNoReason} chua phep
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">GV vang & Lenh day thay</span>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.teacherAbsences}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Dieu chuyen AI: {stats.substituteFulfilled}</p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Diem truong dong bo</span>
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{schoolPoints.length}/{schoolPoints.length} diem truong</p>
              <p className="text-xs text-gray-500 mt-1">Hoan tat chu ky 3 pha</p>
            </div>
          </div>

          {/* Satellite School Points Breakdown Cards */}
          {schoolPoints.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {schoolPoints.map((pt, idx) => (
                <div key={idx} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{pt.name}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 shrink-0">
                      {pt.presentRate}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1.5">
                    <p>Khoang cach: <strong>{pt.distanceKm === 0 ? "Trung Tam (0km)" : `${pt.distanceKm} km`}</strong></p>
                    <p>Quan ly: <strong>{pt.manager}</strong></p>
                    <p>Si so: <strong>{pt.studentsCount} hoc sinh</strong></p>
                    <p className="text-amber-700 font-medium">Thoi tiet/Dia hinh: <em>{pt.weatherStatus}</em></p>
                    <p className="text-blue-700 font-medium">Day thay AI: <em>{pt.substituteNote}</em></p>
                    <p className="text-gray-500 pt-1.5 border-t border-gray-100">{pt.note}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* AI Executive Briefing Section depending on selected cycle phase */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="font-bold text-base">
              Ban Tom Tat AI Executive Briefing -{" "}
              {activeCyclePhase === "MORNING"
                ? "Pha 1: Sang (Chuyen Can & Day Thay)"
                : activeCyclePhase === "MIDDAY"
                ? "Pha 2: Giua Ngay (Tien Do Bai Hoc)"
                : "Pha 3: Bao Cao Dieu Hanh Cuoi Ngay"}
            </h2>
          </div>
          <span className="text-xs text-slate-300">Tong hop tu dong cac diem truong</span>
        </div>

        <div className="p-6">
          {briefings[activeCyclePhase] ? (
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200/80">
              {briefings[activeCyclePhase]}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Sparkles className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nhan nut &quot;Tong hop bao cao ngay&quot; de AI tao bao cao cho pha nay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
