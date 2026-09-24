"use client";

/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: App Router (/vice-principal/dashboard)
 * 2. Public functions affected: VPDashboardPage
 * 3. Data structures: KpiSummary, Stats, CampusInfo
 * 4. Verbatim User Instruction: "theo khuyến nghị của bạn"
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  School,
  CalendarDays,
  MapPin,
  Building2,
  Info,
  Target,
  Award,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  getVPDashboardStats,
  getVPAttendanceByWeek,
  getVPGradesByClass,
  getVPClassAttendanceRanking,
  getVPRecentIncidents,
  getVPTodaySummary,
  getVPCampusInfo,
  getVPKpiSummary,
} from "./actions";
import { submitCampusKpiForReview } from "@/app/admin/kpi/principal-actions";
import ClassDistributionWidget from "@/components/dashboard/ClassDistributionWidget";
import DailyKpiWidget from "@/components/dashboard/DailyKpiWidget";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = Awaited<ReturnType<typeof getVPDashboardStats>>;
type WeekData = Awaited<ReturnType<typeof getVPAttendanceByWeek>>;
type ClassGrade = Awaited<ReturnType<typeof getVPGradesByClass>>;
type ClassAttendance = Awaited<ReturnType<typeof getVPClassAttendanceRanking>>;
type IncidentData = Awaited<ReturnType<typeof getVPRecentIncidents>>;
type TodaySummary = Awaited<ReturnType<typeof getVPTodaySummary>>;
type CampusInfo = Awaited<ReturnType<typeof getVPCampusInfo>>;
type KpiSummary = Awaited<ReturnType<typeof getVPKpiSummary>>;

