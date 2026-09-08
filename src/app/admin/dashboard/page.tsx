/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router Page for `/admin/dashboard` (referenced by `src/app/admin/layout.tsx`).
 * 2. Affected APIs: `src/app/admin/dashboard/page.tsx` (AdminDashboardPage default export).
 * 3. Schemas: `getAdminDashboardData`, `getNQ37DashboardSummary`, `getDashboardStats`, `getAttendanceByWeek`, `getGradesByClass`, `getClassAttendanceRanking`, `getRecentIncidents`, `getTodaySummary`, `getLessonPlanAlerts`, `getEarlyWarnings`, `getSubstituteDispatchSummary`.
 * 4. Verbatim User Instruction: "giao diện đơn sắc quá và vấn quá tệ thiếu hiệu ứng thiếu phân loại" & "tôi cần bạn xóa bỏ hết các icon và không được dùng cái màu sắc vàng và cái huy chương nó quá thiếu chuyên nghiệp".
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
import { useSession } from "next-auth/react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ClassDistributionWidget from "@/components/dashboard/ClassDistributionWidget";
import UnapprovedBanner from "@/components/ui/UnapprovedBanner";
import {
  getSchoolsList,
  getDashboardStats,
  getAttendanceByWeek,
  getGradesByClass,
  getClassAttendanceRanking,
  getRecentIncidents,
  getTodaySummary,
  getLessonPlanAlerts,
  getEarlyWarnings,
  getSubstituteDispatchSummary,
  getAdminDashboardData,
  getNQ37DashboardSummary,
} from "./actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

type SchoolItem = Awaited<ReturnType<typeof getSchoolsList>>[number];
type Stats = Awaited<ReturnType<typeof getDashboardStats>>;
type WeekData = Awaited<ReturnType<typeof getAttendanceByWeek>>;
type ClassGrade = Awaited<ReturnType<typeof getGradesByClass>>;
type ClassAttendance = Awaited<ReturnType<typeof getClassAttendanceRanking>>;
type IncidentData = Awaited<ReturnType<typeof getRecentIncidents>>;
type TodaySummary = Awaited<ReturnType<typeof getTodaySummary>>;
type LPAlertsData = Awaited<ReturnType<typeof getLessonPlanAlerts>>;
type EarlyWarningItem = Awaited<ReturnType<typeof getEarlyWarnings>>[number];
type SubstituteSummary = Awaited<ReturnType<typeof getSubstituteDispatchSummary>>;
type NQ37Summary = Awaited<ReturnType<typeof getNQ37DashboardSummary>>;

type DashboardCategory = "ALL" | "ACADEMICS" | "COMPLIANCE" | "DISCIPLINE" | "CAMPUS";

