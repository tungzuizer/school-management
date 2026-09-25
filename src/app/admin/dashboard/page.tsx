/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router Page for `/admin/dashboard` (referenced by `src/app/admin/layout.tsx`).
 * 2. Affected APIs: `src/app/admin/dashboard/page.tsx` (AdminDashboardPage default export).
 * 3. Schemas: `CampusSummaryItem`, `getAdminDashboardData`, `getNQ37DashboardSummary`, `getDashboardStats`, `getAttendanceByWeek`, `getGradesByClass`, `getClassAttendanceRanking`, `getRecentIncidents`, `getTodaySummary`, `getLessonPlanAlerts`, `getEarlyWarnings`, `getSubstituteDispatchSummary`.
 * 4. Multi-Campus Hierarchy: School Principal (Role.ADMIN) manages Campuses (Phân hiệu), where each Campus is supervised by assigned Vice Principals (Role.VICE_PRINCIPAL).
 * 5. Design: Monochrome, minimalist, highly professional executive UI with Lucide stroke icons.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
import { useSession } from "next-auth/react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import DailyKpiWidget from "@/components/dashboard/DailyKpiWidget";
import UnapprovedBanner from "@/components/ui/UnapprovedBanner";
import {
  Building2,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  School,
  Activity,
  Phone,
  Mail,
  Compass,
  ChevronRight,
  Filter,
  Sparkles,
  Calendar,
  Award,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  MapPin,
  Check,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  CampusSummaryItem,
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

type DashboardCategory = "ALL" | "CAMPUSES" | "ACADEMICS" | "COMPLIANCE" | "DISCIPLINE";

const CHART_PALETTE = ["#1e293b", "#0f766e", "#2563eb", "#e11d48", "#475569", "#0891b2", "#4f46e5"];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { isEasyMode } = useEasyMode();
  const [isPending, startTransition] = useTransition();

  const [campuses, setCampuses] = useState<CampusSummaryItem[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | undefined>(undefined);
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
        const data = await getAdminDashboardData(undefined, undefined);
        setCampuses(data.campuses);
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
        console.error("Failed to load initial multi-campus dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleCampusChange = async (campusId?: string) => {
    setSelectedCampusId(campusId);
    setRefreshing(true);
    startTransition(async () => {
      try {
        const data = await getAdminDashboardData(undefined, campusId);
        setCampuses(data.campuses);
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
        console.error("Failed to refresh campus dashboard data:", err);
      } finally {
        setRefreshing(false);
      }
    });
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
    session?.user?.email === "superadmin@gmail.com" ||
    session?.user?.email === "superadmin.vietnam@gmail.com" ||
    session?.user?.email === "superadmin.ninhbinh@gmail.com" ||
    session?.user?.email === "superadmin.demo@gmail.com" ||
    session?.user?.email === "superadmin@school.com" ||
    (session?.user as { role?: string })?.role === "SUPER_ADMIN";

  const activeCampus = campuses.find((c) => c.id === selectedCampusId);
  const activeScopeName = activeCampus
    ? `${activeCampus.name} (${activeCampus.isMainCampus ? "Trụ sở chính" : "Phân hiệu"})`
    : `Toàn trường (${campuses.length} phân hiệu & điểm trường)`;

  const categories: { id: DashboardCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "ALL", label: "Tổng quan điều hành", icon: Layers },
    { id: "CAMPUSES", label: "Ma trận phân hiệu", icon: Building2 },
    { id: "ACADEMICS", label: "Học tập & Giảng dạy", icon: GraduationCap },
    { id: "COMPLIANCE", label: "Định mức NQ 37", icon: ShieldCheck },
    { id: "DISCIPLINE", label: "Chuyên cần & Nề nếp", icon: Activity },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-2">
      <UnapprovedBanner />

      {/* ========================================================================= */}
      {/* 1. REFINED EXECUTIVE HEADER                                              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-white via-slate-50/70 to-slate-100/60 rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xs">
              <School className="w-3.5 h-3.5" />
              {isSuperAdmin ? "Tổng Quản Trị Hệ Thống" : "Ban Giám Hiệu — Hiệu Trưởng"}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 capitalize bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200">
              <Calendar className="w-3 h-3 text-slate-400" />
              {todayStr}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Trung Tâm Điều Hành Đa Phân Hiệu
          </h1>
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            Phạm vi giám sát hiện tại:{" "}
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {activeScopeName}
            </span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 animate-pulse ml-2 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" /> Đang cập nhật dữ liệu...
              </span>
            )}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/campuses"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-[0.98]"
          >
            <Building2 className="w-3.5 h-3.5" />
            Quản lý phân hiệu
          </Link>
          <Link
            href="/admin/principals"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Phân công PHT
          </Link>
          <Link
            href="/admin/nq37-compliance"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Định mức NQ 37
          </Link>
          <Link
            href="/admin/early-warnings"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Cảnh báo ({earlyWarnings.length})
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MULTI-CAMPUS COMMAND SWITCHER & CATEGORY TABS                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Multi-Campus Switcher */}
        {campuses.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 px-2 text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold">Phân hiệu:</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleCampusChange(undefined)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCampusId === undefined
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-700 hover:bg-white hover:text-slate-900"
                }`}
              >
                Toàn trường ({campuses.length})
              </button>
              {campuses.map((campus) => {
                const isSelected = selectedCampusId === campus.id;
                return (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => handleCampusChange(campus.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "text-slate-700 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <span>{campus.name}</span>
                    {campus.isMainCampus && (
                      <span
                        className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                          isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        Chính
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. KEY METRIC CARDS WITH REFINED MONOCHROME STYLING                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <MetricCard
          label="Tổng Học Sinh"
          value={stats?.totalStudents ?? 0}
          icon={GraduationCap}
          accent="slate"
          subtext={activeCampus ? `Tại ${activeCampus.name}` : "Toàn bộ các phân hiệu"}
        />
        <MetricCard
          label="Đội Ngũ Giáo Viên"
          value={stats?.totalTeachers ?? 0}
          icon={Users}
          accent="slate"
          subtext={activeCampus ? `Tại ${activeCampus.name}` : "Toàn bộ các phân hiệu"}
        />
        <MetricCard
          label="Lớp Học Hoạt Động"
          value={stats?.totalClasses ?? 0}
          icon={Layers}
          accent="slate"
          subtext={activeCampus ? `Tại ${activeCampus.name}` : "Toàn bộ các phân hiệu"}
        />
        <MetricCard
          label="Phân Hiệu / Điểm Trường"
          value={activeCampus ? activeCampus.schoolPointsCount + 1 : campuses.length}
          icon={Building2}
          accent="slate"
          subtext={activeCampus ? `${activeCampus.schoolPointsCount} điểm vệ tinh` : "Tổng số cơ sở trực thuộc"}
        />
        <MetricCard
          label="Chuyên Cần (30 Ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          icon={Activity}
          accent={(stats?.attendanceRate ?? 100) < 90 ? "rose" : "slate"}
          highlight={(stats?.attendanceRate ?? 100) < 90 ? "text-rose-700" : "text-slate-900"}
          subtext={activeCampus ? `Tại ${activeCampus.name}` : "Tỷ lệ bình quân toàn trường"}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. EXECUTIVE MULTI-CAMPUS COMPARATIVE MATRIX (BẢNG MA TRẬN PHÂN HIỆU)      */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "CAMPUSES") && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider rounded">
                  <Building2 className="w-3 h-3" /> Ma trận so sánh phân hiệu
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {campuses.length} Phân hiệu trực thuộc
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Giám Sát Vận Hành & Phân Công Lãnh Đạo Theo Phân Hiệu
              </h2>
              <p className="text-xs text-slate-500">
                Hiệu trưởng trực tiếp theo dõi hiệu suất từng phân hiệu, các Phó Hiệu trưởng phụ trách và cảnh báo an toàn.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedCampusId && (
                <button
                  type="button"
                  onClick={() => handleCampusChange(undefined)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  Bỏ lọc (Xem toàn trường)
                </button>
              )}
              <Link
                href="/admin/campuses"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <span>Cấu hình phân hiệu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Phân Hiệu / Cơ Sở</th>
                  <th className="px-4 py-3">Phó Hiệu Trưởng Phụ Trách</th>
                  <th className="px-4 py-3 text-center">Điểm Vệ Tinh</th>
                  <th className="px-4 py-3 text-center">Quy Mô (HS / GV / Lớp)</th>
                  <th className="px-4 py-3 text-center">Chuyên Cần 30N</th>
                  <th className="px-4 py-3 text-center">An Toàn & Cảnh Báo</th>
                  <th className="px-4 py-3 text-right">Điều Hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campuses.map((campus) => {
                  const isSelected = selectedCampusId === campus.id;
                  const hasCriticalAlert = campus.maxAlertLevel === "CRITICAL";
                  const hasWarning = campus.alertCount > 0;

                  return (
                    <tr
                      key={campus.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-slate-50/90 font-medium"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Campus Name & Address */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">
                              {campus.name}
                            </span>
                            {campus.isMainCampus && (
                              <span className="px-1.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                                Trụ sở chính
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold rounded">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{campus.address || "Chưa cập nhật địa chỉ"}</span>
                          </p>
                        </div>
                      </td>

                      {/* Vice Principals Assigned */}
                      <td className="px-4 py-3.5">
                        {campus.vicePrincipals.length === 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                              <Users className="w-3 h-3" /> Chưa phân công PHT
                            </span>
                            <Link
                              href="/admin/principals"
                              className="block text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              + Phân công ngay
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {campus.vicePrincipals.map((vp) => (
                              <div key={vp.id} className="text-[11px]">
                                <p className="font-semibold text-slate-900 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-500" />
                                  {vp.name}
                                </p>
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] mt-0.5">
                                  {vp.phone && (
                                    <span className="flex items-center gap-0.5">
                                      <Phone className="w-2.5 h-2.5 text-slate-400" /> {vp.phone}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-0.5 truncate max-w-[130px]">
                                    <Mail className="w-2.5 h-2.5 text-slate-400" /> {vp.email}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Satellite SchoolPoints Count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-xs border border-slate-200">
                          <Compass className="w-3 h-3 text-slate-500" />
                          {campus.schoolPointsCount} điểm
                        </span>
                      </td>

                      {/* Students / Teachers / Classes Scale */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {campus.studentCount} HS
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {campus.teacherCount} GV • {campus.classCount} Lớp
                          </p>
                        </div>
                      </td>

                      {/* 30-Day Attendance Rate */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              campus.attendanceRate >= 95
                                ? "bg-slate-100 text-slate-900 border border-slate-200"
                                : campus.attendanceRate >= 85
                                ? "bg-slate-50 text-slate-700 border border-slate-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {campus.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">30 ngày qua</span>
                        </div>
                      </td>

                      {/* Safety & Alerts */}
                      <td className="px-4 py-3.5 text-center">
                        {hasWarning ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              hasCriticalAlert
                                ? "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {campus.alertCount} sự vụ ({campus.maxAlertLevel})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            An toàn
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleCampusChange(isSelected ? undefined : campus.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1 ${
                            isSelected
                              ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
                          }`}
                        >
                          <Filter className="w-3 h-3" />
                          {isSelected ? "Bỏ lọc" : "Lọc số liệu"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. COMPLIANCE NGHỊ QUYẾT 37/2026/NQ-CP HUB                                */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "COMPLIANCE") && nq37Summary && nq37Summary.scorecard && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  NQ 37/2026/NQ-CP
                </span>
                {nq37Summary.hasCriticalViolations ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md border border-rose-200">
                    <AlertCircle className="w-3 h-3" />
                    Cần rà soát định mức
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
                    <Check className="w-3 h-3" />
                    Đạt chuẩn định mức
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Tuân thủ Định mức Lãnh đạo & Nhân sự Hỗ trợ Giáo dục
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/nq37-compliance"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                Chi tiết thẩm định
              </Link>
              <Link
                href="/admin/support-staff"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
              >
                DS Nhân sự
              </Link>
            </div>
          </div>

          {/* Statutory Deadlines & Compliance Score Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Hạn kiện toàn bộ máy
              </span>
              <p className="text-lg font-bold text-slate-800">
                {nq37Summary.deadlines.arrangementDaysLeft > 0
                  ? `Còn ${nq37Summary.deadlines.arrangementDaysLeft} ngày`
                  : "Đến hạn hoàn tất"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hạn chót: 30/09/2026
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Lộ trình chuẩn hóa 36T
              </span>
              <p className="text-lg font-bold text-slate-900">
                {nq37Summary.deadlines.standardizationMonthsLeft} tháng nữa
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Thời hạn: 05/08/2029
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Ban Giám hiệu (HT & PHT)
              </span>
              <p className="text-lg font-bold text-slate-900">
                {nq37Summary.scorecard.leadershipAudit.principalActual} HT • {nq37Summary.scorecard.leadershipAudit.vicePrincipalActual} PHT
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Phân bổ theo phân hiệu
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Tỷ lệ tuân thủ vị trí việc làm
              </span>
              <p className="text-lg font-bold text-slate-900">
                {nq37Summary.scorecard.overallScore}%
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Theo danh mục NQ 37
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REAL-TIME DAILY OPERATIONAL PULSE & DAILY KPI WIDGET                    */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "DISCIPLINE") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <DailyKpiWidget campusId={selectedCampusId} />
          </div>

          {today && (
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold uppercase tracking-wider rounded">
                    <Activity className="w-3 h-3 text-slate-300" />
                    Tác Nghiệp Hằng Ngày
                  </span>
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Điểm danh & Sổ đầu bài ({activeScopeName})
                  </p>
                </div>
                <span className="text-xs text-slate-300 bg-slate-800/80 px-3 py-1 rounded-md font-medium border border-slate-700/80">
                  {todayStr}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 backdrop-blur-xs">
                  <p className="text-2xl font-black text-rose-400 tabular-nums">{today.absentToday}</p>
                  <p className="text-xs text-slate-200 font-bold mt-1">Vắng hôm nay</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Có phép & không phép</p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 backdrop-blur-xs">
                  <p className="text-2xl font-black text-slate-100 tabular-nums">{today.lateToday}</p>
                  <p className="text-xs text-slate-200 font-bold mt-1">Đi muộn</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ghi nhận tại cổng</p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 backdrop-blur-xs">
                  <p className="text-2xl font-black text-slate-200 tabular-nums">{today.incidentsToday}</p>
                  <p className="text-xs text-slate-200 font-bold mt-1">Sự vụ nề nếp</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Đang xử lý</p>
                </div>
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 backdrop-blur-xs">
                  <p className="text-2xl font-black text-slate-100 tabular-nums">
                    {today.reportsSubmitted}/{today.totalClasses}
                  </p>
                  <p className="text-xs text-slate-200 font-bold mt-1">Sổ đầu bài</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Đã nộp {today.totalClasses > 0 ? Math.round((today.reportsSubmitted / today.totalClasses) * 100) : 100}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. AI RADAR EARLY WARNINGS & STUDENT SAFETY HUB                           */}
      {/* ========================================================================= */}
      {(activeCategory === "ALL" || activeCategory === "DISCIPLINE") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white text-xs font-bold uppercase rounded">
                <AlertTriangle className="w-3.5 h-3.5" />
                AI Radar Cảnh Báo Sớm
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                An Toàn Học Đường & Rủi Ro Học Tập ({activeScopeName})
              </h2>
            </div>
            <Link
              href="/admin/early-warnings"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              <span>Xem tất cả ({earlyWarnings.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {earlyWarnings.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <h3 className="font-bold text-sm text-slate-900">Radar An Toàn: Không Có Cảnh Báo Khẩn</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                AI chưa phát hiện bất thường nghiêm trọng về nguy cơ bỏ học, điểm rơi tự do hay vi phạm nề nếp tại phân hiệu này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earlyWarnings.map((warning) => {
                const isCritical = warning.level === "CRITICAL";

                return (
                  <div
                    key={warning.id}
                    className={`bg-white rounded-2xl p-5 border shadow-xs transition-all hover:shadow-sm flex flex-col justify-between ${
                      isCritical ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isCritical
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
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
                          <span className="font-bold text-slate-300 flex items-center gap-1 mb-0.5 uppercase tracking-wider text-[10px]">
                            <Sparkles className="w-3 h-3 text-slate-300" />
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
                        className="text-xs font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-1"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3 h-3" />
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white text-xs font-bold uppercase rounded">
                <FileText className="w-3.5 h-3.5" />
                Giáo Án & Dạy Thay
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Giám Sát Kế Hoạch Bài Dạy & Điều Động Khẩn Cấp
              </h2>
            </div>
            <Link
              href="/admin/lesson-plans"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition"
            >
              <span>Quản lý giáo án</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* AI Lesson Plan Deadline Alerts */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
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
                <p className="text-xs text-slate-400 text-center py-6">Không có dữ liệu phân công giảng dạy cho phân hiệu này</p>
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
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Điều Động Dạy Thay</h3>
                    <p className="text-xs text-slate-500">Ca điều động khẩn cấp</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">
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
                href="/admin/substitute-dispatch"
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 text-white text-xs font-bold uppercase rounded">
                <Activity className="w-3.5 h-3.5" />
                Xu Hướng Chuyên Cần
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phân Tích Chuyên Cần & Xếp Hạng Lớp Học ({activeScopeName})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Theo dõi 8 tuần gần nhất</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Weekly Attendance Trend Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Xu Hướng Chuyên Cần Theo Tuần
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">8 Tuần Gần Nhất</span>
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
                    <Bar dataKey="present" name="Có mặt" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Vắng" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Đi trễ" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Chưa có dữ liệu điểm danh theo tuần" />
              )}
            </div>

            {/* Average Grade by Class Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Điểm Trung Bình Theo Lớp
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Thang Điểm 10</span>
              </div>
              {isEasyMode && (
                <p className="text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>Hướng dẫn:</strong> Điểm trung bình kết quả học tập của học sinh từng lớp tại phân hiệu đang chọn.
                </p>
              )}
              {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="shortClassName" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v, _, item) => [`${v} điểm`, item?.payload?.campusName || "ĐTB"]} />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bảng Xếp Hạng Chuyên Cần 7 Ngày Qua</h3>
                  <p className="text-xs text-slate-500">Tỷ lệ đi học đầy đủ theo từng lớp học</p>
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
                                  ? "bg-slate-900 text-white"
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
                            {cls.campusName && <span className="text-[10px] text-slate-400 block font-normal">{cls.campusName}</span>}
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nhật Ký Sự Vụ & Kỷ Luật Gần Đây</h3>
                  <p className="text-xs text-slate-500">Các sự vụ ghi nhận tại các lớp</p>
                </div>
              </div>

              {incidents.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-xs font-semibold text-slate-600">Không có vi phạm kỷ luật nào gần đây</p>
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
                        {inc.campusName && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{inc.campusName}</span>
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
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent = "slate",
  highlight,
  subtext = "Hoạt động ổn định",
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "slate" | "rose";
  highlight?: string;
  subtext?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-[transform,box-shadow] duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        </div>
        <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-1 tabular-nums ${highlight || "text-slate-900"}`}>
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
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
