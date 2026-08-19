"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEasyMode } from "@/lib/useEasyMode";
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
} from "lucide-react";
import { StatCardSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";
import ClassDistributionWidget from "@/components/dashboard/ClassDistributionWidget";
import {
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;
type WeekData = Awaited<ReturnType<typeof getAttendanceByWeek>>;
type ClassGrade = Awaited<ReturnType<typeof getGradesByClass>>;
type ClassAttendance = Awaited<ReturnType<typeof getClassAttendanceRanking>>;
type IncidentData = Awaited<ReturnType<typeof getRecentIncidents>>;
type TodaySummary = Awaited<ReturnType<typeof getTodaySummary>>;
type LPAlertsData = Awaited<ReturnType<typeof getLessonPlanAlerts>>;

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminDashboardPage() {
  const { isEasyMode } = useEasyMode();
  const [stats, setStats] = useState<Stats | null>(null);
  const [weekData, setWeekData] = useState<WeekData>([]);
  const [classGrades, setClassGrades] = useState<ClassGrade>([]);
  const [classAttendance, setClassAttendance] = useState<ClassAttendance>([]);
  const [incidents, setIncidents] = useState<IncidentData>([]);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [lpAlerts, setLpAlerts] = useState<LPAlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, weekRes, gradesRes, attendanceRes, incidentsRes, todayRes, lpAlertsRes] =
          await Promise.all([
            getDashboardStats(),
            getAttendanceByWeek(),
            getGradesByClass(),
            getClassAttendanceRanking(),
            getRecentIncidents(),
            getTodaySummary(),
            getLessonPlanAlerts(),
          ]);

        setStats(statsData);
        setWeekData(weekRes);
        setClassGrades(gradesRes);
        setClassAttendance(attendanceRes);
        setIncidents(incidentsRes);
        setToday(todayRes);
        setLpAlerts(lpAlertsRes);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Hệ Thống BGH Trường Học
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tổng Quan Bảng Điều Khiển</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 capitalize">{todayStr}</p>
          </div>
          {isEasyMode && (
            <div className="bg-amber-400/20 border border-amber-400/40 text-amber-200 font-bold px-4 py-2.5 rounded-xl text-xs self-start sm:self-auto flex items-center gap-2 backdrop-blur-md">
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 pulse-dot" />
              <span>Đang Bật Chế Độ Dễ Dùng</span>
            </div>
          )}
        </div>
      </div>

      {/* Easy Mode Help Board */}
      {isEasyMode && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-2xl text-amber-800 shrink-0 shadow-xs">
              <Lightbulb className="w-6 h-6 pulse-dot" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-950">Bảng Hướng Dẫn & Thao Tác Nhanh Dành Cho Hiệu Trưởng</h2>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Hãy nhấn các <strong>Nút To dưới đây</strong> để chuyển nhanh đến công việc mong muốn. Mọi phần đều có chú thích Tiếng Việt rõ ràng.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <Link
              href="/admin/classes"
              className="flex items-start gap-3 p-4 bg-white hover:bg-sky-50/80 border border-sky-200 hover:border-sky-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-sky-100 text-sky-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <School className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sky-950 text-sm sm:text-base">1. Xem Lớp Học</h3>
                <p className="text-xs text-sky-700 mt-0.5">Danh sách lớp hiện có, thêm bớt lớp hoặc theo dõi từng lớp học.</p>
              </div>
            </Link>

            <Link
              href="/admin/teachers"
              className="flex items-start gap-3 p-4 bg-white hover:bg-emerald-50/80 border border-emerald-200 hover:border-emerald-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-emerald-950 text-sm sm:text-base">2. Xem Giáo Viên</h3>
                <p className="text-xs text-emerald-700 mt-0.5">Hồ sơ giáo viên, thông tin liên lạc và cập nhật danh sách giáo viên.</p>
              </div>
            </Link>

            <Link
              href="/admin/students"
              className="flex items-start gap-3 p-4 bg-white hover:bg-amber-50/80 border border-amber-200 hover:border-amber-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-amber-950 text-sm sm:text-base">3. Xem Học Sinh</h3>
                <p className="text-xs text-amber-700 mt-0.5">Danh sách toàn bộ học sinh, tra cứu hồ sơ cá nhân hoặc quản lý chuyển lớp.</p>
              </div>
            </Link>

            <Link
              href="/admin/schedule"
              className="flex items-start gap-3 p-4 bg-white hover:bg-purple-50/80 border border-purple-200 hover:border-purple-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-purple-950 text-sm sm:text-base">4. Thời Khóa Biểu</h3>
                <p className="text-xs text-purple-700 mt-0.5">Theo dõi hoặc phân chia lịch học, giờ học cho từng lớp học.</p>
              </div>
            </Link>

            <Link
              href="/admin/multi-school"
              className="flex items-start gap-3 p-4 bg-white hover:bg-rose-50/80 border border-rose-200 hover:border-rose-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-rose-950 text-sm sm:text-base">5. Liên Trường</h3>
                <p className="text-xs text-rose-700 mt-0.5">So sánh tình hình chuyên cần và học lực ở tất cả các cơ sở liên kết.</p>
              </div>
            </Link>

            <Link
              href="/admin/notifications"
              className="flex items-start gap-3 p-4 bg-white hover:bg-indigo-50/80 border border-indigo-200 hover:border-indigo-400 rounded-2xl transition-all shadow-xs hover-lift group"
            >
              <span className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-indigo-950 text-sm sm:text-base">6. Thông Báo Chung</h3>
                <p className="text-xs text-indigo-700 mt-0.5">Tạo và gửi thông tin chỉ đạo chung cho giáo viên, học sinh nhà trường.</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <MetricCard icon={<GraduationCap className="w-5 h-5 text-indigo-600" />} label="Học sinh" value={stats?.totalStudents ?? 0} colorBg="bg-indigo-50" />
        <MetricCard icon={<Users className="w-5 h-5 text-emerald-600" />} label="Giáo viên" value={stats?.totalTeachers ?? 0} colorBg="bg-emerald-50" />
        <MetricCard icon={<School className="w-5 h-5 text-sky-600" />} label="Lớp học" value={stats?.totalClasses ?? 0} colorBg="bg-sky-50" />
        <MetricCard icon={<Building2 className="w-5 h-5 text-purple-600" />} label="Trường học" value={stats?.totalSchools ?? 0} colorBg="bg-purple-50" />
        <MetricCard
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          label="Chuyên cần (30 ngày)"
          value={`${stats?.attendanceRate ?? 0}%`}
          highlight={
            (stats?.attendanceRate ?? 100) < 90
              ? "text-rose-600"
              : "text-emerald-700"
          }
          colorBg="bg-amber-50"
        />
      </div>

      {/* Today Summary Banner */}
      {today && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">Tình hình hoạt động trong ngày hôm nay</p>
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
            Chuyên cần theo tuần
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
            Điểm trung bình theo lớp
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
                <XAxis dataKey="className" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any) => [`${v} điểm`, "ĐTB"]} />
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
