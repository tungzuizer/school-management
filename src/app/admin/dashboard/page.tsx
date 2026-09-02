/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router Page for `/admin/dashboard`.
 * 2. Affected APIs: `src/app/admin/dashboard/page.tsx`.
 * 3. Schemas: `getAdminDashboardData`, `getNQ37DashboardSummary`.
 * 4. Verbatim User Instruction: "sửa lại cấu trúc Bảng Điều Khiển Ban Giám Hiệu cho logic và phù hợp với những gì tôi mô tả về dự án"
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
import { useSession } from "next-auth/react";
import {
  GraduationCap,
  School,
  Users,
  CalendarDays,
  Globe,
  Bell,
  Info,
  Lightbulb,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  ShieldCheck,
  Building2,
  Filter,
  Check,
  ChevronRight,
  MapPin,
  Crown,
  Radio,
  Sliders,
  Sparkles,
  BrainCircuit,
  ArrowUpRight,
  UserCheck,
  Flame,
  Zap,
  AlertCircle,
  BookOpen,
  Award,
  RefreshCw,
  Scale,
} from "lucide-react";
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

const COLORS = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0891b2"];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { isEasyMode } = useEasyMode();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | undefined>(undefined);

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
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-8 w-36 rounded-xl" />
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
    session?.user?.role === "SUPER_ADMIN";

  const activeSchoolName = selectedSchoolId
    ? schools.find((s) => s.id === selectedSchoolId)?.name || "Trường đã chọn"
    : isSuperAdmin
    ? "Toàn bộ các Trường (Hệ thống Quốc Gia)"
    : "Tất cả các cơ sở trực thuộc";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      <UnapprovedBanner />

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER & COMMAND CENTER BANNER                               */}
      {/* ========================================================================= */}
      {isSuperAdmin ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3.5 py-1 bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/50 rounded-full text-amber-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-md shadow-inner">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" /> TRUNG TÂM ĐIỀU HÀNH GIÁO DỤC QUỐC GIA
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" /> Quyền Hạn Toàn Quốc (National Scope)
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold">
                  {schools.length} Trường Đã Kết Nối
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Bảng Điều Khiển Quản Trị Viên Tối Cao (Super Admin)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 flex items-center gap-2 flex-wrap">
                <span>{todayStr}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Phạm vi hoạt động: {activeSchoolName}
                </span>
              </p>
            </div>

            {/* Quick National Statistics */}
            <div className="flex items-center gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md shrink-0">
              <div className="text-center px-3 border-r border-slate-800">
                <p className="text-xl font-black text-amber-400">{stats?.totalSchools ?? 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Trường Học</p>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <p className="text-xl font-black text-emerald-400">{(stats?.totalStudents ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Học Sinh</p>
              </div>
              <div className="text-center px-3">
                <p className="text-xl font-black text-indigo-400">{(stats?.totalTeachers ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Giáo Viên</p>
              </div>
            </div>
          </div>

          {/* Super Admin Quick Action Strip */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <Link
              href="/admin/multi-school"
              className="p-3 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-indigo-200 text-xs font-bold group"
            >
              <Globe className="w-4 h-4 text-indigo-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Liên Trường</span>
            </Link>
            <Link
              href="/admin/approvals"
              className="p-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-emerald-200 text-xs font-bold group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Phê Duyệt</span>
            </Link>
            <Link
              href="/admin/principals"
              className="p-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-amber-200 text-xs font-bold group"
            >
              <Crown className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Tài Khoản HT</span>
            </Link>
            <Link
              href="/admin/early-warnings"
              className="p-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-rose-200 text-xs font-bold group"
            >
              <BrainCircuit className="w-4 h-4 text-rose-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Radar AI</span>
            </Link>
            <Link
              href="/admin/schools"
              className="p-3 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-purple-200 text-xs font-bold group"
            >
              <School className="w-4 h-4 text-purple-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>DS Các Trường</span>
            </Link>
            <Link
              href="/admin/students"
              className="p-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 rounded-2xl transition-all flex items-center gap-2.5 text-sky-200 text-xs font-bold group col-span-2 sm:col-span-1"
            >
              <Users className="w-4 h-4 text-sky-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Dữ Liệu Học Sinh</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Principal / Vice-Principal Executive Command Banner */
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/50">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 bg-indigo-500/25 border border-indigo-400/40 rounded-full text-indigo-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Ban Giám Hiệu Trường
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" /> Trạng thái: Thời gian thực
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Bảng Điều Khiển Ban Giám Hiệu
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 capitalize flex items-center gap-1.5">
                <span>{todayStr}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-bold">{activeSchoolName}</span>
              </p>
            </div>

            {/* Quick Action Hub for School Leadership */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/admin/early-warnings"
                className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 rounded-2xl text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <BrainCircuit className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>AI Radar Cảnh Báo</span>
              </Link>
              <Link
                href="/admin/substitute-teaching"
                className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-2xl text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Điều Động Dạy Thay</span>
              </Link>
              <Link
                href="/admin/approvals"
                className="px-3.5 py-2.5 bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/40 rounded-2xl text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
                <span>Phê Duyệt ({today?.incidentsToday ?? 0})</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* School/Campus Filter Selector Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bộ Lọc & Phạm Vi Giám Sát</h2>
              <p className="text-xs text-slate-500">
                Chọn cơ sở/trường để lọc dữ liệu tác nghiệp hoặc xem tổng hợp toàn hệ thống
              </p>
            </div>
          </div>
          {refreshing && (
            <span className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật dữ liệu...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleSchoolChange(undefined)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
              selectedSchoolId === undefined
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tất Cả Các Trường ({schools.length})</span>
            {selectedSchoolId === undefined && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>

          {schools.map((sch) => {
            const isSelected = selectedSchoolId === sch.id;
            return (
              <button
                key={sch.id}
                onClick={() => handleSchoolChange(sch.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>{sch.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {sch.studentCount} HS
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1.5 EXECUTIVE COMPLIANCE COMMAND CENTER: NGHỊ QUYẾT 37/2026/NQ-CP         */}
      {/* ========================================================================= */}
      {nq37Summary && nq37Summary.scorecard && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-blue-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 text-blue-300 rounded-2xl">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-md border border-blue-400/30">
                      NQ 37/2026/NQ-CP (Hiệu lực: 05/08/2026 - 30/06/2028)
                    </span>
                    {nq37Summary.hasCriticalViolations ? (
                      <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black rounded-md border border-rose-400/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Cảnh Báo Vi Phạm Tiêu Chuẩn
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-md border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Đạt Chuẩn Định Mức & Bằng Cấp
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    Thẩm Định Tuân Thủ Định Mức Lãnh Đạo & Nhân Sự Hỗ Trợ Giáo Dục
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/admin/nq37-compliance"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Trung Tâm Thẩm Định</span>
                </Link>
                <Link
                  href="/admin/support-staff"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <span>DS Nhân Sự Hỗ Trợ</span>
                </Link>
              </div>
            </div>

            {/* Statutory Deadlines & Compliance Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Deadline 30/09/2026 */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-bold uppercase">Hạn Kiện Toàn Bộ Máy</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-300">
                  {nq37Summary.deadlines.arrangementDaysLeft > 0
                    ? `Còn ${nq37Summary.deadlines.arrangementDaysLeft} ngày`
                    : "Đến hạn hoàn tất"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hạn chót: <strong>30/09/2026</strong> (Điều 8 NQ 37)
                </p>
              </div>

              {/* Deadline 05/08/2029 (36 Months) */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-bold uppercase">Lộ Trình Chuẩn Hóa 36T</span>
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-sky-300">
                  {nq37Summary.deadlines.standardizationMonthsLeft} tháng nữa
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thời hạn: <strong>05/08/2029</strong> (Điều 5.3.a)
                </p>
              </div>

              {/* Leadership Structure Status */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-bold uppercase">Ban Giám Hiệu</span>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-400">
                  {nq37Summary.scorecard.leadershipAudit.principalActual} HT • {nq37Summary.scorecard.leadershipAudit.vicePrincipalActual} PHT
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Định mức: 1 HT + 1 PHT trường chính + 1 PHT/phân hiệu
                </p>
              </div>

              {/* Overall Score */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs font-bold uppercase">Tỷ Lệ Tuân Thủ NQ 37</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-300">
                  {nq37Summary.scorecard.overallScore}%
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PILLAR 1: ĐIỀU HÀNH TÁC NGHIỆP HÀNG NGÀY (DAILY OPERATIONAL PULSE)    */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              1. Nhịp Đập Tác Nghiệp Hôm Nay (Daily Operational Pulse)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Thời gian thực</span>
        </div>

        {/* Operational Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <MetricCard
            icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
            label="Tổng Học Sinh"
            value={stats?.totalStudents ?? 0}
            subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
            colorBg="bg-indigo-50"
          />
          <MetricCard
            icon={<Users className="w-5 h-5 text-emerald-600" />}
            label="Đội Ngũ Giáo Viên"
            value={stats?.totalTeachers ?? 0}
            subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
            colorBg="bg-emerald-50"
          />
          <MetricCard
            icon={<School className="w-5 h-5 text-sky-600" />}
            label="Lớp Học Đang Hoạt Động"
            value={stats?.totalClasses ?? 0}
            subtext={selectedSchoolId ? "Tại trường đã chọn" : "Toàn bộ hệ thống"}
            colorBg="bg-sky-50"
          />
          <MetricCard
            icon={<Building2 className="w-5 h-5 text-purple-600" />}
            label="Điểm Trường / Cơ Sở"
            value={stats?.totalSchools ?? 0}
            subtext="Cơ sở liên kết"
            colorBg="bg-purple-50"
          />
          <MetricCard
            icon={<Activity className="w-5 h-5 text-emerald-600" />}
            label="Chuyên Cần (30 Ngày)"
            value={`${stats?.attendanceRate ?? 0}%`}
            highlight={
              (stats?.attendanceRate ?? 100) < 90
                ? "text-rose-600"
                : "text-emerald-700"
            }
            subtext={selectedSchoolId ? "Trường đã chọn" : "Trung bình toàn trường"}
            colorBg="bg-emerald-50"
          />
        </div>

        {/* Live Today's Real-time Operations Widget */}
        {today && (
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                  Tình hình điểm danh & nề nếp trực tiếp hôm nay ({selectedSchoolId ? activeSchoolName : "Toàn hệ thống"})
                </p>
              </div>
              <span className="text-xs text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full font-bold border border-indigo-400/30">
                {todayStr}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-2xl sm:text-3xl font-black text-rose-400">{today.absentToday}</p>
                <p className="text-xs text-slate-300 font-semibold mt-1">Vắng mặt hôm nay</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bao gồm có phép & không phép</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-2xl sm:text-3xl font-black text-amber-400">{today.lateToday}</p>
                <p className="text-xs text-slate-300 font-semibold mt-1">Đi muộn hôm nay</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Ghi nhận qua cổng điểm danh</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-2xl sm:text-3xl font-black text-orange-400">{today.incidentsToday}</p>
                <p className="text-xs text-slate-300 font-semibold mt-1">Sự vụ nề nếp / Kỷ luật</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Cần BGH theo dõi xử lý</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {today.reportsSubmitted}/{today.totalClasses}
                </p>
                <p className="text-xs text-slate-300 font-semibold mt-1">Báo cáo Sổ đầu bài</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Đã nộp {today.totalClasses > 0 ? Math.round((today.reportsSubmitted / today.totalClasses) * 100) : 100}% số lớp
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. PILLAR 2: AI RADAR CẢNH BÁO SỚM & AN TOÀN HỌC ĐƯỜNG                    */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-rose-600 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-rose-600" />
              <span>2. AI Radar Cảnh Báo Sớm & An Toàn Học Đường</span>
            </h2>
          </div>
          <Link
            href="/admin/early-warnings"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
          >
            <span>Xem tất cả cảnh báo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {earlyWarnings.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-emerald-950">Radar An Toàn: Không Có Cảnh Báo Khẩn</h3>
            <p className="text-xs text-emerald-700 max-w-md mx-auto">
              AI chưa phát hiện bất thường nghiêm trọng về nguy cơ bỏ học, điểm rơi tự do hay vi phạm nề nếp tại các lớp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earlyWarnings.map((warning) => {
              const isCritical = warning.level === "CRITICAL";
              const isHigh = warning.level === "HIGH";
              const isMedium = warning.level === "MEDIUM";

              const badgeColor = isCritical
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : isHigh
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : isMedium
                ? "bg-blue-100 text-blue-800 border-blue-200"
                : "bg-slate-100 text-slate-800 border-slate-200";

              return (
                <div
                  key={warning.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover-lift transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badgeColor}`}>
                        {warning.level}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {new Date(warning.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                      {warning.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-2 flex-wrap">
                      {warning.className && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                          Lớp {warning.className}
                        </span>
                      )}
                      {warning.studentName && (
                        <span className="text-indigo-600 font-bold truncate max-w-[140px]">
                          HS: {warning.studentName}
                        </span>
                      )}
                      {warning.campusName && (
                        <span className="text-slate-400 text-[11px] truncate">
                          ({warning.campusName})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                      {warning.description}
                    </p>

                    {warning.aiAnalysis && (
                      <div className="mt-3 p-2.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                        <span className="font-black text-indigo-950 flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3 h-3 text-indigo-600" /> AI Đề Xuất Xử Lý:
                        </span>
                        {warning.aiAnalysis}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Danh mục: {warning.category}</span>
                    <Link
                      href="/admin/early-warnings"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                    >
                      <span>Chi tiết</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. PILLAR 3: GIÁM SÁT CHUYÊN MÔN & ĐIỀU ĐỘNG DẠY THAY                      */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-amber-500 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>3. Giám Sát Chuyên Môn & Kế Hoạch Bài Dạy</span>
            </h2>
          </div>
          <Link
            href="/admin/lesson-plans"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
          >
            <span>Quản lý giáo án</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* AI Lesson Plan Deadline Alerts (Span 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xs border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tiến Độ Nộp Giáo Án / Kế Hoạch Bài Dạy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kỳ nộp: <span className="font-bold text-slate-800">{lpAlerts?.periodLabel || "Kỳ hiện tại"}</span> — Hạn cuối:{" "}
                    <span className="font-bold text-rose-600">
                      {lpAlerts?.deadline ? new Date(lpAlerts.deadline).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold text-[11px]">
                  🔴 {lpAlerts?.alerts.filter((a) => a.status === "NOT_SUBMITTED").length ?? 0} Chưa nộp
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[11px]">
                  🟡 {lpAlerts?.alerts.filter((a) => a.status === "LATE").length ?? 0} Nộp muộn
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[11px]">
                  🟢 {lpAlerts?.alerts.filter((a) => a.status === "ON_TIME").length ?? 0} Đã nộp
                </span>
              </div>
            </div>

            {!lpAlerts || lpAlerts.alerts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu phân công giảng dạy cho kỳ này</p>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b text-slate-500 uppercase sticky top-0 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Tổ Chuyên Môn</th>
                      <th className="px-4 py-2.5">Môn Học</th>
                      <th className="px-4 py-2.5">Giáo Viên</th>
                      <th className="px-4 py-2.5 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lpAlerts.alerts.slice(0, 8).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.groupName}</td>
                        <td className="px-4 py-2.5 text-slate-600">{item.subjectName}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{item.teacherName}</td>
                        <td className="px-4 py-2.5 text-center">
                          {item.status === "NOT_SUBMITTED" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              Chưa nộp
                            </span>
                          )}
                          {item.status === "LATE" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                              Nộp muộn ({item.daysLate}d)
                            </span>
                          )}
                          {item.status === "ON_TIME" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
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

          {/* Substitute Teaching & Emergency Dispatch Card (1 col) */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Điều Động Dạy Thay</h3>
                    <p className="text-xs text-slate-500">Ca điều động khẩn cấp</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
                  {substitutes?.pendingCount ?? 0} Chờ duyệt
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {!substitutes || substitutes.todayDispatches.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-semibold">Không có ca dạy thay phát sinh hôm nay</p>
                  </div>
                ) : (
                  substitutes.todayDispatches.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200/70 transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>Lớp {sub.className} • Tiết {sub.period}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] ${
                            sub.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {sub.status === "PENDING" ? "Chờ phân công" : "Đã duyệt"}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        GV Vắng: <strong className="text-rose-600">{sub.originalTeacher}</strong>
                        {sub.substituteTeacher && (
                          <> → Thay: <strong className="text-emerald-700">{sub.substituteTeacher}</strong></>
                        )}
                      </p>
                      {sub.reason && <p className="text-[11px] text-slate-400 mt-1 italic">Lý do: {sub.reason}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/admin/substitute-teaching"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <span>Vào Cổng Điều Động Dạy Thay</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PILLAR 4: PHÂN TÍCH ĐA CHIỀU, CHUYÊN CẦN & BẢNG XẾP HẠNG NỀ NẾP       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>4. Phân Tích Xu Hướng Chuyên Cần & Xếp Hạng Lớp Học</span>
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Theo dõi 8 tuần gần nhất</span>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Attendance Trend Multi-Series Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Xu Hướng Chuyên Cần Theo Tuần {selectedSchoolId ? `(${activeSchoolName})` : ""}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">8 Tuần Qua</span>
            </div>
            {isEasyMode && (
              <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2.5 rounded-2xl flex items-start gap-1.5 border border-blue-100">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  <strong>Hướng dẫn:</strong> Biểu đồ so sánh số lượt <strong className="text-emerald-700">Có mặt</strong>,{" "}
                  <strong className="text-rose-600">Vắng</strong>, và <strong className="text-amber-600">Đi trễ</strong> trong từng tuần.
                </span>
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
                  <Bar dataKey="present" name="Có mặt" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Vắng" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Đi trễ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Chưa có dữ liệu điểm danh theo tuần" />
            )}
          </div>

          {/* Average Grade by Class Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Điểm Trung Bình Theo Lớp {selectedSchoolId ? `(${activeSchoolName})` : ""}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Thang Điểm 10</span>
            </div>
            {isEasyMode && (
              <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2.5 rounded-2xl flex items-start gap-1.5 border border-blue-100">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  <strong>Hướng dẫn:</strong> Điểm trung bình kết quả học tập của học sinh từng lớp. Lớp có cột càng cao biểu thị học lực trung bình càng tốt.
                </span>
              </p>
            )}
            {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shortClassName" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v, _, item) => [`${v} điểm`, item?.payload?.schoolName || "ĐTB"]} />
                  <Bar dataKey="avgScore" name="Điểm trung bình" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {classGrades.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bảng Xếp Hạng Chuyên Cần 7 Ngày Qua</h3>
                  <p className="text-xs text-slate-500">Tỷ lệ đi học đầy đủ theo từng lớp</p>
                </div>
              </div>
            </div>

            {classAttendance.length === 0 ? (
              <EmptyState message="Chưa có dữ liệu chuyên cần tuần này" />
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b text-slate-500 uppercase sticky top-0 font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Hạng</th>
                      <th className="px-4 py-2.5">Lớp Học</th>
                      <th className="px-4 py-2.5">Sĩ Số</th>
                      <th className="px-4 py-2.5 text-right">Tỷ Lệ Chuyên Cần</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classAttendance.slice(0, 10).map((cls, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-black text-slate-700">
                          {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {cls.className}
                          {cls.schoolName && <span className="text-[10px] text-slate-400 block font-normal">{cls.schoolName}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{cls.studentCount} HS</td>
                        <td className="px-4 py-2.5 text-right font-black">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                              cls.attendanceRate >= 95
                                ? "bg-emerald-100 text-emerald-800"
                                : cls.attendanceRate >= 85
                                ? "bg-amber-100 text-amber-800"
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

          {/* Recent Discipline & Safety Incidents Feed */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-800 rounded-2xl">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhật Ký Sự Vụ & Kỷ Luật Gần Đây</h3>
                  <p className="text-xs text-slate-500">Các vụ việc được ghi nhận trong trường</p>
                </div>
              </div>
            </div>

            {incidents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-emerald-800">Không có vi phạm kỷ luật nào gần đây</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 bg-slate-50 hover:bg-rose-50/30 rounded-2xl border border-slate-200/70 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                        {inc.type}
                      </span>
                      <span className="text-[10px] text-slate-400">
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
                          <span className="text-slate-400">{inc.schoolName}</span>
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

      {/* ========================================================================= */}
      {/* 6. PILLAR 5: QUY MÔ SĨ SỐ & CƠ SỞ VẬT CHẤT                              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-sky-600 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              <span>5. Phân Bổ Sĩ Số & Cơ Cấu Lớp Học</span>
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Theo khối & GVCN</span>
        </div>

        {/* Interactive Class Distribution Widget */}
        <ClassDistributionWidget classes={classGrades as any} />
      </section>

      {/* ========================================================================= */}
      {/* 7. PILLAR 6: CHI TIẾT CÁC ĐIỂM TRƯỜNG & LIÊN KẾT HỆ THỐNG                 */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-purple-600 rounded-full" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              <span>6. Bản Đồ Cơ Sở & Trường Thành Viên Trực Thuộc</span>
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
                className={`bg-white rounded-3xl p-5 border transition-all shadow-xs relative flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                    : "border-slate-200/80 hover:border-indigo-300 hover-lift"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold">
                        Điểm trường / Cơ sở
                      </span>
                      <h3 className="font-black text-slate-900 text-base mt-1.5">{sch.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đang lọc
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-3.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sch.address}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center mb-3">
                    <div>
                      <p className="text-lg font-black text-indigo-700">{sch.studentCount}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Học sinh</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-700">{sch.classCount}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Lớp học</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-purple-700">{sch.teacherCount}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Giáo viên</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSchoolChange(isSelected ? undefined : sch.id)}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-xs"
                  }`}
                >
                  <span>{isSelected ? "Bỏ lọc cơ sở này" : "Xem riêng số liệu cơ sở này"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  highlight,
  subtext = "Hoạt động ổn định",
  colorBg = "bg-indigo-50",
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: string;
  subtext?: string;
  colorBg?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover-lift transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2.5 rounded-2xl ${colorBg} shadow-2xs`}>{icon}</div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
        </div>
        <p className="text-xs text-slate-500 font-bold">{label}</p>
        <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 ${highlight || "text-slate-900"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
      <p className="text-[11px] text-slate-400 font-semibold mt-2">{subtext}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
      <Info className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
}