const COLORS = ["#0d9488", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function VPDashboardPage() {
  const { data: session } = useSession();
  const rawCampusId = session?.user?.campusId;
  const campusId = rawCampusId || "demo-campus";

  const [stats, setStats] = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekData>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance>([]);
  const [incidents, setIncidents] = useState<IncidentData>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [campusInfo, setCampusInfo] = useState<CampusInfo | null>(null);
  const [kpiSummary, setKpiSummary] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingKpi, setIsSubmittingKpi] = useState(false);
  const [kpiFeedback, setKpiFeedback] = useState<string | null>(null);

  const handleSubmitKpiReport = async () => {
    if (!kpiSummary?.campusId) return;
    setIsSubmittingKpi(true);
    setKpiFeedback(null);
    try {
      const res = await submitCampusKpiForReview({
        campusId: kpiSummary.campusId,
        compositeScore: kpiSummary.compositeScore,
      });
      if (res.success) {
        setKpiFeedback(res.message || "Đã trình duyệt báo cáo KPI thành công!");
        // Refresh summary
        const updated = await getVPKpiSummary(campusId);
        setKpiSummary(updated);
      } else {
        setKpiFeedback(res.error || "Lỗi khi trình duyệt báo cáo");
      }
    } catch (err: any) {
      setKpiFeedback(err.message || "Lỗi không xác định khi trình duyệt");
    } finally {
      setIsSubmittingKpi(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [s, w, g, a, i, t, c, k] = await Promise.all([
          getVPDashboardStats(campusId),
          getVPAttendanceByWeek(campusId),
          getVPGradesByClass(campusId),
          getVPClassAttendanceRanking(campusId),
          getVPRecentIncidents(campusId),
          getVPTodaySummary(campusId),
          getVPCampusInfo(campusId),
          getVPKpiSummary(campusId),
        ]);
        setStats(s);
        setWeekData(w);
        setClassGrades(g);
        setClassAttendance(a);
        setIncidents(i);
        setToday(t);
        setCampusInfo(c);
        setKpiSummary(k);
      } catch (err) {
        console.error("Failed to load VP dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [campusId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-700 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">Dang tai du lieu...</p>
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

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Phân hiệu</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{todayStr}</p>
        </div>
        {campusInfo && (
          <div className="bg-teal-50 text-teal-800 font-semibold px-4 py-2 rounded-xl text-sm border border-teal-200 self-start sm:self-auto flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{campusInfo.name}</span>
          </div>
        )}
      </div>

      {/* Unassigned Campus Warning Banner */}
      {!rawCampusId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Chưa được gán phân hiệu</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Tài khoản của bạn chưa được gán vào phân hiệu nào. Vui lòng liên hệ Hiệu trưởng để được phân công. (Hệ thống đang hiển thị dữ liệu Phân hiệu thử nghiệm).
            </p>
          </div>
        </div>
      )}

      {/* Campus Info Card */}
      {campusInfo && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">{campusInfo.name}</p>
              <p className="text-xs text-slate-500">{campusInfo.address}</p>
              {campusInfo.school && (
                <p className="text-xs text-slate-600 mt-0.5">Trực thuộc: <span className="font-medium text-slate-800">{campusInfo.school.name}</span></p>
              )}
            </div>
          </div>
          {campusInfo.schoolPoints && campusInfo.schoolPoints.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Điểm trường trực thuộc ({campusInfo.schoolPoints.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campusInfo.schoolPoints.map((sp) => (
                  <div key={sp.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs">
                    <p className="font-semibold text-slate-800">{sp.name}</p>
                    <p className="text-slate-500 text-[11px]">{sp.address} • {sp.distanceKm} km</p>
                    {sp.managerName && <p className="text-teal-700 text-[11px] mt-0.5">Phụ trách: {sp.managerName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Today Summary Banner */}
      {today && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 mb-2">Tình hình trong ngày</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-slate-900">{today.absentToday}</p>
              <p className="text-xs text-slate-500">Vắng mặt</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-slate-900">{today.lateToday}</p>
              <p className="text-xs text-slate-500">Đi muộn</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-slate-900">{today.incidentsToday}</p>
              <p className="text-xs text-slate-500">Sự vụ ghi nhận</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-slate-900">{today.reportsSubmitted}/{today.totalClasses}</p>
              <p className="text-xs text-slate-500">Báo cáo đã gửi</p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {classAttendance.some((c) => c.attendanceRate < 85) && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="font-semibold text-rose-800 text-xs mb-1.5">Cảnh báo chuyên cần thấp</p>
          <div className="space-y-1">
            {classAttendance
              .filter((c) => c.attendanceRate < 85)
              .map((c, i) => (
                <p key={i} className="text-xs text-rose-700">
                  {c.className} — chuyên cần {c.attendanceRate}% (7 ngày qua)
                </p>
              ))}
          </div>
        </div>
      )}

      {/* KPI Performance Banner for Vice Principal */}
      {kpiSummary && (
        <div className="bg-gradient-to-r from-[#1a237e] to-[#283593] rounded-2xl p-5 text-white shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  📍 {kpiSummary.campusName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                  Xếp hạng #{kpiSummary.rank} / {kpiSummary.totalEntities}
                </span>
                {kpiSummary.periodStatus === "APPROVED" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    Đã Khóa Sổ & Duyệt
                  </span>
                ) : kpiSummary.periodStatus === "SUBMITTED" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/30 text-sky-200 border border-sky-400/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                    Đã Trình Duyệt BGH
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40">
                    Dự Báo Tự Động
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-300" />
                  Chỉ Số Đánh Giá KPI Phân Hiệu: {kpiSummary.compositeScore}/100
                </h3>
                <p className="text-xs text-blue-200">
                  Đánh giá toàn diện 4 trụ cột chiến lược • {kpiSummary.tierLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
              {kpiSummary.pillars.map((pil, idx) => (
                <div key={idx} className="bg-white/10 rounded-xl p-2.5 border border-white/15 text-center">
                  <p className="text-[10px] text-blue-200 truncate">{pil.name.split("&")[0]}</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{pil.score}%</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
              {kpiSummary.periodStatus !== "APPROVED" && (
                <button
                  type="button"
                  onClick={handleSubmitKpiReport}
                  disabled={isSubmittingKpi}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmittingKpi ? "Đang gửi..." : "Trình Duyệt BGH"}</span>
                </button>
              )}
              <Link
                href="/admin/kpi/principal-dashboard"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs"
              >
                <span>Báo cáo chi tiết</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {kpiFeedback && (
            <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-amber-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{kpiFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Daily KPI Sensor Widget */}
      <div className="w-full">
        <DailyKpiWidget campusId={rawCampusId} />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Học sinh" value={stats?.totalStudents ?? 0} />
        <MetricCard label="Giáo viên" value={stats?.totalTeachers ?? 0} />
        <MetricCard label="Lớp học" value={stats?.totalClasses ?? 0} />
        <MetricCard label="Điểm trường" value={stats?.totalSchoolPoints ?? 0} />
        <MetricCard
          label="Chuyên cần (30 ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          highlight={
            (stats?.attendanceRate ?? 100) < 90
              ? "text-rose-600"
              : "text-emerald-700"
          }
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance by Week */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Chuyên cần theo tuần
          </h2>
          {weekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Có mặt" fill="#0d9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="absent" name="Vắng" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="late" name="Đi muộn" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chưa có dữ liệu điểm danh" />
          )}
        </div>

        {/* Grade by Class */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Điểm trung bình theo lớp
          </h2>
          {classGrades.length > 0 && classGrades.some((c) => c.avgScore > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={classGrades.filter((c) => c.avgScore > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="className" fontSize={10} angle={-25} textAnchor="end" height={50} tickLine={false} />
                <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [Number(value).toFixed(2), "Điểm TB"]} />
                <Bar dataKey="avgScore" name="Điểm TB" radius={[3, 3, 0, 0]}>
                  {classGrades
                    .filter((c) => c.avgScore > 0)
                    .map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Chưa có dữ liệu điểm số" />
          )}
        </div>
      </div>

      {/* Row 2: Attendance ranking + Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Ranking */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Xếp hạng chuyên cần (7 ngày)
          </h2>
          {classAttendance.length > 0 ? (
            <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-slate-500 font-semibold">
                    <th className="p-2.5 w-10">#</th>
                    <th className="p-2.5">Lớp</th>
                    <th className="p-2.5 text-center hidden sm:table-cell">Khối</th>
                    <th className="p-2.5 text-center hidden sm:table-cell">Sĩ số</th>
                    <th className="p-2.5 text-right">Chuyên cần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classAttendance.map((cls, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-800">{cls.className}</td>
                      <td className="p-2.5 text-center text-slate-500 hidden sm:table-cell">{cls.gradeLevel}</td>
                      <td className="p-2.5 text-center text-slate-500 hidden sm:table-cell">{cls.studentCount}</td>
                      <td className="p-2.5 text-right font-bold">
                        <span
                          className={
                            cls.attendanceRate >= 95
                              ? "text-emerald-700"
                              : cls.attendanceRate >= 85
                              ? "text-amber-700"
                              : "text-rose-600"
                          }
                        >
                          {cls.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Chưa có dữ liệu lớp học" />
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Sự vụ gần đây
          </h2>
          {incidents.length > 0 ? (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          inc.type === "VIOLATION" ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      />
                      <span className="font-semibold text-slate-800">
                        {inc.studentName}
                      </span>
                      <span className="text-slate-400 text-[11px]">{inc.className}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(inc.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-slate-600 ml-4">{inc.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="Chưa có sự vụ nào ghi nhận" />
          )}
        </div>
      </div>

      {/* Student Distribution */}
      {classGrades.length > 0 && classGrades.some((c) => c.studentCount > 0) && (
        <ClassDistributionWidget classes={classGrades} />
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight || "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[260px] text-gray-400">
      <p className="text-sm">{message}</p>
    </div>
  );
}