const CHART_PALETTE = ["#1e293b", "#059669", "#2563eb", "#dc2626", "#475569", "#0891b2", "#4f46e5"];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { isEasyMode } = useEasyMode();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<DashboardCategory>("ALL");

  const [stats, setStats] = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekData>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance>([]);
  const [incidents, setIncidents] = useState<IncidentData>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [lpAlerts, setLpAlerts] = useState<LPAlertsData | null>(null);
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarningItem[]>([]);
  const [substitutes, setSubstitutes] = useState<SubstituteSummary | null>(null);
  const [nq37Summary, setNq37Summary] = useState<NQ37Summary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const data = await getAdminDashboardData();
        setSchools(data.schools);
        setStats(data.stats);
        setWeekData(data.weekData);
        setClassGrades(data.classGrades);
        setClassAttendance(data.classAttendance);
        setIncidents(data.incidents);
        setToday(data.today);
        setLpAlerts(data.lpAlerts);
        setEarlyWarnings(data.earlyWarnings);
        setSubstitutes(data.substitutes);
        setNq37Summary(data.nq37Summary);
      } catch (err) {
        console.error("Failed to load initial dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleSchoolChange = async (schoolId?: string) => {
    setSelectedSchoolId(schoolId);
    setRefreshing(true);
    try {
      const data = await getAdminDashboardData(schoolId);
      setStats(data.stats);
      setWeekData(data.weekData);
      setClassGrades(data.classGrades);
      setClassAttendance(data.classAttendance);
      setIncidents(data.incidents);
      setToday(data.today);
      setLpAlerts(data.lpAlerts);
      setEarlyWarnings(data.earlyWarnings);
      setSubstitutes(data.substitutes);
      setNq37Summary(data.nq37Summary);
    } catch (err) {
      console.error("Failed to refresh school dashboard data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TableSkeleton rows={4} cols={4} />
          <TableSkeleton rows={4} cols={4} />
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isSuperAdmin =
    session?.user?.email === "superadmin@school.com" ||
    (session?.user as { role?: string })?.role === "SUPER_ADMIN";

  const activeSchoolName = selectedSchoolId
    ? schools.find((s) => s.id === selectedSchoolId)?.name || "Trường đã chọn"
    : isSuperAdmin
    ? "Toàn bộ các Trường (Hệ thống Quốc Gia)"
    : "Tất cả các cơ sở trực thuộc";

  const categories = [
    { id: "ALL" as DashboardCategory, label: "Toàn Cảnh", count: "Tổng quan" },
    { id: "ACADEMICS" as DashboardCategory, label: "Chuyên Môn & Điểm Thi", count: "OLS & Kế hoạch" },
    { id: "COMPLIANCE" as DashboardCategory, label: "Tuân Thủ NQ 37", count: "Định mức & 36T" },
    { id: "DISCIPLINE" as DashboardCategory, label: "Nề Nếp & Cảnh Báo", count: `${earlyWarnings.length} cảnh báo` },
    { id: "CAMPUS" as DashboardCategory, label: "Mạng Lưới Trường", count: `${schools.length} cơ sở` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      <UnapprovedBanner />

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND BANNER WITH REAL-TIME PULSE & CONTRAST DEPTH        */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-r from-[#090d16] via-[#0d1527] to-[#090d16] text-white p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-blue-950/90 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs">
                {isSuperAdmin ? "Hệ Thống Quốc Gia" : "Ban Giám Hiệu"}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/90 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Thời Gian Thực</span>
              </div>
              <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg">
                NQ 37/2026/NQ-CP
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {isSuperAdmin ? "Trung Tâm Điều Hành Giáo Dục Toàn Quốc" : "Bảng Điều Hành Ban Giám Hiệu Nhà Trường"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 flex-wrap">
              <span className="capitalize">{todayStr}</span>
              <span className="text-slate-600">•</span>
              <span className="text-blue-300 font-semibold">
                Phạm vi giám sát: {activeSchoolName}
              </span>
            </p>
          </div>

          {/* Quick Stat Indicators */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800/90 shrink-0 shadow-lg backdrop-blur-sm">
            <div className="text-center px-4 border-r border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-white">{(stats?.totalStudents ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Học Sinh</p>
            </div>
            <div className="text-center px-4 border-r border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-blue-400">{(stats?.totalTeachers ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Giáo Viên</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">{stats?.attendanceRate ?? 0}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Chuyên Cần</p>
            </div>
          </div>
        </div>

        {/* Quick Hub Links */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/admin/exam-analytics"
            className="p-2.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/70 rounded-xl transition text-blue-200 text-xs font-bold text-center flex items-center justify-center gap-2 group"
          >
            <span>Phân Tích Điểm OLS</span>
            <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">[→]</span>
          </Link>
          <Link
            href="/admin/nq37-compliance"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-2 group"
          >
            <span>Thẩm Định NQ 37</span>
            <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">[→]</span>
          </Link>
          <Link
            href="/admin/early-warnings"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-2 group"
          >
            <span>AI Radar Cảnh Báo</span>
            <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">[→]</span>
          </Link>
          <Link
            href="/admin/approvals"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-2 group"
          >
            <span>Duyệt Yêu Cầu ({today?.incidentsToday ?? 0})</span>
            <span className="text-[10px] font-mono opacity-60 group-hover:opacity-100">[→]</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE DOMAIN CLASSIFICATION TABS & CAMPUS SELECTOR               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Domain Classification Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Phân Loại Tác Nghiệp
            </span>
            <h2 className="text-base font-bold text-slate-900">Không Gian Làm Việc Theo Chuyên Đề</h2>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isActive ? "bg-slate-800 text-blue-300" : "bg-white text-slate-500 border border-slate-200"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Campus Filter Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Cơ sở trực thuộc:</span>
            {refreshing && (
              <span className="text-xs text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Đang làm mới...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleSchoolChange(undefined)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap border cursor-pointer ${
                selectedSchoolId === undefined
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tất Cả Các Trường ({schools.length})
            </button>

            {schools.map((sch) => {
              const isSelected = selectedSchoolId === sch.id;
              return (
                <button
                  key={sch.id}
                  onClick={() => handleSchoolChange(sch.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap border cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{sch.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isSelected ? "bg-slate-800 text-blue-300" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {sch.studentCount} HS
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KEY METRIC CARDS WITH COLORED TOP-ACCENTS & HOVER ELEVATIONS           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="Tổng Học Sinh"
          value={stats?.totalStudents ?? 0}
          accent="blue"
          subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
        />
        <MetricCard
          label="Đội Ngũ Giáo Viên"
          value={stats?.totalTeachers ?? 0}
          accent="emerald"
          subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
        />
        <MetricCard
          label="Lớp Học Đang Hoạt Động"
          value={stats?.totalClasses ?? 0}
          accent="indigo"
          subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
        />
        <MetricCard
          label="Điểm Trường / Cơ Sở"
          value={stats?.totalSchools ?? 0}
          accent="slate"
          subtext="Cơ sở liên kết"
        />
        <MetricCard
          label="Chuyên Cần (30 Ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          accent={(stats?.attendanceRate ?? 100) < 90 ? "rose" : "emerald"}
          highlight={(stats?.attendanceRate ?? 100) < 90 ? "text-rose-700" : "text-emerald-700"}
          subtext={selectedSchoolId ? "Trường đã chọn" : "Trung bình toàn trường"}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPLIANCE NGHỊ QUYẾT 37/2026/NQ-CP HUB                                */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "COMPLIANCE") && nq37Summary && nq37Summary.scorecard && (
        <div className="bg-[#090d16] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded">
                  NQ 37/2026/NQ-CP (Hiệu lực: 05/08/2026 - 30/06/2028)
                </span>
                {nq37Summary.hasCriticalViolations ? (
                  <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 text-[10px] font-bold rounded border border-rose-800">
                    Cảnh Báo Vi Phạm Tiêu Chuẩn
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded border border-emerald-800">
                    Đạt Chuẩn Định Mức & Bằng Cấp
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Thẩm Định Tuân Thủ Định Mức Lãnh Đạo & Nhân Sự Hỗ Trợ Giáo Dục
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/nq37-compliance"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Trung Tâm Thẩm Định
              </Link>
              <Link
                href="/admin/support-staff"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition"
              >
                DS Nhân Sự Hỗ Trợ
              </Link>
            </div>
          </div>

          {/* Statutory Deadlines & Compliance Score Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hạn Kiện Toàn Bộ Máy
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-100">
                {nq37Summary.deadlines.arrangementDaysLeft > 0
                  ? `Còn ${nq37Summary.deadlines.arrangementDaysLeft} ngày`
                  : "Đến hạn hoàn tất"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hạn chót: <strong className="text-slate-200">30/09/2026</strong> (Điều 8 NQ 37)
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Lộ Trình Chuẩn Hóa 36T
              </span>
              <p className="text-xl sm:text-2xl font-bold text-blue-300">
                {nq37Summary.deadlines.standardizationMonthsLeft} tháng nữa
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Thời hạn: <strong className="text-slate-200">05/08/2029</strong> (Điều 5.3.a)
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Ban Giám Hiệu
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                {nq37Summary.scorecard.leadershipAudit.principalActual} HT • {nq37Summary.scorecard.leadershipAudit.vicePrincipalActual} PHT
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Định mức: 1 HT + 1 PHT trường chính + 1 PHT/phân hiệu
              </p>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tỷ Lệ Tuân Thủ NQ 37
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-300">
                {nq37Summary.scorecard.overallScore}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {nq37Summary.scorecard.sharedStaffAudit.accountantActual +
                  nq37Summary.scorecard.sharedStaffAudit.clerkActual +
                  nq37Summary.scorecard.sharedStaffAudit.treasurerActual +
                  nq37Summary.scorecard.campusStaffAudits.reduce(
                    (acc, c) => acc + Object.values(c.actualPerRole).reduce((sum, v) => sum + v, 0),
                    0
                  )}{" "}
                vị trí hỗ trợ giáo dục
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MULTI-YEAR EXAM ANALYTICS & STUDENT TRAJECTORY PREVIEW (OLS ENGINE)   */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "ACADEMICS") && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded">
                  Khảo Sát Đa Niên Khóa (2023 - 2026)
                </span>
                <span className="px-2.5 py-0.5 bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-bold rounded">
                  Hồi Quy Tuyến Tính OLS (y = mx + b)
                </span>
                <span className="px-2.5 py-0.5 bg-slate-900 text-slate-200 text-[10px] font-bold rounded">
                  Chuẩn TT 22/2021/TT-BGDĐT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Giám Sát Chất Lượng Điểm Thi & Quỹ Đạo Phát Triển Học Sinh
              </h2>
            </div>

            <Link
              href="/admin/exam-analytics"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shrink-0 shadow-xs"
            >
              Mở Bảng Phân Tích Chuyên Sâu
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hover:border-slate-300 transition">
              <span className="text-[11px] text-slate-500 font-bold block">Điểm TB Toàn Trường</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">7.62</span>
                <span className="text-xs text-emerald-700 font-bold">+0.48</span>
              </div>
              <p className="text-[10px] text-slate-500">Tăng trưởng qua 3 năm liên tiếp</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 hover:border-emerald-300 transition">
              <span className="text-[11px] text-emerald-900 font-bold block">Tỷ Lệ Giỏi / Tốt (TT22)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-800">42.5%</span>
                <span className="text-xs text-slate-600 font-normal">(51 HS)</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium">Đạt chuẩn mũi nhọn</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1 hover:border-blue-300 transition">
              <span className="text-[11px] text-blue-900 font-bold block">Tiến Bộ Vượt Bậc (m &gt; 0)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-800">68</span>
                <span className="text-xs text-slate-600 font-normal">học sinh</span>
              </div>
              <p className="text-[10px] text-blue-700 font-medium">Độ dốc tăng trưởng dương</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1 hover:border-rose-300 transition">
              <span className="text-[11px] text-rose-900 font-bold block">Cần Can Thiệp Sớm</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-700">7</span>
                <span className="text-xs text-rose-600 font-normal">học sinh</span>
              </div>
              <p className="text-[10px] text-rose-700 font-medium">Nguy cơ sụt giảm điểm số</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REAL-TIME DAILY OPERATIONAL PULSE                                      */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "DISCIPLINE") && today && (
        <div className="bg-[#090d16] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded">
                Tác Nghiệp
              </span>
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Điểm danh & Sổ đầu bài hôm nay ({selectedSchoolId ? activeSchoolName : "Toàn hệ thống"})
              </p>
            </div>
            <span className="text-xs text-slate-300 bg-slate-900 px-3 py-1 rounded-md font-medium border border-slate-700">
              {todayStr}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-rose-400">{today.absentToday}</p>
              <p className="text-xs text-slate-200 font-bold mt-1">Vắng mặt hôm nay</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Bao gồm có phép & không phép</p>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-slate-100">{today.lateToday}</p>
              <p className="text-xs text-slate-200 font-bold mt-1">Đi muộn hôm nay</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Ghi nhận qua cổng điểm danh</p>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-blue-400">{today.incidentsToday}</p>
              <p className="text-xs text-slate-200 font-bold mt-1">Sự vụ nề nếp / Kỷ luật</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cần BGH theo dõi xử lý</p>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                {today.reportsSubmitted}/{today.totalClasses}
              </p>
              <p className="text-xs text-slate-200 font-bold mt-1">Báo cáo Sổ đầu bài</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đã nộp {today.totalClasses > 0 ? Math.round((today.reportsSubmitted / today.totalClasses) * 100) : 100}% số lớp
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. AI RADAR EARLY WARNINGS & STUDENT SAFETY HUB                           */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "DISCIPLINE") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-sm" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                AI Radar Cảnh Báo Sớm & An Toàn Học Đường
              </h2>
            </div>
            <Link
              href="/admin/early-warnings"
              className="text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              Xem tất cả cảnh báo ({earlyWarnings.length})
            </Link>
          </div>

          {earlyWarnings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">Radar An Toàn: Không Có Cảnh Báo Khẩn</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                AI chưa phát hiện bất thường nghiêm trọng về nguy cơ bỏ học, điểm rơi tự do hay vi phạm nề nếp tại các lớp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earlyWarnings.map((warning) => {
                const isCritical = warning.level === "CRITICAL";

                const badgeColor = isCritical
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : "bg-blue-100 text-blue-800 border-blue-200";

                return (
                  <div
                    key={warning.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                      isCritical ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${badgeColor}`}>
                          {warning.level}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(warning.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {warning.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-2 flex-wrap">
                        {warning.className && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                            Lớp {warning.className}
                          </span>
                        )}
                        {warning.studentName && (
                          <span className="text-slate-900 font-semibold truncate max-w-[140px]">
                            HS: {warning.studentName}
                          </span>
                        )}
                        {warning.campusName && (
                          <span className="text-slate-500 text-[11px] truncate">
                            ({warning.campusName})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                        {warning.description}
                      </p>

                      {warning.aiAnalysis && (
                        <div className="mt-3 p-2.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
                          <span className="font-bold text-blue-300 block mb-0.5 uppercase tracking-wider text-[10px]">
                            AI Đề Xuất Xử Lý:
                          </span>
                          {warning.aiAnalysis}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Danh mục: {warning.category}</span>
                      <Link
                        href="/admin/early-warnings"
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. LESSON PLAN SUPERVISION & SUBSTITUTE TEACHING DISPATCH                 */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "ACADEMICS") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-sm" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Giám Sát Kế Hoạch Bài Dạy & Dạy Thay Khẩn Cấp
              </h2>
            </div>
            <Link
              href="/admin/lesson-plans"
              className="text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              Quản lý giáo án
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Lesson Plan Deadline Alerts */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tiến Độ Nộp Kế Hoạch Bài Dạy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kỳ nộp: <span className="font-semibold text-slate-800">{lpAlerts?.periodLabel || "Kỳ hiện tại"}</span> — Hạn cuối:{" "}
                    <span className="font-semibold text-rose-700">
                      {lpAlerts?.deadline ? new Date(lpAlerts.deadline).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-[11px]">
                    Chưa nộp ({lpAlerts?.alerts.filter((a) => a.status === "NOT_SUBMITTED").length ?? 0})
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px]">
                    Nộp muộn ({lpAlerts?.alerts.filter((a) => a.status === "LATE").length ?? 0})
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px]">
                    Đúng hạn ({lpAlerts?.alerts.filter((a) => a.status === "ON_TIME").length ?? 0})
                  </span>
                </div>
              </div>

              {!lpAlerts || lpAlerts.alerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu phân công giảng dạy cho kỳ này</p>
              ) : (
                <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 uppercase sticky top-0 font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Tổ Chuyên Môn</th>
                        <th className="px-4 py-2.5">Môn Học</th>
                        <th className="px-4 py-2.5">Giáo Viên</th>
                        <th className="px-4 py-2.5 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lpAlerts.alerts.slice(0, 8).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{item.groupName}</td>
                          <td className="px-4 py-2.5 text-slate-600">{item.subjectName}</td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">{item.teacherName}</td>
                          <td className="px-4 py-2.5 text-center">
                            {item.status === "NOT_SUBMITTED" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                Chưa nộp
                              </span>
                            )}
                            {item.status === "LATE" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                Nộp muộn ({item.daysLate}d)
                              </span>
                            )}
                            {item.status === "ON_TIME" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đúng hạn
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Substitute Teaching & Emergency Dispatch Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Điều Động Dạy Thay</h3>
                    <p className="text-xs text-slate-500">Ca điều động khẩn cấp</p>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-950 border border-blue-800 text-blue-300 rounded-lg text-xs font-bold">
                    {substitutes?.pendingCount ?? 0} Chờ duyệt
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {!substitutes || substitutes.todayDispatches.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-xs font-semibold">Không có ca dạy thay phát sinh hôm nay</p>
                    </div>
                  ) : (
                    substitutes.todayDispatches.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 transition text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span>Lớp {sub.className} • Tiết {sub.period}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.status === "PENDING"
                                ? "bg-slate-200 text-slate-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {sub.status === "PENDING" ? "Chờ phân công" : "Đã duyệt"}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          GV Vắng: <strong className="text-rose-700">{sub.originalTeacher}</strong>
                          {sub.substituteTeacher && (
                            <> → Thay: <strong className="text-slate-900">{sub.substituteTeacher}</strong></>
                          )}
                        </p>
                        {sub.reason && <p className="text-[11px] text-slate-500 mt-1 italic">Lý do: {sub.reason}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link
                href="/admin/substitute-teaching"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center transition cursor-pointer text-center shadow-xs"
              >
                Vào Cổng Điều Động Dạy Thay
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. ATTENDANCE TRENDS & ACADEMIC PERFORMANCE CHARTS                        */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "DISCIPLINE") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-sm" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phân Tích Xu Hướng Chuyên Cần & Xếp Hạng Lớp Học
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Theo dõi 8 tuần gần nhất</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Attendance Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Xu Hướng Chuyên Cần Theo Tuần {selectedSchoolId ? `(${activeSchoolName})` : ""}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">8 Tuần Qua</span>
              </div>
              {isEasyMode && (
                <p className="text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>Hướng dẫn:</strong> Biểu đồ so sánh số lượt <strong className="text-emerald-700">Có mặt</strong>,{" "}
                  <strong className="text-rose-700">Vắng</strong>, và <strong className="text-slate-600">Đi trễ</strong> trong từng tuần.
                </p>
              )}
              {weekData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="present" name="Có mặt" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Vắng" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Đi trễ" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Chưa có dữ liệu điểm danh theo tuần" />
              )}
            </div>

            {/* Average Grade by Class Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Điểm Trung Bình Theo Lớp {selectedSchoolId ? `(${activeSchoolName})` : ""}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Thang Điểm 10</span>
              </div>
              {isEasyMode && (
                <p className="text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>Hướng dẫn:</strong> Điểm trung bình kết quả học tập của học sinh từng lớp. Lớp có cột càng cao biểu thị học lực trung bình càng tốt.
                </p>
              )}
              {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shortClassName" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v, _, item) => [`${v} điểm`, item?.payload?.schoolName || "ĐTB"]} />
                    <Bar dataKey="avgScore" name="Điểm trung bình" fill="#1e293b" radius={[4, 4, 0, 0]}>
                      {classGrades.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Chưa có dữ liệu điểm học tập" />
              )}
            </div>
          </div>

          {/* Class Attendance Ranking & Discipline Incident Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Class Attendance Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bảng Xếp Hạng Chuyên Cần 7 Ngày Qua</h3>
                  <p className="text-xs text-slate-500">Tỷ lệ đi học đầy đủ theo từng lớp</p>
                </div>
              </div>

              {classAttendance.length === 0 ? (
                <EmptyState message="Chưa có dữ liệu chuyên cần tuần này" />
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b text-slate-600 uppercase sticky top-0 font-bold">
                      <tr>
                        <th className="px-4 py-2.5">Thứ Hạng</th>
                        <th className="px-4 py-2.5">Lớp Học</th>
                        <th className="px-4 py-2.5">Sĩ Số</th>
                        <th className="px-4 py-2.5 text-right">Tỷ Lệ Chuyên Cần</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classAttendance.slice(0, 10).map((cls, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                idx === 0
                                  ? "bg-blue-950 text-blue-300 border border-blue-800"
                                  : idx < 3
                                  ? "bg-slate-800 text-slate-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              Hạng {idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900">
                            {cls.className}
                            {cls.schoolName && <span className="text-[10px] text-slate-400 block font-normal">{cls.schoolName}</span>}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{cls.studentCount} HS</td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] ${
                                cls.attendanceRate >= 95
                                  ? "bg-emerald-100 text-emerald-800"
                                  : cls.attendanceRate >= 85
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {cls.attendanceRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Discipline Incidents Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhật Ký Sự Vụ & Kỷ Luật Gần Đây</h3>
                  <p className="text-xs text-slate-500">Các vụ việc được ghi nhận trong trường</p>
                </div>
              </div>

              {incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-semibold text-emerald-800">Không có vi phạm kỷ luật nào gần đây</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 transition text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                          {inc.type}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(inc.date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium leading-snug">{inc.description}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                        <span>HS: <strong className="text-slate-800">{inc.studentName}</strong></span>
                        <span>•</span>
                        <span>Lớp: <strong className="text-slate-800">{inc.className}</strong></span>
                        {inc.schoolName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{inc.schoolName}</span>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 10. CLASS SIZE DISTRIBUTION & CAPACITY STRUCTURE                          */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "ACADEMICS") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-sm" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phân Bổ Sĩ Số & Cơ Cấu Lớp Học
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Theo khối & GVCN</span>
          </div>

          <ClassDistributionWidget classes={classGrades as any} />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 11. CAMPUS NETWORK & AFFILIATED SCHOOLS                                   */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "CAMPUS") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-sm" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Bản Đồ Cơ Sở & Mạng Lưới Trường Thành Viên
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{schools.length} cơ sở</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schools.map((sch) => {
              const isSelected = selectedSchoolId === sch.id;
              return (
                <div
                  key={sch.id}
                  className={`rounded-2xl p-5 border transition-all shadow-sm relative flex flex-col justify-between hover:shadow-md ${
                    isSelected
                      ? "bg-[#090d16] text-white border-blue-900 ring-2 ring-blue-600"
                      : "bg-white text-slate-900 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isSelected
                              ? "bg-blue-950 text-blue-300 border border-blue-800"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          Điểm trường / Cơ sở
                        </span>
                        <h3
                          className={`font-bold text-base mt-1.5 ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {sch.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-extrabold rounded">
                          Đang Lọc
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs mb-3.5 truncate ${
                        isSelected ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {sch.address}
                    </p>

                    <div
                      className={`grid grid-cols-3 gap-2 p-3 rounded-xl border text-center mb-3 ${
                        isSelected
                          ? "bg-slate-900/90 border-slate-800"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div>
                        <p className={`text-lg font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {sch.studentCount}
                        </p>
                        <p className={`text-[10px] font-bold uppercase ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                          Học sinh
                        </p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {sch.classCount}
                        </p>
                        <p className={`text-[10px] font-bold uppercase ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                          Lớp học
                        </p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {sch.teacherCount}
                        </p>
                        <p className={`text-[10px] font-bold uppercase ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                          Giáo viên
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSchoolChange(isSelected ? undefined : sch.id)}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                      isSelected
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {isSelected ? "Bỏ lọc cơ sở này" : "Xem số liệu cơ sở này"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = "blue",
  highlight,
  subtext = "Hoạt động ổn định",
}: {
  label: string;
  value: number | string;
  accent?: "blue" | "emerald" | "indigo" | "rose" | "slate";
  highlight?: string;
  subtext?: string;
}) {
  const accentBorders = {
    blue: "border-t-4 border-t-blue-600",
    emerald: "border-t-4 border-t-emerald-600",
    indigo: "border-t-4 border-t-indigo-600",
    rose: "border-t-4 border-t-rose-600",
    slate: "border-t-4 border-t-slate-800",
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between ${accentBorders[accent]}`}
    >
      <div>
        <p className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">{label}</p>
        <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-1.5 ${highlight || "text-slate-900"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
      <p className="text-[11px] text-slate-400 font-medium mt-2">{subtext}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
}
