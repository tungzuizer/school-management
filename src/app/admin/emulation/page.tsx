"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router entry point for `/admin/emulation`, linked from `src/app/admin/layout.tsx` & `src/app/admin/kpi/principal-dashboard/page.tsx`
 * 2. Public functions used: getRealtimeEmulationBoard, getEmulationClassDetail, getEmulationCampusesAndGrades
 * 3. Data structures: EmulationBoardPayload, ClassEmulationScore, CampusEmulationBenchmark, ClassEmulationDetail
 * 4. Verbatim User Instruction: "thực hiện đi" - "dựa trên điểm danh hằng ngày để đưa lên kpi trực tiếp hằng ngày và đi muộn để đánh giá thi đua của từng lớp và từng trường"
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Search,
  Sparkles,
  BellRing,
} from "lucide-react";
import {
  getRealtimeEmulationBoard,
  getEmulationClassDetail,
  getEmulationCampusesAndGrades,
  triggerEmulationEarlyWarnings,
  EmulationBoardPayload,
  ClassEmulationDetail,
} from "./actions";

export default function AdminEmulationPage() {
  const [periodType, setPeriodType] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH">("THIS_WEEK");
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [selectedCampus, setSelectedCampus] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"LEADERBOARD" | "CAMPUSES" | "WARNINGS">("LEADERBOARD");

  // Metadata
  const [campusOptions, setCampusOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [gradeOptions, setGradeOptions] = useState<number[]>([1, 2, 3, 4, 5]);

  // Data
  const [boardData, setBoardData] = useState<EmulationBoardPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modal Inspection
  const [inspectClassId, setInspectClassId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<ClassEmulationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Early Warning Dispatch
  const [dispatchingWarnings, setDispatchingWarnings] = useState<boolean>(false);
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);

  // Load Filter Options
  useEffect(() => {
    getEmulationCampusesAndGrades().then((res) => {
      setCampusOptions(res.campuses);
      if (res.grades.length > 0) setGradeOptions(res.grades);
    });
  }, []);

  // Fetch Emulation Board Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getRealtimeEmulationBoard({
        campusId: selectedCampus,
        gradeLevel: selectedGrade,
        periodType,
        date: selectedDate,
      });

      if (res.success && res.data) {
        setBoardData(res.data);
      }
    } catch (err) {
      console.error("Error loading emulation board:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCampus, selectedGrade, periodType, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch Class Detail when modal is opened
  const handleOpenDetail = async (classId: string) => {
    setInspectClassId(classId);
    setLoadingDetail(true);
    try {
      const res = await getEmulationClassDetail({
        classId,
        date: selectedDate,
        startDate: boardData?.startDate,
        endDate: boardData?.endDate,
      });
      if (res.success && res.data) {
        setClassDetail(res.data);
      }
    } catch (err) {
      console.error("Error loading class emulation detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setInspectClassId(null);
    setClassDetail(null);
  };

  // Dispatch Early Warnings to Homeroom Teachers
  const handleDispatchWarnings = async () => {
    setDispatchingWarnings(true);
    setDispatchMessage(null);
    try {
      const res = await triggerEmulationEarlyWarnings({
        campusId: selectedCampus !== "ALL" ? selectedCampus : undefined,
        periodType,
        date: selectedDate,
      });
      if (res.success) {
        setDispatchMessage(res.message);
      } else {
        setDispatchMessage(res.error || "Không thể kích hoạt cảnh báo nề nếp.");
      }
    } catch (err) {
      console.error("Error dispatching emulation early warnings:", err);
      setDispatchMessage("Lỗi kết nối khi kích hoạt cảnh báo sớm.");
    } finally {
      setDispatchingWarnings(false);
    }
  };

  // Filter classes by search query
  const filteredClasses = useMemo(() => {
    if (!boardData?.classes) return [];
    if (!searchQuery.trim()) return boardData.classes;
    const q = searchQuery.toLowerCase().trim();
    return boardData.classes.filter(
      (c) =>
        c.className.toLowerCase().includes(q) ||
        c.campusName.toLowerCase().includes(q) ||
        c.homeroomTeacherName.toLowerCase().includes(q)
    );
  }, [boardData?.classes, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Trophy className="w-3.5 h-3.5" />
                HỆ THỐNG THI ĐUA NỀ NẾP & CHUYÊN CẦN
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-3 h-3" />
                Dữ liệu Real-time 100%
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Bảng Vàng Thi Đua & Giám Sát Chuyên Cần Lớp Học
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              Cập nhật trực tiếp từ điểm danh từng tiết dạy, phân tích lượt đi muộn, vắng mặt và vi phạm nề nếp để xếp hạng thi đua công bằng giữa các lớp và phân hiệu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-300" : ""}`} />
              Làm mới
            </button>
            <Link
              href="/admin/kpi/principal-dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
            >
              Giám sát KPI BGH
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Real-time Data Source Footer Note */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-blue-200">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thang điểm: <strong>100.0 đ gốc</strong> | Đi muộn: <strong>-1 đ</strong> | Vắng CP: <strong>-0.5 đ</strong> | Vắng KP: <strong>-2 đ</strong> | Vi phạm: <strong>-5 đ</strong> | Thưởng 100% chuyên cần: <strong>+5 đ</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Attendance Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Chuyên Cần</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">
              {loading ? "..." : `${boardData?.overallAttendanceRate ?? 100}%`}
            </span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Đạt chuẩn
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng số học sinh:</span>
            <span className="font-bold text-slate-700">{boardData?.totalStudents ?? 0} em</span>
          </div>
        </div>

        {/* Metric 2: Punctuality Rate (Đi học đúng giờ) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Đúng Giờ</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">
              {loading ? "..." : `${boardData?.overallPunctualityRate ?? 100}%`}
            </span>
            <span className="text-xs text-slate-500 font-medium">Toàn mạng lưới</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Lượt đi muộn:</span>
            <span className={`font-bold ${boardData?.totalLateCount ? "text-amber-600" : "text-emerald-600"}`}>
              {boardData?.totalLateCount ?? 0} lượt
            </span>
          </div>
        </div>

        {/* Metric 3: Average Emulation Score */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm Thi Đua TB</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Trophy className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-blue-900">
              {loading ? "..." : `${boardData?.overallAvgScore ?? 100}`}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 100 đ</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tổng số lớp:</span>
            <span className="font-bold text-slate-700">{boardData?.totalClasses ?? 0} lớp</span>
          </div>
        </div>

        {/* Metric 4: Warnings & Incidents */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vi Phạm & Vắng Mặt</span>
            <span className={`p-2 rounded-lg ${boardData?.totalIncidentCount ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">
              {loading ? "..." : `${(boardData?.totalAbsentCount ?? 0) + (boardData?.totalIncidentCount ?? 0)}`}
            </span>
            <span className="text-xs text-rose-600 font-semibold">Vụ việc / lượt</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Lớp cần lưu ý:</span>
            <span className="font-bold text-rose-600">{boardData?.warningClasses?.length ?? 0} lớp</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filter: Period & Scope Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Toggle Buttons */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setPeriodType("TODAY")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                periodType === "TODAY"
                  ? "bg-blue-700 text-white shadow"
                  : "text-slate-700 hover:text-blue-900"
              }`}
            >
              Hôm Nay
            </button>
            <button
              onClick={() => setPeriodType("THIS_WEEK")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                periodType === "THIS_WEEK"
                  ? "bg-blue-700 text-white shadow"
                  : "text-slate-700 hover:text-blue-900"
              }`}
            >
              Tuần Này
            </button>
            <button
              onClick={() => setPeriodType("THIS_MONTH")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                periodType === "THIS_MONTH"
                  ? "bg-blue-700 text-white shadow"
                  : "text-slate-700 hover:text-blue-900"
              }`}
            >
              Tháng Này
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-blue-700" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Campus Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả Điểm trường ({campusOptions.length})</option>
              {campusOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
              className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={0}>Tất cả các Khối</option>
              {gradeOptions.map((g) => (
                <option key={g} value={g}>
                  Khối {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Filter: Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên lớp, GVCN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 4. Top Podium: 3 Lớp Dẫn Đầu Thi Đua (Gold, Silver, Bronze) */}
      {boardData?.topPodiumClasses && boardData.topPodiumClasses.length > 0 && !searchQuery && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Vinh Danh Top 3 Lớp Dẫn Đầu Thi Đua ({periodType === "TODAY" ? "Hôm nay" : periodType === "THIS_WEEK" ? "Tuần này" : "Tháng này"})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boardData.topPodiumClasses.map((topClass, idx) => {
              const isGold = idx === 0;
              const isSilver = idx === 1;

              return (
                <div
                  key={topClass.classId}
                  className={`rounded-2xl p-5 border relative overflow-hidden transition-all hover:shadow-md ${
                    isGold
                      ? "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white border-amber-300 ring-2 ring-amber-400/30"
                      : isSilver
                      ? "bg-gradient-to-b from-slate-200/40 via-slate-100/20 to-white border-slate-300"
                      : "bg-gradient-to-b from-amber-700/10 via-amber-700/5 to-white border-amber-600/30"
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                        isGold
                          ? "bg-amber-500 text-white shadow-sm"
                          : isSilver
                          ? "bg-slate-600 text-white shadow-sm"
                          : "bg-amber-800 text-white shadow-sm"
                      }`}
                    >
                      {isGold ? <Trophy className="w-3.5 h-3.5" /> : isSilver ? <Medal className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
                      HẠNG #{idx + 1} TOÀN TRƯỜNG
                    </span>

                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Khối {topClass.gradeLevel} (Hạng #{topClass.rankInGrade})
                    </span>
                  </div>

                  {/* Class Info */}
                  <div className="mt-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Lớp {topClass.className}
                      {topClass.bonusPoints > 0 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          +5đ Chuyên cần 100%
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">{topClass.campusName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      GVCN: <strong className="text-slate-800">{topClass.homeroomTeacherName}</strong>
                    </p>
                  </div>

                  {/* Metrics Mini-Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-white/80 border border-slate-100 text-center">
                    <div>
                      <span className="block text-[11px] text-slate-500">Điểm thi đua</span>
                      <span className="text-base font-black text-blue-900">{topClass.emulationScore}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Chuyên cần</span>
                      <span className="text-base font-black text-emerald-700">{topClass.attendanceRate}%</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">Đi muộn</span>
                      <span className={`text-base font-black ${topClass.lateCount > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                        {topClass.lateCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handleOpenDetail(topClass.classId)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem chi tiết nề nếp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Main Content Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 pt-3 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setActiveTab("LEADERBOARD")}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "LEADERBOARD"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Bảng Xếp Hạng Thi Đua ({filteredClasses.length} Lớp)
          </button>

          <button
            onClick={() => setActiveTab("CAMPUSES")}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "CAMPUSES"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            So Sánh Phân Hiệu & Điểm Trường ({boardData?.campusBenchmarks?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab("WARNINGS")}
            className={`pb-3 text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "WARNINGS"
                ? "border-rose-600 text-rose-700"
                : "border-transparent text-slate-500 hover:text-rose-700"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Cảnh Báo Nề Nếp & Đi Muộn ({boardData?.warningClasses?.length ?? 0})
          </button>
        </div>

        {/* Tab 1: Leaderboard Table */}
        {activeTab === "LEADERBOARD" && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-extrabold uppercase text-[11px]">
                    <th className="py-3 px-3 text-center w-14">Hạng</th>
                    <th className="py-3 px-4">Lớp & Điểm Trường</th>
                    <th className="py-3 px-4">Giáo Viên Chủ Nhiệm</th>
                    <th className="py-3 px-3 text-center">Sĩ Số</th>
                    <th className="py-3 px-3 text-center">Có Mặt</th>
                    <th className="py-3 px-3 text-center">Đi Muộn</th>
                    <th className="py-3 px-3 text-center">Vắng (CP/KP)</th>
                    <th className="py-3 px-3 text-center">Vi Phạm</th>
                    <th className="py-3 px-4 text-center">Chuyên Cần</th>
                    <th className="py-3 px-4 text-center">Điểm Thi Đua</th>
                    <th className="py-3 px-4 text-center">Xếp Loại</th>
                    <th className="py-3 px-3 text-center w-24">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Đang tổng hợp dữ liệu thi đua nề nếp...
                      </td>
                    </tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500">
                        Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((item) => {
                      const isTop3 = item.rank <= 3;

                      return (
                        <tr
                          key={item.classId}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            isTop3 ? "bg-amber-50/20 font-medium" : ""
                          }`}
                        >
                          {/* Rank Column */}
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                                item.rank === 1
                                  ? "bg-amber-400 text-amber-950 shadow-sm"
                                  : item.rank === 2
                                  ? "bg-slate-200 text-slate-800 shadow-sm"
                                  : item.rank === 3
                                  ? "bg-amber-700 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.rank}
                            </span>
                          </td>

                          {/* Class & Campus Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-sm">{item.className}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {item.campusName} (Khối {item.gradeLevel} - #{item.rankInGrade})
                            </div>
                          </td>

                          {/* Homeroom Teacher */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            {item.homeroomTeacherName}
                          </td>

                          {/* Total Students */}
                          <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                            {item.studentCount}
                          </td>

                          {/* Present Count */}
                          <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                            {item.presentCount}
                          </td>

                          {/* Late Count */}
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                                item.lateCount > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "text-slate-400"
                              }`}
                            >
                              {item.lateCount}
                            </span>
                          </td>

                          {/* Absent Count (Excused / Unexcused) */}
                          <td className="py-3.5 px-3 text-center">
                            {item.absentExcusedCount === 0 && item.absentUnexcusedCount === 0 ? (
                              <span className="text-slate-400">0</span>
                            ) : (
                              <div className="text-[11px]">
                                <span className="text-blue-700 font-semibold">{item.absentExcusedCount} CP</span>
                                {" / "}
                                <span className="text-rose-700 font-bold">{item.absentUnexcusedCount} KP</span>
                              </div>
                            )}
                          </td>

                          {/* Incidents / Violations */}
                          <td className="py-3.5 px-3 text-center">
                            {item.incidentCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs">
                                {item.incidentCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>

                          {/* Attendance Rate */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                            {item.attendanceRate}%
                          </td>

                          {/* Emulation Score */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                                item.emulationScore >= 95
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : item.emulationScore >= 85
                                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                                  : item.emulationScore >= 70
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-rose-100 text-rose-900 border border-rose-300"
                              }`}
                            >
                              {item.emulationScore}
                            </span>
                          </td>

                          {/* Tier Label */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                item.tier === "XUAT_SAC"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.tier === "TOT"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : item.tier === "KHA"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {item.tierLabel}
                            </span>
                          </td>

                          {/* Action Details Button */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              onClick={() => handleOpenDetail(item.classId)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 transition-colors"
                              title="Xem chi tiết học sinh đi muộn & vi phạm"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Campus Benchmark */}
        {activeTab === "CAMPUSES" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {boardData?.campusBenchmarks?.map((campus, idx) => (
                <div
                  key={campus.campusId}
                  className="rounded-2xl p-5 border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Phân hiệu #{idx + 1}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1">{campus.campusName}</h3>
                    </div>
                    <span className="text-2xl font-black text-blue-900">{campus.avgEmulationScore}đ</span>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Quy mô phân hiệu:</span>
                      <strong className="text-slate-800">{campus.classCount} lớp ({campus.studentCount} HS)</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tỷ lệ chuyên cần bình quân:</span>
                      <strong className="text-emerald-700 font-extrabold">{campus.attendanceRate}%</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tỷ lệ đúng giờ:</span>
                      <strong className="text-blue-700 font-extrabold">{campus.punctualityRate}%</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tổng lượt đi muộn trong kỳ:</span>
                      <strong className={campus.totalLateCount > 0 ? "text-amber-600" : "text-slate-500"}>
                        {campus.totalLateCount} lượt
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tổng lượt vắng học:</span>
                      <strong className="text-slate-800">{campus.totalAbsentCount} lượt</strong>
                    </div>
                  </div>

                  {campus.topClass && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between bg-blue-50/50 p-2.5 rounded-xl text-xs">
                      <span className="text-blue-900 font-semibold flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        Lớp dẫn đầu:
                      </span>
                      <strong className="text-slate-900 font-black">
                        Lớp {campus.topClass.name} ({campus.topClass.score}đ)
                      </strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Warnings & Interventions */}
        {activeTab === "WARNINGS" && (
          <div className="p-6">
            {boardData?.warningClasses && boardData.warningClasses.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <strong>Cảnh báo nề nếp chuyên cần:</strong> Các lớp dưới đây có từ 2 lượt đi muộn trở lên hoặc điểm thi đua nề nếp dưới 85 điểm trong chu kỳ. Ban Giám hiệu cần phối hợp với Giáo viên chủ nhiệm để chấn chỉnh kịp thời.
                    </div>
                  </div>
                  <button
                    onClick={handleDispatchWarnings}
                    disabled={dispatchingWarnings}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {dispatchingWarnings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Đang quét & gửi cảnh báo...
                      </>
                    ) : (
                      <>
                        <BellRing className="w-3.5 h-3.5" />
                        Kích hoạt Cảnh báo & Gửi GVCN
                      </>
                    )}
                  </button>
                </div>

                {dispatchMessage && (
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{dispatchMessage}</span>
                    </div>
                    <button
                      onClick={() => setDispatchMessage(null)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold ml-2 cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {boardData.warningClasses.map((wClass) => (
                    <div
                      key={wClass.classId}
                      className="p-5 rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">Lớp {wClass.className}</h4>
                          <p className="text-xs text-slate-500">{wClass.campusName} - GVCN: {wClass.homeroomTeacherName}</p>
                        </div>
                        <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-900 font-black text-sm border border-rose-200">
                          {wClass.emulationScore} đ
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200 font-bold">
                          {wClass.lateCount} lượt đi muộn
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {wClass.absentExcusedCount + wClass.absentUnexcusedCount} lượt vắng mặt
                        </span>
                        {wClass.incidentCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                            {wClass.incidentCount} vụ vi phạm
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleOpenDetail(wClass.classId)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem danh sách học sinh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Toàn trường duy trì nề nếp rất tốt!</p>
                <p className="text-xs text-slate-500 mt-1">Không có lớp nào có nguy cơ vi phạm hoặc đi muộn vượt mức cho phép.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Modal Drill-down: Chi Tiết Học Sinh Đi Muộn & Vi Phạm */}
      {inspectClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Hồ sơ nề nếp chuyên cần</span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Lớp {classDetail?.className || "..."} - {classDetail?.campusName}
                </h3>
                <p className="text-xs text-slate-500">GVCN: {classDetail?.homeroomTeacherName}</p>
              </div>

              <button
                onClick={handleCloseDetail}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải hồ sơ chuyên cần lớp...
                </div>
              ) : (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div>
                      <span className="text-[11px] text-slate-500">Điểm thi đua</span>
                      <div className="text-lg font-black text-blue-900">{classDetail?.emulationScore} đ</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Tỷ lệ chuyên cần</span>
                      <div className="text-lg font-black text-emerald-700">{classDetail?.attendanceRate}%</div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500">Số lượt đi muộn</span>
                      <div className="text-lg font-black text-amber-700">{classDetail?.lateRecords?.length || 0} lượt</div>
                    </div>
                  </div>

                  {/* Section 1: Danh sách học sinh đi muộn */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 mb-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Danh Sách Học Sinh Đi Muộn ({classDetail?.lateRecords?.length || 0})
                    </h4>

                    {classDetail?.lateRecords && classDetail.lateRecords.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-amber-50/50 text-amber-950 font-bold border-b border-amber-200/60">
                            <tr>
                              <th className="py-2.5 px-3">Mã HS</th>
                              <th className="py-2.5 px-3">Họ và Tên</th>
                              <th className="py-2.5 px-3">Ngày</th>
                              <th className="py-2.5 px-3">Tiết</th>
                              <th className="py-2.5 px-3">Lý Do / Ghi Chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classDetail.lateRecords.map((st) => (
                              <tr key={st.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600">{st.studentCode}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{st.studentName}</td>
                                <td className="py-2.5 px-3 text-slate-600">{st.date}</td>
                                <td className="py-2.5 px-3 text-slate-600">Tiết {st.period || 1}</td>
                                <td className="py-2.5 px-3 text-slate-600">{st.note || "Không có ghi chú"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Không có học sinh nào đi muộn trong chu kỳ này.</p>
                    )}
                  </div>

                  {/* Section 2: Danh sách học sinh vắng mặt */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5 mb-2">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      Danh Sách Học Sinh Vắng Mặt ({classDetail?.absentRecords?.length || 0})
                    </h4>

                    {classDetail?.absentRecords && classDetail.absentRecords.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Mã HS</th>
                              <th className="py-2.5 px-3">Họ và Tên</th>
                              <th className="py-2.5 px-3">Ngày</th>
                              <th className="py-2.5 px-3">Loại Vắng</th>
                              <th className="py-2.5 px-3">Lý Do</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {classDetail.absentRecords.map((st) => (
                              <tr key={st.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600">{st.studentCode}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">{st.studentName}</td>
                                <td className="py-2.5 px-3 text-slate-600">{st.date}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      st.status === "ABSENT_EXCUSED"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {st.statusLabel}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{st.note || "Không có"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">Lớp duy trì 100% sĩ số, không có học sinh vắng mặt.</p>
                    )}
                  </div>

                  {/* Section 3: Sự cố vi phạm nề nếp */}
                  {classDetail?.incidents && classDetail.incidents.length > 0 && (
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Sự Cố & Ghi Nhận Nề Nếp ({classDetail.incidents.length})
                      </h4>

                      <div className="space-y-2">
                        {classDetail.incidents.map((inc) => (
                          <div key={inc.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{inc.studentName} ({inc.studentCode})</span>
                              <span className="text-[11px] text-slate-500">{inc.date}</span>
                            </div>
                            <p className="text-slate-700 mt-1">{inc.description}</p>
                            {inc.reportedBy && (
                              <p className="text-[11px] text-slate-500 mt-1">Ghi nhận bởi: {inc.reportedBy}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
