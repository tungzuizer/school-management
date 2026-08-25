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
  Lock,
  Radio,
  Sliders,
  Sparkles,
} from "lucide-react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ClassDistributionWidget from "@/components/dashboard/ClassDistributionWidget";
import {
  getSchoolsList,
  getDashboardStats,
  getAttendanceByWeek,
  getGradesByClass,
  getClassAttendanceRanking,
  getRecentIncidents,
  getTodaySummary,
  getLessonPlanAlerts,
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

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function initData() {
      try {
        const [schoolsRes, statsData, weekRes, gradesRes, attendanceRes, incidentsRes, todayRes, lpAlertsRes] =
          await Promise.all([
            getSchoolsList(),
            getDashboardStats(),
            getAttendanceByWeek(),
            getGradesByClass(),
            getClassAttendanceRanking(),
            getRecentIncidents(),
            getTodaySummary(),
            getLessonPlanAlerts(),
          ]);

        setSchools(schoolsRes);
        setStats(statsData);
        setWeekData(weekRes);
        setClassGrades(gradesRes);
        setClassAttendance(attendanceRes);
        setIncidents(incidentsRes);
        setToday(todayRes);
        setLpAlerts(lpAlertsRes);
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
      const [statsData, weekRes, gradesRes, attendanceRes, incidentsRes, todayRes, lpAlertsRes] =
        await Promise.all([
          getDashboardStats(schoolId),
          getAttendanceByWeek(schoolId),
          getGradesByClass(schoolId),
          getClassAttendanceRanking(schoolId),
          getRecentIncidents(10, schoolId),
          getTodaySummary(schoolId),
          getLessonPlanAlerts(schoolId),
        ]);

      setStats(statsData);
      setWeekData(weekRes);
      setClassGrades(gradesRes);
      setClassAttendance(attendanceRes);
      setIncidents(incidentsRes);
      setToday(todayRes);
      setLpAlerts(lpAlertsRes);
    } catch (err) {
      console.error("Failed to refresh school dashboard data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
    : "Tất cả các trường thuộc hệ thống";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Super Admin Executive Command Header */}
      {isSuperAdmin ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-2xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3.5 py-1 bg-gradient-to-r from-amber-500/30 to-amber-600/30 border border-amber-400/50 rounded-full text-amber-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-md shadow-inner">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" /> TRUNG TÂM ĐIỀU HÀNH GIÁO DỤC QUỐC GIA
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" /> Quyền Hạn Toàn Quốc (All Scope)
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold">
                  {schools.length} Trường Đã Kết Nối
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
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

            {/* Quick Executive Stats Badge */}
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

          {/* Super Admin Executive Quick Action Toolbar */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <Link
              href="/admin/multi-school"
              className="p-3 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 rounded-xl transition-all flex items-center gap-2.5 text-indigo-200 text-xs font-bold group"
            >
              <Globe className="w-4 h-4 text-indigo-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>🏛️ Liên Trường Toàn Quốc</span>
            </Link>
            <Link
              href="/admin/approvals"
              className="p-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 rounded-xl transition-all flex items-center gap-2.5 text-emerald-200 text-xs font-bold group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>🛡️ Phê Duyệt Trung Tâm</span>
            </Link>
            <Link
              href="/admin/principals"
              className="p-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 rounded-xl transition-all flex items-center gap-2.5 text-amber-200 text-xs font-bold group"
            >
              <Crown className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>🔑 Tài Khoản & Mật Khẩu</span>
            </Link>
            <Link
              href="/admin/schools"
              className="p-3 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 rounded-xl transition-all flex items-center gap-2.5 text-purple-200 text-xs font-bold group"
            >
              <School className="w-4 h-4 text-purple-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>🏫 Quản Lý Các Trường</span>
            </Link>
            <Link
              href="/admin/students"
              className="p-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 rounded-xl transition-all flex items-center gap-2.5 text-rose-200 text-xs font-bold group col-span-2 sm:col-span-1"
            >
              <Users className="w-4 h-4 text-rose-300 shrink-0 group-hover:scale-110 transition-transform" />
              <span>👨🎓 Quản Lý Học Sinh</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Principal Standard Banner */
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Ban Giám Hiệu Trường
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-[11px] font-semibold">
                  {schools.length} Trường Liên Kết
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Bảng Điều Khiển Ban Giám Hiệu
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 capitalize">
                {todayStr} — <span className="text-amber-300 font-bold">{activeSchoolName}</span>
              </p>
            </div>
            {isEasyMode && (
              <div className="bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold px-4 py-2.5 rounded-xl text-xs self-start sm:self-auto flex items-center gap-2 backdrop-blur-md">
                <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 pulse-dot" />
                <span>Đang Bật Chế Độ Dễ Dùng</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unapproved Account Warning Banner */}
      {session?.user?.isApproved === false && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl shadow-sm text-amber-900 flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-amber-950">Tài Khoản Đang Chờ Phê Duyệt Cấp Quyền</h3>
            <p className="text-xs sm:text-sm text-amber-800 mt-1 leading-relaxed">
              Tài khoản Quản trị / Hiệu trưởng của bạn đã được khởi tạo thành công nhưng đang chờ <strong>Bộ GD&ĐT / Sở GD&ĐT / Admin Hệ thống</strong> duyệt và phân quyền quản lý trường. Trong thời gian này, các tính năng chỉnh sửa dữ liệu nâng cao sẽ tạm thời ở chế độ xem an toàn.
            </p>
          </div>
        </div>
      )}

      {/* School Selection Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bộ Lọc Số Liệu Theo Trường (Toàn Quốc)</h2>
              <p className="text-xs text-slate-500">
                Chọn một trường cụ thể để xem chi tiết hoặc bấm "Tất cả các trường" để tổng hợp dữ liệu toàn quốc
              </p>
            </div>
          </div>
          {refreshing && (
            <span className="text-xs text-indigo-600 font-bold animate-pulse flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật dữ liệu...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleSchoolChange(undefined)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              selectedSchoolId === undefined
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>{sch.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isSelected ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"
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

      {/* Multi-School Comparison Breakdown Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>Phân Tích Chi Tiết & So Sánh Số Liệu Từng Trường Toàn Quốc</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Cập nhật thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schools.map((sch) => {
            const isSelected = selectedSchoolId === sch.id;
            return (
              <div
                key={sch.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs relative flex flex-col justify-between ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                    : "border-slate-200/80 hover:border-indigo-300 hover-lift"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold">
                        Trường học
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1">{sch.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đang lọc
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{sch.address}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center mb-3">
                    <div>
                      <p className="text-lg font-extrabold text-indigo-700">{sch.studentCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Học sinh</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-emerald-700">{sch.classCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Lớp học</p>
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-purple-700">{sch.teacherCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Giáo viên</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSchoolChange(isSelected ? undefined : sch.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  {isSelected ? "Bỏ lọc trường này" : "Xem riêng số liệu trường này"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <MetricCard
          icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
          label="Học sinh"
          value={stats?.totalStudents ?? 0}
          subtext={selectedSchoolId ? "Đang lọc theo trường" : "Toàn bộ hệ thống"}
          colorBg="bg-indigo-50"
        />
        <MetricCard
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          label="Giáo viên"
          value={stats?.totalTeachers ?? 0}
          subtext={selectedSchoolId ? "Đang lọc theo trường" : "Toàn bộ hệ thống"}
          colorBg="bg-emerald-50"
        />
        <MetricCard
          icon={<School className="w-5 h-5 text-sky-600" />}
          label="Lớp học"
          value={stats?.totalClasses ?? 0}
          subtext={selectedSchoolId ? "Đang lọc theo trường" : "Toàn bộ hệ thống"}
          colorBg="bg-sky-50"
        />
        <MetricCard
          icon={<Building2 className="w-5 h-5 text-purple-600" />}
          label="Trường học"
          value={stats?.totalSchools ?? 0}
          subtext="Trường liên kết toàn quốc"
          colorBg="bg-purple-50"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          label="Chuyên cần (30 ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          highlight={
            (stats?.attendanceRate ?? 100) < 90
              ? "text-rose-600"
              : "text-emerald-700"
          }
          subtext={selectedSchoolId ? "Trường đã chọn" : "Trung bình các trường"}
          colorBg="bg-amber-50"
        />
      </div>

      {/* Today Summary Banner */}
      {today && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Tình hình hoạt động hôm nay ({selectedSchoolId ? activeSchoolName : "Toàn hệ thống"})
            </p>
            {selectedSchoolId && (
              <span className="px-2 py-0.5 bg-indigo-500/30 border border-indigo-400/30 rounded-full text-indigo-200 text-[11px]">
                Đang lọc trường
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{today.absentToday}</p>
              <p className="text-xs text-slate-400 font-medium">Vắng mặt hôm nay</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{today.lateToday}</p>
              <p className="text-xs text-slate-400 font-medium">Đi muộn hôm nay</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-400">{today.incidentsToday}</p>
              <p className="text-xs text-slate-400 font-medium">Sự kiện phát sinh</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{today.reportsSubmitted}/{today.totalClasses}</p>
              <p className="text-xs text-slate-400 font-medium">Báo cáo lớp đã gửi</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Cảnh Báo Nộp Giáo Án */}
      {lpAlerts && lpAlerts.periodLabel && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">AI Cảnh Báo Tiến Độ Nộp Giáo Án</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kỳ nộp: <span className="font-bold text-slate-800">{lpAlerts.periodLabel}</span> — Hạn cuối:{" "}
                  <span className="font-bold text-rose-600">
                    {lpAlerts.deadline ? new Date(lpAlerts.deadline).toLocaleDateString("vi-VN") : "—"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold">
                🔴 {lpAlerts.alerts.filter((a) => a.status === "NOT_SUBMITTED").length} Chưa nộp
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
                🟡 {lpAlerts.alerts.filter((a) => a.status === "LATE").length} Nộp muộn
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                🟢 {lpAlerts.alerts.filter((a) => a.status === "ON_TIME").length} Đã nộp
              </span>
            </div>
          </div>

          {lpAlerts.alerts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Không có phân công giảng dạy nào</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 uppercase sticky top-0 font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Tổ Chuyên Môn</th>
                    <th className="px-4 py-2.5">Môn Học</th>
                    <th className="px-4 py-2.5">Giáo Viên</th>
                    <th className="px-4 py-2.5 text-center">Trạng Thái Nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lpAlerts.alerts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{item.groupName}</td>
                      <td className="px-4 py-2.5 text-slate-600">{item.subjectName}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{item.teacherName}</td>
                      <td className="px-4 py-2.5 text-center">
                        {item.status === "NOT_SUBMITTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Chưa nộp
                          </span>
                        )}
                        {item.status === "LATE" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Nộp muộn ({item.daysLate} ngày)
                          </span>
                        )}
                        {item.status === "ON_TIME" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Đã nộp đúng hạn
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
      )}

      {/* Interactive Class Distribution Widget */}
      <ClassDistributionWidget classes={classGrades as any} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance by Week */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Chuyên cần theo tuần {selectedSchoolId ? `(${activeSchoolName})` : ""}
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2.5 rounded-xl flex items-start gap-1.5 border border-blue-100">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Biểu đồ này chỉ tỉ lệ chuyên cần (đi học đầy đủ). Cột <strong className="text-emerald-700">Có mặt</strong> màu xanh lá, cột <strong className="text-rose-600 font-bold">Vắng</strong> màu đỏ, cột <strong className="text-amber-600 font-bold">Đi trễ</strong> màu cam.</span>
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
            <EmptyState message="Chưa có dữ liệu điểm danh" />
          )}
        </div>

        {/* Grade by Class */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Điểm trung bình theo lớp {selectedSchoolId ? `(${activeSchoolName})` : ""}
          </h2>
          {isEasyMode && (
            <p className="text-xs text-blue-700 mb-3 bg-blue-50 p-2.5 rounded-xl flex items-start gap-1.5 border border-blue-100">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span><strong>Hướng dẫn:</strong> Điểm trung bình học tập của từng lớp trên thang điểm 10. Lớp nào có cột càng cao thì thành tích học tập trung bình càng tốt.</span>
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-xl ${colorBg} shadow-2xs`}>{icon}</div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
        </div>
        <p className="text-xs text-slate-500 font-bold">{label}</p>
        <p className={`text-2xl font-extrabold tracking-tight mt-1 ${highlight || "text-slate-900"}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
      <p className="text-[11px] text-slate-400 font-semibold mt-2">{subtext}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[260px] text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <Info className="w-8 h-8 text-slate-300 mb-2" />
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
}